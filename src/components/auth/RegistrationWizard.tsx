import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { StepIndicator } from './StepIndicator';
import { RoleRadioGroup } from './RoleRadioGroup';
import { FormField } from './FormField';
import { TextInput } from './TextInput';
import { PasswordField } from './PasswordField';
import { Combobox } from './Combobox';
import { OtpInput } from './OtpInput';
import { ProofUploader } from './ProofUploader';
import { InlineAlert } from './InlineAlert';
import { SelectInput, type SelectOption } from './SelectInput';
import { DEPARTMENTS } from '../../data/constants';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import type { DepartmentCode, UserRole } from '../../types';

export interface RegistrationWizardProps {
  onSwitchToSignIn: () => void;
  onRegistrationComplete: () => void;
  className?: string;
}

const DRAFT_STORAGE_KEY = 'nexalink_registration_draft_v1';

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'student', label: 'Student — Currently enrolled at VIT Wadala' },
  { value: 'alumni', label: 'Alumni — Graduated from VIT Wadala' },
  { value: 'faculty', label: 'Faculty — Teaching or research staff at VIT Wadala' }
];

const SEMESTER_OPTIONS: SelectOption[] = [
  { value: 'Semester 1', label: 'Semester 1' },
  { value: 'Semester 2', label: 'Semester 2' },
  { value: 'Semester 3', label: 'Semester 3' },
  { value: 'Semester 4', label: 'Semester 4' },
  { value: 'Semester 5', label: 'Semester 5' },
  { value: 'Semester 6', label: 'Semester 6' },
  { value: 'Semester 7', label: 'Semester 7' },
  { value: 'Semester 8', label: 'Semester 8' }
];

export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({
  onSwitchToSignIn,
  onRegistrationComplete,
  className = ''
}) => {
  const { register } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  // Wizard Step: 1, 2, or 3
  const [step, setStep] = useState<number>(1);
  const [direction, setDirection] = useState<number>(1);

  // Step 1: Profile state
  const [role, setRole] = useState<'student' | 'alumni' | 'faculty'>('student');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState<string>('CMPN');
  const [prn, setPrn] = useState('');
  const [semester, setSemester] = useState('Semester 6');
  const [gradYear, setGradYear] = useState('2023');
  const [organization, setOrganization] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  // Step 2: Account state (NEVER store password in sessionStorage)
  const [email, setEmail] = useState('');
  const [personalRecoveryEmail, setPersonalRecoveryEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);

  // Step 3: Verification tasks
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [recoveryEmailVerified, setRecoveryEmailVerified] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadedDocName, setUploadedDocName] = useState<string>('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Status & Errors
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  // Restore non-sensitive draft on mount (try/catch for private browsing)
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.role) setRole(parsed.role);
        if (parsed.name) setName(parsed.name);
        if (parsed.department) setDepartment(parsed.department);
        if (parsed.prn) setPrn(parsed.prn);
        if (parsed.semester) setSemester(parsed.semester);
        if (parsed.gradYear) setGradYear(parsed.gradYear);
        if (parsed.organization) setOrganization(parsed.organization);
        if (parsed.employeeId) setEmployeeId(parsed.employeeId);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.personalRecoveryEmail) setPersonalRecoveryEmail(parsed.personalRecoveryEmail);
      }
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  // Save non-sensitive draft on change (NEVER password)
  useEffect(() => {
    try {
      const draftData = {
        role,
        name,
        department,
        prn,
        semester,
        gradYear,
        organization,
        employeeId,
        email,
        personalRecoveryEmail
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
    } catch {
      // ignore
    }
  }, [role, name, department, prn, semester, gradYear, organization, employeeId, email, personalRecoveryEmail]);

  // Focus step heading on change for accessibility
  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [step]);

  const departmentOptions = DEPARTMENTS.map((d) => ({
    value: d.code,
    label: d.name,
    code: d.code
  }));

  // Step 1 validation
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full legal name is required.';
    if (!department) errs.department = 'Please select your department.';

    if (role === 'student') {
      if (!prn.trim()) {
        errs.prn = 'PRN is required for student verification.';
      } else if (prn.trim().length < 6) {
        errs.prn = 'PRN must be at least 6 characters.';
      }
    } else if (role === 'faculty') {
      if (!employeeId.trim()) {
        errs.employeeId = 'Employee ID is required for faculty verification.';
      }
    } else if (role === 'alumni') {
      if (!gradYear.trim()) {
        errs.gradYear = 'Graduation year is required.';
      }
    }

    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 2 validation
  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address.';
    } else if (role === 'student') {
      if (!trimmedEmail.endsWith('@student.vit.edu.in') && !trimmedEmail.endsWith('@vit.edu.in')) {
        errs.email = 'Students register with their @student.vit.edu.in address.';
      }
    } else if (role === 'faculty') {
      if (!trimmedEmail.endsWith('@vit.edu.in')) {
        errs.email = 'Faculty register with their @vit.edu.in address.';
      }
    } else if (role === 'alumni') {
      if (trimmedEmail.endsWith('@vit.edu.in') || trimmedEmail.endsWith('@student.vit.edu.in')) {
        errs.email = 'Alumni must use a personal email (college mail deactivates after graduation).';
      }
    }

    // Student personal recovery email requirement
    if (role === 'student') {
      const trimmedRec = personalRecoveryEmail.trim().toLowerCase();
      if (!trimmedRec) {
        errs.personalRecoveryEmail = 'Personal recovery email is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedRec)) {
        errs.personalRecoveryEmail = 'Please enter a valid personal email.';
      } else if (trimmedRec === trimmedEmail) {
        errs.personalRecoveryEmail = 'Recovery email cannot be your college email.';
      }
    }

    // Password validation
    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 10) {
      errs.password = 'Password must be at least 10 characters.';
    }

    // Consent checkbox
    if (!consentAccepted) {
      errs.consent = 'You must agree to the Terms of Service and Privacy Policy to continue.';
    }

    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinueFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setDirection(1);
      setStep(2);
    }
  };

  const handleContinueFromStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setServerError(null);
    // Transition to Step 3 (Verify and submit)
    setDirection(1);
    setStep(3);
  };

  // Step 3 file upload
  const handleProofSelect = async (file: File) => {
    setProofFile(file);
    setIsUploadingDoc(true);
    setUploadProgress(20);

    // Simulate smooth progress upload
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 25;
      });
    }, 150);

    try {
      const res = await authService.submitProofDocument(file, 'current-user');
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadedDocName(file.name);
    } catch {
      clearInterval(progressInterval);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Step 3 recovery OTP verify
  const handleVerifyOtp = async (code: string) => {
    try {
      const res = await authService.verifyRecoveryOtp(code);
      if (res.ok) {
        setRecoveryEmailVerified(true);
      }
    } catch {
      // ignore
    }
  };

  // Final Submit for Review
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        department,
        role,
        personalEmail: role === 'student' ? personalRecoveryEmail.trim().toLowerCase() : email.trim().toLowerCase(),
        proofDocumentName: uploadedDocName || proofFile?.name || 'college_id.pdf'
      };

      if (role === 'student') {
        payload.enrollmentNo = prn.trim().toUpperCase();
        payload.currentYear = semester;
      } else if (role === 'faculty') {
        payload.employeeId = employeeId.trim().toUpperCase();
      } else if (role === 'alumni') {
        payload.graduationYear = parseInt(gradYear, 10) || 2023;
        payload.company = organization.trim();
      }

      const res = await register(payload, role as UserRole);

      if (!res.success) {
        setServerError(res.message || 'Registration failed.');
        setIsSubmitting(false);
        return;
      }

      // Clear draft on successful completion
      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // ignore
      }
      onRegistrationComplete();
    } catch (err: any) {
      setServerError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStep3Ready = recoveryEmailVerified && (Boolean(proofFile) || Boolean(uploadedDocName));

  return (
    <div className={`w-full flex flex-col gap-6 ${className}`}>
      {/* Polite live region for screen readers */}
      <div className="sr-only" aria-live="polite">
        Step {step} of 3: {step === 1 ? 'Profile' : step === 2 ? 'Account' : 'Verify and submit'}
      </div>

      {/* Top Header */}
      <div className="flex flex-col gap-3">
        {/* Back Button on steps 2 and 3 */}
        {step > 1 && (
          <div>
            <button
              type="button"
              onClick={() => {
                setDirection(-1);
                setStep((prev) => prev - 1);
              }}
              className="text-xs text-[#6B7280] hover:text-[#0A0A0A] inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] rounded p-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          </div>
        )}

        <h1
          ref={stepHeadingRef}
          tabIndex={-1}
          className="text-2xl sm:text-3xl font-serif font-normal text-[#0A0A0A] tracking-tight leading-tight outline-none focus:outline-none focus:ring-0"
        >
          Create your account
        </h1>

        {/* Layout-animated Step Indicator */}
        <StepIndicator currentStep={step} />
      </div>

      {/* Server Error Alert */}
      {serverError && (
        <InlineAlert
          tone="rose"
          message={
            <span>
              {serverError}{' '}
              {serverError.includes('already registered') && (
                <button
                  type="button"
                  onClick={onSwitchToSignIn}
                  className="underline font-medium hover:text-[#0A0A0A]"
                >
                  Sign in instead
                </button>
              )}
            </span>
          }
        />
      )}

      {/* Animated Step Container */}
      <div className="w-full">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.form
              key="step-1"
              custom={direction}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: direction * 24 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -direction * 24 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={handleContinueFromStep1}
              className="flex flex-col gap-4"
              noValidate
            >
              {/* Role Dropdown */}
              <FormField
                id="reg-role"
                label="Select your role"
                required
              >
                <SelectInput
                  id="reg-role"
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value as 'student' | 'alumni' | 'faculty');
                    setStepErrors({});
                  }}
                  options={ROLE_OPTIONS}
                />
              </FormField>

              {/* Full Legal Name */}
              <FormField
                id="reg-name"
                label="Full legal name"
                hint="As it appears on your official institutional documents."
                error={stepErrors.name}
                required
              >
                <TextInput
                  id="reg-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (stepErrors.name) setStepErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="e.g. Aarav Sharma"
                  autoComplete="name"
                  isInvalid={Boolean(stepErrors.name)}
                />
              </FormField>

              {/* Department Combobox */}
              <FormField
                id="reg-dept"
                label="Department"
                error={stepErrors.department}
                required
              >
                <Combobox
                  id="reg-dept"
                  options={departmentOptions}
                  value={department}
                  onChange={(val) => {
                    setDepartment(val);
                    if (stepErrors.department) setStepErrors((prev) => ({ ...prev, department: '' }));
                  }}
                  placeholder="Select department"
                  isInvalid={Boolean(stepErrors.department)}
                />
              </FormField>

              {/* Student Role Fields */}
              {role === 'student' && (
                <>
                  <FormField
                    id="reg-prn"
                    label="PRN"
                    hint="Your Permanent Registration Number (e.g. 24108B0033)."
                    error={stepErrors.prn}
                    required
                  >
                    <TextInput
                      id="reg-prn"
                      value={prn}
                      onChange={(e) => {
                        setPrn(e.target.value.toUpperCase());
                        if (stepErrors.prn) setStepErrors((prev) => ({ ...prev, prn: '' }));
                      }}
                      placeholder="e.g. 24108B0033"
                      className="font-mono"
                      autoCapitalize="characters"
                      isInvalid={Boolean(stepErrors.prn)}
                    />
                  </FormField>

                  <FormField id="reg-sem" label="Current semester">
                    <SelectInput
                      id="reg-sem"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      options={SEMESTER_OPTIONS}
                    />
                  </FormField>
                </>
              )}

              {/* Faculty Role Fields */}
              {role === 'faculty' && (
                <FormField
                  id="reg-empid"
                  label="Employee ID"
                  hint="Institutional staff / faculty identification number."
                  error={stepErrors.employeeId}
                  required
                >
                  <TextInput
                    id="reg-empid"
                    value={employeeId}
                    onChange={(e) => {
                      setEmployeeId(e.target.value.toUpperCase());
                      if (stepErrors.employeeId) setStepErrors((prev) => ({ ...prev, employeeId: '' }));
                    }}
                    placeholder="e.g. EMP-9421"
                    className="font-mono"
                    autoCapitalize="characters"
                    isInvalid={Boolean(stepErrors.employeeId)}
                  />
                </FormField>
              )}

              {/* Alumni Role Fields */}
              {role === 'alumni' && (
                <>
                  <FormField
                    id="reg-gradyear"
                    label="Graduation year"
                    error={stepErrors.gradYear}
                    required
                  >
                    <TextInput
                      id="reg-gradyear"
                      value={gradYear}
                      onChange={(e) => {
                        setGradYear(e.target.value);
                        if (stepErrors.gradYear) setStepErrors((prev) => ({ ...prev, gradYear: '' }));
                      }}
                      placeholder="e.g. 2022"
                      type="number"
                      isInvalid={Boolean(stepErrors.gradYear)}
                    />
                  </FormField>

                  <FormField
                    id="reg-org"
                    label="Current organization (optional)"
                    hint="Your current company or higher education institution."
                  >
                    <TextInput
                      id="reg-org"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. Google, Tata Consultancy, etc."
                    />
                  </FormField>
                </>
              )}

              {/* Continue to Step 2 Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-12 rounded-lg bg-[#0A0A0A] text-[#FFFFFF] text-sm font-medium hover:bg-[#262626] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </button>
              </div>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form
              key="step-2"
              custom={direction}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: direction * 24 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -direction * 24 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={handleContinueFromStep2}
              className="flex flex-col gap-4"
              noValidate
            >
              {/* Role-Aware Institutional Email */}
              <FormField
                id="reg-email"
                label={role === 'alumni' ? 'Primary email address' : 'Institutional email address'}
                hint={
                  role === 'student'
                    ? 'Students must register with their @student.vit.edu.in address.'
                    : role === 'faculty'
                    ? 'Faculty must register with their @vit.edu.in address.'
                    : 'Alumni register with their personal email address.'
                }
                error={stepErrors.email}
                required
              >
                <TextInput
                  id="reg-email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  placeholder={
                    role === 'student'
                      ? 'yourname@student.vit.edu.in'
                      : role === 'faculty'
                      ? 'yourname@vit.edu.in'
                      : 'personal.email@example.com'
                  }
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (stepErrors.email) setStepErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  isInvalid={Boolean(stepErrors.email)}
                  disabled={isSubmitting}
                />
              </FormField>

              {/* Personal Recovery Email (Students Only - Required) */}
              {role === 'student' && (
                <FormField
                  id="reg-rec-email"
                  label="Personal recovery email"
                  hint="College email stops working after you graduate. We use this to keep your account reachable."
                  error={stepErrors.personalRecoveryEmail}
                  required
                >
                  <TextInput
                    id="reg-rec-email"
                    type="email"
                    inputMode="email"
                    placeholder="e.g. personal.name@gmail.com"
                    value={personalRecoveryEmail}
                    onChange={(e) => {
                      setPersonalRecoveryEmail(e.target.value);
                      if (stepErrors.personalRecoveryEmail) {
                        setStepErrors((prev) => ({ ...prev, personalRecoveryEmail: '' }));
                      }
                    }}
                    isInvalid={Boolean(stepErrors.personalRecoveryEmail)}
                    disabled={isSubmitting}
                  />
                </FormField>
              )}

              {/* Password */}
              <FormField
                id="reg-password"
                label="Password"
                hint="Minimum 10 characters."
                error={stepErrors.password}
                required
              >
                <PasswordField
                  id="reg-password"
                  autoComplete="new-password"
                  placeholder="Create a password (min. 10 characters)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (stepErrors.password) setStepErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  showStrength
                  isInvalid={Boolean(stepErrors.password)}
                  disabled={isSubmitting}
                />
              </FormField>

              {/* Consent Notice aligned with India DPDP Act */}
              <div className="flex flex-col gap-1 pt-1">
                <label className="flex items-start gap-2.5 text-xs text-[#0A0A0A] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={(e) => {
                      setConsentAccepted(e.target.checked);
                      if (stepErrors.consent) setStepErrors((prev) => ({ ...prev, consent: '' }));
                    }}
                    className="w-4 h-4 rounded border-[#6B7280] text-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A] mt-0.5 shrink-0"
                  />
                  <span>
                    I agree to the{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium hover:text-[#0A0A0A]"
                    >
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium hover:text-[#0A0A0A]"
                    >
                      Privacy Policy
                    </a>.
                  </span>
                </label>

                <p className="text-[11px] text-[#6B7280] pl-6 leading-relaxed">
                  Your information is processed in accordance with the Digital Personal Data Protection Act (DPDP) and institutional governance rules.
                </p>

                {stepErrors.consent && (
                  <p className="text-xs text-[#DC2626] font-medium pl-6 pt-0.5" role="alert">
                    {stepErrors.consent}
                  </p>
                )}
              </div>

              {/* Create Account Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="w-full h-12 rounded-lg bg-[#0A0A0A] text-[#FFFFFF] text-sm font-medium hover:bg-[#262626] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2 disabled:bg-[#FAFAFA] disabled:text-[#6B7280] disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to verification</span>
                      <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              custom={direction}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: direction * 24 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -direction * 24 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-medium text-[#0A0A0A]">
                  Verify and submit
                </h2>
                <p className="text-xs text-[#6B7280]">
                  Complete both tasks below to submit your registration for administrator verification.
                </p>
              </div>

              {/* Task 1: Verify Recovery Email */}
              <div className="p-4 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#0A0A0A] flex items-center gap-2">
                    <span>1. Verify {role === 'student' ? 'recovery' : 'login'} email</span>
                  </span>
                  {recoveryEmailVerified && (
                    <span className="text-xs text-[#059669] font-medium inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>

                <OtpInput
                  value={recoveryOtp}
                  onChange={setRecoveryOtp}
                  onComplete={handleVerifyOtp}
                  isVerified={recoveryEmailVerified}
                  emailDestination={role === 'student' ? personalRecoveryEmail : email}
                />
              </div>

              {/* Task 2: Upload Proof Document */}
              <div className="p-4 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#0A0A0A]">
                    2. Institutional proof document
                  </span>
                  {(proofFile || uploadedDocName) && (
                    <span className="text-xs text-[#059669] font-medium inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Uploaded</span>
                    </span>
                  )}
                </div>

                <ProofUploader
                  role={role}
                  onFileSelect={handleProofSelect}
                  onFileRemove={() => {
                    setProofFile(null);
                    setUploadedDocName('');
                  }}
                  isUploading={isUploadingDoc}
                  uploadProgress={uploadProgress}
                  uploadedFileName={uploadedDocName}
                />
              </div>

              {/* Submit for Review Action */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={!isStep3Ready}
                  className="w-full h-12 rounded-lg bg-[#0A0A0A] text-[#FFFFFF] text-sm font-medium hover:bg-[#262626] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-2 disabled:bg-[#FAFAFA] disabled:text-[#6B7280] disabled:border disabled:border-[#E5E7EB] disabled:cursor-not-allowed"
                >
                  <span>Submit for review</span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </button>

                {!isStep3Ready && (
                  <p className="text-xs text-[#6B7280] text-center">
                    Verify your recovery email and add a proof document to submit.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Switch to Sign In Link */}
      <div className="text-center pt-2">
        <p className="text-xs text-[#6B7280]">
          Already registered?{' '}
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="text-[#0A0A0A] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] rounded p-0.5"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
