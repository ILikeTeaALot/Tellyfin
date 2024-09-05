/* import type { Result } from "~/shared/types/result";

class TellyfinDB {
	db: null;

	constructor() {
		this.db = null;
	}

	async processQuery(table: string, cond?: string | null, scond?: string | null, sort?: string | null, ssort?: string | null, genre?: string | null) {
		return window.electronAPI.invoke<Result<Array<Record<string, any>>>>("unsafe_query", {
			q: `SELECT * FROM ${table} ${cond ? `WHERE ${cond}` : ""}`,
			params: [],
		});
	}
}

const DB = new TellyfinDB();

export { DB }; */