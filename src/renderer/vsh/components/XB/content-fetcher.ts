/** This is unlikely to be the permanent way this is done */

import type { JSX } from "preact";
import type { ContentItem } from "../Content/types";
import api, { jellyfin } from "../../context/Jellyfin";
import type { BaseItemDto, CollectionType } from "@jellyfin/sdk/lib/generated-client/models";

export interface XBItem extends ContentItem {
	Icon?:
	| (() => JSX.Element)
	| string
	| { width: number; height: number; src: string; };
	desc?: string;
	/** E.g. current setting/option value */
	value?: string | number;
}

export type CategoryContent = {
	content: Array<XBItem>;
	default_item?: number;
	error?: string;
};

export async function getXBarContent([_, category]: [
	"xb-category",
	string,
]): Promise<CategoryContent> {
	switch (category) {
		// case "network":
		// case "social":
		// 	return { content: [] };
		case "games":
			return {
				content: [
					{
						id: "com.steampowered",
						name: "Steam",
						desc: "Your Steam library – Coming soon!",
						Icon: "icon:games.steam",
					},
				],
			};
		case "services":
			return {
				content: [
					{
						id: "org.tellyfin.invidious",
						name: "Youtube",
						desc: "Via Invidious – Coming soon!",
						Icon: "/xb-icons/youtube/white/youtube_social_squircle_white.png",
					},
				],
			};
		case "video":
			return getXBarVideoContent();
		case "live_tv":
			return getXBarLiveTVContent();
		case "tv":
			return getXBarTVContent();
		case "music":
			return getXBarMusicContent();
		case "photos":
			return getXBarPhotoContent();
		case "settings":
			return {
				default_item: 1,
				content: [
					{
						id: "system.update",
						name: "Check for Updates",
						Icon: "icon:system.update",
						desc: "Connect to the internet and check for Tellyfin software updates.",
					},
					// {
					// 	id: "system.settings.home",
					// 	name: "Customise Home",
					// 	Icon: "icon:settings.item",
					// 	desc: "Customise the order and visibility of XBar Categories.",
					// },
					{
						id: "system.settings.music",
						name: "Music Settings",
						Icon: "icon:settings.music",
						desc: "Adjusts settings for music playback from Audio CD, Alto™, and Jellyfin.",
					},
					{
						id: "system.settings.theme",
						name: "Theme Settings",
						Icon: "icon:settings.theme",
						desc: "Adjusts theme settings for Tellyfin, including icons, background, and fonts.",
					},
					{
						id: "system.settings.interface",
						name: "Interface Settings",
						Icon: "icon:settings.plugins",
						desc: "Adjusts settings for the user interface.",
					},
					{
						id: "system.settings.video",
						name: "Video Settings",
						desc: "Adjusts settings for the MPV video player.",
						Icon: "icon:settings.video",
					},
					{
						id: "system.settings.media_server",
						name: "Media Server Connection Settings",
						desc: "Adjust settings for existing media server connections or connect to additional media servers.",
						Icon: "icon:settings.media_server",
					},
					{
						id: "system.settings.sound",
						name: "Sound Settings",
						Icon: "icon:settings.sound",
						desc: "Adjusts settings for audio devices and output formats.",
					},
					{
						id: "system.settings.display",
						name: "Display Settings",
						Icon: "icon:settings.display",
						desc: "Adjusts settings for display resolution and frame rate.",
					},
					{
						id: "system.settings.plugins",
						name: "Plug-in Settings",
						Icon: "icon:settings.plugins",
						desc: "Adjusts settings for plug-ins.",
					},
					{
						id: "system.settings.system",
						name: "System Settings",
						Icon: "icon:settings.system",
						desc: "Adjusts settings for and displays information about the system.",
					},
				],
			};
		case "system":
			return {
				content: [
					{
						id: "system.power.shutdown",
						// name: "Power Off",
						name: "Exit Tellyfin",
						Icon: "icon:system.power_off",
						// desc: "Close all applications and turn off the system. Select this before unplugging the AC power cord.",
						desc: "Closes Tellyfin. Select this before unplugging the AC power cord.",
					},
					{
						id: "system.power.restart",
						name: "Restart",
						Icon: "icon:system.restart",
						// desc: "Close all applications and restart the system.",
						desc: "Closes and then re-opens Tellyfin.",
					},
					// { id: "system.power.sleep", name: "Enter Sleep Mode", Icon: "icon:system.sleep" },
				],
			};
		default:
			// TODO: Rust invoke
			return {
				content: [
					{
						id: "system.none",
						name: "No Content",
						Icon: "icon:system.unknown",
					}
				]
			};
	}
}

const libraryCatch = (error: unknown): { data: { Items: BaseItemDto[]; }; } => {
	console.error(error);
	return { data: { Items: [] } };
};

const librarySort = (a: BaseItemDto, b: BaseItemDto) =>
	a.CollectionType == "playlists" ? -1 : 0;

async function getXBarVideoContent(): Promise<CategoryContent> {
	const videoLibraries =
		(await jellyfin
			.getUserViewsApi(api)
			.getUserViews()
			.catch(libraryCatch)
			.then((value) =>
				value.data.Items?.filter((item) => {
					switch (item.CollectionType) {
						case "homevideos":
						case "boxsets":
						case "movies":
						case "playlists":
						case "tvshows":
							return true;
						case undefined:
							return true;
						default:
							return false;
					}
				}),
			)) ?? [];
	videoLibraries.sort(librarySort);
	const default_item = videoLibraries.findIndex(
		(item) => item.CollectionType != "playlists",
	);
	return {
		default_item: default_item > 0 ? default_item + 2 : 1,
		content: [
			{
				name: "Search",
				id: "system.search",
				Icon: "icon:general.search",
			},
			{
				name: "DVD Video - A really long title to test how the scrolly thingamy works!",
				id: "system.dvd",
				Icon: {
					src: "icon:video.dvd",
					width: 108,
					height: 108,
				},
			},
			...videoLibraries.map((item) => ({
				name: item.Name ?? "Unknown",
				desc: item.Overview ?? undefined,
				id: item.Id!,
				Icon: folderIconForCollectionType(item.CollectionType),
				jellyfin: true,
				jellyfin_data: item,
			})),
		],
	};
}

function folderIconForCollectionType(collection?: CollectionType) {
	switch (collection) {
		case "playlists":
			return "icon:general.playlist";
		case "tvshows":
		case "boxsets":
		case "livetv":
			return "icon:tv.folder";
		case "movies":
		case "trailers":
		case "homevideos":
			return "icon:video.folder";
		case "music":
		case "musicvideos":
			return "icon:music.folder";
		case "books":
		case "photos":
		case "unknown":
		case "folders":
		default:
			return;
	}
}

async function getXBarTVContent(): Promise<CategoryContent> {
	const tvLibraries =
		(await jellyfin
			.getUserViewsApi(api)
			.getUserViews()
			.catch(libraryCatch)
			.then((value) =>
				value.data.Items?.filter((item) => {
					// if (!item.CollectionType) return true;
					switch (item.CollectionType) {
						case "tvshows":
							return true;
						default:
							return false;
					}
				}),
			)) ?? [];
	tvLibraries.sort(librarySort);
	const default_item = tvLibraries.findIndex(
		(item) => item.CollectionType != "playlists",
	);
	return {
		default_item: default_item > 0 ? default_item + 1 : 1,
		content: [
			{
				name: "Search",
				id: "system.search",
				Icon: "icon:general.search",
			},
			...tvLibraries.map((item) => ({
				name: item.Name ?? "Unknown",
				desc: item.Overview ?? undefined,
				id: item.Id!,
				Icon: folderIconForCollectionType(item.CollectionType),
				jellyfin: true,
				jellyfin_data: item,
			})),
		],
	};
}

async function getXBarMusicContent(): Promise<CategoryContent> {
	const musicLibraries =
		(await jellyfin
			.getUserViewsApi(api)
			.getUserViews()
			.catch(libraryCatch)
			.then((value) =>
				value.data.Items?.filter((item) => {
					switch (item.CollectionType) {
						case "playlists":
						case "music":
							return true;
						default:
							return false;
					}
				}),
			)) ?? [];
	musicLibraries.sort(librarySort);
	const default_item = musicLibraries.findIndex(
		(item) => item.CollectionType != "playlists",
	);
	return {
		default_item: default_item > 0 ? default_item + 1 : 0,
		// default_item: 1,
		content: [
			// {
			// 	name: "Playlists (Alto)",
			// 	id: "music.alto.playlists",
			// 	Icon: "icon:general.playlist",
			// },
			{
				name: "Alto",
				desc: `Play music from your own collection with Alto™
				Alto is available free of charge and is fully integrated with Tellyfin.
				(To disable Alto features, open the menu and select “Hide Alto”)`,
				// Press Y/Triangle and select “Hide Alto” to not see this again.`,
				id: "music.alto",
				Icon: "icon:system/music.alto",
			},
			...musicLibraries.map((item) => ({
				name: item.Name ?? "Unknown",
				desc: item.Overview ?? undefined,
				id: item.Id!,
				Icon: folderIconForCollectionType(item.CollectionType),
				jellyfin: true,
				jellyfin_data: item,
			})),
		],
	};
}

async function getXBarPhotoContent(): Promise<CategoryContent> {
	const photoLibraries =
		(await jellyfin
			.getUserViewsApi(api)
			.getUserViews()
			.catch(libraryCatch)
			.then((value) =>
				value.data.Items?.filter((item) => {
					switch (item.CollectionType) {
						case "playlists":
						case "photos":
							return true;
						default:
							return false;
					}
				}),
			)) ?? [];
	photoLibraries.sort(librarySort);
	const default_item = photoLibraries.findIndex(
		(item) => item.CollectionType != "playlists",
	);
	return {
		default_item: default_item > 0 ? default_item : 0,
		content: [
			...photoLibraries.map((item) => ({
				name: item.Name ?? "Unknown",
				desc: item.Overview ?? undefined,
				id: item.Id!,
				Icon: folderIconForCollectionType(item.CollectionType),
				jellyfin: true,
				jellyfin_data: item,
			})),
		],
	};
}

async function getXBarLiveTVContent(): Promise<CategoryContent> {
	const liveTVSources =
		(await jellyfin
			.getUserViewsApi(api)
			.getUserViews()
			.catch(libraryCatch)
			.then((value) =>
				value.data.Items?.filter((item) => {
					switch (item.CollectionType) {
						case "livetv":
							return true;
						default:
							return false;
					}
				}),
			)) ?? [];
	liveTVSources.sort(librarySort);
	const default_item = liveTVSources.findIndex(
		(item) => item.CollectionType != "playlists",
	);
	return {
		default_item: default_item > 0 ? default_item : 0,
		content: [
			...liveTVSources.map((item) => ({
				name: item.Name ?? "Unknown",
				desc: item.Overview ?? undefined,
				id: item.Id!,
				Icon: folderIconForCollectionType(item.CollectionType),
				jellyfin: true,
				jellyfin_data: item,
			})),
		],
	};
}
