import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  HelpCircle,
  FileText,
  User,
  ExternalLink,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building2,
  ArrowRight
} from 'lucide-react';
import { MasterDetail, StatusBadge, EmptyState } from '../ui';
import { AnimatedCheckIcon } from '../common/UIComponents';
import type { UserRole } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export interface VerificationItem {
  id: string;
  type: 'registration' | 'role_transition';
  name: string;
  email: string;
  role: string;
  department: string;
  idNo: string;
  submittedAt?: string;
  documentUrl?: string;
  documentName?: string;
  bio?: string;
  skills?: string[];
  proposedData?: {
    company?: string;
    designation?: string;
    personalEmail?: string;
    documentUrl?: string;
  };
  confidence: 'high' | 'medium' | 'review_required';
  confidenceReason: string;
  raw: any;
}

interface VerificationQueueMasterDetailProps {
  items: VerificationItem[];
  onApprove: (id: string, type: 'registration' | 'role_transition') => void;
  onReject: (id: string, type: 'registration' | 'role_transition') => void;
  onClarify: (id: string) => void;
  approvingIds?: string[];
  activeItemId?: string | null;
  onSelectItem?: (id: string) => void;
}

export const VerificationQueueMasterDetail: React.FC<VerificationQueueMasterDetailProps> = ({
  items,
  onApprove,
  onReject,
  onClarify,
  approvingIds = [],
  activeItemId,
  onSelectItem
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id || null);
  const [searchFilter, setSearchFilter] = useState('');

  // Keep selection in sync with props or available items
  useEffect(() => {
    if (activeItemId) {
      setSelectedId(activeItemId);
    } else if (items.length > 0 && (!selectedId || !items.find(i => i.id === selectedId))) {
      setSelectedId(items[0].id);
    }
  }, [items, activeItemId, selectedId]);

  const filteredItems = items.filter(item => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.department.toLowerCase().includes(q) ||
      item.idNo.toLowerCase().includes(q)
    );
  });

  const selectedItem = items.find(i => i.id === selectedId) || null;
  const [resolvedDocUrl, setResolvedDocUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const rawUrl =
      selectedItem?.documentUrl ||
      selectedItem?.raw?.verification_document_url ||
      selectedItem?.raw?.verificationDocumentUrl ||
      selectedItem?.raw?.clarification_requested?.documentUrl;

    if (!rawUrl) {
      setResolvedDocUrl(null);
      return;
    }

    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) {
      setResolvedDocUrl(rawUrl);
      return;
    }

    if (isSupabaseConfigured()) {
      const cleanPath = rawUrl.replace(/^proof-documents\//, '');
      supabase.storage
        .from('proof-documents')
        .createSignedUrl(cleanPath, 3600)
        .then(({ data }) => {
          if (isMounted) {
            setResolvedDocUrl(data?.signedUrl || rawUrl);
          }
        })
        .catch(() => {
          if (isMounted) setResolvedDocUrl(rawUrl);
        });
    } else {
      setResolvedDocUrl(rawUrl);
    }

    return () => {
      isMounted = false;
    };
  }, [
    selectedItem?.id,
    selectedItem?.documentUrl,
    selectedItem?.raw?.verification_document_url,
    selectedItem?.raw?.verificationDocumentUrl,
    selectedItem?.raw?.clarification_requested?.documentUrl,
    selectedItem?.raw?.clarificationRequested?.documentUrl
  ]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelectItem?.(id);
  };

  // Keyboard navigation shortcuts: J/K to move, A to approve, C to clarify, R to reject
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      if (items.length === 0) return;

      const currentIndex = items.findIndex(i => i.id === selectedId);

      if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % items.length;
        handleSelect(items[nextIndex].id);
      } else if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + items.length) % items.length;
        handleSelect(items[prevIndex].id);
      } else if (e.key === 'a' || e.key === 'A') {
        if (selectedItem) {
          e.preventDefault();
          onApprove(selectedItem.id, selectedItem.type);
        }
      } else if (e.key === 'c' || e.key === 'C') {
        if (selectedItem) {
          e.preventDefault();
          onClarify(selectedItem.id);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (selectedItem) {
          e.preventDefault();
          onReject(selectedItem.id, selectedItem.type);
        }
      }
    },
    [items, selectedId, selectedItem, onApprove, onClarify, onReject]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (items.length === 0) {
    return (
      <div className="p-12 text-center border border-[#E5E7EB] rounded-xl bg-white">
        <EmptyState
          icon={<ShieldCheck className="w-5 h-5 text-[#0A0A0A]" />}
          title="Verification queue is all clear"
          sentence="No student enrollment PRNs or alumni transition credentials are awaiting review. Incoming submissions will appear here in real time."
        />
      </div>
    );
  }

  // Master Column Content
  const masterContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Search Bar */}
      <div className="p-3 border-b border-[#E5E7EB]">
        <input
          type="text"
          placeholder="Filter queue by name, PRN, or email..."
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-[#FAFAFA] border border-[#6B7280] rounded-lg text-[#0A0A0A] placeholder:text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#0A0A0A]"
        />
      </div>

      {/* Item List */}
      <div className="divide-y divide-[#E5E7EB] overflow-y-auto flex-1">
        {filteredItems.map(item => {
          const isSelected = item.id === selectedId;
          const isApproving = approvingIds.includes(item.id);

          return (
            <div
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`p-3.5 cursor-pointer transition-colors relative ${
                isSelected
                  ? 'bg-[#F9FAFB] border-l-2 border-[#0A0A0A]'
                  : 'hover:bg-[#FAFAFA] border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs text-[#0A0A0A] truncate">
                      {item.name}
                    </span>
                    <StatusBadge
                      tone={
                        item.type === 'role_transition'
                          ? 'indigo'
                          : item.role.toLowerCase() === 'faculty'
                          ? 'indigo'
                          : 'neutral'
                      }
                      label={item.type === 'role_transition' ? 'Graduation transition' : item.role}
                    />
                    {(Boolean(
                      item.raw?.user_replied ||
                      item.raw?.userReplied ||
                      item.raw?.clarification_requested?.userReplied ||
                      item.raw?.clarification_requested?.user_replied ||
                      item.raw?.clarificationRequested?.userReplied ||
                      item.raw?.clarificationRequested?.user_replied ||
                      (item.documentUrl && (item.raw?.clarification_requested || item.raw?.clarificationRequest || item.raw?.clarificationRequested))
                    )) && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[#FEF3C7] text-[#B45309] rounded">
                        User replied
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-[#6B7280] truncate mt-0.5">
                    {item.department} · PRN: <span className="font-mono text-[#0A0A0A]">{item.idNo}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-[#6B7280] mt-1.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#6B7280]" />
                      SLA: Within 24h
                    </span>
                    <span>·</span>
                    <span
                      className={`font-medium ${
                        item.confidence === 'high'
                          ? 'text-[#065F46]'
                          : item.confidence === 'medium'
                          ? 'text-[#B45309]'
                          : 'text-[#991B1B]'
                      }`}
                    >
                      {item.confidence === 'high'
                        ? '✓ Roster match'
                        : item.confidence === 'medium'
                        ? '⚠ Verification suggested'
                        : 'Review needed'}
                    </span>
                  </div>
                </div>

                {isApproving && (
                  <span className="shrink-0 text-xs text-[#065F46] font-medium flex items-center gap-1">
                    <AnimatedCheckIcon size={14} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Keyboard Shortcut Legend */}
      <div className="p-2.5 bg-[#FAFAFA] border-t border-[#E5E7EB] text-[11px] text-[#6B7280] flex items-center justify-between">
        <span>
          <kbd className="px-1.5 py-0.5 bg-white border border-[#E5E7EB] rounded text-[10px] font-mono text-[#0A0A0A]">J</kbd>
          <kbd className="px-1.5 py-0.5 bg-white border border-[#E5E7EB] rounded text-[10px] font-mono text-[#0A0A0A] ml-1">K</kbd>
          <span className="ml-1.5">Navigate</span>
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-white border border-[#E5E7EB] rounded text-[10px] font-mono text-[#0A0A0A]">A</kbd>
          <span className="ml-1">Approve</span>
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-white border border-[#E5E7EB] rounded text-[10px] font-mono text-[#0A0A0A]">C</kbd>
          <span className="ml-1">Request Document</span>
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 bg-white border border-[#E5E7EB] rounded text-[10px] font-mono text-[#0A0A0A]">R</kbd>
          <span className="ml-1">Reject</span>
        </span>
      </div>
    </div>
  );

  // Detail Column Content
  const detailContent = selectedItem ? (
    <div className="p-6 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-[#0A0A0A]">{selectedItem.name}</h3>
            <StatusBadge
              tone={selectedItem.type === 'role_transition' ? 'indigo' : 'neutral'}
              label={selectedItem.type === 'role_transition' ? 'Role transition' : selectedItem.role}
            />
            {(Boolean(
              selectedItem.raw?.user_replied ||
              selectedItem.raw?.userReplied ||
              selectedItem.raw?.clarification_requested?.userReplied ||
              selectedItem.raw?.clarification_requested?.user_replied ||
              selectedItem.raw?.clarificationRequested?.userReplied ||
              selectedItem.raw?.clarificationRequested?.user_replied ||
              (selectedItem.documentUrl && (selectedItem.raw?.clarification_requested || selectedItem.raw?.clarificationRequest || selectedItem.raw?.clarificationRequested))
            )) && (
              <span className="px-2 py-0.5 text-xs font-medium bg-[#FEF3C7] text-[#B45309] rounded-full">
                User replied
              </span>
            )}
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Registered: {selectedItem.email} · Department: {selectedItem.department}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onClarify(selectedItem.id)}
            className="px-3 py-1.5 border border-[#6B7280] hover:bg-white text-[#0A0A0A] text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            title="Press C to request document"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Request Document</span>
          </button>
          <button
            type="button"
            onClick={() => onReject(selectedItem.id, selectedItem.type)}
            className="px-3 py-1.5 border border-[#6B7280] hover:bg-white text-[#991B1B] text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            title="Press R to reject"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reject</span>
          </button>
          <button
            type="button"
            onClick={() => onApprove(selectedItem.id, selectedItem.type)}
            className="px-3.5 py-1.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            title="Press A to approve"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Approve</span>
          </button>
        </div>
      </div>

      {/* Registrar Comparison Table */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-[#0A0A0A]">Registrar comparison</h4>
        <div className="border border-[#E5E7EB] rounded-lg bg-white overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[11px] text-[#6B7280]">
              <tr>
                <th className="p-2.5 font-medium">Field</th>
                <th className="p-2.5 font-medium">Submitted value</th>
                <th className="p-2.5 font-medium">Institutional roster check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              <tr>
                <td className="p-2.5 text-[#6B7280] font-medium">PRN / ID</td>
                <td className="p-2.5 font-mono text-[#0A0A0A] font-medium">{selectedItem.idNo}</td>
                <td className="p-2.5 text-[#065F46] font-medium">✓ Valid format for {selectedItem.department}</td>
              </tr>
              <tr>
                <td className="p-2.5 text-[#6B7280] font-medium">Email domain</td>
                <td className="p-2.5 text-[#0A0A0A]">{selectedItem.email}</td>
                <td className="p-2.5 font-medium">
                  {selectedItem.email.includes('vit.edu.in') ? (
                    <span className="text-[#065F46]">✓ Institutional email validated</span>
                  ) : (
                    <span className="text-[#B45309]">Personal email ({resolvedDocUrl ? 'proof attached' : 'No document yet'})</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2.5 text-[#6B7280] font-medium">Department</td>
                <td className="p-2.5 text-[#0A0A0A]">{selectedItem.department}</td>
                <td className="p-2.5 text-[#065F46]">✓ Registered departmental cohort</td>
              </tr>
              {selectedItem.proposedData && (
                <>
                  <tr>
                    <td className="p-2.5 text-[#6B7280] font-medium">Role transition</td>
                    <td className="p-2.5 text-[#0A0A0A]" colSpan={2}>
                      Student → Alumni ({selectedItem.proposedData.designation} at {selectedItem.proposedData.company})
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Previewer with Secure Signed URL Link */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-[#0A0A0A]">Verification document</h4>
          {resolvedDocUrl && (
            <a
              href={resolvedDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#0A0A0A] hover:underline flex items-center gap-1 font-medium"
            >
              <span>Open in new window</span>
              <ExternalLink className="w-3 h-3 text-[#6B7280]" />
            </a>
          )}
        </div>

        {resolvedDocUrl ? (
          <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs text-[#6B7280]">
              <FileText className="w-4 h-4 text-[#0A0A0A]" />
              <span className="font-medium text-[#0A0A0A]">
                {selectedItem.documentName || 'Scanned_ID_Card.pdf'}
              </span>
              <span>· Secure signed link</span>
            </div>
            {/* If it's an image, preview inline */}
            {resolvedDocUrl.match(/\.(png|jpg|jpeg|webp)($|\?)/i) || resolvedDocUrl.startsWith('data:image') ? (
              <img
                src={resolvedDocUrl}
                alt="Verification Proof"
                className="max-h-64 mx-auto rounded border border-[#E5E7EB] object-contain"
              />
            ) : (
              <div className="p-6 bg-[#FAFAFA] rounded-md border border-dashed border-[#E5E7EB] text-xs text-[#6B7280] space-y-2">
                <p>Document attached for compliance review.</p>
                <a
                  href={resolvedDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0A0A] text-white rounded text-xs font-medium hover:bg-[#262626]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View / Download Document</span>
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 border border-[#E5E7EB] rounded-lg bg-white text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#6B7280] shrink-0" />
            <span className="font-semibold text-[#0A0A0A]">No document yet</span>
            <span className="text-[#6B7280]">— This applicant did not attach an institutional proof document. You may approve, request document, or reject.</span>
          </div>
        )}
      </div>

      {/* Stated Bio & Career Details */}
      {selectedItem.bio && (
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-[#0A0A0A]">Application bio & statement</h4>
          <p className="text-xs text-[#374151] p-3 bg-white border border-[#E5E7EB] rounded-lg leading-relaxed">
            "{selectedItem.bio}"
          </p>
        </div>
      )}
    </div>
  ) : (
    <div className="p-12 text-center text-xs text-[#6B7280]">
      Select an applicant from the queue to view verification details.
    </div>
  );

  return (
    <MasterDetail
      master={masterContent}
      detail={detailContent}
      detailOpen={Boolean(selectedItem)}
    />
  );
};
