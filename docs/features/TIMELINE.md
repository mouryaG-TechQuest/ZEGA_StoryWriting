# Scene Timeline Feature

## Overview
The Scene Timeline feature provides a **YouTube-style progress bar** interface for story navigation, allowing readers to explore stories scene-by-scene and editors to easily manage and edit individual scenes. This feature transforms story navigation from a simple scroll experience into an interactive, visual journey.

## Features

### For Readers (All Users)
- **Interactive Timeline Bar**: Click on any scene bar to jump directly to that scene.
- **Scene Navigation**: Previous/Next buttons for sequential reading.
- **Visual Progress**: Color-coded scene bars showing current position.
- **Scene Content**: View scene descriptions, images, and characters.
- **Character Highlighting**: Character names are highlighted with consistent colors throughout the story.
- **Quick Jump Grid**: Grid view for rapid navigation between scenes.
- **Hover Tooltips**: Preview scene titles by hovering over timeline bars.
- **Dual View Modes**: Toggle between "Scene Timeline" (interactive) and "Full Story" (traditional text) views.

### For Editors (Story Owners Only)
- **Edit Scene Button**: Quick access to edit any scene directly from the timeline.
- **Editor Mode Indicators**: Visual cues showing edit capabilities.
- **Direct Scene Editing**: Click timeline bar to navigate and edit specific scenes.
- **Full Story Edit**: Option to edit the entire story structure from the header.

## User Guide

### Reader Workflow
1. **Open Story**: Click on any story card to open the detail modal.
2. **View Timeline**: The "Scene Timeline" tab is shown by default.
3. **Navigate**:
    - Click on any scene bar in the timeline to jump to that scene.
    - Use the **Previous** and **Next** buttons to move sequentially.
    - Hover over bars to see scene titles.
4. **Read Content**: Read the scene description, view images, and see cast members. Character names are highlighted for easy tracking.
5. **Quick Jump**: Scroll down to use the Quick Jump grid for rapid navigation.
6. **Switch View**: Toggle to "Full Story" view to see the entire text at once.

### Editor Workflow
1. **Open Story**: Open a story you own.
2. **Edit Options**:
    - **Edit Story**: Click the button in the header to edit the full story.
    - **Edit Scene**: Navigate to a specific scene and click the "Edit Scene" button (yellow) to modify just that scene.
3. **Scene Editor**:
    - Modify scene title, description, characters, and images.
    - Save changes to update the timeline immediately.
4. **Create Scenes**:
    - In the "Write Story" tab, click "+ Add Timeline Entry".
    - Fill in scene details and reorder using Up/Down arrows.

## Visual Guide

### Timeline Bar
The timeline bar represents the story's scenes visually:
```
┌────────────────────────────────────────────────────────┐
│ Scene 1 of 10                         [Edit Scene]      │
├────────────────────────────────────────────────────────┤
│ [1][2][3][4][5][6][7][8][9][10]                        │
│  ▲ Active scene highlighted                             │
├────────────────────────────────────────────────────────┤
│ [◄ Previous]    Scene Title          [Next ►]          │
└────────────────────────────────────────────────────────┘
```

### Color System
- **Scene Colors**: Scenes cycle through 10 distinct colors (Blue, Purple, Pink, Red, Orange, Yellow, Green, Teal, Cyan, Indigo) to visually distinguish them.
- **Character Highlighting**: Characters are assigned consistent colors based on their position in the character list. Names in the text formatted as `***CharacterName***` are automatically highlighted.

## Technical Implementation

### Components
- **`SceneTimelineViewer.tsx`**: Main component for timeline visualization and navigation. Handles scrolling, color assignment, and user interaction.
- **`StoryDetailModal.tsx`**: Integrates the timeline viewer and handles view mode switching.

### Data Structure
Timeline data is stored as a JSON string in the `Story` entity.

**TimelineEntry Interface:**
```typescript
interface TimelineEntry {
  id: string;              // Unique identifier
  event: string;           // Scene title
  description: string;     // Scene content
  characters: string[];    // Character names in scene
  imageUrls: string[];     // Scene images
  order: number;          // Scene sequence
}
```

**Backend Model:**
```java
@Entity
@Table(name = "stories")
public class Story {
    // ...
    @Lob
    @Column(name = "timeline_json", columnDefinition = "TEXT")
    private String timelineJson;
    // ...
}
```

### API Integration
- **Save**: The frontend serializes the `timeline` array to a JSON string before sending it to the backend.
- **Load**: The frontend parses the `timelineJson` string back into an array and sorts it by `order`.

## Troubleshooting

### Common Issues
- **Timeline Not Showing**: Ensure the story has timeline data (`timelineJson` is not null/empty). Switch to "Full Story" view if no scenes exist.
- **Characters Not Highlighted**: Verify character names in the description match the `***Name***` format and that the character exists in the story's character list.
- **Edit Button Missing**: Ensure you are logged in as the author of the story.
- **Navigation Issues**: If clicking scenes doesn't work, check for JavaScript errors in the console.

## Future Enhancements
- **Scene Duration**: Estimated reading time per scene.
- **Comments**: Scene-specific comments.
- **Analytics**: Most viewed scenes.
- **Export**: Export timeline to PDF/screenplay format.
