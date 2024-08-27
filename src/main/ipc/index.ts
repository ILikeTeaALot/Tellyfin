import { setupAudioFeedbackHandlers } from "./audio-feedback";
import { setupQueryHandlers } from "./query";
import { setupSettingsHandlers } from "./settings";
import { setupSteamHandler } from "./steam";
import { setupSystemHandlers } from "./system";
import { setupVideoControlHandlers } from "./video-control";
import { setupVideoStatusHandlers } from "./video-status";

export function setupIPCHandlers() {
	setupAudioFeedbackHandlers();
	setupQueryHandlers();
	setupSettingsHandlers();
	setupSystemHandlers();
	setupVideoControlHandlers();
	setupVideoStatusHandlers();

	// TODO: Should be a plugin
	setupSteamHandler();
}