package com.storyapp.story.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public class StoryRequest {
    @NotBlank(message = "Title is required")
    @Size(max = 500, message = "Title cannot exceed 500 characters")
    private String title;
    
    @Size(max = 65535, message = "Content cannot exceed 65535 characters")
    private String content;
    
    @Size(max = 65535, message = "Description cannot exceed 65535 characters")
    private String description;
    
    @Size(max = 65535, message = "Writers cannot exceed 65535 characters")
    private String writers;
    
    private String timelineJson;
    private List<String> imageUrls;
    
    @Valid
    private List<CharacterRequest> characters;
    
    private Boolean isPublished;
    private List<Long> genreIds;
    private Boolean showSceneTimeline;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getWriters() { return writers; }
    public void setWriters(String writers) { this.writers = writers; }
    public String getTimelineJson() { return timelineJson; }
    public void setTimelineJson(String timelineJson) { this.timelineJson = timelineJson; }
    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
    public List<CharacterRequest> getCharacters() { return characters; }
    public void setCharacters(List<CharacterRequest> characters) { this.characters = characters; }
    public Boolean getIsPublished() { return isPublished; }
    public void setIsPublished(Boolean isPublished) { this.isPublished = isPublished; }
    public List<Long> getGenreIds() { return genreIds; }
    public void setGenreIds(List<Long> genreIds) { this.genreIds = genreIds; }
    public Boolean getShowSceneTimeline() { return showSceneTimeline; }
    public void setShowSceneTimeline(Boolean showSceneTimeline) { this.showSceneTimeline = showSceneTimeline; }
}