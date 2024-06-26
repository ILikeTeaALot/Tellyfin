import * as React from "preact/compat";

export const StopIcon: React.FunctionComponent<React.HTMLProps<HTMLDivElement>> = (props) => (
	<div {...props} style={{
		display: "flex", margin: "auto", width: 64, height: 64,
		/// @ts-expect-error
		...props.style
	}}>
		<div style={{ width: "40%", height: "40%", display: "flex", margin: "auto", background: "var(--text-colour)", /* borderRadius: "0.125rem" */ }} />
	</div>
);