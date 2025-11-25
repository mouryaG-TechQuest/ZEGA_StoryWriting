import httpClient from './httpClient.js';

const STORY_SERVICE_URL = 'http://localhost:8082/api';

export interface TrainingHistory {
  id: number;
  userId: number;
  sessionId: string;
  numExamplesRequested: number;
  numExamplesSuccessful: number;
  numExamplesFailed: number;
  genresSelected: string;
  storedInMemory: boolean;
  savedToDatabase: boolean;
  storiesSavedCount: number;
  averageQuality: number;
  minQuality: number;
  maxQuality: number;
  bestPerformingModel: string;
  modelPerformanceJson: string;
  genreDistributionJson: string;
  totalTimeSeconds: number;
  trainingExamplesBefore: number;
  trainingExamplesAfter: number;
  finetuningTriggered: boolean;
  startedAt: string;
  completedAt: string;
  createdAt: string;
}

export interface TrainingStats {
  totalSessions: number;
  totalExamplesGenerated: number;
  totalStoriesSaved: number;
  averageQuality: number;
  totalTrainingTimeSeconds: number;
  fineTuningSessionsCount: number;
}

/**
 * Get all training history for a user
 */
export const getUserTrainingHistory = async (userId: number): Promise<TrainingHistory[]> => {
  try {
    const response = await fetch(`${STORY_SERVICE_URL}/training-history/user/${userId}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
};

/**
 * Get paginated training history
 */
export const getUserTrainingHistoryPaginated = async (
  userId: number,
  page: number = 0,
  size: number = 10
): Promise<{ content: TrainingHistory[]; totalPages: number; totalElements: number }> => {
  const response = await httpClient.get(
    `${STORY_SERVICE_URL}/training-history/user/${userId}/paginated`,
    { params: { page, size } }
  );
  return response.data;
};

/**
 * Get a specific training session by session ID
 */
export const getTrainingSessionBySessionId = async (sessionId: string): Promise<TrainingHistory> => {
  const response = await httpClient.get(`${STORY_SERVICE_URL}/training-history/session/${sessionId}`);
  return response.data;
};

/**
 * Get training statistics for a user
 */
export const getUserTrainingStats = async (userId: number): Promise<TrainingStats> => {
  try {
    const response = await fetch(`${STORY_SERVICE_URL}/training-history/user/${userId}/stats`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      return {
        totalSessions: 0,
        totalExamplesGenerated: 0,
        totalStoriesSaved: 0,
        averageQuality: 0,
        totalTrainingTimeSeconds: 0,
        fineTuningSessionsCount: 0
      };
    }
    return await response.json();
  } catch {
    return {
      totalSessions: 0,
      totalExamplesGenerated: 0,
      totalStoriesSaved: 0,
      averageQuality: 0,
      totalTrainingTimeSeconds: 0,
      fineTuningSessionsCount: 0
    };
  }
};

/**
 * Get recent training sessions
 */
export const getRecentTrainingSessions = async (
  userId: number,
  limit: number = 5
): Promise<{ content: TrainingHistory[] }> => {
  const response = await httpClient.get(
    `${STORY_SERVICE_URL}/training-history/user/${userId}/recent`,
    { params: { limit } }
  );
  return response.data;
};
