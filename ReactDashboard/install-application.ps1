<#
Install M-Files UIXv2 Application Script
========================================

This script installs a UIX application package (.mfappx) to one or more M-Files vaults.

USAGE:
    .\install-application.ps1 [options]

DESCRIPTION:
    - Installs a UIX application package to the specified M-Files vault(s).
    - Supports both simple (single vault) and advanced (multi-vault, group-based) deployment scenarios.
    - Connection details can be provided via parameters or an install-application.user.json file.

PARAMETER PRECEDENCE:
    1. If -vaultName is provided, the script will deploy ONLY to that vault, using connection details from the script parameters.
    2. If install-application.user.json exists and -vaultName is NOT provided, the script will deploy to all vaults defined in the JSON file.
    3. If neither is provided, the script will deploy to the default vault using the script parameters.

DEFAULT CONNECTION DETAILS (edit as needed for your environment):
    $authType           = [MFilesAPI.MFAuthType]::MFAuthTypeLoggedOnWindowsUser
    $userName           = ""
    $password           = ""
    $domain             = ""
    $spn                = ""
    $protocolSequence   = "ncacn_ip_tcp"
    $networkAddress     = "localhost"
    $endpoint           = 2266
    $encryptedConnection= $false
    $localComputerName  = ""

PARAMETERS:
    -vaultName <string>         Name of the target vault (overrides JSON if provided)
    -installGroups <array>      Array of installation groups to target (defaults to "default")
    -appFilePath <string>       Path to the .mfappx file (defaults to latest build)
    -help                      Show help message

EXAMPLES:
    .\install-application.ps1 -vaultName "My Vault"
    .\install-application.ps1 -installGroups @("dev", "test")
    .\install-application.ps1

#>

param(
    [Parameter(Mandatory = $False)]
    [string[]] $installGroups = @(),
    
    [Parameter(Mandatory = $False)]
    [string] $appFilePath = "./dist/m-files-uixv2-react-dashboard-1.0.0.mfappx",
    
    [Parameter(Mandatory = $False)]
    [string] $vaultName,

    [Parameter(Mandatory = $False)]
    [switch] $forceRelogin,

    [Parameter(Mandatory = $False)]
    [switch] $help
)

# Show help information if requested
if ($help) {
    Write-Host @"
Install M-Files UIXv2 Application
===============================

Usage: 
    .\install-application.ps1 [options]

Description:
    Installs a UIX application package (.mfappx) to specified M-Files vault(s).

Options:
    -installGroups <array>  Array of installation groups to target (defaults to "default")
    -appFilePath <string>   Path to the .mfappx file (defaults to latest build)
    -vaultName <string>     Name of the target vault (defaults to "Personal Vault")
    -forceRelogin          Force relogin after installation (only needed for M-Files Desktop)
    -help                  Show this help message

Examples:
    # Basic installation
    .\install-application.ps1

    # Install and force reload in M-Files Desktop by logging out/in
    .\install-application.ps1 -forceRelogin

    # Install to specific vault
    .\install-application.ps1 -vaultName "My Vault"

    # Install to multiple vaults using groups
    .\install-application.ps1 -installGroups @("dev", "test")

Note:
    The -forceRelogin parameter is only needed when developing/testing with M-Files Desktop.
    It forces the desktop client to reload the application by logging out and back in.
    This will close all open documents and cards in the desktop client.
    Web clients do not require this as they handle application updates differently.
"@
    exit
}

# Get the latest M-Files version from registry
$latestMFilesVersion = $null
$mfilesInstallDir = $null

# Append the current path so we have the full location (required in some situations).
$currentDir = Get-Location

# Check if appFilePath is provided
if ([string]::IsNullOrEmpty($appFilePath)) {
    Write-Error "No application package specified. Please provide the path to the .mfappx file using -appFilePath parameter."
    Write-Error "Run 'npm run bundle' first to create the application package in the dist directory."
    exit 1
}

$appFilePath = Join-Path $currentDir $appFilePath

# Check if the application package exists
if (-not (Test-Path $appFilePath)) {
    Write-Error "Application package not found at: $appFilePath"
    Write-Error "Run 'npm run bundle' first to create the application package."
    exit 1
}

try {
    # Get all M-Files versions from registry and find the latest one
    $mfilesVersions = @(
        Get-ChildItem 'HKLM:\SOFTWARE\Motive\M-Files' -ErrorAction SilentlyContinue |
        Where-Object { $_.PSChildName -match '^\d+\.\d+\.\d+\.\d+$' } |
        Sort-Object { [version]$_.PSChildName } -Descending
    )
    
    if ($mfilesVersions -and $mfilesVersions.Count -gt 0) {
        $latestMFilesVersion = $mfilesVersions[0].PSChildName
        
        # Get install directory directly from registry
        if ($mfilesVersions[0].InstallDir) {
            $mfilesInstallDir = $mfilesVersions[0].InstallDir
            Write-Host "Found M-Files version $latestMFilesVersion installed at: $mfilesInstallDir"
        }
        else {
            Write-Warning "InstallDir not found in registry for version $latestMFilesVersion."
            $mfilesInstallDir = "C:\Program Files\M-Files\$latestMFilesVersion"
        }
    }
    else {
        throw "No M-Files installation found in the registry. Please install M-Files before running this script."
    }
}
catch {
    throw "Error finding M-Files version: $($_.Exception.Message)"
}

# Load M-Files API with the install directory
try {
    $mfilesApiPath = Join-Path -Path $mfilesInstallDir -ChildPath "Common\Interop.MFilesAPI.dll"
    
    if (Test-Path $mfilesApiPath) {
        Write-Host "Loading M-Files API from: $mfilesApiPath"
        Add-Type -Path $mfilesApiPath
    }
    else {
        throw "Could not find M-Files API at: $mfilesApiPath. Please ensure M-Files is properly installed."
    }
}
catch {
    throw "Error loading M-Files API: $($_.Exception.Message)"
}

# ------------------------------------------------------------------------------------------------
# Default connection details.
# ------------------------------------------------------------------------------------------------
$authType = [MFilesAPI.MFAuthType]::MFAuthTypeLoggedOnWindowsUser
$userName = ""
$password = ""
$domain = ""
$spn = ""
$protocolSequence = "ncacn_ip_tcp"
$networkAddress = "localhost"
$endpoint = 2266
$encryptedConnection = $false
$localComputerName = ""


# If we are using install-application.user.json then parse the vault connections.
$doesInstallApplicationUserFileExist = $false
$vaultConnections = @()
try {
    Write-Output "  Parsing install-application.user.json (if available)..."
    $jsonInput = Get-Content -Path install-application.user.json | ConvertFrom-Json
    if ($installGroups.Count -eq 0) {
        Write-Output "    No install groups given, proceeding with default."
        $installGroups += "default"
    }
    ForEach ($jsonConnection in $jsonInput.VaultConnections) {
        $doesInstallApplicationUserFileExist = $true
    
        ForEach ($ig in $installGroups) {
            # if no groups, include to default
            if (-not $jsonConnection.installGroups) {
                if ($installGroups -contains "default") {
                    $vaultConnections += $jsonConnection
                    Write-Output "    Will deploy to $($jsonConnection.vaultName) on $($jsonConnection.networkAddress), as the declaration has no groups defined (included in default)."
                }
                break; # The connection has no groups, no further looping is needed
            }
            if ($jsonConnection.installGroups -contains $ig) {
                $vaultConnections += $jsonConnection
                Write-Output "    Will deploy to $($jsonConnection.vaultName) on $($jsonConnection.networkAddress), as the declaration has group $($ig) defined."
                break;
            }
        }
    }
}
catch [System.IO.FileNotFoundException], [System.Management.Automation.ItemNotFoundException] {
    # This is fine; the user is probably not using this approach for deployment.
    Write-Output "    install-application.user.json file not found; using data from install-application.ps1."
}
catch {
    # Write the exception out and throw so that we stop execution.
    Write-Error -Exception $error[0].Exception
    throw;
}
finally {
    $error.clear();
}

# If we are not using an external JSON file, or if -vaultName is provided,
# then use the connection/authentication information defined at the top of the file.
if (-not $doesInstallApplicationUserFileExist -or $PSBoundParameters.ContainsKey('vaultName')) {
    $vaultConnections = @(
        [PSCustomObject]@{
            vaultName           = $vaultName
            authType            = $authType
            userName            = $userName
            password            = $password
            domain              = $domain
            spn                 = $spn
            protocolSequence    = $protocolSequence
            networkAddress      = $networkAddress
            endpoint            = $endpoint
            encryptedConnection = $encryptedConnection
            localComputerName   = $localComputerName
        }
    )
}

# If neither -vaultName nor install-application.user.json is provided, show error/help and exit
if (-not $doesInstallApplicationUserFileExist -and -not $PSBoundParameters.ContainsKey('vaultName')) {
    Write-Host ""
    Write-Host "ERROR: No vault specified."
    Write-Host "You must either:"
    Write-Host "  - Provide the -vaultName parameter (e.g. -vaultName \"My Vault\")"
    Write-Host "  - Or create an install-application.user.json file with vault connection details."
    Write-Host ""
    Write-Host "For help, run: .\install-application.ps1 -help"
    exit 1
}

ForEach ($vc in $vaultConnections) {
    # First connect in server mode for installation
    Write-Host "  Connecting to '$($vc.vaultName)' on $($vc.networkAddress)..."
    $server = new-object MFilesAPI.MFilesServerApplicationClass
    $tzi = new-object MFilesAPI.TimeZoneInformationClass
    $tzi.LoadWithCurrentTimeZone()
    $null = $server.ConnectAdministrativeEx($tzi, $vc.authType, $vc.userName, $vc.password, $vc.domain, $vc.spn, $vc.protocolSequence, $vc.networkAddress, $vc.endpoint, $vc.encryptedConnection, $vc.localComputerName)
    
    # Get the target vault
    $vaultOnServer = $server.GetOnlineVaults().GetVaultByName($vc.vaultName)
    $serverVault = $vaultOnServer.LogIn()
    
    # Install application
    Write-Host "    Installing application..."
    try {
        $serverVault.CustomApplicationManagementOperations.InstallCustomApplication($appFilePath)
        
        # Now switch to client mode for logout/login cycle if refresh is requested
        if ($forceRelogin) {
            Write-Host "    Switching to client mode to force application reload..."
            $client = new-object MFilesAPI.MFilesClientApplicationClass
            $vaultConn = $client.GetVaultConnection($vc.vaultName)
            
            if ($null -eq $vaultConn) {
                Write-Error "Could not find vault connection for '$($vc.vaultName)'. Make sure the vault is configured in M-Files Desktop."
                continue
            }
            
            # Check if already logged in
            if (-not $vaultConn.IsLoggedIn) {
                $vaultConn.LogInAsUser([MFilesAPI.MFAuthType]::MFAuthTypeLoggedOnWindowsUser, "", "")
            }
            
            $vault = $vaultConn.BindToVault(0, $True, $True)
            if ($null -ne $vault) {
                Write-Host "    Logging out and back in to reload application..."
                $vault.LogOutWithDialogs(0)
                Start-Sleep -Milliseconds 1000
                $vaultConn.LogInAsUser([MFilesAPI.MFAuthType]::MFAuthTypeLoggedOnWindowsUser, "", "")
                $vault = $vaultConn.BindToVault(0, $True, $True)
            }
        }
        Write-Host "    Application installed."
    }
    catch {
        # Already exists
        if ($_.Exception -Match "0x80040031") {
            Write-Host "    This application version already exists on the vault, installation skipped"
        }
        else {
            if ($_.Exception -Match "0x8004091E") {
                Write-Host "    A newer version of this application is already installed on the vault, installation skipped"
            }
            else {
                throw
            }
        }
    }
}