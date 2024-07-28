export type MpvEvent = ({
	event: "Shutdown" | "GetPropertyReply" | "StartFile" | "FileLoaded" | "VideoReconfig" | "AudioReconfig" | "Seek" | "PlaybackRestart" | "QueueOverflow" | "Deprecated";
} | {
	event: "EndFile";
	endFile: mpv_end_file_reason;
} | {
	event: "ClientMessage";
	clientMessage: Array<string>;
} | {
	event: "PropertyChange";
	propertyChange: { name: string, change: any; reply_userdata: number; };
});

/**
 * From `client.h`
 */
export enum mpv_end_file_reason {
	/**
	 * The end of file was reached. Sometimes this may also happen on
	 * incomplete or corrupted files, or if the network connection was
	 * interrupted when playing a remote file. It also happens if the
	 * playback range was restricted with --end or --frames or similar.
	 */
	MPV_END_FILE_REASON_EOF = 0,
	/**
	 * Playback was stopped by an external action (e.g. playlist controls).
	 */
	MPV_END_FILE_REASON_STOP = 2,
	/**
	 * Playback was stopped by the quit command or player shutdown.
	 */
	MPV_END_FILE_REASON_QUIT = 3,
	/**
	 * Some kind of error happened that lead to playback abort. Does not
	 * necessarily happen on incomplete or broken files (in these cases, both
	 * MPV_END_FILE_REASON_ERROR or MPV_END_FILE_REASON_EOF are possible).
	 *
	 * mpv_event_end_file.error will be set.
	 */
	MPV_END_FILE_REASON_ERROR = 4,
	/**
	 * The file was a playlist or similar. When the playlist is read, its
	 * entries will be appended to the playlist after the entry of the current
	 * file, the entry of the current file is removed, and a MPV_EVENT_END_FILE
	 * event is sent with reason set to MPV_END_FILE_REASON_REDIRECT. Then
	 * playback continues with the playlist contents.
	 * Since API version 1.18.
	 */
	MPV_END_FILE_REASON_REDIRECT = 5,
};