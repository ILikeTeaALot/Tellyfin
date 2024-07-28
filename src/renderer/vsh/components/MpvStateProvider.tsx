import { ComponentChildren, createContext } from "preact";
import VideoState, { PlaybackStatus, VideoContextType, defaultVideoState } from "../context/VideoContext";
import useSWR, { type KeyedMutator } from "swr";
import { useEffect, useState } from "preact/hooks";
import api, { auth, jellyfin } from "../context/Jellyfin";
import { jellyfinUpdatePosition } from "../functions/update";
import { jellyfinStopped } from "../functions/stopped";
import { reinitAudioSystem } from "../context/AudioFeedback";
import type { MpvEvent } from "~/shared/events/mpv";
import type { IpcRendererEvent } from "electron";

export const MutateContext = createContext<KeyedMutator<VideoContextType>>(async () => undefined);

function refreshInterval(latest?: VideoContextType) {
	if (!latest) return 10 * 1000;
	if (latest.status.playbackStatus == PlaybackStatus.Stopped) {
		return 0;
		// return 60 * 1000;
	} else {
		return 10 * 1000;
	}
}

export function MpvStateProvider(props: { children?: ComponentChildren; }) {
	const [videoState, setVideoState] = useState(defaultVideoState);
	const mpvState = useSWR("mpv_state", () => (window.electronAPI.invoke<VideoContextType>("mpv_status")), { fallbackData: defaultVideoState, refreshInterval });
	const { data, mutate } = mpvState;
	useEffect(() => {
		if (data) {
			if (!data.jellyfinData) {
				if (data?.mediaType?.type == "Jellyfin") {
					jellyfin.getItemsApi(api).getItems({
						ids: [data.mediaType.id],
						userId: auth.User!.Id!,
						fields: ["MediaSourceCount", "Overview", "Path", "SpecialEpisodeNumbers", "MediaStreams", "OriginalTitle", "MediaSourceCount", "MediaSources", "Chapters"]
					}).then(value => {
						if (value.data.Items) {
							let jellyfin_data = value.data.Items[0];
							setVideoState(current => ({ ...current, jellyfinData: jellyfin_data }));
						}
					});
					if (data.status.playbackStatus == PlaybackStatus.Stopped) {
						// reinitAudioSystem();
						jellyfinStopped(data.mediaType.id);
					} else {
						jellyfinUpdatePosition(data.mediaType.id, data.position.time.position, data.status.playbackStatus == PlaybackStatus.Paused);
					}
				}
			}
			setVideoState(current => ({
				...current,
				...data,
			}));
		}
	}, [data]);
	const playback_status = data?.status?.playbackStatus;
	useEffect(() => {
		if (playback_status == PlaybackStatus.Stopped) {
			window.electronAPI.invoke("play_background");
		} else {
			window.electronAPI.invoke("stop_background");
		}
	}, [playback_status]);
	useEffect(() => {
		switch (playback_status) {
			case PlaybackStatus.Stopped:
				window.electronAPI.invoke("reinit_bass");
				break;
			case PlaybackStatus.Paused:
				break;
			case PlaybackStatus.Playing:
				window.electronAPI.invoke("stop_background");
				break;
		}
	}, [playback_status]);
	useEffect(() => {
		function handler(_: IpcRendererEvent, payload: MpvEvent) {
			console.log("MPV Event:", payload);
			switch (payload.event) {
				case "Shutdown":
				case "GetPropertyReply":
					break;
				case "StartFile":
					mutate(current => current ? {
						...current, status: { ...current?.status, playbackStatus: PlaybackStatus.Stopped }
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
					break;
				case "EndFile":
					reinitAudioSystem();
					mutate(current => {
						if (current) {
							if (current.mediaType?.type == "Jellyfin") {
								jellyfinStopped(current.mediaType.id);
							}
							return {
								...current, status: { ...current.status, playbackStatus: PlaybackStatus.Stopped }
							};
						} else {
							return current;
						}
					});
					break;
				case "ClientMessage":
					break;
				case "PropertyChange":
					const change = payload.propertyChange.change;
					switch (payload.propertyChange.name) {
						case "pause":
							// reinitAudioSystem();
							mutate(current => current ? {
								...current, status: { ...current.status, playbackStatus: (change as boolean) ? PlaybackStatus.Paused : PlaybackStatus.Playing }
							} : current);
							break;
						default:
							break;
					}
					break;
			}
		}
		const unlisten = window.electronAPI.listenFor("mpv-event", handler);
		return async () => unlisten();
	}, [mutate]);
	return (
		<VideoState.Provider value={videoState}>
			<MutateContext.Provider value={mutate}>
				{props.children}
			</MutateContext.Provider>
			<div style={{ position: "fixed", bottom: 0, right: 0, width: "100vw", lineBreak: "anywhere" }}>
				{/* <div>
					{JSON.stringify(mpvState?.data.status ?? {})}
				</div> */}
				{/* <div>
					{JSON.stringify(videoState ?? {})}
				</div> */}
				{/* <div>
					{JSON.stringify(videoState.tracks ?? [])}
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