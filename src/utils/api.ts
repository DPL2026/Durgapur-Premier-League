// Backend Database API Service for Owner Board and Website Sync
import { Team, Player, AuctionSettings, AuctionHistoryItem } from '../types';

export interface DatabasePayload {
  teams: Team[];
  players: Player[];
  history?: AuctionHistoryItem[];
  settings?: AuctionSettings;
  lastUpdated?: string;
}

export const dbApi = {
  // Fetch latest database state from backend
  async getDatabase(): Promise<{ success: boolean; data?: DatabasePayload; error?: string }> {
    try {
      const res = await fetch('/api/database');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return { success: true, data: json.data };
    } catch (err: any) {
      // Backend not running or endpoint unavailable
      return { success: false, error: err.message };
    }
  },

  // Sync entire state to backend database
  async syncDatabase(payload: DatabasePayload): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/database/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, lastUpdated: new Date().toISOString() })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return { success: json.success };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // Update a team's logo, colors, purse, or details
  async updateTeam(teamId: string, updates: Partial<Team>): Promise<boolean> {
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Add a new team
  async addTeam(team: Team): Promise<boolean> {
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(team)
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Delete a team
  async deleteTeam(teamId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Create or add a player
  async addPlayer(player: Player): Promise<boolean> {
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(player)
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Update a player's image, role, stats, price, or details
  async updatePlayer(playerId: string, updates: Partial<Player>): Promise<boolean> {
    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Delete a player
  async deletePlayer(playerId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Reset database on backend
  async resetDatabase(): Promise<boolean> {
    try {
      const res = await fetch('/api/database/reset', { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Verify Team Owner or Master Owner Hidden Code via Backend
  async verifyOwnerCode(
    code: string,
    teamId?: string,
    email?: string
  ): Promise<{
    success: boolean;
    role?: 'master_owner' | 'team_owner';
    teamId?: string | null;
    authCode?: string;
    error?: string;
  }> {
    const cleanCode = (code || '').trim();
    try {
      const res = await fetch('/api/owner/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, teamId, email })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        return json;
      }
      if (res.status === 401 || res.status === 403) {
        return { success: false, error: json.error || 'Invalid hidden owner code' };
      }
    } catch {
      // Fallback verification if offline
    }

    // Fallback check matching backend rules
    const fallbackCodes: Record<string, string> = {
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

    if (cleanCode === 'Priyam01032008@' && (!email || email.trim().toLowerCase() === 'priyam1.3.2008@gmail.com')) {
      return {
        success: true,
        role: 'master_owner',
        teamId: null,
        authCode: cleanCode
      };
    }

    if (teamId) {
      const valid =
        fallbackCodes[teamId] === cleanCode ||
        (teamId === 'team_dr' && cleanCode === 'DR360@');
      if (valid) {
        return {
          success: true,
          role: 'team_owner',
          teamId,
          authCode: cleanCode
        };
      }
      return { success: false, error: 'Invalid hidden owner code for this franchise' };
    }

    if (cleanCode === 'DR360@') {
      return { success: true, role: 'team_owner', teamId: 'team_dr', authCode: cleanCode };
    }
    for (const [tId, secret] of Object.entries(fallbackCodes)) {
      if (secret === cleanCode) {
        return { success: true, role: 'team_owner', teamId: tId, authCode: cleanCode };
      }
    }

    return { success: false, error: 'Invalid hidden owner code. Access denied.' };
  },

  // Record authenticated owner bid on backend
  async placeOwnerBid(
    teamId: string,
    code: string,
    playerId: string,
    amount: number
  ): Promise<boolean> {
    try {
      const res = await fetch('/api/owner/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, code, playerId, amount })
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Backend Owner-only Refund & Re-auction
  async refundPlayerSale(playerId: string, ownerAuth: string): Promise<boolean> {
    try {
      const res = await fetch('/api/owner/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, ownerAuth })
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Backend Owner-only Re-auction
  async reauctionPlayer(playerId: string, ownerAuth: string): Promise<boolean> {
    try {
      const res = await fetch('/api/owner/reauction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, ownerAuth })
      });
      return res.ok;
    } catch {
      return false;
    }
  }
};
