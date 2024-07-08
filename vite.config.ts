import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import checker from "vite-plugin-checker";
import { ViteToml } from 'vite-plugin-toml'

// https://vitejs.dev/config/
export default defineConfig(async () => ({
	plugins: [
		preact(),
		checker({
			// e.g. use TypeScript check
			typescript: true,
		}),
		ViteToml(),
	],

	// Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
	//
	// 1. prevent vite from obscuring rust errors
	clearScreen: false,
	// 2. tauri expects a fixed port, fail if that port is not available
	server: {
		port: 1420,
		strictPort: true,
		watch: {
			// 3. tell vite to ignore watching `src-tauri`
			ignored: ["**/src-tauri/**"],
		},
		cors: true,
		// CSP
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Content-Security-Policy": `
				connect-src * 'self' 'unsafe-eval' 'unsafe-inline' https: http: icon:;
				default-src 'self' 'unsafe-inline' https: http: http://*.localhost https://*.localhost http://localhost https://localhost icon: xb:;
				script-src 'self' 'unsafe-inline';
			`.replace(/\r?\n|\r/g, "")
		}
	},
}));
