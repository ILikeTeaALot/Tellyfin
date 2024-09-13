import { TICKS_PER_SECOND } from "../util/functions";

export function jellyfinUpdatePosition(serverId: string | number, itemId: string, position: number, isPaused: boolean) {
	window.playStateAPI.onPlaybackProgress(serverId, {
		// userId: auth.User!.Id!,
		itemId,
		playMethod: "DirectPlay",
		isPaused,
		positionTicks: Math.round(position * TICKS_PER_SECOND),
	}).catch(console.error);
}