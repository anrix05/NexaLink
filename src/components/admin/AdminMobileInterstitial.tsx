import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, ArrowRight, ShieldCheck, ExternalLink, ArrowLeft } from 'lucide-react';
import { Button } from '../common/UIComponents';

interface AdminMobileInterstitialProps {
  onBypass: () => void;
  setActiveTab: (tab: string) => void;
}

export const AdminMobileInterstitial: React.FC<AdminMobileInterstitialProps> = ({
  onBypass,
  setActiveTab
}) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 font-sans text-xs">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        className="max-w-md w-full bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm text-center"
      >
        {/* Institutional Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] text-[#0A0A0A] mx-auto flex items-center justify-center shadow-xs">
          <Monitor className="w-7 h-7 stroke-[1.5]" />
        </div>

        {/* Messaging */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB] font-mono text-[10px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0A0A0A]" />
            <span>Admin Governance Console</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-display font-black text-[#0A0A0A] tracking-tight">
            Best experienced on desktop
          </h2>

          <p className="text-xs text-[#6B7280] font-medium leading-relaxed max-w-sm mx-auto">
            The institutional administrator console contains dense audit registries, NAAC/NIRF reporting spreadsheets, and multi-field verification queues optimized for desktop displays (1024px and larger).
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="space-y-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setActiveTab('landing')}
            className="w-full"
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Return to Public Portal
          </Button>

          {/* Escape Hatch Link for Urgent Mobile Approvals */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onBypass}
              className="text-xs font-display font-bold text-[#6B7280] hover:text-[#0A0A0A] underline underline-offset-4 uppercase tracking-wider transition-colors cursor-pointer"
            >
              Continue to desktop layout anyway →
            </button>
            <span className="block text-[10px] font-mono text-[#9CA3AF] mt-1">
              (Horizontal scrolling enabled for urgent moderation)
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
