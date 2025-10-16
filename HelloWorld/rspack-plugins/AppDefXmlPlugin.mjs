// AppDefXmlPlugin.mjs
// @ts-check
import fs from "node:fs";
import path from "node:path";
import { Parser, Builder } from "xml2js";

const PLUGIN_NAME = "AppDefXmlPlugin";

export class AppDefXmlPlugin {
	/**
	 * @param {{rootDir?: string}} [opts]
	 */
	constructor(opts = {}) {
		this.rootDir = opts.rootDir ?? process.cwd();
	}

	/**
	 * @param {import('@rspack/core').Compiler} compiler
	 */
	apply(compiler) {
		const logger = compiler.getInfrastructureLogger(PLUGIN_NAME);
		const { Compilation, sources } = compiler.rspack; // Rspack/webpack 5 style

		// Avoid packaging on watch rebuilds
		const isWatch = () => compiler.watchMode === true;

		compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
			compilation.hooks.processAssets.tapPromise(
				{
					name: PLUGIN_NAME,
					stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
				},
				async () => {
					if (isWatch()) return;

					const appdefPath = path.join(this.rootDir, "appdef.xml");
					if (!fs.existsSync(appdefPath)) {
						compilation.errors.push(new Error("appdef.xml not found in root."));
						return;
					}

					const pkg = JSON.parse(fs.readFileSync(path.join(this.rootDir, "package.json"), "utf8"));

					const xmlString = fs.readFileSync(appdefPath, "utf8");
					const parser = new Parser();
					const builder = new Builder();
					const xmlData = await parser.parseStringPromise(xmlString);

					xmlData.application.name = [pkg.name ?? ""];
					xmlData.application.version = [pkg.version ?? ""];
					xmlData.application.description = [pkg.description ?? ""];
					xmlData.application.publisher = [pkg.author ?? ""];
					xmlData.application.copyright = [`(c) ${pkg.author ?? ""} ${new Date().getFullYear()}`];

					const updatedXml = builder.buildObject(xmlData);
					compilation.emitAsset("appdef.xml", new sources.RawSource(updatedXml));
					logger.info("Definition file appdef.xml was copied.");
				},
			);
		});
	}
}

export default AppDefXmlPlugin;
