# Genre Feature

## Overview
A comprehensive genre system has been implemented, allowing writers to categorize their stories and readers to discover content based on their interests. This feature includes multi-select genre tagging, validation, filtering, and search capabilities.

## Features

### For Writers
- **Mandatory Selection**: Writers must select at least one genre when creating or updating a story.
- **Multi-Select**: Stories can belong to multiple genres (e.g., "Action" and "Sci-Fi").
- **Validation**: The story form enforces genre selection, disabling submission until at least one genre is chosen.
- **Flexible Updates**: Genres can be easily modified during story editing.

### For Readers
- **Genre Filtering**: Filter stories by selecting one or more genres from the search bar dropdown.
- **Search Integration**: Search queries include genre names (e.g., searching "sci-fi" finds stories tagged with that genre).
- **Visual Badges**: Story cards display genre badges (up to 4, with a "+X more" indicator) for quick identification.

## Available Genres
The system comes with 20 predefined genres:
1. Action
2. Adventure
3. Comedy
4. Drama
5. Fantasy
6. Horror
7. Mystery
8. Romance
9. Sci-Fi
10. Thriller
11. Historical
12. Biography
13. Crime
14. War
15. Western
16. Animation
17. Documentary
18. Musical
19. Superhero
20. Supernatural

## Technical Implementation

### Backend
- **Entities**:
    - `Genre`: Stores genre ID, name (unique), and description.
    - `StoryGenre`: Manages the many-to-many relationship between `Story` and `Genre`.
    - `Story`: Updated to include a list of `StoryGenre`.
- **API**:
    - `GET /api/stories/genres`: Returns all available genres.
    - `POST /api/stories`: Accepts `genreIds` list.
    - `PUT /api/stories/{id}`: Updates genre assignments.
- **Initialization**: `GenreInitializer` seeds the database with the 20 standard genres on startup if the table is empty.

### Frontend
- **StoryForm**: Features a checkbox grid for genre selection with live validation.
- **SearchBar**: Includes a multi-select dropdown for filtering stories by genre.
- **StoryCard**: Displays genre badges with a gradient design.
- **State Management**: Fetches genres on app load and integrates them into search and filter logic.

## Troubleshooting

### Common Issues
- **Genres Not Loading**: If the genre list is empty or fails to load, ensure the `story-service` is running and connected to the database.
- **Fetch Errors**: If you see "Failed to fetch genres" on startup, it may be due to Eureka service discovery latency. Use `quick-start-improved.bat` to ensure services start in the correct order with sufficient wait times.
- **Validation Errors**: If you cannot submit a story, verify that at least one genre is selected.

## Database Schema
**genres** table:
```sql
CREATE TABLE genres (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,
    description VARCHAR(500)
);
```

**story_genres** table:
```sql
CREATE TABLE story_genres (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    story_id BIGINT NOT NULL,
    genre_id BIGINT NOT NULL,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id)
);
```
