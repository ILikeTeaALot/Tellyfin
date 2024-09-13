import { TICKS_PER_SECOND } from "../util/functions";

export function jellyfinStopped(serverId: string | number, itemId: string, playSessionId?: string, seconds?: number) {
	try {
		// window.electronAPI.clearNowPlayingId();
		window.playStateAPI.onPlaybackStopped(serverId, {
			// userId: auth.User!.Id!,
			itemId,
			playSessionId,
			positionTicks: seconds ? Math.round(seconds * TICKS_PER_SECOND) : undefined,
		})
	} catch (e) {
		console.error(e); // Doesn't matter!
	}
}