import React from 'react';
import { ViewTab, Team, Player } from '../types';
import { Play, Shield, Users, Database, BookOpen, Sparkles, Trophy, Clock } from 'lucide-react';
import { TeamBadge } from './TeamBadge';
import { PlayerAvatar } from './PlayerAvatar';

interface LandingPageProps {
  onStartAuction: () => void;
  setActiveTab: (tab: ViewTab) => void;
  teams: Team[];
  players: Player[];
  currency?: string;
  onScrollToChapter?: (chapterId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAuction,
  setActiveTab,
  teams,
  players,
  currency = '₹',
  onScrollToChapter
}) => {
  const featuredPlayer = players.find(p => p.id === 'ply_01') || players[0];
  const featuredBidder = teams[0];

  const handleJump = (id: string) => {
    if (onScrollToChapter) {
      onScrollToChapter(id);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full py-12 sm:py-20 px-4 sm:px-8 border-b-2 border-[#D4AF37]/40 bg-[#FFFDF9]">
      {/* Decorative Storybook Folio Ornamentation */}
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Storybook Sub-kicker */}
        <div className="flex items-center gap-2 mb-4 text-[#D4AF37] font-storybook font-bold text-xs uppercase tracking-[0.1em]">
          <span>✦</span>
          <span className="text-[#d4374e]">DPL 2026 AUCTION</span>
          <span>✦</span>
        </div>

        {/* Grand Storybook Title (Whimsical, Tall, Heavy Visual Weight like The BFG) */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black text-[#0F172A] tracking-[0.05em] uppercase leading-[0.95] max-w-5xl">
          DPL 2026 PLAYER <span className="gold-gradient-text">AUCTION</span>
        </h1>

        {/* Elegant Storybook Body Excerpt */}
        <p className="mt-6 text-lg sm:text-2xl text-[#1E1E38]/90 max-w-3xl font-body italic leading-relaxed">
          "Assemble the finest cricketing legion, balance the club's royal treasury, and outwit the shrewd rival syndicates under the impartial decree of the auctioneer's gavel."
        </p>

        {/* Quick Chapter Anchors in Editorial Zero-Pill Style */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-storybook text-[#475569]">
          <span className="text-[#D4AF37]">Chapters:</span>
          <button onClick={() => handleJump('section-stage')} className="hover:text-[#0F172A] underline cursor-pointer">Live Stage</button>
          <span>·</span>
          <button onClick={() => handleJump('section-squads')} className="hover:text-[#0F172A] underline cursor-pointer">Franchises</button>
          <span>·</span>
          <button onClick={() => handleJump('section-players')} className="hover:text-[#0F172A] underline cursor-pointer">Registry</button>
          <span>·</span>
          <button onClick={() => handleJump('section-history')} className="hover:text-[#0F172A] underline cursor-pointer">Chronicle</button>
          <span>·</span>
          <button onClick={() => handleJump('section-leaderboard')} className="hover:text-[#0F172A] underline cursor-pointer">Standings</button>
          <span>·</span>
          <button onClick={() => handleJump('section-rules')} className="hover:text-[#0F172A] underline cursor-pointer">Laws</button>
        </div>

        {/* Primary Storybook Actions */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => {
              onStartAuction();
              handleJump('section-stage');
            }}
            className="flex items-center gap-2.5 px-8 py-4 bg-[#D4AF37] hover:bg-[#b89528] text-[#0F172A] font-storybook font-black text-sm uppercase tracking-[0.06em] border-2 border-[#D4AF37] shadow-md hover:shadow-lg transition cursor-pointer rounded-none"
          >
            <Play className="w-4 h-4 fill-[#0F172A]" />
            <span>ENTER THE STAGE</span>
          </button>

          <button
            onClick={() => handleJump('section-squads')}
            className="flex items-center gap-2 px-7 py-4 bg-[#1E1E38] hover:bg-[#28264c] text-[#FFFDF9] font-storybook font-bold text-sm uppercase tracking-[0.05em] border border-[#D4AF37] transition cursor-pointer rounded-none shadow-sm"
          >
            <Shield className="w-4 h-4 text-[#D4AF37]" />
            <span>THE TEN FRANCHISES</span>
          </button>

          <button
            onClick={() => handleJump('section-players')}
            className="flex items-center gap-2 px-7 py-4 bg-[#FAFAF8] hover:bg-[#EFECE4] text-[#0F172A] font-storybook font-bold text-sm uppercase tracking-[0.05em] border border-[#D4AF37]/50 transition cursor-pointer rounded-none"
          >
            <Database className="w-4 h-4 text-[#1E1E38]" />
            <span>PLAYER REGISTRY</span>
          </button>
        </div>

        {/* Storybook Stage Folio Preview Card */}
        <div className="mt-16 w-full max-w-4xl bg-[#FAFAF8] border-2 border-[#D4AF37]/50 p-6 sm:p-8 shadow-md rounded-none text-left font-body">
          <div className="flex flex-wrap items-center justify-between border-b border-[#D4AF37]/30 pb-3 mb-6 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#D4AF37] inline-block" />
              <span className="font-storybook font-bold text-xs uppercase tracking-[0.08em] text-[#0F172A]">
                FRONTISPIECE · LOT NO. 01 SPOTLIGHT
              </span>
            </div>
            <span className="text-xs text-[#475569] italic">
              Estimated Value: {currency}35,000+
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Player Preview Box */}
            <div className="md:col-span-5 flex justify-center">
              <div className="p-3 bg-[#FFFDF9] border border-[#D4AF37]/40 shadow-sm">
                <PlayerAvatar player={featuredPlayer} size="lg" />
              </div>
            </div>

            {/* Details */}
            <div className="md:col-span-7 space-y-3">
              <div className="border-b border-[#D4AF37]/20 pb-2">
                <h3 className="font-display font-black text-2xl sm:text-3xl text-[#0F172A] tracking-[0.04em] leading-tight">
                  {featuredPlayer.name}
                </h3>
                <p className="text-sm text-[#475569] italic">
                  {featuredPlayer.role} · {featuredPlayer.nationality} · Batting: {featuredPlayer.battingStyle}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 bg-[#FFFDF9] border border-[#D4AF37]/30">
                  <span className="text-[#475569] text-[10px] block uppercase font-storybook">Tournament Runs</span>
                  <span className="font-storybook font-bold text-base text-[#997819]">
                    {featuredPlayer.stats.runs || 1180}
                  </span>
                </div>
                <div className="p-2.5 bg-[#FFFDF9] border border-[#D4AF37]/30">
                  <span className="text-[#475569] text-[10px] block uppercase font-storybook">Strike Rate</span>
                  <span className="font-storybook font-bold text-base text-[#0F172A]">
                    {featuredPlayer.stats.strikeRate || 148.5}
                  </span>
                </div>
                <div className="p-2.5 bg-[#FFFDF9] border border-[#D4AF37]/30">
                  <span className="text-[#475569] text-[10px] block uppercase font-storybook">Reserve Price</span>
                  <span className="font-storybook font-bold text-base text-emerald-800">
                    {currency}{featuredPlayer.basePrice.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TeamBadge team={featuredBidder} size="sm" />
                  <span className="text-xs text-[#0F172A]">
                    Opening interest registered by <strong>{featuredBidder.name}</strong>
                  </span>
                </div>
                <button
                  onClick={() => {
                    onStartAuction();
                    handleJump('section-stage');
                  }}
                  className="px-4 py-2 bg-[#1E1E38] hover:bg-[#2b2950] text-[#FFFDF9] font-storybook font-bold text-xs uppercase tracking-wide border border-[#D4AF37] transition cursor-pointer"
                >
                  Place Bid →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
