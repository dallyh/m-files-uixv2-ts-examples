// @ts-check
import fs from "node:fs";
import path from "node:path";
import archiver from "archiver";

const PLUGIN_NAME = "MfappxPackagePlugin";

export default class MfappxPackagePlugin {
	/**
	 * @param {{buildDir?: string, distDir?: string, installScript?: string, enabled?: boolean}} [opts]
	 */
	constructor(opts = {}) {
		this.buildDir = opts.buildDir ?? "build";
		this.distDir = opts.distDir ?? "dist";
		this.installScript = opts.installScript ?? "install-application.ps1";
		this.enabled = opts.enabled ?? true;
	}

	/**
	 * @param {import('@rspack/core').Compiler} compiler
	 */
	apply(compiler) {
		const logger = compiler.getInfrastructureLogger(PLUGIN_NAME);

		// Avoid packaging on watch rebuilds
		const isWatch = () => compiler.watchMode === true;

		compiler.hooks.afterEmit.tapPromise(PLUGIN_NAME, async (compilation) => {
			try {
				if (!this.enabled) return;
				if (isWatch()) return;

				const root = compiler.context; // project root
				const buildDir = path.resolve(root, this.buildDir);
				const distDir = path.resolve(root, this.distDir);

				if (!fs.existsSync(buildDir)) {
					compilation.errors.push(new Error(`[Mfappx] Build dir not found: ${buildDir}`));
					return;
				}

				const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
				const outFile = path.join(distDir, `${pkg.name}-${pkg.version}.mfappx`);

				if (fs.existsSync(distDir)) {
					fs.rmSync(distDir, { recursive: true, force: true });
				}
				fs.mkdirSync(distDir);

				// Zip buildDir -> outFile
				logger.info(`Creating package: ${outFile}`);

				await new Promise(
					/**
					 * @param {(value?: any) => void} resolve
					 * @param {(reason?: any) => void} reject
					 */
					(resolve, reject) => {
						const output = fs.createWriteStream(outFile);
						const archive = archiver("zip", { zlib: { level: 9 } });

						output.on("close", resolve);
						archive.on("warning", (err) => (err.code === "ENOENT" ? logger.warn(err) : reject(err)));
						archive.on("error", reject);

						archive.pipe(output);
						archive.directory(buildDir, false);
						archive.finalize().catch(reject);
					},
				);

				// Update installer path if present
				const psPath = path.join(root, this.installScript);
				if (fs.existsSync(psPath)) {
					const script = fs.readFileSync(psPath, "utf8");
					// Update script in root
					let updated = script.replace(/\[string\]\s*\$appFilePath\s*=\s*"[^"]*"/, `[string] $appFilePath = "./dist/${pkg.name}-${pkg.version}.mfappx"`);
					fs.writeFileSync(psPath, updated, "utf8");

					// Save to dist dir
					updated = script.replace(/\[string\]\s*\$appFilePath\s*=\s*"[^"]*"/, `[string] $appFilePath = "./${pkg.name}-${pkg.version}.mfappx"`);
					const output = path.join(distDir, this.installScript);
					fs.writeFileSync(output, updated, "utf8");
				}

				const { size } = fs.statSync(outFile);
				logger.info(`Package created: ${outFile} (${size} bytes)`);
			} catch (err) {
				compilation.errors.push(err instanceof Error ? err : new Error(String(err)));
			}
		});
	}
}
