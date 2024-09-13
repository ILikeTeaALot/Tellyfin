import { URL } from "url";
import { net, protocol } from "electron";
import { db } from "../database";
import { fetchImage, init } from "@tellyfin/image-fetcher";

export function setupProtocolXBImage() {
	init(db.path);
	protocol.handle("xb-image", async (req) => {
		// console.log("Handling xb-image!");
		// console.log(req.url);
		const url = new URL(req.url);
		// console.log(url);
		const [name, id] = url.hostname.split("_"); // Electron forced me into this...
		if (name == "media-server") {
			return new Promise((res, rej) => {
				fetchImage(parseInt(id), (err, address) => {
					if (err) {
						rej(err);
					} else {
						setImmediate((res) => {
							res(net.fetch(address + url.pathname.slice(1), { bypassCustomProtocolHandlers: true }));
						}, res);
					}
				});
			});
			// if (cache.has(id)) {
			// 	return new Promise(res => {
			// 		setImmediate((res) => {
			// 			res(net.fetch(cache.get(id) + url.pathname.slice(1), { bypassCustomProtocolHandlers: true }));
			// 		}, res);
			// 	});
			// } else {
			// 	return new Promise(res => {
			// 		setImmediate(res => {
			// 			const server = db.row<{ Address: string; }>("SELECT Address FROM Server WHERE Server.Id = ?", [id]);
			// 			if (server.ok) {
			// 				// console.log("Server Address: ", server.value);
			// 				cache.set(id, server.value.Address);
			// 				setTimeout(() => cache.delete(id), 60 * 1000);
			// 				setImmediate((res) => {
			// 					res(net.fetch(server.value.Address + url.pathname.slice(1), { bypassCustomProtocolHandlers: true }));
			// 				}, res);
			// 			}
			// 		}, res);
			// 	});
			// }
		}
		return new Response(null, {
			status: 400,
			statusText: "Unrecognised Hostname. Please try again.",
		});
	});
}