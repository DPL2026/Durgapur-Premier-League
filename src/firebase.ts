import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

import {
  getFirestore,
  doc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  deleteField,
} from 'firebase/firestore';

import firebaseConfig from '../firebase-applet-config.json';
import { OWNER_UPLOADED_PHOTOS } from './data/uploadedPhotos';
import { Player, PlayerRole, Team } from './types';

const env = (import.meta as any).env || {};

/**
 * Firebase configuration
 *
 * GitHub Actions/Vite environment variables are used first.
 * The local firebase-applet-config.json is used as fallback.
 */
export const resolvedFirebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain:
    env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId:
    env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket:
    env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId:
    env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    firebaseConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,

  firestoreDatabaseId:
    env.VITE_FIREBASE_DATABASE_ID ||
    firebaseConfig.firestoreDatabaseId,

  oAuthClientId:
    env.VITE_FIREBASE_OAUTH_CLIENT_ID ||
    firebaseConfig.oAuthClientId ||
    '',
};

/**
 * Required environment variables
 */
export const REQUIRED_FIREBASE_ENV_VARS: Record<string, string> = {
  VITE_FIREBASE_API_KEY: firebaseConfig.apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  VITE_FIREBASE_STORAGE_BUCKET: firebaseConfig.storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID:
    firebaseConfig.messagingSenderId,
  VITE_FIREBASE_APP_ID: firebaseConfig.appId,
  VITE_FIREBASE_DATABASE_ID:
    firebaseConfig.firestoreDatabaseId || '',
  VITE_FIREBASE_OAUTH_CLIENT_ID:
    firebaseConfig.oAuthClientId || '',
};

/**
 * Initialize Firebase
 */
const app = initializeApp(resolvedFirebaseConfig);

/**
 * IMPORTANT:
 * Use the default Firestore database.
 *
 * This avoids accidentally connecting to a wrong database ID.
 */
export const db = getFirestore(app);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

/* =========================================================
   PLAYER HELPERS
   ========================================================= */

function playerToFirestoreDoc(player: Player) {
  return {
    ...player,
    visibility: 'public',
    updatedAt: Date.now(),
  };
}

/**
 * Save a player to Firestore
 */
export async function savePlayerToFirestore(
  player: Player
): Promise<void> {
  const playerRef = doc(db, 'players', player.id);

  await setDoc(
    playerRef,
    playerToFirestoreDoc(player),
    { merge: true }
  );
}

/**
 * Update player auction information
 */
export async function updatePlayerAuctionInFirestore(
  playerId: string,
  updates: Partial<Player>
): Promise<void> {
  const playerRef = doc(db, 'players', playerId);

  await updateDoc(playerRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

/**
 * Delete player
 */
export async function deletePlayerFromFirestore(
  playerId: string
): Promise<void> {
  const playerRef = doc(db, 'players', playerId);

  await deleteDoc(playerRef);
}

/* =========================================================
   TEAM HELPERS
   ========================================================= */

function teamToFirestoreDoc(team: Team) {
  return {
    ...team,
    visibility: 'public',
    updatedAt: Date.now(),
  };
}

/**
 * Save team to Firestore
 */
export async function saveTeamToFirestore(
  team: Team
): Promise<void> {
  const teamRef = doc(db, 'teams', team.id);

  await setDoc(
    teamRef,
    teamToFirestoreDoc(team),
    { merge: true }
  );
}

/**
 * Update team purse
 */
export async function updateTeamPurseInFirestore(
  teamId: string,
  purse: number
): Promise<void> {
  const teamRef = doc(db, 'teams', teamId);

  await updateDoc(teamRef, {
    purse,
    updatedAt: Date.now(),
  });
}

/**
 * Update team
 */
export async function updateTeamInFirestore(
  teamId: string,
  updates: Partial<Team>
): Promise<void> {
  const teamRef = doc(db, 'teams', teamId);

  await updateDoc(teamRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

/**
 * Delete team
 */
export async function deleteTeamFromFirestore(
  teamId: string
): Promise<void> {
  const teamRef = doc(db, 'teams', teamId);

  await deleteDoc(teamRef);
}

/* =========================================================
   REALTIME PLAYERS
   ========================================================= */

/**
 * Subscribe to public players.
 *
 * Every device/user receives Firestore updates automatically.
 */
export function subscribeToPublicPlayers(
  callback: (players: Player[]) => void,
  onError?: (error: Error) => void
) {
  const playersRef = collection(db, 'players');

  const playersQuery = query(
    playersRef,
    where('visibility', '==', 'public')
  );

  return onSnapshot(
    playersQuery,
    (snapshot) => {
      const players: Player[] = snapshot.docs.map(
        (snapshotDoc) =>
          snapshotDoc.data() as Player
      );

      callback(players);
    },
    (error) => {
      console.error(
        'Firestore players subscription error:',
        error
      );

      onError?.(error);
    }
  );
}

/* =========================================================
   REALTIME TEAMS
   ========================================================= */

export function subscribeToPublicTeams(
  callback: (teams: Team[]) => void,
  onError?: (error: Error) => void
) {
  const teamsRef = collection(db, 'teams');

  const teamsQuery = query(
    teamsRef,
    where('visibility', '==', 'public')
  );

  return onSnapshot(
    teamsQuery,
    (snapshot) => {
      const teams: Team[] = snapshot.docs.map(
        (snapshotDoc) =>
          snapshotDoc.data() as Team
      );

      callback(teams);
    },
    (error) => {
      console.error(
        'Firestore teams subscription error:',
        error
      );

      onError?.(error);
    }
  );
}

/* =========================================================
   INITIAL LOAD / SEED
   ========================================================= */

export async function fetchOrSeedFirestore(
  initialPlayers: Player[],
  initialTeams: Team[]
): Promise<{
  players: Player[];
  teams: Team[];
}> {
  const playersRef = collection(db, 'players');

  const playersQuery = query(
    playersRef,
    where('visibility', '==', 'public')
  );

  const playersSnapshot =
    await getDocs(playersQuery);

  let players: Player[];

  if (playersSnapshot.empty) {
    players = initialPlayers;

    for (const player of initialPlayers) {
      await savePlayerToFirestore(player);
    }
  } else {
    players = playersSnapshot.docs.map(
      (snapshotDoc) =>
        snapshotDoc.data() as Player
    );
  }

  const teamsRef = collection(db, 'teams');

  const teamsQuery = query(
    teamsRef,
    where('visibility', '==', 'public')
  );

  const teamsSnapshot =
    await getDocs(teamsQuery);

  let teams: Team[];

  if (teamsSnapshot.empty) {
    teams = initialTeams;

    for (const team of initialTeams) {
      await saveTeamToFirestore(team);
    }
  } else {
    teams = teamsSnapshot.docs.map(
      (snapshotDoc) =>
        snapshotDoc.data() as Team
    );
  }

  return {
    players,
    teams,
  };
}

/* =========================================================
   OWNER UPLOADED PHOTOS
   ========================================================= */

/**
 * Save owner uploaded photo information
 * to the player document.
 */
export async function savePlayerPhotoToFirestore(
  playerId: string,
  photoUrl: string
): Promise<void> {
  const playerRef = doc(db, 'players', playerId);

  await updateDoc(playerRef, {
    photo: photoUrl,
    updatedAt: Date.now(),
  });
}

/**
 * Remove player photo.
 */
export async function removePlayerPhotoFromFirestore(
  playerId: string
): Promise<void> {
  const playerRef = doc(db, 'players', playerId);

  await updateDoc(playerRef, {
    photo: deleteField(),
    updatedAt: Date.now(),
  });
}

/* =========================================================
   IMAGE COMPRESSION
   ========================================================= */

export async function compressImage(
  file: File,
  maxWidth = 1000,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          const ratio = maxWidth / width;

          width = maxWidth;
          height = Math.round(height * ratio);
        }

        const canvas =
          document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(
            new Error(
              'Could not create canvas context'
            )
          );
          return;
        }

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height
        );

        const result =
          canvas.toDataURL(
            'image/jpeg',
            quality
          );

        resolve(result);
      };

      img.onerror = () => {
        reject(
          new Error('Could not load image')
        );
      };

      img.src = reader.result as string;
    };

    reader.onerror = () => {
      reject(
        new Error('Could not read image')
      );
    };

    reader.readAsDataURL(file);
  });
}

/* =========================================================
   GOOGLE AUTH
   ========================================================= */

export async function signInWithGoogle() {
  const { signInWithPopup } =
    await import('firebase/auth');

  return signInWithPopup(
    auth,
    googleProvider
  );
}
