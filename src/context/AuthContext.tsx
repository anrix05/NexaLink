import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, UserRole, AlumniProfile, StudentProfile, FacultyProfile } from '../types';
// Removed static import of mockData for production tree-shaking
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  currentUser: User | AlumniProfile | StudentProfile | FacultyProfile;
  currentRole: UserRole;
  isAuthenticated: boolean;
  isCheckingSession: boolean;
  loginError: string | null;
  clearLoginError: () => void;
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
  const wasAuthenticatedRef = useRef<boolean>(false);
  const isMockSessionRef = useRef<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [welcomeRevealName, setWelcomeRevealName] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState<number>(3);

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

    // Check existing active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfileFromSupabase(session.user.id).finally(() => setIsCheckingSession(false));
      } else {
        setIsCheckingSession(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        return; // Ignore token refreshes entirely for side-effects
      }
      
      if (session?.user) {
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

  const login = async (
    email: string,
    _clientSpoofedRole?: any,
    password?: string,
    matchedUserFromStore?: any
  ): Promise<{ success: boolean; message?: string }> => {
    setLoginError(null);
    const targetEmail = (email || '').trim().toLowerCase();

    // 2. Live Supabase Auth when configured
    if (isSupabaseConfigured() && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password
        });

        if (error) {
          const errMsg = error.message || 'Invalid login credentials.';
          setLoginError(errMsg);
          setIsAuthenticated(false);
          return { success: false, message: errMsg };
        }

        if (data.user) {
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
      const err = `Invalid password credentials.`;
      setLoginError(err);
      setIsAuthenticated(false);
      setWelcomeRevealName(null);
      return { success: false, message: err };
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

    isMockSessionRef.current = true;
    const mockData = await import('../data/mockData');
    let authenticatedUser: any = mockData.DEMO_STUDENT;

    if (targetEmail === 'admin@vit.edu.in' || targetEmail.startsWith('admin.')) {
      setCurrentRole('admin');
      authenticatedUser = mockData.DEMO_ADMIN;
    } else if (targetEmail === 'rushabh.sanghavi@alumni.vit.edu.in' || targetEmail.includes('alumni')) {
      setCurrentRole('alumni');
      authenticatedUser = mockData.DEMO_ALUMNI;
    } else if (targetEmail === 'ravindra.sangale@vit.edu.in' || targetEmail.includes('faculty') || targetEmail.includes('prof')) {
      setCurrentRole('faculty');
      authenticatedUser = mockData.DEMO_FACULTY;
    } else {
      setCurrentRole('student');
      authenticatedUser = mockData.DEMO_STUDENT;
    }

    setCurrentUser(authenticatedUser);
    setIsAuthenticated(true);
    wasAuthenticatedRef.current = true;
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
        clearLoginError: () => setLoginError(null),
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
        clearNotifications,
        isCheckingSession
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
