import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import useSWR from "swr";
import { getXBarContent, type XBItem } from "./content-fetcher";
import { useInput } from "../../hooks";

import "./style.css";
import { FeedbackSound, playFeedback } from "../../context/AudioFeedback";
import { useDidUpdate } from "../../hooks/use-did-update";
import { SELECTED_SCALE, UNSELECTED_SCALE } from "./shared";

const XB_CATEGORY_WIDTH = 128;
const XB_CATEGORY_GAP = 80;

export type XBCategoryData = {
	/** Unique identifer for this category (a name will suffice) */
	key: string;
	icon: string;
	name: string;
};

export type XBProps = {
	active: boolean;
	nav_position: number;
	first_selected?: number;
	categories: Array<XBCategoryData>;
	onNavigate: (item: XBItem) => void;
};

export function XBar(props: XBProps) {
	const { active: _active, nav_position, categories, first_selected, onNavigate } = props;
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
	return (
		<div id="x-bar-root" class={active ? "active" : ""} style={{ opacity: nav_position < -1 ? 0 : 1 }}>
			<div class="categories">
				{categories.map((cat, index) => {
					// To keep state contained, they are rendered as their own component.
					return (
						<XBCategory {...cat} first={index == 0} last={index == categories.length - 1} onNavigate={handleNavigate} active={active && selected == index} selected={selected == index} id={cat.key} x={(nav_position == 0 ? 480 : selected == index ? 220 : 220) + (index * (XB_CATEGORY_WIDTH + XB_CATEGORY_GAP)) - (selected * (XB_CATEGORY_WIDTH + XB_CATEGORY_GAP))} />
					);
				})}
			</div>
		</div>
	);
}

const XB_ITEM_HEIGHT = 120;
const GAP = 0;

interface XBCategoryProps extends XBCategoryData {
	active: boolean;
	selected: boolean;
	id: string;
	x: number;
	onNavigate: (item: XBItem) => void;
	first: boolean;
	last: boolean;
}

function XBCategory(props: XBCategoryProps) {
	const { active, first, last, selected: is_selected, icon, id, name, x, onNavigate } = props; // We can't access `props.key` because React consumes it.
	const swr_key = useMemo(() => ["xb-category", id] as const, [id]);
	const { data } = useSWR(swr_key, getXBarContent, { keepPreviousData: true });
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
	useInput(active, (button) => {
		if (data) {
			if (button == "Enter") onNavigate(data.content[selected]);
		}
	}, [data, selected]);
	if (!data) return null;
	return (
		<div class={is_selected ? "xb-category selected" : "xb-category"} style={{ translate: `${x}px` }}>
			<div class={first ? "xb-category-icon first" : last ? "xb-category-icon last" : "xb-category-icon"} style={{ translate: !active && is_selected ? -140 : 0 }}>
				<img src={icon} />
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
						<div class={item_selected ? "xb-item selected" : "xb-item"} style={{ translate: `${!active && is_selected && item_selected ? -140 : 0}px ${y}px` }} key={item.id || index}>
							<div class="xb-item-icon" style={{ scale: item_selected ? SELECTED_SCALE.toString() : UNSELECTED_SCALE.toString() }}>
								{Icon ? typeof Icon == "string" ? <img
									src={Icon}
								/> : <Icon /> : <img
									src="/xb-icons/tex/item_tex_plain_folder.png"
								/>}
							</div>
							<div class="xb-item-info" style={{
								// transitionDuration: showUnselectedTitles ? "0ms" : "var(--transition-long)",
								transitionDuration: showUnselectedTitles ? "75ms" : "300ms",
								transitionTimingFunction: "var(--timing-function-accelerate)",
								opacity: showUnselectedTitles || selected == index ? 1 : 0,
							}}>
								<span class="xb-item-name">
									{item.name}
								</span>
								{item.desc ? <span class="xb-item-desc">{item.desc}</span> : null}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}