import { useCallback, useContext, useEffect } from "preact/hooks";
import { NavigateAction } from "../../components/ContentList";
import { TvSeries } from "./TV/Series";
import { AppMode } from "../../context/AppState";
import { AppState } from "../../AppStates";
import { FilmDetail } from "./Films/FilmDetail";
import { ContentGrid } from "../../components/ContentGrid";
import { type ContentItem } from "../../components/Content/types";
import useSWR from "swr";
import { newestScreenDataFetcher } from "./new-new-screen-data";
import { XBList } from "../../components/XB/List";
import type { XBItem } from "../../components/XB/content-fetcher";
import { Loading } from "../../components/Loading";
import { useNavigationFunctions, useNavPosition } from "../../hooks/routing";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export const TEXT_ITEM_HEIGHT = 56;

export type JellyfinContentProps = {
	// nav_position: number;
	data: { jellyfin_data?: BaseItemDto; id: string; };
	// onNavigate: (action: NavigateAction, item?: ContentItem) => void;
};

export function JellyfinContent(props: JellyfinContentProps) {
	// const { nav_position, onNavigate } = props;
	const nav_position = useNavPosition();
	const { go, back } = useNavigationFunctions();
	const onNavigate = useCallback((action: NavigateAction, item?: ContentItem) => {
		switch (action) {
			case NavigateAction.Enter:
				if (item) go(item.id, JellyfinContent, { data: item });
				return;
			case NavigateAction.Back:
				back();
				return;
			case NavigateAction.Play:
				return;
		}
	}, [back, go]);
	const state = useContext(AppMode);
	const { data, isLoading, isValidating } = useSWR(`screen-data-${props.data.jellyfin_data?.Id ?? props.data.id}`, () => newestScreenDataFetcher("", props.data.jellyfin_data));
	const handleListNavigate = useCallback((item: XBItem) => {
		onNavigate(NavigateAction.Enter, item);
	}, [onNavigate]);
	const handleListGoBack = useCallback(() => {
		onNavigate(NavigateAction.Back);
	}, [onNavigate]);
	if (typeof props.data.jellyfin_data == "undefined") {
		return (
			<div>No content</div>
		);
	}
	if (isValidating) return (
		<Loading />
	);
	switch (props.data.jellyfin_data.Type) {
		case "Series": return (
			<TvSeries active={state == AppState.Home && nav_position == 0} nav_position={nav_position} data={props.data.jellyfin_data} onNavigate={onNavigate} />
		);
		case "Movie": return (
			<FilmDetail active={state == AppState.Home && nav_position == 0} nav_position={nav_position} data={props.data.jellyfin_data} onNavigate={onNavigate} />
		);
		case "CollectionFolder": {
			if (!data || !data.content) return (
				<Loading />
			);
			switch (props.data.jellyfin_data.CollectionType) {
				case "movies":
				case "tvshows":
					return (
						<ContentGrid data={data.content} nav_position={nav_position} onNavigate={onNavigate} />
					);
				default:
					return (
						<XBList data={data.content} nav_position={nav_position} onNavigate={handleListNavigate} onGoBack={handleListGoBack} />
					);
			}
		}
		// if (!data || !data.content) return (
		// 	<Loading />
		// );
		// return (
		// 	<ContentGrid data={data.content} nav_position={nav_position} onNavigate={props.onNavigate} />
		// );
		case "MusicArtist":
		case "ManualPlaylistsFolder":
		case "MusicAlbum":
		case "PlaylistsFolder":
		case "Playlist":
		case "UserView":
			if (isLoading) return (
				<Loading />
			);
			return (
				<XBList data={data?.content ?? []} nav_position={nav_position} onNavigate={handleListNavigate} onGoBack={handleListGoBack} />
			);
		default: return (
			<Unrecognised active={nav_position == 0} goBack={handleListGoBack} Type={props.data?.jellyfin_data?.Type ?? "None"} />
		);
	}
}

function Unrecognised(props: { active: boolean; Type: string; goBack: () => void; }) {
	const { active, Type, goBack } = props;
	useEffect(() => {
		if (active) {
			goBack();
		}
	}, [active, goBack]);
	return (
		<div>Unrecognised content type {Type}</div>

	);
}