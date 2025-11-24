-- Clean all data from Story Writing Project databases

-- Switch to userdb and clean all tables
USE userdb;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- Switch to storydb and clean all tables
USE storydb;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE comments;
TRUNCATE TABLE likes;
TRUNCATE TABLE favorites;
TRUNCATE TABLE story_images;
TRUNCATE TABLE characters;
TRUNCATE TABLE stories;

SET FOREIGN_KEY_CHECKS = 1;

-- Verify all tables are empty
SELECT 'userdb.users' AS table_name, COUNT(*) AS row_count FROM userdb.users
UNION ALL
SELECT 'storydb.stories', COUNT(*) FROM storydb.stories
UNION ALL
SELECT 'storydb.characters', COUNT(*) FROM storydb.characters
UNION ALL
SELECT 'storydb.story_images', COUNT(*) FROM storydb.story_images
UNION ALL
SELECT 'storydb.likes', COUNT(*) FROM storydb.likes
UNION ALL
SELECT 'storydb.favorites', COUNT(*) FROM storydb.favorites
UNION ALL
SELECT 'storydb.comments', COUNT(*) FROM storydb.comments;

SELECT 'All tables cleaned successfully!' AS status;
