import { invoke } from "@tauri-apps/api/core";
import { mutate } from "swr";
import type { VideoContextType } from "../context/VideoContext";
import api, { auth, jellyfin } from "../context/Jellyfin";

export function playFile(file: string, jellyfinId?: string) {
	invoke("play_file", { file, jellyfinId }).then(() => {
		invoke("transport_command", { function: "Play" });
		if (jellyfinId) {
			jellyfin.getPlaystateApi(api).onPlaybackStart({
				userId: auth.User!.Id!,
				itemId: jellyfinId,
			});
		}
	});
}