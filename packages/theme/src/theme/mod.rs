// pub mod icons; // TODO :: FIXME
pub mod sound;

use std::{
	error::Error, ffi::OsStr, fs::{self, ReadDir}, path::{Path, PathBuf}, sync::{atomic::{AtomicI64, Ordering}, Mutex}, thread
};

use napi::{bindgen_prelude::Buffer, threadsafe_function::{ThreadSafeCallContext, ThreadsafeFunction, ThreadsafeFunctionCallMode}, Status};

use rusqlite::Connection;
use serde::Deserialize;
use util::SafeLock;

// #[derive(sqlx::Encode, sqlx::Decode)]
#[derive(Debug, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
#[napi(string_enum)]
pub enum ThemeFeature {
	Background,
	Icons,
	Music,
	Sound,
}

// #[derive(sqlx::Encode, sqlx::Decode, sqlx::Type, sqlx::FromRow)]
#[derive(Debug, Deserialize)]
#[napi(object)]
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
#[napi(object)]
struct ThemeDefinition {
	pub theme: ThemeTable,
}

#[napi]
pub struct ThemeManager {
	database: Mutex<Connection>,
	theme_id: Mutex<String>,
	icon_theme: AtomicI64,
	sound_theme: AtomicI64,
	music_theme: AtomicI64,
}

#[napi]
impl ThemeManager {
	#[napi(constructor)]
	pub fn new(database_path: String) -> Self {
		// Self { themes: HashMap::with_capacity(8) }
		// let database =
		// 	Connection::open_with_flags(path, OpenFlags::SQLITE_OPEN_CREATE).expect("Cannot run without database");
		let database = Connection::open(database_path).expect("Cannot run without database");
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

	#[napi]
	pub fn register_themes(&self) {
		match fs::read_dir("./themes") {
			Ok(dir) => register_themes(&self.database, dir),
			Err(e) => {
				eprintln!("Error: {}", e);
				match fs::create_dir("./themes") {
					Ok(_) => self.register_themes(),
					Err(e) => {
						eprintln!("Error creating themes directory: {}", e);
						panic!();
					}
				}
			}
		}
	}

	#[allow(unused)]
	pub fn set_theme(&self, identifier: &str) {
		if *self.theme_id.safe_lock() == identifier {

		} else {
			*self.theme_id.safe_lock() = identifier.to_owned();
		}
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

fn register_themes(db: &Mutex<Connection>, dir: ReadDir) {
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

#[napi]
impl ThemeManager {
	#[napi]
	pub fn get_theme_icon(&'static self, theme_name: String, icon: String, responder: ThreadsafeFunction<Buffer>) {
		let theme = self;
		thread::spawn(move || {
			let (theme_ident, icon_key) = (&theme_name, &icon);
			let path_for_setting = theme.path_for_theme(theme_ident);
			if let Ok(theme_path) = path_for_setting {
				if let Ok(raw) = fs::read_to_string(format!("themes/{theme_path}/icon/Icons.toml")) {
					if let Ok(icon_table) = toml::from_str::<toml::Value>(&raw) {
						// let steps: Vec<&str> = .collect();
						let mut route = vec![Some(&icon_table)];
						for seg in icon_key.split('.') {
							// println!("Current \"tree\": {:?}", route);
							// println!("Path segment: {}", seg);
							match route.last() {
								Some(Some(toml::Value::Table(ref table))) => {
									route.push(table.get(seg));
								}
								// _ => (), // Error
								_ => {
									// responder.respond(
									// 	http::Response::builder()
									// 		.status(http::StatusCode::NOT_FOUND)
									// 		.header(http::header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
									// 		.header(http::header::CONTENT_TYPE, "image/png")
									// 		.body("ERROR: ICON NOT FOUND".as_bytes().to_vec())
									// 		.unwrap(),
									// );
									responder.call(Err(napi::Error::new(Status::GenericFailure, "ERROR: ICON NOT FOUND: Icon key not found")), ThreadsafeFunctionCallMode::NonBlocking);
									println!("¡Icon key not found!: {}", icon_key);
									return;
								}
							}
						}
						match route.last() {
							Some(Some(toml::Value::String(icon_path))) => {
								// println!("Icon Path?: {}", icon_path);
								let final_path = PathBuf::from(format!("themes/{theme_path}/icon/"));
								let final_path = final_path.join(icon_path);
								// responder.respond(fs::read(final_path))
								if let Ok(icon_data) = fs::read(final_path) {
									// responder.respond(
									// 	http::Response::builder()
									// 		.status(http::StatusCode::OK)
									// 		.header(http::header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
									// 		.header(http::header::CONTENT_TYPE, "image/png")
									// 		.body(icon_data)
									// 		.unwrap(),
									// );
									responder.call(Ok(icon_data.into()), ThreadsafeFunctionCallMode::NonBlocking);
									return;
								}
							}
							_ => eprintln!("No icon found!")
						}
						responder.call(Err(napi::Error::new(Status::GenericFailure, "ERROR: ICON NOT FOUND: No Icon found")), ThreadsafeFunctionCallMode::NonBlocking);
						// responder.respond(
						// 	http::Response::builder()
						// 		.status(http::StatusCode::NOT_FOUND)
						// 		.header(http::header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
						// 		.header(http::header::CONTENT_TYPE, "image/png")
						// 		.body("ERROR: ICON NOT FOUND".as_bytes().to_vec())
						// 		.unwrap(),
						// );
						return;
					}
					eprintln!("no icon table!");
				}
				eprintln!("failed to read icon table file!");
			} else {
				eprintln!("no theme path!, {}", path_for_setting.unwrap_err());
			}
			responder.call(Err(napi::Error::new(Status::GenericFailure, "Failed to read file")), ThreadsafeFunctionCallMode::NonBlocking);
			// responder.respond(
			// 	http::Response::builder()
			// 		.status(http::StatusCode::SERVICE_UNAVAILABLE)
			// 		.header(http::header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
			// 		.header(http::header::CONTENT_TYPE, "text/plain")
			// 		.body("failed to read file".as_bytes().to_vec())
			// 		.unwrap(),
			// );
			return;
			// eprintln!("Invalid path format!: {}", path);
			// responder.call(Err(napi::Error::new(Status::InvalidArg, "Expected path in format: [theme.identifier]/[icon.key.*]")), ThreadsafeFunctionCallMode::NonBlocking);
			// responder.respond(
			// 	http::Response::builder()
			// 		.status(http::StatusCode::BAD_REQUEST)
			// 		.header(http::header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
			// 		.header(http::header::CONTENT_TYPE, "text/plain")
			// 		.body("Expected path in format: [theme.identifier]/[icon.key.*]".as_bytes().to_vec())
			// 		.unwrap(),
			// );
		});
	}
}