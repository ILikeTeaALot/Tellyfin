# React

I don't want to end up locked into React, because frankly it's not all that. The likely replacement is Svelte but I'm not decided yet.

# ESLint

Yes ESLint ~~can be~~ is f***ing annoying ~~sometimes~~, but when dealing with React hooks a second pair of automated eyes is very helpful.

## JellyFin

### Library Request

`IsFolder = true` for libraries

`CollectionType = "tvshows"` for TV library... seemingly blank for Films/Movies

Use `GET /UserViews` not `GET /LibraryFolders`! The initial mistake was made based on the example given by `@jellyfin/sdk`. Jellyfin doesn't have any API usage docs, only specifications. To anyone else developing a client, always consult the Jellyfin web interface before anything else.