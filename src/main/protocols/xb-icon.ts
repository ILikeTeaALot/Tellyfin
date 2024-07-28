import { protocol } from "electron";
import * as fs from "node:fs/promises";
import { themeManager } from "../theme";

export function setupProtocolXBIcon() {
	protocol.handle("xb-icon", async (req) => {
		// Response.json({ error: "Not implemented yet..." });
		// req.url.split("/");
		let url = new URL(req.url);
		let path = url.pathname.substring(1).split("/");
		console.log(path);
		const [theme, icon] = path;
		// TODO :: Get path to actual icon!
		return new Promise((resolve, reject) => {
			themeManager.native.getThemeIcon(theme, icon, async (err, icon) => {
				if (err) {
					console.error(err);
					resolve(new Response(await fs.readFile("themes/PS3/icon/tex/tex_onlinemanual.png")));
				} else {
					resolve(new Response(icon));
				}
			});
		});
	});
}