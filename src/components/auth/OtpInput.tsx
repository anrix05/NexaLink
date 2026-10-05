import React, { useState, useRef, useEffect } from 'react';
import { useCountdown } from '../../hooks/useCountdown';
import { AnimatedCheckIcon } from '../common/UIComponents';
import { RefreshCw, Clock, AlertCircle } from 'lucide-react';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  onResend?: () => Promise<void> | void;
  isVerified?: boolean;
  disabled?: boolean;
  error?: string | null;
  className?: string;
  emailDestination?: string;
  resendCooldownSeconds?: number;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  onResend,
  isVerified = false,
  disabled = false,
  error = null,
  className = '',
  emailDestination,
  resendCooldownSeconds = 60
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;

  // 10-minute code validity expiry timer
  const expiryTimer = useCountdown({ initialSeconds: 600 });

  // 60-second resend cooldown timer (Rule 5)
  const resendCooldown = useCountdown({ initialSeconds: resendCooldownSeconds, autoStart: true });

  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const handleChange = (index: number, digit: string) => {
    if (disabled || isVerified) return;
    const cleanDigit = digit.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanDigit;
    const newCode = newDigits.join('');
    onChange(newCode);

    if (cleanDigit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newCode.length === length) {
      onComplete?.(newCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || isVerified) return;

    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled || isVerified) return;
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasteData) return;

    onChange(pasteData);
    const focusIndex = Math.min(pasteData.length, length - 1);
    inputsRef.current[focusIndex]?.focus();

    if (pasteData.length === length) {
      onComplete?.(pasteData);
    }
  };

  const handleResendClick = async () => {
    if (!resendCooldown.isFinished || attempts >= maxAttempts || disabled) return;
    setAttempts((prev) => prev + 1);
    resendCooldown.reset(resendCooldownSeconds);
    await onResend?.();
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {emailDestination && (
        <p className="text-xs text-[#6B7280]">
          Enter the 6-digit verification code sent to{' '}
          <span className="text-[#0A0A0A] font-medium">{emailDestination}</span>.
        </p>
      )}

      {/* 6 Inputs row */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 justify-center sm:justify-start">
        {Array.from({ length }).map((_, index) => {
          const isFilled = Boolean(digits[index]);
          return (
            <input
              key={index}
              ref={(el) => { inputsRef.current[index] = el; }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              pattern="[0-9]*"
              maxLength={1}
              value={digits[index]}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={disabled || isVerified}
              aria-label={`Digit ${index + 1} of ${length}`}
              className={`w-9 h-11 sm:w-12 sm:h-12 min-w-0 text-center text-base sm:text-lg font-mono font-medium rounded-lg border transition-all duration-150 outline-none
                ${
                  isVerified
                    ? 'border-[#059669] bg-[#ECFDF5] text-[#065F46]'
                    : error
                    ? 'border-[#EF4444] bg-[#FEF2F2] text-[#991B1B] focus:ring-2 focus:ring-[#EF4444]'
                    : isFilled
                    ? 'border-[#0A0A0A] bg-[#FFFFFF] text-[#0A0A0A]'
                    : 'border-[#6B7280] bg-[#FFFFFF] text-[#0A0A0A] focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2'
                }
                disabled:bg-[#FAFAFA] disabled:cursor-not-allowed
              `}
            />
          );
        })}

        {isVerified && (
          <div className="flex items-center text-[#059669] pl-1" title="Verified">
            <AnimatedCheckIcon size={20} />
          </div>
        )}
      </div>

      {/* Governance Rose Error Alert for invalid or expired OTP (Rule 6) */}
      {(error || expiryTimer.isFinished) && !isVerified && (
        <div
          role="alert"
          aria-live="polite"
          className="w-full p-3 rounded-lg border border-[#FECACA] bg-[#FEE2E2] text-[#991B1B] text-xs flex items-start gap-2.5 transition-colors"
        >
          <AlertCircle className="w-4 h-4 text-[#991B1B] shrink-0 mt-0.5" aria-hidden="true" />
          <span className="leading-relaxed font-medium">
            {error || 'This verification code has expired. Please request a new code.'}
          </span>
        </div>
      )}

      {/* Expiry and Resend Controls */}
      <div className="flex items-center justify-between text-xs text-[#6B7280] pt-1">
        <div className="flex items-center gap-1.5" role="status">
          <Clock className="w-3.5 h-3.5 text-[#6B7280]" aria-hidden="true" />
          <span>
            {expiryTimer.isFinished ? (
              <span className="text-[#991B1B] font-medium">Code expired</span>
            ) : (
              `Expires in ${expiryTimer.formatted}`
            )}
          </span>
        </div>

        <div>
          {attempts >= maxAttempts ? (
            <span className="text-[#991B1B]">Maximum resend attempts reached</span>
          ) : resendCooldown.isFinished ? (
            <button
              type="button"
              onClick={handleResendClick}
              disabled={disabled || isVerified}
              className="text-[#0A0A0A] hover:underline font-medium inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] rounded p-0.5"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Resend code</span>
            </button>
          ) : (
            <span>Resend in {resendCooldown.secondsRemaining}s</span>
          )}
        </div>
      </div>
    </div>
  );
};
