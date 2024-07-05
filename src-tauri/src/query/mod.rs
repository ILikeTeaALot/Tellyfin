use std::error::Error;

use rusqlite::{params_from_iter, types::FromSql};
use serde_rusqlite::from_rows;
use tauri::{AppHandle, State};

use crate::{database::TellyfinDB, util::SafeLock};

// UNSAFE QUERIES

pub fn unsafe_query_internal(database: &TellyfinDB, q: &str, params: &[serde_json::Value]) -> Result<Vec<serde_json::Map<String, serde_json::Value>>, Box<dyn Error>> {
	let safe_lock = &database.safe_lock();
	let mut stmt = safe_lock.prepare(q)?;
	let rows = from_rows::<serde_json::Map<String, serde_json::Value>>(stmt.query(params_from_iter(params.iter()))?);
	Ok(Vec::from_iter(rows.filter_map(|t| {
		match t {
			Ok(t) => Some(t),
			Err(_) => None
		}
	})))
}

#[tauri::command]
pub async fn unsafe_query(database: State<'_, TellyfinDB>, q: String, params: Vec<serde_json::Value>) -> Result<Vec<serde_json::Map<String, serde_json::Value>>, String> {
	println!("query: {}, params: {:?}", q, params);
	let res = unsafe_query_internal(&*database, &q, &params).map_err(|e| e.to_string());
	println!("rows: {:?}", res);
	res
}