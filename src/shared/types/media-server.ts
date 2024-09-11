export type ContentProvider = {
	Id: number;
	Name: string;
	Type: string;
}

export type MediaServer = {
	Id: number;
	ContentProviderId: number;
	Address: string;
	Name: string;
}

export type ServerAuthentication = {
	Id: number;
	ServerId: number;
	AuthData: any;
	UseRId: number;
}