import * as jf from "@jellyfin/sdk/lib/utils/api";
import { Dispatch, StateUpdater } from "preact/hooks";
import { ContentItem, ContentType } from "../../components/Content/types";
import { NavigateAction } from "../../components/ContentList";
import api, { auth } from "../../context/Jellyfin";
import { BaseItemDtoQueryResult } from "@jellyfin/sdk/lib/generated-client/models";
import { AxiosResponse } from "axios";
import { ScreenContent } from "../common";

export async function selectScreen(updateScreens: Dispatch<StateUpdater<ScreenContent[]>>, setCurrentScreen: Dispatch<StateUpdater<number>>, action: NavigateAction, current_screen: number, screen_id: string, current_item: ContentItem) {
	if (action == NavigateAction.Enter) {
		const item = current_item;
		if (item.jellyfin && item.jellyfin_data) {
			switch (item.jellyfin_data.Type) {
				case "CollectionFolder": {
					const items = await (async () => {
						let items: AxiosResponse<BaseItemDtoQueryResult, any> | null = null;
						switch (item.jellyfin_data!.CollectionType) {
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
								items = await jf.getItemsApi(api).getItemsByUserId({
									parentId: item.jellyfin_data!.Id,
									sortBy: ["SortName", "ProductionYear"],
									sortOrder: ["Ascending"],
									imageTypeLimit: 1,
									recursive: true,
									includeItemTypes: ["Movie"],
									userId: auth.current.User!.Id!,
								});
								break;
							case "music":
							case "musicvideos":
							case "trailers":
							case "playlists":
								break;
							case "tvshows":
								// /Items?SortBy=SortName&SortOrder=Ascending&IncludeItemTypes=Series&Recursive=true&Fields=PrimaryImageAspectRatio%2CBasicSyncInfo&ImageTypeLimit=1&EnableImageTypes=Primary%2CBackdrop%2CBanner%2CThumb&StartIndex=0&Limit=100&ParentId=767bffe4f11c93ef34b805451a696a4e
								items = await jf.getItemsApi(api).getItemsByUserId({
									parentId: item.jellyfin_data!.Id,
									sortBy: ["SortName"],
									includeItemTypes: ["Series"],
									recursive: true,
									enableImageTypes: ["Primary", "Backdrop", "Banner", "Thumb"],
									userId: auth.current.User!.Id!,
								});
								break;
							default:
								// http://192.168.1.88:8096/Users/6e9830156d1e47bb90e60fb126a6d3ab/Items?StartIndex=0&Limit=100&Fields=PrimaryImageAspectRatio%2CSortName%2CPath%2CSongCount%2CChildCount%2CMediaSourceCount%2CPrimaryImageAspectRatio&ImageTypeLimit=1&ParentId=34f331a89ce405e2b877d68d5ee4d4a2&SortBy=IsFolder%2CSortName&SortOrder=Ascending
								items = await jf.getItemsApi(api).getItemsByUserId({
									parentId: item.jellyfin_data!.Id,
									sortBy: ["IsFolder"],
									sortOrder: ["Ascending"],
									imageTypeLimit: 1,
									userId: auth.current.User!.Id!,
								});
								break;
						}
						// console.log(items?.data?.Items);
						return items?.data?.Items;
					})();
					if (items) {
						updateScreens(screens => [
							...screens.slice(0, current_screen + 1),
							{
								id: item.jellyfin_data!.Id!,
								type: ContentType.Grid,
								content: items.map(item => ({
									id: item.Id!,
									name: item.Name ?? "Unknown",
									jellyfin: true,
									jellyfin_data: item,
								})) ?? [],
							}
						]);
						setCurrentScreen(curr => curr + 1);
					}
					break;
				};
				case "Movie":
				case "Series": {
					console.log("Item type: Series!");
					updateScreens(screens => [
						...screens.slice(0, current_screen + 1),
						{
							id: item.jellyfin_data!.Id!,
							type: ContentType.Jellyfin,
							content: [],
							jellyfin_data: item.jellyfin_data,
						}
					]);
					setCurrentScreen(curr => curr + 1);
					break;
				}
			}
		}
	}
	switch (screen_id) {
		case "Home": {
			switch (action) {
				case NavigateAction.Enter:
					switch (current_item.id) {
						case "system.settings":
							updateScreens(screens => [
								...screens.slice(0, current_screen + 1),
								{
									id: "system.settings",
									type: ContentType.SettingsList,
									content: [
										{ id: "system.settings.music", name: "Music Settings" },
										{ id: "system.settings.theme", name: "Theme Settings" },
										{ id: "system.settings.video", name: "Video Settings" },
										{ id: "system.settings.sound", name: "Sound Settings" },
										{ id: "system.settings.display", name: "Display Settings" },
									]
								}
							]);
							setCurrentScreen(curr => curr + 1);
					}
					break;
				case NavigateAction.Play:
					break;
			}
			break;
		}
		case "system.settings": {
			switch (action) {
				case NavigateAction.Enter:
					break;
				case NavigateAction.Play:
					break;
			}
			break;
		}
	}
}