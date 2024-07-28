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
};