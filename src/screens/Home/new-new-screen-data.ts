import * as jf from "@jellyfin/sdk/lib/utils/api";
import type { BaseItemDto, BaseItemDtoQueryResult } from "@jellyfin/sdk/lib/generated-client/models";
import type { AxiosResponse } from "axios";
import { ContentType } from "../../components/Content/types";
import api, { auth } from "../../context/Jellyfin";
import type { ScreenContent } from "../common";
import { musicHMS, TICKS_PER_SECOND, toHMS } from "../../util/functions";

export async function newestScreenDataFetcher(key: string, jellyfin_data?: BaseItemDto): Promise<ScreenContent> {
	// const item = { jellyfin_data };
	// const current_item = item;
	if (jellyfin_data) {
		switch (jellyfin_data.Type) {
			case "CollectionFolder": {
				const items = await (async () => {
					let items: AxiosResponse<BaseItemDtoQueryResult, any> | null = null;
					switch (jellyfin_data!.CollectionType) {
						case "unknown":
							break;
						case "movies":
							// http://[address]/Users/[userId]/Items?SortBy=SortName%2CProductionYear&SortOrder=Ascending&IncludeItemTypes=Movie&Recursive=true&Fields=PrimaryImageAspectRatio%2CMediaSourceCount%2CBasicSyncInfo&ImageTypeLimit=1&EnableImageTypes=Primary%2CBackdrop%2CBanner%2CThumb&StartIndex=0&ParentId=db4c1708cbb5dd1676284a40f2950aba&Limit=100
							// SortBy=SortName%2CProductionYear
							// SortOrder=Ascending
							// IncludeItemTypes=Movie
							// Recursive=true
							// Fields=PrimaryImageAspectRatio%2CMediaSourceCount%2CBasicSyncInfo
							// ImageTypeLimit=1
							// EnableImageTypes=Primary%2CBackdrop%2CBanner%2CThumb
							// StartIndex=0
							// ParentId=db4c1708cbb5dd1676284a40f2950aba
							// Limit=100
							items = await jf.getItemsApi(api).getItems({
								parentId: jellyfin_data!.Id,
								sortBy: ["SortName", "ProductionYear"],
								sortOrder: ["Ascending"],
								imageTypeLimit: 1,
								recursive: true,
								includeItemTypes: ["Movie"],
								userId: auth.User!.Id!,
							});
							break;
						case "music":
							items = await jf.getItemsApi(api).getItems({
								parentId: jellyfin_data!.Id,
								sortBy: ["SortName"],
								includeItemTypes: ["MusicArtist"],
								// recursive: true,
								// Primary%2CBackdrop%2CBanner%2CThumb
								enableImageTypes: ["Primary", "Backdrop", "Banner", "Thumb"],
								// collapseBoxSetItems: true,
								userId: auth.User!.Id!,
							});
							break;
						case "musicvideos":
						case "trailers":
						case "playlists":
							break;
						case "tvshows":
							// /Items?SortBy=SortName&SortOrder=Ascending&IncludeItemTypes=Series&Recursive=true&Fields=PrimaryImageAspectRatio%2CBasicSyncInfo&ImageTypeLimit=1&EnableImageTypes=Primary%2CBackdrop%2CBanner%2CThumb&StartIndex=0&Limit=100&ParentId=767bffe4f11c93ef34b805451a696a4e
							items = await jf.getItemsApi(api).getItems({
								parentId: jellyfin_data!.Id,
								sortBy: ["SortName"],
								includeItemTypes: ["Series"],
								recursive: true,
								// Primary%2CBackdrop%2CBanner%2CThumb
								enableImageTypes: ["Primary", "Backdrop", "Banner", "Thumb"],
								// collapseBoxSetItems: true,
								userId: auth.User!.Id!,
							});
							break;
						default:
							// http://192.168.1.88:8096/Users/6e9830156d1e47bb90e60fb126a6d3ab/Items?StartIndex=0&Limit=100&Fields=PrimaryImageAspectRatio%2CSortName%2CPath%2CSongCount%2CChildCount%2CMediaSourceCount%2CPrimaryImageAspectRatio&ImageTypeLimit=1&ParentId=34f331a89ce405e2b877d68d5ee4d4a2&SortBy=IsFolder%2CSortName&SortOrder=Ascending
							items = await jf.getItemsApi(api).getItems({
								parentId: jellyfin_data!.Id,
								sortBy: ["IsFolder"],
								sortOrder: ["Ascending"],
								imageTypeLimit: 1,
								userId: auth.User!.Id!,
							});
							break;
					}
					// console.log(items?.data?.Items);
					return items?.data?.Items;
				})();
				return {
					id: jellyfin_data!.Id!,
					type: ContentType.Jellyfin,
					content: items?.map(item => ({
						Icon: "icon:music.folder",
						id: item.Id!,
						name: item.Name ?? "Unknown",
						jellyfin_data: item,
					})) ?? [],
					jellyfin_data,
				};
			};
			case "Movie":
			case "Series": {
				console.log("Item type: Series!");
				return {
					id: jellyfin_data!.Id!,
					type: ContentType.Jellyfin,
					content: [],
					jellyfin_data,
				};
			}
			case "ManualPlaylistsFolder":
			case "PlaylistsFolder": {
				const items = await jf.getItemsApi(api).getItems({
					sortBy: ["SortName"],
					recursive: true,
					includeItemTypes: ["Playlist", "PlaylistsFolder"],
					userId: auth.User!.Id!,
				});
				return {
					id: jellyfin_data.Id!,
					type: ContentType.Jellyfin,
					content: items.data.Items?.map(item => ({
						id: item.Id!,
						name: item.Name ?? "Unknown",
						jellyfin_data: item,
					})) ?? [],
					jellyfin_data,
				};
			}
			case "Playlist": {
				const items = await jf.getItemsApi(api).getItems({
					parentId: jellyfin_data.Id!,
					sortBy: ["SortName"],
					recursive: true,
					userId: auth.User!.Id!,
				});
				return {
					id: jellyfin_data.Id!,
					type: ContentType.Jellyfin,
					content: items.data.Items?.map(item => ({
						id: item.Id!,
						name: item.Name ?? "Unknown",
						jellyfin_data: item,
					})) ?? [],
					jellyfin_data,
				};
			}
			case "MusicArtist": {
				const items = await jf.getItemsApi(api).getItems({
					parentId: jellyfin_data.Id!,
					sortBy: ["SortName"],
					includeItemTypes: ["MusicAlbum"],
					recursive: true,
					userId: auth.User!.Id!,
				});
				return {
					id: jellyfin_data.Id!,
					type: ContentType.Jellyfin,
					content: items.data.Items?.map(item => ({
						Icon: "icon:music.folder",
						id: item.Id!,
						name: item.Name ?? "Unknown",
						jellyfin_data: item,
					})) ?? [],
					jellyfin_data,
				};
			}
			case "MusicAlbum": {
				const items = await jf.getItemsApi(api).getItems({
					parentId: jellyfin_data.Id!,
					includeItemTypes: ["Audio"],
					recursive: true,
					sortBy: ["ParentIndexNumber", "IndexNumber"],
					userId: auth.User!.Id!,
				});
				return {
					id: jellyfin_data.Id!,
					type: ContentType.Jellyfin,
					content: items.data.Items?.map(item => ({
						Icon: "icon:music.item_default",
						id: item.Id!,
						name: (item.Name && `${item.IndexNumber} - ${item.Name}`) ?? "Unknown",
						value: (item.Name && `${musicHMS((item.RunTimeTicks ?? 10_000_000) / TICKS_PER_SECOND)}`),
						jellyfin_data: item,
					})) ?? [],
					jellyfin_data,
				};
			}
		}
	}
	/* switch (screen_id) {
		case "Home": {
			if (current_item.id.startsWith("system.settings.")) {
				return {
					id: current_item.id,
					type: ContentType.SettingsList,
					content: [],
					// content: [
					// 	{ id: "system.settings.music", name: "Music Settings" },
					// 	{ id: "system.settings.theme", name: "Theme Settings" },
					// 	{ id: "system.settings.video", name: "Video Settings" },
					// 	{ id: "system.settings.sound", name: "Sound Settings" },
					// 	{ id: "system.settings.display", name: "Display Settings" },
					// ]
				}
			}
		}
	} */
	if (key.startsWith("system.settings.")) {
		return {
			id: key,
			type: ContentType.SettingsList,
			content: [],
			// content: [
			// 	{ id: "system.settings.music", name: "Music Settings" },
			// 	{ id: "system.settings.theme", name: "Theme Settings" },
			// 	{ id: "system.settings.video", name: "Video Settings" },
			// 	{ id: "system.settings.sound", name: "Sound Settings" },
			// 	{ id: "system.settings.display", name: "Display Settings" },
			// ]
		};
	}
	throw new Error(`No content for key ${key}`);
}