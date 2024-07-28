import { app, protocol } from "electron";
import { resolvePath } from "./sanitise";
import { join } from "node:path";
import { readFile } from "node:fs/promises";

export function setupProtocolXB() {
	protocol.handle("xb", async (req) => {
		const url = new URL(req.url);
		let path = url.pathname;
		path = resolvePath(join(app.getAppPath(), "public"), path);
		return new Response(await readFile(path), { status: 200 });
	});
}