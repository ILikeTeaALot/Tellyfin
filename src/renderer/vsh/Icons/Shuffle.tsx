import * as React from "preact/compat";

export const ShuffleIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = (props) => (
	<svg width={32} height={32} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" {...props}>
		<g fill="none" fillRule="evenodd">
			<path fill="#7F7F7F" d="m8 2 4 7H4zM24 2l4 7h-8z" />
			<path d="M24 9c0 7-8 15-19 17" stroke="#979797" strokeWidth={3} />
			<path d="M8 9c0 7 8 15 19 17" stroke="#979797" strokeWidth={3} />
		</g>
	</svg>
);