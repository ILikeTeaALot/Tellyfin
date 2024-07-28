import { createContext } from "preact";
import type { UserSettings } from "../settings/types";
import { default_user_settings } from "../settings/default";

/**
 * @returns {boolean} whether the settings were saved successfully.
 */
type UpdateFunction = <T extends keyof UserSettings>(area: T, value: Partial<UserSettings[T]>) => PromiseLike<boolean>;

const updateSettings: UpdateFunction = async (_) => {
	return false;
};

interface ContextForSettings {
	settings: UserSettings;
	update: UpdateFunction;
}

export const SettingsContext = createContext<ContextForSettings>({
	settings: default_user_settings,
	update: updateSettings,
});