import { ipcMain } from "electron";
import { db } from "../database";
import type { UserSettings } from "~/renderer/vsh/settings/types";
import { Status } from "~/renderer/vsh/settings/fs/types";
import { settingsManager } from "../settings";

const CREATE_TABLE = "CREATE TABLE IF NOT EXISTS ";
const SETTING_TABLE_STRUCTURE = ` (
	idx INTEGER PRIMARY KEY,
	key TEXT,
	value BLOB,
	UNIQUE(key)
)`;
export function setupSettingsHandlers() {
	ipcMain.handle("save_settings", (_e, settings: { content: UserSettings, name: string; }) => {
		const { content } = settings;
		settingsManager.update(content);
		for (const [table, values] of Object.entries(content)) {
			for (const [key, value] of Object.entries(values)) {
				setSetting(table, key, value);
			}
		}
	});

	ipcMain.handle("read_settings", () => {
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
			settingsManager.update(Object.fromEntries(settingsList));
			return { content: Object.fromEntries(settingsList), status: settingsList.length == 0 ? Status.FileCreated : Status.FileExists };
		}
		return { content: null, status: null };
	});

	ipcMain.handle("get_setting", (_, table, key) => {
		const tableName = setupSettingsTable(table);
		const row = db.row<{ value: string; }>("SELECT value FROM " + tableName + "WHERE key = ?", [key]);
		if (row.ok) {
			return JSON.parse(row.value.value);
		} else {
			return null;
		}
	});

	ipcMain.handle("set_setting", (_, table: string, key: string, value: any) => {
		return setSetting(table, key, value);
	});
}

function setSetting<T>(table: string, key: string, value: T) {
	const tableName = setupSettingsTable(table);
	return db.exec(`
			INSERT INTO ${tableName} (value, key)
			VALUES ($value, $key)
			ON CONFLICT(key) 
			DO UPDATE SET value = $value
			WHERE key = $key
			`, { key, value: JSON.stringify(value) });
}

function setupSettingsTable(table: string): string {
	const tableName = `"setting_${table}"`;
	db.exec(CREATE_TABLE + tableName + SETTING_TABLE_STRUCTURE, []);
	return tableName;
}