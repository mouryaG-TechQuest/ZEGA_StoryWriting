// Loading Spinner Component

interface LoaderProps {
  isLoading?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const Loader = ({ isLoading = true, size = 'medium' }: LoaderProps) => {
  if (!isLoading) return null;

  const sizeClasses = {
    small: 'h-8 w-8 border-b-2',
    medium: 'h-12 w-12 border-b-2',
    large: 'h-16 w-16 border-b-4'
  };

  return (
    <div className="text-center py-12">
      <div className={`inline-block animate-spin rounded-full ${sizeClasses[size]} border-purple-600`}></div>
    </div>
  );
};

export default Loader;
