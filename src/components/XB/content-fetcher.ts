/** This is unlikely to be the permanent way this is done */

import type { JSX } from "preact";
import type { ContentItem } from "../Content/types";
import api, { jellyfin } from "../../context/Jellyfin";

export interface XBItem extends ContentItem {
	Icon?: (() => JSX.Element) | string | { width: number; height: number; src: string; };
	desc?: string;
	/** E.g. current setting/option value */
	value?: string | number;
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
			return { content: [] };
		case "games":
			return {
				content: [
					{ id: "com.steampowered", name: "Steam", desc: "Your Steam library – Coming soon!", Icon: "/SteamFolder5.png" },
				]
			};
		case "services":
			return {
				content: [
					{ id: "org.tellyfin.invidious", name: "Youtube", desc: "Via Invidious – Coming soon!", Icon: "/xb-icons/youtube/white/youtube_social_squircle_white.png" },
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
					{ id: "system.settings.home", name: "Customise Home", Icon: "/xb-icons/setting/tex_sett.png", desc: "Customise the order and visibility of XBar Categories." },
					{ id: "system.settings.music", name: "Music Settings", Icon: "/xb-icons/setting/tex_music.png", desc: "Adjusts settings for music playback from Audio CD, Alto™, and Jellyfin." },
					{ id: "system.settings.theme", name: "Theme Settings", Icon: "/xb-icons/setting/tex_theme.png", desc: "Adjusts theme settings for Tellyfin, including icons, background, and fonts." },
					{ id: "system.settings.video", name: "Video Settings", desc: "Adjusts settings for the MPV video player.", Icon: "/xb-icons/setting/tex_bddvd.png" },
					{ id: "system.settings.media_server", name: "Media Server Connection Settings", desc: "Adjust settings for existing media server connections or connect to additional media servers.", Icon: "/xb-icons/setting/tex_network.png" },
					{ id: "system.settings.sound", name: "Sound Settings", Icon: "/xb-icons/setting/tex_sound.png", desc: "Adjusts settings for audio devices and output formats." },
					{ id: "system.settings.display", name: "Display Settings", Icon: "/xb-icons/setting/tex_display.png", desc: "Adjusts settings for display resolution and frame rate." },
					{ id: "system.settings.plugins", name: "Plug-in Settings", Icon: "/xb-icons/setting/tex_console.png", desc: "Adjusts settings for plug-ins." },
					{ id: "system.settings.system", name: "System Settings", Icon: "/xb-icons/setting/tex_console.png", desc: "Adjusts settings for and displays information about the system." },
				]
			};
		case "system":
			return {
				content: [
					{ id: "system.power.shutdown", name: "Power Off", Icon: "/xb-icons/icon_power_off.png", desc: "Close all applications and turn off the system. Select this before unplugging the AC power cord." },
					{ id: "system.power.restart", name: "Restart", Icon: "/xb-icons/icon_update.png", desc: "Close all applications and restart the system." },
					// { id: "system.power.sleep", name: "Enter Sleep Mode", Icon: "/xb-icons/icon_display_setting.png" },
				]
			};
		default:
			// TODO: Rust invoke
			return { content: [] };
	}
}

const libraryCatch = () => ({ data: { Items: [] } });

async function getXBarVideoContent(): Promise<CategoryContent> {
	const videoLibraries = await jellyfin.getLibraryApi(api).getMediaFolders().catch(libraryCatch).then(value => value.data.Items?.filter(item => {
		switch (item.CollectionType) {
			case "homevideos":
			case "boxsets":
			case "movies":
			case "playlists":
				return true;
			case undefined:
				return true;
			default:
				return false;
		}
	})) ?? [];
	videoLibraries.sort((a, b) => a.CollectionType == "playlists" ? -1 : 0);
	const default_item = videoLibraries.findIndex(item => item.CollectionType != "playlists");
	return {
		default_item: default_item > 0 ? default_item + 1 : 1,
		content: [
			{
				name: "Search",
				id: "system.search",
				Icon: "/xb-icons/tex/tex_kensaku.png",
			},
			...videoLibraries.map(item => ({
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
	const tvLibraries = await jellyfin.getLibraryApi(api).getMediaFolders().catch(libraryCatch).then(value => value.data.Items?.filter(item => {
		// if (!item.CollectionType) return true;
		switch (item.CollectionType) {
			case "tvshows":
				return true;
			default:
				return false;
		}
	})) ?? [];
	const default_item = tvLibraries.findIndex(item => item.CollectionType != "playlists");
	return {
		default_item: default_item > 0 ? default_item + 1 : 1,
		content: [
			{
				name: "Search",
				id: "system.search",
				Icon: "/xb-icons/tex/tex_kensaku.png",
			},
			...tvLibraries.map(item => ({
				name: item.Name ?? "Unknown",
				desc: item.Overview ?? undefined,
				id: item.Id!,
				Icon: item.CollectionType ? item.CollectionType == "playlists" ? "/xb-icons/tex/tex_playlist.png" : "/tv_tex_album_default.png" : undefined,
				jellyfin: true,
				jellyfin_data: item,
			}))
		]
	};
}

async function getXBarMusicContent(): Promise<CategoryContent> {
	const musicLibraries = await jellyfin.getLibraryApi(api).getMediaFolders().catch(libraryCatch).then(value => value.data.Items?.filter(item => {
		switch (item.CollectionType) {
			case "playlists":
			case "music":
				return true;
			default:
				return false;
		}
	})) ?? [];
	// const default_item = musicLibraries.findIndex(item => item.CollectionType != "playlists");
	return {
		// default_item: default_item > 0 ? default_item : 0,
		default_item: 1,
		content: [
			{
				name: "Playlists (Alto)",
				id: "music.alto.playlists",
				Icon: "/xb-icons/tex/tex_playlist.png",
			},
			{
				name: "Alto",
				desc: `Play music from your own collection with Alto™
				Alto is available free of charge and is fully integrated with Tellyfin.
				(To disable Alto features, open the menu and select “Hide Alto”)`,
				// Press Y/Triangle and select “Hide Alto” to not see this again.`,
				id: "music.alto",
				Icon: "/AltoIcon.png",
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
	const photoLibraries = await jellyfin.getLibraryApi(api).getMediaFolders().catch(libraryCatch).then(value => value.data.Items?.filter(item => {
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
	const liveTVSources = await jellyfin.getLibraryApi(api).getMediaFolders().catch(libraryCatch).then(value => value.data.Items?.filter(item => {
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