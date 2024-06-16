//! # libtellyfin
//! 
//! *Do you want to develop a plugin?*
//! 
//! This crate contains all the FFI/C-types for building native tellyfin plugins.
//! 
//! If you do not require native code or network access, there in future there may be alternative options for plugin authoring.
//! 
//! # Plugin Safety
//! 
//! Yes, as with any native code, it is ripe for potentially doing **ALMOST ANYTHING.** Therefore, it is hopefully obvious to say:
//! 
//! **!!!DO NOT INSTALL PLUGINS FROM ANY SOURCE YOU DO NOT FULLY TRUST!!!**
//! 
//! In fact, I would go so far as to say do not install any plugins that are not either:
//! 
//! a. Open source (Any form that allows you to compile it yourself, if only hypothetically)
//! b. Official
//! 
//! If not either of the above:
//! 
//! c. From a properly trustworthy, verifiable source. Do be careful though. Native plugins are like any other program.
//! 
//! # The Lifecycle of the common plugin
//! 
//! There are four primary methods exposed by a plugin:
//! 
//! 1. tf_plugin_init [Required]
//! 2. tf_plugin_info [Required] - Re-requesting [`PluginInfo`].
//! 2. tf_plugin_exec [Required] - [See below]
//! 3. tf_plugin_drop [Optional] - [See below]
//! 
//! ...each has a hopefully self-explanatory nature.
//! 
//! When a plugin is loaded, the `tf_plugin_init()` function is called,
//! which returns a collection of information describing the plugin and its capabilities.
//! 
//! This is the plugin's opportunity to configure any global or long-running state,
//! for example session authorisation.
//! 
//! Then, when a function provided by the plugin is requested (for example, its icon on the XMB is selected),
//! `tf_plugin_exec(command: &str, args: &[str], args_len: usize)` is called, executed syncronously,
//! and returns a string\* representation of the data to be presented to the user on the XMB
//! 
//! \* technically a pointer to a string
//! 
//! Before a plugin is unloaded or the host application is closed, the final method is called: `tf_plugin_drop`,
//! where a plugin should clean up any open resources and prepare for shutdown.
//! 
//! ## Other Functions
//! 
//! For specialised use cases, there are additional plugin methods:
//! 
//! * `tf_plugin_icons() -> PluginXMBIconList<'static>` [Optional] – for information on where and what icons
//! should be placed in the home menu, if any.

use std::{marker::PhantomData, ops::Deref, slice};

#[derive(Debug)]
#[repr(C)]
pub enum PluginResult<T> {
	Err(PluginError),
	Ok(T),
}

impl<T> PluginResult<T> {
	/// To make it easier to do PluginResult<T> -> Result<T>
	pub fn into(self) -> Result<T, PluginError> {
		Result::from(self)
	}
}

impl<T> From<Result<T, PluginError>> for PluginResult<T> {
	fn from(value: Result<T, PluginError>) -> Self {
		match value {
			Ok(ok) => PluginResult::Ok(ok),
			Err(err) => PluginResult::Err(err),
		}
	}
}

impl<T> From<PluginResult<T>> for Result<T, PluginError> {
	fn from(value: PluginResult<T>) -> Self {
		match value {
			PluginResult::Err(error) => Err(error),
			PluginResult::Ok(ok) => Ok(ok),
		}
	}
}

#[derive(Debug)]
#[repr(C)]
pub enum PluginError {
	GenericError(PluginString),
	InitError,
	Utf8Error,
	UnrecognisedCommmandError,
	InvalidArgsError,
}

/// (Upper 6 bits => MAJOR; Middle 16 bits => MINOR; Lower 10 bits: PATCH)
/// 
/// ∴ => Maximum plugin version: 63.65535.1023
/// 
/// Plugins should increment the patch version for every release, and should not have user-facing changes.
/// 
/// Minor versions allow new features and additions (including to config files), so long as configuration files remain compatible;
/// if you run out of/overflow PATCH versions, just bump the MINOR and reset the PATCH to 0.
/// 
/// Major versions should be reserved for truly breaking changes i.e. config/first-run must be reset.
/// (Tellyfin will use a major version change to put the user through a new setup wizard for the plugin.
/// **ONLY BUMP MAJOR WHEN STRICTLY NECESSARY.**)
/// 
/// Most plugins should be able to maintain a v1.x.x indefinitely (assuming their API does not change).
/// 
/// If, by some miraculous means, you exceed major version 63, you will have to choose a new plugin identifier;
/// I recommend the current one appended with ".v64" or ".next" (i.e. `org.tellyfin.invidious` => `org.tellyfin.invidious.v64`),
/// and restart counting from version `0.0.0`.
// 
// => For example, version 2.6.32 == 0x02_0006_20 (but you should just use [`make_plugin_version`] `make_plugin_version(2, 6, 32)`)
pub type PluginVersion = u32;
pub type PluginMajorVersion = u8;
pub type PluginMinorVersion = u16;
pub type PluginPatchVersion = u16;

pub type PluginVersionTriple = (PluginMajorVersion, PluginMinorVersion, PluginPatchVersion);

#[derive(Debug)]
#[repr(C)]
pub struct PluginInfo<'plugin> {
	pub id: PluginStr<'plugin>,
	pub name: PluginStr<'plugin>,
	pub version: PluginVersion,
}

#[derive(Debug)]
#[repr(C)]
pub struct PluginStr<'a> {
	lifetime: PhantomData<&'a str>,
	ptr: *const u8,
	len: usize,
}

impl PluginStr<'static> {
	pub const fn from(value: &'static str) -> Self {
		PluginStr {
			lifetime: PhantomData::<&'static str>,
			ptr: value.as_ptr(),
			len: value.len(),
		}
	}
}

impl<'a> From<PluginStr<'a>> for &'a str {
	fn from(value: PluginStr<'a>) -> Self {
		unsafe {
			std::str::from_utf8_unchecked(slice::from_raw_parts::<'a>(value.ptr, value.len))
		}
	}
}

impl<'a> From<&'a str> for PluginStr<'a> {
	fn from(value: &'a str) -> Self {
		PluginStr {
			lifetime: PhantomData::<&'a str>,
			ptr: value.as_ptr(),
			len: value.len(),
		}
	}
}

unsafe impl Send for PluginStr<'static> {}
unsafe impl Sync for PluginStr<'static> {}

/// I have not verified the soundness of how `PluginString` works.
#[repr(C)]
pub struct PluginString {
	lifetime: PhantomData::<String>,
	ptr: *mut u8,
	len: usize,
	capacity: usize,
}

impl std::fmt::Debug for PluginString {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		std::fmt::Debug::fmt(self.as_ref(), f)
	}
}

impl Drop for PluginString {
	fn drop(&mut self) {
		let s: String = self.into();
		drop(s)
	}
}

impl From<PluginString> for String {
	fn from(value: PluginString) -> Self {
		unsafe { String::from_raw_parts(value.ptr, value.len, value.capacity) }
	}
}

impl From<&mut PluginString> for String {
	fn from(value: &mut PluginString) -> Self {
		unsafe { String::from_raw_parts(value.ptr, value.len, value.capacity) }
	}
}

impl From<String> for PluginString {
	fn from(mut value: String) -> Self {
		let ps = Self {
			lifetime: PhantomData::<String>,
			ptr: value.as_mut_ptr(),
			len: value.len(),
			capacity: value.capacity(),
		};
		std::mem::forget(value);
		return ps;
	}
}

impl From<&'static str> for PluginString {
	fn from(value: &'static str) -> Self {
		let string = String::from(value);
		PluginString::from(string)
	}
}

impl AsRef<str> for PluginString {
	fn as_ref(&self) -> &str {
		let slice = unsafe { slice::from_raw_parts(self.ptr, self.len) };
		std::str::from_utf8(slice).unwrap_or("")
	}
}

impl Deref for PluginString {
	type Target = str;

	fn deref(&self) -> &Self::Target {
		self.as_ref()
	}
}

#[derive(Debug)]
#[repr(C)]
pub struct PluginIconData {
	data: *const u8,
	len: usize,
}

unsafe impl Send for PluginIconData {}
unsafe impl Sync for PluginIconData {}

impl PluginIconData {
	pub const fn from(value: &'static [u8]) -> Self {
		Self {
			data: value.as_ptr(),
			len: value.len(),
		}
	}
}

impl From<&'static [u8]> for PluginIconData {
	fn from(value: &'static [u8]) -> Self {
		Self::from(value)
	}
}

impl<'a> From<&'a PluginIconData> for &'a [u8] {
	fn from(value: &'a PluginIconData) -> Self {
		unsafe { slice::from_raw_parts(value.data, value.len) }
	}
}

#[derive(Debug)]
#[repr(C)]
pub struct PluginXMBData<'a> {
	icon: PluginIconData,
	name: PluginStr<'a>,
	desc: Option<PluginStr<'a>>,
}

impl PluginXMBData<'static> {
	pub const fn new(icon: PluginIconData, name: PluginStr<'static>, desc: Option<PluginStr<'static>>) -> Self {
		Self {
			icon,
			name,
			desc,
		}
	}
}

#[derive(Debug)]
#[repr(C)]
pub struct PluginXMBIconList<'a> {
	data: *const PluginXMBData<'a>,
	len: usize,
}

impl PluginXMBIconList<'static> {
	pub const fn from(value: &'static [PluginXMBData<'static>]) -> Self {
		Self {
			data: value.as_ptr(),
			len: value.len(),
		}
	}
}

impl<'a> PluginXMBIconList<'a> {
	pub fn into(self) -> &'a [PluginXMBData<'a>] {
		unsafe { slice::from_raw_parts(self.data, self.len) }
	}
}

pub const fn make_plugin_version(major: PluginMajorVersion, minor: PluginMinorVersion, patch: PluginPatchVersion) -> PluginVersion {
	(((major as PluginVersion) & 0b11_1111) << 26) + ((minor as PluginVersion) << 10) + ((patch as PluginVersion) & 0b11_1111_1111)
}

pub fn read_plugin_version(version: PluginVersion) -> PluginVersionTriple {
	((version >> 26) as PluginMajorVersion, (version >> 10) as PluginMinorVersion, (version & 0b11_1111_1111) as PluginPatchVersion)
}

#[cfg(test)]
mod tests {
	use super::*;

	#[test]
	fn it_works() {
		// 6-16-10
		let v = read_plugin_version(make_plugin_version(1, 0, 1));
		assert_eq!(v, (1, 0, 1));
		assert_eq!(make_plugin_version(v.0, v.1, v.2), make_plugin_version(1, 0, 1));

		let v = read_plugin_version(make_plugin_version(63, 255, 255));
		assert_eq!(v, (63, 255, 255));
		assert_eq!(make_plugin_version(v.0, v.1, v.2), make_plugin_version(63, 255, 255));

		let v = read_plugin_version(make_plugin_version(63, 65535, 1023));
		assert_eq!(v, (63, 65535, 1023));
		assert_eq!(make_plugin_version(v.0, v.1, v.2), make_plugin_version(63, 65535, 1023));
	}
}
