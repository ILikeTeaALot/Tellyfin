import { ipcMain } from "electron";
import { db } from "../database";

import { Api, Jellyfin } from "@jellyfin/sdk";
import * as jf from "@jellyfin/sdk/lib/utils/api";
import { hostname } from "os";
import type { ContentProvider, MediaServer } from "~/shared/types/media-server";
import { userId } from "../immediate-init";
import { setSetting, settingsManager } from "../settings";
import { randomUUID } from "crypto";
import type { AuthenticationResult, BaseItemDto, BaseItemDtoQueryResult } from "@jellyfin/sdk/lib/generated-client/models";
import { ItemsApi, type ItemsApiGetItemsRequest } from "@jellyfin/sdk/lib/generated-client/api/items-api";
import type { TvShowsApiGetEpisodesRequest, TvShowsApiGetNextUpRequest } from "@jellyfin/sdk/lib/generated-client/api/tv-shows-api";

const BaseItemDtoQueryEmpty = { data: { StartIndex: 0, TotalRecordCount: 0, Items: [] } };
export function setupMediaServerHandlers() {
	ipcMain.handle("media-server:get-content-providers", (_) => {
		const ok = db.rows<ContentProvider>(`--sql
			SELECT Id, Name, Type FROM
				ContentProvider
		`, []);
		if (ok.ok) {
			return ok.value;
		} else {
			return [];
		}
	});

	ipcMain.handle("media-server:register", (_, contentProviderId: number, address: string, name: string) => {
		const finalAddress = address.endsWith("/") ? address : `${address}/`;
		const ok = db.row<{ Id: number; }>(`--sql
			INSERT INTO
				Server (ContentProviderId, Address, Name)
			VALUES
				(?, ?, ?)
			ON CONFLICT
				DO UPDATE
					SET Id = Id
			RETURNING
				Id
		`, [contentProviderId, finalAddress, name]);
		if (ok.ok) {
			console.log("ServerId:", ok.value);
			return ok.value.Id;
			// return 1;
		}
		throw ok.error;
	});

	ipcMain.handle("media-server:get-servers", () => {
		const ok = db.rows<MediaServer>(`--sql
			SELECT * FROM Server
		`, []);
		if (ok.ok) {
			console.log("Servers:", ok.value);
			return ok.value;
			// return 1;
		}
		throw ok.error;
	});

	ipcMain.handle("media-server:remove", (_, serverId: number) => {
		const auths = db.rows("SELECT * FROM Auth WHERE ServerId = ?", [serverId]);
		if (auths.ok) for (const auth of auths.value) {
			// Logout...
			console.log(auth);
		} else {
			throw auths.error;
		}
		// TODO... Logout of `Auth`s associated with server `serverId`
		const ok = db.exec(`--sql
			DELETE FROM
				Server
			WHERE
				Id = ?
		`, [serverId]);
		if (ok.ok) {
			console.log("ServerId:", ok.value);
			return;
		}
		throw ok.error;
	});

	ipcMain.handle("media-server:login", async (_, serverId: number, username: string, password?: string) => {
		const serverInfo = getServerInfo(serverId); // Only Jellyfin for now
		if (!serverInfo.ok) throw new Error("Unrecognised Server " + serverId);
		const auth_data = await authenticateByUserName(serverInfo.value.Type, serverInfo.value.Address, username, password); // -> This will go to a plug-in picker when more than jellyfin is supported.
		const ok = db.exec(`--sql
			INSERT INTO
				Auth (ServerId, AuthData, UserId)
			VALUES
				(?, ?, ?)
		`, [serverId, JSON.stringify(auth_data), userId.value]);
		if (ok.ok) {
			return;
		} else {
			throw ok.error;
		}
	});

	ipcMain.handle("media-server:get-address", (_, serverId: number) => {
		const serverInfo = getServerInfo(serverId);
		if (serverInfo.ok) {
			return serverInfo.value.Address;
		} else {
			return null;
		}
	});

	ipcMain.handle("media-server:get-server-info", (_, serverId: number) => {
		const serverInfo = getServerInfo(serverId);
		if (serverInfo.ok) {
			return serverInfo.value;
		} else {
			return null;
		}
	});

	ipcMain.handle("media-server:fetch-user-views", async () => {
		const views = await getUserViews();
		if (views) {
			return views;
		} else {
			return BaseItemDtoQueryEmpty;
		}
		// try {
		// } catch (e) {
		// }
	});

	ipcMain.handle("media-server:get-items", async (_, serverId: number, options: ItemsApiGetItemsRequest) => {
		const items = await getItems(serverId, options);
		if (items) {
			return items;
		} else {
			throw new Error("Unknown Error");
		}
	});

	ipcMain.handle("media-server:get-episodes", async (_, serverId: number, options: TvShowsApiGetEpisodesRequest) => {
		const episodes = await getEpisodes(serverId, options);
		if (episodes) {
			return episodes;
		} else {
			throw new Error("Unknown Error");
		}
	});

	ipcMain.handle("media-server:get-next-up", async (_, serverId: number, options: TvShowsApiGetNextUpRequest) => {
		const episodes = await getNextUp(serverId, options);
		if (episodes) {
			return episodes;
		} else {
			throw new Error("Unknown Error");
		}
	});

	ipcMain.handle("media-server:get-item-video-stream-url", async (_, serverId: number, itemId: string) => {
		const url = await getItemVideoStreamUrl(serverId, itemId);
		if (url) {
			return url;
		} else {
			throw new Error("Unknown Error");
		}
	});
}

export const clientInfo = {
	name: "Tellyfin",
	version: "0.0.0",
};

async function authenticateByUserName(serverType: string, address: string, username: string, password?: string) {
	let deviceId = getDeviceId();
	switch (serverType) {
		case "org.jellyfin":
			const jellyfin = new Jellyfin({
				clientInfo,
				deviceInfo: {
					name: hostname(),
					id: deviceId, // TODO: FIX ME
				},
			});
			const api = jellyfin.createApi(address);
			const auth_data = await api.authenticateUserByName(username, password);
			if (auth_data.status >= 200 && auth_data.status < 300) {
				return auth_data.data;
			} else {
				throw new Error(auth_data.statusText);
			}
	}
}

export function authData(serverId: number) {
	const auth = db.row<{ AuthData: string; }>("SELECT AuthData FROM Auth INNER JOIN User ON Auth.UserId = User.Id INNER JOIN Server ON Auth.ServerId = Server.Id WHERE Server.Id = ? AND User.Id = ?", [serverId, userId.value]);
	if (auth.ok) {
		return JSON.parse(auth.value.AuthData) as AuthenticationResult;
	} else {
		return null;
	}
}

export function getDeviceId() {
	let deviceId = settingsManager.getSetting<string>("system", "device_id");
	if (!deviceId) {
		deviceId = randomUUID();
		setSetting(null, "system", "device_id", deviceId);
	}
	return deviceId;
}

async function getUserViews(): Promise<{ data: BaseItemDtoQueryResult; } | void> {
	const servers = db.rows<{ Id: number; Address: string; Name: string; Type: string; }>(`--sql
		SELECT
			Server.Id,
			Server.Address,
			Server.Name,
			ContentProvider.Type
		FROM
			Server
		INNER JOIN
			ContentProvider
		ON
			Server.ContentProviderId = ContentProvider.Id
	`, []);
	if (servers.ok) {
		console.log("Servers:", servers.value);
		const views = [];
		for await (const server of servers.value) {
			console.log("Fetching views for server...");
			const serverType = server.Type;
			const serverId = server.Id;
			const address = server.Address;
			console.log("ServerId:", serverId, "Address:", address);
			switch (serverType) {
				case "org.jellyfin":
					const auth = authData(serverId);
					const deviceId = auth?.SessionInfo?.DeviceId ?? getDeviceId();
					const deviceName = auth?.SessionInfo?.DeviceName ?? hostname();
					const jellyfin = new Jellyfin({
						clientInfo,
						deviceInfo: {
							name: deviceName,
							id: deviceId,
						},
					});
					if (auth) {
						try {
							const api = jellyfin.createApi(address, auth.AccessToken!);
							const jfUserViews = await jf.getUserViewsApi(api).getUserViews();
							console.log("UserViews:", jfUserViews.data);
							const items = jfUserViews.data.Items ?? [];
							views.push(...items.map(item => ({
								...item,
								ServerId: serverId as unknown as string,
								// Overview: server.Name + "\n" + (item.Overview ?? ""),
								Name: server.Name + " / " + (item.Name ?? "")
							})));
							console.log("views:", views);
						} catch (e) {
							console.error(e);
						}
					}
			}
		}
		return { data: { Items: views, TotalRecordCount: views.length, StartIndex: 0 } };
	}
	return;
}

async function getItems(serverId: number, options: ItemsApiGetItemsRequest) {
	const server = getServerInfo(serverId);
	if (server.ok) {
		const serverType = server.value.Type;
		const address = server.value.Address;
		switch (serverType) {
			case "org.jellyfin":
				const auth = authData(serverId);
				const deviceId = auth?.SessionInfo?.DeviceId ?? getDeviceId();
				const deviceName = auth?.SessionInfo?.DeviceName ?? hostname();
				const jellyfin = new Jellyfin({
					clientInfo,
					deviceInfo: {
						name: deviceName,
						id: deviceId,
					},
				});
				if (auth) {
					try {
						const api = jellyfin.createApi(address, auth.AccessToken!);
						const jfUserViews = await jf.getItemsApi(api).getItems({
							...options,
							userId: auth.User!.Id!
						});
						console.log("Items:", jfUserViews.data);
						const items = jfUserViews.data.Items ?? [];
						return {
							...jfUserViews.data,
							Items: items.map(item => ({ ...item, ServerId: serverId })),
						};
					} catch (e) {
						console.error(e);
					}
				}
		}
	}
}

async function getEpisodes(serverId: number, options: TvShowsApiGetEpisodesRequest) {
	const server = getServerInfo(serverId);
	if (server.ok) {
		const serverType = server.value.Type;
		const address = server.value.Address;
		switch (serverType) {
			case "org.jellyfin":
				const auth = authData(serverId);
				const deviceId = auth?.SessionInfo?.DeviceId ?? getDeviceId();
				const deviceName = auth?.SessionInfo?.DeviceName ?? hostname();
				const jellyfin = new Jellyfin({
					clientInfo,
					deviceInfo: {
						name: deviceName,
						id: deviceId,
					},
				});
				if (auth) {
					try {
						const api = jellyfin.createApi(address, auth.AccessToken!);
						const jfUserViews = await jf.getTvShowsApi(api).getEpisodes({
							...options,
							userId: auth.User!.Id!
						});
						console.log("Items:", jfUserViews.data);
						const items = jfUserViews.data.Items ?? [];
						return {
							...jfUserViews.data,
							Items: items.map(item => ({ ...item, ServerId: serverId })),
						};
					} catch (e) {
						console.error("Failed to get episodes");
						console.error(e);
					}
				}
		}
	}
}

async function getNextUp(serverId: number, options: TvShowsApiGetNextUpRequest) {
	const serverInfo = getServerInfo(serverId);
	if (serverInfo.ok) switch (serverInfo.value.Type) {
		case "org.jellyfin":
			return useJellyfinApi(serverId, serverInfo.value.Address, async (api, auth) => {
				const res = await jf.getTvShowsApi(api).getNextUp({
					...options,
					userId: auth.User!.Id!,
				});
				if (res.status >= 200 && res.status < 300) {
					const items = res.data.Items ?? [];
					return {
						...res.data,
						Items: items.map(item => ({ ...item, ServerId: serverId })),
					};
				} else {
					throw new Error(res.statusText);
				}
			});
	}
}

async function getItemVideoStreamUrl(serverId: number, itemId: string) {
	const serverInfo = getServerInfo(serverId);
	if (serverInfo.ok) switch (serverInfo.value.Type) {
		case "org.jellyfin":
			return useJellyfinApi(serverId, serverInfo.value.Address, async (api, auth) => {
				return `${api.basePath}/Videos/${itemId}/stream?static=true&api_key=${auth.AccessToken}`;
			});
	}
}

export function getServerInfo(serverId: number) {
	return db.row<{ Type: string; Address: string; Name: string; }>(`--sql
		SELECT
			ContentProvider.Type,
			Server.Address,
			Server.Name
		FROM
			Server
		INNER JOIN
			ContentProvider
		ON
			Server.ContentProviderId = ContentProvider.Id
		WHERE
			Server.Id = ?
	`, [serverId]);
}

export function useJellyfinApi<T>(serverId: number, address: string, cb: (api: Api, auth: AuthenticationResult) => T | Promise<T> | PromiseLike<T>) {
	const auth = authData(serverId);
	if (auth) {
		const deviceId = auth?.SessionInfo?.DeviceId ?? getDeviceId();
		const deviceName = auth?.SessionInfo?.DeviceName ?? hostname();
		const jellyfin = new Jellyfin({
			clientInfo,
			deviceInfo: {
				name: deviceName,
				id: deviceId,
			},
		});
		const api = jellyfin.createApi(address, auth.AccessToken!);
		return cb(api, auth);
	}
}