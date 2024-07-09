// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod audio;
mod database;
mod mpv;
mod plugins;
mod query;
mod settings;
mod states;
mod theme;
pub mod util;
mod window;
use database::TellyfinDB;
use libmpv2::Mpv;
use mpv::{control::*, event::*, init::*, status::*};
use query::unsafe_query;
use settings::settings_file_path;
use settings::SettingsFile;
use states::PlaybackId;
use tauri::Manager;
use theme::ThemeManager;
use window::init_window;

use std::error::Error;
use std::fs;
use std::sync::Arc;
use std::sync::Mutex;

use audio::{bass::BassState, play_background, play_feedback, reinit_bass, stop_background, AudioFeedbackManager};
use settings::{read_settings, save_settings, UserSettingsManager};

type MpvStateInner = Option<Mpv>;
pub type MpvState = Arc<Mutex<MpvStateInner>>;
pub type CurrentId = Arc<Mutex<Option<PlaybackId>>>;

fn main() {
	tauri::Builder::default()
		.register_asynchronous_uri_scheme_protocol("icon", theme::icons::handler)
		.manage(Arc::new(Mutex::<MpvStateInner>::new(None)))
		.manage(CurrentId::default())
		.manage(BassState::new().expect("Bass is required at this time."))
		.setup(|app| -> Result<(), Box<dyn Error>> {
			let base_config_path = app.path().app_config_dir()?;
			fs::create_dir_all(&base_config_path)?; // Create app config path
			let database_path = base_config_path.join("data.db");
			let settings_manager = UserSettingsManager::new(app.handle().clone(), settings_file_path(app.handle(), SettingsFile::User)?)?;
			init_mpv(app, &base_config_path)
				.inspect_err(|e| eprintln!("Error occurred in MPV initialisation: {}", e))?;
			init_window(app)?;
			setup_status_event(app)?;
			println!("Setting up DB");
			println!("DB Path: {:?}", &database_path);
			app.manage(TellyfinDB::new(&database_path)?);
			println!("Setting up ThemeManager");
			let theme_manager = ThemeManager::new(&settings_manager, &database_path);
			println!("Register themes");
			theme_manager.register_themes(app);
			println!("Setup Audio Feedback");
			app.manage(AudioFeedbackManager::new(&settings_manager, &theme_manager));
			app.manage(settings_manager);
			println!("Manager ThemeManager");
			app.manage(theme_manager);
			Ok(())
		})
		.plugin(tauri_plugin_http::init())
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
			// MARK - Settings
			save_settings,
			read_settings,
			// MARK - Database Querying
			unsafe_query,
		])
		.register_uri_scheme_protocol("mpv", |app, req| tauri::http::Response::builder().body(Vec::new()).unwrap())
		// .build(tauri::generate_context!())
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
