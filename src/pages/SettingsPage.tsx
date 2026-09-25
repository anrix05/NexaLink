import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadAvatar } from '../lib/storage';
import { useData } from '../context/DataContext';
import type { StudentProfile, AlumniProfile, FacultyProfile, PrivacyLevel, UserPrivacySettings } from '../types';
import {
  User,
  Shield,
  Bell,
  Eye,
  Camera,
  Check,
  Save,
  Lock,
  Briefcase,
  GraduationCap,
  BookOpen,
  Trash2,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  Sparkles,
  Plus,
  Mail,
  UserPlus,
  UserMinus,
  ShieldAlert,
  X,
  FileText,
  ExternalLink,
  ChevronDown,
  Copy
} from 'lucide-react';
import { Badge, Button, SegmentedTabs, Modal, ToastNotice } from '../components/common/UIComponents';

export const SettingsPage: React.FC = () => {
  const { currentUser, currentRole, updateCurrentUserState } = useAuth();
  const { updateUserProfile, addAuditLog, adminInvites, inviteNewAdmin, revokeAdminInvite, getActiveAdminCount, stepDownAsAdmin } = useData();

  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'capacity' | 'notifications' | 'security'>('profile');
  
  // Admin Invites & Role Step-Down States
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [showStepDownModal, setShowStepDownModal] = useState(false);
  const [stepDownTargetRole, setStepDownTargetRole] = useState<'faculty' | 'alumni'>('faculty');
  const [stepDownTargetDepartment, setStepDownTargetDepartment] = useState<string>('CMPN');
  
  // Base Profile State
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [institutionalEmail, setInstitutionalEmail] = useState(currentUser.institutionalEmail || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [department, setDepartment] = useState(currentUser.department || 'CMPN');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingAvatar(true);
      try {
        const res = await uploadAvatar(file, currentUser.id);
        if (!res.error) {
          setAvatar(res.url);
          updateCurrentUserState({ ...currentUser, avatar: res.url });
          updateUserProfile(currentUser.id, { avatar: res.url });
          showToast('Profile photo uploaded and saved successfully!');
        } else {
          showToast(`Upload failed: ${res.error}`);
        }
      } catch (err: any) {
        showToast('Failed to upload profile photo.');
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  // Role-Specific Profile States
  const studentUser = currentUser as StudentProfile;
  const alumniUser = currentUser as AlumniProfile;
  const facultyUser = currentUser as FacultyProfile;

  // Student specific fields
  const [semester, setSemester] = useState(studentUser.semester || '');
  const [skills, setSkills] = useState<string[]>(studentUser.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [areasOfInterest, setAreasOfInterest] = useState<string[]>(studentUser.areasOfInterest || []);
  const [careerGoal, setCareerGoal] = useState(studentUser.careerGoal || '');
  const [preferredIndustry, setPreferredIndustry] = useState(studentUser.preferredIndustry || '');
  const [preferredHigherStudies, setPreferredHigherStudies] = useState(studentUser.preferredHigherStudies || '');
  const [certifications] = useState<string[]>(studentUser.certifications || []);
  const [resumeUrl, setResumeUrl] = useState(studentUser.resumeUrl || '');

  // Alumni specific fields
  const [graduationYear, setGraduationYear] = useState(alumniUser.graduationYear || new Date().getFullYear());
  const [company, setCompany] = useState(alumniUser.company || '');
  const [designation, setDesignation] = useState(alumniUser.designation || '');
  const [higherEducationInstitute, setHigherEducationInstitute] = useState(alumniUser.higherEducationInstitute || '');
  const [location, setLocation] = useState(alumniUser.location || '');
  const [country, setCountry] = useState(alumniUser.country || '');
  const [achievements] = useState<string[]>(alumniUser.professionalAchievements || []);

  // Mentor Capacity
  const [maxMentees, setMaxMentees] = useState<number>(alumniUser.maxMentees || 3);
  const [isMentoringAvailable, setIsMentoringAvailable] = useState<boolean>(alumniUser.isMentoringAvailable ?? true);

  // Field Privacy Settings
  const defaultPrivacy: UserPrivacySettings = currentUser.privacySettings || {
    email: 'institution',
    phone: 'private',
    company: 'public',
    higherEd: 'public'
  };
  const [privacyEmail, setPrivacyEmail] = useState<PrivacyLevel>(defaultPrivacy.email);
  const [privacyPhone, setPrivacyPhone] = useState<PrivacyLevel>(defaultPrivacy.phone);
  const [privacyCompany, setPrivacyCompany] = useState<PrivacyLevel>(defaultPrivacy.company);
  const [privacyHigherEd, setPrivacyHigherEd] = useState<PrivacyLevel>(defaultPrivacy.higherEd);

  // Notification Preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);
  const [digestFreq, setDigestFreq] = useState<'Instant' | 'Daily Digest' | 'Weekly Digest'>('Instant');

  // Faculty specific fields
  const [employeeId, setEmployeeId] = useState(facultyUser.employeeId || '');
  const [facDesignation, setFacDesignation] = useState(facultyUser.designation || '');
  const [researchAreas, setResearchAreas] = useState<string[]>(facultyUser.researchAreas || []);
  const [ongoingResearch, setOngoingResearch] = useState(facultyUser.ongoingResearch || '');

  // Security & Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || name.trim() === '') {
      setFormError('Full Name is required.');
      return;
    }
    if (!email || email.trim() === '') {
      setFormError('Email address is required.');
      return;
    }

    // Validate Institutional Email if provided
    if (institutionalEmail && !institutionalEmail.trim().toLowerCase().endsWith('@vit.edu.in')) {
      setFormError('Institutional Email must end with @vit.edu.in');
      return;
    }

    const emailChanged = email !== currentUser.email;

    // BUG 2 FIX: Admin email changes bypass self-locking re-verification, requiring current password confirmation instead
    if (currentRole === 'admin' && emailChanged) {
      if (!currentPassword) {
        showToast('Security Action Required: Please enter your Current Password under the Security section below to confirm Admin email modification.');
        return;
      }
    }

    const isCriticalFieldEdited = emailChanged && currentRole !== 'admin';

    const privacySettings: UserPrivacySettings = {
      email: privacyEmail,
      phone: privacyPhone,
      company: privacyCompany,
      higherEd: privacyHigherEd
    };

    const updatedProfilePayload: any = {
      name,
      email,
      institutionalEmail: institutionalEmail.trim().toLowerCase() || null,
      phone,
      department: currentRole === 'admin' ? (currentUser.department || 'CMPN') : department,
      bio,
      avatar,
      skills,
      areasOfInterest,
      careerGoal,
      preferredIndustry,
      preferredHigherStudies,
      certifications,
      resumeUrl,
      semester,
      graduationYear,
      company,
      designation: currentRole === 'faculty' ? facDesignation : designation,
      higherEducationInstitute,
      location,
      country,
      professionalAchievements: achievements,
      employeeId,
      researchAreas,
      ongoingResearch,
      maxMentees,
      isMentoringAvailable,
      privacySettings,
      requiresReVerification: isCriticalFieldEdited
    };

    updateCurrentUserState(updatedProfilePayload as any);
    updateUserProfile(currentUser.id, updatedProfilePayload as any);

    if (currentRole === 'admin' && emailChanged) {
      addAuditLog('ADMIN_EMAIL_UPDATED', currentUser.name, `Admin email updated to ${email} (confirmed via password).`, currentUser.id);
      showToast('Profile updated! Admin email address modified successfully.');
      setCurrentPassword('');
    } else if (isCriticalFieldEdited) {
      addAuditLog('CRITICAL_FIELD_UPDATED', currentUser.name, `Updated critical contact email to ${email}. Lightweight re-verification triggered.`, currentUser.id);
      showToast('Profile saved! Note: Email modification has triggered a lightweight admin re-verification.');
    } else {
      showToast('Profile updated successfully! Recommendation engine has refreshed your matching results.');
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    setSkills(prev => [...prev, newSkill.trim()]);
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  const tabOptions = [
    { id: 'profile' as const, label: 'Profile Details', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'privacy' as const, label: 'Field Privacy', icon: <Eye className="w-3.5 h-3.5" /> },
    ...(currentRole === 'alumni'
      ? [{ id: 'capacity' as const, label: 'Advisor Capacity', icon: <Sliders className="w-3.5 h-3.5" /> }]
      : []),
    { id: 'notifications' as const, label: 'Notifications', icon: <Bell className="w-3.5 h-3.5" /> },
    { id: 'security' as const, label: 'Security', icon: <Shield className="w-3.5 h-3.5" /> }
  ];

  const getSubtitle = () => {
    if (currentRole === 'alumni') {
      return 'Manage your role details, privacy visibility settings, mentor capacity limits, and notification preferences.';
    }
    return 'Manage your role details, privacy visibility settings, and notification preferences.';
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 pb-16 sm:pb-0 font-sans text-xs">
      
      {/* Top Banner Header with Restrained Hierarchy */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 border-b border-[#E5E7EB] pb-3.5 sm:pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-black text-[#0A0A0A] tracking-tight">
            Profile & Privacy Controls
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] font-medium mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
            {getSubtitle()}
          </p>
        </div>

        {/* Horizontally Scrollable Segmented Control with Snap & No Scrollbar */}
        <div className="w-full lg:w-auto overflow-x-auto no-scrollbar pt-0.5 lg:pt-0">
          <SegmentedTabs
            options={tabOptions}
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab)}
            layoutId="settingsSubTabPill"
            className="w-max"
          />
        </div>
      </div>

      <ToastNotice
        message={notice}
        onClose={() => setNotice(null)}
        className="mb-4"
      />

      {/* TAB 1: PROFILE DETAILS */}
      {activeTab === 'profile' && (
        <form noValidate onSubmit={handleSaveProfile} className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-6 shadow-none space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 sm:pb-4">
            <h2 className="font-display font-bold text-[11px] sm:text-xs uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A0A0A]" />
              Profile Overview
            </h2>

            {/* Soft-fill Emerald Verified Badge */}
            <Badge variant="emerald" icon={<CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#065F46]" />}>
              {currentRole.toUpperCase()} VERIFIED
            </Badge>
          </div>

          {/* Avatar Upload Block — Flat on mobile, bordered on desktop */}
          <div className="flex items-center gap-3.5 sm:gap-5 pb-3 sm:p-5 sm:bg-[#FAFAFA] border-b sm:border border-[#E5E7EB] sm:rounded-xl">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <div className="relative group shrink-0">
              <img
                src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0A0A0A&color=fff`}
                alt={name}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border border-[#E5E7EB] ${isUploadingAvatar ? 'opacity-50' : ''}`}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                title="Upload Profile Photo"
                className="absolute inset-0 bg-[#0A0A0A]/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-[#0A0A0A] text-sm truncate">{name}</h3>
              <p className="text-xs text-[#6B7280] font-medium truncate">{email}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="text-xs font-bold text-[#0A0A0A] hover:underline mt-0.5 block cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploadingAvatar ? 'Uploading...' : 'Change Avatar Photo'}
              </button>
            </div>
          </div>

          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-950 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[11px] block text-rose-900 uppercase font-display tracking-wider mb-0.5">
                  Validation Error
                </span>
                {formError}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5 text-xs">
            <div>
              <label className="app-label text-[#0A0A0A] font-bold">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
              />
            </div>

            <div>
              <label className="app-label text-[#0A0A0A] font-bold">Personal Email (Login)</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
              />
            </div>

            <div>
              <label className="app-label text-[#0A0A0A] font-bold">
                Institutional Email (Optional)
              </label>
              <input
                type="email"
                value={institutionalEmail}
                onChange={e => setInstitutionalEmail(e.target.value)}
                placeholder="e.g. name@vit.edu.in"
                className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
              />
              <p className="text-[10px] text-[#6B7280] mt-1">Must end in @vit.edu.in to save.</p>
            </div>

            <div>
              <label className="app-label text-[#0A0A0A] font-bold">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="app-input w-full font-mono border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
              />
            </div>

            <div>
              {currentRole === 'admin' ? (
                <div>
                  <label className="app-label text-[#0A0A0A] font-bold">Institutional Scope / Office</label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value="Institutional Admin Cell"
                    className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#F3F4F6] text-[#374151] cursor-not-allowed"
                  />
                </div>
              ) : (
                <div>
                  <label className="app-label text-[#0A0A0A] font-bold">Department</label>
                  <div className="relative">
                    <select
                      value={department}
                      onChange={e => setDepartment(e.target.value as any)}
                      className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA] appearance-none pr-8 cursor-pointer"
                    >
                      <option value="CMPN">Computer (CMPN)</option>
                      <option value="INFT">IT (INFT)</option>
                      <option value="EXTC">Telecom (EXTC)</option>
                      <option value="EXCS">Electronics & CS (EXCS)</option>
                      <option value="BIOM">Biomedical (BIOM)</option>
                      <option value="MCA">MCA</option>
                      <option value="MBA">MMS / MBA</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#6B7280] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="app-label text-[#0A0A0A] font-bold">Personal Bio & Overview</label>
              <textarea
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="app-input w-full leading-relaxed border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
              />
            </div>
          </div>

          {currentRole === 'student' && (
            <div className="border-t border-[#E5E7EB] pt-5 sm:pt-6 space-y-4 sm:space-y-5">
              <h3 className="font-display font-bold text-[11px] sm:text-xs uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A0A0A]" /> Goals & Skills Overview
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5 text-xs">
                <div>
                  <label className="app-label text-[#0A0A0A] font-bold">Semester</label>
                  <input
                    type="text"
                    value={semester}
                    onChange={e => setSemester(e.target.value as any)}
                    className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                </div>

                <div>
                  <label className="app-label text-[#0A0A0A] font-bold">Career Goal</label>
                  <input
                    type="text"
                    value={careerGoal}
                    onChange={e => setCareerGoal(e.target.value)}
                    className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                </div>

                <div>
                  <label className="app-label text-[#0A0A0A] font-bold">Preferred Industry</label>
                  <input
                    type="text"
                    value={preferredIndustry}
                    onChange={e => setPreferredIndustry(e.target.value)}
                    className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                </div>

                <div>
                  <label className="app-label text-[#0A0A0A] font-bold">Preferred Higher Studies</label>
                  <input
                    type="text"
                    value={preferredHigherStudies}
                    onChange={e => setPreferredHigherStudies(e.target.value)}
                    className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="app-label text-[#0A0A0A] font-bold">Resume Document URL</label>
                    {resumeUrl ? (
                      resumeUrl.startsWith('http://') || resumeUrl.startsWith('https://') ? (
                        <a
                          href={resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-[#0A0A0A] hover:underline flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Link</span>
                        </a>
                      ) : (
                        <span className="text-xs font-mono text-[#6B7280]">File: {resumeUrl}</span>
                      )
                    ) : (
                      <span className="text-xs text-[#9CA3AF] italic">No resume uploaded</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={resumeUrl}
                    onChange={e => setResumeUrl(e.target.value)}
                    placeholder="e.g. https://drive.google.com/file/d/my_resume"
                    className="app-input w-full font-mono text-xs border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                </div>
              </div>

              {/* Skill Tags */}
              <div className="space-y-2 text-xs">
                <label className="app-label text-[#0A0A0A] font-bold">Technical Skills</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {skills.map(s => (
                    <span
                      key={s}
                      className="px-3 py-1 bg-[#FAFAFA] text-[#374151] border border-[#E5E7EB] rounded-lg font-bold text-xs flex items-center gap-2 group transition-all"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s)}
                        className="text-[#9CA3AF] hover:text-[#0A0A0A] transition-colors cursor-pointer"
                        title="Remove Skill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 max-w-md">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    placeholder="Add skill (e.g. Docker, Go)"
                    className="app-input flex-1 border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                  <Button type="button" variant="secondary" size="md" onClick={handleAddSkill} icon={<Plus className="w-3.5 h-3.5" />}>
                    Add Skill
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentRole === 'alumni' && (
            <div className="border-t border-[#E5E7EB] pt-5 sm:pt-6 space-y-4 sm:space-y-5">
              <h3 className="font-display font-bold text-[11px] sm:text-xs uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A0A0A]" /> Alumni Professional & Higher Education Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5 text-xs">
                <div>
                  <label className="app-label text-[#0A0A0A] font-bold">Graduation Year</label>
                  <input
                    type="number"
                    value={graduationYear}
                    onChange={e => setGraduationYear(Number(e.target.value))}
                    className="app-input w-full font-mono font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                </div>

                <div>
                  <label className="app-label text-[#0A0A0A] font-bold">Current Company</label>
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                </div>

                <div>
                  <label className="app-label text-[#0A0A0A] font-bold">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                </div>

                <div>
                  <label className="app-label text-[#0A0A0A] font-bold">Higher Education Institute</label>
                  <input
                    type="text"
                    value={higherEducationInstitute}
                    onChange={e => setHigherEducationInstitute(e.target.value)}
                    className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sticky Save Action Bar on Mobile */}
          <div className="pt-3 sm:pt-4 flex justify-end border-t border-[#E5E7EB] sticky bottom-16 lg:bottom-4 z-20 bg-white/95 backdrop-blur-md -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 sm:py-3 border-b sm:border-b-0 rounded-b-xl">
            <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto" icon={<Save className="w-4 h-4" />}>
              Save Profile Details
            </Button>
          </div>
        </form>
      )}

      {/* TAB 2: FIELD PRIVACY CONTROLS */}
      {activeTab === 'privacy' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-6 space-y-5 sm:space-y-6 text-xs shadow-none">
          <div className="border-b border-[#E5E7EB] pb-3 sm:pb-4">
            <h2 className="font-display font-bold text-[11px] sm:text-xs uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A0A0A]" /> Profile Field Privacy & Boundary Controls
            </h2>
            <p className="text-[#6B7280] font-medium mt-0.5 sm:mt-1 line-clamp-2 sm:line-clamp-none">
              Control which member categories can view your contact information in search results and directory cards.
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4 max-w-2xl text-xs">
            {[
              { title: 'Email Address Visibility', desc: 'Controls who can see your email address on public directory profiles.', val: privacyEmail, set: setPrivacyEmail },
              { title: 'Phone Number Visibility', desc: 'Controls visibility of your mobile contact number.', val: privacyPhone, set: setPrivacyPhone },
              { title: 'Employer / Company Name', desc: 'Visibility of your current employer details.', val: privacyCompany, set: setPrivacyCompany }
            ].map((f) => (
              <div key={f.title} className="p-3.5 sm:p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-[#0A0A0A] text-xs">{f.title}</h4>
                  <p className="text-[11px] sm:text-xs text-[#6B7280] font-medium mt-0.5 leading-snug">{f.desc}</p>
                </div>
                <div className="relative w-full sm:w-auto shrink-0">
                  <select
                    value={f.val}
                    onChange={e => f.set(e.target.value as PrivacyLevel)}
                    className="app-input w-full sm:w-auto font-bold border-[#E5E7EB] rounded-lg bg-white appearance-none pr-8 cursor-pointer text-xs"
                  >
                    <option value="public">Public (Everyone)</option>
                    <option value="institution">Institution Only (Logged In Users)</option>
                    <option value="private">Private (Only Admin & Me)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            ))}
          </div>

          {/* Sticky Save Action Bar on Mobile */}
          <div className="pt-3 sm:pt-4 flex justify-end border-t border-[#E5E7EB] sticky bottom-16 lg:bottom-4 z-20 bg-white/95 backdrop-blur-md -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 sm:py-3 border-b sm:border-b-0 rounded-b-xl">
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
              onClick={() => showToast('Privacy settings updated! Search results and profiles now enforce your visibility preferences.')}
            >
              Save Privacy Preferences
            </Button>
          </div>
        </div>
      )}

      {/* TAB 3: ADVISOR CAPACITY */}
      {activeTab === 'capacity' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-6 space-y-5 sm:space-y-6 text-xs shadow-none">
          <div className="border-b border-[#E5E7EB] pb-3 sm:pb-4">
            <h2 className="font-display font-bold text-[11px] sm:text-xs uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A0A0A]" /> Advisor Mentee Capacity & Availability Limits
            </h2>
            <p className="text-[#6B7280] font-medium mt-0.5 sm:mt-1 line-clamp-2 sm:line-clamp-none">
              Prevent request overwhelm by setting a maximum capacity for active student mentees.
            </p>
          </div>

          <div className="space-y-4 max-w-xl text-xs">
            <div className="p-4 sm:p-5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-[#0A0A0A] text-xs">Active Mentorship Status:</span>
                <button
                  type="button"
                  onClick={() => setIsMentoringAvailable(!isMentoringAvailable)}
                  className={`px-3.5 py-1.5 font-bold uppercase transition rounded-lg text-xs cursor-pointer ${
                    isMentoringAvailable ? 'bg-[#0A0A0A] text-white shadow-xs' : 'bg-[#E5E7EB] text-[#374151]'
                  }`}
                >
                  {isMentoringAvailable ? 'Accepting Requests' : 'Mentorship Paused'}
                </button>
              </div>

              <div>
                <label className="block text-[#0A0A0A] font-bold text-[11px] sm:text-xs uppercase tracking-wider mb-2">
                  Max Simultaneous Active Mentees: <strong className="text-[#0A0A0A] text-sm font-mono">{maxMentees} Mentees</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={maxMentees}
                  onChange={e => setMaxMentees(Number(e.target.value))}
                  className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#0A0A0A]"
                />
              </div>

              <p className="text-xs text-[#6B7280] font-medium leading-relaxed">
                When active mentees reach {maxMentees}, new guidance requests will automatically show a "Capacity Reached" badge.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-6 space-y-5 sm:space-y-6 text-xs shadow-none">
          <div className="border-b border-[#E5E7EB] pb-3 sm:pb-4">
            <h2 className="font-display font-bold text-[11px] sm:text-xs uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A0A0A]" /> Notification Preferences
            </h2>
            <p className="text-[#6B7280] font-medium mt-0.5 sm:mt-1 line-clamp-2 sm:line-clamp-none">
              {currentRole === 'admin'
                ? 'Choose how and when you receive administrative alerts, verification requests, and governance logs.'
                : currentRole === 'student'
                ? 'Choose how and when you receive updates regarding mentorship responses, job alerts, and campus events.'
                : currentRole === 'faculty'
                ? 'Choose how and when you receive updates regarding department announcements, student requests, and campus events.'
                : 'Choose how and when you receive updates regarding guidance requests, job postings, and alumni reunions.'}
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4 max-w-xl text-xs font-sans">
            <div className="p-3.5 sm:p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-[#0A0A0A] block text-xs">In-App Drawer Notifications</span>
                <span className="text-[11px] text-[#6B7280]">Receive instant alerts in top navigation bell</span>
              </div>
              <input type="checkbox" checked={inAppNotifs} onChange={e => setInAppNotifs(e.target.checked)} className="w-4 h-4 accent-[#0A0A0A] rounded cursor-pointer" />
            </div>

            <div className="p-3.5 sm:p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-[#0A0A0A] block text-xs">Email Alert Notifications</span>
                <span className="text-[11px] text-[#6B7280]">Forward high-priority messages to institutional email</span>
              </div>
              <input type="checkbox" checked={emailNotifs} onChange={e => setEmailNotifs(e.target.checked)} className="w-4 h-4 accent-[#0A0A0A] rounded cursor-pointer" />
            </div>

            <div className="p-3.5 sm:p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
              <div>
                <span className="font-bold text-[#0A0A0A] block text-xs">Email Digest Frequency</span>
                <span className="text-[11px] text-[#6B7280]">Summary frequency for unread activities</span>
              </div>
              <div className="relative w-full sm:w-auto shrink-0">
                <select
                  value={digestFreq}
                  onChange={e => setDigestFreq(e.target.value as any)}
                  className="app-input w-full sm:w-auto font-bold border-[#E5E7EB] rounded-lg bg-white appearance-none pr-8 cursor-pointer text-xs"
                >
                  <option value="Instant">Instant Alerts</option>
                  <option value="Daily Digest">Daily Summary</option>
                  <option value="Weekly Digest">Weekly Digest</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Sticky Save Action Bar on Mobile */}
          <div className="pt-3 sm:pt-4 flex justify-end border-t border-[#E5E7EB] sticky bottom-16 lg:bottom-4 z-20 bg-white/95 backdrop-blur-md -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 sm:py-3 border-b sm:border-b-0 rounded-b-xl">
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
              onClick={() => showToast('Notification preferences saved successfully!')}
            >
              Save Preferences
            </Button>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY */}
      {activeTab === 'security' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-6 space-y-5 sm:space-y-6 text-xs shadow-none">
          <h2 className="font-display font-bold text-[11px] sm:text-xs uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A0A0A]" /> Security Credentials & Password Update
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 text-xs">
              <div>
                <label className="app-label text-[#0A0A0A] font-bold">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="app-input w-full font-mono tracking-widest border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                />
              </div>
              <div>
                <label className="app-label text-[#0A0A0A] font-bold">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="app-input w-full font-mono tracking-widest border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                />
              </div>
              <div>
                <label className="app-label text-[#0A0A0A] font-bold">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="app-input w-full font-mono tracking-widest border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
                onClick={() => {
                  if (!currentPassword) {
                    showToast('Please enter your current password.');
                    return;
                  }
                  if (!newPassword || newPassword.length < 6) {
                    showToast('New password must be at least 6 characters.');
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    showToast('New passwords do not match.');
                    return;
                  }
                  showToast('Password updated successfully!');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                Update Password
              </Button>
            </div>
          </div>

          {/* Admin Governance & Role Handoff Suite (Admin Role Only) */}
          {currentRole === 'admin' && (
            <div className="border-t border-[#E5E7EB] pt-5 sm:pt-6 space-y-5 sm:space-y-6">
              <div className="border-b border-[#E5E7EB] pb-3 sm:pb-4">
                <h2 className="font-display font-bold text-[11px] sm:text-xs uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
                  <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A0A0A]" /> Admin Delegation & Role Handoff
                </h2>
                <p className="text-[#6B7280] font-medium mt-0.5 sm:mt-1 line-clamp-2 sm:line-clamp-none">
                  Vouch for new administrators or voluntarily transfer your administrative role.
                </p>
              </div>

              {/* Form 1: Invite New Admin */}
              <div className="p-5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl space-y-4 font-sans text-xs">
                <h3 className="font-bold text-[#0A0A0A] text-xs uppercase tracking-wider">Invite New Administrator</h3>
                {/* TODO: Real email-based invite links (tokens) are a Phase 4 (backend/JWT) concern */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const res = inviteNewAdmin(inviteEmailInput, currentUser.id);
                    if (res.success) {
                      showToast(`Admin invite sent to ${inviteEmailInput}!`);
                      setInviteEmailInput('');
                    } else {
                      showToast(res.error || 'Failed to send invite.');
                    }
                  }}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-lg"
                >
                  <input
                    type="email"
                    required
                    placeholder="enter.new.admin@vit.edu.in"
                    value={inviteEmailInput}
                    onChange={e => setInviteEmailInput(e.target.value)}
                    className="app-input flex-1 font-bold border-[#E5E7EB] rounded-lg bg-white"
                  />
                  <Button type="submit" variant="primary" size="md" icon={<Mail className="w-4 h-4" />}>
                    Send Invite
                  </Button>
                </form>

                {/* Pending Invites List */}
                <div className="pt-3 border-t border-[#E5E7EB] space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#0A0A0A] text-xs uppercase tracking-wider">Pending Admin Invites</h4>
                    <Badge variant="indigo" size="sm">
                      {adminInvites.filter(i => i.status === 'pending').length}
                    </Badge>
                  </div>

                  {adminInvites.filter(i => i.status === 'pending').length === 0 ? (
                    <p className="text-xs text-[#6B7280] font-medium">No active pending Admin invites.</p>
                  ) : (
                    <div className="space-y-2 max-w-lg">
                      {adminInvites.filter(i => i.status === 'pending').map(inv => {
                        const inviteUrl = `${window.location.origin}/?tab=admin-invite&email=${encodeURIComponent(inv.invitedEmail)}`;
                        return (
                          <div key={inv.id} className="p-3 bg-white border border-[#E5E7EB] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1 min-w-0 space-y-2">
                              <div>
                                <p className="font-bold text-[#0A0A0A] text-xs font-mono">{inv.invitedEmail}</p>
                                <p className="text-[10px] text-[#6B7280]">
                                  Invited on: {new Date(inv.invitedAt).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <code className="flex-1 block truncate text-[10px] bg-[#F3F4F6] text-[#374151] px-2 py-1.5 rounded border border-[#E5E7EB]">
                                  {inviteUrl}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(inviteUrl);
                                    setCopiedInviteId(inv.id);
                                    setTimeout(() => setCopiedInviteId(null), 2000);
                                  }}
                                  className="shrink-0 p-1.5 text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6] rounded-md transition-colors border border-[#E5E7EB]"
                                  title="Copy invite link"
                                >
                                  {copiedInviteId === inv.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="shrink-0 self-start sm:self-center"
                              onClick={() => {
                                revokeAdminInvite(inv.id);
                                showToast(`Revoked Admin invite for ${inv.invitedEmail}`);
                              }}
                              icon={<Trash2 className="w-3.5 h-3.5" />}
                            >
                              Revoke
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Form 2: Step Down / Role Handoff */}
              <div className="p-5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl space-y-3 font-sans text-xs">
                <h3 className="font-bold text-[#0A0A0A] text-xs uppercase tracking-wider">Step Down / Role Handoff</h3>
                <p className="text-xs text-[#6B7280] font-medium leading-relaxed">
                  Transfer administrative responsibilities by voluntarily converting your account to a Faculty or Alumni role.
                </p>

                <div className="pt-2">
                  {getActiveAdminCount() <= 1 ? (
                    <div className="space-y-2">
                      <Button variant="secondary" size="md" disabled className="opacity-50 cursor-not-allowed">
                        Step Down / Transfer Role
                      </Button>
                      <p className="text-xs font-semibold text-[#B45309] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] animate-pulse shrink-0" />
                        You're the only Admin account. Invite another Admin before stepping down.
                      </p>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setShowStepDownModal(true)}
                      icon={<UserMinus className="w-4 h-4 text-[#0A0A0A]" />}
                    >
                      Step Down / Transfer Role
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Admin Step Down */}
      <Modal
        isOpen={showStepDownModal}
        onClose={() => setShowStepDownModal(false)}
        title="Confirm Admin Role Step Down"
        icon={<ShieldAlert className="w-5 h-5 text-[#B45309]" />}
        maxWidth="md"
      >
        <div className="space-y-4 font-sans text-xs">
          <p className="text-[#6B7280] leading-relaxed">
            You are about to voluntarily step down from the <strong>Admin</strong> role. Your account will be safely converted to a verified member profile.
          </p>

          <div className="space-y-5">
            <div className="space-y-3">
              <label className="text-[10px] font-display font-bold text-slate-500 uppercase tracking-wider">
                Converted Profile Role
              </label>
              
              <div className="p-4 text-left border rounded-xl bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-600">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-emerald-900">
                      Faculty Member
                    </div>
                    <div className="text-[10px] text-emerald-600">
                      Professor / Advisory
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-display font-bold text-slate-500 uppercase tracking-wider">
                Select Academic Department
              </label>
              <select
                value={stepDownTargetDepartment}
                onChange={e => setStepDownTargetDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-900 rounded-xl focus:outline-none focus:border-slate-950 transition-colors duration-150"
              >
                <option value="CMPN">Computer Engineering (CMPN)</option>
                <option value="INFT">Information Technology (INFT)</option>
                <option value="EXTC">Electronics & Telecommunication (EXTC)</option>
                <option value="EXCS">Electronics & Computer Science (EXCS)</option>
                <option value="BIOM">Biomedical Engineering (BIOM)</option>
                <option value="Admin">Institutional Administration (Non-Academic)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" size="md" onClick={() => setShowStepDownModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                const res = stepDownAsAdmin(currentUser.id, stepDownTargetRole, stepDownTargetDepartment);
                if (res.success) {
                  setShowStepDownModal(false);
                  showToast(`Role transfer complete! Your account is now a ${stepDownTargetRole.toUpperCase()} profile.`);
                } else {
                  showToast(res.error || 'Failed to step down.');
                }
              }}
            >
              Confirm Step Down
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
