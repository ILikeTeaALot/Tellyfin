import { ipcMain } from "electron";
import { playFile, seek, transportCommand } from "mpv";
import type { MediaInfo } from "~/shared/types/video";
import { current_playing_id } from "../globals";

export function setupVideoControlHandlers() {
	ipcMain.handle("transport_command", (_, { command }: { command: string; }) => {
		transportCommand(command);
	});

	ipcMain.handle("seek", (_, { mode, seconds }: { mode: "relative" | "absolute"; seconds: number; }) => {
		seek(mode, seconds);
	});

	ipcMain.handle("play_file", (_, { file, infoId, start }: { file: string; infoId: MediaInfo; start: number; }) => {
		playFile(file, start);
		current_playing_id.value = infoId ?? { type: "None" };
	});

	ipcMain.handle("clear_current_id", () => {
		current_playing_id.value = { type: "None" };
	});
}