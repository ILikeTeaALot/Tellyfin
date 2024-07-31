import "./icon.css";

import { FastForwardIcon, PauseIcon, PlayIcon, RewindIcon, StopIcon } from "../Icons";
import { JumpNextIcon } from "../Icons/JumpNext";
import { JumpPreviousIcon } from "../Icons/JumpPrev";

export function iconByName(name: string, focused?: boolean) {
	switch (name) {
		case "SceneSearch":
			// return "Scenes";
			return (
				<div class="cp_icon">
					{/* {focused && <img class="absolute" src="xb-icon://localhost/system/video.panel.scene_search.focus" />} */}
					<img class="absolute" src="xb-icon://localhost/system/video.panel.scene_search.normal" />
				</div>
			);
		case "GoTo":
			// return "Go To";
			return (
				<div class="cp_icon">
					{/* {focused && <img class="absolute" src="xb-icon://localhost/system/video.panel.go_to.focus" />} */}
					<img class="absolute" src="xb-icon://localhost/system/video.panel.go_to.normal" />
				</div>
			);
		case "AudioOptions":
			// return "Audio";
			return (
				<div class="cp_icon">
					{/* {focused && <img class="absolute" src="xb-icon://localhost/system/video.panel.sound.focus" />} */}
					<img class="absolute" src="xb-icon://localhost/system/video.panel.sound.normal" />
				</div>
			);
		case "SubtitleOptions":
			// return "Subtitles";
			return (
				<div class="cp_icon">
					{/* {focused && <img class="absolute" src="xb-icon://localhost/system/video.panel.subtitle.focus" />} */}
					<img class="absolute" src="xb-icon://localhost/system/video.panel.subtitle.normal" />
				</div>
			);
		case "AVSettings":
			// return "AV Settings";
			return (
				<div class="cp_icon">
					{/* {focused && <img class="absolute" src="xb-icon://localhost/system/video.panel.av_settings.focus" />} */}
					<img class="absolute" src="xb-icon://localhost/system/video.panel.av_settings.normal" />
				</div>
			);
		case "TimeOptions":
			return "Time Options";
		case "Display":
			// return "Display";
			return (
				<div class="cp_icon">
					{/* {focused && <img class="absolute" src="xb-icon://localhost/system/video.panel.display.focus" />} */}
					<img class="absolute" src="xb-icon://localhost/system/video.panel.display.normal" />
				</div>
			);
		// Transport Controls
		case "PrevChapter":
			return <JumpPreviousIcon />;
		case "NextChapter":
			return <JumpNextIcon />;
		case "FastRewind":
			return <RewindIcon width="64px" height="32px" />;
		case "FastForward":
			return <FastForwardIcon width="64px" height="32px" />;
		case "Play":
			return <PlayIcon width="64px" height="32px" />;
		case "Pause":
			return <PauseIcon width="64px" height="32px" />;
		case "Stop":
			return <StopIcon width="64px" height="32px" />;
		default:
			return name;
	}
}