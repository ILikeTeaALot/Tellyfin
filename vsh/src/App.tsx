import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import "./panel.css";
import "./tab-row.css";
import { Home } from "./screens/Home";
import { AppState } from "./AppStates";
import { Video } from "./screens/Video";
import { GamepadContextProvider } from "./context/GamepadInput";
import { AppMode } from "./context/AppState";
import { SWRConfig } from "swr";
import { MpvStateProvider } from "./components/MpvStateProvider";
import { refresh_mpv } from "./util/functions";
import VideoState, { PlaybackStatus } from "./context/VideoContext";

function AppInner() {
	const [state, setState] = useState(AppState.Home);
	const videoState = useContext(VideoState);

	const { status: { playback_status } } = videoState;

	const statusRef = useRef(playback_status);
	statusRef.current = playback_status;
	useEffect(() => {
		function handler(e: KeyboardEvent) {
			console.log(e.key);
			switch (e.key) {
				case "Home":
					if (statusRef.current == PlaybackStatus.Stopped) {
						setState(AppState.Home);
					} else {
						setState(state => state == AppState.Home ? AppState.Player : AppState.Home);
					}
					refresh_mpv();
					break;
				default:
					break;
			}
		}
		window.addEventListener("keydown", handler);
		return () => { window.removeEventListener("keydown", handler); };
	}, []);

	useEffect(() => {
		if (playback_status == PlaybackStatus.Stopped) {
			setState(AppState.Home);
		}
	}, [playback_status]);

	function change_state(state: AppState) {
		setState(state);
		refresh_mpv();
	}

	return (
		<AppMode.Provider value={state}>
			<div className="background" style={{ opacity: state == AppState.Player ? 0 : 1 }} />
			<Home active={state == AppState.Home} change_state={change_state} />
			<Video active={state == AppState.Player && playback_status != PlaybackStatus.Stopped} change_state={change_state} />
		</AppMode.Provider>
	);
}

function App() {
	return (
		<MpvStateProvider>
			<GamepadContextProvider>
				<SWRConfig value={{
					// revalidateOnMount: true,
					refreshInterval: 5 * 60 * 1000,
				}}>
					<AppInner />
				</SWRConfig>
			</GamepadContextProvider>
		</MpvStateProvider>
	);
}

export default App;
