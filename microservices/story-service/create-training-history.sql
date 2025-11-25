-- Training History Table
-- Stores all AI model training sessions for tracking and analytics

CREATE TABLE IF NOT EXISTS training_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Training Configuration
    num_examples_requested INT NOT NULL,
    num_examples_successful INT NOT NULL,
    num_examples_failed INT NOT NULL,
    genres_selected TEXT,  -- JSON array of selected genres
    
    -- Storage Options
    stored_in_memory BOOLEAN DEFAULT FALSE,
    saved_to_database BOOLEAN DEFAULT FALSE,
    stories_saved_count INT DEFAULT 0,
    
    -- Quality Metrics
    average_quality DECIMAL(3,1),
    min_quality DECIMAL(3,1),
    max_quality DECIMAL(3,1),
    
    -- Model Performance
    best_performing_model VARCHAR(100),
    model_performance_json TEXT,  -- JSON with all model stats
    
    -- Genre Distribution
    genre_distribution_json TEXT,  -- JSON with genre counts
    
    -- Training Results
    total_time_seconds INT,
    training_examples_before INT,
    training_examples_after INT,
    fine_tuning_triggered BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_started_at (started_at),
    INDEX idx_user_started (user_id, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment
ALTER TABLE training_history COMMENT = 'Tracks all AI model training sessions with configuration and results';
