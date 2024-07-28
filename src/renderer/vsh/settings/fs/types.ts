/**
 * @internal
 */
export enum Status {
	FileExists = "FileExists",
	FileCreated = "FileCreated"
}

export type SettingFileStatus = {
	status: Status;
	path: string;
	content: string;
};