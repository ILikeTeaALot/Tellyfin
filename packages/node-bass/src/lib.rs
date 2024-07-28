#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

mod audio;
pub mod util;

pub use audio::*;
use audio::bass::BassState;
use once_cell::sync::Lazy;

// pub static BASS: Lazy<BassState> = Lazy::new(|| BassState::new().expect("FIXME (BASS Init)"));
// pub static FEEDBACK_MANAGER: Lazy<BassState> = Lazy::new(|| BassState::new());