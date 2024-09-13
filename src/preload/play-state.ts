import type { PlaystateApiMarkPlayedItemRequest, PlaystateApiMarkUnplayedItemRequest, PlaystateApiOnPlaybackProgressRequest, PlaystateApiOnPlaybackStartRequest, PlaystateApiOnPlaybackStoppedRequest, PlaystateApiReportPlaybackProgressRequest, PlaystateApiReportPlaybackStartRequest, PlaystateApiReportPlaybackStoppedRequest } from "@jellyfin/sdk/lib/generated-client/api/playstate-api";
import { contextBridge, ipcRenderer } from "electron";

type Id = string | number;

async function onPlaybackStart(serverId: Id, options: PlaystateApiOnPlaybackStartRequest): Promise<void> {
	return ipcRenderer.invoke("media-server:on-playback-start", serverId, options);
}

async function onPlaybackProgress(serverId: Id, options: PlaystateApiOnPlaybackProgressRequest): Promise<void> {
	return ipcRenderer.invoke("media-server:on-playback-progress", serverId, options);
}

async function onPlaybackStopped(serverId: Id, options: PlaystateApiOnPlaybackStoppedRequest): Promise<void> {
	return ipcRenderer.invoke("media-server:on-playback-stopped", serverId, options);
}

async function reportPlaybackStart(serverId: Id, options: PlaystateApiReportPlaybackStartRequest): Promise<void> {
	return ipcRenderer.invoke("media-server:report-playback-start", serverId, options);
}

async function reportPlaybackProgress(serverId: Id, options: PlaystateApiReportPlaybackProgressRequest): Promise<void> {
	return ipcRenderer.invoke("media-server:report-playback-progress", serverId, options);
}

async function reportPlaybackStopped(serverId: Id, options: PlaystateApiReportPlaybackStoppedRequest): Promise<void> {
	return ipcRenderer.invoke("media-server:report-playback-stopped", serverId, options);
}

async function markPlayed(serverId: Id, options: Omit<PlaystateApiMarkPlayedItemRequest, "userId">): Promise<void> {
	return ipcRenderer.invoke("media-server:mark-item-played", serverId, options);
}

async function markUnplayed(serverId: Id, options: Omit<PlaystateApiMarkUnplayedItemRequest, "userId">): Promise<void> {
	return ipcRenderer.invoke("media-server:mark-item-unplayed", serverId, options);
}

const apiList = {
	// 
	onPlaybackStart,
	onPlaybackProgress,
	onPlaybackStopped,
	// 
	markPlayed,
	markUnplayed
};

contextBridge.exposeInMainWorld("playStateAPI", apiList);

declare global {
	export interface Window {
		playStateAPI: typeof apiList;
	}
}