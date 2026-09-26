import React, { useState } from 'react';
import { AuctionHistoryItem, Team } from '../types';
import { TeamBadge } from './TeamBadge';
import { Award, XCircle, ArrowUpRight, RotateCcw } from 'lucide-react';

interface AuctionHistoryProps {
  history: AuctionHistoryItem[];
  teams: Team[];
  onCancelSale?: (playerId: string) => void;
  onReenterAuction?: (playerId: string) => void;
  currency?: string;
}

export const AuctionHistory: React.FC<AuctionHistoryProps> = ({
  history,
  teams,
  onCancelSale,
  onReenterAuction,
  currency = '₹'
}) => {
  const [filterType, setFilterType] = useState<'all' | 'sold' | 'unsold'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  const filteredHistory = history.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (teamFilter !== 'all' && item.winningTeam?.id !== teamFilter) return false;
    return true;
  });

  return (
    <div className="w-full space-y-6 text-[#0F172A]">
      {/* Chapter Section Header */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-[#D4AF37] font-storybook font-bold text-xs uppercase tracking-[0.1em]">
          <span>THE CHRONICLE OF BIDS & HAMMER DROPS</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-black tracking-[0.05em] uppercase text-[#0F172A] leading-tight">
          AUCTION DISPATCHES & SALE LOGS
        </h2>
        <p className="text-sm font-body italic text-[#475569] max-w-2xl mt-1">
          A permanent ink chronicle of all bids called, gavel descents, record purchases, and lots passed under reserve.
        </p>
      </div>

      {/* Filter Row in Storybook Style */}
      <div className="p-4 bg-[#FAFAF8] border border-[#D4AF37]/40 shadow-sm rounded-none font-body flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 font-storybook font-bold uppercase tracking-[0.05em]">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 border transition cursor-pointer rounded-none ${
              filterType === 'all'
                ? 'bg-[#1E1E38] text-[#FFFDF9] border-[#D4AF37]'
                : 'bg-[#FFFDF9] text-[#0F172A] border-[#D4AF37]/40 hover:bg-[#F5F2EB]'
            }`}
          >
            All Logs ({history.length})
          </button>
          <button
            onClick={() => setFilterType('sold')}
            className={`px-3 py-1.5 border transition cursor-pointer rounded-none ${
              filterType === 'sold'
                ? 'bg-emerald-800 text-white border-emerald-900'
                : 'bg-[#FFFDF9] text-[#0F172A] border-[#D4AF37]/40 hover:bg-[#F5F2EB]'
            }`}
          >
            Hammer Dropped ({history.filter(h => h.type === 'sold').length})
          </button>
          <button
            onClick={() => setFilterType('unsold')}
            className={`px-3 py-1.5 border transition cursor-pointer rounded-none ${
              filterType === 'unsold'
                ? 'bg-rose-800 text-white border-rose-900'
                : 'bg-[#FFFDF9] text-[#0F172A] border-[#D4AF37]/40 hover:bg-[#F5F2EB]'
            }`}
          >
            Passed Lots ({history.filter(h => h.type === 'unsold').length})
          </button>
        </div>

        {/* Team filter dropdown */}
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="px-3 py-1.5 bg-[#FFFDF9] border border-[#D4AF37]/40 text-xs font-storybook text-[#0F172A] focus:outline-none focus:border-[#1E1E38] rounded-none"
        >
          <option value="all">All Franchises</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* History Ledger Cards */}
      {filteredHistory.length === 0 ? (
        <div className="p-12 text-center bg-[#FAFAF8] border border-[#D4AF37]/35 text-[#64748B] font-body italic text-sm rounded-none">
          No auction hammer events recorded in the ledger yet. Bids and sales will appear here automatically.
        </div>
      ) : (
        <div className="space-y-3 font-body">
          {filteredHistory.map((item) => {
            const isSold = item.type === 'sold';
            const priceIncrease = isSold && item.finalPrice ? item.finalPrice - item.player.basePrice : 0;
            const pctIncrease = isSold && item.finalPrice
              ? Math.round((priceIncrease / item.player.basePrice) * 100)
              : 0;

            return (
              <div
                key={item.id}
                className="p-5 bg-[#FAFAF8] border border-[#D4AF37]/35 shadow-sm rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: Player & Outcome */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 border border-[#D4AF37]/50 bg-[#FFFDF9] flex items-center justify-center text-lg shrink-0">
                    {isSold ? <Award className="w-5 h-5 text-[#997819]" /> : <XCircle className="w-5 h-5 text-rose-700" />}
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2">
                      <h4 className="font-display font-black text-xl text-[#0F172A] tracking-[0.04em]">
                        {item.player.name}
                      </h4>
                      <span className="text-xs text-[#64748B] font-body italic">
                        ({item.player.role} · {item.player.nationality})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#475569] mt-1">
                      <span>Reserve: <strong>{currency}{item.player.basePrice.toLocaleString()}</strong></span>
                      <span>·</span>
                      <span>Bids Exchanged: <strong>{item.bids.length}</strong></span>
                      <span>·</span>
                      <span className="font-storybook text-[#64748B]">{item.timestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Winning Franchise & Final Hammer Sum */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-6 self-end sm:self-auto">
                  {isSold && item.winningTeam ? (
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5 mb-0.5">
                        <TeamBadge team={item.winningTeam} size="sm" />
                        <span className="font-storybook font-bold text-xs text-[#0F172A]">
                          {item.winningTeam.name}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-end gap-2">
                        <strong className="font-storybook font-black text-xl text-[#0F172A]">
                          {currency}{item.finalPrice?.toLocaleString()}
                        </strong>
                        {pctIncrease > 0 && (
                          <span className="text-xs font-storybook text-emerald-800">
                            +{pctIncrease}%
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="font-storybook font-bold text-sm text-rose-800 uppercase tracking-wide">
                        PASSED UNSOLD
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
