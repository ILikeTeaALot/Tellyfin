use std::{error::Error, fmt::Display, os::raw::c_uint, sync::Arc, thread};

use libmpv2::{Format, Mpv};
use serde::Serialize;
use serde_repr::Serialize_repr;
use tauri::{App, Manager, State};

use crate::{states::JellyfinId, use_mpv_lock, CurrentId, MpvState};

#[derive(Clone, Debug, Default, Serialize_repr)]
#[repr(u8)]
enum PlaybackStatus {
    #[default]
    Stopped = 0,
    Paused = 1,
    Playing = 2,
}

#[derive(Clone, Debug, Default, Serialize_repr)]
#[repr(u8)]
enum VideoRepeatType {
    #[default]
    Off = 0,
    On = 1,
    AB = 2,
}

#[derive(Clone, Debug, Default, Serialize)]
pub struct Chapter {
    pub title: Option<String>,
    pub time: f64,
}

#[derive(Clone, Debug, Default, Serialize)]
struct MpvAudioStatus {
    codec: Option<String>,
    channels: Option<String>,
    format: Option<String>,
}

#[derive(Clone, Debug, Default, Serialize)]
struct MpvVideoStatus {
    codec: String,
    format: String,
}

#[derive(Clone, Debug, Default, Serialize)]
enum MpvTrackType {
	#[default]
	Unknown,
	Video,
	Audio,
	Subtitle,
}

#[derive(Clone, Debug, Default, Serialize)]
struct MpvTrack {
	default: bool,
	forced: bool,
	selected: bool,
    name: String,
	title: Option<String>,
	codec: Option<String>,
	codec_desc: Option<String>,
	format: Option<String>,
	language: Option<String>,
    track: i64,
    track_type: MpvTrackType,
}

#[derive(Clone, Debug, Default, Serialize)]
struct MpvTrackInfo {
    audio: Vec<MpvTrack>,
    subtitles: Vec<MpvTrack>,
}

#[derive(Clone, Debug, Default, Serialize)]
struct MpvTime {
    position: f64,
    duration: Option<f64>,
    remaining: f64,
}

#[derive(Clone, Debug, Default, Serialize)]
struct MpvPosition {
    time: MpvTime,
    // title: i64,
    chapter: Option<i64>,
}

#[derive(Clone, Debug, Default, Serialize)]
struct Status {
    playback_status: PlaybackStatus,
    repeat: VideoRepeatType,
    shuffle: bool,
}

#[derive(Clone, Debug, Default, Serialize)]
pub struct MpvStatus {
    position: MpvPosition,
    title: Option<String>,
    audio: Option<MpvAudioStatus>,
    video: Option<MpvVideoStatus>,
    subtitle: Option<MpvTrack>,
    tracks: Option<Vec<MpvTrack>>,
    status: Status,
    chapters: Vec<Chapter>,
    // media_type: MediaType,
    #[serde(skip_serializing_if = "Option::is_none")]
    jellyfin_id: Option<JellyfinId>,
    filename: Option<String>,
    path: Option<String>,
}
#[derive(Clone, Debug, Serialize)]
#[serde(untagged)]
pub enum PropertyData {
    Unsupported,
    String(String),
    OsdString(String),
    Flag(bool),
    Int64(i64),
    Double(f64),
    // Node(&'a MpvNode),
}

impl From<libmpv2::events::PropertyData<'_>> for PropertyData {
    fn from(value: libmpv2::events::PropertyData) -> Self {
        match value {
            libmpv2::events::PropertyData::Str(str) => PropertyData::String(str.to_owned()),
            libmpv2::events::PropertyData::OsdStr(str) => PropertyData::OsdString(str.to_owned()),
            libmpv2::events::PropertyData::Flag(value) => PropertyData::Flag(value),
            libmpv2::events::PropertyData::Int64(value) => PropertyData::Int64(value),
            libmpv2::events::PropertyData::Double(value) => PropertyData::Double(value),
            libmpv2::events::PropertyData::Node(_) => PropertyData::Unsupported,
        }
    }
}

#[derive(Clone, Debug, Serialize)]
pub enum MpvEvent {
    /// Received when the player is shutting down
    Shutdown,
    /// *Has not been tested*, received when explicitly asked to MPV
    LogMessage {
        prefix: String,
        level: String,
        text: String,
        log_level: c_uint,
    },
    /// Received when using get_property_async
    GetPropertyReply {
        name: String,
        result: PropertyData,
        reply_userdata: u64,
    },
    /// Received when using set_property_async
    SetPropertyReply(u64),
    /// Received when using command_async
    CommandReply(u64),
    /// Event received when a new file is playing
    StartFile,
    /// Event received when the file being played currently has stopped, for an error or not
    EndFile(c_uint),
    /// Event received when a file has been *loaded*, but has not been started
    FileLoaded,
    ClientMessage(Vec<String>),
    VideoReconfig,
    AudioReconfig,
    /// The player changed current position
    Seek,
    PlaybackRestart,
    /// Received when used with observe_property
    PropertyChange {
        name: String,
        change: PropertyData,
        reply_userdata: u64,
    },
    /// Received when the Event Queue is full
    QueueOverflow,
    /// A deprecated event
    Deprecated(/* libmpv2_sys::mpv_event */),
}

impl From<libmpv2::events::Event<'_>> for MpvEvent {
    fn from(value: libmpv2::events::Event) -> Self {
        match value {
            libmpv2::events::Event::Shutdown => MpvEvent::Shutdown,
            libmpv2::events::Event::LogMessage {
                prefix,
                level,
                text,
                log_level,
            } => MpvEvent::LogMessage {
                prefix: prefix.to_owned(),
                level: level.to_owned(),
                text: text.to_owned(),
                log_level,
            },
            libmpv2::events::Event::GetPropertyReply {
                name,
                result,
                reply_userdata,
            } => MpvEvent::GetPropertyReply {
                name: name.to_owned(),
                result: result.into(),
                reply_userdata,
            },
            libmpv2::events::Event::SetPropertyReply(r) => MpvEvent::SetPropertyReply(r),
            libmpv2::events::Event::CommandReply(r) => MpvEvent::CommandReply(r),
            libmpv2::events::Event::StartFile => MpvEvent::StartFile,
            libmpv2::events::Event::EndFile(r) => MpvEvent::EndFile(r),
            libmpv2::events::Event::FileLoaded => MpvEvent::FileLoaded,
            libmpv2::events::Event::ClientMessage(m) => {
                MpvEvent::ClientMessage(m.clone().into_iter().map(|v| v.to_owned()).collect())
            }
            libmpv2::events::Event::VideoReconfig => MpvEvent::VideoReconfig,
            libmpv2::events::Event::AudioReconfig => MpvEvent::AudioReconfig,
            libmpv2::events::Event::Seek => MpvEvent::Seek,
            libmpv2::events::Event::PlaybackRestart => MpvEvent::PlaybackRestart,
            libmpv2::events::Event::PropertyChange {
                name,
                change,
                reply_userdata,
            } => MpvEvent::PropertyChange {
                name: name.to_owned(),
                change: change.into(),
                reply_userdata,
            },
            libmpv2::events::Event::QueueOverflow => MpvEvent::QueueOverflow,
            libmpv2::events::Event::Deprecated(_) => MpvEvent::Deprecated(),
        }
    }
}

pub fn setup_status_event(app: &App) -> Result<(), Box<dyn Error>> {
    let mpv_arc = Arc::clone(&app.state::<MpvState>());
    let mut mpv = mpv_arc.lock().unwrap();
    let mpv = mpv.as_mut().unwrap();
    let cx = mpv.event_context_mut();
    cx.enable_all_events()?;
    let mpv = mpv_arc.clone();
    let handle = app.handle().clone();
    match cx.observe_property("pause", Format::Flag, 1701) {
        Err(e) => eprintln!("Error occurred observing property [pause]: {}", e),
        _ => (),
    }
    cx.set_wakeup_callback(move || {
        let mpv = mpv.clone();
        let handle = handle.clone();
        thread::spawn(move || match mpv.lock() {
            Ok(mut mpv) => match mpv.as_mut() {
                Some(mpv) => {
                    let mut events_to_poll = true;
                    while events_to_poll {
                        let ev = mpv.event_context_mut().wait_event(0.);
                        if let Some(Ok(ev)) = ev {
                            use MpvEvent::*;
                            let ev = MpvEvent::from(ev);
                            // Do special stuff for a specific event.
                            match &ev {
								Shutdown => (),
								LogMessage { prefix, level, text, log_level } => (),
								GetPropertyReply { name, result, reply_userdata } => (),
								SetPropertyReply(_) => (),
								CommandReply(_) => (),
								StartFile => (),
								EndFile(_) => println!("End File event called!"),
								FileLoaded => println!("File Loaded event called!"),
								ClientMessage(_) => (),
								VideoReconfig => (),
								AudioReconfig => (),
								Seek => println!("Seek event called!"),
								PlaybackRestart => (),
								PropertyChange { name, change, reply_userdata } => (),
								QueueOverflow => (),
								Deprecated(/* _ */) => (),
							}
                            match handle.emit("mpv-event", ev) {
                                Ok(_) => (),
                                Err(error) => {
                                    eprintln!("Error occurred emitting mpv-event: {}", error)
                                }
                            }
                        } else if let None = ev {
                            events_to_poll = false;
                        }
                    }
                }
                None => {}
            },
            Err(error) => {
                eprintln!("Error occurred while locking: {}", error);
            }
        });
        return;
    });
    Ok(())
}

#[tauri::command]
pub async fn mpv_status(
    mpv: State<'_, MpvState>,
    id: State<'_, CurrentId>,
) -> Result<MpvStatus, String> {
    use_mpv_lock(mpv, |mpv| status(mpv, Arc::clone(&id)))
        .inspect_err(|e| eprintln!("An error occurred obtaining MPV Status: {}", e))
        .map_err(|e| e.to_string())
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
        // status.chapters = Vec::new();
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
	// Subtitle
	{
		status.tracks = get_tracks(mpv).inspect_err(|e| eprintln!("Error occurred getting tracks: {}", e)).ok();
	}
    // Pause/Stop status
    // println!("Getting playback status...");
    {
        let paused = mpv.get_property::<bool>("pause")?;
        // When (playlist-pos == -1), there is no currently playing item. Therefore we're stopped.
        let playlist_pos = mpv.get_property::<i64>("playlist-pos")?;
        // let stopped = mpv.get_property::<i64>("eof-reached")?;
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
        // status.jellyfin_id = (*(id.try_lock().ok().unwrap_or(None)).as_ref()).unwrap_or(None);
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
        return Err(libmpv2::Error::Raw(count as i32));
    }
    let mut chapters = Vec::with_capacity(count as usize);
    for i in 0..count {
        let title = mpv
            .get_property::<String>(&format!("chapter-list/{}/title", i))
            .ok();
        let time = mpv.get_property::<f64>(&format!("chapter-list/{}/time", i))?;
        // println!("Scene info: Title: {title} Time: {time}");
        chapters.push(Chapter { title, time });
    }
    Ok(chapters)
}

fn get_tracks(mpv: &mut Mpv) -> Result<Vec<MpvTrack>, impl Display> {
    let count = mpv.get_property::<i64>("track-list/count")?;
    if count == 0 {
        return Ok(Vec::with_capacity(0));
    }
    if count > 10000 {
        return Err(libmpv2::Error::Raw(count as i32));
    }
    let mut tracks = Vec::with_capacity(count as usize);
    for i in 0..count {
        let title = mpv
            .get_property::<String>(&format!("track-list/{}/codec-desc", i))
            .ok();
        let default = mpv.get_property::<bool>(&format!("track-list/{}/default", i))?;
        let forced = mpv.get_property::<bool>(&format!("track-list/{}/forced", i))?;
        let selected = mpv.get_property::<bool>(&format!("track-list/{}/selected", i))?;
        let track = mpv.get_property::<i64>(&format!("track-list/{}/id", i))?;
        let language = mpv.get_property::<String>(&format!("track-list/{}/lang", i)).ok();
        let codec = mpv.get_property::<String>(&format!("track-list/{}/codec", i)).ok();
        let codec_desc = mpv.get_property::<String>(&format!("track-list/{}/codec-desc", i)).ok();
        let format = mpv.get_property::<String>(&format!("track-list/{}/format-name", i)).ok();
        let track_type = mpv.get_property::<String>(&format!("track-list/{}/type", i))?;
		let track_type = match &*track_type {
			"video" => MpvTrackType::Video,
			"audio" => MpvTrackType::Audio,
			"sub" => MpvTrackType::Subtitle,
			_ => MpvTrackType::Unknown,
		};
        // println!("Scene info: Title: {title} Time: {time}");
        let name = title.clone().unwrap_or("Unknown".into());
        tracks.push(MpvTrack { title, default, forced, selected, track, track_type, name, language, codec, codec_desc, format });
    }
    Ok(tracks)
}
