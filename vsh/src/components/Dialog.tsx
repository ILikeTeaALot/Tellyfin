import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { useInput } from "../hooks";

export type DialogProps = {
	active: boolean;
	children: string; // TOOD: Change this
	onSubmit: (confirmed: boolean) => void;
	onCancel: () => void;
};

export function Dialog(props: DialogProps) {
	const { active, onCancel: cancel, onSubmit: _submit } = props;
	const [selected, setSelected] = useState(1);
	// Submit
	const submit = useCallback(() => {
		_submit(selected == 0);
	}, [selected, _submit]);
	useEffect(() => {
		setSelected(1);
	}, [active]);
	useInput(active, (button) => {
		if (button == "Enter") submit();
	}, [submit]);
	useInput(active, (button) => {
		switch (button) {
			case "PadLeft":
			case "ArrowLeft":
				setSelected(0);
				break;
			case "PadRight":
			case "ArrowRight":
				setSelected(1);
				break;
			case "Back":
			case "Backspace":
				cancel();
				break;
		}
	}, [cancel]);
	return (
		<div class="dialog" style={{ opacity: active ? 1 : 0 }}>
			<div class="content">
				<span class="message">{props.children}</span>
				<div class="options">
					<span class={selected == 0 ? "option selected" : "option"}>Yes</span>
					<span class={selected == 1 ? "option selected" : "option"}>No</span>
				</div>
			</div>
		</div>
	);
}