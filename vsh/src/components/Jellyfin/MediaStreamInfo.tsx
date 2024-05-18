import { MediaStream } from "@jellyfin/sdk/lib/generated-client/models";
import { languageString, LangKey } from "../../util/functions";

function mapCodecToDisplayName(codec: string) {
	switch (codec.toUpperCase()) {
		// Dolby
		case "AC3": return "Dolby Digital";
		case "EAC3": return "Dolby Digital +";
		case "TRUEHD": return "Dolby TrueHD";
		// DTS
		case "DTS": return "Dolby Digital +";
		case "DTS-HD": return "Dolby Digital +";
		default: return codec;
	}
}

export function MediaStreamInfo(props: { info: MediaStream; }) {
	const { info } = props;
	const language = info.Language ? info.Language.length == 3 ? languageString(info.Language! as LangKey) : info.Language : null;
	switch (info.Type) {
		case "Audio":
			return (
				<span className="technical">Audio: {info.Profile?.replace("MA", "Master Audio") ?? mapCodecToDisplayName(info.Codec?.toUpperCase() ?? "Unknown")}{language ? ` / ${language}` : null} / {info.ChannelLayout} / {Math.round(info.SampleRate! / 100) / 10} kHz / {Math.round(info.BitRate! / 1000)} kbps{info.BitDepth ? ` / ${info.BitDepth}-bit` : null}{info.IsDefault ? " - Default" : null}</span>
			);
		case "Video":
			return (
				<span className="technical">
					Video: {
						info.Codec ? `${info.Codec.toUpperCase()}${info.IsAVC ? " AVC" : null}` : null
					} {info.BitRate ? ` / ${Math.round(info.BitRate / 1000)} kbps`: null} / {info.Height}{info.IsInterlaced ? "i" : "p"} {
						info.VideoRange ? ` / ${info.VideoRange}` : null
					}{info.IsDefault ? " - Default" : ""}
				</span>
			);
		case "Subtitle":
			return (
				<span className="technical">Sub: {info.DisplayTitle ?? info.Title}</span>
			);
		default:
			return null;
	}
}