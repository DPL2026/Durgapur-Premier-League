import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  deleteField
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { OWNER_UPLOADED_PHOTOS } from './data/uploadedPhotos';
import { Player, PlayerRole, Team } from './types';

const env = (import.meta as any).env || {};

export const resolvedFirebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId,
  oAuthClientId: env.VITE_FIREBASE_OAUTH_CLIENT_ID || firebaseConfig.oAuthClientId,
};

export const REQUIRED_FIREBASE_ENV_VARS: Record<string, string> = {
  VITE_FIREBASE_API_KEY: firebaseConfig.apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  VITE_FIREBASE_STORAGE_BUCKET: firebaseConfig.storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
  VITE_FIREBASE_APP_ID: firebaseConfig.appId,
  VITE_FIREBASE_DATABASE_ID: firebaseConfig.firestoreDatabaseId,
  VITE_FIREBASE_OAUTH_CLIENT_ID: firebaseConfig.oAuthClientId || '',
};

const app = initializeApp(resolvedFirebaseConfig);
export const db = getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

const VALID_ROLES: PlayerRole[] = [
  'Batter',
  'Wicketkeeper',
  'All-rounder',
  'Fast Bowler',
  'Spin Bowler',
];

function sanitizeId(rawId: string, fallbackPrefix = 'item'): string {
  const cleaned = (rawId || `${fallbackPrefix}_${Date.now()}`)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 128);
  return cleaned || `${fallbackPrefix}_${Date.now()}`;
}

/**
 * Compress any uploaded image File or data URL into a clean, unfiltered JPEG data URL (< 250KB)
 * so that it fits safely inside Firestore documents (< 900,000 chars) and loads on every device.
 */
export async function compressImageToDataUrl(
  fileOrDataUrl: File | string,
  maxDimension = 580,
  quality = 0.84
): Promise<string> {
  const rawDataUrl =
    typeof fileOrDataUrl === 'string'
      ? fileOrDataUrl
      : await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fileOrDataUrl);
        });

  if (!rawDataUrl) return '';
  // Keep external http(s) URLs or compact SVGs intact if already small
  if (
    (rawDataUrl.startsWith('http://') ||
      rawDataUrl.startsWith('https://') ||
      rawDataUrl.startsWith('data:image/svg+xml')) &&
    rawDataUrl.length <= 200000
  ) {
    return rawDataUrl;
  }

  // If running in browser, use Canvas to ensure image is compact (< 250KB) and unfiltered
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const compressed = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          let width = img.naturalWidth || img.width || 400;
          let height = img.naturalHeight || img.height || 500;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          ctx.filter = 'none';
          ctx.drawImage(img, 0, 0, width, height);
          let out = canvas.toDataURL('image/jpeg', quality);
          if (out.length > 800000) {
            out = canvas.toDataURL('image/jpeg', 0.65);
          }
          resolve(out);
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = rawDataUrl;
      });
      if (compressed && compressed.length <= 890000) {
        return compressed;
      }
    } catch {
      // Fallback if image could not be drawn
    }
  }

  return rawDataUrl.slice(0, 890000);
}

/**
 * Convert a Player object to a validated Firestore document matching firebase-blueprint.json & firestore.rules.
 */
export function playerToFirestoreDoc(
  player: Player,
  ownerKey = 'Priyam01032008@'
): Record<string, unknown> {
  const safeId = sanitizeId(player.id, 'ply');
  const safeRole: PlayerRole = VALID_ROLES.includes(player.role) ? player.role : 'Batter';
  const safeStatus =
    player.status === 'sold' || player.status === 'unsold' ? player.status : 'available';

  const docData: Record<string, unknown> = {
    id: safeId,
    name: (player.name || 'Unnamed Player').trim().slice(0, 120) || 'Unnamed Player',
    role: safeRole,
    nationality: (player.nationality || 'Indian').trim().slice(0, 80) || 'Indian',
    isOverseas: Boolean(player.isOverseas),
    age: Math.min(70, Math.max(10, Math.round(Number(player.age) || 20))),
    basePrice: Math.min(10000000, Math.max(0, Math.round(Number(player.basePrice) || 1000))),
    battingStyle: (player.battingStyle || 'Right-hand bat').slice(0, 80),
    bowlingStyle: (player.bowlingStyle || '').slice(0, 80),
    status: safeStatus,
    matches: Math.min(5000, Math.max(0, Math.round(Number(player.stats?.matches) || 0))),
    runs: Math.min(100000, Math.max(0, Math.round(Number(player.stats?.runs) || 0))),
    wickets: Math.min(10000, Math.max(0, Math.round(Number(player.stats?.wickets) || 0))),
    strikeRate: Math.min(1000, Math.max(0, Number(player.stats?.strikeRate) || 0)),
    highestScore: String(player.stats?.highestScore || '0').slice(0, 40),
    visibility: 'public',
    ownerKey: (ownerKey || 'Priyam01032008@').slice(0, 128),
  };

  const resolvedPhoto =
    player.photo && player.photo.startsWith('/uploads/') && OWNER_UPLOADED_PHOTOS[safeId]
      ? OWNER_UPLOADED_PHOTOS[safeId]
      : player.photo || OWNER_UPLOADED_PHOTOS[safeId];

  if (resolvedPhoto && typeof resolvedPhoto === 'string' && resolvedPhoto.length <= 895000) {
    docData.photo = resolvedPhoto;
  }
  if (typeof player.soldPrice === 'number' && player.soldPrice >= 0) {
    docData.soldPrice = Math.min(10000000, Math.round(player.soldPrice));
  }
  if (player.soldTo && typeof player.soldTo === 'string') {
    docData.soldTo = player.soldTo.slice(0, 128);
  }

  return docData;
}

export function firestoreDocToPlayer(data: Record<string, any>): Player {
  const pid = String(data.id || '');
  const rawPhoto = typeof data.photo === 'string' && data.photo.trim() ? data.photo.trim() : undefined;
  const resolvedPhoto =
    (!rawPhoto || rawPhoto.startsWith('/uploads/')) && OWNER_UPLOADED_PHOTOS[pid]
      ? OWNER_UPLOADED_PHOTOS[pid]
      : rawPhoto;

  return {
    id: pid,
    name: String(data.name || 'Player'),
    role: VALID_ROLES.includes(data.role) ? data.role : 'Batter',
    nationality: String(data.nationality || 'Indian'),
    isOverseas: Boolean(data.isOverseas),
    age: Number(data.age) || 20,
    basePrice: Number(data.basePrice) || 1000,
    battingStyle: String(data.battingStyle || 'Right-hand bat'),
    bowlingStyle: String(data.bowlingStyle || ''),
    photo: resolvedPhoto,
    status:
      data.status === 'sold' || data.status === 'unsold' ? data.status : 'available',
    soldPrice: typeof data.soldPrice === 'number' ? data.soldPrice : undefined,
    soldTo: typeof data.soldTo === 'string' && data.soldTo ? data.soldTo : undefined,
    stats: {
      matches: Number(data.matches) || 0,
      runs: Number(data.runs) || 0,
      wickets: Number(data.wickets) || 0,
      strikeRate: Number(data.strikeRate) || 0,
      highestScore: String(data.highestScore || '-'),
    },
  };
}

export function teamToFirestoreDoc(
  team: Team,
  ownerKey = 'Priyam01032008@'
): Record<string, unknown> {
  const safeId = sanitizeId(team.id, 'team');
  const docData: Record<string, unknown> = {
    id: safeId,
    name: (team.name || 'Franchise').trim().slice(0, 120) || 'Franchise',
    shortCode: (team.shortCode || 'DPL').trim().slice(0, 16) || 'DPL',
    purse: Math.min(10000000, Math.max(0, Math.round(Number(team.purse) || 0))),
    initialPurse: Math.min(10000000, Math.max(0, Math.round(Number(team.initialPurse) || 60000))),
    overseasPlayers: Math.min(50, Math.max(0, Math.round(Number(team.overseasPlayers) || 0))),
    maxSquadSize: Math.min(50, Math.max(1, Math.round(Number(team.maxSquadSize) || 18))),
    maxOverseasPlayers: Math.min(50, Math.max(0, Math.round(Number(team.maxOverseasPlayers) || 6))),
    primaryColor: (team.primaryColor || '#dc2626').slice(0, 32),
    secondaryColor: (team.secondaryColor || '#f59e0b').slice(0, 32),
    accentColor: (team.accentColor || '#18181b').slice(0, 32),
    logoSymbol: (team.logoSymbol || '🏏').slice(0, 32),
    motto: (team.motto || 'Play Bold').slice(0, 200),
    visibility: 'public',
    ownerKey: (ownerKey || 'Priyam01032008@').slice(0, 128),
  };

  if (team.logoUrl && typeof team.logoUrl === 'string' && team.logoUrl.length <= 895000) {
    docData.logoUrl = team.logoUrl;
  }

  return docData;
}

export function firestoreDocToTeam(
  data: Record<string, any>,
  allPlayers: Player[]
): Team {
  const teamId = String(data.id || '');
  const soldPlayers = allPlayers
    .filter((p) => p.status === 'sold' && p.soldTo === teamId)
    .map((p) => p.id);
  const soldOverseasCount = allPlayers.filter(
    (p) => p.status === 'sold' && p.soldTo === teamId && p.isOverseas
  ).length;

  return {
    id: teamId,
    name: String(data.name || 'Franchise'),
    shortCode: String(data.shortCode || 'DPL'),
    purse: typeof data.purse === 'number' ? data.purse : 60000,
    initialPurse: typeof data.initialPurse === 'number' ? data.initialPurse : 60000,
    players: soldPlayers,
    retainedPlayers: [],
    overseasPlayers: soldOverseasCount,
    maxSquadSize: Number(data.maxSquadSize) || 18,
    maxOverseasPlayers: Number(data.maxOverseasPlayers) || 6,
    primaryColor: String(data.primaryColor || '#dc2626'),
    secondaryColor: String(data.secondaryColor || '#f59e0b'),
    accentColor: String(data.accentColor || '#18181b'),
    logoSymbol: String(data.logoSymbol || '🏏'),
    logoUrl: typeof data.logoUrl === 'string' && data.logoUrl.trim() ? data.logoUrl : undefined,
    motto: String(data.motto || 'Play Bold'),
    aiAggression: 'balanced',
    preferredRoles: ['Batter', 'All-rounder'],
  };
}

/**
 * Save or update a player in Firebase Firestore (Master Owner Only)
 */
export async function savePlayerToFirestore(
  player: Player,
  ownerKey = 'Priyam01032008@'
): Promise<Player> {
  let finalPhoto = player.photo;
  if (finalPhoto && finalPhoto.startsWith('data:image/') && finalPhoto.length > 250000) {
    finalPhoto = await compressImageToDataUrl(finalPhoto);
  }
  const normalizedPlayer: Player = {
    ...player,
    id: sanitizeId(player.id, 'ply'),
    photo: finalPhoto,
  };
  const docData = playerToFirestoreDoc(normalizedPlayer, ownerKey);
  const path = `players/${normalizedPlayer.id}`;
  try {
    await setDoc(doc(db, 'players', normalizedPlayer.id), docData);
    return normalizedPlayer;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Update only auction status fields on a player in Firestore (Franchise Owner or Master Owner)
 */
export async function updatePlayerAuctionInFirestore(
  player: Player,
  ownerKey: string
): Promise<void> {
  const safeId = sanitizeId(player.id, 'ply');
  const path = `players/${safeId}`;
  const updatePayload: Record<string, unknown> = {
    status: player.status === 'sold' || player.status === 'unsold' ? player.status : 'available',
    ownerKey: ownerKey.slice(0, 128),
  };
  if (player.status === 'sold' && typeof player.soldPrice === 'number' && player.soldTo) {
    updatePayload.soldPrice = Math.round(player.soldPrice);
    updatePayload.soldTo = player.soldTo.slice(0, 128);
  } else {
    updatePayload.soldPrice = deleteField();
    updatePayload.soldTo = deleteField();
  }

  try {
    await updateDoc(doc(db, 'players', safeId), updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a player from Firebase Firestore (Master Owner Only)
 */
export async function deletePlayerFromFirestore(playerId: string): Promise<void> {
  const safeId = sanitizeId(playerId, 'ply');
  const path = `players/${safeId}`;
  try {
    await deleteDoc(doc(db, 'players', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save or update a team in Firebase Firestore (Master Owner Only)
 */
export async function saveTeamToFirestore(
  team: Team,
  ownerKey = 'Priyam01032008@'
): Promise<Team> {
  let finalLogo = team.logoUrl;
  if (finalLogo && finalLogo.startsWith('data:image/') && finalLogo.length > 250000) {
    finalLogo = await compressImageToDataUrl(finalLogo);
  }
  const normalizedTeam: Team = {
    ...team,
    id: sanitizeId(team.id, 'team'),
    logoUrl: finalLogo,
  };
  const docData = teamToFirestoreDoc(normalizedTeam, ownerKey);
  const path = `teams/${normalizedTeam.id}`;
  try {
    await setDoc(doc(db, 'teams', normalizedTeam.id), docData);
    return normalizedTeam;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Update team purse/overseas count in Firestore (Franchise Owner or Master Owner)
 */
export async function updateTeamPurseInFirestore(
  teamId: string,
  purse: number,
  overseasPlayers: number,
  ownerKey: string
): Promise<void> {
  const safeId = sanitizeId(teamId, 'team');
  const path = `teams/${safeId}`;
  try {
    await updateDoc(doc(db, 'teams', safeId), {
      purse: Math.max(0, Math.round(purse)),
      overseasPlayers: Math.max(0, Math.round(overseasPlayers)),
      ownerKey: ownerKey.slice(0, 128),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a team from Firebase Firestore (Master Owner Only)
 */
export async function deleteTeamFromFirestore(teamId: string): Promise<void> {
  const safeId = sanitizeId(teamId, 'team');
  const path = `teams/${safeId}`;
  try {
    await deleteDoc(doc(db, 'teams', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Real-time subscription to public players in Firestore for every website user
 */
export function subscribeToPublicPlayers(
  onPlayersChange: (players: Player[]) => void
): () => void {
  const q = query(collection(db, 'players'), where('visibility', '==', 'public'));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) return;
      const list = snapshot.docs.map((d) => firestoreDocToPlayer(d.data()));
      onPlayersChange(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'players');
    }
  );
}

/**
 * Real-time subscription to public teams in Firestore for every website user
 */
export function subscribeToPublicTeams(
  onTeamsChange: (teamDocs: Record<string, any>[]) => void
): () => void {
  const q = query(collection(db, 'teams'), where('visibility', '==', 'public'));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) return;
      const list = snapshot.docs.map((d) => d.data());
      onTeamsChange(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'teams');
    }
  );
}

/**
 * Fetch all public players and teams once from Firestore, and seed initial data if empty
 */
export async function fetchOrSeedFirestore(
  fallbackPlayers: Player[],
  fallbackTeams: Team[]
): Promise<{ players: Player[]; teams: Team[] } | null> {
  try {
    const playersQuery = query(collection(db, 'players'), where('visibility', '==', 'public'));
    const teamsQuery = query(collection(db, 'teams'), where('visibility', '==', 'public'));

    const [playersSnap, teamsSnap] = await Promise.all([
      getDocs(playersQuery),
      getDocs(teamsQuery),
    ]);

    let loadedPlayers: Player[] = [];
    if (playersSnap.empty && fallbackPlayers.length > 0) {
      // Seed initial owner players into Firestore
      for (const p of fallbackPlayers) {
        await savePlayerToFirestore(p, 'Priyam01032008@');
      }
      loadedPlayers = fallbackPlayers;
    } else {
      loadedPlayers = [];
      for (const d of playersSnap.docs) {
        const rawData = d.data();
        const parsed = firestoreDocToPlayer(rawData);
        loadedPlayers.push(parsed);
        if (
          parsed.photo &&
          parsed.photo.startsWith('data:image/') &&
          (!rawData.photo || String(rawData.photo).startsWith('/uploads/'))
        ) {
          savePlayerToFirestore(parsed, 'Priyam01032008@').catch(() => {});
        }
      }
    }

    let loadedTeams: Team[] = [];
    if (teamsSnap.empty && fallbackTeams.length > 0) {
      for (const t of fallbackTeams) {
        await saveTeamToFirestore(t, 'Priyam01032008@');
      }
      loadedTeams = fallbackTeams;
    } else {
      loadedTeams = teamsSnap.docs.map((d) => firestoreDocToTeam(d.data(), loadedPlayers));
    }

    return { players: loadedPlayers, teams: loadedTeams };
  } catch (error) {
    console.warn('Firestore initial fetch warning:', error);
    return null;
  }
}

export async function signInMasterOwnerWithGoogle(): Promise<{
  success: boolean;
  email?: string | null;
  error?: string;
}> {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    const email = res.user?.email?.toLowerCase() || '';
    if (email === 'roypriyam950@gmail.com' || email === 'priyam1.3.2008@gmail.com') {
      return { success: true, email };
    }
    return {
      success: false,
      error: `Signed in as ${email}, which is not an authorized Master Owner email.`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Google Sign-In cancelled or failed.',
    };
  }
}
