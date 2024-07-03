import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "preact/hooks";
import * as jellyfin from "@jellyfin/sdk/lib/utils/api";
import useSWR, { useSWRConfig } from "swr";

import { JellyfinScreenProps } from "../../jellyfin";
import { Id } from "../../../components/Content/types";
import api, { auth } from "../../../context/Jellyfin";
import { ContentPanel, PanelState } from "../../../components/Panel";
import { NavigateAction } from "../../../components/ContentList";
import { invoke } from "@tauri-apps/api/core";
import { displayRunningTime, languageString, type LangKey } from "../../../util/functions";
import { MediaStreamInfo, mapCodecToDisplayName } from "../../../components/Jellyfin/MediaStreamInfo";
import { VideoContextType } from "../../../context/VideoContext";
import { useInput, useInputRelease } from "../../../hooks";
import { Menu, type XBMenuItem } from "../../../components/Menu";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { FeedbackSound, playFeedback } from "../../../context/AudioFeedback";

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

type SelectionState = {
	season: number;
	episode: number;
};

type SelectionStateWithPrev = SelectionState & {
	previous: SelectionState;
};

function selectionReducer(state: SelectionStateWithPrev, action: SelectionState | ((current: SelectionStateWithPrev) => SelectionState))/* : { season: number; episode: number; previous: { season: number; episode: number; } } */ {
	if (typeof action == "function") {
		const newState = action(state);
		return { ...newState, previous: { season: state.season, episode: state.episode } };
	} else {
		return { ...action, previous: { season: state.season, episode: state.episode } };
	}
}

export function TvSeries(props: JellyfinScreenProps) {
	// console.log(props.data);
	// Mutator
	const { mutate } = useSWRConfig();
	// Props
	const { active: _active, nav_position, onNavigate } = props;
	const [nextUpSelected, setNextUpSelected] = useState(false);
	const { data: nextUp, isLoading: loadingNextUp } = useSWR(`next-up-${props.data.Id}`, () => getNextUp(props.data.Id!), { revalidateOnMount: true });
	const { data: episodes, /* isLoading: episodesLoading, */ mutate: updateEpisodes } = useSWR(`episodes-${props.data.Id}`, () => getEpisodes(props.data.Id!), { keepPreviousData: true });
	// const { data: seasons, /* isLoading: seasonsLoading */ } = useSWR(`seasons-${props.data.Id}`, () => getSeasons(props.data.Id!), { keepPreviousData: true });
	const { data: seasons, isLoading: loadingSeasons } = useSWR(() => episodes ? `seasons-${props.data.Id}` : null, () => seasonsFromEpisodes(episodes), { keepPreviousData: true });
	const season_count = seasons?.length ?? 0;
	const [tabRowX, setTabRowX] = useState(0);
	const [selected, setSelected] = useReducer(selectionReducer, { season: 0, episode: 0, previous: { season: 0, episode: 0 } });
	const [menuOpen, setMenuOpen] = useState(false);
	const [keyRepeatCount, setKeyRepeatCount] = useState(0);
	const [enter_pressed, setEnterPressed] = useState(false);
	const active = _active && !menuOpen;
	// const [selectedEpisode, setSelectedEpisode] = useState(0);
	// const [selectedSeason, setSelectedSeason] = useState(0);
	const [row, setRow] = useState(Row.Episodes);
	const tab_row_content = useRef<HTMLDivElement>(null);
	const episode_overview = useRef<HTMLDivElement>(null);
	const menu_submit = useCallback((action: string, id: Id) => {
		console.log("action:", action, "id", id);
		switch (action) {
			case "mark_watched":
				jellyfin.getPlaystateApi(api).markPlayedItem({
					userId: auth.User!.Id!,
					itemId: id,
				}).then(() => {
					console.log("Hopefully marked as watched?");
					updateEpisodes(undefined, { revalidate: true });
				});
				break;
			case "mark_unwatched":
				jellyfin.getPlaystateApi(api).markUnplayedItem({
					userId: auth.User!.Id!,
					itemId: id,
				}).then(() => {
					console.log("Hopefully marked as unwatched?");
					updateEpisodes(undefined, { revalidate: true });
				});
				break;
		}
		setMenuOpen(false);
	}, [updateEpisodes]);
	const menu_cancel = useCallback(() => setMenuOpen(false), []);
	useEffect(() => {
		if (loadingNextUp || loadingSeasons) return;
		if (!nextUpSelected && nextUp) {
			if (nextUp.length == 1) {
				setSelected(({ season, episode }) => {
					const e_index = episodes?.findIndex(episode => episode.Id == nextUp[0].Id) ?? -1;
					const s_index = seasons?.findIndex(season => season.Id == nextUp[0].SeasonId) ?? -1;
					if (e_index > -1) {
						setNextUpSelected(true);
						return { season: s_index > -1 ? s_index : season, episode: e_index ?? episode };
					} else {
						return { season, episode };
					}
				});
			} else {
				setNextUpSelected(true);
			}
		}
	}, [nextUpSelected, nextUp, loadingNextUp, episodes, seasons, loadingSeasons]);
	// // Cheeky useRefs to avoid re-creating the callback several times.
	// const selectedRef = useRef(selected);
	// selectedRef.current = selected;
	// // This is getting to be a lot...
	// const selectedEpisodeRef = useRef(selectedEpisode);
	// selectedEpisodeRef.current = selectedEpisode;
	// // Seasons
	// const selectedSeasonRef = useRef(selectedSeason);
	// selectedSeasonRef.current = selectedSeason;
	// // Tab/Content row
	// const selectedRow = useRef(row);
	// selectedRow.current = row;
	// useEffect(() => {
	// 	if (episodeData.current && seasonsData.current) {
	// 		// if (seasonsData.current[selectedSeasonRef.current].Id == episodeData.current[selectedEpisode].SeasonId) {
	// 		// 	return;
	// 		// } else {
	// 		// }
	// 		const index = seasonsData.current.findIndex(season => season.Id == episodeData.current![selectedEpisode].SeasonId);
	// 		if (index > -1) {
	// 			setSelectedSeason(index);
	// 		}
	// 	}
	// }, [selectedEpisode]);
	// useEffect(() => {
	// 	if (episodeData.current && seasonsData.current) {
	// 		// if (episodeData.current[selectedEpisode].SeasonId == seasonsData.current[selectedSeason].Id) {
	// 		// 	return;
	// 		// }
	// 		const index = episodeData.current.findIndex(episode => episode.SeasonId == seasonsData.current![selectedSeason].Id);
	// 		if (index > -1) {
	// 			setSelectedEpisode(index);
	// 		}
	// 	}
	// }, [selectedSeason]);
	useInput(active, () => setKeyRepeatCount(v => v + 1), []);
	useInputRelease(() => setKeyRepeatCount(0), active, []);
	useInput(active, (button) => button == "Enter" ? setEnterPressed(true) : void (0), []);
	useInputRelease((button) => button == "Enter" ? setEnterPressed(false) : void (0), true, []);
	useInput(active, (button) => {
		switch (button) {
			case "Enter":
				// onNavigate(NavigateAction.Enter, selectedEpisode);
				if (episodes && row == Row.Episodes) {
					const data = episodes[selected.episode];
					invoke("play_file", { file: data.Path, jellyfinId: data.Id }).then(() => {
						invoke("transport_command", { function: "Play" });
						mutate<VideoContextType>("mpv_state", (current) => {
							if (current) {
								return { ...current, jellyfin_data: data };
							}
						});
					});
				}
				break;
		}
	}, [row, selected, episodes, mutate]);
	useInput(active, (button) => {
		switch (button) {
			case "Backspace":
			case "Back":
				if (row == Row.Overview) {
					setRow(Row.Episodes);
					playFeedback(FeedbackSound.Back);
				} else {
					onNavigate(NavigateAction.Back);
				}
				break;
		}
	}, [row, onNavigate]);
	const jumpSeasonLeft = useCallback((button: string) => {
		setSelected(({ season, episode }) => {
			if (episodes && seasons) {
				const currentSeasonStartEpisodeIndex = episodes.findIndex(episode => episode.SeasonId == seasons![season].Id);
				const previousSeasonIndex = Math.max(season - 1, 0);
				const previousSeasonStartEpisodeIndex = episodes.findIndex(episode => episode.SeasonId == seasons![previousSeasonIndex].Id);
				// if (previousSeasonStartEpisodeIndex > -1) {
				// 	setSelectedEpisode(previousSeasonStartEpisodeIndex);
				// }
				if (currentSeasonStartEpisodeIndex > -1 && button == "L1") {
					if (episode > currentSeasonStartEpisodeIndex) {
						playFeedback(FeedbackSound.SelectionMove);
						return { season, episode: currentSeasonStartEpisodeIndex };
					}
				}
				if (previousSeasonStartEpisodeIndex > -1) {
					if (previousSeasonIndex < season || previousSeasonStartEpisodeIndex < episode) playFeedback(FeedbackSound.SelectionMove);
					return { season: previousSeasonIndex, episode: previousSeasonStartEpisodeIndex };
				} else {
					if (previousSeasonIndex < season) playFeedback(FeedbackSound.SelectionMove);
					return { season: previousSeasonIndex, episode };
				}
			} else {
				return { season, episode };
			}
		});
		// setSelectedSeason(current => {
		// 	if (episodes && seasons) {
		// 		const currentSeasonStartEpisodeIndex = episodes.findIndex(episode => episode.SeasonId == seasons![current].Id);
		// 		const previousSeasonIndex = Math.max(current - 1, 0);
		// 		const previousSeasonStartEpisodeIndex = episodes.findIndex(episode => episode.SeasonId == seasons![previousSeasonIndex].Id);
		// 		if (previousSeasonStartEpisodeIndex > -1) {
		// 			setSelectedEpisode(previousSeasonStartEpisodeIndex);
		// 		}
		// 		return previousSeasonIndex;
		// 	} else {
		// 		return current;
		// 	}
		// });
	}, [episodes, seasons]);
	const jumpSeasonRight = useCallback((toEnd?: boolean) => {
		setSelected(({ season, episode }) => {
			if (episodes && seasons) {
				if (season == seasons.length - 1 && toEnd) {
					playFeedback(FeedbackSound.SelectionMove);
					return { season, episode: episodes.length - 1 };
				}
				const newIndex = Math.min(season + 1, (seasons.length ?? 1) - 1);
				const index = episodes.findIndex(episode => episode.SeasonId == seasons![newIndex].Id);
				if (index > -1) {
					// setSelectedEpisode(index);
					if (newIndex > season || index > episode) playFeedback(FeedbackSound.SelectionMove);
					return { season: newIndex, episode: index };
				} else {
					if (newIndex > season) playFeedback(FeedbackSound.SelectionMove);
					return { season: newIndex, episode };
				}
			} else {
				return { season, episode };
			}
		});
		// setSelectedSeason(current => {
		// 	if (episodes && seasons) {
		// 		if (current == seasons.length - 1 && toEnd) {
		// 			setSelectedEpisode(episodes.length - 1);
		// 			return current;
		// 		}
		// 		const newIndex = Math.min(current + 1, (seasons.length ?? 1) - 1);
		// 		const index = episodes.findIndex(episode => episode.SeasonId == seasons![newIndex].Id);
		// 		if (index > -1) {
		// 			setSelectedEpisode(index);
		// 		}
		// 		return newIndex;
		// 	} else {
		// 		return current;
		// 	}
		// });
	}, [episodes, seasons]);
	useInput(active && row != Row.Overview, (button) => {
		switch (button) {
			case "R1":
				setRow(Row.Episodes);
				jumpSeasonRight(true);
				break;
			case "L1":
				setRow(Row.Episodes);
				jumpSeasonLeft(button);
				break;
		}
	}, [jumpSeasonLeft, jumpSeasonRight]);
	useInput(active, (button) => {
		switch (button) {
			case "PadDown":
			case "ArrowDown":
				setRow(row => {
					if (row != Row.Overview) playFeedback(FeedbackSound.SelectionMove);
					return row == Row.Seasons ? Row.Episodes : Row.Overview;
				});
				break;
		}
	}, []);
	useInput(active && row == Row.Seasons, (button) => {
		switch (button) {
			case "PadRight":
			case "ArrowRight":
				jumpSeasonRight();
				break;
			case "PadLeft":
			case "ArrowLeft":
				jumpSeasonLeft(button);
				break;
		}
	}, [jumpSeasonLeft, jumpSeasonRight]);
	useInput(active && row == Row.Episodes, (button) => {
		switch (button) {
			case "Y":
			case "t":
				setMenuOpen(v => !v);
				break;
			case "PadRight":
			case "ArrowRight":
				// setSelectedEpisode(current => Math.min(current + 1, (episodes?.length ?? 1) - 1));
				if (seasons && episodes) {
					setSelected(({ episode: current }) => {
						const episode = Math.min(current + 1, (episodes!.length ?? 1) - 1);
						if (episode != current) playFeedback(FeedbackSound.SelectionMove);
						const SeasonId = episodes![episode].SeasonId;
						const index = seasons!.findIndex(season => season.Id == SeasonId);
						return { season: index, episode };
					});
				}
				break;
			case "PadLeft":
			case "ArrowLeft":
				// setSelectedEpisode(current => Math.max(current - 1, 0));
				if (seasons && episodes) {
					setSelected(({ episode: current }) => {
						const episode = Math.max(current - 1, 0);
						if (episode != current) playFeedback(FeedbackSound.SelectionMove);
						const SeasonId = episodes![episode].SeasonId;
						const index = seasons!.findIndex(season => season.Id == SeasonId);
						return { season: index, episode };
					});
				}
				break;
		}
	}, [seasons, episodes]);
	useInput(active, (button) => {
		console.log(button);
		switch (button) {
			case "PadUp":
			case "ArrowUp":
				if (season_count > 1) {
					setRow(row => {
						if (row == Row.Overview) {
							playFeedback(FeedbackSound.Back);
						} else if (row == Row.Episodes) {
							playFeedback(FeedbackSound.SelectionMove);
						}
						return row == Row.Overview ? Row.Episodes : Row.Seasons;
					});
				} else {
					setRow(row => {
						if (row == Row.Overview) playFeedback(FeedbackSound.Back);
						return Row.Episodes;
					});
				}
				break;
			default:
				break;
		}
	}, [season_count]);
	useLayoutEffect(() => {
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
			setTabRowX((offsetLeft + (width / 2)) > screen_centre - HORIZONTAL_MARGIN ? Math.min(centre, max_offset) : 0);
		}
	}, [selected.season]);
	const menu = useMemo((): XBMenuItem<Id>[] => {
		if (episodes) {
			const episode = episodes[selected.episode];
			if (!episode) return [];
			const id = episode.Id;
			if (!id) return [];
			const isWatched = episode.UserData?.Played ?? false;
			return [
				{
					label: "Play",
					id: "just_play",
					value: id,
				},
				{
					label: "Play from start",
					id: "play_from_start",
					value: id,
				},
				{
					label: isWatched ? "Mark as unwatched" : "Mark as watched",
					id: isWatched ? "mark_unwatched" : "mark_watched",
					value: id,
				},
				// submenu: {
				// 	default_item: 1,
				// 	items: [
				// 		{
				// 			label: "Yes",
				// 			id: "yes",
				// 		},
				// 		{
				// 			label: "No",
				// 			id: "no",
				// 		},
				// 	]
				// }
				{
					label: "Select Audio Track",
					id: "audio",
					submenu: {
						items: [...episodes[selected.episode].MediaStreams!].filter(stream => stream.Type == "Audio").map(info => {
							const language = info.Language ? info.Language.length == 3 ? languageString(info.Language! as LangKey) : info.Language : null;
							return {
								label: `${mapCodecToDisplayName(info.Profile?.replace("MA", "Master Audio")) ?? mapCodecToDisplayName(info.Codec?.toUpperCase() ?? "Unknown")}${language ? ` / ${language}` : ""} / ${info.ChannelLayout} / ${Math.round(info.SampleRate! / 100) / 10} kHz / ${Math.round(info.BitRate! / 1000)} kbps${info.BitDepth ? ` / ${info.BitDepth}-bit` : ""}${info.IsDefault ? " - Default" : ""}`,
								id: "play_with_audio_track",
								value: info.Index!.toString(),
							};
						}),
					}
				},
				/* {
					label: "Select Subtitle Track",
					id: "sub",
				}, */
			];
		} else {
			return [];
		}
	}, [episodes, selected]);
	if (!episodes || !seasons || !nextUpSelected || loadingNextUp) return null;
	if (episodes.length == 0) return (
		<h1>No episodes</h1>
	);
	const runTimeTicks = episodes[selected.episode].RunTimeTicks;
	const duration = runTimeTicks ? displayRunningTime(runTimeTicks) : null;
	const startIndex = Math.max(0, selected.episode - 2);
	const endIndex = Math.min(episodes.length, selected.episode + 5 + 1);
	return (
		<div>
			<div className="fullscreen-mask bottom">
				<div class="series-info" style={{
					// filter: nav_position == 0 ? undefined : "blur(60px) saturate(180%)",
					opacity: nav_position == 0 ? 1 : 0,
					scale: `${1 + (Math.max(Math.min(nav_position, 1), -1) * -0.2)}`,
					transitionTimingFunction: nav_position == 0 ? "var(--timing-function-decelerate)" : "var(--timing-function-accelerate)",
					transitionDelay: nav_position == 0 ? "var(--transition-standard)" : "0ms",
				}}>
					<h1 style={{ marginLeft: 80, marginTop: 80 }}>{props.data.Name}</h1>
					<div className={row == Row.Seasons ? "tab-row active" : "tab-row"}>
						<div ref={tab_row_content} className="tab-row-content" style={{ translate: `${-tabRowX}px` }}>
							{/* <div style={{ display: "flex", gap: 40 }}> */}
							{seasons?.map((season, index) => {
								// const selected = episodes![selected.episode].SeasonId == season.Id;
								const is_selected = selected.season == index;
								const active = row == Row.Seasons;
								return (
									<div key={season.Id ?? index} className={is_selected ? active ? "tab selected active" : "tab selected" : "tab"}>
										<span style={{
											textTransform: "uppercase",
											// position: "absolute",
											// fontWeight: selected ? 700 : 400,
											// fontWeight: 600,
											whiteSpace: "nowrap",
										}}>{season.Name}</span>
									</div>
								);
							})}
							{/* </div> */}
						</div>
					</div>
					<div className="episode-info">
						<h1>{episodes[selected.episode].Name ?? "Title Unknown"}</h1>
						<h5>{episodes[selected.episode].SeasonName ?? "Unknown Season"} Episode {episodes[selected.episode].IndexNumber ?? "Unknown"}</h5>
					</div>
					<div className="episode-list" style={{ opacity: row != Row.Overview ? 1 : 0 }}>
						{episodes.slice(startIndex, endIndex).map((episode, rawIndex) => {
							const index = rawIndex + startIndex;
							const row_selected = row != Row.Seasons;
							// const visible = index >= startIndex && index < endIndex;
							// if (!visible) return;
							// const row_active = active && row_selected;
							// const translate = (index * (WIDTH + GAP)) - (selected.episode * (WIDTH + GAP));
							let translate: number;
							const highlight_selected = row_selected /* && keyRepeatCount < 2 */;
							if (!highlight_selected) {
								translate = (index * (WIDTH + GAP)) - (selected.episode * (WIDTH + GAP)) - 40;
							} else if (index < selected.episode) {
								translate = (index * (WIDTH)) - (selected.episode * (WIDTH)) - GAP; // Inactive scale(.9)
								// translate = (index * (WIDTH + GAP)) - (selected.episode * (WIDTH + GAP)) - GAP;
							} else if (index == selected.episode) {
								translate = (index * (WIDTH + GAP)) - (selected.episode * (WIDTH + GAP));
							} else /* index > selected.episode */ {
								translate = (index * (WIDTH)) - (selected.episode * (WIDTH)) + GAP; // Inactive scale(.9)
								// translate = (index * (WIDTH + GAP)) - (selected.episode * (WIDTH + GAP)) + GAP;
							}
							// if (!visible) return (
							// 	<div key={episode.Id} className="pseudo-episode-panel" style={{ translate: `${translate}px` }} />
							// );
							return (
								<div key={episode.Id ?? index} className="episode-container" style={{ translate: `${translate}px`, /* display: index > startIndex && index < endIndex ? undefined : "none", */ }}>
									{/* {menuOpen && index == selected.episode ? <div style={{ position: "fixed", inset: 0, backdropFilter: "blur(60px)" }} /> : null} */}
									<ContentPanel scaleDownInactive state={highlight_selected /* && !(enter_pressed && selected.episode == index) */ ? (selected.episode == index ? PanelState.Active : PanelState.Inactive) : PanelState.None} width={WIDTH} height={HEIGHT}>
										<img
											decoding="async"
											src={`${api.basePath}/Items/${episode.Id}/Images/Primary?fillWidth=${WIDTH}&fillHeight=${HEIGHT}`}
											style={{
												objectFit: "cover",
												width: "100%",
												height: "100%",
											}}
										/>
									</ContentPanel>
									{/* <span style={{ fontSize: 40, fontWeight: 600, whiteSpace: "nowrap" }}>{episode.Name}</span> */}
								</div>
							);
						})}
					</div>
					<div ref={episode_overview} className={row == Row.Overview ? "episode-overview focused" : "episode-overview"}>
						{duration || typeof episodes[selected.episode].PremiereDate == "string" ? (
							<span>
								{duration ? duration : null}
								{duration && episodes[selected.episode].PremiereDate ? " – " : null}
								{typeof episodes[selected.episode].PremiereDate == "string" ? `${new Date(episodes[selected.episode].PremiereDate!)
									.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}` : null}

							</span>
						) : null}
						{episodes[selected.episode].UserData?.Played ? <span>{(episodes[selected.episode].UserData?.Played ?? false) ? "Watched" : "Unwatched"}</span> : null}
						<p style={{ maxWidth: 1200 }}>{episodes[selected.episode].Overview ?? "No overview available"}</p>
						<span style={{ /* whiteSpace: "nowrap", */ lineBreak: "loose", wordBreak: "break-all" }}>{episodes[selected.episode].Path}</span>
						{episodes[selected.episode].MediaStreams ? episodes[selected.episode].MediaStreams!.map(_info => {
							return null;
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
						{episodes[selected.episode].MediaStreams ? episodes[selected.episode].MediaStreams!.map(info => <MediaStreamInfo info={info} />) : null}
					</div>
				</div>
			</div>
			<Menu active={menuOpen} items={menu} onSubmit={menu_submit} onCancel={menu_cancel} />
		</div>
	);
}

async function getNextUp(seriesId: Id) {
	let { data } = await jellyfin.getTvShowsApi(api).getNextUp({
		seriesId,
		userId: auth.User!.Id!,
		fields: ["MediaSourceCount"],
	});
	console.log("Next up:", data);
	return data.Items!;
}

async function getSeasons(seriesId: Id) {
	let { data } = await jellyfin.getTvShowsApi(api).getSeasons({
		seriesId,
		userId: auth.User!.Id!,
		enableImages: true,
		fields: ["ItemCounts", "PrimaryImageAspectRatio", "MediaSourceCount", /* */ "ChildCount", "EnableMediaSourceDisplay"],
		isMissing: false,
	});
	// console.log(data);
	return data.Items!/* .filter(season => season.ChildCount! > 0) */;
}

async function seasonsFromEpisodes(episodes?: BaseItemDto[]) {
	if (episodes) {
		// return episodes.reduce((prev, curr, index, arr) => {});
		return Array.from(new Map(episodes.map(episode => [episode.SeasonId!, episode.SeasonName!]))).map(([Id, Name]) => ({
			Name,
			Id,
		} as BaseItemDto));
	} else {
		return episodes;
	}
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
		enableUserData: true,
		sortBy: "ParentIndexNumber",
		// TODO: Fetch some of these when the file is played
		fields: ["ItemCounts", "PrimaryImageAspectRatio", "MediaSourceCount", "Overview", "Path", "SpecialEpisodeNumbers", "MediaStreams", "OriginalTitle", "MediaSourceCount", "MediaSources", "Chapters"]
	});
	console.log(data);
	return data.Items!;
}