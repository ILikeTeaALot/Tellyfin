import { KeyboardLayoutCollection } from "./interfaces";

// TODO: Replace with data loading from some kind of config file.
export const layouts: KeyboardLayoutCollection = {
	standard: [
		['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
		['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
		['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', "'"],
		['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', "?"],
	],
	shift: [
		['!', '@', '£', '$', '%', '^', '&', '*', '(', ')'],
		['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
		['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', `"`],
		['Z', 'X', 'C', 'V', 'B', 'N', 'M', '-', '_', "/"],
	],
	alt: [
		['à', 'á', 'â', 'ã', 'ä', 'å', 'æ', 'ç', '[', ']'],
		['è', 'é', 'ê', 'ë', 'ì', 'í', 'î', 'ï', ';', ':'],
		['ñ', 'ò', 'ó', 'ô', 'õ', 'ö', 'ø', 'œ', '`', '¡'],
		['ß', 'ù', 'ú', 'û', 'ü', 'ý', 'ÿ', ',', '.', '¿'],
	],
	alt_shift: [
		['À', 'Á', 'Â', 'Ã', 'Ä', 'Å', 'Æ', 'Ç', '<', '>'],
		['È', 'É', 'Ê', 'Ë', 'Ì', 'Í', 'Î', 'Ï', '=', '+'],
		['Ñ', 'Ò', 'Ó', 'Ô', 'Õ', 'Ö', 'Ø', 'Œ', '~', `"`],
		['ß', 'Ù', 'Ú', 'Û', 'Ü', 'Ý', 'Ÿ', '-', '_', "/"],
	],
	symbols: [
		['', '', '', '', '', '', '', '', '', ''],
		['', '', '', '', '', '', '', '', '', ''],
		['', '', '', '', '', '', '', '', '', ''],
		['', '', '', '', '', '', '', '', '', ''],
	],
}