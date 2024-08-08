import type { MediaInfo } from "~/shared/types/video";
import api, { jellyfin } from "../context/Jellyfin";

export async function playFile(file: string, start_position = 0, infoId?: MediaInfo) {
	return window.electronAPI.invoke("play_file", { file, infoId, start: start_position }).then(() => {
		window.electronAPI.invoke("transport_command", { command: "Play" });
		// mutate<VideoContextType>("mpv_state", (current) => {
		// 	if (current) {
		// 		return { ...current, jellyfin_data: info ?? null };
		// 	}
		// });
		if (infoId?.type == "Jellyfin") {
			// jellyfin.getPlaystateApi(api).reportPlaybackStart({});
			jellyfin.getPlaystateApi(api).onPlaybackStart({
				// userId: auth.User!.Id!,
				itemId: infoId.id,
			});
		}
	});
}