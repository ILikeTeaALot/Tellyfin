/** This is unlikely to be the permanent way this is done */

import type { JSX } from "preact";
import type { ContentItem } from "../Content/types";
import api, { jellyfin } from "../../context/Jellyfin";

export type XBItem = ContentItem & { Icon?: (() => JSX.Element) | string; desc?: string; };

type CategoryContent = {
	content: Array<XBItem>;
	default_item?: number;
};

export async function getXBarContent([_, category]: ["xb-category", string]): Promise<CategoryContent> {
	switch (category) {
		case "network":
		case "social":
		case "games":
			return { content: [] };
		case "video":
			return getXBarVideoContent();
		case "tv":
			return getXBarTVContent();
		case "music":
			return getXBarMusicContent();
		case "settings":
			return {
				default_item: 1,
				content: [
					{ id: "system.settings.update", name: "Check for Updates", Icon: "/xb-icons/icon_update.png" },
					{ id: "system.settings.music", name: "Music Settings", Icon: "/xb-icons/icon_music_setting.png" },
					{ id: "system.settings.theme", name: "Theme Settings", Icon: "/xb-icons/icon_theme_setting.png" },
					{ id: "system.settings.video", name: "Video Settings", Icon: "/xb-icons/icon_bdvd_setting.png" },
					{ id: "system.settings.server", name: "Media Server Connection Settings", Icon: "/xb-icons/icon_network_setting.png" },
					{ id: "system.settings.sound", name: "Sound Settings", Icon: "/xb-icons/icon_sound_setting.png" },
					{ id: "system.settings.display", name: "Display Settings", Icon: "/xb-icons/icon_display_setting.png" },
				]
			};
		case "power":
			return {
				content: [
					{ id: "system.power.shutdown", name: "Power Off", Icon: "/xb-icons/icon_power_off.png", desc: "Close all applications and turn off the system. Select this before unplugging the AC power cord." },
					{ id: "system.power.restart", name: "Restart", Icon: "/xb-icons/icon_update.png", desc: "Close all applications and restart the system." },
				]
			};
		default:
			// TODO: Rust invoke
			return { content: [] };
	}
}

async function getXBarVideoContent(): Promise<CategoryContent> {
	const tvLibraries = await jellyfin.getLibraryApi(api).getMediaFolders().then(value => value.data.Items?.filter(item => {
		switch (item.CollectionType) {
			case "playlists":
			case "movies":
				return true;
			default:
				return false;
		}
	})) ?? [];
	return {
		default_item: 0,
		content: [
			...tvLibraries.map(item => ({
				name: item.Name ?? "Unknown",
				id: item.Id!,
				Icon: item.CollectionType ? item.CollectionType == "playlists" ? "/xb-icons/icon_playlist.png" : "/xb-icons/icon_video_album_default.png" : undefined,
				jellyfin: true,
				jellyfin_data: item,
			}))
		]
	};
}

async function getXBarTVContent(): Promise<CategoryContent> {
	const tvLibraries = await jellyfin.getLibraryApi(api).getMediaFolders().then(value => value.data.Items?.filter(item => {
		if (!item.CollectionType) return true;
		switch (item.CollectionType) {
			case "playlists":
			case "tvshows":
				return true;
			default:
				return false;
		}
	})) ?? [];
	const default_item = tvLibraries.findIndex(item => item.CollectionType != "playlists");
	return {
		default_item: default_item > 0 ? default_item : 0,
		content: [
			...tvLibraries.map(item => ({
				name: item.Name ?? "Unknown",
				id: item.Id!,
				Icon: item.CollectionType ? item.CollectionType == "playlists" ? "/xb-icons/icon_playlist.png" :  "/xb-icons/icon_video_album_default.png" : undefined,
				jellyfin: true,
				jellyfin_data: item,
			}))
		]
	};
}

async function getXBarMusicContent(): Promise<CategoryContent> {
	return {
		default_item: 0,
		content: [
			{
				name: "Playlists",
				id: "playlists",
				Icon: "/xb-icons/icon_playlist.png",
			}
		]
	};
}