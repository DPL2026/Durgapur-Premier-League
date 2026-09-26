import React, { useState } from 'react';
import { Player, Team, PlayerRole } from '../types';
import { dbApi } from '../utils/api';
import { TEAM_DEFAULT_LOGOS, CRICKET_PLAYER_PRESETS } from '../utils/assets';
import { TeamBadge } from './TeamBadge';
import { PlayerAvatar } from './PlayerAvatar';
import {
  Shield,
  Lock,
  Plus,
  Trash2,
  Edit3,
  Save,
  Download,
  Upload,
  RefreshCw,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Gavel,
  Database,
  Users,
  Sparkles,
  Search,
  RotateCcw,
  X
} from 'lucide-react';

interface OwnerBoardProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminLoggedIn: boolean;
  onLogin: (email: string, pass: string) => boolean;
  onLogout: () => void;
  players: Player[];
  teams: Team[];
  onAddPlayer: (newPlayer: Omit<Player, 'id' | 'status'>) => void;
  onUpdatePlayer: (id: string, updated: Partial<Player>) => void;
  onDeletePlayer: (id: string) => void;
  onAddTeam?: (teamData: Partial<Team> & { name: string; shortCode: string; primaryColor: string; secondaryColor: string; motto: string }) => void;
  onDeleteTeam?: (teamId: string) => void;
  onUpdateTeam: (teamId: string, updated: Partial<Team>) => void;
  onUpdateTeamPurse: (teamId: string, newPurse: number) => void;
  onResetAuction: () => void;
  onCancelSale?: (playerId: string, sendToStage?: boolean) => void;
  onReenterAuction?: (playerId: string, sendToStage?: boolean) => void;
  onForceStagePlayer?: (playerId: string) => void;
  onForceSellPlayer?: (playerId: string, teamId: string, price: number) => void;
  currentPlayer?: Player | null;
  currentBid?: number;
  highestBidder?: Team | null;
  loggedInOwnerTeam?: Team | null;
  onOwnerCodeLogin?: (code: string, teamId?: string) => Promise<{ success: boolean; teamId?: string | null; role?: string; error?: string }>;
  onPlaceBid?: (teamId: string, amount: number) => { success: boolean; error?: string };
  onSellNow?: () => void;
  onMarkUnsold?: () => void;
  onNextPlayer?: () => void;
  currency?: string;
  onSyncAll?: () => Promise<void>;
}

export const OwnerBoard: React.FC<OwnerBoardProps> = ({
  isOpen,
  onClose,
  isAdminLoggedIn,
  onLogin,
  onLogout,
  players,
  teams,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onAddTeam,
  onDeleteTeam,
  onUpdateTeam,
  onUpdateTeamPurse,
  onResetAuction,
  onCancelSale,
  onReenterAuction,
  onForceStagePlayer,
  onForceSellPlayer,
  currentPlayer,
  currentBid = 0,
  highestBidder,
  onSellNow,
  onMarkUnsold,
  onNextPlayer,
  currency = '₹',
  onSyncAll
}) => {
  // Master Owner Authentication Form (Email & Password Only)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Tab inside Master Owner Board: 'players' | 'teams' | 'auction' | 'database'
  const [activeSubTab, setActiveSubTab] = useState<'players' | 'teams' | 'auction' | 'database'>('players');

  // Player search & filter
  const [playerSearch, setPlayerSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Editing Player Modal / Sheet State
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Editing Team Modal / Sheet State
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // New Player Form State
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState<PlayerRole>('Batter');
  const [newPlayerAge, setNewPlayerAge] = useState<number>(20);
  const [newPlayerBasePrice, setNewPlayerBasePrice] = useState<number>(1500);
  const [newPlayerBatting, setNewPlayerBatting] = useState('Right-hand bat');
  const [newPlayerBowling, setNewPlayerBowling] = useState('Right-arm fast');
  const [newPlayerPhoto, setNewPlayerPhoto] = useState<string>('');
  const [newPlayerMatches, setNewPlayerMatches] = useState<number>(25);
  const [newPlayerRuns, setNewPlayerRuns] = useState<number>(650);
  const [newPlayerWickets, setNewPlayerWickets] = useState<number>(14);
  const [newPlayerStrikeRate, setNewPlayerStrikeRate] = useState<number>(142.5);
  const [newPlayerHighestScore, setNewPlayerHighestScore] = useState<string>('78*');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  // New Team Form State
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamShortCode, setNewTeamShortCode] = useState('');
  const [newTeamPrimaryColor, setNewTeamPrimaryColor] = useState('#2563EB');
  const [newTeamSecondaryColor, setNewTeamSecondaryColor] = useState('#F59E0B');
  const [newTeamMotto, setNewTeamMotto] = useState('Roar with Pride');
  const [newTeamLogoUrl, setNewTeamLogoUrl] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [playerToDeleteId, setPlayerToDeleteId] = useState<string | null>(null);
  const [teamToDeleteId, setTeamToDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const success = onLogin(email, password);
    if (!success) {
      setLoginError('Invalid Master Owner email or password. Access denied.');
    } else {
      setLoginError(null);
    }
  };

  // Handle uploading custom photo for a player (persisted to shared server /uploads/ for all website users)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isForNewPlayer = false, directPlayer?: Player) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const prefix = directPlayer
          ? `player_${directPlayer.id}`
          : isForNewPlayer
          ? 'player_new'
          : `player_${editingPlayer?.id || 'edit'}`;

        const uploadRes = await dbApi.uploadOwnerImage(base64, prefix, 'Priyam01032008@');
        const finalPhotoUrl = uploadRes.success && uploadRes.url ? uploadRes.url : base64;
        setIsUploadingImage(false);

        if (directPlayer) {
          onUpdatePlayer(directPlayer.id, { ...directPlayer, photo: finalPhotoUrl });
          showNotification(`Uploaded new picture for "${directPlayer.name}"! Visible to all website users.`);
        } else if (isForNewPlayer) {
          setNewPlayerPhoto(finalPhotoUrl);
          showNotification('Player picture uploaded! Click "Create & Add Player" to publish to all users.');
        } else if (editingPlayer) {
          setEditingPlayer({ ...editingPlayer, photo: finalPhotoUrl });
          showNotification('Player picture uploaded! Click "Save Player Details" to publish to all users.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle uploading custom team logo
  const handleTeamLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, isForNew = false) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const prefix = isForNew ? 'team_new' : `team_${editingTeam?.id || 'edit'}`;
        const uploadRes = await dbApi.uploadOwnerImage(base64, prefix, 'Priyam01032008@');
        const finalLogoUrl = uploadRes.success && uploadRes.url ? uploadRes.url : base64;
        setIsUploadingImage(false);

        if (isForNew) {
          setNewTeamLogoUrl(finalLogoUrl);
        } else if (editingTeam) {
          setEditingTeam({ ...editingTeam, logoUrl: finalLogoUrl });
        }
        showNotification('Team logo uploaded to shared server database!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEditedPlayer = () => {
    if (!editingPlayer) return;
    onUpdatePlayer(editingPlayer.id, editingPlayer);
    showNotification(`Player "${editingPlayer.name}" details and photo published to all website users!`);
    setEditingPlayer(null);
  };

  const handleSaveEditedTeam = () => {
    if (!editingTeam) return;
    onUpdateTeam(editingTeam.id, editingTeam);
    showNotification(`Team "${editingTeam.name}" logo and details published to all website users!`);
    setEditingTeam(null);
  };

  const handleCreateNewPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    const newPly: Omit<Player, 'id' | 'status'> = {
      name: newPlayerName.trim(),
      role: newPlayerRole,
      nationality: 'Indian',
      isOverseas: false,
      age: newPlayerAge,
      basePrice: newPlayerBasePrice,
      battingStyle: newPlayerBatting,
      bowlingStyle: newPlayerBowling,
      photo: newPlayerPhoto.trim() || undefined,
      stats: {
        matches: newPlayerMatches,
        runs: newPlayerRuns,
        strikeRate: newPlayerStrikeRate,
        wickets: newPlayerWickets,
        highestScore: newPlayerHighestScore || '50*'
      }
    };

    onAddPlayer(newPly);
    showNotification(`Player "${newPlayerName}" and picture published to the shared website database!`);
    setNewPlayerName('');
    setNewPlayerPhoto('');
    setShowAddPlayer(false);
  };

  const handleCreateNewTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newTeamShortCode.trim()) return;

    if (onAddTeam) {
      onAddTeam({
        name: newTeamName.trim(),
        shortCode: newTeamShortCode.trim().toUpperCase(),
        primaryColor: newTeamPrimaryColor,
        secondaryColor: newTeamSecondaryColor,
        motto: newTeamMotto.trim() || 'Courage & Triumph',
        logoUrl: newTeamLogoUrl.trim() || undefined
      });
      showNotification(`Franchise "${newTeamName}" created with ₹60,000 purse!`);
      setNewTeamName('');
      setNewTeamShortCode('');
      setNewTeamLogoUrl('');
      setShowAddTeam(false);
    }
  };

  // Filtered Players
  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
      p.role.toLowerCase().includes(playerSearch.toLowerCase());
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-blue-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[92vh] rounded-3xl bg-gradient-to-b from-[#0d1e3d] via-[#09152e] to-[#060e20] border-2 border-blue-400/40 p-4 sm:p-6 shadow-[0_0_60px_rgba(30,58,138,0.6)] overflow-hidden flex flex-col text-white">
        
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-blue-400/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-white/20 shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-score font-black text-xl sm:text-2xl text-white tracking-wide">
                  MASTER OWNER BOARD & DATABASE COMMAND CENTER
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
                  ● Live Backend Connected
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                Full master control over Player Images & Details, Team Logos & Brands, Refund & Re-Auction, and Database Backups
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminLoggedIn && (
              <button
                onClick={async () => {
                  if (onSyncAll) await onSyncAll();
                  showNotification('Database synced with backend server!');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-blue-200 text-xs font-semibold transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sync Backend</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition cursor-pointer"
            >
              Exit Board
            </button>
          </div>
        </div>

        {/* Floating Notification */}
        {notificationMsg && (
          <div className="absolute top-20 right-6 z-50 px-4 py-2.5 rounded-2xl bg-emerald-500 text-white font-score font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-2">
            <Check className="w-4 h-4" />
            <span>{notificationMsg}</span>
          </div>
        )}

        {/* NOT LOGGED IN -> MASTER OWNER EMAIL & PASSWORD LOGIN SCREEN */}
        {!isAdminLoggedIn ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 px-4 overflow-y-auto">
            <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#0b1b3b]/90 border border-blue-400/30 shadow-2xl space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-400/50 flex items-center justify-center mx-auto text-blue-300">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-score font-black text-xl text-white">
                  Master Owner Authentication
                </h4>
                <p className="text-xs text-blue-200/80 mt-1">
                  Enter your Master Owner email and password to unlock Player Images & Details, Team Logos, Refund & Re-Auction, and Database Backups
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-left text-xs">
                <div>
                  <label className="text-blue-200 font-semibold block mb-1">Owner Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter owner email"
                    className="w-full p-3 rounded-xl bg-[#071329] border border-blue-500/30 text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="text-blue-200 font-semibold block mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full p-3 rounded-xl bg-[#071329] border border-blue-500/30 text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-score font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-600/40 transition cursor-pointer"
                  >
                    Unlock Master Owner Board
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* LOGGED IN MASTER OWNER WORKSPACE */
          <div className="flex-1 flex flex-col overflow-hidden pt-3">
            
            {/* Navigation Tabs Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-blue-400/20 shrink-0 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                <button
                  onClick={() => setActiveSubTab('players')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-score font-bold uppercase transition cursor-pointer ${
                    activeSubTab === 'players'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40'
                      : 'bg-white/5 text-blue-200 hover:bg-white/10'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Player Images & Details ({players.length})</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('teams')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-score font-bold uppercase transition cursor-pointer ${
                    activeSubTab === 'teams'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40'
                      : 'bg-white/5 text-blue-200 hover:bg-white/10'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Team Logos & Brands ({teams.length})</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('auction')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-score font-bold uppercase transition cursor-pointer ${
                    activeSubTab === 'auction'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/40'
                      : 'bg-white/5 text-blue-200 hover:bg-white/10'
                  }`}
                >
                  <Gavel className="w-4 h-4" />
                  <span>Live Stage, Refund & Re-Auction</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('database')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-score font-bold uppercase transition cursor-pointer ${
                    activeSubTab === 'database'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40'
                      : 'bg-white/5 text-blue-200 hover:bg-white/10'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>Database JSON & Backups</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold text-xs hidden md:inline">
                  👑 Master Owner Authenticated
                </span>
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition text-xs font-semibold cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            </div>

            {/* TAB 1: PLAYER IMAGES & DETAILS */}
            {activeSubTab === 'players' && (
              <div className="flex-1 flex flex-col overflow-hidden pt-3 space-y-3">
                {/* Shared Database Status Banner */}
                <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-400/40 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
                  <div className="flex items-center gap-2 text-emerald-200">
                    <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Shared Website Database Active:</strong> Only you (Master Owner) can upload or edit player pictures and details. Every website user automatically sees your uploaded pictures live ({players.filter((p) => Boolean(p.photo)).length}/{players.length} players have uploaded photos).
                    </span>
                  </div>
                  {onSyncAll && (
                    <button
                      type="button"
                      onClick={async () => {
                        await onSyncAll();
                        showNotification('All player pictures and details synced to every website user!');
                      }}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-score font-bold text-[11px] uppercase tracking-wider shadow cursor-pointer"
                    >
                      Sync to All Users Now
                    </button>
                  )}
                </div>

                {/* Search & Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-blue-300" />
                      <input
                        type="text"
                        value={playerSearch}
                        onChange={(e) => setPlayerSearch(e.target.value)}
                        placeholder="Search player by name, nationality..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#071329] border border-blue-500/30 text-white text-xs placeholder:text-blue-300/50 focus:outline-none focus:border-blue-400"
                      />
                    </div>

                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="p-2 rounded-xl bg-[#071329] border border-blue-500/30 text-white text-xs focus:outline-none"
                    >
                      <option value="all">All Roles</option>
                      <option value="Batter">Batter</option>
                      <option value="Wicketkeeper">Wicketkeeper</option>
                      <option value="All-rounder">All-rounder</option>
                      <option value="Fast Bowler">Fast Bowler</option>
                      <option value="Spin Bowler">Spin Bowler</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="p-2 rounded-xl bg-[#071329] border border-blue-500/30 text-white text-xs focus:outline-none"
                    >
                      <option value="all">All Status</option>
                      <option value="available">Available</option>
                      <option value="sold">Sold</option>
                      <option value="unsold">Unsold</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setShowAddPlayer(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-score font-bold text-xs uppercase shadow-md transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Player</span>
                  </button>
                </div>

                {/* Players Table / Grid */}
                <div className="flex-1 rounded-2xl border border-blue-400/20 bg-[#071329]/80 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-10 bg-[#0d1e3d] text-blue-200 font-score uppercase text-[11px] border-b border-blue-400/20">
                      <tr>
                        <th className="p-3">Player & Photo</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Styles</th>
                        <th className="p-3">Career Stats</th>
                        <th className="p-3">Base Price</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-500/10">
                      {filteredPlayers.map((p) => {
                        const soldTeam = teams.find((t) => t.id === p.soldTo);
                        return (
                          <tr key={p.id} className="hover:bg-blue-600/10 transition">
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <PlayerAvatar player={p} size="sm" />
                                <div>
                                  <span className="font-score font-bold text-white block text-sm">
                                    {p.name}
                                  </span>
                                  <span className="text-[10px] text-blue-300">
                                    Age: {p.age} · Lot #{p.id.replace('ply_', '')}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full bg-blue-900/60 border border-blue-400/30 text-blue-200 text-[10px] font-semibold">
                                {p.role}
                              </span>
                            </td>

                            <td className="p-3 text-blue-300 text-[11px] leading-tight">
                              <div>{p.battingStyle}</div>
                              <div className="text-blue-400/70">{p.bowlingStyle}</div>
                            </td>

                            <td className="p-3 text-slate-200 text-[11px]">
                              <div>{p.stats.matches} Mat | {p.stats.runs || 0} Runs</div>
                              <div className="text-amber-300 font-mono">
                                SR: {p.stats.strikeRate || '-'} | Wkt: {p.stats.wickets || 0}
                              </div>
                            </td>

                            <td className="p-3 font-score font-bold text-amber-400">
                              {currency}{p.basePrice.toLocaleString()}
                            </td>

                            <td className="p-3">
                              {p.status === 'sold' ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold">
                                  Sold ({soldTeam?.shortCode || 'Franchise'}) · {currency}{p.soldPrice?.toLocaleString()}
                                </span>
                              ) : p.status === 'unsold' ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[10px] font-bold">
                                  Unsold
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-[10px] font-bold">
                                  Available
                                </span>
                              )}
                            </td>

                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {p.status === 'sold' && onCancelSale && (
                                  <button
                                    onClick={() => {
                                      onCancelSale(p.id, false);
                                      showNotification(`Cancelled sale of ${p.name}! ₹${(p.soldPrice || 0).toLocaleString()} refunded to franchise.`);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-rose-900/70 hover:bg-rose-800 border border-rose-500/50 text-rose-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow cursor-pointer"
                                    title={`Cancel sale of ${p.name} and refund money to franchise`}
                                  >
                                    <RotateCcw className="w-3 h-3 text-rose-300" />
                                    <span>Refund</span>
                                  </button>
                                )}

                                {p.status === 'unsold' && onReenterAuction && (
                                  <button
                                    onClick={() => {
                                      onReenterAuction(p.id, false);
                                      showNotification(`${p.name} returned to available auction pool!`);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-amber-900/70 hover:bg-amber-800 border border-amber-500/50 text-amber-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow cursor-pointer"
                                    title={`Re-enter unsold player ${p.name} into auction pool`}
                                  >
                                    <RotateCcw className="w-3 h-3 text-amber-300" />
                                    <span>Re-enter</span>
                                  </button>
                                )}

                                {onForceStagePlayer && (
                                  <button
                                    onClick={() => {
                                      onForceStagePlayer(p.id);
                                      showNotification(`${p.name} put onto the live auction stage!`);
                                    }}
                                    className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/40 text-amber-300 text-xs font-semibold cursor-pointer"
                                    title="Stage Immediately"
                                  >
                                    Stage Lot
                                  </button>
                                )}
                                <label
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/60 border border-emerald-400/40 text-emerald-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                  title="Upload Photo Directly for This Player"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Upload Photo</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handlePhotoUpload(e, false, p)}
                                    className="hidden"
                                  />
                                </label>
                                <button
                                  onClick={() => setEditingPlayer(p)}
                                  className="p-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/60 border border-blue-400/40 text-blue-200 cursor-pointer"
                                  title="Edit Photo & Details"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                {playerToDeleteId === p.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        onDeletePlayer(p.id);
                                        dbApi.deletePlayer(p.id);
                                        setPlayerToDeleteId(null);
                                        showNotification(`Player "${p.name}" deleted from registry.`);
                                      }}
                                      className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider shadow cursor-pointer"
                                    >
                                      Confirm Delete
                                    </button>
                                    <button
                                      onClick={() => setPlayerToDeleteId(null)}
                                      className="px-1.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] cursor-pointer"
                                      title="Cancel"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setPlayerToDeleteId(p.id)}
                                    className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 cursor-pointer"
                                    title="Delete Player"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: TEAM LOGOS & FRANCHISES */}
            {activeSubTab === 'teams' && (
              <div className="flex-1 overflow-y-auto pt-3 space-y-4">
                <div className="p-3 rounded-2xl bg-blue-950/60 border border-blue-400/30 text-xs text-blue-200 flex flex-wrap items-center justify-between gap-3">
                  <span>
                    Franchise Branding Hub: Manage franchises, add or delete teams, adjust purses (default ₹60,000), or edit logos and colors.
                  </span>
                  {onAddTeam && (
                    <button
                      onClick={() => setShowAddTeam(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-score font-bold text-xs uppercase shadow-md transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add New Franchise</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teams.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl bg-[#081630] border border-blue-400/30 hover:border-blue-400/60 shadow-lg transition flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <TeamBadge team={t} size="lg" />
                          <div>
                            <h4 className="font-score font-bold text-base text-white">
                              {t.name} ({t.shortCode})
                            </h4>
                            <p className="text-xs text-blue-300 italic">&ldquo;{t.motto}&rdquo;</p>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-blue-200">
                              <span>Squad: {t.players.length}/{t.maxSquadSize}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-blue-300 uppercase block">Remaining Purse</span>
                          <span className="font-score font-black text-lg text-emerald-400">
                            {currency}{t.purse.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-blue-500/20">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-blue-300">Theme:</span>
                          <span className="w-3.5 h-3.5 rounded-full border border-white" style={{ background: t.primaryColor }} />
                          <span className="w-3.5 h-3.5 rounded-full border border-white" style={{ background: t.secondaryColor }} />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const newPurseStr = prompt(`Set purse for ${t.name}:`, t.purse.toString());
                              if (newPurseStr) {
                                const val = parseInt(newPurseStr, 10);
                                if (!isNaN(val) && val >= 0) {
                                  onUpdateTeamPurse(t.id, val);
                                  showNotification(`Purse for ${t.name} set to ${currency}${val.toLocaleString()}`);
                                }
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold cursor-pointer"
                          >
                            Set Purse
                          </button>
                          <button
                            onClick={() => setEditingTeam(t)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Brand</span>
                          </button>
                          {onDeleteTeam && (
                            teamToDeleteId === t.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    onDeleteTeam(t.id);
                                    setTeamToDeleteId(null);
                                    showNotification(`Franchise "${t.name}" removed from tournament.`);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow cursor-pointer"
                                >
                                  Confirm Delete
                                </button>
                                <button
                                  onClick={() => setTeamToDeleteId(null)}
                                  className="px-2 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold cursor-pointer"
                                  title="Cancel"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setTeamToDeleteId(t.id)}
                                className="p-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 cursor-pointer"
                                title="Delete Team"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: LIVE AUCTION COMMANDER, REFUND & RE-AUCTION DESK */}
            {activeSubTab === 'auction' && (
              <div className="flex-1 overflow-y-auto pt-3 space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#081630] border-2 border-amber-400/50 space-y-4 shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-400/20 pb-3">
                    <div className="flex items-center gap-2">
                      <Gavel className="w-5 h-5 text-amber-400" />
                      <div>
                        <h4 className="font-score font-black text-sm sm:text-base text-white uppercase">
                          MASTER OWNER LIVE STAGE & MANUAL HAMMER DESK
                        </h4>
                        <p className="text-[11px] text-blue-200">
                          Full Stage Control, Manual Hammer, Refund & Re-Auction
                        </p>
                      </div>
                    </div>
                  </div>

                  {currentPlayer ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl bg-blue-950/70 border border-blue-400/30">
                        <div className="flex items-center gap-3">
                          <PlayerAvatar player={currentPlayer} size="md" />
                          <div>
                            <span className="font-score font-bold text-white text-base block">
                              {currentPlayer.name}
                            </span>
                            <span className="text-blue-300 block">
                              {currentPlayer.role} · Base Reserve: {currency}{currentPlayer.basePrice.toLocaleString()}
                            </span>
                            <span className="text-amber-300 font-score font-bold text-sm mt-0.5 block">
                              Current Bid: {currency}{(currentBid > 0 ? currentBid : currentPlayer.basePrice).toLocaleString()}{' '}
                              {highestBidder ? `(Held by ${highestBidder.shortCode})` : '(No Bids Yet)'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {onSellNow && (
                            <button
                              type="button"
                              disabled={!highestBidder}
                              onClick={() => {
                                onSellNow();
                                showNotification(`Hammer dropped! ${currentPlayer.name} sold to ${highestBidder?.shortCode}!`);
                              }}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-score font-black text-xs uppercase shadow cursor-pointer"
                            >
                              <Gavel className="w-4 h-4" />
                              <span>🔨 Hammer Bid (Sold)</span>
                            </button>
                          )}
                          {onMarkUnsold && (
                            <button
                              type="button"
                              onClick={() => {
                                onMarkUnsold();
                                showNotification(`${currentPlayer.name} marked Unsold.`);
                              }}
                              className="px-3 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-score font-bold text-xs uppercase cursor-pointer"
                            >
                              Mark Unsold
                            </button>
                          )}
                          {onNextPlayer && (
                            <button
                              type="button"
                              onClick={() => {
                                onNextPlayer();
                                showNotification('Loaded next player to stage.');
                              }}
                              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-score font-bold text-xs uppercase cursor-pointer"
                            >
                              Next Lot
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[11px] text-blue-300 font-semibold">Direct Sell to Franchise:</span>
                        {teams.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              if (onForceSellPlayer && currentPlayer) {
                                const priceStr = prompt(`Sell ${currentPlayer.name} to ${t.name} for:`, (currentBid > 0 ? currentBid : currentPlayer.basePrice).toString());
                                if (priceStr) {
                                  const p = parseInt(priceStr, 10);
                                  if (!isNaN(p) && p > 0) {
                                    onForceSellPlayer(currentPlayer.id, t.id, p);
                                    showNotification(`Sold ${currentPlayer.name} to ${t.shortCode}!`);
                                  }
                                }
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/60 border border-blue-400/30 text-white font-score text-[11px] cursor-pointer"
                          >
                            Sell to {t.shortCode}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-blue-950/50 border border-blue-500/20">
                      <p className="text-blue-300">No active player currently on stage.</p>
                      {onNextPlayer && (
                        <button
                          type="button"
                          onClick={onNextPlayer}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-score font-bold text-xs uppercase cursor-pointer"
                        >
                          Load First Lot to Stage
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* SOLD PLAYERS OVERRIDE & REFUND DESK */}
                <div className="p-4 rounded-2xl bg-[#081630] border border-rose-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-rose-400" />
                      <h4 className="font-score font-bold text-sm text-white">
                        SOLD PLAYERS: CANCEL BID & REFUND TEAM FUNDS
                      </h4>
                    </div>
                    <span className="text-xs text-rose-300 font-semibold">
                      {players.filter(p => p.status === 'sold').length} Sold Lots
                    </span>
                  </div>
                  <p className="text-blue-200">
                    Cancel an auction sale, refund the purchase amount back to the acquiring franchise&apos;s ₹60,000 treasury, and re-enter the player into the auction.
                  </p>

                  {players.filter(p => p.status === 'sold').length === 0 ? (
                    <div className="p-6 text-center text-blue-300/60 bg-blue-950/30 rounded-xl italic">
                      No players are currently sold.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                      {players.filter(p => p.status === 'sold').map((p) => {
                        const buyer = teams.find(t => t.id === p.soldTo);
                        return (
                          <div
                            key={p.id}
                            className="p-3 rounded-xl bg-blue-950/70 border border-rose-500/30 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <PlayerAvatar player={p} size="sm" />
                              <div className="min-w-0">
                                <span className="font-semibold text-white block truncate">{p.name}</span>
                                <span className="text-[11px] text-emerald-300 block">
                                  Sold: {currency}{(p.soldPrice || 0).toLocaleString()} to {buyer?.shortCode || 'Club'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {onCancelSale && (
                                <>
                                  <button
                                    onClick={() => {
                                      onCancelSale(p.id, true);
                                      showNotification(`Sale of ${p.name} cancelled! Refunded ₹${(p.soldPrice || 0).toLocaleString()} to ${buyer?.shortCode}. Put directly on auction stage!`);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-score font-bold text-[10px] uppercase shadow cursor-pointer"
                                  >
                                    Refund + Stage
                                  </button>
                                  <button
                                    onClick={() => {
                                      onCancelSale(p.id, false);
                                      showNotification(`Sale of ${p.name} cancelled! Refunded ₹${(p.soldPrice || 0).toLocaleString()} to ${buyer?.shortCode}.`);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 font-score text-[10px] uppercase cursor-pointer"
                                  >
                                    Refund to Pool
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* UNSOLD PLAYERS RECALL DESK */}
                <div className="p-4 rounded-2xl bg-[#081630] border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-amber-400" />
                      <h4 className="font-score font-bold text-sm text-white">
                        UNSOLD PLAYERS RECALL DESK
                      </h4>
                    </div>
                    <span className="text-xs text-amber-300 font-semibold">
                      {players.filter(p => p.status === 'unsold').length} Unsold Lots
                    </span>
                  </div>
                  <p className="text-blue-200">
                    Recall lots that went unsold under reserve and re-enter them into the live bidding room or available auction registry.
                  </p>

                  {players.filter(p => p.status === 'unsold').length === 0 ? (
                    <div className="p-6 text-center text-blue-300/60 bg-blue-950/30 rounded-xl italic">
                      No players are currently marked as unsold.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                      {players.filter(p => p.status === 'unsold').map((p) => (
                        <div
                          key={p.id}
                          className="p-3 rounded-xl bg-blue-950/70 border border-amber-500/30 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <PlayerAvatar player={p} size="sm" />
                            <div className="min-w-0">
                              <span className="font-semibold text-white block truncate">{p.name}</span>
                              <span className="text-[11px] text-amber-300 block">
                                {p.role} · Base {currency}{p.basePrice.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {onReenterAuction && (
                              <>
                                <button
                                  onClick={() => {
                                    onReenterAuction(p.id, true);
                                    showNotification(`${p.name} recalled from Unsold and put onto live stage!`);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-score font-bold text-[10px] uppercase shadow cursor-pointer"
                                >
                                  Recall to Stage
                                </button>
                                <button
                                  onClick={() => {
                                    onReenterAuction(p.id, false);
                                    showNotification(`${p.name} returned to available auction pool.`);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-score text-[10px] uppercase cursor-pointer"
                                >
                                  Return to Pool
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: DATABASE & BACKUPS */}
            {activeSubTab === 'database' && (
              <div className="flex-1 overflow-y-auto pt-3 space-y-4 text-xs">
                <div className="p-5 rounded-2xl bg-[#081630] border border-blue-400/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-400" />
                    <h4 className="font-score font-bold text-base text-white">
                      BACKEND DATABASE STORAGE & EXPORTS
                    </h4>
                  </div>
                  <p className="text-blue-200 leading-relaxed">
                    All player details, images, team logos, and auction statistics are synchronized with the backend Express server database. You can download complete state backups or export full rosters to CSV.
                  </p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => {
                        const data = { exportTime: new Date().toISOString(), teams, players };
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `dpl-database-backup-${Date.now()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        showNotification('Database backup downloaded!');
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-score font-bold uppercase transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Full Database (JSON)</span>
                    </button>

                    <button
                      onClick={() => {
                        const headers = 'ID,Name,Role,Nationality,IsOverseas,BasePrice,Status,SoldPrice,SoldToTeam\n';
                        const rows = players
                          .map(
                            p =>
                              `"${p.id}","${p.name}","${p.role}","${p.nationality}",${p.isOverseas},${p.basePrice},"${p.status}",${p.soldPrice || 0},"${p.soldTo || ''}"`
                          )
                          .join('\n');
                        const blob = new Blob([headers + rows], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `dpl-player-registry-${Date.now()}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                        showNotification('Players CSV downloaded!');
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-score font-bold uppercase transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Players Roster (CSV)</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to reset the auction database to factory defaults? All bids and sales will reset.')) {
                          onResetAuction();
                          dbApi.resetDatabase();
                          showNotification('Database reset to factory initial state.');
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-score font-bold uppercase transition cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Reset to Factory Defaults</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- MODAL: EDIT PLAYER IMAGE & DETAILS ---------------- */}
        {editingPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-[#0a1835] border-2 border-blue-400/50 p-5 shadow-2xl overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-blue-400/30">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-400" />
                  <h4 className="font-score font-bold text-lg text-white">
                    EDIT PLAYER IMAGE & DETAILS
                  </h4>
                </div>
                <button
                  onClick={() => setEditingPlayer(null)}
                  className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Player Image Editor */}
              <div className="p-4 rounded-2xl bg-blue-950/60 border border-blue-500/20 space-y-3">
                <label className="font-score font-bold text-xs text-white block">
                  PLAYER PHOTO / IMAGE STUDIO
                </label>
                <div className="flex items-center gap-4">
                  <PlayerAvatar player={editingPlayer} size="md" />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={editingPlayer.photo || ''}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, photo: e.target.value })}
                      placeholder="Paste image URL https://..."
                      className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white text-xs focus:outline-none focus:border-blue-400"
                    />
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, false)}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditingPlayer({ ...editingPlayer, photo: undefined })}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-slate-300 cursor-pointer"
                      >
                        Reset to Silhouette
                      </button>
                    </div>
                  </div>
                </div>

                {/* Preset Avatars */}
                <div>
                  <span className="text-[11px] text-blue-300 block mb-1">Or choose a preset cricket athlete portrait:</span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {CRICKET_PLAYER_PRESETS.map((cp, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditingPlayer({ ...editingPlayer, photo: cp.photo })}
                        className="p-1.5 rounded-xl bg-blue-900/40 hover:bg-blue-600/30 border border-blue-400/20 text-[10px] text-white shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <img src={cp.photo} alt={cp.name} className="w-6 h-6 rounded-full object-cover" />
                        <span>{cp.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-blue-200 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingPlayer.name}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                  />
                </div>

                <div>
                  <label className="text-blue-200 block mb-1">Role</label>
                  <select
                    value={editingPlayer.role}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, role: e.target.value as PlayerRole })}
                    className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                  >
                    <option value="Batter">Batter</option>
                    <option value="Wicketkeeper">Wicketkeeper</option>
                    <option value="All-rounder">All-rounder</option>
                    <option value="Fast Bowler">Fast Bowler</option>
                    <option value="Spin Bowler">Spin Bowler</option>
                  </select>
                </div>

                <div>
                  <label className="text-blue-200 block mb-1">Age</label>
                  <input
                    type="number"
                    value={editingPlayer.age}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, age: parseInt(e.target.value, 10) || 20 })}
                    className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                  />
                </div>

                <div>
                  <label className="text-blue-200 block mb-1">Base Price ({currency})</label>
                  <input
                    type="number"
                    value={editingPlayer.basePrice}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, basePrice: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                  />
                </div>

                <div>
                  <label className="text-blue-200 block mb-1">Batting Style</label>
                  <input
                    type="text"
                    value={editingPlayer.battingStyle}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, battingStyle: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                  />
                </div>

                <div>
                  <label className="text-blue-200 block mb-1">Bowling Style</label>
                  <input
                    type="text"
                    value={editingPlayer.bowlingStyle}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, bowlingStyle: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                  />
                </div>

                <div>
                  <label className="text-blue-200 block mb-1">Matches Played</label>
                  <input
                    type="number"
                    value={editingPlayer.stats.matches}
                    onChange={(e) => setEditingPlayer({
                      ...editingPlayer,
                      stats: { ...editingPlayer.stats, matches: parseInt(e.target.value, 10) || 0 }
                    })}
                    className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                  />
                </div>

                <div>
                  <label className="text-blue-200 block mb-1">Runs Scored</label>
                  <input
                    type="number"
                    value={editingPlayer.stats.runs || 0}
                    onChange={(e) => setEditingPlayer({
                      ...editingPlayer,
                      stats: { ...editingPlayer.stats, runs: parseInt(e.target.value, 10) || 0 }
                    })}
                    className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                  />
                </div>

                <div>
                  <label className="text-blue-200 block mb-1">Wickets Taken</label>
                  <input
                    type="number"
                    value={editingPlayer.stats.wickets || 0}
                    onChange={(e) => setEditingPlayer({
                      ...editingPlayer,
                      stats: { ...editingPlayer.stats, wickets: parseInt(e.target.value, 10) || 0 }
                    })}
                    className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                  />
                </div>

                <div>
                  <label className="text-blue-200 block mb-1">Batting Strike Rate</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingPlayer.stats.strikeRate || 0}
                    onChange={(e) => setEditingPlayer({
                      ...editingPlayer,
                      stats: { ...editingPlayer.stats, strikeRate: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-blue-400/20">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedPlayer}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-score font-bold text-xs uppercase shadow-lg shadow-blue-600/40 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Player Details</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- MODAL: EDIT TEAM LOGO & BRAND ---------------- */}
        {editingTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-xl rounded-3xl bg-[#0a1835] border-2 border-blue-400/50 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-blue-400/30">
                <div className="flex items-center gap-2">
                  <TeamBadge team={editingTeam} size="sm" />
                  <h4 className="font-score font-bold text-lg text-white">
                    EDIT {editingTeam.name.toUpperCase()} BRAND & LOGO
                  </h4>
                </div>
                <button
                  onClick={() => setEditingTeam(null)}
                  className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Logo Studio */}
              <div className="p-4 rounded-2xl bg-blue-950/60 border border-blue-500/20 space-y-3">
                <label className="font-score font-bold text-xs text-white block">
                  TEAM LOGO IMAGE (VISIBLE ACROSS ALL USERS)
                </label>
                <div className="flex items-center gap-4">
                  <TeamBadge team={editingTeam} size="xl" />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={editingTeam.logoUrl || ''}
                      onChange={(e) => setEditingTeam({ ...editingTeam, logoUrl: e.target.value })}
                      placeholder="Paste Team Logo URL https://..."
                      className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white text-xs focus:outline-none focus:border-blue-400"
                    />
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Logo File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleTeamLogoUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const def = TEAM_DEFAULT_LOGOS[editingTeam.id];
                          if (def) setEditingTeam({ ...editingTeam, logoUrl: def });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-slate-300 cursor-pointer"
                      >
                        Reset Default SVG Logo
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Info Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-blue-200 block mb-1">Team Full Name</label>
                  <input
                    type="text"
                    value={editingTeam.name}
                    onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                  />
                </div>

                <div>
                  <label className="text-blue-200 block mb-1">Short Code</label>
                  <input
                    type="text"
                    value={editingTeam.shortCode}
                    onChange={(e) => setEditingTeam({ ...editingTeam, shortCode: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                  />
                </div>

                <div>
                  <label className="text-blue-200 block mb-1">Purse Budget ({currency})</label>
                  <input
                    type="number"
                    value={editingTeam.purse}
                    onChange={(e) => setEditingTeam({ ...editingTeam, purse: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                  />
                </div>

                <div>
                  <label className="text-blue-200 block mb-1">Motto</label>
                  <input
                    type="text"
                    value={editingTeam.motto}
                    onChange={(e) => setEditingTeam({ ...editingTeam, motto: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                  />
                </div>

                <div>
                  <label className="text-blue-200 block mb-1">Primary Color (Hex)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingTeam.primaryColor}
                      onChange={(e) => setEditingTeam({ ...editingTeam, primaryColor: e.target.value })}
                      className="w-9 h-9 rounded cursor-pointer border border-white"
                    />
                    <input
                      type="text"
                      value={editingTeam.primaryColor}
                      onChange={(e) => setEditingTeam({ ...editingTeam, primaryColor: e.target.value })}
                      className="flex-1 p-2 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-blue-200 block mb-1">Secondary Color (Hex)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingTeam.secondaryColor}
                      onChange={(e) => setEditingTeam({ ...editingTeam, secondaryColor: e.target.value })}
                      className="w-9 h-9 rounded cursor-pointer border border-white"
                    />
                    <input
                      type="text"
                      value={editingTeam.secondaryColor}
                      onChange={(e) => setEditingTeam({ ...editingTeam, secondaryColor: e.target.value })}
                      className="flex-1 p-2 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-blue-400/20">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedTeam}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-score font-bold text-xs uppercase shadow-lg shadow-blue-600/40 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Team Logo & Brand</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- MODAL: ADD NEW PLAYER ---------------- */}
        {showAddPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-[#0a1835] border-2 border-blue-400/50 p-5 shadow-2xl overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-blue-400/30">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-score font-bold text-lg text-white">
                    ADD NEW PLAYER TO AUCTION DATABASE
                  </h4>
                </div>
                <button
                  onClick={() => setShowAddPlayer(false)}
                  className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateNewPlayer} className="space-y-4 text-xs">
                {/* Photo uploader */}
                <div className="p-3 rounded-2xl bg-blue-950/60 border border-blue-500/20 space-y-2">
                  <label className="text-blue-200 block font-semibold">Player Photo (File or URL)</label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl bg-blue-900 border border-blue-400/30 overflow-hidden flex items-center justify-center">
                      {newPlayerPhoto ? (
                        <img src={newPlayerPhoto} alt="New Player" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-blue-400/60" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
                        value={newPlayerPhoto}
                        onChange={(e) => setNewPlayerPhoto(e.target.value)}
                        placeholder="Image URL https://..."
                        className="w-full p-2 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                      />
                      <label className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Local Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, true)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-blue-200 block mb-1">Player Full Name</label>
                    <input
                      type="text"
                      required
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="e.g. Jasprit Bumrah"
                      className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-blue-200 block mb-1">Role</label>
                    <select
                      value={newPlayerRole}
                      onChange={(e) => setNewPlayerRole(e.target.value as PlayerRole)}
                      className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                    >
                      <option value="Batter">Batter</option>
                      <option value="Wicketkeeper">Wicketkeeper</option>
                      <option value="All-rounder">All-rounder</option>
                      <option value="Fast Bowler">Fast Bowler</option>
                      <option value="Spin Bowler">Spin Bowler</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-blue-200 block mb-1">Age</label>
                    <input
                      type="number"
                      value={newPlayerAge}
                      onChange={(e) => setNewPlayerAge(parseInt(e.target.value, 10) || 22)}
                      className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-blue-200 block mb-1">Base Price ({currency})</label>
                    <input
                      type="number"
                      value={newPlayerBasePrice}
                      onChange={(e) => setNewPlayerBasePrice(parseInt(e.target.value, 10) || 500)}
                      className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-blue-200 block mb-1">Batting Style</label>
                    <input
                      type="text"
                      value={newPlayerBatting}
                      onChange={(e) => setNewPlayerBatting(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-blue-200 block mb-1">Bowling Style</label>
                    <input
                      type="text"
                      value={newPlayerBowling}
                      onChange={(e) => setNewPlayerBowling(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-blue-200 block mb-1">Matches Played</label>
                    <input
                      type="number"
                      value={newPlayerMatches}
                      onChange={(e) => setNewPlayerMatches(parseInt(e.target.value, 10) || 0)}
                      className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-blue-200 block mb-1">Total Runs</label>
                    <input
                      type="number"
                      value={newPlayerRuns}
                      onChange={(e) => setNewPlayerRuns(parseInt(e.target.value, 10) || 0)}
                      className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-blue-200 block mb-1">Total Wickets</label>
                    <input
                      type="number"
                      value={newPlayerWickets}
                      onChange={(e) => setNewPlayerWickets(parseInt(e.target.value, 10) || 0)}
                      className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-blue-200 block mb-1">Strike Rate</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newPlayerStrikeRate}
                      onChange={(e) => setNewPlayerStrikeRate(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-blue-200 block mb-1">Highest Score</label>
                    <input
                      type="text"
                      value={newPlayerHighestScore}
                      onChange={(e) => setNewPlayerHighestScore(e.target.value)}
                      placeholder="e.g. 98*"
                      className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-blue-400/20">
                  <button
                    type="button"
                    onClick={() => setShowAddPlayer(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-score font-bold text-xs uppercase shadow-lg shadow-emerald-600/40 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create & Add Player</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: ADD NEW FRANCHISE */}
        {showAddTeam && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-2xl bg-[#081630] border-2 border-emerald-500/40 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-blue-400/20 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-score font-bold text-base text-white">Add New DPL Franchise</h3>
                </div>
                <button
                  onClick={() => setShowAddTeam(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNewTeam} className="space-y-4 text-xs">
                {/* Team Logo Preview & Upload */}
                <div className="flex items-center gap-4 p-3 rounded-xl bg-blue-950/40 border border-blue-500/30">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-white/20 overflow-hidden shadow-inner text-white font-score font-black text-xl"
                    style={{ background: `linear-gradient(135deg, ${newTeamPrimaryColor}, ${newTeamSecondaryColor})` }}
                  >
                    {newTeamLogoUrl ? (
                      <img src={newTeamLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      newTeamShortCode || 'DPL'
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="text-blue-200 block font-semibold mb-1">Franchise Logo</label>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-blue-200 cursor-pointer text-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleTeamLogoUpload(e, true)}
                      />
                    </label>
                    <span className="text-[10px] text-blue-300/60 block mt-1">PNG, JPG, or SVG</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-blue-200 block mb-1">Franchise Name</label>
                    <input
                      type="text"
                      required
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="e.g. Royal Challengers DPL"
                      className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-blue-200 block mb-1">Short Code (2-4 letters)</label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={newTeamShortCode}
                      onChange={(e) => setNewTeamShortCode(e.target.value.toUpperCase())}
                      placeholder="e.g. RCD"
                      className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white uppercase font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-blue-200 block mb-1">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newTeamPrimaryColor}
                        onChange={(e) => setNewTeamPrimaryColor(e.target.value)}
                        className="w-10 h-9 rounded-lg border border-blue-400/40 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={newTeamPrimaryColor}
                        onChange={(e) => setNewTeamPrimaryColor(e.target.value)}
                        className="flex-1 p-2 rounded-xl bg-[#071329] border border-blue-500/30 text-white font-mono text-xs uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-blue-200 block mb-1">Secondary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newTeamSecondaryColor}
                        onChange={(e) => setNewTeamSecondaryColor(e.target.value)}
                        className="w-10 h-9 rounded-lg border border-blue-400/40 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={newTeamSecondaryColor}
                        onChange={(e) => setNewTeamSecondaryColor(e.target.value)}
                        className="flex-1 p-2 rounded-xl bg-[#071329] border border-blue-500/30 text-white font-mono text-xs uppercase"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-blue-200 block mb-1">Team Motto</label>
                    <input
                      type="text"
                      value={newTeamMotto}
                      onChange={(e) => setNewTeamMotto(e.target.value)}
                      placeholder="e.g. Fearless & Victorious"
                      className="w-full p-2.5 rounded-xl bg-[#071329] border border-blue-500/30 text-white"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-400/30 text-[11px] text-blue-200">
                  <span>Starting Purse: <strong>₹60,000</strong> (Official Maximum DPL Purse)</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-blue-400/20">
                  <button
                    type="button"
                    onClick={() => setShowAddTeam(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-score font-bold text-xs uppercase shadow-lg shadow-emerald-600/40 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Franchise</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
