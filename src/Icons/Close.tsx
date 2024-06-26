import type { SVGProps } from "preact/compat";

export const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		width="1em"
		height="1em"
		viewBox="0 0 32 32"
		xmlns="http://www.w3.org/2000/svg"
		xmlnsXlink="http://www.w3.org/1999/xlink"
		{...props}
	>
		<title>{"Close"}</title>
		<g id="Close" stroke="none" strokeWidth={1} fill="none" fillRule="evenodd">
			<polygon id="Path-66" fill="#D8D8D8" points="21 26 6 8 11 8 26 26" />
			<polygon id="Path-66" fill="#D8D8D8" points="6 26 21 8 26 8 11 26" />
		</g>
	</svg>
);