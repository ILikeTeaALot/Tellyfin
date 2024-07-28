import { useCallback, useEffect } from "preact/hooks";
import "./coldboot.css";
import type { JSX } from "preact/jsx-runtime";

export function Coldboot({ run, onComplete }: { run: boolean; onComplete: () => void; }) {
	useEffect(() => {
		if (run) {
			window.electronAPI.invoke("play_feedback", { sound: "Coldboot" });
		}
	}, [run]);
	// const animationIndex = useRef(0);
	const onAllAnimationEnd = useCallback(() => {
		onComplete();
		window.electronAPI.invoke("play_background");
	}, [onComplete]);
	const onAnimationEnd = useCallback((e: JSX.TargetedAnimationEvent<HTMLSpanElement>) => {
		e.stopPropagation();
		// animationIndex.current++;
		// if (animationIndex.current == 3) {
		// }
	}, []);
	return (
		<div class="coldboot" onAnimationEnd={onAllAnimationEnd}>
			{/* <span>Tellyfin</span> */}
			<span class="credit" onAnimationEnd={onAnimationEnd}>Super Computer Entertainment</span>
			<span class="license" onAnimationEnd={onAnimationEnd}>{
				// white-space: pre;
				`Tellyfin is distributed under the
				GNU Affero General Public Licence
				Version 3 and Later.

				Go to [System Settings › About Tellyfin]
				for more information.`

				// You can change this message in Welcome.toml
			}</span>
		</div>
	);
}