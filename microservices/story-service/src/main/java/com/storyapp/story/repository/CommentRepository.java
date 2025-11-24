package com.storyapp.story.repository;

import com.storyapp.story.model.Comment;
import com.storyapp.story.model.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByStoryOrderByCreatedAtDesc(Story story);
    List<Comment> findByUsernameOrderByCreatedAtDesc(String username);
    long countByStory(Story story);
}
