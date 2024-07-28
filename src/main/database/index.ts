import Database from "better-sqlite3";
import path from "node:path";
import { app } from "electron";
import { Err, Ok, type Result } from "~/shared/types/result";

class TellyfinDatabase {
	#database: Database.Database;
	constructor() {
		const dbPath = path.join(app.getPath("userData"), "/data.db");
		console.log(dbPath);
		this.#database = new Database(dbPath);
	}

	row<T>(q: string, params: Array<any>): Result<T> {
		try {
			const stmt = this.#database.prepare<unknown[], T>(q);
			const row = stmt.get(params);
			if (!row) throw new Error("No rows for query");
			return Ok(row);
		} catch (e) {
			console.error(e);
			return Err(e);
		}
	}

	rows<T>(q: string, params: Array<unknown>): Result<T[]> {
		try {
			const stmt = this.#database.prepare<unknown[], T>(q);
			const rows = stmt.all(params);
			return Ok(rows);
		} catch (e) {
			console.error(e);
			return Err(e);
		}
	}
}

export const db = new TellyfinDatabase();