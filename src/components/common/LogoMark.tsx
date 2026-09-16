import React from 'react';

interface LogoMarkProps {
  className?: string;
  size?: number;
  withAccent?: boolean;
}

/**
 * NexaLink Logomark
 * 
 * Minimal Aesthetic Geometric "N" Monogram:
 * Precision-engineered interlocking dual-hook link architecture with a central
 * Amber (#F59E0B) Nexus Core.
 * Represents the persistent connection bridge between students, alumni, and institution.
 */
export const LogoMark: React.FC<LogoMarkProps> = ({ 
  className = "w-7 h-7 text-[#0A0A0A]", 
  size,
  withAccent = true
}) => {
  return (
    <svg
      viewBox="10 10 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Piece 1: Left Pillar, Top-Left Bevel & Descending Hook */}
      <path
        d="M20 106 L33 106 L33 34 L46 34 L69 57 L69 66 L81 78 L81 50 L50 19 L36 19 L20 35 Z"
        fill="currentColor"
      />

      {/* Piece 2: Right Pillar, Bottom-Right Bevel & Ascending Hook (180° Rotational Symmetry) */}
      <path
        d="M100 14 L87 14 L87 86 L74 86 L51 63 L51 54 L39 42 L39 70 L70 101 L84 101 L100 85 Z"
        fill="currentColor"
      />

      {/* Central Amber Nexus Core Node */}
      <circle 
        cx="60" 
        cy="60" 
        r="6.5" 
        fill={withAccent ? "#F59E0B" : "currentColor"} 
      />
      {withAccent && (
        <circle 
          cx="60" 
          cy="60" 
          r="2.5" 
          fill="#FFFFFF" 
          opacity="0.85" 
        />
      )}
    </svg>
  );
};

