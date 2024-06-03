import api, { auth, jellyfin } from "../context/Jellyfin";

export function jellyfinStopped(itemId: string) {
	jellyfin.getPlaystateApi(api).onPlaybackStopped({
		userId: auth.current.User!.Id!,
		itemId,
	});
}