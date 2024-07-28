import { createContext } from "preact";

export const AudioFeedback = createContext({ play: (feedback: FeedbackSound) => { } });

export enum FeedbackSound {
	SelectionMove = "Move",
	Enter = "Enter",
	Back = "Back",
	Error = "No",
	MenuMove = "MoveCategory",
	MenuOpen = "Enter",
	MenuClose = "Back",
	PlayColdboot = "Coldboot",
}

/* Original WebAudioAPI version */
// const audioMap = {
// 	navigate: "/sounds/SCPH-10000_00015.wav",
// 	enter: "/sounds/SCPH-10000_00016.wav",
// 	back: "/sounds/SCPH-10000_00019.wav",
// 	// back: "/sounds/SCPH-10000_00021.wav",
// 	error: "/sounds/SCPH-10000_00012.wav",
// 	// Menu
// 	menu_move: "/sounds/SCPH-10000_00015.wav",
// 	// menu_open: "/sounds/SCPH-10000_00016.wav",
// 	menu_open: "/sounds/SCPH-10000_00017.wav",
// 	menu_close: "/sounds/SCPH-10000_00019.wav",
// };

// declare global {
// 	interface Window {
// 		__AUDIO_FEEDBACK_SOUNDS__: Record<FeedbackSound, AudioBuffer>,
// 		__AUDIO_FEEDBACK_SETUP_DONE__: boolean;
// 		__AUDIO_FEEDBACK_CONTEXT__: AudioContext;
// 		__AUDIO_FEEDBACK_GAIN_NODE__: GainNode;
// 	}
// }

// export function reinitAudioSystem() {
// 	initAudioSystem();
// }

// async function initAudioSystem() {
// 	if (!window.__AUDIO_FEEDBACK_SETUP_DONE__) return;

// 	window.__AUDIO_FEEDBACK_SETUP_DONE__ = false;

// 	const player = new AudioContext();
// 	window.__AUDIO_FEEDBACK_CONTEXT__ = player;
// 	const gain = window.__AUDIO_FEEDBACK_CONTEXT__.createGain();
// 	gain.gain.value = 0.5;
// 	window.__AUDIO_FEEDBACK_GAIN_NODE__ = gain;

// 	// window.__AUDIO_FEEDBACK_CONTEXT__.addEventListener("statechange", () => {
// 	// 	console.error("Audio state changed!", window.__AUDIO_FEEDBACK_CONTEXT__.state);
// 	// });

// 	window.__AUDIO_FEEDBACK_SOUNDS__ = {
// 		[FeedbackSound.SelectionMove]: await fetchAudioBuffer(audioMap.navigate, player),
// 		[FeedbackSound.Enter]: await fetchAudioBuffer(audioMap.enter, player),
// 		[FeedbackSound.Back]: await fetchAudioBuffer(audioMap.back, player),
// 		[FeedbackSound.Error]: await fetchAudioBuffer(audioMap.error, player),
// 		[FeedbackSound.MenuOpen]: await fetchAudioBuffer(audioMap.menu_open, player),
// 		[FeedbackSound.MenuMove]: await fetchAudioBuffer(audioMap.menu_move, player),
// 		[FeedbackSound.MenuClose]: await fetchAudioBuffer(audioMap.menu_close, player),
// 	};

// 	window.__AUDIO_FEEDBACK_SETUP_DONE__ = true;
// }

// export function AudioFeedbackProvider({ children }: { children: ComponentChildren; }) {
// 	// const player = useRef(new window.AudioContext());
// 	// const gain = useRef(player.current.createGain());
// 	// gain.current.gain.value = 0.5;
// 	// const [playAudio, setPlayableState] = useState(false);
// 	// const { data: navigate } = useSWR([audioMap.navigate, player.current], fetchAudioBuffer, fetchSettings);
// 	// const { data: enter } = useSWR([audioMap.enter, player.current], fetchAudioBuffer, fetchSettings);
// 	// const { data: back } = useSWR([audioMap.back, player.current], fetchAudioBuffer, fetchSettings);
// 	// const { data: error } = useSWR([audioMap.error, player.current], fetchAudioBuffer, fetchSettings);
// 	useInputOnce(() => {
// 		initAudioSystem().catch((e) => {
// 			console.error("Failed to initialise audio system:", e);
// 		});
// 		// setPlayableState(false); // HACK
// 		// const h = setTimeout(() => setPlayableState(true), 5000);
// 		// return () => clearTimeout(h);
// 	}, true, []);
// 	const play = useCallback((feedback: FeedbackSound) => {
// 		if (window.__AUDIO_FEEDBACK_SOUNDS__ && !window.__AUDIO_FEEDBACK_SETUP_DONE__) {
// 			const soundSource = window.__AUDIO_FEEDBACK_CONTEXT__.createBufferSource();
// 			soundSource.buffer = window.__AUDIO_FEEDBACK_SOUNDS__[feedback];
// 			window.__AUDIO_FEEDBACK_GAIN_NODE__.connect(window.__AUDIO_FEEDBACK_CONTEXT__.destination);
// 			soundSource.connect(window.__AUDIO_FEEDBACK_GAIN_NODE__);
// 			soundSource.start();
// 		}
// 	}, []);
// 	const context = useMemo(() => ({ play }), [play]);
// 	return (
// 		<AudioFeedback.Provider value={context}>
// 			{children}
// 		</AudioFeedback.Provider>
// 	);
// }

// async function fetchAudioBuffer(path: string, context: AudioContext) {
// 	console.log(path, context);
// 	// see https://jakearchibald.com/2016/sounds-fun/
// 	// Fetch the file
// 	return await fetch(path)
// 		// Read it into memory as an arrayBuffer
// 		.then(response => response.arrayBuffer())
// 		// Turn it from mp3/aac/whatever into raw audio data
// 		.then(arrayBuffer => context.decodeAudioData(arrayBuffer));
// 	// .then(audioBuffer => {
// 	// 	// Now we're ready to play!
// 	// 	const soundSource = context.createBufferSource();
// 	// 	soundSource.buffer = audioBuffer;
// 	// 	soundSource.connect(context.destination);
// 	// 	soundSource.start();
// 	// });
// }

export function reinitAudioSystem() {}

// function AudioFeedbackProvider({ children }: { children: ComponentChildren; }) {
// 	const context = useMemo(() => ({ play: playFeedback }), []);
// 	return (
// 		<AudioFeedback.Provider value={context}>
// 			{children}
// 		</AudioFeedback.Provider>
// 	);
// }

export function playFeedback(feedback: FeedbackSound) {
	window.electronAPI.invoke("play_feedback", { sound: feedback });
}