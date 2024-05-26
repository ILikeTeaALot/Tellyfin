import type { Tuple } from "../../../util/types";

export type KeyRow = Tuple<string, 10>;

export type KeyboardLayout = Tuple<KeyRow, 4>;

export type KeyboardLayoutTypes = "standard" | "shift" | "alt" | "alt_shift" | "symbols";

export type KeyboardLayoutCollection = Record<KeyboardLayoutTypes, KeyboardLayout>;
