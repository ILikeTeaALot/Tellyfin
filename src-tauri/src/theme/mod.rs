mod sound;

use std::{
	ffi::OsStr,
	fs::{self, ReadDir},
	os::windows::fs::FileTypeExt,
	path::Path,
	sync::Mutex,
};

use rusqlite::Connection;
use serde::Deserialize;
use tauri::{App, AppHandle, Manager};

use crate::{database::TellyfinDB, util::SafeLock};

#[derive(Debug, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum ThemeFeature {
	Background,
	Icons,
	Music,
	Sound,
}

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
	theme_id: String,
}

impl ThemeManager {
	pub fn new(path: impl AsRef<Path>) -> Self {
		let database = Connection::open(path).expect("Cannot run without database");
		database.execute(include_str!("create_table.sql"), []).expect("THEMES table required.");
		Self { database: Mutex::new(database), theme_id: String::from("iliketeaalot.ps3") }
	}

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
}

fn register_themes(app: AppHandle, dir: ReadDir) {
	let db = app.state::<TellyfinDB>();
	let db = &**db;
	for entry in dir {
		match entry {
			Ok(entry) => match entry.file_type() {
				Ok(ok) => {
					if ok.is_dir() || ok.is_symlink_dir() {
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
											),
										) {
											Ok(changed) => {
												println!("Successfully inserted theme: {}. Rows changed: {changed}", theme.name)
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
						}
					}
				}
				Err(_) => todo!(),
			},
			Err(e) => eprintln!("Error reading dir entry: {}", e),
		}
	}
}
