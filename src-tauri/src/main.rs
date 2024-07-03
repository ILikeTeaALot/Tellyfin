// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod audio;
mod mpv;
mod plugins;
mod states;
mod window;
use libmpv2::Mpv;
use mpv::{control::*, init::*, status::*};
use states::JellyfinId;
use window::init_window;

use std::sync::Mutex;
use std::sync::Arc;
use std::error::Error;

use audio::{AudioFeedbackManager, play_feedback, play_background, stop_background, reinit_bass, bass::BassState};

type MpvStateInner = Option<Mpv>;
pub type MpvState = Arc<Mutex<MpvStateInner>>;
pub type CurrentId = Arc<Mutex<Option<JellyfinId>>>;

fn main() {
	tauri::Builder::default()
    	// .manage(Arc::new(Mutex::<Option<Child>>::new(None)))
    	// .manage(Arc::new(Mutex::<Option<MpvSocket>>::new(None)))
		.manage(Arc::new(Mutex::<MpvStateInner>::new(None)))
		// .manage(Arc::new(Mutex::<Option<JellyfinId>>::new(None)))
		.manage(CurrentId::default())
		.manage(BassState::new().expect("Bass is required at this time."))
		.manage(AudioFeedbackManager::new())
		.setup(|app| -> Result<(), Box<dyn Error>> {
			init_mpv(app).inspect_err(|e| {
				eprintln!("Error occurred in MPV initialisation: {}", e)
			})?;
			init_window(app)?;
			setup_status_event(app)?;
			Ok(())
		})
		.plugin(tauri_plugin_shell::init())
		.invoke_handler(tauri::generate_handler![
			// MARK - MPV
			transport_command,
			seek,
			play_file,
			set_track,
			mpv_status,
			// MARK - Audio Subsystem
			play_feedback,
			play_background,
			stop_background,
			reinit_bass,
		])
		.register_uri_scheme_protocol("mpv", |app, req| {
			tauri::http::Response::builder().body(Vec::new()).unwrap()
		})
		// .build(tauri::generate_context!())
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
