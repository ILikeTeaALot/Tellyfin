use std::{error::Error, mem::size_of, thread, time::Duration};

use bass::bass_sys::{MAKELONG, WORD};
use tauri::{App, CursorIcon, LogicalPosition, LogicalSize, Manager, Position, WebviewUrl, WindowEvent};
use windows_sys::Win32::{
	Foundation::GetLastError,
	System::SystemServices::{MK_LBUTTON, MK_RBUTTON},
	UI::{
		Input::KeyboardAndMouse::{
			SendInput, INPUT, INPUT_0, INPUT_TYPE, MOUSEEVENTF_ABSOLUTE, MOUSEEVENTF_LEFTDOWN, MOUSEEVENTF_LEFTUP,
			MOUSEEVENTF_RIGHTDOWN, MOUSEEVENTF_RIGHTUP, MOUSEINPUT,
		},
		WindowsAndMessaging::{
			PostMessageA, PostMessageW, ShowCursor, WM_LBUTTONDOWN, WM_LBUTTONUP, WM_RBUTTONDOWN, WM_RBUTTONUP,
		},
	},
};

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
	/* #[cfg(all(target_os = "windows"))]
	{
		// let hwnd = window.hwnd().expect("Window to have HWND");
		// unsafe { ShowCursor(0) };
		let f = move |ev: &WindowEvent| match ev {
			tauri::WindowEvent::Focused(is_focused) => {
				if *is_focused {
					thread::spawn(move || {
						thread::sleep(Duration::from_millis(100));
						/* let pos = MAKELONG(WORD(10), WORD(10));
						// unsafe { PostMessageW(hwnd.0, WM_LBUTTONDOWN, MK_LBUTTON as usize, pos.0 as isize) };
						// unsafe { PostMessageW(hwnd.0, WM_LBUTTONUP, MK_LBUTTON as usize, pos.0 as isize) };
						unsafe { PostMessageW(hwnd.0, WM_RBUTTONDOWN, MK_RBUTTON as usize, pos.0 as isize) };
						unsafe { PostMessageW(hwnd.0, WM_RBUTTONUP, MK_RBUTTON as usize, pos.0 as isize) }; */
						println!("Sending fake input!");
						let input_down = INPUT_0 {
							mi: MOUSEINPUT {
								dx: 10,
								dy: 10,
								mouseData: 0,
								dwFlags: MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_ABSOLUTE,
								time: 0,
								dwExtraInfo: 0,
							},
						};
						let input_up = INPUT_0 {
							mi: MOUSEINPUT {
								dx: 10,
								dy: 10,
								mouseData: 0,
								dwFlags: MOUSEEVENTF_LEFTUP | MOUSEEVENTF_ABSOLUTE,
								time: 100,
								dwExtraInfo: 0,
							},
						};
						let pinputs =
							vec![INPUT { r#type: 0, Anonymous: input_down }, INPUT { r#type: 0, Anonymous: input_up }];
						// let result = unsafe { SendInput(2, pinputs.as_ptr(), size_of::<MOUSEINPUT>() as i32) };
						let result = unsafe { SendInput(2, pinputs.as_ptr(), size_of::<INPUT>() as i32) };
						println!("fake input (size 40) sent!");
						if result != 2 {
							let error = unsafe { GetLastError() };
							println!("Error sending inputs: {error}. Actual input count sent: {result}");
						}
					});
				}
			}
			_ => (),
		};
		window.on_window_event(f);
		// f(WindowEvent::Focused(true));
	} */
	webview_window.set_cursor_visible(false)?;
	#[cfg(debug_assertions)]
	// webview_window.open_devtools();
	webview_window.set_focus().ok();
	Ok(())
}
