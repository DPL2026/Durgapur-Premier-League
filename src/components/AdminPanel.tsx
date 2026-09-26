import React, { useState } from 'react';
import { Player, Team, PlayerRole } from '../types';
import {
  Shield,
  Lock,
  Plus,
  Trash2,
  Edit3,
  Save,
  Download,
  Check,
  AlertCircle,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { TeamBadge } from './TeamBadge';

interface AdminPanelProps {
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
  onDeleteTeam?: (teamId: string) => void;
  onUpdateTeamPurse: (teamId: string, newPurse: number) => void;
  onResetAuction: () => void;
  currency?: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
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
  onDeleteTeam,
  onUpdateTeamPurse,
  onResetAuction,
  currency = '₹'
}) => {
  // Login
  const [email, setEmail] = useState('priyam1.3.2008@gmail.com');
  const [password, setPassword] = useState('Priyam01032008@');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Admin tabs
  const [adminTab, setAdminTab] = useState<'players' | 'teams' | 'export'>('players');

  // New Player
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState<PlayerRole>('Batter');
  const [newPlayerNationality, setNewPlayerNationality] = useState('Indian');
  const [newPlayerIsOverseas, setNewPlayerIsOverseas] = useState(false);
  const [newPlayerAge, setNewPlayerAge] = useState<number>(24);
  const [newPlayerBasePrice, setNewPlayerBasePrice] = useState<number>(1000);
  const [newPlayerBatting, setNewPlayerBatting] = useState('Right-hand bat');
  const [newPlayerBowling, setNewPlayerBowling] = useState('Right-arm fast');
  const [newPlayerPhoto, setNewPlayerPhoto] = useState<string>('');
  const [addSuccess, setAddSuccess] = useState(false);

  // Existing Player Edit
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editBasePrice, setEditBasePrice] = useState<number>(1000);
  const [editRole, setEditRole] = useState<PlayerRole>('Batter');

  // NEW: existing player photo edit state
  const [editPlayerPhoto, setEditPlayerPhoto] = useState<string>('');
  const [editPhotoFileName, setEditPhotoFileName] = useState<string>('');

  const [playerSearchQuery, setPlayerSearchQuery] = useState('');

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
    p.role.toLowerCase().includes(playerSearchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  // -----------------------------
  // LOGIN
  // -----------------------------
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const success = onLogin(email, password);

    if (!success) {
      setLoginError(
        'Invalid owner credentials. Use priyam1.3.2008@gmail.com / Priyam01032008@'
      );
    } else {
      setLoginError(null);
    }
  };

  // -----------------------------
  // CREATE NEW PLAYER
  // -----------------------------
  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPlayerName.trim()) return;

    onAddPlayer({
      name: newPlayerName.trim(),
      role: newPlayerRole,
      nationality: newPlayerNationality.trim(),
      isOverseas: newPlayerIsOverseas,
      age: newPlayerAge,
      basePrice: newPlayerBasePrice,
      battingStyle: newPlayerBatting,
      bowlingStyle: newPlayerBowling,
      photo: newPlayerPhoto.trim() || undefined,
      stats: {
        matches: 20,
        runs: 450,
        wickets: 12,
        strikeRate: 138.0
      }
    });

    setAddSuccess(true);
    setNewPlayerName('');
    setNewPlayerPhoto('');

    setTimeout(() => {
      setAddSuccess(false);
    }, 3000);
  };

  // -----------------------------
  // NEW PLAYER PHOTO
  // -----------------------------
  const handleImageFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result as string;

      if (result) {
        setNewPlayerPhoto(result);
      }
    };

    reader.readAsDataURL(file);

    // Allow selecting same file again
    e.target.value = '';
  };

  // -----------------------------
  // EXISTING PLAYER PHOTO
  // -----------------------------
  const handleEditImageFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    // Basic size warning
    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5 MB.');
      return;
    }

    setEditPhotoFileName(file.name);

    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result as string;

      if (result) {
        setEditPlayerPhoto(result);
      }
    };

    reader.readAsDataURL(file);

    // Allow same file to be selected again
    e.target.value = '';
  };

  // -----------------------------
  // START EDITING PLAYER
  // -----------------------------
  const startEditingPlayer = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditBasePrice(player.basePrice);
    setEditRole(player.role);

    // Load existing photo
    setEditPlayerPhoto(player.photo || '');
    setEditPhotoFileName('');
  };

  // -----------------------------
  // CANCEL EDIT
  // -----------------------------
  const cancelEditingPlayer = () => {
    setEditingPlayerId(null);
    setEditPlayerPhoto('');
    setEditPhotoFileName('');
  };

  // -----------------------------
  // SAVE PLAYER
  // -----------------------------
  const saveEditedPlayer = (player: Player) => {
    const updateData: Partial<Player> = {
      basePrice: editBasePrice,
      role: editRole
    };

    // Only send photo if user actually selected/changed it.
    if (editPlayerPhoto) {
      updateData.photo = editPlayerPhoto;
    }

    onUpdatePlayer(player.id, updateData);

    setEditingPlayerId(null);
    setEditPlayerPhoto('');
    setEditPhotoFileName('');
  };

  // -----------------------------
  // EXPORT JSON
  // -----------------------------
  const handleExportJSON = () => {
    const data = {
      exportTime: new Date().toISOString(),
      teams,
      players
    };

    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `dpl-auction-export-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  // -----------------------------
  // EXPORT CSV
  // -----------------------------
  const handleExportCSV = () => {
    const headers =
      'ID,Name,Role,Nationality,IsOverseas,BasePrice,Status,SoldPrice,SoldToTeam\n';

    const rows = players
      .map(
        p =>
          `"${p.id}","${p.name}","${p.role}","${p.nationality}",${p.isOverseas},${p.basePrice},"${p.status}",${p.soldPrice || 0},"${p.soldTo || ''}"`
      )
      .join('\n');

    const blob = new Blob(
      [headers + rows],
      { type: 'text/csv' }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `dpl-players-results-${Date.now()}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl bg-[#0b0e17] border-2 border-amber-500/50 p-5 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col">

        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>

            <div>
              <h3 className="font-score font-black text-xl text-white tracking-wide">
                DPL AUCTIONEER & OWNER PORTAL
              </h3>

              <p className="text-xs text-slate-400">
                Authorized simulation controller and player registry manager
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close
          </button>
        </div>

        {/* LOGIN */}
        {!isAdminLoggedIn ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">

              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-2 text-amber-400">
                  <Lock className="w-6 h-6" />
                </div>

                <h4 className="font-score font-bold text-lg text-white">
                  Owner Authentication
                </h4>

                <p className="text-xs text-slate-400">
                  Enter credentials to access auction configuration controls
                </p>
              </div>

              {loginError && (
                <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <form
                onSubmit={handleLoginSubmit}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Owner Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Owner email"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Password
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Password"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-score font-bold text-xs uppercase tracking-wider shadow-lg transition"
                  >
                    Log In As Owner
                  </button>
                </div>
              </form>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400">
                <span className="text-amber-400 font-bold block mb-0.5">
                  Preset Credentials:
                </span>
                <span>
                  priyam1.3.2008@gmail.com / Priyam01032008@
                </span>
              </div>
            </div>
          </div>
        ) : (

          /* ADMIN WORKSPACE */
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* NAV */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 shrink-0 text-xs">
              <div className="flex items-center gap-2">

                <button
                  onClick={() => setAdminTab('players')}
                  className={`px-3 py-1.5 rounded-xl font-score font-bold uppercase transition ${
                    adminTab === 'players'
                      ? 'bg-amber-500 text-black'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Manage Players ({players.length})
                </button>

                <button
                  onClick={() => setAdminTab('teams')}
                  className={`px-3 py-1.5 rounded-xl font-score font-bold uppercase transition ${
                    adminTab === 'teams'
                      ? 'bg-amber-500 text-black'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Manage Teams & Purses
                </button>

                <button
                  onClick={() => setAdminTab('export')}
                  className={`px-3 py-1.5 rounded-xl font-score font-bold uppercase transition ${
                    adminTab === 'export'
                      ? 'bg-amber-500 text-black'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Export Data
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-semibold hidden sm:inline">
                  ● Priyam Roy (Owner)
                </span>

                <button
                  onClick={onLogout}
                  className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 hover:bg-rose-900/80 transition"
                >
                  Log Out
                </button>
              </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto pr-1">

              {/* PLAYERS */}
              {adminTab === 'players' && (
                <div className="space-y-6">

                  {/* ADD PLAYER */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-amber-400" />

                        <h4 className="font-score font-bold text-sm text-white">
                          ADD NEW AUCTION PLAYER
                        </h4>
                      </div>

                      {addSuccess && (
                        <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Player Added to Registry!
                        </span>
                      )}
                    </div>

                    <form
                      onSubmit={handleCreatePlayer}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs"
                    >

                      <div>
                        <label className="text-slate-400 block mb-1">
                          Player Full Name
                        </label>

                        <input
                          type="text"
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          placeholder="e.g. Rohit Sharma"
                          required
                          className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">
                          Playing Role
                        </label>

                        <select
                          value={newPlayerRole}
                          onChange={(e) =>
                            setNewPlayerRole(e.target.value as PlayerRole)
                          }
                          className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="Batter">Batter</option>
                          <option value="Wicketkeeper">Wicketkeeper</option>
                          <option value="All-rounder">All-rounder</option>
                          <option value="Fast Bowler">Fast Bowler</option>
                          <option value="Spin Bowler">Spin Bowler</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">
                          Base Price ({currency})
                        </label>

                        <select
                          value={newPlayerBasePrice}
                          onChange={(e) =>
                            setNewPlayerBasePrice(
                              parseInt(e.target.value, 10)
                            )
                          }
                          className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value={200}>{currency}200</option>
                          <option value={500}>{currency}500</option>
                          <option value={750}>{currency}750</option>
                          <option value={1000}>{currency}1,000</option>
                          <option value={1500}>{currency}1,500</option>
                          <option value={2000}>{currency}2,000</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">
                          Nationality
                        </label>

                        <input
                          type="text"
                          value={newPlayerNationality}
                          onChange={(e) => {
                            setNewPlayerNationality(e.target.value);
                            setNewPlayerIsOverseas(
                              e.target.value.toLowerCase() !== 'indian'
                            );
                          }}
                          placeholder="Indian, Australia, etc."
                          required
                          className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">
                          Batting Style
                        </label>

                        <input
                          type="text"
                          value={newPlayerBatting}
                          onChange={(e) =>
                            setNewPlayerBatting(e.target.value)
                          }
                          placeholder="Right-hand bat"
                          className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">
                          Bowling Style
                        </label>

                        <input
                          type="text"
                          value={newPlayerBowling}
                          onChange={(e) =>
                            setNewPlayerBowling(e.target.value)
                          }
                          placeholder="Right-arm fast"
                          className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      {/* NEW PLAYER PHOTO */}
                      <div className="sm:col-span-2">
                        <label className="text-slate-400 block mb-1 flex items-center justify-between">
                          <span>Player Photo (URL or File Upload)</span>
                          <span className="text-[10px] text-slate-500">
                            Optional
                          </span>
                        </label>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newPlayerPhoto}
                            onChange={(e) =>
                              setNewPlayerPhoto(e.target.value)
                            }
                            placeholder="Image URL https://..."
                            className="flex-1 p-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                          />

                          <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Browse</span>

                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="sm:col-span-1 flex items-end">
                        <button
                          type="submit"
                          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-score font-bold uppercase transition"
                        >
                          + ADD PLAYER
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* PLAYERS TABLE */}
                  <div>

                    <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                      <h4 className="font-score font-bold text-sm text-white">
                        REGISTERED PLAYERS ROSTER (
                        {filteredPlayers.length}/{players.length})
                      </h4>

                      <input
                        type="text"
                        value={playerSearchQuery}
                        onChange={(e) =>
                          setPlayerSearchQuery(e.target.value)
                        }
                        placeholder="Search player to edit or delete..."
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 min-w-[220px]"
                      />
                    </div>

                    <div className="rounded-xl border border-slate-800 overflow-x-auto max-h-[480px]">

                      <table className="w-full text-left text-xs">

                        <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] sticky top-0 z-10">
                          <tr>
                            <th className="p-3">Player</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Nationality</th>
                            <th className="p-3">Base Price</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">

                          {filteredPlayers.map((p) => {
                            const isEditing =
                              editingPlayerId === p.id;

                            return (
                              <tr
                                key={p.id}
                                className="hover:bg-slate-800/30"
                              >

                                {/* PLAYER */}
                                <td className="p-3 font-semibold text-white min-w-[180px]">

                                  {isEditing ? (
                                    <div className="space-y-2">

                                      <div className="flex items-center gap-2">

                                        {/* Current / New Photo Preview */}
                                        <div className="relative shrink-0">

                                          {editPlayerPhoto ? (
                                            <img
                                              src={editPlayerPhoto}
                                              alt={p.name}
                                              className="w-12 h-12 rounded-xl object-cover border border-amber-500/60"
                                            />
                                          ) : (
                                            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                                              <ImageIcon className="w-5 h-5 text-slate-500" />
                                            </div>
                                          )}

                                          {editPlayerPhoto && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditPlayerPhoto('');
                                                setEditPhotoFileName('');
                                              }}
                                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center"
                                              title="Remove selected photo"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          )}

                                        </div>

                                        <div className="min-w-0">
                                          <div className="text-white truncate">
                                            {p.name}
                                          </div>

                                          <label className="mt-1 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer text-[10px] font-semibold">

                                            <ImageIcon className="w-3 h-3" />

                                            <span>
                                              Change Photo
                                            </span>

                                            <input
                                              type="file"
                                              accept="image/*"
                                              onChange={
                                                handleEditImageFileUpload
                                              }
                                              className="hidden"
                                            />
                                          </label>

                                          {editPhotoFileName && (
                                            <div className="text-[9px] text-emerald-400 mt-1 truncate max-w-[130px]">
                                              {editPhotoFileName}
                                            </div>
                                          )}
                                        </div>

                                      </div>

                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">

                                      {p.photo ? (
                                        <img
                                          src={p.photo}
                                          alt={p.name}
                                          className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                                          <ImageIcon className="w-4 h-4 text-slate-500" />
                                        </div>
                                      )}

                                      <span>{p.name}</span>
                                    </div>
                                  )}

                                </td>

                                {/* ROLE */}
                                <td className="p-3">

                                  {isEditing ? (
                                    <select
                                      value={editRole}
                                      onChange={(e) =>
                                        setEditRole(
                                          e.target.value as PlayerRole
                                        )
                                      }
                                      className="p-1 rounded bg-slate-950 border border-slate-700 text-xs"
                                    >
                                      <option value="Batter">
                                        Batter
                                      </option>

                                      <option value="Wicketkeeper">
                                        Wicketkeeper
                                      </option>

                                      <option value="All-rounder">
                                        All-rounder
                                      </option>

                                      <option value="Fast Bowler">
                                        Fast Bowler
                                      </option>

                                      <option value="Spin Bowler">
                                        Spin Bowler
                                      </option>
                                    </select>
                                  ) : (
                                    <span className="text-slate-300">
                                      {p.role}
                                    </span>
                                  )}

                                </td>

                                {/* NATIONALITY */}
                                <td className="p-3 text-slate-300">
                                  {p.nationality}{' '}
                                  {p.isOverseas ? '✈' : '🇮🇳'}
                                </td>

                                {/* BASE PRICE */}
                                <td className="p-3 font-score font-bold text-amber-400">

                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={editBasePrice}
                                      onChange={(e) =>
                                        setEditBasePrice(
                                          parseInt(
                                            e.target.value,
                                            10
                                          ) || 0
                                        )
                                      }
                                      className="w-20 p-1 rounded bg-slate-950 border border-slate-700 text-xs"
                                    />
                                  ) : (
                                    `${currency}${p.basePrice.toLocaleString()}`
                                  )}

                                </td>

                                {/* STATUS */}
                                <td className="p-3">

                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                      p.status === 'sold'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : p.status === 'unsold'
                                        ? 'bg-rose-500/20 text-rose-400'
                                        : 'bg-sky-500/20 text-sky-400'
                                    }`}
                                  >
                                    {p.status}
                                  </span>

                                </td>

                                {/* ACTIONS */}
                                <td className="p-3 text-right">

                                  <div className="flex items-center justify-end gap-1.5">

                                    {isEditing ? (

                                      <>
                                        {/* SAVE */}
                                        <button
                                          onClick={() =>
                                            saveEditedPlayer(p)
                                          }
                                          className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                                          title="Save Edits"
                                        >
                                          <Save className="w-3.5 h-3.5" />
                                        </button>

                                        {/* CANCEL */}
                                        <button
                                          onClick={
                                            cancelEditingPlayer
                                          }
                                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300"
                                          title="Cancel"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </>

                                    ) : (

                                      <button
                                        onClick={() =>
                                          startEditingPlayer(p)
                                        }
                                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                                        title="Edit Player"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>

                                    )}

                                    {/* DELETE */}
                                    <button
                                      onClick={() => {
                                        if (
                                          window.confirm(
                                            `Delete player "${p.name}"?`
                                          )
                                        ) {
                                          onDeletePlayer(p.id);
                                        }
                                      }}
                                      className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300"
                                      title="Delete Player"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>

                                  </div>

                                </td>

                              </tr>
                            );
                          })}

                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TEAMS */}
              {adminTab === 'teams' && (
                <div className="space-y-4">

                  <h4 className="font-score font-bold text-sm text-white">
                    FRANCHISE PURSE & CONFIGURATION
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">

                    {teams.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between"
                      >

                        <div className="flex items-center gap-2.5">
                          <TeamBadge team={t} size="sm" />

                          <div>
                            <span className="font-score font-bold text-white block">
                              {t.name}
                            </span>

                            <span className="text-slate-400 text-[11px]">
                              Squad: {t.players.length}/{t.maxSquadSize}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">

                          <span className="font-score font-bold text-emerald-400">
                            {currency}
                            {t.purse.toLocaleString()}
                          </span>

                          <button
                            onClick={() => {
                              const newAmount = prompt(
                                `Update purse for ${t.name}:`,
                                t.purse.toString()
                              );

                              if (newAmount) {
                                const val = parseInt(
                                  newAmount,
                                  10
                                );

                                if (!isNaN(val) && val >= 0) {
                                  onUpdateTeamPurse(t.id, val);
                                }
                              }
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                          >
                            Set Purse
                          </button>

                          {onDeleteTeam && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Delete franchise "${t.name}"?`
                                  )
                                ) {
                                  onDeleteTeam(t.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300"
                              title="Delete Franchise"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                        </div>
                      </div>
                    ))}

                  </div>
                </div>
              )}

              {/* EXPORT */}
              {adminTab === 'export' && (
                <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 text-xs">

                  <h4 className="font-score font-bold text-base text-white">
                    EXPORT AUCTION RESULTS & SQUADS
                  </h4>

                  <p className="text-slate-400 leading-relaxed">
                    Download full dataset of players, teams, sold amounts,
                    and bidding records for record-keeping or reporting.
                  </p>

                  <div className="flex flex-wrap gap-3 pt-2">

                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-score font-bold uppercase transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Players CSV</span>
                    </button>

                    <button
                      onClick={handleExportJSON}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-score font-bold uppercase transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Complete State JSON</span>
                    </button>

                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
