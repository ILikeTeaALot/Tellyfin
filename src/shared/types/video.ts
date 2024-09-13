export type MediaInfo = { type: "None"; } | {
	type: "CD";
	path: string;
	track: number;
} | {
	type: "DVD" | "BluRay";
	path: string;
	name: string | null;
	title: number;
	chapter: number;
} | {
	type: "Jellyfin";
	id: string;
	/** Type `string | number` for compatibility with BaseItemDto */
	serverId: string | number;
	session?: string;
};