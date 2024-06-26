use std::error::Error;

use tauri::{App, Manager};

pub fn init_window(app: &App) -> Result<(), Box<dyn Error>> {
    let window = app.get_webview_window("main").unwrap();
    // Cursor
    window.set_cursor_visible(false)?;
    // Devtools
    // #[cfg(debug_assertions)]
    // window.open_devtools();
    Ok(())
}
