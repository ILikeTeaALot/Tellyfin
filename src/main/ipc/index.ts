import { setupAudioFeedbackHandlers } from "./audio-feedback";
import { setupQueryHandlers } from "./query";
import { setupSettingsHandlers } from "./settings";
import { setupSteamHandler } from "./steam";
import { setupVideoControlHandlers } from "./video-control";
import { setupVideoStatusHandlers } from "./video-status";

export function setupIPCHandlers() {
	setupAudioFeedbackHandlers();
	setupQueryHandlers();
	setupSettingsHandlers();
	setupVideoControlHandlers();
	setupVideoStatusHandlers();

	// TODO: Should be a plugin
	setupSteamHandler();
}