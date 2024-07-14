pub struct ThemeMultiChannelSound {
	stereo: String,
	surround: Option<String>,
}

pub struct ThemeMenuSounds {
	cancel: String,
	cursor: String,
	enter: String,
}

pub struct ThemeSoundTable {
	/// Cancel or back
	cancel: String,
	/// General Movement
	cursor: String,
	enter: String,
	system_ok: String,
	system_negative: String,
	menu: ThemeMenuSounds,
	coldboot: ThemeMultiChannelSound,
	gameboot: ThemeMultiChannelSound,
}