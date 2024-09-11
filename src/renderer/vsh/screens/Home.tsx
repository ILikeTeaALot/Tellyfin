import { useCallback, useContext, useEffect, useRef, useState } from "preact/hooks";
import { ScreenProps } from "./common";
import { type ContentItem } from "../components/Content/types";
import { XBar } from "../components/XB";
import { categories } from "../home-categories";
import { XBList } from "../components/XB/List";
import type { XBItem } from "../components/XB/content-fetcher";
import { playFile } from "../functions/play";
import { SettingsContext } from "../context/Settings";
import { HomeStyle } from "../settings/types";
import { StackRenderer } from "../context/NavigationContext";
import { useCurrent, useNavigationFunctions } from "../hooks/routing";
import { selectScreenComponent } from "./select-screen-component";
import { FeedbackSound, playFeedback } from "../context/AudioFeedback";

export function Home(props: ScreenProps) {
	const { active } = props;
	const current = useCurrent();
	const { back, forward, go, clear, pop, push } = useNavigationFunctions(); // eslint-disable-line
	const timeout = useRef<number | null>(null);
	const [selectedRootItem, setSelectedRootItem] = useState<XBItem | null>(null);
	const handleRootNavigate = useCallback((item: XBItem) => {
		if (timeout.current != null) clearTimeout(timeout.current);
		// selectScreen(updateScreens, setCurrentScreen, NavigateAction.Enter, "Home", item);
		// if (stack_len == 0) {
		// } else {
		// 	forward();
		// }
		switch (item.id) {
			case "system.dvd":
				playFile("J:\\", 0, { type: "DVD", path: "J:\\", title: 1, chapter: 1, name: "Unknown" }); // Apparently specifying just the drive letter works. At least on Windows.
				playFeedback(FeedbackSound.Enter);
				return;
			case "com.steampowered":
				playFeedback(FeedbackSound.Enter);
				window.electronAPI.closeSteamRunner();
				return;
			case "system.power.shutdown":
				playFeedback(FeedbackSound.Enter);
				window.electronAPI.exitTellyfin();
				return;
			case "system.power.restart":
				playFeedback(FeedbackSound.Enter);
				window.electronAPI.restartTellyfin();
				return;
		}
		const { Component, props } = selectScreenComponent(item);
		if (Component) go(item.id, Component, props);
	}, [go]);
	const handleRootSelectionChange = useCallback((item: XBItem) => {
		if (timeout.current != null) clearTimeout(timeout.current);
		clear();
		setSelectedRootItem(item);
	}, [clear, /* currScreen */]);
	useEffect(() => {
		if (timeout.current != null) clearTimeout(timeout.current);
		if (selectedRootItem) {
			timeout.current = window.setTimeout(() => {
				const item = selectedRootItem;
				const { Component, props } = selectScreenComponent(item);
				if (Component) push(item.id, Component, props);
			}, 2000);
		}
	}, [selectedRootItem]); // eslint-disable-line
	return (
		<div id="home-root" style={{ opacity: active ? 1 : 0 }}>
			{/* <XBar active={active} nav_position={0 - currScreen} categories={categories} first_selected={2} onNavigate={handleRootNavigate} onSelectionChange={handleRootSelectionChange} /> */}
			<HomeRoot active={active && current == -1} currScreen={current + 1} handleRootNavigate={handleRootNavigate} handleRootSelectionChange={handleRootSelectionChange} />
			<StackRenderer current_offset={0} />
		</div>
	);
}

type HomeRootProps = {
	active: boolean;
	currScreen: number;
	handleRootNavigate: (item: ContentItem) => void;
	handleRootSelectionChange: (item: XBItem) => void;
};

function HomeRoot(props: HomeRootProps) {
	const { active, currScreen, handleRootNavigate, handleRootSelectionChange } = props;
	const { settings } = useContext(SettingsContext);
	switch (settings.home.style) {
		case HomeStyle.XMB:
			return <XBar active={active} nav_position={0 - currScreen} categories={categories} first_selected={2} onNavigate={handleRootNavigate} onSelectionChange={handleRootSelectionChange} />;
		case HomeStyle.List:
		case HomeStyle.Simple:
			return (
				<XBList nav_position={active ? 0 : -5} data={categories.map(cat => ({
					name: cat.name,
					Icon: `icon:root.${cat.key}`,
					id: cat.key,
				}))} onNavigate={handleRootNavigate} />
			);
	}
}