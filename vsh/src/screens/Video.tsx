import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { AppState } from "../AppStates";
import { VideoControlPanel } from "../components/ControlPanels";
import { ScreenProps } from "./common";
import { invoke } from "@tauri-apps/api/core";
import { refresh_mpv } from "../util/functions";
import { Timeline } from "../components/Timeline";
import VideoState, { PlaybackStatus, VideoContextType } from "../context/VideoContext";
import { PauseIcon, PlayIcon, StopIcon } from "../Icons";
import { useSWRConfig } from "swr";
import { useInput } from "../hooks";
import { SceneSearch } from "../components/SceneSearch";

export function Video(props: ScreenProps) {
	// Props
	const { active, change_state } = props;
	// Context
	const state = useContext(VideoState);
	// Mutator
	const { mutate: _mutate } = useSWRConfig();
	const mutate = useRef(_mutate);
	mutate.current = _mutate;
	const changeState = useRef(change_state);
	changeState.current = change_state;
	// State
	const [controlPanelActive, setPanelActive] = useState(false);
	const [displayVisible, setDisplayVisible] = useState(false); // Using terminology from the PS3.
	const [seekActive, setSeekActive] = useState(false);
	const [sceneSearchActive, setSceneSearchActive] = useState(false);
	// Panel/Overlay/etc visibility.
	const anyToolVisible = useRef(false);
	anyToolVisible.current = controlPanelActive || displayVisible || seekActive || sceneSearchActive;
	const panelVisibleRef = useRef(controlPanelActive);
	panelVisibleRef.current = controlPanelActive;
	useEffect(() => {
		if (state.status.playback_status == PlaybackStatus.Stopped) {
			changeState.current(AppState.Home);
		}
	}, [state.status.playback_status, active]);
	function closeAllPanels() {
		setPanelActive(false);
		setSeekActive(false);
		setDisplayVisible(false);
		setSceneSearchActive(false);
	};
	useInput(active, (button) => {
		// console.log(button);
		if (anyToolVisible.current) {
			switch (button) {
				case "Back":
				case "Backspace":
					setPanelActive(false);
					setSceneSearchActive(false);
					setSeekActive(false);
					return;
			}
		}
		switch (button) {
			case "t": // "t" for triangle
			case "Y":
				setPanelActive(v => !v);
				refresh_mpv();
				break;
			case "d": // "d" for display
			case "Select":
				setDisplayVisible(v => !v);
				refresh_mpv();
				break;
			case "x": // Self explanatory
			case "X":
				closeAllPanels();
				setSceneSearchActive(true);
				break;
			case "Back":
			case "Backspace":
				if (panelVisibleRef.current) {
					setPanelActive(false);
				} else {
					changeState.current(AppState.Home);
				}
				refresh_mpv();
				break;
		}
		if (!panelVisibleRef.current && !anyToolVisible.current) {
			switch (button) {
				case "Enter":
					invoke("transport_command", { function: "TogglePlay" }).then(() => {
						refresh_mpv();
					}, () => { });
					break;
				case "PadLeft":
					invoke("seek", { mode: "relative", seconds: -10 }).then(() => {
						console.log("Succeeded!");
						refresh_mpv();
					}, () => { });
					break;
				case "PadRight":
					invoke("seek", { mode: "relative", seconds: 10 }).then(() => {
						console.log("Succeeded!");
						refresh_mpv();
					}, () => { });
					break;
				default:
					break;

			}
		}
	}, []);
	useEffect(() => {
		if (!active) {
			closeAllPanels();
		}
	}, [active]);
	const on_time_jump = (seconds: number) => {
		if (seconds >= 0) invoke("seek", { mode: "absolute", seconds });
	};
	const on_cancel = () => {
		closeAllPanels();
	};
	const handle_panel_action = (action: string) => {
		switch (action) {
			case "SceneSearch":
				setPanelActive(false);
				setSceneSearchActive(true);
				setPanelActive(false);
				return;
			case "GoTo":
				setPanelActive(false);
				setSeekActive(true);
				setPanelActive(false);
				return;
			case "SubtitleOptions":
				setPanelActive(false);
				return;
			case "AudioOptions":
				setPanelActive(false);
				return;
			case "Display":
				setDisplayVisible(v => !v);
				return;
		}
	};
	return (
		<div id="video-root" style={{ opacity: active ? 1 : 0 }}>
			<VideoControlPanel active={controlPanelActive} onAction={handle_panel_action} />
			<div className="video-info" style={{ opacity: displayVisible ? 1 : 0 }}>
				<span>{state.jellyfin_data?.Name ?? state.title ?? state.filename ?? null}</span>
			</div>
			<div className="video-timeline" style={{ opacity: displayVisible ? 1 : 0 }}>
				<div style={{ flexGrow: 1 }} />
				<Timeline {...state.position.time} />
			</div>
			{state.jellyfin_data ? <SceneSearch active={sceneSearchActive} data={state.jellyfin_data} default={state.position.chapter ?? 0} onCancel={on_cancel} onSubmit={on_time_jump} /> : null}
			<div id="playback-status-indicator" className={PlaybackStatus[state.status.playback_status]} style={{ opacity: displayVisible || state.status.playback_status != PlaybackStatus.Playing ? 1 : 0, transitionDelay: displayVisible ? "0s" : state.status.playback_status == PlaybackStatus.Playing ? "5s" : "0ms" }}>
				{statusIcon(state)}
			</div>
		</div>
	);
}

function statusIcon(state: VideoContextType) {
	switch (state.status.playback_status) {
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
