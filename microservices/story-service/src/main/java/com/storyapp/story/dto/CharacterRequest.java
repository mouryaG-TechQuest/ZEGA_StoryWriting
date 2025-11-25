package com.storyapp.story.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;

public class CharacterRequest {
    @NotBlank(message = "Character name is required")
    @Size(max = 255, message = "Character name cannot exceed 255 characters")
    private String name;
    
    @Size(max = 65535, message = "Character description cannot exceed 65535 characters")
    private String description;
    
    @Size(max = 255, message = "Character role cannot exceed 255 characters")
    private String role;
    
    @Size(max = 255, message = "Actor name cannot exceed 255 characters")
    private String actorName;
    
    @Min(value = 1, message = "Popularity must be between 1 and 10")
    @Max(value = 10, message = "Popularity must be between 1 and 10")
    private Integer popularity;
    
    private List<String> imageUrls = new ArrayList<>();

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }
    public Integer getPopularity() { return popularity; }
    public void setPopularity(Integer popularity) { this.popularity = popularity; }
    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
}