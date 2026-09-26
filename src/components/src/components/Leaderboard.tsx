import React, { useState } from 'react';
import { Team, Player } from '../types';
import { TeamBadge } from './TeamBadge';
import { Trophy, ArrowUpDown } from 'lucide-react';

interface LeaderboardProps {
  teams: Team[];
  allPlayers: Player[];
  myTeam: Team | null;
  currency?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  teams,
  allPlayers,
  myTeam,
  currency = '₹'
}) => {
  const [sortField, setSortField] = useState<'money_spent' | 'remaining_purse' | 'players_bought'>('money_spent');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'money_spent' | 'remaining_purse' | 'players_bought') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const processedTeams = teams.map((team) => {
    const teamSquad = allPlayers.filter((p) => team.players.includes(p.id));
    const moneySpent = team.initialPurse - team.purse;
    const playersBought = teamSquad.length;

    const highestPurchase = teamSquad.reduce(
      (max, p) => (p.soldPrice && p.soldPrice > (max?.soldPrice || 0) ? p : max),
      null as Player | null
    );

    return {
      team,
      moneySpent,
      remainingPurse: team.purse,
      playersBought,
      squadSize: teamSquad.length,
      overseasCount: team.overseasPlayers,
      highestPurchase
    };
  });

  const sortedTeams = [...processedTeams].sort((a, b) => {
    let diff = 0;
    if (sortField === 'money_spent') diff = a.moneySpent - b.moneySpent;
    else if (sortField === 'remaining_purse') diff = a.remainingPurse - b.remainingPurse;
    else if (sortField === 'players_bought') diff = a.playersBought - b.playersBought;

    return sortDirection === 'desc' ? -diff : diff;
  });

  return (
    <div className="w-full space-y-6 text-[#0F172A]">
      {/* Chapter Section Header */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-[#D4AF37] font-storybook font-bold text-xs uppercase tracking-[0.1em]">
          <span>THE LEADERBOARD OF CHAMPIONS</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-black tracking-[0.05em] uppercase text-[#0F172A] leading-tight">
          CHAMPIONSHIP STANDINGS & ROSTER BALANCE
        </h2>
        <p className="text-sm font-body italic text-[#475569] max-w-2xl mt-1">
          Comparative standings illustrating treasury allocation, marquee acquisitions, and squad strength across the competition.
        </p>
      </div>

      {/* Storybook Leaderboard Table */}
      <div className="bg-[#FAFAF8] border border-[#D4AF37]/40 shadow-sm rounded-none overflow-hidden font-body">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1E1E38] text-[#FFFDF9] border-b border-[#D4AF37]/40 font-storybook font-bold uppercase tracking-[0.05em]">
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Franchise</th>
                <th
                  onClick={() => handleSort('money_spent')}
                  className="py-3 px-4 cursor-pointer hover:text-[#D4AF37] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Funds Spent</span>
                    <ArrowUpDown className="w-3 h-3 text-[#D4AF37]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('remaining_purse')}
                  className="py-3 px-4 cursor-pointer hover:text-[#D4AF37] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Treasury Balance</span>
                    <ArrowUpDown className="w-3 h-3 text-[#D4AF37]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('players_bought')}
                  className="py-3 px-4 cursor-pointer hover:text-[#D4AF37] transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Roster (Quota)</span>
                    <ArrowUpDown className="w-3 h-3 text-[#D4AF37]" />
                  </div>
                </th>
                <th className="py-3 px-4">Marquee Signee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/20">
              {sortedTeams.map((row, index) => {
                const isMyTeamRow = myTeam?.id === row.team.id;

                return (
                  <tr
                    key={row.team.id}
                    className={`hover:bg-[#F5F2EB] transition ${
                      isMyTeamRow ? 'bg-[#FFFDF9] font-medium' : 'bg-[#FAFAF8]'
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-storybook font-bold text-sm text-[#D4AF37]">
                      {index + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <TeamBadge team={row.team} size="sm" />
                        <div>
                          <strong className="font-storybook text-sm text-[#0F172A] block leading-tight">
                            {row.team.name}
                          </strong>
                          {isMyTeamRow && (
                            <span className="text-[10px] text-[#997819] font-storybook font-bold">
                              ★ Your Franchise
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-storybook font-bold text-sm text-[#997819]">
                      {currency}{row.moneySpent.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 font-storybook font-bold text-sm text-[#0F172A]">
                      {currency}{row.remainingPurse.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 font-storybook text-xs">
                      {row.squadSize} / {row.team.maxSquadSize}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-body">
                      {row.highestPurchase ? (
                        <div>
                          <span className="font-storybook font-semibold text-[#0F172A] block">
                            {row.highestPurchase.name}
                          </span>
                          <span className="text-[11px] text-[#64748B]">
                            {currency}{row.highestPurchase.soldPrice?.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#64748B] italic">No marquee purchase</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
