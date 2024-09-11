import { useCallback, useEffect, useState } from "preact/hooks";
import { useInput } from "../hooks";

export enum DialogType {
	Confirm,
	Message,
}

export type DialogProps = {
	active: boolean;
	children: string; // TOOD: Change this
	onSubmit: (confirmed: boolean) => void;
	onCancel: () => void;
	type: DialogType,
};

export function Dialog(props: DialogProps) {
	const { active, onCancel: cancel, onSubmit: _submit, type } = props;
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
	}, [cancel, type]);
	const options = useCallback(() => {
		switch (type) {
			case DialogType.Confirm:
				return (
					<div class="options">
						<span class={selected == 0 ? "option selected" : "option"}>Yes</span>
						<span class={selected == 1 ? "option selected" : "option"}>No</span>
					</div>
				);
			case DialogType.Message:
				return (
					<div class="options">
						<span class="option selected">OK</span>
					</div>
				);
		}
	}, [type, selected]);
	return (
		<div class="dialog dark" style={{ opacity: active ? 1 : 0 }}>
			<div class="content">
				<span class="message">{props.children}</span>
				{options()}
			</div>
		</div>
	);
}