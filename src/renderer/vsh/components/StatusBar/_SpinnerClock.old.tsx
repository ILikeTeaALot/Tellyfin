import { DateTime } from "luxon";
import "./clock.css";
import type { FunctionComponent } from "preact";
import { useRef, useState, useEffect } from "preact/hooks";
import type { ClockProps } from "./SpinnerClock";

enum AnimationState {
	Stop,
	Warmup,
	Run,
	Cooldown,
}

const _SpinnerClock: FunctionComponent<ClockProps> = (props) => {
	const { time, spin } = props;
	const frame = useRef<number | undefined>();
	const spin_frame = useRef<number>(-1);
	const last = useRef(performance.now());
	const [hAngle, setHAngle] = useState(0);
	const [mAngle, setMAngle] = useState(0);
	// const hHand = useRef<SVGRectElement>(null);
	// const mHand = useRef<SVGRectElement>(null);

	const [animateState, setAnimationState] = useState(spin ? AnimationState.Run : AnimationState.Stop);

	useEffect(() => {
		if (animateState != 0) return;
		const animate = (/* now: DOMHighResTimeStamp */) => {
			const now = performance.now();
			// if (!props.spin) {
			const date_time = /* time || */ DateTime.local();
			const minutes = date_time.minute + (date_time.second / 60) /* + (date_time.getMilliseconds() / 1000) / 60 */;
			setMAngle(6 * minutes);
			const hours = (date_time.hour % 12) + minutes / 60;
			setHAngle(30 * hours);
			last.current = now;
			// }
			// frame.current = window.setTimeout(animate, 100);
		};
		frame.current = window.setInterval(animate, 100);
		return () => window.clearInterval(frame.current);
	}, [animateState]);

	useEffect(() => {
		if (animateState) {
			let start_ms = performance.now();
			let last_ms = performance.now();
			// let oldAngle = 0;
			const animate = () => {
				const now_ms = performance.now();
				const delta_ms = now_ms - last_ms;
				const delta_seconds = delta_ms / 1000;
				console.log("delta (ms):", delta_ms);
				console.log("delta (s):", delta_seconds);
				if (now_ms - start_ms < 400) {
					// Should hopefully be "transitioning" at this time
					setMAngle(0);
					setHAngle(0);
				} else {
					const newAngle = (last: number) => (last + (360 * delta_seconds)) % 360;
					// const angle = newAngle(oldAngle);
					// if (hHand.current && mHand.current) {
					// 	/// @ts-expect-error
					// 	hHand.current.transform = `rotate(${(angle).toFixed(4)} 10 10)`;
					// 	/// @ts-expect-error
					// 	mHand.current.transform = `rotate(${(angle).toFixed(4)} 10 10)`;
					// }
					setMAngle(newAngle);
					setHAngle(newAngle);
				}
				// Prepare for next run
				last_ms = now_ms;
				spin_frame.current = requestAnimationFrame(animate);
			};
			spin_frame.current = requestAnimationFrame(animate);
			return () => cancelAnimationFrame(spin_frame.current);
		}
	}, [animateState]);

	useEffect(() => {
		// const state = spin;
		// const _handle = setTimeout(() => {
		// 	setAnimationState(state);
		// }, 1000);
		if (spin) {
			setAnimationState(AnimationState.Warmup);
			setTimeout(() => {
				setAnimationState(AnimationState.Run);
			}, 300);
		} else {
			setTimeout(() => {
				setAnimationState(AnimationState.Cooldown);
				setTimeout(() => {
					setAnimationState(AnimationState.Stop);
				}, 300);
			}, 1500);
		}
	}, [spin]);
	// const hours = props.time.hour;
	// console.log("hours", hours);
	// const hAngle = 30 * (hours % 12);
	// console.log("hAngle", hAngle);
	// const minutes = props.time.minute;
	// console.log("minutes", minutes);
	// const mAngle = 6 * minutes;
	// console.log("mAngle", mAngle);
	return (
		<div className={props.spin ? "clock spinner" : "clock"}>
			{/* <div className="hand m" style={{ transform: `rotate(${props.spin ? 180 : mAngle - 180}deg) translateZ(0px)` }} />
			<div className="hand h" style={{ transform: `rotate(${props.spin ? 180 : hAngle - 180}deg) translateZ(0px)` }} /> */}
			<svg viewBox="0 0 20 20" fill="#FFFFFF">
				{/* <ellipse cx={10} cy={10} rx={10} ry={10} fillOpacity={0.1} /> */}
				<rect className="hand m" id="m-hand" stroke="none" width={2} height={10} x={9} y={9} rx={1} transform={animateState == 0 ? `rotate(${(mAngle - 180).toFixed(4)} 10 10)` : undefined}>
					{/* {!animateSpin ? <animateTransform
						attributeName="transform"
						attributeType="XML"
						type="rotate"
						to={`${(mAngle + 180 + 360).toFixed(4)} 10 10)`}
						fill="freeze"
						dur="0.5s"
					/> : null}
					{animateSpin ? <animateTransform
						attributeName="transform"
						attributeType="XML"
						type="rotate"
						from={`${(mAngle - (180)).toFixed(4)} 10 10)`}
						to="360 10 10"
						dur="1s"
					/> : null}
					{animateSpin ? <animateTransform
						attributeName="transform"
						attributeType="XML"
						type="rotate"
						from="-720 10 10"
						to="-360 10 10"
						begin="1s"
						dur="1s"
						// fill="freeze"
						repeatCount="indefinite"
					/> : null} */}
					{animateState == AnimationState.Warmup ? <animateTransform
						attributeName="transform"
						attributeType="XML"
						type="rotate"
						from={`${(mAngle - (180)).toFixed(4)} 10 10`}
						to="720 10 10"
						dur="0.3s"
					/> : null}
					{animateState == AnimationState.Run ? <animateTransform
						attributeName="transform"
						attributeType="XML"
						type="rotate"
						from="0 10 10"
						to="360 10 10"
						// begin="1s"
						dur="1s"
						repeatCount="indefinite"
					/> : null}
				</rect>
				<rect className="hand h" id="h-hand" stroke="none" width={2} height={7} x={9} y={9} rx={1} transform={animateState == 0 ? `rotate(${(hAngle - 180).toFixed(4)} 10 10)` : undefined}>
					{/* {!animateSpin ? <animateTransform
						attributeName="transform"
						attributeType="XML"
						type="rotate"
						to={`${(hAngle + 180 + 360).toFixed(4)} 10 10)`}
						fill="freeze"
						dur="0.5s"
					/> : null}
					{animateSpin ? <animateTransform
						attributeName="transform"
						attributeType="XML"
						type="rotate"
						from={`${(hAngle - (180)).toFixed(4)} 10 10)`}
						to="360 10 10"
						dur="1s"
					/> : null}
					{animateSpin ? <animateTransform
						attributeName="transform"
						attributeType="XML"
						type="rotate"
						from="-720 10 10"
						to="-360 10 10"
						dur="1s"
						begin="1s"
						// fill="freeze"
						repeatCount="indefinite"
					/> : null} */}
					{animateState == AnimationState.Warmup ? <animateTransform
						attributeName="transform"
						attributeType="XML"
						type="rotate"
						from={`${(hAngle - (180)).toFixed(4)} 10 10`}
						to="720 10 10"
						dur="0.3s"
					/> : null}
					{animateState == AnimationState.Run ? <animateTransform
						attributeName="transform"
						attributeType="XML"
						type="rotate"
						from="0 10 10"
						to="360 10 10"
						dur="1s"
						repeatCount="indefinite"
					/> : null}
				</rect>
			</svg>
		</div>
	);
};