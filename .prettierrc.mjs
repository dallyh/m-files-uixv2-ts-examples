/** @type {import("prettier").Config} */
export default {
	printWidth: 210,
	tabWidth: 4,
	useTabs: true,
	singleQuote: false,
	trailingComma: "all",
	endOfLine: "auto",
	semi: true,
	overrides: [
		{
			files: ["*.json", "*.jsonc", "*.md", "*.toml", "*.yml", "*.yaml"],
			options: {
				useTabs: false,
			},
		},
		{
			files: ["*.json", "*.jsonc"],
			options: {
				trailingComma: "none",
			},
		},
	],
};
