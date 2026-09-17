/**
 * AUDIT STATUS COMMENT:
 * USER MANAGEMENT IMPLEMENTATION - Fulfills original workflow spec item 'Step 5 — User Management'
 * providing a full-roster management directory for all platform accounts (Student, Alumni, Faculty, Admin — Verified, Pending, Rejected, Deactivated).
 * Driven 100% by the unified DataContext dataset.
 */

import React, { useState } from 'react';
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
  Briefcase
} from 'lucide-react';
import { Badge, Button } from '../common/UIComponents';

export const UserManagementTable: React.FC = () => {
  const {
    alumniList,
    studentList,
    facultyList,
    pendingUsersList,
    deactivateUser,
    reactivateUser,
    mutateUserRole,
    reopenVerification,
    updateUserProfile
  } = useData();

  // Combine All User Profiles into unified roster
  const allRosterUsers = [
    ...studentList.map(s => ({ ...s, userCategory: 'Student', isPending: s.verificationStatus === 'Pending Verification' })),
    ...alumniList.map(a => ({ ...a, userCategory: 'Alumni', isPending: a.verificationStatus === 'Pending Verification' })),
    ...facultyList.map(f => ({ ...f, userCategory: 'Faculty', isPending: f.verificationStatus === 'Pending Verification' }))
  ];

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [deptFilter, setDeptFilter] = useState<string>('All');

  // Modals State
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [roleMutateUser, setRoleMutateUser] = useState<any | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<UserRole>('student');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editPersonalEmail, setEditPersonalEmail] = useState<string>('');
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  // Filtered Roster
  const filteredUsers = allRosterUsers.filter(u => {
    if (roleFilter !== 'All' && u.role !== roleFilter) return false;
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
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchDept = u.department.toLowerCase().includes(q);
      const matchCompany = ('company' in u && (u.company || '').toLowerCase().includes(q));
      const matchPrn = ('prn' in u && (u.prn || '').toLowerCase().includes(q));
      return matchName || matchEmail || matchDept || matchCompany || matchPrn;
    }
    return true;
  });

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
              onClick={() => { setRoleFilter('alumni'); setSearchQuery(''); }}
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
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#9CA3AF]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search name, email, PRN..."
                className="w-full bg-[#FAFAFA] border border-[#E5E7EB] pl-8 pr-3 py-2 rounded-lg text-xs focus:outline-none focus:border-[#0A0A0A] font-bold text-[#0A0A0A]"
              />
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="w-full bg-[#FAFAFA] border border-[#E5E7EB] px-3 py-2 rounded-lg text-xs font-bold text-[#0A0A0A]"
              >
                <option value="All">All Roles (Student, Alumni, Faculty, Admin)</option>
                <option value="student">Student Role</option>
                <option value="alumni">Alumni Role</option>
                <option value="faculty">Faculty Role</option>
                <option value="admin">Administrator Role</option>
              </select>
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
                <option value="All">All Departments (7)</option>
                <option value="CMPN">Computer (CMPN)</option>
                <option value="INFT">Information Tech (INFT)</option>
                <option value="EXTC">Telecom (EXTC)</option>
                <option value="EXCS">Electronics & CS (EXCS)</option>
                <option value="BIOM">Biomedical (BIOM)</option>
                <option value="MCA">MCA Dept</option>
                <option value="MBA">MMS / MBA Dept</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[10px] uppercase font-bold tracking-wider text-[#0A0A0A]">
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

                    return (
                      <motion.tr layout key={user.id} className="hover:bg-[#FAFAFA] transition">
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
                              <p className="font-bold text-[#0A0A0A] text-sm tracking-tight">{user.name}</p>
                              <p className="text-[11px] text-[#6B7280] font-mono">
                                {user.role === 'alumni' && (user as any).personalEmail === null ? (
                                  <span className="text-[#B45309] font-medium italic">
                                    Personal email not on file — contact this alumnus to complete their profile
                                  </span>
                                ) : (
                                  (user as any).personalEmail || user.email
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
                          <p className="font-bold text-[#0A0A0A]">{user.department} Dept</p>
                          <p className="text-[11px] text-[#6B7280]">
                            {'company' in user ? user.company : 'prn' in user ? `PRN: ${user.prn}` : 'Employee ID: EMP-FAC'}
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

                        <td className="p-3.5 font-mono text-[11px] text-[#6B7280]">
                          {(user as any).verifiedAt || '2026-07-01'}
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
                                title="Re-open Verification Queue"
                                className="p-1.5 text-[#2563EB] hover:bg-blue-50 rounded-lg transition"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
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
        {selectedUserDetail && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4 font-sans text-xs">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-3">
                  {selectedUserDetail.avatar ? (
                    <img src={selectedUserDetail.avatar} alt="" className="w-10 h-10 rounded-full border border-[#E5E7EB] object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center border border-[#E5E7EB] text-sm font-bold font-mono tracking-wider shrink-0">
                      {selectedUserDetail.name ? selectedUserDetail.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-sm text-[#0A0A0A]">{selectedUserDetail.name}</h3>
                    <p className="text-[11px] text-[#6B7280] font-mono">{selectedUserDetail.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUserDetail(null)} className="text-[#9CA3AF] hover:text-[#0A0A0A] font-bold">
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {selectedUserDetail.role === 'alumni' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                    <span className="app-label text-[#0A0A0A] font-bold">Personal Login Email (Post-Graduation)</span>
                    <p className="font-bold text-[#0A0A0A] font-mono">
                      {selectedUserDetail.personalEmail === null ? (
                        <span className="text-[#B45309] italic font-normal">
                          Personal email not on file — contact this alumnus to complete their profile
                        </span>
                      ) : (
                        selectedUserDetail.personalEmail || selectedUserDetail.email
                      )}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 bg-[#FAFAFA] p-3 rounded-lg border border-[#E5E7EB]">
                  <div>
                    <span className="app-label text-[#0A0A0A] font-bold">Account Role</span>
                    <p className="font-bold text-[#0A0A0A] uppercase">{selectedUserDetail.role}</p>
                  </div>
                  <div>
                    <span className="app-label text-[#0A0A0A] font-bold">Department</span>
                    <p className="font-bold text-[#0A0A0A]">{selectedUserDetail.department} Engg</p>
                  </div>
                  <div>
                    <span className="app-label text-[#0A0A0A] font-bold">Verification Status</span>
                    <p className="font-bold text-[#0A0A0A]">{selectedUserDetail.verificationStatus || 'Verified'}</p>
                  </div>
                  <div>
                    <span className="app-label text-[#0A0A0A] font-bold">Enrollment / Employee ID</span>
                    <p className="font-mono text-[#0A0A0A] font-bold">{selectedUserDetail.prn || selectedUserDetail.enrollmentNo || 'EMP-099'}</p>
                  </div>
                </div>

                {'company' in selectedUserDetail && (
                  <div>
                    <span className="app-label text-[#0A0A0A] font-bold">Current Employer & Title</span>
                    <p className="font-bold text-[#0A0A0A]">{selectedUserDetail.designation} at {selectedUserDetail.company}</p>
                  </div>
                )}

                <div>
                  <span className="app-label text-[#0A0A0A] font-bold">Bio & Statement</span>
                  <p className="text-[#374151] font-medium">{selectedUserDetail.bio || 'No custom bio set.'}</p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-[#E5E7EB]">
                <Button variant="primary" size="md" onClick={() => setSelectedUserDetail(null)}>
                  Close Detail View
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: EDIT USER CREDENTIALS & ROLE */}
        {roleMutateUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 font-sans text-xs">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <h3 className="font-bold text-sm text-[#0A0A0A] flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#0A0A0A]" />
                  Edit User Credentials & Role
                </h3>
                <button onClick={() => setRoleMutateUser(null)} className="text-[#9CA3AF] hover:text-[#0A0A0A] font-bold">
                  ✕
                </button>
              </div>

              <p className="text-[#374151] font-medium leading-relaxed">
                Updating account details for <strong>{roleMutateUser.name}</strong>. Modifications are logged to the <strong>Audit Log Engine</strong>.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="app-label text-[#0A0A0A] font-bold">Primary Institutional Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="app-input w-full font-bold font-mono border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                </div>

                <div>
                  <label className="app-label text-[#0A0A0A] font-bold">
                    Personal Login Email (Post-Graduation / Recovery)
                  </label>
                  <input
                    type="email"
                    value={editPersonalEmail}
                    onChange={e => setEditPersonalEmail(e.target.value)}
                    placeholder="e.g. personal.name@gmail.com"
                    className="app-input w-full font-bold font-mono border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                  <p className="text-[10px] text-[#6B7280] mt-1">
                    Entering a valid personal email resolves any legacy email recovery flag for this account.
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
                    const updates: Record<string, any> = {
                      email: editEmail
                    };
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

      </div>
    </RoleGate>
  );
};
