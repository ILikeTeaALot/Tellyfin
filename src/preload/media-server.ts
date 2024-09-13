import type { ItemsApiGetItemsRequest } from "@jellyfin/sdk/lib/generated-client/api/items-api";
import type { TvShowsApiGetEpisodesRequest, TvShowsApiGetNextUpRequest } from "@jellyfin/sdk/lib/generated-client/api/tv-shows-api";
import type { BaseItemDto, BaseItemDtoQueryResult } from "@jellyfin/sdk/lib/generated-client/models";
import { contextBridge, ipcRenderer } from "electron";
import type { ContentProvider, MediaServer } from "~/shared/types/media-server";

async function getContentProviders(): Promise<ContentProvider[]> {
	return ipcRenderer.invoke("media-server:get-content-providers");
}

async function registerServer(contentProvider: number, address: string, name?: string): Promise<number> {
	return ipcRenderer.invoke("media-server:register", contentProvider, address, name);
}

async function authenticateUserOnServer(serverId: number, username: string, password?: string): Promise<void> {
	return ipcRenderer.invoke("media-server:login", serverId, username, password);
}

async function getServerAddress(serverId: number | string): Promise<string | null> {
	return ipcRenderer.invoke("media-server:get-address", serverId);
}

async function getServerInfo(serverId: number | string): Promise<{ Type: string; Address: string; Name: string; } | null> {
	return ipcRenderer.invoke("media-server:get-server-info", serverId);
}

async function getUserViews(): Promise<{ data: { Items: BaseItemDto[]; }; }> {
	return ipcRenderer.invoke("media-server:fetch-user-views");
}

async function getMediaServers(): Promise<MediaServer[]> {
	return ipcRenderer.invoke("media-server:get-servers");
}

async function removeMediaServer(serverId: number): Promise<void> {
	return ipcRenderer.invoke("media-server:remove", serverId);
}

async function getItems(serverId: number | string, options: Omit<ItemsApiGetItemsRequest, "userId">): Promise<BaseItemDtoQueryResult> {
	return ipcRenderer.invoke("media-server:get-items", serverId, options);
}

async function getEpisodes(serverId: number | string, options: Omit<TvShowsApiGetEpisodesRequest, "userId">): Promise<BaseItemDtoQueryResult> {
	return ipcRenderer.invoke("media-server:get-episodes", serverId, options);
}

async function getNextUp(serverId: number | string, options: Omit<TvShowsApiGetNextUpRequest, "userId">): Promise<BaseItemDtoQueryResult> {
	return ipcRenderer.invoke("media-server:get-next-up", serverId, options);
}

async function getItemVideoStreamUrl(serverId: number | string, itemId: string): Promise<string> {
	return ipcRenderer.invoke("media-server:get-item-video-stream-url", serverId, itemId);
}

const apiList = {
	// Content Providers
	getContentProviders,
	// Server Management
	registerServer,
	authenticateUserOnServer,
	removeMediaServer,
	// Server Info
	getMediaServers,
	getServerAddress,
	getServerInfo,
	// Items
	getItems,
	// Views
	getUserViews,
	// TV Shows
	getEpisodes,
	getNextUp,
	// 
	getItemVideoStreamUrl,
};

contextBridge.exposeInMainWorld("mediaServerAPI", apiList);

declare global {
	export interface Window {
		mediaServerAPI: typeof apiList;
	}
}