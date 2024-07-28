import api, { jellyfin } from "../context/Jellyfin";
import type { MediaInfo } from "../context/VideoContext";

export async function playFile(file: string, jellyfinId?: MediaInfo) {
	return window.electronAPI.invoke("play_file", { file, jellyfinId }).then(() => {
		window.electronAPI.invoke("transport_command", { command: "Play" });
		// mutate<VideoContextType>("mpv_state", (current) => {
		// 	if (current) {
		// 		return { ...current, jellyfin_data: info ?? null };
		// 	}
		// });
		if (jellyfinId?.type == "Jellyfin") {
			// jellyfin.getPlaystateApi(api).reportPlaybackStart({});
			jellyfin.getPlaystateApi(api).onPlaybackStart({
				// userId: auth.User!.Id!,
				itemId: jellyfinId.id,
			});
		}
	});
}