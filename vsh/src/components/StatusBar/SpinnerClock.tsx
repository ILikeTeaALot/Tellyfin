import { DateTime } from "luxon";
import "./clock.css";
import { useRef, useState, useEffect, useCallback } from "preact/hooks";

export interface ClockProps {
	spin: boolean;
	time?: DateTime;
}

export function SpinnerClock(props: ClockProps) {
	const { spin } = props;
	const frame = useRef<number | undefined>();
	const spin_frame = useRef<number>(-1);
	const last = useRef(performance.now());
	const [angle, setAngle] = useState({ hour: 0, minute: 0 });
	// const hHand = useRef<HTMLDivElement>(null);
	// const mHand = useRef<HTMLDivElement>(null);

	const [animating, setAnimationState] = useState(spin ?? false);
	const [transition, setTransitionState] = useState(!spin ?? true);

	useEffect(() => {
		if (animating) return;
		setTransitionState(true);
		const animate = (/* now: DOMHighResTimeStamp */) => {
			const now = performance.now();
			const date_time = /* time || */ DateTime.local();
			const minutes = date_time.minute + (date_time.second / 60) /* + (date_time.getMilliseconds() / 1000) / 60 */;
			const hours = (date_time.hour % 12) + minutes / 60;
			setAngle({ hour: (30 * hours) + 360, minute: (6 * minutes) + 360 });
			last.current = now;
		};
		frame.current = window.setInterval(animate, 100);
		return () => window.clearInterval(frame.current);
	}, [animating, transition]);

	useEffect(() => {
		let start_ms = performance.now();
		let last_ms = start_ms;
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
				} else {
				} */
				setAngle(prev => ({ hour: newAngle(prev.hour), minute: newAngle(prev.hour) }));
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
		if (spin) {
			setTransitionState(true);
			setAnimationState(true);
			setAngle({ hour: 720, minute: 720 });
		} else {
			setTimeout(() => {
				setAnimationState(false);
			}, 800);
		}
	}, [spin]);

	const disableTransition = useCallback(() => setTransitionState(false), []);

	const transitionDuration = transition ? "750ms" : "0ms";
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