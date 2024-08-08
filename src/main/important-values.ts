import type { WebContents } from "electron";
import { Mutex } from "./mutex";

export const mainWindowId = new Mutex<WebContents | null>(null);