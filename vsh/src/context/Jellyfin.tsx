import { Jellyfin } from "@jellyfin/sdk";
import * as jf from "@jellyfin/sdk/lib/utils/api";

import { deviceInfo, server_address, user } from "./jellyfin-settings.json";

export * as jellyfin from "@jellyfin/sdk/lib/utils/api";

const jellyfin = new Jellyfin({
	clientInfo: {
		name: 'Tellyfin',
		version: '0.0.0'
	},
	deviceInfo,
});

const api = jellyfin.createApi(server_address);

// Fetch the public system info
const info = await jf.getSystemApi(api).getPublicSystemInfo();
console.log('Info =>', info.data);

// Fetch the list of public users
const users = await jf.getUserApi(api).getPublicUsers();
console.log('Users =>', users.data);

// A helper method for authentication has been added to the SDK because
// the default method exposed in the generated Axios client is rather
// cumbersome to use.
const auth = await api.authenticateUserByName(user.username, user.password);
console.log('Auth =>', auth.data);
const auth_data = auth.data;
export { auth_data as auth };

// Authentication state is stored internally in the Api class, so now
// requests that require authentication can be made normally
const libraries = await jf.getLibraryApi(api).getMediaFolders();
console.log('Libraries =>', libraries.data);

export default api;

window.addEventListener("unload", () => {
	api.logout();
});