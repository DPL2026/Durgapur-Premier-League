import React, { useState } from 'react';
import { Team, Player } from '../types';
import { TeamBadge } from './TeamBadge';
import { Shield, ArrowRight, Lock, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';

interface TeamSelectionProps {
  teams: Team[];
  myTeam: Team | null;
  onSelectTeam: (teamId: string) => void;
  onProceedToAuction: () => void;
  allPlayers: Player[];
  currency?: string;
  unlockedTeamIds?: string[];
  onOwnerCodeLogin?: (code: string, teamId?: string) => Promise<{ success: boolean; teamId?: string | null; error?: string }>;
}

export const TeamSelection: React.FC<TeamSelectionProps> = ({
  teams,
  myTeam,
  onSelectTeam,
  onProceedToAuction,
  allPlayers,
  currency = '₹',
  unlockedTeamIds = [],
  onOwnerCodeLogin
}) => {
  const [promptTeam, setPromptTeam] = useState<Team | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleTeamCardClick = (team: Team) => {
    setAuthError(null);
    setAuthSuccess(null);
    if (unlockedTeamIds.includes(team.id)) {
      onSelectTeam(team.id);
    } else {
      setPromptTeam(team);
      setCodeInput('');
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim() || !onOwnerCodeLogin) return;
    setIsVerifying(true);
    setAuthError(null);
    setAuthSuccess(null);

    const res = await onOwnerCodeLogin(codeInput.trim(), promptTeam?.id);
    setIsVerifying(false);

    if (res.success && res.teamId) {
      const matched = teams.find((t) => t.id === res.teamId);
      setAuthSuccess(`🔒 Franchise Locked: ${matched?.name || 'Franchise'} (${matched?.shortCode || ''})!`);
      setCodeInput('');
      setPromptTeam(null);
      onProceedToAuction();
    } else {
      setAuthError(res.error || 'Invalid hidden owner code. Access denied.');
    }
  };

  return (
    <div className="w-full space-y-6 text-[#0F172A] font-body">
      {/* Chapter Title */}
      <div className="text-center max-w-3xl mx-auto mb-6">
        <div className="flex items-center justify-center gap-2 mb-2 text-[#D4AF37] font-storybook font-bold text-xs uppercase tracking-[0.1em]">
          <span>✦</span>
          <span>FRANCHISE OWNER AUTHENTICATION</span>
          <span>✦</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-display font-black text-[#0F172A] tracking-[0.05em] uppercase leading-tight">
          OWNER HIDDEN CODE LOGIN & PADDLES
        </h2>
        <p className="mt-2 text-base text-[#475569] italic">
          Every team owner must log in with their secret hidden franchise code to unlock their team paddle and place bids.
        </p>
      </div>

      {/* Direct Hidden Code Login Bar */}
      <div className="p-5 bg-[#1E1E38] text-[#FFFDF9] border-2 border-[#D4AF37] shadow-md">
        <form onSubmit={handleCodeSubmit} className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-storybook font-bold tracking-[0.1em] text-[#D4AF37] block">
                BACKEND OWNER AUTHENTICATION
              </span>
              <h3 className="font-display font-black text-lg sm:text-xl text-white tracking-wide">
                {promptTeam
                  ? `Enter Hidden Code for ${promptTeam.name} (${promptTeam.shortCode})`
                  : 'Enter Your Franchise Owner Hidden Code'}
              </h3>
              <p className="text-xs text-slate-300 font-body">
                Enter your secret owner code (RCD, DSK, DKR, DR) to unlock your franchise and make bids.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {promptTeam && (
              <button
                type="button"
                onClick={() => {
                  setPromptTeam(null);
                  setAuthError(null);
                }}
                className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-xs font-storybook uppercase text-slate-200 cursor-pointer"
              >
                All Teams
              </button>
            )}
            <input
              type="password"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder={promptTeam ? `Hidden code for ${promptTeam.shortCode}...` : 'Enter Owner Hidden Code...'}
              className="px-4 py-2.5 bg-[#151934] border border-[#D4AF37] text-white font-storybook text-xs placeholder:text-slate-400 focus:outline-none min-w-[220px]"
            />
            <button
              type="submit"
              disabled={isVerifying || !codeInput.trim()}
              className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#b89528] text-[#0F172A] font-storybook font-black text-xs uppercase tracking-[0.06em] transition cursor-pointer disabled:opacity-40"
            >
              {isVerifying ? 'Verifying...' : 'Unlock Team & Bid'}
            </button>
          </div>
        </form>

        {authError && (
          <div className="mt-3 p-2.5 bg-rose-950/90 border border-rose-500 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {authSuccess && (
          <div className="mt-3 p-2.5 bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{authSuccess}</span>
          </div>
        )}
      </div>

      {/* Selected Team Highlight Banner */}
      {myTeam && unlockedTeamIds.includes(myTeam.id) && (
        <div className="p-5 bg-[#FAFAF8] border-2 border-[#D4AF37] shadow-md flex flex-wrap items-center justify-between gap-4 rounded-none">
          <div className="flex items-center gap-4">
            <TeamBadge team={myTeam} size="lg" />
            <div>
              <span className="text-[10px] uppercase font-storybook font-bold tracking-[0.08em] text-emerald-700 block">
                ● VERIFIED OWNER FRANCHISE UNLOCKED
              </span>
              <h3 className="text-2xl font-display font-black text-[#0F172A] tracking-[0.04em]">
                {myTeam.name} ({myTeam.shortCode})
              </h3>
              <p className="text-xs text-[#475569] italic">"{myTeam.motto}" · Purse: {currency}{myTeam.purse.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onProceedToAuction}
              className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] hover:bg-[#b89528] text-[#0F172A] font-storybook font-black text-xs uppercase tracking-[0.06em] border border-[#D4AF37] shadow-sm transition cursor-pointer rounded-none"
            >
              <span>PROCEED TO STAGE & BID</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Grid of Franchises */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teams.map((team) => {
          const isUnlocked = unlockedTeamIds.includes(team.id);
          const isSelected = myTeam?.id === team.id && isUnlocked;
          const squad = allPlayers.filter((p) => team.players.includes(p.id));

          return (
            <div
              key={team.id}
              onClick={() => handleTeamCardClick(team)}
              className={`p-5 cursor-pointer transition flex flex-col justify-between border rounded-none ${
                isSelected
                  ? 'bg-[#1E1E38] text-[#FFFDF9] border-[#D4AF37] shadow-md'
                  : 'bg-[#FAFAF8] text-[#0F172A] border-[#D4AF37]/40 hover:border-[#D4AF37] hover:bg-[#F5F2EB]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <TeamBadge team={team} size="md" />
                    <div>
                      <h4 className="font-display font-black text-xl tracking-[0.04em] leading-tight">
                        {team.name} ({team.shortCode})
                      </h4>
                      <span className={`text-xs italic ${isSelected ? 'text-[#D4AF37]' : 'text-[#475569]'}`}>
                        "{team.motto}"
                      </span>
                    </div>
                  </div>

                  {isUnlocked ? (
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-700 text-white font-storybook font-bold uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {isSelected ? 'ACTIVE OWNER' : 'UNLOCKED'}
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-[#D4AF37] font-storybook font-bold uppercase tracking-wider flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      CODE REQUIRED
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className={isSelected ? 'text-slate-300' : 'text-[#475569]'}>Franchise Code:</span>
                    <strong className="font-storybook">{team.shortCode}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className={isSelected ? 'text-slate-300' : 'text-[#475569]'}>Squad Signed:</span>
                    <strong className="font-storybook">{squad.length} / {team.maxSquadSize} Players</strong>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#D4AF37]/30">
                <div className="flex items-baseline justify-between mb-2">
                  <span className={`text-[11px] uppercase font-storybook ${isSelected ? 'text-slate-300' : 'text-[#475569]'}`}>
                    Remaining Purse
                  </span>
                  <strong className={`font-storybook font-black text-lg ${isSelected ? 'text-[#D4AF37]' : 'text-[#0F172A]'}`}>
                    {currency}{team.purse.toLocaleString()}
                  </strong>
                </div>

                <button
                  type="button"
                  className={`w-full py-2 font-storybook font-bold text-xs uppercase tracking-[0.05em] border transition cursor-pointer rounded-none flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#D4AF37] text-[#0F172A] border-[#D4AF37]'
                      : isUnlocked
                      ? 'bg-emerald-800 text-white border-emerald-700'
                      : 'bg-[#FFFDF9] text-[#0F172A] border-[#D4AF37]/40 hover:bg-[#1E1E38] hover:text-[#FFFDF9]'
                  }`}
                >
                  {isSelected ? (
                    <span>OWNER PADDLE ACTIVE</span>
                  ) : isUnlocked ? (
                    <span>SWITCH TO {team.shortCode} PADDLE</span>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>LOGIN AS {team.shortCode} OWNER</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
