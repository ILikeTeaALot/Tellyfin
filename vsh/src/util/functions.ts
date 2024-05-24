import langs from "./ISO_639-2.min.json";

import { mutate } from "swr";

export const TICKS_PER_HOUR = 36_000_000_000;
export const TICKS_PER_MINUTE = 600_000_000;
export const TICKS_PER_SECOND = 10_000_000;
export const TICKS_PER_MILLISECOND = 10_000;

export function displayRunningTime(ticks: number) {

	const ms = ticks / TICKS_PER_MILLISECOND;

	const date = new Date(ms);

	const hours = date.getUTCHours();
	const minutes = date.getUTCMinutes();
	const seconds = date.getUTCSeconds();

	let time = [];

	if (hours) time.push(hours, hours > 1 ? "Hours," : "Hour,");
	if (minutes) time.push(minutes, minutes > 1 ? "Minutes" : "Minute");
	if (minutes && seconds) time.push("and");
	if (seconds) time.push(seconds, seconds > 1 ? "Seconds" : "Second"); else time.push("Exactly");

	return time.join(" ");
}

export function refresh_mpv() {
	mutate("mpv_state");
}

export const toHMS = (seconds: number) => `${Math.floor(seconds / 3600).toString().padStart(2, "0")}:${(Math.floor(seconds / 60) % 60).toString().padStart(2, "0")}:${Math.round(seconds % 60).toString().padStart(2, "0")}`;

// export type LangKey = keyof typeof langs;
export type LangKey = string;

export const languageString = (lang: LangKey) => languageStringIntl(lang);

const intl = new Intl.DisplayNames(["en"], { type: "language" });

export const languageStringIntl = (lang: string) => lang == "unk" ? "Unknown" : intl.of(lang) ?? "Unknown";