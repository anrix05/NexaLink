import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';
import type { GateDerivedState } from './ReviewStatusHero';

export interface DevStateSwitcherProps {
  currentState: GateDerivedState;
  onStateSelect: (state: GateDerivedState) => void;
}

export const DevStateSwitcher: React.FC<DevStateSwitcherProps> = ({
  currentState,
  onStateSelect
}) => {
  if (!import.meta.env.DEV) return null;

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const states: { id: GateDerivedState; label: string }[] = [
    { id: 'needs_document', label: '1. Needs document' },
    { id: 'needs_recovery_email', label: '2. Needs recovery email' },
    { id: 'in_review', label: '3. In review' },
    { id: 'needs_clarification', label: '4. Needs clarification' },
    { id: 'rejected', label: '5. Rejected' },
    { id: 'verified', label: '6. Verified' }
  ];

  return (
    <div ref={containerRef} className="fixed bottom-4 right-4 z-50 select-none">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-[#FFFFFF] shadow-sm text-xs font-medium text-[#0A0A0A] hover:bg-[#FAFAFA] flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
        <span>Gate state: {currentState.replace(/_/g, ' ')}</span>
        <ChevronDown className={`w-3 h-3 text-[#6B7280] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-56 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm p-1.5 flex flex-col gap-0.5">
          <div className="px-2 py-1 border-b border-[#E5E7EB] mb-1">
            <span className="text-[10px] font-medium text-[#6B7280]">
              Dev State Switcher (DEV only)
            </span>
          </div>

          {states.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onStateSelect(s.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors focus:outline-none ${
                currentState === s.id
                  ? 'bg-[#0A0A0A] text-[#FFFFFF] font-medium'
                  : 'text-[#0A0A0A] hover:bg-[#FAFAFA]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
