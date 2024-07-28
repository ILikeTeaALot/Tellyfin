import { ipcMain } from "electron";
import { mainWindowId } from "../important-values";
import { db } from "../database";

export function setupQueryHandlers() {
	ipcMain.handle("unsafe_query", (e, { q, params }: { q: string; params: Array<any>; }) => {
		if (e.frameId != mainWindowId.inner) return [];
		return db.rows(q, params);
	});
}