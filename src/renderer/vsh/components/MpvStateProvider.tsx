import { ComponentChildren, createContext } from "preact";
import VideoState, { PlaybackStatus, VideoContextType, defaultVideoState } from "../context/VideoContext";
import useSWR, { type KeyedMutator } from "swr";
import { useEffect, useState } from "preact/hooks";
import api, { auth, jellyfin } from "../context/Jellyfin";
import { jellyfinUpdatePosition } from "../functions/update";
import { jellyfinStopped } from "../functions/stopped";
import { reinitAudioSystem } from "../context/AudioFeedback";
import { mpv_end_file_reason, type MpvEvent } from "~/shared/events/mpv";
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
	const [DEBUG_TIME, setDebugTime] = useState(0); // eslint-disable-line
	const [videoState, setVideoState] = useState(defaultVideoState);
	const { data, mutate } = useSWR("mpv_state", () => (window.electronAPI.getMPVStatus()), { fallbackData: defaultVideoState, refreshInterval });
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
					}).catch(console.error);
					if (data.status.playbackStatus == PlaybackStatus.Stopped) {
						// reinitAudioSystem();
						jellyfinStopped(data.mediaType.id, data.mediaType.session, data.position.time.position);
						// window.electronAPI.transportCommand("Stop");
					} else {
						jellyfinUpdatePosition(data.mediaType.id, data.position.time.position, data.status.playbackStatus == PlaybackStatus.Paused);
					}
				}
			}
			if (data.jellyfinData && data.mediaType.type == "Jellyfin") {
				jellyfinUpdatePosition(data.mediaType.id, data.position.time.position, data.status.playbackStatus == PlaybackStatus.Paused);
				if (data.status.playbackStatus == PlaybackStatus.Stopped) {
					jellyfinStopped(data.mediaType.id, data.mediaType.session, data.position.time.position);
					// window.electronAPI.transportCommand("Stop");
				}
			}
			setDebugTime(data.position.time.position);
			setVideoState(current => ({
				...current,
				...data,
			}));
		}
	}, [data]);
	const playback_status = data?.status?.playbackStatus;
	useEffect(() => {
		if (playback_status == PlaybackStatus.Stopped) {
			window.electronAPI.transportCommand("Stop").then(() => {
				window.electronAPI.playBackground();
			})
		} else {
			window.electronAPI.stopBackground();
		}
	}, [playback_status]);
	useEffect(() => {
		switch (playback_status) {
			case PlaybackStatus.Stopped:
				window.setTimeout(() => reinitAudioSystem(), 2000);
				break;
			case PlaybackStatus.Paused:
			case PlaybackStatus.Playing:
				window.electronAPI.stopBackground();
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
						...current, status: { ...current?.status, playbackStatus: PlaybackStatus.Playing }
					} : current);
					break;
				case "FileLoaded":
					mutate(current => current ? {
						...current, status: { ...current?.status, playbackStatus: PlaybackStatus.Playing }
					} : current);
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
					window.setTimeout(() => reinitAudioSystem(), 2000);
					mutate(current => {
						if (current) {
							if (current.mediaType?.type == "Jellyfin" && payload.endFile == mpv_end_file_reason.MPV_END_FILE_REASON_EOF) {
								const position = current.position.time.position;
								const id = current.mediaType.id;
								const playSessionId = current.mediaType.id;
								setDebugTime(current.position.time.position);
								setTimeout(() => jellyfinStopped(id, playSessionId, position), 1000);
								window.electronAPI.transportCommand("Stop");
								// throw new Error(`Time: ${current.position.time.position}`);
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
					{toHMS(DEBUG_TIME)}
				</div> */}
				{/* <div>
					{JSON.stringify(videoState.position.time ?? {})}
				</div> */}
				{/* <div>
					{JSON.stringify(videoState.mediaType ?? {})}
				</div> */}
				{/* <div>
					{JSON.stringify(data?.audio ?? {})}
					{JSON.stringify(data?.tracks ?? {})}
				</div> */}
				{/* <div>
					{JSON.stringify(data?.mediaType ?? {})}
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