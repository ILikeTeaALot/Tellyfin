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
import { useInput } from "../../../hooks";

const WIDTH = 400;
// const HEIGHT = 225;

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
	const { data: info } = useSWR(`detail-${props.data.Id}`, () => getFilmInfo(props.data.Id!));
	const [row, setRow] = useState(Row.Episodes);
	const episode_overview = useRef<HTMLDivElement>(null);
	// Cheeky useRefs to avoid re-creating the callback several times.
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
					if (info.Path) {
						invoke("play_file", { file: info.Path, jellyfinId: info.Id }).then(() => {
							invoke("transport_command", { function: "Play" });
							mutate<VideoContextType>("mpv_state", (current) => {
								if (current) {
									return { ...current, jellyfin_data: info ?? null };
								}
							});
						});
					}
				}
				break;
			case "Backspace":
			case "Back":
				onNavigate(NavigateAction.Back);
				break;
			default:
				break;
		}
	}, [mutate, info, row]);
	if (!info) return null; // TODO: Loader?
	const runTimeTicks = info.RunTimeTicks;
	const duration = runTimeTicks ? displayRunningTime(runTimeTicks) : null;
	return (
		<div className="fullscreen-mask bottom">
			<div class="film-info" style={{
				// filter: nav_position == 0 ? undefined : "blur(60px) saturate(180%)",
				opacity: nav_position == 0 ? 1 : 0,
				scale: `${1 + (Math.max(Math.min(nav_position, 1), -1) * -0.2)}`,
				transitionTimingFunction: nav_position == 0 ? "var(--timing-function-decelerate)" : "var(--timing-function-accelerate)",
				transitionDelay: nav_position == 0 ? "var(--transition-standard)" : "0ms",
			}}>
				<h1 style={{ marginLeft: 80, marginTop: 80 }}>{info.Name ?? "Title Unknown"}</h1>
				<div className="film-h-split">
					<div className="film-cover">
						<ContentPanel state={PanelState.None} aspectRatio={info.PrimaryImageAspectRatio ?? undefined} width={WIDTH} height={WIDTH / (info.PrimaryImageAspectRatio ?? 1.5)}>
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
	);
}

async function getFilmInfo(id: Id) {
	let { data } = await jellyfin.getItemsApi(api).getItemsByUserId({
		ids: [id],
		userId: auth.User!.Id!,
		fields: ["PrimaryImageAspectRatio", "BasicSyncInfo", "MediaSourceCount", /* */ "EnableMediaSourceDisplay", "MediaStreams", "Path", "Overview", "Chapters"],
	});
	// console.log(data);
	return data.Items![0];
}