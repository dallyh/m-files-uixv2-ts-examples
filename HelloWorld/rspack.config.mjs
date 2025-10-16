// @ts-check
import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";
import AppDefXmlPlugin from "./rspack-plugins/AppDefXmlPlugin.mjs";
import MfappxPackagePlugin from "./rspack-plugins/MfappxPackagePlugin.mjs";
import path from "path";

const isProd = process.env.NODE_ENV === "production";
console.log(`Environment: ${isProd ? "production" : "development"}`);
const __dirname = process.cwd();

// Shared bits
const buildDir = "build";
const distDir = "dist";
const installScript = "install-application.ps1";

const rules = [{ test: /\.[tj]sx?$/, loader: "builtin:swc-loader", exclude: /node_modules/ }];
const resolve = { extensions: [".tsx", ".ts", ".js"] };

const iifeLegacy = defineConfig({
	name: "main",
	mode: isProd ? "production" : "development",
	target: "web",
	entry: {
		main: {
			import: "./src/main.ts",
			filename: "src/main.js",
		},
	},
	// NO output.module here -> classic script wrapped in an IIFE
	output: {
		path: path.resolve(__dirname, buildDir),
		filename: "src/[name].js",
		chunkFilename: "src/chunks/[name].[contenthash].js",
		assetModuleFilename: "src/assets/[name].[contenthash][ext][query]",
		clean: true,
	},
	module: { rules },
	resolve,
	optimization: {
		splitChunks: false,
		runtimeChunk: false,
	},
	devtool: isProd ? false : "source-map",
	plugins: [
		new AppDefXmlPlugin({
			rootDir: __dirname,
		}),
		new rspack.CopyRspackPlugin({
			patterns: [
				// Copy public/** -> build/public (ignore if folder missing)
				{ from: "public", to: "public", noErrorOnMissing: true },
				// Copy src/** -> build/src/**
				{
					from: "src",
					to: "src",
					globOptions: {
						ignore: ["**/*.ts", "**/*.tsx", "**/*.map"],
					},
					noErrorOnMissing: true,
				},
			],
		}),
		new MfappxPackagePlugin({
			buildDir: buildDir,
			distDir: distDir,
			installScript: installScript,
		}),
	],
});

export default [iifeLegacy];
