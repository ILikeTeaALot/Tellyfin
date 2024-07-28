import { useCallback, useContext, useEffect, useState } from "preact/hooks";
import { AppState } from "../AppStates";
import { VideoControlPanel, type VideoFunction } from "../components/ControlPanels";
import { ScreenProps } from "./common";
import { refresh_mpv } from "../util/functions";
import { Timeline } from "../components/Timeline";
import VideoState, { PlaybackStatus, VideoContextType, type MediaInfo } from "../context/VideoContext";
import { PauseIcon, PlayIcon, StopIcon } from "../Icons";
import { useInput } from "../hooks";
import { SceneSearch } from "../components/SceneSearch";
import { Dialog, DialogType } from "../components/Dialog";
import { StatusBar } from "../components/StatusBar";

const withoutSceneSearch: VideoFunction[] = ["SubtitleOptions", "Display"];

const withSceneSearch: VideoFunction[] = ["SceneSearch", ...withoutSceneSearch];

export function Video(props: ScreenProps) {
	// Props
	const { active, change_state: changeState } = props;
	// Context
	const state = useContext(VideoState);
	const playback_status = state.status.playbackStatus;
	const time = state.position.time;
	// State
	const [controlPanelActive, setPanelActive] = useState(false);
	const [displayVisible, setDisplayVisible] = useState(false); // Using terminology from the PS3.
	const [seekActive, setSeekActive] = useState(false);
	const [sceneSearchActive, setSceneSearchActive] = useState(false);
	const [exitConfirmActive, setExitConfirmActive] = useState(false);
	const closeAllPanels = useCallback(() => {
		setPanelActive(false);
		setSeekActive(false);
		setDisplayVisible(false);
		setSceneSearchActive(false);
		setExitConfirmActive(false);
	}, []);
	useEffect(() => {
		if (playback_status == PlaybackStatus.Stopped) {
			changeState(AppState.Home);
		}
	}, [playback_status, active, changeState]);
	useInput(active && (controlPanelActive || seekActive || sceneSearchActive), (button) => {
		switch (button) {
			case "Back":
			case "Backspace":
				setPanelActive(false);
				setSceneSearchActive(false);
				setSeekActive(false);
				return;
		}
	}, []);
	useInput(active && !(seekActive || sceneSearchActive || exitConfirmActive), (button) => {
		// If no tool other than control panel is open.
		switch (button) {
			case "t": // "t" for triangle
			case "Y":
				setPanelActive(v => !v);
				// refresh_mpv();
				break;
			case "d": // "d" for display
			case "Select":
				setDisplayVisible(v => !v);
				refresh_mpv();
				break;
		}
	}, []);
	useInput(active && !controlPanelActive && !exitConfirmActive, (button) => {
		switch (button) {
			case "x": // Self explanatory
			case "X":
				closeAllPanels();
				setSceneSearchActive(true);
				break;
		}
	}, [closeAllPanels]);
	useInput(active && controlPanelActive, (button) => {
		switch (button) {
			case "Back":
			case "Backspace":
				setPanelActive(false);
				// if (controlPanelActive) {
				// } else {
				// 	changeState(AppState.Home);
				// }
				break;
		}
	}, []);
	useInput(active && !controlPanelActive && !seekActive && !sceneSearchActive && !exitConfirmActive, (button) => {
		// console.log(button);
		switch (button) {
			case "Back":
			case "Backspace":
				setExitConfirmActive(true);
				break;
			case "Enter":
				window.electronAPI.invoke("transport_command", { command: "TogglePlay" }).then(() => {
					refresh_mpv();
				}, () => { });
				break;
			case "PadLeft":
				window.electronAPI.invoke("seek", { mode: "relative", seconds: -10 }).then(() => {
					console.log("Succeeded!");
				}, () => { });
				break;
			case "PadRight":
				window.electronAPI.invoke("seek", { mode: "relative", seconds: 10 }).then(() => {
					console.log("Succeeded!");
				}, () => { });
				break;
			default:
				break;
		}
	}, []);
	useEffect(() => {
		if (!active) {
			closeAllPanels();
		}
	}, [active, closeAllPanels]);
	const on_submit = useCallback((seconds: number) => {
		// if (state.jellyfin_data?.Chapters) {
		// 	const seconds = (state.jellyfin_data.Chapters[seconds].StartPositionTicks ?? -1) / TICKS_PER_SECOND;
		// 	if (seconds >= 0) window.electronAPI.invoke("seek", { mode: "absolute", seconds });
		// }
		if (seconds >= 0) window.electronAPI.invoke("seek", { mode: "absolute", seconds });
		closeAllPanels();
	}, [closeAllPanels]);
	const on_dialog_submit = useCallback((confirmed: boolean) => {
		if (confirmed) {
			window.electronAPI.invoke("transport_command", { command: "Stop" });
			changeState(AppState.Home);
		} else {
			setExitConfirmActive(false);
		}
	}, [changeState]);
	const on_cancel = useCallback(() => {
		closeAllPanels();
	}, [closeAllPanels]);
	const handle_panel_action = useCallback((action: string) => {
		switch (action) {
			case "SceneSearch":
				closeAllPanels();
				setSceneSearchActive(true);
				return;
			case "GoTo":
				closeAllPanels();
				setSeekActive(true);
				return;
			case "SubtitleOptions":
				window.electronAPI.invoke("transport_command", { command: action });
				// setPanelActive(false);
				return;
			case "AudioOptions":
				// setPanelActive(false);
				return;
			case "Display":
				setDisplayVisible(v => !v);
				return;
		}
	}, [closeAllPanels]);
	return (
		<div id="video-root">
			{/* <div>Video Controls</div> */}
			<VideoControlPanel active={controlPanelActive} onAction={handle_panel_action} options={
				(state.jellyfinData?.Chapters || state.chapters) ? withSceneSearch : withoutSceneSearch
			} />
			{/* <button onClick={() => props.change_state(AppState.Home)}>Go To Home</button>
			<div>Chapter Select</div>
			<div>Timeline</div> */}
			<div className="video-info" style={{ opacity: displayVisible || sceneSearchActive || seekActive ? 1 : 0 }}>
				<DiscIcon {...state.mediaType} />
				{displayTitle(state)}
				<StatusBar loading={playback_status == PlaybackStatus.Playing && displayVisible} show disable_mask />
			</div>
			<div className="video-timeline" style={{ opacity: displayVisible ? 1 : 0 }}>
				<div style={{ flexGrow: 1 }} />
				<Timeline realtime showChapter position={time.position} duration={time.duration} />
			</div>
			{state.jellyfinData || state.chapters ? <SceneSearch active={sceneSearchActive} data={state.jellyfinData ?? undefined} default={state.position.chapter || 0} onCancel={on_cancel} onSubmit={on_submit} /> : null}
			<div id="playback-status-indicator" className={PlaybackStatus[playback_status]} style={{
				opacity: (displayVisible || playback_status != PlaybackStatus.Playing) && active ? 1 : 0,
				transitionDelay: displayVisible ? "0s" : playback_status == PlaybackStatus.Playing ? "5s" : "0ms",
			}}>
				{statusIcon(playback_status)}
				{/* {playback_status}
				<span>Hello?</span> */}
			</div>
			<Dialog active={exitConfirmActive} onSubmit={on_dialog_submit} onCancel={on_cancel} type={DialogType.Confirm}>Do you want to stop playback?</Dialog>
		</div>
	);
}

function statusIcon(playback_status: PlaybackStatus) {
	switch (playback_status) {
		case PlaybackStatus.Stopped:
			return (
				<StopIcon width="64px" height="64px" style={{ translate: "0px -16px" }} />
			);
		case PlaybackStatus.Paused:
			return (
				<PauseIcon width="64px" height="32px" />
			);
		case PlaybackStatus.Playing:
			return (
				<PlayIcon width="64px" height="32px" />
			);
		default:
			return "Status Error";
	}
}

function displayTitle(state: VideoContextType) {
	if (state.mediaType) {
		switch (state.mediaType.type) {
			case "CD":
				return <span>{state.title ?? "CD"}</span>;
			case "DVD":
				return <span>{`${state.mediaType.name ?? state.mediaType.path} DVD Video`}</span>;
			case "BluRay":
				return <span>{`${state.mediaType.name ?? state.mediaType.path} Blu-ray`}</span>;
			case "Jellyfin":
				if (state.jellyfinData) {
					if (state.jellyfinData.Type) {
						switch (state.jellyfinData.Type) {
							// case "AggregateFolder":
							// case "Audio":
							// case "AudioBook":
							// case "BasePluginFolder":
							// case "Book":
							// case "BoxSet":
							// case "Channel":
							// case "ChannelFolderItem":
							// case "CollectionFolder":
							case "Episode":
								return <span>{state.jellyfinData.SeriesName} {state.jellyfinData.SeasonName}, Episode {state.jellyfinData.IndexNumber}: {state.jellyfinData.Name ?? state.title ?? state.filename ?? null}</span>;
							// case "Folder":
							// case "Genre":
							// case "ManualPlaylistsFolder":
							case "Movie":
								return <span>{state.jellyfinData.Name ?? state.title ?? state.filename ?? null}</span>;
							// case "LiveTvChannel":
							// case "LiveTvProgram":
							// case "MusicAlbum":
							// case "MusicArtist":
							// case "MusicGenre":
							case "MusicVideo":
								break;
							// case "Person":
							case "Photo":
							case "PhotoAlbum":
								break;
							// case "Playlist":
							// case "PlaylistsFolder":
							case "Program":
							case "Recording":
							case "Season":
							case "Series":
								break;
							// case "Studio":
							case "Trailer":
								break;
							// case "TvChannel":
							case "TvProgram":
								break;
							// case "UserRootFolder":
							// case "UserView":
							case "Video":
								break;
							// case "Year":
							default:
								break;
						}
					}
					return <span>{state.jellyfinData?.Name ?? state.title ?? state.filename ?? null}</span>;
				}

		}
	}
	return <span>{state.title ?? state.filename ?? null}</span>;
}

function DiscIcon(props: MediaInfo) {
	const style = { width: "1lh", height: "1lh" };
	switch (props.type) {
		case "CD":
			return <img src="/xb-icons/tex/item_tex_disc_icon.png" style={style} />;
		case "DVD":
			return <img src="/xb-icons/tex/item_tex_disc_dvd.png" style={style} />;
		case "BluRay":
			return <img src="/xb-icons/tex/item_tex_disc_bd.png" style={style} />;
		default:
			return null;
	}
}