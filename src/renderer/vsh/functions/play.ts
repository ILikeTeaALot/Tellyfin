import type { MediaInfo } from "~/shared/types/video";

export async function playFile(serverId: string | number, file: string, start_position = 0, infoId?: MediaInfo) {
	return window.electronAPI.playFile(file, infoId, start_position).then(() => {
		window.electronAPI.transportCommand("Play");
		// mutate<VideoContextType>("mpv_state", (current) => {
		// 	if (current) {
		// 		return { ...current, jellyfin_data: info ?? null };
		// 	}
		// });
		if (infoId?.type == "Jellyfin") {
			// jellyfin.getPlaystateApi(api).reportPlaybackStart({});
			window.playStateAPI.onPlaybackStart(serverId, {
				// userId: auth.User!.Id!,
				itemId: infoId.id,
			});
		}
	});
}