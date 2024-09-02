import { EventEmitter } from "events";
import { Err, Ok, type Result } from "~/shared/types/result";

declare interface SettingsManager {
	emit(event: "settings-changed", prev: Record<string, Record<string, any>>, current: Record<string, Record<string, any>>): boolean;
	on(event: "settings-changed", callback: (prev: Record<string, Record<string, any>>, current: Record<string, Record<string, any>>) => void): this;
	removeListener(event: "settings-changed", callback: () => void): this;
}

class SettingsManager extends EventEmitter {
	#settings: Record<string, Record<string, any>>;

	constructor() {
		super();
		this.#settings = {};
	}

	update(settings: Record<string, Record<string, any>>) {
		this.emit("settings-changed", this.#settings, settings);
		this.#settings = settings;
	}
}

const settingsManager = new SettingsManager();

export { settingsManager };