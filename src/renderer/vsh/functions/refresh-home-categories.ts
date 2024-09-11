import { mutate } from "swr";

export const refreshHome = () => mutate(key => Array.isArray(key) && key[0] == "xb-category", undefined, { revalidate: true });