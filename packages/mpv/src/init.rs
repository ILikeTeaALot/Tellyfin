use std::error::Error;

use libmpv2::Mpv;

use crate::{map_dyn_error, MPV};

/// `window_handle`: `Option`al because it's pointless on Wayland.
#[napi]
pub fn _init(window_handle: Option<u32>, config_dir: String) -> Result<(), napi::Error> {
	init_mpv(window_handle, config_dir).map_err(map_dyn_error)
}

/// TODO: A way to reload MPV when non-runtime settings are changed
pub fn init_mpv(window_handle: Option<u32>, config_dir: String) -> Result<(), Box<dyn Error>> {
	// let window = app.get_webview_window("main").unwrap();
	// let handle = window.window_handle()?;
	// let handle = match handle.as_raw() {
	// 	// RawWindowHandle::UiKit(handle) => { handle.ui_window as u32 }
	// 	RawWindowHandle::AppKit(handle) => handle.ns_view.as_ptr() as u32,
	// 	RawWindowHandle::Xlib(handle) => handle.window as u32,
	// 	RawWindowHandle::Xcb(handle) => handle.window.get() as u32,
	// 	// RawWindowHandle::Wayland(_) => {}
	// 	// RawWindowHandle::Drm(_) => {}
	// 	// RawWindowHandle::Gbm(_) => {}
	// 	RawWindowHandle::Win32(handle) => handle.hwnd.get() as u32,
	// 	_ => unimplemented!("Unsupported platform!"),
	// };
	println!("About to load MPV...");
	let mpv = Mpv::with_initializer(|mpv| {
		// General Config
		if let Some(handle) = window_handle {
			mpv.set_property("wid", handle.to_string())?;
		}
		mpv.set_property("idle", "yes")?;
		mpv.set_property("osc", "no")?;
		mpv.set_property("force-window", "immediate")?;
		mpv.set_property("keep-open", "yes")?;
		mpv.set_property("keep-open-pause", "no")?;
		// OSC/OSD
		mpv.set_property("osd-bar", "no")?;
		/* mpv.set_property("osd-bar-align-y", "0.95")?;
		mpv.set_property("osd-bar-w", "90")?; */
		// Subtitles
		mpv.set_property("slang", "en")?; // TODO :: Read from config file
		// mpv.set_property("sub-auto", "all")?; // TODO :: Read from config file
		mpv.set_property("subs-with-matching-audio", "forced")?; // TODO :: Read from config file
		mpv.set_property("subs-match-os-language", "yes")?; // TODO :: Read from config file
		// Audio Language
		mpv.set_property("alang", "default,jp,en,English,Japanese")?; // TODO :: I want to select default if it matches one of these, or force one of them if neither are default but either one is available.
		// DVD/Blu-ray Playback
		mpv.set_property("dvd-speed", "2")?;
		// Watch Later - TODO :: Store DVD/Blu-ray position
		mpv.set_property("watch-later-dir", config_dir.as_str())?;
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
		let mut lock = MPV.lock().unwrap();

		*lock = Some(mpv);

		drop(lock);

		println!("MPV Spawn Process complete!");
	}
	Ok(())
}