import { defineConfig } from "vite";
import content from '@originjs/vite-plugin-content'
import preact from "@preact/preset-vite";
import checker from "vite-plugin-checker";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
	plugins: [
		preact(),
		checker({
			// e.g. use TypeScript check
			typescript: true,
		}),
		content(),
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
	},
}));
