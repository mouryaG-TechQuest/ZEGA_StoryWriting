package com.storyapp.story.repository;

import com.storyapp.story.model.StoryView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StoryViewRepository extends JpaRepository<StoryView, Long> {
    Optional<StoryView> findByStoryIdAndUsername(Long storyId, String username);
    
    @Query("SELECT COUNT(DISTINCT sv.username) FROM StoryView sv WHERE sv.story.id = :storyId")
    Long countUniqueViewersByStoryId(Long storyId);
}
