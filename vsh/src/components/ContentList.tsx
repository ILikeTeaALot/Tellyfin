import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { ContentItem } from "./Content/types";
import { AppMode } from "../context/AppState";
import { AppState } from "../AppStates";

export const TEXT_ITEM_HEIGHT = 56;

export enum NavigateAction {
	Enter,
	Back,
	Play,
}

export type ContentListProps = {
	nav_position: number;
	data: Array<ContentItem>;
	onNavigate: (action: NavigateAction, index?: number) => void;
};

export function ContentList(props: ContentListProps) {
	const { nav_position } = props;
	const app_state = useContext(AppMode);
	// Handle keeping onNavigate callback... correct.
	const onNavigate = useRef(props.onNavigate);
	onNavigate.current = props.onNavigate;
	// Normal stuff
	const [selected, setSelected] = useState(0);
	// Makes useEffect easier.
	const h_length = props.data.length;
	useEffect(() => {
		if (nav_position == 0 && app_state == AppState.Home) {
			function handler(e: KeyboardEvent) {
				console.log(e.key);
				switch (e.key) {
					case "PadDown":
					case "ArrowDown":
						setSelected(current => Math.min(current + 1, h_length - 1));
						break;
					case "PadUp":
					case "ArrowUp":
						setSelected(current => Math.max(current - 1, 0));
						break;
					case "Enter":
						onNavigate.current(NavigateAction.Enter, selected);
						break;
					case "Backspace":
					case "Back":
						onNavigate.current(NavigateAction.Back);
						break;
					default:
						break;
				}
			}
			window.addEventListener("keydown", handler);
			return () => { window.removeEventListener("keydown", handler); };
		}
	}, [h_length, nav_position, selected, onNavigate, app_state]);
	return (
		<div class="content-list text" style={{
			opacity: nav_position == 0 ? 1 : 0,
		}}>
			{props.data.map((item, index) =>
				<span key={item.id} class={selected == index ? "list-item selected" : "list-item"} style={{
					fontWeight: selected == index ? 700 : 400,
					translate: `0px ${(window.innerHeight / 2) - (TEXT_ITEM_HEIGHT / 2) - (TEXT_ITEM_HEIGHT * selected)}px`,
				}}>{item.name}</span>
			)}
		</div>
	);
}