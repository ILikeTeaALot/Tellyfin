import { MediaInfo } from "~/shared/types/video";
import { Mutex } from "./mutex";

export const current_playing_id = new Mutex<MediaInfo>({ type: "None" });