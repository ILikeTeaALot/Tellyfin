import type { UserSettings } from "../../settings/types";
import type { CategoryContent } from "./content-fetcher";

// This will be moving to the same getXMLListContent as SettingLists
export async function getXBListContent([_, path]: ["xb-list", string]): Promise<CategoryContent> {
	const category = path.split(".");
	console.log(category);
	switch (category[0]) {
		case "network":
		case "social":
		case "games":
			return { content: [] };
		case "system":
		default:
			// TODO: Rust invoke
			return { content: [] };
	}
}

/**
 * @deprecated Now unsused – Settings are XML files per category.
 * @param key settings key to get list content for
 * @param settings reference to current settings
 * @returns list of setting items in the proper format for an XBList
 */
export async function getSettingsContent(key: string, settings: UserSettings): Promise<CategoryContent> {
	switch (key) {
		case "update":
			return { content: [] };
		case "music":
			return {
				content: [
					{ id: "system.settings:music.preferred_library", name: "Preferred Library", desc: "Sets the preferred music library content listed under the [Music] category.", Icon: "/xb-icons/setting/tex_sett.png", /* value: await manager.get("music.preferred_library") */ value: settings?.music?.preferred_library },
					{
						id: "system.settings:music.cd_import",
						name: "Audio CD Import",
						desc: "Sets the codec and bit rate when importing audio CDs.",
						Icon: "/xb-icons/setting/tex_sett.png",
						/* value: "FLAC" */
						/* value: await manager.get("music.cd_import").then(value => [value.format, value.bitrate ?? value.vbr ? "Variable" : null] as const).then(arr => arr.filter(v => v).join(" ")) */
						value: [settings.music.cd_import.format, settings.music.cd_import.bitrate ?? settings.music.cd_import.vbr ? "Varable Bitrate" : null].filter(v => v).join(" ")
					},
					{ id: "system.settings:music.crossfade", name: "Crossfade Playback", desc: "Sets the amount of time that is crossfaded (overlapped) between music tracks. This setting is used when playing content other than CD Audio.", Icon: "/xb-icons/setting/tex_sett.png", /* value: "Off" */ /* value: await manager.get("music.crossfade") || "Off" */ value: settings?.music?.crossfade == 0 ? "Off" : `${settings?.music?.crossfade} Seconds` },
					{ id: "system.settings:music.output_freq", name: "Output Frequency", desc: "Sets the audio output frequency when playing music content.\nRecommended: Auto or Upsample", Icon: "/xb-icons/setting/tex_sett.png", /* value: "Auto" */ value: settings?.music?.output_freq },
					// { id: "system.settings:music.bitmapping", name: "Bitmapping", desc: "Honestly I care about audio but even I don't know what this does. “Set this according to your preference”??? HOW? IT WAS SUPER PAINFUL TO CHANGE MUSIC SETTINGS BETWEEN PLAYING TRACKS ON THE PS3!", Icon: "/xb-icons/setting/tex_sett.png", value: "Type 1" },
				]
			};
	}
	return { content: [] };
}

export async function getXMLListContent(key: string) {
	const parser = new DOMParser();
	const data = /* await */ fetch(`/data/${key.replace(/\./g, "/")}.xml?t=${Date.now()}`)
		.then(res => res.text())
		// "application/xml" would be valid too, but as it is coming from res.text(), this feels right.
		.then(text => parser.parseFromString(text, "text/xml") as XMLDocument);
	// data.evaluate("", data.getRootNode());
	return data;
}