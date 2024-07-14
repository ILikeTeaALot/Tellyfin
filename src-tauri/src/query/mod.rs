use std::error::Error;

use rusqlite::{params_from_iter, types::FromSql};
use serde_rusqlite::from_rows;
use tauri::{AppHandle, State};

use crate::{database::TellyfinDB, util::SafeLock};

#[tauri::command]
pub async fn query(
	app: AppHandle,
	database: State<'_, TellyfinDB>,
	table: String,
	cond: Option<String>,
	scond: Option<String>,
	sort: Option<String>,
	ssort: Option<String>,
	genre: Option<String>,
) -> Result<(), String> {
	let table = table
		.chars()
		.all(|c| c.is_alphanumeric() || c == '_')
		.then_some(table)
		.ok_or(String::from("Invalid table name"))?;
	// Past this point, table is definitely safe
	let query_string = format!("SELECT * FROM {table} WHERE");
	// let res = sqlx::query("").fetch_all(&**database).await.map_err(|e| e.to_string())?;
	let res = (**database).safe_lock();
	Ok(())
}

fn operand(op: &str) -> Result<&str, &'static str> {
	match op {
		"=" | // Equal to
		"<" | // x<y
		">" | // x>y
		"<=" | // x<=y
		">=" | // x>=y
		"!=" => Ok(op),
		"?" => Ok(""), // Exists
		// "@" => Ok(""), // Indexed
		// "!" => Ok(""), // Present
		_ => Err("Invalid operand"),
	}
}

// UNSAFE QUERIES

pub fn unsafe_query_internal(database: &TellyfinDB, q: &str, params: &[serde_json::Value]) -> Result<Vec<serde_json::Map<String, serde_json::Value>>, Box<dyn Error>> {
	let safe_lock = &database.safe_lock();
	let mut stmt = safe_lock.prepare(q)?;
	// let res = stmt.query_map(params_from_iter(params.iter()), |row| {
	// 	// serde_json::Value::from(row)
	// 	serde_json::to_value::<serde_json::Map<String, serde_json::Value>>(row)
	// })?;
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
	// println!("query: {}, params: {:?}", q, params);
	let res = unsafe_query_internal(&*database, &q, &params).map_err(|e| e.to_string());
	// println!("rows: {:?}", res);
	res
}