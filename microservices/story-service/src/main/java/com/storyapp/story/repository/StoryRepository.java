package com.storyapp.story.repository;

import com.storyapp.story.model.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StoryRepository extends JpaRepository<Story, Long> {
    List<Story> findAllByAuthorUsername(String authorUsername);
    Optional<Story> findByTitleAndAuthorUsername(String title, String authorUsername);
    Optional<Story> findByTitleAndAuthorUsernameAndIdNot(String title, String authorUsername, Long id);
    Optional<Story> findByStoryNumber(String storyNumber);
    
    @Query("SELECT s.storyNumber FROM Story s WHERE s.storyNumber IS NOT NULL ORDER BY LENGTH(s.storyNumber) DESC, s.storyNumber DESC")
    List<String> findAllStoryNumbersOrderedDesc();
}