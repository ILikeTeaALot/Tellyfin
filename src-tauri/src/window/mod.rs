use std::error::Error;

use tauri::{App, LogicalPosition, Manager, Position};

pub fn init_window(app: &App) -> Result<(), Box<dyn Error>> {
	let window = app.get_window("main").unwrap();
	// Cursor
	window.set_cursor_visible(false)?;
	window.set_cursor_position(Position::Logical(LogicalPosition::new(10., 10.)))?;
	// TODO :: Run dynamic background in separate webview
	/* let width = 800.; // Initial set in tauri.conf.json
	let width = 600.; // Shouldn't matter because of .auto_resize()
	let _webview1 = window.add_child(
		tauri::webview::WebviewBuilder::new("background", WebviewUrl::App(Default::default()))
		.auto_resize()
		.transparent(true),
		LogicalPosition::new(0., 0.),
		LogicalSize::new(width, height),
		)?;
	let _webview2 = window.add_child(
		tauri::webview::WebviewBuilder::new("content", WebviewUrl::App(Default::default()))
		.auto_resize()
		.transparent(true),
		LogicalPosition::new(0., 0.),
		LogicalSize::new(width, height),
		)?; */
	// Devtools
	let webview_window = &window.get_webview_window("main").unwrap();
	webview_window.set_cursor_visible(false)?;
	#[cfg(debug_assertions)]
	// webview_window.open_devtools();
	webview_window.set_focus().ok();
	Ok(())
}
