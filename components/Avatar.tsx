import React from 'react';

interface AvatarProps {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

const Avatar: React.FC<AvatarProps> = ({ name, color, size = 'md', className = '' }) => {
  return (
    <div
      className={`shrink-0 rounded-full flex items-center justify-center font-bold text-white ${SIZE_CLASSES[size]} ${className}`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {getInitials(name) || '?'}
    </div>
  );
};

export default Avatar;
