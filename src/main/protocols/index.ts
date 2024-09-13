import { protocol } from "electron";
import { setupProtocolXBIcon } from "./xb-icon";
import { setupProtocolXB } from "./xb";
import { setupProtocolXBImage } from "./xb-image";

export function registerProtocols() {
	protocol.registerSchemesAsPrivileged([
		{ scheme: "xb-icon", privileges: { standard: true, secure: true, bypassCSP: true, corsEnabled: true, stream: true } },
		{ scheme: "xb-image", privileges: { standard: true, secure: true, bypassCSP: true, corsEnabled: true, stream: true } },
		{ scheme: "xb-setting", privileges: { standard: true, secure: true, bypassCSP: true, allowServiceWorkers: true, supportFetchAPI: true, corsEnabled: true } },
		{ scheme: "xb-theme", privileges: { standard: true, secure: true } },
		{ scheme: "xb", privileges: { standard: true, secure: true, bypassCSP: true, allowServiceWorkers: true, supportFetchAPI: true, corsEnabled: true } },
		{ scheme: "xcb", privileges: { standard: true, secure: true, bypassCSP: true, allowServiceWorkers: true, supportFetchAPI: true, corsEnabled: true } },
	]);
}

export function setupProtocols() {
	setupProtocolXB();
	setupProtocolXBIcon();
	setupProtocolXBImage();
}