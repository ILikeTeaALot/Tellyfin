// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { type IpcRendererEvent, contextBridge, ipcRenderer } from "electron";
import type { UserSettings } from "~/renderer/vsh/settings/types";
import type { MpvEvent } from "~/shared/events/mpv";

import "./database";

async function invoke<T = any>(command: string, args?: Record<string, any>): Promise<T> {
	// throw new Error("Not implemented yet.");
	return ipcRenderer.invoke(command, args);
}

function listenFor(channel: string, callback: (e: IpcRendererEvent) => void, error?: (e: IpcRendererEvent, error: unknown) => void) {
	const listener = ipcRenderer.on(channel, callback);
	return () => {
		listener.removeListener(channel, callback);
	};
}

async function getSetting<T>(table: keyof UserSettings, key: string): Promise<T | null> {
	return ipcRenderer.invoke("get_setting", table, key);
}

function getMPVStatus() {
	return;
}

const apiList = {
	invoke,
	getMPVStatus,
	listenFor,
}

/**
 * For IPCRenderer.on(channel) events.
 */
type ListenFor = {
	// MPV
    listenFor(channel: "mpv-event", callback: (e: IpcRendererEvent, event: MpvEvent) => void): VoidFunction;
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