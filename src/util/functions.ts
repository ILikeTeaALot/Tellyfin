// import langs from "./ISO_639-2.min.json";

/* export function getDisplayRunningTime(ticks: number) {
	const ticksPerHour = 36000000000;
	const ticksPerMinute = 600000000;
	const ticksPerSecond = 10_000_000;

	const parts = [];

	let hours = ticks / ticksPerHour;
	hours = Math.floor(hours);

	if (hours) {
		parts.push(hours.toLocaleString());
	}

	ticks -= (hours * ticksPerHour);

	let minutes = ticks / ticksPerMinute;
	minutes = Math.floor(minutes);

	ticks -= (minutes * ticksPerMinute);

	if (minutes < 10 && hours) {
		minutes = (0).toLocaleString() + minutes.toLocaleString();
	} else {
		minutes = minutes.toLocaleString();
	}
	parts.push(minutes);

	let seconds = ticks / ticksPerSecond;
	seconds = Math.floor(seconds);

	if (seconds < 10) {
		seconds = (0).toLocaleString() + seconds.toLocaleString();
	} else {
		seconds = seconds.toLocaleString();
	}
	parts.push(seconds);

	return parts.join(':');
} */

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

	// return date.toLocaleTimeString();
	// return date.toLocaleTimeString();
	return time.join(" ");
}

export function refresh_mpv() {
	mutate("mpv_state");
}

export const toHMS = (seconds: number) => `${Math.floor(seconds / 3600).toString().padStart(2, "0")}:${(Math.floor(seconds / 60) % 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;

/* function csvJSON(csv: string) {

	var lines = csv.split("\n");

	var result = [];

	// NOTE: If your columns contain commas in their values, you'll need
	// to deal with those before doing the next step 
	// (you might convert them to &&& or something, then covert them back later)
	// jsfiddle showing the issue https://jsfiddle.net/
	var headers = lines[0].split(",");

	for (var i = 1; i < lines.length; i++) {
		var obj: Record<string, string> = {};
		var currentline = lines[i].split(",");

		for (var j = 0; j < headers.length; j++) {
			obj[headers[j]] = currentline[j];
		}

		result.push(obj);
	}

	return result; //JavaScript object
	// return JSON.stringify(result); //JSON
} */

// export type LangKey = keyof typeof langs;
export type LangKey = string;

export const languageString = (lang: LangKey) => languageStringIntl(lang);

const intl = new Intl.DisplayNames(["en"], { type: "language" });

export const languageStringIntl = (lang: string) => lang == "unk" ? "Unknown" : intl.of(lang) ?? "Unknown";