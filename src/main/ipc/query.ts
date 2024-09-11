import { ipcMain } from "electron";
import { mainWindow } from "../important-values";
import { db } from "../database";

export function setupQueryHandlers() {
	ipcMain.handle("unsafe_query", (e, { q, params }: { q: string; params: Array<any>; }) => {
		if (e.sender != mainWindow.value) return [];
		return db.rows(q, params);
	});
}