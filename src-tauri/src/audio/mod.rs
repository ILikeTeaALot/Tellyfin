use std::{os::raw::c_void, sync::Arc};

use bass::BassState;
use ::bass::{
	bass_sys::{
		BASS_ChannelFree, BASS_ChannelPlay, BASS_ChannelSetAttribute, BASS_ChannelSetPosition, BASS_ChannelSetSync, BASS_Mixer_ChannelRemove, BASS_Mixer_ChannelSetPosition, BASS_Mixer_ChannelSetSync, BASS_SampleLoad, BASS_StreamCreateFile, BASS_ATTRIB_BUFFER, BASS_ATTRIB_MIXER_THREADS, BASS_MIXER_BUFFER, BASS_MIXER_CHAN_DOWNMIX, BASS_MIXER_END, BASS_MIXER_NONSTOP, BASS_MIXER_RESUME, BASS_POS_BYTE, BASS_SAMCHAN_STREAM, BASS_SAMPLE_FLOAT, BASS_SAMPLE_LOOP, BASS_SAMPLE_OVER_POS, BASS_STREAM_AUTOFREE, BASS_STREAM_DECODE, BASS_SYNC_DEV_FAIL, BASS_SYNC_DEV_FORMAT, BASS_SYNC_END, BASS_SYNC_FREE, BASS_SYNC_MIXTIME, BASS_SYNC_ONETIME, BASS_SYNC_THREAD, DWORD, FALSE, HSTREAM, HSYNC, QWORD, TRUE
	}, error::BassError, mixer::Mixer, null::NULL, sample::Sample, stream::Stream, types::channel::ChannelSetAttribute
	// stream::Stream,
	// types::channel::ChannelSetAttribute,
};
use serde::Deserialize;
use tauri::State;

pub mod bass;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Deserialize)]
#[non_exhaustive]
pub enum FeedbackSound {
	Enter,
	Back,
	Move,
	MoveCategory,
	Cursor, // IDK
	Ok,
	No,
	Coldboot,
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

//                            bits   sample rate
static BACKGROUND_START: u64 = 24 * 4 * 48000 * 11;
// static BACKGROUND_START: u64 = 0;
//                                bytes       seconds

pub struct AudioFeedbackManager {
	// _move: &'static [u8],
	// enter: &'static [u8],
	// back: &'static [u8],
	coldboot: Stream,
	gameboot: Sample,
	move_vertical: Sample,
	enter: Sample,
	back: Sample,
	cursor: Sample,
	move_category: Sample,
	ok: Sample,
	no: Sample,
	background: Stream,

	mixer: Arc<Mixer>,
}

fn device_failed(_: HSYNC, _: DWORD, _: DWORD, _: &()) {
	eprintln!("Device Failed/Destroyed!");
}

fn format_changed(_: HSYNC, _: DWORD, _: DWORD, _: &()) {
	eprintln!("Device Format Changed!");
}

extern "C" fn restart_background(_: HSYNC, handle: DWORD, data: DWORD, _: *mut c_void) {
	println!("Background ending... Restarting!");
	println!("BASS_POS_END Data: {}", data);
	BASS_Mixer_ChannelSetPosition(handle, BACKGROUND_START, BASS_POS_BYTE);
}

impl AudioFeedbackManager {
	pub fn new() -> Self {
		let mixer = Mixer::new(48000, 8, Some(1.), BASS_MIXER_NONSTOP | BASS_SAMPLE_FLOAT | BASS_MIXER_RESUME);
		mixer.play(TRUE).ok();
		// mixer.set_attribute(ChannelSetAttribute::Buffer, 0.);
		BASS_ChannelSetAttribute(mixer.handle(), BASS_ATTRIB_MIXER_THREADS, 4.);
		mixer.set_sync(device_failed, BASS_SYNC_DEV_FAIL, 0, ());
		mixer.set_sync(format_changed, BASS_SYNC_DEV_FORMAT, 0, ());
		let background = Stream::new(
			"./themes/PS2/sound/ps2 ambience uncompressed.wav",
			// "./themes/PS2/sound/SCPH-10000_00019.wav",
			BASS_SAMPLE_FLOAT | BASS_STREAM_DECODE /* | BASS_SAMPLE_LOOP */,
			None::<DWORD>,
		)
		.expect("Stream");
		#[allow(unused_unsafe)]
		unsafe { BASS_ChannelSetSync(background.handle(), BASS_SYNC_END | BASS_SYNC_MIXTIME, 0, Some(restart_background), NULL) };
		BASS_ChannelSetPosition(background.handle(), BACKGROUND_START, BASS_POS_BYTE);
		// mixer.add(background.handle(), 0).ok();
		Self {
			background,
			coldboot: Stream::new(
				"./themes/PS3/sound/coldboot_multi.wav",
				BASS_SAMPLE_FLOAT | BASS_STREAM_DECODE,
				// 0,
				// None::<DWORD>,
				// 65535,
				None::<DWORD>,
			)
			.expect("Sample MUST work"),
			// coldboot: Stream::new(
			// 	"/Users/ghost/Downloads/ps2 ambience uncompressed.wav",
			// 	BASS_SAMPLE_FLOAT | BASS_STREAM_DECODE,
			// 	None::<DWORD>,
			// ).expect("Sample MUST work"),
			gameboot: Sample::new_file(
				"./themes/PS3/sound/gameboot_multi.wav",
				BASS_SAMPLE_FLOAT | BASS_SAMPLE_OVER_POS,
				0,
				None::<DWORD>,
				65535,
				None::<DWORD>,
			)
			.expect("Sample MUST work"),
			move_vertical: Sample::new_file(
				"./themes/PS3/sound/snd_cursor.wav",
				BASS_SAMPLE_FLOAT | BASS_SAMPLE_OVER_POS,
				0,
				None,
				65535,
				None::<DWORD>,
			)
			.expect("Sample MUST work"),
			enter: Sample::new_file(
				"./themes/PS3/sound/snd_decide.wav",
				BASS_SAMPLE_FLOAT | BASS_SAMPLE_OVER_POS,
				0,
				None,
				65535,
				None::<DWORD>,
			)
			.expect("Sample MUST work"),
			back: Sample::new_file(
				"./themes/PS3/sound/snd_cancel.wav",
				BASS_SAMPLE_FLOAT | BASS_SAMPLE_OVER_POS,
				0,
				None,
				65535,
				None::<DWORD>,
			)
			.expect("Sample MUST work"),
			cursor: Sample::new_file(
				"./themes/PS3/sound/snd_cursor.wav",
				BASS_SAMPLE_FLOAT | BASS_SAMPLE_OVER_POS,
				0,
				None,
				65535,
				None::<DWORD>,
			)
			.expect("Sample MUST work"),
			move_category: Sample::new_file(
				"./themes/PS3/sound/snd_category_decide.wav",
				BASS_SAMPLE_FLOAT | BASS_SAMPLE_OVER_POS,
				0,
				None,
				65535,
				None::<DWORD>,
			)
			.expect("Sample MUST work"),
			no: Sample::new_file(
				"./themes/PS3/sound/snd_system_ng.wav",
				BASS_SAMPLE_FLOAT | BASS_SAMPLE_OVER_POS,
				0,
				None,
				65535,
				None::<DWORD>,
			)
			.expect("Sample MUST work"),
			ok: Sample::new_file(
				"./themes/PS3/sound/snd_system_ok.wav",
				BASS_SAMPLE_FLOAT | BASS_SAMPLE_OVER_POS,
				0,
				None,
				65535,
				None::<DWORD>,
			)
			.expect("Sample MUST work"),
			mixer,
		}
	}

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
			FeedbackSound::Enter => self.enter.get_channel(flags),
			FeedbackSound::Move => self.move_vertical.get_channel(flags),
			FeedbackSound::Back => self.back.get_channel(flags),
			FeedbackSound::MoveCategory => self.move_category.get_channel(flags),
			FeedbackSound::Cursor => self.cursor.get_channel(flags),
			FeedbackSound::Ok => self.ok.get_channel(flags),
			FeedbackSound::No => self.no.get_channel(flags),
			FeedbackSound::Coldboot => {
				self.coldboot.set_position_bytes(0);
				Some(*self.coldboot.handle())
			} // FeedbackSound::Coldboot => None,
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
				BASS_ChannelSetPosition(self.background.handle(), BACKGROUND_START, BASS_POS_BYTE);
				// self.mixer.flush();
			}
			let flags = if sound == FeedbackSound::Coldboot { BASS_MIXER_CHAN_DOWNMIX } else { BASS_STREAM_AUTOFREE | BASS_MIXER_CHAN_DOWNMIX };
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

	pub fn play_background(&self) {
		self.mixer.add(self.background.handle(), BASS_MIXER_CHAN_DOWNMIX).ok();
	}

	pub fn stop_background(&self) {
		self.mixer.remove_channel(self.background.handle()).ok();
	}
}

#[tauri::command]
pub fn play_feedback(sound: FeedbackSound, manager: State<'_, AudioFeedbackManager>) {
	manager.play(sound)
}

#[tauri::command]
pub fn play_background(manager: State<'_, AudioFeedbackManager>) {
	manager.play_background()
}

#[tauri::command]
pub fn stop_background(manager: State<'_, AudioFeedbackManager>) {
	manager.stop_background()
}

#[tauri::command]
pub fn reinit_bass(manager: State<'_, BassState>) {
	match manager.restart() {
		Ok(_) => (),
		Err(e) => eprintln!("BASS Restart Failed! {}", e),
	}
}
