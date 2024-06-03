import api, { jellyfin } from "../context/Jellyfin";

export function jellyfinStopped(itemId: string) {
	jellyfin.getPlaystateApi(api).onPlaybackStopped({
		// userId: auth.User!.Id!,
		itemId,
	});
}