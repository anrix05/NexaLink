// ============================================================================
// NEXALINK V2.8: Outreach Visibility Card (Student Settings)
// Sovereign student privacy controls & Profile View history
// ============================================================================

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOutreachSettings, useProfileViews } from './useOutreach';
import { ProfileViewRowSkeleton } from './OutreachSkeletons';
import { ShieldCheck, Eye } from 'lucide-react';

interface SwitchRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const SwitchRow: React.FC<SwitchRowProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false
}) => {
  return (
    <div className="min-h-[56px] py-2 flex items-center justify-between gap-4 border-b border-[#E5E7EB] last:border-b-0">
      <div className="min-w-0 flex-1">
        <label className="text-xs font-semibold text-[#0A0A0A] block">
          {label}
        </label>
        {description && (
          <p className="text-[11px] text-[#6B7280] leading-relaxed mt-0.5">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 p-0.5 border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] ${
          checked ? 'bg-[#0A0A0A]' : 'bg-[#E5E7EB]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ minWidth: '44px', minHeight: '28px' }}
      >
        <span
          className={`block w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export const OutreachVisibilityCard: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const isStudent = currentRole === 'student';

  const { settings, isLoading, isSaving, updateSettings } = useOutreachSettings(currentUser?.id);
  const { views, isLoading: isLoadingViews } = useProfileViews(currentUser?.id);

  if (!isStudent) return null;

  const isOpen = settings?.openToOutreach ?? false;

  const handleMasterToggle = async (val: boolean) => {
    await updateSettings({ openToOutreach: val });
  };

  const handleToggleField = async (field: 'showSkills' | 'showCareerGoal' | 'showInterests', val: boolean) => {
    await updateSettings({ [field]: val });
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-6 space-y-6 text-xs mt-6">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] pb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#0A0A0A]" />
          <h2 className="text-sm font-semibold text-[#0A0A0A]">
            Student outreach & discovery
          </h2>
        </div>
        <p className="text-[#6B7280] font-medium mt-1 leading-relaxed">
          Verified alumni and faculty can see the fields you choose. They can only send you an invitation. A chat opens only if you accept.
        </p>
      </div>

      {/* Master Toggle */}
      <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-4">
        <SwitchRow
          label="Open to mentorship and referrals"
          description="Alumni and faculty can see this. They can only invite you. Chat opens after you accept."
          checked={isOpen}
          onChange={handleMasterToggle}
          disabled={isLoading || isSaving}
        />

        {/* Per-Field Toggles (Visible only when Master Toggle is ON) */}
        {isOpen && (
          <div className="pt-4 mt-3 border-t border-[#E5E7EB] space-y-1">
            <span className="block text-[11px] font-mono uppercase text-[#6B7280] mb-2 tracking-wider">
              Fields visible in discovery
            </span>

            <SwitchRow
              label="Technical & professional skills"
              description="Expose your declared skills for matchmaking and referral requests."
              checked={settings?.showSkills ?? true}
              onChange={(val) => handleToggleField('showSkills', val)}
              disabled={isSaving}
            />

            <SwitchRow
              label="Career goal & target roles"
              description="Help mentors understand what industry or role you are aiming for."
              checked={settings?.showCareerGoal ?? true}
              onChange={(val) => handleToggleField('showCareerGoal', val)}
              disabled={isSaving}
            />

            <SwitchRow
              label="Areas of interest"
              description="Allow faculty and alumni to connect on shared research or domain topics."
              checked={settings?.showInterests ?? true}
              onChange={(val) => handleToggleField('showInterests', val)}
              disabled={isSaving}
            />
          </div>
        )}
      </div>

      {/* Profile Views History (Last 30 Days) */}
      <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-[#0A0A0A]" />
            <h3 className="text-xs font-semibold text-[#0A0A0A]">
              Who viewed my profile (last 30 days)
            </h3>
          </div>
          <span className="text-[11px] text-[#6B7280] font-mono">
            {views.length} {views.length === 1 ? 'view' : 'views'}
          </span>
        </div>

        {isLoadingViews ? (
          <div className="divide-y divide-[#E5E7EB]">
            <ProfileViewRowSkeleton />
            <ProfileViewRowSkeleton />
          </div>
        ) : views.length === 0 ? (
          <div className="py-4 text-center border border-dashed border-[#E5E7EB] rounded-xl text-xs text-[#6B7280]">
            No alumni or faculty profile views recorded in the last 30 days.
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB] border-t border-b border-[#E5E7EB]">
            {views.map((v, i) => (
              <div
                key={i}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
              >
                <div className="min-w-0">
                  <span className="font-semibold text-[#0A0A0A] block sm:inline">
                    {v.viewerName}
                  </span>
                  <span className="text-[#6B7280] sm:ml-2">
                    {v.viewerRole}
                  </span>
                </div>
                <span className="text-[11px] text-[#6B7280] shrink-0 font-mono">
                  {v.viewedOn}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
