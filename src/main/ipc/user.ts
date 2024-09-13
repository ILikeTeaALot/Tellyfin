import { ipcMain } from "electron";
import { db } from "../database";

export function setupUserHandlers() {
	ipcMain.handle("get-users", () => {
		const rows = db.rows(`SELECT * FROM User`, []);
		if (rows.ok) {
			return rows.value;
		} else {
			return [];
		}
	});
}