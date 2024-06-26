use tauri::State;

use super::PluginManager;

#[tauri::command]
pub async fn plugin_command<'a>(command: &'a str, args: Vec<String>, plugins: State<'a, PluginManager<'a>>) -> Result<(), String> {
	Ok(())
}