pub mod icons;
pub mod sound;

use std::{
	error::Error, ffi::OsStr, fs::{self, ReadDir}, path::{self, Path}, sync::{atomic::{AtomicI64, Ordering}, Mutex}
};

use icons::IconTable;
use rusqlite::Connection;
use serde::Deserialize;
use tauri::{App, AppHandle, Manager};

use crate::{database::TellyfinDB, settings::{UserSettings, UserSettingsManager}, util::SafeLock};

// #[derive(sqlx::Encode, sqlx::Decode)]
#[derive(Debug, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum ThemeFeature {
	Background,
	Icons,
	Music,
	Sound,
}

// #[derive(sqlx::Encode, sqlx::Decode, sqlx::Type, sqlx::FromRow)]
#[derive(Debug, Deserialize)]
pub struct ThemeTable {
	pub name: String,
	pub identifier: String,
	pub version: String,
	pub description: Option<String>,
	pub authors: Vec<String>,
	/// I can't use a HashSet for this, so I need another way to handle a poorly written Theme.toml with a theme feature
	/// specified more than once...
	///
	/// This does raise an interesting question of “Can one theme provide more than one of an asset type?”
	pub features: Vec<ThemeFeature>,
}

#[derive(Debug, Deserialize)]
struct ThemeDefinition {
	pub theme: ThemeTable,
}

pub struct ThemeManager {
	database: Mutex<Connection>,
	theme_id: Mutex<String>,
	icon_theme: AtomicI64,
	sound_theme: AtomicI64,
	music_theme: AtomicI64,
}

impl ThemeManager {
	pub fn new(settings: &UserSettingsManager, path: impl AsRef<Path>) -> Self {
		// Self { themes: HashMap::with_capacity(8) }
		// let database =
		// 	Connection::open_with_flags(path, OpenFlags::SQLITE_OPEN_CREATE).expect("Cannot run without database");
		let database = Connection::open(path).expect("Cannot run without database");
		database.execute(include_str!("create_table.sql"), []).expect("THEMES table required.");
		Self {
			database: Mutex::new(database),
			theme_id: Mutex::new(String::from("iliketeaalot.ps3")),
			icon_theme: AtomicI64::new(0),
			sound_theme: AtomicI64::new(0),
			music_theme: AtomicI64::new(0),
		}
	}

	// pub fn icon_table_for_theme(&self, id: String) -> IconTable {
	// 	IconTable {
	// 		root: todo!(),
	// 		general: todo!(),
	// 		photos: todo!(),
	// 		music: todo!(),
	// 		video: todo!(),
	// 		tv: todo!(),
	// 		settings: todo!(),
	// 	}
	// }

	pub fn register_themes(&self, app: &mut App) {
		match fs::read_dir("./themes") {
			Ok(dir) => register_themes(app.handle().clone(), dir),
			Err(e) => {
				eprintln!("Error: {}", e);
				match fs::create_dir("./themes") {
					Ok(_) => self.register_themes(app),
					Err(e) => {
						eprintln!("Error creating themes directory: {}", e);
						panic!();
					}
				}
			}
		}
	}

	pub fn set_theme(&self, identifier: &str) {
		*self.theme_id.safe_lock() = identifier.to_owned();
		// Broadcast this change?
	}

	pub fn set_icons_theme(&self, identifier: &serde_json::Value) -> Result<(), Box<dyn Error>> {
		self.database.safe_lock().query_row("SELECT id FROM THEMES WHERE identifier = ? AND icons = 1", [identifier], |row| {
			let id = row.get("id")?;
			self.icon_theme.store(id, Ordering::Relaxed);
			Ok(())
		})?;
		Ok(())
	}

	pub fn set_sound_theme(&self, identifier: &serde_json::Value) -> Result<(), Box<dyn Error>> {
		self.database.safe_lock().query_row("SELECT id FROM THEMES WHERE identifier = ? AND sound = 1", [identifier], |row| {
			let id = row.get("id")?;
			self.sound_theme.store(id, Ordering::Relaxed);
			Ok(())
		})?;
		Ok(())
	}

	pub fn set_music_theme(&self, identifier: &serde_json::Value) -> Result<(), Box<dyn Error>> {
		self.database.safe_lock().query_row("SELECT id FROM THEMES WHERE identifier = ? AND music = 1", [identifier], |row| {
			let id = row.get("id")?;
			self.music_theme.store(id, Ordering::Relaxed);
			Ok(())
		})?;
		Ok(())
	}

	pub fn path_for_theme(&self, identifier: &str) -> Result<String, Box<dyn Error>> {
		let path_string = self.database.safe_lock().query_row("SELECT path FROM THEMES WHERE identifier = ?", [identifier], |row| row.get("path"))?;
		Ok(path_string)
	}
}

fn register_themes(app: AppHandle, dir: ReadDir) {
	let db = app.state::<TellyfinDB>();
	let db = &**db;
	for entry in dir {
		match entry {
			Ok(entry) => match entry.file_type() {
				Ok(ok) => {
					if ok.is_dir() {
						// Look for [dir]/Theme.toml
						let path = entry.path().join("Theme.toml");
						match fs::read_to_string(&path) {
							Ok(raw) => {
								let theme_info = toml::from_str::<ThemeDefinition>(&raw);
								match theme_info {
									Ok(ThemeDefinition { theme }) => {
										println!("{:?}", theme);
										let version = theme.version;
										let version: Vec<&str> = version.split('.').collect();
										match db.safe_lock().execute(include_str!("upsert_theme.sql"),
											(
												&theme.name,
												theme.identifier,
												version.get(0).unwrap_or(&"1"),
												version.get(1),
												version.get(2),
												theme.description,
												theme.authors.join(", "),
												theme.features.contains(&ThemeFeature::Sound),
												theme.features.contains(&ThemeFeature::Icons),
												theme.features.contains(&ThemeFeature::Music),
												// Path (?11) (./themes/[NAME]/ => [NAME]; should be easy to reconstruct).
												// If it's not representable in UTF-8, then the theme is pretty useless anyway.
												entry.file_name().to_str(),
											),
										) {
											Ok(changed) => {
												println!(
													"Successfully inserted theme: {}. Rows changed: {changed}",
													theme.name
												)
											}
											Err(error) => {
												eprintln!("Failed to insert themes into database: {}", error);
											}
										}
									}
									Err(e) => eprintln!("{}", e),
								}
							}
							Err(e) => eprintln!("Cannot read theme file: {:?} Error: {}", &path, e),
						}
					} else if ok.is_file() {
						if entry.path().extension() == Some(OsStr::new("tft")) {
							// File is a TellyFinTheme
							// ... TODO
						}
					}
				}
				Err(_) => todo!(),
			},
			Err(e) => eprintln!("Error reading dir entry: {}", e),
		}
	}
}
