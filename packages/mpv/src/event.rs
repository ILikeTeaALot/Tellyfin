use crate::{map_dyn_error, MpvState, MPV};

use std::convert::Infallible;
use std::{sync::Arc, thread};

use std::error::Error;

use libmpv2::Format;
use napi::bindgen_prelude::{Either5, Either6, Either7, Either8};
use napi::threadsafe_function::{ThreadSafeCallContext, ThreadsafeFunction, ThreadsafeFunctionCallMode};
use napi::{CallContext, JsFunction, JsUndefined};
use serde::Serialize;

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

/// This exists as a temporary stand-in
fn emit(_: &str, _: impl Serialize) -> Result<(), Infallible> {
	Ok(())
}

#[napi(js_name = "MpvEvent", string_enum)]
#[derive(Default)]
pub enum NapiMpvEvent {
	/// Received when the player is shutting down
	#[default]
	Shutdown,
	/// *Has not been tested*, received when explicitly asked to MPV
	LogMessage /* {
		prefix: String,
		level: String,
		text: String,
		log_level: c_uint,
	} */,
	/// Received when using get_property_async
	GetPropertyReply /* {
		name: String,
		result: PropertyData,
		reply_userdata: u64,
	} */,
	/// Received when using set_property_async
	SetPropertyReply/* (u64) */,
	/// Received when using command_async
	CommandReply/* (u64) */,
	/// Event received when a new file is playing
	StartFile,
	/// Event received when the file being played currently has stopped, for an error or not
	EndFile/* (c_uint) */,
	/// Event received when a file has been *loaded*, but has not been started
	FileLoaded,
	ClientMessage/* (Vec<String>) */,
	VideoReconfig,
	AudioReconfig,
	/// The player changed current position
	Seek,
	PlaybackRestart,
	/// Received when used with observe_property
	PropertyChange /* {
		name: String,
		change: PropertyData,
		reply_userdata: u64,
	} */,
	/// Received when the Event Queue is full
	QueueOverflow,
	/// A deprecated event
	Deprecated/* (libmpv2_sys::mpv_event) */,
}

// ()
// String(String),
// OsdString(String),
// Flag(bool),
// Int64(i64),
// Double(f64),

impl From<PropertyData> for serde_json::Value {
	fn from(value: PropertyData) -> Self {
		use serde_json::{Number, Value};
		match value {
			PropertyData::Unsupported => Value::Null,
			PropertyData::String(str) | PropertyData::OsdString(str) => Value::String(str),
			PropertyData::Flag(flag) => Value::Bool(flag),
			PropertyData::Int64(int) => Value::Number(Number::from(int)),
			PropertyData::Double(double) => Value::Number(Number::from_f64(double).unwrap_or(Number::from(0))),
		}
	}
}

#[napi(object)]
pub struct LogMessage{
	pub prefix: String,
	pub level: String,
	pub text: String,
	pub log_level: u32,
}

#[napi(object)]
pub struct GetPropertyReply {
	pub name: String,
	pub result: serde_json::Value,
	pub reply_userdata: u32,
}

#[napi(object)]
pub struct PropertyChange {
	pub name: String,
	pub change: serde_json::Value,
	pub reply_userdata: u32,
}

pub type NapiMpvEventEx = Either8<(), LogMessage, GetPropertyReply, u64, u64, u32, Vec<String>, PropertyChange>;

#[napi(object)]
#[derive(Default)]
pub struct MpvEventEx {
	pub event: NapiMpvEvent,
	pub log_message: Option<LogMessage>,
	pub get_property_reply: Option<GetPropertyReply>,
	pub set_property_reply: Option<i64>,
	pub command_reply: Option<i64>,
	pub end_file: Option<u32>,
	pub client_message: Option<Vec<String>>,
	pub property_change: Option<PropertyChange>,
}

impl From<MpvEvent> for NapiMpvEvent {
	fn from(value: MpvEvent) -> Self {
		match value {
			MpvEvent::Shutdown => NapiMpvEvent::Shutdown,
			MpvEvent::LogMessage { prefix, level, text, log_level } => NapiMpvEvent::LogMessage,
			MpvEvent::GetPropertyReply { name, result, reply_userdata } => NapiMpvEvent::GetPropertyReply,
			MpvEvent::SetPropertyReply(_) => NapiMpvEvent::SetPropertyReply,
			MpvEvent::CommandReply(_) => NapiMpvEvent::CommandReply,
			MpvEvent::StartFile => NapiMpvEvent::StartFile,
			MpvEvent::EndFile(_) => NapiMpvEvent::EndFile,
			MpvEvent::FileLoaded => NapiMpvEvent::FileLoaded,
			MpvEvent::ClientMessage(_) => NapiMpvEvent::ClientMessage,
			MpvEvent::VideoReconfig => NapiMpvEvent::VideoReconfig,
			MpvEvent::AudioReconfig => NapiMpvEvent::AudioReconfig,
			MpvEvent::Seek => NapiMpvEvent::Seek,
			MpvEvent::PlaybackRestart => NapiMpvEvent::PlaybackRestart,
			MpvEvent::PropertyChange { name, change, reply_userdata } => NapiMpvEvent::PropertyChange,
			MpvEvent::QueueOverflow => NapiMpvEvent::QueueOverflow,
			MpvEvent::Deprecated() => NapiMpvEvent::Deprecated,
		}
	}
}

impl From<MpvEvent> for MpvEventEx {
	fn from(value: MpvEvent) -> Self {
		match value {
			MpvEvent::Shutdown => MpvEventEx {
				event: NapiMpvEvent::Shutdown,
				..Default::default()
			},
			MpvEvent::LogMessage { prefix, level, text, log_level } => MpvEventEx {
				event: NapiMpvEvent::LogMessage,
				log_message: Some(LogMessage { prefix, level, text, log_level }),
				..Default::default()
			},
			MpvEvent::GetPropertyReply { name, result, reply_userdata } => MpvEventEx {
				event: NapiMpvEvent::GetPropertyReply,
				get_property_reply: Some(GetPropertyReply { name, result: result.into(), reply_userdata: reply_userdata as u32 }),
				..Default::default()
			},
			MpvEvent::SetPropertyReply(reply) => MpvEventEx {
				event: NapiMpvEvent::SetPropertyReply,
				set_property_reply: Some(reply as i64),
				..Default::default()
			},
			MpvEvent::CommandReply(reply) => MpvEventEx {
				event: NapiMpvEvent::CommandReply,
				command_reply: Some(reply as i64),
				..Default::default()
			},
			MpvEvent::StartFile => MpvEventEx {
				event: NapiMpvEvent::StartFile,
				..Default::default()
			},
			MpvEvent::EndFile(reason) => MpvEventEx {
				event: NapiMpvEvent::EndFile,
				end_file: Some(reason),
				..Default::default()
			},
			MpvEvent::FileLoaded => MpvEventEx {
				event: NapiMpvEvent::FileLoaded,
				..Default::default()
			},
			MpvEvent::ClientMessage(message) => MpvEventEx {
				event: NapiMpvEvent::ClientMessage,
				client_message: Some(message),
				..Default::default()
			},
			MpvEvent::VideoReconfig => MpvEventEx {
				event: NapiMpvEvent::VideoReconfig,
				..Default::default()
			},
			MpvEvent::AudioReconfig => MpvEventEx {
				event: NapiMpvEvent::AudioReconfig,
				..Default::default()
			},
			MpvEvent::Seek => MpvEventEx {
				event: NapiMpvEvent::Seek,
				..Default::default()
			},
			MpvEvent::PlaybackRestart => MpvEventEx {
				event: NapiMpvEvent::PlaybackRestart,
				..Default::default()
			},
			MpvEvent::PropertyChange { name, change, reply_userdata } => MpvEventEx {
				event: NapiMpvEvent::PropertyChange,
				property_change: Some(PropertyChange { name, change: change.into(), reply_userdata: reply_userdata as u32 }),
				..Default::default()
			},
			MpvEvent::QueueOverflow => MpvEventEx {
				event: NapiMpvEvent::QueueOverflow,
				..Default::default()
			},
			MpvEvent::Deprecated() => MpvEventEx {
				event: NapiMpvEvent::Deprecated,
				log_message: None,
				get_property_reply: None,
				set_property_reply: None,
				command_reply: None,
				end_file: None,
				client_message: None,
				property_change: None,
			},
		}
	}
}

pub fn setup_status_event(handler: ThreadsafeFunction<MpvEventEx>) -> Result<(), Box<dyn Error>> {
	let mpv_arc = Arc::clone(&MPV);
	let mut mpv = mpv_arc.lock().unwrap();
	let mpv = mpv.as_mut().unwrap();
	// let id = app.state::<CurrentId>();
	// app.emit("mpv-status", status(mpv, id)?);
	let cx = mpv.event_context_mut();
	cx.enable_all_events()?;
	let mpv = mpv_arc.clone();
	// let handle = app.handle().clone();
	match cx.observe_property("pause", Format::Flag, 1701) {
		Err(e) => eprintln!("Error occurred observing property [pause]: {}", e),
		_ => (),
	}
	cx.set_wakeup_callback(move || {
		let mpv = mpv.clone();
		let handler = handler.clone();
		// let handle = handle.clone();
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
							// match emit("mpv-event", ev) {
							// 	Ok(_) => (),
							// 	Err(error) => {
							// 		eprintln!("Error occurred emitting mpv-event: {}", error)
							// 	}
							// }
							match handler.clone().call(Ok(ev.into()), ThreadsafeFunctionCallMode::NonBlocking) {
								napi::Status::Ok => (),
								napi::Status::InvalidArg => (),
								napi::Status::ObjectExpected => (),
								napi::Status::StringExpected => (),
								napi::Status::NameExpected => (),
								napi::Status::FunctionExpected => (),
								napi::Status::NumberExpected => (),
								napi::Status::BooleanExpected => (),
								napi::Status::ArrayExpected => (),
								napi::Status::GenericFailure => (),
								napi::Status::PendingException => (),
								napi::Status::Cancelled => (),
								napi::Status::EscapeCalledTwice => (),
								napi::Status::HandleScopeMismatch => (),
								napi::Status::CallbackScopeMismatch => (),
								napi::Status::QueueFull => (),
								napi::Status::Closing => (),
								napi::Status::BigintExpected => (),
								napi::Status::DateExpected => (),
								napi::Status::ArrayBufferExpected => (),
								napi::Status::DetachableArraybufferExpected => (),
								napi::Status::WouldDeadlock => (),
								napi::Status::NoExternalBuffersAllowed => (),
								napi::Status::Unknown => (),
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
