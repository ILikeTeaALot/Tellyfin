import { contextBridge, ipcRenderer } from "electron";
import type { TellyfinUser } from "~/shared/types/user";

async function getUsers(): Promise<TellyfinUser[]> {
	return ipcRenderer.invoke("get-users");
}

const apiList = {
	getUsers,
};

contextBridge.exposeInMainWorld("userAPI", apiList);

declare global {
	export interface Window {
		userAPI: typeof apiList;
	}
}