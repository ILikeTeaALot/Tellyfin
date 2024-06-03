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
				]
			};
		case "theme":
			return { content: [] };
		case "video":
			return {
				content: [
					{ id: "system.settings.video.auto_play", name: "Auto Play", desc: "Automatically play the next episode of a TV Series.", Icon: "/xb-icons/setting/tex_sett.png" },
				]
			};
		case "server":
			return {
				content: [
					{ id: "system.settings.server.add_server", name: "Add Media Server Connection", Icon: "/xb-icons/setting/tex_sett.png" },
				]
			};
		case "display":
			return { content: [] };
	}
	return { content: [] };
}