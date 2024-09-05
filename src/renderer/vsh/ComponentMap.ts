import type { ComponentType } from "preact";
import { AboutTellyfin } from "./components/AboutTellyfin";
import { ContentPanel } from "./components/Panel";
import { Dialog } from "./components/Dialog";
import { XBList } from "./components/XB/List";
import { Menu } from "./components/Menu";
import { JellyfinContent } from "./screens/Home/Jellyfin";
import { ContentGrid } from "./components/ContentGrid";
import { OverflowTextScroll } from "./components/TextScroll";
import { Wizard } from "./components/Wizard";

const ComponentMap = new Map<string, ComponentType<any>>([
	["AboutTellyfin", AboutTellyfin],
	["ContentGrid", ContentGrid],
	["ContentList", XBList],
	["ContentPanel", ContentPanel],
	["Dialog", Dialog],
	["Jellyfin", JellyfinContent],
	["Menu", Menu],
	["Text", OverflowTextScroll],
	["TextInput", () => null],
	["Wizard", Wizard],
]);

export function getComponent(name?: string | null) {
	if (name) {
		return ComponentMap.get(name)
	} else {
		return null;
	}
}

export function registerComponent(name: string, component: ComponentType<any>) {
	ComponentMap.set(name, component);
}