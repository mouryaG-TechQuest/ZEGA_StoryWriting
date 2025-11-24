package com.storyapp.story.dto;

import java.util.List;

public class TimelineEntryDto {
    private String id;
    private String event;
    private String description;
    private List<String> characters;
    private List<String> imageUrls;
    private Integer order;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEvent() { return event; }
    public void setEvent(String event) { this.event = event; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<String> getCharacters() { return characters; }
    public void setCharacters(List<String> characters) { this.characters = characters; }

    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }

    public Integer getOrder() { return order; }
    public void setOrder(Integer order) { this.order = order; }
}
