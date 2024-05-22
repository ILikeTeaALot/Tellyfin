import React, { useEffect, useRef, useState } from "preact/compat";

export enum GamepadButton {
	Enter,
	Back,
	X,
	Y,
	L1,
	R1,
	L2,
	R2,
	Select,
	Start,
	L3,
	R3,
	PadUp,
	PadDown,
	PadLeft,
	PadRight,
	Home,
	Touchpad,
}

export enum GamepadStick {
	LeftHorizontal,
	LeftVertical,
	RightHorizontal,
	RightVertical,
}

type ControllerButtonType = "A";

export type ControllerButtonState = {
	[key in ControllerButtonType]: boolean;
};

export interface ControllerStateType {
	buttonState: ControllerButtonState;
	previousButtonState: ControllerButtonState;
	hasChanged: boolean;
}

type GamepadEventListener = (e: { key: string; }) => void;

type GamepadListenerType = "press" | "release" | "change";

export const GamepadContext = React.createContext<{
}>({ });
export const MovementSpeed = React.createContext("300ms");

const GAMEPAD_BUTTON_REPEAT_INITIAL = 300;
const GAMEPAD_BUTTON_REPEAT = 200;
function gamepadAcceleration(repeats: number) {
	if (repeats < 1) {
		return GAMEPAD_BUTTON_REPEAT_INITIAL;
	} else if (repeats < 40) {
		return GAMEPAD_BUTTON_REPEAT;
	} else if (repeats < 60) {
		return 50;
	} else if (repeats < 100) {
		return 25;
	} else {
		return 15;
	}
};

function axisToButton(axis: GamepadStick, value: number) {
	if (value >= 0) {
		switch (axis) {
			case GamepadStick.LeftHorizontal:
				return GamepadButton.PadRight;
			case GamepadStick.LeftVertical:
				return GamepadButton.PadDown;
			case GamepadStick.RightHorizontal:
			case GamepadStick.RightVertical:
				return null;
		}
	} else {
		switch (axis) {
			case GamepadStick.LeftHorizontal:
				return GamepadButton.PadLeft;
			case GamepadStick.LeftVertical:
				return GamepadButton.PadUp;
			case GamepadStick.RightHorizontal:
			case GamepadStick.RightVertical:
				return null;
		}
	}
}

const JOYSTICK_THRESHOLD = Math.PI / 4 - 0.2;

/**
 * # Controller Input System v0 spec
 * 
 * 
 */
export const GamepadContextProvider: React.FunctionComponent<React.PropsWithChildren> = ({ children }) => {
	if (!window.isSecureContext) return (
		<>
			{children}
		</>
	);
	const listeners = useRef(new Set<GamepadEventListener>());
	const releaseListeners = useRef(new Set<GamepadEventListener>());
	const buttonsPressedRightNow = useRef(new Set<string>());
	const axesActiveRightNow = useRef(new Set<GamepadButton>());
	const frame = useRef<number | undefined>();
	/** Last "update tick" in milliseconds */
	const last = useRef(performance.now());
	const gamepads = useRef<ReturnType<typeof navigator.getGamepads>>(navigator.getGamepads());
	const countdown = useRef<number[]>([GAMEPAD_BUTTON_REPEAT_INITIAL].fill(-1, 0, 50));
	const buttonPresses = useRef<number[]>([0].fill(0, 0, 50));
	const axisActivations = useRef<number[]>([0].fill(0, 0, 50));

	const [transitionDuration, setTransitionDuration] = useState(300);

	const contextValue = React.useRef({
	});

	// EFFECTS
	useEffect(() => {
		const handleGamepadCon = (e: GamepadEvent) => {
			console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
				e.gamepad.index, e.gamepad.id,
				e.gamepad.buttons.length, e.gamepad.axes.length);
		};
		window.addEventListener("gamepadconnected", handleGamepadCon);
		return () => {
			window.removeEventListener("gamepadconnected", handleGamepadCon);
		};
	}, []);

	useEffect(() => {
		const animate = (/* now: DOMHighResTimeStamp */) => {
			/** Milliseconds */
			const now = performance.now();
			/** Milliseconds */
			const delta = now - last.current;
			gamepads.current = navigator.getGamepads();
			const eventsToCall: /* (keyof globalThis.Gamepad["buttons"]) */any[] = [];
			const releaseEventsToCall: /* (keyof globalThis.Gamepad["buttons"]) */any[] = [];
			for (const index in gamepads.current) {
				const gamepad = gamepads.current[index];
				if (gamepad) {
					for (const button in gamepad.buttons) {
						if (!gamepad.buttons[button].pressed) {
							buttonPresses.current[button] = 0;
							countdown.current[button] = -1;
							if (buttonsPressedRightNow.current.has(button)) {
								buttonsPressedRightNow.current.delete(button);
								releaseEventsToCall.push(button);
							}
						} else if (countdown.current[button] > 0) {
							// console.log("countdown:", countdown.current);
							// console.log(delta);
							countdown.current[button] = countdown.current[button] - delta;
							// console.log(countdown.current[button]);
						} else {
							if (gamepad.buttons[button].pressed) {
								const time = gamepadAcceleration(buttonPresses.current[button]);
								countdown.current[button] = time;
								setTransitionDuration(time);
								buttonsPressedRightNow.current.add(button);
								buttonPresses.current[button]++;
								eventsToCall.push(button);
							}
						}
					}
					for (let i = 0; i < gamepad.axes.length; i++) {
						const axis = i;
						const value = gamepad.axes[i];
						const active = value > JOYSTICK_THRESHOLD || value < -JOYSTICK_THRESHOLD;
						const countdown_index = axis + 30;
						if (!active) {
							axisActivations.current[axis] = 0;
							countdown.current[countdown_index] = -1;
							if (axesActiveRightNow.current.has(axis)) {
								axesActiveRightNow.current.delete(axis);
								const button = axisToButton(axis, value);
								if (button) releaseEventsToCall.push(button);
							}
						} else if (countdown.current[countdown_index] > 0) {
							countdown.current[countdown_index] = countdown.current[countdown_index] - delta;
						} else {
							if (active) {
								const time = gamepadAcceleration(axisActivations.current[axis]);
								countdown.current[countdown_index] = time;
								// setMovementInterval(time);
								setTransitionDuration(time);
								const button = axisToButton(axis, value);
								if (button) {
									axesActiveRightNow.current.add(button);
									buttonPresses.current[axis]++;
									eventsToCall.push(button);
								}
							}
						}
					}
				}
			}
			last.current = now;
			frame.current = window.setTimeout(animate, 5);
			for (const button of releaseEventsToCall) {
				// for (const listener of releaseListeners.current) {
				// 	listener({ key: GamepadButton[button] });
				// }
				let event = new KeyboardEvent("keyup", { key: GamepadButton[button] });
				window.dispatchEvent(event);
			}
			for (const button of eventsToCall) {
				// for (const listener of listeners.current) {
				// 	listener({ key: GamepadButton[button] });
				// }
				let event = new KeyboardEvent("keydown", { key: GamepadButton[button] });
				window.dispatchEvent(event);
			}
		};
		frame.current = window.setTimeout(animate, 5);
		return () => window.clearTimeout(frame.current);
	}, []);

	return (
		<GamepadContext.Provider value={contextValue.current}>
			<div style={{ "--standard-duration": `${transitionDuration - 15}ms` }}>
				{/* <MovementSpeed.Provider value={"300ms"}> */}
				{children}
				{/* </MovementSpeed.Provider> */}
			</div>
		</GamepadContext.Provider>
	);
};