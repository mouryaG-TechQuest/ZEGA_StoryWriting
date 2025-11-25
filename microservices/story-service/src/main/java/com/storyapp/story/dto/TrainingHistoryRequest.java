package com.storyapp.story.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingHistoryRequest {
    
    private Long userId;
    private String sessionId;
    private Integer numExamplesRequested;
    private Integer numExamplesSuccessful;
    private Integer numExamplesFailed;
    private String genresSelected;
    private Boolean storedInMemory;
    private Boolean savedToDatabase;
    private Integer storiesSavedCount;
    private BigDecimal averageQuality;
    private BigDecimal minQuality;
    private BigDecimal maxQuality;
    private String bestPerformingModel;
    private String modelPerformanceJson;
    private String genreDistributionJson;
    private Integer totalTimeSeconds;
    private Integer trainingExamplesBefore;
    private Integer trainingExamplesAfter;
    private Boolean finetuningTriggered;
    private String startedAt;  // ISO format string
    private String completedAt;  // ISO format string
}
