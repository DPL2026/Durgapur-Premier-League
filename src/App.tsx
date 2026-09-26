import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Team,
  Player,
  ViewTab,
  AuctionSettings,
  AuctionHistoryItem,
  LiveActivityLog,
  PlayerRole
} from './types';
import { INITIAL_PLAYERS, getInitializedTeams, INITIAL_SETTINGS } from './data/initialData';
import { evaluateAiBids, getNextBidIncrement } from './utils/aiBidding';
import { soundManager } from './utils/soundEffects';
import { dbApi } from './utils/api';
import {
  fetchOrSeedFirestore,
  subscribeToPublicPlayers,
  subscribeToPublicTeams,
  firestoreDocToTeam,
  savePlayerToFirestore,
  updatePlayerAuctionInFirestore,
  deletePlayerFromFirestore,
  saveTeamToFirestore,
  updateTeamPurseInFirestore,
  deleteTeamFromFirestore,
  compressImageToDataUrl
} from './firebase';

import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { TeamSelection } from './components/TeamSelection';
import { AuctionRoom } from './components/AuctionRoom';
import { SquadManagement } from './components/SquadManagement';
import { PlayerDatabase } from './components/PlayerDatabase';
import { AuctionHistory } from './components/AuctionHistory';
import { Leaderboard } from './components/Leaderboard';
import { RulesPage } from './components/RulesPage';
import { SoldModal } from './components/SoldModal';
import { SettingsModal } from './components/SettingsModal';
import { OwnerBoard } from './components/OwnerBoard';
import { FranchiseLoginModal } from './components/FranchiseLoginModal';
import { AuctionResults } from './components/AuctionResults';
import { DisclaimerFooter } from './components/DisclaimerFooter';

const STORAGE_KEY_TEAMS = 'dpl_teams_2026';
const STORAGE_KEY_PLAYERS = 'dpl_players_2026';
const STORAGE_KEY_HISTORY = 'dpl_history_2026';
const STORAGE_KEY_SETTINGS = 'dpl_settings_2026';
const STORAGE_KEY_MY_TEAM = 'dpl_my_team_2026';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ViewTab>('landing');

  // Persistence Initializers - 60,000 Total Fund per team guaranteed
  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEAMS);
      if (saved) {
        const parsed: Team[] = JSON.parse(saved);
        return parsed.map((t) => ({
          ...t,
          initialPurse: 60000,
          purse: typeof t.purse === 'number' && t.purse <= 60000 ? t.purse : 60000
        }));
      }
      return getInitializedTeams();
    } catch {
      return getInitializedTeams();
    }
  });

  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYERS);
      return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
    } catch {
      return INITIAL_PLAYERS;
    }
  });

  const [history, setHistory] = useState<AuctionHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<AuctionSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [myTeamId, setMyTeamId] = useState<string | null>(null);

  // Admin & Franchise Owner Login State (Hidden Code Verified via Backend)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [unlockedTeams, setUnlockedTeams] = useState<Record<string, string>>({});
  const [ownerAuthToken, setOwnerAuthToken] = useState<string | null>(null);

  // Modals visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isTeamLoginOpen, setIsTeamLoginOpen] = useState(false);
  const [isSoldModalOpen, setIsSoldModalOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);

  // Live Auction Engine State
  const [auctionStatus, setAuctionStatus] = useState<
    'idle' | 'bidding' | 'paused' | 'sold' | 'unsold' | 'complete'
  >('idle');
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [highestBidderId, setHighestBidderId] = useState<string | null>(null);
  const [lastBidAmount, setLastBidAmount] = useState<number>(0);
  const [lastBidderId, setLastBidderId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(settings.bidTimerDuration);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [liveLogs, setLiveLogs] = useState<LiveActivityLog[]>([]);
  const [unsoldRoundActive, setUnsoldRoundActive] = useState<boolean>(false);

  // Current Sold Modal Details
  const [soldModalData, setSoldModalData] = useState<{
    player: Player | null;
    winningTeam: Team | null;
    soldPrice: number;
  }>({
    player: null,
    winningTeam: null,
    soldPrice: 0
  });

  // Auto-sync sound settings with soundManager
  useEffect(() => {
    soundManager.setMuted(!settings.soundEnabled);
  }, [settings.soundEnabled]);

  const hasLoadedFromBackend = useRef<boolean>(false);
  const lastLocalMutationTime = useRef<number>(0);
  const rawTeamDocsRef = useRef<Record<string, any>[]>([]);

  // 1. Real-time Firebase Firestore + Backend Database synchronization for EVERY website user
  useEffect(() => {
    let isMounted = true;

    async function initSharedCloudDatabase() {
      // Check if localStorage has any owner-uploaded raster photos (png/jpeg/webp) that should be rescued into Firestore
      let localPlayersToRescue: Player[] = [];
      try {
        const rawLocal = localStorage.getItem(STORAGE_KEY_PLAYERS);
        if (rawLocal) {
          const parsedLocal = JSON.parse(rawLocal);
          if (Array.isArray(parsedLocal)) {
            localPlayersToRescue = parsedLocal.filter(
              (lp: any) =>
                lp &&
                typeof lp.photo === 'string' &&
                (lp.photo.startsWith('data:image/png') ||
                  lp.photo.startsWith('data:image/jpeg') ||
                  lp.photo.startsWith('data:image/jpg') ||
                  lp.photo.startsWith('data:image/webp'))
            );
          }
        }
      } catch {
        // Ignore localStorage parse errors
      }

      // First load from backend API (fast local fallback)
      try {
        const apiRes = await dbApi.getDatabase();
        if (
          isMounted &&
          apiRes.success &&
          apiRes.data &&
          Array.isArray(apiRes.data.players) &&
          Array.isArray(apiRes.data.teams)
        ) {
          setPlayers(apiRes.data.players);
          setTeams(apiRes.data.teams);
          if (apiRes.data.history) setHistory(apiRes.data.history);
          if (apiRes.data.settings) setSettings(apiRes.data.settings);
        }
      } catch {
        // Ignore backend error
      }

      // Load or seed from Firebase Firestore (cross-instance, cross-device cloud source of truth)
      const cloudData = await fetchOrSeedFirestore(INITIAL_PLAYERS, getInitializedTeams());
      if (isMounted && cloudData) {
        let mergedPlayers = cloudData.players;

        // Rescue any owner-uploaded raster photos from localStorage that weren't in Firestore yet
        if (localPlayersToRescue.length > 0) {
          for (const localPly of localPlayersToRescue) {
            const matchIdx = mergedPlayers.findIndex(
              (cp) =>
                cp.id === localPly.id ||
                cp.name.trim().toLowerCase() === localPly.name.trim().toLowerCase()
            );
            if (matchIdx !== -1 && !mergedPlayers[matchIdx].photo && localPly.photo) {
              try {
                const compressed = await compressImageToDataUrl(localPly.photo);
                const updatedPly: Player = { ...mergedPlayers[matchIdx], photo: compressed };
                mergedPlayers[matchIdx] = updatedPly;
                await savePlayerToFirestore(updatedPly, 'Priyam01032008@');
                await dbApi.updatePlayer(updatedPly.id, updatedPly, 'Priyam01032008@');
              } catch {
                // Ignore rescue error
              }
            }
          }
        }

        setPlayers(mergedPlayers);
        if (cloudData.teams.length > 0) {
          setTeams(cloudData.teams);
        }
      }

      if (isMounted) {
        hasLoadedFromBackend.current = true;
      }
    }

    initSharedCloudDatabase();

    // Real-time Firestore listener: Every website user sees owner-uploaded pictures and details immediately
    let unsubPlayers: (() => void) | undefined;
    let unsubTeams: (() => void) | undefined;

    try {
      unsubPlayers = subscribeToPublicPlayers((cloudPlayers) => {
        if (!isMounted || cloudPlayers.length === 0) return;
        if (Date.now() - lastLocalMutationTime.current < 1500) return;
        setPlayers(cloudPlayers);
        if (rawTeamDocsRef.current.length > 0) {
          setTeams(rawTeamDocsRef.current.map((td) => firestoreDocToTeam(td, cloudPlayers)));
        }
      });

      unsubTeams = subscribeToPublicTeams((teamDocs) => {
        if (!isMounted || teamDocs.length === 0) return;
        rawTeamDocsRef.current = teamDocs;
        if (Date.now() - lastLocalMutationTime.current < 1500) return;
        setPlayers((currentPlayers) => {
          setTeams(teamDocs.map((td) => firestoreDocToTeam(td, currentPlayers)));
          return currentPlayers;
        });
      });
    } catch (err) {
      console.warn('Firestore realtime subscription warning:', err);
    }

    return () => {
      isMounted = false;
      if (unsubPlayers) unsubPlayers();
      if (unsubTeams) unsubTeams();
    };
  }, []);

  // Explicit full sync to both Firebase Firestore & Backend (Only when triggered by authenticated Owner)
  const syncToBackend = useCallback(async () => {
    const activeAuth = isAdminLoggedIn ? 'Priyam01032008@' : ownerAuthToken;
    if (!activeAuth) return;

    lastLocalMutationTime.current = Date.now();
    try {
      if (isAdminLoggedIn || activeAuth === 'Priyam01032008@') {
        for (const p of players) {
          await savePlayerToFirestore(p, 'Priyam01032008@');
        }
        for (const t of teams) {
          await saveTeamToFirestore(t, 'Priyam01032008@');
        }
      }
      await dbApi.syncDatabase(
        {
          teams,
          players,
          history,
          settings
        },
        activeAuth
      );
    } catch {
      // Ignore sync errors
    }
  }, [teams, players, history, settings, isAdminLoggedIn, ownerAuthToken]);

  // Persist State to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(teams));
      localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
      if (myTeamId) {
        localStorage.setItem(STORAGE_KEY_MY_TEAM, myTeamId);
      }
    } catch {
      // Storage quota failsafe
    }
  }, [teams, players, history, settings, myTeamId]);

  // Helper getters
  const myTeam = teams.find((t) => t.id === myTeamId) || null;
  const currentPlayer = players.find((p) => p.id === currentPlayerId) || null;
  const highestBidder = teams.find((t) => t.id === highestBidderId) || null;
  const lastBidder = teams.find((t) => t.id === lastBidderId) || null;

  const availablePlayers = players.filter((p) => p.status === 'available');
  const unsoldPlayers = players.filter((p) => p.status === 'unsold');

  // Push new Live Log
  const addLog = useCallback(
    (
      message: string,
      type: LiveActivityLog['type'] = 'info',
      teamCode?: string,
      teamColor?: string
    ) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newLog: LiveActivityLog = {
        id: `log_${Date.now()}_${Math.random()}`,
        message,
        type,
        teamCode,
        teamColor,
        timestamp: timeStr
      };
      setLiveLogs((prev) => [newLog, ...prev.slice(0, 45)]);
    },
    []
  );

  // Helper to bring next player to auction stage
  const loadNextPlayerToStage = useCallback(
    (forcePlayerId?: string) => {
      let nextPlayer: Player | undefined;

      if (forcePlayerId) {
        nextPlayer = players.find((p) => p.id === forcePlayerId);
      } else if (unsoldRoundActive) {
        nextPlayer = players.find((p) => p.status === 'unsold');
      } else {
        nextPlayer = players.find((p) => p.status === 'available');
      }

      if (!nextPlayer) {
        if (unsoldPlayers.length > 0 && !unsoldRoundActive) {
          addLog('Main player pool concluded! Accelerated Unsold Round available.', 'start');
          setAuctionStatus('idle');
          setIsTimerActive(false);
          return;
        }
        setAuctionStatus('complete');
        setIsTimerActive(false);
        setIsResultsOpen(true);
        addLog('AUCTION HAS CONCLUDED! Generating complete championship summary.', 'start');
        return;
      }

      setCurrentPlayerId(nextPlayer.id);
      setCurrentBid(0);
      setHighestBidderId(null);
      setLastBidAmount(0);
      setLastBidderId(null);
      setTimerSeconds(settings.bidTimerDuration);
      setIsTimerActive(true);
      setIsPaused(false);
      setAuctionStatus('bidding');

      addLog(
        `LOT #${nextPlayer.id.replace('ply_', '')}: ${nextPlayer.name} (${nextPlayer.role}) base price ₹${nextPlayer.basePrice.toLocaleString()}`,
        'start'
      );
    },
    [players, unsoldRoundActive, unsoldPlayers.length, settings.bidTimerDuration, addLog]
  );

  // Start Auction
  const handleStartAuction = () => {
    setActiveTab('auction');
    if (!currentPlayerId || auctionStatus === 'idle' || auctionStatus === 'complete') {
      loadNextPlayerToStage();
    } else {
      setIsTimerActive(true);
      setIsPaused(false);
      setAuctionStatus('bidding');
    }
  };

  // Pause / Resume
  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false);
      setIsTimerActive(true);
      setAuctionStatus('bidding');
      addLog('Auction resumed by auctioneer.', 'info');
    } else {
      setIsPaused(true);
      setIsTimerActive(false);
      setAuctionStatus('paused');
      addLog('Auction paused by auctioneer.', 'info');
    }
  };

  // Sell Player (Declare Highest Bidder as Winner)
  const handleSellPlayer = useCallback(() => {
    if (!currentPlayer || !highestBidder || currentBid <= 0) return;

    soundManager.playSoldGavel();

    const winningPrice = currentBid;
    const winnerId = highestBidder.id;

    // Update Player
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === currentPlayer.id
          ? {
              ...p,
              status: 'sold',
              soldPrice: winningPrice,
              soldTo: winnerId
            }
          : p
      )
    );

    // Update Winning Team Purse & Squad
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === winnerId) {
          const newOverseas = currentPlayer.isOverseas ? t.overseasPlayers + 1 : t.overseasPlayers;
          return {
            ...t,
            purse: Math.max(0, t.purse - winningPrice),
            players: [...t.players, currentPlayer.id],
            overseasPlayers: newOverseas
          };
        }
        return t;
      })
    );

    // Record into History
    const historyItem: AuctionHistoryItem = {
      id: `hist_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'sold',
      player: { ...currentPlayer, status: 'sold', soldPrice: winningPrice, soldTo: winnerId },
      winningTeam: highestBidder,
      finalPrice: winningPrice,
      bids: []
    };
    setHistory((prev) => [historyItem, ...prev]);

    addLog(
      `SOLD! ${currentPlayer.name} acquired by ${highestBidder.name} for ₹${winningPrice.toLocaleString()}`,
      'sold',
      highestBidder.shortCode
    );

    setAuctionStatus('sold');
    setIsTimerActive(false);

    // Show celebratory modal
    setSoldModalData({
      player: currentPlayer,
      winningTeam: highestBidder,
      soldPrice: winningPrice
    });
    setIsSoldModalOpen(true);

    // Persist sale to Firestore and Backend
    const soldPlayerObj: Player = {
      ...currentPlayer,
      status: 'sold',
      soldPrice: winningPrice,
      soldTo: winnerId
    };
    const activeKey = isAdminLoggedIn ? 'Priyam01032008@' : ownerAuthToken || 'Priyam01032008@';
    const newPurse = Math.max(0, highestBidder.purse - winningPrice);
    const newOverseas = currentPlayer.isOverseas
      ? highestBidder.overseasPlayers + 1
      : highestBidder.overseasPlayers;

    updatePlayerAuctionInFirestore(soldPlayerObj, activeKey).catch(() => {});
    updateTeamPurseInFirestore(winnerId, newPurse, newOverseas, activeKey).catch(() => {});
  }, [currentPlayer, highestBidder, currentBid, isAdminLoggedIn, ownerAuthToken, addLog]);

  // Mark Player as Unsold
  const handleMarkUnsold = useCallback(() => {
    if (!currentPlayer) return;

    soundManager.playUnsoldBuzzer();

    // Update Player Status
    const unsoldPlayerObj: Player = { ...currentPlayer, status: 'unsold' };
    setPlayers((prev) =>
      prev.map((p) => (p.id === currentPlayer.id ? unsoldPlayerObj : p))
    );

    // Record into History
    const historyItem: AuctionHistoryItem = {
      id: `hist_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'unsold',
      player: unsoldPlayerObj,
      bids: []
    };
    setHistory((prev) => [historyItem, ...prev]);

    addLog(`UNSOLD! ${currentPlayer.name} received no bids. Added to Unsold Registry.`, 'unsold');

    setAuctionStatus('unsold');
    setIsTimerActive(false);

    const activeKey = isAdminLoggedIn ? 'Priyam01032008@' : ownerAuthToken || 'Priyam01032008@';
    updatePlayerAuctionInFirestore(unsoldPlayerObj, activeKey).catch(() => {});
  }, [currentPlayer, isAdminLoggedIn, ownerAuthToken, addLog]);

  // Place Bid (Human or AI)
  const handlePlaceBid = useCallback(
    (teamId: string, amount: number): { success: boolean; error?: string } => {
      const biddingTeam = teams.find((t) => t.id === teamId);
      if (!biddingTeam || !currentPlayer) {
        return { success: false, error: 'Invalid team or player' };
      }

      // 1. Squad limit check
      if (biddingTeam.players.length >= biddingTeam.maxSquadSize) {
        return { success: false, error: 'Squad limit reached' };
      }

      // 2. Overseas limit check
      if (currentPlayer.isOverseas && biddingTeam.overseasPlayers >= biddingTeam.maxOverseasPlayers) {
        return { success: false, error: 'Overseas player limit reached' };
      }

      // 3. Sufficient purse check
      if (biddingTeam.purse < amount) {
        return { success: false, error: 'Insufficient purse balance' };
      }

      // 4. Must be higher than current bid
      const minRequired = currentBid === 0 ? currentPlayer.basePrice : currentBid + 100;
      if (amount < minRequired) {
        return { success: false, error: `Minimum bid is ₹${minRequired.toLocaleString()}` };
      }

      // Record Bid
      setLastBidAmount(currentBid > 0 ? currentBid : currentPlayer.basePrice);
      setLastBidderId(highestBidderId);
      setCurrentBid(amount);
      setHighestBidderId(teamId);

      // Reset Timer back to full
      setTimerSeconds(settings.bidTimerDuration);
      setIsTimerActive(true);
      setAuctionStatus('bidding');

      // Audio feedback
      if (amount >= (currentPlayer.basePrice * 2)) {
        soundManager.playNewHighestBid();
      } else {
        soundManager.playBidPlaced();
      }

      // Sync authenticated owner bid to backend
      const ownerCode = unlockedTeams[teamId] || ownerAuthToken || '';
      if (ownerCode) {
        dbApi.placeOwnerBid(teamId, ownerCode, currentPlayer.id, amount);
      }

      addLog(
        `NEW BID: ₹${amount.toLocaleString()} by ${biddingTeam.shortCode} (Owner Verified)`,
        'bid',
        biddingTeam.shortCode
      );

      return { success: true };
    },
    [teams, currentPlayer, currentBid, highestBidderId, settings.bidTimerDuration, unlockedTeams, ownerAuthToken, addLog]
  );

  // Manual Hammer & Owner Hidden Code Mode:
  // Automatic countdown timer and unsolicited AI bids are disabled so each team owner logs in with their hidden code (RCD367@, DSK387@, DKR358@, DRR360@) to place bids and manually hammer the lot.

  // Reset Auction to Fresh Initial State
  const handleResetAuction = () => {
    const freshTeams = getInitializedTeams();
    const freshPlayers = INITIAL_PLAYERS;
    setTeams(freshTeams);
    setPlayers(freshPlayers);
    setHistory([]);
    setCurrentPlayerId(null);
    setCurrentBid(0);
    setHighestBidderId(null);
    setLastBidAmount(0);
    setLastBidderId(null);
    setTimerSeconds(settings.bidTimerDuration);
    setIsTimerActive(false);
    setIsPaused(false);
    setAuctionStatus('idle');
    setLiveLogs([]);
    setUnsoldRoundActive(false);

    try {
      localStorage.removeItem(STORAGE_KEY_TEAMS);
      localStorage.removeItem(STORAGE_KEY_PLAYERS);
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch {
      // ignore
    }

    addLog('Simulation reset to initial state by auctioneer.', 'info');
  };

  // Start Unsold Round
  const handleStartUnsoldRound = () => {
    setUnsoldRoundActive(true);
    addLog('Accelerated Unsold Players Round initiated!', 'start');
    loadNextPlayerToStage();
  };

  // Owner Authentication verification (Master Email/Pass)
  const handleOwnerLogin = (emailInput: string, passInput: string): boolean => {
    const cleanEmail = emailInput.trim().toLowerCase();
    if (
      (cleanEmail === 'priyam1.3.2008@gmail.com' || cleanEmail === 'roypriyam950@gmail.com') &&
      passInput.trim() === 'Priyam01032008@'
    ) {
      setIsAdminLoggedIn(true);
      setOwnerAuthToken('Priyam01032008@');
      const allMap: Record<string, string> = {};
      teams.forEach((t) => {
        allMap[t.id] = 'Priyam01032008@';
      });
      setUnlockedTeams(allMap);
      return true;
    }
    return false;
  };

  // Franchise Owner Hidden Code Login (RCD367@, DSK387@, DKR358@, DRR360@)
  const handleOwnerCodeLogin = useCallback(
    async (
      code: string,
      teamId?: string
    ): Promise<{ success: boolean; teamId?: string | null; role?: string; error?: string }> => {
      const res = await dbApi.verifyOwnerCode(code, teamId);
      if (res.success) {
        if (res.role === 'master_owner' && teamId) {
          // Even if master code is used with a specific team selected, lock that single chosen team and go to home page
          const matchedTeam = teams.find((t) => t.id === teamId);
          setUnlockedTeams({ [teamId]: res.authCode || code.trim() });
          setMyTeamId(teamId);
          setOwnerAuthToken(res.authCode || code.trim());
          setIsAdminLoggedIn(false);
          setIsAdminOpen(false);
          setActiveTab('auction');
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 50);
          addLog(
            `Franchise locked for ${matchedTeam?.name || teamId} (${matchedTeam?.shortCode || ''}).`,
            'info',
            matchedTeam?.shortCode
          );
          return { success: true, teamId, role: 'team_owner' };
        }

        if (res.teamId) {
          const matchedTeam = teams.find((t) => t.id === res.teamId);
          // Lock ONLY this single franchise for the owner
          setUnlockedTeams({
            [res.teamId]: res.authCode || code.trim()
          });
          setMyTeamId(res.teamId);
          setOwnerAuthToken(res.authCode || code.trim());
          setIsAdminLoggedIn(false);
          setIsAdminOpen(false);
          setActiveTab('auction');
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 50);
          addLog(
            `Franchise Owner logged in and locked ${matchedTeam?.name || res.teamId} (${matchedTeam?.shortCode || ''}).`,
            'info',
            matchedTeam?.shortCode
          );
          return { success: true, teamId: res.teamId, role: 'team_owner' };
        }
      }
      return {
        success: false,
        error: res.error || 'Invalid hidden owner code. Access denied.'
      };
    },
    [teams, addLog]
  );

  // Master Owner player & image modifications (Immediately persisted to Firebase Firestore & shared backend for all website users)
  const handleAddPlayer = async (newPlayerData: Omit<Player, 'id' | 'status'>) => {
    lastLocalMutationTime.current = Date.now();
    let finalPhoto = newPlayerData.photo;
    if (finalPhoto && finalPhoto.startsWith('data:image/')) {
      finalPhoto = await compressImageToDataUrl(finalPhoto);
    }
    const newPlayer: Player = {
      ...newPlayerData,
      photo: finalPhoto,
      id: `ply_${Date.now()}`,
      status: 'available'
    };
    setPlayers((prev) => [newPlayer, ...prev]);

    try {
      const savedCloudPlayer = await savePlayerToFirestore(newPlayer, 'Priyam01032008@');
      setPlayers((prev) =>
        prev.map((p) => (p.id === newPlayer.id ? savedCloudPlayer : p))
      );
    } catch (err) {
      console.error('Failed to save new player to Firestore:', err);
    }

    await dbApi.addPlayer(newPlayer, 'Priyam01032008@');
    addLog(`Master Owner uploaded player "${newPlayer.name}" to shared Firebase database.`, 'info');
  };

  const handleUpdatePlayer = async (id: string, updated: Partial<Player>) => {
    lastLocalMutationTime.current = Date.now();
    let processedPhoto = updated.photo;
    if (processedPhoto && processedPhoto.startsWith('data:image/')) {
      processedPhoto = await compressImageToDataUrl(processedPhoto);
    }
    const cleanUpdated: Partial<Player> =
      processedPhoto !== undefined ? { ...updated, photo: processedPhoto } : updated;

    const existingPlayer = players.find((p) => p.id === id);
    const mergedPlayer: Player | null = existingPlayer
      ? { ...existingPlayer, ...cleanUpdated, id }
      : null;

    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...cleanUpdated } : p)));

    if (mergedPlayer) {
      try {
        const savedCloudPlayer = await savePlayerToFirestore(mergedPlayer, 'Priyam01032008@');
        setPlayers((prev) =>
          prev.map((p) => (p.id === id ? savedCloudPlayer : p))
        );
      } catch (err) {
        console.error('Failed to update player in Firestore:', err);
      }
    }

    await dbApi.updatePlayer(id, cleanUpdated, 'Priyam01032008@');
  };

  const handleDeletePlayer = async (id: string) => {
    lastLocalMutationTime.current = Date.now();
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        players: t.players.filter((pId) => pId !== id),
        retainedPlayers: t.retainedPlayers.filter((pId) => pId !== id)
      }))
    );
    if (currentPlayerId === id) {
      setCurrentPlayerId(null);
      setCurrentBid(0);
      setHighestBidderId(null);
      setAuctionStatus('idle');
    }
    try {
      await deletePlayerFromFirestore(id);
    } catch (err) {
      console.error('Failed to delete player from Firestore:', err);
    }
    await dbApi.deletePlayer(id, 'Priyam01032008@');
    addLog(`Player removed from tournament roster by Master Owner.`, 'info');
  };

  const handleAddTeam = async (teamData: Partial<Team> & { name: string; shortCode: string; primaryColor: string; secondaryColor: string; motto: string }) => {
    lastLocalMutationTime.current = Date.now();
    let finalLogo = teamData.logoUrl;
    if (finalLogo && finalLogo.startsWith('data:image/')) {
      finalLogo = await compressImageToDataUrl(finalLogo);
    }
    const newTeam: Team = {
      id: `team_${Date.now()}`,
      purse: 60000,
      initialPurse: 60000,
      players: [],
      retainedPlayers: [],
      overseasPlayers: 0,
      maxSquadSize: 18,
      maxOverseasPlayers: 6,
      accentColor: '#D4AF37',
      logoSymbol: '⚔',
      aiAggression: 'balanced',
      preferredRoles: ['Batter', 'Fast Bowler'],
      ...teamData,
      logoUrl: finalLogo
    };
    setTeams((prev) => [...prev, newTeam]);
    try {
      await saveTeamToFirestore(newTeam, 'Priyam01032008@');
    } catch (err) {
      console.error('Failed to add team to Firestore:', err);
    }
    await dbApi.addTeam(newTeam, 'Priyam01032008@');
  };

  const handleDeleteTeam = async (teamId: string) => {
    lastLocalMutationTime.current = Date.now();
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
    setPlayers((prev) =>
      prev.map((p) =>
        p.soldTo === teamId
          ? { ...p, status: 'available', soldTo: undefined, soldPrice: undefined }
          : p
      )
    );
    if (myTeamId === teamId) {
      setMyTeamId(null);
    }
    if (highestBidderId === teamId) {
      setHighestBidderId(null);
    }
    try {
      await deleteTeamFromFirestore(teamId);
    } catch (err) {
      console.error('Failed to delete team from Firestore:', err);
    }
    await dbApi.deleteTeam(teamId, 'Priyam01032008@');
    addLog(`Franchise removed from tournament roster by Master Owner.`, 'info');
  };

  const handleUpdateTeamPurse = async (teamId: string, newPurse: number) => {
    lastLocalMutationTime.current = Date.now();
    const existingTeam = teams.find((t) => t.id === teamId);
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, purse: newPurse } : t)));
    if (existingTeam) {
      try {
        await saveTeamToFirestore({ ...existingTeam, purse: newPurse }, 'Priyam01032008@');
      } catch {
        // Ignore
      }
    }
    await dbApi.updateTeam(teamId, { purse: newPurse }, 'Priyam01032008@');
  };

  const handleUpdateTeam = async (teamId: string, updated: Partial<Team>) => {
    lastLocalMutationTime.current = Date.now();
    let finalLogo = updated.logoUrl;
    if (finalLogo && finalLogo.startsWith('data:image/')) {
      finalLogo = await compressImageToDataUrl(finalLogo);
    }
    const cleanUpdated: Partial<Team> =
      finalLogo !== undefined ? { ...updated, logoUrl: finalLogo } : updated;
    const existingTeam = teams.find((t) => t.id === teamId);
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, ...cleanUpdated } : t)));
    if (existingTeam) {
      try {
        await saveTeamToFirestore({ ...existingTeam, ...cleanUpdated, id: teamId }, 'Priyam01032008@');
      } catch (err) {
        console.error('Failed to update team in Firestore:', err);
      }
    }
    await dbApi.updateTeam(teamId, cleanUpdated, 'Priyam01032008@');
  };

  const handleForceSellPlayer = (playerId: string, teamId: string, price: number) => {
    const targetPlayer = players.find((p) => p.id === playerId);
    const targetTeam = teams.find((t) => t.id === teamId);
    if (!targetPlayer || !targetTeam) return;

    // Deduct purse and assign player
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            purse: Math.max(0, t.purse - price),
            players: [...t.players, playerId],
            overseasPlayers: targetPlayer.isOverseas ? t.overseasPlayers + 1 : t.overseasPlayers
          };
        }
        return t;
      })
    );

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId ? { ...p, status: 'sold', soldPrice: price, soldTo: teamId } : p
      )
    );

    const histItem: AuctionHistoryItem = {
      id: `hist_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'sold',
      player: targetPlayer,
      winningTeam: targetTeam,
      finalPrice: price,
      bids: [
        {
          id: `bid_${Date.now()}`,
          playerId,
          playerName: targetPlayer.name,
          amount: price,
          bidderTeamId: teamId,
          bidderTeamName: targetTeam.name,
          bidderTeamCode: targetTeam.shortCode,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAi: false
        }
      ]
    };
    setHistory((prev) => [histItem, ...prev]);

    addLog(
      `Owner manual sell: ${targetPlayer.name} sold to ${targetTeam.shortCode} for ${settings.currency}${price.toLocaleString()}`,
      'sold',
      targetTeam.shortCode,
      targetTeam.primaryColor
    );
  };

  // Cancel Bid, Refund Team Treasury, and Re-enter Player
  const handleCancelBidAndRefund = useCallback(
    (playerId: string, sendToStage: boolean = false) => {
      const targetPlayer = players.find((p) => p.id === playerId);
      if (!targetPlayer) return;

      const histEntry = history.find((h) => h.player.id === playerId && h.type === 'sold');
      const refundTeamId = targetPlayer.soldTo || histEntry?.winningTeam?.id;
      const refundAmount = targetPlayer.soldPrice || histEntry?.finalPrice || 0;

      // Refund treasury & remove player from team roster
      if (refundTeamId) {
        setTeams((prev) =>
          prev.map((t) => {
            if (t.id === refundTeamId) {
              const updatedPlayers = t.players.filter((id) => id !== playerId);
              const updatedRetained = (t.retainedPlayers || []).filter((id) => id !== playerId);
              const isOverseas = targetPlayer.isOverseas;
              return {
                ...t,
                purse: Math.min(t.initialPurse || 60000, t.purse + refundAmount),
                players: updatedPlayers,
                retainedPlayers: updatedRetained,
                overseasPlayers: isOverseas ? Math.max(0, t.overseasPlayers - 1) : t.overseasPlayers
              };
            }
            return t;
          })
        );
      }

      // Reset player status to available
      const resetPlayer: Player = {
        ...targetPlayer,
        status: 'available',
        soldPrice: undefined,
        soldTo: undefined
      };

      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? resetPlayer : p))
      );

      // Remove from history
      setHistory((prev) => prev.filter((h) => h.player.id !== playerId));

      // Close sold modal if open
      setIsSoldModalOpen(false);

      // Sync Owner-only Refund & Re-auction with Firebase Firestore & Backend Server
      const activeKey = isAdminLoggedIn ? 'Priyam01032008@' : ownerAuthToken || 'Priyam01032008@';
      updatePlayerAuctionInFirestore(resetPlayer, activeKey).catch(() => {});
      if (refundTeamId) {
        const rTeam = teams.find((t) => t.id === refundTeamId);
        if (rTeam) {
          const restoredPurse = Math.min(rTeam.initialPurse || 60000, rTeam.purse + refundAmount);
          const restoredOverseas = targetPlayer.isOverseas
            ? Math.max(0, rTeam.overseasPlayers - 1)
            : rTeam.overseasPlayers;
          updateTeamPurseInFirestore(refundTeamId, restoredPurse, restoredOverseas, activeKey).catch(() => {});
        }
      }
      dbApi.refundPlayerSale(playerId, ownerAuthToken || 'MASTER_OWNER_AUTH');

      const refundTeam = teams.find((t) => t.id === refundTeamId);
      addLog(
        `Backend Owner Refund: Bid cancelled on ${targetPlayer.name}. ${settings.currency}${refundAmount.toLocaleString()} refunded to ${refundTeam?.shortCode || 'team'}. Player re-entered auction pool.`,
        'info',
        refundTeam?.shortCode,
        refundTeam?.primaryColor
      );

      // If requested to send directly to stage
      if (sendToStage) {
        setCurrentPlayerId(playerId);
        setCurrentBid(0);
        setHighestBidderId(null);
        setLastBidAmount(0);
        setLastBidderId(null);
        setAuctionStatus('bidding');
        setIsTimerActive(false);
        setIsPaused(false);
        setIsAdminOpen(false);
        document.getElementById('section-stage')?.scrollIntoView({ behavior: 'smooth' });
        addLog(`Lot ${targetPlayer.name} placed back onto the stage of honor for re-auction.`, 'info');
      } else if (currentPlayerId === playerId) {
        // Current player was cancelled on stage
        setCurrentBid(0);
        setHighestBidderId(null);
        setLastBidAmount(0);
        setLastBidderId(null);
        setAuctionStatus('idle');
        setIsTimerActive(false);
        setIsPaused(false);
      }
    },
    [players, teams, history, settings.currency, currentPlayerId, ownerAuthToken, addLog]
  );

  // Re-enter Unsold Player (Backend Owner Only)
  const handleReenterAuction = useCallback(
    (playerId: string, sendToStage: boolean = false) => {
      const targetPlayer = players.find((p) => p.id === playerId);
      if (!targetPlayer) return;

      const resetPlayer: Player = {
        ...targetPlayer,
        status: 'available',
        soldPrice: undefined,
        soldTo: undefined
      };

      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? resetPlayer : p))
      );

      // Remove unsold from history
      setHistory((prev) => prev.filter((h) => h.player.id !== playerId));

      // Sync Owner-only Re-auction with Firebase Firestore & Backend Server
      const activeKey = isAdminLoggedIn ? 'Priyam01032008@' : ownerAuthToken || 'Priyam01032008@';
      updatePlayerAuctionInFirestore(resetPlayer, activeKey).catch(() => {});
      dbApi.reauctionPlayer(playerId, ownerAuthToken || 'MASTER_OWNER_AUTH');

      addLog(`Backend Owner Re-Auction: ${targetPlayer.name} recalled and re-entered into auction pool.`, 'info');

      if (sendToStage) {
        setCurrentPlayerId(playerId);
        setCurrentBid(0);
        setHighestBidderId(null);
        setLastBidAmount(0);
        setLastBidderId(null);
        setAuctionStatus('bidding');
        setIsTimerActive(false);
        setIsPaused(false);
        setIsAdminOpen(false);
        document.getElementById('section-stage')?.scrollIntoView({ behavior: 'smooth' });
        addLog(`Lot ${targetPlayer.name} placed back onto the stage of honor for re-auction.`, 'info');
      } else if (currentPlayerId === playerId) {
        setCurrentBid(0);
        setHighestBidderId(null);
        setLastBidAmount(0);
        setLastBidderId(null);
        setAuctionStatus('idle');
        setIsTimerActive(false);
        setIsPaused(false);
      }
    },
    [players, currentPlayerId, ownerAuthToken, addLog]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF9] text-[#0F172A] font-body selection:bg-[#D4AF37] selection:text-[#0F172A] storybook-page relative">
      {/* Storybook ambient parchment glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 right-1/4 w-[700px] h-[700px] bg-[#1E1E38]/5 rounded-full blur-[160px]" />
      </div>

      {/* Broadcast Header Bar with Single Long Page Chapter Links */}
      <Header
        activeTab={activeTab === 'owner_board' ? 'auction' : activeTab}
        setActiveTab={(t) => {
          if (t === 'owner_board') {
            setIsAdminOpen(true);
          } else {
            setActiveTab(t);
          }
        }}
        myTeam={myTeam}
        currentPlayer={currentPlayer}
        currentBid={currentBid}
        highestBidder={highestBidder}
        timerSeconds={timerSeconds}
        isAuctionActive={auctionStatus === 'bidding'}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenTeamLogin={() => setIsTeamLoginOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        currency={settings.currency}
        onNavigateSection={(sectionId) => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* ONE LONG PAGE: Grand Storybook Chapters */}
      <main className="flex-1 flex flex-col relative z-10 space-y-16 pb-16">
        {/* Frontispiece & Prologue Hero */}
        <section id="section-hero">
          <LandingPage
            onStartAuction={handleStartAuction}
            setActiveTab={setActiveTab}
            teams={teams}
            players={players}
            currency={settings.currency}
            onScrollToChapter={(id) => {
              document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </section>

        {/* Chapter I: The Grand Auction Stage */}
        <section id="section-stage" className="w-full max-w-7xl mx-auto px-4 sm:px-8 scroll-mt-24">
          <AuctionRoom
            currentPlayer={currentPlayer}
            currentBid={currentBid}
            highestBidder={highestBidder}
            lastBidAmount={lastBidAmount}
            lastBidder={lastBidder}
            timerSeconds={timerSeconds}
            isTimerActive={isTimerActive}
            isPaused={isPaused}
            auctionStatus={auctionStatus}
            myTeam={myTeam}
            teams={teams}
            liveLogs={liveLogs}
            onPlaceBid={handlePlaceBid}
            onStartAuction={handleStartAuction}
            onPauseResume={handlePauseResume}
            onNextPlayer={() => loadNextPlayerToStage()}
            onSellNow={handleSellPlayer}
            onMarkUnsold={handleMarkUnsold}
            onResetAuction={handleResetAuction}
            onStartUnsoldRound={handleStartUnsoldRound}
            unsoldRoundActive={unsoldRoundActive}
            unsoldPlayersCount={unsoldPlayers.length}
            availablePlayersCount={availablePlayers.length}
            history={history}
            currency={settings.currency}
            totalDuration={settings.bidTimerDuration}
            unlockedTeamIds={Object.keys(unlockedTeams)}
            onOwnerCodeLogin={handleOwnerCodeLogin}
            onOpenTeamLogin={() => setIsTeamLoginOpen(true)}
            onOpenBackendOwnerBoard={() => setIsAdminOpen(true)}
          />
        </section>

        {/* Chapter II: The Franchises & Squads */}
        <section id="section-squads" className="w-full max-w-7xl mx-auto px-4 sm:px-8 scroll-mt-24 border-t-2 border-[#D4AF37]/30 pt-12 space-y-12">
          <SquadManagement
            teams={teams}
            allPlayers={players}
            myTeam={myTeam}
            currency={settings.currency}
          />

          {/* Franchise Claim Desk */}
          <div className="pt-4 border-t border-[#D4AF37]/25">
            <TeamSelection
              teams={teams}
              myTeam={myTeam}
              onSelectTeam={(teamId) => setMyTeamId(teamId)}
              onProceedToAuction={() => {
                document.getElementById('section-stage')?.scrollIntoView({ behavior: 'smooth' });
                if (auctionStatus === 'idle') handleStartAuction();
              }}
              allPlayers={players}
              currency={settings.currency}
              unlockedTeamIds={Object.keys(unlockedTeams)}
              onOwnerCodeLogin={handleOwnerCodeLogin}
            />
          </div>
        </section>

        {/* Chapter III: The Player Registry */}
        <section id="section-players" className="w-full max-w-7xl mx-auto px-4 sm:px-8 scroll-mt-24 border-t-2 border-[#D4AF37]/30 pt-12">
          <PlayerDatabase
            players={players}
            teams={teams}
            onSetCurrentPlayer={(p) => {
              loadNextPlayerToStage(p.id);
              document.getElementById('section-stage')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onOpenOwnerBoard={() => setIsAdminOpen(true)}
            isAdminLoggedIn={isAdminLoggedIn}
            currency={settings.currency}
          />
        </section>

        {/* Chapter IV: The Chronicle of Bids */}
        <section id="section-history" className="w-full max-w-7xl mx-auto px-4 sm:px-8 scroll-mt-24 border-t-2 border-[#D4AF37]/30 pt-12">
          <AuctionHistory
            history={history}
            teams={teams}
            currency={settings.currency}
          />
        </section>

        {/* Chapter V: The Championship Leaderboard */}
        <section id="section-leaderboard" className="w-full max-w-7xl mx-auto px-4 sm:px-8 scroll-mt-24 border-t-2 border-[#D4AF37]/30 pt-12">
          <Leaderboard
            teams={teams}
            allPlayers={players}
            myTeam={myTeam}
            currency={settings.currency}
          />
        </section>

        {/* Chapter VI: The Laws & Regulations */}
        <section id="section-rules" className="w-full max-w-7xl mx-auto px-4 sm:px-8 scroll-mt-24 border-t-2 border-[#D4AF37]/30 pt-12">
          <RulesPage
            initialPurse={60000}
            maxSquadSize={18}
            maxOverseasPlayers={6}
            currency={settings.currency}
            bidTimerDuration={settings.bidTimerDuration}
          />
        </section>
      </main>

      {/* Modals */}
      <SoldModal
        isOpen={isSoldModalOpen}
        onClose={() => setIsSoldModalOpen(false)}
        player={soldModalData.player}
        winningTeam={soldModalData.winningTeam}
        soldPrice={soldModalData.soldPrice}
        onNextPlayer={() => loadNextPlayerToStage()}
        currency={settings.currency}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newOpts) => setSettings((s) => ({ ...s, ...newOpts }))}
        onResetDefaults={() => setSettings(INITIAL_SETTINGS)}
      />

      <FranchiseLoginModal
        isOpen={isTeamLoginOpen}
        onClose={() => setIsTeamLoginOpen(false)}
        teams={teams}
        loggedInOwnerTeam={myTeam}
        onOwnerCodeLogin={handleOwnerCodeLogin}
        onLogoutTeam={() => {
          setMyTeamId(null);
          setUnlockedTeams({});
        }}
        currency={settings.currency}
      />

      <OwnerBoard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        isAdminLoggedIn={isAdminLoggedIn}
        onLogin={handleOwnerLogin}
        onLogout={() => {
          setIsAdminLoggedIn(false);
          setOwnerAuthToken(null);
        }}
        players={players}
        teams={teams}
        onAddPlayer={handleAddPlayer}
        onUpdatePlayer={handleUpdatePlayer}
        onDeletePlayer={handleDeletePlayer}
        onAddTeam={handleAddTeam}
        onDeleteTeam={handleDeleteTeam}
        onUpdateTeam={handleUpdateTeam}
        onUpdateTeamPurse={handleUpdateTeamPurse}
        onResetAuction={handleResetAuction}
        onCancelSale={handleCancelBidAndRefund}
        onReenterAuction={handleReenterAuction}
        onForceStagePlayer={(id) => {
          loadNextPlayerToStage(id);
          setActiveTab('auction');
          setIsAdminOpen(false);
        }}
        onForceSellPlayer={handleForceSellPlayer}
        currentPlayer={currentPlayer}
        currentBid={currentBid}
        highestBidder={highestBidder}
        loggedInOwnerTeam={myTeam}
        onOwnerCodeLogin={handleOwnerCodeLogin}
        onPlaceBid={handlePlaceBid}
        onSellNow={handleSellPlayer}
        onMarkUnsold={handleMarkUnsold}
        onNextPlayer={() => loadNextPlayerToStage()}
        currency={settings.currency}
        onSyncAll={syncToBackend}
      />

      <AuctionResults
        isOpen={isResultsOpen}
        onClose={() => setIsResultsOpen(false)}
        myTeam={myTeam}
        teams={teams}
        allPlayers={players}
        history={history}
        onResetAuction={handleResetAuction}
        currency={settings.currency}
      />

      {/* Fan-made Disclaimer Footer */}
      <DisclaimerFooter />
    </div>
  );
}
