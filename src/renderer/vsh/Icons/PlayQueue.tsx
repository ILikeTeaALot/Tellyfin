import * as React from "preact/compat";

export const QueueIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = (props) => (
	<svg width={32} height={32} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M6 6h15v4H6zM6 14h20v4H6zM6 22h8v4H6z" fill="#7F7F7F" fillRule="evenodd" />
	</svg>
);