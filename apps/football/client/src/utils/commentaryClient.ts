const API_BASE = "http://localhost:5000/api/football/commentary";

let currentMatchId: string | null = null;
let commentaryInitialized = false;

export interface TeamInfo {
  name: string;
  flag: string;
}

/**
 * Initialize a new commentary session for a match
 */
export async function initializeCommentary(
  matchId: string,
  homeTeam: TeamInfo,
  awayTeam: TeamInfo
): Promise<{ ok: boolean; filePath?: string; error?: string }> {
  try {
    currentMatchId = matchId;
    const response = await fetch(`${API_BASE}/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId,
        homeTeam,
        awayTeam,
      }),
    });

    const data = await response.json();
    if (data.ok) {
      commentaryInitialized = true;
      console.log("✅ Commentary initialized:", data.filePath);
    } else {
      console.error("❌ Failed to initialize commentary:", data.error);
    }
    return data;
  } catch (error) {
    console.error("Error initializing commentary:", error);
    return { ok: false, error: String(error) };
  }
}

/**
 * Log a pass event
 */
export async function logPass(
  playerName: string,
  receiverName: string,
  teamName: string
): Promise<boolean> {
  if (!currentMatchId) return false;
  try {
    const response = await fetch(`${API_BASE}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: currentMatchId,
        eventType: "pass",
        playerName,
        receiverName,
        teamName,
      }),
    });
    return (await response.json()).ok;
  } catch (error) {
    console.error("Error logging pass:", error);
    return false;
  }
}

/**
 * Log a shot event
 */
export async function logShot(
  playerName: string,
  teamName: string,
  shotOnTarget: boolean
): Promise<boolean> {
  if (!currentMatchId) return false;
  try {
    const response = await fetch(`${API_BASE}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: currentMatchId,
        eventType: "shot",
        playerName,
        teamName,
        shotOnTarget,
      }),
    });
    return (await response.json()).ok;
  } catch (error) {
    console.error("Error logging shot:", error);
    return false;
  }
}

/**
 * Log a goal event
 */
export async function logGoal(
  playerName: string,
  teamName: string,
  scoreLine: string
): Promise<boolean> {
  if (!currentMatchId) return false;
  try {
    const response = await fetch(`${API_BASE}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: currentMatchId,
        eventType: "goal",
        playerName,
        teamName,
        scoreLine,
      }),
    });
    return (await response.json()).ok;
  } catch (error) {
    console.error("Error logging goal:", error);
    return false;
  }
}

/**
 * Log a penalty event
 */
export async function logPenalty(
  playerName: string,
  teamName: string
): Promise<boolean> {
  if (!currentMatchId) return false;
  try {
    const response = await fetch(`${API_BASE}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: currentMatchId,
        eventType: "penalty",
        playerName,
        teamName,
      }),
    });
    return (await response.json()).ok;
  } catch (error) {
    console.error("Error logging penalty:", error);
    return false;
  }
}

/**
 * Log a goal kick event
 */
export async function logGoalKick(teamName: string): Promise<boolean> {
  if (!currentMatchId) return false;
  try {
    const response = await fetch(`${API_BASE}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: currentMatchId,
        eventType: "goalKick",
        teamName,
      }),
    });
    return (await response.json()).ok;
  } catch (error) {
    console.error("Error logging goal kick:", error);
    return false;
  }
}

/**
 * Log a corner kick event
 */
export async function logCorner(teamName: string): Promise<boolean> {
  if (!currentMatchId) return false;
  try {
    const response = await fetch(`${API_BASE}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: currentMatchId,
        eventType: "corner",
        teamName,
      }),
    });
    return (await response.json()).ok;
  } catch (error) {
    console.error("Error logging corner:", error);
    return false;
  }
}

/**
 * Log a throw-in event
 */
export async function logThrowIn(teamName: string): Promise<boolean> {
  if (!currentMatchId) return false;
  try {
    const response = await fetch(`${API_BASE}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: currentMatchId,
        eventType: "throwIn",
        teamName,
      }),
    });
    return (await response.json()).ok;
  } catch (error) {
    console.error("Error logging throw-in:", error);
    return false;
  }
}

/**
 * Log a card event
 */
export async function logCard(
  playerName: string,
  cardType: "yellow" | "red"
): Promise<boolean> {
  if (!currentMatchId) return false;
  try {
    const response = await fetch(`${API_BASE}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: currentMatchId,
        eventType: "card",
        playerName,
        cardType,
      }),
    });
    return (await response.json()).ok;
  } catch (error) {
    console.error("Error logging card:", error);
    return false;
  }
}

/**
 * Log shootout start event
 */
export async function logShootoutStart(): Promise<boolean> {
  if (!currentMatchId) return false;
  try {
    const response = await fetch(`${API_BASE}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: currentMatchId,
        eventType: "shootoutStart",
      }),
    });
    return (await response.json()).ok;
  } catch (error) {
    console.error("Error logging shootout start:", error);
    return false;
  }
}

/**
 * Log shootout goal event
 */
export async function logShootoutGoal(
  playerName: string,
  teamName: string,
  shootoutScore: string
): Promise<boolean> {
  if (!currentMatchId) return false;
  try {
    const response = await fetch(`${API_BASE}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: currentMatchId,
        eventType: "shootoutGoal",
        playerName,
        teamName,
        shootoutScore,
      }),
    });
    return (await response.json()).ok;
  } catch (error) {
    console.error("Error logging shootout goal:", error);
    return false;
  }
}

/**
 * Log shootout miss event
 */
export async function logShootoutMiss(
  playerName: string,
  teamName: string,
  shootoutScore: string
): Promise<boolean> {
  if (!currentMatchId) return false;
  try {
    const response = await fetch(`${API_BASE}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: currentMatchId,
        eventType: "shootoutMiss",
        playerName,
        teamName,
        shootoutScore,
      }),
    });
    return (await response.json()).ok;
  } catch (error) {
    console.error("Error logging shootout miss:", error);
    return false;
  }
}

/**
 * Log match end event
 */
export async function logMatchEnd(
  winner: "home" | "away" | "draw",
  scoreLine: string,
  isShootout?: boolean
): Promise<boolean> {
  if (!currentMatchId) return false;
  try {
    const response = await fetch(`${API_BASE}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: currentMatchId,
        eventType: "matchEnd",
        playerName: winner,
        scoreLine,
        shootoutScore: isShootout ? "true" : undefined,
      }),
    });
    return (await response.json()).ok;
  } catch (error) {
    console.error("Error logging match end:", error);
    return false;
  }
}

/**
 * Get the current commentary file path
 */
export async function getCommentaryFile(): Promise<string | null> {
  if (!currentMatchId) return null;
  try {
    const response = await fetch(`${API_BASE}/file?matchId=${currentMatchId}`);
    const data = await response.json();
    return data.ok ? data.filePath : null;
  } catch (error) {
    console.error("Error getting commentary file:", error);
    return null;
  }
}

/**
 * Get the current commentary content
 */
export async function getCommentaryContent(): Promise<string> {
  if (!currentMatchId) return "";
  try {
    const response = await fetch(`${API_BASE}/content?matchId=${currentMatchId}`);
    const data = await response.json();
    return data.ok ? data.content : "";
  } catch (error) {
    console.error("Error getting commentary content:", error);
    return "";
  }
}

/**
 * End the commentary session
 */
export async function endCommentary(): Promise<boolean> {
  if (!currentMatchId) return false;
  try {
    const response = await fetch(`${API_BASE}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: currentMatchId }),
    });
    const data = await response.json();
    if (data.ok) {
      currentMatchId = null;
      commentaryInitialized = false;
      console.log("✅ Commentary session ended");
    }
    return data.ok;
  } catch (error) {
    console.error("Error ending commentary:", error);
    return false;
  }
}

/**
 * Log dribbling/running with ball
 */
export async function logDribble(
  playerName: string,
  teamName: string,
  direction: string
): Promise<boolean> {
  if (!currentMatchId) return false;
  try {
    const response = await fetch(`${API_BASE}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: currentMatchId,
        eventType: "dribble",
        playerName,
        teamName,
        direction,
      }),
    });
    return (await response.json()).ok;
  } catch (error) {
    console.error("Error logging dribble:", error);
    return false;
  }
}

/**
 * Log player decision (will shoot, will pass, blocked)
 */
export async function logPlayerDecision(
  playerName: string,
  teamName: string,
  decision: string,
  reason?: string
): Promise<boolean> {
  if (!currentMatchId) return false;
  try {
    const response = await fetch(`${API_BASE}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: currentMatchId,
        eventType: "decision",
        playerName,
        teamName,
        decision,
        reason,
      }),
    });
    return (await response.json()).ok;
  } catch (error) {
    console.error("Error logging decision:", error);
    return false;
  }
}

/**
 * Log defender block/tackle
 */
export async function logDefenderBlock(
  defenderName: string,
  attackerName: string,
  teamName: string
): Promise<boolean> {
  if (!currentMatchId) return false;
  try {
    const response = await fetch(`${API_BASE}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: currentMatchId,
        eventType: "block",
        playerName: defenderName,
        receiverName: attackerName,
        teamName,
      }),
    });
    return (await response.json()).ok;
  } catch (error) {
    console.error("Error logging block:", error);
    return false;
  }
}

/**
 * Log possession change
 */
export async function logPossessionChange(
  teamName: string,
  area: string
): Promise<boolean> {
  if (!currentMatchId) return false;
  try {
    const response = await fetch(`${API_BASE}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: currentMatchId,
        eventType: "possession",
        teamName,
        area,
      }),
    });
    return (await response.json()).ok;
  } catch (error) {
    console.error("Error logging possession:", error);
    return false;
  }
}

/**
 * Log near miss / close shot
 */
export async function logNearMiss(
  playerName: string,
  teamName: string
): Promise<boolean> {
  if (!currentMatchId) return false;
  try {
    const response = await fetch(`${API_BASE}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId: currentMatchId,
        eventType: "nearMiss",
        playerName,
        teamName,
      }),
    });
    return (await response.json()).ok;
  } catch (error) {
    console.error("Error logging near miss:", error);
    return false;
  }
}

/**
 * Check if commentary is initialized
 */
export function isCommentaryInitialized(): boolean {
  return commentaryInitialized;
}

/**
 * Get current match ID
 */
export function getCurrentMatchId(): string | null {
  return currentMatchId;
}
