package com.storyapp.story.repository;

import com.storyapp.story.model.Like;
import com.storyapp.story.model.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {
    Optional<Like> findByStoryAndUsername(Story story, String username);
    boolean existsByStoryAndUsername(Story story, String username);
    long countByStory(Story story);
}
