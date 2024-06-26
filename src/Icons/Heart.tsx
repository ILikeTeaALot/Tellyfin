import * as React from "preact/compat";

export const HeartIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = (props) => (
	<svg
		viewBox="0 0 32 32"
		xmlns="http://www.w3.org/2000/svg"
		xmlSpace="preserve"
		{...props}
		style={{
			fillRule: "evenodd",
			clipRule: "evenodd",
			strokeLinejoin: "round",
			strokeMiterlimit: 2,
			/// @ts-expect-error
			...props.style,
		}}
	>
		<path fill="#" d="M15.969 7.947C14.751 6.87 13.114 6.002 11.003 6c-2.705-.002-5.786 1.889-6.768 4.883-.616 1.881-.522 4.261 1.319 6.854 2.62 3.69 8.544 8.583 8.544 8.583l1.901 1.558 1.901-1.557s5.885-4.851 8.543-8.579c1.872-2.627 1.941-5.021 1.3-6.905C26.729 7.854 23.603 6 21 6c-2.101 0-3.773.841-5.031 1.947ZM16 24s5.516-4.516 8-8c2.86-4.012-.488-7-3-7-3.512 0-5 4-5 4s-1.395-3.997-5-4c-2.605-.002-5.823 3.024-3 7 2.448 3.448 8 8 8 8Z" />
	</svg>
);