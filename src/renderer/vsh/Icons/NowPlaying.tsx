import type { SVGProps } from "preact/compat";

export const SoundBars = (props: SVGProps<SVGSVGElement> & { state: string; }) => (
	<div className="sound-bars">
		{props.state === "stop" ? null : <svg
			width="1rem"
			height="1rem"
			viewBox="0 0 32 32"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			{...props}
		>
			<title>{"Now Playing"}</title>
			<g
				id="Now-Playing"
				stroke="none"
				strokeWidth={1}
				fill="none"
				fillRule="evenodd"
			>
				<polygon id="Rectangle" fill="var(--accent-primary)" points="2 18 6 18 6 28 2 28" />
				<polygon id="Rectangle" fill="var(--accent-primary)" points="8 11 12 11 12 28 8 28" />
				<polygon id="Rectangle" fill="var(--accent-primary)" points="14 8 18 8 18 28 14 28" />
				<polygon id="Rectangle" fill="var(--accent-primary)" points="20 15 24 15 24 28 20 28" />
				<polygon id="Rectangle" fill="var(--accent-primary)" points="26 11 30 11 30 28 26 28" />
			</g>
		</svg>}
	</div>
);