package com.storyapp.story.repository;

import com.storyapp.story.model.StoryGenre;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoryGenreRepository extends JpaRepository<StoryGenre, Long> {
}
