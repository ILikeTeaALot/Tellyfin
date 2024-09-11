import { useInput } from "../hooks";
import { useNavActive, useNavigationFunctions, useNavPosition } from "../hooks/routing";
import { ScrollArea } from "./Scroll";

import copyright from "~/resource/Third-Party.md";

export function AboutTellyfin(props: any) {
	const { back } = useNavigationFunctions();
	const position = useNavPosition();
	const active = useNavActive();
	useInput(active, (button) => {
		switch (button) {
			case "Back":
			case "Backspace":
				back();
		}
	}, [back]);
	// return (
	// 	<div>
	// 		<h1>About Tellyfin</h1>
	// 		<h2>{props?.test}</h2>
	// 		<h2>{JSON.stringify(props, null, "\t")}</h2>
	// 	</div>
	// );
	return (
		<ScrollArea active={active}>
			<div style={{ background: "#000000", padding: "8rem", opacity: active ? 1 : 0, transitionDuration: "var(--transition-short)" }}>
				<h1>Tellyfin Beta</h1>
				<div style={{ display: "flex", flexDirection: "column", gap: "1lh", whiteSpace: "pre-line" }}>
					{copyright.split("\n\n").map(s => {
						return (
							<div>{s}</div>
						);
					})}
				</div>
			</div>
		</ScrollArea>
	);
}