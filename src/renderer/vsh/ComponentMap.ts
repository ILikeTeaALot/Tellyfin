import type { ComponentType } from "preact";
import { AboutTellyfin } from "./components/AboutTellyfin";
import { ContentPanel } from "./components/Panel";
import { Dialog } from "./components/Dialog";
import { XBList } from "./components/XB/List";
import { Menu } from "./components/Menu";
import { JellyfinContent } from "./screens/Home/Jellyfin";
import { ContentGrid } from "./components/ContentGrid";
import { OverflowTextScroll } from "./components/OverflowTextScroll";
import { Wizard } from "./components/Wizard";
import { AddMediaServer } from "./components/MediaServer/AddMediaServer";
import { RemoveMediaServer } from "./components/MediaServer/RemoveMediaServer";
import { TextInput } from "./components/TextInput/TextInput";
import { Button } from "./components/Button";

const ComponentMap = new Map<string, ComponentType<any>>([
	["AboutTellyfin", AboutTellyfin],
	["Button", Button],
	["ContentGrid", ContentGrid],
	["ContentList", XBList],
	["ContentPanel", ContentPanel],
	["Dialog", Dialog],
	["Jellyfin", JellyfinContent],
	["Menu", Menu],
	["Text", OverflowTextScroll],
	["TextInput", TextInput],
	["Wizard", Wizard],
	["AddMediaServer", AddMediaServer],
	["RemoveMediaServer", RemoveMediaServer],
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