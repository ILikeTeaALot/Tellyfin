use std::{
	collections::HashSet, error::Error, fs, marker::PhantomData, path::{Path, PathBuf}, sync::{Arc, Mutex}
};

use serde::{de::DeserializeOwned, Serialize};
use tauri::AppHandle;

use crate::util::SafeLock;

pub struct SettingsManager<'a, S: DeserializeOwned + Serialize> {
	app: AppHandle,
	change_listeners: Mutex<HashSet<fn(&AppHandle, &S)>>,
	path: PathBuf,
	settings: Mutex<S>,
	__: PhantomData<&'a S>,
}

impl<'a, S: Default + DeserializeOwned + Serialize> SettingsManager<'a, S> {
	pub fn new(app: AppHandle, path: impl AsRef<Path>) -> Result<Self, Box<dyn Error>> {
		let path = PathBuf::from(path.as_ref());
		let settings = if let Ok(raw) = fs::read_to_string(&path) {
			let settings = toml::from_str::<S>(&raw)?;
			settings
		} else {
			S::default()
		};
		let settings = Mutex::new(settings);
		Ok(Self { app, settings, path, change_listeners: Mutex::new(HashSet::with_capacity(8)), __: PhantomData })
	}
}

impl<'a, S: Clone + DeserializeOwned + Serialize> SettingsManager<'a, S> {
	pub fn update(&self, new: &S) {
		*self.settings.safe_lock() = new.clone();
		let safe_lock = self.change_listeners.safe_lock();
		for listener in safe_lock.iter() {
			listener(&self.app, new)
		}
	}
}

impl <'a, S: DeserializeOwned + Serialize> SettingsManager<'a, S> {
	/// [Subject to change]
	pub fn add_listener(&self, f: fn(&AppHandle, &S)) -> bool {
		self.change_listeners.safe_lock().insert(f)
	}

	#[allow(unused)]
	pub fn remove_listener(&self, f: &fn(&AppHandle, &S)) -> bool {
		self.change_listeners.safe_lock().remove(&f)
	}
}