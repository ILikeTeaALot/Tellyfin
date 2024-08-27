import { app, ipcMain } from "electron";

export function setupSystemHandlers() {
	ipcMain.handle("exit-tellyfin", () => {
		app.quit();
	});

	ipcMain.handle("restart-tellyfin", () => {
		app.relaunch();
	});
}