package com.storyapp.story.repository;

import com.storyapp.story.model.TrainingHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingHistoryRepository extends JpaRepository<TrainingHistory, Long> {
    
    /**
     * Find all training sessions for a specific user
     */
    List<TrainingHistory> findByUserIdOrderByStartedAtDesc(Long userId);
    
    /**
     * Find all training sessions for a specific user with pagination
     */
    Page<TrainingHistory> findByUserIdOrderByStartedAtDesc(Long userId, Pageable pageable);
    
    /**
     * Find a specific training session by session ID
     */
    Optional<TrainingHistory> findBySessionId(String sessionId);
    
    /**
     * Find training sessions for a user within a date range
     */
    @Query("SELECT th FROM TrainingHistory th WHERE th.userId = :userId " +
           "AND th.startedAt >= :startDate AND th.startedAt <= :endDate " +
           "ORDER BY th.startedAt DESC")
    List<TrainingHistory> findByUserIdAndDateRange(Long userId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Count total training sessions for a user
     */
    long countByUserId(Long userId);
    
    /**
     * Find sessions that triggered fine-tuning
     */
    List<TrainingHistory> findByUserIdAndFinetuningTriggeredTrue(Long userId);
    
    /**
     * Get recent training sessions (last N sessions)
     */
    Page<TrainingHistory> findByUserIdOrderByCompletedAtDesc(Long userId, Pageable pageable);
}
