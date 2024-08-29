# Start Tellyfin (for Steam)

To build, run `cargo build --release`

1. Add `[PROJECT ROOT]\target\release\start-tellyfin.exe` as a non-steam game.
	1. Optionally right-clicking *start-tellyfin* afterward and going to Properties to configure the name and icon.
2. Switch Steam to Big Picture mode.
2. Launch Tellyfin outside of steam. (i.e. run `pnpm run start` or double click a packaged `exe` version.)
3. Manually return to Steam (i.e. by `Alt+Tab`-ing), and run *start-tellyfin*.
4. When you wish to return to Steam, simply navigate to the [Games] category and select *Steam*

This process is subject to change and be improved in future, for example by having `start-tellyfin` automatically open a fresh copy of Tellyfin if it is not running.