import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  onClick?: () => void;
}

const Card = React.memo<CardProps>(({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hoverable = false,
  onClick
}) => {
  const baseClasses = 'rounded-xl transition-all duration-300';
  
  const variantClasses = {
    default: 'bg-white border-2 border-purple-200 shadow-sm',
    gradient: 'bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 shadow-sm',
    glass: 'bg-white/80 backdrop-blur-xl border border-purple-100 shadow-2xl'
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  const hoverClasses = hoverable ? 'hover:shadow-lg hover:border-purple-400 cursor-pointer transform hover:scale-[1.02]' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
