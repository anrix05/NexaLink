import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowDown, ShieldCheck } from 'lucide-react';

interface HeroCopyProps {
  /** Called when the primary CTA is clicked (unauthenticated path). */
  onCreateAccount: () => void;
  /** Called when "Sign in" is clicked. */
  onSignIn: () => void;
  /** Called when "Go to dashboard" is clicked (authenticated path). */
  onGoToDashboard?: () => void;
  /** Called when the "See how it works" link is clicked. */
  onHowItWorks: () => void;
  /** Whether the user is currently authenticated. */
  isAuthenticated: boolean;
  /** Pairing selector — switches the headline typeface via CSS data attribute. */
  pairing?: 'sans' | 'editorial' | 'outfit';
}

export const HeroCopy: React.FC<HeroCopyProps> = ({
  onCreateAccount,
  onSignIn,
  onGoToDashboard,
  onHowItWorks,
  isAuthenticated,
  pairing = 'sans',
}) => {
  const reduce = useReducedMotion();

  const rise = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.6,
            delay: i * 0.07,
            ease: [0.16, 1, 0.3, 1] as const,
          },
        };

  return (
    <div
      className="hero-type grid min-w-0 justify-items-start gap-6 sm:gap-7"
      data-hero-type={pairing}
    >
      {/* Badge */}
      <motion.span
        {...rise(0)}
        className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-1.5 font-mono text-[0.75rem] font-medium uppercase tracking-[0.1em] text-[#4B5563]"
      >
        <i className="block h-1.5 w-1.5 shrink-0 rounded-full bg-[#0A0A0A]" aria-hidden />
        VIT Wadala
      </motion.span>

      {/* Headline */}
      <motion.h1 {...rise(1)} className="hero-h1">
        Connecting Vidyalankar engineers{' '}
        <span className="soft">with global alumni.</span>
      </motion.h1>

      {/* Intro paragraph */}
      <motion.p
        {...rise(2)}
        className="max-w-[52ch] text-[clamp(1.0625rem,0.98rem+0.4vw,1.25rem)] leading-[1.6] text-[#4B5563]"
        style={{ textWrap: 'pretty' } as React.CSSProperties}
      >
        An institutional platform connecting Vidyalankar students with verified alumni for
        real-world mentorship, career referrals, and academic collaboration.
      </motion.p>

      {/* CTAs */}
      <motion.div {...rise(3)} className="flex flex-wrap items-center gap-3">
        {isAuthenticated ? (
          <>
            <motion.button
              type="button"
              onClick={onGoToDashboard ?? onSignIn}
              whileHover={reduce ? {} : { scale: 1.03 }}
              whileTap={reduce ? {} : { scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="inline-flex min-h-12 items-center gap-2 rounded-[10px] border border-[#0A0A0A] bg-[#0A0A0A] px-5 text-base font-medium text-white cursor-pointer hover:bg-[#262626] transition-colors"
            >
              Go to dashboard <ArrowRight size={16} aria-hidden />
            </motion.button>

            <button
              type="button"
              onClick={onHowItWorks}
              className="inline-flex min-h-12 items-center gap-1.5 px-1.5 text-[0.9375rem] font-medium text-[#4B5563] underline-offset-[5px] hover:text-[#0A0A0A] hover:underline transition-colors cursor-pointer"
            >
              See how it works <ArrowDown size={14} aria-hidden />
            </button>
          </>
        ) : (
          <>
            <motion.button
              type="button"
              onClick={onCreateAccount}
              whileHover={reduce ? {} : { scale: 1.03 }}
              whileTap={reduce ? {} : { scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="inline-flex min-h-12 items-center gap-2 rounded-[10px] border border-[#0A0A0A] bg-[#0A0A0A] px-5 text-base font-medium text-white cursor-pointer hover:bg-[#262626] transition-colors"
            >
              Create account <ArrowRight size={16} aria-hidden />
            </motion.button>

            <motion.button
              type="button"
              onClick={onSignIn}
              whileHover={reduce ? {} : { scale: 1.03 }}
              whileTap={reduce ? {} : { scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="inline-flex min-h-12 items-center rounded-[10px] border border-[#D1D5DB] bg-transparent px-5 text-base font-medium text-[#0A0A0A] cursor-pointer hover:border-[#0A0A0A] transition-colors"
            >
              Sign in
            </motion.button>

            <button
              type="button"
              onClick={onHowItWorks}
              className="inline-flex min-h-12 items-center gap-1.5 px-1.5 text-[0.9375rem] font-medium text-[#4B5563] underline-offset-[5px] hover:text-[#0A0A0A] hover:underline transition-colors cursor-pointer"
            >
              See how it works <ArrowDown size={14} aria-hidden />
            </button>
          </>
        )}
      </motion.div>

      {/* Verification assurance line */}
      <motion.p
        {...rise(4)}
        className="flex items-center gap-2 font-mono text-[0.78rem] leading-normal tracking-[0.02em] text-[#6B7280]"
      >
        <ShieldCheck size={14} aria-hidden className="shrink-0" />
        Every account is verified by the institution before access.
      </motion.p>
    </div>
  );
};
