import { invoke } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";

class TellyfinDB {
	db: Database | null;

	constructor() {
		this.db = null;
	}

	async load() {
		// this.db = await Database.load("sqlite:telly.db");
	}

	async processQuery(table: string, cond?: string | null, scond?: string | null, sort?: string | null, ssort?: string | null, genre?: string | null) {
		return invoke<Array<Record<string, any>>>("unsafe_query", {
			q: `SELECT * FROM ${table} ${cond ? `WHERE ${cond}` : ""}`,
			params: [],
		});
	}
}

const DB = new TellyfinDB();

await DB.load();

export { DB };