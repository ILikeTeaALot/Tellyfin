import { useState, useContext, useMemo, useCallback, useRef, useLayoutEffect } from "preact/hooks";
import { NavigateAction } from "./ContentList";
import { ContentItem } from "./Content/types";
import { AppMode } from "../context/AppState";
import { AppState } from "../AppStates";
import { useInput, useInputRelease } from "../hooks";
import { Menu, type XBMenuItem } from "./Menu";
import { FeedbackSound, playFeedback } from "../context/AudioFeedback";
import { useDidUpdate } from "../hooks/use-did-update";
// import { useAnimationFrame } from "../hooks/use-animation-frame";

export type ContentGridProps = {
	nav_position: number;
	data: Array<ContentItem>;
	onNavigate: (action: NavigateAction, item?: ContentItem) => void;
};

const COLUMNS = 4;

// const ITEM_WIDTH = 280;
// const ITEM_HEIGHT = 420;

const ITEM_WIDTH = 300;
const ITEM_HEIGHT = 450;

const V_GAP = 60;
const H_GAP = 40;

const GRID_WIDTH = ((COLUMNS - 1) * H_GAP + (COLUMNS * ITEM_WIDTH)); // (5 * GAP + 6 * WIDTH) // 1740

// const MARGIN_TOP = 120;
const MARGIN_TOP = 128;
// const MARGIN_TOP = 160;
// const MARGIN_TOP = 200;
const FADE = 40;

const OFFSET_Y = 64;

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
	useLayoutEffect(() => {
		setSelected(0);
	}, [data]);
	useDidUpdate(() => {
		playFeedback(FeedbackSound.SelectionMove);
	}, [selected]);
	// useInput(active, (button) => {
	// 	switch (button) {
	// 		case "Y":
	// 		case "t":
	// 			setMenuOpen(v => !v);
	// 			break;
	// 	}
	// }, []);
	useInput(active && !menuOpen, (button) => {
		switch (button) {
			case "Enter":
				onNavigate(NavigateAction.Enter, data[selected]);
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
							return current - (columns - 1);
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
		// const { id: action, value: id } = item;
		// console.log("action:", action, "id", id);
		// switch (action) {
		// 	case "mark_watched":
		// 		jellyfin.getPlaystateApi(api).markPlayedItem({
		// 			userId: auth.User!.Id!,
		// 			itemId: id,
		// 		}).then(() => {
		// 			console.log("Hopefully marked as watched?");
		// 		});
		// 		break;
		// 	case "mark_unwatched":
		// 		jellyfin.getPlaystateApi(api).markUnplayedItem({
		// 			userId: auth.User!.Id!,
		// 			itemId: id,
		// 		}).then(() => {
		// 			console.log("Hopefully marked as unwatched?");
		// 		});
		// 		break;
		// }
		// setMenuOpen(false);
	}, []);
	const menu_cancel = useCallback(() => setMenuOpen(false), []);
	const menu_content = useMemo(() => {
		const jellyfin_data = data[selected]?.jellyfin_data;
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
	const [overrideOpacity, /* setOpacityOverride */] = useState(false);
	const content = useRef<HTMLDivElement>(null);
	/* const waitTime = useRef(0);
	const prevTranslate = useRef(0);
	useAnimationFrame((last, now) => {
		const delta = now - last;
		if (content.current) {
			if (waitTime.current < 2000) {
				if (waitTime.current == 0) {
					content.current.style.translate = "0px 0px";
				} else {
					setOpacityOverride(false);
					content.current.style.transitionDuration = "";
				}
				waitTime.current += delta;
				return;
			} else {
				// content.current.style.opacity = "";
			}
			const newTranslate = prevTranslate.current + ((delta / 1000) * 80);
			if (newTranslate >= (ITEM_HEIGHT + GAP) * 4) {
				prevTranslate.current = 0;
				waitTime.current = 0;
				content.current.style.transitionDuration = "0ms";
				setOpacityOverride(true);
			} else {
				content.current.style.translate = `0px ${0 - newTranslate}px`;
				prevTranslate.current = newTranslate;
			}
		}
	}, !active, []);
	useEffect(() => {
		if (active && content.current) content.current.style.translate = "0px";
		if (active) {
			prevTranslate.current = 0;
			setOpacityOverride(false);
		}
	}, [active]); */
	const startIndex = Math.max((selected - (columns * 3)) - (selected % columns), 0);
	const endIndex = Math.min(selected + (columns * 3) + (columns - (selected % columns)), data.length);
	const selected_row = Math.floor(selected / columns);
	const last_row = Math.floor((data.length - 1) / columns);
	const mask_top_adjust = nav_position > 0 ? 0 : 0;
	return (
		<div style={{
			inset: 0,
			position: "fixed",
			mask: `linear-gradient(to bottom, transparent ${MARGIN_TOP + mask_top_adjust}px, black ${MARGIN_TOP + FADE + mask_top_adjust}px, black calc(100% - ${FADE * 3}px), transparent 100%)`,
		}}>
			<div className="content-grid" ref={content} style={{
				opacity: overrideOpacity ? 0 : nav_position >= 0 && nav_position < 2 ? nav_position == 0 ? 1 : 0.7 : 0,
				// translate: `${position * 240}px`,
				scale: `${1 + (Math.max(Math.min(nav_position, 1), 0) * -0.2)}`,
				// translate: nav_position > 0 ? "0px 120px" : "0px 0px",
				// transformOrigin: "right bottom",
				transformOrigin: "right center",
				// filter: nav_position == 0 ? undefined : "blur(40px) saturate(180%)",
				// transitionTimingFunction: nav_position == 0 ? "var(--timing-function-decelerate)" : "var(--timing-function-accelerate)",
				// transitionDelay: nav_position < 0 ? "var(--transition-standard)" : "0ms",
				transitionTimingFunction: "var(--timing-function-ease)",
			}}>
				{data.slice(startIndex, endIndex).map((item, _index) => {
					const index = startIndex + _index;
					const row = Math.floor(index / columns);
					let yPosition = ((window.innerHeight / 2) - (ITEM_HEIGHT / 2)) + (((ITEM_HEIGHT + V_GAP) * (row))) - ((ITEM_HEIGHT + V_GAP) * selected_row);
					if (selected_row == 0) {
						yPosition -= (ITEM_HEIGHT + V_GAP) / 4;
						yPosition += MARGIN_TOP;
					} else {
						yPosition += OFFSET_Y; // OR MARGIN_TOP
					}
					if (selected_row == last_row) {
						// yPosition += (ITEM_HEIGHT + GAP) / 2;
					}
					const xPosition = MARGIN_LEFT + ((index % columns) * (ITEM_WIDTH + H_GAP));
					// if (nav_position > 0) yPosition += 120;
					return (
						<div key={item.id} class="grid-item" style={{
							// opacity: selected_row > row ? 0.2 : 1,
							opacity: selected_row == row ? 1 : 0.7,
							// translate: `0px ${(window.innerHeight / 2) - (HEIGHT / 2) - ((HEIGHT + GAP) * Math.floor(selected / columns))}px`,
							translate: `${xPosition}px ${yPosition}px`,
							zIndex: index == selected ? 100000 : undefined,
						}}>
							<div className={selected == index && nav_position <= 0 ? "panel active" : props.nav_position <= 0 ? "panel inactive" : "panel"} style={{
								width: ITEM_WIDTH,
								height: ITEM_HEIGHT,
								borderRadius: 20,
							}}>
								<div className={"panel-content"}>
									<div className={"shadow"} />
									<div className={"panel-image"}>
										{/* {item.jellyfin_data ? <JellyfinPosterImage data={item.jellyfin_data} /> : null} */}
										{item.jellyfin_data ? <img
											decoding="async"
											// src={`${api.basePath}/Items/${item.id}/Images/Primary?fillWidth=${WIDTH}&fillHeight=${HEIGHT}`}
											src={`xb-image://media-server_${item.jellyfin_data.ServerId}/Items/${item.id}/Images/Primary?width=${ITEM_WIDTH * 2}&quality=100`}
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