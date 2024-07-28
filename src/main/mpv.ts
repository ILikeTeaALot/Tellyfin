import * as os from "node:os";
import { app, BrowserWindow, webContents, WebContentsView, type BaseWindow } from "electron";
import { deinit, init, listenForEvent } from "mpv";

// Send HTTP requests from main instead of renderer.
export function setupMPV(window: BaseWindow) {
	const handle = getNativeWindowHandle_UInt(window);
	init(handle, app.getPath("userData"));
	app.on("will-quit", () => {
		deinit();
	});
	listenForEvent((err, event) => {
		if (err) {
			console.error(err);
			return;
		}
		try {
			// for (const window of BrowserWindow.getAllWindows()) {
			// 	window
			// }
			for (const window of webContents.getAllWebContents()) {
				window.send("mpv-event", event);
			}
		} catch (e) {

		}
	})
}

function getNativeWindowHandle_UInt(win: BaseWindow) {
	let hbuf = win.getNativeWindowHandle();

	if (os.endianness() == "LE") {
		return hbuf.readUInt32LE();
	}
	else {
		return hbuf.readUInt32BE();
	}
}