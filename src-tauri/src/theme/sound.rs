pub struct ThemeMultiChannelSound {
	stereo: String,
	surround: Option<String>,
}

pub struct ThemeMenuSounds {
	_move: String,
	close: String,
}

pub struct ThemeSoundTable {
	/// Cancel or back
	cancel: String,
	/// General Movement
	cursor: String,
	enter: String,
	menu: ThemeMenuSounds,
	coldboot: ThemeMultiChannelSound,
	gameboot: ThemeMultiChannelSound,
}