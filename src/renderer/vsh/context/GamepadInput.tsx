/* eslint-disable react-hooks/rules-of-hooks */
import React, { useCallback, useEffect, useRef, useState } from "preact/compat";

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

export const MovementSpeed = React.createContext(300);

const GAMEPAD_BUTTON_REPEAT_INITIAL = 400;
// const GAMEPAD_BUTTON_REPEAT = 75;
const GAMEPAD_BUTTON_REPEAT = 100;
// const GAMEPAD_BUTTON_REPEAT = 150;
// const GAMEPAD_BUTTON_REPEAT = 200;
// const GAMEPAD_BUTTON_REPEAT = 250;
/** The button repeats at which repeat-rate doubles */
function buttonAcceleration(repeats: number) {
	if (repeats < 1) {
		return GAMEPAD_BUTTON_REPEAT_INITIAL;
		// } else if (repeats < 40) {
	} else if (repeats < 25) {
		return GAMEPAD_BUTTON_REPEAT;
	} else if (repeats < 60) {
		return 75;
		// return 50;
	} else if (repeats < 100) {
		return 25;
	} else {
		return 15;
	}
};

// const JOYSTICK_THRESHOLD = Math.PI / 4 - 0.4;
// const JOYSTICK_THRESHOLD = 0.5;
const JOYSTICK_THRESHOLD = 0.4;
const JOYSTICK_REPEAT_BASE = 100;

function axisAcceleration(repeats: number) {
	// return (2 * GAMEPAD_BUTTON_REPEAT) / Math.max(Math.pow(repeats, 1 - 0.03125), 1)
	return (2 * JOYSTICK_REPEAT_BASE) / Math.min(Math.max(Math.pow(repeats + 1, 1 / 3), 1), 10000000);
}

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
	} else /* (value LESS THAN 0) */ {
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

declare global {
	interface Window {
		__INTERNAL_TELLYFIN_GAMEPAD__: {
			transition: number;
		};
	}
}

window.__INTERNAL_TELLYFIN_GAMEPAD__ = { transition: 300 };

/**
 * This whole thing is probably worth moving to the native side...
 */
export const GamepadContextProvider: React.FunctionComponent<React.PropsWithChildren> = ({ children }) => {
	if (!window.isSecureContext) return (
		<>
			{children}
		</>
	);

	// const gamepads = useRef<ReturnType<typeof navigator.getGamepads>>(navigator.getGamepads());

	const frame = useRef<number | undefined>();
	/** Last "update tick" in milliseconds */
	const last = useRef(performance.now());
	// const transitionStandard = useRef(300);
	// const listeners = useRef(new Set<GamepadEventListener>());
	// const releaseListeners = useRef(new Set<GamepadEventListener>());
	const buttonsPressedRightNow = useRef<Record<string, Set<string>>>({});
	const axesActiveRightNow = useRef<Record<string, Set<GamepadButton>>>({});
	// For some reason using a constant for these causes issues. No clue why!
	// const button_countdowns = useRef<number[]>([1].fill(1, 0, 50));
	const button_countdowns = useRef<Record<string, Record<string, number>>>({});
	const buttonPresses = useRef<Record<string, Record<string, number>>>({});
	// Axes
	const axis_countdowns = useRef<Record<string, number[]>>({});
	const axisActivations = useRef<Record<string, number[]>>({});

	// STATES
	const [transitionDuration, _setTransitionDuration] = useState(300);
	const setTransitionDuration = useCallback((value: number /* | ((current: number) => number) */) => { 
		window.__INTERNAL_TELLYFIN_GAMEPAD__.transition = Math.max(0, Math.min(value - 40, 400));
		// if (typeof value == "number") {
		// } else {
		// 	window.__INTERNAL_TELLYFIN_GAMEPAD__.transition = Math.max(0, Math.min(value(window.__INTERNAL_TELLYFIN_GAMEPAD__.transition) - 40, 400));
		// }
		_setTransitionDuration(value)
	}, [_setTransitionDuration])
	const [pageIsFocused, setPageIsFocused] = useState(document.hasFocus());

	// EFFECTS
	useEffect(() => {
		const handleGamepadCon = (e: GamepadEvent) => {
			console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
				e.gamepad.index, e.gamepad.id,
				e.gamepad.buttons.length, e.gamepad.axes.length);
			// gamepads.current = navigator.getGamepads();
		};
		window.addEventListener("gamepadconnected", handleGamepadCon);
		window.addEventListener("gamepaddisconnected", handleGamepadCon)
		return () => {
			window.removeEventListener("gamepadconnected", handleGamepadCon);
			window.removeEventListener("gamepaddisconnected", handleGamepadCon);
		};
	}, []);

	useEffect(() => {
		const handleBlur = () => setPageIsFocused(false);
		const handleFocus = () => setPageIsFocused(true);
		const handleVisChange = () => setPageIsFocused(!document.hidden);
		window.addEventListener("blur", handleBlur);
		window.addEventListener("focus", handleFocus);
		window.addEventListener("visibiltychange", handleVisChange);
		return () => {
			window.removeEventListener("blur", handleBlur);
			window.removeEventListener("focus", handleFocus);
			window.removeEventListener("visibiltychange", handleVisChange);
		};
	}, []);

	useEffect(() => {
		if (!pageIsFocused) return;
		const animate = (/* now: DOMHighResTimeStamp */) => {
			/** Milliseconds */
			const now = performance.now();
			// console.log(now);
			// console.log(navigator.getGamepads());
			/** Milliseconds */
			const delta = now - last.current;
			// if (delta > 17) console.log("delta:", delta);
			// gamepads.current = navigator.getGamepads();
			const eventsToCall: /* (keyof globalThis.Gamepad["buttons"]) */any[] = [];
			const releaseEventsToCall: /* (keyof globalThis.Gamepad["buttons"]) */any[] = [];
			const gamepads = navigator.getGamepads();
			for (const index in gamepads) {
				const gamepad = gamepads[index];
				// console.log(gamepad);
				if (gamepad) {
					const id = gamepad.index;
					// ---- Super important intialisation thingamies ---- //
					if (!axesActiveRightNow.current[id]) axesActiveRightNow.current[id] = new Set();
					if (!buttonsPressedRightNow.current[id]) buttonsPressedRightNow.current[id] = new Set();
	
					if (!buttonPresses.current[id]) buttonPresses.current[id] = {};
					if (!button_countdowns.current[id]) button_countdowns.current[id] = {};
	
					if (!axis_countdowns.current[id]) axis_countdowns.current[id] = [0].fill(200, 0, 50);
					if (!axisActivations.current[id]) axisActivations.current[id] = [0].fill(0, 0, 50);
					// -------------------------------------------------- //
					for (const button in gamepad.buttons) {
						if (!gamepad.buttons[button].pressed) {
							buttonPresses.current[id][button] = 0;
							button_countdowns.current[id][button] = 0;
							if (buttonsPressedRightNow.current[id].has(button)) {
								buttonsPressedRightNow.current[id].delete(button);
								releaseEventsToCall.push(button);
							}
						} else if (button_countdowns.current[id][button] > 0) {
							// console.log("countdown:", countdown.current);
							// console.log(delta);
							button_countdowns.current[id][button] = Math.max(button_countdowns.current[id][button] - delta, 0);
							// console.log(countdown.current[button]);
						} else {
							if (gamepad.buttons[button].pressed) {
								const time = buttonAcceleration(buttonPresses.current[id][button]);
								button_countdowns.current[id][button] = time;
								// setMovementInterval(time);
								// setTransitionDuration(c => Math.min(c, time));
								setTransitionDuration(time);
								buttonsPressedRightNow.current[id].add(button);
								buttonPresses.current[id][button]++;
								// console.log(gamepad.buttons[button]);
								// console.log(button);
								// console.log(GamepadButton[button]);
								eventsToCall.push(button);
							}
						}
						// gamepad.buttons[button];
					}
					for (let i = 0; i < gamepad.axes.length; i++) {
						const axis = i;
						const value = gamepad.axes[i];
						const active = Math.abs(value) > JOYSTICK_THRESHOLD;
						const button = axisToButton(axis, value);
						if (!button) continue;
						const countdown_index = button;
						if (!active) {
							axisActivations.current[id][button] = 0;
							axis_countdowns.current[id][countdown_index] = 0;
							if (axesActiveRightNow.current[id].has(button)) {
								axesActiveRightNow.current[id].delete(button);
								releaseEventsToCall.push(button);
							}
						} else if (axis_countdowns.current[id][countdown_index] > 0) {
							axis_countdowns.current[id][countdown_index] = Math.max(axis_countdowns.current[id][countdown_index] - delta, 0);
						} else if (active) {
							// Math.abs(value) > 0.4
							const time = axisAcceleration(axisActivations.current[id][button]) / (Math.abs(value) * 1.5);
							axis_countdowns.current[id][countdown_index] = time;
							// throw new Error(`Time to repeat: ${time}`);
							setTransitionDuration(time);
							axesActiveRightNow.current[id].add(button);
							axisActivations.current[id][button]++;
							eventsToCall.push(button);
						}
					}
				}
			}
			last.current = now;
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
			if (navigator.getGamepads().every((pad, index, arr) => {
				if (pad){
					if (buttonsPressedRightNow.current[pad.id] && axesActiveRightNow.current[pad.id])
						return buttonsPressedRightNow.current[pad.id].size == 0 && axesActiveRightNow.current[pad.id].size == 0;
				}
				return true;
			})) {
				setTransitionDuration(400);
			}
		};
		frame.current = window.setInterval(animate, 5);
		return () => window.clearInterval(frame.current);
	}, [pageIsFocused, setTransitionDuration]);

	const transitionStandard = Math.max(0, Math.min(transitionDuration - 40, 300));

	return (
		// <GamepadContext.Provider value={contextValue.current}>
		<div style={{ "--standard-duration": `${transitionStandard}ms`, "--transition-short": `${Math.max(0, Math.min((transitionDuration / 2) - 20, 150))}ms` }}>
			{/* {JSON.stringify(navigator.getGamepads().map(gamepad => ({
				index: gamepad?.index,
				id: gamepad?.id,
			})))} */}
			<MovementSpeed.Provider value={transitionStandard}>
				{children}
			</MovementSpeed.Provider>
		</div>
		// </GamepadContext.Provider>
	);
};