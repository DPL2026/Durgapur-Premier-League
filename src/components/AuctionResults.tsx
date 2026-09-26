import React from 'react';
import { Team, Player, AuctionHistoryItem } from '../types';
import { TeamBadge } from './TeamBadge';
import { PlayerAvatar } from './PlayerAvatar';
import { Trophy, Award, Users, DollarSign, Plane, RotateCcw, X, ArrowRight } from 'lucide-react';

interface AuctionResultsProps {
  isOpen: boolean;
  onClose: () => void;
  myTeam: Team | null;
  teams: Team[];
  allPlayers: Player[];
  history: AuctionHistoryItem[];
  onResetAuction: () => void;
  currency?: string;
}

export const AuctionResults: React.FC<AuctionResultsProps> = ({
  isOpen,
  onClose,
  myTeam,
  teams,
  allPlayers,
  history,
  onResetAuction,
  currency = '₹'
}) => {
  if (!isOpen) return null;

  const soldPlayers = allPlayers.filter(p => p.status === 'sold');
  const unsoldPlayers = allPlayers.filter(p => p.status === 'unsold');

  // Most expensive player in tournament
  const mostExpensive = soldPlayers.reduce(
    (max, p) => (p.soldPrice && p.soldPrice > (max?.soldPrice || 0) ? p : max),
    null as Player | null
  );

  const totalSpentAcrossLeague = teams.reduce((acc, t) => acc + (t.initialPurse - t.purse), 0);
  const totalBidsCount = history.reduce((acc, h) => acc + h.bids.length, 0);

  // My team metrics
  const myTeamSquad = myTeam ? allPlayers.filter(p => myTeam.players.includes(p.id)) : [];
  const myTeamTotalSpent = myTeam ? myTeam.initialPurse - myTeam.purse : 0;
  const myTeamAvgPrice = myTeamSquad.length > 0 ? Math.round(myTeamTotalSpent / myTeamSquad.length) : 0;
  const myTeamHighestBuy = myTeamSquad.reduce(
    (max, p) => (p.soldPrice && p.soldPrice > (max?.soldPrice || 0) ? p : max),
    null as Player | null
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl my-auto rounded-3xl bg-gradient-to-b from-[#0e1424] via-[#090d16] to-[#05070c] border-2 border-amber-400/70 p-6 sm:p-8 shadow-[0_0_80px_rgba(245,158,11,0.3)] space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Trophy className="w-4 h-4" />
            <span>SEASON CONCLUSION</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-black text-white tracking-wide uppercase">
            AUCTION <span className="text-amber-400">COMPLETE</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            All bidding lots have concluded! Here is the comprehensive championship squad and financial breakdown.
          </p>
        </div>

        {/* My Team Spotlight Card */}
        {myTeam && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/30 border border-amber-500/40 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <TeamBadge team={myTeam} size="md" />
                <div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase block">
                    MY FRANCHISE SUMMARY
                  </span>
                  <h3 className="font-score font-black text-xl text-white">
                    {myTeam.name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Remaining Purse:</span>
                <span className="font-score font-bold text-emerald-400 text-lg">
                  {currency}{myTeam.purse.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Total Squad</span>
                <span className="font-score font-black text-white text-base">
                  {myTeamSquad.length} <span className="text-slate-500 text-xs font-normal">/ {myTeam.maxSquadSize}</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Total Spent</span>
                <span className="font-score font-black text-amber-400 text-base">
                  {currency}{myTeamTotalSpent.toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Average Price</span>
                <span className="font-score font-black text-white text-base">
                  {currency}{myTeamAvgPrice.toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Overseas Count</span>
                <span className="font-score font-black text-blue-400 text-base">
                  {myTeam.overseasPlayers} <span className="text-slate-500 text-xs font-normal">/ {myTeam.maxOverseasPlayers}</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Top Purchase</span>
                <span className="font-score font-bold text-white text-xs truncate block" title={myTeamHighestBuy?.name}>
                  {myTeamHighestBuy ? `${myTeamHighestBuy.name} (${currency}${myTeamHighestBuy.soldPrice?.toLocaleString()})` : 'None'}
                </span>
              </div>
            </div>

            {/* My Squad Roster Grid */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                FINAL SQUAD ROSTER ({myTeamSquad.length} PLAYERS)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                {myTeamSquad.map(p => (
                  <div key={p.id} className="p-2 rounded-lg bg-slate-950/90 border border-slate-800/90 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block truncate max-w-[120px]">
                        {p.name} {p.isOverseas && '✈'}
                      </span>
                      <span className="text-[10px] text-slate-400">{p.role}</span>
                    </div>
                    <span className="font-score font-bold text-amber-400 text-xs shrink-0">
                      {currency}{p.soldPrice?.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tournament-Wide Summary Stats */}
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-3">
            TOURNAMENT-WIDE AUCTION STATS
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-slate-400 block mb-0.5">Total League Spend</span>
              <span className="font-score font-black text-xl text-amber-400">
                {currency}{totalSpentAcrossLeague.toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-slate-400 block mb-0.5">Total Players Bought</span>
              <span className="font-score font-black text-xl text-white">
                {soldPlayers.length}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-slate-400 block mb-0.5">Total Bids Placed</span>
              <span className="font-score font-black text-xl text-sky-400">
                {totalBidsCount}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-slate-400 block mb-0.5">Unsold Registry</span>
              <span className="font-score font-black text-xl text-rose-400">
                {unsoldPlayers.length}
              </span>
            </div>
          </div>
        </div>

        {/* Most Expensive Star Player */}
        {mostExpensive && (
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-amber-400" />
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase block">
                  MOST EXPENSIVE PLAYER OF DPL 2026
                </span>
                <span className="font-score font-black text-xl text-white">
                  {mostExpensive.name} ({mostExpensive.role})
                </span>
                <span className="text-xs text-slate-400 block">
                  {mostExpensive.nationality} {mostExpensive.isOverseas ? '✈' : '🇮🇳'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                PURCHASE PRICE
              </span>
              <span className="font-score font-black text-2xl text-amber-400">
                {currency}{mostExpensive.soldPrice?.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm('Reset auction simulation back to beginning?')) {
                onResetAuction();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Auction</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-score font-bold text-xs uppercase transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
