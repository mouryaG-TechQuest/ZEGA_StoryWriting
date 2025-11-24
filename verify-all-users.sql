-- Verify all existing users in the database
-- Run this in MySQL Workbench or your preferred MySQL client

USE userdb;

-- Show current state before update
SELECT 
    id,
    username,
    email,
    email_verified,
    auth_provider,
    created_at
FROM users
ORDER BY id;

-- Update all users to mark them as email verified
-- Using WHERE id >= 0 to satisfy safe update mode (id is a KEY column)
UPDATE users SET email_verified = 1 WHERE id >= 0;

-- Verify the update
SELECT 
    id,
    username,
    email,
    email_verified,
    auth_provider,
    created_at
FROM users
ORDER BY id;
