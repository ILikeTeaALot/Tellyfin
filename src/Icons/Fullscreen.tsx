import type { SVGProps } from "preact/compat";

export const FullscreenIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		width="1em"
		height="1em"
		viewBox="0 0 32 32"
		xmlns="http://www.w3.org/2000/svg"
		xmlnsXlink="http://www.w3.org/1999/xlink"
		{...props}
	>
		<title>{"Enter Fullscreen"}</title>
		<g
			id="Fullscreen"
			stroke="none"
			strokeWidth={1}
			fill="none"
			fillRule="evenodd"
		>
			<rect
				id="Rectangle"
				stroke="#979797"
				strokeWidth={3}
				x={9.5}
				y={11.5}
				width={13}
				height={9}
			/>
			<polygon
				id="Path-70"
				fill="#D8D8D8"
				points="10 28 2 28 2 21 5 21 5 25 10 25"
			/>
			<polygon
				id="Path-71"
				fill="#D8D8D8"
				points="22 28 22 25 27 25 27 21 30 21 30 28"
			/>
			<polygon
				id="Path-72"
				fill="#D8D8D8"
				points="27 11 30 11 30 4 22 4 22 7 27 7"
			/>
			<polygon
				id="Path-73"
				fill="#D8D8D8"
				points="5 11 2 11 2 4 10 4 10 7 5 7"
			/>
		</g>
	</svg>
);