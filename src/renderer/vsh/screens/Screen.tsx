import useSWR from "swr";
import { newestScreenDataFetcher } from "./Home/new-new-screen-data";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { ContentType, type ContentItem } from "../components/Content/types";
import { ContentGrid } from "../components/ContentGrid";
import { XBList } from "../components/XB/List";
import { SettingList } from "../components/XB/SettingList";
import { JellyfinContent } from "./Home/Jellyfin";
import type { XBItem } from "../components/XB/content-fetcher";
import { Loading } from "../components/Loading";
import type { NavigateAction } from "../components/ContentList";

export type NewScreenProps = {
	jellyfin_data?: BaseItemDto;
	key: string;
	nav_position: number;
	zIndex: number;
	handleNavigate: (action: NavigateAction, item?: ContentItem) => void;
	handleListNavigate: (item: XBItem, index?: number) => void;
	handleListGoBack: () => void;
};

export function ViewScreen(props: NewScreenProps) {
	const { jellyfin_data, key, nav_position, zIndex, handleNavigate, handleListNavigate, handleListGoBack } = props;
	const { data, isLoading } = useSWR(key, (key) => newestScreenDataFetcher(key, jellyfin_data));
	if (isLoading) return (
		<Loading />
	);
	switch (data?.type) {
		case ContentType.Ignore:
			return null;
		case ContentType.Jellyfin:
			return (
				<div key={data.id} style={{ zIndex }}>
					<JellyfinContent /* nav_position={nav_position} */ data={data} /* onNavigate={handleNavigate} */ />
				</div>
			);
		case ContentType.List:
			return (
				<div key={data.id} style={{ zIndex }}>
					<XBList nav_position={nav_position} data_key={data.id.startsWith("system") ? data.id : undefined} data={data.content} onGoBack={handleListGoBack} onNavigate={handleListNavigate} />
				</div>
			);
		case ContentType.SettingsList:
			return (
				<div key={data.id} style={{ zIndex }}>
					{/* <ContentList nav_position={nav_position} data={data.content} onNavigate={handleNavigate} /> */}
					<SettingList /* nav_position={nav_position} */ data_key={data.id} /* onGoBack={handleListGoBack} onNavigate={handleListNavigate} */ />
				</div>
			);
		case ContentType.Grid:
			if (!data.content) return null;
			return (
				// <div key={data.id} class={nav_position == 0 ? "background-blur active" : "background-blur"}>
				<div key={data.id} style={{ zIndex }}>
					<ContentGrid nav_position={nav_position} data={data.content} onNavigate={handleNavigate} />
				</div>
				// </div>
			);
		default:
			return null;
	}
}