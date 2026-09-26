import React, { useState } from 'react';
import { Team } from '../types';
import { TeamBadge } from './TeamBadge';
import {
  Lock,
  AlertCircle,
  ArrowRight,
  KeyRound,
  X
} from 'lucide-react';

interface FranchiseLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  loggedInOwnerTeam: Team | null;
  onOwnerCodeLogin: (
    code: string,
    teamId?: string
  ) => Promise<{ success: boolean; teamId?: string | null; role?: string; error?: string }>;
  onLogoutTeam: () => void;
  currency?: string;
}

export const FranchiseLoginModal: React.FC<FranchiseLoginModalProps> = ({
  isOpen,
  onClose,
  teams,
  loggedInOwnerTeam,
  onOwnerCodeLogin,
  onLogoutTeam,
  currency = '₹'
}) => {
  const [selectedLoginTeamId, setSelectedLoginTeamId] = useState<string>('');
  const [ownerSecretCode, setOwnerSecretCode] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleFranchiseLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!ownerSecretCode.trim()) {
      setLoginError('Please enter your secret franchise owner code.');
      return;
    }

    setIsVerifying(true);
    const res = await onOwnerCodeLogin(
      ownerSecretCode.trim(),
      selectedLoginTeamId || undefined
    );
    setIsVerifying(false);

    if (res.success && res.teamId) {
      setOwnerSecretCode('');
      setLoginError(null);
      onClose();
    } else {
      setLoginError(res.error || 'Invalid hidden owner code for the chosen franchise.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0F172A]/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0b1730] border-2 border-[#D4AF37] p-5 sm:p-7 shadow-2xl overflow-y-auto text-white space-y-5">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]">
              <KeyRound className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-wide uppercase">
                FRANCHISE TEAM LOGIN
              </h3>
              <p className="text-xs text-slate-300">
                Log in with your secret code for one franchise to lock your team on the Home Page
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Locked Franchise Banner */}
        {loggedInOwnerTeam && (
          <div className="p-4 rounded-xl bg-emerald-950/70 border-2 border-emerald-400/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <TeamBadge team={loggedInOwnerTeam} size="md" />
              <div>
                <span className="text-[10px] font-storybook font-bold uppercase tracking-wider text-emerald-300 block">
                  🔒 TEAM LOCKED FOR BIDDING
                </span>
                <h4 className="font-display font-black text-lg text-white">
                  {loggedInOwnerTeam.name} ({loggedInOwnerTeam.shortCode})
                </h4>
                <span className="text-xs text-emerald-200">
                  Purse: {currency}{loggedInOwnerTeam.purse.toLocaleString()} · Squad: {loggedInOwnerTeam.players.length}/{loggedInOwnerTeam.maxSquadSize}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#b89528] text-[#0F172A] font-storybook font-black text-xs uppercase cursor-pointer transition"
              >
                <span>Go to Home Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onLogoutTeam}
                className="px-3 py-2 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 border border-rose-400/40 text-rose-200 font-storybook font-bold text-xs uppercase cursor-pointer transition"
              >
                Unlock
              </button>
            </div>
          </div>
        )}

        {/* Single Franchise Login Form */}
        <div className="p-5 rounded-xl bg-[#071124] border border-[#D4AF37]/40 space-y-4">
          {loginError && (
            <div className="p-3 rounded-lg bg-rose-950/90 border border-rose-500 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleFranchiseLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-200 font-storybook font-bold uppercase tracking-wider block mb-1.5">
                1. Choose Your Franchise
              </label>
              <select
                value={selectedLoginTeamId}
                onChange={(e) => setSelectedLoginTeamId(e.target.value)}
                className="w-full p-3 rounded-lg bg-[#0b1730] border border-[#D4AF37]/50 text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="">Auto-Detect Franchise from Hidden Code</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.shortCode} — {t.name} (Purse: {currency}{t.purse.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-200 font-storybook font-bold uppercase tracking-wider block mb-1.5">
                2. Enter Franchise Hidden Code
              </label>
              <input
                type="password"
                value={ownerSecretCode}
                onChange={(e) => setOwnerSecretCode(e.target.value)}
                required
                placeholder="Enter your franchise secret code..."
                className="w-full p-3 rounded-lg bg-[#0b1730] border border-[#D4AF37]/50 text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3.5 rounded-lg bg-[#D4AF37] hover:bg-[#b89528] text-[#0F172A] font-storybook font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isVerifying ? 'Verifying...' : 'Login & Lock Franchise (Go to Home Page)'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
