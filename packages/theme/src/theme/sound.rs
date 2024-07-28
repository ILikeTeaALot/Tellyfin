#[napi(object)]
pub struct ThemeMultiChannelSound {
	pub stereo: String,
	pub surround: Option<String>,
}

#[napi(object)]
pub struct ThemeMenuSounds {
	pub cancel: String,
	pub cursor: String,
	pub enter: String,
}

#[napi(object)]
pub struct ThemeSoundTable {
	/// Cancel or back
	pub cancel: String,
	/// General Movement
	pub cursor: String,
	pub enter: String,
	pub system_ok: String,
	pub system_negative: String,
	pub menu: ThemeMenuSounds,
	pub coldboot: ThemeMultiChannelSound,
	pub gameboot: ThemeMultiChannelSound,
}