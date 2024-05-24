# Notes

As of 14:08 on 23/05/2024, I have determined that there is a memory leak somewhere within the `Home` or `GamepadContext` components.

I systematically checked enabling and disabling different parts of the interface:

 - `MpvStateProvider` was first, and works fine,
 - `GamepadContext` was second, and seemed to cause some issue,
 - `SWRConfig` was next, and works fine, which is unsurprising because it's just a config provider.
 - `AppInner` modified to return `null` was fine, which led me to test
 - `AppInner` with only `AppMode.Provider`, `SwitchMode.Provider`, and the two `<div class="background .." ... />`s, which were all fine in combination.
 - `AppInner` as above + `StatusBar`, which again worked fine, although caused a cycle of building up around 4-5MB before a milk 1% spike in CPU usage and a drop back to the starting memory amount (presumably GC running on items related to the `setInterval`.)
 - `AppInner` as above + `Video`, which I was pleasantly surprised to find worked without issue, however without access to `Home` there is not really a way to test with media actually playing.

∴ the only components remaining to be checked are `Home` and `GamepadContext`, ergo one of them must be the root of the leak (OR it is something with MS Edge WebView2)

## Update 14:19

`Home` with all 3 screen types set to return `null` (i.e. all hooks still executing, but only `<div id="home-root">{...}</div>` being rendered with no contents), there appears to be no leak.

## Update 15:30

When testing with video actually playing, something within `Video` appears to be a/the cause of the leak.

## Update 17:00

Still having leak issues... I no longer have much of a clue why...

## Update 18:00

Turns out I had mixed up a value in milliseconds and a value in seconds in an update function... That was annoying.

# React

I don't want to end up locked into React, because frankly it's not all that. The likely replacement is Svelte but I'm not decided yet.

# ESLint

Yes ESLint ~~can be~~ is f***ing annoying ~~sometimes~~, but when dealing with React hooks a second pair of automated eyes is very helpful.
