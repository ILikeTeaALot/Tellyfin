import { useCallback, useState } from "preact/hooks";
import { Keyboard } from "./Keyboard";
import type { KeyboardLayoutCollection } from "./layouts/interfaces";
import { useInput } from "../../hooks";

export type TextInputProps = {
	/** TextInput controls when the keyboard is open itself. */
	active: boolean;
	layout?: KeyboardLayoutCollection;
	name: string;
	value: string;
	/** It is user-component's responsibility to manage state... sort of. */
	onChange: (value: string) => void;
	onKeyboardClose: () => void;
	onKeyboardOpen: () => void;
};

export function TextInput(props: TextInputProps) {
	const { active, layout, name, value, onChange, onKeyboardClose, onKeyboardOpen } = props;
	const [keyboardOpen, setKeyboardOpen] = useState(false);
	useInput(active && !keyboardOpen, (button) => {
		switch (button) {
			case "Enter":
				setKeyboardOpen(true);
				onKeyboardOpen();
		}
	}, [onKeyboardOpen]);
	const onCancel = useCallback(() => {
		setKeyboardOpen(false);
		onKeyboardClose();
	}, [onKeyboardClose]);
	const onEnter = useCallback((text: string) => {
		setKeyboardOpen(false);
		onKeyboardClose();
		onChange(text);
	}, [onChange, onKeyboardClose]);
	return (
		<div style={{ display: "flex", flexDirection: "column", minwidth: 640, width: 640 }}>
			<span style={{ display: "flex", paddingLeft: "0.5rem" }}>{name}</span>
			<div style={{ border: active ? "2px solid white" : "2px solid rgba(255, 255, 255, 0.4)", borderRadius: "0.25rem", padding: "0.25rem 0.5rem", margin: "0.25rem auto", animation: active ? "var(--text-glow)" : "", width: "100%", transitionDuration: "var(--transition-standard)" }}>
				<span style={{ whiteSpace: "pre", height: "1lh", display: "block" }}>{value}</span>
			</div>
			<Keyboard active={keyboardOpen} defaultValue={value} onCancel={onCancel} onEnter={onEnter} overrideLayout={layout} /> {/* TODO: Set Keyboard XY */}
		</div>
	);
}