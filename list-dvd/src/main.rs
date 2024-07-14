use std::{collections::HashMap, error::Error, path::PathBuf, thread::sleep, time::Duration};

use eject::{device::Device, discovery::cd_drives};
use serde::Deserialize;
use wmi::{COMLibrary, Variant, WMIConnection};

fn main() -> Result<(), Box<dyn Error>> {
	println!("Hello, world!");
	for path in cd_drives() {
		println!("Path: {:?}", path);
		let drive = Device::open(path)?;
		println!("Got drive. Status: {:?}", drive.status());
		// drive.eject()?;
		// sleep(Duration::from_secs(5));
		// drive.retract().ok();
	}
	let com_con = COMLibrary::new()?;
	let wmi_con = WMIConnection::new(com_con.into())?;

	let results: Vec<HashMap<String, Variant>> = wmi_con.raw_query("SELECT * FROM Win32_CDROMDrive")?;

	for os in results {
		println!("{:#?}", os);
	}

	#[allow(unused)]
	#[derive(Deserialize, Debug)]
	struct Win32_CDROMDrive {
		Caption: String,
		Drive: PathBuf,
		Manufacturer: String,
		VolumeName: Option<String>,
	}

	let results: Vec<Win32_CDROMDrive> = wmi_con.query()?;

	for os in results {
		println!("{:#?}", os);
	}
	Ok(())
}
