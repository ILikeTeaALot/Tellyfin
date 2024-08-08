use std::fmt::Display;

use libmpv2::Mpv;

use crate::get_chapters;
use crate::map_string_error;
use crate::Chapter;
// use crate::MPV;
use crate::MpvState;
use crate::MPV;

/// TODO: Use `Mutex::lock` or `Mutex::try_lock`? (is blocking an issue??)
pub(crate) fn use_mpv_lock<T, E: Display>(
    mpv: &MpvState,
    function: impl FnOnce(&mut Mpv) -> Result<T, E>,
) -> Result<T, String> {
    let ok = match mpv.lock() {
        Ok(mut lock) => {
            if let Some(mpv) = lock.as_mut() {
                // println!("Lock successful!");
                function(mpv).map_err(|e| e.to_string())
            } else {
                Err("MPV is None???".into())
            }
        }
        Err(e) => {
            let final_error = Err(format!("Failed to lock MPV: {}", e));
            // eprintln!("Backtrace: {}", std::backtrace::Backtrace::capture());
            final_error
        }
    }?;
	Ok(ok)
}

#[napi(js_name = "pause")]
pub fn _pause() -> Result<(), napi::Error> {
	pause(&MPV).map_err(map_string_error)
}

pub fn pause(mpv: &MpvState) -> Result<(), String> {
    let ok = use_mpv_lock(mpv, |mpv| {
        mpv.set_property("pause", true).map_err(|e| e.to_string())
    });
    println!("{:?}", ok);
    return ok;
}

#[napi(js_name = "play")]
pub fn _play() -> Result<(), napi::Error> {
	play(&MPV).map_err(map_string_error)
}

pub fn play(mpv: &MpvState) -> Result<(), String> {
    let ok = use_mpv_lock(mpv, |mpv| {
        let ok = mpv.set_property("pause", false);
        // let ok = mpv.cycle_property("pause");
        match &ok {
            Ok(_) => (),
            Err(e) => {
                eprintln!("{}", e)
            }
        }
        ok.map_err(|e| e.to_string())
    });
    println!("{:?}", ok);
    return ok;
}

enum RelativeChapter {
    Previous,
    Next,
}

fn go_to_chapter(mpv: &mut Mpv, chapter: RelativeChapter) -> Result<(), libmpv2::Error> {
    let time = mpv.get_property::<f64>("time-pos")?;
    let chapters = get_chapters(mpv)?;
    if chapters.len() == 0 {
        return Ok(());
    }
    let current = mpv.get_property::<i64>("chapter")?;
    match chapter {
        RelativeChapter::Previous => {
            let chapter_seek_threshold = mpv.get_property::<f64>("chapter-seek-threshold")?;
            // let current_chapter_start = chapters.get(current as usize).time;
			let jump_prev = || {
				match chapters.get((current - 1) as usize) {
					Some(Chapter { time, .. }) => mpv.command(
						"seek",
						&[&time.to_string(), "absolute"],
					),
					None => mpv.command("seek", &["0", "absolute"]),
				}
			};
			match chapters.get(current as usize) {
				Some(current) => {
					let current_chapter_start = current.time;
					if current_chapter_start + chapter_seek_threshold < time {
						mpv.command("seek", &[&current_chapter_start.to_string(), "absolute"])
					} else {
						jump_prev()
					}
				},
				None => jump_prev(),
			}
        }
        // RelativeChapter::Next => mpv.set_property("chapter", current + 1),
        // RelativeChapter::Next => mpv.command("seek", &[&chapters[current as usize + 1].time.to_string(), "absolute"]),
        RelativeChapter::Next => match chapters.get((current + 1) as usize) { // FIXME: This operation overflows on some files.
            Some(Chapter { time, .. }) => mpv.command("seek", &[&time.to_string(), "absolute"]),
            None => Ok(()),
        },
    }
}

#[napi(js_name = "transportCommand")]
pub fn _transport_command(command: String) -> Result<(), napi::Error> {
	transport_command(command, &MPV).map_err(map_string_error)
}

pub fn transport_command(function: String, mpv: &MpvState) -> Result<(), String> {
    let ok = use_mpv_lock(mpv, |mpv| {
        match &*function {
            "Play" => mpv.set_property("pause", false),
            "Pause" => mpv.set_property("pause", true),
            "TogglePlay" => mpv.cycle_property("pause", false),
            "Stop" => {
                // println!("Transport Stop: TODO");
                // mpv.playlist_clear()?;
                mpv.command("stop", &[])
                // Ok(())
            }
			"UndoSeek" => {
				mpv.command("revert-seek", &[]).map_err(|e| e.to_string())?;
				mpv.set_property("pause", true)
			},
            // "FastForward" => {
			// 	let curr = mpv.get_property::<i64>("speed").map_err(|e| e.to_string())?;
			// 	if curr > 60 {
			// 		mpv.set_property("speed", 1)
			// 	} else {
			// 		mpv.set_property("speed", curr * 2)
			// 	}
			// },
            // "Rewind" => {}
			"JumpForward" => mpv.command("seek", &["15", "relative+exact"]),
			"JumpBackward" => mpv.command("seek", &["-15", "relative+exact"]),
			"StepForward" => mpv.command("frame-step", &[]),
			"StepBackward" => mpv.command("frame-back-step", &[]),
            "PrevChapter" => go_to_chapter(mpv, RelativeChapter::Previous),
            "NextChapter" => go_to_chapter(mpv, RelativeChapter::Next),
			// TODO
            "SubtitleOptions" => mpv.command("cycle", &["sub"]),
            "AudioOptions" => mpv.command("cycle", &["aid"]), // Audio (track) ID
            // "SceneSearch" => quick_fun_test(mpv),
            _ => Ok(()),
        }
        .map_err(|e| e.to_string())
    });
    println!("{:?}", ok);
    return ok;
}

#[allow(unused)]
fn quick_fun_test(mpv: &Mpv) -> Result<(), libmpv2::Error> {
    let files = mpv.get_property::<i64>("playlist/count")?;
    println!("Playlist count: {}", files);
    let mut current_index: Option<i64> = None;
    for i in 1..files {
        let filename = mpv.get_property::<String>(&format!("playlist/{}/filename", i))?;
        let playing = mpv.get_property::<bool>(&format!("playlist/{}/playing", i))?;
        let current = mpv.get_property::<bool>(&format!("playlist/{}/current", i))?;
        let title = mpv.get_property::<String>(&format!("playlist/{}/title", i))?;
        println!("Playlist info: File: {filename}; Playing: {playing}; Current: {current}; Title: {title}");
        if current {
            current_index = Some(i);
        }
    }
    println!("Current index: {:?}", current_index);
    let count = mpv.get_property::<i64>("chapter-list/count")?;
    for i in 0..count {
        let title = mpv.get_property::<String>(&format!("chapter-list/{}/title", i))?;
        let time = mpv.get_property::<f64>(&format!("chapter-list/{}/time", i))?;
        println!("Playlist info: Title: {title} Time: {time}");
    }
    Ok(())
}

#[napi(js_name = "seek")]
pub fn _seek(mode: String, seconds: f64) -> Result<(), napi::Error> {
	seek(&mode, seconds, &MPV).map_err(map_string_error)
}

pub fn seek(mode: &str, seconds: f64, mpv: &MpvState) -> Result<(), String> {
    let ok = use_mpv_lock(mpv, |mpv| match mode {
        "relative" => mpv
            .command("seek", &[&seconds.to_string(), "relative"])
            .map_err(|e| e.to_string()),
        "absolute" => mpv
            .command("seek", &[&seconds.to_string(), "absolute"])
            .map_err(|e| e.to_string()),
        _ => Err("Unrecognised seek type.".into()),
    });
    println!("{:?}", ok);
    return ok;
}

#[napi(js_name = "setTrack")]
pub fn _set_track(track: String, id: String) -> Result<(), napi::Error> {
	set_track(track, id, &MPV).map_err(map_string_error)
}

pub fn set_track(track: String, id: String, mpv: &MpvState) -> Result<(), String> {
    let ok = use_mpv_lock(mpv, |mpv| match &*track {
        "audio" => mpv
            .set_property("file-local-options/aid", id)
            .map_err(|e| e.to_string()),
        "subtitle" => mpv
            .set_property("file-local-options/sid", id)
            .map_err(|e| e.to_string()),
        _ => Err("Unrecognised seek type.".into()),
    });
    println!("{:?}", ok);
    return ok;
}

#[napi(js_name = "playFile")]
pub fn _play_file(file: String, start_position: Option<f64>) -> Result<(), napi::Error> {
	play_file(&MPV, file, start_position).map_err(map_string_error)
}

pub fn play_file(mpv: &MpvState, file: String, start_position: Option<f64>) -> Result<(), String> {
    println!("Playing file: {}", file);
    let ok = use_mpv_lock(mpv, |mpv| mpv_play_file(mpv, &file, start_position));
    println!("{:?}", ok);
    return ok;
}

pub fn mpv_play_file(mpv: &Mpv, file: &str, start_position: Option<f64>) -> Result<(), libmpv2::Error> {
	//                  Wrap file path in quotes to be safe!
	let filename_quoted = format!("\"{}\"", file.replace(r"\", r"\\"));
	println!("Quoted file: {}", filename_quoted);
	let ok = mpv.command("loadfile", &[&filename_quoted, "replace", "-1", ""]);
	if let Some(position) = start_position {
		mpv.set_property("start", format!("+{position}").as_str()).ok();
		// mpv.set_property("start", position).ok();
	} else {
		mpv.set_property("start", "none")?;
	}
	ok
}
