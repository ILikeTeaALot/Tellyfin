use std::{thread, time::Duration};

use gilrs::{Button, Event, Gilrs};
use tauri::AppHandle;

struct GamepadManager {
	app: AppHandle,
}

impl GamepadManager {
	pub fn new(app: AppHandle) -> Self {
		thread::spawn(|| {
			let mut gilrs = Gilrs::new().unwrap();
			
			// Iterate over all connected gamepads
			for (_id, gamepad) in gilrs.gamepads() {
				println!("{} is {:?}", gamepad.name(), gamepad.power_info());
			}
	
			let mut active_gamepad = None;
	
			loop {
				// Examine new events
				while let Some(Event { id, event, time }) = gilrs.next_event_blocking(Some(Duration::from_millis(50))) {
					println!("{:?} New event from {}: {:?}", time, id, event);
					active_gamepad = Some(id);
				}
	
				// You can also use cached gamepad state
				if let Some(gamepad) = active_gamepad.map(|id| gilrs.gamepad(id)) {
					if gamepad.is_pressed(Button::South) {
						println!("Button South is pressed (XBox - A, PS - X)");
					}
				}
			}
		});

		Self { app }
	}
}
