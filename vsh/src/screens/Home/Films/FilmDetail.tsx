import { useEffect, useRef, useState } from "preact/hooks";
import * as jellyfin from "@jellyfin/sdk/lib/utils/api";
import useSWR, { useSWRConfig } from "swr";

import { JellyfinScreenProps } from "../../jellyfin";
import { Id } from "../../../components/Content/types";
import api, { auth } from "../../../context/Jellyfin";
import { ContentPanel, PanelState } from "../../../components/Panel";
import { NavigateAction } from "../../../components/ContentList";
import { invoke } from "@tauri-apps/api/core";
import { displayRunningTime } from "../../../util/functions";
import { MediaStreamInfo } from "../../../components/Jellyfin/MediaStreamInfo";
import { VideoContextType } from "../../../context/VideoContext";

const WIDTH = 400;
// const HEIGHT = 225;

enum Row {
	Seasons,
	Episodes,
	Overview,
}

export function FilmDetail(props: JellyfinScreenProps) {
	console.log(props.data);
	// Mutator
	const { mutate: _mutate } = useSWRConfig();
	const mutate = useRef(_mutate);
	mutate.current = _mutate;
	// Props
	const { active, nav_position } = props;
	const onNavigate = useRef(props.onNavigate);
	onNavigate.current = props.onNavigate;
	const info = useSWR(`detail-${props.data.Id}`, () => getFilmInfo(props.data.Id!));
	const [row, setRow] = useState(Row.Episodes);
	const episode_overview = useRef<HTMLDivElement>(null);
	// Cheeky useRefs to avoid re-creating the callback several times.
	// Tab/Content row
	const selectedRow = useRef(row);
	selectedRow.current = row;
	// Data - Seasons
	const filmData = useRef(info.data);
	filmData.current = info.data;
	useEffect(() => {
		if (active) {
			function handler(e: KeyboardEvent) {
				console.log(e.key);
				switch (e.key) {
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
						if (filmData.current && selectedRow.current == Row.Episodes) {
							if (filmData.current.Path) {
								invoke("play_file", { file: filmData.current.Path, jellyfinId: filmData.current.Id }).then(() => {
									invoke("transport_command", { function: "Play" });
									mutate.current<VideoContextType>("mpv_state", (current) => {
										if (current) {
											return { ...current, jellyfin_data: filmData.current ?? null };
										}
									});
								});
							}
						}
						break;
					case "Backspace":
					case "Back":
						onNavigate.current(NavigateAction.Back);
						break;
					default:
						break;
				}
			}
			window.addEventListener("keydown", handler);
			return () => { window.removeEventListener("keydown", handler); };
		}
	}, [active, mutate, info.data]);
	if (!info.data) return null; // TODO: Loader?
	const runTimeTicks = info.data.RunTimeTicks;
	const duration = runTimeTicks ? displayRunningTime(runTimeTicks) : null;
	return (
		<div className="fullscreen-mask bottom">
			<div class="film-info" style={{
				filter: nav_position == 0 ? undefined : "blur(60px) saturate(180%)",
				opacity: nav_position == 0 ? 1 : 0,
				scale: `${1 + (Math.max(Math.min(nav_position, 1), -1) * -0.2)}`,
				transitionTimingFunction: nav_position == 0 ? "var(--timing-function-decelerate)" : "var(--timing-function-accelerate)",
				transitionDelay: nav_position == 0 ? "var(--transition-standard)" : "0ms",
			}}>
				<h1 style={{ marginLeft: 80, marginTop: 80 }}>{info.data.Name ?? "Title Unknown"}</h1>
				<div className="film-h-split">
					<div className="film-cover">
						<ContentPanel state={PanelState.None} aspectRatio={info.data.PrimaryImageAspectRatio ?? undefined} width={WIDTH} height={WIDTH / (info.data.PrimaryImageAspectRatio ?? 1.5)}>
							<img
								decoding="async"
								src={`${api.basePath}/Items/${props.data.Id}/Images/Primary`}
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
						<p style={{ maxWidth: 1200 }}>{info.data.Overview ?? "No overview available"}</p>
						{duration ? <span>{duration}</span> : null}
						{typeof info.data.PremiereDate == "string" ? (
							<span>
								Released {new Date(info.data.PremiereDate!)
									.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
							</span>
						) : null}
						{info.data.MediaStreams ? info.data.MediaStreams.map(info => <MediaStreamInfo info={info} />) : null}
					</div>
				</div>
			</div>
		</div>
	);
}

async function getFilmInfo(id: Id) {
	let { data } = await jellyfin.getItemsApi(api).getItemsByUserId({
		ids: [id],
		userId: auth.User!.Id!,
		fields: ["PrimaryImageAspectRatio", "BasicSyncInfo", "MediaSourceCount", /* */ "EnableMediaSourceDisplay", "MediaStreams", "Path", "Overview", "Chapters"],
	});
	console.log(data);
	return data.Items![0];
}