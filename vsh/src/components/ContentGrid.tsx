import { useRef, useState, useEffect, useContext } from "preact/hooks";
import { NavigateAction } from "./ContentList";
import { ContentItem } from "./Content/types";
import api from "../context/Jellyfin";
import { AppMode } from "../context/AppState";
import { AppState } from "../AppStates";

export type ContentGridProps = {
	nav_position: number;
	data: Array<ContentItem>;
	onNavigate: (action: NavigateAction, index?: number) => void;
};

const COLUMNS = 6;

const WIDTH = 240;
const HEIGHT = 360;

const GAP = 60;

const GRID_WIDTH = ((COLUMNS - 1) * GAP + COLUMNS * WIDTH); // (5 * GAP + 6 * WIDTH) // 1740

const MARGIN = (1920 - GRID_WIDTH) / 2;

export function ContentGrid(props: ContentGridProps) {
	const columns = COLUMNS;
	const { nav_position: nav_position } = props;
	const state = useContext(AppMode);
	// Handle keeping onNavigate callback... correct.
	const onNavigate = useRef(props.onNavigate);
	onNavigate.current = props.onNavigate;
	// Normal stuff
	const [selected, setSelected] = useState(0);
	// Makes useEffect easier.
	const h_length = props.data.length;
	useEffect(() => {
		if (nav_position == 0 && state == AppState.Home) {
			function handler(e: KeyboardEvent) {
				console.log(e.key);
				switch (e.key) {
					case "PadUp":
					case "ArrowUp":
						setSelected(current => {
							if (current < columns) {
								return current;
							} else {
								return Math.max(current - columns, 0);
							}
						});
						break;
					case "PadDown":
					case "ArrowDown":
						setSelected(current => Math.min(current + columns, h_length - 1));
						break;
					case "PadLeft":
					case "ArrowLeft":
						setSelected(current => Math.max(current - 1, 0));
						break;
					case "PadRight":
					case "ArrowRight":
						setSelected(current => {
							if (current == h_length - 1 && (current + 1) % 6 != 0) {
								if (h_length > columns) {
									return current - 5;
								} else {
									return current;
								}
							} else {
								return Math.min(current + 1, h_length - 1);
							}
						});
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
	}, [h_length, nav_position, selected, onNavigate, state]);
	const startIndex = Math.max((selected - (columns * 2)) - (selected % columns), 0);
	const endIndex = Math.min(selected + (columns * 2) + (columns - (selected % columns)), props.data.length);
	return (
		<div className="content-grid" style={{
			opacity: nav_position == 0 ? 1 : 0,
			scale: `${1 + (Math.max(Math.min(nav_position, 1), -1) * -0.2)}`,
			transitionTimingFunction: nav_position == 0 ? "var(--timing-function-decelerate)" : "var(--timing-function-accelerate)",
			transitionDelay: nav_position == 0 ? "var(--transition-standard)" : "0ms"
		}}>
			{props.data.slice(startIndex, endIndex).map((item, _index) => {
				const index = startIndex + _index;
				const row = Math.floor(index / columns);
				const selected_row = Math.floor(selected / columns);
				return (
					<div key={item.id} class="grid-item" style={{
						translate: `${MARGIN + ((index % columns) * (WIDTH + GAP))}px ${ ( ( window.innerHeight / 2 ) - ( HEIGHT / 2 ) ) + ( (( HEIGHT + GAP ) * ( row )) ) - ( (HEIGHT + GAP) * selected_row ) }px`,
					}}>
						<div className={selected == index ? "panel active" : props.nav_position <= 0 ? "panel inactive" : "panel"} style={{
							width: WIDTH,
							height: HEIGHT,
							borderRadius: 16,
						}}>
							<div className={"panel-content"}>
								<div className={"shadow"} />
								<div className={"panel-image"}>
									{item.jellyfin_data ? <img
										decoding="async"
										src={`${api.basePath}/Items/${item.id}/Images/Primary?width=${WIDTH * 2}&quality=100`}
										style={{
											objectFit: "cover",
											width: "100%",
											height: "100%",
										}}
									/> : (
										<div style={{ padding: 20, display: "flex", justifyContent: "flex-start" }}>
											<span style={{
												fontWeight: 600,
												display: "flex",
											}}>{item.name}</span>
										</div>
									)}{/* TODO */}
								</div>
								<div className={"border-highlight"} />
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}