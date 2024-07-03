import { invoke } from "@tauri-apps/api/core";
import api, { jellyfin } from "../context/Jellyfin";

export function playFile(file: string, jellyfinId?: string) {
	invoke("play_file", { file, jellyfinId }).then(() => {
		invoke("transport_command", { function: "Play" });
		// mutate<VideoContextType>("mpv_state", (current) => {
		// 	if (current) {
		// 		return { ...current, jellyfin_data: info ?? null };
		// 	}
		// });
		if (jellyfinId) {
			// jellyfin.getPlaystateApi(api).reportPlaybackStart({});
			jellyfin.getPlaystateApi(api).onPlaybackStart({
				// userId: auth.User!.Id!,
				itemId: jellyfinId,
			});
		}
	});
}