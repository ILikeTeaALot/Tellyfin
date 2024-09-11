import type { ComponentChildren } from "preact";
import { useInput } from "../../hooks";

type ButtonProps = {
	active: boolean;
	children?: ComponentChildren;
	onPress: () => void;
};

export function Button(props: ButtonProps) {
	const { active, children, onPress } = props;
	useInput(active, (button) => {
		switch (button) {
			case "Enter":
				onPress();
		}
	}, [onPress]);
	return (
		<div style={{ border: active ? "2px solid white" : "2px solid rgba(255, 255, 255, 0.4)", borderRadius: "0.325rem", background: active ? "rgba(255, 255, 255, 0.2)" : "", margin: "0.25rem auto", padding: "0em 1em", fontSize: 28, fontWeight: 600, transitionDuration: "var(--transition-standard)", animation: active ? "var(--text-glow)" : "" }}>{children}</div>
	);
}