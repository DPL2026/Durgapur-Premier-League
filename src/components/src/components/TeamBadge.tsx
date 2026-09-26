import React, { useState } from 'react';
import { Team } from '../types';

interface TeamBadgeProps {
  team: Team;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
}

export const TeamBadge: React.FC<TeamBadgeProps> = ({ team, size = 'md', showName = false }) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-2xl',
    xl: 'w-20 h-20 text-4xl'
  };

  const hasLogoImg = Boolean(team.logoUrl) && !imageError;

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`relative ${sizeClasses[size]} rounded-xl flex items-center justify-center font-black shadow-lg transition-transform duration-300 group-hover:scale-105 border border-white/20 select-none overflow-hidden shrink-0`}
        style={{
          background: hasLogoImg ? '#ffffff' : `linear-gradient(135deg, ${team.primaryColor}dd 0%, ${team.secondaryColor}aa 100%)`,
          boxShadow: `0 4px 15px ${team.primaryColor}50`
        }}
      >
        {hasLogoImg ? (
          <img
            src={team.logoUrl}
            alt={team.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-contain p-1 relative z-10 transition-transform hover:scale-110"
          />
        ) : (
          <>
            {/* Subtle shield / diagonal texture */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/25 pointer-events-none" />
            <span className="relative z-10 filter drop-shadow-md">{team.logoSymbol}</span>
          </>
        )}
      </div>
      {showName && (
        <div className="leading-tight">
          <span className="font-score font-bold tracking-wide text-white block text-sm sm:text-base">
            {team.shortCode}
          </span>
          <span className="text-xs text-blue-200/80 block truncate max-w-[140px]">
            {team.name}
          </span>
        </div>
      )}
    </div>
  );
};
