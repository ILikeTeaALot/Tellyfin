import { BackgroundType, Bool, type UserSettings } from "./types";

export const default_user_settings: UserSettings = {
	music: {
		preferred_library: "Alto",
		cd_import: { format: "FLAC" },
		crossfade: 0,
		output_freq: "Auto",
	},
	sound: {
		output: {},
		multi_out: Bool.Off,
		key_tone: Bool.On
	},
	theme: {
		theme: "iliketeaalot.ps3",
		sound: "iliketeaalot.ps3",
		icons: "iliketeaalot.ps3",
		background: {
			type: BackgroundType.Dynamic,
			name: "PS3"
		},
		music: "iliketeaalot.ps2",
	},
	video: {
		"24hz": Bool.On,
		auto_play: Bool.Off,
	},
};