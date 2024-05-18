import { useEffect, useRef } from "preact/hooks";

/**
 * TODO: `keyup` handling?
 * @param active Whether the current screen/component is active/focused.
 * @param callback Handler function for button press events.
 * @param deps Dependencies like you would use in a call to `useEffect()`
 */
export function useInput(active: boolean, callback: (button: string) => void, deps: Array<any>) {
	const user_handler = useRef(callback);
	user_handler.current = callback;
	useEffect(() => {
		if (!active) return;
		function handler(e: KeyboardEvent) {
			user_handler.current(e.key);
		}
		window.addEventListener("keydown", handler);
		return () => { window.removeEventListener("keydown", handler); };
	}, [active, ...deps]);
}