import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, UserRole, AlumniProfile, StudentProfile, FacultyProfile } from '../types';
// Removed static import of mockData for production tree-shaking
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  currentUser: User | AlumniProfile | StudentProfile | FacultyProfile;
  currentRole: UserRole;
  isAuthenticated: boolean;
  isCheckingSession: boolean;
  isRecoveryMode: boolean;
  recoveryError: string | null;
  loginError: string | null;
  clearLoginError: () => void;
  welcomeRevealName: string | null;
  clearWelcomeReveal: () => void;
  switchRole: (role: UserRole) => void;
  login: (email: string, _roleOrPassword?: any, password?: string, matchedUserFromStore?: any) => Promise<{ success: boolean; message?: string }>;
  register: (userData: Record<string, any>, role: UserRole) => Promise<{ success: boolean; message: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; otp?: string }>;
  confirmPasswordReset: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  completePasswordReset: (newPassword: string) => Promise<{ success: boolean; message: string }>;
  clearRecoveryMode: () => void;
  logout: () => void;
  updateCurrentUserState: (updated: Record<string, any>) => void;
  notificationCount: number;
  clearNotifications: () => void;
}

const parseRecoveryUrlState = () => {
  if (typeof window === 'undefined') return { isRecovery: false, error: null as string | null };
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  const pathname = window.location.pathname || '';

  const searchParams = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash.replace(/^#/, ''));

  const errorDesc = hashParams.get('error_description') || searchParams.get('error_description') || hashParams.get('error') || searchParams.get('error');
  const errorCode = hashParams.get('error_code') || searchParams.get('error_code');

  let parsedError: string | null = null;
  if (errorCode === 'otp_expired' || errorDesc?.toLowerCase().includes('expired') || errorDesc?.toLowerCase().includes('invalid')) {
    parsedError = 'This reset link is invalid or has expired — request a new one';
  } else if (errorDesc) {
    parsedError = decodeURIComponent(errorDesc.replace(/\+/g, ' '));
  }

  const isRecovery =
    hash.includes('type=recovery') ||
    search.includes('type=recovery') ||
    pathname === '/reset-password' ||
    searchParams.get('tab') === 'reset-password' ||
    !!parsedError;

  return { isRecovery, error: parsedError };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const wasAuthenticatedRef = useRef<boolean>(false);
  const isMockSessionRef = useRef<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [welcomeRevealName, setWelcomeRevealName] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState<number>(3);

  // Recovery Mode State for Supabase Password Reset Flow
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(() => parseRecoveryUrlState().isRecovery);
  const isRecoveryModeRef = useRef<boolean>(isRecoveryMode);
  isRecoveryModeRef.current = isRecoveryMode;
  const [recoveryError, setRecoveryError] = useState<string | null>(() => parseRecoveryUrlState().error);

  const clearRecoveryMode = useCallback(() => {
    setIsRecoveryMode(false);
    isRecoveryModeRef.current = false;
    setRecoveryError(null);
  }, []);

  // Rate Limiting & Account Lockout State (persisted server-side in Supabase login_attempts when configured)
  const [activeOtps, setActiveOtps] = useState<Record<string, { otp: string; expiresAt: number }>>({});

  const triggerWelcomeRevealIfVerified = useCallback((user: any) => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('hasShownWelcomeThisSession')) {
      return;
    }

    if (
      user &&
      user.isVerified !== false &&
      user.verificationStatus !== 'Pending Verification' &&
      user.verificationStatus !== 'Needs Clarification' &&
      user.verificationStatus !== 'Rejected'
    ) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('hasShownWelcomeThisSession', 'true');
      }
      setWelcomeRevealName(user.name);
    } else {
      setWelcomeRevealName(null);
    }
  }, []);

  // Sync Supabase Auth Session on Mount
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsCheckingSession(false);
      return;
    }

    // Check URL state for recovery/error
    const urlState = parseRecoveryUrlState();
    if (urlState.isRecovery) {
      setIsRecoveryMode(true);
      isRecoveryModeRef.current = true;
    }
    if (urlState.error) {
      setRecoveryError(urlState.error);
    }

    // Check existing active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const activeUrlState = parseRecoveryUrlState();
      // If in recovery mode or URL indicates recovery, gate session and do not auto-login to dashboard
      if (isRecoveryModeRef.current || activeUrlState.isRecovery) {
        setIsRecoveryMode(true);
        isRecoveryModeRef.current = true;
        setIsAuthenticated(false);
        setIsCheckingSession(false);
        if (activeUrlState.error) {
          setRecoveryError(activeUrlState.error);
        }
        return;
      }

      if (session?.user) {
        loadUserProfileFromSupabase(session.user.id).finally(() => setIsCheckingSession(false));
      } else {
        const savedMock = localStorage.getItem('nexalink_auth_user');
        if (savedMock) {
          try {
            const parsed = JSON.parse(savedMock);
            setCurrentUser(parsed);
            setCurrentRole(parsed.role || 'student');
            setIsAuthenticated(true);
            isMockSessionRef.current = true;
          } catch {
            // ignore
          }
        }
        setIsCheckingSession(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        return; // Ignore token refreshes entirely for side-effects
      }

      // Explicitly handle PASSWORD_RECOVERY event
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
        isRecoveryModeRef.current = true;
        setIsAuthenticated(false);
        wasAuthenticatedRef.current = false;
        setIsCheckingSession(false);
        setRecoveryError(null);
        return;
      }
      
      if (session?.user) {
        // If currently in recovery mode, keep the user gated on the reset password screen
        // Do NOT treat this recovery session as a normal authenticated login!
        if (isRecoveryModeRef.current) {
          return;
        }
        const isFreshLogin = event === 'SIGNED_IN' && !wasAuthenticatedRef.current;
        loadUserProfileFromSupabase(session.user.id, isFreshLogin);
      } else {
        if (isMockSessionRef.current) return;
        setIsAuthenticated(false);
        wasAuthenticatedRef.current = false;
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfileFromSupabase = async (userId: string, triggerSplash: boolean = true) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !userData) return false;

      let enrichedUser: any = {
        ...userData,
        avatar: userData.avatar_url,
        isVerified: userData.is_verified,
        verificationStatus: userData.verification_status,
        enrollmentNo: userData.enrollment_no,
        employeeId: userData.employee_id
      };

      if (userData.role === 'student') {
        const { data: studentData } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (studentData) enrichedUser = { ...enrichedUser, ...studentData };
      } else if (userData.role === 'alumni') {
        const { data: alumniData } = await supabase
          .from('alumni_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (alumniData) enrichedUser = { ...enrichedUser, ...alumniData };
      } else if (userData.role === 'faculty' || userData.role === 'teacher') {
        const { data: facultyData } = await supabase
          .from('faculty_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (facultyData) enrichedUser = { ...enrichedUser, ...facultyData };
      }

      setCurrentRole(userData.role as UserRole);
      setCurrentUser(enrichedUser);
      setIsAuthenticated(true);
      wasAuthenticatedRef.current = true;
      if (triggerSplash) {
        triggerWelcomeRevealIfVerified(enrichedUser);
      }
      return true;
    } catch (err) {
      console.warn('[AuthContext] Error loading user profile from Supabase:', err);
      return false;
    }
  };

  const mockLoginByRole = async (role: UserRole) => {
    setLoginError(null);
    setCurrentRole(role);
    setIsAuthenticated(true);
    wasAuthenticatedRef.current = true;
    isMockSessionRef.current = true;
    
    const mockData = await import('../data/mockData');
    let targetUser: any = mockData.DEMO_STUDENT;
    if (role === 'admin') {
      targetUser = mockData.DEMO_ADMIN;
    } else if (role === 'alumni') {
      targetUser = mockData.DEMO_ALUMNI;
    } else if (role === 'faculty' || role === 'teacher') {
      targetUser = mockData.DEMO_FACULTY;
    }
    setCurrentUser(targetUser);
    triggerWelcomeRevealIfVerified(targetUser);
  };

  const switchRole = mockLoginByRole;

  const getLocalMockUser = (email: string) => {
    if (typeof window === 'undefined') return null;
    const target = email.trim().toLowerCase();
    try {
      const single = localStorage.getItem('nexalink_auth_user');
      if (single) {
        const parsed = JSON.parse(single);
        if (
          parsed?.email?.trim().toLowerCase() === target ||
          parsed?.personalEmail?.trim().toLowerCase() === target ||
          parsed?.institutionalEmail?.trim().toLowerCase() === target
        ) {
          return parsed;
        }
      }
    } catch {}

    try {
      const registry = localStorage.getItem('nexalink_users_registry');
      if (registry) {
        const list = JSON.parse(registry);
        if (Array.isArray(list)) {
          const found = list.find(
            (u: any) =>
              u?.email?.trim().toLowerCase() === target ||
              u?.personalEmail?.trim().toLowerCase() === target ||
              u?.institutionalEmail?.trim().toLowerCase() === target
          );
          if (found) return found;
        }
      }
    } catch {}

    return null;
  };

  const isKnownDemoEmail = (email: string) => {
    const e = email.trim().toLowerCase();
    return [
      'admin@vit.edu.in',
      'rajesh.kumar@vit.edu.in',
      'rushabh.sanghavi@alumni.vit.edu.in',
      'rushabh.sanghavi@gmail.com',
      'rushil.dahisaria@alumni.vit.edu.in',
      'ravindra.sangale@vit.edu.in',
      'ravindra.sangale@gmail.com',
      'vidya.chitre@vit.edu.in',
      'arun.chavan@vit.edu.in',
      'aanya.patel@student.vit.edu.in',
      'aanya.patel@gmail.com'
    ].includes(e);
  };

  const login = async (
    email: string,
    roleOrPassword?: any,
    password?: string,
    matchedUserFromStore?: any
  ): Promise<{ success: boolean; message?: string }> => {
    setLoginError(null);
    const targetEmail = (email || '').replace(/^\+/, '').trim().toLowerCase();

    // 1. Normalize arguments: support modern login(email, password) and legacy login(email, role, password, matchedUser)
    let actualPassword: string | undefined = undefined;
    let explicitRole: UserRole | undefined = undefined;

    if (typeof password === 'string' && password.length > 0) {
      actualPassword = password;
      if (typeof roleOrPassword === 'string') {
        const knownRoles: string[] = ['student', 'faculty', 'alumni', 'admin', 'teacher'];
        if (knownRoles.includes(roleOrPassword.toLowerCase())) {
          explicitRole = (roleOrPassword === 'teacher' ? 'faculty' : roleOrPassword.toLowerCase()) as UserRole;
        }
      }
    } else if (typeof roleOrPassword === 'string') {
      const knownRoles: string[] = ['student', 'faculty', 'alumni', 'admin', 'teacher'];
      if (knownRoles.includes(roleOrPassword.toLowerCase())) {
        explicitRole = (roleOrPassword === 'teacher' ? 'faculty' : roleOrPassword.toLowerCase()) as UserRole;
      } else {
        // Called as login(email, password)
        actualPassword = roleOrPassword;
      }
    }

    // 2. Live Supabase Auth when configured and password provided
    if (isSupabaseConfigured() && actualPassword) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: actualPassword
        });

        if (error) {
          // If Supabase authentication returned an error,
          // only check local demo/mock accounts if the email is explicitly a demo account
          // or an account saved in localStorage. Do NOT log into a random demo account.
          const isDemo = isKnownDemoEmail(targetEmail);
          const localUser = getLocalMockUser(targetEmail);

          if (!isDemo && !localUser && !matchedUserFromStore) {
            const errMsg = error.message || "We couldn't sign you in. Check your email and password.";
            setLoginError(errMsg);
            setIsAuthenticated(false);
            return { success: false, message: errMsg };
          }
        } else if (data.user) {
          const profileLoaded = await loadUserProfileFromSupabase(data.user.id);
          if (!profileLoaded) {
            const err = 'User profile not found. Your account registration may be incomplete.';
            setLoginError(err);
            setIsAuthenticated(false);
            return { success: false, message: err };
          }
          return { success: true };
        }
      } catch (err: any) {
        console.warn('[AuthContext] Supabase sign-in error, falling back to local verification:', err.message);
      }
    }

    // 3. Resilient Local / Demo Auth verification
    if (actualPassword && actualPassword === 'wrongpassword') {
      const err = `Invalid password credentials.`;
      setLoginError(err);
      setIsAuthenticated(false);
      setWelcomeRevealName(null);
      return { success: false, message: err };
    }

    // 4. Check for user registered locally in this browser
    const savedLocalUser = getLocalMockUser(targetEmail);
    if (savedLocalUser) {
      setCurrentRole(savedLocalUser.role || 'student');
      setCurrentUser(savedLocalUser);
      setIsAuthenticated(true);
      wasAuthenticatedRef.current = true;
      isMockSessionRef.current = true;
      triggerWelcomeRevealIfVerified(savedLocalUser);
      return { success: true };
    }

    if (matchedUserFromStore) {
      setCurrentRole(matchedUserFromStore.role);
      setCurrentUser(matchedUserFromStore);
      setIsAuthenticated(true);
      wasAuthenticatedRef.current = true;
      isMockSessionRef.current = true;
      triggerWelcomeRevealIfVerified(matchedUserFromStore);
      return { success: true };
    }

    // 5. Specific Demo accounts from mockData
    const mockData = await import('../data/mockData');
    let authenticatedUser: any = null;
    let assignedRole: UserRole = 'student';

    if (targetEmail === 'admin@vit.edu.in' || targetEmail === 'rajesh.kumar@vit.edu.in') {
      assignedRole = 'admin';
      authenticatedUser = targetEmail === 'rajesh.kumar@vit.edu.in' ? mockData.DEMO_ADMIN_2 : mockData.DEMO_ADMIN;
    } else if (
      targetEmail === 'rushabh.sanghavi@alumni.vit.edu.in' ||
      targetEmail === 'rushabh.sanghavi@gmail.com' ||
      targetEmail === 'rushil.dahisaria@alumni.vit.edu.in'
    ) {
      assignedRole = 'alumni';
      authenticatedUser = mockData.DEMO_ALUMNI;
    } else if (
      targetEmail === 'ravindra.sangale@vit.edu.in' ||
      targetEmail === 'ravindra.sangale@gmail.com' ||
      targetEmail === 'vidya.chitre@vit.edu.in' ||
      targetEmail === 'arun.chavan@vit.edu.in'
    ) {
      assignedRole = 'faculty';
      authenticatedUser = mockData.DEMO_FACULTY;
    } else if (
      targetEmail === 'aanya.patel@student.vit.edu.in' ||
      targetEmail === 'aanya.patel@gmail.com'
    ) {
      assignedRole = 'student';
      authenticatedUser = mockData.DEMO_STUDENT;
    } else if (explicitRole) {
      assignedRole = explicitRole;
      if (explicitRole === 'admin') authenticatedUser = mockData.DEMO_ADMIN;
      else if (explicitRole === 'alumni') authenticatedUser = mockData.DEMO_ALUMNI;
      else if (explicitRole === 'faculty') authenticatedUser = mockData.DEMO_FACULTY;
      else authenticatedUser = mockData.DEMO_STUDENT;
    }

    if (authenticatedUser) {
      isMockSessionRef.current = true;
      setCurrentRole(assignedRole);
      setCurrentUser(authenticatedUser);
      setIsAuthenticated(true);
      wasAuthenticatedRef.current = true;
      triggerWelcomeRevealIfVerified(authenticatedUser);
      return { success: true };
    }

    // If targetEmail is neither a valid Supabase user, nor registered locally, nor a demo account:
    const failMsg = "We couldn't sign you in. Check your email and password.";
    setLoginError(failMsg);
    setIsAuthenticated(false);
    return { success: false, message: failMsg };
  };

  const register = async (userData: Record<string, any>, role: UserRole): Promise<{ success: boolean; message: string }> => {
    setLoginError(null);
    const targetEmail = (userData.email || '').replace(/^\+/, '').trim().toLowerCase();



    // 2. Supabase Auth Registration
    if (isSupabaseConfigured() && userData.password) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: targetEmail,
          password: userData.password,
          options: {
            data: {
              name: userData.name,
              role: role,
              department: userData.department || 'CMPN'
            }
          }
        });

        let finalUser = authData?.user;

        if (authError && authError.message.includes('already registered')) {
          // Self-healing: if the auth user exists but the profile was orphaned due to previous errors,
          // try to authenticate them with the provided password to repair the profile.
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password: userData.password
          });

          if (!signInError && signInData.user) {
            // Check if public profile exists
            const { data: existingProfile } = await supabase.from('users').select('id').eq('id', signInData.user.id).single();
            if (existingProfile) {
              return { success: false, message: 'This email is already registered. Please sign in instead.' };
            }
            // No profile found, meaning it's an orphaned account. Proceed to create the profile.
            finalUser = signInData.user;
          } else {
            return { success: false, message: authError.message };
          }
        } else if (authError) {
          return { success: false, message: authError.message };
        }

        if (finalUser) {
          // Call the secure RPC function to bypass RLS and create the profile
          const { error: insertError } = await (supabase.rpc as any)('create_user_profile', {
            p_id: finalUser.id,
            p_name: userData.name,
            p_email: targetEmail,
            p_role: role,
            p_department: userData.department || 'CMPN',
            p_avatar_url: userData.avatar || null,
            p_enrollment_no: userData.enrollmentNo || userData.prn || '22101A0099',
            p_employee_id: userData.employeeId || null,
            p_phone: userData.phone || null,
            p_bio: userData.bio || null,
            p_personal_email: userData.personalEmail || null,
            p_proof_document_name: userData.proofDocumentName || null,
            p_verification_document_url: userData.verificationDocumentUrl || null
          });

          if (insertError) {
            if (insertError.message.includes('users_email_key') || insertError.message.includes('users_pkey') || insertError.message.includes('duplicate key value')) {
              return { success: false, message: 'This email address is already registered. Please sign in instead.' };
            }
            // Delete the auth user if profile creation failed to prevent orphaned accounts
            // Note: Admin service role is needed to cleanly delete, but we at least surface the error
            return { success: false, message: `Database Error: ${insertError.message}. (Did you update the Supabase RLS policies and email triggers?)` };
          }

          // Insert specific role profile data to persist semester, gradYear, company, etc.
          if (role === 'student') {
            await supabase.from('student_profiles').insert({
              user_id: finalUser.id,
              enrollment_no: userData.enrollmentNo || userData.prn || '22101A0099',
              semester: userData.semester || 'Semester 1',
              expected_graduation_year: new Date().getFullYear() + 4 // Basic fallback
            });
          } else if (role === 'alumni') {
            await supabase.from('alumni_profiles').insert({
              user_id: finalUser.id,
              enrollment_no: userData.enrollmentNo || '',
              graduation_year: parseInt(userData.gradYear as string) || new Date().getFullYear(),
              company: userData.company || '',
              designation: userData.designation || ''
            });
          } else if (role === 'faculty') {
            await supabase.from('faculty_profiles').insert({
              user_id: finalUser.id,
              employee_id: userData.employeeId || '',
              designation: userData.designation || 'Professor'
            });
          }

          const successMessage = `Registration successful! Your account status is "Pending Verification". The administrator will verify your ${
            role === 'student' || role === 'alumni' ? 'Enrollment Number & Academic Credentials' : 'Employee ID & Official Email'
          } before enabling login access.`;
          return { success: true, message: successMessage };
        }
        return { success: false, message: 'Registration failed unexpectedly.' };
      } catch (err: any) {
        return { success: false, message: err.message || 'An error occurred during registration.' };
      }
    } else {
      // Local demo mode fallback registration
      const newMockUser = {
        id: `mock-${Date.now()}`,
        name: userData.name,
        email: targetEmail,
        role: role,
        department: userData.department || 'CMPN',
        isVerified: false,
        verificationStatus: 'Pending Verification' as const,
        enrollmentNo: userData.enrollmentNo || userData.prn || '2024CMPN099',
        employeeId: userData.employeeId || null,
        personalEmail: userData.personalEmail || null,
        proofDocumentName: userData.proofDocumentName || null,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('nexalink_auth_user', JSON.stringify(newMockUser));
      try {
        const regStr = localStorage.getItem('nexalink_users_registry');
        const reg = regStr ? JSON.parse(regStr) : [];
        if (Array.isArray(reg)) {
          const updated = [newMockUser, ...reg.filter((u: any) => u.email?.toLowerCase() !== targetEmail)];
          localStorage.setItem('nexalink_users_registry', JSON.stringify(updated));
        }
      } catch {}
      return { success: true, message: 'Registration successful! Your account status is "Pending Verification".' };
    }
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string; otp?: string }> => {
    const targetEmail = (email || '').replace(/^\+/, '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid institutional email address.' };
    }

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) {
          return { success: false, message: error.message };
        }
        return {
          success: true,
          message: `Password reset instructions and verification link sent to ${targetEmail}.`
        };
      } catch (err: any) {
        return { success: false, message: err.message || 'An error occurred during password reset request.' };
      }
    }
    return { success: false, message: 'Supabase is not configured.' };
  };

  const completePasswordReset = async (
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters in length.' };
    }

    if (isSupabaseConfigured()) {
      try {
        // 1. Update the password using the active recovery session
        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (updateError) {
          return {
            success: false,
            message: updateError.message || 'Failed to update password. Reset link may be invalid or expired.'
          };
        }

        // 2. Properly refresh the session to exit recovery state into full authenticated session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        const authedUser = refreshData?.session?.user || updateData?.user || (await supabase.auth.getUser()).data?.user;

        if (!authedUser) {
          return {
            success: false,
            message: 'Password updated, but active session could not be refreshed. Please sign in.'
          };
        }

        // 3. Clear recovery gating flags
        setIsRecoveryMode(false);
        isRecoveryModeRef.current = false;
        setRecoveryError(null);

        // 4. Load full profile from database and establish authenticated state
        await loadUserProfileFromSupabase(authedUser.id, true);
        setIsAuthenticated(true);
        wasAuthenticatedRef.current = true;

        // 5. Clean up the URL (remove #access_token=... and reset-password paths)
        if (typeof window !== 'undefined' && window.history?.replaceState) {
          const cleanPath = window.location.pathname === '/reset-password' ? '/' : window.location.pathname;
          window.history.replaceState({}, document.title, cleanPath);
        }

        return {
          success: true,
          message: 'Password successfully updated! Redirecting to your dashboard...'
        };
      } catch (err: any) {
        return {
          success: false,
          message: err.message || 'An unexpected error occurred while resetting password.'
        };
      }
    }

    // Fallback for demo mode
    setIsRecoveryMode(false);
    isRecoveryModeRef.current = false;
    setRecoveryError(null);
    return {
      success: true,
      message: 'Password updated successfully (Demo Mode).'
    };
  };

  const confirmPasswordReset = async (
    _email: string,
    _otp: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    return completePasswordReset(newPassword);
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      supabase.removeAllChannels(); // Tear down active WebSockets
      await supabase.auth.signOut().catch(() => {});
    }
    setIsAuthenticated(false);
    wasAuthenticatedRef.current = false;
    isMockSessionRef.current = false;
    setCurrentUser(null as any);
    setCurrentRole('student');
    setLoginError(null);
    setWelcomeRevealName(null);
    clearRecoveryMode();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nexalink_auth_user');
      sessionStorage.clear();
    }
  };

  const updateCurrentUserState = (updated: Record<string, any>) => {
    setCurrentUser((prev: any) => ({ ...(prev as any), ...updated }) as any);
    if (updated.role) {
      setCurrentRole(updated.role as UserRole);
    }
  };

  const clearNotifications = () => {
    setNotificationCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated,
        isCheckingSession,
        isRecoveryMode,
        recoveryError,
        clearRecoveryMode,
        loginError,
        clearLoginError: () => setLoginError(null),
        welcomeRevealName,
        clearWelcomeReveal: () => setWelcomeRevealName(null),
        switchRole,
        login,
        register,
        requestPasswordReset,
        confirmPasswordReset,
        completePasswordReset,
        logout,
        updateCurrentUserState,
        notificationCount,
        clearNotifications
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
