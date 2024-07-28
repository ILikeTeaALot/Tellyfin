/// @ts-nocheck
import PreactRefreshPlugin from '@prefresh/webpack';
import { resolve } from "path";

import type { Configuration } from "webpack";

import { rules } from "./webpack.rules";
import { plugins } from "./webpack.plugins";

rules.push({
	test: /\.css$/,
	use: [{ loader: "style-loader" }, { loader: "css-loader" }],
});

export const rendererConfig: Configuration = {
	module: {
		rules,
	},
	plugins: [
		...plugins,
		// new PreactRefreshPlugin(),
	],
	// devServer: {
	// 	headers: {
	// 		"Content-Security-Policy": `
	// 			connect-src * 'self' 'unsafe-eval' 'unsafe-inline' https: http: icon:;
	// 		`.replace(/\r?\n|\r/g, "")
	// 	},
	// },
	resolve: {
		alias: {
			react: "preact/compat",
			"react-dom/test-utils": "preact/test-utils",
			"react-dom": "preact/compat", // Must be below test-utils
			"react/jsx-runtime": "preact/jsx-runtime",
			"~": resolve(__dirname, "src/"),
		},
		extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
	},
};
