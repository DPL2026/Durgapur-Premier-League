export type PlayerRole = 'Batter' | 'Wicketkeeper' | 'All-rounder' | 'Fast Bowler' | 'Spin Bowler';

export type PlayerStatus = 'available' | 'in_auction' | 'sold' | 'unsold';

export interface PlayerStats {
  matches: number;
  runs?: number;
  wickets?: number;
  strikeRate?: number;
  economy?: number;
  highestScore?: string;
  bestBowling?: string;
  catches?: number;
}

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  nationality: string;
  isOverseas: boolean;
  age: number;
  basePrice: number;
  photo?: string;
  battingStyle: string;
  bowlingStyle: string;
  stats: PlayerStats;
  status: PlayerStatus;
  soldPrice?: number;
  soldTo?: string; // Team ID
  bidCount?: number;
  lastAuctionPrice?: number; // Previous auction hammer valuation
  previousTeamName?: string; // Previous franchise name
}

export interface Team {
  id: string;
  name: string;
  shortCode: string;
  purse: number;
  initialPurse: number;
  players: string[]; // Player IDs
  retainedPlayers: string[]; // Player IDs
  overseasPlayers: number;
  maxSquadSize: number;
  maxOverseasPlayers: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoSymbol: string;
  logoUrl?: string;
  motto: string;
  coach?: string;
  homeVenue?: string;
  aiAggression: 'conservative' | 'balanced' | 'aggressive';
  preferredRoles: PlayerRole[];
}

export interface BidRecord {
  id: string;
  playerId: string;
  playerName: string;
  amount: number;
  bidderTeamId: string;
  bidderTeamName: string;
  bidderTeamCode: string;
  timestamp: string;
  isAi: boolean;
}

export interface AuctionHistoryItem {
  id: string;
  timestamp: string;
  type: 'sold' | 'unsold';
  player: Player;
  winningTeam?: Team;
  finalPrice?: number;
  bids: BidRecord[];
}

export interface AuctionSettings {
  soundEnabled: boolean;
  animationsEnabled: boolean;
  bidTimerDuration: number; // in seconds
  aiDifficulty: 'conservative' | 'balanced' | 'aggressive';
  auctionSpeed: 'slow' | 'normal' | 'fast';
  currency: string;
  autoNextPlayer: boolean;
}

export interface LiveActivityLog {
  id: string;
  message: string;
  type: 'bid' | 'info' | 'sold' | 'unsold' | 'timer' | 'exit' | 'start';
  teamCode?: string;
  teamColor?: string;
  timestamp: string;
}

export type ViewTab = 'landing' | 'select_team' | 'auction' | 'squads' | 'players' | 'history' | 'leaderboard' | 'rules' | 'admin' | 'owner_board';
