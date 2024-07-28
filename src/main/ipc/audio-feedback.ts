import { ipcMain } from "electron";
import * as BASS from "node-bass";

let bass = BASS.initBass();
let feedback = new BASS.AudioFeedbackManager();

export function setupAudioFeedbackHandlers() {
	ipcMain.handle("play_background", () => {
		feedback.playBackground();
	});

	ipcMain.handle("stop_background", () => {
		feedback.stopBackground();
	});

	ipcMain.handle("reinit_bass", () => {
		bass.restart();
	});

	ipcMain.handle("play_feedback", (_, { sound }: { sound: BASS.FeedbackSound; }) => {
		feedback.play(sound);
	});
}