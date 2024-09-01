import { BackgroundType, Bool, HomeStyle, type UserSettings } from "./types";

export const default_user_settings: UserSettings = {
	home: {
		style: HomeStyle.XMB,
	},
	music: {
		preferred_library: "Alto",
		cd_import: { format: "FLAC" },
		crossfade: 0,
		output_freq: "Auto",
	},
	sound: {
		output: {
			channels: "7.1",
			layout: "Surround",
			formats: [
				"Dolby",
				"DolbyDigital",
				"DolbyDigitalPlus",
				"DolbyTrueHD",
				"DTS",
				"DTSES",
				"DTSHD",
			],
			sample_rates: [
				44_100,
				48_000,
				88_200,
				96_000,
				176_400,
				192_000,
			],
			bit_depth: 24,
		},
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