#![deny(clippy::all)]
use std::{sync::Mutex, thread};

use napi::{
	threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode},
	Error,
};
use rusqlite::OpenFlags;

#[macro_use]
extern crate napi_derive;

static DB: Mutex<Option<rusqlite::Connection>> = Mutex::new(None);

#[napi]
pub fn init(database_path: String) {
	let open_result = rusqlite::Connection::open_with_flags(database_path, OpenFlags::SQLITE_OPEN_READ_ONLY);
	match open_result {
		Ok(conn) => *(DB.lock().expect("This can never fail")) = Some(conn),
		Err(_) => {
			println!("Failed to open database; this should never happen");
			todo!()
		}
	}
}

#[napi]
pub fn fetch_image(server: i64, callback: ThreadsafeFunction<String>) {
	thread::spawn(move || match DB.lock() {
		Ok(conn) => {
			if let Some(conn) = conn.as_ref() {
				let _ = conn.query_row("SELECT Address FROM Server WHERE Id = ?", [server], |row| {
					match row.get("Address") {
						Ok(address) => {
							callback.call(Ok(address), ThreadsafeFunctionCallMode::NonBlocking);
						}
						Err(e) => {
							callback
								.call(Err(Error::from_reason(e.to_string())), ThreadsafeFunctionCallMode::NonBlocking);
						}
					}
					Ok(())
				});
			}
		}
		Err(err) => {
			callback.call(Err(Error::from_reason(err.to_string())), ThreadsafeFunctionCallMode::NonBlocking);
		}
	});
}
