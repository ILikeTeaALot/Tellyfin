# Tellyfin

The goal for this is a PS3-style UI for films, TV shows, music, photos, emulators, and Steam (social features possibly included too... maybe).

## Cloning

```sh
# Clone main repository.
git clone git@github.com:ILikeTeaALot/Tellyfin.git
# Pull submodules (open an issue if you get an access/permission error.)
git submodule update --init --recursive
# JS dependencies
yarn install
```

> [!WARNING]
> Tellyfin is **very** early in development. It also only works on Windows at this time.
>
> READ THIS BEFORE ATTEMPTING TO RUN Tellyfin/VSH

> [!IMPORTANT]
> ###### ADDITIONAL
>
> For reasons unknown, and possibly only on my system (but I'm putting a note here to be safe), `cargo tauri dev` *does not work.* In order to run Tellyfin at this time, open 2 terminals in the project root:
>
> - [Terminal 1] Run `yarn`/`yarn install` if you have not already, and then run `yarn dev`.
> - [Terminal 2] Run `cargo run`.

# Current Status

## TLDR

### Done

- [x] Local file playback
- [x] DVD (and theoretically Blu-ray) playback
- [x] Jellyfin Library discovery
	- [x] Some Jellyfin library browsing (see below)
- [x] Some parts of Themes (see below)

### Still To-do

- [ ] Music Playback
	- [ ] CD
	- [ ] Jellyfin
- [ ] Photo viewing
- [ ] Live TV
- [ ] Themes
	- [x] Indexing themes
	- [x] Reading icons from themes
	- [ ] Loading audio feedback samples from themes
- [ ] Photos
- [ ] Jellyfin
	- [ ] Content browsing
		- [x] TV Shows and Series
		- [x] Films
		- [x] Music
		- [ ] Photos
		- [ ] Live TV
	- [ ] Login flow
	- [ ] Server management
- [ ] Steam
	- [ ] Library detection
	- [ ] Game launching
- [ ] Emulators
- [ ] Plug-in architecture(s)
	- [ ] Daemon/IPC
	- [ ] DLL
	- [ ] Lua/Scheme

## Details

At present, playback and playback-control of media on the local filesystem works, selected by browsing through a local Jellyfin server.

> [!IMPORTANT]
> Jellyfin user authentication details must be placed in `[PROJECT ROOT]\vsh\src\context\jellyfin-settings.json`. A template is provided in the adjacent `jellyfin-settings-example.json`. This is a temporary situation until the media server setup wizard is completed.

The User Interface design is a top-level interface based on the [XMB](https://en.wikipedia.org/wiki/XrossMediaBar), which navigates to a hybrid of vertical lists, grids, single-option landing pages (i.e. 1 option: *Play*), and a contiuous row of episodes for TV shows. Eventually the top-level menu will support navigating:

 - Multiple Jellyfin servers
 - Alto integration (the XMB works quite well as a GUI for Music)
 - Emulators/RetroArch
 - Steam
 - Navigable Settings (settings are currently hard-coded in a handful of places throughout the source code.)

> [!NOTE]
> The layout of the UI also only works properly at 1920x1080. To use at 4K, set the zoom to 200%; everything should work correctly\*.
>
> \*Other than image resolution. That's hardcoded too and may result in a small amount of artifacting at 4K.

> [!TIP]
> ### XMB Icons
>
> The example themes (PS3 icons and sounds + PS2 background audio) will be available soon™.

## Requirements

1. A working Rust toolchain for compilation.
2. Node.js v20 or newer + Yarn (other package managers *might* work).
3. [libmpv](#libmpv).
4. A running Jellyfin server.

### libmpv

Download libmpv from [here](https://sourceforge.net/projects/mpv-player-windows/files/).

In order to run the application, you will need a copy of `mpv.dll` and `mpv.lib` (Rename `mpv.dll.a` to `mpv.lib`, because the GNU toolchain is a bit funky on Windows.)

If you have one of the following CPUs, download the latest `libmpv/mpv-dev-x86_64-v3-[date]-git-xxx.7z`:

Intel: Haswell or newer with AVX2 (September 2013 - Present)
or Atom "Gracemont" or newer (Nov 2021 - Present)

AMD: "Excavator" or any Ryzen CPU (c. June 2015 - Present)

If you do not have one of the above CPUs, download the latest `libmpv/mpv-dev-x86_64-[date]-git-xxx.7z`