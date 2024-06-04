//! # Libtellyfin
//! 
//! *Do you want to develop a plugin?*
//! 
//! This crate contains all the FFI types for building native tellyfin plugins.
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
//! b. Officially endorsed
//! 
//! # The Lifecycle of the common plugin
//! 
//! There are three primary methods exposed by a plugin:
//! 
//! 1. tf_plugin_init [Required]
//! 2. tf_plugin_exec [Required]
//! 3. tf_plugin_drop [Optional]
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

#[derive(Debug)]
#[repr(C)]
pub struct PluginInfo<'plugin> {
	pub id: PluginStr<'plugin>,
	pub name: PluginStr<'plugin>,
	pub version: u32,
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

impl<'a> PluginXMBIconList<'a> {
	pub fn into(self) -> &'a [PluginXMBData<'a>] {
		unsafe { slice::from_raw_parts(self.data, self.len) }
	}

	pub const fn from(value: &'static [PluginXMBData<'static>]) -> Self {
		Self {
			data: value.as_ptr(),
			len: value.len(),
		}
	}
}