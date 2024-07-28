#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

use std::{
	error::Error,
	sync::{Arc, Mutex},
};

use libmpv2::Mpv;
use napi::{threadsafe_function::{ThreadSafeCallContext, ThreadsafeFunction}, CallContext, JsFunction, JsUndefined, JsUnknown};
use once_cell::sync::Lazy;

mod control;
mod deinit;
mod event;
mod init;
mod states;
mod status;

pub use control::*;
pub use deinit::*;
pub use event::*;
pub use init::*;
pub use states::*;
pub use status::*;

type MpvState = Arc<Mutex<Option<Mpv>>>;

static MPV: Lazy<MpvState> = Lazy::new(|| Arc::new(Mutex::new(None)));

pub(crate) fn map_dyn_error(e: Box<dyn Error>) -> napi::Error {
	napi::Error::from_reason(e.to_string())
}

pub(crate) fn map_string_error(e: String) -> napi::Error {
	napi::Error::from_reason(e)
}

#[napi(js_name = "listenForEvent")]
pub fn not_even_named_this(func: ThreadsafeFunction<MpvEventEx>) -> Result<(), napi::Error> {
	// let func = ctx.get::<JsFunction>(0)?;
	// let handler = (&func).create_threadsafe_function(0, |ctx: ThreadSafeCallContext<NapiMpvEvent>| {
	// 	Ok(vec![ctx.value])
	// 	//   .iter()
	// 	//   .map(|v| ctx.env.create_uint32(*v))
	// 	//   .collect::<napi::Result<NapiMpvEvent>>()
	// })?;
	//   Ok(())
	setup_status_event(func).map_err(map_dyn_error)
}
