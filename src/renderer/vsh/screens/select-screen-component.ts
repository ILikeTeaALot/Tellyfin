import { type ComponentProps, type ComponentType, type FunctionComponent } from "preact";
import type { XBItem } from "../components/XB/content-fetcher";
import { JellyfinContent } from "./Home/Jellyfin";
import { SettingList } from "../components/XB/SettingList";

type NavigationComponentInfo<C extends ComponentType<any> = FunctionComponent> = {
	Component: C | null;
	props: ComponentProps<C>;
};

/**
 * This exists because Typescript is dumb...
 * @param Component Component
 * @param props props for Component
 * @returns basically what you put in as a NavigationComponentInfo.
 */
function makeInfo<C extends ComponentType<any> = FunctionComponent>(Component: C, props: ComponentProps<C>) {
	return {
		Component,
		props,
	} as NavigationComponentInfo;
}

export function selectScreenComponent(current_item: XBItem): NavigationComponentInfo {
	if (current_item.jellyfin_data) {
		return makeInfo(JellyfinContent, { data: current_item });
	}
	if (current_item.id.startsWith("system.settings.")) {
		return makeInfo(SettingList, { data_key: current_item.id });
	}
	return { Component: null, props: {} };
}

// function NoComponent() {
// 	const { back } = useNavigationFunctions();
// 	const position = useNavPosition();
// 	useInput(position == 0, (button) => {
// 		switch (button) {
// 			case "Back":
// 			case "Backspace":
// 				back();
// 		}
// 	}, [back]);
// 	return null;
// }