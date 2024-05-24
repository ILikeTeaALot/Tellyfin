## Current Status

At present, playback and playback-control of media on the local filesystem works, selected by browsing through a local Jellyfin server.

The User Interface design is a hybrid of vertical lists, grids, optionless landing pages (i.e. 1 option: *Play*), and a contiuous row of episodes for TV shows. When support for a few of the following is added the top-level interface will be altered to resemble the XMB:

 - Multiple Jellyfin servers
 - Alto integration (the XMB works quite well for Music)
 - Emulators/RetroArch
 - Steam
 - Navigable Settings (settings are currently hard-coded in a handful of places.)

## Requirements

1. A working Rust toolchain for compilation.
2. Node.js v20 or newer.
3. [libmpv](#libmpv)

### libmpv

Download libmpv from [here](https://sourceforge.net/projects/mpv-player-windows/files/).

In order to run the application, you will need a copy of `mpv.dll` and `mpv.lib` (Rename `mpv.dll.a` to `mpv.lib`, because the GNU toolchain is a bit funky on Windows.)

If you have one of the following CPUs, download the latest `libmpv/mpv-dev-x86_64-v3-[date]-git-xxx.7z`:

Intel: Haswell or newer with AVX2 (September 2013 - Present)
or Atom "Gracemont" or newer (Nov 2021 - Present)

AMD: "Excavator" or any Ryzen CPU (c. June 2015 - Present)

If you do not have one of the above CPUs, download the latest `libmpv/mpv-dev-x86_64-[date]-git-xxx.7z`