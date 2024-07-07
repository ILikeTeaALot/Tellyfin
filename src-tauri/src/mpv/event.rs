use crate::MpvState;

use std::{sync::Arc, thread};

use std::error::Error;

use libmpv2::Format;
use serde::Serialize;
use tauri::{App, Manager};

use std::os::raw::c_uint;

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
			libmpv2::events::Event::LogMessage { prefix, level, text, log_level } => MpvEvent::LogMessage {
				prefix: prefix.to_owned(),
				level: level.to_owned(),
				text: text.to_owned(),
				log_level,
			},
			libmpv2::events::Event::GetPropertyReply { name, result, reply_userdata } => {
				MpvEvent::GetPropertyReply { name: name.to_owned(), result: result.into(), reply_userdata }
			}
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
			libmpv2::events::Event::PropertyChange { name, change, reply_userdata } => {
				MpvEvent::PropertyChange { name: name.to_owned(), change: change.into(), reply_userdata }
			}
			libmpv2::events::Event::QueueOverflow => MpvEvent::QueueOverflow,
			libmpv2::events::Event::Deprecated(_) => MpvEvent::Deprecated(),
		}
	}
}

pub fn setup_status_event(app: &App) -> Result<(), Box<dyn Error>> {
	let mpv_arc = Arc::clone(&app.state::<MpvState>());
	let mut mpv = mpv_arc.lock().unwrap();
	let mpv = mpv.as_mut().unwrap();
	// let id = app.state::<CurrentId>();
	// app.emit("mpv-status", status(mpv, id)?);
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
							/* let id = handle.state::<CurrentId>();
							let id = Arc::clone(&id);
							let status_ok = handle.emit(
								"mpv-status",
								status(mpv, id)
									.inspect_err(|e| {
										eprintln!("Error occurred getting status: {}", e)
									})
									.map_err(|e| e.to_string()),
							);
							match status_ok {
								Ok(_) => (),
								Err(error) => {
									eprintln!("Error occurred emitting mpv-status: {}", error)
								}
							} */
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
