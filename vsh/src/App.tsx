import "./App.css";
import "./panel.css";
import "./tab-row.css";
import { useCallback, useContext, useEffect, useRef, useState } from "preact/hooks";
import { Home } from "./screens/Home";
import { AppState } from "./AppStates";
import { Video } from "./screens/Video";
import { GamepadContextProvider } from "./context/GamepadInput";
import { AppMode, SwitchMode } from "./context/AppState";
import { SWRConfig, type SWRHook } from "swr";
import { MpvStateProvider } from "./components/MpvStateProvider";
import { refresh_mpv } from "./util/functions";
import VideoState, { PlaybackStatus } from "./context/VideoContext";
import { StatusBar } from "./components/StatusBar";
import { DynamicBackground } from "./components/DynamicBackground";

function AppInner() {
	const [state, setState] = useState(AppState.Home);
	const videoState = useContext(VideoState);
	const previousStatus = useRef(videoState.status.playback_status);
	const idRef = useRef(videoState.jellyfin_id);

	// Loading tracker
	const [requestCount, setRequestCount] = useState(0);
	const requestCounter = useCallback((useSWRNext: SWRHook) => {
		return (key: any, fetcher: any, config: any) => {
			const extendedFetcher = (...args: any[]) => {
				setRequestCount((prev) => prev + 1);
				return fetcher(...args).finally(() => {
					setRequestCount((prev) => prev - 1);
				});
			};

			return useSWRNext(key, extendedFetcher, config); // eslint-disable-line
		};
	}, []);

	const { status: { playback_status } } = videoState;

	useEffect(() => {
		if (playback_status != PlaybackStatus.Stopped && previousStatus.current == PlaybackStatus.Stopped) {
			setState(AppState.Player);
		}
		if (idRef.current != null && idRef.current != videoState.jellyfin_id) {
			setState(AppState.Player);
		}
		previousStatus.current = playback_status;
	}, [playback_status, videoState.jellyfin_id]);

	useEffect(() => {
		function handler(e: KeyboardEvent) {
			console.log(e.key);
			switch (e.key) {
				case "Home":
					if (playback_status == PlaybackStatus.Stopped) {
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
	}, [playback_status]);

	useEffect(() => {
		if (playback_status == PlaybackStatus.Stopped) {
			setState(AppState.Home);
		}
	}, [playback_status]);

	const change_state = useCallback((state: AppState) => {
		setState(_state => {
			if (_state != state) {
				refresh_mpv();
			}
			return state;
		});
	}, []);

	return (
		<SWRConfig value={{
			revalidateOnMount: true,
			// refreshInterval: 5 * 60 * 1000,
			use: [requestCounter],
			refreshInterval: 0,
		}}>
			<AppMode.Provider value={state}>
				<SwitchMode.Provider value={change_state}>
					<div className="background" style={{ opacity: state == AppState.Player ? 0 : 1 }} />
					<DynamicBackground style={{ opacity: state == AppState.Player || playback_status != PlaybackStatus.Stopped ? 0 : 1 }} />
					<Video active={state == AppState.Player && playback_status != PlaybackStatus.Stopped} change_state={change_state} />
					<Home active={state == AppState.Home || playback_status == PlaybackStatus.Stopped} change_state={change_state} />
					<StatusBar show={state == AppState.Home} loading={requestCount > 0} />
				</SwitchMode.Provider>
			</AppMode.Provider>
		</SWRConfig>
	);
}

function App() {
	return (
		<GamepadContextProvider>
			<MpvStateProvider>
				<AppInner />
			</MpvStateProvider>
		</GamepadContextProvider>
	);
}

export default App;
