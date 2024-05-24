import { DateTime } from "luxon";
import "./clock.css";
import { useRef, useState, useEffect } from "preact/hooks";

export interface ClockProps {
	spin?: boolean;
	time: DateTime;
}

export function SpinnerClock(props: ClockProps) {
	const { time, spin } = props;
	const frame = useRef<number | undefined>();
	const spin_frame = useRef<number>(-1);
	const last = useRef(performance.now());
	const [hAngle, setHAngle] = useState(0);
	const [mAngle, setMAngle] = useState(0);
	// const hHand = useRef<HTMLDivElement>(null);
	// const mHand = useRef<HTMLDivElement>(null);

	const [animating, setAnimationState] = useState(spin ?? false);
	const [transition, setTransitionEnabled] = useState(!spin ?? true);

	useEffect(() => {
		if (animating) return;
		setTransitionEnabled(true);
		const animate = (/* now: DOMHighResTimeStamp */) => {
			const now = performance.now();
			const date_time = /* time || */ DateTime.local();
			const minutes = date_time.minute + (date_time.second / 60) /* + (date_time.getMilliseconds() / 1000) / 60 */;
			setMAngle(6 * minutes);
			const hours = (date_time.hour % 12) + minutes / 60;
			setHAngle(30 * hours);
			last.current = now;
		};
		frame.current = window.setInterval(animate, 100);
		return () => window.clearInterval(frame.current);
	}, [animating]);

	useEffect(() => {
		if (animating) {
			let start_ms = performance.now();
			let last_ms = performance.now();
			const animate = () => {
				const now_ms = performance.now();
				const delta_ms = now_ms - last_ms;
				const delta_seconds = delta_ms / 1000;
				console.log("delta (ms):", delta_ms);
				console.log("delta (s):", delta_seconds);
				const startDelta_ms = now_ms - start_ms;
				if (startDelta_ms < 320) {
					// Should hopefully be "transitioning" at this time
				} else {
					const newAngle = (prev_angle: number) => ((prev_angle + (360 * delta_seconds)) % 360) - 360;
					setMAngle(newAngle);
					setHAngle(newAngle);
				}
				if (startDelta_ms > 280) {
					setTransitionEnabled(false);
				}
				// Prepare for next run
				last_ms = now_ms;
				spin_frame.current = requestAnimationFrame(animate);
			};
			spin_frame.current = requestAnimationFrame(animate);
			return () => cancelAnimationFrame(spin_frame.current);
		}
	}, [animating]);

	useEffect(() => {
		if (spin) {
			setTransitionEnabled(true);
			setAnimationState(true);
			setMAngle(360);
			setHAngle(360);
		} else {
			setTimeout(() => {
				setAnimationState(false);
				setTransitionEnabled(true);
			}, 600);
		}
	}, [spin]);

	const transitionDuration = transition ? "var(--transition-standard)" : "0ms";
	return (
		<div className={animating ? "clock spinner" : "clock"}>
			<div /* ref={mHand} */ className="hand m" id="m-hand" style={{
				transform: `rotate(${(mAngle - 180).toFixed(4)}deg)`,
				transitionDuration,
			}} />
			<div /* ref={hHand} */ className="hand h" id="h-hand" style={{
				transform: `rotate(${(hAngle - 180).toFixed(4)}deg)`,
				transitionDuration,
			}} />
		</div>
	);
}