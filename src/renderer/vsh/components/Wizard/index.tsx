import { useInput } from "../../hooks";
import { useCurrent, useNavigationFunctions, useNavPosition } from "../../hooks/routing";

export function Wizard() {
	const { back } = useNavigationFunctions();
	const position = useNavPosition();
	useInput(position == 0, (button) => {
		switch (button) {
			case "Back":
			case "Backspace":
				back();
		}
	}, [back]);
	return (
		<h1>I'm a Wizard!</h1>
	)
}