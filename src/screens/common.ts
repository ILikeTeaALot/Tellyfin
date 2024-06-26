import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { AppState } from "../AppStates";
import { Id, ContentType, ContentItem } from "../components/Content/types";

export type ScreenProps = {
	active: boolean;
	change_state: (state: AppState) => void;
};

export type ScreenContent = {
	id: Id;
	type: ContentType;
	content: Array<ContentItem>;
	jellyfin_data?: BaseItemDto;
};