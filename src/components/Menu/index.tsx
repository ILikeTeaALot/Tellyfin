import "./menu.css";
import { useCallback, useContext, useEffect, useState } from "preact/hooks";
import type { Id } from "../Content/types";
import { useInput } from "../../hooks";
import { AudioFeedback, FeedbackSound } from "../../context/AudioFeedback";
import { useDidMount, useDidUpdate } from "../../hooks/use-did-update";

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
	onSubmit: (action: Id, value: T) => void;
	onCancel: () => void;
};

/**
 * In order for an `onSubmit` callback to be fired, an item must have an asociated value. However, this behaviour is liable to change.
 * 
 * @param props 
 * @returns Menu Component
 */
export function Menu<T>(props: MenuProps<T>) {
	const { active, default_item, items, onSubmit, onCancel } = props;

	const { play: playFeedback } = useContext(AudioFeedback);

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

	const submit = useCallback((action: Id, value?: T) => {
		if (value) {
			onSubmit(action, value);
			playFeedback(FeedbackSound.Enter);
		}
	}, [onSubmit, playFeedback]);

	const cancel = useCallback(() => {
		onCancel();
		playFeedback(FeedbackSound.MenuClose);
	}, [onCancel, playFeedback]);

	useInput(active, (button) => {
		switch (button) {
			case "t":
			case "Y":
				cancel();
		}
	}, [cancel]);

	useEffect(() => {
		if (active) playFeedback(FeedbackSound.MenuOpen);
	}, [active]); // eslint-disable-line

	return (
		<div class="menu-container">
			<InnerMenu active={active} default_item={default_item} first items={items} onCancel={cancel} onSubmit={submit} />
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
	onCancel: () => void;
	onSubmit: (action: Id, value?: T) => void;
};

const MENU_ITEM_HEIGHT = 28;
const GAP = 5;

function InnerMenu<T>(props: InnerMenuProps<T>) {
	const { active, first, items, onCancel, onSubmit } = props;
	const default_item = props.default_item ?? 0;

	const item_count = items.length;

	const [selected, setSelected] = useState(default_item);
	const [submenuActive, setSubmenuActive] = useState(false);

	const submenu = items[selected].submenu;
	
	const { play: playFeedback } = useContext(AudioFeedback);

	useEffect(() => {
		if (!active) setSubmenuActive(false);
	}, [active]);

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

	const hasSubmenu = "submenu" in items[selected];

	useInput(active && hasSubmenu, (button) => {
		switch (button) {
			case "Enter":
			case "PadRight":
			case "ArrowRight":
				setSubmenuActive(true);
				playFeedback(FeedbackSound.Enter);
		}
	}, []);

	useInput(active && !hasSubmenu, (button) => {
		if (button == "Enter") onSubmit(items[selected].id, items[selected].value);
	}, [items, selected]);

	useInput(active && !submenuActive, (button) => {
		switch (button) {
			case "PadUp":
			case "ArrowUp":
				// setSelected(value => [...value.slice(0, -1), value.slice(-1)[0] + 1]);
				setSelected(current => Math.max(current - 1, 0));
				break;
			case "PadDown":
			case "ArrowDown":
				// setSelected(value => [...value.slice(0, -1), value.slice(-1)[0] + 1]);
				setSelected(current => Math.min(current + 1, item_count - 1));
				break;
		}
	}, [item_count, selected]);

	useDidUpdate(() => {
		playFeedback(FeedbackSound.MenuMove);
	}, [selected]);

	const onSubmenuClose = useCallback(() => {
		setSubmenuActive(false);
		playFeedback(FeedbackSound.MenuClose);
	}, [playFeedback]);

	return (
		<>
			<div class={active ? "menu open" : "menu"} /* style={submenuActive ? { translate: "-250px" } : {}} */>
				<div class="menu-item-container" style={{ opacity: submenuActive ? 0.4 : 1, filter: submenuActive ? "blur(5px)" : undefined, translate: `0px -${/* selected */ default_item * ((MENU_ITEM_HEIGHT * 1.2) + GAP)}px` }}>
					{items.map((item, index) => {
						return (
							<div key={item.id} class={index == selected ? "menu-item selected" : "menu-item"}>
								<span>{item.label} {item.submenu ? "›" : null}</span>
							</div>
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