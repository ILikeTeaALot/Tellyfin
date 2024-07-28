use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(tag = "type")]
pub enum PlaybackId {
	Jellyfin { id: String },
	Alto { id: i64 },
	CD { path: String, track: i64 },
	DVD { path: String, name: Option<String>, title: i64, chapter: i64 },
	BluRay { path: String, name: Option<String>, title: i64, chapter: i64 },
}

// #[derive(Clone, Debug, Deserialize, Serialize)]
// #[repr(transparent)]
// pub struct PlaybackId(PlaybackContent);

impl From<String> for PlaybackId {
	fn from(value: String) -> Self {
		PlaybackId::Jellyfin { id: value }
	}
}
