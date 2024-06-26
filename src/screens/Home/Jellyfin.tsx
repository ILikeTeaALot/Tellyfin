import { useContext } from "preact/hooks";
import { NavigateAction } from "../../components/ContentList";
import { ScreenContent } from "../common";
import { TvSeries } from "./TV/Series";
import { AppMode } from "../../context/AppState";
import { AppState } from "../../AppStates";
import { FilmDetail } from "./Films/FilmDetail";

export const TEXT_ITEM_HEIGHT = 56;

export type JellyfinContentProps = {
	nav_position: number;
	data: ScreenContent;
	onNavigate: (action: NavigateAction, index?: number) => void;
};

export function JellyfinContent(props: JellyfinContentProps) {
	const { nav_position } = props;
	const state = useContext(AppMode);
	// Handle keeping onNavigate callback... correct.
	// const onNavigate = useRef(props.onNavigate);
	// onNavigate.current = props.onNavigate;
	// Normal stuff
	// const [selected, setSelected] = useState(0);
	// useEffect(() => {
	// 	if (position == 0) {
	// 		function handler(e: KeyboardEvent) {
	// 			console.log(e.key);
	// 			switch (e.key) {
	// 				case "Backspace":
	// 				case "Back":
	// 					onNavigate.current(NavigateAction.Back);
	// 					break;
	// 				default:
	// 					break;
	// 			}
	// 		}
	// 		window.addEventListener("keydown", handler);
	// 		return () => { window.removeEventListener("keydown", handler); };
	// 	}
	// }, [onNavigate]);
	if (typeof props.data.jellyfin_data == "undefined") {
		return (
			<div>No content</div>
		);
	}
	switch (props.data.jellyfin_data.Type) {
		case "Series": return (
			<TvSeries active={state == AppState.Home && nav_position == 0} nav_position={nav_position} data={props.data.jellyfin_data} onNavigate={props.onNavigate} />
		);
		case "Movie": return (
			<FilmDetail active={state == AppState.Home && nav_position == 0} nav_position={nav_position} data={props.data.jellyfin_data} onNavigate={props.onNavigate} />
		);
		default: return (
			<div>Unrecognised content type</div>
		);
	}
}