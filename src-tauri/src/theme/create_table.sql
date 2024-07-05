CREATE TABLE IF NOT EXISTS THEMES (
	id INTEGER PRIMARY KEY,
	identifier TEXT,
	name TEXT,
	version_major INTEGER,
	version_minor INTEGER,
	version_patch INTEGER,
	description TEXT,
	authors TEXT,
	sound BOOLEAN NOT NULL CHECK (sound IN (0, 1)),
	icons BOOLEAN NOT NULL CHECK (icons IN (0, 1)),
	music BOOLEAN NOT NULL CHECK (music IN (0, 1)),
	UNIQUE(identifier)
)