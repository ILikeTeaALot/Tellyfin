import "./timeline.css";
import { refresh_mpv, toHMS } from "../util/functions";
import { useContext, useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import VideoState, { PlaybackStatus } from "../context/VideoContext";

export type TimelineProps = {
	position: number;
	duration: number | null;
	mini?: boolean;
	realtime?: boolean;
	showChapter?: boolean;
};

// const UPDATE_FREQUENCY = 6; // 6Hz

export function Timeline(props: TimelineProps) {
	const { position, duration: duration_seconds, mini, realtime, showChapter } = props;
	
	const mpvState = useContext(VideoState);
	
	const playState = mpvState.status.playback_status;
	
	const play_state = useRef<PlaybackStatus>(playState);

	const chapters = useRef(mpvState.chapters);
	
	const frame = useRef<number>(-1);
	const last_ms = useRef<number>(0);
	const elapsed_ms = useRef<number>(position * 1000);
	
	const [elapsed_seconds, setElapsedSeconds] = useState(position ?? 0);
	const [chapter, setChapter] = useState(mpvState.position?.chapter ?? 0);

	const remaining_seconds = duration_seconds ? duration_seconds - elapsed_seconds : 0;

	// Set the timeline fill/cursor position with the most up-to-date value when mpd_status changes
	useEffect(() => {
		elapsed_ms.current = position * 1000;
		//                                                   Effectively ound to nearest second/UPDATE_FREQ
		// setElapsedSeconds(Math.round((elapsed.current / 1000) * UPDATE_FREQUENCY) / UPDATE_FREQUENCY);
		setElapsedSeconds(position);
	}, [position]);

	useEffect(() => {
		setChapter(mpvState.position.chapter ?? 0);
	}, [mpvState.position.chapter]);

	useLayoutEffect(() => {
		chapters.current = mpvState.chapters;
	}, [mpvState]);

	useLayoutEffect(() => {
		play_state.current = playState;
	}, [playState]);

	// Advance the timeline fill/cursor position every frame
	useEffect(() => {
		if (!realtime) return;
		const updateTimeline: FrameRequestCallback = () => {
			const delta_ms = performance.now() - last_ms.current;
			if (play_state.current == PlaybackStatus.Playing) {
				elapsed_ms.current += delta_ms;
				if (duration_seconds) if (elapsed_ms.current > duration_seconds * 1000) {
					refresh_mpv();
				}
				if (chapters.current.length > 0 && chapters.current.length < 10000) {
					setChapter(Math.max(chapters.current.findIndex(value => value.time > elapsed_ms.current / 1000) - 1, 0));
				}
				setElapsedSeconds(elapsed_ms.current / 1000);
				// setElapsedSeconds(Math.round((elapsed.current / 1000) /* * UPDATE_FREQUENCY */) /* / UPDATE_FREQUENCY */);
			}
			// frame.current = requestAnimationFrame(updateTimeline);
			last_ms.current += delta_ms;
		};
		// frame.current = requestAnimationFrame(updateTimeline);
		// return () => cancelAnimationFrame(frame.current);
		frame.current = setInterval(updateTimeline, 100);
		return () => clearInterval(frame.current);
	}, [duration_seconds, realtime]);

	// const chapter = mpvState.position.chapter;

	return (
		<div className={mini ? "timeline small" : "timeline"}>
			{showChapter && mpvState.media_type.type != "CD" && mpvState.chapters.length < 10000 && <span> Chapter {chapter + 1}</span>}
			<div />
			{/* {chapter ? <span>{mpvState.jellyfin_data?.Chapters?.[chapter ?? 0]?.Name ?? mpvState.chapters[chapter ?? 0].title ?? `Chapter ${chapter}`}</span> : null} */}
			{/* <span>{`Chapter ${chapter}`}</span> */}
			<span>T {toHMS(elapsed_seconds)}</span>
			<div className="bar">
				<div className="fill" style={{ width: duration_seconds ? `${(elapsed_seconds / duration_seconds) * 100}%` : "100%" }} />
			</div>
			<span>-{toHMS(remaining_seconds)}</span>
		</div>
	);
}