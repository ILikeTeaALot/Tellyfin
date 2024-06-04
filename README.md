# Tellyfin

> [!WARNING]
> Tellyfin is **very** early in development. It also only works on Windows at this time.
>
> READ THIS BEFORE ATTEMPTING TO RUN Tellyfin/VSH

> [!WARNING]
> ###### ADDITIONAL
>
> For reasons unknown, and possibly only on my system (but I'm putting a note here to be safe), `cargo tauri dev` *does not work.* In order to run Tellyfin at this time, open 2 terminals:
>
> - [Terminal 1] should be open in the project root. If you have not done so already, run `yarn`/`yarn install` in the project root before your first run, and then run `cargo run`.
> - [Terminal 2] should be open in `[PROJECT ROOT]/vsh`, and run `yarn dev`.

The goal for this is a PS3-style UI for films, TV shows, music, photos, emulators, and Steam (social features possibly included too... maybe).

> [!NOTE]
> ## License
>
> At the time of writing I have not settled on a license.
>
> My intent for this is that it be free software, I'm just not 100% on specifically a GPL-style license.

## Current Status

At present, playback and playback-control of media on the local filesystem works, selected by browsing through a local Jellyfin server.

> [!NOTE]
> Jellyfin user authentication details must be placed in `[PROJECT ROOT]\vsh\src\context\jellyfin-settings.json`. A template is provided in the adjacent `jellyfin-settings-example.json`.

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
> You can download the icons referenced in code from Sony [here](http://e1.dl.playstation.net/e1/downloads/ps3/themes/370/PS3_Custom_Theme_v200.zip) (regrettably not https.) Just extract the zip folder and copy all the `sample/simple/icon_*.png` files to `vsh/public/xb-icons/`


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