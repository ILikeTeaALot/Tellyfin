use serde::{Deserialize, Serialize};

use super::SettingsManager;

#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize)]
pub enum Bool {
	#[default]
	Off,
	On,
}

#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize)]
pub enum BackgroundType {
	#[default]
	Dynamic,
	Wallpaper,
}

#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize)]
pub enum OutputFreq {
	Simple,
	Upsample,
	#[default]
	Auto,
	Forced,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub enum PreferredLibrary {
	#[default]
	Alto,
	Other(String),
}

#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize)]
pub enum ImportFormat {
	#[default]
	FLAC,
	AAC,
	WAV,
	ALAC,
	MP3,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct CDImportSettings {
	pub format: ImportFormat,
	pub bitrate: Option<i64>,
	pub vbr: Option<bool>,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct MusicSettings {
	pub preferred_library: PreferredLibrary,
	pub cd_import: CDImportSettings,
	pub crossfade: i64,
	pub output_freq: OutputFreq,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct SoundSettings {
	pub output: toml::Table,
	pub multi_out: Bool,
	pub key_tone: Bool,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct ThemeSettings {
	pub theme: String,
	#[serde(alias = "sounds")]
	#[serde(rename(serialize = "sounds"))]
	pub sound: String,
	pub icons: String,
	pub music: String,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct VideoSettings {
	#[serde(alias = "24hz")]
	#[serde(rename(serialize = "24hz"))]
	pub hz: Bool,
	pub auto_play: Bool,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct UserSettings {
	pub music: MusicSettings,
	pub sound: SoundSettings,
	pub theme: ThemeSettings,
	pub video: VideoSettings,
}

// impl<'a> Settings<'a, UserSettings> for UserSettings {
// 	fn all(&'a self) -> &'a UserSettings {
// 		&self
// 	}
// }

pub type UserSettingsManager<'a> = SettingsManager<'a, UserSettings>;