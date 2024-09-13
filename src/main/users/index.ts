import { db } from "../database";

const USER_TABLES_SETUP = `--sql
	CREATE TABLE IF NOT EXISTS ContentProvider (
		Id INTEGER PRIMARY KEY,
		Name TEXT NOT NULL,
		Type TEXT NOT NULL UNIQUE
	);

	INSERT OR IGNORE INTO
		ContentProvider (Id, Name, Type)
	VALUES
		(1, 'Jellyfin', 'org.jellyfin');

	CREATE TABLE IF NOT EXISTS Server (
		Id INTEGER PRIMARY KEY,
		ContentProviderId INTEGER NOT NULL,
		Address TEXT NOT NULL,
		Name TEXT NOT NULL,
		UNIQUE(ContentProviderId, Address),
		FOREIGN KEY (ContentProviderId) REFERENCES ContentProvider(Id)
		ON UPDATE CASCADE ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS Auth (
		Id INTEGER PRIMARY KEY,
		ServerId INTEGER NOT NULL,
		AuthData BLOB,
		UserId INTEGER NOT NULL,
		UNIQUE(ServerId, UserId) ON CONFLICT REPLACE, -- Important!
		FOREIGN KEY (ServerId) REFERENCES Server(Id)
		ON UPDATE CASCADE ON DELETE CASCADE,
		FOREIGN KEY (UserId) REFERENCES User(Id)
		ON UPDATE CASCADE ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS User (
		Id INTEGER PRIMARY KEY,
		Name TEXT NOT NULL,
		Passcode TEXT
	);

	INSERT OR IGNORE INTO
		User (Id, Name, Passcode)
	VALUES
		(1, 'User1', NULL);

	CREATE TABLE IF NOT EXISTS UserView (
		Idx INTEGER PRIMARY KEY,
		Id BLOB UNIQUE,
		Name TEXT NOT NULL,
		UserId INTEGER NOT NULL,
		ServerId INTEGER NOT NULL,
		CollectionType TEXT,
		CollectionId BLOB UNIQUE,
		FOREIGN KEY (UserId) REFERENCES User(Id)
		ON UPDATE CASCADE ON DELETE CASCADE,
		FOREIGN KEY (ServerId) REFERENCES Server(Id)
		ON UPDATE CASCADE ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS ContentCache (
		Id INTEGER PRIMARY KEY,
		ViewId INTEGER NOT NULL,
		Name TEXT NOT NULL,
		ImageUrl TEXT,
		Meta BLOB,
		FOREIGN KEY (ViewId) REFERENCES UserView(Idx)
		ON UPDATE CASCADE ON DELETE CASCADE
	);
`;

// let _ = `--sql
// 	SELECT AuthData FROM Auth INNER JOIN User ON Auth.UserId = User.Id
// `;

export function setupUserServerTables() {
	db.exec_raw(USER_TABLES_SETUP, []);
}