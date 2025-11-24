import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: 'default' | 'danger' | 'success' | 'info';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

const IconButton = React.memo<IconButtonProps>(({
  icon: Icon,
  variant = 'default',
  size = 'md',
  tooltip,
  className = '',
  ...props
}) => {
  const variantClasses = {
    default: 'text-gray-600 hover:text-gray-800 hover:bg-gray-50',
    danger: 'text-red-500 hover:text-red-600 hover:bg-red-50',
    success: 'text-green-500 hover:text-green-600 hover:bg-green-50',
    info: 'text-blue-500 hover:text-blue-600 hover:bg-blue-50'
  };
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      type="button"
      className={`p-1 rounded transition ${variantClasses[variant]} ${className}`}
      title={tooltip}
      {...props}
    >
      <Icon className={sizeClasses[size]} />
    </button>
  );
});

IconButton.displayName = 'IconButton';

export default IconButton;
