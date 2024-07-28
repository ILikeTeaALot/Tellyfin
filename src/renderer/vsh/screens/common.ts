import { type BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { AppState } from "../AppStates";
import { Id, ContentType, ContentItem } from "../components/Content/types";
import type { XBItem } from "../components/XB/content-fetcher";

export type ScreenProps = {
	active: boolean;
	change_state: (state: AppState) => void;
};

export type ScreenContent = {
	id: Id;
	type: ContentType | XBItem;
	content: Array<ContentItem | XBItem>;
	jellyfin_data?: BaseItemDto;
};