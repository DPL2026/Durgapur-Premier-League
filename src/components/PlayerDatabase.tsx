import React, { useState, useMemo } from 'react';
import { Player, Team } from '../types';
import { PlayerAvatar } from './PlayerAvatar';
import { TeamBadge } from './TeamBadge';
import { Search, Play, Lock, Database, Upload, Eye, X, CheckCircle2 } from 'lucide-react';

interface PlayerDatabaseProps {
  players: Player[];
  teams: Team[];
  onSetCurrentPlayer?: (player: Player) => void;
  onOpenOwnerBoard?: () => void;
  isAdminLoggedIn?: boolean;
  currency?: string;
}

export const PlayerDatabase: React.FC<PlayerDatabaseProps> = ({
  players,
  teams,
  onSetCurrentPlayer,
  onOpenOwnerBoard,
  isAdminLoggedIn = false,
  currency = '₹'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price_desc' | 'price_asc' | 'age'>('price_desc');
  const [selectedPlayerModal, setSelectedPlayerModal] = useState<Player | null>(null);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => {
        const matchSearch =
          searchTerm === '' ||
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.role.toLowerCase().includes(searchTerm.toLowerCase());

        const matchRole = roleFilter === 'all' || p.role === roleFilter;
        const matchStatus = statusFilter === 'all' || p.status === statusFilter;

        return matchSearch && matchRole && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'price_desc') return b.basePrice - a.basePrice;
        if (sortBy === 'price_asc') return a.basePrice - b.basePrice;
        if (sortBy === 'age') return a.age - b.age;
        return a.name.localeCompare(b.name);
      });
  }, [players, searchTerm, roleFilter, statusFilter, sortBy]);

  const uploadedPhotosCount = useMemo(
    () => players.filter((p) => Boolean(p.photo)).length,
    [players]
  );

  return (
    <div className="w-full space-y-6 text-[#0F172A]">
      {/* Chapter Section Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 text-[#D4AF37] font-storybook font-bold text-xs uppercase tracking-[0.1em]">
            <Database className="w-4 h-4 text-[#D4AF37]" />
            <span>OFFICIAL SHARED PLAYER DATABASE · LIVE FOR ALL WEBSITE USERS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-black tracking-[0.05em] uppercase text-[#0F172A] leading-tight">
            PLAYER DETAILS & UPLOADED PICTURES DATABASE
          </h2>
          <p className="text-sm font-body italic text-[#475569] max-w-2xl mt-1">
            Official player profiles and natural, unfiltered athlete portraits uploaded exclusively by the Tournament Owner and synchronized live for every website user.
          </p>
        </div>

        {/* Owner-Only Upload Button */}
        {onOpenOwnerBoard && (
          <div className="flex flex-col items-end gap-1.5">
            <button
              type="button"
              onClick={onOpenOwnerBoard}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1E1E38] hover:bg-[#2b2950] text-[#FFFDF9] border-2 border-[#D4AF37] font-storybook font-bold text-xs uppercase tracking-wider shadow-md transition cursor-pointer rounded-none"
            >
              {isAdminLoggedIn ? (
                <>
                  <Upload className="w-4 h-4 text-[#D4AF37]" />
                  <span>Upload Player Details & Image (Owner Active)</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-[#D4AF37]" />
                  <span>Owner Only: Upload Player Details & Image</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-[#475569] font-body flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>
                {players.length} Players Listed · {uploadedPhotosCount} Uploaded Pictures Live
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Storybook Filter Deck */}
      <div className="p-5 bg-[#FAFAF8] border border-[#D4AF37]/40 shadow-sm rounded-none font-body">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Field */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#64748B]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search player name or role..."
              className="w-full pl-9 pr-3 py-2 bg-[#FFFDF9] border border-[#D4AF37]/40 text-xs font-body text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1E1E38] rounded-none"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#D4AF37]/40 text-xs font-storybook text-[#0F172A] focus:outline-none focus:border-[#1E1E38] rounded-none"
            >
              <option value="all">All Roles</option>
              <option value="Batter">Batters</option>
              <option value="Fast Bowler">Fast Bowlers</option>
              <option value="Spin Bowler">Spin Bowlers</option>
              <option value="All-rounder">All-rounders</option>
              <option value="Wicketkeeper">Wicketkeepers</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#FFFDF9] border border-[#D4AF37]/40 text-xs font-storybook text-[#0F172A] focus:outline-none focus:border-[#1E1E38] rounded-none"
            >
              <option value="price_desc">Reserve: High to Low</option>
              <option value="price_asc">Reserve: Low to High</option>
              <option value="name">Alphabetical</option>
              <option value="age">Age</option>
            </select>
          </div>
        </div>

        {/* Count summary */}
        <div className="mt-3 pt-3 border-t border-[#D4AF37]/25 flex flex-wrap items-center justify-between gap-2 text-xs text-[#475569]">
          <span>
            Showing <strong>{filteredPlayers.length}</strong> Owner-verified players in shared website database
          </span>
          <div className="flex items-center gap-2">
            <span>Filter Status:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`font-storybook font-semibold cursor-pointer ${statusFilter === 'all' ? 'text-[#0F172A] underline' : 'text-[#64748B]'}`}
            >
              All ({players.length})
            </button>
            <span>·</span>
            <button
              onClick={() => setStatusFilter('available')}
              className={`font-storybook font-semibold cursor-pointer ${statusFilter === 'available' ? 'text-[#0F172A] underline' : 'text-[#64748B]'}`}
            >
              Available ({players.filter((p) => p.status === 'available').length})
            </button>
            <span>·</span>
            <button
              onClick={() => setStatusFilter('sold')}
              className={`font-storybook font-semibold cursor-pointer ${statusFilter === 'sold' ? 'text-[#0F172A] underline' : 'text-[#64748B]'}`}
            >
              Sold ({players.filter((p) => p.status === 'sold').length})
            </button>
            <span>·</span>
            <button
              onClick={() => setStatusFilter('unsold')}
              className={`font-storybook font-semibold cursor-pointer ${statusFilter === 'unsold' ? 'text-[#0F172A] underline' : 'text-[#64748B]'}`}
            >
              Unsold ({players.filter((p) => p.status === 'unsold').length})
            </button>
          </div>
        </div>
      </div>

      {/* Player Cards Grid with Large Uploaded Picture Showcase */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredPlayers.map((player) => {
          const soldTeam = player.soldTo ? teams.find((t) => t.id === player.soldTo) : null;

          return (
            <div
              key={player.id}
              className="bg-[#FAFAF8] border-2 border-[#D4AF37]/40 shadow-sm rounded-none font-body flex flex-col justify-between hover:border-[#D4AF37] transition overflow-hidden group"
            >
              {/* Top Large Unfiltered Player Picture Showcase */}
              <div>
                <div
                  onClick={() => setSelectedPlayerModal(player)}
                  className="relative w-full h-60 bg-[#0F172A] overflow-hidden flex items-center justify-center cursor-pointer border-b border-[#D4AF37]/30"
                  title="Click to view full uploaded picture and player profile"
                >
                  {player.photo ? (
                    <img
                      src={player.photo}
                      alt={player.name}
                      className="w-full h-full object-cover object-top"
                      style={{ filter: 'none', mixBlendMode: 'normal' }}
                    />
                  ) : (
                    <div className="py-4">
                      <PlayerAvatar player={player} size="lg" />
                    </div>
                  )}

                  {/* Top Lot Tag */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#0F172A]/85 border border-[#D4AF37]/60 text-[#D4AF37] font-storybook font-bold text-[10px] uppercase tracking-wider">
                    LOT #{player.id.replace('ply_', '')}
                  </div>

                  {/* Top Right Status Pill */}
                  <div className="absolute top-2.5 right-2.5">
                    {player.status === 'sold' ? (
                      <span className="px-2 py-0.5 bg-emerald-700 text-white font-storybook font-bold text-[10px] uppercase tracking-wider">
                        SOLD · {soldTeam?.shortCode || ''}
                      </span>
                    ) : player.status === 'unsold' ? (
                      <span className="px-2 py-0.5 bg-rose-700 text-white font-storybook font-bold text-[10px] uppercase tracking-wider">
                        UNSOLD
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-[#1E1E38] border border-[#D4AF37]/50 text-[#FFFDF9] font-storybook font-bold text-[10px] uppercase tracking-wider">
                        AVAILABLE
                      </span>
                    )}
                  </div>

                  {/* View Full Picture button on hover */}
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-[#0F172A]/85 border border-[#D4AF37]/50 text-[#FFFDF9] text-[10px] font-storybook uppercase tracking-wider flex items-center gap-1 opacity-90 group-hover:opacity-100">
                    <Eye className="w-3 h-3 text-[#D4AF37]" />
                    <span>View Picture</span>
                  </div>
                </div>

                {/* Player Details Body */}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] text-[#997819] uppercase font-storybook font-bold tracking-wider">
                      {player.role}
                    </span>
                    <span className="text-[11px] text-[#475569] font-body">
                      Age {player.age} · {player.nationality}
                    </span>
                  </div>

                  <h4
                    onClick={() => setSelectedPlayerModal(player)}
                    className="font-display font-black text-xl text-[#0F172A] tracking-[0.04em] leading-tight cursor-pointer hover:text-[#997819] transition"
                  >
                    {player.name}
                  </h4>

                  <div className="mt-1.5 text-[11px] text-[#475569] space-y-0.5">
                    <div>
                      <span className="text-[#64748B]">Bat:</span> {player.battingStyle || 'Right-hand bat'}
                    </div>
                    {player.bowlingStyle && (
                      <div>
                        <span className="text-[#64748B]">Bowl:</span> {player.bowlingStyle}
                      </div>
                    )}
                  </div>

                  {/* Key Stats Line */}
                  <div className="mt-3 pt-2.5 border-t border-[#D4AF37]/25 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#64748B] block font-body">Matches</span>
                      <strong className="font-storybook text-[#0F172A]">{player.stats.matches}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] block font-body">Runs / Wkt</span>
                      <strong className="font-storybook text-[#997819]">
                        {player.stats.runs ?? 0}/{player.stats.wickets ?? 0}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] block font-body">Strike Rate</span>
                      <strong className="font-storybook text-[#0F172A]">
                        {player.stats.strikeRate ?? '-'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Reserve Price & Stage Action */}
              <div className="px-4 py-3 bg-[#FFFDF9] border-t border-[#D4AF37]/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-storybook text-[#64748B] block leading-none">
                    {player.status === 'sold' ? 'Sold Price' : 'Reserve Price'}
                  </span>
                  <strong className="font-storybook font-bold text-base text-[#0F172A]">
                    {currency}
                    {player.soldPrice
                      ? player.soldPrice.toLocaleString()
                      : player.basePrice.toLocaleString()}
                  </strong>
                </div>

                {player.status === 'available' && onSetCurrentPlayer ? (
                  <button
                    onClick={() => {
                      onSetCurrentPlayer(player);
                      document.getElementById('section-stage')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#1E1E38] hover:bg-[#2b2950] text-[#FFFDF9] font-storybook font-bold text-xs uppercase tracking-wider border border-[#D4AF37] transition cursor-pointer rounded-none"
                    title="Bring lot directly to auction stage"
                  >
                    <Play className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                    <span>STAGE</span>
                  </button>
                ) : soldTeam ? (
                  <div className="flex items-center gap-1.5">
                    <TeamBadge team={soldTeam} size="sm" />
                    <span className="font-storybook font-bold text-xs text-emerald-800">
                      {soldTeam.shortCode}
                    </span>
                  </div>
                ) : (
                  <span className="font-storybook text-xs text-rose-700 font-semibold">
                    UNSOLD
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Player Picture & Details Modal for Any Website User */}
      {selectedPlayerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedPlayerModal(null)}
        >
          <div
            className="w-full max-w-2xl bg-[#FFFDF9] border-2 border-[#D4AF37] shadow-2xl overflow-hidden text-[#0F172A]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#1E1E38] text-[#FFFDF9] border-b border-[#D4AF37]">
              <div>
                <span className="text-[10px] font-storybook uppercase tracking-widest text-[#D4AF37] block">
                  LOT #{selectedPlayerModal.id.replace('ply_', '')} · OFFICIAL PLAYER PROFILE
                </span>
                <h3 className="font-display font-black text-xl tracking-wider uppercase">
                  {selectedPlayerModal.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlayerModal(null)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5">
              {/* Left: Full Unfiltered Uploaded Picture */}
              <div className="bg-[#0F172A] border border-[#D4AF37]/50 flex items-center justify-center min-h-[280px] max-h-[380px] overflow-hidden">
                {selectedPlayerModal.photo ? (
                  <img
                    src={selectedPlayerModal.photo}
                    alt={selectedPlayerModal.name}
                    className="w-full h-full object-contain"
                    style={{ filter: 'none', mixBlendMode: 'normal' }}
                  />
                ) : (
                  <PlayerAvatar player={selectedPlayerModal} size="stage" />
                )}
              </div>

              {/* Right: Complete Player Details */}
              <div className="flex flex-col justify-between space-y-4 font-body text-xs">
                <div className="space-y-3">
                  <div className="p-3 bg-[#FAFAF8] border border-[#D4AF37]/30">
                    <span className="text-[10px] uppercase font-storybook text-[#64748B] block">
                      Primary Role & Age
                    </span>
                    <strong className="font-storybook text-sm text-[#0F172A]">
                      {selectedPlayerModal.role} · Age {selectedPlayerModal.age} ({selectedPlayerModal.nationality})
                    </strong>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-[#FAFAF8] border border-[#D4AF37]/30">
                      <span className="text-[10px] text-[#64748B] block">Batting Style</span>
                      <strong className="text-[#0F172A]">{selectedPlayerModal.battingStyle || '-'}</strong>
                    </div>
                    <div className="p-2.5 bg-[#FAFAF8] border border-[#D4AF37]/30">
                      <span className="text-[10px] text-[#64748B] block">Bowling Style</span>
                      <strong className="text-[#0F172A]">{selectedPlayerModal.bowlingStyle || '-'}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-[#FAFAF8] border border-[#D4AF37]/30">
                      <span className="text-[10px] text-[#64748B] block">Matches Played</span>
                      <strong className="font-storybook text-sm text-[#0F172A]">
                        {selectedPlayerModal.stats.matches}
                      </strong>
                    </div>
                    <div className="p-2.5 bg-[#FAFAF8] border border-[#D4AF37]/30">
                      <span className="text-[10px] text-[#64748B] block">Runs / Wickets</span>
                      <strong className="font-storybook text-sm text-[#997819]">
                        {selectedPlayerModal.stats.runs ?? 0} Runs / {selectedPlayerModal.stats.wickets ?? 0} Wkts
                      </strong>
                    </div>
                    <div className="p-2.5 bg-[#FAFAF8] border border-[#D4AF37]/30">
                      <span className="text-[10px] text-[#64748B] block">Strike Rate</span>
                      <strong className="font-storybook text-sm text-[#0F172A]">
                        {selectedPlayerModal.stats.strikeRate ?? '-'}
                      </strong>
                    </div>
                    <div className="p-2.5 bg-[#FAFAF8] border border-[#D4AF37]/30">
                      <span className="text-[10px] text-[#64748B] block">Highest Score</span>
                      <strong className="font-storybook text-sm text-[#0F172A]">
                        {selectedPlayerModal.stats.highestScore ?? '-'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#D4AF37]/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-storybook text-[#64748B] block">
                      {selectedPlayerModal.status === 'sold' ? 'Final Sold Price' : 'Base Reserve Price'}
                    </span>
                    <strong className="font-storybook font-black text-xl text-[#0F172A]">
                      {currency}
                      {(selectedPlayerModal.soldPrice || selectedPlayerModal.basePrice).toLocaleString()}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPlayerModal(null)}
                    className="px-4 py-2 bg-[#1E1E38] text-[#FFFDF9] border border-[#D4AF37] font-storybook font-bold text-xs uppercase cursor-pointer"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
