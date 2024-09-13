import { ipcMain } from "electron";
import * as jf from "@jellyfin/sdk/lib/utils/api";
import type { PlaystateApiMarkPlayedItemRequest, PlaystateApiMarkUnplayedItemRequest, PlaystateApiOnPlaybackProgressRequest, PlaystateApiOnPlaybackStartRequest, PlaystateApiOnPlaybackStoppedRequest } from "@jellyfin/sdk/lib/generated-client/api/playstate-api";
import { getServerInfo, useJellyfinApi } from "./media-server";

export function setupPlayStateHandlers() {
	ipcMain.handle("media-server:on-playback-start", (_, serverId: number, options: PlaystateApiOnPlaybackStartRequest) => {
		return onPlaybackStart(serverId, options);
	});

	ipcMain.handle("media-server:on-playback-progress", (_, serverId: number, options: PlaystateApiOnPlaybackStartRequest) => {
		return onPlaybackProgress(serverId, options);
	});

	ipcMain.handle("media-server:on-playback-stopped", (_, serverId: number, options: PlaystateApiOnPlaybackStartRequest) => {
		return onPlaybackStopped(serverId, options);
	});

	ipcMain.handle("media-server:mark-item-played", (_, serverId: number, options: PlaystateApiMarkPlayedItemRequest) => {
		return markPlayed(serverId, options);
	});

	ipcMain.handle("media-server:mark-item-unplayed", (_, serverId: number, options: PlaystateApiMarkUnplayedItemRequest) => {
		return markUnplayed(serverId, options);
	});
}

async function onPlaybackStart(serverId: number, options: PlaystateApiOnPlaybackStartRequest) {
	const serverInfo = getServerInfo(serverId);
	if (serverInfo.ok) switch (serverInfo.value.Type) {
		case "org.jellyfin":
			return useJellyfinApi(serverId, serverInfo.value.Address, async (api) => {
				const res = await jf.getPlaystateApi(api).onPlaybackStart(options);
				if (res.status >= 200 && res.status < 300) {
					return;
				} else {
					throw new Error(res.statusText);
				}
			});
	}
}

async function onPlaybackProgress(serverId: number, options: PlaystateApiOnPlaybackProgressRequest) {
	const serverInfo = getServerInfo(serverId);
	if (serverInfo.ok) switch (serverInfo.value.Type) {
		case "org.jellyfin":
			return useJellyfinApi(serverId, serverInfo.value.Address, async (api) => {
				const res = await jf.getPlaystateApi(api).onPlaybackProgress(options);
				if (res.status >= 200 && res.status < 300) {
					return;
				} else {
					throw new Error(res.statusText);
				}
			});
	}
}

async function onPlaybackStopped(serverId: number, options: PlaystateApiOnPlaybackStoppedRequest) {
	const serverInfo = getServerInfo(serverId);
	if (serverInfo.ok) switch (serverInfo.value.Type) {
		case "org.jellyfin":
			return useJellyfinApi(serverId, serverInfo.value.Address, async (api) => {
				const res = await jf.getPlaystateApi(api).onPlaybackStopped(options);
				if (res.status >= 200 && res.status < 300) {
					return;
				} else {
					throw new Error(res.statusText);
				}
			});
	}
}

async function markPlayed(serverId: number, options: PlaystateApiMarkPlayedItemRequest) {
	const serverInfo = getServerInfo(serverId);
	if (serverInfo.ok) switch (serverInfo.value.Type) {
		case "org.jellyfin":
			return useJellyfinApi(serverId, serverInfo.value.Address, async (api, auth) => {
				const res = await jf.getPlaystateApi(api).markPlayedItem({
					...options,
					userId: auth.User!.Id!,
				});
				if (res.status >= 200 && res.status < 300) {
					return;
				} else {
					throw new Error(res.statusText);
				}
			});
	}
}

async function markUnplayed(serverId: number, options: PlaystateApiMarkUnplayedItemRequest) {
	const serverInfo = getServerInfo(serverId);
	if (serverInfo.ok) switch (serverInfo.value.Type) {
		case "org.jellyfin":
			return useJellyfinApi(serverId, serverInfo.value.Address, async (api, auth) => {
				const res = await jf.getPlaystateApi(api).markUnplayedItem({
					...options,
					userId: auth.User!.Id!,
				});
				if (res.status >= 200 && res.status < 300) {
					return;
				} else {
					throw new Error(res.statusText);
				}
			});
	}
}