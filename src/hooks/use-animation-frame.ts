import { useEffect, useRef } from "preact/hooks";

export function useAnimationFrame(handler: (last: number, now: number) => void, active: boolean, deps: Array<any>) {
	const last = useRef(performance.now());
	const frame = useRef(0);
	useEffect(() => {
		if (!active) return;
		const next = (now: number) => {
			handler(last.current, now);
			last.current = now;
			frame.current = requestAnimationFrame(next);
		};
		frame.current = requestAnimationFrame(next);
		return () => cancelAnimationFrame(frame.current);
	}, [active, ...deps]);
}