import type { ComponentChildren } from "preact";
import { useRef, useState, useEffect } from "preact/hooks";

export interface OverflowTextScrollProps {
	/** Whether or not to enable scrolling. By default offset resets when inactive. */
	active?: boolean;
	children: ComponentChildren;
	className?: HTMLSpanElement["className"];
	id?: HTMLSpanElement["id"];
	/** Time between item becoming active and scrolling, and pause between scrolls. In milliseconds */
	delay?: number;
	/** Scroll rate, in pixels/second */
	speed?: number;
}

const DEFAULT_DELAY_COUNTDOWN = 1000;

export const OverflowTextScroll = (props: OverflowTextScrollProps) => {
	const { speed, active } = props;
	const delay = props.delay || DEFAULT_DELAY_COUNTDOWN;
	const container = useRef<HTMLSpanElement>(null);
	const frame = useRef<number | undefined>();
	const last = useRef(performance.now());
	/** Milliseconds */
	const countdown = useRef(delay);
	const [style, setStyle] = useState<CSSStyleDeclaration>();
	const [offset, setOffset] = useState(0);
	const [shouldScroll, setShouldScroll] = useState(false);

	useEffect(() => {
		// console.debug(style?.fontSize);
		// console.debug(parseInt(style?.fontSize || ""));
		if (active && container.current) {
			if (container.current.parentElement) {
				if (container.current.clientWidth > container.current.parentElement.clientWidth) {
				}
			}
		}
		if (shouldScroll && active) {
			const animate = (now: DOMHighResTimeStamp) => {
				// const now = performance.now();
				/** Should be around 1÷60 ≈ 16.66... */
				// const deltaSTATIC = 16.67 / 1000;
				const delta = (now - last.current) / 1000;
				// const delta = (now - last.current) / 1000;
				if (delta > 0 && container.current) {
					// console.debug("∂ arg", deltaHRT);
					// console.debug("∂", delta);
					if (countdown.current > 0) {
						// console.debug("countdown:", countdown.current);
						countdown.current = countdown.current - Math.min(delta * 1000, 100);
					} else {
						const newOffset = offset + delta * ((speed || 0) / 60);
						// console.debug(newOffset);
						if (newOffset > container.current.clientWidth + 50) {
							countdown.current = delay;
							setOffset(0);
						} else {
							setOffset(newOffset);
						}
					}
				}
				last.current = now;
				frame.current = requestAnimationFrame(animate);
			};
			frame.current = requestAnimationFrame(animate);
		} else {
			countdown.current = delay;
			setOffset(0);
			setShouldScroll(false);
		}
		return () => cancelAnimationFrame(frame.current as number);
	}, [offset, shouldScroll, style, speed, delay, active]);

	useEffect(() => {
		if (container.current) {
			setStyle(getComputedStyle(container.current));
		}
	}, [container.current?.style]);

	useEffect(() => {
		if (active && container.current && style) {
			const em = parseFloat(style.fontSize);
			// console.debug("1em =", em);
			if (container.current.parentElement && em) {
				const newShouldScroll = active && container.current.clientWidth > container.current.parentElement.clientWidth - 2 * em;
				setShouldScroll(newShouldScroll);
				return;
			}
		} else {
			setShouldScroll(false);
			setOffset(0);
			countdown.current = delay;
		}
	}, [style, active, delay, props.children]);

	useEffect(() => {
		if (active) {

		} else {
			setShouldScroll(false);
			setOffset(0);
			countdown.current = delay;
		}
	}, [active, delay]);

	return (
		<span id={props.id} data-active={active} className={`${props.className ? props.className + " " : ""}text-scroll-container`}>
			<span ref={container} style={{ transform: `translateX(${-offset}px)`, /* transitionDuration: "100ms" */ }}>
				{props.children}
			</span>
		</span>
	);
};