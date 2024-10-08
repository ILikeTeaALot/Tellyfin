import "./scene-search.css";
import { InputProps } from "../Input";
import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "preact/hooks";
import { useInput } from "../../hooks";
import VideoState from "../../context/VideoContext";
import { ContentPanel, PanelState } from "../Panel";
import { type BaseItemDto, type ChapterInfo } from "@jellyfin/sdk/lib/generated-client/models";
import { TICKS_PER_SECOND } from "../../util/functions";
import { Timeline } from "../Timeline";

export type ChapterInterval = {
	/**
	 * Interval in seconds.
	 * 
	 * -1 = Video Chapters
	 */
	interval: number;
	label: string;
};

export type ChapterData = {
	image: null; // TODO
	title: string | null;
	time: number;
};

export type ChapterSelectProps = InputProps<number> & {
	/**
	 * Technically this is currently just used to ensure that there is in fact Jellyfin data...
	 * 
	 * This might be changed to optional when MPV-based chapter/scene support works properly.
	 */
	data?: BaseItemDto;
	// chapters: Array<[ChapterInterval, Array<ChapterData>]>;
};

const WIDTH = 320;
const HEIGHT = 180;
const GAP = 40;

/**
 * TODO: replace in-code absolute positions with CSS ones (possibly calculated with CSS --vars)
 * 
 * @param props 
 * @returns 
 */
export function SceneSearch(props: ChapterSelectProps) {
	// Props
	const { active, default: _default, onCancel: cancel, onSubmit: _submit } = props;
	const wasActive = useRef(active);
	// Context
	const videoState = useContext(VideoState);
	const chapters = useMemo(() => videoState.jellyfinData?.Chapters ?? videoState.chapters ?? [], [videoState.jellyfinData?.Chapters, videoState.chapters]);
	const position = videoState.position.time.position ?? 0;
	const duration = videoState.position.time.duration ?? 0;
	// Intervals
	const [intervals, setIntervals] = useState(getIntervals(chapters, duration));
	useEffect(() => setIntervals(getIntervals(chapters, duration)), [chapters, duration]);
	// States
	const [selectedScene, setScene] = useState(_default);
	const [selectedInterval, setInterval] = useState(0);
	useEffect(() => setInterval(interval => Math.max(Math.min(interval, intervals.length - 1), 0)), [intervals]);
	const [disableTransition, setTransitionDisabled] = useState(true);
	// "Constants"
	const StartPositionTicks = videoState.jellyfinData?.Chapters?.[selectedScene]?.StartPositionTicks;
	const currentStartPosition = StartPositionTicks ? (StartPositionTicks / TICKS_PER_SECOND) : videoState.chapters?.[selectedScene]?.time ?? 0;
	// if (!intervals[selectedInterval]) {
	// 	return null;
	// }
	const interval: number | undefined = intervals[selectedInterval]?.interval;
	// Time
	const [timeValue, setTime] = useState(videoState.position.time.position ?? 0);
	const [displayTime, setDisplayTime] = useState(timeValue);
	useLayoutEffect(() => {
		if ((active && !wasActive.current) || !active) {
			setScene(_default);
			setTransitionDisabled(true);
		}
	}, [active, _default]);
	useEffect(() => {
		wasActive.current = active;
	}, [active]);
	useEffect(() => {
		if (disableTransition) setTransitionDisabled(false);
	}, [disableTransition])
	// Callbacks
	const submit = useCallback(() => {
		const seconds = interval == -1 ? (
			(currentStartPosition ?? -1)
		) : timeValue;
		if (seconds >= 0) _submit(seconds);
		// if (chapters) {
		// }
	}, [_submit, currentStartPosition, interval, timeValue]);
	// `position` changes every ~10 seconds when the video is player. We don't want `time` to ever be changed outside of user control.
	useEffect(() => setTime(position), [active]); // eslint-disable-line react-hooks/exhaustive-deps
	// useEffect(() => setDisplayTime(timeValue), [duration, position]);
	// Same as the setTime hook.
	/* eslint-disable react-hooks/exhaustive-deps */
	useEffect(() => {
		if (!active) {
			let id = setTimeout(() => setScene(_default), 500);
			return () => clearTimeout(id);
		}
	}, [active]);
	// Submit
	useEffect(() => {
		if (interval == -1) {
			const time = currentStartPosition;
			if (time || time == 0) {
				setDisplayTime(time);
			}
		} else {
			setDisplayTime(timeValue);
		}
	}, [selectedScene, selectedInterval, interval, timeValue, currentStartPosition]);
	useInput(active, (button) => {
		switch (button) {
			case "PadLeft":
			case "ArrowLeft":
				if (interval == -1) {
					setScene(current => Math.max(current - 1, 0));
				} else {
					setTime(current => Math.max(current - interval, 0));
				}
				return;
			case "PadRight":
			case "ArrowRight":
				if (interval == -1) {
					setScene(current => Math.min(current + 1, (chapters.length ?? 1) - 1));
				} else {
					setTime(current => Math.min(current + interval, duration));
				}
				return;
		}
	}, [interval, chapters, duration]);
	useInput(active, (button) => {
		switch (button) {
			case "PadUp":
			case "ArrowUp":
				setInterval(current => Math.min(current + 1, intervals.length - 1));
				return;
			case "PadDown":
			case "ArrowDown":
				setInterval(current => Math.max(current - 1, 0));
				return;
		}
	}, [intervals]);
	useInput(active, (button) => {
		switch (button) {
			case "Enter":
				submit();
				return;
			case "Back":
			case "Backspace":
				cancel();
		}
	}, [submit, cancel]);
	// if (intervals.length == 0) {
	// 	cancel();
	// 	return null;
	// }
	if (typeof interval == "undefined") {
		return null;
	}
	// if (!videoState.position.time.duration) return null;
	// if (!videoState.jellyfin_data && !videoState.chapters) return null;
	if (videoState.chapters) return (
		<div class="scene-search" style={{ opacity: active ? 1 : 0, height: (interval == -1 ? (GAP * 3) + (40 + 20) + 180 : 40) + 80 }}>
			<div class="interval">
				{intervals.map((interval, index) => (
					<span style={{
						opacity: selectedInterval == index ? 1 : 0,
						translate: `0px ${(selectedInterval - index) * 40}px`,
					}}>
						{interval.label}
					</span>
				))}
			</div>
			<div class="scenes" style={{
				opacity: interval == -1 ? 1 : 0,
				transformOrigin: "top center",
				position: "absolute",
				top: 20 + 60 + GAP
			}}>{videoState.jellyfinData?.Chapters ? videoState.jellyfinData.Chapters.map((scene, index) => {
				return (
					<div class="scene" style={{
						translate: `${index * (WIDTH + GAP) - (WIDTH / 2) - ((selectedScene) * (WIDTH + GAP)) + (index < selectedScene ? -20 : index > selectedScene ? 20 : 0)}px`,
						transitionDuration: disableTransition ? "0ms" : undefined,
					}}>
						<ContentPanel key={scene.ImageTag ?? scene.StartPositionTicks ?? index} style={{
							transitionDuration: disableTransition ? "0ms" : undefined,
						}} state={index == selectedScene ? PanelState.Active : PanelState.Inactive} width={WIDTH} height={/* videoState.jellyfin_data?.AspectRatio ? WIDTH / videoState.jellyfin_data.AspectRatio : */ HEIGHT}>
							<img
								decoding="async"
								src={`xb-image://media-server_${videoState.jellyfinData?.ServerId}/Items/${videoState.jellyfinData?.Id}/Images/Chapter/${index}?fillWidth=${WIDTH * 2}&fillHeight=${HEIGHT * 2}&tag=${scene.ImageTag}`}
								style={{
									objectFit: "cover",
									width: "100%",
									height: "100%",
								}}
							/>
						</ContentPanel>
					</div>
				);
			}) : videoState.chapters ? videoState.chapters.map((scene, index) => {
				return (
					<div class="scene" style={{
						translate: `${index * (WIDTH + GAP) - (WIDTH / 2) - ((selectedScene) * (WIDTH + GAP)) + (index < selectedScene ? -20 : index > selectedScene ? 20 : 0)}px`,
						transitionDuration: disableTransition ? "0ms" : undefined,
					}}>
						<ContentPanel key={scene.image ?? index} style={{
							transitionDuration: disableTransition ? "0ms" : undefined,
						}} state={index == selectedScene ? PanelState.Active : PanelState.Inactive} width={WIDTH} height={/* videoState.jellyfin_data?.AspectRatio ? WIDTH / videoState.jellyfin_data.AspectRatio : */ HEIGHT}>
							
						</ContentPanel>
					</div>
				);
			}) : null}</div>
			<span class="scene-title" style={{
				display: "flex",
				opacity: interval == -1 ? 1 : 0,
				position: "absolute",
				top: 20 + 60 + GAP + 180 + GAP,
				// bottom: GAP + 80 + GAP,
				// scale: interval == -1 ? "1 1" : "1 0",
				transformOrigin: "bottom center",
				// translate: interval == -1 ? "0px" : `0px -${GAP + 180 + GAP}px`,
			}}>{videoState.chapters[selectedScene]?.title || `Scene ${selectedScene + 1}`}</span>
			<div style={{ display: "flex", right: 100, bottom: 80, marginLeft: "auto", position: "absolute" }}>
				<Timeline mini position={displayTime} duration={videoState.position.time.duration} />
			</div>
		</div>
	);
	return null;
	// return (
	// 	<div class="scene-search" style={{ opacity: active ? 1 : 0, height: (interval == -1 ? (GAP * 3) + (40 + 20) + 180 : 40) + 80 }}>
	// 		<div class="interval">
	// 			{intervals.map((interval, index) => (
	// 				<span style={{
	// 					opacity: selectedInterval == index ? 1 : 0,
	// 					translate: `0px ${(selectedInterval - index) * 40}px`,
	// 				}}>
	// 					{interval.label}
	// 				</span>
	// 			))}
	// 		</div>
	// 		<div class="scenes">{videoState.chapters.map((scene, index) => {
	// 			return (
	// 				<div class="scene" style={{
	// 					translate: `${index * (WIDTH + GAP) - (WIDTH / 2) - ((selectedScene) * (WIDTH + GAP)) + (index < selectedScene ? -20 : index > selectedScene ? 20 : 0)}px`
	// 				}}>
	// 					<ContentPanel key={index} state={index == selectedScene ? PanelState.Active : PanelState.Inactive} width={WIDTH} height={/* videoState.jellyfin_data?.AspectRatio ? WIDTH / videoState.jellyfin_data.AspectRatio : */ HEIGHT}>
	// 						{/* <img
	// 							decoding="async"
	// 							src={`${api.basePath}/Items/${videoState.jellyfin_data?.Id}/Images/Chapter/${index}?fillWidth=${WIDTH * 2}&fillHeight=${HEIGHT * 2}&tag=${scene.ImageTag}`}
	// 							// src={episode.}
	// 							style={{
	// 								objectFit: "cover",
	// 								width: "100%",
	// 								height: "100%",
	// 							}}
	// 						/> */}
	// 					</ContentPanel>
	// 				</div>
	// 			);
	// 		})}</div>
	// 		{/* <span>{videoState.chapters[selectedScene].title ?? `Chapter ${selectedScene + 1}`}</span> */}
	// 		<span class="scene-title" style={{
	// 			display: "flex",
	// 			opacity: interval == -1 ? 1 : 0,
	// 			position: "absolute",
	// 			top: 20 + 60 + GAP + 180 + GAP,
	// 			// bottom: GAP + 80 + GAP,
	// 			// scale: interval == -1 ? "1 1" : "1 0",
	// 			transformOrigin: "bottom center",
	// 			// translate: interval == -1 ? "0px" : `0px -${GAP + 180 + GAP}px`,
	// 		}}>{videoState.chapters[selectedScene]?.title ?? `Scene ${selectedScene + 1}`}</span>
	// 		<div style={{ display: "flex", right: 100, bottom: 80, marginLeft: "auto", position: "absolute" }}>
	// 			<Timeline mini position={displayTime} duration={videoState.position.time.duration} />
	// 		</div>
	// 	</div>
	// );
}

function getIntervals(chapters: (ChapterInfo | ChapterData)[], duration: number): ChapterInterval[] {
	if (!duration) return [];
	let intervals: Array<ChapterInterval> = [];
	if (chapters.length > 0) {
		intervals.push({ interval: -1, label: "Scenes" });
	}
	if (duration > 60) {
		intervals.push({ interval: 5, label: "5 Seconds" });
	}
	if (duration > 60) {
		intervals.push({ interval: 15, label: "15 Seconds" });
	}
	if (duration > 60 * 4) {
		intervals.push({ interval: 30, label: "30 Seconds" });
	}
	if (duration > 60 * 5) {
		intervals.push({ interval: 60, label: "1 Minute" });
	}
	if (duration > 60 * 20) {
		intervals.push({ interval: 5 * 60, label: "5 Minutes" });
	}
	if (duration > 60 * 40) {
		intervals.push({ interval: 10 * 60, label: "10 Minutes" });
	}
	// 1 Hour
	if (duration > 60 * 60) {
		intervals.push({ interval: 15 * 60, label: "15 Minutes" });
	}
	// 2 Hours
	if (duration > 60 * 120) {
		intervals.push({ interval: 30 * 60, label: "30 Minutes" });
	}
	// 3 Hours
	if (duration > 60 * 180) {
		intervals.push({ interval: 60 * 60, label: "60 Minutes" });
	}
	return intervals;
}
