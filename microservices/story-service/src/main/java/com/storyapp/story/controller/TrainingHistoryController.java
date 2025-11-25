package com.storyapp.story.controller;

import com.storyapp.story.dto.TrainingHistoryRequest;
import com.storyapp.story.model.TrainingHistory;
import com.storyapp.story.service.TrainingHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/training-history")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class TrainingHistoryController {
    
    private final TrainingHistoryService trainingHistoryService;
    
    /**
     * Save a new training history record
     */
    @PostMapping
    public ResponseEntity<TrainingHistory> saveTrainingHistory(@RequestBody TrainingHistoryRequest request) {
        try {
            log.info("Received training history save request for user {} with session {}", 
                     request.getUserId(), request.getSessionId());
            
            TrainingHistory saved = trainingHistoryService.saveTrainingHistory(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
            
        } catch (Exception e) {
            log.error("Error saving training history: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get all training history for a user
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TrainingHistory>> getUserTrainingHistory(@PathVariable Long userId) {
        try {
            log.info("Fetching training history for user {}", userId);
            List<TrainingHistory> history = trainingHistoryService.getUserTrainingHistory(userId);
            return ResponseEntity.ok(history);
            
        } catch (Exception e) {
            log.error("Error fetching training history: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get paginated training history for a user
     */
    @GetMapping("/user/{userId}/paginated")
    public ResponseEntity<Page<TrainingHistory>> getUserTrainingHistoryPaginated(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            log.info("Fetching paginated training history for user {} (page: {}, size: {})", 
                     userId, page, size);
            Page<TrainingHistory> history = trainingHistoryService.getUserTrainingHistoryPaginated(userId, page, size);
            return ResponseEntity.ok(history);
            
        } catch (Exception e) {
            log.error("Error fetching paginated training history: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get a specific training session by session ID
     */
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<TrainingHistory> getTrainingSessionBySessionId(@PathVariable String sessionId) {
        try {
            log.info("Fetching training session with session ID: {}", sessionId);
            return trainingHistoryService.getTrainingSessionBySessionId(sessionId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
                    
        } catch (Exception e) {
            log.error("Error fetching training session: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get training history within a date range
     */
    @GetMapping("/user/{userId}/date-range")
    public ResponseEntity<List<TrainingHistory>> getUserTrainingHistoryByDateRange(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            log.info("Fetching training history for user {} between {} and {}", 
                     userId, startDate, endDate);
            List<TrainingHistory> history = trainingHistoryService
                    .getUserTrainingHistoryByDateRange(userId, startDate, endDate);
            return ResponseEntity.ok(history);
            
        } catch (Exception e) {
            log.error("Error fetching training history by date range: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get training statistics for a user
     */
    @GetMapping("/user/{userId}/stats")
    public ResponseEntity<Map<String, Object>> getUserTrainingStats(@PathVariable Long userId) {
        try {
            log.info("Fetching training statistics for user {}", userId);
            
            List<TrainingHistory> allHistory = trainingHistoryService.getUserTrainingHistory(userId);
            long sessionCount = trainingHistoryService.getUserTrainingSessionCount(userId);
            List<TrainingHistory> fineTuningSessions = trainingHistoryService.getFineTuningTriggeringSessions(userId);
            
            // Calculate aggregate statistics
            int totalExamplesGenerated = allHistory.stream()
                    .mapToInt(TrainingHistory::getNumExamplesSuccessful)
                    .sum();
            
            int totalStoriesSaved = allHistory.stream()
                    .mapToInt(TrainingHistory::getStoriesSavedCount)
                    .sum();
            
            double avgQuality = allHistory.stream()
                    .filter(h -> h.getAverageQuality() != null)
                    .mapToDouble(h -> h.getAverageQuality().doubleValue())
                    .average()
                    .orElse(0.0);
            
            int totalTimeSeconds = allHistory.stream()
                    .filter(h -> h.getTotalTimeSeconds() != null)
                    .mapToInt(TrainingHistory::getTotalTimeSeconds)
                    .sum();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalSessions", sessionCount);
            stats.put("totalExamplesGenerated", totalExamplesGenerated);
            stats.put("totalStoriesSaved", totalStoriesSaved);
            stats.put("averageQuality", Math.round(avgQuality * 10.0) / 10.0);
            stats.put("totalTrainingTimeSeconds", totalTimeSeconds);
            stats.put("fineTuningSessionsCount", fineTuningSessions.size());
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            log.error("Error fetching training statistics: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get recent training sessions for a user
     */
    @GetMapping("/user/{userId}/recent")
    public ResponseEntity<Page<TrainingHistory>> getRecentTrainingSessions(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "5") int limit) {
        try {
            log.info("Fetching {} recent training sessions for user {}", limit, userId);
            Page<TrainingHistory> recentSessions = trainingHistoryService.getRecentTrainingSessions(userId, limit);
            return ResponseEntity.ok(recentSessions);
            
        } catch (Exception e) {
            log.error("Error fetching recent training sessions: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
