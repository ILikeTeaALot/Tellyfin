import { useState, useContext, useMemo, useCallback } from "preact/hooks";
import { NavigateAction } from "./ContentList";
import { ContentItem, type Id } from "./Content/types";
import api, { auth, jellyfin } from "../context/Jellyfin";
import { AppMode } from "../context/AppState";
import { AppState } from "../AppStates";
import { useInput } from "../hooks";
import { Menu } from "./Menu";

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

const columns = COLUMNS;

export function ContentGrid(props: ContentGridProps) {
	const { data, nav_position, onNavigate } = props;
	const state = useContext(AppMode);
	const active = nav_position == 0 && state == AppState.Home;
	// Normal stuff
	const [selected, setSelected] = useState(0);
	const [menuOpen, setMenuOpen] = useState(false);
	// Makes useEffect easier.
	const data_length = data.length;
	useInput(active, (button) => {
		switch (button) {
			case "Y":
			case "t":
				setMenuOpen(v => !v);
				break;
		}
	}, []);
	useInput(active && !menuOpen, (button) => {
		switch (button) {
			case "Enter":
				onNavigate(NavigateAction.Enter, selected);
				break;
		}
	}, [onNavigate, selected]);
	useInput(active && !menuOpen, (button) => {
		console.log(button);
		switch (button) {
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
				setSelected(current => Math.min(current + columns, data_length - 1));
				break;
			case "PadLeft":
			case "ArrowLeft":
				setSelected(current => Math.max(current - 1, 0));
				break;
			case "PadRight":
			case "ArrowRight":
				setSelected(current => {
					if (current == data_length - 1 && (current + 1) % 6 != 0) {
						if (data_length > columns) {
							return current - 5;
						} else {
							return current;
						}
					} else {
						return Math.min(current + 1, data_length - 1);
					}
				});
				break;
			case "Backspace":
			case "Back":
				onNavigate(NavigateAction.Back);
				break;
			default:
				break;
		}
	}, [columns, data_length, onNavigate]);
	const menu_submit = useCallback((action: string, id: Id) => {
		console.log("action:", action, "id", id);
		switch (action) {
			case "mark_watched":
				jellyfin.getPlaystateApi(api).markPlayedItem({
					userId: auth.current.User!.Id!,
					itemId: id,
				}).then(() => {
					console.log("Hopefully marked as watched?");
				});
				break;
			case "mark_unwatched":
				jellyfin.getPlaystateApi(api).markUnplayedItem({
					userId: auth.current.User!.Id!,
					itemId: id,
				}).then(() => {
					console.log("Hopefully marked as unwatched?");
				});
				break;
		}
		setMenuOpen(false);
	}, []);
	const menu_cancel = useCallback(() => setMenuOpen(false), []);
	const menu_content = useMemo(() => {
		const jellyfin_data = data[selected].jellyfin_data;
		if (jellyfin_data) {
			const item = jellyfin_data;
			const id = item.Id!;
			const isWatched = item.UserData?.Played ?? false;
			return [
				{
					label: isWatched ? "Mark as unwatched" : "Mark as watched",
					id: isWatched ? "mark_unwatched" : "mark_watched",
					value: id,
				},
			];
		} else {
			return [];
		}
	}, []);
	const startIndex = Math.max((selected - (columns * 3)) - (selected % columns), 0);
	const endIndex = Math.min(selected + (columns * 3) + (columns - (selected % columns)), data.length);
	const selected_row = Math.floor(selected / columns);
	const last_row = Math.floor((data.length - 1) / columns);
	return (
		<div className="content-grid" style={{
			opacity: nav_position == 0 ? 1 : 0,
			scale: `${1 + (Math.max(Math.min(nav_position, 1), -1) * -0.2)}`,
			transitionTimingFunction: nav_position == 0 ? "var(--timing-function-decelerate)" : "var(--timing-function-accelerate)",
			transitionDelay: nav_position == 0 ? "var(--transition-standard)" : "0ms"
		}}>
			{data.slice(startIndex, endIndex).map((item, _index) => {
				const index = startIndex + _index;
				const row = Math.floor(index / columns);
				let yPosition = ((window.innerHeight / 2) - (HEIGHT / 2)) + (((HEIGHT + GAP) * (row))) - ((HEIGHT + GAP) * selected_row);
				if (selected_row == 0) {
					yPosition -= (HEIGHT + GAP) / 2;
				}
				if (selected_row == last_row) {
					yPosition += (HEIGHT + GAP) / 2;
				}
				return (
					<div key={item.id} class="grid-item" style={{
						translate: `${MARGIN + ((index % columns) * (WIDTH + GAP))}px ${yPosition}px`,
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
			<Menu active={menuOpen} items={menu_content} onSubmit={menu_submit} onCancel={menu_cancel} />
		</div>
	);
}