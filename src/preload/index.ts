// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { type IpcRendererEvent, contextBridge, ipcRenderer } from "electron";
import type { UserSettings } from "~/renderer/vsh/settings/types";
import type { MpvEvent } from "~/shared/events/mpv";
import type { Status } from "~/renderer/vsh/settings/fs/types";
import type { FeedbackSound } from "~/renderer/vsh/context/AudioFeedback";
import type { MediaInfo } from "~/shared/types/video";
import type { VideoContextType } from "~/renderer/vsh/context/VideoContext";
import type { TellyfinUser } from "~/shared/types/user";
import type { ContentProvider } from "~/shared/types/media-server";

import "./database";
// async function invoke<T extends any = void>(command: string, args?: Record<string, any>): Promise<T> {
// 	// throw new Error("Not implemented yet.");
// 	return ipcRenderer.invoke(command, args);
// }

function listenFor(channel: string, callback: (e: IpcRendererEvent) => void, error?: (e: IpcRendererEvent, error: unknown) => void) {
	const listener = ipcRenderer.on(channel, callback);
	return () => {
		listener.removeListener(channel, callback);
	};
}

async function getSetting<T>(table: keyof UserSettings, key: string): Promise<T | null> {
	return ipcRenderer.invoke("get_setting", table, key);
}

async function readSettings(name: "User"): Promise<{
	content: UserSettings;
	status: Status,
}> {
	return ipcRenderer.invoke("read_settings", { name });
}

async function setSetting<T>(table: keyof UserSettings, key: string, value: T): Promise<void> {
	return ipcRenderer.invoke("set_setting", table, key, value);
}

async function saveSettings(content: UserSettings, name: string): Promise<void> {
	return ipcRenderer.invoke("save_settings", { content, name });
}

async function playBackground(): Promise<void> {
	return ipcRenderer.invoke("play_background");
}

async function stopBackground(): Promise<void> {
	return ipcRenderer.invoke("stop_background");
}

async function playFeedback(sound: FeedbackSound | "Coldboot"): Promise<void> {
	return ipcRenderer.invoke("play_feedback", { sound });
}

async function playFile(file: string, infoId?: MediaInfo, start = 0): Promise<void> {
	return ipcRenderer.invoke("play_file", { file, infoId, start });
}

async function reinitBASS(): Promise<void> {
	return ipcRenderer.invoke("reinit_bass");
}

async function seek(mode: "relative" | "absolute", seconds: number): Promise<void> {
	return ipcRenderer.invoke("seek", { mode, seconds });
}

async function transportCommand(command: string): Promise<void> {
	return ipcRenderer.invoke("transport_command", { command });
}

async function getMPVStatus(): Promise<VideoContextType> {
	return ipcRenderer.invoke("mpv_status");
}

async function closeSteamRunner(): Promise<void> {
	return ipcRenderer.invoke("close-steam-runner");
}

async function exitTellyfin(): Promise<void> {
	return ipcRenderer.invoke("exit-tellyfin");
}

async function restartTellyfin(): Promise<void> {
	return ipcRenderer.invoke("restart-tellyfin");
}

async function getContentProviders(): Promise<ContentProvider[]> {
	return ipcRenderer.invoke("get-content-providers");
}

async function registerServer(contentProvider: number, address: string, name?: string): Promise<number> {
	return ipcRenderer.invoke("register-server", contentProvider, address, name);
}

async function authenticateUserOnServer(serverId: number, username: string, password?: string): Promise<void> {
	return ipcRenderer.invoke("authenticate-server", serverId, username, password);
}

async function getUsers(): Promise<TellyfinUser[]> {
	return ipcRenderer.invoke("get-users");
}

const apiList = {
	// Events
	listenFor,
	playFile,
	// MPV
	getMPVStatus,
	// Settings
	getSetting,
	setSetting,
	readSettings,
	saveSettings,
	// Audio Feedback
	playBackground,
	stopBackground,
	playFeedback,
	reinitBASS,
	// Transport
	seek,
	transportCommand,
	// Start/Stop Tellyfin
	closeSteamRunner,
	exitTellyfin,
	restartTellyfin,
};

/**
 * For IPCRenderer.on(channel) events.
 */
type ListenFor = {
	// MPV
	listenFor(channel: "mpv-event", callback: (e: IpcRendererEvent, event: MpvEvent) => void): VoidFunction;
	// Settings being changed
	listenFor(channel: "settings-changed", callback: (e: IpcRendererEvent, settings: UserSettings) => void): VoidFunction;
};

type APIList = typeof apiList & ListenFor;

contextBridge.exposeInMainWorld("electronAPI", apiList);
// window.electronAPI = apiList as APIList;

// window.__VERSION__ = __VERSION__;
window.__IS_DEV__ = true;

declare global {
	export interface Window {
		__IS_DEV__: boolean;
		// __VERSION__: string;
		electronAPI: APIList;
	}
}