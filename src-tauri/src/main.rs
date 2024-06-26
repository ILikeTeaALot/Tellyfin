// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod mpv;
mod plugins;
mod states;
use libmpv2::Mpv;
use mpv::{control::*, init::*, status::*};
use states::JellyfinId;

use std::sync::Mutex;
use std::sync::Arc;
use std::error::Error;

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
		.setup(|app| -> Result<(), Box<dyn Error>> {
			init_mpv(app).inspect_err(|e| {
				eprintln!("Error occurred in MPV initialisation: {}", e)
			})?;
			init_window(app)?;
			setup_status_event(app)?;
			Ok(())
		})
		.plugin(tauri_plugin_shell::init())
		.invoke_handler(tauri::generate_handler![greet, transport_command, seek, play_file, set_track, mpv_status])
		.register_uri_scheme_protocol("mpv", |app, req| {
			tauri::http::Response::builder().body(Vec::new()).unwrap()
		})
		// .build(tauri::generate_context!())
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
