import type { ComponentChildren } from "preact";
import { useInput } from "../../hooks";
import { useCallback, useRef, useState } from "preact/hooks";

import "./scroll.css";

type ScrollAreaProps = {
	active: boolean;
	children: ComponentChildren;
	width?: number;
	height?: number;
};

/**
 * For scrolling vertical content.
 */
export function ScrollArea(props: ScrollAreaProps) {
	const { active } = props;
	const scrollArea = useRef<HTMLDivElement>(null);
	const content = useRef<HTMLDivElement>(null);
	const [scrollPosition, setScrollPosition] = useState(0);
	const scrollUp = useCallback((px: number) => {
		if (!scrollArea.current || !content.current) return;
		const scrollHeight = scrollArea.current.clientHeight;
		const contentHeight = content.current.clientHeight;
		if (contentHeight > scrollHeight) {
			setScrollPosition(current => {
				return Math.max(current - px, 0);
			});
		}
	}, []);
	const scrollDown = useCallback((px: number) => {
		if (!scrollArea.current || !content.current) return;
		const scrollHeight = scrollArea.current.clientHeight;
		const contentHeight = content.current.clientHeight;
		if (contentHeight > scrollHeight) {
			const max = contentHeight - scrollHeight;
			setScrollPosition(current => {
				return Math.min(current + px, max);
			});
		}
	}, []);
	useInput(active, (button) => {
		switch (button) {
			case "PadUp":
			case "ArrowUp":
				scrollUp(80);
				return;
			case "PadDown":
			case "ArrowDown":
				scrollDown(80);
				return;
		}
	}, [scrollDown]);
	return (
		<div class="scroll-area" style={{ width: props.width, height: props.height }} ref={scrollArea}>
			<div class="content" style={{ translate: `0px ${-scrollPosition}px` }} ref={content}>
				{props.children}
			</div>
		</div>
	);
}