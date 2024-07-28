import { BaseItemDto, ImageType } from "@jellyfin/sdk/lib/generated-client/models";
import { useEffect, useState } from "preact/hooks";
import * as jf from "@jellyfin/sdk/lib/utils/api";
import api from "../../context/Jellyfin";

export function JellyfinPosterImage(props: { data: BaseItemDto; }) {
	const [imageSource, setSource] = useState<string>();
	useEffect(() => {
		(async () => {
			const image = await jf.getImageApi(api).getItemImage({
				itemId: props.data.Id!,
				imageType: ImageType.Box,
			});
		})();
	}, []);
	return (
		<img decoding="async" src={imageSource} />
	)
}