import React, { useState, useMemo } from 'react';
import { Player, Team } from '../types';
import { PlayerAvatar } from './PlayerAvatar';
import { TeamBadge } from './TeamBadge';
import { Search, Play } from 'lucide-react';

interface PlayerDatabaseProps {
  players: Player[];
  teams: Team[];
  onSetCurrentPlayer?: (player: Player) => void;
  currency?: string;
}

export const PlayerDatabase: React.FC<PlayerDatabaseProps> = ({
  players,
  teams,
  onSetCurrentPlayer,
  currency = '₹'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price_desc' | 'price_asc' | 'age'>('price_desc');

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

  return (
    <div className="w-full space-y-6 text-[#0F172A]">
      {/* Chapter Section Header */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-[#D4AF37] font-storybook font-bold text-xs uppercase tracking-[0.1em]">
          <span>THE GRAND PLAYER REGISTRY</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-black tracking-[0.05em] uppercase text-[#0F172A] leading-tight">
          COMPLETE PLAYER REPERTORY
        </h2>
        <p className="text-sm font-body italic text-[#475569] max-w-2xl mt-1">
          The certified catalogue of batters, bowlers, wicketkeepers, and marquee prodigies listed for auction gavel.
        </p>
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
        <div className="mt-3 pt-3 border-t border-[#D4AF37]/25 flex items-center justify-between text-xs text-[#475569]">
          <span>Showing <strong>{filteredPlayers.length}</strong> listed lots</span>
          <div className="flex items-center gap-2">
            <span>Filter Status:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`font-storybook font-semibold ${statusFilter === 'all' ? 'text-[#0F172A] underline' : 'text-[#64748B]'}`}
            >
              All ({players.length})
            </button>
            <span>·</span>
            <button
              onClick={() => setStatusFilter('available')}
              className={`font-storybook font-semibold ${statusFilter === 'available' ? 'text-[#0F172A] underline' : 'text-[#64748B]'}`}
            >
              Available
            </button>
            <span>·</span>
            <button
              onClick={() => setStatusFilter('sold')}
              className={`font-storybook font-semibold ${statusFilter === 'sold' ? 'text-[#0F172A] underline' : 'text-[#64748B]'}`}
            >
              Sold
            </button>
          </div>
        </div>
      </div>

      {/* Player Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPlayers.map((player) => {
          const soldTeam = player.soldTo ? teams.find(t => t.id === player.soldTo) : null;

          return (
            <div
              key={player.id}
              className="p-4 bg-[#FAFAF8] border border-[#D4AF37]/35 shadow-sm rounded-none font-body flex flex-col justify-between hover:border-[#D4AF37] transition"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <PlayerAvatar player={player} size="sm" />
                  <div className="text-right">
                    <span className="font-storybook font-bold text-xs text-[#D4AF37] block">
                      LOT #{player.id.replace('ply_', '')}
                    </span>
                    <span className="text-[10px] text-[#475569] uppercase font-storybook">
                      {player.role}
                    </span>
                  </div>
                </div>

                <h4 className="font-display font-black text-xl text-[#0F172A] tracking-[0.04em] leading-tight">
                  {player.name}
                </h4>
                <p className="text-xs text-[#475569] italic mt-0.5">
                  {player.role} · Age {player.age}
                </p>

                {/* Key Stats Line */}
                <div className="mt-3 pt-2 border-t border-[#D4AF37]/25 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#64748B] block font-body">Matches</span>
                    <strong className="font-storybook text-[#0F172A]">{player.stats.matches}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block font-body">Runs / Wickets</span>
                    <strong className="font-storybook text-[#997819]">
                      {player.stats.runs ?? '-'}/{player.stats.wickets ?? '-'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Bottom Reserve Price & Stage Action */}
              <div className="mt-4 pt-3 border-t border-[#D4AF37]/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-storybook text-[#64748B] block leading-none">
                    {player.status === 'sold' ? 'Sold Price' : 'Reserve Price'}
                  </span>
                  <strong className="font-storybook font-bold text-base text-[#0F172A]">
                    {currency}{player.soldPrice ? player.soldPrice.toLocaleString() : player.basePrice.toLocaleString()}
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
    </div>
  );
};
