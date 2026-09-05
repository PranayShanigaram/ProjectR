/* ═══════════════════════════════════════════════════════════
   FOOTBALL UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════════ */

import {
  FootballPlayer,
  FootballTeam,
  PlayerPosition,
  POSITION_LABELS,
  POSITION_ICONS,
  PITCH_WIDTH,
  PITCH_HEIGHT,
  PENALTY_BOX_WIDTH,
  PENALTY_BOX_HEIGHT,
  GOAL_AREA_WIDTH,
  GOAL_AREA_HEIGHT,
} from "../types/football";

/* ═══════════════════════════════════════════════════════════
   PLAYER & TEAM UTILITIES
   ═══════════════════════════════════════════════════════════ */

export const getPositionLabel = (position: PlayerPosition): string =>
  POSITION_LABELS[position] || position;

export const getPositionIcon = (position: PlayerPosition): string =>
  POSITION_ICONS[position] || "⚽";

export const getPlayerInitials = (name: string): string =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

export const getTeamPlayersByPosition = (team: FootballTeam, position?: PlayerPosition): FootballPlayer[] => {
  if (!position) return team.players;
  return team.players.filter((p) => p.position === position);
};

export const getPlayerAbilities = (player: FootballPlayer) => ({
  pace: player.pace,
  shooting: player.shooting,
  passing: player.passing,
  defense: player.defense,
  strength: player.strength,
  stamina: player.stamina,
});

export const getShotPower = (player: FootballPlayer): number => {
  if (player.position === "FWD") return player.shooting * 1.1;
  if (player.position === "MID") return player.shooting * 0.95;
  if (player.position === "DEF") return player.shooting * 0.8;
  return 50; // GK
};

export const getShotAccuracy = (player: FootballPlayer): number => {
  if (player.position === "FWD") return Math.min(95, player.shooting * 0.85 + 10);
  if (player.position === "MID") return Math.min(90, player.shooting * 0.75);
  if (player.position === "DEF") return Math.min(70, player.shooting * 0.6);
  return 20; // GK
};

export const getPassingAccuracy = (player: FootballPlayer): number =>
  Math.min(100, player.passing * 0.95);

export const getDefenseStrength = (player: FootballPlayer): number =>
  (player.defense + player.strength) / 2;

export const getPlayerSpeed = (player: FootballPlayer, isSprinting: boolean = false): number => {
  const baseSpeed = (player.pace / 100) * 3.5;
  return isSprinting ? baseSpeed * 1.4 : baseSpeed;
};

export const getPlayerStamina = (player: FootballPlayer, timeElapsed: number): number => {
  // Stamina decreases during match
  const staminaDropPerMinute = (100 - player.stamina) * 0.05; // Lower stamina = faster drain
  return Math.max(0, 100 - staminaDropPerMinute * (timeElapsed / 60));
};

export const getTeamOverall = (players: FootballPlayer[]): number => {
  if (players.length === 0) return 0;
  const sum = players.reduce((acc, p) => acc + p.overall, 0);
  return Math.round(sum / players.length);
};

/* ═══════════════════════════════════════════════════════════
   PITCH GEOMETRY & POSITIONING
   ═══════════════════════════════════════════════════════════ */

export const getPitchBounds = () => ({
  top: 0,
  bottom: PITCH_HEIGHT,
  left: 0,
  right: PITCH_WIDTH,
  centerX: PITCH_WIDTH / 2,
  centerY: PITCH_HEIGHT / 2,
});

export const getGoalPosition = (side: "home" | "away") => {
  const goalX = side === "home" ? -50 : PITCH_WIDTH + 50;
  const goalY = PITCH_HEIGHT / 2;
  return { x: goalX, y: goalY };
};

export const getPenaltyBoxBounds = (side: "home" | "away") => {
  const boxX = side === "home" ? 0 : PITCH_WIDTH - PENALTY_BOX_WIDTH;
  return {
    top: PITCH_HEIGHT / 2 - PENALTY_BOX_HEIGHT / 2,
    bottom: PITCH_HEIGHT / 2 + PENALTY_BOX_HEIGHT / 2,
    left: boxX,
    right: boxX + PENALTY_BOX_WIDTH,
  };
};

export const getGoalAreaBounds = (side: "home" | "away") => {
  const boxX = side === "home" ? 0 : PITCH_WIDTH - GOAL_AREA_WIDTH;
  return {
    top: PITCH_HEIGHT / 2 - GOAL_AREA_HEIGHT / 2,
    bottom: PITCH_HEIGHT / 2 + GOAL_AREA_HEIGHT / 2,
    left: boxX,
    right: boxX + GOAL_AREA_WIDTH,
  };
};

export const getFormationPositions = (
  formation: string,
  side: "home" | "away"
): { x: number; y: number; position: PlayerPosition }[] => {
  const positions: { x: number; y: number; position: PlayerPosition }[] = [];
  const isHome = side === "home";

  // GK position
  const gkX = isHome ? 80 : PITCH_WIDTH - 80;
  positions.push({ x: gkX, y: PITCH_HEIGHT / 2, position: "GK" });

  // DEF positions (varies by formation)
  const defCount = parseInt(formation.split("-")[0]);
  const defY = [PITCH_HEIGHT * 0.2, PITCH_HEIGHT * 0.4, PITCH_HEIGHT * 0.6, PITCH_HEIGHT * 0.8];
  const defX = isHome ? PITCH_WIDTH * 0.2 : PITCH_WIDTH * 0.8;
  for (let i = 0; i < defCount; i++) {
    positions.push({ x: defX, y: defY[i] || PITCH_HEIGHT / 2, position: "DEF" });
  }

  // MID positions
  const midCount = parseInt(formation.split("-")[1]);
  const midY = [PITCH_HEIGHT * 0.25, PITCH_HEIGHT * 0.5, PITCH_HEIGHT * 0.75];
  const midX = isHome ? PITCH_WIDTH * 0.5 : PITCH_WIDTH * 0.5;
  for (let i = 0; i < midCount; i++) {
    positions.push({ x: midX, y: midY[i] || PITCH_HEIGHT / 2, position: "MID" });
  }

  // FWD positions
  const fwdCount = parseInt(formation.split("-")[2]);
  const fwdY = [PITCH_HEIGHT * 0.33, PITCH_HEIGHT * 0.66];
  const fwdX = isHome ? PITCH_WIDTH * 0.75 : PITCH_WIDTH * 0.25;
  for (let i = 0; i < fwdCount; i++) {
    positions.push({ x: fwdX, y: fwdY[i] || PITCH_HEIGHT / 2, position: "FWD" });
  }

  return positions;
};

export const distance = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy) || 0.0001;
};

export const isInsideGoalBox = (x: number, y: number, side: "home" | "away"): boolean => {
  const bounds = getGoalAreaBounds(side);
  return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
};

export const isInsidePenaltyBox = (
  x: number,
  y: number,
  side: "home" | "away"
): boolean => {
  const bounds = getPenaltyBoxBounds(side);
  return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
};

export const isInsidePitch = (x: number, y: number): boolean => {
  return x >= 0 && x <= PITCH_WIDTH && y >= 0 && y <= PITCH_HEIGHT;
};

export const clampToPitch = (x: number, y: number): { x: number; y: number } => ({
  x: Math.max(0, Math.min(PITCH_WIDTH, x)),
  y: Math.max(0, Math.min(PITCH_HEIGHT, y)),
});

/* ═══════════════════════════════════════════════════════════
   MATCH LOGIC HELPERS
   ═══════════════════════════════════════════════════════════ */

export const calculateShotOnTarget = (
  shooterPower: number,
  shooterAccuracy: number,
  defenseDistance: number,
  gkReaction: number
): { isGoal: boolean; power: number; accuracy: number } => {
  // Random variance
  const powerVariance = (Math.random() - 0.5) * 20;
  const accuracyVariance = (Math.random() - 0.5) * 15;

  const finalPower = Math.max(0, shooterPower + powerVariance);
  const finalAccuracy = Math.max(30, Math.min(100, shooterAccuracy + accuracyVariance));

  // Defense blocks can reduce accuracy
  const defenseReduction = Math.max(0, 100 - defenseDistance * 2);
  const effectiveAccuracy = Math.max(20, finalAccuracy - defenseReduction);

  // GK reaction reduces goal chance
  const gkSave = Math.random() * 100 < (gkReaction * 100) * (1 - effectiveAccuracy / 100);

  const isGoal = effectiveAccuracy > 60 && !gkSave;

  return { isGoal, power: finalPower, accuracy: effectiveAccuracy };
};

export const calculatePossessionProgress = (
  currentPossession: number,
  playerPassing: number,
  defenseQuality: number
): number => {
  // Improve possession based on passing skill vs defense
  const progressChance = (playerPassing / 100) * 0.3 - (defenseQuality / 100) * 0.2;
  if (Math.random() < progressChance) {
    return currentPossession + 1;
  }
  // Chance to lose possession
  if (Math.random() < 0.1) {
    return Math.max(0, currentPossession - 2);
  }
  return currentPossession;
};

export const formatMatchTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

export const getMatchPhase = (
  seconds: number,
  totalDuration: number
): "first-half" | "half-time" | "second-half" | "full-time" => {
  const halfDuration = totalDuration / 2;
  if (seconds < halfDuration) return "first-half";
  if (seconds === halfDuration) return "half-time";
  if (seconds < totalDuration) return "second-half";
  return "full-time";
};

export const calculatePlayerPerformance = (
  goals: number,
  assists: number,
  passAccuracy: number,
  shotsOnTarget: number,
  tackles: number
): number => {
  // Simple performance rating (0-10)
  const goalPoints = goals * 2;
  const assistPoints = assists * 1.5;
  const passPoints = (passAccuracy / 100) * 2;
  const shotPoints = shotsOnTarget * 1;
  const tacklePoints = tackles * 0.5;

  const totalPoints = goalPoints + assistPoints + passPoints + shotPoints + tacklePoints;
  return Math.min(10, Math.round(totalPoints * 10) / 10);
};
