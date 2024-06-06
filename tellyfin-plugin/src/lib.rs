use std::ffi::{c_char, CString, OsStr};

use dlopen2::wrapper::WrapperApi;
use libtellyfin::{PluginInfo, PluginResult, PluginXMBIconList};

pub use dlopen2::wrapper::Container;

#[derive(WrapperApi)]
pub struct Plugin<'plugin> {
	/// However, from the perspective of the host application, [`PluginInfo`] only lives as long as the plugin itself.
	tellyfin_plugin_init: extern "C" fn() -> PluginResult<PluginInfo<'plugin>>,
	tellyfin_plugin_exec: extern "C" fn(command: *const c_char, args: *const *const c_char, args_len: usize) -> PluginResult<*mut c_char>,
	tellyfin_plugin_drop: Option<extern "C" fn() -> PluginResult<()>>,
	tellyfin_plugin_icons: Option<extern "C" fn() -> PluginXMBIconList<'static>>,
}

pub fn plugin_load<'a>(path: impl AsRef<OsStr>) -> Result<Container<Plugin<'a>>, dlopen2::Error> {
	unsafe { Container::load(path) }
}

pub fn plugin_exec(plugin: &Container<Plugin>, command: &str, args: &[&str]) -> String {
	let command = CString::new(command).expect("");
	// let query = CString::new("star trek tng intro").expect("");
	// let args: [*const c_char; 1] = [query.as_ptr()];
	let args: Vec<_> = args.iter()
		.map(|arg| CString::new(*arg).expect("No Nulls"))
		// .map(|string| string.into_raw())
		.collect();
	let args: Vec<_> = args.iter().map(|arg| arg.as_ptr()).collect();
	println!("args: {:?}", args);
	println!("args_len: {:?}", args.len());
	// let results = plugin.tellyfin_plugin_exec(PluginString::from("search"), args.as_ptr(), 1);
	let results = plugin.tellyfin_plugin_exec(command.as_ptr(), args.as_ptr(), args.len());
	let results = Result::from(results);
	let results = results.expect("Error occurred parsing");
	// let results_string = String::from(results_string_raw);
	let results_string = unsafe { CString::from_raw(results) }.into_string().expect("UTF-8...");
	return results_string;
}

#[cfg(test)]
mod tests {
	use super::*;

	#[test]
	fn it_works() {
		// let result = add(2, 2);
		let plugin = plugin_load(r"G:\Projects\tellyfin-plugin-youtube\target\release\tellyfin_plugin_youtube.dll")
			.expect("Could not open library or load symbols");
		// assert_eq!(result, 4);
		let info = plugin.tellyfin_plugin_init().into().expect("Failed to initilialise plugin.");
		// let slice = unsafe { slice::from_raw_parts(info.name.0, info.name.1) };
		// let name = std::str::from_utf8(slice).expect("Invalid UTF-8");
		let name: &str = info.name.into();
		assert_eq!(name, "Tellyfin YouTube Plugin");
		println!("Plugin name: {}", name);
		let id: &str = info.id.into();
		assert_eq!(id, "org.tellyfin.invidious");
		println!("Plugin id: {}", id);
		/* let query = CString::new("star trek tng intro").expect("");
		let args: [*const c_char; 1] = [query.as_ptr()];
		// let results = plugin.tellyfin_plugin_exec(PluginString::from("search"), args.as_ptr(), 1);
		let command = CString::new("search").expect("");
		let results = plugin.tellyfin_plugin_exec(command.as_ptr(), args.as_ptr(), args.len());
		let results = Result::from(results);
		let results_string_raw = results.expect("Error occurred parsing");
		// let results_string = String::from(results_string_raw);
		let results_string = unsafe { CString::from_raw(results_string_raw) }.into_string().expect("UTF-8..."); */
		// let results_string = plugin_exec(&plugin, "search", &["q=how to boil an egg"]);
		// let results_string = plugin_exec(&plugin, "search", &["q=star trek tng intro"]);
		let results_string = plugin_exec(&plugin, "search", &["q=star trek", "region=GB"]);
		println!("Search Results: {}", results_string);
	}
}
