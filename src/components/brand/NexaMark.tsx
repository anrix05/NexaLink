import React from 'react';

export interface NexaMarkProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  title?: string;
  variant?: 'default' | 'monochrome';
  size?: number | string;
}

/**
 * NexaLink Canonical Vector Logomark (PRD v2.7.0)
 *
 * Geometric "N" Monogram built from two interlocking halves with 45° chamfers
 * and a single central nexus core node (orange ring with white center dot).
 *
 * Bounding Box (1024 grid): x 255 to 768, y 145 to 693.
 * Cropped tightly to viewBox="250 140 525 558" for precise FLIP geometry handoffs.
 */
export const NexaMark: React.FC<NexaMarkProps> = ({
  className = "w-7 h-7 text-[#0A0A0A]",
  title = "NexaLink Logomark",
  variant = 'default',
  size,
  style,
  ...rest
}) => {
  return (
    <svg
      viewBox="250 140 525 558"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        ...(size ? { width: size, height: size } : {}),
        ...style
      }}
      aria-label={title}
      role="img"
      {...rest}
    >
      {title && <title>{title}</title>}

      {/* Half 1: Left Pillar, Top-Left 45° Chamfer & Descending Diagonal Hook */}
      <path
        d="M255 693 L335 693 L335 270 L418 270 L565 417 L565 475 L639 549 L639 373 L442 176 L348 176 L255 269 Z"
        fill="currentColor"
      />

      {/* Half 2: Right Pillar, Bottom-Right 45° Chamfer & Ascending Diagonal Hook (180° Rotational Symmetry) */}
      <path
        d="M768 145 L688 145 L688 568 L605 568 L458 421 L458 363 L384 289 L384 465 L581 662 L675 662 L768 569 Z"
        fill="currentColor"
      />

      {/* Central Nexus Core Node (The "Link") */}
      <g id="nexa-node-group">
        <circle
          cx="506"
          cy="438"
          r="44"
          fill={variant === 'monochrome' ? 'currentColor' : 'var(--nexalink-node, #FD9C03)'}
        />
        <circle
          cx="506"
          cy="438"
          r="19"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  );
};
