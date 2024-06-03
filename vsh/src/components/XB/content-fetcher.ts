/** This is unlikely to be the permanent way this is done */

import type { JSX } from "preact";
import type { ContentItem } from "../Content/types";
import api, { jellyfin } from "../../context/Jellyfin";

export interface XBItem extends ContentItem {
	Icon?: (() => JSX.Element) | string;
	desc?: string;
};

export type CategoryContent = {
	content: Array<XBItem>;
	default_item?: number;
	error?: string;
};

export async function getXBarContent([_, category]: ["xb-category", string]): Promise<CategoryContent> {
	switch (category) {
		case "network":
		case "social":
		case "games":
			return { content: [] };
		case "services":
			return {
				content: [
					{ id: "tv.dropout", name: "Dropout", desc: "Hopefully available in future?" },
					{ id: "tv.nebula", name: "Nebula", desc: "Yeah... IDK" },
					// { id: "org.invidious", name: "Youtube", desc: "Via Invidious\nComing soon!", Icon: "/invidious-colored-vector.svg" },
					{ id: "org.invidious", name: "Youtube", desc: "Via Invidious – Coming soon!", Icon: "/xb-icons/youtube/white/youtube_social_squircle_white.png" },
				]
			};
		case "video":
			return getXBarVideoContent();
		case "livetv":
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
					{ id: "system.settings.update", name: "Check for Updates", Icon: "/xb-icons/setting/tex_update.png", desc: "Connect to the internet and check for Tellyfin software updates." },
					{ id: "system.settings.music", name: "Music Settings", Icon: "/xb-icons/setting/tex_music.png", desc: "Adjusts settings for music playback from Audio CD, Alto™, and Jellyfin." },
					{ id: "system.settings.theme", name: "Theme Settings", Icon: "/xb-icons/setting/tex_theme.png", desc: "Adjusts theme settings for Tellyfin, including icons, background, and fonts." },
					{ id: "system.settings.video", name: "Video Settings", desc: "Adjusts settings for the MPV video player.", Icon: "/xb-icons/setting/tex_bddvd.png" },
					{ id: "system.settings.server", name: "Media Server Connection Settings", desc: "Adjust settings for existing media server connections or connect to additional media servers.", Icon: "/xb-icons/setting/tex_network.png" },
					{ id: "system.settings.sound", name: "Sound Settings", Icon: "/xb-icons/setting/tex_sound.png", desc: "Adjusts settings for audio devices and output formats." },
					{ id: "system.settings.display", name: "Display Settings", Icon: "/xb-icons/setting/tex_display.png", desc: "Adjusts settings for display resolution and frame rate." },
				]
			};
		case "system":
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
	const filmLibraries = await jellyfin.getLibraryApi(api).getMediaFolders().then(value => value.data.Items?.filter(item => {
		switch (item.CollectionType) {
			case "homevideos":
			case "boxsets":
			case "movies":
				return true;
			default:
				return false;
		}
	})) ?? [];
	return {
		default_item: 0,
		content: [
			...filmLibraries.map(item => ({
				name: item.Name ?? "Unknown",
				desc: item.Overview ?? undefined,
				id: item.Id!,
				Icon: item.CollectionType ? item.CollectionType == "playlists" ? "/xb-icons/tex/tex_playlist.png" : "/xb-icons/tex/video_tex_album_default.png" : undefined,
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
				desc: item.Overview ?? undefined,
				id: item.Id!,
				Icon: item.CollectionType ? item.CollectionType == "playlists" ? "/xb-icons/tex/tex_playlist.png" : "/xb-icons/tex/video_tex_album_default.png" : undefined,
				jellyfin: true,
				jellyfin_data: item,
			}))
		]
	};
}

async function getXBarMusicContent(): Promise<CategoryContent> {
	const musicLibraries = await jellyfin.getLibraryApi(api).getMediaFolders().then(value => value.data.Items?.filter(item => {
		switch (item.CollectionType) {
			case "playlists":
			case "music":
				return true;
			default:
				return false;
		}
	})) ?? [];
	return {
		default_item: 1,
		content: [
			{
				name: "Playlists (Alto)",
				id: "music.alto.playlists",
				Icon: "/xb-icons/tex/tex_playlist.png",
			},
			...musicLibraries.map(item => ({
				name: item.Name ?? "Unknown",
				desc: item.Overview ?? undefined,
				id: item.Id!,
				Icon: item.CollectionType ? item.CollectionType == "playlists" ? "/xb-icons/tex/tex_playlist.png" : "/xb-icons/tex/music_tex_album_default.png" : undefined,
				jellyfin: true,
				jellyfin_data: item,
			}))
		]
	};
}

async function getXBarPhotoContent(): Promise<CategoryContent> {
	const photoLibraries = await jellyfin.getLibraryApi(api).getMediaFolders().then(value => value.data.Items?.filter(item => {
		switch (item.CollectionType) {
			case "playlists":
			case "photos":
				return true;
			default:
				return false;
		}
	})) ?? [];
	const default_item = photoLibraries.findIndex(item => item.CollectionType != "playlists");
	return {
		default_item: default_item > 0 ? default_item : 0,
		content: [
			...photoLibraries.map(item => ({
				name: item.Name ?? "Unknown",
				desc: item.Overview ?? undefined,
				id: item.Id!,
				Icon: item.CollectionType ? item.CollectionType == "playlists" ? "/xb-icons/tex/tex_playlist.png" : "/xb-icons/tex/photo_tex_album_default.png" : undefined,
				jellyfin: true,
				jellyfin_data: item,
			}))
		]
	};
}

async function getXBarLiveTVContent(): Promise<CategoryContent> {
	const liveTVSources = await jellyfin.getLibraryApi(api).getMediaFolders().then(value => value.data.Items?.filter(item => {
		switch (item.CollectionType) {
			case "livetv":
				return true;
			default:
				return false;
		}
	})) ?? [];
	const default_item = liveTVSources.findIndex(item => item.CollectionType != "playlists");
	return {
		default_item: default_item > 0 ? default_item : 0,
		content: [
			...liveTVSources.map(item => ({
				name: item.Name ?? "Unknown",
				desc: item.Overview ?? undefined,
				id: item.Id!,
				Icon: item.CollectionType ? item.CollectionType == "playlists" ? "/xb-icons/tex/tex_playlist.png" : "/xb-icons/tex/photo_tex_album_default.png" : undefined,
				jellyfin: true,
				jellyfin_data: item,
			}))
		]
	};
}