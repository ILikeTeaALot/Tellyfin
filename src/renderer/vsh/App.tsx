import "./App.css";
import "./panel.css";
import "./tab-row.css";
import { useCallback, useContext, useEffect, useReducer, useRef, useState } from "preact/hooks";
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
import { useInput, useInputRelease } from "./hooks";
import { Keyboard } from "./components/TextInput/Keyboard";
import { DynamicBackground } from "./components/DynamicBackground";
import { Coldboot } from "./components/Coldboot";
import { SettingsProvider } from "./components/SettingsProvider";
import { ImposeMenu } from "./components/Impose";

function appStateReducer(state: AppState, action: AppState | ((current: AppState) => AppState) | "animation-complete") {
	if (action == "animation-complete") return AppState.Home;
	if (state == AppState.Coldboot) return AppState.Coldboot;
	if (typeof action == "function") {
		const newState = action(state);
		return newState;
	} else {
		return action;
	}
}

function AppInner() {
	const [state, setState] = useReducer(appStateReducer, AppState.Coldboot);
	const [spinOverride, setSpinOverride] = useState(false);
	const [DEBUG_keyboard, DEBUG_showKeyboard] = useState(false);
	const homeButtonHoldTimeout = useRef<number | null>(null);
	const homeButtonHeld = useRef(false);
	const imposeReturnTo = useRef(state);
	const videoState = useContext(VideoState);
	const previousStatus = useRef(videoState.status.playbackStatus);
	const idRef = useRef(videoState.mediaType?.type == "Jellyfin" ? videoState.mediaType.id : videoState.mediaType?.type);

	////
	// Boot
	////
	const onColdbootFinish = useCallback(() => {
		setState("animation-complete");
	}, []);
	////

	////
	const [pageIsFocused, setPageIsFocused] = useState(!document.hidden);

	useEffect(() => {
		if (pageIsFocused) {
			window.electronAPI.invoke("play_background");
		} else {
			window.electronAPI.invoke("stop_background");
		}
	}, [pageIsFocused]);

	useEffect(() => {
		const handleBlur = () => setPageIsFocused(false);
		const handleFocus = () => setPageIsFocused(true);
		const handleVisChange = () => setPageIsFocused(!document.hidden);
		window.addEventListener("blur", handleBlur);
		window.addEventListener("focus", handleFocus);
		window.addEventListener("visibiltychange", handleVisChange);
		return () => {
			window.removeEventListener("blur", handleBlur);
			window.removeEventListener("focus", handleFocus);
			window.removeEventListener("visibiltychange", handleVisChange);
		};
	}, []);
	////

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

	// const [overlayVisible, setOverlayVisible] = useState(true);

	const { status: { playbackStatus: playback_status } } = videoState;

	/* useEffect(() => {
		setVideoState(current => ({
			...current,
			...mpvState.data,
		}));
	}, [mpvState.data]); */

	useEffect(() => {
		if (playback_status != PlaybackStatus.Stopped && previousStatus.current == PlaybackStatus.Stopped) {
			setState(AppState.Player);
		}
		if (idRef.current != null && idRef.current != (videoState.mediaType?.type == "Jellyfin" ? videoState.mediaType.id : videoState.mediaType?.type)) {
			setState(AppState.Player);
		}
		previousStatus.current = playback_status;
	}, [
		playback_status,
		videoState.mediaType?.type,
		/// @ts-expect-error
		videoState.mediaType?.id,
	]);

	useInput(true, (button) => {
		switch (button) {
			case "Home":
				if (homeButtonHoldTimeout.current != null || state == AppState.Impose) return;
				homeButtonHeld.current = true;
				homeButtonHoldTimeout.current = window.setTimeout(() => {
					setState(current => {
						imposeReturnTo.current = current;
						return AppState.Impose;
					});
				}, 3000);
				break;
			default:
				break;
		}
	}, [state]);

	useInputRelease((button) => {
		switch (button) {
			case "Home":
				// TODO: Show "Quick Menu" when "Home" is held down.
				setState(state => {
					if (homeButtonHoldTimeout.current != null && state != AppState.Impose) {
						window.clearTimeout(homeButtonHoldTimeout.current);
						homeButtonHoldTimeout.current = null;
						homeButtonHeld.current = false;
						refresh_mpv();
						if (playback_status == PlaybackStatus.Stopped) {
							return (state == AppState.Coldboot ? AppState.Coldboot : AppState.Home);
						} else {
							return (state == AppState.Coldboot ? AppState.Coldboot : state == AppState.Home ? AppState.Player : AppState.Home);
						}
					} else if (state != AppState.Impose) {
						return (imposeReturnTo.current);
					} else return state;
				});
				return;
		}
	}, true, [playback_status]);

	useEffect(() => {
		if (playback_status == PlaybackStatus.Stopped) {
			setState(state => state == AppState.Coldboot ? AppState.Coldboot : AppState.Home);
		}
	}, [playback_status]);

	const change_state = useCallback((state: AppState) => {
		setState(_state => {
			if (_state == AppState.Coldboot) return AppState.Coldboot;
			if (_state != state) {
				refresh_mpv();
			}
			return state;
		});
	}, []);

	/* function change_video_state(file?: string, media_type?: MediaType) {
		mpvState.mutate();
		if (file) {
		}
	}

	// Do it like this so it doesn't trigger a state change! (I'm 99% sure this is fine...)
	videoState.stateChanged = change_video_state; */

	useInput(true, (button) => {
		if (button == "R3") setSpinOverride(v => !v);
		if (button == "Start") DEBUG_showKeyboard(v => !v);
	}, []);

	const dummy = useCallback(() => DEBUG_showKeyboard(false), []);

	const cancelImpose = useCallback(() => setState(imposeReturnTo.current), []);

	return (
		<SWRConfig value={{
			keepPreviousData: true,
			revalidateOnMount: true,
			revalidateOnFocus: false,
			// refreshInterval: 5 * 60 * 1000,
			use: [requestCounter],
			refreshInterval: 0,
		}}>
			<AppMode.Provider value={state}>
				<SwitchMode.Provider value={change_state}>
					<SettingsProvider>
						<div className="background" style={{ opacity: state == AppState.Player ? 0 : 1 }} />
						{/* <div className="background image" style={{ opacity: state == AppState.Player || playback_status != PlaybackStatus.Stopped ? 0 : 1 }} /> */}
						{/* <DynamicBackground style={{ opacity: state == AppState.Player || playback_status != PlaybackStatus.Stopped ? 0 : 1 }} /> */}
						<Video active={!DEBUG_keyboard && (state == AppState.Player && playback_status != PlaybackStatus.Stopped)} change_state={change_state} />
						<Home active={!DEBUG_keyboard && (state == AppState.Home || playback_status == PlaybackStatus.Stopped) && state != AppState.Coldboot} change_state={change_state} />
						<StatusBar show={state == AppState.Home} loading={requestCount > 0 || spinOverride} />
						<Keyboard active={DEBUG_keyboard} onCancel={dummy} onEnter={dummy} x={240} y={400} />
						{/* <div style={{ opacity: overlayVisible ? "1" : "0", transitionDuration: "600ms" }}>
						</div> */}
						<ImposeMenu active={state == AppState.Impose} onCancel={cancelImpose} />
						<Coldboot run={state == AppState.Coldboot} onComplete={onColdbootFinish} />
					</SettingsProvider>
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