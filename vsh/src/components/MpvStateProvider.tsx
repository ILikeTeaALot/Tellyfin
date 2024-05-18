import * as jellyfin from "@jellyfin/sdk/lib/utils/api";
import { ComponentChildren } from "preact";
import VideoState, { VideoContextType, defaultVideoState } from "../context/VideoContext";
import { invoke } from "@tauri-apps/api/core";
import useSWR from "swr";
import { useEffect, useState } from "preact/hooks";
import api, { auth } from "../context/Jellyfin";
import { TICKS_PER_SECOND } from "../util/functions";

export function MpvStateProvider(props: { children?: ComponentChildren; }) {
	const [videoState, setVideoState] = useState(defaultVideoState);
	const mpvState = useSWR("mpv_state", () => (invoke("mpv_status") as Promise<VideoContextType>), { fallbackData: defaultVideoState, refreshInterval: 3000 });
	const { data } = mpvState;
	useEffect(() => {
		if (data) {
			if (!data.jellyfin_data) {
				if (data.jellyfin_id) {
					jellyfin.getItemsApi(api).getItemsByUserId({
						ids: [data.jellyfin_id],
						userId: auth.User!.Id!,
						fields: ["ItemCounts", "PrimaryImageAspectRatio", "BasicSyncInfo", "MediaSourceCount", "Overview", "Path", "SpecialEpisodeNumbers", "MediaStreams", "OriginalTitle", "MediaSourceCount", "MediaSources", "Chapters"]
					}).then(value => {
						if (value.data.Items) {
							let jellyfin_data = value.data.Items[0];
							setVideoState(current => ({ ...current, jellyfin_data }));
						}
					});
				}
			}
			setVideoState(current => ({
				...current,
				...data,
			}));
		}
	}, [data]);
	return (
		<VideoState.Provider value={videoState}>
			{props.children}
			<div style={{ position: "fixed", bottom: 0, right: 0, width: "100vw", lineBreak: "anywhere" }}>
				{/* <div>
					{JSON.stringify(videoState ?? {})}
				</div> */}
				{/* <div>{JSON.stringify(videoState.chapters)}</div>
				<div>{videoState.jellyfin_data?.Chapters?.map(chapter => (
					<div>
						<div>Name: {chapter.Name}</div>
						<div>Start: {(chapter.StartPositionTicks!) / TICKS_PER_SECOND}</div>
						<div>Image: {chapter.ImageTag}</div>
					</div>
				)) ?? "No Jellyfin Data"}</div> */}
			</div>
		</VideoState.Provider>
	);
}