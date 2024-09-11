import { EventEmitter } from "events";
import { Err, Ok, type Result } from "~/shared/types/result";
import { mainWindow, uiWindow } from "../important-values";
import { db } from "../database";
import { Status } from "~/renderer/vsh/settings/fs/types";
import type { IpcMainInvokeEvent } from "electron";
import type { UserSettings } from "~/renderer/vsh/settings/types";

declare interface SettingsManager {
	emit(event: "settings-changed", prev: Record<string, Record<string, any>>, current: Record<string, Record<string, any>>): boolean;
	on(event: "settings-changed", callback: (prev: Record<string, Record<string, any>>, current: Record<string, Record<string, any>>) => void): this;
	removeListener(event: "settings-changed", callback: () => void): this;
}

type SettingsRecord = Record<string, Record<string, any>>;

class SettingsManager extends EventEmitter {
	#settings: Record<string, Record<string, any>>;

	constructor() {
		super();
		this.#settings = getSettings().content!;
	}

	update(_settings: SettingsRecord | ((current: Record<string, Record<string, any>>) => SettingsRecord)): void {
		let settings: SettingsRecord;
		if (typeof _settings == "function") {
			settings = _settings(this.#settings);
		} else {
			settings = _settings;
		}
		const updated: Record<string, Record<string, any>> = { ...this.#settings, ...settings };
		this.emit("settings-changed", this.#settings, updated);
		uiWindow.value?.webContents.send("settings-changed", updated);
		this.#settings = updated;
	}

	getSetting<T>(table: string, key: string): T | null {
		return this.#settings?.[table]?.[key] ?? null;
	}
}

const settingsManager = new SettingsManager();

export { settingsManager };

export function getSettings() {
	const tables = db.rows<{ name: string; }>(`
			SELECT 
				name
			FROM 
				sqlite_schema
			WHERE 
				type = 'table' AND 
				name NOT LIKE 'sqlite_%' AND
				name LIKE 'setting_%'
			`, []);
	if (tables.ok) {
		const settingsList = tables.value.map(({ name: table }) => {
			const settings = db.rows<{ key: string; value: string; }>(`SELECT key, value FROM ${table}`, []);
			if (settings.ok) {
				if (settings.value.length == 0) return null;
				const entries = settings.value.map(({ key, value }) => [key, JSON.parse(value)] as const);
				const obj = Object.fromEntries(entries);
				return [table.replace("setting_", ""), obj] as [string, Record<string, any>];
			}
			return null;
		}).filter(o => !!o);
		// settingsManager.update(Object.fromEntries(settingsList));
		return { content: Object.fromEntries(settingsList), status: settingsList.length == 0 ? Status.FileCreated : Status.FileExists };
	}
	return { content: null, status: null };
}

export function saveSettings(_: IpcMainInvokeEvent | null, settings: { content: UserSettings; name: string; }): void {
	const { content } = settings;
	settingsManager.update(content);
	for (const [table, values] of Object.entries(content)) {
		for (const [key, value] of Object.entries(values)) {
			storeSetting(table, key, value);
		}
	}
};

export function getSetting(_: IpcMainInvokeEvent | null, table: string, key: string) {
	const tableName = setupSettingsTable(table);
	const row = db.row<{ value: string; }>("SELECT value FROM " + tableName + "WHERE key = ?", [key]);
	if (row.ok) {
		return JSON.parse(row.value.value);
	} else {
		return null;
	}
};

export function setSetting(_: IpcMainInvokeEvent | null, table: string, key: string, value: any) {
	settingsManager.update((settings) => ({
		...settings,
		[table]: {
			...settings[table],
			[key]: value,
		}
	}));
	return storeSetting(table, key, value);
};

function storeSetting<T>(table: string, key: string, value: T) {
	const tableName = setupSettingsTable(table);
	return db.exec(`
			INSERT INTO ${tableName} (value, key)
			VALUES ($value, $key)
			ON CONFLICT(key) 
			DO UPDATE SET value = $value
			WHERE key = $key
			`, { key, value: JSON.stringify(value) });
}

export function setupSettingsTable(table: string): string {
	const tableName = `"setting_${table}"`;
	db.exec(CREATE_TABLE + tableName + SETTING_TABLE_STRUCTURE, []);
	return tableName;
}

const CREATE_TABLE = "CREATE TABLE IF NOT EXISTS ";
const SETTING_TABLE_STRUCTURE = ` (
	idx INTEGER PRIMARY KEY,
	key TEXT,
	value BLOB,
	UNIQUE(key)
)`;