import { ComponentChildren } from "preact";
import { CSSProperties } from "preact/compat";

export enum PanelState {
	/** AKA Default (might rename to default) */
	None,
	/** The currently "focused" Panel */
	Active,
	/** Special PanelState for when a sibling panel is focused */
	Inactive,
}

export type PanelProps = {
	state: PanelState;
	scaleDownInactive?: boolean;
	width: number | "auto";
	height: number | "auto";
	aspectRatio?: number;
	style?: CSSProperties;
	children?: ComponentChildren;
}

export function ContentPanel(props: PanelProps) {
	const { children, scaleDownInactive, state, width, height, aspectRatio } = props;
	return (
		<div className={state == PanelState.Active ? "panel active" : state == PanelState.Inactive ? scaleDownInactive ? "panel inactive scale-down" : "panel inactive" : "panel"} style={{
			width,
			height,
			borderRadius: 20,
			aspectRatio,
		}}>
			<div className={"panel-content"}>
				<div className={"shadow"} />
				<div className={"panel-image"}>
					{children}
				</div>
				<div className={"border-highlight"} />
			</div>
		</div>
	)
}