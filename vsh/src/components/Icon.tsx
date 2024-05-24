import { FastForwardIcon, PauseIcon, PlayIcon, RewindIcon, StopIcon } from "../Icons";
import { JumpNextIcon } from "../Icons/JumpNext";
import { JumpPreviousIcon } from "../Icons/JumpPrev";

export function iconByName(name: string) {
	switch (name) {
		case "SceneSearch":
			return "Scenes";
		case "GoTo":
			return "Go To";
		case "AudioOptions":
			return "Audio"
		case "SubtitleOptions":
			return "Subtitles";
		case "AVSettings":
			return "AV Settings";
		case "TimeOptions":
			return "Time Options";
		case "Display":
			return "Display";
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