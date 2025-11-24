# Story Cards & Browsing

## Overview
The story browsing experience has been enhanced with beautiful, responsive story cards, advanced search functionality, and smart pagination.

## Features

### Enhanced Story Cards
- **Visual Design**: Beautiful gradient headers and responsive image displays.
- **Fallbacks**: Animated gradient placeholders for stories without images.
- **Stats**: Displays Likes, Comments, and View Counts.
- **Cast & Author**: Shows author avatar and a preview of cast members.
- **Actions**: Quick access to Read, Edit (for owners), and Favorite.

### Search & Filtering
- **Multi-Field Search**: Real-time search across Title, Author, Description, Character Names, and Actor Names.
- **Advanced Sorting**:
    - Newest First
    - Oldest First
    - Most Liked
    - Most Viewed
- **Genre Filtering**: Filter by one or multiple genres.

### Pagination
- **Smart Navigation**: First/Last, Previous/Next buttons, and smart page number display.
- **Customizable View**: Select items per page (6, 12, 24, 48).
- **Responsive**: Adapts layout for mobile and desktop screens.

## Technical Implementation

### Frontend Components
- **`StoryCard.tsx`**: The main card component with hover effects and interactive buttons.
- **`SearchBar.tsx`**: Handles search input, sort selection, and genre filtering.
- **`Pagination.tsx`**: Reusable pagination control component.

### Backend Updates
- **View Counting**: `Story` entity includes a `viewCount` field that increments on every read.
- **Search Logic**: Efficient filtering implemented on the frontend for responsiveness (can be moved to backend for large datasets).

## Usage
- **Search**: Type in the search bar to filter stories instantly.
- **Sort**: Use the dropdown to change the sort order.
- **Filter**: Click the "Genre" button to filter by specific genres.
- **Navigate**: Use the pagination controls at the bottom to browse through results.
