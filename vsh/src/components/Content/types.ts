import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export type Id = string;

export type ContentItem = {
	id: Id;
	name: string;
	jellyfin?: boolean;
	jellyfin_data?: BaseItemDto;
	imageUrl?: string;
};

export enum ContentType {
	Ignore = -1,
	List,
	Grid,
	SettingsList,
	Jellyfin,
}