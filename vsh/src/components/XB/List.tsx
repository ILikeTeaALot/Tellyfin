import { useMemo, useState, useEffect } from "preact/hooks";
import useSWR from "swr";
import { useInput } from "../../hooks";
import { type CategoryContent, type XBItem } from "./content-fetcher";
import { getXBListContent } from "./list-content-fetcher";
import type { ContentItem } from "../Content/types";

import back from "../../assets/arrow_l.svg";

const XB_ITEM_HEIGHT = 120;
const GAP = 0;

/**
 * Either `data` OR `data_key` must be specified. If not you will just get an empty list
 */
export type XBListProps = {
	data?: Array<ContentItem>;
	data_key?: string;
	nav_position: number;
	onGoBack: () => void;
	onNavigate: (item: XBItem) => void;
};

export function XBList(props: XBListProps) {
	const { data_key, nav_position, onGoBack, onNavigate } = props; // We can't access `props.key` because React consumes it.
	const active = nav_position == 0;
	const swr_key = useMemo(() => ["xb-list", data_key] as const, [data_key]);
	// Oh the joys of javascript... (I wish I had Rust's enums here...)
	const { data } = useSWR(
		swr_key,
		async ([list, key]): Promise<CategoryContent> => key ? getXBListContent([list, key]) : {
			content: props.data ?? [],
			error: props.data ? undefined : "Error: No data_key, No data",
		},
		{
			keepPreviousData: true,
			fallbackData: props.data ? { content: props.data ?? [] } : { content: [], error: "Error: No data" }
		});
	console.log(data);
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
	}, [data, selected, onNavigate]);
	useInput(active, (button) => {
		switch (button) {
			case "PadLeft":
			case "ArrowLeft":
			case "Back":
			case "Backspace":
				onGoBack();
				break;
		}
	}, [onGoBack]);
	if (!data) return null;
	return (
		<div class={active ? "xb-category selected" : "xb-category"} style={{ translate: `${Math.min(nav_position + 1, 1) * 360}px` }}>
			<img class="xb-list-back-arrow" src={back} />
			<div class={"xb-category-content"}>
				{data.content.map((item, index) => {
					const { Icon } = item;
					let y: number;
					if (index < selected) {
						y = (window.innerHeight / 2) - (XB_ITEM_HEIGHT / 2) + (index * (XB_ITEM_HEIGHT + GAP)) - ((XB_ITEM_HEIGHT + GAP) * selected) - 80;
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
									src="/xb-icons/icon_gamedata.png"
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