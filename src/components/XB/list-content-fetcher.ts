import type { CategoryContent } from "./content-fetcher";

export async function getXBListContent([_, path]: ["xb-list", string]): Promise<CategoryContent> {
	const category = path.split(".");
	console.log(category);
	switch (category[0]) {
		case "network":
		case "social":
		case "games":
			return { content: [] };
		case "system":
			switch (category[1]) {
				case "settings":
					return getSettingsContent(category[2]);
				// return {
				// 	default_item: 1,
				// 	content: [
				// 		{ id: "system.settings.update", name: "Check for Updates", Icon: "/xb-icons/icon_update.png" },
				// 		{ id: "system.settings.music", name: "Music Settings", Icon: "/xb-icons/icon_music_setting.png" },
				// 		{ id: "system.settings.theme", name: "Theme Settings", Icon: "/xb-icons/icon_theme_setting.png" },
				// 		{ id: "system.settings.video", name: "Video Settings", Icon: "/xb-icons/icon_bdvd_setting.png" },
				// 		{ id: "system.settings.server", name: "Media Server Connection Settings", Icon: "/xb-icons/icon_network_setting.png" },
				// 		{ id: "system.settings.sound", name: "Sound Settings", Icon: "/xb-icons/icon_sound_setting.png" },
				// 		{ id: "system.settings.display", name: "Display Settings", Icon: "/xb-icons/icon_display_setting.png" },
				// 	]
				// };
				default:
					return { content: [] };
			}
		default:
			// TODO: Rust invoke
			return { content: [] };
	}
}

async function getSettingsContent(key: string): Promise<CategoryContent> {
	switch (key) {
		case "update":
			return { content: [] };
		case "music":
			return {
				content: [
					{ id: "system.settings.music.preferred_library", name: "Preferred Library", desc: "Sets the preferred music library content listed under the [Music] category.", Icon: "/xb-icons/setting/tex_sett.png" },
					{ id: "system.settings.music.cd_import", name: "Audio CD Import", desc: "Sets the codec and bit rate when importing audio CDs.", Icon: "/xb-icons/setting/tex_sett.png" },
					{ id: "system.settings.music.crossfade", name: "Crossfade Playback", desc: "Sets the amount of time that is crossfaded (overlapped) between music tracks. This setting is used when playing content other than CD Audio.", Icon: "/xb-icons/setting/tex_sett.png" },
					{ id: "system.settings.music.output_freq", name: "Output Frequency", desc: "Sets the audio output frequency when playing music content.", Icon: "/xb-icons/setting/tex_sett.png" },
					{ id: "system.settings.music.bitmapping", name: "Bitmapping", desc: "Honestly I care about audio but even I don't know what this does.", Icon: "/xb-icons/setting/tex_sett.png" },
				]
			};
		case "theme":
			return { content: [] };
		case "video":
			return {
				content: [
					{ id: "system.settings.video.24hz", name: "1080p 24 Hz HDMI Video Output", desc: "Sets the playback method for content recorded at 24 Hz (frames/second).", Icon: "/xb-icons/setting/tex_sett.png" },
					{ id: "system.settings.video.auto_play", name: "Auto Play", desc: "Automatically play the next episode of a TV Series.", Icon: "/xb-icons/setting/tex_sett.png" },
				]
			};
		case "server":
			return {
				content: [
					{ id: "system.settings.server.add_server", name: "Add Media Server Connection", Icon: "/xb-icons/setting/tex_sett.png" },
				]
			};
		case "sound":
			return {
				content: [
					{ id: "system.settings.sound.output", name: "Audio Output Settings", desc: "Adjust the audio output settings for the system.", Icon: "/xb-icons/setting/tex_sett.png" },
					// { id: "system.settings.sound.multi_out", name: "Audio Multi-Output", desc: "Sets to output audio through multiple connectors simultaneously.", Icon: "/xb-icons/setting/tex_sett.png" },
					{ id: "system.settings.sound.key_tone", name: "Key Tone", desc: "Sets whether or not to use key tones when navigating Tellyfin.", Icon: "/xb-icons/setting/tex_sett.png" },
				]
			};
		case "display":
			return { content: [] };
	}
	return { content: [] };
}