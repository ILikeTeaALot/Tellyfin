// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod mpv;
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

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
	format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
	tauri::Builder::default()
		.manage(Arc::new(Mutex::<MpvStateInner>::new(None)))
		.manage(CurrentId::default())
		.setup(|app| -> Result<(), Box<dyn Error>> {
			init_mpv(app).inspect_err(|e| {
				eprintln!("Error occurred in MPV initialisation: {}", e)
			})?;
			Ok(())
		})
		.plugin(tauri_plugin_shell::init())
		.invoke_handler(tauri::generate_handler![greet, transport_command, seek, play_file, mpv_status])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
