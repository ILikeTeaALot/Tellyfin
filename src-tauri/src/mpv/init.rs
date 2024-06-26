use std::error::Error;

use libmpv2::Mpv;
use raw_window_handle::{HasWindowHandle, RawWindowHandle};
use tauri::{App, Manager};

use crate::MpvState;

pub fn init_mpv(app: &App) -> Result<(), Box<dyn Error>> {
	let window = app.get_webview_window("main").unwrap();
	let handle = window.window_handle()?;
	let handle = match handle.as_raw() {
		// RawWindowHandle::UiKit(handle) => { handle.ui_window as u32 }
		RawWindowHandle::AppKit(handle) => handle.ns_view.as_ptr() as u32,
		RawWindowHandle::Xlib(handle) => handle.window as u32,
		RawWindowHandle::Xcb(handle) => handle.window.get() as u32,
		// RawWindowHandle::Wayland(_) => {}
		// RawWindowHandle::Drm(_) => {}
		// RawWindowHandle::Gbm(_) => {}
		RawWindowHandle::Win32(handle) => handle.hwnd.get() as u32,
		_ => unimplemented!("Unsupported platform!"),
	};
	println!("About to load MPV...");
	let mpv = Mpv::with_initializer(|mpv| {
		// General Config
		mpv.set_property("wid", handle.to_string())?;
		mpv.set_property("idle", "yes")?;
		mpv.set_property("osc", "no")?;
		mpv.set_property("force-window", "immediate")?;
		// OSC/OSD
		mpv.set_property("osd-bar", "no")?;
		/* mpv.set_property("osd-bar-align-y", "0.95")?;
		mpv.set_property("osd-bar-w", "90")?; */
		// Subtitles
		mpv.set_property("slang", "en")?; // TODO :: Read from config file
		mpv.set_property("subs-with-matching-audio", "forced")?; // TODO :: Read from config file
		mpv.set_property("subs-match-os-language", "yes")?; // TODO :: Read from config file
		// Audio Output
		mpv.set_property("audio-spdif", "ac3,eac3,dts,dts-hd")?;
		mpv.set_property("audio-channels", "7.1,5.1,stereo")?;
		// Video Output/Decoding
		mpv.set_property("vo", "gpu-next")?;
		mpv.set_property("hwdec", "auto-safe")?;
		Ok(())
	})?;
	println!("MPV Loaded");

	let client_name = mpv.get_property::<String>("client_name").ok();
	let version = mpv.get_property::<String>("get_version").ok();
	let filename = mpv.get_property::<String>("filename").ok();

	println!("Client name: {:?}", client_name);
	println!("Version: {:?}", version);
	println!("Filename: {:?}", filename);

	{
		let state = app.state::<MpvState>().clone();
		let mut lock = state.lock().unwrap();

		*lock = Some(mpv);

		drop(lock);

		println!("MPV Spawn Process complete!");
	}
	Ok(())
}