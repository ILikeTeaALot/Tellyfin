use std::{error::Error, ops::Deref, path::Path, sync::Mutex};

use rusqlite::Connection;

pub struct TellyfinDB(Mutex<Connection>);

impl TellyfinDB {
	pub fn new(path: impl AsRef<Path>) -> Result<Self, Box<dyn Error>> {
		let conn = Connection::open(path)?;
		println!("DB Connection opened!");
		Ok(Self(Mutex::new(conn)))
	}
}

impl Deref for TellyfinDB {
	type Target = Mutex<Connection>;

	fn deref(&self) -> &Self::Target {
		&self.0
	}
}