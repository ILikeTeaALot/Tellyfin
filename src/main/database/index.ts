import Database, { type RunResult, type Statement } from "better-sqlite3";
import path from "node:path";
import { app } from "electron";
import { Err, Ok, type Result } from "~/shared/types/result";

class TellyfinDatabase {
	#database: Database.Database;
	#cache: Map<string, Statement>;
	#path: string;
	constructor() {
		const dbPath = path.join(app.getPath("userData"), "/data.db");
		console.log(dbPath);
		this.#database = new Database(dbPath);
		this.#cache = new Map();
		this.#path = dbPath;
	}
	
	get path() {
		return this.#path;
	}

	transaction(handler: Parameters<typeof Database["prototype"]["transaction"]>[0]) {
		this.#database.transaction(handler);
	}

	exec(s: string, params: any): Result<RunResult> {
		try {
			const stmt = this.#database.prepare(s);
			const res = stmt.run(params);
			return Ok(res);
		} catch (e) {
			console.error(e);
			return Err(e);
		}
	}
	
	exec_raw(s: string, params: any): Result<true> {
		try {
			const res = this.#database.exec(s);
			return Ok(true);
		} catch (e) {
			console.error(e);
			return Err(e);
		}
	}

	row<T>(q: string, params: Array<any>): Result<T> {
		try {
			const stmt = this.#cache.get(q) as Statement<unknown[], T> ?? this.#cache.set(q, this.#database.prepare<unknown[], T>(q)).get(q);
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