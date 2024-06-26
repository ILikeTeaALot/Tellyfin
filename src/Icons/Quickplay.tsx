import * as React from "preact/compat";

export const QuickplayIcon: React.FunctionComponent<React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>> = (props) => (
	<>
		{/* <span {...props}>Q</span> */}
		<span {...props} style={{
			/// @ts-expect-error
			...props.style
		}}>􀇷</span>
	</>
	// <svg width={32} height={32} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" {...props}>
	// </svg>
);