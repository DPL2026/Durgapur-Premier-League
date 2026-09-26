import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Increase payload limit for base64 image uploads (team logos & player photos)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
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

function isAuthorizedOwner(authTokenOrCode?: string): boolean {
  const clean = (authTokenOrCode || '').trim();
  if (!clean) return false;
  if (clean === MASTER_OWNER_PASS || clean === 'MASTER_OWNER_AUTH') return true;
  return Boolean(findTeamByCode(clean));
}

// ---------------- REST API ENDPOINTS ---------------- //

// POST verify franchise owner hidden code login
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
  const { playerId, ownerAuth } = req.body || {};
  if (!isAuthorizedOwner(ownerAuth)) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: Only a logged-in Owner in the backend can refund and re-auction players.'
    });
  }

  const db = readDatabase();
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

      saveDatabase(db);
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
  const { playerId, ownerAuth } = req.body || {};
  if (!isAuthorizedOwner(ownerAuth)) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: Only a logged-in Owner in the backend can re-auction players.'
    });
  }

  const db = readDatabase();
  if (db && Array.isArray(db.players)) {
    db.players = db.players.map((p: any) =>
      p.id === playerId
        ? { ...p, status: 'available', soldPrice: undefined, soldTo: undefined }
        : p
    );
    if (Array.isArray(db.history)) {
      db.history = db.history.filter((h: any) => h.player?.id !== playerId);
    }
    saveDatabase(db);
  }

  return res.json({
    success: true,
    data: db,
    message: 'Player re-entered into the auction pool.'
  });
});

// GET database snapshot
app.get('/api/database', (_req, res) => {
  const db = readDatabase();
  res.json({
    success: true,
    data: db,
    timestamp: new Date().toISOString()
  });
});

// POST sync whole database snapshot from Owner Board or Client
app.post('/api/database/sync', (req, res) => {
  const payload = req.body;
  if (!payload || !payload.teams || !payload.players) {
    return res.status(400).json({ success: false, error: 'Invalid database payload' });
  }

  const success = saveDatabase(payload);
  res.json({
    success,
    message: success ? 'Database successfully saved to backend storage' : 'Failed to write DB',
    timestamp: new Date().toISOString()
  });
});

// POST create a new team
app.post('/api/teams', (req, res) => {
  const newTeam = req.body;
  const db = readDatabase() || { teams: [], players: [] };
  if (!db.teams) db.teams = [];
  db.teams.push(newTeam);
  saveDatabase(db);
  res.json({ success: true, team: newTeam });
});

// DELETE team
app.delete('/api/teams/:id', (req, res) => {
  const teamId = req.params.id;
  const db = readDatabase() || {};
  if (Array.isArray(db.teams)) {
    db.teams = db.teams.filter((t: any) => t.id !== teamId);
    saveDatabase(db);
    return res.json({ success: true, message: 'Team deleted' });
  }
  res.status(404).json({ success: false, error: 'Teams collection not found' });
});

// POST update specific team
app.post('/api/teams/:id', (req, res) => {
  const teamId = req.params.id;
  const updates = req.body;
  const db = readDatabase() || {};

  if (Array.isArray(db.teams)) {
    const idx = db.teams.findIndex((t: any) => t.id === teamId);
    if (idx !== -1) {
      db.teams[idx] = { ...db.teams[idx], ...updates };
      saveDatabase(db);
      return res.json({ success: true, team: db.teams[idx] });
    }
  }

  res.status(404).json({ success: false, error: 'Team not found' });
});

// POST create or update player
app.post('/api/players', (req, res) => {
  const newPlayer = req.body;
  const db = readDatabase() || { teams: [], players: [] };

  if (!db.players) db.players = [];
  db.players.push(newPlayer);
  saveDatabase(db);

  res.json({ success: true, player: newPlayer });
});

// PUT update player
app.put('/api/players/:id', (req, res) => {
  const playerId = req.params.id;
  const updates = req.body;
  const db = readDatabase() || {};

  if (Array.isArray(db.players)) {
    const idx = db.players.findIndex((p: any) => p.id === playerId);
    if (idx !== -1) {
      db.players[idx] = { ...db.players[idx], ...updates };
      saveDatabase(db);
      return res.json({ success: true, player: db.players[idx] });
    }
  }

  res.status(404).json({ success: false, error: 'Player not found' });
});

// DELETE player
app.delete('/api/players/:id', (req, res) => {
  const playerId = req.params.id;
  const db = readDatabase() || {};

  if (Array.isArray(db.players)) {
    db.players = db.players.filter((p: any) => p.id !== playerId);
    saveDatabase(db);
    return res.json({ success: true, message: 'Player deleted' });
  }

  res.status(404).json({ success: false, error: 'Players collection not found' });
});

// POST reset database
app.post('/api/database/reset', (_req, res) => {
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
