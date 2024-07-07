import { createContext } from "preact";
import { ChapterData } from "../components/SceneSearch";
import { type BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export enum MediaType {
	General,
	Film,
	TV,
	BluRay,
	DVD,
}

export enum PlaybackStatus {
	Stopped = 0,
	Paused = 1,
	Playing = 2,
}

export enum VideoRepeatType {
	Off = 0,
	On = 1,
	AB = 2,
}

export type TrackInfo = {
	default: boolean;
	forced: boolean;
	selected: boolean;
	name: string;
	title: string | null;
	track: number;
}

export type VideoContextType = {
	position: {
		time: {
			position: number;
			duration: number | null;
			remaining: number;
		};
		// title: number;
		chapter: number | null;
	};
	title: string | null;
	chapters: Array<ChapterData>;
	audio: {
		codec: string | null;
		channels: string | null;
		format: string | null;
	};
	video: {
		codec: string;
		format: string;
	};
	tracks: Array<TrackInfo>;
	status: {
		playback_status: PlaybackStatus;
		shuffle: boolean;
		repeat: VideoRepeatType;
	};
	filename: string | null;
	path: string | null;
	media_type: MediaType;
	jellyfin_data: BaseItemDto | null;
	jellyfin_id: string | null;
	// stateChanged: (file?: string, media_type?: MediaType) => void;
	// setLocation: (location: string) => void;
};

export const defaultVideoState: VideoContextType = {
	position: {
		time: {
			position: 0,
			duration: 0,
			remaining: 0,
		},
		// title: 0,
		chapter: 0,
	},
	title: null,
	tracks: [],
	audio: {
		codec: null,
		channels: null,
		format: null,
	},
	media_type: MediaType.General,
	video: {
		codec: "Unknown",
		format: "Unknown",
	},
	chapters: [],
	status: {
		playback_status: PlaybackStatus.Stopped,
		shuffle: false,
		repeat: VideoRepeatType.Off
	},
	filename: null,
	path: null,
	jellyfin_data: null,
	jellyfin_id: null,
	// stateChanged: (_, __) => { },
};

export const VideoState = createContext<VideoContextType>(defaultVideoState);

VideoState.displayName = "VideoState Context";
export default VideoState;