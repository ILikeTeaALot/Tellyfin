import { DateTime } from "luxon";
import { SpinnerClock } from "./SpinnerClock";
import type { FunctionComponent } from "preact";
import { useState, useRef, useEffect } from "preact/hooks";
import "./style.css";

interface StatusBarProps {
	spinner_only?: boolean;
	loading?: boolean;
	show?: boolean;
}

export const StatusBar: FunctionComponent<StatusBarProps> = (props) => {
	const [date_time, setDateTime] = useState(DateTime.local());
	const frame = useRef<number | undefined>();
	const last = useRef(performance.now());

	useEffect(() => {
		const animate = (/* now: DOMHighResTimeStamp */) => {
			const now = performance.now();
			setDateTime(DateTime.local());
			last.current = now;
		};
		frame.current = window.setInterval(animate, 100);
		return () => window.clearInterval(frame.current as number);
	}, []);
	if (props.spinner_only) {
		return (
			<div className="status-bar no-border">
				<SpinnerClock spin={true} time={date_time} />
			</div>
		);
	}
	return (
		<div className={props.show ? "status-bar visible" : "status-bar"}>
			<div className="date">
				<span className="time-label">{date_time.toFormat("d/M")}</span>
				<span className="time-label">{date_time.toFormat("HH:mm")}</span>
			</div>
			<SpinnerClock spin={props.loading} time={date_time} />
		</div>
	);
};