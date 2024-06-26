import { useCallback, useEffect } from "preact/hooks";

/**
 * Effectively a combination of useEffect and useCallback, streamlined
 * for the repetitive need to handle keypresses all over the place
 * in a consistent manner.
 * 
 * TODO: `keyup` handling?
 * @param active Whether the current screen/component is active/focused.
 * @param callback Handler function for button press events.
 * @param deps Dependencies like you would use in a call to `useEffect()`
 */
export function useInput(active: boolean, callback: (button: string) => void, deps: Array<any>) {
	const user_handler = useCallback(callback, deps); // eslint-disable-line react-hooks/exhaustive-deps
	useEffect(() => {
		if (!active) return;
		function handler(e: KeyboardEvent) {
			user_handler(e.key);
		}
		window.addEventListener("keydown", handler);
		return () => { window.removeEventListener("keydown", handler); };
	}, [active, user_handler]);
}

export function useInputRelease(callback: (button: string) => void, active: boolean, deps: Array<any>) {
	const user_handler = useCallback(callback, deps); // eslint-disable-line react-hooks/exhaustive-deps
	useEffect(() => {
		if (!active) return;
		function handler(e: KeyboardEvent) {
			user_handler(e.key);
		}
		window.addEventListener("keyup", handler);
		return () => { window.removeEventListener("keyup", handler); };
	}, [active, user_handler]);
}

export function useInputOnce(callback: (button: string) => void, active: boolean, deps: Array<any>) {
	const user_handler = useCallback(callback, deps); // eslint-disable-line react-hooks/exhaustive-deps
	useEffect(() => {
		if (!active) return;
		function handler(e: KeyboardEvent) {
			user_handler(e.key);
		}
		const options = { once: true };
		window.addEventListener("keydown", handler, options);
		return () => { window.removeEventListener("keydown", handler); };
	}, [active, user_handler]);

}