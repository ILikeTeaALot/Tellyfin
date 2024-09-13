import { setupAudioFeedbackHandlers } from "./audio-feedback";
import { setupMediaServerHandlers } from "./media-server";
import { setupPlayStateHandlers } from "./play-state";
import { setupQueryHandlers } from "./query";
import { setupSettingsHandlers } from "./settings";
import { setupSteamHandler } from "./steam";
import { setupSystemHandlers } from "./system";
import { setupUserHandlers } from "./user";
import { setupVideoControlHandlers } from "./video-control";
import { setupVideoStatusHandlers } from "./video-status";

export function setupIPCHandlers() {
	setupAudioFeedbackHandlers();
	setupMediaServerHandlers();
	setupPlayStateHandlers();
	setupQueryHandlers();
	setupSettingsHandlers();
	setupSystemHandlers();
	setupVideoControlHandlers();
	setupVideoStatusHandlers();
	setupUserHandlers();

	// TODO: Should be a plugin
	setupSteamHandler();
}