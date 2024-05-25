import api, { auth, jellyfin } from "../context/Jellyfin";
import { TICKS_PER_SECOND } from "../util/functions";

export function jellyfinUpdatePosition(itemId: string, position: number, isPaused: boolean) {
	jellyfin.getPlaystateApi(api).onPlaybackProgress({
		userId: auth.User!.Id!,
		itemId,
		playMethod: "DirectPlay",
		isPaused,
		positionTicks: position * TICKS_PER_SECOND,
	})
}