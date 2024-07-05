import { useState, useContext, useMemo, useCallback } from "preact/hooks";
import { NavigateAction } from "./ContentList";
import { ContentItem } from "./Content/types";
import api, { auth, jellyfin } from "../context/Jellyfin";
import { AppMode } from "../context/AppState";
import { AppState } from "../AppStates";
import { useInput, useInputRelease } from "../hooks";
import { Menu, type XBMenuItem } from "./Menu";
import { FeedbackSound, playFeedback } from "../context/AudioFeedback";
import { useDidUpdate } from "../hooks/use-did-update";

export type ContentGridProps = {
	nav_position: number;
	data: Array<ContentItem>;
	onNavigate: (action: NavigateAction, index?: number) => void;
};

const COLUMNS = 5;

const ITEM_WIDTH = 280;
const ITEM_HEIGHT = 420;

const GAP = 60;

const GRID_WIDTH = ((COLUMNS - 1) * GAP + (COLUMNS * ITEM_WIDTH)); // (5 * GAP + 6 * WIDTH) // 1740

// const MARGIN_TOP = 120;
const MARGIN_TOP = 160;
// const MARGIN_TOP = 200;
const FADE = 40;

const OFFSET_Y = 80;

// const MARGIN_LEFT = ((window.innerWidth - GRID_WIDTH) / 2);
// const MARGIN_LEFT = 360;
// const MARGIN_LEFT = 200;
const MARGIN_LEFT = ((window.innerWidth - GRID_WIDTH) - 80);

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
	useDidUpdate(() => {
		playFeedback(FeedbackSound.SelectionMove);
	}, [selected]);
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
	const [canGoBackWithArrowKey, setCanGoBackWithArrowKey] = useState(true);
	useInputRelease(() => {
		setCanGoBackWithArrowKey(true);
	}, active, []);
	useInput(active, () => {
		setCanGoBackWithArrowKey(false);
	}, []);
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
				setSelected(current => {
					const last_row = Math.floor((data_length - 1) / columns);
					const selected_row = Math.floor(current / columns);
					if (selected_row != last_row) {
						return Math.min(current + columns, data_length - 1);
					}
					return current;
				});
				break;
			case "PadLeft":
			case "ArrowLeft":
				setSelected(current => {
					if (current == 0) {
						if (canGoBackWithArrowKey) {
							onNavigate(NavigateAction.Back);
						}
					}
					setCanGoBackWithArrowKey(false);
					return Math.max(current - 1, 0);
				});
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
						// if ((current + 1) % 6 == 0) {
						// 	return current;
						// } else {
						// 	return Math.min(current + 1, h_length - 1);
						// }
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
	}, [canGoBackWithArrowKey, columns, data_length, onNavigate]);
	const menu_submit = useCallback((item: XBMenuItem<string> & { value: string; }) => {
		const { id: action, value: id } = item;
		console.log("action:", action, "id", id);
		switch (action) {
			case "mark_watched":
				jellyfin.getPlaystateApi(api).markPlayedItem({
					userId: auth.User!.Id!,
					itemId: id,
				}).then(() => {
					console.log("Hopefully marked as watched?");
				});
				break;
			case "mark_unwatched":
				jellyfin.getPlaystateApi(api).markUnplayedItem({
					userId: auth.User!.Id!,
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
	}, [data, selected]);
	const startIndex = Math.max((selected - (columns * 3)) - (selected % columns), 0);
	const endIndex = Math.min(selected + (columns * 3) + (columns - (selected % columns)), data.length);
	const selected_row = Math.floor(selected / columns);
	const last_row = Math.floor((data.length - 1) / columns);
	return (
		<div style={{
			inset: 0,
			position: "fixed",
			mask: `linear-gradient(to bottom, transparent ${MARGIN_TOP}px, black ${MARGIN_TOP + FADE}px, black /* calc(100% - ${MARGIN_TOP + FADE}px), transparent */ 100%)`,
		}}>
			<div className="content-grid" style={{
				opacity: nav_position == 0 ? 1 : 0,
				// translate: `${position * 240}px`,
				scale: `${1 + (Math.max(Math.min(nav_position, 1), -1) * -0.2)}`,
				// filter: nav_position == 0 ? undefined : "blur(40px) saturate(180%)",
				transitionTimingFunction: nav_position == 0 ? "var(--timing-function-decelerate)" : "var(--timing-function-accelerate)",
				transitionDelay: nav_position == 0 ? "var(--transition-standard)" : "0ms"
			}}>
				{data.slice(startIndex, endIndex).map((item, _index) => {
					const index = startIndex + _index;
					const row = Math.floor(index / columns);
					let yPosition = ((window.innerHeight / 2) - (ITEM_HEIGHT / 2)) + (((ITEM_HEIGHT + GAP) * (row))) - ((ITEM_HEIGHT + GAP) * selected_row);
					if (selected_row == 0) {
						yPosition -= (ITEM_HEIGHT + GAP) / 2;
						yPosition += MARGIN_TOP;
					} else {
						yPosition += OFFSET_Y; // OR MARGIN_TOP
					}
					if (selected_row == last_row) {
						// yPosition += (ITEM_HEIGHT + GAP) / 2;
					}
					return (
						<div key={item.id} class="grid-item" style={{
							// opacity: selected_row > row ? 0.2 : 1,
							opacity: selected_row == row ? 1 : 0.7,
							// translate: `0px ${(window.innerHeight / 2) - (HEIGHT / 2) - ((HEIGHT + GAP) * Math.floor(selected / columns))}px`,
							translate: `${MARGIN_LEFT + ((index % columns) * (ITEM_WIDTH + GAP))}px ${yPosition}px`,
						}}>
							<div className={selected == index ? "panel active" : props.nav_position <= 0 ? "panel inactive" : "panel"} style={{
								width: ITEM_WIDTH,
								height: ITEM_HEIGHT,
								borderRadius: 16,
							}}>
								<div className={"panel-content"}>
									<div className={"shadow"} />
									<div className={"panel-image"}>
										{/* {item.jellyfin_data ? <JellyfinPosterImage data={item.jellyfin_data} /> : null} */}
										{item.jellyfin_data ? <img
											decoding="async"
											// src={`${api.basePath}/Items/${item.id}/Images/Primary?fillWidth=${WIDTH}&fillHeight=${HEIGHT}`}
											src={`${api.basePath}/Items/${item.id}/Images/Primary?width=${ITEM_WIDTH * 2}&quality=100`}
											style={{
												objectFit: "cover",
												width: "100%",
												height: "100%",
											}}
										/> : (
											<div style={{ padding: 20, display: "flex", justifyContent: "flex-start" }}>
												<span style={{
													// position: "absolute",
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
		</div>
	);
}