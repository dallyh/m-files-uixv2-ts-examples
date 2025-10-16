# M-Files UIXv2 Hello World Application (TypeScript)

This is a minimal M-Files User Interface Extension (UIXv2) application created with the M-Files UIXv2 [HelloWorld example](https://developer.m-files.com/Frameworks/User-Interface-Extensibility-Framework/Reference/Samples/HelloWorld/), using TypeScript.

## Project Structure

```
my-uixv2-app/
├── src/                    # Application source code
│   └── main.ts             # Main ShellUI module (Hello World logic)
├── public/                 # Static resources
│   └── __TemplateIcon.ico  # Application icon
├── build/                  # Build output directory
│   ├── appdef.xml          # Copied application definition
│   ├── src/                # Compiled TypeScript files
│   └── public/             # Copied resources
├── dist/                   # Distribution packages
│   ├── appName-version.mfappx    # Packaged application
│   └── install-application.ps1   # PowerShell installation script
├── rspack-plugins/               # Plugins for RSPack
│   ├── AppDefXmlPlugin.mjs       # Updates and copies the appdef.xml file to build 
│   └── MfappxPackagePlugin.mjs   # Creates a package for M-Files in the dist directory
├── appdef.xml              # Application definition file
├── rspack.config.mjs       # RSPack configuration file
├── bundle.js               # Bundle script for creating installation package
├── install-application.ps1 # Script to install package to M-Files vault (copied to dist folder)
├── install-application.example.json # Example deploy configuration file
├── tsconfig.json           # TypeScript configuration
├── package.json            # Project metadata and dependencies
└── README.md               # This file
```

## Commands

### Build the Project and Package

To build the project and package the file for M-Files:

```bash
npm run build
```

This will:

1. Compile TypeScript files to JavaScript
2. Create a `build` directory with all necessary files for the application
3. Create a .mfappx file in the `dist` directory, which can be installed in M-Files.

To build the files for production:

```bash
npm run build:prod
```

#### Watch mode

Additionally you can enable watch mode with:

```bash
npm run dev
```

## Installation

There are two ways to install the application in M-Files:

### Option 1: Using the PowerShell Script (Recommended)

An installation script is included that automatically detects your M-Files installation and deploys the app to a vault:

```powershell
# Navigate to the dist directory
cd dist

# Install to default "Personal Vault"
# If a configuration file "install-application.user.json" is present, then install with the configuration options.
.\install-application.ps1

# Specify a different vault name
.\install-application.ps1 -appFilePath "your-app-name-1.0.0.mfappx" -vaultName "My Vault"

# Or specify a path to the .mfappx file
.\install-application.ps1 -appFilePath "C:\path\to\your-app-name-1.0.0.mfappx"
```

Or simply run the included npm script command:

```bash
npm run deploy
```

The script:

- Automatically detects your M-Files installation
- Connects to the specified vault
- Installs the application
- Restarts the vault to apply changes

#### Settings in a JSON file

Example settings (JSON) for the install script are located here: [install-application.example.json](./install-application.example.json).

**Before using this file, make sure to rename it to `install-application.user.json`.** This file should not be commited to the repository as it can contain passwords.

Authorization type: [MFAuthType](https://developer.m-files.com/APIs/COM-API/Reference/MFilesAPI~MFAuthType.html)

- 0 Unspecified authentication method.
- 1 Windows authentication with current user credentials.
- 2 Windows authentication, user needs to specify the credentials.
- 3 M-Files authentication, user needs to specify the credentials.

### Option 2: Manual Installation

To install the application manually through M-Files Admin:

1. In M-Files Admin, navigate to the vault where you want to install the application
2. Go to Applications > Install > From file
3. Select the .mfappx file from your `dist` directory
4. Follow the installation prompts

## Development

This Hello World project demonstrates the minimal setup for an M-Files UIXv2 application using TypeScript:

- `appdef.xml`: Application metadata and configuration
- `src/main.ts`: Minimal ShellUI logic that shows a message when the shell frame is available
- `public/`: Static resources like icons
- `tsconfig.json`: TypeScript compiler configuration
- `rspack.config.mjs`: Bunlder (RSPack) configuration

After making changes, run the build commands and create a new installation package.

## Documentation

For more information on M-Files UIXv2 development, refer to the official documentation:

- [M-Files Developer Portal](https://developer.m-files.com/)
- [User Interface Extensibility Framework](https://developer.m-files.com/Frameworks/User-Interface-Extensibility-Framework/)
