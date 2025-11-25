-- Increase field length limits for story writing project
-- Run this to increase character limits in the database

USE storydb;

-- Increase story field limits
ALTER TABLE stories 
MODIFY COLUMN description TEXT,  -- Changed from VARCHAR(500) to TEXT (65,535 chars)
MODIFY COLUMN writers TEXT,      -- Changed from VARCHAR(500) to TEXT (65,535 chars)
MODIFY COLUMN title VARCHAR(500); -- Increased from VARCHAR(255) to VARCHAR(500)

-- Increase character field limits
ALTER TABLE characters
MODIFY COLUMN name VARCHAR(255),        -- Increased from VARCHAR(100) to VARCHAR(255)
MODIFY COLUMN role VARCHAR(255),        -- Increased from VARCHAR(100) to VARCHAR(255)
MODIFY COLUMN description TEXT,         -- Changed from VARCHAR(1000) to TEXT (65,535 chars)
MODIFY COLUMN actor_name VARCHAR(255);  -- Increased from VARCHAR(100) to VARCHAR(255)

-- Verify changes
DESCRIBE stories;
DESCRIBE characters;

SELECT 
    COLUMN_NAME, 
    COLUMN_TYPE, 
    CHARACTER_MAXIMUM_LENGTH 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'storydb' 
  AND TABLE_NAME = 'stories' 
  AND COLUMN_NAME IN ('title', 'description', 'writers', 'content');

SELECT 
    COLUMN_NAME, 
    COLUMN_TYPE, 
    CHARACTER_MAXIMUM_LENGTH 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'storydb' 
  AND TABLE_NAME = 'characters' 
  AND COLUMN_NAME IN ('name', 'role', 'description', 'actor_name');
