import { ipcMain } from "electron";
import { status } from "mpv";
import { current_playing_id } from "../globals";

export function setupVideoStatusHandlers() {
	ipcMain.handle("mpv_status", (_) => {
		return { ...status(), mediaType: current_playing_id.value };
	});
}