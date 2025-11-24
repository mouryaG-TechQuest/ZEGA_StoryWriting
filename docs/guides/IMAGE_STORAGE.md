# Image Storage System Guide

## Overview
The application uses an organized image storage system with validation, automatic resizing, and security features. Images are stored locally on the server and served via the backend.

## Directory Structure
Images are stored in the `uploads/` directory, organized by type:
```
uploads/
├── stories/        # Story cover images and general story images
├── characters/     # Character profile images
└── scenes/         # Timeline/scene images
```

## Features

### Organization & Validation
- **Categorized Storage**: Separate folders for stories, characters, and scenes.
- **File Validation**:
    - Allowed formats: JPEG, JPG, PNG, GIF, WEBP.
    - Max file size: 10MB per file.
    - Max request size: 50MB total.
    - MIME type checking ensures file integrity.

### Optimization
- **Auto-Resize**: Images larger than 2048x2048 are automatically resized while maintaining aspect ratio.
- **Caching**: Browser caching (1 hour) is enabled for better performance.

### Security
- **Sanitization**: Filenames are sanitized to remove special characters.
- **Uniqueness**: UUID prefixes prevent filename conflicts.
- **Access Control**: Public read access for viewing; authenticated write access (JWT) for uploading.
- **CORS**: Configured to allow access from the frontend.

## API Endpoints

### Upload Images
`POST /api/stories/upload-images`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Body**:
    - `files`: Array of image files (required).
    - `type`: "story" | "character" | "scene" (optional, default: "story").
- **Response**: JSON array of image URLs (e.g., `["/uploads/stories/uuid_image.jpg"]`).

### Delete Image
`DELETE /api/stories/delete-image`
- **Query Param**: `url` (e.g., `/uploads/stories/uuid_image.jpg`)
- **Headers**: `Authorization: Bearer <token>`

## Configuration
Settings in `application.properties`:
```properties
# File Upload Limits
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=50MB

# Image Storage
image.upload.dir=uploads
image.max-width=2048
image.max-height=2048
image.allowed-types=image/jpeg,image/jpg,image/png,image/gif,image/webp
```

## Frontend Usage
Images are served from the backend. Ensure URLs are absolute or relative to the backend base URL.

```tsx
<img 
  src={url.startsWith('http') ? url : `http://localhost:8080${url}`}
  alt="Story image"
  onError={(e) => { e.currentTarget.src = fallbackImage; }}
/>
```
