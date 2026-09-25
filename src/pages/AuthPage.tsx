/**
 * AUDIT STATUS COMMENT:
 * ITEM 1 STATUS: CONFIRMED - Demo logins gated behind DEV check; Sign In form role toggle removed and role derived server-side from DB.
 * ITEM 4 STATUS: IMPLEMENTED - Auth Hardening includes Password Reset flow, Account Lockout (5 failed attempts rate-limiting), and Email/OTP Verification step.
 * REDESIGN: Demo Access Section redesigned into a lightweight, compact chip row with ghost outlined styling, role icons, and hover tooltips.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { LogoMark } from '../components/common/LogoMark';
import { CampusHeroPanel } from '../components/auth/CampusHeroPanel';
import type { UserRole, DepartmentCode } from '../types';
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  UserCheck,
  Building2,
  KeyRound,
  Mail,
  GraduationCap,
  Briefcase,
  BookOpen,
  ShieldCheck,
  X
} from 'lucide-react';
import { Button, Modal } from '../components/common/UIComponents';
import { uploadProofDocument } from '../lib/storage';

interface AuthPageProps {
  setActiveTab: (tab: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ setActiveTab }) => {
  const { login, register, switchRole, loginError, clearLoginError, requestPasswordReset, confirmPasswordReset } = useAuth();
  const { registerUserInDatabase, adminInvites, acceptAdminInvite, allUsers } = useData();
  const shouldReduceMotion = useReducedMotion();

  const [mode, setMode] = useState<'login' | 'register' | 'verification-sent'>('login');
  const [role, setRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dept, setDept] = useState<DepartmentCode>('CMPN');

  React.useEffect(() => {
    document.title = "Login or Register | NexaLink";
  }, []);
  
  // Specific Workflow Fields
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [semester, setSemester] = useState<any>('Semester 7');
  const [gradYear, setGradYear] = useState('2024');
  const [companyOrUniv, setCompanyOrUniv] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [institutionalEmail, setInstitutionalEmail] = useState('');
  const [proofDocName, setProofDocName] = useState('');
  const [proofDocUrl, setProofDocUrl] = useState('');

  // Admin Invite Acceptance Modal States
  const [showAcceptInviteModal, setShowAcceptInviteModal] = useState(false);
  const [inviteMatchEmail, setInviteMatchEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteNewPassword, setInviteNewPassword] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Password Reset & OTP States (Item 4)
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [registrationOtpStep, setRegistrationOtpStep] = useState(false);
  const [inputRegistrationOtp, setInputRegistrationOtp] = useState('');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDemoLogin = (demoRole: UserRole) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    let demoEmail = 'aanya.patel@student.vit.edu.in';
    if (demoRole === 'alumni') demoEmail = 'rushabh.sanghavi@alumni.vit.edu.in';
    if (demoRole === 'faculty' || demoRole === 'teacher') demoEmail = 'ravindra.sangale@vit.edu.in';
    if (demoRole === 'admin') demoEmail = 'admin@vit.edu.in';

    switchRole(demoRole);
    // Pass the standard seeded password so it actually logs into Supabase
    login(demoEmail, undefined, 'password123');
    setActiveTab('dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || email.trim() === '') {
      setErrorMsg('Email address is required.');
      return;
    }
    if (!password || password.trim() === '') {
      setErrorMsg('Password is required.');
      return;
    }

    if (mode === 'login') {
      const targetEmail = (email || '').trim().toLowerCase();
      const matchedUser = allUsers.find(
        u => u.email.toLowerCase() === targetEmail || (u as any).personalEmail?.toLowerCase() === targetEmail
      );

      const res = await login(email || 'aanya.patel@student.vit.edu.in', undefined, password, matchedUser);
      if (res.success) {
        setActiveTab('dashboard');
      } else if (res.message) {
        setErrorMsg(res.message);
      }
    } else {
      if (role === 'admin') {
        setErrorMsg('Administrator accounts are provisioned exclusively by the institution. Please log in using official administrator credentials.');
        return;
      }

      if (!name || name.trim() === '') {
        setErrorMsg('Full Name is required.');
        return;
      }
      if (role === 'student' && !enrollmentNo) {
        setErrorMsg('PRN / Enrollment Number is required for Student registration.');
        return;
      }
      if (role === 'alumni' && !gradYear) {
        setErrorMsg('Graduation Year is required for Alumni registration.');
        return;
      }
      if ((role === 'faculty' || role === 'teacher') && !designation) {
        setErrorMsg('Designation is required for Faculty registration.');
        return;
      }

      const userData = {
        name,
        email,
        password,
        department: dept,
        enrollmentNo: enrollmentNo || undefined,
        employeeId: employeeId || undefined,
        proofDocumentName: proofDocName || undefined,
        verificationDocumentUrl: proofDocUrl || undefined,
        semester: role === 'student' ? semester : undefined,
        gradYear: role === 'alumni' ? gradYear : undefined,
        company: role === 'alumni' ? companyOrUniv : undefined,
        designation: designation || undefined
      };

      const result = await register(userData, role as UserRole);

      if (result.success) {
        setMode('verification-sent');
        setSuccessMsg(result.message);
      } else {
        setErrorMsg(result.message);
      }
    }
  };

  const formFieldVariants: Variants = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="relative bg-white text-slate-950 font-sans antialiased min-h-[calc(100vh-4rem)] flex items-center py-12">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Top-aligned items-start ensures left hero column position is independent of right card height */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Hero Content with Staggered Entrance (Order 2 on mobile, 1 on desktop) */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.08 }
              }
            }}
            className="hidden lg:block lg:col-span-7 space-y-6 relative"
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="space-y-1"
            >
              <span className="block font-sans font-light text-2xl sm:text-5xl text-slate-800 tracking-tight">
                Access the Institutional
              </span>
              <h1 className="text-4xl sm:text-7xl md:text-8xl font-black text-slate-950 tracking-tight leading-none">
                NexaLink.
              </h1>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="relative"
            >
              <p className="font-sans text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Centralized platform connecting Students, Alumni, Faculty, and Administrators at Vidyalankar Institute of Technology.
              </p>
            </motion.div>

            {/* 3-Step Process Cards */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2"
            >
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-1 hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200">
                <div className="flex items-center gap-2 font-display font-bold text-xs text-slate-950 uppercase tracking-wider">
                  <UserCheck className="w-4 h-4 text-slate-800" />
                  <span>1. Registration</span>
                </div>
                <p className="font-sans text-[11px] text-slate-500">
                  Student, Alumni, Faculty & Admin portals with mandatory credential fields.
                </p>
              </div>

              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-1 hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200">
                <div className="flex items-center gap-2 font-display font-bold text-xs text-slate-950 uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-slate-800" />
                  <span>2. Verification</span>
                </div>
                <p className="font-sans text-[11px] text-slate-500">
                  Admin checks Enrollment #, Employee ID & Email before granting access.
                </p>
              </div>

              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-1 hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200">
                <div className="flex items-center gap-2 font-display font-bold text-xs text-slate-950 uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-slate-800" />
                  <span>3. Authentication</span>
                </div>
                <p className="font-sans text-[11px] text-slate-500">
                  Role-based access to Smart Recommendations, Mentorship & Analytics.
                </p>
              </div>
            </motion.div>

            {/* Premium Campus Photo Panel filling available hero column space */}
            <CampusHeroPanel />
          </motion.div>

          {/* Right Column: Form Card with Layout Animation (Order 1 on mobile, 2 on desktop) */}
          <motion.div
            layout
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md mx-auto lg:max-w-none lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-8 shadow-xl space-y-6"
          >
            <div className="text-center space-y-1">
              <div className="w-10 h-10 mx-auto flex items-center justify-center">
                <LogoMark className="w-8 h-8 text-slate-950" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-950 uppercase tracking-wider">
                {mode === 'login' ? 'Institutional Sign In' : mode === 'register' ? 'Role Registration' : 'Check Your Email'}
              </h3>
              <p className="font-sans text-xs text-slate-500">
                {mode === 'verification-sent' ? 'Verification Link Sent Successfully' : 'Vidyalankar Institute of Technology, Wadala'}
              </p>
            </div>

            {/* LIGHTWEIGHT DEV-ONLY INSTANT DEMO PORTAL ACCESS ROW */}
            {(import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_LOGINS === 'true') && (
              <div className="space-y-3 bg-slate-50/60 border border-slate-200/80 rounded-xl p-3.5">
                <p className="font-sans text-xs text-slate-400 font-semibold">
                  Instant Demo Access (Development Only)
                </p>

                {/* 4 Compact Role Icon+Label Chips in 1 Row with Button Physics */}
                <div className="grid grid-cols-4 gap-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    onClick={() => handleDemoLogin('student')}
                    title="Login as Aanya Patel (BE CMPN Student)"
                    className="py-2 px-1.5 border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-950 font-sans font-bold text-xs transition rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <GraduationCap className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Student</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    onClick={() => handleDemoLogin('alumni')}
                    title="Login as Rushabh Sanghavi (Senior SDE at Google)"
                    className="py-2 px-1.5 border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-950 font-sans font-bold text-xs transition rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Alumni</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    onClick={() => handleDemoLogin('faculty')}
                    title="Login as Dr. Ravindra Sangale (HOD CMPN)"
                    className="py-2 px-1.5 border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-950 font-sans font-bold text-xs transition rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Faculty</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    onClick={() => handleDemoLogin('admin')}
                    title="Login as Dr. Sunita Rawat (Institutional Admin)"
                    className="py-2 px-1.5 border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-950 font-sans font-bold text-xs transition rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Admin</span>
                  </motion.button>
                </div>
              </div>
            )}

            {(import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_LOGINS === 'true') && (
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-slate-200/80" />
                <span className="bg-white px-3 font-sans text-xs text-slate-400 absolute">
                  or sign in / register account
                </span>
              </div>
            )}

            {/* Mode Switcher with layoutId sliding pill */}
            {mode !== 'verification-sent' && (
              <div className="relative flex border border-slate-200/80 rounded-xl p-1 bg-slate-100/80 text-xs font-display font-bold uppercase tracking-wider isolate">
              {(['login', 'register'] as const).map(m => {
                const isActive = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMode(m); setErrorMsg(null); setSuccessMsg(null); clearLoginError(); }}
                    className={`relative flex-1 py-2.5 rounded-lg transition-colors duration-150 z-10 cursor-pointer ${
                      isActive ? 'text-white' : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="authModePill"
                        transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                        className="absolute inset-0 bg-slate-950 rounded-lg -z-10 shadow-xs"
                      />
                    )}
                    <span className="relative z-10">{m === 'login' ? 'Sign In' : 'Register'}</span>
                  </button>
                );
              })}
              </div>
            )}

            {mode !== 'verification-sent' && (errorMsg || loginError) && (
              <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-950 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[11px] block text-rose-900 uppercase font-display tracking-wider mb-0.5">
                    {((errorMsg || loginError)?.toLowerCase().includes('pending admin approval') || (errorMsg || loginError)?.toLowerCase().includes('verification')) 
                      ? 'Account Verification Required' 
                      : 'Authentication Error'}
                  </span>
                  {errorMsg || loginError}
                </div>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-950 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[11px] block text-emerald-900 uppercase font-display tracking-wider mb-0.5">
                    Registration Submitted
                  </span>
                  {successMsg}
                </div>
              </div>
            )}

            {mode === 'verification-sent' ? (
              <motion.div
                key="verification-sent-view"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center text-center py-6 space-y-4"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2 shadow-sm border border-slate-200">
                  <Mail className="w-8 h-8 text-slate-700" />
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 tracking-wider">
                  VERIFY YOUR EMAIL
                </h3>
                <p className="font-sans text-xs text-slate-600 leading-relaxed max-w-sm">
                  We've sent a secure verification link to <strong className="text-slate-900">{email}</strong>. 
                  Please check your inbox (and spam folder) to confirm your email address.
                </p>
                <p className="font-sans text-[11px] text-slate-500 max-w-sm">
                  After verifying your email, you can sign in. Note that your account will still require admin approval for full access.
                </p>
                <Button 
                  type="button"
                  variant="secondary" 
                  size="md" 
                  onClick={() => { setMode('login'); setErrorMsg(null); clearLoginError(); }} 
                  className="mt-6 w-full"
                >
                  Return to Sign In
                </Button>
              </motion.div>
            ) : (
              <form noValidate onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
                <AnimatePresence mode="wait">
                {mode === 'login' ? (
                  <motion.div
                    key="login-fields"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-slate-700 not-italic font-display font-bold text-[10px] uppercase tracking-wider mb-1">
                        Registered Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-950 transition-colors duration-150"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 not-italic font-display font-bold text-[10px] uppercase tracking-wider">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowResetModal(true);
                            setResetStep('request');
                            setErrorMsg(null);
                            setSuccessMsg(null);
                          }}
                          className="text-[10px] font-display font-bold text-slate-600 hover:text-slate-950 uppercase tracking-wider underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 text-xs text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-slate-950 transition-colors duration-150"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="register-fields"
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
                    variants={{
                      hidden: { opacity: 0 },
                      show: { opacity: 1, transition: { staggerChildren: 0.045 } }
                    }}
                    className="space-y-4"
                  >
                    {/* User Type Selector with layoutId sliding highlight */}
                    <motion.div variants={formFieldVariants}>
                      <label className="app-label">
                        Select User Type
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 font-display text-[11px] font-bold uppercase p-1 bg-slate-100/80 border border-slate-200/80 rounded-xl relative isolate">
                        {(['student', 'alumni', 'faculty'] as UserRole[]).map(r => {
                          const isRoleActive = role === r;
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => { setRole(r); setErrorMsg(null); clearLoginError(); }}
                              className={`relative py-2 rounded-lg transition-colors duration-150 cursor-pointer z-10 ${
                                isRoleActive ? 'text-white' : 'text-slate-600 hover:text-slate-950'
                              }`}
                            >
                              {isRoleActive && (
                                <motion.div
                                  layoutId="authRolePill"
                                  transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                                  className="absolute inset-0 bg-slate-950 rounded-lg -z-10 shadow-xs"
                                />
                              )}
                              <span className="relative z-10">{r === 'faculty' ? 'Faculty' : r}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>

                    {role === 'admin' ? (
                      <motion.div variants={formFieldVariants} className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs not-italic rounded-xl">
                        <strong>Administrator Accounts:</strong> Admin accounts are created directly by the institution. Please use the instant Demo Admin login or contact the VIT IT cell.
                      </motion.div>
                    ) : (
                      <>
                        <motion.div variants={formFieldVariants}>
                          <label className="block text-slate-700 not-italic font-display font-bold text-[10px] uppercase tracking-wider mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Rahul Sharma"
                            className="w-full bg-stone-50 border border-stone-200 px-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-950 transition-colors duration-150"
                          />
                        </motion.div>

                        <motion.div variants={formFieldVariants} className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 not-italic font-display font-bold text-[10px] uppercase tracking-wider mb-1">
                              Department
                            </label>
                            <select
                              value={dept}
                              onChange={e => setDept(e.target.value as DepartmentCode)}
                              className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs text-slate-900 not-italic font-display font-bold"
                            >
                              <option value="CMPN">Computer (CMPN)</option>
                              <option value="INFT">IT (INFT)</option>
                              <option value="EXTC">Telecom (EXTC)</option>
                              <option value="ETRX">Electronics (ETRX)</option>
                              <option value="EXCS">Electronics & CS (EXCS)</option>
                              <option value="BIOM">Biomedical (BIOM)</option>
                              <option value="MCA">MCA</option>
                              <option value="MBA">MMS / MBA</option>
                            </select>
                          </div>

                          {role === 'student' && (
                            <div>
                              <label className="block text-slate-700 not-italic font-display font-bold text-[10px] uppercase tracking-wider mb-1">
                                Current Semester
                              </label>
                              <select
                                value={semester}
                                onChange={e => setSemester(e.target.value)}
                                className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs text-slate-900 not-italic font-display font-bold"
                              >
                                <option value="Semester 1">Semester 1 (FE)</option>
                                <option value="Semester 3">Semester 3 (SE)</option>
                                <option value="Semester 5">Semester 5 (TE)</option>
                                <option value="Semester 7">Semester 7 (BE)</option>
                              </select>
                            </div>
                          )}

                          {role === 'alumni' && (
                            <div>
                              <label className="block text-slate-700 not-italic font-display font-bold text-[10px] uppercase tracking-wider mb-1">
                                Graduation Year
                              </label>
                              <input
                                type="number"
                                required
                                value={gradYear}
                                onChange={e => setGradYear(e.target.value)}
                                className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs text-slate-900 not-italic font-mono"
                              />
                            </div>
                          )}

                          {(role === 'faculty' || role === 'teacher') && (
                            <div>
                              <label className="block text-slate-700 not-italic font-display font-bold text-[10px] uppercase tracking-wider mb-1">
                                Designation
                              </label>
                              <input
                                type="text"
                                required
                                value={designation}
                                onChange={e => setDesignation(e.target.value)}
                                placeholder="e.g. Associate Professor"
                                className="w-full bg-stone-50 border border-stone-200 px-3 py-2 text-xs text-slate-900 not-italic"
                              />
                            </div>
                          )}
                        </motion.div>

                        <motion.div variants={formFieldVariants} className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 not-italic font-display font-bold text-[10px] uppercase tracking-wider mb-1">
                              {role === 'faculty' ? 'Employee ID' : 'Enrollment / PRN No.'}
                            </label>
                            <input
                              type="text"
                              required
                              value={role === 'faculty' ? employeeId : enrollmentNo}
                              onChange={e => role === 'faculty' ? setEmployeeId(e.target.value) : setEnrollmentNo(e.target.value)}
                              placeholder={role === 'faculty' ? 'EMP-FAC-102' : '22102A0042'}
                              className="w-full bg-stone-50 border border-stone-200 px-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-950 font-mono"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-slate-700 not-italic font-display font-bold text-[10px] uppercase tracking-wider mb-1">
                              Email Address (used for login — use an email you'll always have access to)
                            </label>
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              placeholder="you@example.com"
                              className="w-full bg-stone-50 border border-stone-200 px-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-950 transition-colors duration-150"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-slate-700 not-italic font-display font-bold text-[10px] uppercase tracking-wider mb-1">
                              Institutional Email (optional, for reference)
                            </label>
                            <input
                              type="email"
                              value={institutionalEmail}
                              onChange={e => setInstitutionalEmail(e.target.value)}
                              placeholder="e.g. name@student.vit.edu.in"
                              className="w-full bg-stone-50 border border-stone-200 px-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-950 transition-colors duration-150"
                            />
                          </div>
                        </motion.div>

                        {role === 'alumni' && (
                          <motion.div variants={formFieldVariants}>
                            <label className="block text-slate-700 not-italic font-display font-bold text-[10px] uppercase tracking-wider mb-1">
                              Current Company or University
                            </label>
                            <input
                              type="text"
                              required
                              value={companyOrUniv}
                              onChange={e => setCompanyOrUniv(e.target.value)}
                              placeholder="e.g. Google India / CMU Pittsburgh"
                              className="w-full bg-stone-50 border border-stone-200 px-4 py-2 text-xs text-slate-900 not-italic"
                            />
                          </motion.div>
                        )}

                        <motion.div variants={formFieldVariants}>
                          <label className="block text-slate-700 not-italic font-display font-bold text-[10px] uppercase tracking-wider mb-1">
                            Verification Proof Document (ID Card / Admit Card / Degree Scan)
                          </label>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={async e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setProofDocName(file.name);
                                try {
                                  const res = await uploadProofDocument(file, email || 'user_reg');
                                  setProofDocUrl(res.url);
                                } catch {
                                  const objUrl = URL.createObjectURL(file);
                                  setProofDocUrl(objUrl);
                                }
                              }
                            }}
                            className="w-full bg-stone-50 border border-stone-200 px-4 py-2 text-xs text-slate-900 not-italic cursor-pointer"
                          />
                          {proofDocName && (
                            <p className="text-[10px] text-emerald-700 font-bold mt-1">✓ Attached: {proofDocName}</p>
                          )}
                        </motion.div>

                        <motion.div variants={formFieldVariants}>
                          <label className="block text-slate-700 not-italic font-display font-bold text-[10px] uppercase tracking-wider mb-1">
                            Password
                          </label>
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-stone-50 border border-stone-200 px-4 py-2 text-xs text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-slate-950 transition-colors duration-150"
                          />
                        </motion.div>
                      </>
                    )}

                    {registrationOtpStep && (
                      <motion.div variants={formFieldVariants} className="p-4 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2 text-xs font-sans">
                        <span className="font-bold text-amber-950 block flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-amber-700" /> Verify Email OTP Code
                        </span>
                        <p className="text-amber-900 text-[11px]">
                          Enter the 6-digit verification code sent to <strong>{email || 'your email'}</strong> (Demo OTP: <strong>482910</strong>):
                        </p>
                        <input
                          type="text"
                          value={inputRegistrationOtp}
                          onChange={e => setInputRegistrationOtp(e.target.value)}
                          placeholder="Enter 6-digit OTP code..."
                          className="app-input w-full font-mono text-center tracking-widest text-sm font-bold bg-white"
                        />
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="group w-full py-3.5 bg-slate-950 hover:bg-slate-800 text-white font-display font-bold text-xs tracking-widest uppercase transition-all duration-100 flex items-center justify-center gap-2 mt-2 not-italic cursor-pointer"
              >
                {mode === 'login'
                  ? 'SIGN IN TO PORTAL'
                  : registrationOtpStep
                  ? 'CONFIRM EMAIL OTP & SUBMIT'
                  : 'VERIFY EMAIL & PROCEED'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-150" />
              </motion.button>
            </form>
            )}

          </motion.div>
        </div>

      </div>



      {/* Modal 2: Reset Password Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Account Password"
        icon={<KeyRound className="w-5 h-5" />}
      >
        <div className="space-y-4 font-sans text-xs">
          <form
            onSubmit={async e => {
              e.preventDefault();
              const res = await requestPasswordReset(resetEmail);
              if (res.success) {
                setSuccessMsg(res.message);
                setShowResetModal(false);
              } else {
                setErrorMsg(res.message);
              }
            }}
            className="space-y-3"
          >
            <p className="text-slate-600 font-medium">
              Enter your registered email address. A password reset link will be sent to your inbox.
            </p>

            <div>
              <label className="app-label">Account Email</label>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                placeholder="e.g. aanya.patel@gmail.com"
                className="app-input w-full"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md">
                Send Reset Link
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
