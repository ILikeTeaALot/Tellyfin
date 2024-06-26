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
import { XBList } from "../components/XB/List";
import type { XBItem } from "../components/XB/content-fetcher";
import { AudioFeedback, FeedbackSound } from "../context/AudioFeedback";
// import useSWR from "swr";
// import { newSelectScreen, type SelectScreenParams } from "./Home/new-select-screen";
// import useSWRMutation from "swr/mutation";

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
	const { play: playFeedback } = useContext(AudioFeedback);
	const state = useContext(AppMode);
	const [screens, updateScreens] = useState<Array<ScreenContent>>([content]);
	// const { data, trigger } = useSWRMutation<[screen: number, screens: ScreenContent[]], never, "navigation-stack", SelectScreenParams>("navigation-stack", (_, {arg: options}) => newSelectScreen(options));
	const [currScreen, setCurrentScreen] = useState(0);
	// TODO: Convert to SWR
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
			playFeedback(FeedbackSound.Back);
			return;
		}
		if (typeof index == "number") {
			await selectScreen(updateScreens, setCurrentScreen, action, currScreen, screens[currScreen].id, screens[currScreen].content[index]);
			playFeedback(FeedbackSound.Enter);
			return;
		}
		// if (typeof index == "number") {
		// 	if (action == NavigateAction.Enter) {
		// 		const item = screens[currScreen].content[index];
		// 		if (item.jellyfin && item.jellyfin_data) {
		// 			switch (item.jellyfin_data.Type) {
		// 				case "CollectionFolder": {
		// 					switch (item.jellyfin_data.CollectionType) {
		// 						case "unknown":
		// 							break;
		// 						case "movies":
		// 						case "tvshows":
		// 						case "music":
		// 						case "musicvideos":
		// 						case "trailers":
		// 						case "playlists":
		// 							const items = await jf.getItemsApi(api).getItems({
		// 								parentId: item.jellyfin_data.Id,
		// 								sortBy: ["SortName", "Year"],
		// 								userId: auth.data.User!.Id!,
		// 							});
		// 							const { Items } = items.data;
		// 							if (Items) {
		// 								updateScreens(screens => [
		// 									...screens.slice(0, currScreen + 1),
		// 									{
		// 										id: item.jellyfin_data!.Id!,
		// 										type: ContentType.Grid,
		// 										content: Items.map(item => ({
		// 											id: item.Id!,
		// 											name: item.Name ?? "Unknown",
		// 											jellyfin: true,
		// 											jellyfin_data: item,
		// 										})) ?? [],
		// 									}
		// 								]);
		// 								setCurrentScreen(curr => curr + 1);
		// 							}
		// 							break;
		// 					}
		// 					break;
		// 				};
		// 			}
		// 		}
		// 	}
		// }
		// switch (screens[currScreen].id) {
		// 	case "Home": {
		// 		switch (action) {
		// 			case NavigateAction.Enter:
		// 				if (typeof index == "number") {
		// 					if (screens[currScreen].content[index].jellyfin) {

		// 					} else {
		// 						switch (index) {
		// 							case 1: {
		// 								updateScreens(screens => [
		// 									...screens.slice(0, currScreen + 1),
		// 									{
		// 										id: "1",
		// 										type: ContentType.Grid,
		// 										content: [
		// 											{ id: "4", name: "The Addams Family" },
		// 											{ id: "65", name: "Addams Family Values" },
		// 											{ id: "69", name: "Bottoms" },
		// 											{ id: "77", name: "Star Trek The Motion Picture" },
		// 											{ id: "53", name: "Star Trek II: The Wrath of Khan" },
		// 											{ id: "23", name: "Star Trek III: The Search for Spock" },
		// 											{ id: "52", name: "Star Trek IV: The Voyage Home" },
		// 											{ id: "12", name: "Star Trek V: The Final Frontier" },
		// 											{ id: "91", name: "Star Trek VI: The Undiscovered Country" },
		// 											{ id: "94", name: "Star Trek: Generations" },
		// 											{ id: "96", name: "Star Trek: First Contact" },
		// 											{ id: "89", name: "Star Trek: Insurrection" },
		// 											{ id: "54", name: "Star Wars Episode IV: A New Franchise" },
		// 											{ id: "62", name: "Star Wars Episode V: The Really Good One" },
		// 											{ id: "93", name: "Star Wars Episode VI: The Good But Not Quite as Good One" },
		// 										]
		// 									}
		// 								]);
		// 								setCurrentScreen(1);
		// 								break;
		// 							}
		// 							default:
		// 								return;
		// 						}
		// 					}
		// 				}
		// 				break;
		// 			case NavigateAction.Play:
		// 				break;
		// 		}
		// 		break;
		// 	}
		// 	case "1": {
		// 		switch (action) {
		// 			case NavigateAction.Enter:
		// 				break;
		// 			case NavigateAction.Play:
		// 				break;
		// 		}
		// 		break;
		// 	}
		// }
	}, [currScreen, screens, active, state, playFeedback]);
	const handleListNavigate = useCallback((item: XBItem) => {

	}, []);
	const handleListGoBack = useCallback(() => {
		setCurrentScreen(current => Math.max(0, current - 1));
		playFeedback(FeedbackSound.Back);
	}, [playFeedback]);
	const handleRootNavigate = useCallback(async (item: ContentItem) => {
		selectScreen(updateScreens, setCurrentScreen, NavigateAction.Enter, currScreen, "Home", item);
		playFeedback(FeedbackSound.Enter);
	}, [currScreen, playFeedback]);
	return (
		<div id="home-root" style={{ opacity: active ? 1 : 0 }}>
			{screens.map((screen, index) => {
				// const position = active ? _index - currScreen : -1;
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
								{/* <ContentList nav_position={nav_position} data={screen.content} onNavigate={handleNavigate} /> */}
								<XBList nav_position={nav_position} data_key={screen.id.startsWith("system") ? screen.id : undefined} data={screen.content} onGoBack={handleListGoBack} onNavigate={handleListNavigate} />
							</div>
						);
					case ContentType.Grid:
						return (
							// <div key={screen.id} class={nav_position == 0 ? "background-blur active" : "background-blur"}>
							<div key={screen.id} style={{ zIndex }}>
								<ContentGrid nav_position={nav_position} data={screen.content} onNavigate={handleNavigate} />
							</div>
							// </div>
						);
					default:
						return null;
				}
			})}
			<XBar nav_position={0 - currScreen} categories={categories} first_selected={2} onNavigate={handleRootNavigate} />
			{/* <button onClick={() => change_state(AppState.VideoPlaying)}>Go To Video Player</button> */}
		</div>
	);
}