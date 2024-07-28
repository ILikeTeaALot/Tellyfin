import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export type Id = string;
export type PluginId = `${string}.${string}`;

export type PluginData = {
	[key: string]: string | PluginData;
};

export type PluginAction = {
	command: string;
	args: string[];
};

export type PluginMenu = {
	command: string;
	args: string[];
};

export type ContentItem = {
	id: Id;
	name: string;
	jellyfin_data?: BaseItemDto;
	imageUrl?: string;
	plugin?: { id: PluginId; data: PluginData; action: PluginAction; menu: PluginMenu; };
};

export enum ContentType {
	Ignore = -1,
	List,
	Grid,
	SettingsList,
	Jellyfin,
	PlugIn,
}