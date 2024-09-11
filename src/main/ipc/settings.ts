import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { getSetting, getSettings, saveSettings, setSetting } from "../settings";

export function setupSettingsHandlers() {
	ipcMain.handle("save_settings", saveSettings);

	ipcMain.handle("read_settings", getSettings);

	ipcMain.handle("get_setting", getSetting);

	ipcMain.handle("set_setting", setSetting);
}