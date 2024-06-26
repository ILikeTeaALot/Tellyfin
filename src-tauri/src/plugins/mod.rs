use std::{collections::HashMap, ffi::OsStr, sync::{Mutex, MutexGuard, PoisonError}};

use libtellyfin::{read_plugin_version, PluginError, PluginInfo, PluginVersion, PluginVersionTriple};
use tellyfin_plugin::{plugin_exec, plugin_load, Container, DlOpenError, Plugin};

pub mod invoke;

/// Holds a reference to the plugin's identifier. The reference is to the data directly in the library's memory.
/// 
/// 
#[derive(Hash, PartialEq, Eq)]
#[repr(transparent)]
pub struct PluginId<'plugin>(&'plugin str);

pub enum PluginLoadUnloadError<'a> {
	NoPlugin,
	AlreadyHavePlugin,
	HashTableError(PluginPoisonError<'a>),
	DlOpenError(DlOpenError),
	PluginError(PluginError),
}

type PluginPoisonError<'a> = PoisonError<MutexGuard<'a, PluginTable<'a>>>;

impl<'a> From<PluginError> for PluginLoadUnloadError<'a> {
	fn from(value: PluginError) -> Self {
		PluginLoadUnloadError::PluginError(value)
	}
}

impl<'a> From<PluginPoisonError<'a>> for PluginLoadUnloadError<'a> {
	fn from(value: PluginPoisonError<'a>) -> Self {
		PluginLoadUnloadError::HashTableError(value)
	}
}

impl From<DlOpenError> for PluginLoadUnloadError<'_> {
	fn from(value: DlOpenError) -> Self {
		PluginLoadUnloadError::DlOpenError(value)
	}
}

type PluginTable<'plugin> = HashMap<&'plugin str, (&'plugin str, PluginVersion, Container<Plugin<'plugin>>)>;

#[derive(Default)]
pub struct PluginManager<'plugins> {
	plugins: Mutex<PluginTable<'plugins>>
}

/// The idea and purpose behind the design of these load and unload functions (and the inability to copy/clone PluginId)
/// is to tie the PluginId's lifetime to the plugin it represents.
impl<'a> PluginManager<'a> {
	pub fn load<'plugin>(&'a self, path: impl AsRef<OsStr>) -> Result<&'plugin str, PluginLoadUnloadError> {
		let mut lock = self.plugins.lock()?;
		let plugin = plugin_load(path)?;
		let info = plugin.tellyfin_plugin_init().into()?;
		// let id: String = String::from_str(info.id.into()).expect("Infallible method");
		// let id = PluginId(&id);
		let id = info.id.into();
		if lock.contains_key(id) {
			Err(PluginLoadUnloadError::AlreadyHavePlugin)
		} else {
			lock.insert(id, (info.name.into(), info.version, plugin));
			Ok(id)
		}
	}

	pub fn unload<'plugin: 'a>(&'a self, id: &'plugin str) -> Result<(), PluginLoadUnloadError> {
		let mut lock = self.plugins.lock()?;
		let plugin = lock.remove(id);
		// let (_id, plugin) = lock.remove_entry(id);
		match plugin {
			Some(plugin) => {
				if let Some(result) = plugin.2.tellyfin_plugin_drop() {
					result.into()?;
				}
				drop(plugin);
				Ok(())
			}
			None => Err(PluginLoadUnloadError::NoPlugin)
		}
	}
}

pub enum PluginInfoError {
	NoPlugin,
	MutexPoison,
	PluginError(PluginError),
}

impl PluginManager<'_> {
	pub fn plugin_version<'plugin>(&self, id: &'plugin str) -> Result<PluginVersionTriple, PluginInfoError> {
		match self.plugins.lock().map_err(|_| PluginInfoError::MutexPoison)?.get(id) {
			Some((_, version, _)) => Ok(read_plugin_version(*version)),
			None => Err(PluginInfoError::NoPlugin),
		}
	}

	pub fn plugin_name<'plugin>(&self, id: &'plugin str) -> Result<String, PluginInfoError> {
		match self.plugins.lock().map_err(|_| PluginInfoError::MutexPoison)?.get(id) {
			Some((name, _, _)) => Ok(String::from(*name)),
			None => Err(PluginInfoError::NoPlugin),
		}
	}

	pub fn plugin_info<'plugin>(&self, id: &'plugin str) -> Result<PluginInfo, PluginInfoError> {
		match self.plugins.lock().map_err(|_| PluginInfoError::MutexPoison)?.get(id) {
			Some((_, _, plugin)) => plugin.tellyfin_plugin_info().into()
				.map_err(|err| PluginInfoError::PluginError(err)),
			None => Err(PluginInfoError::NoPlugin),
		}
	}

	pub fn plugin_exec<'plugin>(&self, id: &'plugin str, command: &str, args: &[impl AsRef<str>]) -> Result<String, PluginInfoError> {
		match self.plugins.lock().map_err(|_| PluginInfoError::MutexPoison)?.get(id) {
			Some((_, _, plugin)) => plugin_exec(plugin, command, args)
				.map_err(|err| PluginInfoError::PluginError(err)),
			None => Err(PluginInfoError::NoPlugin),
		}
	}
}