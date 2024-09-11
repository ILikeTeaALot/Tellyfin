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
		<div class="dialog">
			<div class="content">
				<h1>Impose/Quick Menu</h1>
			</div>
		</div>
	);
	return null;
}