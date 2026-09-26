import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from "firebase/auth";

import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";

import type { Player, Team } from "./types";

/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/* =========================================================
   FIREBASE INITIALIZATION
   ========================================================= */

let app: FirebaseApp;

if (getApps().length > 0) {
  app = getApps()[0];
} else {
  app = initializeApp(firebaseConfig);
}

export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

/* =========================================================
   GOOGLE LOGIN
   ========================================================= */

export async function signInMasterOwnerWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/* =========================================================
   IMAGE COMPRESSION
   Supports:
   - File
   - data:image/... string
   ========================================================= */

export async function compressImageToDataUrl(
  input: File | string,
  maxWidth = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    const loadImage = (src: string) => {
      const image = new Image();

      image.onload = () => {
        let width = image.width;
        let height = image.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Unable to create canvas context"));
          return;
        }

        ctx.drawImage(image, 0, 0, width, height);

        const result = canvas.toDataURL("image/jpeg", quality);

        resolve(result);
      };

      image.onerror = () => {
        reject(new Error("Unable to load image"));
      };

      image.src = src;
    };

    if (typeof input === "string") {
      loadImage(input);
      return;
    }

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Unable to read image"));
        return;
      }

      loadImage(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("Unable to read image file"));
    };

    reader.readAsDataURL(input);
  });
}

/* =========================================================
   FIRESTORE COLLECTIONS
   ========================================================= */

const PLAYERS_COLLECTION = "players";
const TEAMS_COLLECTION = "teams";

/* =========================================================
   HELPERS
   ========================================================= */

function cleanFirestoreData<T extends Record<string, any>>(data: T): T {
  const cleaned: Record<string, any> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  });

  return cleaned as T;
}

function normalizePlayer(
  data: DocumentData,
  fallbackId?: string
): Player {
  return {
    ...data,
    id: data.id || fallbackId || "",
  } as Player;
}

/* =========================================================
   TEAM CONVERSION
   ========================================================= */

export function firestoreDocToTeam(
  docData: DocumentData,
  players: Player[] = []
): Team {
  const teamId = String(docData.id || "");

  const playerIds = Array.isArray(docData.players)
    ? docData.players
    : [];

  const retainedIds = Array.isArray(docData.retainedPlayers)
    ? docData.retainedPlayers
    : [];

  /*
   * Keep player IDs exactly as stored in Firestore.
   * This is important because App.tsx uses team.players
   * as player IDs.
   */

  const team: Team = {
    id: teamId,
    name: docData.name || "",
    shortCode: docData.shortCode || "",
    primaryColor: docData.primaryColor || "#000000",
    secondaryColor: docData.secondaryColor || "#FFFFFF",
    motto: docData.motto || "",

    logoUrl: docData.logoUrl || "",

    purse:
      typeof docData.purse === "number"
        ? docData.purse
        : 60000,

    initialPurse:
      typeof docData.initialPurse === "number"
        ? docData.initialPurse
        : 60000,

    players: playerIds,

    retainedPlayers: retainedIds,

    overseasPlayers:
      typeof docData.overseasPlayers === "number"
        ? docData.overseasPlayers
        : 0,

    maxSquadSize:
      typeof docData.maxSquadSize === "number"
        ? docData.maxSquadSize
        : 18,

    maxOverseasPlayers:
      typeof docData.maxOverseasPlayers === "number"
        ? docData.maxOverseasPlayers
        : 6,

    accentColor:
      docData.accentColor || "#D4AF37",

    logoSymbol:
      docData.logoSymbol || "⚔",

    aiAggression:
      docData.aiAggression || "balanced",

    preferredRoles:
      Array.isArray(docData.preferredRoles)
        ? docData.preferredRoles
        : ["Batter", "Fast Bowler"],
  };

  return team;
}

/* =========================================================
   FETCH ALL PLAYERS
   ========================================================= */

async function fetchPlayersFromFirestore(): Promise<Player[]> {
  const snapshot = await getDocs(
    collection(db, PLAYERS_COLLECTION)
  );

  return snapshot.docs.map((item) =>
    normalizePlayer(item.data(), item.id)
  );
}

/* =========================================================
   FETCH ALL TEAMS
   ========================================================= */

async function fetchTeamsFromFirestore(): Promise<Team[]> {
  const snapshot = await getDocs(
    collection(db, TEAMS_COLLECTION)
  );

  return snapshot.docs.map((item) =>
    firestoreDocToTeam({
      ...item.data(),
      id: item.id,
    })
  );
}

/* =========================================================
   FETCH OR SEED FIRESTORE
   ========================================================= */

export async function fetchOrSeedFirestore(
  initialPlayers: Player[],
  initialTeams: Team[]
): Promise<{
  players: Player[];
  teams: Team[];
}> {
  const playersSnapshot = await getDocs(
    collection(db, PLAYERS_COLLECTION)
  );

  const teamsSnapshot = await getDocs(
    collection(db, TEAMS_COLLECTION)
  );

  /* ---------------------------------------------
     Seed players only if collection is empty
     --------------------------------------------- */

  if (playersSnapshot.empty && initialPlayers.length > 0) {
    const playerWrites = initialPlayers.map(async (player) => {
      const playerRef = doc(
        db,
        PLAYERS_COLLECTION,
        player.id
      );

      await setDoc(
        playerRef,
        cleanFirestoreData({
          ...player,
          id: player.id,
        }),
        { merge: true }
      );
    });

    await Promise.all(playerWrites);
  }

  /* ---------------------------------------------
     Seed teams only if collection is empty
     --------------------------------------------- */

  if (teamsSnapshot.empty && initialTeams.length > 0) {
    const teamWrites = initialTeams.map(async (team) => {
      const teamRef = doc(
        db,
        TEAMS_COLLECTION,
        team.id
      );

      await setDoc(
        teamRef,
        cleanFirestoreData({
          ...team,
          id: team.id,
        }),
        { merge: true }
      );
    });

    await Promise.all(teamWrites);
  }

  const players = await fetchPlayersFromFirestore();
  const teams = await fetchTeamsFromFirestore();

  return {
    players:
      players.length > 0
        ? players
        : initialPlayers,

    teams:
      teams.length > 0
        ? teams
        : initialTeams,
  };
}

/* =========================================================
   REAL-TIME PUBLIC PLAYERS
   ========================================================= */

export function subscribeToPublicPlayers(
  callback: (players: Player[]) => void
): Unsubscribe {
  const playersRef = collection(
    db,
    PLAYERS_COLLECTION
  );

  return onSnapshot(
    playersRef,
    (snapshot) => {
      const players = snapshot.docs.map((item) =>
        normalizePlayer(item.data(), item.id)
      );

      callback(players);
    },
    (error) => {
      console.error(
        "Firestore players subscription error:",
        error
      );
    }
  );
}

/* =========================================================
   REAL-TIME PUBLIC TEAMS
   ========================================================= */

export function subscribeToPublicTeams(
  callback: (teams: DocumentData[]) => void
): Unsubscribe {
  const teamsRef = collection(
    db,
    TEAMS_COLLECTION
  );

  return onSnapshot(
    teamsRef,
    (snapshot) => {
      const teams = snapshot.docs.map((item) => ({
        ...item.data(),
        id: item.id,
      }));

      callback(teams);
    },
    (error) => {
      console.error(
        "Firestore teams subscription error:",
        error
      );
    }
  );
}

/* =========================================================
   SAVE PLAYER
   ========================================================= */

export async function savePlayerToFirestore(
  player: Player,
  _authKey?: string
): Promise<Player> {
  if (!player.id) {
    throw new Error("Player ID is required");
  }

  const playerRef = doc(
    db,
    PLAYERS_COLLECTION,
    player.id
  );

  const data = cleanFirestoreData({
    ...player,
    id: player.id,
  });

  await setDoc(playerRef, data, {
    merge: true,
  });

  const saved = await getDoc(playerRef);

  if (!saved.exists()) {
    throw new Error(
      "Player could not be saved to Firestore"
    );
  }

  return normalizePlayer(
    saved.data(),
    saved.id
  );
}

/* =========================================================
   UPDATE PLAYER AUCTION
   ========================================================= */

export async function updatePlayerAuctionInFirestore(
  player: Player,
  _authKey?: string
): Promise<void> {
  if (!player.id) {
    throw new Error("Player ID is required");
  }

  const playerRef = doc(
    db,
    PLAYERS_COLLECTION,
    player.id
  );

  /*
   * Update only auction-related values.
   * Other player information remains untouched.
   */

  await setDoc(
    playerRef,
    cleanFirestoreData({
      status: player.status,
      soldPrice: player.soldPrice,
      soldTo: player.soldTo,
      id: player.id,
    }),
    {
      merge: true,
    }
  );
}

/* =========================================================
   DELETE PLAYER
   ========================================================= */

export async function deletePlayerFromFirestore(
  playerId: string
): Promise<void> {
  if (!playerId) {
    throw new Error("Player ID is required");
  }

  const playerRef = doc(
    db,
    PLAYERS_COLLECTION,
    playerId
  );

  await deleteDoc(playerRef);
}

/* =========================================================
   SAVE TEAM
   ========================================================= */

export async function saveTeamToFirestore(
  team: Team,
  _authKey?: string
): Promise<Team> {
  if (!team.id) {
    throw new Error("Team ID is required");
  }

  const teamRef = doc(
    db,
    TEAMS_COLLECTION,
    team.id
  );

  const data = cleanFirestoreData({
    ...team,
    id: team.id,
  });

  await setDoc(teamRef, data, {
    merge: true,
  });

  const saved = await getDoc(teamRef);

  if (!saved.exists()) {
    throw new Error(
      "Team could not be saved to Firestore"
    );
  }

  return firestoreDocToTeam({
    ...saved.data(),
    id: saved.id,
  });
}

/* =========================================================
   UPDATE TEAM PURSE
   ========================================================= */

export async function updateTeamPurseInFirestore(
  teamId: string,
  newPurse: number,
  newOverseasPlayers: number,
  _authKey?: string
): Promise<void> {
  if (!teamId) {
    throw new Error("Team ID is required");
  }

  const teamRef = doc(
    db,
    TEAMS_COLLECTION,
    teamId
  );

  await setDoc(
    teamRef,
    {
      purse: newPurse,
      overseasPlayers: newOverseasPlayers,
    },
    {
      merge: true,
    }
  );
}

/* =========================================================
   DELETE TEAM
   ========================================================= */

export async function deleteTeamFromFirestore(
  teamId: string
): Promise<void> {
  if (!teamId) {
    throw new Error("Team ID is required");
  }

  const teamRef = doc(
    db,
    TEAMS_COLLECTION,
    teamId
  );

  await deleteDoc(teamRef);
}

/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default app;
