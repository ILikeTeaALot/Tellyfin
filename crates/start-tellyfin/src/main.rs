// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![windows_subsystem = "windows"]
// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{ffi::CString, fs, process, ptr::null_mut, sync::mpsc::channel, /* thread, time::Duration */};

use windows_sys::Win32::{
	Foundation::{GetLastError, FALSE, HWND, TRUE},
	System::Threading::{AttachThreadInput, GetCurrentThreadId},
	UI::{
		Input::KeyboardAndMouse::{EnableWindow, SetActiveWindow, SetCapture, SetFocus},
		WindowsAndMessaging::{FindWindowA, GetWindowThreadProcessId, SetForegroundWindow},
	},
};

fn main() {
	let win_title = CString::new("Tellyfin VisualShell").expect("Tellyfin is both valid UTF-8 and has no null bytes");
	// Find Tellyfin's Window
	let hwnd: HWND = unsafe { FindWindowA(0 as *const u8, win_title.as_ptr() as *const u8) };
	if hwnd != null_mut() {
		println!("HWND: {}", hwnd as u32);
		let mut lpdwprocessid: u32 = 0;
		let process_id = unsafe { GetWindowThreadProcessId(hwnd, &mut lpdwprocessid) };
		if lpdwprocessid != 0 && process_id != 0 {
			println!("Process ID: {process_id}, HWND: {}", hwnd as u32);
			let this_process = unsafe { GetCurrentThreadId() };
			let ok = unsafe { AttachThreadInput(this_process, process_id, TRUE) };
			if ok != 0 {
				// OK!
				println!("Attached thread OK!");
				unsafe {
					SetForegroundWindow(hwnd);
					SetCapture(hwnd);
					SetFocus(hwnd);
					SetActiveWindow(hwnd);
					EnableWindow(hwnd, TRUE);
				};
				let ok = unsafe { AttachThreadInput(this_process, process_id, FALSE) };
				if ok != 0 {
					if let Some(mut path) = home::home_dir() {
						path.push("tellyfinsteamrunnerpid");
						fs::write(&path, format!("{}", process::id())).expect("Should be able to write file");
						// loop {
						// 	thread::sleep(Duration::from_secs(1))
						// }

						// Handle "Ctrl+C"/SIGINT/SIGTERM/SIGHUP
						let (tx, rx) = channel();
    
						ctrlc::set_handler(move || {
							fs::remove_file(&path).ok();
							tx.send(()).expect("Could not send signal on channel.");
						})
							.expect("Error setting Ctrl-C handler");

						rx.recv().expect("Could not receive from channel.");
					}
				} else {
					eprintln!("This is supposed to work!");
					panic!();
				}
			} else {
				let error = unsafe { GetLastError() };
				eprintln!("Failed to attach input! Error {error}");
			}
		}
	} else {
		eprintln!("Failed to get HWND");
	}
}
