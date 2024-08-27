import { screen } from "electron";
import { baseWindow, themeBackgroundWindow, uiWindow } from "./important-values";

export function setupScreenListeners() {
	// TODO: Adapt this to other resolutions.
	// TODO: Suppport other resolutions in the main UI (including 4:3).
	screen.on("display-metrics-changed", (event, display, changed) => {
		baseWindow.inner?.setBounds({
			width: 1920,
			height: 1920,
			x: 0,
			y: 0,
		});
		themeBackgroundWindow.inner?.setBounds({
			width: 1920,
			height: 1080,
			x: 0,
			y: 0,
		});
		uiWindow.inner?.setBounds({
			width: 1920,
			height: 1080,
			x: 0,
			y: 0,
		});
	});
}