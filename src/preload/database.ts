import { contextBridge, ipcRenderer } from "electron";
import type { Result } from "~/shared/types/result";

/* class TellyfinDB {
	// db: null;

	// constructor() {
	// 	this.db = null;
	// }

	async processQuery(table: string, cond?: string | null, scond?: string | null, sort?: string | null, ssort?: string | null, genre?: string | null) {
		return ipcRenderer.invoke("unsafe_query", {
			q: `SELECT * FROM ${table}${cond ? ` WHERE ${cond}` : ""}${sort ? ` ORDER BY ${sort}` : ""}`,
			params: [],
		}) as Promise<Result<Array<Record<string, any>>>>;
	}
} */

// I don't massively like that I can't make this a class...
const DB = {
	async processQuery<T extends Record<string, any>>(table: string, cond?: string | null, scond?: string | null, sort?: string | null, ssort?: string | null, genre?: string | null, params?: Array<any> | Record<string, any>) {
		return ipcRenderer.invoke("unsafe_query", {
			q: `SELECT * FROM ${table}${cond ? ` WHERE ${cond}` : ""}${sort ? ` ORDER BY ${sort}` : ""}`,
			params: params ?? [],
		}) as Promise<Result<Array<T>>>;
	}
};

contextBridge.exposeInMainWorld("DB", DB);

declare global {
	export interface Window {
		DB: typeof DB;
	}
}