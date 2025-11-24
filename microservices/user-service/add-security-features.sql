-- Add new columns to users table for enhanced security and OAuth support
ALTER TABLE users
ADD COLUMN first_name VARCHAR(100),
ADD COLUMN last_name VARCHAR(100),
ADD COLUMN phone_number VARCHAR(20),
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN email_verification_token VARCHAR(255),
ADD COLUMN verification_token_expiry TIMESTAMP,
ADD COLUMN password_reset_token VARCHAR(10),
ADD COLUMN password_reset_token_expiry TIMESTAMP,
ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'local',
ADD COLUMN provider_id VARCHAR(255),
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Update existing users to have default values
UPDATE users 
SET first_name = 'User', 
    last_name = username, 
    email_verified = TRUE,
    auth_provider = 'local',
    created_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE first_name IS NULL;

-- Make firstName and lastName non-nullable after setting defaults
ALTER TABLE users
MODIFY COLUMN first_name VARCHAR(100) NOT NULL,
MODIFY COLUMN last_name VARCHAR(100) NOT NULL;

-- Make email non-nullable if not already
ALTER TABLE users
MODIFY COLUMN email VARCHAR(255) NOT NULL UNIQUE;

-- Create password_history table to prevent password reuse
CREATE TABLE IF NOT EXISTS password_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    password_hash VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- Add index for better performance on token lookups
CREATE INDEX idx_email_verification_token ON users(email_verification_token);
CREATE INDEX idx_password_reset_token ON users(password_reset_token);
CREATE INDEX idx_provider_id ON users(provider_id);
CREATE INDEX idx_email ON users(email);

-- Insert current passwords into password_history for existing users
INSERT INTO password_history (user_id, password_hash, created_at)
SELECT id, password, CURRENT_TIMESTAMP
FROM users
WHERE password IS NOT NULL;
