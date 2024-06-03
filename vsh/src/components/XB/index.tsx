import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import useSWR from "swr";
import { getXBarContent, type XBItem } from "./content-fetcher";
import { useInput } from "../../hooks";

import "./style.css";

const XB_CATEGORY_WIDTH = 128;
const XB_CATEGORY_GAP = 64;

export type XBCategoryData = {
	/** Unique identifer for this category (a name will suffice) */
	key: string;
	icon: string;
	name: string;
};

export type XBProps = {
	nav_position: number;
	first_selected?: number;
	categories: Array<XBCategoryData>;
	onNavigate: (item: XBItem) => void;
};

export function XBar(props: XBProps) {
	const { nav_position, categories, first_selected, onNavigate } = props;
	const active = nav_position == 0;
	const [selected, setSelected] = useState(first_selected ?? 0);
	const data_length = categories.length;
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
						<XBCategory {...cat} onNavigate={handleNavigate} active={active && selected == index} selected={selected == index} id={cat.key} x={480 + (index * (XB_CATEGORY_WIDTH + XB_CATEGORY_GAP)) - (selected * (XB_CATEGORY_WIDTH + XB_CATEGORY_GAP))} />
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
}

function XBCategory(props: XBCategoryProps) {
	const { active, selected: is_selected, icon, id, name, x, onNavigate } = props; // We can't access `props.key` because React consumes it.
	const swr_key = useMemo(() => ["xb-category", id] as const, [id]);
	const { data } = useSWR(swr_key, getXBarContent, { keepPreviousData: true });
	const default_item = data?.default_item;
	const data_length = data?.content.length ?? 0;
	const [selected, setSelected] = useState(data?.default_item ?? 0);
	useEffect(() => {
		if (default_item) setSelected(default_item);
	}, [default_item]);
	useInput(active, (button) => {
		switch (button) {
			case "PadDown":
			case "ArrowDown":
				setSelected(prev => Math.min(prev + 1, data_length - 1));
				break;
			case "PadUp":
			case "ArrowUp":
				setSelected(prev => Math.max(0, prev - 1));
				break;
		}
	}, [data_length]);
	useInput(active, (button) => {
		if (data) {
			if (button == "Enter") onNavigate(data.content[selected]);
		}
	}, [data, selected]);
	if (!data) return null;
	return (
		<div class={is_selected ? "xb-category selected" : "xb-category"} style={{ translate: `${x}px` }}>
			<div class="xb-category-icon">
				<img src={icon} />
				<span class="xb-category-title">{name}</span>
			</div>
			<div class={"xb-category-content"}>
				{data.content.map((item, index) => {
					const { Icon } = item;
					let y: number;
					if (index < selected) {
						y = (window.innerHeight / 2) - (XB_ITEM_HEIGHT / 2) + (index * (XB_ITEM_HEIGHT + GAP)) - ((XB_ITEM_HEIGHT + GAP) * selected) - 240;
					} else if (index == selected) {
						y = (window.innerHeight / 2) - (XB_ITEM_HEIGHT / 2) + (index * (XB_ITEM_HEIGHT + GAP)) - ((XB_ITEM_HEIGHT + GAP) * selected);
					} else /* if (index > selected) */ {
						y = (window.innerHeight / 2) - (XB_ITEM_HEIGHT / 2) + (index * (XB_ITEM_HEIGHT + GAP)) - ((XB_ITEM_HEIGHT + GAP) * selected) + 80;
					}
					return (
						<div class={selected == index ? "xb-item selected" : "xb-item"} style={{ translate: `0px ${y}px` }}>
							<div class="xb-item-icon">
								{Icon ? typeof Icon == "string" ? <img
									src={Icon}
								/> : <Icon /> : <img
									src="/xb-icons/tex/item_tex_plain_folder.png"
								/>}
							</div>
							<div class="xb-item-info">
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