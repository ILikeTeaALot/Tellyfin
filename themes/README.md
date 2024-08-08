# Themes

Themes can be used in two forms: a `[theme_name].tft` file or a `[theme_name]/` folder.

Currently, only the folder-format of themes is supported.

To install a theme, drop the folder alongside this file and ensure it has the following structure:

```
themes/
	├─ Theme 1/
	│	├─ [icon]
	│	│	├─ ...
	│	│	└─ Icons.toml
	│	└─ Theme.toml
	└─ Theme 2/
		├─ [icon]
		│	├─ ...
		│	└─ Icons.toml
		├─ [music]
		│	├─ ...
		│	└─ Music.toml
		├─ [sound]
		│	├─ ...
		│	└─ Sounds.toml
		├─ ...
		│
		└─ Theme.toml
```

(`[Square Brackets]` indicate optional directories dependant on the capabilities specified in `Theme.toml`)

(`...` indicate unspecified file structures. It is up to the theme author to decide the layout of their icons, music, and sound directories.)