import { useCallback, useContext, useEffect, useRef, useState } from "preact/hooks";
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
import { FeedbackSound, playFeedback } from "../context/AudioFeedback";
import { SettingList } from "../components/XB/SettingList";
import { playFile } from "../functions/play";
import { ViewScreen } from "./Screen";
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
	const state = useContext(AppMode);
	const timeout = useRef<number | null>(null);
	const [selectedRootItem, setSelectedRootItem] = useState<XBItem | null>(null);
	const [screens, updateScreens] = useState<Array<ScreenContent>>([content]);
	// const { data, trigger } = useSWRMutation<[screen: number, screens: ScreenContent[]], never, "navigation-stack", SelectScreenParams>("navigation-stack", (_, {arg: options}) => newSelectScreen(options));
	const [currScreen, setCurrentScreen] = useState(0);
	// TODO: Convert to SWR
	const handleNavigate = useCallback((action: NavigateAction, item?: ContentItem) => {
		if (!active || state != AppState.Home) return;
		console.log("action:", action, "id:", item);
		if (action == NavigateAction.Back) {
			setCurrentScreen(current => Math.max(current - 1, 0));
			playFeedback(FeedbackSound.Back);
			return;
		} else if (item) {
			selectScreen(updateScreens, setCurrentScreen, action, screens[currScreen].id, item);
			playFeedback(FeedbackSound.Enter);
			return;
		}
	}, [currScreen, screens, active, state]);
	const handleListNavigate = useCallback((item: XBItem) => {
		if (!active || state != AppState.Home) return;
		selectScreen(updateScreens, setCurrentScreen, NavigateAction.Enter, screens[currScreen].id, item);
		playFeedback(FeedbackSound.Enter);
		return;
	}, [currScreen, screens, active, state]);
	const handleListGoBack = useCallback(() => {
		setCurrentScreen(current => {
			if (current > 1) updateScreens((screens) => [...screens.slice(0, screens.length - 2)]);
			return Math.max(0, current - 1);
		});
		playFeedback(FeedbackSound.Back);
	}, []);
	const handleRootNavigate = useCallback((item: ContentItem) => {
		selectScreen(updateScreens, setCurrentScreen, NavigateAction.Enter, "Home", item);
		if (item.id == "system.dvd") {
			// invoke("play_file", { file: "dvd://1/J:\\" });
			// invoke("play_file", { file: "dvd:\\\\" });
			// invoke("play_file", { file: "dvd://" });
			// invoke("play_file", { file: "J:\\", jellyfinId: { type: "DVD" } }); // Apparently specifying just the drive letter works. At least on Windows.
			playFile("J:\\", { type: "DVD", path: "J:\\", title: 1, chapter: 1, name: "Unknown" });
		}
		playFeedback(FeedbackSound.Enter);
	}, []);
	const handleRootSelectionChange = useCallback((item: XBItem) => {
		// if (!didChangeScreen.current) {
		// 	if (timeout.current != null) clearTimeout(timeout.current);
		// 	updateScreens((screens) => [...screens.slice(0, currScreen + 1)]);
		// 	timeout.current = setTimeout(() => selectScreen(updateScreens, (_) => {}, NavigateAction.Enter, "Home", item), 2000);
		// } else {
		// 	didChangeScreen.current = false;
		// }
		if (timeout.current != null) clearTimeout(timeout.current);
		setSelectedRootItem(item);
		updateScreens((screens) => [...screens.slice(0, 1)]);
	}, [/* currScreen */]);
	useEffect(() => {
		if (timeout.current != null) clearTimeout(timeout.current);
		if (selectedRootItem) {
			timeout.current = setTimeout(() => selectScreen(updateScreens, (f) => {if (typeof f == "function") f(currScreen)}, NavigateAction.Enter, "Home", selectedRootItem), 2000);
		}
	}, [selectedRootItem]);
	return (
		<div id="home-root" style={{ opacity: active ? 1 : 0 }}>
			<XBar active={active} nav_position={0 - currScreen} categories={categories} first_selected={2} onNavigate={handleRootNavigate} onSelectionChange={handleRootSelectionChange} />
			{screens.map((screen, index) => {
				// const position = active ? _index - currScreen : -1;
				let nav_position = index - currScreen;
				if (!active && nav_position == 0) {
					nav_position = -1;
				}
				const zIndex = currScreen - index;
				// Why doesn't this work?
				// return (
				// 	<ViewScreen
				// 		key={screen.id}
				// 		jellyfin_data={screen.jellyfin_data}
				// 		nav_position={nav_position}
				// 		zIndex={zIndex}
				// 		handleNavigate={handleNavigate}
				// 		handleListNavigate={handleListNavigate}
				// 		handleListGoBack={handleListGoBack}
				// 	/>
				// );
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
						return (
							<div key={screen.id} style={{ zIndex }}>
								<XBList nav_position={nav_position} data_key={screen.id.startsWith("system") ? screen.id : undefined} data={screen.content} onGoBack={handleListGoBack} onNavigate={handleListNavigate} />
							</div>
						);
					case ContentType.SettingsList:
						return (
							<div key={screen.id} style={{ zIndex }}>
								{/* <ContentList nav_position={nav_position} data={screen.content} onNavigate={handleNavigate} /> */}
								<SettingList nav_position={nav_position} data_key={screen.id} onGoBack={handleListGoBack} onNavigate={handleListNavigate} />
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
			{/* <button onClick={() => change_state(AppState.VideoPlaying)}>Go To Video Player</button> */}
		</div>
	);
}