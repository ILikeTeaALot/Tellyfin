use std::{
	mem::size_of, os::raw::c_void, sync::{Arc, Mutex}, thread, time::Duration
};

use ::bass::{
	bass_sys::{
		BASS_ChannelFree, BASS_ChannelPlay, BASS_ChannelSetAttribute, BASS_ChannelSetPosition, BASS_ChannelSetSync,
		BASS_Mixer_ChannelRemove, BASS_Mixer_ChannelSetPosition, BASS_Mixer_ChannelSetSync, BASS_SampleLoad,
		BASS_StreamCreateFile, BASS_ATTRIB_BUFFER, BASS_ATTRIB_MIXER_THREADS, BASS_MIXER_BUFFER,
		BASS_MIXER_CHAN_DOWNMIX, BASS_MIXER_END, BASS_MIXER_NONSTOP, BASS_MIXER_RESUME, BASS_POS_BYTE,
		BASS_SAMCHAN_STREAM, BASS_SAMPLE_FLOAT, BASS_SAMPLE_LOOP, BASS_SAMPLE_OVER_POS, BASS_STREAM_AUTOFREE,
		BASS_STREAM_DECODE, BASS_SYNC_DEV_FAIL, BASS_SYNC_DEV_FORMAT, BASS_SYNC_END, BASS_SYNC_FREE, BASS_SYNC_MIXTIME,
		BASS_SYNC_ONETIME, BASS_SYNC_THREAD, DWORD, FALSE, HSTREAM, HSYNC, QWORD, TRUE,
	},
	error::BassError,
	mixer::Mixer,
	null::NULL,
	sample::Sample,
	stream::Stream,
	types::channel::ChannelSetAttribute, // stream::Stream,
	                                     // types::channel::ChannelSetAttribute,
};
use bass::BassState;
use serde::Deserialize;
// use tauri::{AppHandle, Manager, State};
use windows_sys::Win32::{Foundation::GetLastError, UI::Input::KeyboardAndMouse::{SendInput, INPUT, INPUT_0, MOUSEEVENTF_ABSOLUTE, MOUSEEVENTF_LEFTDOWN, MOUSEEVENTF_LEFTUP, MOUSEEVENTF_RIGHTDOWN, MOUSEEVENTF_RIGHTUP, MOUSEINPUT}};

use crate::{/* settings::{UserSettings, UserSettingsManager}, theme::ThemeManager, */ util::SafeLock};

pub mod bass;

#[derive(Debug, PartialEq, Eq, Deserialize)]
#[non_exhaustive]
#[napi(string_enum)]
pub enum FeedbackSound {
	Enter,
	Back,
	Move,
	MoveCategory,
	Cursor, // IDK
	Ok,
	No,
	Coldboot,
	Gameboot,
}

// static SFX_CURSOR: &[u8] = include_bytes!("./data/PS2/SCPH-10000_00015.wav");
// static SFX_MOVE: &[u8] = include_bytes!("./data/PS2/SCPH-10000_00015.wav");
// static SFX_MOVE_CATEGORY: &[u8] = include_bytes!("./data/PS2/SCPH-10000_00017.wav");
// static SFX_ENTER: &[u8] = include_bytes!("./data/PS2/SCPH-10000_00016.wav");
// static SFX_BACK: &[u8] = include_bytes!("./data/PS2/SCPH-10000_00021.wav");
// // static SFX_NO: &[u8] = include_bytes!("./data/PS2/SCPH-10000_00019.wav");
// static SFX_NO: &[u8] = include_bytes!("./data/PS2/SCPH-10000_00012.wav");
// static SFX_OK: &[u8] = include_bytes!("./data/PS2/SCPH-10000_00017.wav");

// static SFX_COLDBOOT_MULTI: &[u8] = include_bytes!("./data/PS3/coldboot_multi.ac3");
// static SFX_GAMEBOOT: &[u8] = include_bytes!("./data/PS3/gameboot_stereo.ac3");
// static SFX_CURSOR: &[u8] = include_bytes!("./data/PS3/SE02_Cursor.flac");
// static SFX_MOVE: &[u8] = include_bytes!("./data/PS3/SE02_Cursor.flac");
// static SFX_MOVE_CATEGORY: &[u8] = include_bytes!("./data/PS3/SE05_Category_OK.flac");
// static SFX_ENTER: &[u8] = include_bytes!("./data/PS3/SE03_Normal_OK.flac");
// static SFX_BACK: &[u8] = include_bytes!("./data/PS3/SE04_Back.flac");
// static SFX_NO: &[u8] = include_bytes!("./data/PS3/SE13_System_NG.flac");
// static SFX_OK: &[u8] = include_bytes!("./data/PS3/SE12_System_OK.flac");

static SFX_NO_FILE: &[u8] = include_bytes!("./data/snd_error.wav");

//                            bits   sample rate
static BACKGROUND_START: u64 = 24 * 4 * 48000 * 11;
// static BACKGROUND_START: u64 = 0;
//                                bytes       seconds

#[napi]
pub struct AudioFeedbackManager {
	// _move: &'static [u8],
	// enter: &'static [u8],
	// back: &'static [u8],
	coldboot: Mutex<Stream>,
	gameboot: Mutex<Sample>,
	move_vertical: Mutex<Sample>,
	enter: Mutex<Sample>,
	back: Mutex<Sample>,
	cursor: Mutex<Sample>,
	move_category: Mutex<Sample>,
	ok: Mutex<Sample>,
	no: Mutex<Sample>,
	background: Mutex<Option<Stream>>,

	mixer: Arc<Mixer>,
}

fn device_failed(_: HSYNC, _: DWORD, _: DWORD, _: &()) {
	eprintln!("Device Failed/Destroyed!");
}

fn format_changed(_: HSYNC, _: DWORD, _: DWORD, _: &()) {
	eprintln!("Device Format Changed!");
}

// fn update_audio_feedback(app: &AppHandle, new_settings: &UserSettings) {
// 	println!("Here I should change audio feedback samples");
// 	let theme = app.state::<ThemeManager>();
// 	let path = theme.path_for_theme(&new_settings.theme.sound);
// 	println!("Here's the path for the current theme: {}", path.unwrap_or(String::from("Couldn't get path for some reason")));
// }

extern "C" fn restart_background(_: HSYNC, handle: DWORD, data: DWORD, _: *mut c_void) {
	println!("Background ending... Restarting!");
	println!("BASS_POS_END Data: {}", data);
	BASS_Mixer_ChannelSetPosition(handle, BACKGROUND_START, BASS_POS_BYTE);
}

#[napi]
impl AudioFeedbackManager {
	#[napi(constructor)]
	pub fn new(/* settings: &UserSettingsManager, theme: &ThemeManager */) -> Self {
		// settings.add_listener(update_audio_feedback);
		let mixer = Mixer::new(48000, 8, Some(1.), BASS_MIXER_NONSTOP | BASS_SAMPLE_FLOAT | BASS_MIXER_RESUME);
		mixer.play(TRUE).ok();
		// mixer.set_attribute(ChannelSetAttribute::Buffer, 0.);
		BASS_ChannelSetAttribute(mixer.handle(), BASS_ATTRIB_MIXER_THREADS, 4.);
		mixer.set_sync(device_failed, BASS_SYNC_DEV_FAIL, 0, ());
		mixer.set_sync(format_changed, BASS_SYNC_DEV_FORMAT, 0, ());
		let background = Stream::new(
			"./themes/PS2/music/ps2 ambience uncompressed.wav",
			// "./themes/PS2/sound/SCPH-10000_00019.wav",
			BASS_SAMPLE_FLOAT | BASS_STREAM_DECODE,
			None::<DWORD>,
		).ok();
		// .expect("Stream");
		#[allow(unused_unsafe)]
		unsafe {
			if let Some(background) = background.as_ref() {
				BASS_ChannelSetSync(
					background.handle(),
					BASS_SYNC_END | BASS_SYNC_MIXTIME,
					0,
					Some(restart_background),
					NULL,
				);
			}
		};
		if let Some(background) = background.as_ref() {
			BASS_ChannelSetPosition(background.handle(), BACKGROUND_START, BASS_POS_BYTE);
		}
		// mixer.add(background.handle(), 0).ok();
		Self {
			background: Mutex::new(background),
			coldboot: Mutex::new(
				Stream::new(
					"./themes/PS3/sound/coldboot2_multi.ac3",
					BASS_SAMPLE_FLOAT | BASS_STREAM_DECODE,
					// 0,
					// None::<DWORD>,
					// 65535,
					None::<DWORD>,
				)
				.expect("Sample MUST work"),
			),
			// coldboot: Stream::new(
			// 	"/Users/ghost/Downloads/ps2 ambience uncompressed.wav",
			// 	BASS_SAMPLE_FLOAT | BASS_STREAM_DECODE,
			// 	None::<DWORD>,
			// ).expect("Sample MUST work"),
			gameboot: Mutex::new(
				Sample::new_file(
					"./themes/PS3/sound/gameboot_multi.ac3",
					BASS_SAMPLE_FLOAT | BASS_SAMPLE_OVER_POS,
					0,
					None::<DWORD>,
					65535,
					None::<DWORD>,
				)
				.expect("Sample MUST work"),
			),
			move_vertical: Mutex::new(
				Sample::new_file(
					"./themes/PS3/sound/snd_cursor.wav",
					BASS_SAMPLE_FLOAT | BASS_SAMPLE_OVER_POS,
					0,
					None,
					65535,
					None::<DWORD>,
				)
				.expect("Sample MUST work"),
			),
			enter: Mutex::new(
				Sample::new_file(
					"./themes/PS3/sound/snd_decide.wav",
					BASS_SAMPLE_FLOAT | BASS_SAMPLE_OVER_POS,
					0,
					None,
					65535,
					None::<DWORD>,
				)
				.expect("Sample MUST work"),
			),
			back: Mutex::new(
				Sample::new_file(
					"./themes/PS3/sound/snd_cancel.wav",
					BASS_SAMPLE_FLOAT | BASS_SAMPLE_OVER_POS,
					0,
					None,
					65535,
					None::<DWORD>,
				)
				.expect("Sample MUST work"),
			),
			cursor: Mutex::new(
				Sample::new_file(
					"./themes/PS3/sound/snd_cursor.wav",
					BASS_SAMPLE_FLOAT | BASS_SAMPLE_OVER_POS,
					0,
					None,
					65535,
					None::<DWORD>,
				)
				.expect("Sample MUST work"),
			),
			move_category: Mutex::new(
				Sample::new_file(
					"./themes/PS3/sound/snd_category_decide.wav",
					BASS_SAMPLE_FLOAT | BASS_SAMPLE_OVER_POS,
					0,
					None,
					65535,
					None::<DWORD>,
				)
				.expect("Sample MUST work"),
			),
			no: Mutex::new(
				Sample::new_file(
					"./themes/PS3/sound/snd_system_ng.wav",
					BASS_SAMPLE_FLOAT | BASS_SAMPLE_OVER_POS,
					0,
					None,
					65535,
					None::<DWORD>,
				)
				.expect("Sample MUST work"),
			),
			ok: Mutex::new(
				Sample::new_file(
					"./themes/PS3/sound/snd_system_ok.wav",
					BASS_SAMPLE_FLOAT | BASS_SAMPLE_OVER_POS,
					0,
					None,
					65535,
					None::<DWORD>,
				)
				.expect("Sample MUST work"),
			),
			mixer,
		}
	}

	#[napi]
	pub fn play(&self, sound: FeedbackSound) {
		/* Attempt 1 */
		// let data = match sound {
		// 	FeedbackSound::Enter => Some((self.enter.as_ptr(), self.enter.len())),
		// 	FeedbackSound::Back => Some((self.back.as_ptr(), self.back.len())),
		// 	FeedbackSound::Move => Some((self._move.as_ptr(), self._move.len())),
		// 	_ => None,
		// };
		// if let Some((ptr, len)) = data {
		// 	// let chan = unsafe { BASS_StreamCreateFile(true, ptr as *const c_void, 0, len, BASS_STREAM_DECODE | BASS_SAMPLE_FLOAT) };
		// 	let chan = Stream::new_mem_static(memory, BASS_STREAM_DECODE | BASS_SAMPLE_FLOAT, None);
		// 	BASS_ChannelSetAttribute(chan, BASS_ATTRIB_BUFFER, 0.);
		// 	BASS_ChannelSetSync(chan, BASS_SYNC_END | BASS_SYNC_THREAD | BASS_SYNC_ONETIME, 0, Some(Self::free_channel), NULL);
		// 	self.mixer.add(chan, 0).ok();
		// }
		/* Attempt 2 */
		// let chan = match sound {
		// 	FeedbackSound::Enter => {
		// 		Some(Stream::new_mem_static(self.enter, BASS_STREAM_DECODE | BASS_SAMPLE_FLOAT, None::<DWORD>))
		// 	}
		// 	FeedbackSound::Back => {
		// 		Some(Stream::new_mem_static(self.back, BASS_STREAM_DECODE | BASS_SAMPLE_FLOAT, None::<DWORD>))
		// 	}
		// 	FeedbackSound::Move => {
		// 		Some(Stream::new_mem_static(self._move, BASS_STREAM_DECODE | BASS_SAMPLE_FLOAT, None::<DWORD>))
		// 	}
		// 	_ => None,
		// };
		// if let Some(Ok(chan)) = chan {
		// 	// chan.set_attribute(ChannelSetAttribute::Buffer, 0.);
		// 	unsafe {
		// 		BASS_Mixer_ChannelSetSync(
		// 			chan.handle(),
		// 			BASS_SYNC_END | BASS_SYNC_THREAD | BASS_SYNC_ONETIME,
		// 			0,
		// 			Some(Self::free_channel),
		// 			NULL,
		// 		)
		// 	};
		// 	self.mixer.add(chan.handle(), 0).ok();
		// }
		/* Attempt 3 */
		let flags = BASS_SAMPLE_OVER_POS | BASS_SAMCHAN_STREAM | BASS_STREAM_DECODE;
		let chan = match sound {
			FeedbackSound::Enter => self.enter.safe_lock().get_channel(flags),
			FeedbackSound::Move => self.move_vertical.safe_lock().get_channel(flags),
			FeedbackSound::Back => self.back.safe_lock().get_channel(flags),
			FeedbackSound::MoveCategory => self.move_category.safe_lock().get_channel(flags),
			FeedbackSound::Cursor => self.cursor.safe_lock().get_channel(flags),
			FeedbackSound::Ok => self.ok.safe_lock().get_channel(flags),
			FeedbackSound::No => self.no.safe_lock().get_channel(flags),
			FeedbackSound::Coldboot => {
				let lock = self.coldboot.safe_lock();
				lock.set_position_bytes(0).ok();
				Some(*lock.handle())
			}
			FeedbackSound::Gameboot => self.gameboot.safe_lock().get_channel(flags),
		};
		if let Some(chan) = chan {
			if sound == FeedbackSound::Coldboot {
				// unsafe {
				// 	BASS_Mixer_ChannelSetSync(
				// 		chan,
				// 		// BASS_SYNC_END | BASS_SYNC_THREAD | BASS_SYNC_ONETIME,
				// 		BASS_SYNC_FREE | BASS_SYNC_ONETIME,
				// 		0,
				// 		Some(Self::free_c),
				// 		NULL,
				// 	);
				// }
				self.mixer.pause().ok();
				self.mixer.dump().ok();
				if let Some(background) = self.background.safe_lock().as_ref() {
					BASS_ChannelSetPosition(background.handle(), BACKGROUND_START, BASS_POS_BYTE);
				}
				coldboot_actions();
				// self.mixer.flush();
			}
			let flags = if sound == FeedbackSound::Coldboot {
				BASS_MIXER_CHAN_DOWNMIX
			} else {
				BASS_STREAM_AUTOFREE | BASS_MIXER_CHAN_DOWNMIX
			};
			match self.mixer.add(chan, flags) {
				Ok(_) => (),
				Err(e) => eprintln!("Error adding to mixer! {}", e),
			}
			self.mixer.play(FALSE).ok();
		} else {
			eprintln!("{}", BassError::default());
		}
	}

	// unsafe extern "C" fn free_channel(_: HSYNC, channel: DWORD, _: DWORD, _: *mut c_void) {
	// 	// BASS_ChannelFree(channel);
	// 	BASS_Mixer_ChannelRemove(channel);
	// }

	// unsafe extern "C" fn queue_background(_: HSYNC, _: DWORD, _: DWORD, user: *mut c_void) {
	// 	println!("Playing background audio...");
	// 	let ok = BASS_ChannelPlay(DWORD(user as u32), false);
	// 	if !ok {
	// 		eprintln!("Error occurred: {}", BassError::default());
	// 	}
	// }

	#[napi]
	pub fn play_background(&self) {
		if let Some(background) = self.background.safe_lock().as_ref() {
			self.mixer.add(background.handle(), BASS_MIXER_CHAN_DOWNMIX).ok();
		}
	}

	#[napi]
	pub fn stop_background(&self) {
		if let Some(background) = self.background.safe_lock().as_ref() {
			self.mixer.remove_channel(background.handle()).ok();
		}
	}
}

// #[napi(js_name = "play_feedback")]
pub fn play_feedback(sound: FeedbackSound, manager: &AudioFeedbackManager) {
	manager.play(sound)
}

pub fn play_background(manager: &AudioFeedbackManager) {
	manager.play_background()
}

pub fn stop_background(manager: &AudioFeedbackManager) {
	manager.stop_background()
}

/// IMPORTANT
/// 
/// Call this function before anything else!
#[allow(non_snake_case)]
#[napi]
pub fn init_BASS() -> BassState {
	BassState::new().expect("Handling this in JS is too hard...")
}

// #[napi(js_name = "reinit_bass")]
// pub fn _reinit_bass() {
// 	reinit_bass(&BASS)
// }

pub fn reinit_bass(manager: &BassState) {
	match manager.restart() {
		Ok(_) => (),
		Err(e) => eprintln!("BASS Restart Failed! {}", e),
	}
}

/// It may not be in this location forever, but this is where as many startup actions as can be done after window-creation should happen.
fn coldboot_actions() {
	#[cfg(all(target_os = "windows"))]
	thread::spawn(move || {
		thread::sleep(Duration::from_millis(60));
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