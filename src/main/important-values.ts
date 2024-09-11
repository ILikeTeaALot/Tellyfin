import type { BaseWindow, BrowserWindow, WebContents } from "electron";
import { Mutex } from "./mutex";

export const mainWindow = new Mutex<WebContents | null>(null);
export const baseWindow = new Mutex<BaseWindow | null>(null);
export const themeBackgroundWindow = new Mutex<BrowserWindow | null>(null);
export const uiWindow = new Mutex<BrowserWindow | null>(null);