package com.storyapp.story.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "characters",
    uniqueConstraints = {
        // Ensure a story cannot have duplicate character names
        @UniqueConstraint(columnNames = {"story_id", "name"})
    }
)
public class Character {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 255)
    private String name;

    @Size(max = 65535) // TEXT field limit
    @Column(columnDefinition = "TEXT")
    private String description;

    @Size(max = 255)
    @Column(length = 255)
    private String role;

    @Size(max = 255)
    @Column(name = "actor_name", length = 255)
    private String actorName;

    @Min(1)
    @Max(10)
    @Column(name = "popularity")
    private Integer popularity = 5; // default midpoint popularity

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "character_images", joinColumns = @JoinColumn(name = "character_id"))
    @Column(name = "image_url")
    private List<String> imageUrls = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id")
    private Story story;

    public Character() {}

    public Character(String name, String description, Story story) {
        this.name = name;
        this.description = description;
        this.story = story;
        if (this.popularity == null) {
            this.popularity = 5;
        }
    }

    public static Character of(String name, String description, Story story) {
        return new Character(name, description, story);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Story getStory() {
        return story;
    }

    public void setStory(Story story) {
        this.story = story;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getActorName() {
        return actorName;
    }

    public void setActorName(String actorName) {
        this.actorName = actorName;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls != null ? imageUrls : new ArrayList<>();
    }

    public void addImageUrl(String url) {
        if (url == null || url.isBlank()) return;
        if (this.imageUrls == null) {
            this.imageUrls = new ArrayList<>();
        }
        if (!this.imageUrls.contains(url)) {
            this.imageUrls.add(url);
        }
    }

    public Integer getPopularity() {
        return popularity;
    }

    public void setPopularity(Integer popularity) {
        this.popularity = popularity;
    }
}
