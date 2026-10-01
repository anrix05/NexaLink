import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ChevronDown, User, Sparkles } from 'lucide-react';
import type { UserRole } from '../../types';

export const DevLoginPopover: React.FC = () => {
  // Only render in dev mode
  if (!import.meta.env.DEV) return null;

  const { switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const personas: { role: UserRole; name: string; email: string }[] = [
    { role: 'student', name: 'Aanya Patel', email: 'aanya.patel@student.vit.edu.in' },
    { role: 'alumni', name: 'Rushabh Sanghavi', email: 'rushabh.sanghavi@alumni.vit.edu.in' },
    { role: 'faculty', name: 'Dr. Ravindra Sangale', email: 'ravindra.sangale@vit.edu.in' },
    { role: 'admin', name: 'Admin Console', email: 'admin@vit.edu.in' }
  ];

  return (
    <div ref={containerRef} className="fixed bottom-4 right-4 z-50 select-none">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-3 py-1.5 rounded-full border border-[#E5E7EB] bg-[#FFFFFF] shadow-sm text-xs font-medium text-[#0A0A0A] hover:bg-[#FAFAFA] flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
        <span>Dev login</span>
        <ChevronDown className={`w-3 h-3 text-[#6B7280] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-72 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] shadow-sm p-2 flex flex-col gap-1">
          <div className="px-2 py-1 border-b border-[#E5E7EB] mb-1">
            <span className="text-[11px] font-medium text-[#6B7280]">
              Fast Dev Personas (DEV only)
            </span>
          </div>

          {personas.map((p) => (
            <button
              key={p.role}
              type="button"
              onClick={() => {
                switchRole(p.role);
                setIsOpen(false);
              }}
              className="w-full text-left px-2.5 py-2 rounded-md hover:bg-[#FAFAFA] transition-colors flex flex-col focus:outline-none focus:bg-[#FAFAFA]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#0A0A0A]">{p.name}</span>
                <span className="text-[10px] text-[#6B7280] capitalize border border-[#E5E7EB] px-1.5 py-0.2 rounded bg-[#FFFFFF]">
                  {p.role}
                </span>
              </div>
              <span className="text-[11px] text-[#6B7280] truncate">{p.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
