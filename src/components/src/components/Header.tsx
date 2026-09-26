import React, { useState } from 'react';
import { ViewTab, Team, Player } from '../types';
import { Volume2, VolumeX, Shield, Sliders, Menu, X, Sparkles, BookOpen } from 'lucide-react';
import { TeamBadge } from './TeamBadge';

interface HeaderProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  myTeam: Team | null;
  currentPlayer: Player | null;
  currentBid: number;
  highestBidder: Team | null;
  timerSeconds: number;
  isAuctionActive: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
  onOpenTeamLogin?: () => void;
  isAdminLoggedIn: boolean;
  currency?: string;
  onNavigateSection?: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  myTeam,
  currentPlayer,
  currentBid,
  highestBidder,
  timerSeconds,
  isAuctionActive,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
  onOpenAdmin,
  onOpenTeamLogin,
  isAdminLoggedIn,
  currency = '₹',
  onNavigateSection
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sections = [
    { id: 'section-stage', label: 'The Stage' },
    { id: 'section-squads', label: 'Franchises' },
    { id: 'section-players', label: 'Player Registry' },
    { id: 'section-history', label: 'Chronicle of Bids' },
    { id: 'section-leaderboard', label: 'Standings' },
    { id: 'section-rules', label: 'The Laws' }
  ];

  const handleScrollTo = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (activeTab === 'landing') {
      setActiveTab('auction');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      if (onNavigateSection) {
        onNavigateSection(sectionId);
      } else {
        const el = document.getElementById(sectionId);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFDF9]/95 backdrop-blur-md border-b-2 border-[#D4AF37]/40 shadow-sm text-[#0F172A]">
      {/* Topmost Storybook Folio Banner */}
      <div className="w-full bg-[#1E1E38] text-[#FFFDF9] px-4 sm:px-8 py-2 border-b border-[#D4AF37]/30 flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-3">
          {/* Live Stage Status Line without pills */}
          <span className="font-storybook font-bold tracking-[0.05em] uppercase text-[#D4AF37] flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 bg-[#D4AF37] animate-ping inline-block" />
            Live Grand Auction
          </span>

          <span className="text-[#D4AF37]/40">·</span>

          {currentPlayer && isAuctionActive ? (
            <div className="hidden sm:flex items-center gap-2 text-[#FFFDF9]/90 font-body text-sm">
              <span className="text-[#D4AF37]/80 italic">Present Lot:</span>
              <strong className="font-storybook font-bold tracking-wide text-white">{currentPlayer.name}</strong>
              <span className="text-[#D4AF37]/40">·</span>
              <span className="text-[#D4AF37]/80 italic">Bid:</span>
              <span className="font-storybook font-bold text-[#D4AF37]">
                {currency}{currentBid > 0 ? currentBid.toLocaleString() : currentPlayer.basePrice.toLocaleString()}
              </span>
              {highestBidder && (
                <>
                  <span className="text-[#D4AF37]/40">·</span>
                  <span className="text-[#D4AF37]/80 italic">Leading:</span>
                  <span className="font-semibold text-emerald-300">{highestBidder.shortCode}</span>
                </>
              )}
              <span className="text-[#D4AF37]/40">·</span>
              <span className="font-storybook font-bold text-amber-300 uppercase tracking-wider text-xs">
                Manual Hammer
              </span>
            </div>
          ) : (
            <span className="text-[#FFFDF9]/75 text-xs font-body italic hidden sm:inline">
              DPL 2026 Auction · Official Player Auction Chronicle & Comprehensive Roster
            </span>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3 ml-auto">
          {myTeam && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-body text-[#FFFDF9]/90 border-r border-[#D4AF37]/30 pr-3">
              <span className="font-storybook font-bold text-emerald-300 uppercase tracking-wider">
                🔒 Locked: {myTeam.shortCode}
              </span>
              <span className="text-[#D4AF37]/40">·</span>
              <span className="italic text-[#D4AF37]">Purse:</span>
              <span className="font-storybook font-bold text-emerald-300 text-sm">
                {currency}{myTeam.purse.toLocaleString()}
              </span>
              <span className="text-slate-400">({myTeam.players.length}/{myTeam.maxSquadSize})</span>
            </div>
          )}

          <button
            onClick={onToggleSound}
            aria-label="Toggle Sound"
            className="p-1 hover:text-[#D4AF37] transition text-[#FFFDF9]/80"
            title={soundEnabled ? 'Mute Atmosphere' : 'Unmute Atmosphere'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#D4AF37]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="p-1 hover:text-[#D4AF37] transition text-[#FFFDF9]/80"
            title="Auction Simulation Mechanics"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Control Panel 1: Franchise Team Login */}
          {onOpenTeamLogin && (
            <button
              onClick={onOpenTeamLogin}
              aria-label="Franchise Team Login"
              className="px-3 py-1 text-xs font-storybook font-bold tracking-[0.05em] uppercase flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-[#0F172A] border border-emerald-400 transition cursor-pointer shadow-sm rounded-none"
              title="Franchise Owner Hidden Code Login (Choose & Lock 1 Team)"
            >
              <span>{myTeam ? `🔒 ${myTeam.shortCode} LOCKED` : 'TEAM LOGIN'}</span>
            </button>
          )}

          {/* Control Panel 2: Master Owner Board */}
          <button
            onClick={onOpenAdmin}
            aria-label="Owner Board"
            className="px-3 py-1 text-xs font-storybook font-bold tracking-[0.05em] uppercase flex items-center gap-1.5 bg-[#D4AF37] hover:bg-[#b89528] text-[#0F172A] border border-[#D4AF37] transition cursor-pointer shadow-sm rounded-none"
            title="Open Master Owner Board (Email & Password Login)"
          >
            <Shield className="w-3.5 h-3.5 text-[#0F172A]" />
            <span>OWNER BOARD</span>
            {isAdminLoggedIn && (
              <span className="w-1.5 h-1.5 bg-[#0F172A] inline-block animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Title & Brand with Whimsical Hand-drawn Tall Serif Feel */}
        <div
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-3.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 border-2 border-[#D4AF37] bg-[#1E1E38] text-[#D4AF37] flex items-center justify-center text-xl shadow-sm rounded-none">
            <span>🏏</span>
          </div>
          <div className="text-left">
            <h1 className="font-display font-black text-2xl sm:text-3xl text-[#0F172A] leading-none tracking-[0.05em] uppercase group-hover:text-[#1E1E38] transition">
              DPL CRICKET AUCTION
            </h1>
            <p className="text-xs font-body italic text-[#475569] tracking-wide mt-0.5">
              The Grand Chronicle of Champions · Season 2026
            </p>
          </div>
        </div>

        {/* Desktop Single-Page Chapter Nav Links */}
        <nav className="hidden lg:flex items-center gap-5 font-body text-sm text-[#0F172A]">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => handleScrollTo(sec.id)}
              className="group flex items-baseline gap-1 py-1 hover:text-[#1E1E38] transition border-b-2 border-transparent hover:border-[#D4AF37] cursor-pointer"
            >
              <span className="font-storybook font-semibold tracking-[0.03em]">
                {sec.label}
              </span>
            </button>
          ))}
        </nav>

        {/* My Franchise Selector */}
        <div className="hidden sm:flex items-center gap-2">
          {myTeam ? (
            <button
              onClick={() => handleScrollTo('section-squads')}
              className="flex items-center gap-2.5 px-3 py-1.5 border border-[#D4AF37]/50 bg-[#FAFAF8] hover:bg-[#F5F2EB] transition text-left cursor-pointer rounded-none"
              title="View Franchise Roster"
            >
              <TeamBadge team={myTeam} size="sm" />
              <div>
                <span className="text-[10px] text-[#475569] uppercase font-body block leading-none">Chosen Franchise</span>
                <span className="font-storybook font-bold text-xs text-[#0F172A] tracking-[0.03em]">{myTeam.shortCode}</span>
              </div>
            </button>
          ) : (
            <button
              onClick={() => handleScrollTo('section-squads')}
              className="px-4 py-2 border border-[#D4AF37] bg-[#1E1E38] text-[#FFFDF9] hover:bg-[#252347] font-storybook font-bold text-xs uppercase tracking-[0.05em] transition cursor-pointer rounded-none"
            >
              Select Franchise
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 border border-[#D4AF37]/50 bg-[#FAFAF8] text-[#0F172A] rounded-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Chapter Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FFFDF9] border-b-2 border-[#D4AF37]/40 px-5 py-4 space-y-3 font-body">
          {myTeam && (
            <div className="p-3 border border-[#D4AF37]/40 bg-[#FAFAF8] flex items-center justify-between rounded-none">
              <div className="flex items-center gap-2.5">
                <TeamBadge team={myTeam} size="sm" />
                <div>
                  <span className="text-sm font-storybook font-bold text-[#0F172A] block">{myTeam.name}</span>
                  <span className="text-xs text-emerald-800 font-storybook">
                    Purse: {currency}{myTeam.purse.toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleScrollTo('section-squads')}
                className="text-xs text-[#D4AF37] font-semibold underline"
              >
                Change
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 pt-1">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => handleScrollTo(sec.id)}
                className="flex items-center justify-between py-2 px-3 border-b border-[#D4AF37]/20 text-left hover:bg-[#FAFAF8] transition"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-storybook font-bold text-sm tracking-[0.04em] text-[#0F172A]">{sec.label}</span>
                </div>
                <span className="text-xs text-slate-400">View Chapter →</span>
              </button>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                onOpenAdmin();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 bg-[#1E1E38] hover:bg-[#252347] text-[#FFFDF9] border border-[#D4AF37] font-storybook font-bold text-xs uppercase tracking-[0.05em] flex items-center justify-center gap-2 rounded-none"
            >
              <Shield className="w-4 h-4 text-[#D4AF37]" />
              <span>Open Owner Board & Database</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
