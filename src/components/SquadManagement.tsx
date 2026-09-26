import React, { useState } from 'react';
import { Team, Player, PlayerRole } from '../types';
import { TeamBadge } from './TeamBadge';
import { Users, DollarSign, Plane, Shield, RotateCcw } from 'lucide-react';
import { PurseMeter } from './PurseMeter';

interface SquadManagementProps {
  teams: Team[];
  allPlayers: Player[];
  myTeam: Team | null;
  onCancelSale?: (playerId: string) => void;
  currency?: string;
}

export const SquadManagement: React.FC<SquadManagementProps> = ({
  teams,
  allPlayers,
  myTeam,
  onCancelSale,
  currency = '₹'
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(myTeam?.id || teams[0].id);

  const selectedTeam = teams.find(t => t.id === selectedTeamId) || teams[0];
  const squadPlayers = allPlayers.filter(p => selectedTeam.players.includes(p.id));

  // Categorize squad
  const roleGroups: { title: string; roles: PlayerRole[] }[] = [
    { title: 'BATTERS', roles: ['Batter'] },
    { title: 'ALL-ROUNDERS', roles: ['All-rounder'] },
    { title: 'WICKETKEEPERS', roles: ['Wicketkeeper'] },
    { title: 'BOWLERS', roles: ['Fast Bowler', 'Spin Bowler'] }
  ];

  const totalSpent = selectedTeam.initialPurse - selectedTeam.purse;

  // Highest purchase
  const highestPurchase = squadPlayers.reduce(
    (max, p) => (p.soldPrice && p.soldPrice > (max?.soldPrice || 0) ? p : max),
    null as Player | null
  );

  return (
    <div className="w-full space-y-6 text-[#0F172A]">
      {/* Chapter Section Header */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-[#D4AF37] font-storybook font-bold text-xs uppercase tracking-[0.1em]">
          <span>THE FRANCHISES OF DURGAPUR</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-black tracking-[0.05em] uppercase text-[#0F172A] leading-tight">
          FRANCHISE ROSTERS & SQUADS
        </h2>
        <p className="text-sm font-body italic text-[#475569] max-w-2xl mt-1">
          Inspect squad rosters, departmental depths, overseas slots, and treasury balances across every competing franchise.
        </p>
      </div>

      {/* Franchise Selector Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {teams.map((t) => {
          const isSelected = t.id === selectedTeamId;
          const isMy = myTeam?.id === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setSelectedTeamId(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 whitespace-nowrap transition cursor-pointer font-storybook text-xs font-bold uppercase tracking-[0.05em] border rounded-none ${
                isSelected
                  ? 'bg-[#1E1E38] text-[#FFFDF9] border-[#D4AF37] shadow-sm'
                  : 'bg-[#FAFAF8] text-[#0F172A] border-[#D4AF37]/35 hover:bg-[#F5F2EB]'
              }`}
            >
              <TeamBadge team={t} size="sm" />
              <span>{t.shortCode}</span>
              {isMy && <span className="text-[#D4AF37] ml-1">★</span>}
            </button>
          );
        })}
      </div>

      {/* Selected Team Profile Banner */}
      <div className="p-6 bg-[#FAFAF8] border border-[#D4AF37]/40 shadow-sm rounded-none font-body">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <TeamBadge team={selectedTeam} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl sm:text-3xl font-display font-black tracking-[0.04em] uppercase text-[#0F172A]">
                  {selectedTeam.name}
                </h3>
                {myTeam?.id === selectedTeam.id && (
                  <span className="text-xs font-storybook text-[#997819] font-bold">
                    (Your Franchise)
                  </span>
                )}
              </div>
              <p className="text-sm text-[#475569] italic">
                "{selectedTeam.motto}" · Head Coach: {selectedTeam.coach || 'Franchise Syndicate'}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-6 text-xs">
            <div className="text-right">
              <span className="text-[#475569] block font-storybook uppercase tracking-wider text-[10px]">Squad Quota</span>
              <strong className="font-storybook text-base text-[#0F172A]">
                {selectedTeam.players.length} / {selectedTeam.maxSquadSize}
              </strong>
            </div>

            <div className="text-right border-l border-[#D4AF37]/30 pl-6">
              <span className="text-[#475569] block font-storybook uppercase tracking-wider text-[10px]">Overseas Quota</span>
              <strong className="font-storybook text-base text-[#0F172A]">
                {selectedTeam.overseasPlayers} / {selectedTeam.maxOverseasPlayers}
              </strong>
            </div>

            <div className="text-right border-l border-[#D4AF37]/30 pl-6">
              <span className="text-[#475569] block font-storybook uppercase tracking-wider text-[10px]">Funds Disbursed</span>
              <strong className="font-storybook text-base text-[#997819]">
                {currency}{totalSpent.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        {/* Treasury Meter */}
        <div className="mt-6 pt-5 border-t border-[#D4AF37]/30">
          <PurseMeter
            currentPurse={selectedTeam.purse}
            initialPurse={selectedTeam.initialPurse}
            label={`${selectedTeam.shortCode} Treasury Balance`}
            currency={currency}
          />
        </div>
      </div>

      {/* Squad Breakdown by Department */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roleGroups.map((group) => {
          const groupPlayers = squadPlayers.filter(p => group.roles.includes(p.role));

          return (
            <div
              key={group.title}
              className="p-4 bg-[#FAFAF8] border border-[#D4AF37]/35 shadow-sm rounded-none font-body flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/30 mb-3">
                  <span className="font-storybook font-bold text-xs uppercase tracking-[0.08em] text-[#0F172A]">
                    {group.title}
                  </span>
                  <span className="font-storybook font-bold text-xs text-[#997819]">
                    ({groupPlayers.length})
                  </span>
                </div>

                {groupPlayers.length === 0 ? (
                  <div className="py-8 text-center text-[#64748B] text-xs italic">
                    No players signed yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {groupPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="p-2.5 bg-[#FFFDF9] border border-[#D4AF37]/25 text-xs flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-storybook font-bold text-sm text-[#0F172A] block leading-tight truncate">
                            {player.name}
                          </span>
                          <span className="text-[11px] text-[#475569]">
                            {player.role} · Age {player.age}
                          </span>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="font-storybook font-bold text-xs text-[#0F172A]">
                            {currency}{player.soldPrice ? player.soldPrice.toLocaleString() : player.basePrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
