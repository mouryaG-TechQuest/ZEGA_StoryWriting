package com.storyapp.story.controller;

import com.storyapp.story.dto.StoryRequest;
import com.storyapp.story.dto.StoryResponse;
import com.storyapp.story.dto.CommentRequest;
import com.storyapp.story.dto.CommentResponse;
import com.storyapp.story.dto.GenreResponse;
import com.storyapp.story.service.StoryService;
import com.storyapp.story.service.ImageStorageService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/stories")
@SuppressWarnings("null")
public class StoryController {

    private final StoryService storyService;
    private final ImageStorageService imageStorageService;

    public StoryController(StoryService storyService, ImageStorageService imageStorageService) {
        this.storyService = storyService;
        this.imageStorageService = imageStorageService;
    }

    @PostMapping
    public ResponseEntity<StoryResponse> createStory(@Valid @RequestBody StoryRequest request, Authentication auth) {
        String authorUsername = auth.getName();
        StoryResponse response = storyService.createStory(request, authorUsername);
        return ResponseEntity.created(URI.create("/api/stories/" + response.getId())).body(response);
    }

    @GetMapping
    public ResponseEntity<List<StoryResponse>> listStories(Authentication auth) {
        String username = auth != null ? auth.getName() : null;
        List<StoryResponse> stories = storyService.getAllStoriesForUser(username);
        return ResponseEntity.ok()
            .cacheControl(org.springframework.http.CacheControl.maxAge(60, java.util.concurrent.TimeUnit.SECONDS))
            .body(stories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StoryResponse> getStory(@PathVariable Long id, Authentication auth) {
        String username = auth != null ? auth.getName() : null;
        StoryResponse resp = username != null 
            ? storyService.getStoryByIdForUser(id, username)
            : storyService.getStoryById(id);
        return ResponseEntity.ok()
            .cacheControl(org.springframework.http.CacheControl.maxAge(60, java.util.concurrent.TimeUnit.SECONDS))
            .body(resp);
    }

    @GetMapping("/my-stories")
    public ResponseEntity<List<StoryResponse>> myStories(Authentication auth) {
        String authorUsername = auth.getName();
        List<StoryResponse> stories = storyService.getUserStories(authorUsername);
        return ResponseEntity.ok()
            .cacheControl(org.springframework.http.CacheControl.maxAge(60, java.util.concurrent.TimeUnit.SECONDS))
            .body(stories);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StoryResponse> updateStory(@PathVariable Long id, @Valid @RequestBody StoryRequest request, Authentication auth) {
        String authorUsername = auth.getName();
        StoryResponse updated = storyService.updateStory(id, request, authorUsername);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStory(@PathVariable Long id, Authentication auth) {
        String authorUsername = auth.getName();
        storyService.deleteStory(id, authorUsername);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/toggle-publish")
    public ResponseEntity<Void> togglePublish(@PathVariable Long id, Authentication auth) {
        String username = auth.getName();
        storyService.togglePublishStatus(id, username);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<StoryResponse> likeStory(@PathVariable Long id, Authentication auth) {
        String username = auth.getName();
        StoryResponse response = storyService.likeStory(id, username);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/like")
    public ResponseEntity<StoryResponse> unlikeStory(@PathVariable Long id, Authentication auth) {
        String username = auth.getName();
        StoryResponse response = storyService.unlikeStory(id, username);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/favorite")
    public ResponseEntity<StoryResponse> addToFavorites(@PathVariable Long id, Authentication auth) {
        String username = auth.getName();
        StoryResponse response = storyService.addToFavorites(id, username);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/favorite")
    public ResponseEntity<StoryResponse> removeFromFavorites(@PathVariable Long id, Authentication auth) {
        String username = auth.getName();
        StoryResponse response = storyService.removeFromFavorites(id, username);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/favorites")
    public ResponseEntity<List<StoryResponse>> getFavorites(Authentication auth) {
        String username = auth.getName();
        List<StoryResponse> stories = storyService.getFavoriteStories(username);
        return ResponseEntity.ok()
            .cacheControl(org.springframework.http.CacheControl.maxAge(60, java.util.concurrent.TimeUnit.SECONDS))
            .body(stories);
    }

    @PostMapping(value = "/upload-images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImages(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "type", defaultValue = "story") String type) {
        try {
            List<String> urls;
            
            // Route to appropriate storage based on type
            switch (type.toLowerCase()) {
                case "character":
                    if (files.length != 1) {
                        return ResponseEntity.badRequest()
                            .body(Map.of("error", "Character upload requires exactly one file"));
                    }
                    String characterUrl = imageStorageService.storeCharacterImage(files[0]);
                    return ResponseEntity.ok(List.of(characterUrl));
                    
                case "scene":
                    urls = imageStorageService.storeSceneImages(files);
                    break;
                    
                case "story":
                default:
                    urls = imageStorageService.storeStoryImages(files);
                    break;
            }
            
            return ResponseEntity.ok(urls);
            
        } catch (IOException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    @DeleteMapping("/delete-image")
    public ResponseEntity<?> deleteImage(@RequestParam("url") String imageUrl) {
        try {
            boolean deleted = imageStorageService.deleteImage(imageUrl);
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "Image deleted successfully"));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Image not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // Comment endpoints
    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(@PathVariable Long id, @RequestBody CommentRequest request, Authentication auth) {
        String username = auth.getName();
        CommentResponse response = storyService.addComment(id, username, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long id) {
        List<CommentResponse> comments = storyService.getComments(id);
        return ResponseEntity.ok()
            .cacheControl(org.springframework.http.CacheControl.maxAge(30, java.util.concurrent.TimeUnit.SECONDS))
            .body(comments);
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId, Authentication auth) {
        String username = auth.getName();
        storyService.deleteComment(commentId, username);
        return ResponseEntity.noContent().build();
    }

    // Character endpoints
    @PostMapping("/characters")
    public ResponseEntity<com.storyapp.story.dto.CharacterResponse> createCharacter(
            @RequestBody com.storyapp.story.dto.CharacterRequest request, 
            Authentication auth) {
        String username = auth.getName();
        com.storyapp.story.dto.CharacterResponse response = storyService.createCharacter(request, username);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/characters/{id}")
    public ResponseEntity<com.storyapp.story.dto.CharacterResponse> updateCharacter(
            @PathVariable Long id,
            @RequestBody com.storyapp.story.dto.CharacterRequest request, 
            Authentication auth) {
        String username = auth.getName();
        com.storyapp.story.dto.CharacterResponse response = storyService.updateCharacter(id, request, username);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/characters")
    public ResponseEntity<List<com.storyapp.story.dto.CharacterResponse>> getAllCharacters(Authentication auth) {
        String username = auth.getName();
        List<com.storyapp.story.dto.CharacterResponse> characters = storyService.getAllCharactersForUser(username);
        return ResponseEntity.ok()
            .cacheControl(org.springframework.http.CacheControl.maxAge(120, java.util.concurrent.TimeUnit.SECONDS))
            .body(characters);
    }

    @DeleteMapping("/characters/{id}")
    public ResponseEntity<Void> deleteCharacter(@PathVariable Long id, Authentication auth) {
        String username = auth.getName();
        storyService.deleteCharacter(id, username);
        return ResponseEntity.noContent().build();
    }

    // Genre endpoints
    @GetMapping("/genres")
    public ResponseEntity<List<GenreResponse>> getAllGenres() {
        List<GenreResponse> genres = storyService.getAllGenres();
        return ResponseEntity.ok()
            .cacheControl(org.springframework.http.CacheControl.maxAge(3600, java.util.concurrent.TimeUnit.SECONDS)) // 1 hour cache for genres
            .body(genres);
    }
    
    // View tracking endpoints
    @PostMapping("/{id}/view")
    public ResponseEntity<Void> trackView(@PathVariable Long id, Authentication auth) {
        String username = auth != null ? auth.getName() : null;
        storyService.incrementViewCount(id, username);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{id}/watch-time")
    public ResponseEntity<Void> trackWatchTime(
            @PathVariable Long id, 
            @RequestBody Map<String, Integer> request,
            Authentication auth) {
        String username = auth != null ? auth.getName() : null;
        Integer watchTime = request.get("watchTime");
        if (watchTime != null && watchTime > 0) {
            storyService.trackWatchTime(id, username, watchTime);
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping(value = "/upload-media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadMedia(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "type", defaultValue = "image") String type) {
        try {
            List<String> urls;
            
            switch (type.toLowerCase()) {
                case "video":
                    urls = imageStorageService.storeVideos(files);
                    break;
                case "audio":
                    urls = imageStorageService.storeAudio(files);
                    break;
                case "image":
                case "scene":
                    urls = imageStorageService.storeSceneImages(files);
                    break;
                case "character":
                    if (files.length != 1) {
                        return ResponseEntity.badRequest()
                            .body(Map.of("error", "Character upload requires exactly one file"));
                    }
                    String characterUrl = imageStorageService.storeCharacterImage(files[0]);
                    return ResponseEntity.ok(List.of(characterUrl));
                default:
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid media type"));
            }
            
            return ResponseEntity.ok(urls);
            
        } catch (IOException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}