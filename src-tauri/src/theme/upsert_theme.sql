INSERT INTO THEMES
(name, identifier, version_major, version_minor, version_patch, description, authors, sound, icons, music)
VALUES
(?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
ON CONFLICT(identifier) DO UPDATE
SET
name = ?1,
identifier = ?2,
version_major = ?3,
version_minor = ?4,
version_patch = ?5,
description = ?6,
authors = ?7,
sound = ?8,
icons = ?9,
music = ?10
-- WHERE
-- ?3 > version_major OR
-- (?3 >= version_major AND version_minor > ?4)
-- OR (?3 >= version_major AND version_minor >= ?4 AND version_patch >= ?5)