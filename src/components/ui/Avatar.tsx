import React, { useState, useMemo, useEffect } from 'react';
import { User as UserIcon } from 'lucide-react';
import { getAvatarUrl, getInitials } from '../../lib/avatar';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: AvatarSize;
  className?: string;
  alt?: string;
  updatedAt?: string | number | Date | null;
}

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', { sizePx: number; containerClass: string; textClass: string; iconSize: number }> = {
  xs: { sizePx: 24, containerClass: 'w-6 h-6', textClass: 'text-[9px]', iconSize: 12 },
  sm: { sizePx: 32, containerClass: 'w-8 h-8', textClass: 'text-xs', iconSize: 15 },
  md: { sizePx: 40, containerClass: 'w-10 h-10', textClass: 'text-sm', iconSize: 18 },
  lg: { sizePx: 48, containerClass: 'w-12 h-12', textClass: 'text-base', iconSize: 22 },
  xl: { sizePx: 80, containerClass: 'w-20 h-20', textClass: 'text-2xl', iconSize: 36 },
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  email,
  size = 'md',
  className = '',
  alt,
  updatedAt,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const resolvedUrl = useMemo(() => getAvatarUrl(src, updatedAt), [src, updatedAt]);
  const initials = useMemo(() => getInitials(name, email), [name, email]);

  // Reset state whenever resolved URL changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [resolvedUrl]);

  const isNumericSize = typeof size === 'number';
  const presetConfig = !isNumericSize ? (SIZE_MAP[size] || SIZE_MAP.md) : null;

  const dimensionPx = isNumericSize ? size : presetConfig!.sizePx;
  const customStyle: React.CSSProperties = isNumericSize
    ? {
        width: `${dimensionPx}px`,
        height: `${dimensionPx}px`,
        fontSize: `${Math.max(9, Math.round(dimensionPx * 0.38))}px`,
      }
    : {};

  const effectiveContainerClass = presetConfig ? `${presetConfig.containerClass} ${presetConfig.textClass}` : '';
  const accessibleLabel = alt || name || email || 'User Avatar';

  const shouldRenderImage = Boolean(resolvedUrl && !hasError);

  return (
    <div
      role="img"
      aria-label={accessibleLabel}
      style={customStyle}
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden bg-[#F3F4F6] text-[#374151] font-semibold border border-[#E5E7EB] select-none ${effectiveContainerClass} ${className}`}
    >
      {/* Initials / Icon Layer (always rendered as fallback or loading placeholder) */}
      <span className="flex items-center justify-center w-full h-full tracking-tight tabular-nums select-none">
        {initials ? (
          initials
        ) : (
          <UserIcon
            size={isNumericSize ? Math.round(dimensionPx * 0.45) : presetConfig!.iconSize}
            className="text-[#6B7280]"
            aria-hidden="true"
          />
        )}
      </span>

      {/* Real Avatar Image with smooth 150ms fade-in */}
      {shouldRenderImage && (
        <img
          src={resolvedUrl!}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-150 ${
            isLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />
      )}
    </div>
  );
};
