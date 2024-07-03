import { useCallback, useContext, useEffect, useState } from "preact/hooks";
import { XBList } from "./List";
import { Menu, type XBMenuItem } from "../Menu";
import type { CategoryContent, XBItem } from "./content-fetcher";
import { SettingKind } from "../../settings/get";
import useSWR from "swr";
import { getXMLListContent } from "./list-content-fetcher";
import { SettingsContext } from "../../context/Settings";
import type { UserSettings } from "../../settings/types";
import { useInput } from "../../hooks";

export type XBSettingListProps = {
	data_key: string;
	nav_position: number;
	onGoBack: () => void;
	onNavigate: (item: XBItem) => void;
};

const DEFAULT_ROOT_DATA = { content: [], root_key: "" };
// async function getSettingListContent([list, key, manager]: ["xb-list", string, SettingsManager<UserSettings>]) {
// 	const l = await getXBListContent([list, key]);
// 	return {
// 		...l,
// 		content: await Promise.all(l.content.map(item => (async () => {
// 			...item,
// 			/// @ts-ignore
// 			value: await manager.get(item.id),
// 		}()))),
// 	}
// }

export function SettingList(props: XBSettingListProps) {
	const {
		data_key,
		nav_position,
		// onNavigate,
		onGoBack,
	} = props;
	// const active = nav_position == 0;
	const { settings, update } = useContext(SettingsContext);
	// console.error(settings);
	// const swr_key = useMemo(() => [data_key, settings] as const, [data_key, settings]);
	// Oh the joys of javascript... (I wish I had Rust's enums here...)
	const { data: document, isLoading, error, mutate } = useSWR(
		data_key,
		// async (key): Promise<CategoryContent> => getSettingsContent(key.split(".")[2], settings)/* .then(async ({content}) => Promise.all(content.map(async item => ({...item, value: await manager.get(item.id)})))) */,
		async (key) => getXMLListContent(key)/* .then(async ({content}) => Promise.all(content.map(async item => ({...item, value: await manager.get(item.id)})))) */,
		// async ([list, key]): Promise<CategoryContent> => getXBListContent([list, key])/* .then(async ({content}) => Promise.all(content.map(async item => ({...item, value: await manager.get(item.id)})))) */,
		// getXBListContent,
		{
			dedupingInterval: 0,
			keepPreviousData: true,
			revalidateOnMount: true,
			// fallbackData: { content: [], error: "Error: No data" }
		});
	console.log(document);
	console.log(error);
	const { data: listData, error: listError } = useSWR([document, settings], getFinalData, {
		dedupingInterval: 0,
		keepPreviousData: true,
		revalidateOnMount: true,
		// fallbackData: { content: [], error: "Error: No data" }
	});
	console.log(listError);
	const data = listData ? listData[0] : null;
	const menus = listData ? listData[1] : null;
	const { /* content, */ root_key } = data ?? DEFAULT_ROOT_DATA;
	// const { data: finalData } = useSWR(data, (data) => Promise.all(data.content.map(value => manager.get(value.id as Path<UserSettings>))).then(list => list.filter(v => v)));
	// Options Menu
	const [menuLoaded, setMenuLoaded] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [menu, setMenu] = useState<{ default_item: number; items: Array<XBMenuItem<string | number>>; }>({
		default_item: 0,
		items: [{
			label: "On",
			id: "null"
		}],
	});
	// const menu = useMemo((): Array<XBMenuItem<SettingsKey>> => {
	// 	return [];
	// }, []);
	useEffect(() => {
		if (nav_position != 0) setMenuOpen(false);
	}, [nav_position]);
	const menu_submit = useCallback(/* <T extends keyof UserSettings> */(item: XBMenuItem<string | number>) => {
		const { id, value } = item;
		setMenuOpen(false);
		const [/* category, */ key] = id.split(".");
		// const key = id;
		console.log(root_key, key);
		// manager.set(item as Path<UserSettings>, value).then(() => mutate());
		// update(item.split(".")[0]);
		update(root_key as keyof UserSettings, { [key]: value }).then(ok => {
			// if (ok) {
			// 	mutate(current => {
			// 		if (current) return { ...current, content: [...current.content] };
			// 	})
			// }
			if (ok) {
				mutate();
			}
		});
	}, [update, mutate, root_key]);
	const menu_cancel = useCallback(() => setMenuOpen(false), []);
	const handleListNavigate = useCallback((_item: XBItem, index: number) => {
		// Set and Open Option Menu
		// getOptionsForSetting(item.id)
		// 	.then(menu => {
		// 		if (menu.kind == SettingKind.Wizard) {
		// 			//
		// 		} else {
		// 			// menu.items = menu.items.map(item => ({ ...item, value: item.id }));
		// 			// music.[key] == system.settings:music.[key].[whatever]
		// 			// menu.default_item = menu.items.findIndex(v => v.id == item.id);
		// 			setMenu(menu);
		// 			setMenuLoaded(true);
		// 		}
		// 	});
		if (!menus) return;
		const menu = menus[index];
		if (menu.kind == SettingKind.Wizard) {
			// Do something I haven't designed yet.
		} else {
			// menu.items = menu.items.map(item => ({ ...item, value: item.id }));
			// music.[key] == system.settings:music.[key].[whatever]
			// menu.default_item = menu.items.findIndex(v => v.id == item.id);
			setMenu(menu);
			setMenuLoaded(true);
		}
	}, [menus]);
	useEffect(() => {
		if (menuLoaded) {
			setMenuLoaded(false);
			setMenuOpen(true);
		}
	}, [menuLoaded]);
	const handleListGoBack = useCallback(() => {
		// Parent callback
		onGoBack();
	}, [onGoBack]);
	useInput(nav_position == 0 && !data, (button) => {
		switch (button) {
			case "Back":
			case "Backspace":
				onGoBack();
		}
	}, [onGoBack]);
	console.log(data?.content);
	console.log(listData);
	// console.error(swr_key);
	// console.error(finalData);
	// if (!finalData) return null;
	if ((!data || data.content.length == 0) && error) return <div style={{ position: "fixed", top: 0 }}>{JSON.stringify(isLoading)} {data_key} {JSON.stringify(error)} {JSON.stringify(data)}</div>;
	if (!data) return null;
	return (
		<>
			<XBList key={0}
				/// @ts-expect-error
				override_active={menuOpen}
				nav_position={nav_position} data={data.content} onGoBack={handleListGoBack} onNavigate={handleListNavigate} />
			<Menu key={1} active={menuOpen} {...menu} rootMinWidth={600} onSubmit={menu_submit} onCancel={menu_cancel} />
			{error && <span style={{ position: "fixed", top: 0, left: 0 }}>{JSON.stringify(error)}</span>}
		</>
	);
}

type RootKey = keyof UserSettings;
type Key = keyof UserSettings[RootKey];

type SettingOptionSet = {
	kind?: SettingKind.List;
	default_item: number;
	items: Array<XBMenuItem<string | number>>;
} | {
	kind: SettingKind.Wizard;
}

type NewType = [CategoryContent & { root_key: string; }, Array<SettingOptionSet>] | [null, null];

export const templateReplaceRegExp = /{([\w.]*)}+/g;

async function getFinalData([document, settings]: [XMLDocument | undefined, UserSettings]): Promise<NewType> {
	if (!document || !settings) return [null, null];
	const root = document.querySelector(`Items[class="SettingList"]`)!;
	const root_key = root.getAttribute("key")! as RootKey;
	const list = document.querySelectorAll(`Item[class="Setting"]`);
	// const list = document.evaluate("//Items/Item", document.getRootNode());
	const settingsList: XBItem[] = [];
	const menus: SettingOptionSet[] = [];
	// for (let setting = list.iterateNext(); setting != null; setting = list.iterateNext()) {
	for (const [, setting] of list.entries()) {
		const key = setting.getAttribute("key")! as Key;
		const kind = setting.getAttribute("kind")! as "Select" | "Setup";
		const title = setting.querySelector("Title")?.textContent!;
		const desc = setting.querySelector("Description")?.textContent;
		const display_format_string = setting.querySelector("DisplayFormat")?.textContent;
		const raw_value = settings[root_key]?.[key];
		let displayValue = null;
		if (kind == "Select") {
			// const optionsNode = setting.querySelector("Options")!;
			const options = setting.querySelectorAll("Option")!;
			let default_item = 0;
			let menu_items: Array<XBMenuItem<string | number>> = [];
			for (const entry of options.entries()) {
				// const option = options[index];
				const [index, option] = entry;
				// menus[index].items.push()
				menu_items.push({
					value: option.getAttribute("value")!,
					label: option.textContent!,
					id: `${key}.${option.getAttribute("value")!}`,
				});
				if (option.getAttribute("value") == raw_value) {
					default_item = index;
					if (!display_format_string) for (const node of option.childNodes) {
						if (node.nodeType == node.TEXT_NODE) {
							displayValue = node.textContent;
						}
					}
				}
			}
			if (display_format_string) {
				displayValue = display_format_string.replace(templateReplaceRegExp, (match: string, p1: string) => lookupReplacementString(raw_value, match, p1))
			}
			const forced_default = setting.getAttribute("default");
			if (forced_default) {
				default_item = parseInt(forced_default);
			}
			menus.push({
				default_item,
				items: menu_items,
				kind: SettingKind.List,
			});
			settingsList.push({ id: key, name: title.trim(), desc: desc?.trim(), Icon: "/xb-icons/setting/tex_sett.png", value: displayValue?.trim() ?? "Unknown" });
		} else {
			menus.push({
				kind: SettingKind.Wizard,
			});
			if (display_format_string) {
				displayValue = display_format_string.replace(templateReplaceRegExp, (match: string, p1: string) => lookupReplacementString(raw_value, match, p1));
			}
			settingsList.push({ id: key, name: title.trim(), desc: desc?.trim(), Icon: "/xb-icons/setting/tex_sett.png", value: displayValue?.trim() ?? "Object [TODO]" /* settings[root_key][key] */ });
		}
	}
	return [{ content: settingsList, root_key }, menus];
}

function lookupReplacementString(raw_value: any, _match: string, p1: string) {
	return raw_value[p1] ?? "";
}