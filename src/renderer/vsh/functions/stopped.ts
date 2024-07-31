import api, { jellyfin } from "../context/Jellyfin";
import { TICKS_PER_SECOND } from "../util/functions";

export function jellyfinStopped(itemId: string, seconds?: number) {
	try {
		// window.electronAPI.invoke("clear_current_id");
		jellyfin.getPlaystateApi(api).onPlaybackStopped({
			// userId: auth.User!.Id!,
			itemId,
			positionTicks: seconds ? Math.round(seconds * TICKS_PER_SECOND) : undefined,
		})
	} catch (e) {
		console.error(e); // Doesn't matter!
	}
}