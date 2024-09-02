import { useState, useEffect, useCallback, useMemo } from "preact/hooks";
import useSWR from "swr";
import { SettingsFile, type UserSettings } from "../settings/types";
import type { ComponentChildren } from "preact";
import { SettingsContext } from "../context/Settings";
import { default_user_settings } from "../settings/default";
import { Status } from "../settings/fs/types";

const name = SettingsFile.User;

const init = async () => {
	try {
		const settings = await window.electronAPI.invoke<{
			content: UserSettings;
			status: Status,
		}>("read_settings", {
			name
		});
		// const current = JSON.parse(settings.content) as UserSettings;
		// const current = settings.content;
		if (!settings.content) throw new Error("No settings returned (TODO: Implement settings!)");
		if (settings?.status == Status.FileCreated) {
			window.electronAPI.invoke("save_settings", { content: default_user_settings, name });
			return default_user_settings;
		} else {
			return settings.content;
		}
	} catch (e) {
		console.error(e);
		return default_user_settings;
	}
}

/**
 * **!!! USE AT THE ROOT !!!**
 *
 * @param props child component
 * @returns Settings Provider, with update method handled.
 */
export function SettingsProvider({ children }: { children: ComponentChildren; }) {
	const { data: settings, error, mutate } = useSWR("user_settings", init, { keepPreviousData: true, fallbackData: default_user_settings });
	const [settingsLoaded, setSettingsLoaded] = useState(false);
	useEffect(() => {
		console.log("Tellyfin Settings", settings);
		if (settings) {
			setSettingsLoaded(true);
		} else {
			setSettingsLoaded(false);
		}
	}, [settings]);
	const update = useCallback(async <T extends keyof UserSettings>(table: T, value: Partial<UserSettings[T]>) => {
		mutate((settings) => {
			if (settings) {
				const newSettings = { ...settings, [table]: { ...settings[table], ...value } };
				window.electronAPI.invoke("save_settings", { content: newSettings, name });
				return newSettings;
			}
		}, { revalidate: false });
		return true;
	}, [mutate]);
	const contextValue = useMemo(() => ({ settings: settings ?? default_user_settings, update }), [settings, update]);
	if (!settingsLoaded) {
		console.log("No settings");
		// return null;
	}
	// if (error) return (
	// );
	console.log("rendering children");
	return (
		<SettingsContext.Provider value={contextValue}>
			{error && (
				<div>
					<h1>An error occurred loading Tellyfin's settings. {error}</h1>
				</div>
			)}
			{children}
		</SettingsContext.Provider>
	);
}