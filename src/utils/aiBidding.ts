import { Team, Player, PlayerRole } from '../types';

export interface AiDecision {
  shouldBid: boolean;
  team: Team;
  maxBid: number;
  reason?: string;
  exitReason?: string;
}

export function calculateAiTeamValuation(
  team: Team,
  player: Player,
  allSquadPlayers: Player[],
  difficulty: 'conservative' | 'balanced' | 'aggressive' = 'balanced'
): number {
  // 1. Check basic eligibility
  const currentSquadSize = team.players.length;
  if (currentSquadSize >= team.maxSquadSize) return 0;

  if (player.isOverseas && team.overseasPlayers >= team.maxOverseasPlayers) {
    return 0;
  }

  // 2. Budget preservation check: reserve at least ₹200 for every remaining unfilled slot
  const remainingSlots = team.maxSquadSize - currentSquadSize;
  const reserveNeeded = (remainingSlots - 1) * 200;
  const usablePurse = team.purse - reserveNeeded;

  if (usablePurse <= player.basePrice) return 0;

  // 3. Squad composition needs analysis
  const currentTeamPlayers = allSquadPlayers.filter(p => team.players.includes(p.id));
  const counts: Record<PlayerRole, number> = {
    'Batter': 0,
    'Wicketkeeper': 0,
    'All-rounder': 0,
    'Fast Bowler': 0,
    'Spin Bowler': 0
  };

  currentTeamPlayers.forEach(p => {
    if (counts[p.role] !== undefined) {
      counts[p.role]++;
    }
  });

  // Base desire score (1.0 = normal)
  let needMultiplier = 1.0;

  // Role preference boost
  if (team.preferredRoles.includes(player.role)) {
    needMultiplier += 0.25;
  }

  // Deficit bonus
  if (player.role === 'Wicketkeeper') {
    if (counts['Wicketkeeper'] === 0) needMultiplier += 0.8;
    else if (counts['Wicketkeeper'] >= 2) needMultiplier -= 0.6;
  } else if (player.role === 'Batter') {
    if (counts['Batter'] < 4) needMultiplier += 0.45;
    else if (counts['Batter'] >= 7) needMultiplier -= 0.3;
  } else if (player.role === 'Fast Bowler') {
    if (counts['Fast Bowler'] < 3) needMultiplier += 0.5;
    else if (counts['Fast Bowler'] >= 5) needMultiplier -= 0.35;
  } else if (player.role === 'Spin Bowler') {
    if (counts['Spin Bowler'] < 2) needMultiplier += 0.45;
    else if (counts['Spin Bowler'] >= 4) needMultiplier -= 0.3;
  } else if (player.role === 'All-rounder') {
    if (counts['All-rounder'] < 3) needMultiplier += 0.4;
  }

  // Overseas balance
  if (player.isOverseas && team.overseasPlayers >= 4) {
    needMultiplier -= 0.2;
  }

  // Aggression modifier
  let aggressionMult = 1.0;
  if (team.aiAggression === 'aggressive') aggressionMult = 1.35;
  else if (team.aiAggression === 'conservative') aggressionMult = 0.85;

  if (difficulty === 'aggressive') aggressionMult *= 1.2;
  else if (difficulty === 'conservative') aggressionMult *= 0.85;

  // Stat-based star valuation
  let statBoost = 1.0;
  if (player.stats.strikeRate && player.stats.strikeRate > 150) statBoost += 0.25;
  if (player.stats.wickets && player.stats.wickets > 70) statBoost += 0.25;
  if (player.stats.runs && player.stats.runs > 2000) statBoost += 0.25;

  // Random variance factor (+/- 15%) so auctions feel organic
  const randomFactor = 0.85 + Math.random() * 0.3;

  // Max bid calculation
  const computedMax = Math.round(
    player.basePrice * needMultiplier * aggressionMult * statBoost * randomFactor
  );

  // Hard clamp to usable purse and reasonable ceiling (cannot exceed 40% of remaining purse on one player)
  const maxPurseShare = Math.round(usablePurse * 0.45);
  const finalValuation = Math.min(computedMax, usablePurse, maxPurseShare);

  return Math.max(0, finalValuation);
}

export function evaluateAiBids(
  aiTeams: Team[],
  player: Player,
  currentBid: number,
  highestBidderId: string | null,
  allSquadPlayers: Player[],
  difficulty: 'conservative' | 'balanced' | 'aggressive'
): { eligibleTeams: Team[], decisions: Record<string, AiDecision> } {
  const eligibleTeams: Team[] = [];
  const decisions: Record<string, AiDecision> = {};

  aiTeams.forEach(team => {
    // Current highest bidder doesn't outbid itself
    if (team.id === highestBidderId) {
      decisions[team.id] = {
        shouldBid: false,
        team,
        maxBid: 0,
        reason: 'Already holding highest bid'
      };
      return;
    }

    const maxValuation = calculateAiTeamValuation(team, player, allSquadPlayers, difficulty);

    // Can they afford the next minimum bid?
    const nextMinBid = currentBid === 0 ? player.basePrice : currentBid + getNextBidIncrement(currentBid);

    if (maxValuation >= nextMinBid && team.purse >= nextMinBid) {
      eligibleTeams.push(team);
      decisions[team.id] = {
        shouldBid: true,
        team,
        maxBid: maxValuation,
        reason: `Targeting player (willing up to ₹${maxValuation.toLocaleString()})`
      };
    } else {
      let exitReason = 'Budget limit reached';
      if (team.players.length >= team.maxSquadSize) exitReason = 'Squad full';
      else if (player.isOverseas && team.overseasPlayers >= team.maxOverseasPlayers) exitReason = 'Overseas limit reached';
      else if (currentBid >= maxValuation) exitReason = `Valuation exceeded (cap: ₹${maxValuation.toLocaleString()})`;

      decisions[team.id] = {
        shouldBid: false,
        team,
        maxBid: maxValuation,
        exitReason
      };
    }
  });

  return { eligibleTeams, decisions };
}

// Bid increment ladder
export function getNextBidIncrement(currentBid: number): number {
  if (currentBid < 1000) return 200;
  if (currentBid < 3000) return 250;
  if (currentBid < 7000) return 500;
  return 1000;
}
