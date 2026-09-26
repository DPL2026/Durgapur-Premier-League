import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Team,
  Player,
  ViewTab,
  AuctionSettings,
  AuctionHistoryItem,
  LiveActivityLog,
} from './types';
import {
  INITIAL_PLAYERS,
  getInitializedTeams,
  INITIAL_SETTINGS,
} from './data/initialData';
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
  compressImageToDataUrl,
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
  // ============================================================
  // NAVIGATION
  // ============================================================

  const [activeTab, setActiveTab] = useState<ViewTab>('landing');

  // ============================================================
  // LOCAL CACHE INITIAL STATE
  //
  // IMPORTANT:
  // localStorage is ONLY a temporary cache.
  // Firestore will replace these values after startup.
  // ============================================================

  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEAMS);

      if (saved) {
        const parsed: Team[] = JSON.parse(saved);

        return parsed.map((t) => ({
          ...t,
          initialPurse: 60000,
          purse:
            typeof t.purse === 'number' && t.purse <= 60000
              ? t.purse
              : 60000,
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

      if (!saved) {
        return INITIAL_PLAYERS;
      }

      const parsed: Player[] = JSON.parse(saved);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        return INITIAL_PLAYERS;
      }

      // IMPORTANT:
      // Do NOT restore/overwrite photos from INITIAL_PLAYERS here.
      // Firestore will be the final source of truth.
      return parsed;
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

  // ============================================================
  // ADMIN / OWNER LOGIN
  // ============================================================

  const [isAdminLoggedIn, setIsAdminLoggedIn] =
    useState<boolean>(false);

  const [unlockedTeams, setUnlockedTeams] =
    useState<Record<string, string>>({});

  const [ownerAuthToken, setOwnerAuthToken] =
    useState<string | null>(null);

  // ============================================================
  // MODALS
  // ============================================================

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isTeamLoginOpen, setIsTeamLoginOpen] = useState(false);
  const [isSoldModalOpen, setIsSoldModalOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);

  // ============================================================
  // LIVE AUCTION ENGINE
  // ============================================================

  const [auctionStatus, setAuctionStatus] = useState<
    'idle' | 'bidding' | 'paused' | 'sold' | 'unsold' | 'complete'
  >('idle');

  const [currentPlayerId, setCurrentPlayerId] =
    useState<string | null>(null);

  const [currentBid, setCurrentBid] = useState<number>(0);
  const [highestBidderId, setHighestBidderId] =
    useState<string | null>(null);

  const [lastBidAmount, setLastBidAmount] = useState<number>(0);
  const [lastBidderId, setLastBidderId] =
    useState<string | null>(null);

  const [timerSeconds, setTimerSeconds] =
    useState<number>(settings.bidTimerDuration);

  const [isTimerActive, setIsTimerActive] =
    useState<boolean>(false);

  const [isPaused, setIsPaused] = useState<boolean>(false);

  const [liveLogs, setLiveLogs] =
    useState<LiveActivityLog[]>([]);

  const [unsoldRoundActive, setUnsoldRoundActive] =
    useState<boolean>(false);

  // ============================================================
  // SOLD MODAL
  // ============================================================

  const [soldModalData, setSoldModalData] = useState<{
    player: Player | null;
    winningTeam: Team | null;
    soldPrice: number;
  }>({
    player: null,
    winningTeam: null,
    soldPrice: 0,
  });

  // ============================================================
  // SOUND
  // ============================================================

  useEffect(() => {
    soundManager.setMuted(!settings.soundEnabled);
  }, [settings.soundEnabled]);

  // ============================================================
  // REFS
  // ============================================================

  const hasLoadedFromBackend = useRef<boolean>(false);

  const lastLocalMutationTime = useRef<number>(0);

  const rawTeamDocsRef = useRef<Record<string, any>[]>([]);

  // ============================================================
  // FIRESTORE INITIALIZATION
  //
  // IMPORTANT:
  // Firestore is the source of truth.
  //
  // We intentionally DO NOT:
  // - load /api/database first
  // - rescue localStorage photos
  // - overwrite Firestore with localStorage photos
  // ============================================================

  useEffect(() => {
    let isMounted = true;

    async function initSharedCloudDatabase() {
      try {
        const cloudData = await fetchOrSeedFirestore(
          INITIAL_PLAYERS,
          getInitializedTeams()
        );

        if (!isMounted || !cloudData) {
          return;
        }

        // ======================================================
        // FIRESTORE = SOURCE OF TRUTH
        // ======================================================

        setPlayers(cloudData.players);

        if (cloudData.teams.length > 0) {
          setTeams(cloudData.teams);
        }
      } catch (error) {
        console.error(
          'Failed to load shared Firestore database:',
          error
        );
      }

      if (isMounted) {
        hasLoadedFromBackend.current = true;
      }
    }

    initSharedCloudDatabase();

    // ==========================================================
    // REAL-TIME PLAYER LISTENER
    //
    // Every device receives the latest Firestore player data.
    // ==========================================================

    let unsubPlayers: (() => void) | undefined;
    let unsubTeams: (() => void) | undefined;

    try {
      unsubPlayers = subscribeToPublicPlayers((cloudPlayers) => {
        if (!isMounted) return;

        // Firestore always wins.
        setPlayers(cloudPlayers);

        if (rawTeamDocsRef.current.length > 0) {
          setTeams(
            rawTeamDocsRef.current.map((td) =>
              firestoreDocToTeam(td, cloudPlayers)
            )
          );
        }
      });

      // ========================================================
      // REAL-TIME TEAM LISTENER
      // ========================================================

      unsubTeams = subscribeToPublicTeams((teamDocs) => {
        if (!isMounted) return;

        rawTeamDocsRef.current = teamDocs;

        setTeams((currentTeams) => {
          // If there are no current players yet, use current
          // players array safely.
          setTeams(
            teamDocs.map((td) =>
              firestoreDocToTeam(td, players)
            )
          );

          return currentTeams;
        });
      });
    } catch (err) {
      console.warn(
        'Firestore realtime subscription warning:',
        err
      );
    }

    return () => {
      isMounted = false;

      if (unsubPlayers) {
        unsubPlayers();
      }

      if (unsubTeams) {
        unsubTeams();
      }
    };
  }, []);

  // ============================================================
  // FULL OWNER SYNC
  // ============================================================

  const syncToBackend = useCallback(async () => {
    const activeAuth = isAdminLoggedIn
      ? 'Priyam01032008@'
      : ownerAuthToken;

    if (!activeAuth) return;

    lastLocalMutationTime.current = Date.now();

    try {
      if (
        isAdminLoggedIn ||
        activeAuth === 'Priyam01032008@'
      ) {
        for (const p of players) {
          await savePlayerToFirestore(
            p,
            'Priyam01032008@'
          );
        }

        for (const t of teams) {
          await saveTeamToFirestore(
            t,
            'Priyam01032008@'
          );
        }
      }

      // Keep existing backend sync functionality.
      // Firestore remains the primary database for the website.
      await dbApi.syncDatabase(
        {
          teams,
          players,
          history,
          settings,
        },
        activeAuth
      );
    } catch (error) {
      console.warn(
        'Backend sync failed. Firestore data remains available.',
        error
      );
    }
  }, [
    teams,
    players,
    history,
    settings,
    isAdminLoggedIn,
    ownerAuthToken,
  ]);

  // ============================================================
  // LOCAL CACHE
  //
  // localStorage receives the current Firestore state.
  // It NEVER gets pushed back to Firestore automatically.
  // ============================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_TEAMS,
        JSON.stringify(teams)
      );

      localStorage.setItem(
        STORAGE_KEY_PLAYERS,
        JSON.stringify(players)
      );

      localStorage.setItem(
        STORAGE_KEY_HISTORY,
        JSON.stringify(history)
      );

      localStorage.setItem(
        STORAGE_KEY_SETTINGS,
        JSON.stringify(settings)
      );

      if (myTeamId) {
        localStorage.setItem(
          STORAGE_KEY_MY_TEAM,
          myTeamId
        );
      }
    } catch {
      // Storage quota failsafe
    }
  }, [
    teams,
    players,
    history,
    settings,
    myTeamId,
  ]);

  // ============================================================
  // HELPER GETTERS
  // ============================================================

  const myTeam =
    teams.find((t) => t.id === myTeamId) || null;

  const currentPlayer =
    players.find((p) => p.id === currentPlayerId) ||
    null;

  const highestBidder =
    teams.find((t) => t.id === highestBidderId) ||
    null;

  const lastBidder =
    teams.find((t) => t.id === lastBidderId) ||
    null;

  const availablePlayers = players.filter(
    (p) => p.status === 'available'
  );

  const unsoldPlayers = players.filter(
    (p) => p.status === 'unsold'
  );

  // ============================================================
  // LIVE LOG
  // ============================================================

  const addLog = useCallback(
    (
      message: string,
      type: LiveActivityLog['type'] = 'info',
      teamCode?: string,
      teamColor?: string
    ) => {
      const now = new Date();

      const timeStr = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const newLog: LiveActivityLog = {
        id: `log_${Date.now()}_${Math.random()}`,
        message,
        type,
        teamCode,
        teamColor,
        timestamp: timeStr,
      };

      setLiveLogs((prev) => [
        newLog,
        ...prev.slice(0, 45),
      ]);
    },
    []
  );

  // ============================================================
  // LOAD NEXT PLAYER
  // ============================================================

  const loadNextPlayerToStage = useCallback(
    (forcePlayerId?: string) => {
      let nextPlayer: Player | undefined;

      if (forcePlayerId) {
        nextPlayer = players.find(
          (p) => p.id === forcePlayerId
        );
      } else if (unsoldRoundActive) {
        nextPlayer = players.find(
          (p) => p.status === 'unsold'
        );
      } else {
        nextPlayer = players.find(
          (p) => p.status === 'available'
        );
      }

      if (!nextPlayer) {
        if (
          unsoldPlayers.length > 0 &&
          !unsoldRoundActive
        ) {
          addLog(
            'Main player pool concluded! Accelerated Unsold Round available.',
            'start'
          );

          setAuctionStatus('idle');
          setIsTimerActive(false);

          return;
        }

        setAuctionStatus('complete');
        setIsTimerActive(false);
        setIsResultsOpen(true);

        addLog(
          'AUCTION HAS CONCLUDED! Generating complete championship summary.',
          'start'
        );

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
        `LOT #${nextPlayer.id.replace(
          'ply_',
          ''
        )}: ${nextPlayer.name} (${nextPlayer.role}) base price ₹${nextPlayer.basePrice.toLocaleString()}`,
        'start'
      );
    },
    [
      players,
      unsoldRoundActive,
      unsoldPlayers.length,
      settings.bidTimerDuration,
      addLog,
    ]
  );

  // ============================================================
  // START AUCTION
  // ============================================================

  const handleStartAuction = () => {
    setActiveTab('auction');

    if (
      !currentPlayerId ||
      auctionStatus === 'idle' ||
      auctionStatus === 'complete'
    ) {
      loadNextPlayerToStage();
    } else {
      setIsTimerActive(true);
      setIsPaused(false);
      setAuctionStatus('bidding');
    }
  };

  // ============================================================
  // PAUSE / RESUME
  // ============================================================

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false);
      setIsTimerActive(true);
      setAuctionStatus('bidding');

      addLog(
        'Auction resumed by auctioneer.',
        'info'
      );
    } else {
      setIsPaused(true);
      setIsTimerActive(false);
      setAuctionStatus('paused');

      addLog(
        'Auction paused by auctioneer.',
        'info'
      );
    }
  };

  // ============================================================
  // SELL PLAYER
  // ============================================================

  const handleSellPlayer = useCallback(() => {
    if (
      !currentPlayer ||
      !highestBidder ||
      currentBid <= 0
    ) {
      return;
    }

    soundManager.playSoldGavel();

    const winningPrice = currentBid;
    const winnerId = highestBidder.id;

    const soldPlayerObj: Player = {
      ...currentPlayer,
      status: 'sold',
      soldPrice: winningPrice,
      soldTo: winnerId,
    };

    // Update Player locally
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === currentPlayer.id
          ? soldPlayerObj
          : p
      )
    );

    // Update Winning Team
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === winnerId) {
          const newOverseas =
            currentPlayer.isOverseas
              ? t.overseasPlayers + 1
              : t.overseasPlayers;

          return {
            ...t,
            purse: Math.max(
              0,
              t.purse - winningPrice
            ),
            players: [
              ...t.players,
              currentPlayer.id,
            ],
            overseasPlayers: newOverseas,
          };
        }

        return t;
      })
    );

    const historyItem: AuctionHistoryItem = {
      id: `hist_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(
        [],
        {
          hour: '2-digit',
          minute: '2-digit',
        }
      ),
      type: 'sold',
      player: soldPlayerObj,
      winningTeam: highestBidder,
      finalPrice: winningPrice,
      bids: [],
    };

    setHistory((prev) => [
      historyItem,
      ...prev,
    ]);

    addLog(
      `SOLD! ${currentPlayer.name} acquired by ${highestBidder.name} for ₹${winningPrice.toLocaleString()}`,
      'sold',
      highestBidder.shortCode
    );

    setAuctionStatus('sold');
    setIsTimerActive(false);

    setSoldModalData({
      player: currentPlayer,
      winningTeam: highestBidder,
      soldPrice: winningPrice,
    });

    setIsSoldModalOpen(true);

    const activeKey = isAdminLoggedIn
      ? 'Priyam01032008@'
      : ownerAuthToken || 'Priyam01032008@';

    const newPurse = Math.max(
      0,
      highestBidder.purse - winningPrice
    );

    const newOverseas =
      currentPlayer.isOverseas
        ? highestBidder.overseasPlayers + 1
        : highestBidder.overseasPlayers;

    updatePlayerAuctionInFirestore(
      soldPlayerObj,
      activeKey
    ).catch(() => {});

    updateTeamPurseInFirestore(
      winnerId,
      newPurse,
      newOverseas,
      activeKey
    ).catch(() => {});
  }, [
    currentPlayer,
    highestBidder,
    currentBid,
    isAdminLoggedIn,
    ownerAuthToken,
    addLog,
  ]);

  // ============================================================
  // MARK UNSOLD
  // ============================================================

  const handleMarkUnsold = useCallback(() => {
    if (!currentPlayer) return;

    soundManager.playUnsoldBuzzer();

    const unsoldPlayerObj: Player = {
      ...currentPlayer,
      status: 'unsold',
    };

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === currentPlayer.id
          ? unsoldPlayerObj
          : p
      )
    );

    const historyItem: AuctionHistoryItem = {
      id: `hist_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(
        [],
        {
          hour: '2-digit',
          minute: '2-digit',
        }
      ),
      type: 'unsold',
      player: unsoldPlayerObj,
      bids: [],
    };

    setHistory((prev) => [
      historyItem,
      ...prev,
    ]);

    addLog(
      `UNSOLD! ${currentPlayer.name} received no bids. Added to Unsold Registry.`,
      'unsold'
    );

    setAuctionStatus('unsold');
    setIsTimerActive(false);

    const activeKey = isAdminLoggedIn
      ? 'Priyam01032008@'
      : ownerAuthToken || 'Priyam01032008@';

    updatePlayerAuctionInFirestore(
      unsoldPlayerObj,
      activeKey
    ).catch(() => {});
  }, [
    currentPlayer,
    isAdminLoggedIn,
    ownerAuthToken,
    addLog,
  ]);

  // ============================================================
  // PLACE BID
  // ============================================================

  const handlePlaceBid = useCallback(
    (
      teamId: string,
      amount: number
    ): {
      success: boolean;
      error?: string;
    } => {
      const biddingTeam = teams.find(
        (t) => t.id === teamId
      );

      if (!biddingTeam || !currentPlayer) {
        return {
          success: false,
          error: 'Invalid team or player',
        };
      }

      if (
        biddingTeam.players.length >=
        biddingTeam.maxSquadSize
      ) {
        return {
          success: false,
          error: 'Squad limit reached',
        };
      }

      if (
        currentPlayer.isOverseas &&
        biddingTeam.overseasPlayers >=
          biddingTeam.maxOverseasPlayers
      ) {
        return {
          success: false,
          error: 'Overseas player limit reached',
        };
      }

      if (biddingTeam.purse < amount) {
        return {
          success: false,
          error: 'Insufficient purse balance',
        };
      }

      const minRequired =
        currentBid === 0
          ? currentPlayer.basePrice
          : currentBid + 100;

      if (amount < minRequired) {
        return {
          success: false,
          error: `Minimum bid is ₹${minRequired.toLocaleString()}`,
        };
      }

      setLastBidAmount(
        currentBid > 0
          ? currentBid
          : currentPlayer.basePrice
      );

      setLastBidderId(highestBidderId);
      setCurrentBid(amount);
      setHighestBidderId(teamId);

      setTimerSeconds(settings.bidTimerDuration);
      setIsTimerActive(true);
      setAuctionStatus('bidding');

      if (
        amount >=
        currentPlayer.basePrice * 2
      ) {
        soundManager.playNewHighestBid();
      } else {
        soundManager.playBidPlaced();
      }

      const ownerCode =
        unlockedTeams[teamId] ||
        ownerAuthToken ||
        '';

      if (ownerCode) {
        dbApi.placeOwnerBid(
          teamId,
          ownerCode,
          currentPlayer.id,
          amount
        );
      }

      addLog(
        `NEW BID: ₹${amount.toLocaleString()} by ${biddingTeam.shortCode} (Owner Verified)`,
        'bid',
        biddingTeam.shortCode
      );

      return { success: true };
    },
    [
      teams,
      currentPlayer,
      currentBid,
      highestBidderId,
      settings.bidTimerDuration,
      unlockedTeams,
      ownerAuthToken,
      addLog,
    ]
  );

  // ============================================================
  // RESET AUCTION
  // ============================================================

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

    setTimerSeconds(
      settings.bidTimerDuration
    );

    setIsTimerActive(false);
    setIsPaused(false);
    setAuctionStatus('idle');
    setLiveLogs([]);
    setUnsoldRoundActive(false);

    try {
      localStorage.removeItem(
        STORAGE_KEY_TEAMS
      );

      localStorage.removeItem(
        STORAGE_KEY_PLAYERS
      );

      localStorage.removeItem(
        STORAGE_KEY_HISTORY
      );
    } catch {
      // ignore
    }

    addLog(
      'Simulation reset to initial state by auctioneer.',
      'info'
    );
  };

  // ============================================================
  // START UNSOLD ROUND
  // ============================================================

  const handleStartUnsoldRound = () => {
    setUnsoldRoundActive(true);

    addLog(
      'Accelerated Unsold Players Round initiated!',
      'start'
    );

    loadNextPlayerToStage();
  };

  // ============================================================
  // MASTER OWNER LOGIN
  // ============================================================

  const handleOwnerLogin = (
    emailInput: string,
    passInput: string
  ): boolean => {
    const cleanEmail =
      emailInput.trim().toLowerCase();

    if (
      (
        cleanEmail ===
          'priyam1.3.2008@gmail.com' ||
        cleanEmail ===
          'roypriyam950@gmail.com'
      ) &&
      passInput.trim() ===
        'Priyam01032008@'
    ) {
      setIsAdminLoggedIn(true);

      setOwnerAuthToken(
        'Priyam01032008@'
      );

      const allMap: Record<string, string> =
        {};

      teams.forEach((t) => {
        allMap[t.id] =
          'Priyam01032008@';
      });

      setUnlockedTeams(allMap);

      return true;
    }

    return false;
  };

  // ============================================================
  // FRANCHISE OWNER LOGIN
  // ============================================================

  const handleOwnerCodeLogin =
    useCallback(
      async (
        code: string,
        teamId?: string
      ): Promise<{
        success: boolean;
        teamId?: string | null;
        role?: string;
        error?: string;
      }> => {
        const res =
          await dbApi.verifyOwnerCode(
            code,
            teamId
          );

        if (res.success) {
          if (
            res.role ===
              'master_owner' &&
            teamId
          ) {
            const matchedTeam =
              teams.find(
                (t) => t.id === teamId
              );

            setUnlockedTeams({
              [teamId]:
                res.authCode ||
                code.trim(),
            });

            setMyTeamId(teamId);

            setOwnerAuthToken(
              res.authCode ||
                code.trim()
            );

            setIsAdminLoggedIn(false);
            setIsAdminOpen(false);
            setActiveTab('auction');

            setTimeout(() => {
              window.scrollTo({
                top: 0,
                behavior: 'smooth',
              });
            }, 50);

            addLog(
              `Franchise locked for ${
                matchedTeam?.name ||
                teamId
              } (${
                matchedTeam?.shortCode ||
                ''
              }).`,
              'info',
              matchedTeam?.shortCode
            );

            return {
              success: true,
              teamId,
              role: 'team_owner',
            };
          }

          if (res.teamId) {
            const matchedTeam =
              teams.find(
                (t) =>
                  t.id === res.teamId
              );

            setUnlockedTeams({
              [res.teamId]:
                res.authCode ||
                code.trim(),
            });

            setMyTeamId(res.teamId);

            setOwnerAuthToken(
              res.authCode ||
                code.trim()
            );

            setIsAdminLoggedIn(false);
            setIsAdminOpen(false);
            setActiveTab('auction');

            setTimeout(() => {
              window.scrollTo({
                top: 0,
                behavior: 'smooth',
              });
            }, 50);

            addLog(
              `Franchise Owner logged in and locked ${
                matchedTeam?.name ||
                res.teamId
              } (${
                matchedTeam?.shortCode ||
                ''
              }).`,
              'info',
              matchedTeam?.shortCode
            );

            return {
              success: true,
              teamId: res.teamId,
              role: 'team_owner',
            };
          }
        }

        return {
          success: false,
          error:
            res.error ||
            'Invalid hidden owner code. Access denied.',
        };
      },
      [teams, addLog]
    );

  // ============================================================
  // ADD PLAYER
  //
  // Firestore is the permanent storage.
  // ============================================================

  const handleAddPlayer = async (
    newPlayerData: Omit<
      Player,
      'id' | 'status'
    >
  ) => {
    lastLocalMutationTime.current =
      Date.now();

    let finalPhoto =
      newPlayerData.photo;

    if (
      finalPhoto &&
      finalPhoto.startsWith('data:image/')
    ) {
      finalPhoto =
        await compressImageToDataUrl(
          finalPhoto
        );
    }

    const newPlayer: Player = {
      ...newPlayerData,
      photo: finalPhoto,
      id: `ply_${Date.now()}`,
      status: 'available',
    };

    setPlayers((prev) => [
      newPlayer,
      ...prev,
    ]);

    try {
      const savedCloudPlayer =
        await savePlayerToFirestore(
          newPlayer,
          'Priyam01032008@'
        );

      setPlayers((prev) =>
        prev.map((p) =>
          p.id === newPlayer.id
            ? savedCloudPlayer
            : p
        )
      );
    } catch (err) {
      console.error(
        'Failed to save new player to Firestore:',
        err
      );
    }

    // Do NOT depend on /api for the actual
    // cross-device player storage.
    try {
      await dbApi.addPlayer(
        newPlayer,
        'Priyam01032008@'
      );
    } catch {
      // GitHub Pages may not have /api.
      // Firestore save above is sufficient.
    }

    addLog(
      `Master Owner uploaded player "${newPlayer.name}" to shared Firebase database.`,
      'info'
    );
  };

  // ============================================================
  // UPDATE PLAYER
  //
  // IMPORTANT PHOTO FIX:
  // This writes directly to Firestore.
  // No stale localStorage/API overwrite afterward.
  // ============================================================

  const handleUpdatePlayer = async (
    id: string,
    updated: Partial<Player>
  ) => {
    lastLocalMutationTime.current =
      Date.now();

    let processedPhoto =
      updated.photo;

    if (
      processedPhoto &&
      processedPhoto.startsWith('data:image/')
    ) {
      processedPhoto =
        await compressImageToDataUrl(
          processedPhoto
        );
    }

    const cleanUpdated: Partial<Player> =
      processedPhoto !== undefined
        ? {
            ...updated,
            photo: processedPhoto,
          }
        : updated;

    const existingPlayer =
      players.find(
        (p) => p.id === id
      );

    const mergedPlayer: Player | null =
      existingPlayer
        ? {
            ...existingPlayer,
            ...cleanUpdated,
            id,
          }
        : null;

    // Immediate local UI update
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              ...cleanUpdated,
            }
          : p
      )
    );

    // ========================================================
    // FIRESTORE SAVE
    // ========================================================

    if (mergedPlayer) {
      try {
        const savedCloudPlayer =
          await savePlayerToFirestore(
            mergedPlayer,
            'Priyam01032008@'
          );

        // Use Firestore's returned object
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === id
              ? savedCloudPlayer
              : p
          )
        );

        console.log(
          'Player successfully saved to Firestore:',
          id
        );
      } catch (err) {
        console.error(
          'Failed to update player in Firestore:',
          err
        );
      }
    }

    // IMPORTANT:
    // Do NOT call:
    //
    // await dbApi.updatePlayer(...)
    //
    // because GitHub Pages does not provide /api/players.
    //
    // Firestore is the shared cross-device source.
  };

  // ============================================================
  // DELETE PLAYER
  // ============================================================

  const handleDeletePlayer = async (
    id: string
  ) => {
    lastLocalMutationTime.current =
      Date.now();

    setPlayers((prev) =>
      prev.filter((p) => p.id !== id)
    );

    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        players: t.players.filter(
          (pId) => pId !== id
        ),
        retainedPlayers:
          t.retainedPlayers.filter(
            (pId) => pId !== id
          ),
      }))
    );

    if (currentPlayerId === id) {
      setCurrentPlayerId(null);
      setCurrentBid(0);
      setHighestBidderId(null);
      setAuctionStatus('idle');
    }

    try {
      await deletePlayerFromFirestore(
        id
      );
    } catch (err) {
      console.error(
        'Failed to delete player from Firestore:',
        err
      );
    }

    try {
      await dbApi.deletePlayer(
        id,
        'Priyam01032008@'
      );
    } catch {
      // Ignore GitHub Pages /api failure.
    }

    addLog(
      'Player removed from tournament roster by Master Owner.',
      'info'
    );
  };

  // ============================================================
  // ADD TEAM
  // ============================================================

  const handleAddTeam = async (
    teamData: Partial<Team> & {
      name: string;
      shortCode: string;
      primaryColor: string;
      secondaryColor: string;
      motto: string;
    }
  ) => {
    lastLocalMutationTime.current =
      Date.now();

    let finalLogo =
      teamData.logoUrl;

    if (
      finalLogo &&
      finalLogo.startsWith('data:image/')
    ) {
      finalLogo =
        await compressImageToDataUrl(
          finalLogo
        );
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
      preferredRoles: [
        'Batter',
        'Fast Bowler',
      ],
      ...teamData,
      logoUrl: finalLogo,
    };

    setTeams((prev) => [
      ...prev,
      newTeam,
    ]);

    try {
      await saveTeamToFirestore(
        newTeam,
        'Priyam01032008@'
      );
    } catch (err) {
      console.error(
        'Failed to add team to Firestore:',
        err
      );
    }

    try {
      await dbApi.addTeam(
        newTeam,
        'Priyam01032008@'
      );
    } catch {
      // Ignore GitHub Pages /api failure.
    }
  };

  // ============================================================
  // DELETE TEAM
  // ============================================================

  const handleDeleteTeam = async (
    teamId: string
  ) => {
    lastLocalMutationTime.current =
      Date.now();

    setTeams((prev) =>
      prev.filter(
        (t) => t.id !== teamId
      )
    );

    setPlayers((prev) =>
      prev.map((p) =>
        p.soldTo === teamId
          ? {
              ...p,
              status: 'available',
              soldTo: undefined,
              soldPrice: undefined,
            }
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
      await deleteTeamFromFirestore(
        teamId
      );
    } catch (err) {
      console.error(
        'Failed to delete team from Firestore:',
        err
      );
    }

    try {
      await dbApi.deleteTeam(
        teamId,
        'Priyam01032008@'
      );
    } catch {
      // Ignore GitHub Pages /api failure.
    }

    addLog(
      'Franchise removed from tournament roster by Master Owner.',
      'info'
    );
  };

  // ============================================================
  // UPDATE TEAM PURSE
  // ============================================================

  const handleUpdateTeamPurse = async (
    teamId: string,
    newPurse: number
  ) => {
    lastLocalMutationTime.current =
      Date.now();

    const existingTeam =
      teams.find(
        (t) => t.id === teamId
      );

    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? {
              ...t,
              purse: newPurse,
            }
          : t
      )
    );

    if (existingTeam) {
      try {
        await saveTeamToFirestore(
          {
            ...existingTeam,
            purse: newPurse,
          },
          'Priyam01032008@'
        );
      } catch {
        // Ignore
      }
    }

    try {
      await dbApi.updateTeam(
        teamId,
        {
          purse: newPurse,
        },
        'Priyam01032008@'
      );
    } catch {
      // Ignore GitHub Pages /api failure.
    }
  };

  // ============================================================
  // UPDATE TEAM
  // ============================================================

  const handleUpdateTeam = async (
    teamId: string,
    updated: Partial<Team>
  ) => {
    lastLocalMutationTime.current =
      Date.now();

    let finalLogo =
      updated.logoUrl;

    if (
      finalLogo &&
      finalLogo.startsWith('data:image/')
    ) {
      finalLogo =
        await compressImageToDataUrl(
          finalLogo
        );
    }

    const cleanUpdated: Partial<Team> =
      finalLogo !== undefined
        ? {
            ...updated,
            logoUrl: finalLogo,
          }
        : updated;

    const existingTeam =
      teams.find(
        (t) => t.id === teamId
      );

    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? {
              ...t,
              ...cleanUpdated,
            }
          : t
      )
    );

    if (existingTeam) {
      try {
        await saveTeamToFirestore(
          {
            ...existingTeam,
            ...cleanUpdated,
            id: teamId,
          },
          'Priyam01032008@'
        );
      } catch (err) {
        console.error(
          'Failed to update team in Firestore:',
          err
        );
      }
    }

    try {
      await dbApi.updateTeam(
        teamId,
        cleanUpdated,
        'Priyam01032008@'
      );
    } catch {
      // Ignore GitHub Pages /api failure.
    }
  };

  // ============================================================
  // FORCE SELL
  // ============================================================

  const handleForceSellPlayer = (
    playerId: string,
    teamId: string,
    price: number
  ) => {
    const targetPlayer =
      players.find(
        (p) => p.id === playerId
      );

    const targetTeam =
      teams.find(
        (t) => t.id === teamId
      );

    if (!targetPlayer || !targetTeam) {
      return;
    }

    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            purse: Math.max(
              0,
              t.purse - price
            ),
            players: [
              ...t.players,
              playerId,
            ],
            overseasPlayers:
              targetPlayer.isOverseas
                ? t.overseasPlayers + 1
                : t.overseasPlayers,
          };
        }

        return t;
      })
    );

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId
          ? {
              ...p,
              status: 'sold',
              soldPrice: price,
              soldTo: teamId,
            }
          : p
      )
    );

    const histItem: AuctionHistoryItem = {
      id: `hist_${Date.now()}`,
      timestamp:
        new Date().toLocaleTimeString(
          [],
          {
            hour: '2-digit',
            minute: '2-digit',
          }
        ),
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
          bidderTeamCode:
            targetTeam.shortCode,
          timestamp:
            new Date().toLocaleTimeString(
              [],
              {
                hour: '2-digit',
                minute: '2-digit',
              }
            ),
          isAi: false,
        },
      ],
    };

    setHistory((prev) => [
      histItem,
      ...prev,
    ]);

    addLog(
      `Owner manual sell: ${targetPlayer.name} sold to ${targetTeam.shortCode} for ${settings.currency}${price.toLocaleString()}`,
      'sold',
      targetTeam.shortCode,
      targetTeam.primaryColor
    );
  };

  // ============================================================
  // CANCEL BID / REFUND
  // ============================================================

  const handleCancelBidAndRefund =
    useCallback(
      (
        playerId: string,
        sendToStage: boolean = false
      ) => {
        const targetPlayer =
          players.find(
            (p) => p.id === playerId
          );

        if (!targetPlayer) return;

        const histEntry =
          history.find(
            (h) =>
              h.player.id === playerId &&
              h.type === 'sold'
          );

        const refundTeamId =
          targetPlayer.soldTo ||
          histEntry?.winningTeam?.id;

        const refundAmount =
          targetPlayer.soldPrice ||
          histEntry?.finalPrice ||
          0;

        if (refundTeamId) {
          setTeams((prev) =>
            prev.map((t) => {
              if (
                t.id === refundTeamId
              ) {
                const updatedPlayers =
                  t.players.filter(
                    (id) =>
                      id !== playerId
                  );

                const updatedRetained =
                  (
                    t.retainedPlayers ||
                    []
                  ).filter(
                    (id) =>
                      id !== playerId
                  );

                const isOverseas =
                  targetPlayer.isOverseas;

                return {
                  ...t,
                  purse: Math.min(
                    t.initialPurse ||
                      60000,
                    t.purse +
                      refundAmount
                  ),
                  players:
                    updatedPlayers,
                  retainedPlayers:
                    updatedRetained,
                  overseasPlayers:
                    isOverseas
                      ? Math.max(
                          0,
                          t.overseasPlayers -
                            1
                        )
                      : t.overseasPlayers,
                };
              }

              return t;
            })
          );
        }

        const resetPlayer: Player = {
          ...targetPlayer,
          status: 'available',
          soldPrice: undefined,
          soldTo: undefined,
        };

        setPlayers((prev) =>
          prev.map((p) =>
            p.id === playerId
              ? resetPlayer
              : p
          )
        );

        setHistory((prev) =>
          prev.filter(
            (h) =>
              h.player.id !== playerId
          )
        );

        setIsSoldModalOpen(false);

        const activeKey =
          isAdminLoggedIn
            ? 'Priyam01032008@'
            : ownerAuthToken ||
              'Priyam01032008@';

        updatePlayerAuctionInFirestore(
          resetPlayer,
          activeKey
        ).catch(() => {});

        if (refundTeamId) {
          const rTeam =
            teams.find(
              (t) =>
                t.id === refundTeamId
            );

          if (rTeam) {
            const restoredPurse =
              Math.min(
                rTeam.initialPurse ||
                  60000,
                rTeam.purse +
                  refundAmount
              );

            const restoredOverseas =
              targetPlayer.isOverseas
                ? Math.max(
                    0,
                    rTeam.overseasPlayers -
                      1
                  )
                : rTeam.overseasPlayers;

            updateTeamPurseInFirestore(
              refundTeamId,
              restoredPurse,
              restoredOverseas,
              activeKey
            ).catch(() => {});
          }
        }

        try {
          dbApi.refundPlayerSale(
            playerId,
            ownerAuthToken ||
              'MASTER_OWNER_AUTH'
          );
        } catch {
          // Ignore API failure.
        }

        const refundTeam =
          teams.find(
            (t) =>
              t.id === refundTeamId
          );

        addLog(
          `Backend Owner Refund: Bid cancelled on ${targetPlayer.name}. ${settings.currency}${refundAmount.toLocaleString()} refunded to ${refundTeam?.shortCode || 'team'}. Player re-entered auction pool.`,
          'info',
          refundTeam?.shortCode,
          refundTeam?.primaryColor
        );

        if (sendToStage) {
          setCurrentPlayerId(
            playerId
          );

          setCurrentBid(0);
          setHighestBidderId(null);
          setLastBidAmount(0);
          setLastBidderId(null);

          setAuctionStatus('bidding');
          setIsTimerActive(false);
          setIsPaused(false);
          setIsAdminOpen(false);

          document
            .getElementById(
              'section-stage'
            )
            ?.scrollIntoView({
              behavior: 'smooth',
            });

          addLog(
            `Lot ${targetPlayer.name} placed back onto the stage of honor for re-auction.`,
            'info'
          );
        } else if (
          currentPlayerId === playerId
        ) {
          setCurrentBid(0);
          setHighestBidderId(null);
          setLastBidAmount(0);
          setLastBidderId(null);
          setAuctionStatus('idle');
          setIsTimerActive(false);
          setIsPaused(false);
        }
      },
      [
        players,
        teams,
        history,
        settings.currency,
        currentPlayerId,
        ownerAuthToken,
        isAdminLoggedIn,
        addLog,
      ]
    );

  // ============================================================
  // RE-ENTER AUCTION
  // ============================================================

  const handleReenterAuction =
    useCallback(
      (
        playerId: string,
        sendToStage: boolean = false
      ) => {
        const targetPlayer =
          players.find(
            (p) => p.id === playerId
          );

        if (!targetPlayer) return;

        const resetPlayer: Player = {
          ...targetPlayer,
          status: 'available',
          soldPrice: undefined,
          soldTo: undefined,
        };

        setPlayers((prev) =>
          prev.map((p) =>
            p.id === playerId
              ? resetPlayer
              : p
          )
        );

        setHistory((prev) =>
          prev.filter(
            (h) =>
              h.player.id !== playerId
          )
        );

        const activeKey =
          isAdminLoggedIn
            ? 'Priyam01032008@'
            : ownerAuthToken ||
              'Priyam01032008@';

        updatePlayerAuctionInFirestore(
          resetPlayer,
          activeKey
        ).catch(() => {});

        try {
          dbApi.reauctionPlayer(
            playerId,
            ownerAuthToken ||
              'MASTER_OWNER_AUTH'
          );
        } catch {
          // Ignore API failure.
        }

        addLog(
          `Backend Owner Re-Auction: ${targetPlayer.name} recalled and re-entered into auction pool.`,
          'info'
        );

        if (sendToStage) {
          setCurrentPlayerId(
            playerId
          );

          setCurrentBid(0);
          setHighestBidderId(null);
          setLastBidAmount(0);
          setLastBidderId(null);

          setAuctionStatus('bidding');
          setIsTimerActive(false);
          setIsPaused(false);
          setIsAdminOpen(false);

          document
            .getElementById(
              'section-stage'
            )
            ?.scrollIntoView({
              behavior: 'smooth',
            });

          addLog(
            `Lot ${targetPlayer.name} placed back onto the stage of honor for re-auction.`,
            'info'
          );
        } else if (
          currentPlayerId === playerId
        ) {
          setCurrentBid(0);
          setHighestBidderId(null);
          setLastBidAmount(0);
          setLastBidderId(null);
          setAuctionStatus('idle');
          setIsTimerActive(false);
          setIsPaused(false);
        }
      },
      [
        players,
        currentPlayerId,
        ownerAuthToken,
        isAdminLoggedIn,
        addLog,
      ]
    );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF9] text-[#0F172A] font-body selection:bg-[#D4AF37] selection:text-[#0F172A] storybook-page relative">

      {/* Storybook ambient parchment glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[140px]" />

        <div className="absolute top-1/2 right-1/4 w-[700px] h-[700px] bg-[#1E1E38]/5 rounded-full blur-[160px]" />
      </div>

      {/* Header */}
      <Header
        activeTab={
          activeTab === 'owner_board'
            ? 'auction'
            : activeTab
        }
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
        isAuctionActive={
          auctionStatus === 'bidding'
        }
        soundEnabled={
          settings.soundEnabled
        }
        onToggleSound={() =>
          setSettings((s) => ({
            ...s,
            soundEnabled:
              !s.soundEnabled,
          }))
        }
        onOpenSettings={() =>
          setIsSettingsOpen(true)
        }
        onOpenAdmin={() =>
          setIsAdminOpen(true)
        }
        onOpenTeamLogin={() =>
          setIsTeamLoginOpen(true)
        }
        isAdminLoggedIn={
          isAdminLoggedIn
        }
        currency={settings.currency}
        onNavigateSection={(sectionId) => {
          document
            .getElementById(sectionId)
            ?.scrollIntoView({
              behavior: 'smooth',
            });
        }}
      />

      {/* ======================================================
          MAIN PAGE
          ====================================================== */}

      <main className="flex-1 flex flex-col relative z-10 space-y-16 pb-16">

        {/* Hero */}
        <section id="section-hero">
          <LandingPage
            onStartAuction={
              handleStartAuction
            }
            setActiveTab={
              setActiveTab
            }
            teams={teams}
            players={players}
            currency={settings.currency}
            onScrollToChapter={(id) => {
              document
                .getElementById(id)
                ?.scrollIntoView({
                  behavior: 'smooth',
                });
            }}
          />
        </section>

        {/* Auction Stage */}
        <section
          id="section-stage"
          className="w-full max-w-7xl mx-auto px-4 sm:px-8 scroll-mt-24"
        >
          <AuctionRoom
            currentPlayer={currentPlayer}
            currentBid={currentBid}
            highestBidder={
              highestBidder
            }
            lastBidAmount={
              lastBidAmount
            }
            lastBidder={lastBidder}
            timerSeconds={
              timerSeconds
            }
            isTimerActive={
              isTimerActive
            }
            isPaused={isPaused}
            auctionStatus={
              auctionStatus
            }
            myTeam={myTeam}
            teams={teams}
            liveLogs={liveLogs}
            onPlaceBid={
              handlePlaceBid
            }
            onStartAuction={
              handleStartAuction
            }
            onPauseResume={
              handlePauseResume
            }
            onNextPlayer={() =>
              loadNextPlayerToStage()
            }
            onSellNow={
              handleSellPlayer
            }
            onMarkUnsold={
              handleMarkUnsold
            }
            onResetAuction={
              handleResetAuction
            }
            onStartUnsoldRound={
              handleStartUnsoldRound
            }
            unsoldRoundActive={
              unsoldRoundActive
            }
            unsoldPlayersCount={
              unsoldPlayers.length
            }
            availablePlayersCount={
              availablePlayers.length
            }
            history={history}
            currency={
              settings.currency
            }
            totalDuration={
              settings.bidTimerDuration
            }
            unlockedTeamIds={
              Object.keys(
                unlockedTeams
              )
            }
            onOwnerCodeLogin={
              handleOwnerCodeLogin
            }
            onOpenTeamLogin={() =>
              setIsTeamLoginOpen(true)
            }
            onOpenBackendOwnerBoard={() =>
              setIsAdminOpen(true)
            }
          />
        </section>

        {/* Squads */}
        <section
          id="section-squads"
          className="w-full max-w-7xl mx-auto px-4 sm:px-8 scroll-mt-24 border-t-2 border-[#D4AF37]/30 pt-12 space-y-12"
        >
          <SquadManagement
            teams={teams}
            allPlayers={players}
            myTeam={myTeam}
            currency={settings.currency}
          />

          <div className="pt-4 border-t border-[#D4AF37]/25">
            <TeamSelection
              teams={teams}
              myTeam={myTeam}
              onSelectTeam={(teamId) =>
                setMyTeamId(teamId)
              }
              onProceedToAuction={() => {
                document
                  .getElementById(
                    'section-stage'
                  )
                  ?.scrollIntoView({
                    behavior: 'smooth',
                  });

                if (
                  auctionStatus ===
                  'idle'
                ) {
                  handleStartAuction();
                }
              }}
              allPlayers={players}
              currency={
                settings.currency
              }
              unlockedTeamIds={
                Object.keys(
                  unlockedTeams
                )
              }
              onOwnerCodeLogin={
                handleOwnerCodeLogin
              }
            />
          </div>
        </section>

        {/* Players */}
        <section
          id="section-players"
          className="w-full max-w-7xl mx-auto px-4 sm:px-8 scroll-mt-24 border-t-2 border-[#D4AF37]/30 pt-12"
        >
          <PlayerDatabase
            players={players}
            teams={teams}
            onSetCurrentPlayer={(p) => {
              loadNextPlayerToStage(
                p.id
              );

              document
                .getElementById(
                  'section-stage'
                )
                ?.scrollIntoView({
                  behavior: 'smooth',
                });
            }}
            onOpenOwnerBoard={() =>
              setIsAdminOpen(true)
            }
            isAdminLoggedIn={
              isAdminLoggedIn
            }
            currency={
              settings.currency
            }
          />
        </section>

        {/* History */}
        <section
          id="section-history"
          className="w-full max-w-7xl mx-auto px-4 sm:px-8 scroll-mt-24 border-t-2 border-[#D4AF37]/30 pt-12"
        >
          <AuctionHistory
            history={history}
            teams={teams}
            currency={
              settings.currency
            }
          />
        </section>

        {/* Leaderboard */}
        <section
          id="section-leaderboard"
          className="w-full max-w-7xl mx-auto px-4 sm:px-8 scroll-mt-24 border-t-2 border-[#D4AF37]/30 pt-12"
        >
          <Leaderboard
            teams={teams}
            allPlayers={players}
            myTeam={myTeam}
            currency={
              settings.currency
            }
          />
        </section>

        {/* Rules */}
        <section
          id="section-rules"
          className="w-full max-w-7xl mx-auto px-4 sm:px-8 scroll-mt-24 border-t-2 border-[#D4AF37]/30 pt-12"
        >
          <RulesPage
            initialPurse={60000}
            maxSquadSize={18}
            maxOverseasPlayers={6}
            currency={
              settings.currency
            }
            bidTimerDuration={
              settings.bidTimerDuration
            }
          />
        </section>
      </main>

      {/* ======================================================
          MODALS
          ====================================================== */}

      <SoldModal
        isOpen={isSoldModalOpen}
        onClose={() =>
          setIsSoldModalOpen(false)
        }
        player={
          soldModalData.player
        }
        winningTeam={
          soldModalData.winningTeam
        }
        soldPrice={
          soldModalData.soldPrice
        }
        onNextPlayer={() =>
          loadNextPlayerToStage()
        }
        currency={
          settings.currency
        }
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() =>
          setIsSettingsOpen(false)
        }
        settings={settings}
        onUpdateSettings={(
          newOpts
        ) =>
          setSettings((s) => ({
            ...s,
            ...newOpts,
          }))
        }
        onResetDefaults={() =>
          setSettings(
            INITIAL_SETTINGS
          )
        }
      />

      <FranchiseLoginModal
        isOpen={isTeamLoginOpen}
        onClose={() =>
          setIsTeamLoginOpen(false)
        }
        teams={teams}
        loggedInOwnerTeam={myTeam}
        onOwnerCodeLogin={
          handleOwnerCodeLogin
        }
        onLogoutTeam={() => {
          setMyTeamId(null);
          setUnlockedTeams({});
        }}
        currency={
          settings.currency
        }
      />

      {/* ======================================================
          OWNER BOARD
          ====================================================== */}

      <OwnerBoard
        isOpen={isAdminOpen}
        onClose={() =>
          setIsAdminOpen(false)
        }
        isAdminLoggedIn={
          isAdminLoggedIn
        }
        onLogin={handleOwnerLogin}
        onLogout={() => {
          setIsAdminLoggedIn(false);
          setOwnerAuthToken(null);
        }}
        players={players}
        teams={teams}
        onAddPlayer={
          handleAddPlayer
        }
        onUpdatePlayer={
          handleUpdatePlayer
        }
        onDeletePlayer={
          handleDeletePlayer
        }
        onAddTeam={
          handleAddTeam
        }
        onDeleteTeam={
          handleDeleteTeam
        }
        onUpdateTeam={
          handleUpdateTeam
        }
        onUpdateTeamPurse={
          handleUpdateTeamPurse
        }
        onResetAuction={
          handleResetAuction
        }
        onCancelSale={
          handleCancelBidAndRefund
        }
        onReenterAuction={
          handleReenterAuction
        }
        onForceStagePlayer={(id) => {
          loadNextPlayerToStage(id);
          setActiveTab('auction');
          setIsAdminOpen(false);
        }}
        onForceSellPlayer={
          handleForceSellPlayer
        }
        currentPlayer={
          currentPlayer
        }
        currentBid={currentBid}
        highestBidder={
          highestBidder
        }
        loggedInOwnerTeam={
          myTeam
        }
        onOwnerCodeLogin={
          handleOwnerCodeLogin
        }
        onPlaceBid={
          handlePlaceBid
        }
        onSellNow={
          handleSellPlayer
        }
        onMarkUnsold={
          handleMarkUnsold
        }
        onNextPlayer={() =>
          loadNextPlayerToStage()
        }
        currency={
          settings.currency
        }
        onSyncAll={
          syncToBackend
        }
      />

      <AuctionResults
        isOpen={isResultsOpen}
        onClose={() =>
          setIsResultsOpen(false)
        }
        myTeam={myTeam}
        teams={teams}
        allPlayers={players}
        history={history}
        onResetAuction={
          handleResetAuction
        }
        currency={
          settings.currency
        }
      />

      <DisclaimerFooter />
    </div>
  );
}
