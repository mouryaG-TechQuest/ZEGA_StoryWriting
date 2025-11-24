-- Migration script to add new fields
-- Date: 2025-11-17
-- Description: Add showSceneTimeline to stories and popularity to characters

-- Add showSceneTimeline field to stories table
ALTER TABLE stories ADD COLUMN show_scene_timeline BOOLEAN NOT NULL DEFAULT TRUE;

-- Add popularity field to characters table
ALTER TABLE characters ADD COLUMN popularity INT DEFAULT NULL;

-- Optional: Add comments for documentation
ALTER TABLE stories MODIFY COLUMN show_scene_timeline BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Controls whether readers can see the scene timeline view';
ALTER TABLE characters MODIFY COLUMN popularity INT DEFAULT NULL COMMENT 'Character popularity ranking (1-10 scale)';
