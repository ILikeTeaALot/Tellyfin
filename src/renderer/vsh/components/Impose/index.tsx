import { useInput } from "../../hooks";

export function ImposeMenu(props: { active: boolean; onCancel: () => void; }) {
	const { active, onCancel } = props;
	useInput(active, (button) => {
		switch (button) {
			case "Back":
			case "Backspace":
				onCancel();
		}
	}, [onCancel]);
	if (active) return (
		<h1>[Impose/Quick Menu]</h1>
	);
	return null;
}