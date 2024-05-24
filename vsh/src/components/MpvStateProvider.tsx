import * as jellyfin from "@jellyfin/sdk/lib/utils/api";
import { ComponentChildren, createContext } from "preact";
import VideoState, { PlaybackStatus, VideoContextType, defaultVideoState } from "../context/VideoContext";
import { invoke } from "@tauri-apps/api/core";
import useSWR, { type KeyedMutator } from "swr";
import { useEffect, useState } from "preact/hooks";
import api, { auth } from "../context/Jellyfin";
import { TICKS_PER_SECOND } from "../util/functions";
import { listen, type Event } from "@tauri-apps/api/event";

type MpvEvent = Object & ("Shutdown" | "GetPropertyReply" | "StartFile" | { "EndFile"?: number; "ClientMessage"?: Array<string>; "PropertyChange"?: { name: string, change: any; reply_userdata: number; }; } | "FileLoaded" | "VideoReconfig" | "AudioReconfig" | "Seek" | "PlaybackRestart" | "QueueOverflow" | "Deprecated");

export const MutateContext = createContext<KeyedMutator<VideoContextType>>(async () => undefined);

function refreshInterval(latest?: VideoContextType) {
	if (!latest) return 10 * 1000;
	if (latest.status.playback_status == PlaybackStatus.Stopped) {
		return 0;
	} else {
		return 10 * 1000;
	}
}

export function MpvStateProvider(props: { children?: ComponentChildren; }) {
	const [videoState, setVideoState] = useState(defaultVideoState);
	const mpvState = useSWR("mpv_state", () => (invoke<VideoContextType>("mpv_status")), { fallbackData: defaultVideoState, refreshInterval });
	const { data, mutate } = mpvState;
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
	useEffect(() => {
		function handler(e: Event<MpvEvent>) {
			const { payload } = e;
			console.log("MPV Event:", payload);
			if (typeof payload == "string") {
				switch (payload) {
					case "Shutdown":
					case "GetPropertyReply":
						break;
					case "StartFile":
						mutate(current => current ? {
							...current, status: { ...current?.status, playback_status: PlaybackStatus.Stopped }
						} : current);
						break;
					case "FileLoaded":
						mutate();
						break;
					case "VideoReconfig":
					case "AudioReconfig":
						break;
					case "Seek":
						mutate();
						break;
					case "PlaybackRestart":
					case "QueueOverflow":
					case "Deprecated":
				}
			} else {
				if (payload["EndFile"]) {
					mutate(current => current ? {
						...current, status: { ...current.status, playback_status: PlaybackStatus.Stopped }
					} : current);
				} else if (payload["PropertyChange"]) {
					const change = payload["PropertyChange"].change;
					switch (payload["PropertyChange"].name) {
						case "pause":
							mutate(current => current ? {
								...current, status: {...current.status, playback_status: (change as boolean) ? PlaybackStatus.Paused : PlaybackStatus.Playing }
							} : current);
							break;
						default:
							break;
					}
				} else if (payload["ClientMessage"]) {

				}
			}
		}
		const unlisten = listen<MpvEvent>("mpv-event", handler);
		return async () => (await unlisten)();
	}, []);
	return (
		<VideoState.Provider value={videoState}>
			<MutateContext.Provider value={mutate}>
				{props.children}
			</MutateContext.Provider>
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