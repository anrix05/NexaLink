import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { profileService, type SaveProfilePatch } from '../services/profileService';
import { supabase } from '../lib/supabase';
import { validateAvatarFile, uploadAndSaveAvatar, removeAvatar } from '../lib/avatarUpload';
import { isDefaultAvatar } from '../lib/avatar';
import type { StudentProfile, AlumniProfile, FacultyProfile, PrivacyLevel, UserPrivacySettings, UserRole } from '../types';
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
import { Badge, Button, SegmentedTabs, Modal, ToastNotice, TextField, PasswordField, Toggle, SelectField, TextArea } from '../components/common/UIComponents';
import { Avatar } from '../components/ui';
import { validateEmailByRole, getEmailHintByRole } from '../utils/validators';
import { getBuildInfo } from '../utils/buildInfo';
import { getUserEmails } from '../utils/userEmails';

const AvatarCropModal = React.lazy(() => import('../components/profile/AvatarCropModal'));
const OutreachVisibilityCard = React.lazy(() => import('../features/outreach/OutreachVisibilityCard').then(m => ({ default: m.OutreachVisibilityCard })));

export const SettingsPage: React.FC = () => {
  const { currentUser, currentRole, updateCurrentUserState } = useAuth();
  const { updateUserProfile, addAuditLog, adminInvites, inviteNewAdmin, revokeAdminInvite, getActiveAdminCount, stepDownAsAdmin } = useData();
  const buildInfo = React.useMemo(() => getBuildInfo(), []);

  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'capacity' | 'notifications' | 'security'>('profile');
  
  // Admin Invites & Role Step-Down States
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [newlyCreatedLinks, setNewlyCreatedLinks] = useState<Record<string, string>>({});
  const [isInvitingAdmin, setIsInvitingAdmin] = useState(false);
  const [isRegeneratingId, setIsRegeneratingId] = useState<string | null>(null);
  const [showStepDownModal, setShowStepDownModal] = useState(false);
  const [stepDownTargetRole, setStepDownTargetRole] = useState<'faculty' | 'alumni'>('faculty');
  const [stepDownTargetDepartment, setStepDownTargetDepartment] = useState<string>('CMPN');
  
  // Base Profile State
  const initialEmails = React.useMemo(() => getUserEmails(currentUser), [currentUser]);
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(
    currentRole === 'alumni'
      ? (initialEmails.personalEmail || currentUser.personalEmail || currentUser.email || '')
      : (initialEmails.collegeEmail || currentUser.institutionalEmail || currentUser.email || '')
  );
  const [personalEmail, setPersonalEmail] = useState(
    currentRole === 'alumni'
      ? (initialEmails.collegeEmail || currentUser.institutionalEmail || '')
      : (initialEmails.personalEmail || currentUser.personalEmail || '')
  );
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [department, setDepartment] = useState(currentUser.department || 'CMPN');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [avatarTimestamp, setAvatarTimestamp] = useState<number>(Date.now());
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarValidationError, setAvatarValidationError] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [showRemoveAvatarModal, setShowRemoveAvatarModal] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarTriggerRef = useRef<HTMLButtonElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarValidationError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = await validateAvatarFile(file);
      if (!validation.valid) {
        setAvatarValidationError(validation.error || 'Invalid image file.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setCropImageSrc(objectUrl);
      setIsCropModalOpen(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCloseCropModal = () => {
    setIsCropModalOpen(false);
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    }
  };

  const handleSaveCroppedAvatar = async (croppedBlob: Blob) => {
    setIsUploadingAvatar(true);
    try {
      const res = await uploadAndSaveAvatar(croppedBlob, currentUser.id, currentRole as UserRole, avatar);
      if (res.success && res.avatarUrl) {
        setAvatar(res.avatarUrl);
        setAvatarTimestamp(Date.now());
        updateCurrentUserState({ ...currentUser, avatar: res.avatarUrl });
        updateUserProfile(currentUser.id, { avatar: res.avatarUrl });
        showToast('Profile photo updated successfully!');
      } else {
        throw new Error(res.error || 'Failed to save avatar.');
      }
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleConfirmRemoveAvatar = async () => {
    setIsRemovingAvatar(true);
    try {
      const res = await removeAvatar(currentUser.id, currentRole as UserRole, avatar);
      if (res.success) {
        setAvatar('');
        updateCurrentUserState({ ...currentUser, avatar: null });
        updateUserProfile(currentUser.id, { avatar: null });
        showToast('Profile photo removed.');
        setShowRemoveAvatarModal(false);
      } else {
        showToast(res.error || 'Failed to remove photo.');
      }
    } catch {
      showToast('Error removing profile photo.');
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  // Role-Specific Profile States
  const studentUser = currentUser as StudentProfile;
  const alumniUser = currentUser as AlumniProfile;
  const facultyUser = currentUser as FacultyProfile;

  // Student specific fields
  const [semester, setSemester] = useState(studentUser.semester || 'Semester 1');
  const [skills, setSkills] = useState<string[]>(studentUser.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [newAreaOfInterest, setNewAreaOfInterest] = useState('');
  const [newResearchArea, setNewResearchArea] = useState('');
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
  const [location, setLocation] = useState(alumniUser.location || 'Mumbai, India');
  const [country, setCountry] = useState(alumniUser.country || 'India');
  const [achievements] = useState<string[]>(alumniUser.professionalAchievements || []);

  // Mentor Capacity
  const [maxMentees, setMaxMentees] = useState<number>(alumniUser.maxMentees || 3);
  const [isMentoringAvailable, setIsMentoringAvailable] = useState<boolean>(alumniUser.isMentoringAvailable ?? true);

  // Field Privacy Settings
  const defaultPrivacy: UserPrivacySettings = currentUser.privacySettings || {
    email: 'public',
    phone: 'private',
    company: 'public',
    higherEd: 'public'
  };
  const [privacyEmail, setPrivacyEmail] = useState<PrivacyLevel>(defaultPrivacy.email);
  const [privacyPhone, setPrivacyPhone] = useState<PrivacyLevel>(defaultPrivacy.phone);
  const [privacyCompany, setPrivacyCompany] = useState<PrivacyLevel>(defaultPrivacy.company);
  const [privacyHigherEd, setPrivacyHigherEd] = useState<PrivacyLevel>(defaultPrivacy.higherEd);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);

  // Real Notification Category Preferences (in-app only)
  const [notifOpportunities, setNotifOpportunities] = useState(true);
  const [notifEvents, setNotifEvents] = useState(true);
  const [notifAnnouncements, setNotifAnnouncements] = useState(true);
  const [notifMentorship, setNotifMentorship] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [isSavingNotifs, setIsSavingNotifs] = useState(false);

  // Faculty specific fields
  const [employeeId, setEmployeeId] = useState(facultyUser.employeeId || '');
  const [facDesignation, setFacDesignation] = useState(facultyUser.designation || '');
  const [researchAreas, setResearchAreas] = useState<string[]>(facultyUser.researchAreas || []);
  const [ongoingResearch, setOngoingResearch] = useState(facultyUser.ongoingResearch || '');

  // Security & Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Status & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Full synchronization when currentUser updates or loads
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPersonalEmail(currentUser.personalEmail || '');
      setPhone(currentUser.phone || '');
      setDepartment(currentUser.department || 'CMPN');
      setBio(currentUser.bio || '');
      setAvatar(currentUser.avatar || '');

      if (currentRole === 'student') {
        const s = currentUser as StudentProfile;
        setSemester(s.semester || 'Semester 1');
        setSkills(s.skills || []);
        setAreasOfInterest(s.areasOfInterest || []);
        setCareerGoal(s.careerGoal || '');
        setPreferredIndustry(s.preferredIndustry || '');
        setPreferredHigherStudies(s.preferredHigherStudies || '');
        setResumeUrl(s.resumeUrl || '');
      } else if (currentRole === 'alumni') {
        const a = currentUser as AlumniProfile;
        setGraduationYear(a.graduationYear || new Date().getFullYear());
        setCompany(a.company || '');
        setDesignation(a.designation || '');
        setHigherEducationInstitute(a.higherEducationInstitute || '');
        setLocation(a.location || 'Mumbai, India');
        setCountry(a.country || 'India');
        setSkills(a.skills || []);
        setMaxMentees(a.maxMentees || 3);
        setIsMentoringAvailable(a.isMentoringAvailable ?? true);
      } else if (currentRole === 'faculty' || currentRole === 'teacher') {
        const f = currentUser as FacultyProfile;
        setEmployeeId(f.employeeId || '');
        setFacDesignation(f.designation || 'Professor');
        setResearchAreas(f.researchAreas || []);
        setOngoingResearch(f.ongoingResearch || '');
        setSkills(f.skills || []);
      }

      if (currentUser.privacySettings) {
        setPrivacyEmail(currentUser.privacySettings.email || 'public');
        setPrivacyPhone(currentUser.privacySettings.phone || 'private');
        setPrivacyCompany(currentUser.privacySettings.company || 'public');
        setPrivacyHigherEd(currentUser.privacySettings.higherEd || 'public');
      }
    }
  }, [currentUser, currentRole]);

  // Load notification preferences on mount
  useEffect(() => {
    if (currentUser?.id) {
      supabase
        .from('notification_preferences' as any)
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle()
        .then(({ data }: any) => {
          if (data) {
            setNotifOpportunities(!data.mute_opportunities);
            setNotifEvents(!data.mute_events);
            setNotifAnnouncements(!data.mute_announcements);
          }
        });
    }
  }, [currentUser?.id]);

  // Dirty state evaluation
  const isDirty = React.useMemo(() => {
    if (!currentUser) return false;
    if (name.trim() !== (currentUser.name || '').trim()) return true;
    if (personalEmail.trim().toLowerCase() !== (currentUser.personalEmail || '').trim().toLowerCase()) return true;
    if (phone.trim() !== (currentUser.phone || '').trim()) return true;
    if (department !== (currentUser.department || 'CMPN')) return true;
    if (bio.trim() !== (currentUser.bio || '').trim()) return true;

    if (currentRole === 'student') {
      const s = currentUser as StudentProfile;
      if (semester !== (s.semester || 'Semester 1')) return true;
      if (careerGoal.trim() !== (s.careerGoal || '').trim()) return true;
      if (preferredIndustry.trim() !== (s.preferredIndustry || '').trim()) return true;
      if (preferredHigherStudies.trim() !== (s.preferredHigherStudies || '').trim()) return true;
      if (resumeUrl.trim() !== (s.resumeUrl || '').trim()) return true;
      if (JSON.stringify(skills) !== JSON.stringify(s.skills || [])) return true;
      if (JSON.stringify(areasOfInterest) !== JSON.stringify(s.areasOfInterest || [])) return true;
    } else if (currentRole === 'alumni') {
      const a = currentUser as AlumniProfile;
      if (String(Number(graduationYear)) !== String(a.graduationYear || new Date().getFullYear())) return true;
      if (company.trim() !== (a.company || '').trim()) return true;
      if (designation.trim() !== (a.designation || '').trim()) return true;
      if (higherEducationInstitute.trim() !== (a.higherEducationInstitute || '').trim()) return true;
      if (location.trim() !== (a.location || 'Mumbai, India').trim()) return true;
      if (country.trim() !== (a.country || 'India').trim()) return true;
      if (maxMentees !== (a.maxMentees || 3)) return true;
      if (isMentoringAvailable !== (a.isMentoringAvailable ?? true)) return true;
      if (JSON.stringify(skills) !== JSON.stringify(a.skills || [])) return true;
    } else if (currentRole === 'faculty' || currentRole === 'teacher') {
      const f = currentUser as FacultyProfile;
      if (employeeId.trim() !== (f.employeeId || '').trim()) return true;
      if (facDesignation.trim() !== (f.designation || 'Professor').trim()) return true;
      if (ongoingResearch.trim() !== (f.ongoingResearch || '').trim()) return true;
      if (JSON.stringify(researchAreas) !== JSON.stringify(f.researchAreas || [])) return true;
      if (JSON.stringify(skills) !== JSON.stringify(f.skills || [])) return true;
    }
    return false;
  }, [
    currentUser, currentRole, name, personalEmail, phone, department, bio,
    semester, careerGoal, preferredIndustry, preferredHigherStudies, resumeUrl, skills, areasOfInterest,
    graduationYear, company, designation, higherEducationInstitute, location, country, maxMentees, isMentoringAvailable,
    employeeId, facDesignation, ongoingResearch, researchAreas
  ]);

  // Warn on leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaveError(null);

    if (!name || name.trim() === '') {
      setFormError('Full Name is required.');
      return;
    }

    if (personalEmail && personalEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(personalEmail.trim())) {
        setFormError('Please enter a valid email address format.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const patch: SaveProfilePatch = {
        name: name.trim(),
        phone: phone.trim(),
        department: currentRole === 'admin' ? (currentUser.department || 'CMPN') : department,
        bio: bio.trim(),
        avatar,
        personalEmail: personalEmail.trim().toLowerCase(),
        privacySettings: {
          email: privacyEmail,
          phone: privacyPhone,
          company: privacyCompany,
          higherEd: privacyHigherEd
        }
      };

      if (currentRole === 'student') {
        patch.semester = semester;
        patch.skills = skills;
        patch.areasOfInterest = areasOfInterest;
        patch.careerGoal = careerGoal;
        patch.preferredIndustry = preferredIndustry;
        patch.preferredHigherStudies = preferredHigherStudies;
        patch.resumeUrl = resumeUrl;
      } else if (currentRole === 'alumni') {
        patch.company = company;
        patch.designation = designation;
        patch.graduationYear = Number(graduationYear);
        patch.higherEducationInstitute = higherEducationInstitute;
        patch.location = location;
        patch.country = country;
        patch.skills = skills;
        patch.maxMentees = maxMentees;
        patch.isMentoringAvailable = isMentoringAvailable;
      } else if (currentRole === 'faculty' || currentRole === 'teacher') {
        patch.employeeId = employeeId;
        patch.designation = facDesignation;
        patch.researchAreas = researchAreas;
        patch.ongoingResearch = ongoingResearch;
        patch.skills = skills;
      }

      const res = await profileService.saveProfile(currentUser.id, currentRole as UserRole, patch);
      if (!res.success) {
        setSaveError(res.error || 'Failed to save profile changes.');
        showToast(res.error || 'Save failed. Your edits are preserved.');
        return;
      }

      if (res.profile) {
        updateCurrentUserState(res.profile);
      }
      addAuditLog('PROFILE_UPDATED', currentUser.name, `Updated profile attributes and settings.`, currentUser.id);
      showToast('Profile updated and saved to server successfully!');
    } catch (err: any) {
      setSaveError(err.message || 'An unexpected error occurred while saving.');
      showToast('Error saving profile. Your edits are preserved.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    if (!currentUser?.id) return;
    setIsSavingPrivacy(true);
    try {
      const res = await profileService.saveProfile(currentUser.id, currentRole as UserRole, {
        privacySettings: {
          email: privacyEmail,
          phone: privacyPhone,
          company: privacyCompany,
          higherEd: privacyHigherEd
        }
      });
      if (!res.success) {
        showToast(res.error || 'Failed to save privacy settings.');
      } else {
        if (res.profile) {
          updateCurrentUserState(res.profile);
        }
        showToast('Privacy preferences saved! Changes are now enforced.');
      }
    } catch {
      showToast('Failed to save privacy preferences.');
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const handleSaveCapacity = async () => {
    if (!currentUser?.id) return;
    setIsSaving(true);
    try {
      const res = await profileService.saveProfile(currentUser.id, currentRole as UserRole, {
        maxMentees,
        isMentoringAvailable
      });
      if (!res.success) {
        showToast(res.error || 'Failed to save capacity settings.');
      } else {
        if (res.profile) updateCurrentUserState(res.profile);
        showToast('Mentorship capacity saved!');
      }
    } catch {
      showToast('Error saving capacity settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!currentUser?.id) return;
    setIsSavingNotifs(true);
    try {
      const { error } = await supabase.from('notification_preferences' as any).upsert({
        user_id: currentUser.id,
        mute_opportunities: !notifOpportunities,
        mute_events: !notifEvents,
        mute_announcements: !notifAnnouncements,
        updated_at: new Date().toISOString()
      } as any, { onConflict: 'user_id' });

      if (error) {
        showToast(`Failed to save preferences: ${error.message}`);
      } else {
        showToast('Notification category preferences saved successfully!');
      }
    } catch {
      showToast('Failed to save notification preferences.');
    } finally {
      setIsSavingNotifs(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      showToast('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword
      });

      if (authErr) {
        showToast('Incorrect current password. Please check your credentials.');
        setIsUpdatingPassword(false);
        return;
      }

      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateErr) {
        showToast(`Failed to update password: ${updateErr.message}`);
      } else {
        showToast('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      showToast('Network error while updating password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(currentUser.email);
      if (error) {
        showToast(`Reset failed: ${error.message}`);
      } else {
        showToast(`Password reset instructions sent to ${currentUser.email}.`);
      }
    } catch {
      showToast('Failed to send reset code.');
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

  const handleAddAreaOfInterest = () => {
    if (!newAreaOfInterest.trim()) return;
    setAreasOfInterest(prev => [...prev, newAreaOfInterest.trim()]);
    setNewAreaOfInterest('');
  };

  const handleRemoveAreaOfInterest = (item: string) => {
    setAreasOfInterest(prev => prev.filter(a => a !== item));
  };

  const handleAddResearchArea = () => {
    if (!newResearchArea.trim()) return;
    setResearchAreas(prev => [...prev, newResearchArea.trim()]);
    setNewResearchArea('');
  };

  const handleRemoveResearchArea = (item: string) => {
    setResearchAreas(prev => prev.filter(a => a !== item));
  };

  const tabOptions = [
    { id: 'profile' as const, label: 'Profile Details', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'privacy' as const, label: 'Field Privacy', icon: <Eye className="w-3.5 h-3.5" /> },
    ...(currentRole === 'alumni'
      ? [{ id: 'capacity' as const, label: 'Mentorship Capacity', icon: <Sliders className="w-3.5 h-3.5" /> }]
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
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300 pb-16 sm:pb-0 font-sans text-xs">

      {/* Page Header — title row + tab bar on its own full-width row to prevent clipping */}
      <div className="border-b border-[#E5E7EB] space-y-4 pb-0">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-black text-[#0A0A0A] tracking-tight">
            Profile & Privacy Controls
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] font-medium mt-1">
            {getSubtitle()}
          </p>
        </div>

        {/* Tab bar — always its own row, full width, horizontally scrollable */}
        <div className="overflow-x-auto no-scrollbar">
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
            <h2 className="font-bold text-xs sm:text-sm text-[#0A0A0A] flex items-center gap-2">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A0A0A]" />
              Profile overview
            </h2>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Soft-fill Emerald Verified Badge */}
              <Badge variant="emerald" icon={<CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#065F46]" />}>
                Verified {currentRole.toLowerCase()}
              </Badge>
              {isDirty && (
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={<Save className="w-3.5 h-3.5" />}
                  disabled={isSaving}
                  className="hidden sm:inline-flex"
                >
                  {isSaving ? 'Saving...' : 'Save changes'}
                </Button>
              )}
            </div>
          </div>

          {/* Avatar Upload Block — 80px circle with camera hover affordance */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 pb-3 sm:p-5 sm:bg-[#FAFAFA] border-b sm:border border-[#E5E7EB] sm:rounded-xl">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept="image/jpeg,image/png,image/webp" 
              className="hidden" 
            />
            
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <button
                  ref={avatarTriggerRef}
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  aria-label="Change profile photo"
                  className="relative block rounded-full focus:outline-hidden focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2 overflow-hidden cursor-pointer"
                >
                  <Avatar
                    src={avatar}
                    name={name}
                    email={email}
                    size={80}
                    updatedAt={avatarTimestamp}
                    className={`border border-[#E5E7EB] transition-opacity ${isUploadingAvatar ? 'opacity-50' : ''}`}
                  />
                  {/* Camera overlay on hover/focus (150ms fade) */}
                  <div
                    className="absolute inset-0 bg-[#0A0A0A]/45 rounded-full opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 flex flex-col items-center justify-center text-white"
                  >
                    <Camera className="w-5 h-5 drop-shadow-xs" />
                  </div>
                </button>
              </div>

              <div className="min-w-0 flex-1 sm:hidden">
                <h3 className="font-bold text-[#0A0A0A] text-sm truncate">{name}</h3>
                <p className="text-xs text-[#6B7280] font-medium truncate">{email}</p>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="hidden sm:block">
                <h3 className="font-bold text-[#0A0A0A] text-sm truncate">{name}</h3>
                <p className="text-xs text-[#6B7280] font-medium truncate">{email}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="px-3 py-1.5 text-xs font-semibold text-[#0A0A0A] bg-white hover:bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
                >
                  <Camera className="w-3.5 h-3.5 text-[#0A0A0A]" />
                  <span>{isUploadingAvatar ? 'Saving photo...' : 'Change photo'}</span>
                </button>

                {!isDefaultAvatar(avatar) && (
                  <button
                    type="button"
                    onClick={() => setShowRemoveAvatarModal(true)}
                    disabled={isUploadingAvatar}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 min-h-[36px]"
                  >
                    Remove photo
                  </button>
                )}
              </div>

              <p className="text-[11px] text-[#9CA3AF] font-medium">
                JPG, PNG or WebP. Up to 5 MB.
              </p>
            </div>
          </div>

          {/* Inline Validation Error */}
          {avatarValidationError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-950 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-xs block text-rose-900 mb-0.5">
                  Invalid Photo
                </span>
                {avatarValidationError}
              </div>
            </div>
          )}

          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-950 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-xs block text-rose-900 mb-0.5">
                  Validation Error
                </span>
                {formError}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5 text-xs">
            <div>
              <label className="app-label text-[#0A0A0A]">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="app-input w-full font-medium border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
              />
            </div>

            <div>
              <label className="app-label text-[#0A0A0A]">
                {currentRole === 'alumni' ? 'Personal Email (used to sign in)' : 'College Email (used to sign in)'}
              </label>
              <input
                type="email"
                required
                value={email}
                readOnly
                disabled
                className="app-input w-full font-medium border-[#E5E7EB] rounded-lg bg-[#F3F4F6] cursor-not-allowed text-[#6B7280]"
              />
              <p className="text-[10px] text-[#6B7280] mt-1">
                Your primary institutional authentication identifier (cannot be edited here).
              </p>
            </div>

            <div>
              <label className="app-label text-[#0A0A0A]">
                {currentRole === 'alumni' ? 'Institutional Email (Archive record)' : 'Personal / Recovery Email'}
              </label>
              <input
                type="email"
                value={personalEmail}
                onChange={e => {
                  setPersonalEmail(e.target.value);
                  setSaveError(null);
                }}
                placeholder={currentRole === 'alumni' ? 'e.g. alumni@alumni.vit.edu.in' : 'e.g. name@gmail.com'}
                className="app-input w-full font-medium border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
              />
              <p className="text-[10px] text-[#6B7280] mt-1">
                Used for password resets, important account notifications, and communication recovery.
              </p>
            </div>

            <div>
              <label className="app-label text-[#0A0A0A]">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="app-input w-full font-medium border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
              />
            </div>

            <div>
              {currentRole === 'admin' ? (
                <div>
                  <label className="app-label text-[#0A0A0A]">Institutional Scope / Office</label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value="Institutional Admin Cell"
                    className="app-input w-full font-medium border-[#E5E7EB] rounded-lg bg-[#F3F4F6] text-[#374151] cursor-not-allowed"
                  />
                </div>
              ) : (
                <div>
                  <label className="app-label text-[#0A0A0A]">Department</label>
                  <div className="relative">
                    <select
                      value={department}
                      onChange={e => setDepartment(e.target.value as any)}
                      className="app-input w-full font-medium border-[#E5E7EB] rounded-lg bg-[#FAFAFA] appearance-none pr-8 cursor-pointer"
                    >
                      <option value="CMPN">Computer (CMPN)</option>
                      <option value="INFT">IT (INFT)</option>
                      <option value="EXCS">Electronics & CS (EXCS)</option>
                      <option value="EXTC">Telecom (EXTC)</option>
                      <option value="BIOM">Biomedical (BIOM)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#6B7280] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="app-label text-[#0A0A0A] font-bold">Personal Bio & Overview</label>
              <textarea
                rows={4}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell us about yourself — your background, interests, and what drives you."
                className="app-input w-full leading-relaxed border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
              />
            </div>
          </div>

          {currentRole === 'student' && (
            <div className="border-t border-[#E5E7EB] pt-5 sm:pt-6 space-y-4 sm:space-y-5">
              <h3 className="text-xs sm:text-sm font-semibold text-[#0A0A0A] flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A0A0A]" /> Goals & Skills Overview
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5 text-xs">
                <div>
                  <label className="app-label text-[#0A0A0A] font-bold">Semester</label>
                  <div className="relative">
                    <select
                      value={semester || 'Semester 1'}
                      onChange={e => setSemester(e.target.value as any)}
                      className="app-input w-full font-medium border-[#E5E7EB] rounded-lg bg-[#FAFAFA] appearance-none pr-8 cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <option key={sem} value={`Semester ${sem}`}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#6B7280] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
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

              {/* Areas of Interest */}
              <div className="space-y-2 text-xs">
                <label className="app-label text-[#0A0A0A] font-bold">Areas of Interest</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {areasOfInterest.map(item => (
                    <span
                      key={item}
                      className="px-3 py-1 bg-[#FAFAFA] text-[#374151] border border-[#E5E7EB] rounded-lg font-bold text-xs flex items-center gap-2 group transition-all"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveAreaOfInterest(item)}
                        className="text-[#9CA3AF] hover:text-[#0A0A0A] transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 max-w-md">
                  <input
                    type="text"
                    value={newAreaOfInterest}
                    onChange={e => setNewAreaOfInterest(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddAreaOfInterest())}
                    placeholder="Add interest (e.g. Machine Learning, Web3)"
                    className="app-input flex-1 border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                  <Button type="button" variant="secondary" size="md" onClick={handleAddAreaOfInterest} icon={<Plus className="w-3.5 h-3.5" />}>
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentRole === 'alumni' && (
            <div className="border-t border-[#E5E7EB] pt-5 sm:pt-6 space-y-4 sm:space-y-5">
              <h3 className="text-xs sm:text-sm font-semibold text-[#0A0A0A] flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A0A0A]" /> Alumni Professional & Higher Education Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5 text-xs">
                <div>
                  <label className="app-label text-[#0A0A0A] font-bold">Graduation Year</label>
                  <input
                    type="number"
                    value={graduationYear}
                    onChange={e => setGraduationYear(Number(e.target.value))}
                    className="app-input w-full font-mono font-medium border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                </div>

                <div>
                  <label className="app-label text-[#0A0A0A]">Current Company</label>
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    className="app-input w-full font-medium border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
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

                <div>
                  <label className="app-label text-[#0A0A0A] font-bold">Current Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Mumbai, India"
                    className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                </div>

                <div>
                  <label className="app-label text-[#0A0A0A] font-bold">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder="e.g. India"
                    className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                </div>
              </div>

              {/* Professional Skills */}
              <div className="space-y-2 text-xs">
                <label className="app-label text-[#0A0A0A] font-bold">Professional Skills</label>
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
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder="Add skill (e.g. Python, Leadership)"
                    className="app-input flex-1 border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                  <Button type="button" variant="secondary" size="md" onClick={handleAddSkill} icon={<Plus className="w-3.5 h-3.5" />}>
                    Add Skill
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Faculty Role Section */}
          {(currentRole === 'faculty' || currentRole === 'teacher') && (
            <div className="border-t border-[#E5E7EB] pt-5 sm:pt-6 space-y-4 sm:space-y-5">
              <h3 className="text-xs sm:text-sm font-semibold text-[#0A0A0A] flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A0A0A]" /> Faculty Academic Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5 text-xs">
                <div>
                  <label className="app-label text-[#0A0A0A] font-bold">Employee ID</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value)}
                    placeholder="e.g. DJSCE-FAC-001"
                    className="app-input w-full font-mono font-medium border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                </div>

                <div>
                  <label className="app-label text-[#0A0A0A]">Academic Designation</label>
                  <div className="relative">
                    <select
                      value={facDesignation}
                      onChange={e => setFacDesignation(e.target.value)}
                      className="app-input w-full font-medium border-[#E5E7EB] rounded-lg bg-[#FAFAFA] appearance-none pr-8 cursor-pointer"
                    >
                      <option value="Professor">Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Lecturer">Lecturer</option>
                      <option value="HOD">HOD</option>
                      <option value="Dean">Dean</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#6B7280] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="app-label text-[#0A0A0A] font-bold">Ongoing Research</label>
                  <textarea
                    rows={3}
                    value={ongoingResearch}
                    onChange={e => setOngoingResearch(e.target.value)}
                    placeholder="Describe your current research projects, grants, or publications..."
                    className="app-input w-full leading-relaxed border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                </div>
              </div>

              {/* Research Areas */}
              <div className="space-y-2 text-xs">
                <label className="app-label text-[#0A0A0A] font-bold">Research Areas</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {researchAreas.map(item => (
                    <span
                      key={item}
                      className="px-3 py-1 bg-[#FAFAFA] text-[#374151] border border-[#E5E7EB] rounded-lg font-bold text-xs flex items-center gap-2 group transition-all"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveResearchArea(item)}
                        className="text-[#9CA3AF] hover:text-[#0A0A0A] transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 max-w-md">
                  <input
                    type="text"
                    value={newResearchArea}
                    onChange={e => setNewResearchArea(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddResearchArea())}
                    placeholder="Add area (e.g. AI, Quantum Computing)"
                    className="app-input flex-1 border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                  <Button type="button" variant="secondary" size="md" onClick={handleAddResearchArea} icon={<Plus className="w-3.5 h-3.5" />}>
                    Add
                  </Button>
                </div>
              </div>

              {/* Professional Skills */}
              <div className="space-y-2 text-xs">
                <label className="app-label text-[#0A0A0A] font-bold">Professional Skills</label>
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
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder="Add skill (e.g. MATLAB, Teaching, Python)"
                    className="app-input flex-1 border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
                  />
                  <Button type="button" variant="secondary" size="md" onClick={handleAddSkill} icon={<Plus className="w-3.5 h-3.5" />}>
                    Add Skill
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Form Action Footer */}
          <div className="pt-4 sm:pt-5 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-[#E5E7EB]">
            {saveError ? (
              <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="line-clamp-1">{saveError}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                {isDirty ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    <span className="font-medium text-amber-700">You have unsaved changes</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>All changes saved to your profile</span>
                  </>
                )}
              </div>
            )}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button 
                type="submit" 
                variant="primary" 
                size="md" 
                className="w-full sm:w-auto" 
                icon={<Save className="w-4 h-4" />}
                disabled={!isDirty || isSaving}
              >
                {isSaving ? 'Saving Changes...' : isDirty ? 'Save Profile Details' : 'All Changes Saved'}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: FIELD PRIVACY CONTROLS */}
      {activeTab === 'privacy' && (
        <>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-6 space-y-5 sm:space-y-6 text-xs shadow-none">
          <div className="border-b border-[#E5E7EB] pb-3 sm:pb-4">
            <h2 className="text-xs sm:text-sm font-semibold text-[#0A0A0A] flex items-center gap-2">
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
                    <option value="public">All verified members</option>
                    <option value="institution">People I mentor or am mentored by</option>
                    <option value="private">Only me and admins</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#6B7280] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            ))}
          </div>

          {/* Save Action Footer */}
          <div className="pt-4 sm:pt-5 flex justify-end border-t border-[#E5E7EB]">
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
              disabled={isSavingPrivacy}
              onClick={handleSavePrivacy}
            >
              {isSavingPrivacy ? 'Saving Preferences...' : 'Save Privacy Preferences'}
            </Button>
          </div>
        </div>
        <React.Suspense fallback={null}>
          <OutreachVisibilityCard />
        </React.Suspense>
        </>
      )}

      {/* TAB 3: ADVISOR CAPACITY */}
      {activeTab === 'capacity' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-6 space-y-5 sm:space-y-6 text-xs shadow-none">
          <div className="border-b border-[#E5E7EB] pb-3 sm:pb-4">
            <h2 className="text-xs sm:text-sm font-semibold text-[#0A0A0A] flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A0A0A]" /> Mentorship Capacity & Availability Limits
            </h2>
            <p className="text-[#6B7280] font-medium mt-0.5 sm:mt-1 line-clamp-2 sm:line-clamp-none">
              Prevent request overwhelm by setting a maximum capacity for active student mentees.
            </p>
          </div>

          <div className="space-y-4 max-w-xl text-xs">
            <div className="p-4 sm:p-5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-[#0A0A0A] text-xs">Active mentorship status:</span>
                <button
                  type="button"
                  onClick={() => setIsMentoringAvailable(!isMentoringAvailable)}
                  className={`px-3.5 py-1.5 font-semibold transition rounded-lg text-xs cursor-pointer ${
                    isMentoringAvailable ? 'bg-[#0A0A0A] text-white' : 'bg-[#E5E7EB] text-[#374151]'
                  }`}
                >
                  {isMentoringAvailable ? 'Accepting requests' : 'Mentorship paused'}
                </button>
              </div>

              <div>
                <label className="block text-[#0A0A0A] font-semibold text-xs mb-2">
                  Max simultaneous active mentees: <strong className="text-[#0A0A0A] text-sm tabular-nums">{maxMentees} mentees</strong>
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

              <div className="pt-3 flex justify-end border-t border-[#E5E7EB]">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  icon={<Save className="w-4 h-4" />}
                  onClick={handleSaveCapacity}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Capacity Settings'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-6 space-y-5 sm:space-y-6 text-xs shadow-none">
          <div className="border-b border-[#E5E7EB] pb-3 sm:pb-4">
            <h2 className="font-bold text-xs text-[#0A0A0A] flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A0A0A]" /> Notification preferences
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
            <div className="p-3.5 sm:p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl">
              <Toggle
                checked={notifOpportunities}
                onChange={setNotifOpportunities}
                label="Job & Internship Opportunities"
                description="Receive updates about newly posted campus and alumni job openings"
              />
            </div>

            <div className="p-3.5 sm:p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl">
              <Toggle
                checked={notifEvents}
                onChange={setNotifEvents}
                label="Campus Events & Webinars"
                description="Alerts for upcoming college workshops, hackathons, and guest sessions"
              />
            </div>

            <div className="p-3.5 sm:p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl">
              <Toggle
                checked={notifAnnouncements}
                onChange={setNotifAnnouncements}
                label="Institutional Announcements"
                description="Official department broadcasts and university circulars"
              />
            </div>

            <div className="p-3.5 sm:p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl">
              <Toggle
                checked={notifMentorship}
                onChange={setNotifMentorship}
                label="Mentorship & Guidance Updates"
                description="Status changes on mentorship requests, sessions, and bookings"
              />
            </div>

            <div className="p-3.5 sm:p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl">
              <Toggle
                checked={notifMessages}
                onChange={setNotifMessages}
                label="Direct Messages"
                description="Instant notifications when peers or mentors send you direct messages"
              />
            </div>
          </div>

          {/* Save Action Footer */}
          <div className="pt-4 sm:pt-5 flex justify-end border-t border-[#E5E7EB]">
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
              disabled={isSavingNotifs}
              onClick={handleSaveNotifications}
            >
              {isSavingNotifs ? 'Saving Preferences...' : 'Save Preferences'}
            </Button>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY */}
      {activeTab === 'security' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-6 space-y-5 sm:space-y-6 text-xs shadow-none">
          <h2 className="text-xs sm:text-sm font-semibold text-[#0A0A0A] flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A0A0A]" /> Security Credentials & Password Update
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 text-xs">
              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="bg-[#FAFAFA]"
              />
              <PasswordField
                label="New Password (min 8 chars)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="bg-[#FAFAFA]"
              />
              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="bg-[#FAFAFA]"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-semibold text-[#0A0A0A] hover:underline"
              >
                Forgot your current password? Send password reset link to your email
              </button>

              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
                disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword}
                onClick={handleUpdatePassword}
              >
                {isUpdatingPassword ? 'Verifying & Updating...' : 'Update Password'}
              </Button>
            </div>
          </div>

          {/* Admin Governance & Role Handoff Suite (Admin Role Only) */}
          {currentRole === 'admin' && (
            <div className="border-t border-[#E5E7EB] pt-5 sm:pt-6 space-y-5 sm:space-y-6">
              <div className="border-b border-[#E5E7EB] pb-3 sm:pb-4">
                <h2 className="text-xs sm:text-sm font-semibold text-[#0A0A0A] flex items-center gap-2">
                  <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A0A0A]" /> Admin Delegation & Role Handoff
                </h2>
                <p className="text-[#6B7280] font-medium mt-0.5 sm:mt-1 line-clamp-2 sm:line-clamp-none">
                  Vouch for new administrators or voluntarily transfer your administrative role.
                </p>
              </div>

              {/* Form 1: Invite New Admin */}
              <div className="p-5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl space-y-4 font-sans text-xs">
                <div>
                  <h3 className="font-semibold text-[#0A0A0A] text-xs">Invite New Administrator</h3>
                  <p className="text-[#6B7280] text-[11px] mt-0.5">
                    Generate a cryptographically secure, single-use activation invitation valid for 7 days.
                  </p>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!inviteEmailInput.trim() || isInvitingAdmin) return;
                    setIsInvitingAdmin(true);
                    try {
                      const res = await inviteNewAdmin(inviteEmailInput, currentUser.id);
                      if (res.success) {
                        if (res.inviteLink) {
                          setNewlyCreatedLinks(prev => ({
                            ...prev,
                            [inviteEmailInput.trim().toLowerCase()]: res.inviteLink!
                          }));
                        }
                        showToast(`Admin invite link created for ${inviteEmailInput}!`);
                        setInviteEmailInput('');
                      } else {
                        showToast(res.error || 'Failed to send invite.');
                      }
                    } catch (err: any) {
                      showToast(err?.message || 'Error creating invite.');
                    } finally {
                      setIsInvitingAdmin(false);
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
                    className="app-input flex-1 font-medium border-[#E5E7EB] rounded-lg bg-white min-h-[44px] text-base sm:text-xs"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isInvitingAdmin}
                    className="min-h-[44px]"
                    icon={<Mail className="w-4 h-4" />}
                  >
                    {isInvitingAdmin ? 'Creating...' : 'Send Invite'}
                  </Button>
                </form>

                {/* Pending Invites List */}
                <div className="pt-3 border-t border-[#E5E7EB] space-y-3">
                  {(() => {
                    const seen = new Set<string>();
                    const pendingInvites = adminInvites.filter(i => {
                      if (i.status !== 'pending') return false;
                      const key = i.invitedEmail.toLowerCase();
                      if (seen.has(key)) return false;
                      seen.add(key);
                      return true;
                    });

                    return (
                      <>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-[#0A0A0A] text-xs">Pending Admin Invites</h4>
                          <Badge variant="indigo" size="sm">
                            {pendingInvites.length}
                          </Badge>
                        </div>

                        {pendingInvites.length === 0 ? (
                          <p className="text-xs text-[#6B7280] font-medium">No active pending Admin invites.</p>
                        ) : (
                          <div className="space-y-3 max-w-xl">
                            {pendingInvites.map(inv => {
                              const emailKey = inv.invitedEmail.toLowerCase();
                              const freshLink = newlyCreatedLinks[emailKey];
                        const expiryMs = inv.expiresAt ? new Date(inv.expiresAt).getTime() : new Date(inv.invitedAt).getTime() + 7 * 86400000;
                        const remainingDays = Math.max(0, Math.ceil((expiryMs - Date.now()) / (1000 * 60 * 60 * 24)));
                        let formattedDate = inv.invitedAt;
                        try {
                          formattedDate = new Intl.DateTimeFormat('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }).format(new Date(inv.invitedAt));
                        } catch {}

                        return (
                          <div key={inv.id} className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl flex flex-col gap-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <p className="font-bold text-[#0A0A0A] text-xs font-mono">{inv.invitedEmail}</p>
                                <p className="text-[11px] text-[#6B7280] mt-0.5">
                                  Invited on {formattedDate} • Expires in {remainingDays} {remainingDays === 1 ? 'day' : 'days'}
                                </p>
                              </div>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="shrink-0 self-start sm:self-center min-h-[44px]"
                                onClick={async () => {
                                  await revokeAdminInvite(inv.id);
                                  setNewlyCreatedLinks(prev => {
                                    const next = { ...prev };
                                    delete next[emailKey];
                                    return next;
                                  });
                                  showToast(`Revoked Admin invite for ${inv.invitedEmail}`);
                                }}
                                icon={<Trash2 className="w-3.5 h-3.5" />}
                              >
                                Revoke
                              </Button>
                            </div>

                            {freshLink ? (
                              <div className="space-y-1.5 pt-1 border-t border-[#F3F4F6]">
                                <p className="text-[10px] text-[#059669] font-medium">
                                  Link generated! Copy and share this link now. It will not be shown again once you reload.
                                </p>
                                <div className="flex items-center gap-2">
                                  <code className="flex-1 block truncate text-[11px] font-mono bg-[#F9FAFB] text-[#111827] px-2.5 py-2 rounded-lg border border-[#E5E7EB]">
                                    {freshLink}
                                  </code>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(freshLink);
                                      setCopiedInviteId(inv.id);
                                      setTimeout(() => setCopiedInviteId(null), 2500);
                                    }}
                                    className="shrink-0 min-h-[44px] px-3.5 flex items-center gap-1.5 text-xs font-medium text-[#0A0A0A] bg-white hover:bg-[#F9FAFB] rounded-lg transition-colors border border-[#E5E7EB]"
                                    title="Copy invite link"
                                  >
                                    {copiedInviteId === inv.id ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-emerald-700 font-semibold">Link copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5 text-[#6B7280]" />
                                        <span>Copy link</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="pt-2 border-t border-[#F3F4F6] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <p className="text-[11px] text-[#6B7280] font-normal">
                                  Link was shown once. Revoke and resend to get a new link.
                                </p>
                                <button
                                  type="button"
                                  disabled={isRegeneratingId === inv.id}
                                  onClick={async () => {
                                    setIsRegeneratingId(inv.id);
                                    try {
                                      await revokeAdminInvite(inv.id);
                                      const res = await inviteNewAdmin(inv.invitedEmail, currentUser.id);
                                      if (res.success && res.inviteLink) {
                                        setNewlyCreatedLinks(prev => ({
                                          ...prev,
                                          [emailKey]: res.inviteLink!
                                        }));
                                        showToast(`Generated new link for ${inv.invitedEmail}`);
                                      } else {
                                        showToast(res.error || 'Failed to generate new link');
                                      }
                                    } finally {
                                      setIsRegeneratingId(null);
                                    }
                                  }}
                                  className="inline-flex items-center justify-center min-h-[44px] px-3 py-2 text-xs font-semibold text-[#0A0A0A] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors disabled:opacity-50"
                                >
                                  {isRegeneratingId === inv.id ? 'Generating...' : 'Generate new link'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

              {/* Form 2: Step Down / Role Handoff */}
              <div className="p-5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl space-y-3 font-sans text-xs">
                <h3 className="font-semibold text-[#0A0A0A] text-xs">Step Down / Role Handoff</h3>
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

      {/* System & Build Information Block — admin-only */}
      {currentRole === 'admin' && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 space-y-4 font-sans text-xs">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-[#0A0A0A]">About NexaLink & System Info</h2>
              <p className="text-xs text-[#6B7280]">Build metadata and connected database environment</p>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold ${buildInfo.dataMode === 'live' ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]' : 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'}`}>
              {buildInfo.dataMode.toUpperCase()} DATA
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-3">
              <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block font-sans">Commit SHA</span>
              <span className="text-[#0A0A0A] font-semibold">{buildInfo.commitSha}</span>
            </div>
            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-3">
              <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block font-sans">Git Branch</span>
              <span className="text-[#0A0A0A] font-semibold">{buildInfo.gitBranch}</span>
            </div>
            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-3">
              <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block font-sans">Supabase Ref</span>
              <span className="text-[#0A0A0A] font-semibold">{buildInfo.supabaseProjectRef}</span>
            </div>
            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-3">
              <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block font-sans">Build Time</span>
              <span className="text-[#0A0A0A] font-semibold text-[11px] truncate block" title={buildInfo.buildTime}>
                {buildInfo.buildTime.slice(0, 19).replace('T', ' ')}
              </span>
            </div>
          </div>
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
              <label className="text-xs font-medium text-slate-700">
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
              <label className="text-xs font-medium text-slate-700">
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

      {/* Lazy-loaded Avatar Cropper Modal */}
      {isCropModalOpen && cropImageSrc && (
        <React.Suspense fallback={null}>
          <AvatarCropModal
            isOpen={isCropModalOpen}
            imageSrc={cropImageSrc}
            onClose={handleCloseCropModal}
            onSave={handleSaveCroppedAvatar}
            triggerRef={avatarTriggerRef}
          />
        </React.Suspense>
      )}

      {/* Remove Avatar Confirmation Modal */}
      <Modal
        isOpen={showRemoveAvatarModal}
        onClose={() => !isRemovingAvatar && setShowRemoveAvatarModal(false)}
        title="Remove profile photo?"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#6B7280]">
            Are you sure you want to remove your profile photo? Your profile will display your initials instead.
          </p>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowRemoveAvatarModal(false)}
              disabled={isRemovingAvatar}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmRemoveAvatar}
              disabled={isRemovingAvatar}
            >
              {isRemovingAvatar ? 'Removing...' : 'Remove photo'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
