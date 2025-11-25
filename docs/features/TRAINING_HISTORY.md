# Training History System

## Overview

The Training History system provides a comprehensive audit trail of all AI model training sessions. Every time a user trains the AI model using the auto-training feature, a complete record is saved to the database with detailed metrics, model performance data, and session metadata.

## Features

### 1. Session Tracking
- **Unique Session ID**: Each training session gets a unique identifier (UUID)
- **User Attribution**: Links training sessions to specific users
- **Timestamps**: Records start time, completion time, and creation time
- **Duration Tracking**: Total time spent on training session

### 2. Training Metrics
- **Examples Generated**: Tracks requested, successful, and failed examples
- **Quality Scores**: Records minimum, maximum, and average quality scores
- **Genre Distribution**: JSON-formatted list of genres used in training
- **Storage Options**: Tracks whether examples were stored in memory or saved to database

### 3. Model Performance Analytics
- **Best Performing Model**: Identifies which model won the most votes
- **Model Performance JSON**: Detailed statistics for each model including:
  - Number of times each model won
  - Average quality score per model
  - Total quality contribution per model
- **Ensemble Voting Details**: Complete voting record from teacher models

### 4. Fine-Tuning Status
- **Training Progress**: Records training examples before and after session
- **Fine-Tuning Trigger**: Flags sessions that triggered model fine-tuning
- **Cumulative Tracking**: Shows progression toward fine-tuning threshold (50 examples)

## Database Schema

### Table: `training_history`

```sql
CREATE TABLE training_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    
    -- Request Configuration
    num_examples_requested INT NOT NULL,
    num_examples_successful INT NOT NULL,
    num_examples_failed INT NOT NULL,
    genres_selected TEXT,
    
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
    model_performance_json TEXT,
    genre_distribution_json TEXT,
    
    -- Timing and Progress
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
);
```

## API Endpoints

### 1. Save Training History
```http
POST /api/training-history
Content-Type: application/json

{
  "userId": 1,
  "sessionId": "abc123...",
  "numExamplesRequested": 10,
  "numExamplesSuccessful": 9,
  "numExamplesFailed": 1,
  "genresSelected": "[\"fantasy\", \"sci-fi\"]",
  "storedInMemory": false,
  "savedToDatabase": true,
  "storiesSavedCount": 3,
  "averageQuality": 8.5,
  "minQuality": 7.2,
  "maxQuality": 9.8,
  "bestPerformingModel": "gemini-2.0",
  "modelPerformanceJson": "{...}",
  "genreDistributionJson": "{...}",
  "totalTimeSeconds": 180,
  "trainingExamplesBefore": 40,
  "trainingExamplesAfter": 49,
  "finetuningTriggered": false,
  "startedAt": "2024-01-20T10:30:00",
  "completedAt": "2024-01-20T10:33:00"
}
```

**Response**: `201 Created` with saved TrainingHistory object

### 2. Get User Training History
```http
GET /api/training-history/user/{userId}
```

**Response**: Array of all training sessions for the user, sorted by start time (newest first)

### 3. Get Paginated Training History
```http
GET /api/training-history/user/{userId}/paginated?page=0&size=10
```

**Response**: Paginated list with total pages and elements

### 4. Get Specific Session
```http
GET /api/training-history/session/{sessionId}
```

**Response**: Single training session details

### 5. Get Training Statistics
```http
GET /api/training-history/user/{userId}/stats
```

**Response**:
```json
{
  "totalSessions": 15,
  "totalExamplesGenerated": 150,
  "totalStoriesSaved": 45,
  "averageQuality": 8.3,
  "totalTrainingTimeSeconds": 2700,
  "fineTuningSessionsCount": 2
}
```

### 6. Get Recent Sessions
```http
GET /api/training-history/user/{userId}/recent?limit=5
```

**Response**: Last N training sessions, sorted by completion time

## Frontend Components

### TrainingHistory Component

**Location**: `Frontend/src/components/TrainingHistory.tsx`

**Features**:
- **Statistics Cards**: Display aggregate metrics at the top
  - Total sessions with fine-tuning count
  - Total examples generated with stories saved
  - Average quality with total training time
  
- **Training History Table**: Sortable, expandable table showing:
  - Session date and time
  - Examples generated (successful/requested)
  - Quality scores (min-avg-max)
  - Best performing model
  - Time duration
  - Details expand button
  
- **Expandable Details**: Click any row to see:
  - Session ID
  - Genres used
  - Storage options (memory/database)
  - Fine-tuning status
  - Model performance breakdown (wins and quality per model)

### Integration in Settings Page

**Location**: `Frontend/src/pages/Settings/Settings.tsx`

The Training History component is integrated as a new section in the Settings page:

1. **Navigation**: Added "Training History" button in sidebar
2. **Icon**: Uses clipboard/document icon
3. **Active State**: Purple highlight when selected
4. **Layout**: Full-width content area with proper spacing

## Auto-Trainer Integration

### Location: `AIservices/zega/core/auto_trainer.py`

### Key Changes

1. **Imports Added**:
   ```python
   import json
   import uuid
   ```

2. **Training History URL**:
   ```python
   self.training_history_url = "http://localhost:8082/api/training-history"
   ```

3. **Pre-Training Stats**:
   ```python
   stats_before = self.finetuning.get_user_stats(user_id)
   training_examples_before = stats_before.get("training_examples", 0)
   ```

4. **Quality Min/Max Tracking**:
   ```python
   results["min_quality"] = min(quality_scores)
   results["max_quality"] = max(quality_scores)
   ```

5. **History Save Call**:
   ```python
   await self._save_training_history(
       user_id=user_id,
       start_time=start_time,
       end_time=end_time,
       num_examples=num_examples,
       genres=genres,
       save_to_database=save_to_database,
       results=results,
       training_examples_before=training_examples_before
   )
   ```

6. **New Method**: `_save_training_history()`
   - Generates unique session ID with `uuid.uuid4().hex`
   - Collects all metrics from results dictionary
   - Gets final training stats after completion
   - Determines best performing model
   - Serializes JSON data (genres, model performance, genre distribution)
   - Makes HTTP POST to training history endpoint
   - Handles errors gracefully (doesn't fail training if history save fails)

## Usage Flow

### 1. User Starts Training
```
User → Settings → AI Training → Configure Parameters → Start Training
```

### 2. Training Execution
```
Auto-Trainer:
  1. Get pre-training stats (training_examples_before)
  2. Generate examples with ensemble voting
  3. Track quality scores, model wins, genre distribution
  4. Save high-quality stories to database (optional)
  5. Calculate min/max/avg quality
```

### 3. History Recording
```
Auto-Trainer:
  1. Generate unique session_id
  2. Get post-training stats (training_examples_after)
  3. Determine best_performing_model
  4. Serialize JSON data
  5. POST to /api/training-history
  6. Log success/failure
```

### 4. Backend Processing
```
Story Service:
  1. Receive POST request
  2. Parse ISO datetime strings
  3. Create TrainingHistory entity
  4. Save to database
  5. Return saved entity
```

### 5. User Views History
```
User → Settings → Training History:
  1. Load all training sessions
  2. Load aggregate statistics
  3. Display in table with expandable details
  4. Show model performance comparisons
```

## Data Flow

### Training Session → Database

```
Python Auto-Trainer
    ↓ (HTTP POST)
Spring Boot Controller
    ↓
Training History Service
    ↓
Training History Repository
    ↓
MySQL Database (training_history table)
```

### Database → Frontend

```
React Component (TrainingHistory.tsx)
    ↓ (HTTP GET)
Training History Service (trainingHistory.service.ts)
    ↓
Spring Boot Controller
    ↓
Training History Repository
    ↓
MySQL Database
    ↓
Training History Entity
    ↓
JSON Response
```

## Example Training Session

### Request Configuration
```json
{
  "num_examples": 20,
  "genres": ["fantasy", "mystery", "sci-fi"],
  "save_to_database": true
}
```

### Generated Results
```json
{
  "total_requested": 20,
  "successful": 18,
  "failed": 2,
  "average_quality": 8.4,
  "min_quality": 7.1,
  "max_quality": 9.8,
  "stories_saved": 5,
  "model_performance": {
    "gemini-2.0": {"count": 8, "avg_quality": 8.9},
    "groq-llama": {"count": 6, "avg_quality": 8.3},
    "claude-sonnet": {"count": 4, "avg_quality": 7.8}
  }
}
```

### Saved History Record
```json
{
  "id": 123,
  "userId": 1,
  "sessionId": "a1b2c3d4e5f6...",
  "numExamplesRequested": 20,
  "numExamplesSuccessful": 18,
  "numExamplesFailed": 2,
  "genresSelected": "[\"fantasy\",\"mystery\",\"sci-fi\"]",
  "storedInMemory": false,
  "savedToDatabase": true,
  "storiesSavedCount": 5,
  "averageQuality": 8.4,
  "minQuality": 7.1,
  "maxQuality": 9.8,
  "bestPerformingModel": "gemini-2.0",
  "totalTimeSeconds": 360,
  "trainingExamplesBefore": 30,
  "trainingExamplesAfter": 48,
  "finetuningTriggered": false
}
```

## Benefits

### 1. User Insights
- Track training progress over time
- Identify best performing models
- Analyze quality trends
- Monitor genre preferences

### 2. Debugging
- Complete audit trail for troubleshooting
- Session-level error tracking
- Performance regression detection
- Quality variance analysis

### 3. Analytics
- User engagement metrics
- Model performance comparison
- Training effectiveness measurement
- Fine-tuning readiness tracking

### 4. Optimization
- Identify optimal training configurations
- Compare genre performance
- Evaluate model selection strategies
- Time estimation improvements

## Performance Considerations

### Database
- **Indexes**: Optimized for user_id and started_at queries
- **JSON Storage**: TEXT columns for flexible data structures
- **Pagination**: Built-in support for large result sets

### API
- **Async Operations**: Non-blocking history saves
- **Error Handling**: Training continues even if history save fails
- **Batch Queries**: Efficient aggregation for statistics

### Frontend
- **Lazy Loading**: Components load data on mount
- **Expandable Details**: Reduces initial render load
- **Caching**: Uses React state for loaded data

## Security

### Access Control
- User-scoped queries (can only see own history)
- Session ID validation
- CORS enabled for cross-origin requests

### Data Privacy
- No sensitive user data in history records
- Session IDs are non-sequential UUIDs
- Quality scores and metrics only (no story content)

## Future Enhancements

### Potential Additions
1. **Export Functionality**: Download training history as CSV/JSON
2. **Filtering**: Filter by date range, genre, quality threshold
3. **Comparison View**: Side-by-side session comparison
4. **Charts**: Quality trends over time, model performance graphs
5. **Recommendations**: Suggest optimal training configurations
6. **Notifications**: Alert when fine-tuning threshold reached
7. **Sharing**: Share training results with other users (opt-in)
8. **Advanced Analytics**: Machine learning insights on training patterns

## Troubleshooting

### Common Issues

**History not saving**:
- Check if story-service is running on port 8082
- Verify database connection
- Check auto_trainer.py logs for HTTP errors
- Ensure training_history table exists

**Missing sessions**:
- Verify user_id matches between systems
- Check database indexes are created
- Look for errors in Spring Boot logs

**Incorrect statistics**:
- Validate JSON serialization in Python
- Check data type conversions (ISO datetime, decimal quality)
- Ensure model_performance calculation is correct

**Frontend not loading**:
- Check API endpoint URLs in trainingHistory.service.ts
- Verify CORS is enabled on backend
- Check browser console for network errors
- Ensure TrainingHistory component is imported correctly

## Testing

### Unit Tests
- Test session ID generation (uniqueness)
- Validate JSON serialization/deserialization
- Test quality score calculations
- Verify model performance aggregation

### Integration Tests
- Test complete training session with history save
- Verify API endpoints return correct data
- Test pagination and filtering
- Validate date range queries

### UI Tests
- Test component rendering with mock data
- Verify expandable details functionality
- Test statistics card calculations
- Validate loading and error states

## Maintenance

### Regular Tasks
- Monitor database size (consider archiving old sessions)
- Review and optimize slow queries
- Update indexes based on query patterns
- Clean up failed/incomplete sessions

### Upgrades
- Add new fields to schema as needed
- Migrate existing data when structure changes
- Update API documentation
- Version frontend components

## Conclusion

The Training History system provides comprehensive tracking and analytics for AI model training sessions. With complete audit trails, detailed performance metrics, and user-friendly UI components, it enables users to understand their training progress and optimize their model development workflow.
