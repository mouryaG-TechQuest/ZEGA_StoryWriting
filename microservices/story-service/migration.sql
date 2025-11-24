-- Database Migration Script for Story Writing Project Enhanced Features
-- Run this if you have existing data and need to add new columns

USE storydb;

-- Add new columns to stories table
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS description VARCHAR(500),
ADD COLUMN IF NOT EXISTS timeline_json TEXT,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0 NOT NULL;

-- Add new column to characters table
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS actor_name VARCHAR(255);

-- Create story_images table
CREATE TABLE IF NOT EXISTS story_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    story_id BIGINT,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    story_id BIGINT NOT NULL,
    username VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (story_id, username),
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    story_id BIGINT NOT NULL,
    username VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_favorite (story_id, username),
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_likes_username ON likes(username);
CREATE INDEX IF NOT EXISTS idx_likes_story_id ON likes(story_id);
CREATE INDEX IF NOT EXISTS idx_favorites_username ON favorites(username);
CREATE INDEX IF NOT EXISTS idx_favorites_story_id ON favorites(story_id);
CREATE INDEX IF NOT EXISTS idx_stories_published ON stories(is_published);

-- Optional: Create uploads directory (run in terminal)
-- mkdir -p uploads/stories

-- Verify changes
DESCRIBE stories;
DESCRIBE characters;
DESCRIBE story_images;
DESCRIBE likes;
DESCRIBE favorites;
