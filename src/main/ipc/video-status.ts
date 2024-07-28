import { ipcMain } from "electron";
import { status } from "mpv";

export function setupVideoStatusHandlers() {
	ipcMain.handle("mpv_status", (_) => {
		return status();
	});
}