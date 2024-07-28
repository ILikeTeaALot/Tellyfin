import { net, protocol } from "electron";

// Send HTTP requests from main instead of renderer.
export function setupIntercepts() {
	protocol.handle("http", async (req) => {
		return net
			.fetch(req, { bypassCustomProtocolHandlers: true })
			// .then((res) => ({
			// 	...res,
			// 	// headers: { ...res.headers, "Access-Control-Allow-Origin": "*" },
			// }));
	});

	protocol.handle("https", async (req) => {
		return net
			.fetch(req, { bypassCustomProtocolHandlers: true })
			// .then((res) => ({
			// 	...res,
			// 	headers: { ...res.headers, "Access-Control-Allow-Origin": "*" },
			// }));
	});
}
