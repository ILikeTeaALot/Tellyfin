import { useEffect, useState } from "preact/hooks";
import { PanelButton } from "./ControlPanelButton";
import { refresh_mpv } from "../util/functions";

export type ControlPanelProps<Action, Config> = {
	active: boolean;
	onAction: (action: Action | "Stop") => void;
	options: Array<Config>;
};

const video_configuration_functions = {
	"SceneSearch": "Scene Search",
	"GoTo": "Go to time",
	"AudioOptions": "Select audio options",
	"SubtitleOptions": "Select subtitle options",
	"AVSettings": "Configure Audio/Video settings",
	"Revert": "Return to the previous position",
	// "TimeOptions",
	"Display": "Show video information on-screen",
};

const video_transport_functions: [string, string][] = [
	["PrevChapter", "Jump to previous chapter"],
	["NextChapter", "Skip to next chapter"],
	["FastRewind", "Fast Rewind (4x–30x)"],
	["FastForward", "Fast Forward (2x–120x)"],
	["Play", "Play"],
	["Pause", "Pause"],
	["Stop", "Stop playback"],
	["JumpBackward", "Jump Backward 15 seconds"],
	["JumpForward", "Jump Forward 15 seconds"],
	["SlowRewind", "Slow Rewind"],
	["SlowForward", "Slow Forward"],
	["StepBackward", "Step 1 frame backward"],
	["StepForward", "Step 1 frame forward"],
];


export type VideoFunction = keyof typeof video_configuration_functions;

// type VideoFunction_ = VideoFunction | "Stop";

// export { VideoFunction_ as VideoFunction };

const getConfigOptions = (options: Array<VideoFunction>) => options.map(key => [key, video_configuration_functions[key]] as [VideoFunction, string]);

export function VideoControlPanel(props: ControlPanelProps<VideoFunction, VideoFunction>) {
	const { active, options, onAction } = props;

	// Available Video Options
	// const getConfigOptions = (options: Array<VideoFunction>) =>
	// 	(Object.entries(video_configuration_functions) as Array<[VideoFunction, string]>)
	// 		.filter(([key]) => options.includes(key));
	const [configFuncs, setConfigFuncs] = useState(getConfigOptions(options));
	useEffect(() => setConfigFuncs(getConfigOptions(options)), [options]);
	const [functions, updateFunctions] = useState([configFuncs, video_transport_functions]);
	useEffect(() => {
		updateFunctions([configFuncs, video_transport_functions]);
	}, [configFuncs]);
	const [row, setRow] = useState(1);
	const [selected, setSelected] = useState(4);
	// const videoState = useContext(VideoState);
	// const updateVideoState = useRef(videoState.stateChanged);
	// updateVideoState.current = videoState.stateChanged;
	useEffect(() => {
		if (active) {
			const handler = (e: KeyboardEvent) => {
				console.log(e.key);
				switch (e.key) {
					case "PadLeft":
					case "ArrowLeft":
						setSelected(current => Math.max(current - 1, 0));
						break;
					case "PadRight":
					case "ArrowRight":
						setSelected(current => Math.min(current + 1, functions[row].length - 1));
						break;
					case "PadUp":
					case "ArrowUp":
						setRow(current => {
							const newRow = Math.max(current - 1, 0);
							setSelected(current_selected => {
								const old = functions[current].length;
								const _new = functions[newRow].length;
								const max = Math.max(old, _new);
								const min = Math.min(old, _new);
								const offset = Math.round((max - min) / 2);
								if (_new > old) {
									return Math.min(Math.max(current_selected + offset, 0), functions[newRow].length - 1);
								} else {
									return Math.min(Math.max(current_selected - offset, 0), functions[newRow].length - 1);
								}
							});
							return newRow;
						});
						break;
					case "PadDown":
					case "ArrowDown":
						// setRow(current => Math.min(current + 1, 1));
						setRow(current => {
							// const newRow = Math.min(current + 1, 1);
							const newRow = 1;
							setSelected(current_selected => {
								const old = functions[current].length;
								const _new = functions[newRow].length;
								const max = Math.max(old, _new);
								const min = Math.min(old, _new);
								const offset = Math.round((max - min) / 2);
								if (_new > old) {
									return Math.min(Math.max(current_selected + offset, 0), functions[newRow].length - 1);
								} else {
									return Math.min(Math.max(current_selected - offset, 0), functions[newRow].length - 1);
								}
								// return functions[current].length;
							});
							return newRow;
						});
						break;
					case "Enter":
						// switch (row) {
						// 	case 0:
						// 		const func = video_configuration_functions[selected];
						// 		if (func) {
						// 			window.electronAPI.transportCommand(func);
						// 		}
						// 		break;
						// 	case 1:
						// 		window.electronAPI.transportCommand(video_transport_functions[selected]);
						// 		break;
						// }
						const func = functions[row][selected][0];
						if (row == 0) {
							switch (func) {
								case "SubtitleOptions":
									window.electronAPI.transportCommand(func);
									return;
								default:
									onAction(func as VideoFunction);
									return;
							}
						} else if (row == 1) {
							if (func) {
								if (func == "Stop") onAction("Stop");
								window.electronAPI.transportCommand(func).then(() => refresh_mpv());
								// videoState.stateChanged();
							}
						}
						break;
					case "Backspace":
					case "Back":
						// onAction(NavigateAction.Back);
						break;
					default:
						break;
				}
			}
			window.addEventListener("keydown", handler);
			return () => { window.removeEventListener("keydown", handler); };
		}
	}, [selected, onAction, active, row, configFuncs, functions]);
	// console.log("row:", row, "selected:", selected);
	return (
		<div id="video-control-panel" className={active ? "control-panel active" : "control-panel"}>
			<div className={"button-row"}>
				{functions[0].map(([action], idx) => (
					<PanelButton key={action} active={(selected == idx) && (row == 0)} action={action} />
				))}
			</div>
			<div className={"button-row"}>
				{functions[1].map(([action], idx) => (
					<PanelButton key={action} active={(selected == idx) && (row == 1)} action={action} />
				))}
			</div>
			{functions[row][selected] ? <span>{functions[row][selected]![1]}</span> : null}
		</div>
	);
}