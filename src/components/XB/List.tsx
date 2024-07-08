import { useMemo, useState, useEffect } from "preact/hooks";
import useSWR from "swr";
import { useInput } from "../../hooks";
import { type CategoryContent, type XBItem } from "./content-fetcher";
import { getXBListContent } from "./list-content-fetcher";
import type { ContentItem } from "../Content/types";

import back from "../../assets/arrow_l.svg";
import { FeedbackSound, playFeedback } from "../../context/AudioFeedback";
import { useDidUpdate } from "../../hooks/use-did-update";
import { SELECTED_SCALE, UNSELECTED_SCALE } from "./shared";

const XB_ITEM_HEIGHT = 120;
const GAP = 0;

/**
 * Either `data` OR `data_key` must be specified. If not you will just get an empty list
 */
export type XBListProps = {
	data?: Array<ContentItem>;
	data_key?: string;
	default_item?: number;
	nav_position: number;
	onGoBack: () => void;
	onNavigate: (item: XBItem, index: number) => void;
};

export function XBList(props: XBListProps) {
	const { data_key, nav_position, onGoBack, onNavigate } = props; // We can't access `props.key` because React consumes it.
	const active = nav_position == 0;
	/// @ts-expect-error Don't publicly expose props.override_active
	const input_active = active && !props.override_active;
	const swr_key = useMemo(() => ["xb-list", data_key, props.data] as const, [data_key, props.data]);
	// Oh the joys of javascript... (I wish I had Rust's enums here...)
	const { data } = useSWR(
		swr_key,
		async ([list, key]): Promise<CategoryContent> => key ? getXBListContent([list, key]) : {
			content: props.data ?? [],
			error: props.data ? undefined : "Error: No data_key, No data",
		},
		{
			dedupingInterval: 0,
			keepPreviousData: true,
			revalidateOnMount: true,
			fallbackData: props.data ? { content: props.data ?? [] } : { content: [], error: "Error: No data" }
		});
	console.log(data);
	const default_item = data?.default_item;
	const data_length = data?.content.length ?? 0;
	const [selected, setSelected] = useState(data?.default_item ?? 0);
	useDidUpdate(() => {
		playFeedback(FeedbackSound.SelectionMove);
	}, [selected]);
	useEffect(() => {
		if (default_item) setSelected(default_item);
	}, [default_item]);
	useInput(input_active, (button) => {
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
	useInput(input_active, (button) => {
		if (data) {
			if (button == "Enter") onNavigate(data.content[selected], selected);
		}
	}, [data, selected, onNavigate]);
	useInput(input_active, (button) => {
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
					const item_selected = selected == index;
					let y: number;
					if (index < selected) {
						// y = (window.innerHeight / 2) - (XB_ITEM_HEIGHT / 2) + (index * (XB_ITEM_HEIGHT + GAP)) - ((XB_ITEM_HEIGHT + GAP) * selected) - 80;
						y = (window.innerHeight / 2) - (XB_ITEM_HEIGHT / 2) + (index * (XB_ITEM_HEIGHT + GAP) * UNSELECTED_SCALE) - ((XB_ITEM_HEIGHT + GAP) * selected * UNSELECTED_SCALE) - 80;
					} else if (item_selected) {
						y = (window.innerHeight / 2) - (XB_ITEM_HEIGHT / 2) + (index * (XB_ITEM_HEIGHT + GAP)) - ((XB_ITEM_HEIGHT + GAP) * selected);
					} else /* if (index > selected) */ {
						// y = (window.innerHeight / 2) - (XB_ITEM_HEIGHT / 2) + (index * (XB_ITEM_HEIGHT + GAP)) - ((XB_ITEM_HEIGHT + GAP) * selected) + 80;
						y = (window.innerHeight / 2) - (XB_ITEM_HEIGHT / 2) + (index * (XB_ITEM_HEIGHT + GAP) * UNSELECTED_SCALE) - ((XB_ITEM_HEIGHT + GAP) * selected * UNSELECTED_SCALE) + 80;
					}
					return (
						<div class={item_selected ? "xb-item selected" : "xb-item"} style={{ translate: `0px ${y}px` }} key={item.id}>
							<div class="xb-item-icon" style={{ scale: item_selected ? SELECTED_SCALE.toString() : UNSELECTED_SCALE.toString() }}>
								{Icon ? typeof Icon == "string" ? <img
									src={Icon}
								/> : typeof Icon == "function" ? <Icon /> : <img src={Icon.src} style={{ ...Icon }} /> : <img
									src="/xb-icons/icon_gamedata.png"
								/>}
							</div>
							<div class="xb-item-info">
								<span class="xb-item-name">
									{item.name}
								</span>
								{item.desc ? <span class="xb-item-desc">{item.desc}</span> : null}
								{item.value ? <span class="xb-item-value">{item.value}</span> : null}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}