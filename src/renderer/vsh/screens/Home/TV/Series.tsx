import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "preact/hooks";
import * as jellyfin from "@jellyfin/sdk/lib/utils/api";
import useSWR, { useSWRConfig } from "swr";

import { JellyfinScreenProps } from "../../jellyfin";
import { Id } from "../../../components/Content/types";
import api, { auth } from "../../../context/Jellyfin";
import { ContentPanel, PanelState } from "../../../components/Panel";
import { NavigateAction } from "../../../components/ContentList";
import { displayRunningTime, languageString, TICKS_PER_SECOND, toHMS, type LangKey } from "../../../util/functions";
import { MediaStreamInfo, mapCodecToDisplayName } from "../../../components/Jellyfin/MediaStreamInfo";
import { VideoContextType } from "../../../context/VideoContext";
import { useInput, useInputRelease } from "../../../hooks";
import { Menu, type XBMenuItem } from "../../../components/Menu";
import type { BaseItemDto, ItemFields } from "@jellyfin/sdk/lib/generated-client/models";
import { FeedbackSound, playFeedback } from "../../../context/AudioFeedback";
import { Loading } from "../../../components/Loading";
import type { ScopedMutator } from "swr/dist/_internal";
import { playFile } from "~/renderer/vsh/functions/play";

// const WIDTH = 320;
const WIDTH = 400;
// const HEIGHT = 180;
const HEIGHT = 225;
// const GAP = 80;
const GAP = 50; // Inactive scale(0.9)
// const GAP = 30;

const SCREEN_WIDTH = 1920;
const HORIZONTAL_MARGIN = 80;

const OVERDRAW = 1;

const GET_ITEMS_FIELDS: ItemFields[] = ["ItemCounts", "PrimaryImageAspectRatio", "MediaSourceCount", "Overview", "Path", "SpecialEpisodeNumbers", "MediaStreams", "OriginalTitle", "MediaSourceCount", "MediaSources", "Chapters"];

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
	const { data: episodes, isLoading: episodesLoading, isValidating: episodesValidating, mutate: updateEpisodes } = useSWR(`episodes-${props.data.Id}`, () => getEpisodes(props.data.Id!), { keepPreviousData: true, revalidateOnMount: true });
	// const { data: seasons, /* isLoading: seasonsLoading */ } = useSWR(`seasons-${props.data.Id}`, () => getSeasons(props.data.Id!), { keepPreviousData: true });
	// const { data: seasons, isLoading: seasonsLoading, isValidating: seasonsValidating } = useSWR(() => episodes && !episodesLoading && !episodesValidating ? `seasons-${props.data.Id}` : null, () => seasonsFromEpisodes(episodes), { keepPreviousData: true, revalidateOnMount: true });
	const [nextUpSelected, setNextUpSelected] = useState(false);
	const { data: nextUp, isLoading: nextUpIsLoading, isValidating: nextUpIsValidating } = useSWR(`next-up-${props.data.Id}`, () => getNextUp(props.data.Id!), { revalidateOnMount: true });
	// const nextUpIsLoading = false;
	// const nextUpIsValidating = false;
	// const nextUp = useMemo(() => getDefaultSelected(episodes), [episodes]);
	const seasons = useMemo(() => seasonsFromEpisodes(episodes), [episodes]);
	const seasonsLoading = false;
	const seasonsValidating = false;
	const anyValidating = nextUpIsValidating || episodesValidating || seasonsValidating;
	const anyLoading = nextUpIsLoading || episodesLoading || seasonsLoading;
	const anythingHappening = anyValidating || anyLoading;
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
	const menu_submit = useCallback((item: XBMenuItem<Id> & { value: Id; }) => {
		const { id: action, value: id } = item;
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
			case "play_from_start":
				jellyfin.getItemsApi(api).getItems({
					ids: [id],
					fields: GET_ITEMS_FIELDS,
					limit: 1,
				}).then(({ data: { Items } }) => {
					if (Items?.[0]) playEpisode(Items[0], mutate, false);
				}).catch();
				break;
			case "just_play":
				jellyfin.getItemsApi(api).getItems({
					ids: [id],
					fields: GET_ITEMS_FIELDS,
					limit: 1,
				}).then(({ data: { Items } }) => {
					if (Items?.[0]) playEpisode(Items[0], mutate, true);
				}).catch();
				break;
		}
		setMenuOpen(false);
	}, [updateEpisodes, mutate]);
	const menu_cancel = useCallback(() => setMenuOpen(false), []);
	useLayoutEffect(() => {
		setNextUpSelected(false);
		setSelected({ episode: 0, season: 0 });
	}, [props.data]);
	useEffect(() => {
		if (nextUpIsLoading || seasonsLoading) return;
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
	}, [nextUpSelected, nextUp, nextUpIsLoading, episodes, seasons, seasonsLoading]);
	// useEffect(() => {
	// 	if (seasonsLoading) return;
	// 	if (!nextUpSelected && nextUp) {
	// 		setSelected((current) => {
	// 			// const { season, episode } = current;
	// 			const s_index = seasons?.findIndex(season => season.Id == episodes?.[nextUp].SeasonId) ?? -1;
	// 			if (nextUp > 0 && s_index > -1) {
	// 				setNextUpSelected(true);
	// 				return { season: s_index, episode: nextUp };
	// 			}
	// 			return current;
	// 		});
	// 	}
	// }, [nextUpSelected, nextUp, episodes, seasons, seasonsLoading]);

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
				if (episodes && episodes[selected.episode] && row == Row.Episodes) {
					const episode = episodes[selected.episode];
					// playEpisode(data, mutate, true);
					jellyfin.getItemsApi(api).getItems({
						ids: [episode.Id!],
						fields: GET_ITEMS_FIELDS,
						limit: 1,
					}).then(({ data: { Items } }) => {
						if (Items?.[0]) playEpisode(Items[0], mutate, true);
					}).catch();
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
			const element = tab_row_content.current.childNodes[selected.season] as HTMLDivElement | null;
			if (element) {
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
		}
	}, [seasons, selected.season, anyValidating]);
	useLayoutEffect(() => {
		if (episodes && seasons) {
			const seasonIndex = seasons.findIndex(season => season.Id == episodes[selected.episode]?.SeasonId);
			setSelected(prev => ({
				...prev,
				season: seasonIndex == -1 ? 0 : seasonIndex,
			}));
		}
	}, [seasons, episodes]);
	const [, setBackgroundHoldIndexState] = useState(true);
	const [backgroundHoldIndex, setBackgroundHoldIndex] = useState(selected.episode);
	useInput(active, () => {
		setBackgroundHoldIndexState(state => {
			if (state) {
				return state;
			} else {
				setBackgroundHoldIndex(selected.episode);
				return true;
			}
		})
	}, [selected.episode]);
	useInputRelease(() => {
		const timeout = window.setTimeout(() => {
			setBackgroundHoldIndexState(false);
			setBackgroundHoldIndex(selected.episode);
		}, 400);
		return () => window.clearTimeout(timeout);
	}, active, [selected.episode]);
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
	if (anyLoading) return (
		<Loading />
	);
	if (!episodes || !seasons || !nextUpSelected || nextUpIsLoading) return null;
	if (episodes.length == 0) return (
		<h1>No episodes</h1>
	);
	const runTimeTicks = episodes[selected.episode]?.RunTimeTicks ?? 0;
	const duration = runTimeTicks ? displayRunningTime(runTimeTicks) : null;
	const startIndex = Math.max(0, selected.episode - (0 + OVERDRAW)); //   sel - (on-screen + overdraw)
	const endIndex = Math.min(episodes.length, selected.episode + (4 + OVERDRAW)); // sel + (on-screen + overdraw)
	return (
		<div>
			<div className="fullscreen-mask /* bottom */">
				<div class="series-info" style={{
					// filter: nav_position == 0 ? undefined : "blur(60px) saturate(180%)",
					opacity: nav_position == 0 ? 1 : 0,
					// scale: `${1 + (Math.max(Math.min(nav_position, 1), -1) * -0.2)}`,
					transitionTimingFunction: nav_position == 0 ? "var(--timing-function-decelerate)" : "var(--timing-function-accelerate)",
					transitionDelay: nav_position == 0 ? "var(--transition-standard)" : "0ms",
				}}>
					{episodes[backgroundHoldIndex] && <BackdropImage
						selected={selected.episode}
						index={backgroundHoldIndex}
						item={episodes[backgroundHoldIndex]}
						previous
						show
					/>}
					{/* {episodes[selected.episode] && <BackdropImage
						selected={selected.episode}
						index={selected.episode}
						episode={episodes[selected.episode]}
						show={row == Row.Overview}
					/>} */}
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
						<h1>{episodes[selected.episode]?.Name ?? "Title Unknown"}</h1>
						<h5>{episodes[selected.episode]?.SeasonName ?? "Unknown Season"} Episode {episodes[selected.episode]?.IndexNumber ?? "Unknown"}</h5>
					</div>
					<div className="episode-list" /* ref={animationParent} */ style={{
						opacity: row != Row.Overview ? 1 : 0,
						zIndex: -5,
						// "--transition-standard": "2s", // DEBUG
						// "--standard-duration": "2s"//     DEBUG
					}}>
						{episodes.slice(startIndex, endIndex).map((episode, rawIndex) => {
							const index = rawIndex + startIndex;
							const row_selected = row != Row.Seasons;
							const highlight_selected = row_selected /* && keyRepeatCount < 2 */;
							// const visible = index >= startIndex && index < endIndex;
							// if (!visible) return;
							// const row_active = active && row_selected;
							// const translate = (index * (WIDTH + GAP)) - (selected.episode * (WIDTH + GAP));
							// if (!visible) return (
							// 	<div key={episode.Id} className="pseudo-episode-panel" style={{ translate: `${translate}px` }} />
							// );
							return (
								// EpisodePanel(episode, index, translate, highlight_selected, selected)
								<EpisodePanel key={episode.Id ?? index} episode={episode} index={index} highlight_selected={highlight_selected} selected={selected.episode} prevSelected={selected.previous.episode} />
							);
						})}
					</div>
					<div ref={episode_overview} className={row == Row.Overview ? "episode-overview focused" : "episode-overview"}>
						{duration || typeof episodes[selected.episode]?.PremiereDate == "string" ? (
							<span>
								{duration ? duration : null}
								{duration && episodes[selected.episode]?.PremiereDate ? " – " : null}
								{typeof episodes[selected.episode]?.PremiereDate == "string" ? `${new Date(episodes[selected.episode]?.PremiereDate!)
									.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}` : null}
							</span>
						) : null}
						{episodes[selected.episode]?.UserData?.Played ? <span>{(episodes[selected.episode]?.UserData?.Played ?? false) ? "Watched" : "Unwatched"}{
							episodes[selected.episode]?.UserData ?
								episodes[selected.episode].UserData!.PlaybackPositionTicks != undefined ?
								episodes[selected.episode].UserData!.PlaybackPositionTicks != 0 &&
									` – Continue Watching from ${toHMS(episodes[selected.episode]!.UserData!.PlaybackPositionTicks! / TICKS_PER_SECOND)}` : null : null}
							{null && ` – Last Played: ${episodes[selected.episode]?.UserData?.LastPlayedDate ?? "Never?"}`}</span> : null}
						{/* {episodes[selected.episode]?.UserData && <span>Position: {toHMS((episodes[selected.episode].UserData?.PlaybackPositionTicks ?? 0) / TICKS_PER_SECOND)}</span>} */}
						<p style={{ maxWidth: 1200 }}>{episodes[selected.episode]?.Overview ?? "No overview available"}</p>
						{row == Row.Overview && <span style={{ /* whiteSpace: "nowrap", */ lineBreak: "loose", wordBreak: "break-all" }}>{episodes[selected.episode]?.Path}</span>}
						{row == Row.Overview && episodes[selected.episode]?.MediaStreams ? episodes[selected.episode]?.MediaStreams!.map(_info => {
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
						{row == Row.Overview && episodes[selected.episode]?.MediaStreams ? episodes[selected.episode]?.MediaStreams!.map(info => <MediaStreamInfo info={info} />) : null}
					</div>
					<div>
						{episodes[selected.episode]?.People && (
							<div>{episodes[selected.episode]?.People?.map(peep => `${peep.Name} (${peep.Role})`).join("; ")}</div>
						)}
					</div>
				</div>
			</div>
			<Menu active={menuOpen} items={menu} onSubmit={menu_submit} onCancel={menu_cancel} />
		</div>
	);
}

type EpisodePanelProps = {
	episode: BaseItemDto;
	index: number;
	highlight_selected: boolean;
	selected: number;
	prevSelected: number;
};

function playEpisode(data: BaseItemDto, mutate: ScopedMutator, continue_playback: boolean) {
	if (!data.Id) return;
	/* return jellyfin.getMediaInfoApi(api).getPostedPlaybackInfo({
		// TODO: Improve this to better support remote playback.
		itemId: data.Id,
		userId: auth.User?.Id,
		enableDirectStream: true,
		enableDirectPlay: true,
		maxStreamingBitrate: 999_999_999_999,
		// startTimeTicks: continue_playback ? data.UserData?.PlaybackPositionTicks ?? 0 : 0,
	}).then(({ data : streamData }) => {
		if (streamData.MediaSources?.at(0)) {
			const source = streamData.MediaSources[0];
			// window.electronAPI.invoke("play_file", { file: data.Path, start: continue_playback ? (data.UserData?.PlaybackPositionTicks ?? 0) / TICKS_PER_SECOND : undefined, infoId: data.Id && { id: data.Id, type: "Jellyfin", session: streamData.PlaySessionId } }).then(() => {
		}
	}) */
	// TODO: Select best media source; Enable transcoding when remote; etc.
	playFile(`${api.basePath}/Videos/${data.Id}/stream?static=true&api_key=${auth.AccessToken}`, continue_playback ? (data.UserData?.PlaybackPositionTicks ?? 0) / TICKS_PER_SECOND : 0, data.Id ? { id: data.Id, type: "Jellyfin", /* session: streamData.PlaySessionId! */ } : undefined).then(() => {
		window.electronAPI.invoke("transport_command", { command: "Play" });
		mutate<VideoContextType>("mpv_state", (current) => {
			if (current) {
				return { ...current, jellyfinData: data };
			}
		});
	});
}

function calculateEpisodeTranslate(highlight_selected: boolean, index: number, selected: number) {
	// let translate;
	if (!highlight_selected) {
		return (index * (WIDTH + GAP)) - (selected * (WIDTH + GAP)) - 40;
	} else if (index < selected) {
		return (index * (WIDTH)) - (selected * (WIDTH)) - GAP; // Inactive scale(.9)
		// translate = (index * (WIDTH + GAP)) - (selected * (WIDTH + GAP)) - GAP;
	} else if (index == selected) {
		return (index * (WIDTH + GAP)) - (selected * (WIDTH + GAP));
	} else /* index > selected */ {
		return (index * (WIDTH)) - (selected * (WIDTH)) + GAP; // Inactive scale(.9)
		// translate = (index * (WIDTH + GAP)) - (selected * (WIDTH + GAP)) + GAP;
	}
	// return translate;
}

function EpisodePanel(props: EpisodePanelProps) {
	const { episode, index, highlight_selected: _highlight_selected, selected, prevSelected } = props;
	const highlightSelected = _highlight_selected;
	const ref = useRef<HTMLDivElement>(null);
	const anim = useRef<Animation>();
	// let translate: number;
	// const [highlightSelected, setHighlightSelected] = useState(_highlight_selected);
	// useLayoutEffect(() => {
	// 	setHighlightSelected(_highlight_selected);
	// }, [_highlight_selected]);
	const [showBackdrop, setBackdropVis] = useState(true);
	useInput(true, () => {
		setBackdropVis(false);
	}, []);
	useInputRelease(() => {
		setBackdropVis(true);
	}, true, []);
	const [shouldHighlight, setShouldHighlight] = useState(false);
	// const [translate, setTranslate] = useState(() => initialEpisodeTranslate(selected, prevSelected, _highlight_selected, index));
	// const animationSpeed = useContext(MovementSpeed);
	// const animate = useCallback(() => {}, []);
	const translate = useRef(initialEpisodeTranslate(selected, prevSelected, _highlight_selected, index));
	const wasHighlightSelected = useRef(_highlight_selected);
	const animate = useCallback((highlightSelected: boolean) => {
		/* Attempt 3? */
		// const intialPosition = highlightSelected ? calculateEpisodeTranslate(highlightSelected, index, selected) : initialEpisodeTranslate(selected, prevSelected, highlightSelected, index);
		const intialPosition = initialEpisodeTranslate(selected, prevSelected, highlightSelected, index);
		const endPosition = calculateEpisodeTranslate(highlightSelected, index, selected);
		if (ref.current) {
			// const finalStartPosition = translate.current == intialPosition ? endPosition : intialPosition;
			const finalStartPosition = intialPosition;
			anim.current = ref.current.animate([
				// { translate: `${translate.current == intialPosition ? endPosition : intialPosition}px` },
				/* (wasHighlightSelected.current && (!wasHighlightSelected.current && highlightSelected))
					|| !(!wasHighlightSelected.current && highlightSelected)
					&& !(wasHighlightSelected.current && highlightSelected) */ highlightSelected == wasHighlightSelected.current ? {
					translate: `${finalStartPosition}px`,
				} : {},
				{
					translate: `${endPosition}px`,
				},
			], {
				// duration: "var(--transition-standard)",
				duration: window.__INTERNAL_TELLYFIN_GAMEPAD__.transition || 0,
				// duration: 300,
				// easing: "var(--timing-function-ease)",
				easing: "cubic-bezier(0, 0.55, 0.45, 1)", // ease-out circle
				fill: "both",
				iterations: 1,
				composite: "replace",
			});
			translate.current = finalStartPosition;
			wasHighlightSelected.current = highlightSelected;
		}
	}, [index, selected, prevSelected])
	useLayoutEffect(() => {
		// if (ref.current) ref.current.style.transitionDuration = "0ms";
		/* Attempt 2? */
		// setTranslate(initialEpisodeTranslate(selected, prevSelected, _highlight_selected, index));
		// setShouldHighlight(false);
		/*  */
		// setHighlightSelected(true);
		// if (ref.current) { // Rendered already
		// 	setTranslate(calculateEpisodeTranslate(highlightSelected, index, prevSelected));
		// } else { // First Render
		// }
		// setTranslate(translate => {
		// 	return translate == intialPosition ? endPosition : intialPosition;
		// })
		animate(_highlight_selected);
	}, [_highlight_selected, animate]);
	// useEffect(() => {
	// 	// if (ref.current) ref.current.style.transitionDuration = "";
	// 	/* Was working (Attempt 2?) */
	// 	// setTranslate(calculateEpisodeTranslate(_highlight_selected, index, selected));
	// 	// setShouldHighlight(true);
	// 	/*  */
	// 	// setHighlightSelected(_highlight_selected);
	// }, [_highlight_selected, index, selected, prevSelected]);
	// const backgroundTransitionDelay = selected == index ? "0ms" : "2000ms";
	return (
		<>
			<BackdropImage {...props} item={props.episode} show={index == selected && showBackdrop} />
			<div className="episode-container" ref={ref} style={{
				zIndex: 5,
				/* Attempt 2 */
				// translate: `${translate}px`,
				/*  */
				/* display: index > startIndex && index < endIndex ? undefined : "none", */
			}}>
				{/* {menuOpen && index == selected ? <div style={{ position: "fixed", inset: 0, backdropFilter: "blur(60px)" }} /> : null} */}
				<ContentPanel scaleDownInactive state={highlightSelected /* && !(enter_pressed && selected == index) */ ? (selected == index ? PanelState.Active : PanelState.Inactive) : PanelState.None} width={WIDTH} height={HEIGHT}>
					<img
						decoding="async"
						src={`${api.basePath}/Items/${episode.Id}/Images/Primary?fillWidth=${WIDTH}&fillHeight=${HEIGHT}`}
						style={{
							objectFit: "cover",
							width: "100%",
							height: "100%",
						}} />
					{/* Selected: {selected}
					Previous: {prevSelected} */}
				</ContentPanel>
				{/* <span style={{ fontSize: 40, fontWeight: 600, whiteSpace: "nowrap" }}>{episode.Name}</span> */}
			</div>
		</>
	);
}

function initialEpisodeTranslate(selected: number, prevSelected: number, highlightSelected: boolean, index: number) {
	if (Math.max(prevSelected, selected) - Math.min(prevSelected, selected) > OVERDRAW + 4) {
		return calculateEpisodeTranslate(highlightSelected, index, selected);
	} else {
		return calculateEpisodeTranslate(highlightSelected, index, prevSelected);
	}
	// if (selected > prevSelected) { // (new)selected is to the right
	// } else if (selected < prevSelected) { // (new)selected is to the left
	// 	if (Math.max(prevSelected, selected) - Math.min(prevSelected, selected) > OVERDRAW + 4) {
	// 		return calculateEpisodeTranslate(highlightSelected, index, selected);
	// 	} else {
	// 		return calculateEpisodeTranslate(highlightSelected, index, prevSelected);
	// 	}
	// } else {
	// 	return calculateEpisodeTranslate(highlightSelected, index, selected);
	// }
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

const STEP = 25;

function seasonsFromEpisodes(episodes?: BaseItemDto[]) {
	if (episodes) {
		////// This *would* work if the highlight-selected-season/jump-to-episode-of-season code worked with it.
		// return [...episodes]
		// 	.map(value => ({ Name: value.SeasonName!, Id: value.SeasonId! }))
		// 	.filter((v, i, arr) => {
		// 		if (arr[i - 1]) return v.Id != arr[i - 1].Id;
		// 		return true;
		// 	});
		//////
		// return episodes.reduce((prev, curr, index, arr) => {
		// 	return prev;
		// }, [] as BaseItemDto[]);
		// return episodes.reduce((prev, curr, index, arr) => {});
		// const seasonsList: [string, string][] = [];
		// for (let i = 0; i < episodes.length; i += STEP) {
		// 	await new Promise<void>((ok) => setTimeout(() => {
		// 		seasonsList.push(...episodes.slice(i, i + STEP).map(episode => [episode.SeasonId!, episode.SeasonName!] as [string, string]));
		// 		ok();
		// 	}, 0));
		// }
		const seasonsList = new Map();
		// episodes.forEach(episode => seasonsList.set(episode.SeasonId!, episode.SeasonName!));
		for (const episode of episodes!) {
			seasonsList.set(episode.SeasonId, episode.SeasonName);
		}
		// const array = Array.from(new Map(seasonsList));
		// const array = seasonsList;
		const array = Array.from(seasonsList);
		// let final: BaseItemDto[] = [];
		// for (let i = 0; i < array.length; i += STEP) {
		// 	await new Promise<void>((ok) => setTimeout(() => {
		// 		final.push(...array.slice(i, i + STEP).map(([Id, Name]) => ({
		// 			Name,
		// 			Id,
		// 		} as BaseItemDto)));
		// 		ok();
		// 	}, 0));
		// }
		const final = array.map(([Id, Name]) => ({
			Name,
			Id,
		} as BaseItemDto));
		return final;
	} else {
		return episodes;
	}
}

/**
 * TODO: Pagination?
 */
async function getEpisodes(seriesId: Id) {
	const getTvShows = jellyfin.getTvShowsApi(api);
	let res = await getTvShows.getEpisodes({
		seriesId,
		userId: auth.User!.Id!,
		isMissing: false,
		limit: 1,
		fields: [],
	});
	const total = res.data.TotalRecordCount;
	if (!total) return [];
	let all: BaseItemDto[] = [];
	for (let startIndex = 0; startIndex < total; startIndex += STEP) {
		await new Promise<void>((ok) => setTimeout(async () => {
			let { data } = await getTvShows.getEpisodes({
				// Auth
				seriesId,
				userId: auth.User!.Id!,
				// Pagination
				limit: STEP,
				startIndex: startIndex,
				// Query
				isMissing: false,
				imageTypeLimit: 1,
				enableUserData: true,
				sortBy: "ParentIndexNumber",
				// TODO: Fetch some of these when the file is played
				fields: ["ItemCounts", "PrimaryImageAspectRatio", "MediaSourceCount", "Overview", "Path", "SpecialEpisodeNumbers", "MediaStreams", "OriginalTitle", "MediaSourceCount", "MediaSources", "Chapters"]
			});
			console.log(data);
			if (data.Items) all.push(...data.Items);
			ok();
		}, 0));
	}
	return all;
}

async function getContinueWatching(seriesId: Id) {
	jellyfin.getItemsApi(api).getResumeItems({
		userId: auth.User?.Id,
		parentId: seriesId,
		limit: 1,
		includeItemTypes: ["Episode"],
	})
}

function getDefaultSelected(episodes?: BaseItemDto[]) {
	return episodes?.reduce((bestIndex, current, currentIndex, arr) =>
		(arr[bestIndex]?.UserData?.LastPlayedDate
			&& current.UserData?.LastPlayedDate
			&& arr[bestIndex].UserData.LastPlayedDate > current.UserData.LastPlayedDate) ? bestIndex : currentIndex, 0);
}

export function BackdropImage(props: { selected: number, index: number, item: BaseItemDto; previous?: boolean; show: boolean; }) {
	const { selected, index, item, previous, show } = props;
	const imgRef = useRef<HTMLImageElement>(null);
	const [isLoaded, setLoaded] = useState(imgRef.current?.complete ?? false);
	const onLoaded = useCallback(() => {
		setLoaded(true);
	}, []);
	return (
		<div style={{
			position: "fixed",
			inset: 0,
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			width: "100vw",
			height: "100vh",
			zIndex: index == selected ? -10 : -15,
			opacity: (show || previous) && isLoaded ? 1 : 0,
			transitionDuration: "var(--transition-long)",
			// transitionDelay: backgroundTransitionDelay,
			// transitionDelay: previous ? "10s" : "var(--transition-standard)",
		}}>
			<img ref={imgRef} src={`${api.basePath}/Items/${item.Id}/Images/Primary?fillWidth=${SCREEN_WIDTH * 1.2}&blur=800`} style={{
				position: "fixed",
				top: "-10vh",
				left: "-10vw",
				width: "120vw",
				height: "120vh",
				objectFit: "cover",
				// backgroundImage: 
				// backgroundSize: "100%",
				// backgroundPosition: selected == index ? "center" : selected > index ? "40%" : "60%",
				translate: selected == index ? "0px" : selected > index ? "-10vw" : "10vw",
				// transitionProperty: "translate, z-index",
				transitionDuration: "var(--transition-long)",
				// transitionDelay: "var(--transition-standard)",
				zIndex: index == selected ? -10 : -15,
			}} onLoad={onLoaded} />
			<div style={{
				position: "fixed",
				// inset: 0,
				top: "-10vh",
				left: "-10vw",
				width: "120vw",
				height: "120vh",
				zIndex: -10,
				// backdropFilter: "blur(200px)",
				background: "rgba(0, 0, 0, 0.6)",
			}} />
		</div>
	)
}