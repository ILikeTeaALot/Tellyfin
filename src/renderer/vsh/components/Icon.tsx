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
					{/* {focused && <img class="absolute" src="xb-icon://localhost/system/panel.video.scene_search.focus" />} */}
					<img class="absolute" src="xb-icon://localhost/system/panel.video.scene_search.normal" />
				</div>
			);
		case "GoTo":
			// return "Go To";
			return (
				<div class="cp_icon">
					{/* {focused && <img class="absolute" src="xb-icon://localhost/system/panel.video.go_to.focus" />} */}
					<img class="absolute" src="xb-icon://localhost/system/panel.video.go_to.normal" />
				</div>
			);
		case "AudioOptions":
			// return "Audio";
			return (
				<div class="cp_icon">
					{/* {focused && <img class="absolute" src="xb-icon://localhost/system/panel.video.sound.focus" />} */}
					<img class="absolute" src="xb-icon://localhost/system/panel.video.sound.normal" />
				</div>
			);
		case "SubtitleOptions":
			// return "Subtitles";
			return (
				<div class="cp_icon">
					{/* {focused && <img class="absolute" src="xb-icon://localhost/system/panel.video.subtitle.focus" />} */}
					<img class="absolute" src="xb-icon://localhost/system/panel.video.subtitle.normal" />
				</div>
			);
		case "AVSettings":
			// return "AV Settings";
			return (
				<div class="cp_icon">
					{/* {focused && <img class="absolute" src="xb-icon://localhost/system/panel.video.av_settings.focus" />} */}
					<img class="absolute" src="xb-icon://localhost/system/panel.video.av_settings.normal" />
				</div>
			);
		case "TimeOptions":
			return "Time Options";
		case "Display":
			// return "Display";
			return (
				<div class="cp_icon">
					{/* {focused && <img class="absolute" src="xb-icon://localhost/system/panel.video.display.focus" />} */}
					<img class="absolute" src="xb-icon://localhost/system/panel.video.display.normal" />
				</div>
			);
		// Transport Controls
		case "PrevChapter":
			// return <JumpPreviousIcon />;
			return CPIcon("panel.video.prev.normal");
		case "NextChapter":
			// return <JumpNextIcon />;
			return CPIcon("panel.video.next.normal");
		case "FastRewind":
			// return <RewindIcon width="64px" height="32px" />;
			return CPIcon("panel.video.fast_b.normal");
		case "FastForward":
			// return <FastForwardIcon width="64px" height="32px" />;
			return CPIcon("panel.video.fast_f.normal");
		case "SlowRewind":
			return CPIcon("panel.video.slow_b.normal");
		case "SlowForward":
			return CPIcon("panel.video.slow_f.normal");
		case "StepBackward":
			return CPIcon("panel.video.step_b.normal");
		case "StepForward":
			return CPIcon("panel.video.step_f.normal");
		case "JumpBackward":
			return CPIcon("panel.video.jump_b.normal");
		case "JumpForward":
			return CPIcon("panel.video.jump_f.normal");
		case "Play":
			// return <PlayIcon width="64px" height="32px" />;
			return CPIcon("panel.video.play.normal");
		case "Pause":
			// return <PauseIcon width="64px" height="32px" />;
			return CPIcon("panel.video.pause.normal");
		case "Stop":
			// return <StopIcon width="64px" height="32px" />;
			return CPIcon("panel.video.stop.normal");
		default:
			return name;
	}
}

function CPIcon(icon: string) {
	return (
		<div class="cp_icon">
			{/* {focused && <img class="absolute" src="xb-icon://localhost/system/panel.video.display.focus" />} */}
			<img class="absolute" src={`xb-icon://localhost/system/${icon}`} />
		</div>
	);
}