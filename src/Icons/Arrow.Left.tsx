import { SVGProps } from "preact/compat";

export const Left = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		xmlnsXlink="http://www.w3.org/1999/xlink"
		baseProfile="full"
		width="1em"
		height="1em"
		viewBox="0 0 76.00 76.00"
		enableBackground="new 0 0 76.00 76.00"
		xmlSpace="preserve"
		{...props}
	>
		<path
			fill="#000000"
			fillOpacity={1}
			strokeWidth={0.2}
			strokeLinejoin="round"
			d="M 57,42L 57,34L 32.25,34L 42.25,24L 31.75,24L 17.75,38L 31.75,52L 42.25,52L 32.25,42L 57,42 Z "
		/>
	</svg>
);