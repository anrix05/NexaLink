import React from 'react';
import { NexaMark } from '../brand/NexaMark';

export interface LogoMarkProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
  withAccent?: boolean;
  title?: string;
}

/**
 * NexaLink Logomark Wrapper
 * Re-exports the canonical NexaMark vector to maintain 100% pixel-identical branding.
 */
export const LogoMark: React.FC<LogoMarkProps> = ({ 
  className = "w-7 h-7 text-[#0A0A0A]", 
  size,
  withAccent = true,
  title,
  ...rest
}) => {
  return (
    <NexaMark
      className={className}
      size={size}
      variant={withAccent ? 'default' : 'monochrome'}
      title={title}
      {...rest}
    />
  );
};
