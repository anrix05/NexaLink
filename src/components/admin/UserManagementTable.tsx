/**
 * AUDIT STATUS COMMENT:
 * USER MANAGEMENT IMPLEMENTATION - Fulfills original workflow spec item 'Step 5 — User Management'
 * providing a full-roster management directory for all platform accounts (Student, Alumni, Faculty, Admin — Verified, Pending, Rejected, Deactivated).
 * Driven 100% by the unified DataContext dataset.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import { RoleGate } from '../common/RoleGate';
import type { UserRole, DepartmentCode } from '../../types';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  UserX,
  UserCheck,
  Edit3,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Building2,
  GraduationCap,
  Briefcase,
  Trash2,
  ChevronDown,
  Copy,
  Check,
  Phone,
  Calendar,
  FileText,
  ExternalLink
} from 'lucide-react';
import { Badge, Button } from '../common/UIComponents';
import { getUserEmails } from '../../utils/userEmails';
import { getDepartmentDisplayName } from '../../utils/enumMappers';
import { formatDate } from '../../utils/formatters';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export const UserManagementTable: React.FC = () => {
  const {
    alumniList,
    studentList,
    facultyList,
    adminList,
    pendingUsersList,
    deactivateUser,
    reactivateUser,
    mutateUserRole,
    reopenVerification,
    deleteUser,
    updateUserProfile
  } = useData();

  // Combine All User Profiles into unified roster
  const allRosterUsers = [
    ...studentList.map(s => ({ ...s, userCategory: 'Student', isPending: s.verificationStatus === 'Pending Verification' })),
    ...alumniList.map(a => ({ ...a, userCategory: 'Alumni', isPending: a.verificationStatus === 'Pending Verification' })),
    ...facultyList.map(f => ({ ...f, userCategory: 'Faculty', isPending: f.verificationStatus === 'Pending Verification' })),
    ...(adminList || []).map(adm => ({ ...adm, userCategory: 'Administrator', isPending: adm.verificationStatus === 'Pending Verification' }))
  ];

  // Filters & Search
  const ALL_ROSTER_ROLES: { id: string; label: string }[] = [
    { id: 'student', label: 'Student' },
    { id: 'alumni', label: 'Alumni' },
    { id: 'faculty', label: 'Faculty' },
    { id: 'admin', label: 'Administrator' }
  ];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['student', 'alumni', 'faculty', 'admin']);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [deptFilter, setDeptFilter] = useState<string>('All');

  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [roleMutateUser, setRoleMutateUser] = useState<any | null>(null);
  const [deleteUserCandidate, setDeleteUserCandidate] = useState<any | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<UserRole>('student');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editPersonalEmail, setEditPersonalEmail] = useState<string>('');
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [detailSignedDocUrl, setDetailSignedDocUrl] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  const handleCopyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Resolve signed URL for selected user detail proof document
  useEffect(() => {
    let isMounted = true;
    const rawUrl = selectedUserDetail?.verificationDocumentUrl ||
      selectedUserDetail?.verification_document_url ||
      selectedUserDetail?.proofDocumentUrl;

    if (!rawUrl) {
      setDetailSignedDocUrl(null);
      return;
    }

    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) {
      setDetailSignedDocUrl(rawUrl);
      return;
    }

    if (isSupabaseConfigured()) {
      const cleanPath = rawUrl.replace(/^proof-documents\//, '');
      supabase.storage
        .from('proof-documents')
        .createSignedUrl(cleanPath, 3600)
        .then(({ data }) => {
          if (isMounted) setDetailSignedDocUrl(data?.signedUrl || rawUrl);
        })
        .catch(() => {
          if (isMounted) setDetailSignedDocUrl(rawUrl);
        });
    } else {
      setDetailSignedDocUrl(rawUrl);
    }

    return () => {
      isMounted = false;
    };
  }, [selectedUserDetail]);

  // Filtered Roster
  const filteredUsers = allRosterUsers.filter(u => {
    if (selectedRoles.length > 0 && selectedRoles.length < 4 && !selectedRoles.includes(u.role)) return false;
    if (selectedRoles.length === 0) return false;
    if (deptFilter !== 'All' && u.department !== deptFilter) return false;
    
    if (statusFilter !== 'All') {
      const status = u.verificationStatus || (u.isVerified ? 'Verified' : 'Pending Verification');
      if (statusFilter === 'Verified' && !u.isVerified && status !== 'Verified') return false;
      if (statusFilter === 'Pending' && status !== 'Pending Verification') return false;
      if (statusFilter === 'Rejected' && status !== 'Rejected') return false;
      if (statusFilter === 'Deactivated' && u.isActive !== false && status !== 'Deactivated') return false;
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const uAny = u as any;
      const matchName = String(u.name || '').toLowerCase().includes(q);
      const emails = getUserEmails(u);
      const matchCollegeEmail = (emails.collegeEmail || '').toLowerCase().includes(q);
      const matchPersonalEmail = (emails.personalEmail || '').toLowerCase().includes(q);
      const matchDept = String(u.department || '').toLowerCase().includes(q);
      const matchCompany = String(uAny.company || '').toLowerCase().includes(q);
      const matchPrn = String(uAny.prn || uAny.enrollmentNo || '').toLowerCase().includes(q);
      const matchEmpId = String(uAny.employeeId || '').toLowerCase().includes(q);
      return matchName || matchCollegeEmail || matchPersonalEmail || matchDept || matchCompany || matchPrn || matchEmpId;
    }
    return true;
  });

  const roleSummaryText = selectedRoles.length === 4
    ? 'All roles'
    : selectedRoles.length === 0
      ? 'No roles selected'
      : selectedRoles.length === 1
        ? `Role: ${ALL_ROSTER_ROLES.find(r => r.id === selectedRoles[0])?.label}`
        : `Roles: ${selectedRoles.length} selected`;

  const legacyUnbackfilledCount = alumniList.filter(a => a.loginRecoveryNeeded).length;

  return (
    <RoleGate allow={['admin']}>
      <div className="space-y-6 animate-in fade-in duration-300 font-sans text-xs">
        
        {toastNotice && (
          <div className="p-3.5 bg-[#0A0A0A] text-white rounded-xl font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" /> {toastNotice}
          </div>
        )}

        {legacyUnbackfilledCount > 0 && (
          <div className="p-4 bg-[#FFFBEB] border border-[#FCD34D] rounded-xl text-xs text-[#92400E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0" />
              <div>
                <span className="font-bold">Legacy Email Context:</span>{" "}
                <span><strong>{legacyUnbackfilledCount} legacy account(s)</strong> pre-date the personal-email registration requirement. Click the edit icon (<Edit3 className="w-3 h-3 inline" />) on any user row to add or update their personal email directly.</span>
              </div>
            </div>
            <button
              onClick={() => { setSelectedRoles(['alumni']); setSearchQuery(''); }}
              className="px-3 py-1.5 bg-[#B45309] text-white rounded-lg font-bold text-[11px] hover:bg-[#92400E] transition-colors shrink-0"
            >
              Review Legacy Accounts
            </button>
          </div>
        )}

        {/* Controls Bar */}
        <div className="bg-white border border-[#E5E7EB] p-5 rounded-xl shadow-none space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
            <div>
              <h2 className="font-extrabold text-sm text-[#0A0A0A] flex items-center gap-2 tracking-tight">
                <Users className="w-4 h-4 text-[#0A0A0A]" />
                Institutional Roster Directory ({filteredUsers.length} of {allRosterUsers.length} Accounts)
              </h2>
              <p className="text-[#6B7280] text-xs font-medium">
                Full governance directory across Students, Alumni, Faculty, & Administrators.
              </p>
            </div>

            <span className="font-mono text-xs font-bold text-[#374151] bg-[#F3F4F6] px-2.5 py-1 rounded-full border border-[#E5E7EB]">
              Total Roster: {allRosterUsers.length} Records
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-semibold">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#6B7280]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search name, email, PRN..."
                className="w-full bg-[#FAFAFA] border border-[#E5E7EB] pl-8 pr-3 py-2 rounded-lg text-xs focus:outline-none focus:border-[#0A0A0A] font-bold text-[#0A0A0A]"
              />
            </div>

            {/* B7: Multi-Select Role Filter with Visible Selected Count Summary */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="w-full bg-[#FAFAFA] border border-[#E5E7EB] px-3 py-2 rounded-lg text-xs font-bold text-[#0A0A0A] flex items-center justify-between gap-2 hover:bg-[#F3F4F6] transition-colors"
                title={roleSummaryText}
              >
                <span className="truncate">{roleSummaryText}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#6B7280] shrink-0 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isRoleDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsRoleDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-none z-30 p-2 space-y-1">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#E5E7EB] mb-1">
                      <span className="text-xs font-semibold text-[#0A0A0A]">Roles</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedRoles.length === ALL_ROSTER_ROLES.length) setSelectedRoles([]);
                          else setSelectedRoles(ALL_ROSTER_ROLES.map(r => r.id));
                        }}
                        className="text-[10px] text-[#0A0A0A] hover:underline font-bold"
                      >
                        {selectedRoles.length === ALL_ROSTER_ROLES.length ? 'Deselect all' : 'Select all'}
                      </button>
                    </div>
                    {ALL_ROSTER_ROLES.map(role => {
                      const checked = selectedRoles.includes(role.id);
                      return (
                        <label
                          key={role.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#F3F4F6] cursor-pointer text-xs font-semibold text-[#0A0A0A]"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setSelectedRoles(selectedRoles.filter(r => r !== role.id));
                              } else {
                                setSelectedRoles([...selectedRoles, role.id]);
                              }
                            }}
                            className="rounded border-[#E5E7EB] text-[#0A0A0A] focus:ring-0"
                          />
                          <span>{role.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full bg-[#FAFAFA] border border-[#E5E7EB] px-3 py-2 rounded-lg text-xs font-bold text-[#0A0A0A]"
              >
                <option value="All">All Verification Statuses</option>
                <option value="Verified">Verified Accounts</option>
                <option value="Pending">Pending Verification</option>
                <option value="Rejected">Rejected Applications</option>
                <option value="Deactivated">Deactivated Accounts</option>
              </select>
            </div>

            {/* Dept Filter */}
            <div>
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="w-full bg-[#FAFAFA] border border-[#E5E7EB] px-3 py-2 rounded-lg text-xs font-bold text-[#0A0A0A]"
              >
                <option value="All">All Departments (5)</option>
                <option value="CMPN">Computer (CMPN)</option>
                <option value="INFT">Information Tech (INFT)</option>
                <option value="EXCS">Electronics & CS (EXCS)</option>
                <option value="EXTC">Telecom (EXTC)</option>
                <option value="BIOM">Biomedical (BIOM)</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-xs font-semibold text-[#0A0A0A] whitespace-nowrap">
                <tr>
                  <th className="p-3.5">User Member</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Department & Details</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Registered Date</th>
                  <th className="p-3.5 text-right">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] font-medium">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#6B7280] font-medium italic">
                      No matching platform accounts found for the selected filter parameters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => {
                    const status = user.verificationStatus || (user.isVerified ? 'Verified' : 'Pending Verification');
                    const isDeactivated = user.isActive === false || status === 'Deactivated';
                    const isRejected = status === 'Rejected';

                    const emails = getUserEmails(user);
                    const joinedRaw = (user as any).createdAt || (user as any).verifiedAt || '2026-07-01T00:00:00Z';
                    const joinedDisplay = formatDate(joinedRaw);

                    return (
                      <motion.tr layout key={user.id} className="hover:bg-[#FAFAFA] transition whitespace-nowrap">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover border border-[#E5E7EB]"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center border border-[#E5E7EB] text-xs font-bold font-mono tracking-wider shrink-0">
                                {user.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-[#0A0A0A] text-sm tracking-tight font-sans">{user.name}</p>
                              <p className="text-[11px] text-[#6B7280] font-sans font-normal">
                                {emails.displayEmail ? (
                                  emails.displayEmail
                                ) : (
                                  <span className="text-[#B45309] font-medium italic">
                                    Not provided
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <Badge variant="indigo">
                            {user.role}
                          </Badge>
                        </td>

                        <td className="p-3.5">
                          <p className="font-bold text-[#0A0A0A] font-sans">{getDepartmentDisplayName(user.department)}</p>
                          <p className="text-[11px] text-[#6B7280]">
                            {(user as any).company ? (
                              <span>{(user as any).company}</span>
                            ) : (user as any).prn ? (
                              <span className="font-mono">PRN: {(user as any).prn}</span>
                            ) : (user as any).employeeId ? (
                              <span className="font-mono">ID: {(user as any).employeeId}</span>
                            ) : (
                              <span className="font-sans">Campus Member</span>
                            )}
                          </p>
                        </td>

                        <td className="p-3.5">
                          {isDeactivated ? (
                            <Badge variant="indigo">Deactivated</Badge>
                          ) : isRejected ? (
                            <Badge variant="indigo">Rejected</Badge>
                          ) : user.isVerified || status === 'Verified' ? (
                            <Badge variant="emerald">Verified</Badge>
                          ) : (
                            <Badge variant="indigo">Pending</Badge>
                          )}
                        </td>

                        <td className="p-3.5 font-sans text-xs text-[#6B7280] tabular-nums" title={String(joinedRaw)}>
                          {joinedDisplay}
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Profile Detail Modal */}
                            <button
                              onClick={() => setSelectedUserDetail(user)}
                              title="View Full User Detail"
                              className="p-1.5 text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] rounded-lg transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit Profile & Role Trigger */}
                            <button
                              onClick={() => {
                                setRoleMutateUser(user);
                                setEditEmail(user.email || '');
                                setEditPersonalEmail((user as any).personalEmail || '');
                                setNewSelectedRole(user.role as UserRole);
                              }}
                              title="Edit User Credentials & Role"
                              className="p-1.5 text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#FAFAFA] rounded-lg transition"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Deactivate / Reactivate */}
                            {isDeactivated ? (
                              <button
                                onClick={() => {
                                  reactivateUser(user.id);
                                  showToast(`Reactivated access for ${user.name}`);
                                }}
                                title="Reactivate Account"
                                className="p-1.5 text-[#16A34A] hover:bg-emerald-50 rounded-lg transition"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  deactivateUser(user.id);
                                  showToast(`Deactivated access for ${user.name}`);
                                }}
                                title="Deactivate Account Access"
                                className="p-1.5 text-[#DC2626] hover:bg-rose-50 rounded-lg transition"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            )}

                            {/* Re-open Verification (For Rejected Accounts) */}
                            {isRejected && (
                              <button
                                onClick={() => {
                                  reopenVerification(user.id);
                                  showToast(`Re-opened verification queue for ${user.name}`);
                                }}
                                title="Re-open Verification Queue (Undo rejection and re-queue applicant)"
                                className="p-1.5 text-[#2563EB] hover:bg-blue-50 rounded-lg transition"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete User Record */}
                            <button
                              onClick={() => setDeleteUserCandidate(user)}
                              title="Delete Account Record"
                              className="p-1.5 text-[#6B7280] hover:text-[#DC2626] hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: VIEW FULL PROFILE DETAIL */}
        {selectedUserDetail && (() => {
          const detailEmails = getUserEmails(selectedUserDetail);
          const detailJoinedRaw = (selectedUserDetail as any).createdAt || (selectedUserDetail as any).verifiedAt || '2026-07-01T00:00:00Z';
          const isCollegeLogin = Boolean(detailEmails.collegeEmail && detailEmails.loginEmail === detailEmails.collegeEmail);
          const isPersonalLogin = Boolean(detailEmails.personalEmail && detailEmails.loginEmail === detailEmails.personalEmail);
          const docUrl = detailSignedDocUrl || selectedUserDetail.verificationDocumentUrl || (selectedUserDetail as any).verification_document_url;
          const docName = selectedUserDetail.verificationDocumentName || (selectedUserDetail as any).proof_document_name || selectedUserDetail.proofDocumentName || 'Document_Proof.pdf';

          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 max-w-lg w-full space-y-4 font-sans text-xs max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <div className="flex items-center gap-3">
                    {selectedUserDetail.avatar ? (
                      <img src={selectedUserDetail.avatar} alt={selectedUserDetail.name} className="w-10 h-10 rounded-full border border-[#E5E7EB] object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center border border-[#E5E7EB] text-sm font-bold font-mono tracking-wider shrink-0">
                        {selectedUserDetail.name ? selectedUserDetail.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-extrabold text-sm text-[#0A0A0A] font-sans">{selectedUserDetail.name}</h3>
                      <p className="text-[11px] text-[#6B7280] font-sans">
                        {detailEmails.displayEmail || 'No active display email'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUserDetail(null)} className="text-[#6B7280] hover:text-[#0A0A0A] font-bold p-1">
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Email Breakdown Section with Copy Buttons and "Used to sign in" tag */}
                  <div className="space-y-2 bg-[#FAFAFA] p-3.5 rounded-lg border border-[#E5E7EB]">
                    <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Account Email Addresses</span>
                    
                    {/* College Email */}
                    <div className="flex items-center justify-between gap-2 p-2 bg-white rounded border border-[#E5E7EB]">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#0A0A0A] font-sans">College email:</span>
                          {isCollegeLogin && (
                            <span className="px-1.5 py-0.2 bg-[#0A0A0A] text-white text-[10px] font-medium rounded">
                              Used to sign in
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-sans text-[#374151] truncate mt-0.5">
                          {detailEmails.collegeEmail || <span className="text-[#9CA3AF] italic">Not provided</span>}
                        </p>
                      </div>
                      {detailEmails.collegeEmail && (
                        <button
                          type="button"
                          onClick={() => handleCopyText('college', detailEmails.collegeEmail!)}
                          className="p-1.5 rounded hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#0A0A0A] transition-colors shrink-0"
                          title="Copy college email"
                        >
                          {copiedKey === 'college' ? <Check className="w-3.5 h-3.5 text-[#065F46]" /> : <Copy className="w-3.5 h-3.5 text-[#6B7280]" />}
                        </button>
                      )}
                    </div>

                    {/* Personal Email */}
                    <div className="flex items-center justify-between gap-2 p-2 bg-white rounded border border-[#E5E7EB]">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#0A0A0A] font-sans">Personal email:</span>
                          {isPersonalLogin && (
                            <span className="px-1.5 py-0.2 bg-[#0A0A0A] text-white text-[10px] font-medium rounded">
                              Used to sign in
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-sans text-[#374151] truncate mt-0.5">
                          {detailEmails.personalEmail || <span className="text-[#9CA3AF] italic">Not provided</span>}
                        </p>
                      </div>
                      {detailEmails.personalEmail && (
                        <button
                          type="button"
                          onClick={() => handleCopyText('personal', detailEmails.personalEmail!)}
                          className="p-1.5 rounded hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#0A0A0A] transition-colors shrink-0"
                          title="Copy personal email"
                        >
                          {copiedKey === 'personal' ? <Check className="w-3.5 h-3.5 text-[#065F46]" /> : <Copy className="w-3.5 h-3.5 text-[#6B7280]" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Core Details Grid */}
                  <div className="grid grid-cols-2 gap-3 bg-[#FAFAFA] p-3 rounded-lg border border-[#E5E7EB]">
                    <div>
                      <span className="app-label text-[#0A0A0A] font-bold">Account Role</span>
                      <p className="font-semibold text-[#0A0A0A] capitalize font-sans">{selectedUserDetail.role}</p>
                    </div>
                    <div>
                      <span className="app-label text-[#0A0A0A] font-bold">Department</span>
                      <p className="font-bold text-[#0A0A0A] font-sans">{getDepartmentDisplayName(selectedUserDetail.department)}</p>
                    </div>
                    <div>
                      <span className="app-label text-[#0A0A0A] font-bold">Verification Status</span>
                      <p className="font-bold text-[#0A0A0A] font-sans">{selectedUserDetail.verificationStatus || (selectedUserDetail.isVerified ? 'Verified' : 'Pending Verification')}</p>
                    </div>
                    <div>
                      <span className="app-label text-[#0A0A0A] font-bold">Joined Date</span>
                      <p className="font-sans text-[#0A0A0A] font-medium tabular-nums" title={String(detailJoinedRaw)}>
                        {formatDate(detailJoinedRaw)}
                      </p>
                    </div>
                    <div>
                      <span className="app-label text-[#0A0A0A] font-bold">Phone (Admin Only)</span>
                      <p className="font-sans text-[#0A0A0A] font-medium">
                        {selectedUserDetail.phone || <span className="text-[#9CA3AF] italic">Not provided</span>}
                      </p>
                    </div>
                    <div>
                      <span className="app-label text-[#0A0A0A] font-bold">PRN or Employee ID</span>
                      <p className="font-mono text-[#0A0A0A] font-bold">
                        {selectedUserDetail.prn || selectedUserDetail.enrollmentNo || selectedUserDetail.employeeId || <span className="text-[#9CA3AF] font-sans italic font-normal">Not provided</span>}
                      </p>
                    </div>
                  </div>

                  {/* Proof Document Viewer / Status */}
                  <div className="bg-[#FAFAFA] p-3 rounded-lg border border-[#E5E7EB] space-y-2">
                    <span className="app-label text-[#0A0A0A] font-bold">Proof Document Status</span>
                    {docUrl ? (
                      <div className="flex items-center justify-between gap-2 p-2 bg-white border border-[#E5E7EB] rounded-lg">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-[#0A0A0A] shrink-0" />
                          <span className="font-medium text-[#0A0A0A] truncate">{docName}</span>
                          <span className="text-[10px] text-[#065F46] font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Signed Link Ready
                          </span>
                        </div>
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-xs bg-[#0A0A0A] text-white rounded font-medium hover:bg-[#262626] transition-colors inline-flex items-center gap-1 shrink-0"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-[#6B7280] italic text-xs">
                        No proof document submitted for this account.
                      </p>
                    )}
                  </div>

                  {'company' in selectedUserDetail && selectedUserDetail.company && (
                    <div>
                      <span className="app-label text-[#0A0A0A] font-bold">Current Employer & Title</span>
                      <p className="font-bold text-[#0A0A0A] font-sans">{selectedUserDetail.designation || 'Alumni'} at {selectedUserDetail.company}</p>
                    </div>
                  )}

                  <div>
                    <span className="app-label text-[#0A0A0A] font-bold">Bio & Statement</span>
                    <p className="text-[#374151] font-medium font-sans">{selectedUserDetail.bio || 'No custom bio set.'}</p>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-[#E5E7EB]">
                  <Button variant="primary" size="md" onClick={() => setSelectedUserDetail(null)}>
                    Close Detail View
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* MODAL 2: EDIT USER CREDENTIALS & ROLE */}
        {roleMutateUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 max-w-md w-full space-y-4 font-sans text-xs">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <h3 className="font-bold text-sm text-[#0A0A0A] flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#0A0A0A]" />
                  Edit User Credentials & Role
                </h3>
                <button onClick={() => setRoleMutateUser(null)} className="text-[#6B7280] hover:text-[#0A0A0A] font-bold">
                  ✕
                </button>
              </div>

              <p className="text-[#374151] font-medium leading-relaxed">
                Updating account details for <strong>{roleMutateUser.name}</strong>. Modifications are logged to the <strong>Audit Log Engine</strong>.
              </p>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="app-label text-[#0A0A0A] font-bold">Primary Institutional / Login Email</label>
                    <span className="text-[10px] text-[#6B7280] font-medium bg-[#F3F4F6] px-1.5 py-0.5 rounded border border-[#E5E7EB]">
                      Supabase Auth Managed
                    </span>
                  </div>
                  <input
                    type="email"
                    value={editEmail}
                    readOnly
                    disabled
                    className="app-input w-full font-medium font-sans border-[#E5E7EB] rounded-lg bg-[#F3F4F6] text-[#6B7280] cursor-not-allowed"
                  />
                  <p className="text-[10px] text-[#6B7280] mt-1">
                    Primary login identity is bound to institutional Supabase Auth. Direct table edits are restricted to avoid account lockout.
                  </p>
                </div>

                <div>
                  <label className="app-label text-[#0A0A0A] font-bold">
                    Personal / Recovery Email
                  </label>
                  <input
                    type="email"
                    value={editPersonalEmail}
                    onChange={e => setEditPersonalEmail(e.target.value)}
                    placeholder="e.g. personal.name@gmail.com"
                    className="app-input w-full font-medium font-sans border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                  <p className="text-[10px] text-[#6B7280] mt-1">
                    Secondary recovery and post-graduation contact email.
                  </p>
                </div>

                <div>
                  <label className="app-label text-[#0A0A0A] font-bold">Platform Privileges & Role</label>
                  <select
                    value={newSelectedRole}
                    onChange={e => setNewSelectedRole(e.target.value as UserRole)}
                    className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  >
                    <option value="student">Student</option>
                    <option value="alumni">Alumni</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <Button variant="secondary" size="md" onClick={() => setRoleMutateUser(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    if (roleMutateUser.role !== newSelectedRole) {
                      mutateUserRole(roleMutateUser.id, newSelectedRole);
                    }
                    const updates: Record<string, any> = {};
                    if (editPersonalEmail.trim()) {
                      updates.personalEmail = editPersonalEmail.trim();
                      updates.loginRecoveryNeeded = false;
                    }
                    updateUserProfile(roleMutateUser.id, updates);
                    showToast(`Updated credentials & role for ${roleMutateUser.name}.`);
                    setRoleMutateUser(null);
                  }}
                >
                  Save Account Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: CONFIRM DELETE USER */}
        {deleteUserCandidate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 max-w-md w-full space-y-4 font-sans text-xs">
              <div className="flex items-center gap-3 border-b border-[#E5E7EB] pb-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-[#DC2626] flex items-center justify-center font-bold">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0A0A0A]">Delete User Record</h3>
                  <p className="text-[11px] text-[#6B7280]">Permanently purge from active platform roster</p>
                </div>
              </div>

              <div className="p-3 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl space-y-1">
                <div className="font-bold text-[#0A0A0A]">{deleteUserCandidate.name}</div>
                <div className="text-[#6B7280] font-mono text-[11px]">{deleteUserCandidate.email}</div>
                <div className="text-xs text-[#6B7280] font-medium capitalize">{deleteUserCandidate.role || deleteUserCandidate.userCategory} · {deleteUserCandidate.department}</div>
              </div>

              <p className="text-[#4B5563] text-xs leading-relaxed">
                Are you sure you want to delete this account? It will be removed from your institutional roster directory.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <Button variant="secondary" size="sm" onClick={() => setDeleteUserCandidate(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-[#DC2626] hover:bg-[#B91C1C] text-white border-transparent"
                  onClick={async () => {
                    const name = deleteUserCandidate.name;
                    await deleteUser(deleteUserCandidate.id);
                    setDeleteUserCandidate(null);
                    showToast(`Deleted ${name} from platform roster.`);
                  }}
                >
                  Confirm Delete
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </RoleGate>
  );
};
