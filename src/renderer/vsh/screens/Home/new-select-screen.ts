// import * as jf from "@jellyfin/sdk/lib/utils/api";
// import { Dispatch, StateUpdater } from "preact/hooks";
// import { ContentItem, ContentType } from "../../components/Content/types";
// import { NavigateAction } from "../../components/ContentList";
// import api, { auth } from "../../context/Jellyfin";
// import { BaseItemDtoQueryResult } from "@jellyfin/sdk/lib/generated-client/models";
// import { AxiosResponse } from "axios";
// import { ScreenContent } from "../common";

// export type SelectScreenParams = {
// 	action: NavigateAction;
// 	current_screen: number;
// 	screen_id: string;
// 	current_item: ContentItem;
// };

// export async function newSelectScreen(options: SelectScreenParams): Promise<[current: number, screens: Array<ScreenContent>]> {
// 	const { action, current_screen, current_item, screen_id } = options;
// 	if (action == NavigateAction.Enter) {
// 		const item = current_item;
// 		if (item.jellyfin && item.jellyfin_data) {
// 			switch (item.jellyfin_data.Type) {
// 				case "CollectionFolder": {
// 					const items = await (async () => {
// 						let items: AxiosResponse<BaseItemDtoQueryResult, any> | null = null;
// 						switch (item.jellyfin_data!.CollectionType) {
// 							case "unknown":
// 								break;
// 							case "movies":
// 								// http://[address]/Users/[userId]/Items?SortBy=SortName%2CProductionYear&SortOrder=Ascending&IncludeItemTypes=Movie&Recursive=true&Fields=PrimaryImageAspectRatio%2CMediaSourceCount%2CBasicSyncInfo&ImageTypeLimit=1&EnableImageTypes=Primary%2CBackdrop%2CBanner%2CThumb&StartIndex=0&ParentId=db4c1708cbb5dd1676284a40f2950aba&Limit=100
// 								// SortBy=SortName%2CProductionYear
// 								// SortOrder=Ascending
// 								// IncludeItemTypes=Movie
// 								// Recursive=true
// 								// Fields=PrimaryImageAspectRatio%2CMediaSourceCount%2CBasicSyncInfo
// 								// ImageTypeLimit=1
// 								// EnableImageTypes=Primary%2CBackdrop%2CBanner%2CThumb
// 								// StartIndex=0
// 								// ParentId=db4c1708cbb5dd1676284a40f2950aba
// 								// Limit=100
// 								items = await jf.getItemsApi(api).getItems({
// 									parentId: item.jellyfin_data!.Id,
// 									sortBy: ["SortName", "ProductionYear"],
// 									sortOrder: ["Ascending"],
// 									imageTypeLimit: 1,
// 									recursive: true,
// 									includeItemTypes: ["Movie"],
// 									userId: auth.User!.Id!,
// 								});
// 								break;
// 							case "music":
// 							case "musicvideos":
// 							case "trailers":
// 							case "playlists":
// 								break;
// 							case "tvshows":
// 								// /Items?SortBy=SortName&SortOrder=Ascending&IncludeItemTypes=Series&Recursive=true&Fields=PrimaryImageAspectRatio%2CBasicSyncInfo&ImageTypeLimit=1&EnableImageTypes=Primary%2CBackdrop%2CBanner%2CThumb&StartIndex=0&Limit=100&ParentId=767bffe4f11c93ef34b805451a696a4e
// 								items = await jf.getItemsApi(api).getItems({
// 									parentId: item.jellyfin_data!.Id,
// 									sortBy: ["SortName"],
// 									includeItemTypes: ["Series"],
// 									recursive: true,
// 									// Primary%2CBackdrop%2CBanner%2CThumb
// 									enableImageTypes: ["Primary", "Backdrop", "Banner", "Thumb"],
// 									// collapseBoxSetItems: true,
// 									userId: auth.User!.Id!,
// 								});
// 						}
// 						// console.log(items?.data?.Items);
// 						return items?.data?.Items;
// 					})();
// 					if (items) {
// 						return [current_screen + 1, [
// 							...screens.slice(0, current_screen + 1),
// 							{
// 								id: item.jellyfin_data!.Id!,
// 								type: ContentType.Grid,
// 								content: items.map(item => ({
// 									id: item.Id!,
// 									name: item.Name ?? "Unknown",
// 									jellyfin: true,
// 									jellyfin_data: item,
// 								})) ?? [],
// 							}
// 						]]
// 					}
// 					break;
// 				};
// 				case "Movie":
// 				case "Series": {
// 					console.log("Item type: Series!");
// 					updateScreens(screens => [
// 						...screens.slice(0, current_screen + 1),
// 						{
// 							id: item.jellyfin_data!.Id!,
// 							type: ContentType.Jellyfin,
// 							content: [],
// 							jellyfin_data: item.jellyfin_data,
// 						}
// 					]);
// 					setCurrentScreen(curr => curr + 1);
// 					break;
// 				}
// 			}
// 		}
// 	}
// 	switch (screen_id) {
// 		case "Home": {
// 			switch (action) {
// 				case NavigateAction.Enter:
// 					if (current_item.jellyfin) {

// 					} else {
// 						// switch (index) {
// 						// 	case 1: {
// 						// 		updateScreens(screens => [
// 						// 			...screens.slice(0, current_screen + 1),
// 						// 			{
// 						// 				id: "1",
// 						// 				type: ContentType.Grid,
// 						// 				content: [
// 						// 					{ id: "4", name: "The Addams Family" },
// 						// 					{ id: "65", name: "Addams Family Values" },
// 						// 					{ id: "69", name: "Bottoms" },
// 						// 					{ id: "77", name: "Star Trek The Motion Picture" },
// 						// 					{ id: "53", name: "Star Trek II: The Wrath of Khan" },
// 						// 					{ id: "23", name: "Star Trek III: The Search for Spock" },
// 						// 					{ id: "52", name: "Star Trek IV: The Voyage Home" },
// 						// 					{ id: "12", name: "Star Trek V: The Final Frontier" },
// 						// 					{ id: "91", name: "Star Trek VI: The Undiscovered Country" },
// 						// 					{ id: "94", name: "Star Trek: Generations" },
// 						// 					{ id: "96", name: "Star Trek: First Contact" },
// 						// 					{ id: "89", name: "Star Trek: Insurrection" },
// 						// 					{ id: "54", name: "Star Wars Episode IV: A New Franchise" },
// 						// 					{ id: "62", name: "Star Wars Episode V: The Really Good One" },
// 						// 					{ id: "93", name: "Star Wars Episode VI: The Good But Not Quite as Good One" },
// 						// 				]
// 						// 			}
// 						// 		]);
// 						// 		setCurrentScreen(1);
// 						// 		break;
// 						// 	}
// 						// 	default:
// 						// 		return;
// 						// }
// 					}
// 					switch (current_item.id) {
// 						case "system.settings":
// 							updateScreens(screens => [
// 								...screens.slice(0, current_screen + 1),
// 								{
// 									id: "system.settings",
// 									type: ContentType.SettingsList,
// 									content: [
// 										{ id: "system.settings.music", name: "Music Settings" },
// 										{ id: "system.settings.theme", name: "Theme Settings" },
// 										{ id: "system.settings.video", name: "Video Settings" },
// 										{ id: "system.settings.sound", name: "Sound Settings" },
// 										{ id: "system.settings.display", name: "Display Settings" },
// 									]
// 								}
// 							]);
// 							setCurrentScreen(curr => curr + 1);
// 					}
// 					break;
// 				case NavigateAction.Play:
// 					break;
// 			}
// 			break;
// 		}
// 		case "system.settings": {
// 			switch (action) {
// 				case NavigateAction.Enter:
// 					break;
// 				case NavigateAction.Play:
// 					break;
// 			}
// 			break;
// 		}
// 	}
// 	return [0, [{
// 		id: "system.settings",
// 		type: ContentType.SettingsList,
// 		content: [
// 			{ id: "system.settings.music", name: "Music Settings" },
// 			{ id: "system.settings.theme", name: "Theme Settings" },
// 			{ id: "system.settings.video", name: "Video Settings" },
// 			{ id: "system.settings.sound", name: "Sound Settings" },
// 			{ id: "system.settings.display", name: "Display Settings" },
// 		]
// 	}]];
// }