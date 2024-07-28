import { MediaStream } from "@jellyfin/sdk/lib/generated-client/models";
import { languageString, LangKey } from "../../util/functions";

export function mapCodecToDisplayName(codec?: string) {
	switch (codec?.toUpperCase()) {
		// Dolby
		case "AC3": return "Dolby Digital";
		case "EAC3": return "Dolby Digital +";
		case "TRUEHD": return "Dolby TrueHD";
		// DTS
		case "DTS": return "DTS Standard (DCA)";
		case "DTS-ES": return "DTS Extended Surround";
		case "DTS-HD": return "DTS-HD High Resolution";
		default: return codec;
	}
}

export function MediaStreamInfo(props: { info: MediaStream; }) {
	const { info } = props;
	const language = info.Language ? info.Language.length == 3 ? languageString(info.Language! as LangKey) : info.Language : null;
	switch (info.Type) {
		case "Audio":
			return (
				// <span className="technical">Audio: {info.DisplayTitle}</span>
				<span className="technical">Audio: {mapCodecToDisplayName(info.Profile?.replace("MA", "Master Audio")) ?? mapCodecToDisplayName(info.Codec?.toUpperCase() ?? "Unknown")}{language ? ` / ${language}` : null} / {info.ChannelLayout} / {Math.round(info.SampleRate! / 100) / 10} kHz / {Math.round(info.BitRate! / 1000)} kbps{info.BitDepth ? ` / ${info.BitDepth}-bit` : null}{info.IsDefault ? " - Default" : null}</span>
			);
		case "Video":
			return (
				<>
				<span className="technical">
					Video: {
						info.Codec ? `${info.Codec.toUpperCase()}${info.IsAVC ? " AVC" : ""}` : ""
					} {info.BitRate ? ` / ${Math.round(info.BitRate / 1000)} kbps`: ""} / {info.Height}{info.IsInterlaced ? "i" : "p"} {
						info.VideoRange ? ` / ${info.VideoRange}` : ""
					}{info.IsDefault ? " - Default" : ""}
				</span>
					{/* <span>Video: {info.DisplayTitle}</span> */}
					{/* <span>Video: {info.Title}</span> */}
				</>
			);
		case "Subtitle":
			return (
				<span className="technical">Sub: {info.DisplayTitle ?? info.Title}</span>
			);
		default:
			return null;
	}
}