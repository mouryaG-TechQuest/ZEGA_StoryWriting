-- Add new columns if they don't exist
ALTER TABLE stories ADD COLUMN IF NOT EXISTS story_number VARCHAR(20) UNIQUE;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS total_watch_time BIGINT DEFAULT 0;

-- Create story_views table if it doesn't exist
CREATE TABLE IF NOT EXISTS story_views (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    story_id BIGINT NOT NULL,
    username VARCHAR(255) NOT NULL,
    first_viewed_at DATETIME,
    last_viewed_at DATETIME,
    view_count INT DEFAULT 1,
    UNIQUE KEY unique_story_user (story_id, username),
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

-- Generate story numbers for existing stories (starting from 10000)
SET @row_number = 9999;
UPDATE stories 
SET story_number = (@row_number := @row_number + 1)
WHERE story_number IS NULL
ORDER BY id;

-- Set default total_watch_time for existing stories
UPDATE stories 
SET total_watch_time = 0 
WHERE total_watch_time IS NULL;
