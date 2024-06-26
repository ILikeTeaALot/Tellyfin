import { SVGProps, useId } from "preact/compat";

export const PlaylistIcon = (props: SVGProps<SVGSVGElement>) => {
	return (
		<svg
			width="1em"
			height="1em"
			viewBox="0 0 64 64"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			{...props}
		>
			<title>{"Playlists; Drag something here to quickly add it to a playlist."}</title>
			<g
				stroke="none"
				strokeWidth={1}
				fill="none"
				fillRule="evenodd"
			>
				<polygon fill="#7F7F7F" points="26 26 39 26 39 28 26 28" />
				<rect fill="#7F7F7F" x={21} y={26} width={2} height={2} />
				<rect fill="#7F7F7F" x={21} y={31} width={2} height={2} />
				<rect fill="#7F7F7F" x={21} y={36} width={2} height={2} />
				<polygon fill="#7F7F7F" points="26 31 42 31 42 33 26 33" />
				<polygon fill="#7F7F7F" points="26 36 34 36 34 38 26 38" />
				<path
					d="M38.5857864,12 L47,20.4142136 L47,52 L17,52 L17,12 L38.5857864,12 Z"
					stroke="#979797"
					strokeWidth={2}
				/>
				<path
					d="M39.5857864,13 L46,19.4142136 L46,20 L39,20 L39,13 L39.5857864,13 Z"
					stroke="#979797"
					strokeWidth={2}
				/>
			</g>
		</svg>
	);
};

export default PlaylistIcon;