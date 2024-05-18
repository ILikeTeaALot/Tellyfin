import { iconByName } from "./Icon";

export function PanelButton(props: { active: boolean; action: string; }) {
	const { active, action } = props;
	console.log("active:", active);
	return (
		<div className={active ? "control-panel-button active" : "control-panel-button"}>{iconByName(action)}</div>
	);
}