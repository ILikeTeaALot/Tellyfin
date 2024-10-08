import { useRef, useState } from "preact/hooks";
import * as jellyfin from "@jellyfin/sdk/lib/utils/api";
import useSWR, { useSWRConfig } from "swr";

import { JellyfinScreenProps } from "../../jellyfin";
import { Id } from "../../../components/Content/types";
import { ContentPanel, PanelState } from "../../../components/Panel";
import { NavigateAction } from "../../../components/ContentList";
import { displayRunningTime } from "../../../util/functions";
import { MediaStreamInfo } from "../../../components/Jellyfin/MediaStreamInfo";
import { useInput } from "../../../hooks";
import { playFile } from "../../../functions/play";
import { BackdropImage } from "../TV/Series";
import { Loading } from "~/renderer/vsh/components/Loading";

const WIDTH = 400;
// const HEIGHT = 225;

// const SCREEN_WIDTH = 1920;
// const HORIZONTAL_MARGIN = 80;

enum Row {
	Seasons,
	Episodes,
	Overview,
}

export function FilmDetail(props: JellyfinScreenProps) {
	// console.log(props.data);
	// Mutator
	const { mutate } = useSWRConfig();
	// Props
	const { active, nav_position, onNavigate } = props;
	const { data: info } = useSWR(`detail-${props.data.Id}`, () => getFilmInfo(props.data.ServerId!, props.data.Id!));
	// const [selected, setSelected] = useState(0);
	const [row, /* setRow */] = useState(Row.Episodes);
	const episode_overview = useRef<HTMLDivElement>(null);
	// Cheeky useRefs to avoid re-creating the callback several times.
	// const selectedRef = useRef(selected);
	// selectedRef.current = selected;
	useInput(active, (button) => {
		switch (button) {
			case "PadRight":
			case "ArrowRight":
				break;
			case "PadLeft":
			case "ArrowLeft":
				break;
			case "PadUp":
			case "ArrowUp":
				break;
			case "PadDown":
			case "ArrowDown":
				break;
			case "Enter":
				if (info && row == Row.Episodes) {
					// window.electronAPI.playFile(info.Path, info.Id).then(() => {
					// 	window.electronAPI.transportCommand("Play");
					// 	mutate<VideoContextType>("mpv_state", (current) => {
					// 		if (current) {
					// 			return { ...current, jellyfin_data: info ?? null };
					// 		}
					// 	});
					// });
					// playFile(info.Path, 0, info.Id ? { type: "Jellyfin", id: info.Id } : undefined);
					window.mediaServerAPI.getItemVideoStreamUrl(info.ServerId!, info.Id!).then(path => {
						playFile(info.ServerId!, path, 0, info.Id ? { type: "Jellyfin", id: info.Id, serverId: info.ServerId! } : undefined);
					});
				}
				break;
			case "Backspace":
			case "Back":
				// if (selectedRow.current == Row.Overview) {
				// 	setRow(Row.Episodes);
				// } else {
				// 	onNavigate(NavigateAction.Back);
				// }
				onNavigate(NavigateAction.Back);
				break;
			default:
				break;
		}
	}, [mutate, info, row]);
	if (!info) return (
		<Loading />
	);
	const runTimeTicks = info.RunTimeTicks;
	const duration = runTimeTicks ? displayRunningTime(runTimeTicks) : null;
	return (
		<>
			<BackdropImage index={0} selected={0} item={info} show={active} />
			<div className="fullscreen-mask bottom">
				<div class="film-info" style={{
					// filter: nav_position == 0 ? undefined : "blur(60px) saturate(180%)",
					opacity: nav_position == 0 ? 1 : 0,
					// scale: `${1 + (Math.max(Math.min(nav_position, 1), -1) * -0.2)}`,
					transitionTimingFunction: nav_position == 0 ? "var(--timing-function-decelerate)" : "var(--timing-function-accelerate)",
					transitionDelay: nav_position == 0 ? "var(--transition-standard)" : "0ms",
				}}>
					<h1 style={{ marginLeft: 80, marginTop: 80 }}>{info.Name ?? "Title Unknown"}</h1>
					<div className="film-h-split">
						<div className="film-cover">
							<ContentPanel state={PanelState.None} aspectRatio={info.PrimaryImageAspectRatio ?? undefined} width={WIDTH} height={WIDTH / (info.PrimaryImageAspectRatio ?? 1.5)}>
								<img
									decoding="async"
									src={`xb-image://media-server_${props.data.ServerId}/Items/${props.data.Id}/Images/Primary`}
									style={{
										objectFit: "cover",
										width: "100%",
										height: "100%",
									}}
								/>
							</ContentPanel>
							<h2 class="list-item selected" style={{
								fontWeight: 700,
								fontSize: 56,
								animation: "var(--text-glow)",
							}}>Play</h2>
						</div>
						<div ref={episode_overview} className={row == Row.Overview ? "film-details focused" : "film-details"}>
							<p style={{ maxWidth: 1200 }}>{info.Overview ?? "No overview available"}</p>
							{duration ? <span>{duration}</span> : null}
							{typeof info.PremiereDate == "string" ? (
								<span>
									Released {new Date(info.PremiereDate!)
										.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
								</span>
							) : null}
							{info.MediaStreams ? info.MediaStreams.map(info => <MediaStreamInfo info={info} />) : null}
						</div>
					</div>
				</div>
			</div>
		</>
		// <div class={active ? "background-blur active" : "background-blur"}>
		// </div>
	);
}

async function getFilmInfo(serverId: string | number, id: Id) {
	let { Items } = await window.mediaServerAPI.getItems(serverId, {
		ids: [id],
		fields: ["PrimaryImageAspectRatio", "MediaSourceCount", /* */ "EnableMediaSourceDisplay", "MediaStreams", "Path", "Overview", "Chapters"],
	});
	// console.log(data);
	return Items![0];
}