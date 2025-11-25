import React, { useState, useEffect } from 'react';
import {
  getUserTrainingHistory,
  getUserTrainingStats,
  type TrainingHistory,
  type TrainingStats
} from '../api/trainingHistory.service';

interface TrainingHistoryProps {
  userId: number;
}

const TrainingHistoryComponent: React.FC<TrainingHistoryProps> = ({ userId }) => {
  const [history, setHistory] = useState<TrainingHistory[]>([]);
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      const [historyData, statsData] = await Promise.all([
        getUserTrainingHistory(userId),
        getUserTrainingStats(userId)
      ]);
      
      setHistory(historyData);
      setStats(statsData);
      setLoading(false);
    };
    
    loadData();
  }, [userId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const parseGenres = (genresJson: string): string[] => {
    try {
      return JSON.parse(genresJson);
    } catch {
      return ['random'];
    }
  };

  const parseModelPerformance = (performanceJson: string): Record<string, unknown> => {
    try {
      return JSON.parse(performanceJson);
    } catch {
      return {};
    }
  };

  const toggleSessionDetails = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="text-sm text-blue-600 font-medium mb-1">Total Sessions</div>
            <div className="text-3xl font-bold text-blue-900">{stats.totalSessions}</div>
            <div className="text-xs text-blue-600 mt-2">
              {stats.fineTuningSessionsCount} triggered fine-tuning
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <div className="text-sm text-green-600 font-medium mb-1">Examples Generated</div>
            <div className="text-3xl font-bold text-green-900">{stats.totalExamplesGenerated}</div>
            <div className="text-xs text-green-600 mt-2">
              {stats.totalStoriesSaved} saved to database
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="text-sm text-purple-600 font-medium mb-1">Average Quality</div>
            <div className="text-3xl font-bold text-purple-900">{stats.averageQuality}/10</div>
            <div className="text-xs text-purple-600 mt-2">
              Total time: {formatDuration(stats.totalTrainingTimeSeconds)}
            </div>
          </div>
        </div>
      )}

      {/* Training History Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-white">Training History</h3>
          <p className="text-sm text-blue-100 mt-1">View all your training sessions and details</p>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-lg font-medium text-gray-700 mb-2">📝 No Previous Training History</p>
            <p className="text-sm text-gray-600">Start your first AI training session to see your history here</p>
            <p className="text-xs text-gray-500 mt-2">Once you train, all session details will appear in this table</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Examples
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Best Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((session) => (
                  <React.Fragment key={session.sessionId}>
                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleSessionDetails(session.sessionId)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(session.startedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {session.numExamplesSuccessful} / {session.numExamplesRequested}
                        </div>
                        <div className="text-xs text-gray-500">
                          {session.storiesSavedCount > 0 && `${session.storiesSavedCount} saved to DB`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {session.averageQuality.toFixed(1)}/10
                        </div>
                        <div className="text-xs text-gray-500">
                          {session.minQuality.toFixed(1)} - {session.maxQuality.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {session.bestPerformingModel || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(session.totalTimeSeconds)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSessionDetails(session.sessionId);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {expandedSession === session.sessionId ? 'Hide' : 'Details'}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Details */}
                    {expandedSession === session.sessionId && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-2">Session Details</h4>
                              <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Session ID:</span> {session.sessionId}</p>
                                <p><span className="font-medium">Genres:</span> {parseGenres(session.genresSelected).join(', ')}</p>
                                <p><span className="font-medium">Stored in Memory:</span> {session.storedInMemory ? 'Yes' : 'No'}</p>
                                <p><span className="font-medium">Saved to Database:</span> {session.savedToDatabase ? 'Yes' : 'No'}</p>
                                {session.finetuningTriggered && (
                                  <p className="text-green-600 font-medium">🎓 Fine-tuning triggered!</p>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-2">Model Performance</h4>
                              <div className="space-y-1 text-sm">
                                {Object.entries(parseModelPerformance(session.modelPerformanceJson)).map(([model, perf]) => {
                                  const perfData = perf as { count: number; avg_quality: number };
                                  return (
                                    <div key={model} className="flex justify-between">
                                      <span>{model}:</span>
                                      <span className="font-medium">
                                        {perfData.count} wins, {perfData.avg_quality.toFixed(2)}/10 avg
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingHistoryComponent;
