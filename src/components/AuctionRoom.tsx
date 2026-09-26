import React, { useState } from 'react';
import { Player, Team, LiveActivityLog, AuctionHistoryItem } from '../types';
import { PlayerAvatar } from './PlayerAvatar';
import { TeamBadge } from './TeamBadge';
import { BidTimer } from './BidTimer';
import {
  Gavel,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  Zap,
  ShieldAlert,
  Repeat,
  History,
  TrendingUp,
  Award,
  Sparkles
} from 'lucide-react';

interface AuctionRoomProps {
  currentPlayer: Player | null;
  currentBid: number;
  highestBidder: Team | null;
  lastBidAmount: number;
  lastBidder: Team | null;
  timerSeconds: number;
  isTimerActive: boolean;
  isPaused: boolean;
  auctionStatus: 'idle' | 'bidding' | 'paused' | 'sold' | 'unsold' | 'complete';
  myTeam: Team | null;
  teams: Team[];
  liveLogs: LiveActivityLog[];
  history?: AuctionHistoryItem[];
  onPlaceBid: (teamId: string, amount: number) => { success: boolean; error?: string };
  onStartAuction: () => void;
  onPauseResume: () => void;
  onNextPlayer: () => void;
  onSellNow: () => void;
  onMarkUnsold: () => void;
  onResetAuction: () => void;
  onStartUnsoldRound: () => void;
  unsoldRoundActive: boolean;
  unsoldPlayersCount: number;
  availablePlayersCount: number;
  onCancelSale?: (playerId: string, sendToStage?: boolean) => void;
  onReenterAuction?: (playerId: string, sendToStage?: boolean) => void;
  currency?: string;
  totalDuration?: number;
  unlockedTeamIds?: string[];
  onOwnerCodeLogin?: (code: string, teamId?: string) => Promise<{ success: boolean; teamId?: string | null; error?: string }>;
  onOpenTeamLogin?: () => void;
  onOpenBackendOwnerBoard?: () => void;
}

export const AuctionRoom: React.FC<AuctionRoomProps> = ({
  currentPlayer,
  currentBid,
  highestBidder,
  lastBidAmount,
  lastBidder,
  timerSeconds,
  isTimerActive,
  isPaused,
  auctionStatus,
  myTeam,
  teams,
  liveLogs,
  onPlaceBid,
  onStartAuction,
  onPauseResume,
  onNextPlayer,
  onSellNow,
  onMarkUnsold,
  onResetAuction,
  onStartUnsoldRound,
  unsoldRoundActive,
  unsoldPlayersCount,
  availablePlayersCount,
  currency = '₹',
  totalDuration = 10,
  unlockedTeamIds = [],
  onOwnerCodeLogin,
  onOpenTeamLogin,
  onOpenBackendOwnerBoard
}) => {
  const [customBidInput, setCustomBidInput] = useState<string>('');
  const [bidError, setBidError] = useState<string | null>(null);
  const [ownerCodeInput, setOwnerCodeInput] = useState<string>('');
  const [ownerCodeMsg, setOwnerCodeMsg] = useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState<boolean>(false);

  // Strict single-franchise lock: activeBiddingTeam is locked to myTeam
  const activeBiddingTeam = myTeam;

  const isActiveTeamUnlocked = Boolean(
    activeBiddingTeam && unlockedTeamIds.includes(activeBiddingTeam.id)
  );

  const handleOwnerCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerCodeInput.trim() || !onOwnerCodeLogin) return;
    setIsVerifyingCode(true);
    setBidError(null);
    setOwnerCodeMsg(null);

    const res = await onOwnerCodeLogin(ownerCodeInput.trim());
    setIsVerifyingCode(false);

    if (res.success && res.teamId) {
      const t = teams.find((tm) => tm.id === res.teamId);
      setOwnerCodeMsg(`🔒 Locked to ${t?.name || 'Franchise'} (${t?.shortCode || ''})!`);
      setOwnerCodeInput('');
      setTimeout(() => setOwnerCodeMsg(null), 3500);
    } else {
      setBidError(res.error || 'Invalid hidden owner code.');
    }
  };

  // Calculate next quick bid targets
  const getNextBid = (increment: number) => {
    if (!currentPlayer) return 0;
    if (currentBid === 0) return currentPlayer.basePrice;
    return currentBid + increment;
  };

  const handleQuickBid = (increment: number) => {
    if (!activeBiddingTeam) {
      setBidError('Please select a Franchise first!');
      return;
    }
    if (!isActiveTeamUnlocked) {
      setBidError(`Owner Login Required: Enter hidden code for ${activeBiddingTeam.shortCode} first!`);
      return;
    }
    const targetAmount = getNextBid(increment);
    const result = onPlaceBid(activeBiddingTeam.id, targetAmount);
    if (!result.success && result.error) {
      setBidError(result.error);
      setTimeout(() => setBidError(null), 3000);
    } else {
      setBidError(null);
    }
  };

  const handleCustomBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBiddingTeam) {
      setBidError('Please select a Franchise first!');
      return;
    }
    if (!isActiveTeamUnlocked) {
      setBidError(`Owner Login Required: Enter hidden code for ${activeBiddingTeam.shortCode} first!`);
      return;
    }
    const amount = parseInt(customBidInput, 10);
    if (isNaN(amount) || amount <= 0) {
      setBidError('Enter a valid bid sum');
      return;
    }
    const minRequired = currentBid === 0 ? (currentPlayer?.basePrice || 0) : currentBid + 100;
    if (amount < minRequired) {
      setBidError(`Minimum valid offer is ${currency}${minRequired.toLocaleString()}`);
      return;
    }

    const result = onPlaceBid(activeBiddingTeam.id, amount);
    if (!result.success && result.error) {
      setBidError(result.error);
      setTimeout(() => setBidError(null), 3500);
    } else {
      setBidError(null);
      setCustomBidInput('');
    }
  };

  // Eligibility validation check for active bidding team
  const isMyTeamEligible = () => {
    if (!activeBiddingTeam || !currentPlayer) return { eligible: false, reason: 'No Franchise or Lot Selected' };
    if (!isActiveTeamUnlocked) {
      return {
        eligible: false,
        reason: `Locked: Enter ${activeBiddingTeam.shortCode} Owner Hidden Code above to unlock bidding`
      };
    }
    if (activeBiddingTeam.players.length >= activeBiddingTeam.maxSquadSize) {
      return { eligible: false, reason: 'Squad quota completed (18/18)' };
    }
    if (currentPlayer.isOverseas && activeBiddingTeam.overseasPlayers >= activeBiddingTeam.maxOverseasPlayers) {
      return { eligible: false, reason: 'Overseas quota reached (6/6)' };
    }
    const minNext = currentBid === 0 ? currentPlayer.basePrice : currentBid + 200;
    if (activeBiddingTeam.purse < minNext) {
      return { eligible: false, reason: 'Treasury purse insufficient' };
    }
    if (highestBidder?.id === activeBiddingTeam.id) {
      return { eligible: false, reason: `${activeBiddingTeam.shortCode} already holds highest bid — click Hammer Logo to complete bid!` };
    }
    return { eligible: true };
  };

  const eligibility = isMyTeamEligible();

  // Helper to resolve realistic previous auction valuation
  const getLastAuctionPrice = (player: Player): number => {
    if (player.lastAuctionPrice) return player.lastAuctionPrice;
    const idNum = parseInt(player.id.replace(/\D/g, '') || '1', 10);
    const mult = 1.6 + ((idNum * 7) % 15) / 10;
    return Math.round((player.basePrice * mult) / 100) * 100;
  };

  // Determine assigned or interested franchise
  const assignedTeam = currentPlayer?.soldTo
    ? teams.find((t) => t.id === currentPlayer.soldTo) || null
    : currentPlayer?.status === 'sold' && highestBidder
    ? highestBidder
    : null;

  const scoutedTeams = currentPlayer
    ? teams.filter(
        (t) =>
          t.id !== highestBidder?.id &&
          t.preferredRoles?.includes(currentPlayer.role) &&
          t.purse >= (currentBid > 0 ? currentBid + 200 : currentPlayer.basePrice)
      )
    : [];

  const primaryInterestedTeam = highestBidder || scoutedTeams[0] || (teams.length > 0 ? teams[0] : null);

  const playerLastPrice = currentPlayer ? getLastAuctionPrice(currentPlayer) : 0;
  const priceAppreciation = currentPlayer
    ? Math.round(((playerLastPrice - currentPlayer.basePrice) / currentPlayer.basePrice) * 100)
    : 0;

  return (
    <div className="w-full space-y-6 text-[#0F172A]">
      {/* Top Banner & Auctioneer Status Controls */}
      <div className="p-4 sm:p-5 bg-[#FAFAF8] border border-[#D4AF37]/40 shadow-sm flex flex-wrap items-center justify-between gap-4 rounded-none">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-[#D4AF37] animate-ping" />
          <div>
            <h3 className="font-display font-black text-lg sm:text-xl tracking-[0.05em] uppercase text-[#0F172A] leading-tight">
              {unsoldRoundActive ? 'ACCELERATED UNSOLD SESSION' : 'THE MAIN AUCTION STAGE'}
            </h3>
            <p className="text-xs font-body text-[#475569] italic">
              {availablePlayersCount} Lots Remaining In Registry · {unsoldPlayersCount} Pending Recall
            </p>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center gap-2 flex-wrap font-storybook">
          {auctionStatus === 'idle' ? (
            <button
              onClick={onStartAuction}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#b89528] text-[#0F172A] font-bold text-xs uppercase tracking-[0.05em] border border-[#D4AF37] transition cursor-pointer rounded-none shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-[#0F172A]" />
              <span>COMMENCE AUCTION</span>
            </button>
          ) : (
            <button
              onClick={onPauseResume}
              className={`flex items-center gap-1.5 px-4 py-2 font-bold text-xs uppercase tracking-[0.05em] border transition cursor-pointer rounded-none ${
                isPaused
                  ? 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200'
                  : 'bg-[#1E1E38] text-[#FFFDF9] border-[#1E1E38] hover:bg-[#2a284e]'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? 'RESUME GAVEL' : 'PAUSE GAVEL'}</span>
            </button>
          )}

          <button
            onClick={onNextPlayer}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#FAFAF8] hover:bg-[#EFECE4] text-[#0F172A] font-bold text-xs uppercase tracking-[0.05em] border border-[#D4AF37]/50 transition cursor-pointer rounded-none"
            title="Bring Next Lot to Stage"
          >
            <SkipForward className="w-3.5 h-3.5 text-[#1E1E38]" />
            <span>NEXT LOT</span>
          </button>

          <button
            onClick={onSellNow}
            disabled={!highestBidder || auctionStatus === 'sold'}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#b89528] text-[#0F172A] font-black text-xs uppercase tracking-[0.06em] border border-[#0F172A]/30 transition cursor-pointer rounded-none disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            title="Strike Hammer to Complete Bid and Finalize Sale"
          >
            <Gavel className="w-4 h-4 text-[#0F172A]" />
            <span>HAMMER BID (SOLD)</span>
          </button>

          <button
            onClick={onMarkUnsold}
            disabled={auctionStatus === 'sold' || auctionStatus === 'unsold' || !currentPlayer}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FAFAF8] hover:bg-rose-50 text-rose-800 font-bold text-xs uppercase tracking-[0.05em] border border-rose-300 transition cursor-pointer rounded-none disabled:opacity-40 disabled:cursor-not-allowed"
            title="Declare Lot Unsold"
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>MARK UNSOLD</span>
          </button>

          {unsoldPlayersCount > 0 && !unsoldRoundActive && (
            <button
              onClick={onStartUnsoldRound}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1E1E38] hover:bg-[#2a284e] text-[#D4AF37] font-bold text-xs uppercase tracking-[0.05em] border border-[#D4AF37] transition cursor-pointer rounded-none"
              title="Enter Unsold Lots Accelerated Session"
            >
              <Repeat className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>UNSOLD SESSION ({unsoldPlayersCount})</span>
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm('Reset the entire auction stage and restore all initial purses?')) {
                onResetAuction();
              }
            }}
            className="p-2 bg-[#FAFAF8] hover:bg-rose-50 text-[#475569] hover:text-rose-700 border border-[#D4AF37]/40 transition rounded-none cursor-pointer"
            title="Reset Auction"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main 3-Column Asymmetric Storybook Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Player Dossier, Last Auction Price History & Assigned/Interested Franchise */}
        <div className="lg:col-span-3 bg-[#FAFAF8] border border-[#D4AF37]/40 p-5 rounded-none shadow-sm flex flex-col justify-between space-y-4">
          <div>
            {/* Dossier Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/30 mb-4 font-body">
              <span className="text-[11px] uppercase font-storybook font-bold tracking-[0.08em] text-[#475569]">
                PLAYER DOSSIER
              </span>
              <span className="font-storybook text-xs font-bold text-[#D4AF37] tracking-wider">
                LOT #{currentPlayer ? currentPlayer.id.replace('ply_', '') : '00'}
              </span>
            </div>

            {currentPlayer ? (
              <div className="space-y-4">
                {/* Player Identity */}
                <div>
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-[#0F172A] tracking-[0.04em] leading-tight">
                    {currentPlayer.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1 text-sm font-body text-[#475569]">
                    <span className="font-semibold text-[#1E1E38]">{currentPlayer.role}</span>
                    <span>·</span>
                    <span>Age {currentPlayer.age}</span>
                  </div>
                  <div className="text-xs font-body text-[#64748B] mt-1">
                    {currentPlayer.battingStyle} · {currentPlayer.bowlingStyle}
                  </div>
                </div>

                {/* SECTION: PLAYER'S LAST AUCTION PRICE HISTORY */}
                <div className="p-3.5 bg-[#FFFDF9] border border-[#D4AF37]/40 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#D4AF37]/20">
                    <span className="text-[10px] uppercase font-storybook font-bold tracking-[0.08em] text-[#475569] flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-[#997819]" />
                      Auction Price History
                    </span>
                    <span className="text-[10px] font-storybook font-bold text-[#997819]">
                      2025/2026 Archive
                    </span>
                  </div>

                  {/* Primary Last Auction Price Display */}
                  <div className="flex items-baseline justify-between pt-0.5">
                    <div>
                      <span className="text-[10px] uppercase text-[#64748B] font-body block">
                        Last Auction Hammer
                      </span>
                      <strong className="font-storybook font-black text-xl sm:text-2xl text-[#0F172A] block leading-tight">
                        {currency}{playerLastPrice.toLocaleString()}
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase text-[#64748B] font-body block">
                        Valuation Trend
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-xs font-storybook font-bold text-emerald-700">
                        <TrendingUp className="w-3 h-3" />
                        +{priceAppreciation}% vs Reserve
                      </span>
                    </div>
                  </div>

                  {/* Historical Auction Timeline Matrix */}
                  <div className="pt-2 border-t border-[#D4AF37]/20 space-y-1.5 text-xs font-body">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] text-[11px]">2025 Grand Auction:</span>
                      <span className="font-storybook font-bold text-[#0F172A]">
                        {currency}{playerLastPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] text-[11px]">2024 Retained Valuation:</span>
                      <span className="font-storybook font-semibold text-[#475569]">
                        {currency}{Math.round((playerLastPrice * 0.72) / 100 * 100).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748B] text-[11px]">Historical Peak Hammer:</span>
                      <span className="font-storybook font-bold text-[#997819]">
                        {currency}{Math.round((playerLastPrice * 1.35) / 100 * 100).toLocaleString()}
                      </span>
                    </div>

                    {/* If player has been sold in the ongoing live session */}
                    {currentPlayer.soldPrice && (
                      <div className="mt-2 pt-2 border-t border-emerald-300/50 bg-emerald-50/70 p-2 text-emerald-950">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-storybook font-bold uppercase tracking-wider text-emerald-800">
                            2026 Live Hammer Decree
                          </span>
                          <span className="font-storybook font-black text-sm text-emerald-900">
                            {currency}{currentPlayer.soldPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION: CURRENTLY ASSIGNED OR INTERESTED TEAM NAME / LOGO */}
                <div className="p-3.5 bg-[#FFFDF9] border border-[#D4AF37]/40 shadow-xs space-y-2.5">
                  {assignedTeam ? (
                    // 1. Player is SOLD / ASSIGNED
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-emerald-600/20">
                        <span className="text-[10px] font-storybook font-bold tracking-wider text-emerald-800 uppercase flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Officially Assigned Franchise
                        </span>
                        <span className="text-[10px] font-storybook font-bold text-emerald-700">
                          Signed
                        </span>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <TeamBadge team={assignedTeam} size="md" />
                        <div>
                          <span className="font-display font-black text-base text-[#0F172A] block tracking-[0.02em] leading-tight">
                            {assignedTeam.name}
                          </span>
                          <span className="text-xs font-storybook font-semibold text-[#475569] block mt-0.5">
                            Code: <strong className="text-[#0F172A]">{assignedTeam.shortCode}</strong> · Contract: <strong className="text-emerald-700">{currency}{(currentPlayer.soldPrice || currentBid).toLocaleString()}</strong>
                          </span>
                        </div>
                      </div>

                      {assignedTeam.motto && (
                        <p className="text-[11px] text-[#64748B] italic border-t border-slate-200 pt-1.5 font-body">
                          "{assignedTeam.motto}"
                        </p>
                      )}
                    </div>
                  ) : highestBidder ? (
                    // 2. Active Bidding: Highest Bidder is Currently Interested
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#D4AF37]/30">
                        <span className="text-[10px] font-storybook font-bold tracking-wider text-[#997819] uppercase flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-[#D4AF37] animate-ping inline-block" />
                          Currently Interested (Top Bidder)
                        </span>
                        <span className="text-[10px] font-storybook font-bold text-[#1E1E38] bg-[#D4AF37]/20 px-1.5 py-0.5">
                          Front-Runner
                        </span>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <TeamBadge team={highestBidder} size="md" />
                        <div>
                          <span className="font-display font-black text-base text-[#0F172A] block tracking-[0.02em] leading-tight">
                            {highestBidder.name}
                          </span>
                          <span className="text-xs font-storybook font-semibold text-[#475569] block mt-0.5">
                            Leading Bid: <strong className="text-[#997819]">{currency}{currentBid.toLocaleString()}</strong>
                          </span>
                        </div>
                      </div>

                      {highestBidder.motto && (
                        <p className="text-[11px] text-[#64748B] italic border-t border-slate-200 pt-1.5 font-body">
                          "{highestBidder.motto}"
                        </p>
                      )}
                    </div>
                  ) : (
                    // 3. Opening Lot: Scouted & Interested Contenders
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#D4AF37]/20">
                        <span className="text-[10px] font-storybook font-bold tracking-wider text-[#475569] uppercase flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
                          Scouted & Interested Clubs
                        </span>
                        <span className="text-[10px] font-storybook font-semibold text-slate-500">
                          Target Role
                        </span>
                      </div>

                      {primaryInterestedTeam ? (
                        <div className="flex items-center gap-3 pt-1">
                          <TeamBadge team={primaryInterestedTeam} size="md" />
                          <div>
                            <span className="font-display font-black text-sm text-[#0F172A] block tracking-[0.02em] leading-tight">
                              {primaryInterestedTeam.name}
                            </span>
                            <span className="text-xs font-storybook text-[#475569] block mt-0.5">
                              Seeking <strong className="text-[#1E1E38]">{currentPlayer.role}</strong> · Treasury: {currency}{primaryInterestedTeam.purse.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic block">
                          Open to all competing franchises
                        </span>
                      )}

                      {scoutedTeams.length > 1 && (
                        <div className="pt-2 border-t border-[#D4AF37]/20 flex items-center gap-2">
                          <span className="text-[10px] font-storybook text-[#64748B] uppercase">
                            Also Scouting:
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {scoutedTeams.slice(1, 4).map((t) => (
                              <div
                                key={t.id}
                                title={t.name}
                                className="flex items-center gap-1 bg-[#FAFAF8] px-1.5 py-0.5 border border-[#D4AF37]/30 text-[10px] font-storybook font-bold"
                              >
                                <TeamBadge team={t} size="sm" />
                                <span>{t.shortCode}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-[#64748B] text-sm font-body italic">
                Stage awaiting next lot...
              </div>
            )}
          </div>

          {/* Base Price Anchor */}
          {currentPlayer && (
            <div className="pt-4 border-t border-[#D4AF37]/30 flex items-center justify-between">
              <span className="text-xs uppercase font-storybook font-bold tracking-[0.05em] text-[#475569]">
                RESERVE PRICE
              </span>
              <span className="font-storybook font-black text-2xl text-[#0F172A]">
                {currency}{currentPlayer.basePrice.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* CENTER COLUMN: The Central Auction Stage (STAGE OF HONOR) - Profile Image & Real-Time Live Bidding Details */}
        <div className="lg:col-span-5 bg-[#1E1E38] text-[#FFFDF9] border-2 border-[#D4AF37] p-5 sm:p-6 rounded-none flex flex-col items-center justify-between shadow-xl relative overflow-hidden space-y-4">
          {/* Stage Folio Top Header */}
          <div className="w-full flex items-center justify-between relative z-10 border-b border-[#D4AF37]/30 pb-3">
            <div className="flex items-center gap-2">
              <Gavel className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-storybook font-bold text-xs uppercase tracking-[0.08em] text-[#D4AF37]">
                STAGE OF HONOR
              </span>
            </div>

            {/* Auction Status Tag */}
            <div>
              {auctionStatus === 'sold' && (
                <span className="font-storybook font-black text-xs sm:text-sm uppercase tracking-wider text-emerald-300 border border-emerald-400 px-3 py-1">
                  HAMMER DROPPED · SOLD!
                </span>
              )}
              {auctionStatus === 'unsold' && (
                <span className="font-storybook font-black text-xs sm:text-sm uppercase tracking-wider text-rose-300 border border-rose-400 px-3 py-1">
                  PASSED · UNSOLD
                </span>
              )}
              {auctionStatus === 'bidding' && (
                <span className="font-storybook font-bold text-xs uppercase tracking-wider text-[#D4AF37] border border-[#D4AF37]/60 px-3 py-1 animate-pulse">
                  CONTESTED BIDDING
                </span>
              )}
              {auctionStatus === 'idle' && (
                <span className="font-body text-xs text-[#FFFDF9]/60 italic">
                  Awaiting Hammer
                </span>
              )}
            </div>
          </div>

          {/* ACTIVE PLAYER'S PROFILE IMAGE & STAGE PORTRAIT */}
          <div className="relative w-full flex flex-col items-center my-2">
            {currentPlayer ? (
              <div className="flex flex-col items-center">
                <PlayerAvatar
                  player={currentPlayer}
                  size="stage"
                  isGlowing={auctionStatus === 'bidding'}
                />

                {/* Player Name and Role Subtitle */}
                <div className="mt-3 text-center">
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-[0.04em] leading-tight">
                    {currentPlayer.name}
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-xs font-storybook text-[#D4AF37] mt-1">
                    <span>{currentPlayer.role}</span>
                    <span className="text-white/40">·</span>
                    <span>Age {currentPlayer.age}</span>
                    <span className="text-white/40">·</span>
                    <span>LOT #{currentPlayer.id.replace('ply_', '')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-60 h-72 border border-[#D4AF37]/30 bg-[#161a36] flex items-center justify-center text-[#FFFDF9]/40 font-body italic text-sm">
                No active lot on stage
              </div>
            )}
          </div>

          {/* REAL-TIME LIVE BIDDING DETAILS SCOREBOARD: Current Bid, Reserve Price, and Top Offer */}
          <div className="w-full relative z-10 bg-[#151934] border border-[#D4AF37]/50 shadow-md p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-[#D4AF37]/25">
              {/* 1. CURRENT BID */}
              <div className="pt-2 sm:pt-0 sm:pr-3 text-left">
                <span className="text-[10px] uppercase font-storybook font-bold tracking-wider text-slate-300 block mb-0.5">
                  CURRENT BID
                </span>
                <span className="font-display font-black text-2xl sm:text-3xl text-[#D4AF37] tracking-[0.02em] leading-none block">
                  {currency}
                  {currentBid > 0
                    ? currentBid.toLocaleString()
                    : currentPlayer?.basePrice.toLocaleString() || '0'}
                </span>
                <span className="text-[10px] font-storybook font-bold uppercase tracking-wider text-amber-300/80 block mt-1">
                  {currentBid > 0 ? 'Live Contested Bid' : 'Opening Reserve'}
                </span>
              </div>

              {/* 2. RESERVE PRICE */}
              <div className="pt-2 sm:pt-0 sm:px-3 text-left sm:text-center">
                <span className="text-[10px] uppercase font-storybook font-bold tracking-wider text-slate-400 block mb-0.5">
                  RESERVE PRICE
                </span>
                <span className="font-storybook font-bold text-xl sm:text-2xl text-[#FFFDF9] leading-none block sm:pt-1">
                  {currency}
                  {currentPlayer ? currentPlayer.basePrice.toLocaleString() : '0'}
                </span>
                <span className="text-[10px] text-slate-400 font-body block mt-1">
                  Base Valuation Entry
                </span>
              </div>

              {/* 3. TOP OFFER */}
              <div className="pt-2 sm:pt-0 sm:pl-3 text-left sm:text-right">
                <span className="text-[10px] uppercase font-storybook font-bold tracking-wider text-[#D4AF37] block mb-0.5">
                  TOP OFFER
                </span>
                <span className="font-display font-black text-2xl sm:text-3xl text-emerald-300 tracking-[0.02em] leading-none block">
                  {currency}
                  {currentBid > 0
                    ? currentBid.toLocaleString()
                    : currentPlayer?.basePrice.toLocaleString() || '0'}
                </span>

                {highestBidder ? (
                  <div className="flex items-center sm:justify-end gap-1.5 mt-1">
                    <TeamBadge team={highestBidder} size="sm" />
                    <span className="font-storybook font-bold text-emerald-300 text-xs">
                      {highestBidder.shortCode}
                    </span>
                    <span className="text-[10px] text-slate-300 truncate max-w-[90px] hidden sm:inline">
                      ({highestBidder.name})
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 font-body italic block mt-1">
                    Awaiting First Offer
                  </span>
                )}
              </div>
            </div>

            {/* Live Gavel Dispatch Line + Direct Stage Manual Hammer Button */}
            <div className="pt-2.5 border-t border-[#D4AF37]/25 flex flex-wrap items-center justify-between text-xs font-storybook text-slate-300 gap-2">
              {highestBidder ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Held by {highestBidder.name}
                    </span>
                    <span className="text-amber-300/90 text-[11px]">
                      Next Min Bid: {currency}
                      {getNextBid(currentBid < 5000 ? 200 : 500).toLocaleString()}
                    </span>
                  </div>

                  {auctionStatus !== 'sold' && (
                    <button
                      type="button"
                      onClick={onSellNow}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#b89528] hover:from-[#e5c247] hover:to-[#D4AF37] text-[#0F172A] font-storybook font-black text-xs uppercase tracking-[0.08em] border border-[#FFFDF9] shadow-[0_0_20px_rgba(212,175,55,0.5)] cursor-pointer transition transform hover:scale-105 active:scale-95"
                      title={`Manually Hammer Bid and Sell ${currentPlayer?.name} to ${highestBidder.name}`}
                    >
                      <Gavel className="w-4 h-4 text-[#0F172A]" />
                      <span>HAMMER BID · SOLD</span>
                    </button>
                  )}
                </>
              ) : (
                <span className="text-slate-400 font-body italic">
                  Gavel open at base reserve · Submit franchise paddle offer, then click Hammer Logo to complete bid
                </span>
              )}
            </div>

            {/* Sold Confirmation Banner (Refund managed in Backend Owner Board) */}
            {(auctionStatus === 'sold' || currentPlayer?.status === 'sold') && (
              <div className="mt-3 p-3 bg-emerald-950/90 border border-emerald-500/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-100">
                    <strong>SOLD OUT!</strong> Acquired by <strong>{highestBidder?.name || 'Franchise'}</strong> for <strong>{currency}{(currentPlayer?.soldPrice || currentBid).toLocaleString()}</strong>.
                  </span>
                </div>
                {onOpenBackendOwnerBoard && (
                  <button
                    type="button"
                    onClick={onOpenBackendOwnerBoard}
                    className="px-2.5 py-1 bg-[#1E1E38] hover:bg-[#2a284e] text-[#D4AF37] border border-[#D4AF37]/60 font-storybook font-bold text-[10px] uppercase tracking-wider shrink-0 cursor-pointer"
                  >
                    Owner Backend (Refund / Re-Auction)
                  </button>
                )}
              </div>
            )}

            {/* Unsold Notification Banner (Re-auction managed in Backend Owner Board) */}
            {(auctionStatus === 'unsold' || currentPlayer?.status === 'unsold') && (
              <div className="mt-3 p-3 bg-amber-950/90 border border-amber-500/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-amber-100">
                    <strong>PASSED UNSOLD.</strong> Reserve valuation was not met.
                  </span>
                </div>
                {onOpenBackendOwnerBoard && (
                  <button
                    type="button"
                    onClick={onOpenBackendOwnerBoard}
                    className="px-2.5 py-1 bg-[#1E1E38] hover:bg-[#2a284e] text-[#D4AF37] border border-[#D4AF37]/60 font-storybook font-bold text-[10px] uppercase tracking-wider shrink-0 cursor-pointer"
                  >
                    Owner Backend (Re-Auction)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Manual Hammer Logo Station, Bidding Paddle & Live Activity Wire */}
        <div className="lg:col-span-4 bg-[#FAFAF8] border border-[#D4AF37]/40 p-5 rounded-none shadow-sm flex flex-col justify-between">
          <div>
            {/* Manual Auctioneer Hammer Logo Station (Replaces Automatic Timer) */}
            <div className="mb-5 pb-5 border-b border-[#D4AF37]/30">
              <BidTimer
                secondsRemaining={timerSeconds}
                totalDuration={totalDuration}
                isActive={isTimerActive}
                isPaused={isPaused}
                highestBidder={highestBidder}
                currentBid={currentBid}
                currentPlayer={currentPlayer}
                auctionStatus={auctionStatus}
                currency={currency}
                onHammerStrike={onSellNow}
                onMarkUnsold={onMarkUnsold}
              />
            </div>

            {/* Franchise Bidding Console */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2 font-body">
                <span className="text-[11px] uppercase font-storybook font-bold tracking-[0.08em] text-[#475569] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>BIDDING CONSOLE</span>
                </span>
                {activeBiddingTeam && (
                  <span className="text-xs text-[#475569]">
                    {activeBiddingTeam.shortCode} Purse: <strong className="font-storybook text-[#0F172A]">{currency}{activeBiddingTeam.purse.toLocaleString()}</strong>
                  </span>
                )}
              </div>

              {/* Locked Franchise Status or Owner Login Prompt */}
              <div className="mb-3 space-y-2.5">
                {activeBiddingTeam && isActiveTeamUnlocked ? (
                  <div className="p-3 bg-[#1E1E38] border-2 border-[#D4AF37] text-[#FFFDF9] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <TeamBadge team={activeBiddingTeam} size="sm" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-storybook font-bold uppercase tracking-wider text-emerald-300 block">
                          🔒 FRANCHISE LOCKED
                        </span>
                        <span className="font-display font-black text-sm text-white block truncate">
                          {activeBiddingTeam.name} ({activeBiddingTeam.shortCode})
                        </span>
                      </div>
                    </div>
                    {onOpenTeamLogin && (
                      <button
                        type="button"
                        onClick={onOpenTeamLogin}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-[#D4AF37]/40 text-[#D4AF37] font-storybook font-bold text-[10px] uppercase cursor-pointer shrink-0"
                      >
                        Team Login
                      </button>
                    )}
                  </div>
                ) : (
                  <form
                    onSubmit={handleOwnerCodeSubmit}
                    className="p-3 bg-[#1E1E38] border-2 border-[#D4AF37] text-[#FFFDF9] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-storybook font-bold uppercase tracking-wider text-[#D4AF37]">
                        🔒 Owner Login Required to Lock 1 Franchise
                      </span>
                      {onOpenTeamLogin && (
                        <button
                          type="button"
                          onClick={onOpenTeamLogin}
                          className="text-[10px] font-storybook font-bold underline text-amber-300 cursor-pointer"
                        >
                          Open Team Login Panel
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="password"
                        value={ownerCodeInput}
                        onChange={(e) => setOwnerCodeInput(e.target.value)}
                        placeholder="Enter Owner Hidden Code..."
                        className="flex-1 px-2.5 py-1.5 bg-[#151934] border border-[#D4AF37]/50 text-white text-xs font-storybook placeholder:text-slate-400 focus:outline-none focus:border-[#D4AF37]"
                      />
                      <button
                        type="submit"
                        disabled={isVerifyingCode || !ownerCodeInput.trim()}
                        className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#b89528] text-[#0F172A] font-storybook font-black text-[10px] uppercase tracking-wider cursor-pointer disabled:opacity-40"
                      >
                        {isVerifyingCode ? '...' : 'Lock Team'}
                      </button>
                    </div>
                    {ownerCodeMsg && (
                      <div className="text-[11px] text-emerald-300 font-storybook font-bold">
                        {ownerCodeMsg}
                      </div>
                    )}
                  </form>
                )}
              </div>

              {/* Eligibility Warning */}
              {bidError && (
                <div className="mb-3 p-3 bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-body">{bidError}</span>
                </div>
              )}

              {!eligibility.eligible && eligibility.reason && (
                <div className="mb-3 p-2.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-body">{eligibility.reason}</span>
                </div>
              )}

              {/* Quick Increment Buttons */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  onClick={() => handleQuickBid(200)}
                  disabled={!eligibility.eligible || auctionStatus === 'sold' || auctionStatus === 'unsold'}
                  className="py-3 bg-[#1E1E38] hover:bg-[#2b2950] text-[#FFFDF9] font-storybook font-bold text-xs uppercase tracking-wide border border-[#D4AF37]/40 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rounded-none"
                >
                  +{currency}200
                </button>

                <button
                  onClick={() => handleQuickBid(500)}
                  disabled={!eligibility.eligible || auctionStatus === 'sold' || auctionStatus === 'unsold'}
                  className="py-3 bg-[#1E1E38] hover:bg-[#2b2950] text-[#FFFDF9] font-storybook font-bold text-xs uppercase tracking-wide border border-[#D4AF37]/40 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rounded-none"
                >
                  +{currency}500
                </button>

                <button
                  onClick={() => handleQuickBid(1000)}
                  disabled={!eligibility.eligible || auctionStatus === 'sold' || auctionStatus === 'unsold'}
                  className="py-3 bg-[#D4AF37] hover:bg-[#b89528] text-[#0F172A] font-storybook font-black text-xs uppercase tracking-wide border border-[#D4AF37] transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rounded-none shadow-sm"
                >
                  +{currency}1000
                </button>
              </div>

              {/* Custom Bid Input Form */}
              <form onSubmit={handleCustomBidSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-[#64748B] font-storybook text-xs">
                    {currency}
                  </span>
                  <input
                    type="number"
                    value={customBidInput}
                    onChange={(e) => setCustomBidInput(e.target.value)}
                    placeholder="Enter custom sum"
                    disabled={!eligibility.eligible || auctionStatus === 'sold' || auctionStatus === 'unsold'}
                    className="w-full pl-7 pr-3 py-2 bg-[#FFFDF9] border border-[#D4AF37]/50 text-xs font-storybook text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1E1E38] disabled:opacity-40 rounded-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!eligibility.eligible || !customBidInput || auctionStatus === 'sold'}
                  className="px-5 py-2 bg-[#1E1E38] hover:bg-[#2b2950] text-[#FFFDF9] font-storybook font-bold text-xs uppercase tracking-[0.05em] border border-[#D4AF37] transition disabled:opacity-30 cursor-pointer flex items-center gap-1.5 rounded-none"
                >
                  <span>OFFER</span>
                  <Send className="w-3 h-3 text-[#D4AF37]" />
                </button>
              </form>
            </div>

            {/* Live Wire & AI Commentary Feed */}
            <div>
              <div className="flex items-center justify-between mb-2 font-body">
                <span className="text-[10px] uppercase font-storybook font-bold tracking-[0.08em] text-[#475569]">
                  LIVE GAVEL WIRE & COMMENTARY
                </span>
                <span className="text-[10px] text-slate-400">Live</span>
              </div>

              <div className="h-44 sm:h-52 overflow-y-auto space-y-2 pr-1 text-xs font-body">
                {liveLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 italic">
                    Auctioneer awaiting first lot...
                  </div>
                ) : (
                  liveLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 bg-[#FFFDF9] border border-[#D4AF37]/30 text-xs flex items-start justify-between gap-2 shadow-2xs rounded-none"
                    >
                      <div className="flex items-center gap-2">
                        {log.teamCode && (
                          <span className="font-storybook font-bold px-1.5 py-0.2 bg-[#1E1E38] text-[#FFFDF9] text-[10px]">
                            {log.teamCode}
                          </span>
                        )}
                        <span className="text-[#0F172A]">{log.message}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-storybook shrink-0">
                        {log.timestamp}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Last Bid Recorded Status */}
          <div className="mt-4 pt-3 border-t border-[#D4AF37]/30 flex items-center justify-between text-xs text-[#475569] font-body">
            <span>Last Gavel Entry:</span>
            <span className="font-storybook font-bold text-[#0F172A]">
              {lastBidAmount > 0 ? (
                <>
                  {currency}{lastBidAmount.toLocaleString()}{' '}
                  <span className="text-[#D4AF37] font-semibold">({lastBidder?.shortCode || 'N/A'})</span>
                </>
              ) : (
                'None yet'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: Live Franchise Purse Tracker Cards */}
      <div className="bg-[#FAFAF8] border border-[#D4AF37]/40 p-5 rounded-none shadow-sm">
        <div className="flex items-center justify-between mb-4 font-body">
          <div className="flex items-center gap-2">
            <span className="font-storybook font-bold text-xs uppercase tracking-[0.08em] text-[#0F172A]">
              FRANCHISE TREASURY & SQUAD QUOTAS
            </span>
            <span className="text-xs text-[#475569]">· 10 Competing Clubs</span>
          </div>
          {myTeam && (
            <span className="text-xs text-[#997819] font-storybook font-bold">
              ★ {myTeam.name} (Your Club)
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {teams.map((t) => {
            const isMyTeamCard = myTeam?.id === t.id;
            const isLeader = highestBidder?.id === t.id;

            return (
              <div
                key={t.id}
                className={`p-3 border transition-all rounded-none font-body ${
                  isLeader
                    ? 'bg-[#1E1E38] text-[#FFFDF9] border-[#D4AF37] shadow-md'
                    : isMyTeamCard
                    ? 'bg-[#FFFDF9] border-[#D4AF37] shadow-sm'
                    : 'bg-[#FFFDF9] border-[#D4AF37]/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TeamBadge team={t} size="sm" />
                    <span className={`font-storybook font-bold text-xs ${isLeader ? 'text-[#FFFDF9]' : 'text-[#0F172A]'}`}>
                      {t.shortCode}
                    </span>
                  </div>
                  {isLeader && (
                    <span className="text-[9px] px-1 py-0.2 bg-[#D4AF37] text-[#0F172A] font-storybook font-black uppercase">
                      TOP
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className={isLeader ? 'text-slate-300' : 'text-[#475569]'}>Purse:</span>
                    <span className={`font-storybook font-bold ${isLeader ? 'text-emerald-300' : 'text-[#0F172A]'}`}>
                      {currency}{t.purse.toLocaleString()}
                    </span>
                  </div>

                  <div className={`flex justify-between text-[11px] ${isLeader ? 'text-slate-300' : 'text-[#475569]'}`}>
                    <span>Squad:</span>
                    <span>
                      {t.players.length}/{t.maxSquadSize} (✈{t.overseasPlayers})
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-[#EFECE4] border border-[#D4AF37]/30 overflow-hidden rounded-none mt-1">
                    <div
                      className={`h-full ${isLeader ? 'bg-[#D4AF37]' : 'bg-[#1E1E38]'}`}
                      style={{ width: `${Math.max(0, Math.min(100, (t.purse / t.initialPurse) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
