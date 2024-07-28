import * as React from "preact/compat";

export const PauseIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>> = (props) => (
	<svg width={64} height={32} viewBox="0 0 64 32" xmlns="http://www.w3.org/2000/svg" {...props}>
		<path d="M21 4h7v24h-7zM36 4h7v24h-7z" fill="#7F7F7F" fillRule="evenodd" />
	</svg>
);