// Backend Database API Service for Owner Board and Website Sync
import { Team, Player, AuctionSettings, AuctionHistoryItem } from '../types';

export interface DatabasePayload {
  teams: Team[];
  players: Player[];
  history?: AuctionHistoryItem[];
  settings?: AuctionSettings;
  lastUpdated?: string;
}

const DEFAULT_MASTER_AUTH = 'MASTER_OWNER_AUTH';

export const dbApi = {
  // Fetch latest shared database state from backend (Public for all website users)
  async getDatabase(): Promise<{ success: boolean; data?: DatabasePayload; error?: string }> {
    try {
      const res = await fetch('/api/database', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Pragma: 'no-cache',
          'Cache-Control': 'no-cache'
        }
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      return {
        success: true,
        data: json.data
      };
    } catch (err: any) {
      // Backend not running or endpoint unavailable
      return {
        success: false,
        error: err.message
      };
    }
  },

  // Sync state to backend database (Restricted to authenticated Owners)
  async syncDatabase(
    payload: DatabasePayload,
    ownerAuth?: string | null
  ): Promise<{ success: boolean; data?: DatabasePayload; error?: string }> {
    if (!ownerAuth) {
      return {
        success: false,
        error: 'Not authenticated as owner'
      };
    }

    try {
      const res = await fetch('/api/database/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-auth': ownerAuth
        },
        body: JSON.stringify({
          ...payload,
          ownerAuth,
          lastUpdated: new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      return {
        success: json.success,
        data: json.data
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message
      };
    }
  },

  // Upload player photo or team logo.
  // GitHub Pages has no /api backend, so the image data is returned directly.
  // The caller saves this image data to Firestore.
  async uploadOwnerImage(
    imageData: string,
    prefix = 'player',
    ownerAuth: string = DEFAULT_MASTER_AUTH
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      if (!imageData || !imageData.startsWith('data:image/')) {
        return {
          success: false,
          error: 'Invalid image data'
        };
      }

      return {
        success: true,
        url: imageData
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Image upload failed'
      };
    }
  },

  // Update a team's logo, colors, purse, or details (Master Owner Only)
  async updateTeam(
    teamId: string,
    updates: Partial<Team>,
    ownerAuth: string = DEFAULT_MASTER_AUTH
  ): Promise<{ success: boolean; team?: Team; data?: DatabasePayload }> {
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-auth': ownerAuth
        },
        body: JSON.stringify({
          ...updates,
          ownerAuth
        })
      });

      if (!res.ok) {
        return {
          success: false
        };
      }

      const json = await res.json();

      return {
        success: true,
        team: json.team,
        data: json.data
      };
    } catch {
      return {
        success: false
      };
    }
  },

  // Add a new team (Master Owner Only)
  async addTeam(
    team: Team,
    ownerAuth: string = DEFAULT_MASTER_AUTH
  ): Promise<{ success: boolean; team?: Team; data?: DatabasePayload }> {
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-auth': ownerAuth
        },
        body: JSON.stringify({
          ...team,
          ownerAuth
        })
      });

      if (!res.ok) {
        return {
          success: false
        };
      }

      const json = await res.json();

      return {
        success: true,
        team: json.team,
        data: json.data
      };
    } catch {
      return {
        success: false
      };
    }
  },

  // Delete a team (Master Owner Only)
  async deleteTeam(
    teamId: string,
    ownerAuth: string = DEFAULT_MASTER_AUTH
  ): Promise<{ success: boolean; data?: DatabasePayload }> {
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          'x-owner-auth': ownerAuth
        }
      });

      if (!res.ok) {
        return {
          success: false
        };
      }

      const json = await res.json();

      return {
        success: true,
        data: json.data
      };
    } catch {
      return {
        success: false
      };
    }
  },

  // Create or add a player with uploaded image & details (Master Owner Only)
  async addPlayer(
    player: Player,
    ownerAuth: string = DEFAULT_MASTER_AUTH
  ): Promise<{ success: boolean; player?: Player; data?: DatabasePayload }> {
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-auth': ownerAuth
        },
        body: JSON.stringify({
          ...player,
          ownerAuth
        })
      });

      if (!res.ok) {
        return {
          success: false
        };
      }

      const json = await res.json();

      return {
        success: true,
        player: json.player,
        data: json.data
      };
    } catch {
      return {
        success: false
      };
    }
  },

  // Update a player's image, role, stats, price, or details (Master Owner Only)
  async updatePlayer(
    playerId: string,
    updates: Partial<Player>,
    ownerAuth: string = DEFAULT_MASTER_AUTH
  ): Promise<{ success: boolean; player?: Player; data?: DatabasePayload }> {
    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-auth': ownerAuth
        },
        body: JSON.stringify({
          ...updates,
          ownerAuth
        })
      });

      if (!res.ok) {
        return {
          success: false
        };
      }

      const json = await res.json();

      return {
        success: true,
        player: json.player,
        data: json.data
      };
    } catch {
      return {
        success: false
      };
    }
  },

  // Delete a player (Master Owner Only)
  async deletePlayer(
    playerId: string,
    ownerAuth: string = DEFAULT_MASTER_AUTH
  ): Promise<{ success: boolean; data?: DatabasePayload }> {
    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method: 'DELETE',
        headers: {
          'x-owner-auth': ownerAuth
        }
      });

      if (!res.ok) {
        return {
          success: false
        };
      }

      const json = await res.json();

      return {
        success: true,
        data: json.data
      };
    } catch {
      return {
        success: false
      };
    }
  },

  // Reset database on backend (Master Owner Only)
  async resetDatabase(
    ownerAuth: string = DEFAULT_MASTER_AUTH
  ): Promise<boolean> {
    try {
      const res = await fetch('/api/database/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-auth': ownerAuth
        },
        body: JSON.stringify({
          ownerAuth
        })
      });

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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: cleanCode,
          teamId,
          email
        })
      });

      const json = await res.json();

      if (res.ok && json.success) {
        return json;
      }

      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          error: json.error || 'Invalid hidden owner code'
        };
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

    if (
      cleanCode === 'Priyam01032008@' &&
      (
        !email ||
        email.trim().toLowerCase() === 'priyam1.3.2008@gmail.com' ||
        email.trim().toLowerCase() === 'roypriyam950@gmail.com'
      )
    ) {
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

      return {
        success: false,
        error: 'Invalid hidden owner code for this franchise'
      };
    }

    if (cleanCode === 'DR360@') {
      return {
        success: true,
        role: 'team_owner',
        teamId: 'team_dr',
        authCode: cleanCode
      };
    }

    for (const [tId, secret] of Object.entries(fallbackCodes)) {
      if (secret === cleanCode) {
        return {
          success: true,
          role: 'team_owner',
          teamId: tId,
          authCode: cleanCode
        };
      }
    }

    return {
      success: false,
      error: 'Invalid hidden owner code. Access denied.'
    };
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamId,
          code,
          playerId,
          amount
        })
      });

      return res.ok;
    } catch {
      return false;
    }
  },

  // Backend Owner-only Refund & Re-auction
  async refundPlayerSale(
    playerId: string,
    ownerAuth: string
  ): Promise<boolean> {
    try {
      const res = await fetch('/api/owner/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-auth': ownerAuth
        },
        body: JSON.stringify({
          playerId,
          ownerAuth
        })
      });

      return res.ok;
    } catch {
      return false;
    }
  },

  // Backend Owner-only Re-auction
  async reauctionPlayer(
    playerId: string,
    ownerAuth: string
  ): Promise<boolean> {
    try {
      const res = await fetch('/api/owner/reauction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-auth': ownerAuth
        },
        body: JSON.stringify({
          playerId,
          ownerAuth
        })
      });

      return res.ok;
    } catch {
      return false;
    }
  }
};
