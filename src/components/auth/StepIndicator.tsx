import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';

export interface StepIndicatorProps {
  currentStep: number; // 1, 2, or 3
  totalSteps?: number;
  className?: string;
}

const STEP_LABELS = ['Profile', 'Account', 'Verify and submit'];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps = 3,
  className = ''
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`w-full flex flex-col gap-2.5 ${className}`}>
      {/* Step counter text */}
      <div className="flex items-center justify-between text-xs text-[#6B7280]">
        <span className="font-medium text-[#0A0A0A]">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="hidden sm:inline font-normal">
          {STEP_LABELS[currentStep - 1]}
        </span>
      </div>

      {/* 3 Segments */}
      <div className="grid grid-cols-3 gap-2" role="list" aria-label="Registration progress">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div
              key={stepNumber}
              role="listitem"
              aria-current={isCurrent ? 'step' : undefined}
              className="relative flex flex-col gap-1.5"
            >
              {/* Bar */}
              <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden relative">
                {isCompleted && (
                  <div className="w-full h-full bg-[#0A0A0A] rounded-full" />
                )}
                {isCurrent && (
                  <motion.div
                    layoutId={shouldReduceMotion ? undefined : 'active-step-bar'}
                    className="w-full h-full bg-[#0A0A0A] rounded-full"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 400, damping: 28 }
                    }
                  />
                )}
              </div>

              {/* Labels on tablet/desktop */}
              <div className="hidden sm:flex items-center gap-1 text-[11px] font-sans">
                {isCompleted ? (
                  <Check className="w-3 h-3 text-[#0A0A0A] shrink-0" aria-hidden="true" />
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-[#0A0A0A]' : 'bg-[#E5E7EB]'}`} />
                )}
                <span className={`truncate ${isCurrent ? 'font-medium text-[#0A0A0A]' : isCompleted ? 'text-[#0A0A0A]' : 'text-[#6B7280]'}`}>
                  {STEP_LABELS[index]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
