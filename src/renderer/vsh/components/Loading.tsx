/// @ts-ignore
import loadingIcon from "../assets/tex_loading_icon.png";

export function Loading() {
	return (
		<div className="fade-in-later" style={{ inset: 0, position: "fixed", display: "flex", flexDirection: "column", justifyContent: "center", alignContent: "center", alignItems: "center" }}>
			<img class="spin-baby-spin" src={loadingIcon} />
			{/* <span>Please wait...</span> */}
		</div>
	);
}