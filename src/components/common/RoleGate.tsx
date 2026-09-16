import React from 'react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface RoleGateProps {
  allow: (UserRole | 'teacher')[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * RoleGate Wrapper Component
 * 
 * Enforces explicit client-side role permission checks before rendering action buttons or modules.
 * Prevents UI role leaks by ensuring element is completely absent from DOM for non-permitted roles.
 */
export const RoleGate: React.FC<RoleGateProps> = ({ allow, children, fallback = null }) => {
  const { currentRole, currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Block unverified accounts from accessing gated modules
  if (currentUser && (currentUser.isVerified === false || currentUser.verificationStatus === 'Pending Verification' || currentUser.verificationStatus === 'Needs Clarification')) {
    return <>{fallback}</>;
  }

  const isAllowed = allow.includes(currentRole as any);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
