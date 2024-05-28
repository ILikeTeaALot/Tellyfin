import { useCallback, useContext, useEffect, useState } from "preact/hooks";
import * as jf from "@jellyfin/sdk/lib/utils/api";
import { ScreenContent, ScreenProps } from "./common";
import { ContentList, NavigateAction } from "../components/ContentList";
import { ContentGrid } from "../components/ContentGrid";
import api from "../context/Jellyfin";
import { ContentType, type ContentItem } from "../components/Content/types";
import { selectScreen } from "./Home/screen-loader";
import { JellyfinContent } from "./Home/Jellyfin";
import { AppMode } from "../context/AppState";
import { AppState } from "../AppStates";
import { XBar } from "../components/XB";
import { categories } from "../home-categories";

const content: ScreenContent = {
	id: "Home",
	type: ContentType.Ignore,
	content: [
		// { id: "music.alto", name: "Alto" },
		{ id: "system.settings", name: "Settings" },
		{ id: "system.power", name: "Power (Exit)" },
	]
};

export function Home(props: ScreenProps) {
	const { active, change_state } = props;
	const state = useContext(AppMode);
	const [screens, updateScreens] = useState<Array<ScreenContent>>([content]);
	const [currScreen, setCurrentScreen] = useState(0);
	useEffect(() => {
		return;
		(async () => {
			const libraries = await jf.getLibraryApi(api).getMediaFolders();
			if (libraries.data.Items) {
				updateScreens([
					{
						id: "Home",
						type: ContentType.List,
						content: [
							// { id: "music.alto", name: "Alto" },
							...libraries.data.Items.map(item => ({
								id: item.Id ?? Math.round(Math.random() * 5000).toFixed(0),
								name: item.Name ?? "Unknown",
								jellyfin: true,
								jellyfin_data: item,
							})),
							{ id: "system.settings", name: "Settings" },
							{ id: "system.power", name: "Power (Exit)" },
						]
					}
				]);
			}
		})();
	}, []);
	const handleNavigate = useCallback(async (action: NavigateAction, index?: number) => {
		if (!active || state != AppState.Home) return;
		console.log("action:", action, "id:", index);
		if (action == NavigateAction.Back) {
			setCurrentScreen(current => Math.max(current - 1, 0));
			return;
		}
		if (typeof index == "number") {
			await selectScreen(updateScreens, setCurrentScreen, action, currScreen, screens[currScreen].id, screens[currScreen].content[index]);
			return;
		}
	}, [currScreen, screens, active, state]);
	const handleRootNavigate = useCallback(async (item: ContentItem) => selectScreen(updateScreens, setCurrentScreen, NavigateAction.Enter, currScreen, "Home", item), [currScreen]);
	return (
		<div id="home-root" style={{ opacity: active ? 1 : 0 }}>
			{screens.map((screen, index) => {
				let nav_position = index - currScreen;
				if (!active && nav_position == 0) {
					nav_position = -1;
				}
				const zIndex = currScreen - index;
				switch (screen.type) {
					case ContentType.Ignore:
						return null;
					case ContentType.Jellyfin:
						return (
							<div key={screen.id} style={{ zIndex }}>
								<JellyfinContent nav_position={nav_position} data={screen} onNavigate={handleNavigate} />
							</div>
						);
					case ContentType.List:
					case ContentType.SettingsList:
						return (
							<div key={screen.id} style={{ zIndex }}>
								<ContentList nav_position={nav_position} data={screen.content} onNavigate={handleNavigate} />
							</div>
						);
					case ContentType.Grid:
						return (
							<div key={screen.id} style={{ zIndex }}>
								<ContentGrid nav_position={nav_position} data={screen.content} onNavigate={handleNavigate} />
							</div>
						);
				}
			})}
			<XBar nav_position={0 - currScreen} categories={categories} first_selected={2} onNavigate={handleRootNavigate} />
		</div>
	);
}