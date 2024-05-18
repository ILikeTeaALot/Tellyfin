import "./timeline.css";
import { refresh_mpv, toHMS } from "../util/functions";
import { useContext, useEffect, useRef, useState } from "preact/hooks";
import VideoState, { PlaybackStatus } from "../context/VideoContext";

export type TimelineProps = {
	position: number;
	duration: number | null;
	mini?: boolean;
};

const UPDATE_FREQUENCY = 6; // 6Hz

export function Timeline(props: TimelineProps) {
	const { position, duration, mini } = props;

	const remaining = duration ? duration - position : -0;

	const mpvState = useContext(VideoState);

	const playState = mpvState.status.playback_status;

	const frame = useRef<number>(-1);
	const last = useRef<number>(0);
	const elapsed = useRef<number>(position);

	const [elapsedSeconds, setElapsedSeconds] = useState(elapsed.current);

	// Set the timeline fill/cursor position with the most up-to-date value when mpd_status changes
	useEffect(() => {
		elapsed.current = position * 1000;
		setElapsedSeconds(Math.round((elapsed.current / 1000)));
	}, [position]);

	// Advance the timeline fill/cursor position every frame
	useEffect(() => {
		const updateTimeline: FrameRequestCallback = (time) => {
			const delta = time - last.current;
			if (playState == PlaybackStatus.Playing) {
				elapsed.current += delta;
				if (elapsed.current > (duration ?? elapsed.current)) {
					refresh_mpv();
				}
				setElapsedSeconds(Math.round((elapsed.current / 1000)));
			}
			frame.current = requestAnimationFrame(updateTimeline);
			last.current = performance.now();
		};
		frame.current = requestAnimationFrame(updateTimeline);
		return () => cancelAnimationFrame(frame.current);
	}, [duration, position, playState]);

	return (
		<div className={mini ? "timeline small" : "timeline"}>
			<span>T {toHMS(elapsedSeconds)}</span>
			<div className="bar">
				<div className="fill" style={{ width: duration ? `${(elapsedSeconds / duration) * 100}%` : "100%" }} />
			</div>
			<span>-{toHMS(remaining)}</span>
		</div>
	);
}