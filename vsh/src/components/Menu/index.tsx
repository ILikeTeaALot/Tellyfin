import "./menu.css";
import { useCallback, useContext, useEffect, useState } from "preact/hooks";
import type { Id } from "../Content/types";
import { useInput } from "../../hooks";
import { createContext } from "preact";

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

const SelectionContext = createContext<(id: Id) => void>(() => { });

export function Menu<T>(props: MenuProps<T>) {
	const { active, default_item, items, onSubmit, onCancel } = props;

	const [selected, setSelected] = useState(default_item ?? 0);
	const [selectedId, setSelectedId] = useState<string>(items[selected].id);

	const updateSelected = useCallback((id: Id) => {
		setSelectedId(id);
	}, []);

	const submit = useCallback((value?: T) => {
		if (value) onSubmit(selectedId, value);
	}, [selectedId]);

	return (
		<div class="menu-container">
			<SelectionContext.Provider value={updateSelected}>
				<InnerMenu active={active} first items={items} onCancel={onCancel} onSubmit={submit} />
			</SelectionContext.Provider>
		</div>
	);
}

type InnerMenuProps<T> = {
	active: boolean;
	first?: boolean;
	default_item?: number;
	items: Array<XBMenuItem<T>>;
	onCancel: () => void;
	onSubmit: (value?: T) => void;
};

const MENU_ITEM_HEIGHT = 28;
const GAP = 5;

function InnerMenu<T>(props: InnerMenuProps<T>) {
	const { active, first, items, onCancel, onSubmit } = props;
	const default_item = props.default_item ?? 0;

	const item_count = items.length;

	const setSelectedId = useContext(SelectionContext);

	const [selected, setSelected] = useState(default_item);
	const [submenuActive, setSubmenuActive] = useState(false);

	const submenu = items[selected].submenu;

	useEffect(() => {
		if (!active) setSubmenuActive(false);
	}, [active])

	useEffect(() => {
		if (!submenuActive) {
			setSelectedId(items[selected].id);
		}
	}, [active, submenuActive, items, selected]);

	useEffect(() => {
		setSelectedId(items[selected].id);
	}, [items, selected]);

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
	}, [onCancel])

	const hasSubmenu = "submenu" in items[selected];

	useInput(active && hasSubmenu, (button) => {
		switch (button) {
			case "Enter":
			case "PadRight":
			case "ArrowRight":
				setSubmenuActive(true);
		}
	}, []);

	useInput(active && !hasSubmenu, (button) => {
		if (button == "Enter") onSubmit(items[selected].value);
	}, [items, selected]);

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

	const onSubmenuClose = useCallback(() => {
		setSubmenuActive(false);
	}, []);

	return (
		<>
			<div class={active ? "menu open" : "menu"} /* style={submenuActive ? { translate: "-250px" } : {}} */>
				<div class="menu-item-container" style={{ opacity: submenuActive ? 0.4 : 1, filter: submenuActive ? "blur(5px)" : undefined, translate: `0px -${selected * ((MENU_ITEM_HEIGHT * 1.2) + GAP)}px` }}>
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
