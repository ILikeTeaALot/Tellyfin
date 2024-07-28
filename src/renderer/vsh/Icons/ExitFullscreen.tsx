import type { SVGProps } from "preact/compat";

export const ExitFullscreenIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		width="1em"
		height="1em"
		viewBox="0 0 32 32"
		xmlns="http://www.w3.org/2000/svg"
		xmlnsXlink="http://www.w3.org/1999/xlink"
		{...props}
	>
		<title>{"Exit Fullscreen"}</title>
		<g
			id="Fullscreen-Exit"
			stroke="none"
			strokeWidth={1}
			fill="none"
			fillRule="evenodd"
		>
			<polygon
				id="Path-70"
				fill="#D8D8D8"
				points="29 13 20 13 20 5 23 5 23 10 29 10"
			/>
			<polygon
				id="Path-71"
				fill="#D8D8D8"
				points="3 13 3 10 9 10 9 5 12 5 12 13"
			/>
			<polygon
				id="Path-72"
				fill="#D8D8D8"
				points="9 27 12 27 12 19 3 19 3 22 9 22"
			/>
			<polygon
				id="Path-73"
				fill="#D8D8D8"
				points="23 27 20 27 20 19 29 19 29 22 23 22"
			/>
		</g>
	</svg>
);