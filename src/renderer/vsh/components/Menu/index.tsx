import "./menu.css";

import { useCallback, useEffect, useLayoutEffect, useState } from "preact/hooks";
import type { Id } from "../Content/types";
import { useInput } from "../../hooks";
import { FeedbackSound, playFeedback } from "../../context/AudioFeedback";
import { useDidUpdate } from "../../hooks/use-did-update";

export type XBMenuItem<T> = {
	label: string;
	id: Id;
	value?: T;
	submenu?: {
		/** Defaults to 0 */
		default_item?: number;
		items: Array<XBMenuItem<T>>;
	};
};

export type MenuProps<T> = {
	active: boolean;
	/** Defaults to 0 */
	default_item?: number;
	items: Array<XBMenuItem<T>>;
	rootMinWidth?: number;
	onSubmit: (item: { label: string; id: Id; value: T; }) => void;
	onCancel: () => void;
};

/**
 * In order for an `onSubmit` callback to be fired, an item must have an asociated value. However, this behaviour is liable to change.
 * 
 * @param props 
 * @returns Menu Component
 */
export function Menu<T>(props: MenuProps<T>) {
	const { active, default_item, items, rootMinWidth, onSubmit, onCancel } = props;

	// const [selected, setSelected] = useState([default_item ?? 0]);
	// const [selected, setSelected] = useState(default_item ?? 0);
	// const [selectedId, setSelectedId] = useState<string>(items[selected].id);

	// useInput(active, (button) => {
	// 	switch (button) {
	// 		case "Back":
	// 		case "Backspace":
	// 			onCancel();
	// 			break;
	// 		case "Enter":
	// 			// onSubmit(findSelectedMenuItem(items, selected));
	// 			onSubmit(selectedId);
	// 			break;
	// 	}
	// }, [selectedId, onSubmit, onCancel]);

	// const updateSelected = useCallback((id: Id) => {
	// 	setSelectedId(id);
	// }, []);

	const submit = useCallback((item: XBMenuItem<T>) => {
		if (item.value != undefined || item.value != null) {
			// onSubmit(action, value);
			playFeedback(FeedbackSound.Enter);
			onSubmit(item as any);
		}
	}, [onSubmit]);

	const cancel = useCallback(() => {
		onCancel();
		playFeedback(FeedbackSound.MenuClose);
	}, [onCancel]);

	useInput(active, (button) => {
		switch (button) {
			case "t":
			case "Y":
				cancel();
		}
	}, [cancel]);

	useEffect(() => {
		if (active) playFeedback(FeedbackSound.MenuOpen);
	}, [active]);

	if (items.length == 0) {
		onCancel();
		return null;
	}

	return (
		<div class="menu-container">
			<InnerMenu active={active} default_item={default_item} first items={items} minWidth={rootMinWidth} onCancel={cancel} onSubmit={submit} />
			{/* {selected.map((selected, depth) => {
					return (
						<div class="menu">
							{items.map(item => {
								return (
									<div key={item.id}>
										<span>{item.label}</span>
									</div>
								);
							})}
						</div>
					);
				})} */}
			{/* <span style={{ zIndex: 1000000, position: "fixed" }}>{selectedId}</span> */}
		</div>
	);
}

type InnerMenuProps<T> = {
	active: boolean;
	first?: boolean;
	default_item?: number;
	items: Array<XBMenuItem<T>>;
	minWidth?: number;
	onCancel: () => void;
	onSubmit: (item: XBMenuItem<T>) => void;
};

const MENU_ITEM_HEIGHT = 28;
const GAP = 5;

function InnerMenu<T>(props: InnerMenuProps<T>) {
	const { active, first, items, minWidth, onCancel, onSubmit } = props;
	const default_item = props.default_item ?? 0;

	const item_count = items.length;

	const [selected, setSelected] = useState(default_item);
	const [submenuActive, setSubmenuActive] = useState(false);
	// Don't play move sound if `selected` was changed by props
	const [playMoveSound, setPlayMoveSound] = useState(false);
	// // Lock movement once a submenu is selected.
	// const [locked, setLockState] = useState(false);

	const submenu = items[selected]?.submenu;

	useLayoutEffect(() => {
		if (!active) {
			setSelected(selected => {
				// Don't play move sound if `selected` was changed by props
				if (selected != default_item) setPlayMoveSound(false);
				return Math.min(default_item, item_count - 1);
			});
		}
	}, [active, default_item, item_count]);

	useEffect(() => {
		if (!active) setSubmenuActive(false);
	}, [active]);

	useInput(active && !submenuActive, (button) => {
		switch (button) {
			case "PadUp":
			case "ArrowUp":
				setSelected(current => Math.max(current - 1, 0));
				break;
			case "PadDown":
			case "ArrowDown":
				setSelected(current => Math.min(current + 1, item_count - 1));
				break;
		}
	}, [item_count, selected]);

	useInput(active && !submenuActive, (button) => {
		switch (button) {
			case "Back":
			case "Backspace":
				onCancel();
				break;
		}
	}, [onCancel]);

	useInput(active && !submenu && !first, (button) => {
		switch (button) {
			case "PadLeft":
			case "ArrowLeft":
				onCancel();
				break;
		}
	}, [onCancel]);

	const hasSubmenu = !!items[selected]?.submenu;

	useInput(active && hasSubmenu && !submenuActive, (button) => {
		switch (button) {
			case "Enter":
			case "PadRight":
			case "ArrowRight":
				setSubmenuActive(true);
				playFeedback(FeedbackSound.Enter);
		}
	}, []);

	useInput(active && !hasSubmenu, (button) => {
		if (button == "Enter") onSubmit(items[selected]);
	}, [items, selected]);

	useEffect(() => {
		// Don't play move sound if `selected` was changed by props
		if (playMoveSound) {
			playFeedback(FeedbackSound.MenuMove);
		} else {
			setPlayMoveSound(true);
		}
	}, [selected]); // eslint-disable-line

	const onSubmenuClose = useCallback(() => {
		setSubmenuActive(false);
		playFeedback(FeedbackSound.MenuClose);
	}, []);

	if (items.length == 0) {
		onCancel();
		return null;
	}

	return (
		<>
			<div class={active ? "menu open" : "menu"} /* style={submenuActive ? { translate: "-250px" } : {}} */ style={{
				minWidth
			}}>
				<div class="menu-item-container" style={{
					transition: !active ? "0ms" : undefined,
					// transitionDelay: !active ? "var(--transition-standard)" : undefined,
					opacity: submenuActive ? 0.4 : 1,
					filter: submenuActive ? "blur(5px)" : undefined,
					translate: `0px -${/* selected */ default_item * ((MENU_ITEM_HEIGHT * 1.2) + GAP)}px`,
				}}>
					{items.map((item, index) => {
						const is_selected = index == selected;
						return (
							// <div style={{ display: "flex" }}>
							<div
								key={item.id}
								class={is_selected ? item.submenu ? "menu-item submenu selected" : "menu-item selected" : item.submenu ? "menu-item submenu" : "menu-item"}
								data-text={item.label}
							>
								{/* <span>{item.label} {item.submenu ? "›" : null}</span> */}
								<span>{item.label}</span>
							</div>
							// 	{item.submenu ? <img key={`${item.id}-0`} src={back} style={{
							// 		rotate: "-180deg", height: "0.875em",
							// 		/* verticalAlign: "middle", */ /* position: "absolute", */
							// 		marginLeft: "0.5ch", marginTop: "0.125em"
							// 	}} /> : null}
							// </div>
						);
					})}
				</div>
			</div>
			{submenu ? <InnerMenu active={submenuActive} onCancel={onSubmenuClose} onSubmit={onSubmit} {...submenu} /> : null}
		</>
	);
}

// function findSelectedMenuItem(items: XBMenuItem[], selected: number[]) {
// 	let currentItem: XBMenuItem = items[selected[0]];
// 	for (const selected_index of selected.slice(1)) {
// 		if (currentItem.submenu) {
// 			currentItem = currentItem.submenu[selected_index];
// 		} else {
// 			currentItem = currentItem;
// 		}
// 	}
// 	return currentItem.id;
// }