import { BookOpen } from 'lucide-react';

interface EmptyStateProps {
  view: 'all' | 'my';
}

const EmptyState = ({ view }: EmptyStateProps) => {
  return (
    <div className="text-center py-12 bg-white rounded-lg shadow">
      <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600 text-lg">
        {view === 'my' ? "You haven't written any stories yet." : 'No stories available.'}
      </p>
      <p className="text-gray-500 mt-2">Click "New Story" to get started!</p>
    </div>
  );
};

export default EmptyState;
