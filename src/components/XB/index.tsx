import { useCallback, useContext, useEffect, useMemo, useState } from "preact/hooks";
import useSWR from "swr";
import { getXBarContent, type XBItem } from "./content-fetcher";
import { useInput } from "../../hooks";

import "./style.css";
import { FeedbackSound, playFeedback } from "../../context/AudioFeedback";
import { useDidUpdate } from "../../hooks/use-did-update";
import { GAP, SELECTED_SCALE, UNSELECTED_SCALE, XB_CATEGORY_GAP, XB_CATEGORY_WIDTH, XB_ITEM_HEIGHT } from "./shared";
import { convertFileSrc } from "@tauri-apps/api/core";
import { SettingsContext } from "../../context/Settings";
import { OverflowTextScroll } from "../TextScroll";

const OFFSET_HAS_NAVIGATED = 480 - (XB_CATEGORY_WIDTH / 2 + XB_CATEGORY_GAP);
// const OFFSET_SELECTED_CATEGORY = (XB_CATEGORY_WIDTH + XB_CATEGORY_GAP) - OFFSET_HAS_NAVIGATED;
const OFFSET_SELECTED_CATEGORY = -(XB_CATEGORY_WIDTH / 2 + XB_CATEGORY_GAP);

export type XBCategoryData = {
	/** Unique identifer for this category (a name will suffice) */
	key: string;
	icon?: string;
	name: string;
};

export type XBProps = {
	active: boolean;
	nav_position: number;
	first_selected?: number;
	categories: Array<XBCategoryData>;
	onNavigate: (item: XBItem) => void;
	onSelectionChange: (item: XBItem) => void;
};

export function XBar(props: XBProps) {
	const { active: _active, nav_position, categories, first_selected, onNavigate, onSelectionChange } = props;
	const active = _active && nav_position == 0;
	const data_length = categories.length;
	const [selected, setSelected] = useState(first_selected ?? 0);
	useDidUpdate(() => playFeedback(FeedbackSound.SelectionMove), [selected]);
	useInput(active, (button) => {
		switch (button) {
			case "PadLeft":
			case "ArrowLeft":
				setSelected(prev => Math.max(0, prev - 1));
				break;
			case "PadRight":
			case "ArrowRight":
				setSelected(prev => Math.min(prev + 1, data_length - 1));
				break;
		}
	}, [data_length]);
	const handleNavigate = useCallback((item: XBItem) => {
		onNavigate(item);
	}, [onNavigate]);
	const handleChange = useCallback((item: XBItem) => {
		onSelectionChange(item);
	}, [onSelectionChange]);
	return (
		<div id="x-bar-root" class={active ? "active" : ""}>
			<div class="categories" style={{ /* opacity: nav_position < -1 ? 0 : 1, */ /* scale: nav_position < 0 ? "0.9" : "1", */ transformOrigin: "0% 50vh" }}>
				{categories.map((cat, index) => {
					// To keep state contained, they are rendered as their own component.
					return (
						<XBCategory {...cat}
							key={cat.key}
							first={index == 0}
							last={index == categories.length - 1}
							onChange={handleChange}
							onNavigate={handleNavigate}
							active={active && selected == index}
							selected={selected == index}
							id={cat.key}
							nav_position={nav_position}
							x={(nav_position == 0 ? 480 : selected == index ? OFFSET_HAS_NAVIGATED : OFFSET_HAS_NAVIGATED) + (index * (XB_CATEGORY_WIDTH + XB_CATEGORY_GAP)) - (selected * (XB_CATEGORY_WIDTH + XB_CATEGORY_GAP))}
						/>
					);
				})}
			</div>
		</div>
	);
}

interface XBCategoryProps extends XBCategoryData {
	active: boolean;
	selected: boolean;
	nav_position: number;
	id: string;
	x: number;
	onNavigate: (item: XBItem) => void;
	onChange: (item: XBItem) => void;
	first: boolean;
	last: boolean;
}

function XBCategory(props: XBCategoryProps) {
	const { active, first, last, selected: is_selected, icon, id, name, nav_position, x, onChange, onNavigate } = props; // We can't access `props.key` because React consumes it.
	const swr_key = useMemo(() => ["xb-category", id] as const, [id]);
	const { data } = useSWR(swr_key, getXBarContent, { keepPreviousData: true });
	const { settings } = useContext(SettingsContext);
	const default_item = data?.default_item;
	const data_length = data?.content.length ?? 0;
	const [selected, setSelected] = useState(data?.default_item ?? 0);
	const [showUnselectedTitles, setUnselectedTitlesVisible] = useState(active);
	useEffect(() => {
		if (showUnselectedTitles && is_selected) {
			const timeout = setTimeout(() => {
				setUnselectedTitlesVisible(false);
			}, 5000);
			return () => clearTimeout(timeout);
		}
	}, [active, is_selected, selected, showUnselectedTitles]);
	useEffect(() => {
		setUnselectedTitlesVisible(true);
	}, [is_selected]);
	useEffect(() => {
		if (default_item) setSelected(default_item);
	}, [default_item]);
	useInput(active, (button) => {
		switch (button) {
			case "PadDown":
			case "ArrowDown":
				setSelected(prev => Math.min(prev + 1, data_length - 1));
				setUnselectedTitlesVisible(true);
				break;
			case "PadUp":
			case "ArrowUp":
				setSelected(prev => Math.max(0, prev - 1));
				setUnselectedTitlesVisible(true);
				break;
		}
	}, [data_length]);
	useDidUpdate(() => {
		playFeedback(FeedbackSound.SelectionMove);
	}, [selected]);
	useDidUpdate(() => {
		if (data)
			if (is_selected)
				onChange(data.content[selected]);
	}, [is_selected, data, selected]);
	useInput(active, (button) => {
		if (data) {
			if (button == "Enter") onNavigate(data.content[selected]);
		}
	}, [data, selected]);
	if (!data) return null;
	const finalOffset = OFFSET_SELECTED_CATEGORY + ((nav_position + 1) * (XB_CATEGORY_WIDTH / 2 + XB_CATEGORY_GAP)) + ((nav_position) * XB_CATEGORY_GAP) + (nav_position == -1 ? XB_CATEGORY_WIDTH / 2 : 0);
	return (
		<div class={is_selected ? "xb-category selected" : "xb-category"} style={{ translate: `${x}px` }}>
			<div class={first ? "xb-category-icon first" : last ? "xb-category-icon last" : "xb-category-icon"} style={{ translate: !active && is_selected ? finalOffset : 0, opacity: nav_position >= -1 ? 1 : 0 }}>
				<img src={icon ? icon : convertFileSrc(`${settings.theme.icons}/root.${id}`, "icon")} />
				<span class="xb-category-title">{name}</span>
			</div>
			<div class={"xb-category-content"}>
				{data.content.map((item, index) => {
					const { Icon } = item;
					let y: number;
					const item_selected = selected == index;
					if (index < selected) {
						// y = (window.innerHeight / 2) - (XB_ITEM_HEIGHT / 2) + (index * (XB_ITEM_HEIGHT + GAP)) - ((XB_ITEM_HEIGHT + GAP) * selected) - 240;
						y = (window.innerHeight / 2) - (XB_ITEM_HEIGHT / 2) + (index * (XB_ITEM_HEIGHT + GAP) * UNSELECTED_SCALE) - ((XB_ITEM_HEIGHT + GAP) * selected * UNSELECTED_SCALE) - 270;
					} else if (item_selected) {
						y = (window.innerHeight / 2) - (XB_ITEM_HEIGHT / 2) + (index * (XB_ITEM_HEIGHT + GAP)) - ((XB_ITEM_HEIGHT + GAP) * selected);
					} else /* if (index > selected) */ {
						// y = (window.innerHeight / 2) - (XB_ITEM_HEIGHT / 2) + (index * (XB_ITEM_HEIGHT + GAP)) - ((XB_ITEM_HEIGHT + GAP) * selected) + 80;
						y = (window.innerHeight / 2) - (XB_ITEM_HEIGHT / 2) + (index * (XB_ITEM_HEIGHT + GAP) * UNSELECTED_SCALE) - ((XB_ITEM_HEIGHT + GAP) * selected * UNSELECTED_SCALE) + 120;
					}
					return (
						<div class={item_selected ? "xb-item selected" : "xb-item"} style={{ translate: `${!active && is_selected && item_selected ? finalOffset : 0}px ${y}px` }} key={item.id || index}>
							<div class="xb-item-icon" style={{ scale: item_selected ? SELECTED_SCALE.toString() : UNSELECTED_SCALE.toString() }}>
								{Icon ? typeof Icon == "string" ? <img
									src={Icon.startsWith("icon:") ? convertFileSrc(`${settings.theme.icons}/${Icon.substring(5)}`, "icon") : Icon}
								/> : typeof Icon == "function" ? <Icon /> : <img src={Icon.src.startsWith("icon:") ? convertFileSrc(`${settings.theme.icons}/${Icon.src.substring(5)}`, "icon") : Icon.src} style={{ ...Icon }} /> : <img
									src={convertFileSrc(`${settings.theme.icons}/general.folder`, "icon")}
								/>}
							</div>
							<div class="xb-item-info" style={{
								// transitionDuration: showUnselectedTitles ? "0ms" : "var(--transition-long)",
								transitionDuration: showUnselectedTitles ? "75ms" : "300ms",
								transitionTimingFunction: "var(--timing-function-accelerate)",
								opacity: showUnselectedTitles || selected == index ? 1 : 0,
							}}>
								<OverflowTextScroll active={active && item_selected} className="xb-item-name" speed={5000} delay={1500}>
									{item.name}
								</OverflowTextScroll>
								{item.desc ? <span class="xb-item-desc">{item.desc}</span> : null}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}