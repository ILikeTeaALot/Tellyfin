import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { AppState } from "../AppStates";
import { VideoControlPanel } from "../components/ControlPanels";
import { ScreenProps } from "./common";
import { invoke } from "@tauri-apps/api/core";
import { refresh_mpv } from "../util/functions";
import { Timeline } from "../components/Timeline";
import VideoState, { PlaybackStatus, VideoContextType } from "../context/VideoContext";
import { PauseIcon, PlayIcon, StopIcon } from "../Icons";
import { useInput } from "../hooks";
import { SceneSearch } from "../components/SceneSearch";
import { Dialog } from "../components/Dialog";

const withoutSceneSearch: VideoFunction[] = ["SubtitleOptions", "Display"];

const withSceneSearch: VideoFunction[] = ["SceneSearch", ...withoutSceneSearch];

export function Video(props: ScreenProps) {
	// Props
	const { active, change_state: changeState } = props;
	// Context
	const state = useContext(VideoState);
	const playback_status = state.status.playback_status;
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
				break;
		}
	}, []);
	useInput(active && !controlPanelActive && !seekActive && !sceneSearchActive && !exitConfirmActive, (button) => {
		switch (button) {
			case "Back":
			case "Backspace":
				setExitConfirmActive(true);
				break;
			case "Enter":
				invoke("transport_command", { function: "TogglePlay" }).then(() => {
					refresh_mpv();
				}, () => { });
				break;
			case "PadLeft":
				invoke("seek", { mode: "relative", seconds: -10 }).then(() => {
					console.log("Succeeded!");
				}, () => { });
				break;
			case "PadRight":
				invoke("seek", { mode: "relative", seconds: 10 }).then(() => {
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
		if (seconds >= 0) invoke("seek", { mode: "absolute", seconds });
		closeAllPanels();
	}, [closeAllPanels]);
	const on_dialog_submit = useCallback((confirmed: boolean) => {
		if (confirmed) {
			invoke("transport_command", { function: "Stop" });
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
				invoke("transport_command", { function: action });
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
			<VideoControlPanel active={controlPanelActive} onAction={handle_panel_action} options={
				state.jellyfin_data?.Chapters ? withSceneSearch : withoutSceneSearch
			} />
			<div className="video-info" style={{ opacity: displayVisible || sceneSearchActive || seekActive ? 1 : 0 }}>
				{displayTitle(state)}
			</div>
			<div className="video-timeline" style={{ opacity: displayVisible ? 1 : 0 }}>
				<div style={{ flexGrow: 1 }} />
				<Timeline realtime position={time.position} duration={time.duration} />
			</div>
			{state.jellyfin_data ? <SceneSearch active={sceneSearchActive} data={state.jellyfin_data} default={state.position.chapter || 0} onCancel={on_cancel} onSubmit={on_submit} /> : null}
			<div id="playback-status-indicator" className={PlaybackStatus[playback_status]} style={{
				opacity: (displayVisible || playback_status != PlaybackStatus.Playing) && active ? 1 : 0,
				transitionDelay: displayVisible ? "0s" : playback_status == PlaybackStatus.Playing ? "5s" : "0ms",
			}}>
				{statusIcon(playback_status)}
			</div>
			<Dialog active={exitConfirmActive} onSubmit={on_dialog_submit} onCancel={on_cancel}>Do you want to stop playback?</Dialog>
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
	if (state.jellyfin_data) {
		if (state.jellyfin_data.Type) {
			switch (state.jellyfin_data.Type) {
				case "Episode":
					return <span>{state.jellyfin_data.SeriesName} {state.jellyfin_data.SeasonName}, Episode {state.jellyfin_data.IndexNumber}: {state.jellyfin_data.Name ?? state.title ?? state.filename ?? null}</span>;
				case "Movie":
					return <span>{state.jellyfin_data.Name ?? state.title ?? state.filename ?? null}</span>;
				case "MusicVideo":
				case "Program":
				case "Recording":
				case "Season":
				case "Series":
				case "Trailer":
				case "Video":
					break;
				default:
					break;
			}
		}
		return <span>{state.jellyfin_data?.Name ?? state.title ?? state.filename ?? null}</span>;
	}
	return <span>{state.title ?? state.filename ?? null}</span>;
}