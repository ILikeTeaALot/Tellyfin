use std::fmt::Display;

use libmpv2::Mpv;
use tauri::State;

use crate::get_chapters;
use crate::states::PlaybackId;
use crate::Chapter;
use crate::CurrentId;
// use crate::MPV;
use crate::MpvState;

/// TODO: Use `Mutex::lock` or `Mutex::try_lock`? (is blocking an issue??)
pub(crate) fn use_mpv_lock<T, E: Display>(
    mpv: State<MpvState>,
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

#[tauri::command]
pub async fn pause(mpv: State<'_, MpvState>) -> Result<(), String> {
    let ok = use_mpv_lock(mpv, |mpv| {
        mpv.set_property("pause", true).map_err(|e| e.to_string())
    });
    println!("{:?}", ok);
    return ok;
}

#[tauri::command]
pub async fn play(mpv: State<'_, MpvState>) -> Result<(), String> {
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

#[tauri::command]
pub async fn transport_command(function: String, mpv: State<'_, MpvState>) -> Result<(), String> {
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
            // "FastForward" => {}
            // "Rewind" => {}
            "PrevChapter" => go_to_chapter(mpv, RelativeChapter::Previous),
            "NextChapter" => go_to_chapter(mpv, RelativeChapter::Next),
            "SubtitleOptions" => mpv.command("cycle", &["sub"]),
            // "SceneSearch" => quick_fun_test(mpv),
            _ => Ok(()),
        }
        .map_err(|e| e.to_string())
    });
    println!("{:?}", ok);
    return ok;
}

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

#[tauri::command]
pub async fn seek(mode: String, seconds: f64, mpv: State<'_, MpvState>) -> Result<(), String> {
    let ok = use_mpv_lock(mpv, |mpv| match &*mode {
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

#[tauri::command]
pub async fn set_track(track: String, id: String, mpv: State<'_, MpvState>) -> Result<(), String> {
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

#[tauri::command]
pub async fn play_file(file: String, jellyfin_id: Option<PlaybackId>, mpv: State<'_, MpvState>, id: State<'_, CurrentId>) -> Result<(), String> {
	if let Ok(mut id) = id.lock() {
		*id = jellyfin_id;
	}
    println!("Playing file: {}", file);
    let ok = use_mpv_lock(mpv, |mpv| mpv_play_file(mpv, &file));
    println!("{:?}", ok);
    return ok;
}

pub fn mpv_play_file(mpv: &Mpv, file: &str) -> Result<(), libmpv2::Error> {
    //                  Wrap file path in quotes to be safe!
    let filename_quoted = format!("\"{}\"", file.replace(r"\", r"\\"));
    println!("Quoted file: {}", filename_quoted);
    mpv.command("loadfile", &[&filename_quoted, "replace", "-1", ""])
}
