import { Api, Jellyfin } from "@jellyfin/sdk";
import * as jf from "@jellyfin/sdk/lib/utils/api";
import axios from "axios";

import { deviceInfo, server_address, user } from "./jellyfin-settings.json";

import { createContext, type ComponentChildren } from "preact";
import { useContext, useEffect, useMemo, useState } from "preact/hooks";
import { SettingsContext } from "./Settings";
import { AuthenticationResult } from "@jellyfin/sdk/lib/generated-client/models";

export * as jellyfin from "@jellyfin/sdk/lib/utils/api";

const deviceId = localStorage.getItem("deviceId") || crypto.randomUUID();

if (!localStorage.getItem("deviceId")) {
	localStorage.setItem("deviceId", deviceId);
}

// axios.defaults.adapter = "fetch"; // NEVER EVER ENABLE THIS. IT BREAKS THINGS FOR REASONS I DO NOT YET UNDERSTAND

const jellyfin = new Jellyfin({
	clientInfo: {
		name: "Tellyfin",
		version: "0.0.0",
	},
	deviceInfo: {
		name: deviceInfo.name,
		id: deviceId,
	},
});

const axiosInst = axios.create({
	// adapter: axiosAdapter()
	// adapter: createFetchAdapter(tauriFetch),
	// adapter: fetchAdapter,
});

const auth_data = localStorage.getItem("jellyfin-auth");

let api: Api;

let auth: AuthenticationResult;

if (auth_data != null) {
	auth = JSON.parse(auth_data);
	api = jellyfin.createApi(
		server_address,
		auth.AccessToken!,
		// axiosInst,
	);
} else {
	api = jellyfin.createApi(
		server_address,
		// undefined,
		// axiosInst,
	);
	api.authenticateUserByName(user.username, user.password).then(({ data }) => {
		auth = data;
		localStorage.setItem("jellyfin-auth", JSON.stringify(data));
		window.location.reload();
	});
}

export { auth };

// api.configuration.baseOptions = {...api.configuration.baseOptions}

// api.axiosInstance.options(api.axiosInstance.defaults.baseURL)

// Fetch the public system info
// const info = await jf.getSystemApi(api).getPublicSystemInfo();
// console.log('Info =>', info.data);

// // Fetch the list of public users
// const users = await jf.getUserApi(api).getPublicUsers();
// console.log('Users =>', users.data);

// // A helper method for authentication has been added to the SDK because
// // the default method exposed in the generated Axios client is rather
// // cumbersome to use.
// const auth = await api.authenticateUserByName(user.username, user.password);
// console.log('Auth =>', auth.data);
// console.log('AccessToken =>', api.accessToken);
// // const auth_data = new AuthData(auth.data);
// // api.accessToken = auth.data.AccessToken!;
// const auth_data = auth.data;
// export { auth_data as auth };

// // Authentication state is stored internally in the Api class, so now
// // requests that require authentication can be made normally
// const libraries = await jf.getLibraryApi(api).getMediaFolders();
// console.log('Libraries =>', libraries.data);

export default api;

export const JellyfinContext = createContext<Api | null>(null);

/**
 * Must be rendered within the Settings Context Provider.
 * @param props Children requiring Jellyfin API context
 * @returns {props.children} wrapped in the Jellyfin API Context Provider.
 */
export function JellyfinApiProvider(props: { children: ComponentChildren; }) {
	const jfn = useMemo(() => new Jellyfin({
		clientInfo: {
			name: "Tellyfin",
			version: "0.0.0",
		},
		deviceInfo,
	}), []);
	const { settings } = useContext(SettingsContext);
	const [api, resetApi] = useState(jfn.createApi(server_address));
	useEffect(() => {
		resetApi(jfn.createApi(server_address));
	}, [jfn]);
	if (!api) return null;
	return <JellyfinContext.Provider value={api}>{props.children}</JellyfinContext.Provider>;
}
