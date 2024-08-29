use std::sync::Mutex;

use bass::{bass::Bass, bass_sys::{BASS_GetDevice, BASS_IsStarted, BASS_Start, BASS_CONFIG_MIXER_BUFFER, BASS_CONFIG_SRC, BASS_DEVICE_REINIT, BASS_ERROR_INIT, BASS_ERROR_REINIT, BASS_ERROR_UNKNOWN, DWORD}, error::BassError, result::BassResult};

use crate::util::SafeLock;

pub const DEFAULT_PLUGINS: Option<&[&str]> = Some(&[
	"bass_mpc", "bassape", "bassdsd", "bassflac", "basshls", "bassopus", "basswebm", "basswv",
]);

#[allow(unused)]
#[napi]
pub struct BassState(Mutex<Bass>, Mutex<DWORD>);

static CONFIG: &[(DWORD, DWORD)] = &[(BASS_CONFIG_SRC, DWORD(6)), (BASS_CONFIG_MIXER_BUFFER, DWORD(0))];

#[napi]
impl BassState {
	pub fn new() -> BassResult<Self> {
		let bass = Bass::init(Some(-1), 48000, 0, None, Some(CONFIG), DEFAULT_PLUGINS)?;
		Ok(Self(Mutex::new(bass), Mutex::new(BASS_GetDevice())))
	}

	pub fn reinit(&self) -> BassResult<()> {
		let mut dev_lock = self.1.safe_lock();
		let bass = Bass::init(Some(dev_lock.0 as i32), 48000, BASS_DEVICE_REINIT, None, Some(CONFIG), DEFAULT_PLUGINS)?;
		*dev_lock = bass.device();
		*self.0.safe_lock() = bass;
		Ok(())
	}

	#[napi(js_name = "restart")]
	pub fn _restart(&self) -> () {
		self.restart();
	}
	
	pub fn restart(&self) -> BassResult<()> {
		match BASS_IsStarted() {
			DWORD(0) => self.reinit(),
			DWORD(2) => {
				if BASS_Start() {
					Ok(())
				} else {
					match BassError::default().code {
						/* BASS_ERROR_INIT */
						8 => self.reinit(),
						/* BASS_ERROR_REINIT */
						11 => self.reinit(),
						BASS_ERROR_UNKNOWN => Err(BassError::unknown()),
						_ => Err(BassError::unknown())
					}
				}
			}
			DWORD(1) | _ => Ok(())
		}
	}
}
