package com.storyapp.story.repository;

import com.storyapp.story.model.Favorite;
import com.storyapp.story.model.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    Optional<Favorite> findByStoryAndUsername(Story story, String username);
    boolean existsByStoryAndUsername(Story story, String username);
    
    @Query("SELECT f FROM Favorite f JOIN FETCH f.story WHERE f.username = :username")
    List<Favorite> findByUsername(@Param("username") String username);
}
