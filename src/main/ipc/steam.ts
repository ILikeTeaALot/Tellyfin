import { app, ipcMain } from "electron";
import { readFile, rm } from "fs/promises";
import { join } from "path";
import { kill } from "process";

export function setupSteamHandler() {
	ipcMain.handle("close-steam-runner", async () => {
		try {
			let home = app.getPath("home");
			const pid_path = join(home, "tellyfinsteamrunnerpid");
			let raw = await readFile(pid_path, { encoding: "utf-8" });
			console.log(raw);
			kill(raw as unknown as number, "SIGINT");
			await rm(pid_path);
		} catch (e) {
			console.error(e);
		}
	});
}