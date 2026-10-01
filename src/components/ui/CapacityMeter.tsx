import React from 'react';
import { Minus, Plus } from 'lucide-react';

export interface CapacityMeterProps {
  activeCount: number;
  maxCount: number;
  onMaxChange?: (newMax: number) => void;
  minLimit?: number;
  maxLimit?: number;
  mode?: 'stepper' | 'dots';
  label?: string;
  className?: string;
}

export const CapacityMeter: React.FC<CapacityMeterProps> = ({
  activeCount,
  maxCount,
  onMaxChange,
  minLimit = 1,
  maxLimit = 10,
  mode = 'stepper',
  label = 'Mentoring capacity',
  className = '',
}) => {
  const isFull = activeCount >= maxCount;

  if (mode === 'dots') {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6B7280] font-medium">{label}</span>
          <span className="font-semibold text-[#0A0A0A] tabular-nums">
            {activeCount} / {maxCount} active
          </span>
        </div>
        <div className="flex items-center gap-1.5" role="meter" aria-valuenow={activeCount} aria-valuemin={0} aria-valuemax={maxCount}>
          {Array.from({ length: maxCount }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i < activeCount ? 'bg-[#0A0A0A]' : 'bg-[#E5E7EB]'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-3 text-xs ${className}`}>
      <div>
        <span className="text-[#6B7280] block text-[11px] font-medium">{label}</span>
        <span className="font-semibold text-[#0A0A0A] tabular-nums">
          Mentoring {activeCount} of {maxCount}
        </span>
      </div>

      {onMaxChange && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Decrease maximum capacity"
            disabled={maxCount <= Math.max(minLimit, activeCount)}
            onClick={() => onMaxChange(Math.max(minLimit, maxCount - 1))}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#0A0A0A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-6 text-center font-bold tabular-nums text-xs text-[#0A0A0A]">
            {maxCount}
          </span>
          <button
            type="button"
            aria-label="Increase maximum capacity"
            disabled={maxCount >= maxLimit}
            onClick={() => onMaxChange(Math.min(maxLimit, maxCount + 1))}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#0A0A0A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
