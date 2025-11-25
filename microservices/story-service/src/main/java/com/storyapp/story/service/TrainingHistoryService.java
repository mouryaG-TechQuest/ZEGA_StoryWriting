package com.storyapp.story.service;

import com.storyapp.story.dto.TrainingHistoryRequest;
import com.storyapp.story.model.TrainingHistory;
import com.storyapp.story.repository.TrainingHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrainingHistoryService {
    
    private final TrainingHistoryRepository trainingHistoryRepository;
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_DATE_TIME;
    
    /**
     * Save a new training history record
     */
    @Transactional
    public TrainingHistory saveTrainingHistory(TrainingHistoryRequest request) {
        log.info("Saving training history for user {} with session ID {}", 
                 request.getUserId(), request.getSessionId());
        
        TrainingHistory history = TrainingHistory.builder()
                .userId(request.getUserId())
                .sessionId(request.getSessionId())
                .numExamplesRequested(request.getNumExamplesRequested())
                .numExamplesSuccessful(request.getNumExamplesSuccessful())
                .numExamplesFailed(request.getNumExamplesFailed())
                .genresSelected(request.getGenresSelected())
                .storedInMemory(request.getStoredInMemory())
                .savedToDatabase(request.getSavedToDatabase())
                .storiesSavedCount(request.getStoriesSavedCount())
                .averageQuality(request.getAverageQuality())
                .minQuality(request.getMinQuality())
                .maxQuality(request.getMaxQuality())
                .bestPerformingModel(request.getBestPerformingModel())
                .modelPerformanceJson(request.getModelPerformanceJson())
                .genreDistributionJson(request.getGenreDistributionJson())
                .totalTimeSeconds(request.getTotalTimeSeconds())
                .trainingExamplesBefore(request.getTrainingExamplesBefore())
                .trainingExamplesAfter(request.getTrainingExamplesAfter())
                .finetuningTriggered(request.getFinetuningTriggered())
                .startedAt(parseDateTime(request.getStartedAt()))
                .completedAt(parseDateTime(request.getCompletedAt()))
                .build();
        
        TrainingHistory saved = trainingHistoryRepository.save(history);
        log.info("Training history saved with ID: {}", saved.getId());
        
        return saved;
    }
    
    /**
     * Get all training history for a user
     */
    public List<TrainingHistory> getUserTrainingHistory(Long userId) {
        log.info("Fetching training history for user {}", userId);
        return trainingHistoryRepository.findByUserIdOrderByStartedAtDesc(userId);
    }
    
    /**
     * Get paginated training history for a user
     */
    public Page<TrainingHistory> getUserTrainingHistoryPaginated(Long userId, int page, int size) {
        log.info("Fetching paginated training history for user {} (page: {}, size: {})", 
                 userId, page, size);
        Pageable pageable = PageRequest.of(page, size);
        return trainingHistoryRepository.findByUserIdOrderByStartedAtDesc(userId, pageable);
    }
    
    /**
     * Get a specific training session by session ID
     */
    public Optional<TrainingHistory> getTrainingSessionBySessionId(String sessionId) {
        log.info("Fetching training session with session ID: {}", sessionId);
        return trainingHistoryRepository.findBySessionId(sessionId);
    }
    
    /**
     * Get training history within a date range
     */
    public List<TrainingHistory> getUserTrainingHistoryByDateRange(
            Long userId, LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Fetching training history for user {} between {} and {}", 
                 userId, startDate, endDate);
        return trainingHistoryRepository.findByUserIdAndDateRange(userId, startDate, endDate);
    }
    
    /**
     * Get count of training sessions for a user
     */
    public long getUserTrainingSessionCount(Long userId) {
        return trainingHistoryRepository.countByUserId(userId);
    }
    
    /**
     * Get sessions that triggered fine-tuning
     */
    public List<TrainingHistory> getFineTuningTriggeringSessions(Long userId) {
        log.info("Fetching fine-tuning triggering sessions for user {}", userId);
        return trainingHistoryRepository.findByUserIdAndFinetuningTriggeredTrue(userId);
    }
    
    /**
     * Get recent training sessions
     */
    public Page<TrainingHistory> getRecentTrainingSessions(Long userId, int limit) {
        log.info("Fetching {} most recent training sessions for user {}", limit, userId);
        Pageable pageable = PageRequest.of(0, limit);
        return trainingHistoryRepository.findByUserIdOrderByCompletedAtDesc(userId, pageable);
    }
    
    /**
     * Parse ISO datetime string to LocalDateTime
     */
    private LocalDateTime parseDateTime(String isoDateString) {
        try {
            return LocalDateTime.parse(isoDateString, ISO_FORMATTER);
        } catch (Exception e) {
            log.warn("Failed to parse datetime: {}, using current time", isoDateString);
            return LocalDateTime.now();
        }
    }
}
