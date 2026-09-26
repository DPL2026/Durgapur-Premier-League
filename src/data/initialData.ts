import { Team, Player, AuctionSettings } from '../types';
import { TEAM_DEFAULT_LOGOS } from '../utils/assets';

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team_rcd',
    name: 'Royal Challengers Durgapur',
    shortCode: 'RCD',
    purse: 60000,
    initialPurse: 60000,
    players: [],
    retainedPlayers: [],
    overseasPlayers: 0,
    maxSquadSize: 18,
    maxOverseasPlayers: 6,
    primaryColor: '#dc2626',
    secondaryColor: '#f59e0b',
    accentColor: '#18181b',
    logoSymbol: '🦁',
    logoUrl: 'https://i.pinimg.com/736x/12/a3/c0/12a3c048b4dbd500d6a44fc9216aef2d.jpg',
    motto: 'Play Bold, Roar Proud',
    aiAggression: 'aggressive',
    preferredRoles: ['Batter', 'Fast Bowler']
  },
  {
    id: 'team_dsk',
    name: 'Durgapur Super Kings',
    shortCode: 'DSK',
    purse: 60000,
    initialPurse: 60000,
    players: [],
    retainedPlayers: [],
    overseasPlayers: 0,
    maxSquadSize: 18,
    maxOverseasPlayers: 6,
    primaryColor: '#eab308',
    secondaryColor: '#1e3a8a',
    accentColor: '#ca8a04',
    logoSymbol: '👑',
    logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSk6Af4d2pToQAiOBVH8BnP7HCqHyzvW8B-icZd7g3vMcqyEovgtQ-9o9ke&s=10',
    motto: 'Whistle With Pride',
    aiAggression: 'balanced',
    preferredRoles: ['All-rounder', 'Spin Bowler']
  },
  {
    id: 'team_dkr',
    name: 'Durgapur Knight Riders',
    shortCode: 'DKR',
    purse: 60000,
    initialPurse: 60000,
    players: [],
    retainedPlayers: [],
    overseasPlayers: 0,
    maxSquadSize: 18,
    maxOverseasPlayers: 6,
    primaryColor: '#7c3aed',
    secondaryColor: '#fbbf24',
    accentColor: '#4c1d95',
    logoSymbol: '⚔️',
    logoUrl: 'https://i.pinimg.com/736x/c8/e9/e6/c8e9e65d1d2f9d2472dd64a875c5c238.jpg',
    motto: 'Korbo Lorbo Jeetbo Re',
    aiAggression: 'aggressive',
    preferredRoles: ['All-rounder', 'Fast Bowler']
  },
  {
    id: 'team_dr',
    name: 'Durgapur Royals',
    shortCode: 'DR',
    purse: 60000,
    initialPurse: 60000,
    players: [],
    retainedPlayers: [],
    overseasPlayers: 0,
    maxSquadSize: 18,
    maxOverseasPlayers: 6,
    primaryColor: '#ec4899',
    secondaryColor: '#2563eb',
    accentColor: '#be185d',
    logoSymbol: '🛡️',
    logoUrl: 'https://play-lh.googleusercontent.com/UVKp1TKE2Vmt3TVsV-o_oYx8Ish6xssEpSB-QS4iASGgNxaogHQxQQtaT7OPpuyDpA574qsDt13qIsaOBIT79A',
    motto: 'Halla Bol Durgapur',
    aiAggression: 'balanced',
    preferredRoles: ['Batter', 'Spin Bowler']
  }
];

export const INITIAL_SETTINGS: AuctionSettings = {
  soundEnabled: true,
  animationsEnabled: true,
  bidTimerDuration: 10,
  aiDifficulty: 'balanced',
  auctionSpeed: 'normal',
  currency: '₹',
  autoNextPlayer: false
};

// Official Owner-Uploaded Players Database
export const INITIAL_PLAYERS: Player[] = [
  {
    id: 'ply_1790400594970',
    name: 'Ankan Mondal',
    role: 'Wicketkeeper',
    nationality: 'Indian',
    isOverseas: false,
    age: 18,
    basePrice: 2000,
    battingStyle: 'Right-hand bat',
    bowlingStyle: '',
    photo: '/uploads/player_ply_1790400594970_57c03eaa5e1a.png',
    stats: {
      matches: 25,
      runs: 650,
      strikeRate: 142.5,
      wickets: 14,
      highestScore: '78*'
    },
    status: 'available'
  },
  {
    id: 'ply_1790175421888',
    name: 'Arnab Chakraborty',
    role: 'All-rounder',
    nationality: 'Indian',
    isOverseas: false,
    age: 15,
    basePrice: 2000,
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm fast',
    stats: {
      matches: 25,
      runs: 650,
      strikeRate: 142.5,
      wickets: 14,
      highestScore: '78*'
    },
    status: 'available'
  },
  {
    id: 'ply_01',
    name: 'Priyam Roy',
    role: 'All-rounder',
    nationality: 'Indian',
    isOverseas: false,
    age: 24,
    basePrice: 2000,
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm fast-medium',
    photo: '/uploads/player_ply_01_943ee440d03c.jpg',
    stats: {
      matches: 10,
      runs: 300,
      strikeRate: 154.2,
      wickets: 5,
      economy: 7.42,
      highestScore: '104*',
      bestBowling: '4/18'
    },
    status: 'available'
  },
  {
    id: 'ply_03',
    name: 'Shibajit Naskar',
    role: 'Batter',
    nationality: 'Indian',
    isOverseas: false,
    age: 18,
    basePrice: 1500,
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm leg-spin',
    stats: {
      matches: 74,
      runs: 2850,
      strikeRate: 142.1,
      highestScore: '98*'
    },
    status: 'available'
  },
  {
    id: 'ply_04',
    name: 'Amir Hossain ',
    role: 'Fast Bowler',
    nationality: 'South Africa',
    isOverseas: true,
    age: 18,
    basePrice: 2000,
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right-arm express fast',
    stats: {
      matches: 82,
      wickets: 104,
      economy: 7.82,
      bestBowling: '5/19',
      runs: 362,
      strikeRate: 142
    },
    status: 'available'
  },
  {
    id: 'ply_07',
    name: 'Sovon Pramanick ',
    role: 'All-rounder',
    nationality: 'Indian',
    isOverseas: false,
    age: 18,
    basePrice: 1500,
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Right Arm Fast ',
    stats: {
      matches: 58,
      runs: 1420,
      strikeRate: 138.4,
      wickets: 44,
      economy: 7.15,
      highestScore: '76'
    },
    status: 'available'
  }
];

// Helper to calculate initialized team purses with full 60000 funds
export function getInitializedTeams(): Team[] {
  const teams = JSON.parse(JSON.stringify(INITIAL_TEAMS)) as Team[];

  teams.forEach((team) => {
    if (!team.logoUrl && TEAM_DEFAULT_LOGOS[team.id]) {
      team.logoUrl = TEAM_DEFAULT_LOGOS[team.id];
    }
    team.initialPurse = 60000;
    team.purse = 60000;
    team.retainedPlayers = [];
    team.players = [];
    team.overseasPlayers = 0;
  });

  return teams;
}
