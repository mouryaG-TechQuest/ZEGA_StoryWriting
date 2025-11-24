package com.storyapp.story.service;

import com.storyapp.story.dto.*;
import com.storyapp.story.model.Character;
import com.storyapp.story.model.StoryImage;
import com.storyapp.story.model.Like;
import com.storyapp.story.model.Favorite;
import com.storyapp.story.model.Comment;
import com.storyapp.story.model.Genre;
import com.storyapp.story.model.StoryGenre;
import com.storyapp.story.model.StoryView;
import com.storyapp.story.exception.ResourceNotFoundException;
import com.storyapp.story.exception.UnauthorizedException;
import com.storyapp.story.model.Story;
import com.storyapp.story.repository.CharacterRepository;
import com.storyapp.story.repository.StoryRepository;
import com.storyapp.story.repository.LikeRepository;
import com.storyapp.story.repository.FavoriteRepository;
import com.storyapp.story.repository.CommentRepository;
import com.storyapp.story.repository.GenreRepository;
import com.storyapp.story.repository.StoryGenreRepository;
import com.storyapp.story.repository.StoryViewRepository;
import com.storyapp.story.client.UserServiceClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@SuppressWarnings("null")
public class StoryService {
    private final StoryRepository storyRepository;
    private final CharacterRepository characterRepository;
    private final LikeRepository likeRepository;
    private final FavoriteRepository favoriteRepository;
    private final CommentRepository commentRepository;
    private final GenreRepository genreRepository;
    private final StoryGenreRepository storyGenreRepository;
    private final StoryViewRepository storyViewRepository;
    private final UserServiceClient userServiceClient;

    public StoryService(StoryRepository storyRepository, CharacterRepository characterRepository, 
                        LikeRepository likeRepository, FavoriteRepository favoriteRepository,
                        CommentRepository commentRepository, GenreRepository genreRepository,
                        StoryGenreRepository storyGenreRepository, StoryViewRepository storyViewRepository,
                        UserServiceClient userServiceClient) {
        this.storyRepository = storyRepository;
        this.characterRepository = characterRepository;
        this.likeRepository = likeRepository;
        this.favoriteRepository = favoriteRepository;
        this.commentRepository = commentRepository;
        this.genreRepository = genreRepository;
        this.storyGenreRepository = storyGenreRepository;
        this.storyViewRepository = storyViewRepository;
        this.userServiceClient = userServiceClient;
    }

    @Transactional
    public StoryResponse createStory(StoryRequest request, String authorUsername) {
        // Validate title is not empty
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Story title is required");
        }
        
        // Check if title already exists for this user
        if (storyRepository.findByTitleAndAuthorUsername(request.getTitle(), authorUsername).isPresent()) {
            throw new IllegalArgumentException("A story with this title already exists");
        }
        
        Story story = new Story(request.getTitle(), request.getContent(), authorUsername);
        story.setDescription(request.getDescription());
        story.setWriters(request.getWriters());
        story.setTimelineJson(request.getTimelineJson());
        story.setIsPublished(request.getIsPublished() != null ? request.getIsPublished() : false);
        story.setShowSceneTimeline(request.getShowSceneTimeline() != null ? request.getShowSceneTimeline() : true);
        
        // Generate unique story number
        story.setStoryNumber(generateUniqueStoryNumber());
        
        Story saved = storyRepository.save(story);

        if (request.getImageUrls() != null) {
            for (String url : request.getImageUrls()) {
                StoryImage img = new StoryImage(url, saved);
                saved.getImages().add(img);
            }
        }

        if (request.getCharacters() != null) {
            for (CharacterRequest cr : request.getCharacters()) {
                Character c = new Character(cr.getName(), cr.getDescription(), saved);
                c.setRole(cr.getRole());
                c.setActorName(cr.getActorName());
                c.setPopularity(cr.getPopularity());
                c.setImageUrls(cr.getImageUrls());
                characterRepository.save(c);
                saved.getCharacters().add(c);
            }
        }

        // Handle genres
        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            for (Long genreId : request.getGenreIds()) {
                Genre genre = genreRepository.findById(genreId)
                    .orElseThrow(() -> new ResourceNotFoundException("Genre not found: " + genreId));
                StoryGenre storyGenre = new StoryGenre(saved, genre);
                storyGenreRepository.save(storyGenre);
                saved.getStoryGenres().add(storyGenre);
            }
        }

        return convertToResponse(saved, authorUsername);
    }

    public List<StoryResponse> getAllStories() {
        ensureAllStoriesHaveNumbers();
        return storyRepository.findAll().stream()
            .filter(Story::getIsPublished)
            .map(s -> convertToResponse(s, null))
            .collect(Collectors.toList());
    }

    public List<StoryResponse> getAllStoriesForUser(String username) {
        ensureAllStoriesHaveNumbers();
        return storyRepository.findAll().stream()
            .filter(Story::getIsPublished)
            .map(s -> convertToResponse(s, username))
            .collect(Collectors.toList());
    }

    public List<StoryResponse> getUserStories(String username) {
        ensureAllStoriesHaveNumbers();
        return storyRepository.findAllByAuthorUsername(username).stream()
            .map(s -> convertToResponse(s, username))
            .collect(Collectors.toList());
    }

    public StoryResponse getStoryById(Long id) {
        Story story = storyRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Story not found"));
        return convertToResponse(story, null);
    }

    public StoryResponse getStoryByIdForUser(Long id, String username) {
        Story story = storyRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Story not found"));
        
        // Increment view count
        story.setViewCount(story.getViewCount() + 1);
        storyRepository.save(story);
        
        return convertToResponse(story, username);
    }

    @Transactional
    public StoryResponse updateStory(Long id, StoryRequest request, String username) {
        Story story = storyRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Story not found"));
        if (!story.getAuthorUsername().equals(username)) throw new UnauthorizedException("Unauthorized");

        // Validate title is not empty
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Story title is required");
        }
        
        // Check if title already exists for this user (excluding current story)
        if (storyRepository.findByTitleAndAuthorUsernameAndIdNot(request.getTitle(), username, id).isPresent()) {
            throw new IllegalArgumentException("A story with this title already exists");
        }

        story.setTitle(request.getTitle());
        story.setContent(request.getContent());
        story.setDescription(request.getDescription());
        story.setWriters(request.getWriters());
        story.setTimelineJson(request.getTimelineJson());
        if (request.getIsPublished() != null) {
            story.setIsPublished(request.getIsPublished());
        }
        System.out.println("Received showSceneTimeline: " + request.getShowSceneTimeline());
        if (request.getShowSceneTimeline() != null) {
            story.setShowSceneTimeline(request.getShowSceneTimeline());
            System.out.println("Set showSceneTimeline to: " + request.getShowSceneTimeline());
        } else {
            System.out.println("showSceneTimeline is NULL - not updating");
        }

        // Delete old characters and images
        // With orphanRemoval=true, clearing the list is sufficient to delete entities
        story.getCharacters().clear();
        story.getImages().clear();
        // Force flush to execute deletes before inserting new entities with potentially same unique keys
        storyRepository.saveAndFlush(story);

        if (request.getImageUrls() != null) {
            for (String url : request.getImageUrls()) {
                StoryImage img = new StoryImage(url, story);
                story.getImages().add(img);
            }
        }

        if (request.getCharacters() != null) {
            for (CharacterRequest cr : request.getCharacters()) {
                Character c = new Character(cr.getName(), cr.getDescription(), story);
                c.setRole(cr.getRole());
                c.setActorName(cr.getActorName());
                c.setPopularity(cr.getPopularity());
                c.setImageUrls(cr.getImageUrls());
                characterRepository.save(c);
                story.getCharacters().add(c);
            }
        }

        // Update genres
        story.getStoryGenres().clear();
        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            for (Long genreId : request.getGenreIds()) {
                Genre genre = genreRepository.findById(genreId)
                    .orElseThrow(() -> new ResourceNotFoundException("Genre not found: " + genreId));
                StoryGenre storyGenre = new StoryGenre(story, genre);
                storyGenreRepository.save(storyGenre);
                story.getStoryGenres().add(storyGenre);
            }
        }

        Story updated = storyRepository.save(story);
        return convertToResponse(updated, username);
    }

    @Transactional
    public void togglePublishStatus(Long id, String username) {
        Story story = storyRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Story not found"));
        if (!story.getAuthorUsername().equals(username)) throw new UnauthorizedException("Unauthorized");
        story.setIsPublished(!story.getIsPublished());
        storyRepository.save(story);
    }

    @Transactional
    public StoryResponse likeStory(Long id, String username) {
        Story story = storyRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Story not found"));
        if (!likeRepository.existsByStoryAndUsername(story, username)) {
            Like like = new Like(story, username);
            likeRepository.save(like);
            story.setLikeCount(story.getLikeCount() + 1);
            storyRepository.save(story);
        }
        return convertToResponse(story, username);
    }

    @Transactional
    public StoryResponse unlikeStory(Long id, String username) {
        Story story = storyRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Story not found"));
        Like like = likeRepository.findByStoryAndUsername(story, username).orElse(null);
        if (like != null) {
            likeRepository.delete(like);
            story.setLikeCount(Math.max(0, story.getLikeCount() - 1));
            storyRepository.save(story);
        }
        return convertToResponse(story, username);
    }

    @Transactional
    public StoryResponse addToFavorites(Long id, String username) {
        Story story = storyRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Story not found"));
        if (!favoriteRepository.existsByStoryAndUsername(story, username)) {
            Favorite favorite = new Favorite(story, username);
            favoriteRepository.save(favorite);
        }
        return convertToResponse(story, username);
    }

    @Transactional
    public StoryResponse removeFromFavorites(Long id, String username) {
        Story story = storyRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Story not found"));
        Favorite favorite = favoriteRepository.findByStoryAndUsername(story, username).orElse(null);
        if (favorite != null) {
            favoriteRepository.delete(favorite);
        }
        return convertToResponse(story, username);
    }

    public List<StoryResponse> getFavoriteStories(String username) {
        List<Favorite> favorites = favoriteRepository.findByUsername(username);
        return favorites.stream()
            .map(fav -> convertToResponse(fav.getStory(), username))
            .collect(Collectors.toList());
    }

    @Transactional
    public void deleteStory(Long id, String username) {
        Story story = storyRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Story not found"));
        if (!story.getAuthorUsername().equals(username)) throw new UnauthorizedException("Unauthorized");
        storyRepository.delete(story);
    }

    private StoryResponse convertToResponse(Story story, String currentUsername) {
        StoryResponse resp = new StoryResponse();
        resp.setId(story.getId());
        resp.setTitle(story.getTitle());
        resp.setContent(story.getContent());
        resp.setDescription(story.getDescription());
        resp.setWriters(story.getWriters());
        resp.setTimelineJson(story.getTimelineJson());
        resp.setAuthorUsername(story.getAuthorUsername());
        resp.setCreatedAt(story.getCreatedAt());
        resp.setIsPublished(story.getIsPublished());
        resp.setLikeCount(story.getLikeCount());
        resp.setViewCount(story.getViewCount());
        resp.setCommentCount((int) commentRepository.countByStory(story));
        resp.setStoryNumber(story.getStoryNumber());
        resp.setTotalWatchTime(story.getTotalWatchTime());
        resp.setShowSceneTimeline(story.getShowSceneTimeline());
        
        // Fetch author email from User Service
        try {
            Map<String, Object> userData = userServiceClient.getUserByUsername(story.getAuthorUsername());
            if (userData != null && userData.containsKey("email")) {
                resp.setAuthorEmail((String) userData.get("email"));
            }
        } catch (Exception e) {
            // Gracefully handle if user-service unavailable or user not found
            resp.setAuthorEmail(null);
        }
        
        if (currentUsername != null) {
            resp.setIsLikedByCurrentUser(likeRepository.existsByStoryAndUsername(story, currentUsername));
            resp.setIsFavoritedByCurrentUser(favoriteRepository.existsByStoryAndUsername(story, currentUsername));
        } else {
            resp.setIsLikedByCurrentUser(false);
            resp.setIsFavoritedByCurrentUser(false);
        }
        
        List<String> imageUrls = story.getImages().stream()
            .map(StoryImage::getUrl)
            .collect(Collectors.toList());
        resp.setImageUrls(imageUrls);
        
        List<CharacterResponse> chars = story.getCharacters().stream().map(c -> {
            CharacterResponse cr = new CharacterResponse();
            cr.setId(c.getId());
            cr.setName(c.getName());
            cr.setDescription(c.getDescription());
            cr.setRole(c.getRole());
            cr.setActorName(c.getActorName());
            cr.setPopularity(c.getPopularity());
            cr.setImageUrls(c.getImageUrls());
            return cr;
        }).collect(Collectors.toList());
        resp.setCharacters(chars);

        // Add genres
        List<GenreResponse> genres = story.getStoryGenres().stream().map(sg -> {
            GenreResponse gr = new GenreResponse();
            gr.setId(sg.getGenre().getId());
            gr.setName(sg.getGenre().getName());
            gr.setDescription(sg.getGenre().getDescription());
            return gr;
        }).collect(Collectors.toList());
        resp.setGenres(genres);

        return resp;
    }

    // Comment methods
    @Transactional
    public CommentResponse addComment(Long storyId, String username, CommentRequest request) {
        Story story = storyRepository.findById(storyId).orElseThrow(() -> new ResourceNotFoundException("Story not found"));
        Comment comment = new Comment(story, username, request.getContent());
        Comment saved = commentRepository.save(comment);
        return convertToCommentResponse(saved);
    }

    public List<CommentResponse> getComments(Long storyId) {
        Story story = storyRepository.findById(storyId).orElseThrow(() -> new ResourceNotFoundException("Story not found"));
        return commentRepository.findByStoryOrderByCreatedAtDesc(story).stream()
            .map(this::convertToCommentResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public void deleteComment(Long commentId, String username) {
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        if (!comment.getUsername().equals(username)) throw new UnauthorizedException("Unauthorized");
        commentRepository.delete(comment);
    }

    private CommentResponse convertToCommentResponse(Comment comment) {
        CommentResponse resp = new CommentResponse();
        resp.setId(comment.getId());
        resp.setStoryId(comment.getStory().getId());
        resp.setUsername(comment.getUsername());
        resp.setContent(comment.getContent());
        resp.setCreatedAt(comment.getCreatedAt());
        return resp;
    }

    // Character CRUD methods
    @Transactional
    public CharacterResponse createCharacter(CharacterRequest request, String username) {
        Character character = new Character();
        character.setName(request.getName());
        character.setDescription(request.getDescription());
        character.setRole(request.getRole());
        character.setActorName(request.getActorName());
        character.setPopularity(request.getPopularity());
        character.setImageUrls(request.getImageUrls());
        // Note: This creates a standalone character without a story association
        // It will be associated with a story when the story is created/updated
        Character saved = characterRepository.save(character);
        return convertToCharacterResponse(saved);
    }

    @Transactional
    public CharacterResponse updateCharacter(Long id, CharacterRequest request, String username) {
        Character character = characterRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Character not found"));
        
        character.setName(request.getName());
        character.setDescription(request.getDescription());
        character.setRole(request.getRole());
        character.setActorName(request.getActorName());
        character.setPopularity(request.getPopularity());
        character.setImageUrls(request.getImageUrls());
        
        Character updated = characterRepository.save(character);
        return convertToCharacterResponse(updated);
    }

    public List<CharacterResponse> getAllCharactersForUser(String username) {
        // Get all characters from stories owned by the user
        List<Story> userStories = storyRepository.findAllByAuthorUsername(username);
        return userStories.stream()
            .flatMap(story -> story.getCharacters().stream())
            .map(this::convertToCharacterResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public void deleteCharacter(Long id, String username) {
        Character character = characterRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Character not found"));
        
        // Check if user owns the story this character belongs to
        if (character.getStory() != null && 
            !character.getStory().getAuthorUsername().equals(username)) {
            throw new UnauthorizedException("Unauthorized");
        }
        
        characterRepository.delete(character);
    }

    private CharacterResponse convertToCharacterResponse(Character character) {
        CharacterResponse resp = new CharacterResponse();
        resp.setId(character.getId());
        resp.setName(character.getName());
        resp.setDescription(character.getDescription());
        resp.setRole(character.getRole());
        resp.setActorName(character.getActorName());
        resp.setPopularity(character.getPopularity());
        resp.setImageUrls(character.getImageUrls());
        return resp;
    }

    // Genre methods
    public List<GenreResponse> getAllGenres() {
        return genreRepository.findAll().stream()
            .map(this::convertToGenreResponse)
            .collect(Collectors.toList());
    }

    private GenreResponse convertToGenreResponse(Genre genre) {
        GenreResponse resp = new GenreResponse();
        resp.setId(genre.getId());
        resp.setName(genre.getName());
        resp.setDescription(genre.getDescription());
        return resp;
    }
    
    // View tracking methods
    @Transactional
    public void incrementViewCount(Long storyId, String username) {
        Story story = storyRepository.findById(storyId)
            .orElseThrow(() -> new ResourceNotFoundException("Story not found with id: " + storyId));
        
        // Check if this user has already viewed this story
        var existingView = storyViewRepository.findByStoryIdAndUsername(storyId, username);
        
        if (existingView.isEmpty()) {
            // First time viewing - create new StoryView and increment story view count
            StoryView storyView = new StoryView(story, username);
            storyViewRepository.save(storyView);
            
            story.setViewCount((story.getViewCount() != null ? story.getViewCount() : 0) + 1);
            storyRepository.save(story);
        } else {
            // User has viewed before - just update last viewed time but don't increment count
            StoryView storyView = existingView.get();
            storyView.setLastViewedAt(LocalDateTime.now());
            storyView.setViewCount(storyView.getViewCount() + 1);
            storyViewRepository.save(storyView);
        }
    }
    
    @Transactional
    public void trackWatchTime(Long storyId, String username, Integer watchTime) {
        Story story = storyRepository.findById(storyId)
            .orElseThrow(() -> new ResourceNotFoundException("Story not found with id: " + storyId));
        
        // Add to total watch time
        Long currentWatchTime = story.getTotalWatchTime() != null ? story.getTotalWatchTime() : 0L;
        story.setTotalWatchTime(currentWatchTime + watchTime);
        storyRepository.save(story);
        
        System.out.println("User " + (username != null ? username : "anonymous") + 
                         " watched story " + storyId + " for " + watchTime + " seconds. Total: " + story.getTotalWatchTime());
    }
    
    /**
     * Ensures all existing stories have story numbers.
     * This is a migration helper that runs on-demand.
     */
    @Transactional
    private void ensureAllStoriesHaveNumbers() {
        List<Story> storiesWithoutNumbers = storyRepository.findAll().stream()
            .filter(story -> story.getStoryNumber() == null || story.getStoryNumber().isEmpty())
            .collect(Collectors.toList());
        
        if (!storiesWithoutNumbers.isEmpty()) {
            System.out.println("Found " + storiesWithoutNumbers.size() + " stories without story numbers. Generating...");
            for (Story story : storiesWithoutNumbers) {
                story.setStoryNumber(generateUniqueStoryNumber());
                storyRepository.save(story);
            }
            System.out.println("Story numbers generated successfully.");
        }
    }
    
    /**
     * Generates a unique story number starting with 5 digits (10000-99999),
     * then moving to 6 digits (100000-999999) when all 5-digit numbers are used, and so on.
     */
    private String generateUniqueStoryNumber() {
        List<String> existingNumbers = storyRepository.findAllStoryNumbersOrderedDesc();
        
        if (existingNumbers.isEmpty()) {
            return "10000"; // Start with first 5-digit number
        }
        
        // Get the highest number
        String highestNumber = existingNumbers.get(0);
        int currentLength = highestNumber.length();
        long currentValue = Long.parseLong(highestNumber);
        
        // Calculate max value for current length (e.g., 99999 for 5 digits)
        long maxForCurrentLength = (long) Math.pow(10, currentLength) - 1;
        
        if (currentValue < maxForCurrentLength) {
            // Still have room in current digit length
            return String.valueOf(currentValue + 1);
        } else {
            // Move to next digit length (e.g., from 99999 to 100000)
            return String.valueOf((long) Math.pow(10, currentLength));
        }
    }
}