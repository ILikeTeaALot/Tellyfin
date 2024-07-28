import type { Tuple } from "../../../util/types";

export type KeyRow = Tuple<string, 10>;

export type KeyboardLayout = Tuple<KeyRow, 4>;

export type KeyboardLayoutTypes = "standard" | "shift" | "alt" | "alt_shift" | "symbols";

export type KeyboardLayoutCollection = Record<KeyboardLayoutTypes, KeyboardLayout>;

type RowReplacement = { replace: number, with: KeyRow; };

type KeyReplacement = {
	replace: [number, number];
	with: string;
};

export type Replacement = Array<RowReplacement | KeyReplacement>;