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
  ShieldCheck
} from 'lucide-react';
import {
  Button,
  Modal,
  TextField,
  PasswordField,
  SelectField,
  FileDropzone
} from '../components/common/UIComponents';
import { uploadProofDocument } from '../lib/storage';

interface AuthPageProps {
  setActiveTab: (tab: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ setActiveTab }) => {
  const { login, register, switchRole, loginError, clearLoginError, requestPasswordReset } = useAuth();
  const { allUsers } = useData();
  const shouldReduceMotion = useReducedMotion();

  const [mode, setMode] = useState<'login' | 'register' | 'verification-sent'>('login');
  const [role, setRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dept, setDept] = useState<DepartmentCode>('CMPN');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  React.useEffect(() => {
    document.title = mode === 'login' ? 'Sign in | NexaLink' : 'Create account | NexaLink';
  }, [mode]);
  
  // Specific Workflow Fields
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [semester, setSemester] = useState<string>('Semester 7');
  const [gradYear, setGradYear] = useState('2024');
  const [companyOrUniv, setCompanyOrUniv] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('');
  const [institutionalEmail, setInstitutionalEmail] = useState('');
  const [proofDocName, setProofDocName] = useState('');
  const [proofDocUrl, setProofDocUrl] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);

  // Password Reset Modal States
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [registrationOtpStep, setRegistrationOtpStep] = useState(false);
  const [inputRegistrationOtp, setInputRegistrationOtp] = useState('');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDemoLogin = (demoRole: UserRole) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    switchRole(demoRole);
    setActiveTab('dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'login') {
      if (!email || email.trim() === '') {
        setErrorMsg('Email address is required.');
        return;
      }
      if (!password || password.trim() === '') {
        setErrorMsg('Password is required.');
        return;
      }

      const targetEmail = (email || '').replace(/^\+/, '').trim().toLowerCase();
      const matchedUser = allUsers.find(
        u => u.email.toLowerCase() === targetEmail || (u as any).personalEmail?.toLowerCase() === targetEmail
      );

      const res = await login(targetEmail || 'aanya.patel@student.vit.edu.in', undefined, password, matchedUser);
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

      const errors: Record<string, string> = {};

      if (!name || name.trim() === '') {
        errors.name = 'Full name is required';
      }
      if (!dept) {
        errors.dept = 'Department is required';
      }

      if (role === 'student') {
        if (!enrollmentNo || enrollmentNo.trim() === '') {
          errors.enrollmentNo = 'Enrollment / PRN number is required';
        }
        if (!semester) {
          errors.semester = 'Current semester is required';
        }
      } else if (role === 'alumni') {
        if (!enrollmentNo || enrollmentNo.trim() === '') {
          errors.enrollmentNo = 'Enrollment / PRN number is required';
        }
        if (!gradYear || gradYear.trim() === '') {
          errors.gradYear = 'Graduation year is required';
        }
        if (!companyOrUniv || companyOrUniv.trim() === '') {
          errors.companyOrUniv = 'Current organization or university is required';
        }
      } else if (role === 'faculty' || role === 'teacher') {
        if (!employeeId || employeeId.trim() === '') {
          errors.employeeId = 'Employee ID is required';
        }
        if (!designation || designation.trim() === '') {
          errors.designation = 'Designation is required';
        }
      }

      if (!email || email.trim() === '') {
        errors.email = 'Email address is required';
      } else if (!email.includes('@') || !email.includes('.')) {
        errors.email = 'Please enter a valid email address';
      }

      if (!password || password.trim() === '') {
        errors.password = 'Password is required';
      } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setErrorMsg('Please complete all required fields indicated below.');
        return;
      }

      setFieldErrors({});

      const userData = {
        name,
        email: email.replace(/^\+/, '').trim().toLowerCase(),
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
    <div className="relative bg-white text-[#0A0A0A] font-sans antialiased min-h-[calc(100vh-4rem)] flex items-center py-10">
      <div className="app-container w-full">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Hero Content */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="hidden lg:block lg:col-span-7 space-y-6 relative"
          >
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6B7280] block">
                Institutional network
              </span>
              <h1 className="text-4xl sm:text-6xl font-display font-bold text-[#0A0A0A] tracking-tight leading-tight">
                Access the institutional NexaLink.
              </h1>
              <p className="font-sans text-base text-[#6B7280] leading-relaxed max-w-xl">
                The centralized alumni and academic engagement platform for students, alumni, faculty, and administration at Vidyalankar Institute of Technology.
              </p>
            </div>

            {/* 3-Step Process Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-4 space-y-1">
                <div className="flex items-center gap-2 font-medium text-xs text-[#0A0A0A]">
                  <UserCheck className="w-4 h-4 text-[#0A0A0A]" />
                  <span>1. Registration</span>
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Student, alumni, and faculty portals with institutional credentials.
                </p>
              </div>

              <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-4 space-y-1">
                <div className="flex items-center gap-2 font-medium text-xs text-[#0A0A0A]">
                  <ShieldAlert className="w-4 h-4 text-[#0A0A0A]" />
                  <span>2. Verification</span>
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Faculty and administration review PRN and credentials before approval.
                </p>
              </div>

              <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-4 space-y-1">
                <div className="flex items-center gap-2 font-medium text-xs text-[#0A0A0A]">
                  <Building2 className="w-4 h-4 text-[#0A0A0A]" />
                  <span>3. Authentication</span>
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Role-based access to mentorship, opportunities, directory, and chats.
                </p>
              </div>
            </div>

            {/* Campus Photo Panel */}
            <CampusHeroPanel />
          </motion.div>

          {/* Right Column: Form Card */}
          <motion.div
            layout
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md mx-auto lg:max-w-none lg:col-span-5 bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-7 space-y-6"
          >
            <div className="text-center space-y-1">
              <div className="w-10 h-10 mx-auto flex items-center justify-center">
                <LogoMark className="w-8 h-8 text-[#0A0A0A]" />
              </div>
              <h2 className="font-display font-bold text-xl text-[#0A0A0A]">
                {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create your account' : 'Check your email'}
              </h2>
              <p className="text-xs text-[#6B7280]">
                {mode === 'verification-sent' ? 'Verification link sent successfully' : 'Vidyalankar Institute of Technology, Wadala'}
              </p>
            </div>

            {/* Instant Demo Access (Dev Only) */}
            {(import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_LOGINS === 'true') && (
              <div className="space-y-2.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-3">
                <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6B7280] block">
                  Instant demo access (development only)
                </span>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin('student')}
                    title="Sign in as Aanya Patel (Student)"
                    className="py-2 px-1.5 border border-[#E5E7EB] hover:border-[#0A0A0A] bg-white hover:bg-[#F3F4F6] text-[#0A0A0A] text-xs font-medium transition rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer touch-target-44"
                  >
                    <GraduationCap className="w-4 h-4 text-[#0A0A0A] shrink-0" />
                    <span>Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoLogin('alumni')}
                    title="Sign in as Rushabh Sanghavi (Alumni)"
                    className="py-2 px-1.5 border border-[#E5E7EB] hover:border-[#0A0A0A] bg-white hover:bg-[#F3F4F6] text-[#0A0A0A] text-xs font-medium transition rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer touch-target-44"
                  >
                    <Briefcase className="w-4 h-4 text-[#0A0A0A] shrink-0" />
                    <span>Alumni</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoLogin('faculty')}
                    title="Sign in as Dr. Ravindra Sangale (Faculty)"
                    className="py-2 px-1.5 border border-[#E5E7EB] hover:border-[#0A0A0A] bg-white hover:bg-[#F3F4F6] text-[#0A0A0A] text-xs font-medium transition rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer touch-target-44"
                  >
                    <BookOpen className="w-4 h-4 text-[#0A0A0A] shrink-0" />
                    <span>Faculty</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoLogin('admin')}
                    title="Sign in as Dr. Sunita Rawat (Admin)"
                    className="py-2 px-1.5 border border-[#E5E7EB] hover:border-[#0A0A0A] bg-white hover:bg-[#F3F4F6] text-[#0A0A0A] text-xs font-medium transition rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer touch-target-44"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#0A0A0A] shrink-0" />
                    <span>Admin</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mode Switcher */}
            {mode !== 'verification-sent' && (
              <div className="relative flex border border-[#E5E7EB] rounded-lg p-1 bg-[#FAFAFA] text-xs font-medium isolate">
                {(['login', 'register'] as const).map(m => {
                  const isActive = mode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMode(m); setErrorMsg(null); setSuccessMsg(null); setFieldErrors({}); clearLoginError(); }}
                      className={`relative flex-1 py-2 rounded-md transition-colors duration-150 z-10 cursor-pointer touch-target-44 text-center ${
                        isActive ? 'text-white' : 'text-[#6B7280] hover:text-[#0A0A0A]'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="authModePill"
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          className="absolute inset-0 bg-[#0A0A0A] rounded-md -z-10"
                        />
                      )}
                      <span className="relative z-10">{m === 'login' ? 'Sign in' : 'Create account'}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Error & Success Alerts */}
            {mode !== 'verification-sent' && (errorMsg || loginError) && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-950 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-rose-900 mb-0.5">
                    {((errorMsg || loginError)?.toLowerCase().includes('pending admin approval') || (errorMsg || loginError)?.toLowerCase().includes('verification')) 
                      ? 'Account verification required' 
                      : 'Authentication error'}
                  </span>
                  {errorMsg || loginError}
                </div>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-emerald-900 mb-0.5">
                    Registration submitted
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
                <div className="w-14 h-14 bg-[#FAFAFA] rounded-full flex items-center justify-center mb-2 border border-[#E5E7EB]">
                  <Mail className="w-6 h-6 text-[#0A0A0A]" />
                </div>
                <h3 className="font-display font-bold text-lg text-[#0A0A0A]">
                  Verify your email
                </h3>
                <p className="text-xs text-[#6B7280] leading-relaxed max-w-sm">
                  We've sent a secure verification link to <strong className="text-[#0A0A0A]">{email}</strong>. 
                  Please check your inbox to confirm your email address.
                </p>
                <p className="text-xs text-[#6B7280] max-w-sm">
                  After verifying your email, you can sign in. Your account will still require administrative verification for full access.
                </p>
                <Button 
                  type="button"
                  variant="secondary" 
                  size="md" 
                  onClick={() => { setMode('login'); setErrorMsg(null); clearLoginError(); }} 
                  className="mt-4 w-full"
                >
                  Return to sign in
                </Button>
              </motion.div>
            ) : (
              <form noValidate onSubmit={handleSubmit} className="space-y-4 text-xs">
                <AnimatePresence mode="wait">
                  {mode === 'login' ? (
                    <motion.div
                      key="login-fields"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="space-y-3.5"
                    >
                      <TextField
                        label="Registered email"
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                      />

                      <div>
                        <PasswordField
                          label="Password"
                          required
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                        />
                        <div className="flex justify-end mt-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setShowResetModal(true);
                              setErrorMsg(null);
                              setSuccessMsg(null);
                            }}
                            className="text-xs text-[#6B7280] hover:text-[#0A0A0A] underline cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        </div>
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
                        show: { opacity: 1, transition: { staggerChildren: 0.04 } }
                      }}
                      className="space-y-3"
                    >
                      {/* User Type Selector */}
                      <motion.div variants={formFieldVariants}>
                        <label className="app-label">
                          Select account role
                        </label>
                        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg relative isolate text-xs font-medium">
                          {(['student', 'alumni', 'faculty'] as UserRole[]).map(r => {
                            const isRoleActive = role === r;
                            const label = r === 'student' ? 'Student' : r === 'alumni' ? 'Alumni' : 'Faculty';
                            return (
                              <button
                                key={r}
                                type="button"
                                onClick={() => { setRole(r); setErrorMsg(null); setFieldErrors({}); clearLoginError(); }}
                                className={`relative py-2 rounded-md transition-colors duration-150 cursor-pointer z-10 touch-target-44 text-center ${
                                  isRoleActive ? 'text-white' : 'text-[#6B7280] hover:text-[#0A0A0A]'
                                }`}
                              >
                                {isRoleActive && (
                                  <motion.div
                                    layoutId="authRolePill"
                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                    className="absolute inset-0 bg-[#0A0A0A] rounded-md -z-10"
                                  />
                                )}
                                <span className="relative z-10">{label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>

                      {role === 'admin' ? (
                        <motion.div variants={formFieldVariants} className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg">
                          <strong>Administrator accounts:</strong> Admin accounts are created directly by the institution. Please use the demo admin credentials or contact the IT cell.
                        </motion.div>
                      ) : (
                        <>
                          <motion.div variants={formFieldVariants}>
                            <TextField
                              label="Full name"
                              required
                              value={name}
                              onChange={e => { setName(e.target.value); clearFieldError('name'); }}
                              placeholder="e.g. Rahul Sharma"
                              error={fieldErrors.name}
                            />
                          </motion.div>

                          <motion.div variants={formFieldVariants} className="grid grid-cols-2 gap-3">
                            <SelectField
                              label="Department"
                              required
                              value={dept}
                              onChange={e => { setDept(e.target.value as DepartmentCode); clearFieldError('dept'); }}
                              options={[
                                { value: 'CMPN', label: 'Computer (CMPN)' },
                                { value: 'INFT', label: 'IT (INFT)' },
                                { value: 'EXCS', label: 'Electronics & CS (EXCS)' },
                                { value: 'EXTC', label: 'Telecom (EXTC)' },
                                { value: 'BIOM', label: 'Biomedical (BIOM)' }
                              ]}
                              error={fieldErrors.dept}
                            />

                            {role === 'student' && (
                              <SelectField
                                label="Current semester"
                                required
                                value={semester}
                                onChange={e => { setSemester(e.target.value); clearFieldError('semester'); }}
                                options={[
                                  { value: 'Semester 1', label: 'Semester 1 (FE)' },
                                  { value: 'Semester 2', label: 'Semester 2 (FE)' },
                                  { value: 'Semester 3', label: 'Semester 3 (SE)' },
                                  { value: 'Semester 4', label: 'Semester 4 (SE)' },
                                  { value: 'Semester 5', label: 'Semester 5 (TE)' },
                                  { value: 'Semester 6', label: 'Semester 6 (TE)' },
                                  { value: 'Semester 7', label: 'Semester 7 (BE)' },
                                  { value: 'Semester 8', label: 'Semester 8 (BE)' }
                                ]}
                                error={fieldErrors.semester}
                              />
                            )}

                            {role === 'alumni' && (
                              <TextField
                                label="Graduation year"
                                type="number"
                                required
                                value={gradYear}
                                onChange={e => { setGradYear(e.target.value); clearFieldError('gradYear'); }}
                                error={fieldErrors.gradYear}
                              />
                            )}

                            {(role === 'faculty' || role === 'teacher') && (
                              <TextField
                                label="Designation"
                                required
                                value={designation}
                                onChange={e => { setDesignation(e.target.value); clearFieldError('designation'); }}
                                placeholder="e.g. Associate Professor"
                                error={fieldErrors.designation}
                              />
                            )}
                          </motion.div>

                          <motion.div variants={formFieldVariants}>
                            <TextField
                              label={role === 'faculty' ? 'Employee ID' : 'Enrollment / PRN'}
                              required
                              value={role === 'faculty' ? employeeId : enrollmentNo}
                              onChange={e => {
                                if (role === 'faculty') {
                                  setEmployeeId(e.target.value);
                                  clearFieldError('employeeId');
                                } else {
                                  setEnrollmentNo(e.target.value);
                                  clearFieldError('enrollmentNo');
                                }
                              }}
                              placeholder={role === 'faculty' ? 'EMP-FAC-102' : '22102A0042'}
                              error={role === 'faculty' ? fieldErrors.employeeId : fieldErrors.enrollmentNo}
                            />
                          </motion.div>

                          <motion.div variants={formFieldVariants}>
                            <TextField
                              label="Email address"
                              type="email"
                              required
                              value={email}
                              onChange={e => { setEmail(e.target.value); clearFieldError('email'); }}
                              placeholder="you@example.com"
                              helperText="Use an email you will always have access to."
                              error={fieldErrors.email}
                            />
                          </motion.div>

                          <motion.div variants={formFieldVariants}>
                            <TextField
                              label="Institutional email (optional)"
                              type="email"
                              value={institutionalEmail}
                              onChange={e => setInstitutionalEmail(e.target.value)}
                              placeholder="e.g. name@student.vit.edu.in"
                              helperText="For verification reference only."
                            />
                          </motion.div>

                          {role === 'alumni' && (
                            <motion.div variants={formFieldVariants}>
                              <TextField
                                label="Current company or university"
                                required
                                value={companyOrUniv}
                                onChange={e => { setCompanyOrUniv(e.target.value); clearFieldError('companyOrUniv'); }}
                                placeholder="e.g. Google India / CMU Pittsburgh"
                                error={fieldErrors.companyOrUniv}
                              />
                            </motion.div>
                          )}

                          <motion.div variants={formFieldVariants}>
                            <FileDropzone
                              label="Verification document (optional)"
                              accept="image/*,.pdf"
                              maxSizeMB={5}
                              selectedFile={proofFile}
                              helperText="ID card, admit card, or degree certificate scan."
                              onFileSelect={async file => {
                                setProofFile(file);
                                setProofDocName(file.name);
                                try {
                                  const res = await uploadProofDocument(file, email || 'user_reg');
                                  setProofDocUrl(res.url);
                                } catch {
                                  const objUrl = URL.createObjectURL(file);
                                  setProofDocUrl(objUrl);
                                }
                              }}
                              onFileRemove={() => {
                                setProofFile(null);
                                setProofDocName('');
                                setProofDocUrl('');
                              }}
                            />
                          </motion.div>

                          <motion.div variants={formFieldVariants}>
                            <PasswordField
                              label="Password"
                              required
                              value={password}
                              onChange={e => { setPassword(e.target.value); clearFieldError('password'); }}
                              placeholder="••••••••••••"
                              error={fieldErrors.password}
                            />
                          </motion.div>
                        </>
                      )}

                      {registrationOtpStep && (
                        <motion.div variants={formFieldVariants} className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2 text-xs">
                          <span className="font-semibold text-amber-950 flex items-center gap-1.5">
                            <Mail className="w-4 h-4 text-amber-700" /> Verify email OTP
                          </span>
                          <p className="text-amber-900 text-xs">
                            Enter the 6-digit code sent to <strong>{email || 'your email'}</strong> (Demo OTP: 482910):
                          </p>
                          <input
                            type="text"
                            value={inputRegistrationOtp}
                            onChange={e => setInputRegistrationOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP..."
                            className="app-input w-full font-mono text-center tracking-widest text-sm font-semibold bg-white"
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full mt-2"
                >
                  <span>
                    {mode === 'login'
                      ? 'Sign in'
                      : registrationOtpStep
                      ? 'Confirm OTP & submit'
                      : 'Create account'}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </form>
            )}

          </motion.div>
        </div>

      </div>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset account password"
        icon={<KeyRound className="w-5 h-5 text-[#0A0A0A]" />}
      >
        <div className="space-y-4 text-xs font-sans">
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
            <p className="text-[#6B7280]">
              Enter your registered email address. We will send a secure password reset link to your inbox.
            </p>

            <TextField
              label="Account email"
              type="email"
              required
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              placeholder="e.g. aanya.patel@student.vit.edu.in"
            />

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
                Send reset link
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
