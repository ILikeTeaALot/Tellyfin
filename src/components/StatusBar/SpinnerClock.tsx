import { DateTime } from "luxon";
import "./clock.css";
import { useRef, useState, useEffect, useCallback } from "preact/hooks";
// import bezier from "bezier-easing";

export interface ClockProps {
	spin: boolean;
	time?: DateTime;
}

// const accelerate = bezier(0.12, 0, 0.39, 0);
// const decelerate = bezier(0.61, 1, 0.88, 1);

export function SpinnerClock(props: ClockProps) {
	const { spin } = props;
	const frame = useRef<number | undefined>();
	const spin_frame = useRef<number>(-1);
	const last = useRef(performance.now());
	// const [hAngle, setHAngle] = useState(0);
	// const [mAngle, setMAngle] = useState(0);
	const [angle, setAngle] = useState({ hour: 0, minute: 0 });
	// const hHand = useRef<HTMLDivElement>(null);
	// const mHand = useRef<HTMLDivElement>(null);

	const [animating, setAnimationState] = useState(spin ?? false);
	const [transition, setTransitionState] = useState(!spin ?? true);

	useEffect(() => {
		if (animating) return;
		setTransitionState(true);
		if (transition) {
			// const animate = () => {
			// 	const now = performance.now();
			// 	const delta_ms = now - last.current;
			// 	if (delta_ms < 750) {
					
			// 	} else {
			// 		setTransitionState(false);
			// 	}
			// 	last.current = now;
			// };
			// frame.current = window.requestAnimationFrame(animate);
			// return () => window.cancelAnimationFrame(frame.current!);
		} else {
		}
		// if (hHand.current && mHand.current) {
		// 	hHand.current.style.transform = `rotate(${(hAngle - 180).toFixed(4)}deg)`;
		// 	mHand.current.style.transform = `rotate(${(mAngle - 180).toFixed(4)}deg)`;
		// }
		const animate = (/* now: DOMHighResTimeStamp */) => {
			const now = performance.now();
			// if (!props.spin) {
			const date_time = /* time || */ DateTime.local();
			const minutes = date_time.minute + (date_time.second / 60) /* + (date_time.getMilliseconds() / 1000) / 60 */;
			const hours = (date_time.hour % 12) + minutes / 60;
			setAngle({ hour: (30 * hours) + 360, minute: (6 * minutes) + 360 });
			// setMAngle((6 * minutes) + 360);
			// setHAngle((30 * hours) + 360);
			last.current = now;
			// }
			// frame.current = window.setTimeout(animate, 100);
		};
		frame.current = window.setInterval(animate, 100);
		return () => window.clearInterval(frame.current);
	}, [animating, transition]);

	useEffect(() => {
		let start_ms = performance.now();
		let last_ms = start_ms;
		// let oldAngle = 0;
		// Return to current system time
		/* if (!animating && transition) {
			const animate = () => {
				const now_ms = performance.now();
				const delta_ms = now_ms - last_ms;
				const delta_seconds = delta_ms / 1000;
				const newAngle = (prev_angle: number) => ((prev_angle + (360 * (delta_seconds * 0.75))) % 360);
				console.log("delta (ms):", delta_ms);
				console.log("delta (s):", delta_seconds);
				setAngle(prev => ({ hour: newAngle(prev.hour), minute: newAngle(prev.hour) }));
				last_ms = now_ms;
				spin_frame.current = requestAnimationFrame(animate);
			};
			spin_frame.current = requestAnimationFrame(animate);
		} */
		// Transition to spin mode
		/* if (animating && transition) {
			const animate = () => {
				const now_ms = performance.now();
				const delta_ms = now_ms - last_ms;
				const delta_seconds = delta_ms / 1000;
				const start_delta_ms = start_ms - now_ms;
				const start_delta_seconds = start_delta_ms / 1000;
				if (delta_ms < 750) {
					const newAngle = (prev_angle: number) => (prev_angle + ((360 * accelerate(start_delta_seconds / .7))) % 360);
					setAngle(prev => ({
						hour: newAngle(Math.min(prev.hour, prev.minute)),
						minute: newAngle(prev.minute),
					}));
				} else {
					setTransitionState(false);
				}
				last_ms = now_ms;
				spin_frame.current = requestAnimationFrame(animate);
			};
			spin_frame.current = requestAnimationFrame(animate);
		} */
		// Spin
		if (animating && !transition) {
			const animate = () => {
				const now_ms = performance.now();
				const delta_ms = now_ms - last_ms;
				const delta_seconds = delta_ms / 1000;
				const newAngle = (prev_angle: number) => ((prev_angle + (360 * (delta_seconds * 0.75))) % 360);
				console.log("delta (ms):", delta_ms);
				console.log("delta (s):", delta_seconds);
				// const startDelta_ms = now_ms - start_ms;
				/* if (startDelta_ms < 520) {
					// Should hopefully be "transitioning" at this time
					// if (hHand.current && mHand.current) {
					// 	hHand.current.style.transform = `rotate(0deg)`;
					// 	mHand.current.style.transform = `rotate(0deg)`;
					// }
				} else {
					// setTransitionEnabled(false);
					// const angle = newAngle(oldAngle);
					// if (hHand.current && mHand.current) {
					// 	hHand.current.style.transform = `rotate(${(angle).toFixed(4)}deg)`;
					// 	mHand.current.style.transform = `rotate(${(angle).toFixed(4)}deg)`;
					// }
					// setMAngle(newAngle);
					// setHAngle(newAngle);
				} */
				setAngle(prev => ({ hour: newAngle(prev.hour), minute: newAngle(prev.hour) }));
				// if (startDelta_ms > 520) {
				// 	setTransitionEnabled(false);
				// }
				// Prepare for next run
				last_ms = now_ms;
				spin_frame.current = requestAnimationFrame(animate);
			};
			spin_frame.current = requestAnimationFrame(animate);
			setAngle(prev => ({ hour: (prev.hour + 4.5) % 360, minute: (prev.hour + 4.5 /* (360 * 0.0125) */ % 360) }));
			return () => cancelAnimationFrame(spin_frame.current);
		}
	}, [animating, transition]);

	useEffect(() => {
		// const state = spin;
		// const _handle = setTimeout(() => {
		// 	setAnimationState(state);
		// }, 1000);
		if (spin) {
			setTransitionState(true);
			setAnimationState(true);
			// setMAngle(720);
			// setHAngle(720);
			setAngle((/* {hour} */) => ({ hour: 720, minute: 720 }));
		} else {
			setTimeout(() => {
				// setTransitionState(true);
				setAnimationState(false);
			}, 800);
		}
	}, [spin]);

	const disableTransition = useCallback(() => setTransitionState(false), []);

	const transitionDuration = transition ? "750ms" : "0ms";
	// const transitionDuration = "0ms";
	return (
		<div className={animating ? "clock spinner" : "clock"}>
			<div /* ref={mHand} */ className="hand m" id="m-hand" style={{
				transform: `rotate(${(angle.minute - 180).toFixed(4)}deg)`,
				transitionDuration,
			}} onTransitionEnd={disableTransition} />
			<div /* ref={hHand} */ className="hand h" id="h-hand" style={{
				transform: `rotate(${(angle.hour - 180).toFixed(4)}deg)`,
				transitionDuration,
			}} />
		</div>
	);
}