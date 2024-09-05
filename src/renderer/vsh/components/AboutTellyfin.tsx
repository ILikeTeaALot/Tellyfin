import { useInput } from "../hooks";
import { useNavigationFunctions, useNavPosition } from "../hooks/routing";

export function AboutTellyfin(props: any) {
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
		<div>
			<h1>About Tellyfin</h1>
			<h2>{props?.test}</h2>
		</div>
	);
}