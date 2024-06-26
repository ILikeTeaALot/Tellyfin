import { useEffect, useRef, useState } from "preact/hooks";
import { InputProps } from "./Input";

type Seconds = number;

type ThreeState = 0 | 1 | 2;

function increment(selected: ThreeState) {
	switch (selected) {
		case 0:
			return 3600;
		case 1:
			return 60;
		case 2:
			return 1;
	}
}

export function TimeSpinner(props: InputProps<Seconds>) {
	let { active, default: _default, onCancel: _cancel, onSubmit: _submit } = props;
	const submit = useRef(_submit);
	const cancel = useRef(_cancel);
	cancel.current = _cancel;
	const [selected, setSelected] = useState<ThreeState>(0);
	const [value, setValue] = useState(_default);
	// const [hours, setHours] = useState(Math.round(value / 3600));
	// const [minutes, setMinutes] = useState(Math.floor(value / 60));
	// const [seconds, setSeconds] = useState(value % 60);
	submit.current = () => {
		_submit(value);
	};
	useEffect(() => {
		if (active) {
			function handler(e: KeyboardEvent) {
				console.log(e.key);
				switch (e.key) {
					case "PadDown":
					case "ArrowDown":
						setValue(value => value - increment(selected));
						break;
					case "PadUp":
					case "ArrowUp":
						setValue(value => value + increment(selected));
						break;
					case "PadRight":
					case "ArrowRight":
						setSelected(current => Math.min(current + 1, 2) as ThreeState);
						break;
					case "PadLeft":
					case "ArrowLeft":
						setSelected(current => Math.max(current - 1, 0) as ThreeState);
						break;
					case "Enter":
						submit.current(value);
						break;
					case "Backspace":
					case "Back":
						cancel.current();
						break;
					default:
						break;
				}
			}
			window.addEventListener("keydown", handler);
			return () => { window.removeEventListener("keydown", handler); };
		}
	}, [selected]);
	return (
		<div>
			<span>{Math.floor(value / 3600).toString().padStart(2, "0")}</span>
			<span>:</span>
			<span>{Math.floor((value / 60) % 60).toString().padStart(2, "0")}</span>
			<span>:</span>
			<span>{(value % 60).toString().padStart(2, "0")}</span>
		</div>
	);
}