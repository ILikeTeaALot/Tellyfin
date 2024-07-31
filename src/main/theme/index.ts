import * as path from "node:path";
import Database from "better-sqlite3";
import { app } from "electron";
import { EventEmitter } from "node:events";
import { None, Some, type Option } from "../../shared/types/option";
import { Err, Ok, type Result } from "../../shared/types/result";
import * as nThemeManager from "@tellyfin/theme";

declare interface ThemeManager {
	/** Themes change sometimes. */
	emit(event: "theme-changed", prev: string, current: string, currentPath: string): boolean;
	on(event: "theme-changed", callback: (prev: string, current: string, currentPath: string) => void): this;
	removeListener(event: "theme-changed", callback: () => void): this;
}

class ThemeManager extends EventEmitter {
	#database: Database.Database;
	theme: string;
	native: nThemeManager.ThemeManager;

	constructor() {
		super();
		const dbPath = path.join(app.getPath("userData"), "/data.db");
		this.#database = new Database(dbPath);
		this.theme = "iliketeaalot.ps3"; // TOOD :: READ FROM SETTINGS!!!
		this.native = new nThemeManager.ThemeManager(dbPath);
		this.native.registerThemes();
	}

	setTheme(theme: string): Result<true> {
		if (theme == this.theme) {
			return Ok(true);
		} else {
			const newThemePath = this.pathForTheme(theme);
			if (newThemePath.ok) {
				const old = this.theme;
				this.theme = theme;
				const ok = this.emit("theme-changed", old, this.theme, newThemePath.value);
				return ok ? Ok(ok) : Err("Failed to emit events");
			} else {
				return Err(newThemePath.error);
			}
		}
	}

	pathForTheme(theme: string): Result<string> {
		try {
			const row = this.#database.prepare<[string], { path: string; }>("SELECT path FROM THEMES WHERE identifier = ?")
				.get(theme);
			if (row) {
				const { path } = row;
				return Ok(path);
			} else {
				return Err("No rows");
			}
		} catch (e) {
			console.error(e);
			return Err(e);
		}
	}
}

const themeManager = new ThemeManager();

export { themeManager };