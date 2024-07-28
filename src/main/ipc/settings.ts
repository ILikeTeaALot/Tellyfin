import { ipcMain } from "electron";

export function setupSettingsHandlers() {
	ipcMain.handle("save_settings", () => {

	});

	ipcMain.handle("read_settings", () => {

	});
}