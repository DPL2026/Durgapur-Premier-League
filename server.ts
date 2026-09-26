import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// Ensure data and uploads directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Increase payload limit for base64 image uploads (team logos & player photos)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded images statically to all website users
app.use(
  '/uploads',
  express.static(UPLOADS_DIR, {
    maxAge: '7d',
    etag: true
  })
);

// Extract base64 data:image/... into a persistent file in /data/uploads/ and return /uploads/<filename>
function persistBase64Image(dataUrlOrPath: string | undefined, prefix: string): string | undefined {
  if (!dataUrlOrPath || typeof dataUrlOrPath !== 'string') return undefined;
  const trimmed = dataUrlOrPath.trim();
  if (!trimmed) return undefined;

  // Keep SVG data URLs or external/static URLs as-is
  if (!trimmed.startsWith('data:image/') || trimmed.startsWith('data:image/svg+xml')) {
    return trimmed;
  }

  const match = trimmed.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,([\s\S]+)$/);
  if (!match) return trimmed;

  const rawExt = match[1].toLowerCase();
  const base64Data = match[2].replace(/\s/g, '');
  const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;

  try {
    const hash = crypto.createHash('md5').update(base64Data).digest('hex').slice(0, 12);
    const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safePrefix}_${hash}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);
    }
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('Failed to persist base64 image:', err);
    return trimmed;
  }
}

// Normalize database: extract base64 images to /uploads/ and ensure team rosters match sold players
function normalizeDatabase(db: any): any {
  if (!db || typeof db !== 'object') return db;

  if (Array.isArray(db.players)) {
    db.players = db.players.map((p: any, idx: number) => {
      if (!p) return p;
      const pid = p.id || `ply_${idx}`;
      const normalizedPhoto = persistBase64Image(p.photo, `player_${pid}`);
      return {
        ...p,
        id: pid,
        photo: normalizedPhoto
      };
    });
  }

  if (Array.isArray(db.teams)) {
    const soldPlayersByTeam: Record<string, string[]> = {};
    const soldOverseasByTeam: Record<string, number> = {};

    if (Array.isArray(db.players)) {
      for (const p of db.players) {
        if (p && p.status === 'sold' && p.soldTo) {
          if (!soldPlayersByTeam[p.soldTo]) soldPlayersByTeam[p.soldTo] = [];
          if (!soldPlayersByTeam[p.soldTo].includes(p.id)) {
            soldPlayersByTeam[p.soldTo].push(p.id);
            if (p.isOverseas) {
              soldOverseasByTeam[p.soldTo] = (soldOverseasByTeam[p.soldTo] || 0) + 1;
            }
          }
        }
      }
    }

    db.teams = db.teams.map((t: any, idx: number) => {
      if (!t) return t;
      const tid = t.id || `team_${idx}`;
      const normalizedLogo = persistBase64Image(t.logoUrl, `team_${tid}`);
      const validSoldPlayers = soldPlayersByTeam[tid] || [];
      return {
        ...t,
        id: tid,
        logoUrl: normalizedLogo,
        players: validSoldPlayers,
        overseasPlayers: soldOverseasByTeam[tid] || 0
      };
    });
  }

  if (Array.isArray(db.history)) {
    db.history = db.history.map((h: any) => {
      if (!h || !h.player) return h;
      const pid = h.player.id || 'hist';
      return {
        ...h,
        player: {
          ...h.player,
          photo: persistBase64Image(h.player.photo, `player_${pid}`)
        }
      };
    });
  }

  return db;
}

// Helper to read DB
function readDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
  return null;
}

// Helper to save DB
function saveDatabase(data: any) {
  try {
    const normalized = normalizeDatabase(data);
    normalized.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(normalized, null, 2), 'utf-8');
    return normalized;
  } catch (err) {
    console.error('Error writing database file:', err);
    return null;
  }
}

// Normalize existing database on startup so any large base64 images are immediately moved to /uploads/
const initialDbOnBoot = readDatabase();
if (initialDbOnBoot) {
  saveDatabase(initialDbOnBoot);
}

// Secret Hidden Codes for Franchise Team Owners (Backend-Verified)
const TEAM_OWNER_CODES: Record<string, string> = {
  team_rcd: 'RCD367@',
  team_dsk: 'DSK387@',
  team_dkr: 'DKR358@',
  team_dr: 'DRR360@',
  team_dt: 'DT361@',
  team_dsr: 'DSR362@',
  team_dc: 'DC363@',
  team_di: 'DI364@',
  team_dw: 'DW365@',
  team_dkxi: 'DKXI366@'
};

const MASTER_OWNER_EMAIL = 'priyam1.3.2008@gmail.com';
const MASTER_OWNER_PASS = 'Priyam01032008@';

function verifyTeamCode(teamId: string, code: string): boolean {
  const cleanCode = (code || '').trim();
  if (cleanCode === MASTER_OWNER_PASS) return true;
  if (teamId === 'team_dr' && (cleanCode === 'DRR360@' || cleanCode === 'DR360@')) {
    return true;
  }
  return TEAM_OWNER_CODES[teamId] === cleanCode;
}

function findTeamByCode(code: string): string | null {
  const cleanCode = (code || '').trim();
  if (cleanCode === 'DR360@') return 'team_dr';
  for (const [tId, secret] of Object.entries(TEAM_OWNER_CODES)) {
    if (secret === cleanCode) return tId;
  }
  return null;
}

function isMasterOwner(authTokenOrCode?: string): boolean {
  const clean = (authTokenOrCode || '').trim();
  return clean === MASTER_OWNER_PASS || clean === 'MASTER_OWNER_AUTH';
}

function isAuthorizedOwner(authTokenOrCode?: string): boolean {
  const clean = (authTokenOrCode || '').trim();
  if (!clean) return false;
  if (isMasterOwner(clean)) return true;
  return Boolean(findTeamByCode(clean));
}

function extractOwnerAuth(req: express.Request): string {
  const headerAuth = req.headers['x-owner-auth'];
  if (typeof headerAuth === 'string' && headerAuth.trim()) {
    return headerAuth.trim();
  }
  if (req.body && typeof req.body.ownerAuth === 'string') {
    return req.body.ownerAuth.trim();
  }
  return '';
}

// ---------------- REST API ENDPOINTS ---------------- //

// POST verify franchise owner hidden code login or master owner login
app.post('/api/owner/verify-code', (req, res) => {
  const { code, teamId, email } = req.body || {};
  const cleanCode = (code || '').trim();

  // Check if Master Commissioner login
  if (
    email &&
    email.trim().toLowerCase() === MASTER_OWNER_EMAIL &&
    cleanCode === MASTER_OWNER_PASS
  ) {
    return res.json({
      success: true,
      role: 'master_owner',
      teamId: null,
      authCode: MASTER_OWNER_PASS,
      message: 'Master Owner authenticated'
    });
  }

  // If a specific teamId was requested, verify code matches that team
  if (teamId) {
    if (verifyTeamCode(teamId, cleanCode)) {
      return res.json({
        success: true,
        role: 'team_owner',
        teamId,
        authCode: cleanCode,
        message: 'Franchise Owner authenticated'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid hidden owner code for this franchise'
    });
  }

  // Otherwise auto-detect team from hidden code
  const matchedTeamId = findTeamByCode(cleanCode);
  if (matchedTeamId) {
    return res.json({
      success: true,
      role: 'team_owner',
      teamId: matchedTeamId,
      authCode: cleanCode,
      message: 'Franchise Owner authenticated'
    });
  }

  // Also allow master password directly
  if (cleanCode === MASTER_OWNER_PASS) {
    return res.json({
      success: true,
      role: 'master_owner',
      teamId: null,
      authCode: MASTER_OWNER_PASS,
      message: 'Master Owner authenticated'
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid hidden owner code. Access denied.'
  });
});

// POST Master Owner image upload endpoint -> saves to /data/uploads/ and returns public /uploads/... URL
app.post('/api/owner/upload-image', (req, res) => {
  const ownerAuth = extractOwnerAuth(req);
  if (!isMasterOwner(ownerAuth)) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: Only the Master Owner can upload player pictures and logos.'
    });
  }

  const { imageData, prefix } = req.body || {};
  if (!imageData || typeof imageData !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing imageData' });
  }

  const url = persistBase64Image(imageData, prefix || 'upload');
  return res.json({
    success: true,
    url
  });
});

// POST authenticated owner bid placement
app.post('/api/owner/bid', (req, res) => {
  const { teamId, code, playerId, amount } = req.body || {};
  if (!teamId || !verifyTeamCode(teamId, code)) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized bid: Valid franchise owner hidden code required.'
    });
  }

  return res.json({
    success: true,
    teamId,
    playerId,
    amount,
    timestamp: new Date().toISOString()
  });
});

// POST backend owner-only refund & re-auction
app.post('/api/owner/refund', (req, res) => {
  const { playerId } = req.body || {};
  const ownerAuth = extractOwnerAuth(req);
  if (!isAuthorizedOwner(ownerAuth)) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: Only a logged-in Owner in the backend can refund and re-auction players.'
    });
  }

  let db = readDatabase();
  if (db && Array.isArray(db.players) && Array.isArray(db.teams)) {
    const targetPlayer = db.players.find((p: any) => p.id === playerId);
    if (targetPlayer) {
      const refundTeamId = targetPlayer.soldTo;
      const refundAmount = targetPlayer.soldPrice || 0;

      if (refundTeamId) {
        db.teams = db.teams.map((t: any) => {
          if (t.id === refundTeamId) {
            return {
              ...t,
              purse: Math.min(t.initialPurse || 60000, (t.purse || 0) + refundAmount),
              players: (t.players || []).filter((id: string) => id !== playerId),
              overseasPlayers: targetPlayer.isOverseas
                ? Math.max(0, (t.overseasPlayers || 0) - 1)
                : t.overseasPlayers || 0
            };
          }
          return t;
        });
      }

      db.players = db.players.map((p: any) =>
        p.id === playerId
          ? { ...p, status: 'available', soldPrice: undefined, soldTo: undefined }
          : p
      );

      if (Array.isArray(db.history)) {
        db.history = db.history.filter((h: any) => h.player?.id !== playerId);
      }

      db = saveDatabase(db);
    }
  }

  return res.json({
    success: true,
    data: db,
    message: 'Player sale cancelled, team purse refunded, and player re-entered into auction.'
  });
});

// POST backend owner-only re-auction for unsold/sold player
app.post('/api/owner/reauction', (req, res) => {
  const { playerId } = req.body || {};
  const ownerAuth = extractOwnerAuth(req);
  if (!isAuthorizedOwner(ownerAuth)) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: Only a logged-in Owner in the backend can re-auction players.'
    });
  }

  let db = readDatabase();
  if (db && Array.isArray(db.players)) {
    db.players = db.players.map((p: any) =>
      p.id === playerId
        ? { ...p, status: 'available', soldPrice: undefined, soldTo: undefined }
        : p
    );
    if (Array.isArray(db.history)) {
      db.history = db.history.filter((h: any) => h.player?.id !== playerId);
    }
    db = saveDatabase(db);
  }

  return res.json({
    success: true,
    data: db,
    message: 'Player re-entered into the auction pool.'
  });
});

// GET database snapshot (Public: Every website user can view the Owner's uploaded pictures and player details)
app.get('/api/database', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const db = readDatabase();
  res.json({
    success: true,
    data: db,
    timestamp: new Date().toISOString()
  });
});

// POST sync database snapshot (Restricted to Authenticated Owners; non-Master Owners can only sync auction status/bids, never overwrite uploaded photos/details)
app.post('/api/database/sync', (req, res) => {
  const ownerAuth = extractOwnerAuth(req);
  if (!isAuthorizedOwner(ownerAuth)) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: Only authenticated owners can sync state to the database.'
    });
  }

  const payload = req.body;
  if (!payload || !Array.isArray(payload.teams) || !Array.isArray(payload.players)) {
    return res.status(400).json({ success: false, error: 'Invalid database payload' });
  }

  const existingDb = readDatabase();
  const masterMode = isMasterOwner(ownerAuth);

  let mergedPlayers = payload.players;
  let mergedTeams = payload.teams;

  if (existingDb && Array.isArray(existingDb.players)) {
    if (!masterMode) {
      // Franchise Owner syncing live auction state: keep Master Owner's player list, photos, and details intact; only update auction status/soldPrice/soldTo
      const incomingMap = new Map(payload.players.map((p: any) => [p.id, p]));
      mergedPlayers = existingDb.players.map((existingPlayer: any) => {
        const inc: any = incomingMap.get(existingPlayer.id);
        if (!inc) return existingPlayer;
        return {
          ...existingPlayer,
          status: inc.status ?? existingPlayer.status,
          soldPrice: inc.soldPrice,
          soldTo: inc.soldTo
        };
      });
    } else {
      // Master Owner syncing: preserve existing uploaded photo if incoming payload didn't explicitly replace it
      const existingMap = new Map(existingDb.players.map((p: any) => [p.id, p]));
      mergedPlayers = payload.players.map((incPlayer: any) => {
        const prev: any = existingMap.get(incPlayer.id);
        return {
          ...incPlayer,
          photo: incPlayer.photo || prev?.photo
        };
      });
    }
  }

  if (existingDb && Array.isArray(existingDb.teams) && !masterMode) {
    const incomingTeamMap = new Map(payload.teams.map((t: any) => [t.id, t]));
    mergedTeams = existingDb.teams.map((existingTeam: any) => {
      const inc: any = incomingTeamMap.get(existingTeam.id);
      if (!inc) return existingTeam;
      return {
        ...existingTeam,
        purse: inc.purse ?? existingTeam.purse,
        players: inc.players ?? existingTeam.players,
        overseasPlayers: inc.overseasPlayers ?? existingTeam.overseasPlayers
      };
    });
  }

  const saved = saveDatabase({
    teams: mergedTeams,
    players: mergedPlayers,
    history: payload.history ?? existingDb?.history ?? [],
    settings: payload.settings ?? existingDb?.settings
  });

  res.json({
    success: Boolean(saved),
    data: saved,
    message: saved ? 'Database successfully saved to backend storage' : 'Failed to write DB',
    timestamp: new Date().toISOString()
  });
});

// POST create a new team (Master Owner Only)
app.post('/api/teams', (req, res) => {
  const ownerAuth = extractOwnerAuth(req);
  if (!isMasterOwner(ownerAuth)) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: Only the Master Owner can add new franchises.'
    });
  }

  const newTeam = req.body;
  const db = readDatabase() || { teams: [], players: [] };
  if (!db.teams) db.teams = [];
  db.teams.push(newTeam);
  const saved = saveDatabase(db);
  res.json({ success: true, team: saved?.teams?.find((t: any) => t.id === newTeam.id) || newTeam, data: saved });
});

// DELETE team (Master Owner Only)
app.delete('/api/teams/:id', (req, res) => {
  const ownerAuth = extractOwnerAuth(req);
  if (!isMasterOwner(ownerAuth)) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: Only the Master Owner can delete franchises.'
    });
  }

  const teamId = req.params.id;
  const db = readDatabase() || {};
  if (Array.isArray(db.teams)) {
    db.teams = db.teams.filter((t: any) => t.id !== teamId);
    const saved = saveDatabase(db);
    return res.json({ success: true, message: 'Team deleted', data: saved });
  }
  res.status(404).json({ success: false, error: 'Teams collection not found' });
});

// POST update specific team (Master Owner Only)
app.post('/api/teams/:id', (req, res) => {
  const ownerAuth = extractOwnerAuth(req);
  if (!isMasterOwner(ownerAuth)) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: Only the Master Owner can update franchise details and logos.'
    });
  }

  const teamId = req.params.id;
  const updates = req.body;
  const db = readDatabase() || {};

  if (Array.isArray(db.teams)) {
    const idx = db.teams.findIndex((t: any) => t.id === teamId);
    if (idx !== -1) {
      db.teams[idx] = { ...db.teams[idx], ...updates };
      const saved = saveDatabase(db);
      return res.json({ success: true, team: saved?.teams?.[idx] || db.teams[idx], data: saved });
    }
  }

  res.status(404).json({ success: false, error: 'Team not found' });
});

// POST create a new player with uploaded photo & details (Master Owner Only)
app.post('/api/players', (req, res) => {
  const ownerAuth = extractOwnerAuth(req);
  if (!isMasterOwner(ownerAuth)) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: Only the Master Owner can upload new player details and images.'
    });
  }

  const newPlayer = req.body;
  const db = readDatabase() || { teams: [], players: [] };

  if (!db.players) db.players = [];
  // Put newly uploaded player at top of registry
  db.players = [newPlayer, ...db.players.filter((p: any) => p.id !== newPlayer.id)];
  const saved = saveDatabase(db);
  const savedPlayer = saved?.players?.find((p: any) => p.id === newPlayer.id) || newPlayer;

  res.json({ success: true, player: savedPlayer, data: saved });
});

// PUT update player details & uploaded photo (Master Owner Only)
app.put('/api/players/:id', (req, res) => {
  const ownerAuth = extractOwnerAuth(req);
  if (!isMasterOwner(ownerAuth)) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: Only the Master Owner can update player details and images.'
    });
  }

  const playerId = req.params.id;
  const updates = req.body;
  const db = readDatabase() || { teams: [], players: [] };

  if (!Array.isArray(db.players)) db.players = [];
  const idx = db.players.findIndex((p: any) => p.id === playerId);
  if (idx !== -1) {
    db.players[idx] = { ...db.players[idx], ...updates };
  } else {
    db.players.push({ ...updates, id: playerId });
  }

  const saved = saveDatabase(db);
  const savedPlayer = saved?.players?.find((p: any) => p.id === playerId);
  return res.json({ success: true, player: savedPlayer, data: saved });
});

// DELETE player (Master Owner Only)
app.delete('/api/players/:id', (req, res) => {
  const ownerAuth = extractOwnerAuth(req);
  if (!isMasterOwner(ownerAuth)) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: Only the Master Owner can delete players.'
    });
  }

  const playerId = req.params.id;
  const db = readDatabase() || {};

  if (Array.isArray(db.players)) {
    db.players = db.players.filter((p: any) => p.id !== playerId);
    const saved = saveDatabase(db);
    return res.json({ success: true, message: 'Player deleted', data: saved });
  }

  res.status(404).json({ success: false, error: 'Players collection not found' });
});

// POST reset database (Master Owner Only)
app.post('/api/database/reset', (req, res) => {
  const ownerAuth = extractOwnerAuth(req);
  if (!isMasterOwner(ownerAuth)) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: Only the Master Owner can reset the database.'
    });
  }

  try {
    if (fs.existsSync(DB_FILE)) {
      fs.unlinkSync(DB_FILE);
    }
    res.json({ success: true, message: 'Database reset to initial defaults' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reset DB' });
  }
});

// ---------------- VITE MIDDLEWARE / STATIC FILES ---------------- //

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`DPL Auction Server running on port ${PORT}`);
  });
}

startServer();
