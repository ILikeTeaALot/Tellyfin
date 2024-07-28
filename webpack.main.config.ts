import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';
import { resolve } from "path";

export const mainConfig: Configuration = {
	/**
	 * This is the main entry point for your application, it's the first file
	 * that runs in the main process.
	 */
	entry: './src/main/index.ts',
	// Put your normal webpack config below here
	module: {
		rules,
	},
	plugins,
	externals: ["@tellyfin/theme", "mpv", "node-bass", "toml"],
	resolve: {
		alias: {
			"~": resolve(__dirname, "src/"),
		},
		extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
	},
};
