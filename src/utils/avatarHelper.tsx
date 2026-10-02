import React, { useState } from 'react';

/**
 * Returns the uppercase initials of a user's name (first letter of first and last word).
 * Example: "Aanya Patel" -> "AP", "Dr. Ravindra Sangale" -> "RS", "Rushabh" -> "R"
 */
export function getInitials(name: string): string {
  if (!name || typeof name !== 'string') return '?';
  const clean = name.trim().replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  alt?: string;
}

const sizeClasses: Record<string, { container: string; text: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]' },
  sm: { container: 'w-8 h-8', text: 'text-xs' },
  md: { container: 'w-10 h-10', text: 'text-sm' },
  lg: { container: 'w-14 h-14', text: 'text-base' },
  xl: { container: 'w-[72px] h-[72px]', text: 'text-xl' },
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  alt,
}) => {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);

  const isPresetSize = typeof size === 'string' && size in sizeClasses;
  const sizeConfig = isPresetSize ? sizeClasses[size as string] : sizeClasses.md;
  const customStyle = typeof size === 'number' ? { width: size, height: size } : undefined;

  return (
    <div
      style={customStyle}
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden bg-[#F3F4F6] text-[#0A0A0A] font-semibold border border-[#E5E7EB] select-none ${
        isPresetSize ? sizeConfig.container : ''
      } ${className}`}
      title={name}
      aria-label={alt || name}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt || name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className={`tracking-normal tabular-nums ${isPresetSize ? sizeConfig.text : ''}`}>
          {initials}
        </span>
      )}
    </div>
  );
};
