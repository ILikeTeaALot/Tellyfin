import { ipcMain } from "electron";
import { mainWindowId } from "../important-values";
import { db } from "../database";

export function setupQueryHandlers() {
	ipcMain.handle("unsafe_query", (e, { q, params }: { q: string; params: Array<any>; }) => {
		if (e.sender != mainWindowId.inner) return [];
		return db.rows(q, params);
	});
}