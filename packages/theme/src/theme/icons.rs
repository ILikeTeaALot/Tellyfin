use std::{fs, path::PathBuf, thread};

use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct IconTable {
	root: toml::Table,
	general: toml::Table,
	photos: toml::Table,
	music: toml::Table,
	video: toml::Table,
	tv: toml::Table,
	settings: toml::Table,
}

// impl FromSql for IconTable {
// 	fn column_result(value: rusqlite::types::ValueRef<'_>) -> rusqlite::types::FromSqlResult<Self> {
// 		todo!()
// 	}
// }

use tauri::{http, AppHandle, Manager, UriSchemeResponder};

use super::ThemeManager;

pub fn handler(app: &AppHandle, request: http::Request<Vec<u8>>, responder: UriSchemeResponder) {
	// As per docs, skip lead `/`
	// println!("URI: {}", request.uri());
	let path = request.uri().path()[1..].to_string().replace("%2F", "/");
	// println!("Path: {}", icon);
	/* let query = request.uri().query(); */
	let app = app.clone();
	thread::spawn(move || {
		if let Some((theme_ident, icon_key)) = path.split_once("/") {
			let theme = app.state::<ThemeManager>();
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
									responder.respond(
										http::Response::builder()
											.status(http::StatusCode::NOT_FOUND)
											.header(http::header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
											.header(http::header::CONTENT_TYPE, "image/png")
											.body("ERROR: ICON NOT FOUND".as_bytes().to_vec())
											.unwrap(),
									);
									println!("¡Icon key not found!: {}", icon_key);
									return;
								}
							}
						}
						match route.last() {
							Some(Some(toml::Value::String(icon_path))) => {
								// println!("Icon Path?: {}", icon_path);
								let final_path = PathBuf::from("themes/PS3/icon/");
								let final_path = final_path.join(icon_path);
								// responder.respond(fs::read(final_path))
								if let Ok(icon_data) = fs::read(final_path) {
									responder.respond(
										http::Response::builder()
											.status(http::StatusCode::OK)
											.header(http::header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
											.header(http::header::CONTENT_TYPE, "image/png")
											.body(icon_data)
											.unwrap(),
									);
									return;
								}
							}
							_ => eprintln!("No icon found!")
						}
						responder.respond(
							http::Response::builder()
								.status(http::StatusCode::NOT_FOUND)
								.header(http::header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
								.header(http::header::CONTENT_TYPE, "image/png")
								.body("ERROR: ICON NOT FOUND".as_bytes().to_vec())
								.unwrap(),
						);
						return;
					}
					eprintln!("no icon table!");
				}
				eprintln!("failed to read icon table file!");
			} else {
				eprintln!("no theme path!, {}", path_for_setting.unwrap_err());
			}
			responder.respond(
				http::Response::builder()
					.status(http::StatusCode::SERVICE_UNAVAILABLE)
					.header(http::header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
					.header(http::header::CONTENT_TYPE, "text/plain")
					.body("failed to read file".as_bytes().to_vec())
					.unwrap(),
			);
			return;
		}
		eprintln!("Invalid path format!: {}", path);
		responder.respond(
			http::Response::builder()
				.status(http::StatusCode::BAD_REQUEST)
				.header(http::header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
				.header(http::header::CONTENT_TYPE, "text/plain")
				.body("Expected path in format: [theme.identifier]/[icon.key.*]".as_bytes().to_vec())
				.unwrap(),
		);
	});
}
