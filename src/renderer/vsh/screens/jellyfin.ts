import { type BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { NavigateAction } from "../components/ContentList";

export type JellyfinScreenProps = {
	/** This might be removed at some point */
	active: boolean;
	data: BaseItemDto;
	nav_position: number;
	onNavigate: (action: NavigateAction.Back) => void;
}