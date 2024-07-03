export enum Bool {
	On = "On",
	Off = "Off",
}

export enum SettingsFile {
	User = "User",
	System = "System",
	Plugins = "Plugins",
}

export enum BackgroundType {
	Dynamic = "Dynamic",
	Wallpaper = "Wallpaper",
}

export type UserSettings = {
	music: {
		preferred_library: "Alto" | string;
		cd_import: {
			format: "FLAC" | "AAC" | "WAV" | "ALAC" | "MP3";
			bitrate?: number;
			vbr?: boolean;
		};
		crossfade: number;
		output_freq: "Simple" | "Upsample" | "Auto" | "Forced";
	};
	sound: {
		output: {

		};
		multi_out: Bool;
		key_tone: Bool;
	};
	theme: {
		theme: string;
		sound_theme: string;
		icon: string;
		background: {
			type: BackgroundType;
			name: string;
		};
		music: string;
	};
	video: {
		"24hz": Bool;
		auto_play: Bool;
	};
}