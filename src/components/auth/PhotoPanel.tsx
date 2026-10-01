import React from 'react';
import { ShieldCheck, Users, Briefcase } from 'lucide-react';
import { Eyebrow } from '../common/Eyebrow';

export interface PhotoPanelProps {
  className?: string;
}

export const PhotoPanel: React.FC<PhotoPanelProps> = ({ className = '' }) => {
  return (
    <div
      className={`relative w-full h-full min-h-[580px] rounded-2xl overflow-hidden select-none border border-[#E5E7EB] ${className}`}
    >
      {/* Background Campus Photograph (Grayscale) */}
      <img
        src="/images/vit-campus-grounds-auth.jpg"
        alt="Vidyalankar Institute of Technology Campus Grounds, Wadala"
        className="absolute inset-0 w-full h-full object-cover object-center grayscale contrast-[1.08] brightness-[0.95]"
        loading="eager"
      />

      {/* Flat Obsidian Overlay (58% opacity, no gradients, ensures >=4.5:1 contrast against white text) */}
      <div className="absolute inset-0 bg-[#0A0A0A]/60" aria-hidden="true" />

      {/* Content Overlay */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-8 sm:p-10 text-[#FFFFFF]">
        {/* Top Section */}
        <div className="flex flex-col gap-6 max-w-[360px]">
          <div>
            <Eyebrow className="text-white/80">Institutional network</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-normal font-serif text-[#FFFFFF] tracking-tight mt-2 leading-tight">
              A verified network for VIT Wadala.
            </h2>
          </div>

          {/* Three one-line points with clean line icons */}
          <ul className="flex flex-col gap-3.5 pt-2">
            <li className="flex items-center gap-2.5 text-sm text-white/90">
              <ShieldCheck className="w-4 h-4 text-white/80 shrink-0" aria-hidden="true" />
              <span>Verified members only</span>
            </li>
            <li className="flex items-center gap-2.5 text-sm text-white/90">
              <Users className="w-4 h-4 text-white/80 shrink-0" aria-hidden="true" />
              <span>One-on-one mentorship</span>
            </li>
            <li className="flex items-center gap-2.5 text-sm text-white/90">
              <Briefcase className="w-4 h-4 text-white/80 shrink-0" aria-hidden="true" />
              <span>Referrals from alumni</span>
            </li>
          </ul>
        </div>

        {/* Bottom Section: Sentence-case caption */}
        <div className="pt-8">
          <p className="text-xs text-white/70 font-sans">
            Campus grounds, Wadala
          </p>
        </div>
      </div>
    </div>
  );
};
