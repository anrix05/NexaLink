import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NexaMark } from '../brand/NexaMark';
import { LogOut, ChevronDown, Mail } from 'lucide-react';

export interface GateShellProps {
  children: React.ReactNode;
  className?: string;
}

export const GateShell: React.FC<GateShellProps> = ({ children, className = '' }) => {
  const { currentUser, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  const roleLabel = currentUser?.role
    ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1).toLowerCase()
    : 'Member';

  return (
    <div className={`min-h-screen bg-[#FFFFFF] flex flex-col ${className}`}>
      {/* Minimal Top Header (No app chrome: no sidebar, no search, no bell, no status) */}
      <header className="h-16 border-b border-[#E5E7EB] bg-[#FFFFFF] sticky top-0 z-40 px-4 sm:px-6">
        <div className="max-w-[1200px] h-full mx-auto flex items-center justify-between">
          {/* Brand Logo - links only to review gate */}
          <div className="flex items-center gap-2.5">
            <NexaMark className="w-6 h-6 text-[#0A0A0A]" />
            <span className="font-serif font-normal text-lg tracking-tight text-[#0A0A0A]">
              NexaLink
            </span>
          </div>

          {/* Right Header: Help Link & Clean Avatar Menu */}
          <div className="flex items-center gap-4">
            <a
              href="mailto:alumni@vit.edu.in?subject=NexaLink%20Verification%20Support"
              className="text-xs text-[#6B7280] hover:text-[#0A0A0A] inline-flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] rounded p-1"
            >
              <Mail className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Help</span>
            </a>

            {/* Profile Avatar Dropdown */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account menu"
                className="flex items-center gap-2 p-1 rounded-full hover:bg-[#FAFAFA] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A] focus:ring-offset-1"
              >
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                  alt={currentUser?.name || 'Account avatar'}
                  className="w-8 h-8 rounded-full object-cover border border-[#E5E7EB]"
                />
                <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" aria-hidden="true" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm py-2 z-50 text-left"
                >
                  <div className="px-3.5 py-2 border-b border-[#E5E7EB]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[#0A0A0A] truncate">
                        {currentUser?.name || 'Member'}
                      </span>
                      {/* Neutral role badge */}
                      <span className="text-[11px] px-2 py-0.5 rounded-full border border-[#E5E7EB] bg-[#FAFAFA] text-[#0A0A0A] font-medium shrink-0">
                        {roleLabel}
                      </span>
                    </div>
                    <span className="text-xs text-[#6B7280] font-sans truncate block mt-0.5">
                      {currentUser?.email || currentUser?.institutionalEmail}
                    </span>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-3.5 py-2 text-xs text-[#DC2626] hover:bg-[#FEF2F2] flex items-center gap-2 transition-colors focus:outline-none focus:bg-[#FEF2F2]"
                    >
                      <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-start w-full px-4 py-8 sm:py-12">
        <div className="w-full max-w-[640px]">
          {children}
        </div>
      </main>
    </div>
  );
};
