import { ipcMain } from "electron";
import { playFile, seek, transportCommand } from "mpv";

export function setupVideoControlHandlers() {
	ipcMain.handle("transport_command", (_, { command }: { command: string; }) => {
		transportCommand(command);
	});

	ipcMain.handle("seek", (_, { mode, seconds }: { mode: "relative" | "absolute"; seconds: number; }) => {
		seek(mode, seconds);
	});

	ipcMain.handle("play_file", (_, { file }: { file: string; }) => {
		playFile(file);
	});
}