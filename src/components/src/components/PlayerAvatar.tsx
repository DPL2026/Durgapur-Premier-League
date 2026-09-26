import React, { useState } from 'react';
import { Player } from '../types';

interface PlayerAvatarProps {
  player: Player;
  size?: 'sm' | 'md' | 'lg' | 'stage';
  isGlowing?: boolean;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  player,
  size = 'md',
  isGlowing = false
}) => {
  const [imgError, setImgError] = useState(false);

  // Silhouette styling based on role color theme
  const roleColors: Record<string, { bg1: string; bg2: string; accent: string }> = {
    'Batter': { bg1: '#1e3a8a', bg2: '#0f172a', accent: '#38bdf8' },
    'Wicketkeeper': { bg1: '#701a75', bg2: '#0f172a', accent: '#e879f9' },
    'All-rounder': { bg1: '#78350f', bg2: '#0f172a', accent: '#fbbf24' },
    'Fast Bowler': { bg1: '#881337', bg2: '#0f172a', accent: '#fb7185' },
    'Spin Bowler': { bg1: '#134e4a', bg2: '#0f172a', accent: '#2dd4bf' }
  };

  const scheme = roleColors[player.role] || { bg1: '#1e293b', bg2: '#090d16', accent: '#94a3b8' };

  // If player has a custom uploaded photo/dataURL and no load error
  if (player.photo && !imgError) {
    const sizeMap = {
      sm: 'w-10 h-10',
      md: 'w-16 h-16',
      lg: 'w-24 h-24',
      stage: 'w-52 h-64 sm:w-64 sm:h-80 md:w-72 md:h-96'
    };

    return (
      <div
        className={`relative ${sizeMap[size]} rounded-2xl overflow-hidden border border-slate-300/40 bg-slate-900 flex items-center justify-center select-none`}
      >
        <img
          src={player.photo}
          alt={player.name}
          onError={() => setImgError(true)}
          style={{ filter: 'none', WebkitFilter: 'none', mixBlendMode: 'normal' }}
          className="w-full h-full object-cover object-top"
        />
      </div>
    );
  }

  if (size === 'sm') {
    return (
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs uppercase border border-slate-700"
        style={{ background: `linear-gradient(135deg, ${scheme.bg1}, ${scheme.bg2})`, color: scheme.accent }}
      >
        {player.name.slice(0, 2)}
      </div>
    );
  }

  if (size === 'md') {
    return (
      <div
        className="w-16 h-16 rounded-xl flex flex-col items-center justify-center border border-slate-700 relative overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${scheme.bg1}, ${scheme.bg2})` }}
      >
        <span className="font-score text-lg font-bold text-white tracking-wider">
          {player.name.split(' ').map(n => n[0]).join('')}
        </span>
        <span className="text-[9px] uppercase tracking-wider text-slate-300 mt-0.5">
          {player.role.split(' ')[0]}
        </span>
      </div>
    );
  }

  // Stage or large vector silhouette
  const isStage = size === 'stage';

  return (
    <div
      className={`relative ${
        isStage ? 'w-52 h-64 sm:w-64 sm:h-80 md:w-72 md:h-96' : 'w-28 h-36'
      } rounded-2xl flex flex-col items-center justify-end overflow-hidden border border-slate-700/80 shadow-2xl select-none bg-[#0f172a]`}
    >
      {/* Cricket Player Athlete Vector Silhouette */}
      <div className="relative z-10 w-full flex flex-col items-center justify-end pb-4">
        <svg
          viewBox="0 0 200 240"
          className={`${isStage ? 'w-44 h-56 sm:w-56 sm:h-72' : 'w-24 h-32'}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Helmet / Cap */}
          <path
            d="M80 50 C80 32 120 32 120 50 C120 58 116 64 100 65 C84 64 80 58 80 50 Z"
            fill="#1e293b"
            stroke={scheme.accent}
            strokeWidth="1.5"
          />
          {/* Visor / Peak */}
          <path d="M76 52 Q100 48 124 52 L128 56 Q100 52 72 56 Z" fill="#334155" />

          {/* Neck */}
          <rect x="94" y="65" width="12" height="15" fill="#334155" />

          {/* Torso Athletic Jersey */}
          <path
            d="M62 82 L78 78 L92 84 L108 84 L122 78 L138 82 L132 155 L68 155 Z"
            fill="#0f172a"
            stroke="#1e293b"
            strokeWidth="2"
          />

          {/* Jersey dynamic stripes & accents */}
          <path d="M78 78 L72 155" stroke={scheme.accent} strokeWidth="3" strokeOpacity="0.7" />
          <path d="M122 78 L128 155" stroke={scheme.accent} strokeWidth="3" strokeOpacity="0.7" />

          {/* Player initial or crest on chest */}
          <circle cx="100" cy="112" r="14" fill="#090d16" stroke={scheme.accent} strokeWidth="1.5" />
          <text
            x="100"
            y="116"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {player.name.slice(0, 1)}
          </text>

          {/* Bat or Ball depiction based on role */}
          {player.role.includes('Batter') || player.role === 'All-rounder' || player.role === 'Wicketkeeper' ? (
            <g transform="translate(130, 90) rotate(18)">
              {/* Cricket Bat */}
              <rect x="0" y="0" width="8" height="24" rx="2" fill="#d97706" />
              <rect x="-3" y="24" width="14" height="65" rx="3" fill="#ca8a04" stroke="#78350f" strokeWidth="1" />
              <path d="M-3 24 L11 24" stroke="#451a03" strokeWidth="2" />
            </g>
          ) : (
            <g transform="translate(132, 115)">
              {/* Cricket Seam Leather Ball */}
              <circle cx="8" cy="8" r="9" fill="#dc2626" stroke="#b91c1c" />
              <path d="M3 4 Q8 8 13 12" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="1.5 1.5" />
            </g>
          )}

          {/* Shoulders & Arms in dynamic athletic pose */}
          <path d="M62 82 L48 120 L58 125 L70 95 Z" fill="#1e293b" />
          <path d="M138 82 L150 115 L140 120 L130 95 Z" fill="#1e293b" />
        </svg>

        {/* Lot Badge */}
        {isStage && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1E1E38]/90 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-storybook font-bold backdrop-blur-md mt-1">
            <span>LOT #{player.id.replace('ply_', '')}</span>
          </div>
        )}
      </div>

      {/* Role Banner Ribbon */}
      <div
        className="w-full py-1.5 text-center text-xs font-bold tracking-widest uppercase border-t border-slate-700/80 z-20 backdrop-blur-md"
        style={{
          backgroundColor: `${scheme.bg1}dd`,
          color: scheme.accent
        }}
      >
        {player.role}
      </div>
    </div>
  );
};
