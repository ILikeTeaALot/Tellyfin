use std::{ffi::OsString, fs, io::Write, path::PathBuf};

use serde::{Deserialize, Serialize};
use serde_json::{json, Map};
use tauri::{AppHandle, Manager};

type TomlValue = toml::Value;
type JsonValue = serde_json::Value;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
	file_name: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Copy)]
pub enum SettingsFile {
	User,
	System,
	Plugins,
}

#[derive(Serialize, Deserialize)]
pub enum Status {
	FileExists,
	FileCreated,
}

#[derive(Serialize, Deserialize)]
pub struct SettingFileStatus {
	status: Status,
	path: OsString,
	content: JsonValue,
}

fn settings_dir(app: &AppHandle) -> Result<PathBuf, String> {
	app.path().app_config_dir().map_err(|e| e.to_string())
}

fn settings_file_path(app: &AppHandle, name: SettingsFile) -> Result<PathBuf, String> {
	let mut final_path = settings_dir(app).inspect_err(|e| eprintln!("{}", &e))?;
	final_path.push(match name {
		SettingsFile::User => "UserSettings.toml",
		SettingsFile::System => "SystemSettings.toml",
		SettingsFile::Plugins => "PluginSettings.toml",
	});
	Ok(final_path)
}

#[tauri::command]
pub fn save_settings(app: AppHandle, name: SettingsFile, content: JsonValue) -> Result<(), String> {
	let final_path = settings_file_path(&app, name)?;
	// let mut file = fs::OpenOptions::new().write(true).open(&final_path).map_err(|e| e.to_string())?;
	let value: TomlValue = serde_json::from_str::<TomlValue>(content.as_str().unwrap_or("{}")).map_err(|e| e.to_string())?;
	let to_string_pretty = toml::to_string_pretty::<TomlValue>(&value).map_err(|e| e.to_string())?;
	fs::write(&final_path, to_string_pretty.as_bytes()).map_err(|e| e.to_string())?;
	Ok(())
}

#[tauri::command]
pub async fn read_settings(app: AppHandle, name: SettingsFile) -> Result<SettingFileStatus, String> {
	let final_path = settings_dir(&app)?;
	if let Err(e) = final_path.read_dir() {
		eprintln!("Error reading dir: {}", e);
		if let Err(e) = fs::create_dir_all(&final_path) {
			eprintln!("Error creating directories: {}", e);
			// Bail early - Nothing I can think of that can be done.
			return Err(e.to_string());
		}
	}
	let final_path = settings_file_path(&app, name)?;
	match fs::read_to_string(&final_path) {
		Ok(content) => {
			let content: JsonValue = toml::from_str::<JsonValue>(&content).map_err(|e| e.to_string())?;
			Ok(SettingFileStatus { status: Status::FileExists, path: final_path.clone().into_os_string(), content })
		}
		Err(e) => {
			eprintln!("Error reading file to string: {}", e);
			fs::write(&final_path, "null")
				.map(|_| SettingFileStatus {
					status: Status::FileCreated,
					path: final_path.into_os_string(),
					content: json!("{}"),
				})
				.map_err(|e| e.to_string())
		}
	}
}
