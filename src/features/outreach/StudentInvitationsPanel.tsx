// ============================================================================
// NEXALINK V2.8: Student Invitations Panel
// Lists incoming outreach invitations with Accept, Decline, Block/Report actions
// ============================================================================

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useStudentInvitations } from './useOutreach';
import { InvitationRowSkeleton } from './OutreachSkeletons';
import type { OutreachInvitation } from './types';
import { Mail, Clock, Check, X, ShieldAlert, AlertTriangle } from 'lucide-react';

interface StudentInvitationsPanelProps {
  onOpenChat?: (userId: string) => void;
}

export const StudentInvitationsPanel: React.FC<StudentInvitationsPanelProps> = ({
  onOpenChat
}) => {
  const { currentUser } = useAuth();
  const { setPendingChatUserId } = useData();
  const { invitations, isLoading, respond } = useStudentInvitations(currentUser?.id);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmBlockInv, setConfirmBlockInv] = useState<OutreachInvitation | null>(null);

  const handleAccept = async (inv: OutreachInvitation) => {
    setProcessingId(inv.id);
    try {
      await respond(inv.id, 'accept');
      // Create/open 1:1 NexaChat
      if (onOpenChat) {
        onOpenChat(inv.senderId);
      } else if (setPendingChatUserId) {
        setPendingChatUserId(inv.senderId);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (inv: OutreachInvitation) => {
    setProcessingId(inv.id);
    try {
      await respond(inv.id, 'decline');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmBlock = async () => {
    if (!confirmBlockInv) return;
    setProcessingId(confirmBlockInv.id);
    try {
      await respond(confirmBlockInv.id, 'block_report');
      setConfirmBlockInv(null);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        <InvitationRowSkeleton />
        <InvitationRowSkeleton />
        <InvitationRowSkeleton />
      </div>
    );
  }

  const pendingInvitations = invitations.filter(i => i.status === 'pending');
  const pastInvitations = invitations.filter(i => i.status !== 'pending');

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Pending Invitations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
            Pending invitations
          </h2>
          <span className="text-[11px] text-[#6B7280]">
            {pendingInvitations.length} {pendingInvitations.length === 1 ? 'invitation' : 'invitations'}
          </span>
        </div>

        {pendingInvitations.length === 0 ? (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#0A0A0A] mx-auto flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-[#0A0A0A]">
              No invitations waiting for your response
            </h3>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
              When verified alumni or faculty invite you to connect, their message and reason will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingInvitations.map((inv) => {
              const isWorking = processingId === inv.id;
              return (
                <div
                  key={inv.id}
                  className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-colors"
                >
                  <div className="space-y-2.5 flex-1 min-w-0">
                    {/* Header: Sender & Status Chip */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-[#0A0A0A]">
                          {inv.senderName}, {inv.senderRole}
                        </h3>
                        <p className="text-[11px] text-[#6B7280] mt-0.5 truncate">
                          {inv.senderCompanyOrDept} · Received {new Date(inv.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>Pending</span>
                      </span>
                    </div>

                    {/* Reason text (full wrap, never truncated) */}
                    <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-3">
                      <p className="text-xs text-[#0A0A0A] leading-relaxed whitespace-pre-wrap">
                        "{inv.reason}"
                      </p>
                    </div>
                  </div>

                  {/* Actions: Below 768px stacked (Accept full width, Decline and Block side by side). >=768px inline right */}
                  <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch md:items-end lg:items-center gap-2 shrink-0 pt-2 md:pt-0">
                    <button
                      type="button"
                      disabled={isWorking}
                      onClick={() => handleAccept(inv)}
                      className="min-h-[44px] px-4 py-2 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept</span>
                    </button>

                    <div className="grid grid-cols-2 md:flex md:items-center gap-2">
                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={() => handleDecline(inv)}
                        className="min-h-[44px] px-3.5 py-2 border border-[#D1D5DB] hover:bg-[#F3F4F6] text-[#0A0A0A] text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        <span>Decline</span>
                      </button>

                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={() => setConfirmBlockInv(inv)}
                        className="min-h-[44px] px-3 py-2 text-[#991B1B] hover:bg-[#FEF2F2] border border-transparent hover:border-[#FCA5A5] text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Block and report</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Invitations Section */}
      {pastInvitations.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
          <h2 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
            Past invitations
          </h2>
          <div className="divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden">
            {pastInvitations.map((inv) => (
              <div key={inv.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-[#0A0A0A] block truncate">
                    {inv.senderName} ({inv.senderRole})
                  </span>
                  <p className="text-[11px] text-[#6B7280] line-clamp-1 mt-0.5">
                    "{inv.reason}"
                  </p>
                </div>
                <div className="shrink-0">
                  {inv.status === 'accepted' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                      Accepted
                    </span>
                  ) : inv.status === 'declined' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]">
                      Declined
                    </span>
                  ) : inv.status === 'expired' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAFAFA] text-[#6B7280] border border-[#E5E7EB]">
                      Expired
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAFAFA] text-[#6B7280] border border-[#E5E7EB]">
                      {inv.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Block & Report Confirmation Modal */}
      {confirmBlockInv && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 text-[#991B1B]">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm text-[#0A0A0A]">
                Block and report sender?
              </h3>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              This will decline the invitation, permanently block {confirmBlockInv.senderName} from inviting you again, and submit an incident report to platform moderators.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmBlockInv(null)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#D1D5DB] text-xs font-semibold text-[#0A0A0A] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBlock}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#991B1B] text-white text-xs font-semibold hover:bg-[#7F1D1D] transition-colors cursor-pointer"
              >
                Confirm block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
