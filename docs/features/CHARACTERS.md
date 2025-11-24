# Character Management System

## Overview
The Character Management System allows users to create, update, delete, and organize characters within stories. It supports rich metadata, multiple images, popularity tracking, and seamless integration with the Timeline system.

## Data Model

### Character Entity
The `Character` entity is the core data structure.

```java
@Entity
@Table(name = "characters")
public class Character {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    @Size(max = 10000)
    private String description;

    @Size(max = 255)
    private String role;

    @Size(max = 255)
    private String actorName;

    @Min(1) @Max(10)
    private Integer popularity = 5; // Default value

    @ElementCollection
    @CollectionTable(name = "character_images", joinColumns = @JoinColumn(name = "character_id"))
    @Column(name = "image_url")
    private List<String> imageUrls = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id")
    private Story story;
}
```

### Validation Rules
- **Name**: Required, non-blank. Unique per story (case-insensitive).
- **Description**: Max 10,000 characters.
- **Role / Actor Name**: Max 255 characters.
- **Popularity**: Integer 1-10.
- **Uniqueness**: `(story_id, name)` constraint prevents duplicate characters in the same story.

## Features

### 1. Multiple Images
Each character can have multiple images uploaded.
- **Storage**: Images are stored in `uploads/characters/` with UUID prefixes.
- **API**: `POST /api/stories/upload-images?type=character` accepts multiple files.
- **Frontend**: Responsive grid display with add/remove capabilities.

### 2. Popularity System
Characters have a popularity score (1-10) used for sorting and display priority.
- **Sorting**: Characters are sorted by popularity (descending) in lists and carousels.
- **Default**: New characters start with popularity 5.
- **Visibility**: Used internally for sorting; UI badges removed from public view as per business requirements.

### 3. Copy & Paste
Characters can be copied and pasted within the Story Form.
- **Copy**: Stores character data in temporary state.
- **Paste**: Overwrites target character slot with copied data (preserving ID).
- **Duplicate**: "Clone" button in Timeline view creates a new copy of a character.

### 4. Timeline Integration
- Characters are linked to Scenes in the Timeline.
- Renaming a character automatically updates their name in all associated scenes.
- Deleting a character removes them from all scenes.

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/stories/characters` | Create a new character |
| `PUT` | `/api/stories/characters/{id}` | Update an existing character |
| `GET` | `/api/stories/characters` | Get all characters for the authenticated user |
| `DELETE` | `/api/stories/characters/{id}` | Delete a character |
| `POST` | `/api/stories/upload-images` | Upload character images (`type=character`) |

## Error Handling

### Validation Errors (400 Bad Request)
When bean validation fails (e.g., blank name, popularity out of bounds), the API returns a 400 response with details:
```json
{
    "error": "VALIDATION_FAILED",
    "messages": ["name: must not be blank", "popularity: must be less than or equal to 10"]
}
```

### Conflict Errors (409 Conflict)
When attempting to create a character with a name that already exists in the story, the API returns a 409 response:
```json
{
    "error": "CHARACTER_NAME_CONFLICT",
    "message": "Character name already exists in this story"
}
```
The frontend should catch this error and display a user-friendly message.

## Frontend Components

### StoryForm.tsx
- Manages the main character list.
- Handles "Add Character" and "Update Character" logic.
- Implements Copy/Paste functionality.
- Validates inputs (name required, popularity bounds).

### TimelineManager.tsx
- Provides inline character management within the Timeline view.
- Supports "Quick Add" for characters while editing scenes.
- Displays characters sorted by popularity/role.

## Database Schema

```sql
CREATE TABLE characters (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    role VARCHAR(255),
    actor_name VARCHAR(255),
    popularity INT DEFAULT 5,
    story_id BIGINT,
    FOREIGN KEY (story_id) REFERENCES stories(id),
    UNIQUE KEY unique_story_character (story_id, name)
);

CREATE TABLE character_images (
    character_id BIGINT NOT NULL,
    image_url VARCHAR(500),
    FOREIGN KEY (character_id) REFERENCES characters(id)
);
```
