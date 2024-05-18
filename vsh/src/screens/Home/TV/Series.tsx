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

// const WIDTH = 320;
const WIDTH = 400;
// const HEIGHT = 180;
const HEIGHT = 225;
// const GAP = 80;
const GAP = 50; // Inactive scale(0.9)
// const GAP = 30;

const SCREEN_WIDTH = 1920;
const HORIZONTAL_MARGIN = 80;

enum Row {
	Seasons,
	Episodes,
	Overview,
}

export function TvSeries(props: JellyfinScreenProps) {
	console.log(props.data);
	// Mutator
	const { mutate: _mutate } = useSWRConfig();
	const mutate = useRef(_mutate);
	mutate.current = _mutate;
	// Props
	const { active, nav_position } = props;
	const onNavigate = useRef(props.onNavigate);
	onNavigate.current = props.onNavigate;
	const seasons = useSWR(`seasons-${props.data.Id}`, () => getSeasons(props.data.Id!));
	const episodes = useSWR(`episodes-${props.data.Id}`, () => getEpisodes(props.data.Id!));
	const [tabRowX, setTabRowX] = useState(0);
	const [selected, setSelected] = useState({ season: 0, episode: 0 });
	const [row, setRow] = useState(Row.Episodes);
	const tab_row_content = useRef<HTMLDivElement>(null);
	const episode_overview = useRef<HTMLDivElement>(null);
	// Cheeky useRefs to avoid re-creating the callback several times.
	const selectedRef = useRef(selected);
	selectedRef.current = selected;
	// Tab/Content row
	const selectedRow = useRef(row);
	selectedRow.current = row;
	// Data - Episodes
	const episodeData = useRef(episodes.data);
	episodeData.current = episodes.data;
	// Data - Seasons
	const seasonsData = useRef(seasons.data);
	seasonsData.current = seasons.data;
	useEffect(() => {
		if (active) {
			function handler(e: KeyboardEvent) {
				console.log(e.key);
				const jumpSeasonLeft = () => {
					setSelected(({ season, episode }) => {
						if (episodeData.current && seasonsData.current) {
							const currentSeasonStartEpisodeIndex = episodeData.current.findIndex(episode => episode.SeasonId == seasonsData.current![season].Id);
							const previousSeasonIndex = Math.max(season - 1, 0);
							const previousSeasonStartEpisodeIndex = episodeData.current.findIndex(episode => episode.SeasonId == seasonsData.current![previousSeasonIndex].Id);
							if (currentSeasonStartEpisodeIndex > -1 && e.key == "L1") {
								if (episode > currentSeasonStartEpisodeIndex) {
									return { season, episode: currentSeasonStartEpisodeIndex };
								}
							}
							if (previousSeasonStartEpisodeIndex > -1) {
								return { season: previousSeasonIndex, episode: previousSeasonStartEpisodeIndex };
							} else {
								return { season: previousSeasonIndex, episode };
							}
						} else {
							return { season, episode };
						}
					});
				};
				const jumpSeasonRight = (toEnd?: boolean) => {
					setSelected(({ season, episode }) => {
						if (episodeData.current && seasonsData.current) {
							if (season == seasonsData.current.length - 1 && toEnd) {
								return { season, episode: episodeData.current.length - 1 };
							}
							const newIndex = Math.min(season + 1, (seasonsData.current.length ?? 1) - 1);
							const index = episodeData.current.findIndex(episode => episode.SeasonId == seasonsData.current![newIndex].Id);
							if (index > -1) {
								return { season: newIndex, episode: index };
							} else {
								return { season: newIndex, episode };
							}
						} else {
							return { season, episode };
						}
					});
				};
				switch (e.key) {
					case "R1":
						if (selectedRow.current == Row.Overview) break;
						setRow(Row.Episodes);
						jumpSeasonRight(true);
						break;
					case "L1":
						if (selectedRow.current == Row.Overview) break;
						setRow(Row.Episodes);
						jumpSeasonLeft();
						break;
					case "PadRight":
					case "ArrowRight":
						if (selectedRow.current == Row.Overview) break;
						if (selectedRow.current == Row.Episodes) {
							if (seasonsData.current && episodeData.current) {
								setSelected(({ episode: current }) => {
									const episode = Math.min(current + 1, (episodeData.current!.length ?? 1) - 1);
									const SeasonId = episodeData.current![episode].SeasonId;
									const index = seasonsData.current!.findIndex(season => season.Id == SeasonId);
									return { season: index, episode };
								});
							}
						} else {
							jumpSeasonRight();
						}
						break;
					case "PadLeft":
					case "ArrowLeft":
						if (selectedRow.current == Row.Overview) break;
						if (selectedRow.current == Row.Episodes) {
							if (seasonsData.current && episodeData.current) {
								setSelected(({ episode: current }) => {
									const episode = Math.max(current - 1, 0);
									const SeasonId = episodeData.current![episode].SeasonId;
									const index = seasonsData.current!.findIndex(season => season.Id == SeasonId);
									return { season: index, episode };
								});
							}
						} else {
							jumpSeasonLeft();
						}
						break;
					case "PadUp":
					case "ArrowUp":
						if ((seasonsData.current?.length ?? 0) > 1) {
							setRow(row => row == Row.Overview ? Row.Episodes : Row.Seasons);
						} else {
							setRow(Row.Episodes);
						}
						break;
					case "PadDown":
					case "ArrowDown":
						setRow(row => row == Row.Seasons ? Row.Episodes : Row.Overview);
						break;
					case "Enter":
						if (episodeData.current && selectedRow.current == Row.Episodes) {
							const data = episodeData.current[selectedRef.current.episode];
							invoke("play_file", { file: data.Path, jellyfinId: data.Id }).then(() => {
								invoke("transport_command", { function: "Play" });
								mutate.current<VideoContextType>("mpv_state", (current) => {
									if (current) {
										return { ...current, jellyfin_data: data };
									}
								});
							});
						}
						break;
					case "Backspace":
					case "Back":
						if (selectedRow.current == Row.Overview) {
							setRow(Row.Episodes);
						} else {
							onNavigate.current(NavigateAction.Back);
						}
						break;
					default:
						break;
				}
			}
			window.addEventListener("keydown", handler);
			return () => { window.removeEventListener("keydown", handler); };
		}
	}, [active]);
	useEffect(() => {
		if (tab_row_content.current) {
			const element = tab_row_content.current.childNodes[selected.season]! as HTMLDivElement;
			const tab_row_width = tab_row_content.current.clientWidth;
			const scrollWidth = SCREEN_WIDTH - HORIZONTAL_MARGIN * 2;
			if (tab_row_width < scrollWidth) {
				setTabRowX(0);
				return;
			}
			const width = element.clientWidth;
			const offsetLeft = element.offsetLeft;
			const screen_centre = SCREEN_WIDTH / 2;
			const centre = HORIZONTAL_MARGIN - screen_centre + (width / 2) + offsetLeft;
			const max_offset = tab_row_width - scrollWidth;
			setTabRowX(offsetLeft > screen_centre - HORIZONTAL_MARGIN ? Math.min(centre, max_offset) : 0);
		}
	}, [selected.season]);
	if (!episodes.data || !seasons.data) return null;
	const runTimeTicks = episodes.data[selected.episode].RunTimeTicks;
	const duration = runTimeTicks ? displayRunningTime(runTimeTicks) : null;
	const startIndex = Math.max(0, selected.episode - 20);
	const endIndex = Math.max(episodes.data.length, selected.episode + 20);
	return (
		<div className="fullscreen-mask bottom">
			<div class="series-info" style={{
				filter: nav_position == 0 ? undefined : "blur(60px) saturate(180%)",
				opacity: nav_position == 0 ? 1 : 0,
				scale: `${1 + (Math.max(Math.min(nav_position, 1), -1) * -0.2)}`,
				transitionTimingFunction: nav_position == 0 ? "var(--timing-function-decelerate)" : "var(--timing-function-accelerate)",
				transitionDelay: nav_position == 0 ? "var(--transition-standard)" : "0ms",
			}}>
				<h1 style={{ marginLeft: 80, marginTop: 80 }}>{props.data.Name}</h1>
				<div className="tab-row">
					<div ref={tab_row_content} className="tab-row-content" style={{ translate: `${-tabRowX}px` }}>
						{seasons.data?.map((season, index) => {
							const is_selected = selected.season == index;
							const active = row == Row.Seasons;
							return (
								<div className={is_selected ? active ? "tab selected active" : "tab selected" : "tab"}>
									<span style={{
										textTransform: "uppercase",
										whiteSpace: "nowrap",
									}}>{season.Name}</span>
								</div>
							);
						})}
					</div>
				</div>
				<div className="episode-info">
					<h1>{episodes.data[selected.episode].Name ?? "Title Unknown"}</h1>
					<h5>{episodes.data[selected.episode].SeasonName ?? "Unknown Season"} Episode {episodes.data[selected.episode].IndexNumber ?? "Unknown"}</h5>
				</div>
				<div className="episode-list" style={{ opacity: row != Row.Overview ? 1 : 0 }}>
					{episodes.data.slice(startIndex, endIndex).map((episode, rawIndex) => {
						const index = rawIndex + startIndex;
						const row_selected = row != Row.Seasons;
						// const visible = index >= startIndex && index < endIndex;
						let translate: number;
						if (!row_selected) {
							translate = (index * (WIDTH + GAP)) - (selected.episode * (WIDTH + GAP)) - 40;
						} else if (index < selected.episode) {
							translate = (index * (WIDTH)) - (selected.episode * (WIDTH)) - GAP; // Inactive scale(.9)
						} else if (index == selected.episode) {
							translate = (index * (WIDTH + GAP)) - (selected.episode * (WIDTH + GAP));
						} else {
							translate = (index * (WIDTH)) - (selected.episode * (WIDTH)) + GAP; // Inactive scale(.9)
						}
						return (
							<div key={episode.Id} className="episode-container" style={{ translate: `${translate}px` }}>
								<ContentPanel scaleDownInactive state={row_selected ? (selected.episode == index ? PanelState.Active : PanelState.Inactive) : PanelState.None} width={WIDTH} height={HEIGHT}>
									{/* visible ? */ <img
										decoding="async"
										src={`${api.basePath}/Items/${episode.Id}/Images/Primary?fillWidth=${WIDTH}&fillHeight=${HEIGHT}`}
										style={{
											objectFit: "cover",
											width: "100%",
											height: "100%",
										}}
									/> /* : null */}
								</ContentPanel>
							</div>
						);
					})}
				</div>
				<div ref={episode_overview} className={row == Row.Overview ? "episode-overview focused" : "episode-overview"}>
					{duration || typeof episodes.data[selected.episode].PremiereDate == "string" ? (
						<span>
							{duration ? duration : null}
							{duration && episodes.data[selected.episode].PremiereDate ? " – " : null}
							{typeof episodes.data[selected.episode].PremiereDate == "string" ? `${new Date(episodes.data[selected.episode].PremiereDate!)
								.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}` : null}
						</span>
					) : null}
					<p style={{ maxWidth: 1200 }}>{episodes.data[selected.episode].Overview ?? "No overview available"}</p>
					<span style={{ whiteSpace: "nowrap" }}>{episodes.data[selected.episode].Path}</span>
					{episodes.data[selected.episode].MediaStreams ? episodes.data[selected.episode].MediaStreams!.map(_info => {
						return null
						// switch (info.Type) {
						// 	case "Audio":
						// 		return (
						// 			<span className="technical">Audio: {info.DisplayTitle}</span>
						// 		);
						// 	case "Video":
						// 		return (
						// 			<>
						// 				<span className="technical">Video: {info.Height}{info.IsInterlaced ? "i" : "p"} {info.Codec?.toUpperCase()}{info.IsDefault ? " - Default" : ""}</span>
						// 				{/* <span>Video: {info.DisplayTitle}</span> */}
						// 			</>
						// 		);
						// 	case "Subtitle":
						// 		return (
						// 			<span className="technical">Sub: {info.DisplayTitle ?? info.Title}</span>
						// 		);
						// 	default:
						// 		return null;
						// }
					}) : null}
					{episodes.data[selected.episode].MediaStreams ? episodes.data[selected.episode].MediaStreams!.map(info => <MediaStreamInfo info={info} />) : null}
				</div>
			</div>
		</div>
	);
}

async function getSeasons(seriesId: Id) {
	let { data } = await jellyfin.getTvShowsApi(api).getSeasons({
		seriesId,
		userId: auth.User!.Id!,
		fields: ["ItemCounts", "PrimaryImageAspectRatio", "BasicSyncInfo", "MediaSourceCount", /* */ "ChildCount", "EnableMediaSourceDisplay"],
	});
	console.log(data);
	return data.Items!/* .filter(season => season.ChildCount! > 0) */;
}

/**
 * TODO: Pagination?
 */
async function getEpisodes(seriesId: Id) {
	let { data } = await jellyfin.getTvShowsApi(api).getEpisodes({
		seriesId,
		userId: auth.User!.Id!,
		isMissing: false,
		imageTypeLimit: 1,
		// TODO: Fetch some of these when the file is played
		fields: ["ItemCounts", "PrimaryImageAspectRatio", "BasicSyncInfo", "MediaSourceCount", "Overview", "Path", "SpecialEpisodeNumbers", "MediaStreams", "OriginalTitle", "MediaSourceCount", "MediaSources", "Chapters"]
	});
	console.log(data);
	return data.Items!;
}