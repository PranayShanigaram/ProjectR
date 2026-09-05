/* ═══════════════════════════════════════════════════════════
   FOOTBALL ARENA TYPES
   ═══════════════════════════════════════════════════════════ */

export type PlayerPosition = "GK" | "DEF" | "MID" | "FWD";
export type FormationType =
  | "4-3-3"
  | "4-4-2"
  | "4-2-3-1"
  | "3-5-2"
  | "5-3-2"
  | "3-4-3"
  | "4-5-1"
  | "4-1-4-1"
  | "5-4-1"
  | "4-2-4";

export interface FootballPlayer {
  id: string;
  name: string;
  jersey: number;
  position: PlayerPosition;
  overall: number; // 70-99 rating
  pace: number; // 0-100
  shooting: number; // 0-100
  passing: number; // 0-100
  defense: number; // 0-100
  strength: number; // 0-100
  stamina: number; // 0-100
  countryCode: string;
  imageUrl?: string;
}

export interface FootballTeam {
  id: string;
  name: string;
  shortCode: string; // 3-letter code (ARG, FRA, BRA, etc.)
  countryCode: string; // 2-letter ISO code
  flag: string; // Emoji flag
  logoUrl?: string;
  primaryColor: string; // Hex color
  secondaryColor: string; // Hex color
  accentColor: string; // Hex color
  players: FootballPlayer[];
  overallRating: number;
  attackRating: number;
  defenseRating: number;
  midfieldRating: number;
}

export interface Squad {
  team: FootballTeam;
  selectedPlayers: FootballPlayer[];
  formation: FormationType;
  captain: FootballPlayer;
}

export type GamePhase = "team-select" | "squad-select" | "formation-select" | "match" | "result";

export interface PossessionBall {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  collected: boolean;
  value: number;
  spawnedAt: number;
}

export interface FootballBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface PlayerOnPitch {
  player: FootballPlayer;
  x: number;
  y: number;
  vx: number;
  vy: number;
  stamina: number; // 0-100
  isSelected: boolean;
  role: "attacking" | "defending" | "idle";
  hasBall: boolean;
}

export interface TeamMatchState {
  team: FootballTeam;
  squad: FootballPlayer[];
  formation: FormationType;
  playersOnPitch: PlayerOnPitch[];
  score: number;
  possession: number; // percentage 0-100
  possessionPoints: number; // for shooting mechanic
  shotsOnTarget: number;
  shotsOffTarget: number;
  passAccuracy: number;
  totalPasses: number;
  successfulPasses: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
}

export interface MatchState {
  homeTeam: TeamMatchState;
  awayTeam: TeamMatchState;
  currentTime: number; // seconds
  matchDuration: number; // 90 minutes = 5400 seconds (or accelerated)
  isHalftime: boolean;
  isComplete: boolean;
  winner: FootballTeam | null;
  winMargin: string | null;
  potm: PlayerOfMatch | null;
  ball: FootballBall;
  possessionTeam: 0 | 1; // 0 = home, 1 = away
}

export interface PlayerOfMatch {
  name: string;
  team: string;
  teamColor: string;
  goals: number;
  assists: number;
  passAccuracy: number;
  rating: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: number;
  duration?: number;
}

export interface GoalEvent {
  scorer: FootballPlayer;
  assist?: FootballPlayer;
  time: number;
  teamSide: 0 | 1;
  celebration: "yes" | "no";
}

export interface MatchStats {
  homeTeam: {
    goals: number;
    possession: number;
    shotsOnTarget: number;
    passAccuracy: number;
    fouls: number;
    yellowCards: number;
  };
  awayTeam: {
    goals: number;
    possession: number;
    shotsOnTarget: number;
    passAccuracy: number;
    fouls: number;
    yellowCards: number;
  };
  topScorer: FootballPlayer | null;
  events: GoalEvent[];
}

/* ═══════════════════════════════════════════════════════════
   PITCH & GEOMETRY
   ═══════════════════════════════════════════════════════════ */

export const PITCH_WIDTH = 1200;
export const PITCH_HEIGHT = 600;
export const GOAL_WIDTH = 150;
export const GOAL_HEIGHT = 300;
export const CENTER_LINE = PITCH_WIDTH / 2;
export const PENALTY_BOX_WIDTH = 300;
export const PENALTY_BOX_HEIGHT = 400;
export const GOAL_AREA_WIDTH = 200;
export const GOAL_AREA_HEIGHT = 300;

/* ═══════════════════════════════════════════════════════════
   GAME CONSTANTS
   ═══════════════════════════════════════════════════════════ */

export const POSSESSION_POINTS_FOR_SHOT = 15;
export const MAX_SHOT_POWER = 100;
export const MIN_SHOT_ACCURACY = 30;
export const MAX_SHOT_ACCURACY = 95;
export const BASE_PLAYER_SPEED = 2.5;
export const BALL_SPEED = 4;
export const STAMINA_DRAIN_RATE = 0.5; // per second
export const STAMINA_RECOVERY_RATE = 0.2; // per second when not sprinting
export const GK_REACTION_TIME = 0.5; // seconds
export const MATCH_DURATION_MS = 90 * 60 * 1000; // 90 minutes in milliseconds
export const PHYSICS_TICK_MS = 30;
export const POSSESSION_BUBBLE_SPAWN_INTERVAL = 500; // ms

/* ═══════════════════════════════════════════════════════════
   FORMATION TEMPLATES
   ═══════════════════════════════════════════════════════════ */

export interface FormationTemplate {
  type: FormationType;
  name: string;
  description: string;
  layout: {
    defenders: number;
    midfielders: number;
    forwards: number;
  };
}

export const FORMATION_TEMPLATES: Record<FormationType, FormationTemplate> = {
  "4-3-3": {
    type: "4-3-3",
    name: "Classic 4-3-3",
    description: "Balanced attack with 4 defenders, 3 midfielders, 3 forwards",
    layout: { defenders: 4, midfielders: 3, forwards: 3 },
  },
  "4-4-2": {
    type: "4-4-2",
    name: "Classic 4-4-2",
    description: "Timeless shape with two strikers and a flat midfield four",
    layout: { defenders: 4, midfielders: 4, forwards: 2 },
  },
  "4-2-3-1": {
    type: "4-2-3-1",
    name: "Modern 4-2-3-1",
    description: "Two holding mids shield the back line behind a creative three",
    layout: { defenders: 4, midfielders: 5, forwards: 1 },
  },
  "3-5-2": {
    type: "3-5-2",
    name: "Wing-Play 3-5-2",
    description: "3 defenders with wing-backs and a packed midfield five",
    layout: { defenders: 3, midfielders: 5, forwards: 2 },
  },
  "5-3-2": {
    type: "5-3-2",
    name: "Defensive 5-3-2",
    description: "Solid low block with 5 at the back and two strikers to counter",
    layout: { defenders: 5, midfielders: 3, forwards: 2 },
  },
  "3-4-3": {
    type: "3-4-3",
    name: "Attacking 3-4-3",
    description: "Front-foot football with 3 defenders and a bold front three",
    layout: { defenders: 3, midfielders: 4, forwards: 3 },
  },
  "4-5-1": {
    type: "4-5-1",
    name: "Compact 4-5-1",
    description: "Congest midfield with five and press from a lone striker",
    layout: { defenders: 4, midfielders: 5, forwards: 1 },
  },
  "4-1-4-1": {
    type: "4-1-4-1",
    name: "Balanced 4-1-4-1",
    description: "A single pivot anchors a disciplined 4-4 shell",
    layout: { defenders: 4, midfielders: 5, forwards: 1 },
  },
  "5-4-1": {
    type: "5-4-1",
    name: "Ultra-Defensive 5-4-1",
    description: "Park the bus with 5 defenders and a banked midfield four",
    layout: { defenders: 5, midfielders: 4, forwards: 1 },
  },
  "4-2-4": {
    type: "4-2-4",
    name: "All-Out 4-2-4",
    description: "Maximum attack with four forwards and just two in midfield",
    layout: { defenders: 4, midfielders: 2, forwards: 4 },
  },
};

export const POSITION_ICONS = {
  GK: "🧤",
  DEF: "🛡️",
  MID: "⚙️",
  FWD: "🎯",
};

export const POSITION_LABELS = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  FWD: "Forward",
};
