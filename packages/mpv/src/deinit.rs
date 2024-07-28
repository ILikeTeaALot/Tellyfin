use crate::MPV;

#[napi]
pub fn deinit() {
	let mut lock = MPV.lock().expect("MPV should be available...");

	*lock = None;
}