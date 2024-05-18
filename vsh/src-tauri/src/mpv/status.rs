use std::{error::Error, sync::Arc};

use libmpv2::Mpv;
use serde::Serialize;
use serde_repr::Serialize_repr;
use tauri::State;

use crate::{states::JellyfinId, use_mpv_lock, CurrentId, MpvState};


#[derive(Debug, Default, Serialize_repr)]
#[repr(u8)]
enum PlaybackStatus {
	#[default]
	Stopped = 0,
	Paused = 1,
	Playing = 2,
}

#[derive(Debug, Default, Serialize_repr)]
#[repr(u8)]
enum VideoRepeatType {
	#[default]
	Off = 0,
	On = 1,
	AB = 2,
}

#[derive(Debug, Default, Serialize)]
pub struct Chapter {
	pub title: Option<String>,
	pub time: f64,
}

#[derive(Debug, Default, Serialize)]
struct MpvAudioStatus {
	codec: Option<String>,
	channels: Option<String>,
	format: Option<String>,
}

#[derive(Debug, Default, Serialize)]
struct MpvVideoStatus {
	codec: String,
	format: String,
}

#[derive(Debug, Default, Serialize)]
struct MpvTime {
	position: f64,
	duration: Option<f64>,
	remaining: f64,
}

#[derive(Debug, Default, Serialize)]
struct MpvPosition {
	time: MpvTime,
	// title: i64,
	chapter: Option<i64>,
}

#[derive(Debug, Default, Serialize)]
struct Status {
	playback_status: PlaybackStatus,
	repeat: VideoRepeatType,
	shuffle: bool,
}

#[derive(Debug, Default, Serialize)]
pub struct MpvStatus {
	position: MpvPosition,
	title: Option<String>,
	audio: Option<MpvAudioStatus>,
	video: Option<MpvVideoStatus>,
	status: Status,
	chapters: Vec<Chapter>,
	#[serde(skip_serializing_if = "Option::is_none")]
	jellyfin_id: Option<JellyfinId>,
	filename: Option<String>,
	path: Option<String>,
}

#[tauri::command]
pub async fn mpv_status(mpv: State<'_, MpvState>, id: State<'_, CurrentId>) -> Result<MpvStatus, String> {
	use_mpv_lock(mpv, |mpv| status(mpv, Arc::clone(&id))).inspect_err(|e| {
		eprintln!("An error occurred obtaining MPV Status: {}", e)
	}).map_err(|e| e.to_string())
}

fn status(mpv: &mut Mpv, id: CurrentId) -> Result<MpvStatus, Box<dyn Error>> {
	let mut status = MpvStatus::default();
	// Time
	// println!("Getting Time...");
	{
		let position = mpv.get_property::<f64>("time-pos").ok();
		let remaining = mpv.get_property::<f64>("time-remaining").ok();
		let duration = mpv.get_property::<f64>("duration").ok();
		let chapter = mpv.get_property::<i64>("chapter").ok();
		status.position = MpvPosition {
			time: MpvTime {
				position: position.unwrap_or(0.),
				duration,
				remaining: remaining.unwrap_or(0.),
			},
			chapter,
		};
	}
	// Title
	// println!("Getting title...");
	{
		status.title = mpv.get_property::<String>("media-title").ok();
	}
	// Chapters
	// println!("Getting chapter");
	{
		status.chapters = get_chapters(mpv).ok().unwrap_or(Vec::new());
	}
	// Audio
	// println!("Getting audio...");
	{
		let format = mpv.get_property::<String>("audio-params/format").ok();
		let channels = mpv.get_property::<String>("audio-params/hr-channels").ok();
		let maybe_codec = mpv.get_property::<String>("aid").ok();
		status.audio = Some(MpvAudioStatus {
			format,
			channels,
			codec: maybe_codec,
		});
	}
	// Video Status
	{
		status.video = None;
	}
	// Pause/Stop status
	// println!("Getting playback status...");
	{
		let paused = mpv.get_property::<bool>("pause")?;
		// When (playlist-pos == -1), there is no currently playing item. Therefore we're stopped.
		let playlist_pos = mpv.get_property::<i64>("playlist-pos")?;
		let playback_status = match (playlist_pos == -1, paused) {
			(false, true) => PlaybackStatus::Paused,
			(false, false) => PlaybackStatus::Playing,
			(true, _) => PlaybackStatus::Stopped,
		};
		status.status = Status {
			playback_status,
			// Loop/A-B Repeat/Shuffle status
			repeat: VideoRepeatType::Off,
			shuffle: false,
		};
	}
	// Jellyfin ID
	{
		if let Ok(jellyfin_id) = id.try_lock() {
			status.jellyfin_id = jellyfin_id.as_ref().map(|v| v.clone());
		}
	}
	// Path/File
	// println!("Getting file path...");
	{
		status.filename = mpv.get_property::<String>("filename").ok();
		status.path = mpv.get_property::<String>("path").ok();
	}
	Ok(status)
}

pub(crate) fn get_chapters(mpv: &mut Mpv) -> Result<Vec<Chapter>, libmpv2::Error> {
    let count = mpv.get_property::<i64>("chapter-list/count")?;
	if count == 0 {
		return Ok(Vec::with_capacity(0));
	}
	if count > 10000 {
		return Err(libmpv2::Error::Raw(count as i32))
	}
	let mut chapters = Vec::with_capacity(count as usize);
	for i in 0..count {
        let title = mpv.get_property::<String>(&format!("chapter-list/{}/title", i)).ok();
        let time = mpv.get_property::<f64>(&format!("chapter-list/{}/time", i))?;
        // println!("Scene info: Title: {title} Time: {time}");
		chapters.push(Chapter { title, time });
    }
	Ok(chapters)
}