import { useContext, useEffect, useState } from "preact/hooks";
import * as jf from "@jellyfin/sdk/lib/utils/api";
import { ScreenContent, ScreenProps } from "./common";
import { ContentList, NavigateAction } from "../components/ContentList";
import { ContentGrid } from "../components/ContentGrid";
import api from "../context/Jellyfin";
import { ContentType } from "../components/Content/types";
import { selectScreen } from "./Home/screen-loader";
import { JellyfinContent } from "./Home/Jellyfin";
import { AppMode } from "../context/AppState";
import { AppState } from "../AppStates";

const content: ScreenContent = {
	id: "Home",
	type: ContentType.List,
	content: [
		{ id: "music.alto", name: "Alto" },
		{ id: "system.settings", name: "Settings" },
		{ id: "system.power", name: "Power (Exit)" },
	]
};

export function Home(props: ScreenProps) {
	const { active, change_state } = props;
	const state = useContext(AppMode);
	const [screens, updateScreens] = useState([content]);
	const [currScreen, setCurrentScreen] = useState(0);
	useEffect(() => {
		(async () => {
			const libraries = await jf.getLibraryApi(api).getMediaFolders();
			if (libraries.data.Items) {
				updateScreens([
					{
						id: "Home",
						type: ContentType.List,
						content: [
							{ id: "music.alto", name: "Alto" },
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
	const handleNavigate = async (action: NavigateAction, index?: number) => {
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
	};
	return (
		<div id="home-root" style={{ opacity: active ? 1 : 0 }}>
			{screens.map((screen, index) => {
				let nav_position = index - currScreen;
				if (!active && nav_position == 0) {
					nav_position = -1;
				}
				const zIndex = currScreen - index;
				switch (screen.type) {
					case ContentType.Jellyfin:
						return (
							<div style={{ zIndex }}>
								<JellyfinContent key={screen.id} nav_position={nav_position} data={screen} onNavigate={handleNavigate} />
							</div>
						);
					case ContentType.List:
					case ContentType.SettingsList:
						return (
							<div style={{ zIndex }}>
								<ContentList key={screen.id} nav_position={nav_position} data={screen.content} onNavigate={handleNavigate} />
							</div>
						);
					case ContentType.Grid:
						return (
							<div style={{ zIndex }}>
								<ContentGrid key={screen.id} nav_position={nav_position} data={screen.content} onNavigate={handleNavigate} />
							</div>
						);
				}
			})}
		</div>
	);
}