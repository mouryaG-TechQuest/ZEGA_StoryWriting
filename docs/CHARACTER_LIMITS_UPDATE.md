# Character Limits Update - Database-Driven Configuration

## Overview
All character limits have been updated to match the actual MySQL database schema limits. The system now uses database column definitions as the source of truth for all field length validations.

## Updated Field Limits

### Story Fields
| Field | Previous Limit | New Limit | Database Column |
|-------|---------------|-----------|-----------------|
| Title | 255 | **500** | VARCHAR(500) |
| Description | 500 | **65,535** | TEXT |
| Writers | 500 | **65,535** | TEXT |
| Content | - | **65,535** | TEXT |

### Character Fields
| Field | Previous Limit | New Limit | Database Column |
|-------|---------------|-----------|-----------------|
| Name | 100 | **255** | VARCHAR(255) |
| Role | 100 | **255** | VARCHAR(255) |
| Description | 1,000 | **65,535** | TEXT |
| Actor Name | 100 | **255** | VARCHAR(255) |

### Scene Fields (JSON in timelineJson)
| Field | Previous Limit | New Limit | Database Column |
|-------|---------------|-----------|-----------------|
| Title | - | **1,000** | Part of TEXT (65K total) |
| Event | 255 | **1,000** | Part of TEXT (65K total) |
| Description | 2,000 | **10,000** | Part of TEXT (65K total) |
| Content | - | **10,000** | Part of TEXT (65K total) |

**Important Note on Scenes**: All scenes are stored as a JSON array in the `timeline_json` column (TEXT = 65,535 characters max). Individual scene limits are set conservatively to allow multiple scenes while preventing database overflow.

## Database Schema

### Current Schema (stories table)
```sql
title          VARCHAR(500)     -- Story title
description    TEXT             -- Short description (65,535 chars)
writers        TEXT             -- Writer credits (65,535 chars)
content        TEXT             -- Full story content (65,535 chars)
timeline_json  TEXT             -- Scene timeline as JSON (65,535 chars)
```

### Current Schema (characters table)
```sql
name           VARCHAR(255)     -- Character name
role           VARCHAR(255)     -- Character role
description    TEXT             -- Character bio (65,535 chars)
actor_name     VARCHAR(255)     -- Actor/voice actor name
```

## Implementation Details

### 1. Frontend (constants.js)
```javascript
export const FIELD_LIMITS = {
  STORY: {
    TITLE: 500,           // VARCHAR(500)
    DESCRIPTION: 65535,   // TEXT field
    WRITERS: 65535,       // TEXT field
    CONTENT: 65535,       // TEXT field
  },
  CHARACTER: {
    NAME: 255,            // VARCHAR(255)
    ROLE: 255,            // VARCHAR(255)
    DESCRIPTION: 65535,   // TEXT field
    ACTOR_NAME: 255,      // VARCHAR(255)
  },
  SCENE: {
    TITLE: 1000,          // JSON in TEXT field
    EVENT: 1000,          // JSON in TEXT field
    DESCRIPTION: 10000,   // JSON in TEXT field (conservative)
    CONTENT: 10000,       // JSON in TEXT field (conservative)
  },
};
```

### 2. Backend Validation (Jakarta)
- **StoryRequest.java**: `@Size` annotations match database limits
- **CharacterRequest.java**: `@Size` annotations match database limits
- **Story.java**: `@Column` definitions match database schema
- **Character.java**: `@Column` definitions match database schema

### 3. AI Model Awareness
All AI prompts updated with explicit length constraints:

**Scene Generation** (ensemble.py & model.py):
```python
"IMPORTANT LENGTH LIMITS: title max 1000 chars, content max 10000 chars, 
character name max 255 chars, character role max 255 chars, 
character description max 10000 chars."
```

**Title Generation**:
```python
"IMPORTANT: Each title must be under 500 characters."
```

**Description Autocomplete**:
```python
"IMPORTANT: Keep the total description under 65535 characters (TEXT field limit)."
```

## Validation Layers

### Layer 1: Frontend Prevention
- `maxLength` attribute on all input fields
- Real-time character counters
- Visual warning at 90% capacity (orange background)
- Hard limit prevents input beyond maximum

### Layer 2: Backend Validation
- Jakarta `@Valid` annotations on controller endpoints
- `@Size` annotations on DTO fields
- Returns 400 Bad Request with clear error messages

### Layer 3: AI Self-Limitation
- System prompts include explicit character limits
- AI models generate content within constraints
- Prevents generation errors and database truncation

### Layer 4: Database Enforcement
- Column definitions enforce hard limits
- TEXT columns support up to 65,535 characters
- VARCHAR columns sized appropriately

## MySQL TEXT Type Limits

| Type | Maximum Length |
|------|----------------|
| TINYTEXT | 255 bytes |
| TEXT | **65,535 bytes** (used for descriptions) |
| MEDIUMTEXT | 16,777,215 bytes |
| LONGTEXT | 4,294,967,295 bytes |

**Note**: TEXT type chosen as optimal balance between capacity (65K is sufficient for rich content) and performance.

## Database Migration

Run this SQL script to update existing database:
```sql
USE storydb;

-- Story field updates
ALTER TABLE stories 
MODIFY COLUMN description TEXT,
MODIFY COLUMN writers TEXT,
MODIFY COLUMN title VARCHAR(500);

-- Character field updates
ALTER TABLE characters
MODIFY COLUMN name VARCHAR(255),
MODIFY COLUMN role VARCHAR(255),
MODIFY COLUMN description TEXT,
MODIFY COLUMN actor_name VARCHAR(255);
```

**Migration Script Location**: `microservices/story-service/increase-limits.sql`

## Testing Checklist

- [ ] Run database migration script
- [ ] Restart backend service (Spring Boot)
- [ ] Restart AI service (ZEGA)
- [ ] Test story creation with long description (>500 chars)
- [ ] Test character creation with long description (>1000 chars)
- [ ] Test scene generation with AI (verify 10K limit respected)
- [ ] Verify character counters show correct limits
- [ ] Verify validation errors at limit boundaries
- [ ] Check that no SQL truncation errors occur

## Benefits

1. **No Manual Limits**: All limits derived from database schema
2. **Consistency**: Frontend, backend, and AI use same limits
3. **No Errors**: 4-layer validation prevents SQL truncation errors
4. **User-Friendly**: Real-time feedback with character counters
5. **AI-Aware**: Models generate content within database constraints
6. **Scalable**: Easy to update by changing database schema

## Future Considerations

If you need larger capacity:
- Consider MEDIUMTEXT (16MB) for very long stories
- Consider separate `scenes` table instead of JSON storage
- Consider pagination for very large timeline displays

## Files Modified

### Frontend
- `Frontend/src/utils/constants.js` - Updated FIELD_LIMITS
- `Frontend/src/components/StoryForm.tsx` - Character counters already implemented

### Backend
- `microservices/story-service/src/main/java/com/storyapp/story/dto/StoryRequest.java`
- `microservices/story-service/src/main/java/com/storyapp/story/dto/CharacterRequest.java`
- `microservices/story-service/src/main/java/com/storyapp/story/model/Story.java`
- `microservices/story-service/src/main/java/com/storyapp/story/model/Character.java`
- `microservices/story-service/increase-limits.sql` - Database migration

### AI Service
- `AIservices/zega/core/ensemble.py` - Updated all prompts with limits
- `AIservices/zega/core/model.py` - Updated all prompts with limits

## Contact
For questions about character limits or database schema, refer to this document or check the database schema directly using:
```sql
DESCRIBE stories;
DESCRIBE characters;
```
