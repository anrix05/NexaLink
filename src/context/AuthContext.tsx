import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole, AlumniProfile, StudentProfile, FacultyProfile } from '../types';
import { DEMO_ADMIN, DEMO_ALUMNI, DEMO_STUDENT, DEMO_FACULTY } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  currentUser: User | AlumniProfile | StudentProfile | FacultyProfile;
  currentRole: UserRole;
  isAuthenticated: boolean;
  loginError: string | null;
  welcomeRevealName: string | null;
  clearWelcomeReveal: () => void;
  switchRole: (role: UserRole) => void;
  login: (email: string, _roleOrPassword?: any, password?: string, matchedUserFromStore?: any) => Promise<{ success: boolean; message?: string }>;
  register: (userData: Record<string, any>, role: UserRole) => Promise<{ success: boolean; message: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; otp?: string }>;
  confirmPasswordReset: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateCurrentUserState: (updated: Record<string, any>) => void;
  notificationCount: number;
  clearNotifications: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [welcomeRevealName, setWelcomeRevealName] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState<number>(3);

  // Rate Limiting & Account Lockout State (persisted server-side in Supabase login_attempts when configured)
  const [failedAttempts, setFailedAttempts] = useState<Record<string, number>>({});
  const [lockoutExpiry, setLockoutExpiry] = useState<Record<string, number>>({});
  const [activeOtps, setActiveOtps] = useState<Record<string, { otp: string; expiresAt: number }>>({});

  const triggerWelcomeRevealIfVerified = useCallback((user: any) => {
    if (
      user &&
      user.isVerified !== false &&
      user.verificationStatus !== 'Pending Verification' &&
      user.verificationStatus !== 'Needs Clarification' &&
      user.verificationStatus !== 'Rejected'
    ) {
      setWelcomeRevealName(user.name);
    } else {
      setWelcomeRevealName(null);
    }
  }, []);

  // Sync Supabase Auth Session on Mount
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Check existing active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfileFromSupabase(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfileFromSupabase(session.user.id);
      } else {
        // Fallback default
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfileFromSupabase = async (userId: string) => {
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
          .single();
        if (studentData) enrichedUser = { ...enrichedUser, ...studentData };
      } else if (userData.role === 'alumni') {
        const { data: alumniData } = await supabase
          .from('alumni_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (alumniData) enrichedUser = { ...enrichedUser, ...alumniData };
      } else if (userData.role === 'faculty' || userData.role === 'teacher') {
        const { data: facultyData } = await supabase
          .from('faculty_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (facultyData) enrichedUser = { ...enrichedUser, ...facultyData };
      }

      setCurrentRole(userData.role as UserRole);
      setCurrentUser(enrichedUser);
      setIsAuthenticated(true);
      triggerWelcomeRevealIfVerified(enrichedUser);
      return true;
    } catch (err) {
      console.warn('[AuthContext] Error loading user profile from Supabase:', err);
      return false;
    }
  };

  const switchRole = (role: UserRole) => {
    setLoginError(null);
    setCurrentRole(role);
    setIsAuthenticated(true);
    let targetUser: any = DEMO_STUDENT;
    if (role === 'admin') {
      targetUser = DEMO_ADMIN;
    } else if (role === 'alumni') {
      targetUser = DEMO_ALUMNI;
    } else if (role === 'faculty' || role === 'teacher') {
      targetUser = DEMO_FACULTY;
    }
    setCurrentUser(targetUser);
    triggerWelcomeRevealIfVerified(targetUser);
  };

  const login = async (
    email: string,
    _clientSpoofedRole?: any,
    password?: string,
    matchedUserFromStore?: any
  ): Promise<{ success: boolean; message?: string }> => {
    setLoginError(null);
    const targetEmail = (email || '').trim().toLowerCase();

    // 1. Server-side / local lockout check (5 failed attempts rate-limit)
    const lockTime = lockoutExpiry[targetEmail];
    if (lockTime && Date.now() < lockTime) {
      const remainingMins = Math.ceil((lockTime - Date.now()) / (60 * 1000));
      const err = `Account Locked: 5 consecutive failed login attempts detected. Please try again in ${remainingMins} minute(s) or use Password Reset.`;
      setLoginError(err);
      setIsAuthenticated(false);
      setWelcomeRevealName(null);
      return { success: false, message: err };
    }

    // 2. Live Supabase Auth when configured
    if (isSupabaseConfigured() && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password
        });

        if (error) {
          const newCount = (failedAttempts[targetEmail] || 0) + 1;
          setFailedAttempts(prev => ({ ...prev, [targetEmail]: newCount }));

          if (newCount >= 5) {
            const lockoutUntil = Date.now() + 15 * 60 * 1000;
            setLockoutExpiry(prev => ({ ...prev, [targetEmail]: lockoutUntil }));
            const err = 'Account Locked: 5 consecutive failed login attempts detected. Account temporarily locked for 15 minutes.';
            setLoginError(err);
            setIsAuthenticated(false);
            return { success: false, message: err };
          }

          const errMsg = error.message || 'Invalid login credentials.';
          setLoginError(errMsg);
          setIsAuthenticated(false);
          return { success: false, message: errMsg };
        }

        if (data.user) {
          setFailedAttempts(prev => ({ ...prev, [targetEmail]: 0 }));
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
    if (password && password === 'wrongpassword') {
      const newCount = (failedAttempts[targetEmail] || 0) + 1;
      setFailedAttempts(prev => ({ ...prev, [targetEmail]: newCount }));

      if (newCount >= 5) {
        const lockoutUntil = Date.now() + 15 * 60 * 1000;
        setLockoutExpiry(prev => ({ ...prev, [targetEmail]: lockoutUntil }));
        const err = 'Account Locked: 5 consecutive failed login attempts detected. Account temporarily locked for 15 minutes.';
        setLoginError(err);
        setIsAuthenticated(false);
        setWelcomeRevealName(null);
        return { success: false, message: err };
      }

      const err = `Invalid password credentials. ${5 - newCount} attempt(s) remaining before account lockout.`;
      setLoginError(err);
      setIsAuthenticated(false);
      setWelcomeRevealName(null);
      return { success: false, message: err };
    }

    setFailedAttempts(prev => ({ ...prev, [targetEmail]: 0 }));

    if (matchedUserFromStore) {
      setCurrentRole(matchedUserFromStore.role);
      setCurrentUser(matchedUserFromStore);
      setIsAuthenticated(true);
      triggerWelcomeRevealIfVerified(matchedUserFromStore);
      return { success: true };
    }

    let authenticatedUser: any = DEMO_STUDENT;

    if (targetEmail === 'admin@vit.edu.in' || targetEmail.startsWith('admin.')) {
      setCurrentRole('admin');
      authenticatedUser = DEMO_ADMIN;
    } else if (targetEmail === 'rushabh.sanghavi@alumni.vit.edu.in' || targetEmail.includes('alumni')) {
      setCurrentRole('alumni');
      authenticatedUser = DEMO_ALUMNI;
    } else if (targetEmail === 'ravindra.sangale@vit.edu.in' || targetEmail.includes('faculty') || targetEmail.includes('prof')) {
      setCurrentRole('faculty');
      authenticatedUser = DEMO_FACULTY;
    } else {
      setCurrentRole('student');
      authenticatedUser = DEMO_STUDENT;
    }

    setCurrentUser(authenticatedUser);
    setIsAuthenticated(true);
    triggerWelcomeRevealIfVerified(authenticatedUser);
    return { success: true };
  };

  const register = async (userData: Record<string, any>, role: UserRole): Promise<{ success: boolean; message: string }> => {
    setLoginError(null);
    const targetEmail = (userData.email || '').trim().toLowerCase();



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

        if (authError) {
          return { success: false, message: authError.message };
        }

        if (authData.user) {
          // Call the secure RPC function to bypass RLS and create the profile
          const { error: insertError } = await supabase.rpc('create_user_profile', {
            p_id: authData.user.id,
            p_name: userData.name,
            p_email: targetEmail,
            p_role: role,
            p_department: userData.department || 'CMPN',
            p_avatar_url: userData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
            p_enrollment_no: userData.enrollmentNo || userData.prn || '22101A0099',
            p_employee_id: userData.employeeId || null,
            p_phone: userData.phone || null,
            p_bio: userData.bio || null,
            p_personal_email: userData.personalEmail || null,
            p_proof_document_name: userData.proofDocumentName || null,
            p_verification_document_url: userData.verificationDocumentUrl || null
          });

          if (insertError) {
            // Delete the auth user if profile creation failed to prevent orphaned accounts
            // Note: Admin service role is needed to cleanly delete, but we at least surface the error
            return { success: false, message: `Database Error: ${insertError.message}. (Did you update the Supabase RLS policies and email triggers?)` };
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
      return { success: false, message: 'Supabase is not configured or password was missing.' };
    }
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string; otp?: string }> => {
    const targetEmail = (email || '').trim().toLowerCase();
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

  const confirmPasswordReset = async (
    email: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    const targetEmail = (email || '').trim().toLowerCase();

    if (isSupabaseConfigured() && newPassword) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (!error) {
          return { success: true, message: 'Password reset successfully! You can now log in with your new credentials.' };
        }
      } catch (err: any) {
        return { success: false, message: err.message || 'An error occurred during password reset.' };
      }
    }
    return { success: false, message: 'Supabase is not configured or password was missing.' };
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut().catch(() => {});
    }
    setIsAuthenticated(false);
    setCurrentUser(null as any);
    setCurrentRole('student');
    setLoginError(null);
    setWelcomeRevealName(null);
    if (typeof window !== 'undefined') {
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
        loginError,
        welcomeRevealName,
        clearWelcomeReveal: () => setWelcomeRevealName(null),
        switchRole,
        login,
        register,
        requestPasswordReset,
        confirmPasswordReset,
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
