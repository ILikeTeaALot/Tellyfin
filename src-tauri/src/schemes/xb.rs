use tauri::{http, AppHandle, Manager, UriSchemeResponder};

pub fn handler(app: &AppHandle, request: http::Request<Vec<u8>>, responder: UriSchemeResponder) {
	let path = request.uri().path();
	let query = request.uri().query();
	match app.path().app_config_dir() {
		Ok(path) => {
			tauri::async_runtime::spawn(async_handler(responder));
		}
		Err(e) => {
			eprintln!("Look I don't know what to do in this situation. At a time when this function is called the app config dir should definitely exist and be set. Error: {}", e);
		}
	}
}

async fn async_handler(responder: UriSchemeResponder) {
	responder.respond(http::Response::new(vec![]))
}