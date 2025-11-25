package com.storyapp.story.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "training_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "session_id", nullable = false, unique = true, length = 100)
    private String sessionId;
    
    @Column(name = "num_examples_requested", nullable = false)
    private Integer numExamplesRequested;
    
    @Column(name = "num_examples_successful", nullable = false)
    private Integer numExamplesSuccessful;
    
    @Column(name = "num_examples_failed", nullable = false)
    private Integer numExamplesFailed;
    
    @Column(name = "genres_selected", columnDefinition = "TEXT")
    private String genresSelected;
    
    @Column(name = "stored_in_memory", nullable = false)
    private Boolean storedInMemory;
    
    @Column(name = "saved_to_database", nullable = false)
    private Boolean savedToDatabase;
    
    @Column(name = "stories_saved_count", nullable = false)
    private Integer storiesSavedCount;
    
    @Column(name = "average_quality", precision = 3, scale = 1)
    private BigDecimal averageQuality;
    
    @Column(name = "min_quality", precision = 3, scale = 1)
    private BigDecimal minQuality;
    
    @Column(name = "max_quality", precision = 3, scale = 1)
    private BigDecimal maxQuality;
    
    @Column(name = "best_performing_model", length = 100)
    private String bestPerformingModel;
    
    @Column(name = "model_performance_json", columnDefinition = "TEXT")
    private String modelPerformanceJson;
    
    @Column(name = "genre_distribution_json", columnDefinition = "TEXT")
    private String genreDistributionJson;
    
    @Column(name = "total_time_seconds")
    private Integer totalTimeSeconds;
    
    @Column(name = "training_examples_before")
    private Integer trainingExamplesBefore;
    
    @Column(name = "training_examples_after")
    private Integer trainingExamplesAfter;
    
    @Column(name = "finetuning_triggered", nullable = false)
    private Boolean finetuningTriggered;
    
    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;
    
    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
