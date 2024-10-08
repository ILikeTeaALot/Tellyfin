/* tslint:disable */
/* eslint-disable */

/* auto-generated by NAPI-RS */

export declare function pause(): void
export declare function play(): void
export declare function transportCommand(command: string): void
export declare function seek(mode: string, seconds: number): void
export declare function setTrack(track: string, id: string): void
export declare function playFile(file: string, startPosition?: number | undefined | null): void
export declare function deinit(): void
export const enum MpvEvent {
  /** Received when the player is shutting down */
  Shutdown = 'Shutdown',
  /** *Has not been tested*, received when explicitly asked to MPV */
  LogMessage = 'LogMessage',
  /** Received when using get_property_async */
  GetPropertyReply = 'GetPropertyReply',
  /** Received when using set_property_async */
  SetPropertyReply = 'SetPropertyReply',
  /** Received when using command_async */
  CommandReply = 'CommandReply',
  /** Event received when a new file is playing */
  StartFile = 'StartFile',
  /** Event received when the file being played currently has stopped, for an error or not */
  EndFile = 'EndFile',
  /** Event received when a file has been *loaded*, but has not been started */
  FileLoaded = 'FileLoaded',
  ClientMessage = 'ClientMessage',
  VideoReconfig = 'VideoReconfig',
  AudioReconfig = 'AudioReconfig',
  /** The player changed current position */
  Seek = 'Seek',
  PlaybackRestart = 'PlaybackRestart',
  /** Received when used with observe_property */
  PropertyChange = 'PropertyChange',
  /** Received when the Event Queue is full */
  QueueOverflow = 'QueueOverflow',
  /** A deprecated event */
  Deprecated = 'Deprecated'
}
export interface LogMessage {
  prefix: string
  level: string
  text: string
  logLevel: number
}
export interface GetPropertyReply {
  name: string
  result: any
  replyUserdata: number
}
export interface PropertyChange {
  name: string
  change: any
  replyUserdata: number
}
export interface MpvEventEx {
  event: MpvEvent
  logMessage?: LogMessage
  getPropertyReply?: GetPropertyReply
  setPropertyReply?: number
  commandReply?: number
  endFile?: number
  clientMessage?: Array<string>
  propertyChange?: PropertyChange
}
/** `window_handle`: `Option`al because it's pointless on Wayland. */
export declare function init(windowHandle: number | undefined | null, configDir: string): void
export declare function setProperty(property: string, value: string): void
export const enum MediaType {
  General = 0,
  BluRay = 3,
  DVD = 4
}
export const enum PlaybackStatus {
  Stopped = 0,
  Paused = 1,
  Playing = 2
}
export const enum VideoRepeatType {
  Off = 0
}
export interface Chapter {
  title?: string
  time: number
}
export interface MpvAudioStatus {
  codec?: string
  channels?: string
  format?: string
}
export interface MpvVideoStatus {
  codec: string
  format: string
}
export const enum MpvTrackType {
  Unknown = 'Unknown',
  Video = 'Video',
  Audio = 'Audio',
  Subtitle = 'Subtitle'
}
export interface MpvTrack {
  default: boolean
  forced: boolean
  selected: boolean
  name: string
  title?: string
  codec?: string
  codecDesc?: string
  format?: string
  language?: string
  track: number
  trackType: MpvTrackType
}
export interface MpvTrackInfo {
  audio: Array<MpvTrack>
  subtitles: Array<MpvTrack>
}
export interface MpvTime {
  position: number
  duration?: number
  remaining: number
}
export interface MpvPosition {
  time: MpvTime
  chapter?: number
}
export interface Status {
  playbackStatus: PlaybackStatus
  repeat: VideoRepeatType
  shuffle: boolean
}
export interface MpvStatus {
  position: MpvPosition
  title?: string
  audio?: MpvAudioStatus
  video?: MpvVideoStatus
  subtitle?: MpvTrack
  tracks?: Array<MpvTrack>
  status: Status
  chapters: Array<Chapter>
  filename?: string
  path?: string
}
export declare function status(): MpvStatus
export declare function listenForEvent(func: (err: Error | null, arg: MpvEventEx) => any): void
