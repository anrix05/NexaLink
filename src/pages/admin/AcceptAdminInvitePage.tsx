import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';
import { Button } from '../../components/common/UIComponents';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { LogoMark } from '../../components/common/LogoMark';

interface AcceptAdminInvitePageProps {
  setActiveTab: (tab: string) => void;
}

export const AcceptAdminInvitePage: React.FC<AcceptAdminInvitePageProps> = ({ setActiveTab }) => {
  const { login } = useAuth();
  const { adminInvites, acceptAdminInvite } = useData();

  const [inviteMatchEmail, setInviteMatchEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteNewPassword, setInviteNewPassword] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const [urlEmail, setUrlEmail] = useState<string | null>(null);

  // Automatically attempt to match invite token from URL if implemented
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    if (email) {
      setUrlEmail(email.toLowerCase().trim());
      setInviteMatchEmail(email.trim());
    }
  }, []);

  // UI Validation: We trust the URL email for the UI unlock state, because an unauthenticated user 
  // cannot read the `admin_invites` table due to Supabase RLS policies blocking it.
  const isValidInvite = !!urlEmail;



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);

    if (!isValidInvite || !urlEmail) {
      setInviteError('Registration rejected. This invite link is invalid or has already been used.');
      return;
    }

    const res = await acceptAdminInvite(urlEmail, inviteFullName || 'New Admin User', inviteNewPassword || 'AdminPass@2026');
    if (res.success) {
      setInviteSuccess('Admin invite accepted! Your administrator account is now active.');
      setTimeout(() => {
        // Pass the password to login() so that it authenticates via Supabase
        // and swaps the current session with the newly created account's session.
        login(inviteMatchEmail.trim().toLowerCase(), 'admin', inviteNewPassword || 'AdminPass@2026');
        setActiveTab('dashboard');
      }, 1200);
    } else {
      setInviteError(res.error || 'Failed to accept invite.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="pt-8 pb-4 text-center space-y-1">
          <div className="w-10 h-10 mx-auto flex items-center justify-center">
            <LogoMark className="w-8 h-8 text-slate-950" />
          </div>
          <h3 className="font-display font-bold text-base text-slate-950 uppercase tracking-wider">
            Admin Portal
          </h3>
          <p className="font-sans text-xs text-slate-500">
            Secure Verification Endpoint
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-stone-200 pb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-display font-bold text-stone-900 tracking-wide uppercase">Accept Admin Invite</h2>
          </div>

          <p className="text-slate-600 text-xs leading-relaxed font-sans">
            If you received an institutional Admin invite, enter your invited email address below to activate your administrator credentials. Existing users should enter their current password.
          </p>

          {!isValidInvite && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-6 h-6 text-rose-500 mb-1" />
              <span className="text-[11px] font-display font-bold text-rose-800 uppercase tracking-wider block">
                Invalid or Expired Invite Link
              </span>
              <p className="text-[11px] text-rose-600/80 leading-relaxed max-w-[280px]">
                This admin invite link is invalid, has already been used, or you did not provide an email in the link. 
                Please contact the institutional administrator to send you a new invite.
              </p>
            </div>
          )}

          {inviteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{inviteError}</span>
            </div>
          )}

          {inviteSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{inviteSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-sans">
            <div>
              <label className="block text-slate-700 font-display font-bold text-[10px] uppercase tracking-wider mb-1">
                Invited Email Address
              </label>
              <input
                type="email"
                required
                disabled={true}
                value={inviteMatchEmail}
                onChange={e => setInviteMatchEmail(e.target.value)}
                placeholder="admin@vit.edu.in"
                className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-950 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-display font-bold text-[10px] uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                disabled={!isValidInvite}
                value={inviteFullName}
                onChange={e => setInviteFullName(e.target.value)}
                placeholder="Dr. Meera Sharma"
                className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-950 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-display font-bold text-[10px] uppercase tracking-wider mb-1">
                Account Password
              </label>
              <input
                type="password"
                required
                disabled={!isValidInvite}
                value={inviteNewPassword}
                onChange={e => setInviteNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-stone-50 border border-stone-200 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-950 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                variant="primary" 
                size="md" 
                className="w-full justify-center"
                disabled={!isValidInvite}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Activate Admin Account
              </Button>
            </div>
            
            <div className="text-center mt-4 pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setActiveTab('auth')}
                className="text-[10px] font-display font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors underline"
              >
                Return to standard login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
