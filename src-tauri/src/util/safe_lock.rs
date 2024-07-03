use std::sync::{Mutex, MutexGuard, RwLock, RwLockReadGuard, RwLockWriteGuard, TryLockError};

pub trait SafeLock<T> {
	fn safe_lock(&self) -> MutexGuard<'_, T>;
}

pub trait ReadLock<T> {
	fn read_lock(&self) -> RwLockReadGuard<T>;
}

pub trait WriteLock<T> {
	fn write_lock(&self) -> RwLockWriteGuard<T>;
}

#[allow(unused)]
pub fn safe_lock<T>(lock: &Mutex<T>) -> MutexGuard<'_, T> {
	// return lock.try_lock().expect("Failed to lock");
	// return lock.lock().expect("Failed to lock");
	// {
	// 	let test = lock.try_lock();
	// 	match test {
	// 		Ok(_) => {
	// 			// println!("Mutex OK!");
	// 		}
	// 		Err(err) => {
	// 			eprintln!("{:#?}", err);
	// 			panic!()
	// 		}
	// 	}
	// }
	match lock.lock() {
		Ok(guard) => guard,
		Err(poisoned) => {
			eprintln!("Mutex poisened... attempting to free...");
			eprintln!("For debugging purposes, for the time being, this panics. Please review the stack trace!");
			// panic!();
			poisoned.into_inner()
		}
	}
}

impl<T> SafeLock<T> for Mutex<T> {
	fn safe_lock(&self) -> MutexGuard<'_, T> {
		safe_lock(self)
	}
}

// impl<T> SafeLock<T> for Mutex<T> {
//     fn safe_lock(lock: &Mutex<T>) -> MutexGuard<'_, T> {
//         safe_lock(lock)
//     }
// }

impl<T> ReadLock<T> for RwLock<T> {
	fn read_lock(&self) -> RwLockReadGuard<T> {
		match self.try_read() {
			Ok(ok) => ok,
			Err(e) => match e {
				TryLockError::Poisoned(t) => t.into_inner(),
				TryLockError::WouldBlock => {
					eprintln!("For debugging purposes this intentionally crashes.");
					self.try_read().expect("This is a deliberate panic.")
				}
			}
		}
	}
}

impl<T> WriteLock<T> for RwLock<T> {
	fn write_lock(&self) -> RwLockWriteGuard<T> {
		match self.try_write() {
			Ok(ok) => ok,
			Err(e) => {
				match e {
					TryLockError::Poisoned(t) => t.into_inner(),
					TryLockError::WouldBlock => {
						eprintln!("For debugging purposes this intentionally crashes.");
						self.try_write().expect("This is a deliberate panic.")
					}
				}
			}
		}
	}
}