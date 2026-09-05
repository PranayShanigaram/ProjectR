// CricketPage.tsx — IPL Cricket Brawl: Team Select → Squad Select → Match
import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  IPL_TEAMS,
  IPLTeam,
  Player,
  PlayerRole,
  getInitials,
  getPlayerAbilities,
  ROLE_LABELS,
  ROLE_COLORS,
} from "../data/iplTeams";

/* ── Team logo URL mapping ── */
const TEAM_LOGO: Record<string, string> = {
  CSK: "http://localhost:5000/images/team%20logos/chennai.png",
  DC:  "http://localhost:5000/images/team%20logos/delhi.png",
  GT:  "http://localhost:5000/images/team%20logos/gujrat.png",
  KKR: "http://localhost:5000/images/team%20logos/kolkatta.png",
  LSG: "http://localhost:5000/images/team%20logos/lucknow.png",
  MI:  "http://localhost:5000/images/team%20logos/mumbai.png",
  PBKS:"http://localhost:5000/images/team%20logos/punjab.png",
  RR:  "http://localhost:5000/images/team%20logos/rajasthan.png",
  RCB: "http://localhost:5000/images/team%20logos/banglore.png",
  SRH: "http://localhost:5000/images/team%20logos/hyderabad.png",
};
const teamLogo = (shortName: string) => TEAM_LOGO[shortName] ?? "";

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */
type GamePhase = "team-select" | "squad-select" | "match";

interface Spike {
  x: number;
  y: number;
  nx: number;
  ny: number;
}
interface CricketBall {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  outType: string;
  radius: number;
  spawnedAt: number;
  collected: boolean;
  specialType?: 'wide' | 'noBall' | 'hitWicket';
}
interface BattingStats {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  status: "batting" | "out" | "dnb";
  outType?: string;
}
interface BowlingStats {
  overs: number;
  ballsInOver: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
}
interface TeamMatchState {
  team: IPLTeam;
  playing11: Player[];
  score: number;
  wickets: number;
  ballsFaced: number;
  battingStats: BattingStats[];
  bowlingStats: BowlingStats[];
  currentBatsmanIndices: [number, number];
  nextBatsmanIndex: number;
  currentBowlerIndex: number;
  bowlerIndices: number[];
  impactPlayer: Player | null;
  impactUsed: boolean;
  impactReplacedIdx: number;     // index in playing11 that was replaced
  impactBatPos: number;          // 1-indexed batting position user chose for impact player
  impactSwapIdx: number;         // index in playing11 user chose to swap with impact player (-1 = auto)
  impactTriggerOver: number;     // over number at which impact substitution triggers
  impactInnings: 'any' | '1st' | '2nd';  // which innings the impact player should come in
  impactCanBat: boolean;
  impactCanBowl: boolean;
}
interface MatchState {
  innings: 1 | 2;
  ballsInCurrentOver: number;
  currentOver: number;
  target: number | null;
  isComplete: boolean;
  winner: string | null;
  winMargin: string | null;
  potm: PlayerOfMatch | null;
  matchEndPhase: "winner" | "scorecard" | "potm" | "table" | "actions" | null;
  battingTeamIdx: 0 | 1;
  firstInningsScore: number;
  thisOverBalls: (number | string)[];
  currentOverRunsOnly: number;
  isSuperOver: boolean;
  superOverNumber: number;
}
interface PlayerOfMatch {
  name: string;
  team: string;
  teamColor: string;
  score: number;
  batting: string;
  bowling: string;
}
interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: number;
  duration?: number;
}
interface MilestoneAnim {
  text: string;
  sub: string;
  color: string;
  startedAt: number;
}
interface ImpactAnim {
  playerIn: string;
  playerOut: string;
  teamName: string;
  role: 'bat' | 'bowl';
  startedAt: number;
}

/* ═══════════════════════════════════════════════════════
   TOURNAMENT STANDINGS (persisted in localStorage)
   ═══════════════════════════════════════════════════════ */
interface TournamentStanding {
  shortName: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  totalRunsScored: number;
  totalOversPlayed: number;   // decimal overs e.g. 19.3 → 19.5
  totalRunsConceded: number;
  totalOversBowled: number;
  pts: number;
}

const TOURNAMENT_KEY_MAIN = "ipl_brawl_tournament_main";
const TOURNAMENT_KEY_TEST = "ipl_brawl_tournament_test";

const getTournamentKey = (test: boolean) => test ? TOURNAMENT_KEY_TEST : TOURNAMENT_KEY_MAIN;

const getInitialStandings = (): TournamentStanding[] =>
  IPL_TEAMS.map((t) => ({
    shortName: t.shortName,
    played: 0, won: 0, lost: 0, tied: 0,
    totalRunsScored: 0, totalOversPlayed: 0,
    totalRunsConceded: 0, totalOversBowled: 0,
    pts: 0,
  }));

const loadStandings = (test: boolean): TournamentStanding[] => {
  try {
    const raw = localStorage.getItem(getTournamentKey(test));
    if (!raw) return getInitialStandings();
    const parsed = JSON.parse(raw) as TournamentStanding[];
    const map = new Map(parsed.map((s) => [s.shortName, s]));
    return IPL_TEAMS.map((t) => map.get(t.shortName) ?? {
      shortName: t.shortName,
      played: 0, won: 0, lost: 0, tied: 0,
      totalRunsScored: 0, totalOversPlayed: 0,
      totalRunsConceded: 0, totalOversBowled: 0,
      pts: 0,
    });
  } catch { return getInitialStandings(); }
};

const saveStandings = (s: TournamentStanding[], test: boolean) =>
  localStorage.setItem(getTournamentKey(test), JSON.stringify(s));

const calcNRR = (s: TournamentStanding): number =>
  s.totalOversBowled > 0 && s.totalOversPlayed > 0
    ? (s.totalRunsScored / s.totalOversPlayed) - (s.totalRunsConceded / s.totalOversBowled)
    : 0;

/* ═══════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════ */
const BUBBLE_RADIUS = 50;
const BALL_RADIUS = 14;
const BASE_SPEED = 2.5;
const WALL_PADDING = 20;
const GROW_DURATION_MS = 700;
const INITIAL_RADIUS = 10;
const BOUNCE_DEVIATION = 0.25;
const BALL_SPEED = 3.5;
const BALLS_PER_OVER = 6;
const MAX_OVERS = 20;
const MAX_WICKETS = 10;
const BALL_SPAWN_INTERVAL_MS = 700;
const BALL_LIFETIME_MS = 8000;
const SUPER_OVER_MAX_OVERS = 1;
const SUPER_OVER_MAX_WICKETS = 2;
const SUPER_OVER_MAX_OVERS_PER_BOWLER = 1;
const TICK_MS = 30;
const SPECIAL_BALL_LIFETIME_MS = 2500;
const MAX_WIDES_PER_INNINGS = 15;
const MAX_NOBALLS_PER_INNINGS = 4;
const MAX_HITWICKET_PER_INNINGS = 1;
const WIDE_SPAWN_CHANCE = 0.012;
const NOBALL_SPAWN_CHANCE = 0.004;
const HITWICKET_SPAWN_CHANCE = 0.001;
const DLS_MIN_OVERS = 5; // Minimum overs needed for a valid result under DLS

/* ═══════════════════════════════════════════════════════
   DLS RESOURCE TABLE (Standard Edition — % remaining)
   Rows = overs remaining (0–20), Cols = wickets lost (0–9)
   getValue(oversRemaining, wicketsLost) → resource % (0–100)
   ═══════════════════════════════════════════════════════ */
const DLS_TABLE: number[][] = [
  // 0wkt  1wkt  2wkt  3wkt  4wkt  5wkt  6wkt  7wkt  8wkt  9wkt
  [  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0], // 0 overs left
  [  6.5,  6.5,  6.3,  5.8,  5.2,  4.4,  3.4,  2.4,  1.4,  0.5], // 1
  [ 12.2, 12.0, 11.5, 10.7,  9.6,  8.2,  6.4,  4.6,  2.7,  1.0], // 2
  [ 17.2, 17.0, 16.1, 15.0, 13.5, 11.5,  9.1,  6.6,  3.9,  1.5], // 3
  [ 21.8, 21.3, 20.3, 18.9, 17.0, 14.6, 11.6,  8.4,  5.0,  1.9], // 4
  [ 25.8, 25.2, 24.0, 22.5, 20.3, 17.4, 13.9, 10.2,  6.1,  2.4], // 5
  [ 29.6, 28.8, 27.4, 25.7, 23.3, 20.1, 16.1, 11.8,  7.1,  2.8], // 6
  [ 33.0, 32.1, 30.6, 28.8, 26.1, 22.6, 18.1, 13.4,  8.1,  3.2], // 7
  [ 36.2, 35.2, 33.6, 31.6, 28.7, 24.9, 20.1, 14.9,  9.1,  3.6], // 8
  [ 39.2, 38.1, 36.3, 34.2, 31.2, 27.1, 21.9, 16.3,  9.9,  4.0], // 9
  [ 42.0, 40.8, 38.9, 36.7, 33.5, 29.2, 23.7, 17.6, 10.8,  4.4], // 10
  [ 44.6, 43.3, 41.4, 39.0, 35.7, 31.2, 25.3, 18.9, 11.6,  4.7], // 11
  [ 47.1, 45.7, 43.7, 41.2, 37.7, 33.0, 26.9, 20.1, 12.4,  5.1], // 12
  [ 49.4, 48.0, 45.8, 43.3, 39.7, 34.8, 28.4, 21.3, 13.2,  5.4], // 13
  [ 51.6, 50.1, 47.8, 45.3, 41.6, 36.5, 29.8, 22.4, 13.9,  5.7], // 14
  [ 53.7, 52.1, 49.8, 47.1, 43.3, 38.1, 31.2, 23.5, 14.6,  6.0], // 15
  [ 55.7, 54.1, 51.7, 48.9, 45.0, 39.6, 32.5, 24.5, 15.3,  6.3], // 16
  [ 57.5, 55.9, 53.4, 50.6, 46.6, 41.1, 33.7, 25.5, 15.9,  6.5], // 17
  [ 59.3, 57.6, 55.1, 52.2, 48.2, 42.5, 35.0, 26.5, 16.6,  6.8], // 18
  [ 61.0, 59.3, 56.7, 53.8, 49.6, 43.8, 36.1, 27.4, 17.2,  7.1], // 19
  [ 62.7, 60.9, 58.2, 55.3, 51.1, 45.2, 37.3, 28.3, 17.8,  7.4], // 20
];

/** Interpolate DLS resource % for fractional overs remaining and wickets lost */
function dlsResource(oversRemaining: number, wicketsLost: number): number {
  const w = Math.min(9, Math.max(0, Math.floor(wicketsLost)));
  const oLow = Math.max(0, Math.floor(oversRemaining));
  const oHigh = Math.min(20, oLow + 1);
  const frac = oversRemaining - oLow;
  if (oLow >= 20) return DLS_TABLE[20][w];
  if (oLow < 0) return 0;
  const low = DLS_TABLE[oLow][w];
  const high = DLS_TABLE[oHigh] ? DLS_TABLE[oHigh][w] : low;
  return low + (high - low) * frac;
}

/** Total resource available for a full innings of N overs with 0 wickets lost */
function dlsTotalResource(totalOvers: number): number {
  return dlsResource(totalOvers, 0);
}

/** 
 * Resources USED = resource at start − resource remaining now.
 * resource at start = dlsResource(totalOvers, 0) for a fresh innings
 * resource remaining now = dlsResource(oversLeft, wicketsLost)
 */
function dlsResourceUsed(totalOvers: number, oversBowled: number, wicketsLost: number): number {
  const atStart = dlsResource(totalOvers, 0);
  const remaining = dlsResource(totalOvers - oversBowled, wicketsLost);
  return atStart - remaining;
}

/**
 * DLS Par Score at any point in 2nd innings.
 * parScore = team1Score × (R2used / R1) [+ any G50 adjustment, simplified]
 * Where R1 = Team 1's total resource %, R2used = Team 2's resource used so far
 */
function dlsParScore(
  team1Score: number, team1Resource: number,
  team2OversUsed: number, team2TotalOvers: number, team2WicketsLost: number
): number {
  const r2Used = dlsResourceUsed(team2TotalOvers, team2OversUsed, team2WicketsLost);
  if (team1Resource <= 0) return 0;
  return Math.floor(team1Score * (r2Used / team1Resource));
}

/**
 * DLS revised target for Team 2.
 * Target = Team1Score × (R2 / R1) + 1
 * R1 = total resources AVAILABLE to Team 1 (may differ from full if rain hit 1st inn)
 * R2 = total resources AVAILABLE to Team 2 (may differ from R1 if overs reduced)
 */
function dlsRevisedTarget(team1Score: number, team1Resource: number, team2Resource: number): number {
  if (team1Resource <= 0) return team1Score + 1;
  return Math.ceil(team1Score * (team2Resource / team1Resource)) + 1;
}

// Distance-zone + phase + ability matchup scoring
// NEAR bowler → only 1, 2, 3
// MID distance → 4s and outs
// FAR distance → 6s
const MAX_BOUNDARY_BALLS = 5; // max 4/6 balls in arena at once

type DistZone = 'near' | 'mid' | 'far';

const getBallValue = (
  wickets: number, batAbility: number, bowlAbility: number,
  overNum: number, zone: DistZone,
  boundaryCount: number,
  extraBoundary: number = 0,
  extraOut: number = 0,
  boundaryOn: boolean = true,
  outOn: boolean = true,
  extraDot: number = 0,
  dotOn: boolean = true
): number => {
  const matchup = Math.max(-1, Math.min(1, (batAbility - bowlAbility) / 80));

  // If already at boundary cap, force scoring/out balls (no 4/6)
  const capReached = boundaryCount >= MAX_BOUNDARY_BALLS;

  let w0: number, w1: number, w2: number, w3: number, w4: number, w6: number, wOut: number;

  if (zone === 'near') {
    // NEAR: only rotation singles/doubles/threes — NO boundaries, NO outs
    w0 = 22; w1 = 30; w2 = 22; w3 = 8; w4 = 0; w6 = 0; wOut = 0;
  } else if (zone === 'mid') {
    // MID: fours + outs, no sixes
    if (overNum < 6) {
      if (wickets <= 2) { w0 = 18; w1 = 14; w2 = 8; w3 = 3; w4 = 26; w6 = 0; wOut = 5; }
      else              { w0 = 20; w1 = 14; w2 = 10; w3 = 4; w4 = 20; w6 = 0; wOut = 10; }
    } else if (overNum < 15) {
      if (wickets <= 3) { w0 = 22; w1 = 14; w2 = 10; w3 = 3; w4 = 22; w6 = 0; wOut = 8; }
      else              { w0 = 24; w1 = 13; w2 = 8; w3 = 2; w4 = 18; w6 = 0; wOut = 15; }
    } else {
      if (wickets <= 4) { w0 = 16; w1 = 10; w2 = 6; w3 = 2; w4 = 28; w6 = 0; wOut = 12; }
      else              { w0 = 18; w1 = 11; w2 = 6; w3 = 2; w4 = 20; w6 = 0; wOut = 20; }
    }
  } else {
    // FAR: sixes — big shots, also some outs (mis-hits)
    if (overNum < 6) {
      if (wickets <= 2) { w0 = 16; w1 = 10; w2 = 6; w3 = 2; w4 = 0; w6 = 28; wOut = 4; }
      else              { w0 = 18; w1 = 11; w2 = 8; w3 = 3; w4 = 0; w6 = 20; wOut = 8; }
    } else if (overNum < 15) {
      if (wickets <= 3) { w0 = 20; w1 = 13; w2 = 8; w3 = 2; w4 = 0; w6 = 20; wOut = 7; }
      else              { w0 = 22; w1 = 12; w2 = 8; w3 = 2; w4 = 0; w6 = 14; wOut = 13; }
    } else {
      if (wickets <= 4) { w0 = 14; w1 = 7; w2 = 4; w3 = 1; w4 = 0; w6 = 32; wOut = 10; }
      else              { w0 = 16; w1 = 8; w2 = 5; w3 = 1; w4 = 0; w6 = 22; wOut = 22; }
    }
  }

  // Matchup adjustment (only affects present types)
  if (w4 > 0) w4 = Math.max(1, w4 + matchup * 8);
  if (w6 > 0) w6 = Math.max(0.5, w6 + matchup * 6);
  if (wOut > 0) wOut = Math.max(1, wOut - matchup * 5);
  // Better bowler → more dots; better bat → fewer dots
  w0 = Math.max(0, w0 - matchup * 4);

  // If boundary toggle is OFF, zero out all boundary weights completely
  if (!boundaryOn) {
    w1 += w4 * 0.5 + w6 * 0.5;
    w2 += w4 * 0.3 + w6 * 0.3;
    w3 += w4 * 0.2 + w6 * 0.2;
    w4 = 0; w6 = 0;
  } else if (extraBoundary > 0) {
    // Extra boundary slider: each unit adds fixed weight to 4s/6s
    const addPer = 4; // weight per extra boundary unit
    if (zone === 'mid' || zone === 'near') {
      w4 += extraBoundary * addPer;
    } else {
      w6 += extraBoundary * addPer;
    }
  }

  // If out toggle is OFF, zero out all out weights completely
  if (!outOn) {
    w1 += wOut * 0.5;
    w2 += wOut * 0.3;
    w3 += wOut * 0.2;
    wOut = 0;
  } else if (extraOut > 0) {
    // Extra out slider: each unit adds fixed weight to wickets
    const addPer = 4; // weight per extra out unit
    wOut += extraOut * addPer;
  }

  // Dot ball toggle & slider
  if (!dotOn) {
    w1 += w0 * 0.6;
    w2 += w0 * 0.4;
    w0 = 0;
  } else if (extraDot > 0) {
    w0 += extraDot * 4;
  }

  // If boundary cap reached, redirect boundary weight into runs
  if (capReached) {
    w1 += w4 * 0.4 + w6 * 0.3;
    w2 += w4 * 0.3 + w6 * 0.3;
    w3 += w4 * 0.2 + w6 * 0.2;
    wOut += w4 * 0.1 + w6 * 0.2;
    w4 = 0; w6 = 0;
  }

  const total = w0 + w1 + w2 + w3 + w4 + w6 + wOut;
  let r = Math.random() * total;
  if ((r -= w0) < 0) return 0;
  if ((r -= w1) < 0) return 1;
  if ((r -= w2) < 0) return 2;
  if ((r -= w3) < 0) return 3;
  if ((r -= w4) < 0) return 4;
  if ((r -= w6) < 0) return 6;
  return -1;
};
const OUT_TYPES_WEIGHTED = [
  "bowled", "bowled", "bowled",
  "caught", "caught", "caught", "caught",
  "lbw", "lbw", "lbw",
  "run out",
];
const BALL_COLORS: Record<number, string> = {
  0: "#616161",
  1: "#ffffff",
  2: "#64b5f6",
  3: "#81c784",
  4: "#ffd54f",
  6: "#ffb74d",
  [-1]: "#ef5350",
};
const BALL_LABELS: Record<number, string> = {
  0: "•",
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  6: "6",
  [-1]: "W",
};
const SPECIAL_BALL_COLORS: Record<string, string> = {
  wide: "#42a5f5",
  noBall: "#ff7043",
  hitWicket: "#ffd54f",
};
const SPECIAL_BALL_LABELS: Record<string, string> = {
  wide: "WD",
  noBall: "NB",
  hitWicket: "HW",
};

/* ═══════════════════════════════════════════════════════
   PHYSICS HELPERS
   ═══════════════════════════════════════════════════════ */
function dist(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1,
    dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy) || 0.0001;
}

function separatePair(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number
) {
  const dx = bx - ax,
    dy = by - ay;
  const d = Math.sqrt(dx * dx + dy * dy) || 0.0001;
  const overlap = ar + br - d;
  if (overlap > 0) {
    const ux = dx / d,
      uy = dy / d;
    return {
      ax: ax - ux * (overlap / 2),
      ay: ay - uy * (overlap / 2),
      bx: bx + ux * (overlap / 2),
      by: by + uy * (overlap / 2),
    };
  }
  return { ax, ay, bx, by };
}

function bouncePairVel(
  avx: number,
  avy: number,
  bvx: number,
  bvy: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
) {
  const vx = avx - bvx,
    vy = avy - bvy;
  const dx = ax - bx,
    dy = ay - by;
  const d2 = dx * dx + dy * dy;
  if (d2 === 0) return { avx, avy, bvx, bvy };
  const dot = vx * dx + vy * dy;
  if (dot > 0) return { avx, avy, bvx, bvy };
  const s = dot / d2;
  return {
    avx: avx - dx * s,
    avy: avy - dy * s,
    bvx: bvx + dx * s,
    bvy: bvy + dy * s,
  };
}

function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  const dx = x2 - x1,
    dy = y2 - y1;
  const d2 = dx * dx + dy * dy;
  if (d2 === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  let t = ((px - x1) * dx + (py - y1) * dy) / d2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx,
    cy = y1 + t * dy;
  return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
}

let _nextBubbleId = 100; void _nextBubbleId;
let _nextBallId = 1;

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */
function getBowlerIndices(playing11: Player[]): number[] {
  const indices = playing11
    .map((p, i) =>
      p.role === "bowler" || p.role === "all-rounder" ? i : -1
    )
    .filter((i) => i >= 0);
  // Sort by bowling ability (best first) so the best bowler opens the attack
  indices.sort((a, b) => {
    const abA = getPlayerAbilities(playing11[a]).bowl;
    const abB = getPlayerAbilities(playing11[b]).bowl;
    return abB - abA;
  });
  return indices;
}

function freshBattingStats(n: number): BattingStats[] {
  return Array.from({ length: n }, () => ({
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    status: "dnb" as const,
  }));
}

function freshBowlingStats(n: number): BowlingStats[] {
  return Array.from({ length: n }, () => ({
    overs: 0,
    ballsInOver: 0,
    maidens: 0,
    runsConceded: 0,
    wickets: 0,
  }));
}

function autoPickSquad(team: IPLTeam): Player[] {
  const pool = [...team.squad];
  const selected: Player[] = [];
  let os = 0;
  const canAdd = (p: Player) => {
    if (selected.some((s) => s.name === p.name)) return false;
    if (p.isOverseas && os >= 4) return false;
    return true;
  };
  const add = (p: Player) => {
    selected.push(p);
    if (p.isOverseas) os++;
  };

  // 1+ WK (best batting WK)
  const wks = pool.filter((p) => p.role === "wicket-keeper")
    .sort((a, b) => getPlayerAbilities(b).bat - getPlayerAbilities(a).bat);
  for (const p of wks) {
    if (selected.length >= 1) break;
    if (canAdd(p)) add(p);
  }
  // Captain
  const cap = pool.find((p) => p.isCaptain);
  if (cap && canAdd(cap)) add(cap);
  // Top batsmen to ~5 total (sorted by batting ability)
  const bats = pool.filter((p) => p.role === "batsman")
    .sort((a, b) => getPlayerAbilities(b).bat - getPlayerAbilities(a).bat);
  for (const p of bats) {
    if (selected.length >= 5) break;
    if (canAdd(p)) add(p);
  }
  // All-rounders ≤3 (sorted by combined ability)
  const ars = pool.filter((p) => p.role === "all-rounder")
    .sort((a, b) => {
      const aA = getPlayerAbilities(a); const bA = getPlayerAbilities(b);
      return (bA.bat + bA.bowl) - (aA.bat + aA.bowl);
    });
  for (const p of ars) {
    if (selected.filter((s) => s.role === "all-rounder").length >= 3) break;
    if (canAdd(p)) add(p);
  }
  // Bowlers to fill (sorted by bowling ability)
  const bowls = pool.filter((p) => p.role === "bowler")
    .sort((a, b) => getPlayerAbilities(b).bowl - getPlayerAbilities(a).bowl);
  for (const p of bowls) {
    if (selected.length >= 11) break;
    if (canAdd(p)) add(p);
  }
  // Any remaining to 11
  for (const p of pool) {
    if (selected.length >= 11) break;
    if (canAdd(p)) add(p);
  }

  // Sort the final 11 into proper batting order:
  // Openers (WK + top bat) → Top order batsmen → Middle order (all-rounders) → Bowlers
  const battingOrder = [...selected].sort((a, b) => {
    const aA = getPlayerAbilities(a);
    const bA = getPlayerAbilities(b);
    // Priority tiers: higher tier = bats first
    const tierOf = (p: Player, ab: { bat: number; bowl: number }) => {
      if (p.role === 'wicket-keeper') return 5; // opener
      if (p.role === 'batsman') return 4;       // top order
      if (p.role === 'all-rounder') return ab.bat >= ab.bowl ? 3 : 2; // bat-AR before bowl-AR
      return 1; // bowler
    };
    const tA = tierOf(a, aA), tB = tierOf(b, bA);
    if (tA !== tB) return tB - tA; // higher tier first
    return bA.bat - aA.bat; // within tier, better bat first
  });

  return battingOrder.slice(0, 11);
}

function validateSquad(squad: Player[]): string | null {
  if (squad.length !== 11) return `Select exactly 11 players (${squad.length}/11)`;
  const os = squad.filter((p) => p.isOverseas).length;
  if (os > 4) return `Max 4 overseas allowed (${os} selected)`;
  const bowlers = squad.filter(
    (p) => p.role === "bowler" || p.role === "all-rounder"
  ).length;
  if (bowlers < 5) return `Need ≥5 bowlers/all-rounders (${bowlers} selected)`;
  const wk = squad.filter((p) => p.role === "wicket-keeper").length;
  if (wk < 1) return `Need at least 1 wicket-keeper`;
  return null;
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
const CricketPage: React.FC = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GamePhase>("team-select");
  const [selectedTeams, setSelectedTeams] = useState<
    [IPLTeam | null, IPLTeam | null]
  >([null, null]);
  const [squad1, setSquad1] = useState<Player[]>([]);
  const [squad2, setSquad2] = useState<Player[]>([]);
  const [impact1, setImpact1] = useState<Player | null>(null);
  const [impact2, setImpact2] = useState<Player | null>(null);
  const [impactBatPos1, setImpactBatPos1] = useState(7);
  const [impactBatPos2, setImpactBatPos2] = useState(7);
  const [impactSwapIdx1, setImpactSwapIdx1] = useState(-1);
  const [impactSwapIdx2, setImpactSwapIdx2] = useState(-1);
  const [impactTriggerOver1, setImpactTriggerOver1] = useState(6);
  const [impactTriggerOver2, setImpactTriggerOver2] = useState(6);
  const [impactInnings1, setImpactInnings1] = useState<'any' | '1st' | '2nd'>('any');
  const [impactInnings2, setImpactInnings2] = useState<'any' | '1st' | '2nd'>('any');
  const [impactCanBat1, setImpactCanBat1] = useState(true);
  const [impactCanBat2, setImpactCanBat2] = useState(true);
  const [impactCanBowl1, setImpactCanBowl1] = useState(false);
  const [impactCanBowl2, setImpactCanBowl2] = useState(false);
  // Match config: overs & rain
  const [matchOvers, setMatchOvers] = useState(20);
  const [rainAffected, setRainAffected] = useState(false);
  const [rainPercentage, setRainPercentage] = useState(30);
  // Rain timing controls
  type RainTiming = 'pre-match' | 'mid-1st' | 'between' | 'mid-2nd';
  const [rainTimings, setRainTimings] = useState<RainTiming[]>(['mid-1st']);
  const [rainInterruptionCount, setRainInterruptionCount] = useState(1);
  const [matchTeams, setMatchTeams] = useState<
    [TeamMatchState, TeamMatchState] | null
  >(null);
  const [testMode, setTestMode] = useState(false);
  const testModeRef = useRef(false);
  const [standings, setStandings] = useState<TournamentStanding[]>(() => loadStandings(false));

  // On mount, sync standings from server → localStorage → React state
  useEffect(() => {
    const mode = testModeRef.current ? "test" : "main";
    fetch(`http://localhost:5000/api/cricket/standings?mode=${mode}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          saveStandings(data, testModeRef.current);
          setStandings(data);
        }
      })
      .catch(() => {}); // server offline — use localStorage fallback
  }, []);

  // When testMode changes, reload the correct standings from server first, localStorage fallback
  useEffect(() => {
    testModeRef.current = testMode;
    const mode = testMode ? "test" : "main";
    fetch(`http://localhost:5000/api/cricket/standings?mode=${mode}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          saveStandings(data, testMode);
          setStandings(data);
        } else {
          setStandings(loadStandings(testMode));
        }
      })
      .catch(() => {
        setStandings(loadStandings(testMode));
      });
  }, [testMode]);

  const handleMatchEnd = useCallback((
    winner: string,
    team1Short: string,
    team2Short: string,
    t1Score: number,
    t1Overs: number,
    t2Score: number,
    t2Overs: number,
    isTestMode: boolean,
  ) => {
    // Load the mode-specific standings fresh to avoid cross-mode contamination
    const current = loadStandings(isTestMode);
    const next = current.map((s) => ({ ...s }));
    const s1 = next.find((s) => s.shortName === team1Short);
    const s2 = next.find((s) => s.shortName === team2Short);
    if (!s1 || !s2) return;
    s1.played++;
    s2.played++;
    s1.totalRunsScored += t1Score;
    s1.totalOversPlayed += t1Overs;
    s1.totalRunsConceded += t2Score;
    s1.totalOversBowled += t2Overs;
    s2.totalRunsScored += t2Score;
    s2.totalOversPlayed += t2Overs;
    s2.totalRunsConceded += t1Score;
    s2.totalOversBowled += t1Overs;
    if (winner === "Tie!") {
      s1.tied++; s2.tied++;
      s1.pts += 1; s2.pts += 1;
    } else if (winner === team1Short) {
      s1.won++; s2.lost++; s1.pts += 2;
    } else {
      s2.won++; s1.lost++; s2.pts += 2;
    }
    saveStandings(next, isTestMode);
    // Only update displayed standings if the match mode matches the current display mode
    if (isTestMode === testModeRef.current) {
      setStandings(next);
    }
    // Also save to server
    fetch("http://localhost:5000/api/cricket/standings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ standings: next, mode: isTestMode ? "test" : "main" }),
    }).then(r => { if (!r.ok) console.warn("Failed to save standings:", r.status); })
      .catch(e => console.warn("Standings save error (is server running?):", e.message));
  }, []);

  const syncServerTestMode = useCallback((enabled: boolean) => {
    fetch("http://localhost:5000/api/cricket/testmode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    }).catch(() => {});
  }, []);

  const resetToMainMode = useCallback(() => {
    setTestMode(false);
    testModeRef.current = false;
    syncServerTestMode(false);
  }, [syncServerTestMode]);

  const resetTournament = useCallback(() => {
    const mode = testModeRef.current;
    const fresh = getInitialStandings();
    saveStandings(fresh, mode);
    setStandings(fresh);
  }, []);

  /* ─── TEAM SELECT handlers ─── */
  const handleTeamClick = (t: IPLTeam) => {
    setSelectedTeams((prev) => {
      if (prev[0]?.id === t.id) return [null, prev[1]];
      if (prev[1]?.id === t.id) return [prev[0], null];
      if (!prev[0]) return [t, prev[1]];
      if (!prev[1]) return [prev[0], t];
      return [prev[0], t];
    });
  };

  const goToSquadSelect = () => {
    if (selectedTeams[0] && selectedTeams[1]) setPhase("squad-select");
  };

  /* ─── SQUAD SELECT handlers ─── */
  const togglePlayer = (
    squad: Player[],
    setter: React.Dispatch<React.SetStateAction<Player[]>>,
    p: Player
  ) => {
    const idx = squad.findIndex((s) => s.name === p.name);
    if (idx >= 0) setter(squad.filter((_, i) => i !== idx));
    else if (squad.length < 11) setter([...squad, p]);
  };

  const goToMatch = () => {
    const t1 = selectedTeams[0]!,
      t2 = selectedTeams[1]!;
    if (validateSquad(squad1) || validateSquad(squad2)) return;

    const mk = (team: IPLTeam, sq: Player[], impact: Player | null, impBatPos: number, impSwapIdx: number, impTriggerOver: number, impInnings: 'any' | '1st' | '2nd', canBat: boolean, canBowl: boolean): TeamMatchState => ({
      team,
      playing11: sq,
      score: 0,
      wickets: 0,
      ballsFaced: 0,
      battingStats: freshBattingStats(11),
      bowlingStats: freshBowlingStats(11),
      currentBatsmanIndices: [0, 1],
      nextBatsmanIndex: 2,
      currentBowlerIndex: 0,
      bowlerIndices: getBowlerIndices(sq),
      impactPlayer: impact,
      impactUsed: false,
      impactReplacedIdx: -1,
      impactBatPos: impBatPos,
      impactSwapIdx: impSwapIdx,
      impactTriggerOver: impTriggerOver,
      impactInnings: impInnings,
      impactCanBat: canBat,
      impactCanBowl: canBowl,
    });
    setMatchTeams([mk(t1, squad1, impact1, impactBatPos1, impactSwapIdx1, impactTriggerOver1, impactInnings1, impactCanBat1, impactCanBowl1), mk(t2, squad2, impact2, impactBatPos2, impactSwapIdx2, impactTriggerOver2, impactInnings2, impactCanBat2, impactCanBowl2)]);
    setPhase("match");
  };

  /* ─── RENDER BY PHASE ─── */
  if (phase === "team-select") {
    return (
      <TeamSelectScreen
        selected={selectedTeams}
        onSelect={handleTeamClick}
        onProceed={goToSquadSelect}
        onBack={() => navigate("/menu")}
      />
    );
  }

  if (phase === "squad-select" && selectedTeams[0] && selectedTeams[1]) {
    return (
      <SquadSelectScreen
        team1={selectedTeams[0]}
        team2={selectedTeams[1]}
        squad1={squad1}
        squad2={squad2}
        setSquad1={setSquad1}
        setSquad2={setSquad2}
        impact1={impact1}
        impact2={impact2}
        setImpact1={setImpact1}
        setImpact2={setImpact2}
        impactBatPos1={impactBatPos1}
        impactBatPos2={impactBatPos2}
        setImpactBatPos1={setImpactBatPos1}
        setImpactBatPos2={setImpactBatPos2}
        impactSwapIdx1={impactSwapIdx1}
        impactSwapIdx2={impactSwapIdx2}
        setImpactSwapIdx1={setImpactSwapIdx1}
        setImpactSwapIdx2={setImpactSwapIdx2}
        impactTriggerOver1={impactTriggerOver1}
        impactTriggerOver2={impactTriggerOver2}
        setImpactTriggerOver1={setImpactTriggerOver1}
        setImpactTriggerOver2={setImpactTriggerOver2}
        impactInnings1={impactInnings1}
        impactInnings2={impactInnings2}
        setImpactInnings1={setImpactInnings1}
        setImpactInnings2={setImpactInnings2}
        impactCanBat1={impactCanBat1}
        impactCanBat2={impactCanBat2}
        setImpactCanBat1={setImpactCanBat1}
        setImpactCanBat2={setImpactCanBat2}
        impactCanBowl1={impactCanBowl1}
        impactCanBowl2={impactCanBowl2}
        setImpactCanBowl1={setImpactCanBowl1}
        setImpactCanBowl2={setImpactCanBowl2}
        matchOvers={matchOvers}
        setMatchOvers={setMatchOvers}
        rainAffected={rainAffected}
        setRainAffected={setRainAffected}
        rainPercentage={rainPercentage}
        setRainPercentage={setRainPercentage}
        rainTimings={rainTimings}
        setRainTimings={setRainTimings}
        rainInterruptionCount={rainInterruptionCount}
        setRainInterruptionCount={setRainInterruptionCount}
        testMode={testMode}
        toggle={togglePlayer}
        onProceed={goToMatch}
        onBack={() => setPhase("team-select")}
      />
    );
  }

  if (phase === "match" && matchTeams) {
    return (
      <MatchScreen
        initialTeams={matchTeams}
        standings={standings}
        testMode={testMode}
        matchOvers={matchOvers}
        rainAffected={rainAffected}
        rainPercentage={rainPercentage}
        rainTimings={rainTimings}
        rainInterruptionCount={rainInterruptionCount}
        onTestModeChange={(v: boolean) => {
          setTestMode(v);
          testModeRef.current = v;
        }}
        onMatchEnd={handleMatchEnd}
        onResetTournament={resetTournament}
        onBackToTeams={() => {
          resetToMainMode();
          setPhase("team-select");
          setSelectedTeams([null, null]);
          setSquad1([]);
          setSquad2([]);
          setImpact1(null);
          setImpact2(null);
          setMatchTeams(null);
        }}
      />
    );
  }
  return null;
};

/* ═══════════════════════════════════════════════════════ *
 *  SCREEN 1: TEAM SELECTION                             *
 * ═══════════════════════════════════════════════════════ */
const TeamSelectScreen: React.FC<{
  selected: [IPLTeam | null, IPLTeam | null];
  onSelect: (t: IPLTeam) => void;
  onProceed: () => void;
  onBack: () => void;
}> = ({ selected, onSelect, onProceed, onBack }) => {
  const ok = !!(selected[0] && selected[1]);
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#0a0a1a 0%,#1a1a3e 50%,#0d0d2a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
        fontFamily: "system-ui,sans-serif",
        color: "#fff",
      }}
    >
      <h1
        style={{
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: 2,
          marginBottom: 8,
          background: "linear-gradient(90deg,#ffd700,#ff8c00)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        🏏 IPL CRICKET BRAWL
      </h1>
      <p style={{ color: "#888", fontSize: 16, marginBottom: 28 }}>
        Select 2 teams to battle
      </p>

      {/* Selected preview */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginBottom: 28,
        }}
      >
        <Badge team={selected[0]} label="Team 1" />
        <span style={{ fontSize: 22, fontWeight: 700, color: "#ffd700" }}>
          VS
        </span>
        <Badge team={selected[1]} label="Team 2" />
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))",
          gap: 14,
          maxWidth: 900,
          width: "100%",
        }}
      >
        {IPL_TEAMS.map((t) => {
          const sel =
            selected[0]?.id === t.id || selected[1]?.id === t.id;
          const num =
            selected[0]?.id === t.id ? 1 : selected[1]?.id === t.id ? 2 : 0;
          return (
            <div
              key={t.id}
              onClick={() => onSelect(t)}
              style={{
                background: sel
                  ? `${t.primaryColor}33`
                  : "rgba(255,255,255,0.05)",
                border: `2px solid ${
                  sel ? t.primaryColor : "rgba(255,255,255,0.1)"
                }`,
                borderRadius: 12,
                padding: 16,
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s",
                position: "relative",
                transform: sel ? "scale(1.03)" : "scale(1)",
                boxShadow: sel ? `0 0 20px ${t.primaryColor}44` : "none",
              }}
            >
              {num > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    background: "#ffd700",
                    color: "#000",
                    borderRadius: "50%",
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {num}
                </div>
              )}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg,${t.primaryColor},${t.secondaryColor})`,
                  margin: "0 auto 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 800,
                  color: t.textColor,
                  overflow: "hidden",
                }}
              >
                {teamLogo(t.shortName) ? (
                  <img src={teamLogo(t.shortName)} alt={t.shortName}
                    style={{ width: 48, height: 48, objectFit: "contain", opacity: 0.9 }} />
                ) : t.shortName}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: "#888" }}>
                Captain: {t.captain}
              </div>
              <div style={{ fontSize: 10, color: "#666", marginTop: 4 }}>
                {t.squad.length} players
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={ok ? onProceed : undefined}
        disabled={!ok}
        style={{
          marginTop: 28,
          padding: "14px 48px",
          background: ok
            ? "linear-gradient(90deg,#6b44ff,#a855f7)"
            : "#333",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          cursor: ok ? "pointer" : "default",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 1,
          opacity: ok ? 1 : 0.4,
        }}
      >
        Select Squads →
      </button>
      <button
        onClick={onBack}
        style={{
          marginTop: 10,
          padding: "10px 32px",
          background: "transparent",
          color: "#888",
          border: "1px solid #444",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        ↩ Back to Menu
      </button>
    </div>
  );
};

const Badge: React.FC<{ team: IPLTeam | null; label: string }> = ({
  team,
  label,
}) => (
  <div style={{ textAlign: "center", minWidth: 90 }}>
    {team ? (
      <>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: `linear-gradient(135deg,${team.primaryColor},${team.secondaryColor})`,
            margin: "0 auto 6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 800,
            color: team.textColor,
            border: `2px solid ${team.primaryColor}`,
            overflow: "hidden",
          }}
        >
          {teamLogo(team.shortName) ? (
            <img src={teamLogo(team.shortName)} alt={team.shortName}
              style={{ width: 40, height: 40, objectFit: "contain", opacity: 0.9 }} />
          ) : team.shortName}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{team.shortName}</div>
      </>
    ) : (
      <>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            margin: "0 auto 6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            color: "#555",
          }}
        >
          ?
        </div>
        <div style={{ fontSize: 12, color: "#555" }}>{label}</div>
      </>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════ *
 *  SCREEN 2: SQUAD SELECTION                            *
 * ═══════════════════════════════════════════════════════ */
const SquadSelectScreen: React.FC<{
  team1: IPLTeam;
  team2: IPLTeam;
  squad1: Player[];
  squad2: Player[];
  setSquad1: React.Dispatch<React.SetStateAction<Player[]>>;
  setSquad2: React.Dispatch<React.SetStateAction<Player[]>>;
  impact1: Player | null;
  impact2: Player | null;
  setImpact1: React.Dispatch<React.SetStateAction<Player | null>>;
  setImpact2: React.Dispatch<React.SetStateAction<Player | null>>;
  impactBatPos1: number;
  impactBatPos2: number;
  setImpactBatPos1: (n: number) => void;
  setImpactBatPos2: (n: number) => void;
  impactSwapIdx1: number;
  impactSwapIdx2: number;
  setImpactSwapIdx1: (n: number) => void;
  setImpactSwapIdx2: (n: number) => void;
  impactTriggerOver1: number;
  impactTriggerOver2: number;
  setImpactTriggerOver1: (n: number) => void;
  setImpactTriggerOver2: (n: number) => void;
  impactInnings1: 'any' | '1st' | '2nd';
  impactInnings2: 'any' | '1st' | '2nd';
  setImpactInnings1: (v: 'any' | '1st' | '2nd') => void;
  setImpactInnings2: (v: 'any' | '1st' | '2nd') => void;
  impactCanBat1: boolean;
  impactCanBat2: boolean;
  setImpactCanBat1: (v: boolean) => void;
  setImpactCanBat2: (v: boolean) => void;
  impactCanBowl1: boolean;
  impactCanBowl2: boolean;
  setImpactCanBowl1: (v: boolean) => void;
  setImpactCanBowl2: (v: boolean) => void;
  matchOvers: number;
  setMatchOvers: (n: number) => void;
  rainAffected: boolean;
  setRainAffected: (v: boolean) => void;
  rainPercentage: number;
  setRainPercentage: (n: number) => void;
  rainTimings: ('pre-match' | 'mid-1st' | 'between' | 'mid-2nd')[];
  setRainTimings: (v: ('pre-match' | 'mid-1st' | 'between' | 'mid-2nd')[]) => void;
  rainInterruptionCount: number;
  setRainInterruptionCount: (n: number) => void;
  testMode: boolean;
  toggle: (
    sq: Player[],
    set: React.Dispatch<React.SetStateAction<Player[]>>,
    p: Player
  ) => void;
  onProceed: () => void;
  onBack: () => void;
}> = ({
  team1,
  team2,
  squad1,
  squad2,
  setSquad1,
  setSquad2,
  impact1,
  impact2,
  setImpact1,
  setImpact2,
  impactBatPos1,
  impactBatPos2,
  setImpactBatPos1,
  setImpactBatPos2,
  impactSwapIdx1,
  impactSwapIdx2,
  setImpactSwapIdx1,
  setImpactSwapIdx2,
  impactTriggerOver1,
  impactTriggerOver2,
  setImpactTriggerOver1,
  setImpactTriggerOver2,
  impactInnings1,
  impactInnings2,
  setImpactInnings1,
  setImpactInnings2,
  impactCanBat1,
  impactCanBat2,
  setImpactCanBat1,
  setImpactCanBat2,
  impactCanBowl1,
  impactCanBowl2,
  setImpactCanBowl1,
  setImpactCanBowl2,
  matchOvers,
  setMatchOvers,
  rainAffected,
  setRainAffected,
  rainPercentage,
  setRainPercentage,
  rainTimings,
  setRainTimings,
  rainInterruptionCount,
  setRainInterruptionCount,
  testMode,
  toggle,
  onProceed,
  onBack,
}) => {
  const e1 = validateSquad(squad1);
  const e2 = validateSquad(squad2);
  const ok = !e1 && !e2;

  // Auto-pick impact player: best bench player by combined ability
  const autoPickImpact = (team: IPLTeam, squad: Player[]): Player | null => {
    const bench = team.squad.filter(p => !squad.some(s => s.name === p.name));
    if (!bench.length) return null;
    bench.sort((a, b) => {
      const aA = getPlayerAbilities(a), bA = getPlayerAbilities(b);
      return (bA.bat + bA.bowl) - (aA.bat + aA.bowl);
    });
    return bench[0];
  };

  // Pick squad from immediate previous match for this team, fallback to autoPickSquad
  const pickFromLastMatch = async (team: IPLTeam): Promise<Player[]> => {
    try {
      const mode = testMode ? 'test' : 'main';
      const res = await fetch(`http://localhost:5000/api/cricket/matches?mode=${mode}`);
      const matches: any[] = await res.json();
      // Find the IMMEDIATE (most recent) match involving this team
      // Matches are already sorted by date (newest last), so find first match with this team
      for (let i = 0; i < matches.length; i++) {
        const mt = matches[i];
        const teamData = mt.teams?.find((t: any) => t.shortName === team.shortName);
        if (!teamData?.batting?.length) continue;
        // Extract player names from batting scorecard (first 11 unique)
        const seen = new Set<string>();
        const names: string[] = [];
        for (const b of teamData.batting) {
          if (!seen.has(b.name) && names.length < 11) {
            seen.add(b.name);
            names.push(b.name);
          }
        }
        // Match names to actual squad players
        const sq: Player[] = [];
        for (const name of names) {
          const p = team.squad.find(s => s.name === name);
          if (p) sq.push(p);
        }
        if (sq.length === 11) return sq;
        // If some players missing (squad changed), fill remaining with autoPick
        if (sq.length >= 7) {
          const remaining = team.squad.filter(p => !sq.some(s => s.name === p.name));
          const os = sq.filter(p => p.isOverseas).length;
          for (const p of remaining) {
            if (sq.length >= 11) break;
            if (p.isOverseas && os >= 4) continue;
            sq.push(p);
          }
          if (sq.length === 11) return sq;
        }
      }
    } catch { /* ignore fetch errors */ }
    return autoPickSquad(team);
  };

  const handleAutoSquad1 = async () => {
    const sq = await pickFromLastMatch(team1);
    setSquad1(sq);
    setImpact1(autoPickImpact(team1, sq));
  };
  const handleAutoSquad2 = async () => {
    const sq = await pickFromLastMatch(team2);
    setSquad2(sq);
    setImpact2(autoPickImpact(team2, sq));
  };

  // Bench players (not in playing 11)
  const bench1 = team1.squad.filter(p => !squad1.some(s => s.name === p.name));
  const bench2 = team2.squad.filter(p => !squad2.some(s => s.name === p.name));

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#0a0a1a 0%,#1a1a3e 50%,#0d0d2a 100%)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui,sans-serif",
        color: "#fff",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", padding: "18px 0 10px" }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 1,
            margin: 0,
          }}
        >
          Select Playing XI
        </h2>
        <p style={{ color: "#888", fontSize: 12, margin: "6px 0 0" }}>
          Pick 11 per team · max 4 overseas (incl. impact) · min 5 bowlers/AR · min 1 WK · Impact Player from bench
        </p>
      </div>

      <div style={{ display: "flex", flex: 1, gap: 0, overflow: "hidden" }}>
        {/* Team 1 squad panel */}
        <SquadPanel
          team={team1}
          squad={squad1}
          setter={setSquad1}
          toggle={toggle}
          error={e1}
          onAuto={handleAutoSquad1}
        />

        {/* Team 1 Batting Order + Impact */}
        <BattingOrderPanel
          squad={squad1}
          setter={setSquad1}
          team={team1}
          bench={bench1}
          impact={impact1}
          setImpact={setImpact1}
          impactBatPos={impactBatPos1}
          setImpactBatPos={setImpactBatPos1}
          impactSwapIdx={impactSwapIdx1}
          setImpactSwapIdx={setImpactSwapIdx1}
          impactTriggerOver={impactTriggerOver1}
          setImpactTriggerOver={setImpactTriggerOver1}
          impactInnings={impactInnings1}
          setImpactInnings={setImpactInnings1}
          impactCanBat={impactCanBat1}
          setImpactCanBat={setImpactCanBat1}
          impactCanBowl={impactCanBowl1}
          setImpactCanBowl={setImpactCanBowl1}
        />

        <div
          style={{
            width: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.3)",
            borderLeft: "1px solid rgba(255,255,255,0.1)",
            borderRight: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#ffd700",
              writingMode: "vertical-lr",
            }}
          >
            VS
          </span>
        </div>

        {/* Team 2 Batting Order + Impact */}
        <BattingOrderPanel
          squad={squad2}
          setter={setSquad2}
          team={team2}
          bench={bench2}
          impact={impact2}
          setImpact={setImpact2}
          impactBatPos={impactBatPos2}
          setImpactBatPos={setImpactBatPos2}
          impactSwapIdx={impactSwapIdx2}
          setImpactSwapIdx={setImpactSwapIdx2}
          impactTriggerOver={impactTriggerOver2}
          setImpactTriggerOver={setImpactTriggerOver2}
          impactInnings={impactInnings2}
          setImpactInnings={setImpactInnings2}
          impactCanBat={impactCanBat2}
          setImpactCanBat={setImpactCanBat2}
          impactCanBowl={impactCanBowl2}
          setImpactCanBowl={setImpactCanBowl2}
        />

        {/* Team 2 squad panel */}
        <SquadPanel
          team={team2}
          squad={squad2}
          setter={setSquad2}
          toggle={toggle}
          error={e2}
          onAuto={handleAutoSquad2}
        />
      </div>

      {/* Bottom bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 18,
          padding: "10px 20px",
          background: "rgba(0,0,0,0.5)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          flexWrap: "wrap",
        }}
      >
        {/* Match Overs */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "#aaa", fontWeight: 600 }}>🏏 Overs:</span>
          <input type="range" min={5} max={20} step={1} value={matchOvers}
            onChange={(e) => setMatchOvers(parseInt(e.target.value))}
            style={{ width: 80, cursor: "pointer" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#ffd700", minWidth: 22, textAlign: "center" }}>{matchOvers}</span>
        </div>

        {/* Rain Affected */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
            <input type="checkbox" checked={rainAffected} onChange={(e) => setRainAffected(e.target.checked)} />
            <span style={{ fontSize: 11, color: rainAffected ? "#42a5f5" : "#888", fontWeight: 600 }}>🌧️ Rain</span>
          </label>
          {rainAffected && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input type="range" min={10} max={100} step={5} value={rainPercentage}
                  onChange={(e) => setRainPercentage(parseInt(e.target.value))}
                  style={{ width: 60, cursor: "pointer" }} />
                <span style={{
                  fontSize: 11, fontWeight: 700, minWidth: 28, textAlign: "center",
                  color: rainPercentage >= 100 ? "#ef5350" : rainPercentage >= 60 ? "#ff9800" : "#42a5f5",
                }}>{rainPercentage}%</span>
              </div>
              {/* Interruption count */}
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: 9, color: "#888" }}>×</span>
                <input type="range" min={1} max={5} step={1} value={rainInterruptionCount}
                  onChange={(e) => setRainInterruptionCount(parseInt(e.target.value))}
                  style={{ width: 60, cursor: "pointer" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#ffd700" }}>{rainInterruptionCount}</span>
              </div>
              {/* Rain timing checkboxes */}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {([
                  ['pre-match', 'Pre'],
                  ['mid-1st', '1st Inn'],
                  ['between', 'Break'],
                  ['mid-2nd', '2nd Inn'],
                ] as const).map(([val, label]) => {
                  const checked = rainTimings.includes(val);
                  return (
                    <label key={val} style={{
                      display: "flex", alignItems: "center", gap: 2, cursor: "pointer",
                      background: checked ? "#42a5f522" : "transparent",
                      border: `1px solid ${checked ? '#42a5f5' : '#555'}`,
                      borderRadius: 4, padding: "1px 5px",
                    }}>
                      <input type="checkbox" checked={checked}
                        onChange={() => {
                          if (checked) {
                            const next = rainTimings.filter(t => t !== val);
                            if (next.length > 0) setRainTimings(next);
                          } else {
                            setRainTimings([...rainTimings, val]);
                          }
                        }}
                        style={{ width: 10, height: 10 }} />
                      <span style={{ fontSize: 9, color: checked ? "#42a5f5" : "#888", fontWeight: 600 }}>{label}</span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <button
          onClick={onBack}
          style={{
            padding: "10px 28px",
            background: "#333",
            color: "#fff",
            border: "1px solid #555",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          ↩ Back
        </button>
        <button
          onClick={ok ? onProceed : undefined}
          disabled={!ok}
          style={{
            padding: "10px 48px",
            background: ok
              ? "linear-gradient(90deg,#4caf50,#66bb6a)"
              : "#333",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: ok ? "pointer" : "default",
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: 1,
            opacity: ok ? 1 : 0.4,
          }}
        >
          🏏 Start Match
        </button>
      </div>
    </div>
  );
};

/* ─── Batting Order + Impact Player Panel (between squad pick and VS) ─── */
const BattingOrderPanel: React.FC<{
  squad: Player[];
  setter: React.Dispatch<React.SetStateAction<Player[]>>;
  team: IPLTeam;
  bench: Player[];
  impact: Player | null;
  setImpact: React.Dispatch<React.SetStateAction<Player | null>>;
  impactBatPos: number;
  setImpactBatPos: (n: number) => void;
  impactSwapIdx: number;
  setImpactSwapIdx: (n: number) => void;
  impactTriggerOver: number;
  setImpactTriggerOver: (n: number) => void;
  impactInnings: 'any' | '1st' | '2nd';
  setImpactInnings: (v: 'any' | '1st' | '2nd') => void;
  impactCanBat: boolean;
  setImpactCanBat: (v: boolean) => void;
  impactCanBowl: boolean;
  setImpactCanBowl: (v: boolean) => void;
}> = ({ squad, setter, team, bench, impact, setImpact, impactBatPos, setImpactBatPos, impactSwapIdx, setImpactSwapIdx, impactTriggerOver, setImpactTriggerOver, impactInnings, setImpactInnings, impactCanBat, setImpactCanBat, impactCanBowl, setImpactCanBowl }) => {
  const [dragIdx, setDragIdx] = React.useState<number | null>(null);
  const [overIdx, setOverIdx] = React.useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
  };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIdx(idx);
  };
  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setOverIdx(null); return; }
    const next = [...squad];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(toIdx, 0, moved);
    setter(next);
    setDragIdx(null);
    setOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setOverIdx(null); };

  return (
    <div style={{
      width: 220, display: "flex", flexDirection: "column", overflow: "hidden",
      background: "rgba(0,0,0,0.25)",
      borderLeft: "1px solid rgba(255,255,255,0.08)",
      borderRight: "1px solid rgba(255,255,255,0.08)",
    }}>
      {/* Batting Order header */}
      <div style={{
        padding: "8px 10px", fontWeight: 700, fontSize: 11, letterSpacing: 1,
        color: team.primaryColor, borderBottom: `1px solid ${team.primaryColor}44`,
        background: `${team.primaryColor}11`, textAlign: "center",
      }}>
        🏏 BATTING ORDER
        <span style={{ fontSize: 8, color: "#888", fontWeight: 400, marginLeft: 4 }}>drag to reorder</span>
      </div>

      {/* Batting order list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 4px" }}>
        {squad.length === 0 && (
          <div style={{ color: "#666", fontSize: 11, textAlign: "center", padding: 20 }}>
            Select 11 players to set batting order
          </div>
        )}
        {squad.map((p, i) => {
          const isDragging = dragIdx === i;
          const isOver = overIdx === i && dragIdx !== null && dragIdx !== i;
          return (
            <div key={p.name}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "4px 6px", marginBottom: 1, borderRadius: 5,
                background: isDragging ? "rgba(255,215,0,0.15)" : isOver ? "rgba(33,150,243,0.18)" : i < 2 ? "rgba(76,175,80,0.12)" : "rgba(255,255,255,0.03)",
                border: isDragging ? "1px dashed #ffd700" : isOver ? "1px dashed #2196f3" : i < 2 ? "1px solid rgba(76,175,80,0.25)" : "1px solid transparent",
                opacity: isDragging ? 0.5 : 1,
                cursor: "grab",
                transition: "background 0.15s, border 0.15s",
              }}>
              <span style={{
                width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                background: i < 2 ? "#4caf50" : i < 5 ? "#2196f3" : "#555",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, color: "#fff",
              }}>{i + 1}</span>
              <div style={{
                flex: 1, minWidth: 0, fontSize: 11, fontWeight: 600, color: "#ddd",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {p.name.split(" ").pop()}
                <span style={{ fontSize: 9, color: ROLE_COLORS[p.role], marginLeft: 3 }}>
                  {p.role === "wicket-keeper" ? "WK" : p.role === "batsman" ? "BAT" : p.role === "all-rounder" ? "AR" : "BWL"}
                </span>
              </div>
              <span style={{ fontSize: 10, color: "#666", cursor: "grab", userSelect: "none" }}>☰</span>
            </div>
          );
        })}
      </div>

      {/* Impact Player section */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(156,39,176,0.08)",
      }}>
        <div style={{
          padding: "6px 10px", fontWeight: 700, fontSize: 10, letterSpacing: 1,
          color: "#ce93d8", display: "flex", alignItems: "center", gap: 4,
        }}>
          ⚡ IMPACT PLAYER
          <span style={{ fontSize: 8, color: "#888", fontWeight: 400 }}>(from bench)</span>
        </div>
        {squad.length < 11 ? (
          <div style={{ padding: "6px 10px", color: "#666", fontSize: 10 }}>
            Complete XI first
          </div>
        ) : bench.length === 0 ? (
          <div style={{ padding: "6px 10px", color: "#666", fontSize: 10 }}>
            No bench players
          </div>
        ) : (
          <div style={{ maxHeight: 120, overflowY: "auto", padding: "2px 6px 6px" }}>
            {bench.map(p => {
              const sel = impact?.name === p.name;
              const osInSquad = squad.filter(s => s.isOverseas).length;
              const osDisabled = !sel && p.isOverseas && osInSquad >= 4;
              return (
                <div key={p.name} onClick={() => !osDisabled && setImpact(sel ? null : p)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "4px 6px", marginBottom: 1, borderRadius: 5, cursor: osDisabled ? "not-allowed" : "pointer",
                    background: sel ? "rgba(156,39,176,0.25)" : osDisabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.03)",
                    border: sel ? "1px solid rgba(156,39,176,0.5)" : "1px solid transparent",
                    opacity: osDisabled ? 0.4 : 1,
                  }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                    border: `2px solid ${sel ? "#ce93d8" : "#555"}`,
                    background: sel ? "#9c27b0" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, color: "#fff", fontWeight: 700,
                  }}>{sel ? "✓" : ""}</div>
                  <div style={{
                    flex: 1, fontSize: 11, fontWeight: 600, color: sel ? "#e1bee7" : "#bbb",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {p.name.split(" ").pop()}
                    <span style={{ fontSize: 9, color: ROLE_COLORS[p.role], marginLeft: 3 }}>
                      {p.role === "wicket-keeper" ? "WK" : p.role === "batsman" ? "BAT" : p.role === "all-rounder" ? "AR" : "BWL"}
                    </span>
                  </div>
                  {p.isOverseas && (
                    <span style={{ fontSize: 8, padding: "1px 3px", background: "rgba(33,150,243,0.2)", color: "#42a5f5", borderRadius: 2, fontWeight: 600 }}>OS</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {impact && (
          <>
            <div style={{
              padding: "4px 10px 2px", fontSize: 10, color: "#ce93d8", fontWeight: 600,
            }}>
              Selected: {impact.name}
              <span style={{ fontSize: 9, color: "#888", marginLeft: 4 }}>
                ({impact.role === "wicket-keeper" ? "WK" : impact.role === "batsman" ? "BAT" : impact.role === "all-rounder" ? "AR" : "BWL"})
              </span>
            </div>
            {/* Bat / Bowl toggles */}
            <div style={{ padding: "2px 10px 4px", display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer", fontSize: 9, color: impactCanBat ? "#4caf50" : "#666", fontWeight: 600 }}>
                <input type="checkbox" checked={impactCanBat} onChange={e => { if (!e.target.checked && !impactCanBowl) return; setImpactCanBat(e.target.checked); }}
                  style={{ accentColor: "#4caf50", width: 12, height: 12 }} />
                🏏 Bat
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer", fontSize: 9, color: impactCanBowl ? "#2196f3" : "#666", fontWeight: 600 }}>
                <input type="checkbox" checked={impactCanBowl} onChange={e => { if (!e.target.checked && !impactCanBat) return; setImpactCanBowl(e.target.checked); }}
                  style={{ accentColor: "#2196f3", width: 12, height: 12 }} />
                🎳 Bowl
              </label>
            </div>
            {/* Swap with which player */}
            <div style={{
              padding: "2px 10px 4px", display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ fontSize: 9, color: "#bbb", fontWeight: 600, whiteSpace: "nowrap" }}>Swap with</span>
              <select
                value={impactSwapIdx}
                onChange={e => setImpactSwapIdx(Number(e.target.value))}
                style={{
                  flex: 1, fontSize: 10, padding: "2px 4px",
                  background: "#1a1a2e", color: "#ddd", border: "1px solid #555",
                  borderRadius: 4, cursor: "pointer",
                }}
              >
                <option value={-1}>Auto (weakest)</option>
                {squad.map((p, i) => (
                  <option key={p.name} value={i}>
                    #{i + 1} {p.name.split(" ").pop()}
                  </option>
                ))}
              </select>
            </div>
            {/* Batting position slider — shown when canBat */}
            {impactCanBat && (
              <div style={{
                padding: "2px 10px 6px", display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 9, color: "#bbb", fontWeight: 600 }}>Bat #</span>
                <input
                  type="range"
                  min={1}
                  max={11}
                  value={impactBatPos}
                  onChange={e => setImpactBatPos(Number(e.target.value))}
                  style={{ flex: 1, accentColor: "#ce93d8", height: 14, cursor: "pointer" }}
                />
                <span style={{
                  fontSize: 11, fontWeight: 700, color: "#ce93d8",
                  minWidth: 18, textAlign: "center",
                }}>{impactBatPos}</span>
              </div>
            )}
            {/* Trigger over slider — shown when canBowl */}
            {impactCanBowl && (
              <div style={{
                padding: "2px 10px 6px", display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 9, color: "#bbb", fontWeight: 600, whiteSpace: "nowrap" }}>Bowl Over</span>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={impactTriggerOver}
                  onChange={e => setImpactTriggerOver(Number(e.target.value))}
                  style={{ flex: 1, minWidth: 0, accentColor: "#ce93d8", height: 14, cursor: "pointer" }}
                />
                <span style={{
                  fontSize: 11, fontWeight: 700, color: "#ce93d8",
                  minWidth: 18, textAlign: "center",
                }}>{impactTriggerOver}</span>
              </div>
            )}
            {/* Innings preference */}
            <div style={{
              padding: "2px 10px 6px", display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ fontSize: 9, color: "#bbb", fontWeight: 600, whiteSpace: "nowrap" }}>Innings</span>
              <select
                value={impactInnings}
                onChange={e => setImpactInnings(e.target.value as 'any' | '1st' | '2nd')}
                style={{
                  flex: 1, fontSize: 10, padding: "2px 4px",
                  background: "#1a1a2e", color: "#ddd", border: "1px solid #555",
                  borderRadius: 4, cursor: "pointer",
                }}
              >
                <option value="any">Any</option>
                <option value="1st">1st Innings</option>
                <option value="2nd">2nd Innings</option>
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── Squad Panel (one side) ─── */
const SquadPanel: React.FC<{
  team: IPLTeam;
  squad: Player[];
  setter: React.Dispatch<React.SetStateAction<Player[]>>;
  toggle: (
    sq: Player[],
    set: React.Dispatch<React.SetStateAction<Player[]>>,
    p: Player
  ) => void;
  error: string | null;
  onAuto: () => void;
}> = ({ team, squad, setter, toggle, error, onAuto }) => {
  const os = squad.filter((p) => p.isOverseas).length;
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* team header */}
      <div
        style={{
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: `${team.primaryColor}22`,
          borderBottom: `2px solid ${team.primaryColor}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: `linear-gradient(135deg,${team.primaryColor},${team.secondaryColor})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 800,
              color: team.textColor,
              overflow: "hidden",
            }}
          >
            {teamLogo(team.shortName) ? (
              <img src={teamLogo(team.shortName)} alt={team.shortName}
                style={{ width: 28, height: 28, objectFit: "contain", opacity: 0.9 }} />
            ) : team.shortName}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{team.name}</div>
            <div style={{ fontSize: 10, color: "#888" }}>
              {squad.length}/11 · OS {os}/4
            </div>
          </div>
        </div>
        <button
          onClick={onAuto}
          style={{
            padding: "5px 12px",
            background: team.primaryColor,
            color: team.textColor,
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          Auto Pick
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "5px 14px",
            background: "rgba(239,83,80,0.15)",
            color: "#ef5350",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {/* player list grouped by role */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
        {(
          ["wicket-keeper", "batsman", "all-rounder", "bowler"] as PlayerRole[]
        ).map((role) => {
          const players = team.squad.filter((p) => p.role === role);
          if (!players.length) return null;
          return (
            <div key={role} style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: ROLE_COLORS[role],
                  letterSpacing: 1,
                  marginBottom: 3,
                  paddingLeft: 3,
                }}
              >
                {ROLE_LABELS[role]} ({players.length})
              </div>
              {players.map((p) => {
                const sel = squad.some((s) => s.name === p.name);
                const dis =
                  !sel &&
                  (squad.length >= 11 || (p.isOverseas && os >= 4));
                return (
                  <div
                    key={p.name}
                    onClick={() => !dis && toggle(squad, setter, p)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 8px",
                      marginBottom: 2,
                      borderRadius: 7,
                      cursor: dis ? "default" : "pointer",
                      background: sel
                        ? `${team.primaryColor}22`
                        : "rgba(255,255,255,0.03)",
                      border: `1px solid ${
                        sel
                          ? team.primaryColor + "66"
                          : "rgba(255,255,255,0.06)"
                      }`,
                      opacity: dis && !sel ? 0.3 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    {/* check */}
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        flexShrink: 0,
                        border: `2px solid ${sel ? team.primaryColor : "#555"}`,
                        background: sel ? team.primaryColor : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        color: team.textColor,
                        fontWeight: 700,
                      }}
                    >
                      {sel ? "✓" : ""}
                    </div>
                    {/* avatar */}
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: `${ROLE_COLORS[p.role]}33`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        color: ROLE_COLORS[p.role],
                        border: `1px solid ${ROLE_COLORS[p.role]}44`,
                      }}
                    >
                      {getInitials(p.name)}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#eee",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {p.name}
                      {p.isCaptain && (
                        <span
                          style={{
                            marginLeft: 4,
                            fontSize: 10,
                            color: "#ffd700",
                          }}
                        >
                          (C)
                        </span>
                      )}
                    </div>
                    {p.isOverseas && (
                      <span
                        style={{
                          fontSize: 9,
                          padding: "2px 5px",
                          background: "rgba(33,150,243,0.2)",
                          color: "#42a5f5",
                          borderRadius: 3,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        OS
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════ *
 *  SCREEN 3: MATCH                                       *
 * ═══════════════════════════════════════════════════════ */
const MatchScreen: React.FC<{
  initialTeams: [TeamMatchState, TeamMatchState];
  standings: TournamentStanding[];
  testMode: boolean;
  onTestModeChange: (v: boolean) => void;
  onMatchEnd: (winner: string, t1Short: string, t2Short: string, t1Score: number, t1Overs: number, t2Score: number, t2Overs: number, isTestMode: boolean) => void;
  onResetTournament: () => void;
  onBackToTeams: () => void;
  matchOvers?: number;
  rainAffected?: boolean;
  rainPercentage?: number;
  rainTimings?: string[];
  rainInterruptionCount?: number;
}> = ({ initialTeams, standings, testMode, onTestModeChange, onMatchEnd, onResetTournament, onBackToTeams, matchOvers: matchOversProp = 20, rainAffected: rainAffectedProp = false, rainPercentage: rainPercentageProp = 30, rainTimings: rainTimingsProp = ['mid-1st'], rainInterruptionCount: rainInterruptionCountProp = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);

  const [canvasW, setCanvasW] = useState(920);
  const [canvasH, setCanvasH] = useState(700);
  const [isRunning, setIsRunning] = useState(false);
  const [speedMul, setSpeedMul] = useState(1.2);
  const [ballSpeed, setBallSpeed] = useState(BALL_SPEED);
  const [spikeOn, setSpikeOn] = useState(false);
  const [spikeCount, setSpikeCount] = useState(4);
  const [spikeSize, setSpikeSize] = useState(30);
  const [spikes, setSpikes] = useState<Spike[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [extraBoundary, setExtraBoundary] = useState(0);
  const [extraOut, setExtraOut] = useState(0);
  const [extraDot, setExtraDot] = useState(0);
  const [boundaryEnabled, setBoundaryEnabled] = useState(true);
  const [outEnabled, setOutEnabled] = useState(true);
  const [dotEnabled, setDotEnabled] = useState(true);
  const extraBoundaryRef = useRef(0);
  const extraOutRef = useRef(0);
  const extraDotRef = useRef(0);
  const boundaryEnabledRef = useRef(true);
  const outEnabledRef = useRef(true);
  const dotEnabledRef = useRef(true);

  // Rain & overs config
  const effectiveOversRef = useRef(matchOversProp); // current effective max overs THIS innings
  const rainAffectedRef = useRef(rainAffectedProp);
  const rainPctRef = useRef(rainPercentageProp);
  // Rain interruption state
  type RainPhase = 'none' | 'freeze' | 'raining' | 'resuming' | 'abandoned';
  const [rainPhase, setRainPhase] = useState<RainPhase>('none');
  const rainPhaseRef = useRef<RainPhase>('none');
  const rainFreezeStartRef = useRef(0);
  const rainAnimStartRef = useRef(0);
  const rainInterruptionsRef = useRef(0); // how many rain halts have happened this innings
  const rainMaxInterruptions = useRef(0); // total scheduled for this match
  const rainScheduledOvers = useRef<number[]>([]); // overs at which rain will happen (this innings)
  const rainDropsRef = useRef<Array<{ x: number; y: number; speed: number; length: number }>>([]);
  // Frozen velocity backup
  const frozenVxRef = useRef(new Float32Array(3));
  const frozenVyRef = useRef(new Float32Array(3));
  const frozenBallsRef = useRef<Array<{ vx: number; vy: number }>>([]);
  // DLS tracking
  const dlsTargetRef = useRef<number | null>(null); // revised DLS target for 2nd innings
  const dlsParScoreRef = useRef<number>(0); // real-time par score during 2nd innings
  const dlsTeam1ResourceRef = useRef(0); // Team 1's total resource % used
  const dlsTeam2TotalOversRef = useRef(matchOversProp); // Team 2 scheduled overs
  const dlsInn1OversLostRef = useRef(0); // overs lost during 1st innings
  // Track which innings rain is scheduled for  
  const rainInn1Schedule = useRef<number[]>([]); // over numbers for 1st innings interruptions
  const rainInn2Schedule = useRef<number[]>([]); // over numbers for 2nd innings interruptions
  const rainInn1Count = useRef(0);
  const rainInn2Count = useRef(0);
  // Track pre-match rain delay
  const rainPreMatchDelay = useRef(false); // if true, match starts with reduced overs (scenario 1)
  const rainPreMatchOversLost = useRef(0);
  // Whether rain happened between innings
  const rainBetweenInnings = useRef(false);
  const rainBetweenInningsOversLost = useRef(0);

  const [teams, setTeams] =
    useState<[TeamMatchState, TeamMatchState]>(initialTeams);
  const [matchState, setMatchState] = useState<MatchState>({
    innings: 1,
    ballsInCurrentOver: 0,
    currentOver: 0,
    target: null,
    isComplete: false,
    winner: null,
    winMargin: null,
    potm: null,
    matchEndPhase: null,
    battingTeamIdx: 0,
    firstInningsScore: 0,
    thisOverBalls: [],
    currentOverRunsOnly: 0,
    isSuperOver: false,
    superOverNumber: 0,
  });
  const [showToss, setShowToss] = useState(false);
  const [tossResult, setTossResult] = useState<string | null>(null);
  const [tossPhase, setTossPhase] = useState<'flipping' | 'called' | 'result' | null>(null);
  const [tossCoinSide, setTossCoinSide] = useState<'heads' | 'tails'>('heads');
  const [tossCallingTeam, setTossCallingTeam] = useState<string>('');
  const [tossCall, setTossCall] = useState<'heads' | 'tails'>('heads');
  const [tossWonTeam, setTossWonTeam] = useState<string>('');
  const [tossChoice, setTossChoice] = useState<'bat' | 'bowl'>('bat');
  const [inningsTransition, setInningsTransition] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [preMatchRainOverlay, setPreMatchRainOverlay] = useState<null | 'raining' | 'reduced'>(null);
  const preMatchRainReduced = useRef(0); // overs after pre-match reduction
  const [tossMode, setTossMode] = useState<'auto' | 'manual'>('auto');
  const [manualTossWinner, setManualTossWinner] = useState<0 | 1>(0);
  const [manualTossChoice, setManualTossChoice] = useState<'bat' | 'bowl'>('bat');
  const [autoPhase, setAutoPhase] = useState(true);
  const autoPhaseRef = useRef(true);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Capture testMode at match start so toggling mid-match doesn't affect which standings file gets updated
  const matchModeRef = useRef(testMode);

  /* typed-array physics (3 bubbles) */
  const N = 3;
  const cntRef = useRef(0);
  const xRef = useRef(new Float32Array(N));
  const yRef = useRef(new Float32Array(N));
  const vxRef = useRef(new Float32Array(N));
  const vyRef = useRef(new Float32Array(N));
  const rRef = useRef(new Float32Array(N));
  const rTRef = useRef(new Float32Array(N));
  const growStart = useRef(0);
  const namesRef = useRef<string[]>([]);

  const ballsRef = useRef<CricketBall[]>([]);
  const specialBallsRef = useRef<CricketBall[]>([]);
  const widesThisInningsRef = useRef(0);
  const noBallsThisInningsRef = useRef(0);
  const hitWicketThisInningsRef = useRef(0);
  // Collected counters — only increment when bubble actually touches the special ball
  const widesCollectedRef = useRef(0);
  const noBallsCollectedRef = useRef(0);
  const hitWicketCollectedRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const lastSpecialSpawnRef = useRef(0);
  const tRef = useRef(teams);
  const mRef = useRef(matchState);
  const floatRef = useRef<FloatingText[]>([]);
  const milestoneRef = useRef<MilestoneAnim | null>(null);
  const impactAnimRef = useRef<ImpactAnim[]>([]);
  const consecutiveWicketsRef = useRef(0);
  const spikeTimers = useRef<Record<string, number>>({});
  const lastLiveSyncRef = useRef(0);
  const liveSyncIntervalMs = 10_000; // sync live stats every 10 seconds

  useEffect(() => {
    tRef.current = teams;
  }, [teams]);
  useEffect(() => {
    mRef.current = matchState;
  }, [matchState]);
  useEffect(() => {
    autoPhaseRef.current = autoPhase;
  }, [autoPhase]);

  // Local standings for the points table — reloaded fresh when the table phase shows
  const [tableStandings, setTableStandings] = useState<TournamentStanding[]>(standings);
  useEffect(() => {
    if (matchState.matchEndPhase === "table") {
      // First show localStorage data immediately, then try server for freshest data
      setTableStandings(loadStandings(matchModeRef.current));
      const mode = matchModeRef.current ? "test" : "main";
      fetch(`http://localhost:5000/api/cricket/standings?mode=${mode}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setTableStandings(data);
          }
        })
        .catch(() => {});
    }
  }, [matchState.matchEndPhase]);

  /* resize */
  useEffect(() => {
    const measure = () => {
      if (!arenaRef.current) return;
      const r = arenaRef.current.getBoundingClientRect();
      if (r.width > 100 && r.height > 100) {
        setCanvasW(Math.floor(r.width));
        setCanvasH(Math.floor(r.height));
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  /* spikes */
  useEffect(() => {
    if (!spikeOn || canvasW < 100 || canvasH < 100) {
      setSpikes([]);
      return;
    }
    const arr: Spike[] = [];
    const inset = spikeSize * 0.4;
    const l = WALL_PADDING + inset,
      r = canvasW - WALL_PADDING - inset;
    const t = WALL_PADDING + inset,
      b = canvasH - WALL_PADDING - inset;
    const pw = r - l,
      ph = b - t;
    const perim = 2 * pw + 2 * ph;
    for (let i = 0; i < Math.min(spikeCount, 20); i++) {
      const pos = ((i + 0.5) / Math.min(spikeCount, 20)) * perim;
      let sx: number,
        sy: number,
        nx: number,
        ny: number;
      if (pos < pw) {
        sx = l + pos;
        sy = t;
        nx = 0;
        ny = 1;
      } else if (pos < pw + ph) {
        sx = r;
        sy = t + (pos - pw);
        nx = -1;
        ny = 0;
      } else if (pos < 2 * pw + ph) {
        sx = r - (pos - pw - ph);
        sy = b;
        nx = 0;
        ny = -1;
      } else {
        sx = l;
        sy = b - (pos - 2 * pw - ph);
        nx = 1;
        ny = 0;
      }
      arr.push({ x: sx, y: sy, nx, ny });
    }
    setSpikes(arr);
  }, [spikeOn, spikeCount, spikeSize, canvasW, canvasH]);

  const detectSpikeHit = useCallback(
    (bx: number, by: number, br: number): Spike | null => {
      for (const s of spikes) {
        const tipX = s.x + s.nx * spikeSize,
          tipY = s.y + s.ny * spikeSize;
        const px = -s.ny,
          py = s.nx,
          hb = spikeSize / 2;
        const v1x = s.x + px * hb,
          v1y = s.y + py * hb;
        const v2x = s.x - px * hb,
          v2y = s.y - py * hb;
        if (
          Math.min(
            distanceToSegment(bx, by, v1x, v1y, v2x, v2y),
            distanceToSegment(bx, by, v2x, v2y, tipX, tipY),
            distanceToSegment(bx, by, tipX, tipY, v1x, v1y)
          ) <= br
        )
          return s;
      }
      return null;
    },
    [spikes, spikeSize]
  );

  /* pick next bowler — phase-aware: best bowlers in powerplay & death, others in middle.
     Ensures top 2-3 bowlers complete full 4-over quotas. */
  const pickNextBowler = useCallback(
    (bt: TeamMatchState, curIdx: number, overNum: number): number => {
      const idxs = bt.bowlerIndices;
      const stats = bt.bowlingStats;
      const playing = bt.playing11;

      // Sort bowler indices by bowling ability (descending) for ranking
      const ranked = [...idxs].sort((a, b) => {
        const abA = getPlayerAbilities(playing[a]).bowl;
        const abB = getPlayerAbilities(playing[b]).bowl;
        return abB - abA;
      });

      // Top bowlers (indices 0-2 in ranked) bowl during powerplay & death
      // Other bowlers bowl during middle overs
      const isPowerplay = overNum < 6;
      const isDeath = overNum >= 16;
      const topCount = Math.min(3, ranked.length);
      const topBowlers = new Set(ranked.slice(0, topCount));

      // Determine which bowlers are preferred for this phase
      const effectiveMaxOvers = effectiveOversRef.current;
      const maxOvPerBowler = mRef.current.isSuperOver ? SUPER_OVER_MAX_OVERS_PER_BOWLER : Math.ceil(effectiveMaxOvers / 5);
      const canBowl = (pi: number): boolean => {
        const tot = stats[pi].overs + (stats[pi].ballsInOver > 0 ? 1 : 0);
        return tot < maxOvPerBowler;
      };

      // Phase preference: try preferred bowlers first, then fallback to any available
      let preferred: number[] = [];
      let fallback: number[] = [];

      for (let off = 1; off <= idxs.length; off++) {
        const c = (curIdx + off) % idxs.length;
        const pi = idxs[c];
        if (!canBowl(pi)) continue;
        if ((isPowerplay || isDeath) && topBowlers.has(pi)) {
          preferred.push(c);
        } else if (!isPowerplay && !isDeath && !topBowlers.has(pi)) {
          preferred.push(c);
        } else {
          fallback.push(c);
        }
      }

      // Pick from preferred first, then fallback
      if (preferred.length > 0) return preferred[0];
      if (fallback.length > 0) return fallback[0];

      // All exhausted — just rotate
      return (curIdx + 1) % idxs.length;
    },
    []
  );

  /* position 3 bubbles for the innings */
  const setupInnings = useCallback(
    (batIdx: 0 | 1) => {
      const bowIdx = batIdx === 0 ? 1 : 0;
      const bat = tRef.current[batIdx];
      const bowl = tRef.current[bowIdx];

      cntRef.current = 3;
      const bat1 = bat.playing11[bat.currentBatsmanIndices[0]]?.name ?? "?";
      const bat2 = bat.playing11[bat.currentBatsmanIndices[1]]?.name ?? "?";
      const bowlPi = bowl.bowlerIndices[bowl.currentBowlerIndex];
      const bowlN = bowl.playing11[bowlPi]?.name ?? "?";

      xRef.current[0] = canvasW * 0.25;
      yRef.current[0] = canvasH * 0.5;
      xRef.current[1] = canvasW * 0.45;
      yRef.current[1] = canvasH * 0.5;
      xRef.current[2] = canvasW * 0.8;
      yRef.current[2] = canvasH * 0.5;
      for (let i = 0; i < 3; i++) {
        vxRef.current[i] =
          (Math.random() - 0.5) * BASE_SPEED * (i === 2 ? 0.7 : 1);
        vyRef.current[i] =
          (Math.random() - 0.5) * BASE_SPEED * (i === 2 ? 0.7 : 1);
        rRef.current[i] = INITIAL_RADIUS;
        rTRef.current[i] = BUBBLE_RADIUS;
      }
      namesRef.current = [bat1, bat2, bowlN];
      growStart.current = Date.now();
      ballsRef.current = [];
      specialBallsRef.current = [];
      widesThisInningsRef.current = 0;
      noBallsThisInningsRef.current = 0;
      hitWicketThisInningsRef.current = 0;
      widesCollectedRef.current = 0;
      noBallsCollectedRef.current = 0;
      hitWicketCollectedRef.current = 0;
      lastSpawnRef.current = 0;
      lastSpecialSpawnRef.current = 0;
      consecutiveWicketsRef.current = 0;
      milestoneRef.current = null;

      bat.battingStats[bat.currentBatsmanIndices[0]].status = "batting";
      bat.battingStats[bat.currentBatsmanIndices[1]].status = "batting";
    },
    [canvasW, canvasH]
  );

  /* startMatch */
  const startMatch = useCallback(() => {
    // Lock the mode for this match so toggling mid-match doesn't affect standings
    matchModeRef.current = testMode;

    // Initialize rain & DLS schedule
    // When rain is enabled, match starts at full MAX_OVERS; the slider value (matchOversProp)
    // is what rain will reduce overs TO. When rain is off, slider sets overs directly.
    const fullOvers = rainAffectedProp ? MAX_OVERS : matchOversProp;
    effectiveOversRef.current = fullOvers;
    rainAffectedRef.current = rainAffectedProp;
    rainPctRef.current = rainPercentageProp;
    rainInterruptionsRef.current = 0;
    rainPhaseRef.current = 'none';
    setRainPhase('none');
    dlsTargetRef.current = null;
    dlsParScoreRef.current = 0;
    dlsTeam1ResourceRef.current = 0;
    dlsTeam2TotalOversRef.current = fullOvers;
    dlsInn1OversLostRef.current = 0;
    rainDropsRef.current = [];
    rainPreMatchDelay.current = false;
    rainPreMatchOversLost.current = 0;
    rainBetweenInnings.current = false;
    rainBetweenInningsOversLost.current = 0;
    rainInn1Schedule.current = [];
    rainInn2Schedule.current = [];
    rainInn1Count.current = 0;
    rainInn2Count.current = 0;

    if (rainAffectedProp) {
      const pct = rainPercentageProp;
      const reducedTarget = matchOversProp; // slider value — what overs reduce TO
      const fullMax = MAX_OVERS;
      const timings = rainTimingsProp;
      const totalInterruptions = rainInterruptionCountProp;

      // Helper: pick unique random overs in [0..range)
      const pickOvers = (count: number, range: number): number[] => {
        const overs: number[] = [];
        for (let i = 0; i < count; i++) {
          let ov: number;
          let tries = 0;
          do {
            ov = Math.floor(Math.random() * range);
            tries++;
          } while (overs.includes(ov) && tries < 50);
          overs.push(ov);
        }
        return overs.sort((a, b) => a - b);
      };

      // ── Schedule based on user-selected timings ──
      const hasPreMatch = timings.includes('pre-match');
      const hasMid1st = timings.includes('mid-1st');
      const hasBetween = timings.includes('between');
      const hasMid2nd = timings.includes('mid-2nd');
      // Count in-play timing slots (mid-1st and mid-2nd)
      const inPlaySlots: string[] = [];
      if (hasMid1st) inPlaySlots.push('mid-1st');
      if (hasMid2nd) inPlaySlots.push('mid-2nd');

      // Pre-match: reduces overs from 20 to slider value before play starts
      if (hasPreMatch) {
        rainPreMatchDelay.current = true;
        const preMatchLost = fullMax - reducedTarget;
        rainPreMatchOversLost.current = preMatchLost;
        effectiveOversRef.current = reducedTarget;
      }

      const currentMax = effectiveOversRef.current; // after pre-match reduction

      // Between innings: reduces Team 2's overs
      if (hasBetween) {
        rainBetweenInnings.current = true;
        // Lose 1-3 overs between innings depending on rain %
        const lose = pct >= 60 ? 2 + Math.floor(Math.random() * 2) : 1 + (Math.random() < 0.4 ? 1 : 0);
        rainBetweenInningsOversLost.current = Math.min(lose, currentMax - DLS_MIN_OVERS);
      }

      // Distribute in-play interruptions across mid-1st and mid-2nd
      let inn1c = 0;
      let inn2c = 0;
      if (inPlaySlots.length === 2) {
        // Both selected: split interruptions
        inn1c = Math.ceil(totalInterruptions / 2);
        inn2c = totalInterruptions - inn1c;
      } else if (hasMid1st) {
        inn1c = totalInterruptions;
      } else if (hasMid2nd) {
        inn2c = totalInterruptions;
      }
      // If only pre-match and/or between selected (no mid-innings), no in-play rain
      // but if pct >= 100, force an abandonment in 1st innings
      if (pct >= 100 && inn1c === 0 && inn2c === 0) {
        inn1c = 1;
      }

      rainInn1Schedule.current = pickOvers(inn1c, currentMax);
      rainInn2Schedule.current = pickOvers(inn2c, currentMax);
      rainInn1Count.current = inn1c;
      rainInn2Count.current = inn2c;
      rainMaxInterruptions.current = inn1c + inn2c;

      // Set the active schedule for 1st innings
      rainScheduledOvers.current = rainInn1Schedule.current;
    } else {
      rainMaxInterruptions.current = 0;
      rainScheduledOvers.current = [];
    }

    // Helper: starts the toss + match sequence
    const beginTossSequence = () => {
    // Phase 1: coin flip animation starts
    setShowToss(true);
    setTossPhase('flipping');
    setTossResult(null);

    let winnerIdx: number;
    let winnerTeamName: string;
    let choice: 'bat' | 'bowl';
    let callingIdx: number;
    let callingTeamName: string;
    let call: 'heads' | 'tails';
    let coinLands: 'heads' | 'tails';

    if (tossMode === 'manual') {
      // Manual toss — user chose winner & election, but caller/call/coin are random
      winnerIdx = manualTossWinner;
      winnerTeamName = tRef.current[winnerIdx].team.shortName;
      choice = manualTossChoice;
      // Randomly pick which team calls and what they call
      callingIdx = Math.random() < 0.5 ? 0 : 1;
      callingTeamName = tRef.current[callingIdx].team.shortName;
      call = Math.random() < 0.5 ? 'heads' : 'tails';
      // Derive coin landing: if caller is the winner, coin must match call; otherwise opposite
      if (callingIdx === winnerIdx) {
        coinLands = call; // caller won => coin matches their call
      } else {
        coinLands = call === 'heads' ? 'tails' : 'heads'; // caller lost => coin is opposite
      }
    } else {
      callingIdx = Math.random() < 0.5 ? 0 : 1;
      callingTeamName = tRef.current[callingIdx].team.shortName;
      call = Math.random() < 0.5 ? 'heads' : 'tails';
      coinLands = Math.random() < 0.5 ? 'heads' : 'tails';
      const tossWon = call === coinLands;
      winnerIdx = tossWon ? callingIdx : (callingIdx === 0 ? 1 : 0);
      winnerTeamName = tRef.current[winnerIdx].team.shortName;
      choice = Math.random() < 0.5 ? 'bat' : 'bowl';
    }
    const batFirst = choice === 'bat' ? winnerIdx : (winnerIdx === 0 ? 1 : 0);

    setTossCallingTeam(callingTeamName);
    setTossCall(call);

    // Phase 2: After 2s flipping, show call
    setTimeout(() => {
      setTossCoinSide(coinLands);
      setTossPhase('called');
    }, 2000);

    // Phase 3: After 3.5s, show result
    setTimeout(() => {
      setTossWonTeam(winnerTeamName);
      setTossChoice(choice);
      setTossResult(`${winnerTeamName} won the toss and chose to ${choice}!`);
      setTossPhase('result');
    }, 3500);

    // Phase 4: After 6s, start match
    setTimeout(() => {
      setShowToss(false);
      setTossPhase(null);

      setTeams((p) => [
        {
          ...p[0],
          score: 0,
          wickets: 0,
          ballsFaced: 0,
          battingStats: freshBattingStats(11),
          bowlingStats: freshBowlingStats(11),
          currentBatsmanIndices: [0, 1],
          nextBatsmanIndex: 2,
          currentBowlerIndex: 0,
        },
        {
          ...p[1],
          score: 0,
          wickets: 0,
          ballsFaced: 0,
          battingStats: freshBattingStats(11),
          bowlingStats: freshBowlingStats(11),
          currentBatsmanIndices: [0, 1],
          nextBatsmanIndex: 2,
          currentBowlerIndex: 0,
        },
      ]);
      setMatchState({
        innings: 1,
        ballsInCurrentOver: 0,
        currentOver: 0,
        target: null,
        isComplete: false,
        winner: null,
        winMargin: null,
        potm: null,
        matchEndPhase: null,
        battingTeamIdx: batFirst as 0 | 1,
        firstInningsScore: 0,
        thisOverBalls: [],
        currentOverRunsOnly: 0,
        isSuperOver: false,
        superOverNumber: 0,
      });
      setupInnings(batFirst as 0 | 1);
      setIsRunning(true);
      setGameStarted(true);
      // Delay ball spawning by 2.5s so bubbles just bounce in the arena first
      lastSpawnRef.current = Date.now() + 2500;
    }, 6000);
    }; // end beginTossSequence

    // If pre-match rain is configured, show rain overlay first, then toss
    if (rainPreMatchDelay.current && rainPreMatchOversLost.current > 0) {
      preMatchRainReduced.current = effectiveOversRef.current;
      setPreMatchRainOverlay('raining');
      // Show rain for 3s
      setTimeout(() => {
        setPreMatchRainOverlay('reduced');
      }, 3000);
      // Show "reduced to X overs" for 2.5s, then start the toss
      setTimeout(() => {
        setPreMatchRainOverlay(null);
        beginTossSequence();
      }, 5500);
    } else {
      beginTossSequence();
    }
  }, [setupInnings, tossMode, manualTossWinner, manualTossChoice, testMode, matchOversProp, rainAffectedProp, rainPercentageProp, rainTimingsProp, rainInterruptionCountProp]);

  /* switchInnings */
  const switchInnings = useCallback(() => {
    setIsRunning(false);
    setInningsTransition(true);
    const m = mRef.current;
    const batT = tRef.current[m.battingTeamIdx];
    const newBat = m.battingTeamIdx === 0 ? 1 : 0;
    let tgt = batT.score + 1;

    // ── DLS Target Calculation at innings break ──
    // Use effective overs which accounts for pre-match reduction (Scenario 1)
    const inn1Overs = effectiveOversRef.current;
    // Overs actually bowled in 1st innings
    const oversBowled1 = m.currentOver + (m.ballsInCurrentOver > 0 ? m.ballsInCurrentOver / 6 : 0);
    const wickets1 = batT.wickets;

    // Team 1's resource used = resource for full innings minus resource remaining when innings ended
    const team1Resource = dlsResourceUsed(inn1Overs, oversBowled1, wickets1);
    dlsTeam1ResourceRef.current = team1Resource;

    // Calculate Team 2's available overs
    let team2Overs = inn1Overs; // default: same as Team 1 got
    
    // Scenario 3: Between-innings rain reduces Team 2's overs
    if (rainBetweenInnings.current && rainBetweenInningsOversLost.current > 0) {
      team2Overs = Math.max(DLS_MIN_OVERS, inn1Overs - rainBetweenInningsOversLost.current);
    }
    dlsTeam2TotalOversRef.current = team2Overs;
    effectiveOversRef.current = team2Overs;

    // Team 2's total resource (full innings, 0 wickets lost)
    const team2Resource = dlsTotalResource(team2Overs);
    const team1TotalResource = dlsTotalResource(inn1Overs);

    // Apply DLS if resources differ between teams
    const resourceDiff = Math.abs(team2Resource - team1Resource);
    if (rainAffectedRef.current && resourceDiff > 0.5) {
      // Scenario 2 (mid-1st-innings interruption wasted Team 1's resources) or
      // Scenario 3 (between-innings reduction) — use DLS revised target
      tgt = dlsRevisedTarget(batT.score, team1Resource, team2Resource);
      dlsTargetRef.current = tgt;
    } else if (rainBetweenInnings.current && team2Overs < inn1Overs) {
      // Even if resources are similar, between-innings shortened overs: simple ratio
      tgt = Math.round(batT.score * (team2Resource / team1TotalResource)) + 1;
      dlsTargetRef.current = tgt;
    }

    // Reset rain state for 2nd innings
    rainPhaseRef.current = 'none';
    setRainPhase('none');
    rainDropsRef.current = [];
    // Switch to 2nd innings rain schedule
    rainScheduledOvers.current = rainInn2Schedule.current;
    rainInterruptionsRef.current = 0;

    setTimeout(() => {
      setInningsTransition(false);
      setTeams((prev) => {
        const n = [...prev] as [TeamMatchState, TeamMatchState];
        n[newBat] = {
          ...n[newBat],
          score: 0,
          wickets: 0,
          ballsFaced: 0,
          battingStats: freshBattingStats(11),
          currentBatsmanIndices: [0, 1],
          nextBatsmanIndex: 2,
          currentBowlerIndex: 0,
        };
        n[m.battingTeamIdx] = {
          ...n[m.battingTeamIdx],
          bowlingStats: freshBowlingStats(11),
          currentBowlerIndex: 0,
        };
        return n;
      });
      setMatchState((p) => ({
        ...p,
        innings: 2,
        battingTeamIdx: newBat as 0 | 1,
        target: tgt,
        firstInningsScore: batT.score,
        currentOver: 0,
        ballsInCurrentOver: 0,
        thisOverBalls: [],
        currentOverRunsOnly: 0,
      }));
      setTimeout(() => {
        setupInnings(newBat as 0 | 1);
        setIsRunning(true);
      }, 500);
    }, 2500);
  }, [setupInnings, matchOversProp]);

  const advancePhase = useCallback(() => {
    const m = mRef.current;
    if (!m.isComplete || !m.matchEndPhase) return;
    const order: Array<"winner" | "scorecard" | "potm" | "table" | "actions"> = ["winner", "scorecard", "potm", "table", "actions"];
    const idx = order.indexOf(m.matchEndPhase);
    if (idx < order.length - 1) {
      const next = order[idx + 1];
      mRef.current = { ...mRef.current, matchEndPhase: next };
      setMatchState({ ...mRef.current });
    }
  }, []);

  const scheduleAutoPhase = useCallback(() => {
    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    if (!autoPhaseRef.current) return;
    phaseTimerRef.current = setTimeout(() => {
      advancePhase();
    }, 5000);
  }, [advancePhase]);

  // Auto-advance phases when matchEndPhase changes (if autoPhase enabled)
  useEffect(() => {
    if (!matchState.isComplete || !matchState.matchEndPhase) return;
    if (matchState.matchEndPhase === "table" || matchState.matchEndPhase === "actions") return; // don't auto-advance past table/actions
    if (autoPhase) {
      scheduleAutoPhase();
    }
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, [matchState.matchEndPhase, matchState.isComplete, autoPhase, scheduleAutoPhase]);

  // Ref to store main match data when super over starts (for NRR/standings)
  const superOverDataRef = useRef<{
    mainMatchT1Score: number;
    mainMatchT1Overs: number;
    mainMatchT2Score: number;
    mainMatchT2Overs: number;
  } | null>(null);

  // Super over announcement state
  const [showSuperOverSplash, setShowSuperOverSplash] = useState(false);

  const startSuperOver = useCallback(() => {
    setIsRunning(false);
    const t = tRef.current;
    const m = mRef.current;
    const soNum = (m.superOverNumber || 0) + 1;

    // Save main match data for NRR on first super over only
    if (!superOverDataRef.current) {
      superOverDataRef.current = {
        mainMatchT1Score: t[0].score,
        mainMatchT1Overs: t[0].ballsFaced / 6,
        mainMatchT2Score: t[1].score,
        mainMatchT2Overs: t[1].ballsFaced / 6,
      };
    }

    // Team that batted second bats first in super over
    const soBatFirst = m.battingTeamIdx as 0 | 1;

    // Show splash
    setShowSuperOverSplash(true);

    setTimeout(() => {
      setShowSuperOverSplash(false);

      // Reset both teams for super over
      for (const tm of t) {
        tm.score = 0;
        tm.wickets = 0;
        tm.ballsFaced = 0;
        tm.battingStats = freshBattingStats(11);
        tm.bowlingStats = freshBowlingStats(11);
        tm.currentBatsmanIndices = [0, 1];
        tm.nextBatsmanIndex = 2;
        tm.currentBowlerIndex = 0;
      }

      // Update match state for super over
      mRef.current = {
        ...m,
        innings: 1,
        ballsInCurrentOver: 0,
        currentOver: 0,
        target: null,
        isComplete: false,
        winner: null,
        winMargin: null,
        potm: null,
        matchEndPhase: null,
        battingTeamIdx: soBatFirst,
        firstInningsScore: 0,
        thisOverBalls: [],
        currentOverRunsOnly: 0,
        isSuperOver: true,
        superOverNumber: soNum,
      };
      setMatchState({ ...mRef.current });
      setTeams([{ ...t[0] }, { ...t[1] }]);

      setupInnings(soBatFirst);
      lastSpawnRef.current = Date.now() + 1500;
      setIsRunning(true);
    }, 3000);
  }, [setupInnings]);

  const endMatch = useCallback((w: string) => {
    setIsRunning(false);

    const t = tRef.current;
    const m = mRef.current;
    const batTeam = t[m.battingTeamIdx];

    // Force impact player substitution for any team that hasn't used theirs yet
    for (const tm of t) {
      if (!tm.impactUsed && tm.impactPlayer) {
        const imp = tm.impactPlayer;
        // Find worst unused slot in playing11
        let worstIdx = -1, worstScore = Infinity;
        const activeBats = new Set(tm.currentBatsmanIndices);
        for (let pi = 0; pi < 11; pi++) {
          if (activeBats.has(pi)) continue;
          if (tm.battingStats[pi].status !== 'dnb') continue;
          const pAb = getPlayerAbilities(tm.playing11[pi]);
          const score = pAb.bat + pAb.bowl;
          if (score < worstScore) { worstScore = score; worstIdx = pi; }
        }
        if (worstIdx >= 0) {
          tm.playing11[worstIdx] = imp;
          tm.battingStats[worstIdx] = { runs: 0, balls: 0, fours: 0, sixes: 0, status: 'dnb', outType: '' };
          tm.impactUsed = true;
          tm.impactReplacedIdx = worstIdx;
          tm.bowlerIndices = getBowlerIndices(tm.playing11);
        }
      }
    }

    // Sync final team scores to React state
    setTeams([{ ...t[0] }, { ...t[1] }]);

    /* ── win margin ── */
    let margin = "";
    const maxWk = m.isSuperOver ? SUPER_OVER_MAX_WICKETS : MAX_WICKETS;
    const soSuffix = m.isSuperOver ? " (Super Over)" : "";
    if (w === "Tie!") {
      margin = "Match Tied!";
    } else if (w === batTeam.team.shortName) {
      // batting team won (chasing) → by wickets
      const wicketsLeft = maxWk - batTeam.wickets;
      margin = `by ${wicketsLeft} wicket${wicketsLeft !== 1 ? "s" : ""}${soSuffix}`;
    } else {
      // bowling team won → by runs
      const runDiff = m.firstInningsScore - batTeam.score;
      margin = `by ${runDiff} run${runDiff !== 1 ? "s" : ""}${soSuffix}`;
    }

    /* ── Player of the Match ── */
    const calcPotmScore = (tm: TeamMatchState): { best: PlayerOfMatch; bestScore: number } => {
      let best: PlayerOfMatch = { name: "", team: tm.team.shortName, teamColor: tm.team.primaryColor, score: 0, batting: "-", bowling: "-" };
      let bestScore = -1;
      for (let i = 0; i < 11; i++) {
        const p = tm.playing11[i];
        if (!p) continue;
        const bs = tm.battingStats[i];
        const bw = tm.bowlingStats[i];
        // batting score
        let pts = bs.runs * 1;
        pts += bs.fours * 1;
        pts += bs.sixes * 2;
        if (bs.balls > 0) {
          const sr = (bs.runs / bs.balls) * 100;
          if (sr > 150) pts += 15;
          else if (sr > 120) pts += 8;
        }
        if (bs.runs >= 50) pts += 20;
        if (bs.runs >= 100) pts += 30;
        // bowling score
        const bowlBalls = bw.overs * 6 + bw.ballsInOver;
        pts += bw.wickets * 25;
        if (bowlBalls > 0) {
          const econ = (bw.runsConceded / bowlBalls) * 6;
          if (econ < 6) pts += 15;
          else if (econ < 8) pts += 8;
        }
        pts += bw.maidens * 10;
        if (bw.wickets >= 3) pts += 15;
        if (bw.wickets >= 5) pts += 25;
        // winner bonus
        if (w === tm.team.shortName) pts += 5;

        const batStr = bs.status !== "dnb" ? `${bs.runs}(${bs.balls})` : "-";
        const bowlStr = bowlBalls > 0 ? `${bw.wickets}/${bw.runsConceded}` : "-";
        if (pts > bestScore) {
          bestScore = pts;
          best = { name: p.name, team: tm.team.shortName, teamColor: tm.team.primaryColor, score: pts, batting: batStr, bowling: bowlStr };
        }
      }
      return { best, bestScore };
    };

    // POTM: only from the winning team (for ties, consider both)
    let potm: PlayerOfMatch;
    if (w === "Tie!") {
      const r0 = calcPotmScore(t[0]);
      const r1 = calcPotmScore(t[1]);
      potm = r0.bestScore >= r1.bestScore ? r0.best : r1.best;
    } else {
      const winIdx = w === t[0].team.shortName ? 0 : 1;
      potm = calcPotmScore(t[winIdx]).best;
    }

    // Mutate the ref directly so the game loop's sync code doesn't overwrite
    mRef.current = { ...mRef.current, isComplete: true, winner: w, winMargin: margin, potm, matchEndPhase: "winner" };
    setMatchState({ ...mRef.current });

    // Update tournament standings
    // Use main match data for NRR (super over runs/overs excluded per ICC rules)
    const t1 = t[0], t2 = t[1];
    let standingsT1Score: number, standingsT1Overs: number;
    let standingsT2Score: number, standingsT2Overs: number;
    if (m.isSuperOver && superOverDataRef.current) {
      // Super over: use main match data for NRR
      standingsT1Score = superOverDataRef.current.mainMatchT1Score;
      standingsT1Overs = superOverDataRef.current.mainMatchT1Overs;
      standingsT2Score = superOverDataRef.current.mainMatchT2Score;
      standingsT2Overs = superOverDataRef.current.mainMatchT2Overs;
    } else {
      // Regular match: use ballsFaced for accurate overs
      standingsT1Score = t1.score;
      standingsT1Overs = t1.ballsFaced / 6;
      standingsT2Score = t2.score;
      standingsT2Overs = t2.ballsFaced / 6;
    }

    onMatchEnd(w, t1.team.shortName, t2.team.shortName, standingsT1Score, standingsT1Overs, standingsT2Score, standingsT2Overs, matchModeRef.current);

    // Clear super over data ref after match ends
    superOverDataRef.current = null;

    // Save match stats to server
    const matchData = {
      id: `${t1.team.shortName}_vs_${t2.team.shortName}_${Date.now()}`,
      date: new Date().toISOString(),
      mode: matchModeRef.current ? "test" : "main",
      winner: w,
      winMargin: margin,
      potm: potm.name,
      potmTeam: potm.team,
      teams: t.map(tm => ({
        shortName: tm.team.shortName,
        name: tm.team.name,
        score: tm.score,
        wickets: tm.wickets,
        batting: tm.playing11.map((p, i) => {
          const bs = tm.battingStats[i];
          return { name: p.name, role: p.role, runs: bs.runs, balls: bs.balls, fours: bs.fours, sixes: bs.sixes, status: bs.status, outType: bs.outType };
        }),
        bowling: tm.bowlerIndices.map(idx => {
          const p = tm.playing11[idx];
          const bw = tm.bowlingStats[idx];
          return { name: p.name, role: p.role, overs: `${bw.overs}.${bw.ballsInOver}`, maidens: bw.maidens, runs: bw.runsConceded, wickets: bw.wickets };
        }),
      })),
    };
    fetch("http://localhost:5000/api/cricket/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(matchData),
    }).then(r => { if (!r.ok) console.warn("Failed to save match:", r.status); })
      .catch(e => console.warn("Match save error (is server running?):", e.message));

    // Clear live stats file now that match is complete
    fetch("http://localhost:5000/api/cricket/livestats", { method: "DELETE" }).catch(() => {});
  }, [onMatchEnd, testMode]);

  // Send live match stats to server periodically
  const syncLiveStats = useCallback(() => {
    const now = Date.now();
    if (now - lastLiveSyncRef.current < liveSyncIntervalMs) return;
    lastLiveSyncRef.current = now;
    const m = mRef.current;
    const t = tRef.current;
    if (m.isComplete) return;
    const liveData = {
      mode: matchModeRef.current ? "test" : "main",
      innings: m.innings,
      over: m.currentOver,
      ball: m.ballsInCurrentOver,
      battingTeamIdx: m.battingTeamIdx,
      target: m.target,
      firstInningsScore: m.firstInningsScore,
      teams: t.map(tm => ({
        shortName: tm.team.shortName,
        score: tm.score,
        wickets: tm.wickets,
        ballsFaced: tm.ballsFaced,
        batting: tm.playing11.map((p, i) => {
          const bs = tm.battingStats[i];
          return { name: p.name, runs: bs.runs, balls: bs.balls, fours: bs.fours, sixes: bs.sixes, status: bs.status };
        }),
        bowling: tm.bowlerIndices.map(idx => {
          const bw = tm.bowlingStats[idx];
          return { name: tm.playing11[idx].name, overs: bw.overs, ballsInOver: bw.ballsInOver, maidens: bw.maidens, runs: bw.runsConceded, wickets: bw.wickets };
        }),
      })),
    };
    fetch("http://localhost:5000/api/cricket/livestats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(liveData),
    }).catch(() => {});
  }, []);

  /* ═════════════ GAME LOOP ═════════════ */
  useLayoutEffect(() => {
    if (!isRunning || cntRef.current < 3) return;
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let lastTick = 0;

    const loop = (ts: number) => {
      if (ts - lastTick < TICK_MS) {
        animId = requestAnimationFrame(loop);
        return;
      }
      lastTick = ts;
      const now = Date.now();
      const CW = canvasW,
        CH = canvasH;
      const x = xRef.current,
        y = yRef.current,
        vx = vxRef.current,
        vy = vyRef.current,
        r = rRef.current,
        rT = rTRef.current;
      const n = 3;

      const m = mRef.current;
      const t = tRef.current;
      const batTeam = t[m.battingTeamIdx];
      const bowlIdx = m.battingTeamIdx === 0 ? 1 : 0;
      const bowlTeam = t[bowlIdx];

      // Effective limits (different for super over, custom overs)
      const customOvers = effectiveOversRef.current;
      const maxOv = m.isSuperOver ? SUPER_OVER_MAX_OVERS : customOvers;
      const maxWk = m.isSuperOver ? SUPER_OVER_MAX_WICKETS : MAX_WICKETS;

      // ── Rain interruption logic ──
      const rp = rainPhaseRef.current;
      if (rp === 'abandoned') {
        // Match abandoned — skip all game logic, just render
      } else if (rp === 'freeze') {
        // Bubbles and balls are frozen — check if freeze duration is over (1.5s)
        if (now - rainFreezeStartRef.current > 1500) {
          rainPhaseRef.current = 'raining';
          setRainPhase('raining');
          rainAnimStartRef.current = now;
          const drops: typeof rainDropsRef.current = [];
          for (let d = 0; d < 120; d++) {
            drops.push({
              x: Math.random() * CW,
              y: Math.random() * CH,
              speed: 4 + Math.random() * 6,
              length: 10 + Math.random() * 15,
            });
          }
          rainDropsRef.current = drops;
        }
      } else if (rp === 'raining') {
        const pct = rainPctRef.current;
        const rainDuration = pct >= 100 ? 4000 : pct >= 60 ? 3000 : 2000;
        if (now - rainAnimStartRef.current > rainDuration) {
          if (pct >= 100) {
            // ── Total abandonment ──
            rainPhaseRef.current = 'abandoned';
            setRainPhase('abandoned');
            rainDropsRef.current = [];
            if (m.innings === 2 && m.currentOver >= DLS_MIN_OVERS) {
              // Scenario 4 abandonment: compare score with DLS par
              const oversBowled2 = m.currentOver + (m.ballsInCurrentOver > 0 ? m.ballsInCurrentOver / 6 : 0);
              const team2Overs = effectiveOversRef.current;
              const parScore = dlsParScore(
                m.firstInningsScore,
                dlsTeam1ResourceRef.current,
                oversBowled2,
                team2Overs,
                batTeam.wickets
              );
              if (batTeam.score >= parScore) {
                endMatch(batTeam.team.shortName);
              } else {
                endMatch(bowlTeam.team.shortName);
              }
            } else {
              // Not enough overs for a result
              endMatch("Tie!");
            }
          } else {
            // Rain stops → resuming
            rainPhaseRef.current = 'resuming';
            setRainPhase('resuming');
            rainAnimStartRef.current = now;
          }
        }
      } else if (rp === 'resuming') {
        if (now - rainAnimStartRef.current > 1000) {
          rainPhaseRef.current = 'none';
          setRainPhase('none');
          rainDropsRef.current = [];
          // Restore velocities
          for (let i = 0; i < 3; i++) {
            vx[i] = frozenVxRef.current[i];
            vy[i] = frozenVyRef.current[i];
          }
          const fb = frozenBallsRef.current;
          const balls = ballsRef.current;
          for (let bi = 0; bi < balls.length && bi < fb.length; bi++) {
            balls[bi].vx = fb[bi].vx;
            balls[bi].vy = fb[bi].vy;
          }
          frozenBallsRef.current = [];

          // ── DLS calculations after rain resumes ──
          // Rain reduces overs toward the slider target (matchOversProp)
          const sliderTarget = rainAffectedRef.current ? matchOversProp : customOvers;
          const pctVal = rainPctRef.current;
          // Calculate how many overs to lose this interruption
          const oversToLose = Math.max(0, customOvers - sliderTarget);
          // For additional interruptions beyond the first, lose smaller amounts
          let oversLost: number;
          if (oversToLose > 0) {
            // Primary reduction: bring overs down toward slider target
            oversLost = oversToLose;
          } else {
            // Already at or below slider target — small additional loss based on rain %
            if (pctVal >= 60) {
              oversLost = 1 + Math.floor(Math.random() * 2); // 1-2 overs
            } else if (pctVal >= 30) {
              oversLost = Math.random() < 0.5 ? 1 : 0;
            } else {
              oversLost = 0;
            }
          }

          // Reduce effective overs (but never below DLS_MIN_OVERS)
          const newMaxOv = Math.max(DLS_MIN_OVERS, customOvers - oversLost);
          effectiveOversRef.current = newMaxOv;

          if (m.innings === 1) {
            // ── Scenario 2: Interruption during 1st innings ──
            // Team 1 "wasted" resources not knowing about the reduction.
            // Track overs lost; DLS target will be set in switchInnings.
            dlsInn1OversLostRef.current += (customOvers - newMaxOv);
            floatRef.current.push({
              id: _nextBallId++,
              x: CW / 2,
              y: CH / 2 - 40,
              text: `Overs reduced to ${newMaxOv}`,
              color: '#42a5f5',
              createdAt: now,
              duration: 3000,
            });
          } else if (m.innings === 2 && m.target !== null) {
            // ── Scenario 4: Interruption during 2nd innings ──
            // Recalculate target using DLS resource table
            const oversBowled2 = m.currentOver + (m.ballsInCurrentOver > 0 ? m.ballsInCurrentOver / 6 : 0);
            const team2ResourceUsed = dlsResourceUsed(customOvers, oversBowled2, batTeam.wickets);
            // Team 2's total resource is what they used + what they have left with new max overs
            const team2OversRemaining = Math.max(0, newMaxOv - oversBowled2);
            const team2ResourceRemaining = dlsResource(team2OversRemaining, batTeam.wickets);
            const team2Resource = team2ResourceUsed + team2ResourceRemaining;
            
            // Revised target using DLS
            const team1Res = dlsTeam1ResourceRef.current;
            const newTarget = dlsRevisedTarget(m.firstInningsScore, team1Res, team2Resource);
            dlsTargetRef.current = newTarget;
            dlsTeam2TotalOversRef.current = newMaxOv;
            mRef.current = { ...m, target: newTarget };
            setMatchState({ ...mRef.current });
            floatRef.current.push({
              id: _nextBallId++,
              x: CW / 2,
              y: CH / 2 - 40,
              text: `DLS Target: ${newTarget}`,
              color: '#42a5f5',
              createdAt: now,
              duration: 3000,
            });
          }
        }
      }

      // ── Trigger rain at scheduled over ──
      if (rp === 'none' && rainAffectedRef.current && !m.isComplete) {
        const sched = rainScheduledOvers.current;
        const intIdx = rainInterruptionsRef.current;
        if (intIdx < sched.length && m.currentOver >= sched[intIdx] && m.ballsInCurrentOver === 0) {
          rainPhaseRef.current = 'freeze';
          setRainPhase('freeze');
          rainFreezeStartRef.current = now;
          rainInterruptionsRef.current++;
          // Freeze all velocities
          for (let i = 0; i < 3; i++) {
            frozenVxRef.current[i] = vx[i];
            frozenVyRef.current[i] = vy[i];
            vx[i] = 0;
            vy[i] = 0;
          }
          frozenBallsRef.current = ballsRef.current.map(b => ({ vx: b.vx, vy: b.vy }));
          for (const b of ballsRef.current) {
            b.vx = 0;
            b.vy = 0;
          }
          floatRef.current.push({
            id: _nextBallId++,
            x: CW / 2,
            y: CH / 2,
            text: rainPctRef.current >= 100 ? '☁️ RAIN INCOMING!' : '🌧️ RAIN DELAY',
            color: '#42a5f5',
            createdAt: now,
            duration: 2000,
          });
        }
      }

      // ── Real-time DLS par score during 2nd innings ──
      if (m.innings === 2 && rainAffectedRef.current && !m.isComplete && rp === 'none') {
        const oversBowled2 = m.currentOver + (m.ballsInCurrentOver > 0 ? m.ballsInCurrentOver / 6 : 0);
        const team2Overs = effectiveOversRef.current;
        const parScore = dlsParScore(
          m.firstInningsScore,
          dlsTeam1ResourceRef.current,
          oversBowled2,
          team2Overs,
          batTeam.wickets
        );
        dlsParScoreRef.current = parScore;
      }

      // Skip physics if in a rain interruption phase (freeze/raining)
      const skipPhysics = rp === 'freeze' || rp === 'raining' || rp === 'abandoned';

      if (!skipPhysics) {
      /* growth */
      const ge = now - growStart.current;
      if (ge < GROW_DURATION_MS) {
        const gt = Math.min(1, ge / GROW_DURATION_MS);
        for (let i = 0; i < n; i++)
          r[i] = INITIAL_RADIUS + (rT[i] - INITIAL_RADIUS) * gt;
      } else {
        for (let i = 0; i < n; i++) r[i] = rT[i];
      }
      const grace = ge < 500;
      const step = speedMul * 1.5 + 0.5;
      const spd = BASE_SPEED * 0.6;

      /* movement */
      for (let i = 0; i < n; i++) {
        let nx = x[i] + vx[i] * step;
        let ny = y[i] + vy[i] * step;
        let nvx = vx[i],
          nvy = vy[i];
        const wl = WALL_PADDING + r[i],
          wr = CW - WALL_PADDING - r[i];
        const wt = WALL_PADDING + r[i],
          wb = CH - WALL_PADDING - r[i];
        if (nx < wl) {
          nx = wl;
          nvx = Math.abs(nvx);
        }
        if (nx > wr) {
          nx = wr;
          nvx = -Math.abs(nvx);
        }
        if (ny < wt) {
          ny = wt;
          nvy = Math.abs(nvy);
        }
        if (ny > wb) {
          ny = wb;
          nvy = -Math.abs(nvy);
        }
        if (nvx !== vx[i] || nvy !== vy[i]) {
          const cs = Math.sqrt(nvx * nvx + nvy * nvy) || spd;
          const a =
            Math.atan2(nvy, nvx) +
            (Math.random() - 0.5) * BOUNCE_DEVIATION;
          nvx = Math.cos(a) * cs;
          nvy = Math.sin(a) * cs;
        }
        const cs = Math.sqrt(nvx * nvx + nvy * nvy);
        const ts = i === 2 ? spd * 0.7 : spd;
        if (cs > 0.01) {
          nvx = (nvx / cs) * ts;
          nvy = (nvy / cs) * ts;
        } else {
          const a = Math.random() * Math.PI * 2;
          nvx = Math.cos(a) * ts;
          nvy = Math.sin(a) * ts;
        }
        x[i] = nx;
        y[i] = ny;
        vx[i] = nvx;
        vy[i] = nvy;
      }

      /* bubble-bubble */
      if (!grace) {
        for (let i = 0; i < n - 1; i++)
          for (let j = i + 1; j < n; j++) {
            const dx = x[i] - x[j],
              dy = y[i] - y[j];
            if (dx * dx + dy * dy < (r[i] + r[j]) ** 2) {
              const s = separatePair(
                x[i],
                y[i],
                r[i],
                x[j],
                y[j],
                r[j]
              );
              x[i] = s.ax;
              y[i] = s.ay;
              x[j] = s.bx;
              y[j] = s.by;
              const bv = bouncePairVel(
                vx[i],
                vy[i],
                vx[j],
                vy[j],
                x[i],
                y[i],
                x[j],
                y[j]
              );
              vx[i] = bv.avx;
              vy[i] = bv.avy;
              vx[j] = bv.bvx;
              vy[j] = bv.bvy;
            }
          }
      }

      /* spike collision */
      if (spikeOn && spikes.length) {
        for (let i = 0; i < n; i++) {
          const hit = detectSpikeHit(x[i], y[i], r[i]);
          if (hit) {
            const k = `s${i}`;
            if (now - (spikeTimers.current[k] ?? 0) > 300)
              spikeTimers.current[k] = now;
            const vdn = vx[i] * hit.nx + vy[i] * hit.ny;
            if (vdn < 0) {
              vx[i] -= 2 * vdn * hit.nx;
              vy[i] -= 2 * vdn * hit.ny;
            }
            x[i] = hit.x + hit.nx * (spikeSize * 0.8 + r[i] + 5);
            y[i] = hit.y + hit.ny * (spikeSize * 0.8 + r[i] + 5);
          }
        }
      }

      /* bowler shoots balls */
      if (
        !grace &&
        !m.isComplete &&
        m.currentOver < maxOv &&
        batTeam.wickets < maxWk
      ) {
        if (now - lastSpawnRef.current >= BALL_SPAWN_INTERVAL_MS) {
          lastSpawnRef.current = now;
          const ti = Math.random() < 0.5 ? 0 : 1;
          const dx = x[ti] - x[2],
            dy = y[ti] - y[2];

          // Wider angle deviation — bowler doesn't aim directly at batsman
          // Offset by ±40-80 degrees so balls spread across the arena
          const baseAng = Math.atan2(dy, dx);
          const deviation = (Math.random() - 0.5) * 2.8 + (Math.random() < 0.5 ? 0.4 : -0.4);
          const ang = baseAng + deviation;

          // Current boundary ball count in arena
          const boundaryCount = ballsRef.current.filter(
            ob => !ob.collected && (ob.value === 4 || ob.value === 6)
          ).length;

          // Get current batsman & bowler abilities for matchup-based scoring
          const _curBat = batTeam.playing11[batTeam.currentBatsmanIndices[ti]];
          const _curBowl = bowlTeam.playing11[bowlTeam.bowlerIndices[bowlTeam.currentBowlerIndex]];
          const _batA = _curBat ? getPlayerAbilities(_curBat) : { bat: 50, bowl: 50 };
          const _bowlA = _curBowl ? getPlayerAbilities(_curBowl) : { bat: 50, bowl: 50 };

          // Distance zone: measure distance from bowler to nearest batsman
          const d0 = Math.sqrt((x[0] - x[2]) ** 2 + (y[0] - y[2]) ** 2);
          const d1 = Math.sqrt((x[1] - x[2]) ** 2 + (y[1] - y[2]) ** 2);
          const minDist = Math.min(d0, d1);
          const arenaSize = Math.sqrt(CW * CW + CH * CH);
          const distRatio = minDist / arenaSize; // 0 = touching, ~0.7 = opposite corners
          let zone: DistZone;
          if (distRatio < 0.18) zone = 'near';
          else if (distRatio < 0.40) zone = 'mid';
          else zone = 'far';

          const val = getBallValue(batTeam.wickets, _batA.bat, _bowlA.bowl, m.currentOver, zone, boundaryCount, extraBoundaryRef.current, extraOutRef.current, boundaryEnabledRef.current, outEnabledRef.current, extraDotRef.current, dotEnabledRef.current);
          ballsRef.current.push({
            id: _nextBallId++,
            x: x[2],
            y: y[2],
            vx: Math.cos(ang) * ballSpeed,
            vy: Math.sin(ang) * ballSpeed,
            value: val,
            outType:
              val === -1
                ? OUT_TYPES_WEIGHTED[Math.floor(Math.random() * OUT_TYPES_WEIGHTED.length)]
                : "",
            radius: BALL_RADIUS,
            spawnedAt: now,
            collected: false,
          });
        }
      }

      /* ── Spawn special balls (wide / no ball / hit wicket) ── */
      if (!grace && !m.isComplete && m.currentOver < maxOv && batTeam.wickets < maxWk) {
        if (now - lastSpecialSpawnRef.current >= 1500) {
          const rng = Math.random();
          let spType: 'wide' | 'noBall' | 'hitWicket' | null = null;
          if (rng < HITWICKET_SPAWN_CHANCE && hitWicketThisInningsRef.current < MAX_HITWICKET_PER_INNINGS) {
            spType = 'hitWicket';
          } else if (rng < HITWICKET_SPAWN_CHANCE + NOBALL_SPAWN_CHANCE && noBallsThisInningsRef.current < MAX_NOBALLS_PER_INNINGS) {
            spType = 'noBall';
          } else if (rng < HITWICKET_SPAWN_CHANCE + NOBALL_SPAWN_CHANCE + WIDE_SPAWN_CHANCE && widesThisInningsRef.current < MAX_WIDES_PER_INNINGS) {
            spType = 'wide';
          }
          if (spType) {
            lastSpecialSpawnRef.current = now;
            // Increment counts on SPAWN, not collection, to prevent duplicates
            if (spType === 'hitWicket') hitWicketThisInningsRef.current++;
            else if (spType === 'noBall') noBallsThisInningsRef.current++;
            else if (spType === 'wide') widesThisInningsRef.current++;
            let spawnX: number, spawnY: number;
            if (spType === 'hitWicket') {
              // Spawn hit wicket at one of the 4 corners of the arena
              const cornerPadding = 5;
              const corners = [
                { x: WALL_PADDING + cornerPadding, y: WALL_PADDING + cornerPadding },           // top-left
                { x: CW - WALL_PADDING - cornerPadding, y: WALL_PADDING + cornerPadding },      // top-right
                { x: WALL_PADDING + cornerPadding, y: CH - WALL_PADDING - cornerPadding },      // bottom-left
                { x: CW - WALL_PADDING - cornerPadding, y: CH - WALL_PADDING - cornerPadding }, // bottom-right
              ];
              const corner = corners[Math.floor(Math.random() * 4)];
              spawnX = corner.x;
              spawnY = corner.y;
            } else {
              spawnX = WALL_PADDING + 40 + Math.random() * (CW - 2 * WALL_PADDING - 80);
              spawnY = WALL_PADDING + 40 + Math.random() * (CH - 2 * WALL_PADDING - 80);
            }
            specialBallsRef.current.push({
              id: _nextBallId++,
              x: spawnX,
              y: spawnY,
              vx: 0,
              vy: 0,
              value: 0,
              outType: '',
              radius: 18,
              spawnedAt: now,
              collected: false,
              specialType: spType,
            });
          }
        }
      }

      /* ── Special ball collection ── */
      specialBallsRef.current = specialBallsRef.current.filter((sb) => {
        if (sb.collected) return false;
        const life = sb.specialType === 'hitWicket' ? 2000 : SPECIAL_BALL_LIFETIME_MS;
        if (now - sb.spawnedAt > life) return false;
        // Check batsmen (indices 0,1) touch
        for (let bi = 0; bi < 2; bi++) {
          if (dist(sb.x, sb.y, x[bi], y[bi]) < r[bi] + sb.radius) {
            sb.collected = true;
            if (sb.specialType === 'hitWicket') {
              hitWicketCollectedRef.current++;
              // Batsman is OUT
              const batP = batTeam.currentBatsmanIndices[bi];
              const bowlP = bowlTeam.bowlerIndices[bowlTeam.currentBowlerIndex];
              batTeam.wickets++;
              batTeam.ballsFaced++;
              batTeam.battingStats[batP].balls++;
              batTeam.battingStats[batP].status = 'out';
              batTeam.battingStats[batP].outType = 'hit wicket';
              bowlTeam.bowlingStats[bowlP].wickets++;
              floatRef.current.push({ id: _nextBallId++, x: x[bi], y: y[bi] - r[bi] - 10, text: 'HIT WICKET!', color: '#ffd54f', createdAt: now });
              m.thisOverBalls = [...m.thisOverBalls, 'HW'];
              m.ballsInCurrentOver++;
              bowlTeam.bowlingStats[bowlP].ballsInOver++;
              if (m.ballsInCurrentOver >= BALLS_PER_OVER) {
                bowlTeam.bowlingStats[bowlP].overs++;
                if (m.currentOverRunsOnly === 0) bowlTeam.bowlingStats[bowlP].maidens++;
                bowlTeam.bowlingStats[bowlP].ballsInOver = 0;
                m.currentOver++;
                m.ballsInCurrentOver = 0;
                m.thisOverBalls = [];
                m.currentOverRunsOnly = 0;
                bowlTeam.currentBowlerIndex = pickNextBowler(bowlTeam, bowlTeam.currentBowlerIndex, m.currentOver);
                namesRef.current[2] = bowlTeam.playing11[bowlTeam.bowlerIndices[bowlTeam.currentBowlerIndex]]?.name ?? '?';
              }
              // Replace batsman
              if (batTeam.nextBatsmanIndex < 11 && batTeam.wickets < maxWk) {
                batTeam.currentBatsmanIndices[bi] = batTeam.nextBatsmanIndex;
                batTeam.battingStats[batTeam.nextBatsmanIndex].status = 'batting';
                namesRef.current[bi] = batTeam.playing11[batTeam.nextBatsmanIndex]?.name ?? '?';
                batTeam.nextBatsmanIndex++;
              }
              setTeams([{ ...tRef.current[0] }, { ...tRef.current[1] }]);
              setMatchState({ ...mRef.current });
            }
            return false;
          }
            // Wide: batsman collects
            if (sb.specialType === 'wide') {
              widesCollectedRef.current++;
              batTeam.score += 1;
              const bowlP = bowlTeam.bowlerIndices[bowlTeam.currentBowlerIndex];
              bowlTeam.bowlingStats[bowlP].runsConceded += 1;
              floatRef.current.push({ id: _nextBallId++, x: x[bi], y: y[bi] - r[bi] - 10, text: 'WIDE! +1', color: '#42a5f5', createdAt: now });
              m.thisOverBalls = [...m.thisOverBalls, 'Wd'];
              setTeams([{ ...tRef.current[0] }, { ...tRef.current[1] }]);
              setMatchState({ ...mRef.current });
              return false;
            }
        }
        // Check bowler (index 2) touch — for noBall only
        if (dist(sb.x, sb.y, x[2], y[2]) < r[2] + sb.radius) {
          sb.collected = true;
          if (sb.specialType === 'noBall') {
            noBallsCollectedRef.current++;
            batTeam.score += 1;
            const bowlP = bowlTeam.bowlerIndices[bowlTeam.currentBowlerIndex];
            bowlTeam.bowlingStats[bowlP].runsConceded += 1;
            floatRef.current.push({ id: _nextBallId++, x: x[2], y: y[2] - r[2] - 10, text: 'NO BALL! +1', color: '#ff7043', createdAt: now });
            m.thisOverBalls = [...m.thisOverBalls, 'Nb'];
            // Spawn free-hit 6 ball toward a random batsman with deviation
            const fhTarget = Math.random() < 0.5 ? 0 : 1;
            const fhDx = x[fhTarget] - x[2], fhDy = y[fhTarget] - y[2];
            const fhAng = Math.atan2(fhDy, fhDx) + (Math.random() - 0.5) * 1.0;
            ballsRef.current.push({
              id: _nextBallId++,
              x: x[2], y: y[2],
              vx: Math.cos(fhAng) * ballSpeed,
              vy: Math.sin(fhAng) * ballSpeed,
              value: 6, outType: '',
              radius: BALL_RADIUS,
              spawnedAt: now,
              collected: false,
            });
            setTeams([{ ...tRef.current[0] }, { ...tRef.current[1] }]);
            setMatchState({ ...mRef.current });
          }
          return false;
        }
        return true;
      });

      /* ball movement & collection */
      let changed = false;
      let wicketBubble = -1;

      // Immediately remove excess boundary balls (>5 of 4/6 combined)
      const liveBoundary = ballsRef.current.filter(ob => !ob.collected && (ob.value === 4 || ob.value === 6));
      if (liveBoundary.length > MAX_BOUNDARY_BALLS) {
        // Remove oldest boundary balls first
        liveBoundary.sort((a, b) => a.spawnedAt - b.spawnedAt);
        const excess = liveBoundary.length - MAX_BOUNDARY_BALLS;
        const toRemove = new Set(liveBoundary.slice(0, excess).map(b => b.id));
        ballsRef.current = ballsRef.current.filter(b => !toRemove.has(b.id));
      }

      ballsRef.current = ballsRef.current.filter((b) => {
        if (b.collected) return false;
        // Out-ball lifetime depends on over phase
        if (b.value === -1) {
          const outBallCount = ballsRef.current.filter(ob => !ob.collected && ob.value === -1).length;
          let maxOutBalls: number;
          let outLifetime: number;
          if (m.currentOver < 6) {
            maxOutBalls = 2;
            outLifetime = outBallCount > maxOutBalls ? 2000 : outBallCount > 1 ? 3000 : 5000;
          } else if (m.currentOver < 15) {
            maxOutBalls = 3;
            outLifetime = outBallCount > maxOutBalls ? 2000 : outBallCount > 1 ? 3000 : 5000;
          } else {
            maxOutBalls = 5;
            outLifetime = outBallCount > maxOutBalls ? 2000 : outBallCount > 2 ? 3000 : 5000;
          }
          if (now - b.spawnedAt > outLifetime) return false;
        } else if (b.value === 4 || b.value === 6) {
          // Boundary ball lifetime depends on how many boundary balls are alive
          const bCount = liveBoundary.length;
          let bLife: number;
          if (bCount > MAX_BOUNDARY_BALLS) bLife = 0;       // excess: instant remove (handled above, safety net)
          else if (bCount >= 5) bLife = 2000;                // 5 boundary balls → 2 sec
          else if (bCount >= 2) bLife = 4000;                // 2-4 boundary balls → 4 sec
          else bLife = 7000;                                 // 0-1 boundary balls → 7 sec
          if (now - b.spawnedAt > bLife) return false;
        } else if (now - b.spawnedAt > BALL_LIFETIME_MS) return false;
        b.x += b.vx * step;
        b.y += b.vy * step;
        // wall bounce
        if (b.x < WALL_PADDING + b.radius) {
          b.x = WALL_PADDING + b.radius;
          b.vx = Math.abs(b.vx);
        }
        if (b.x > CW - WALL_PADDING - b.radius) {
          b.x = CW - WALL_PADDING - b.radius;
          b.vx = -Math.abs(b.vx);
        }
        if (b.y < WALL_PADDING + b.radius) {
          b.y = WALL_PADDING + b.radius;
          b.vy = Math.abs(b.vy);
        }
        if (b.y > CH - WALL_PADDING - b.radius) {
          b.y = CH - WALL_PADDING - b.radius;
          b.vy = -Math.abs(b.vy);
        }

        // check batsmen
        for (let bi = 0; bi < 2; bi++) {
          if (dist(b.x, b.y, x[bi], y[bi]) < r[bi] + b.radius) {
            b.collected = true;
            const batP = batTeam.currentBatsmanIndices[bi];
            const bowlP =
              bowlTeam.bowlerIndices[bowlTeam.currentBowlerIndex];

            if (b.value > 0) {
              const prevRuns = batTeam.battingStats[batP].runs;
              batTeam.score += b.value;
              batTeam.ballsFaced++;
              batTeam.battingStats[batP].runs += b.value;
              batTeam.battingStats[batP].balls++;
              if (b.value === 4)
                batTeam.battingStats[batP].fours++;
              if (b.value === 6)
                batTeam.battingStats[batP].sixes++;
              bowlTeam.bowlingStats[bowlP].runsConceded += b.value;
              m.currentOverRunsOnly += b.value;
              consecutiveWicketsRef.current = 0; // reset on runs
              floatRef.current.push({
                id: _nextBallId++,
                x: x[bi],
                y: y[bi] - r[bi] - 10,
                text: `+${b.value}`,
                color: b.value >= 4 ? "#ffd54f" : "#81c784",
                createdAt: now,
              });
              // Milestone: half-century / century
              const newRuns = batTeam.battingStats[batP].runs;
              const batName = batTeam.playing11[batP]?.name ?? '?';
              if (prevRuns < 100 && newRuns >= 100) {
                milestoneRef.current = { text: '💯 CENTURY!', sub: `${batName} reaches ${newRuns}*`, color: '#ffd700', startedAt: now };
              } else if (prevRuns < 50 && newRuns >= 50) {
                milestoneRef.current = { text: '🔥 FIFTY!', sub: `${batName} reaches ${newRuns}*`, color: '#ff9800', startedAt: now };
              }
            } else if (b.value === 0) {
              // Dot ball — 0 runs scored
              batTeam.ballsFaced++;
              batTeam.battingStats[batP].balls++;
              consecutiveWicketsRef.current = 0;
              floatRef.current.push({
                id: _nextBallId++,
                x: x[bi],
                y: y[bi] - r[bi] - 10,
                text: "•",
                color: "#888",
                createdAt: now,
              });
            } else {
              batTeam.wickets++;
              batTeam.ballsFaced++;
              batTeam.battingStats[batP].balls++;
              batTeam.battingStats[batP].status = "out";
              batTeam.battingStats[batP].outType = b.outType;
              bowlTeam.bowlingStats[bowlP].wickets++;
              consecutiveWicketsRef.current++;
              wicketBubble = bi;
              floatRef.current.push({
                id: _nextBallId++,
                x: x[bi],
                y: y[bi] - r[bi] - 10,
                text: `OUT! (${b.outType})`,
                color: "#ef5350",
                createdAt: now,
              });
              // Milestone: hat-trick / fifer / 3-for
              const bowlName = bowlTeam.playing11[bowlTeam.bowlerIndices[bowlTeam.currentBowlerIndex]]?.name ?? '?';
              const bWickets = bowlTeam.bowlingStats[bowlP].wickets;
              if (consecutiveWicketsRef.current >= 3) {
                milestoneRef.current = { text: '🎩 HAT-TRICK!', sub: `${bowlName} — 3 in a row!`, color: '#e040fb', startedAt: now };
              } else if (bWickets === 5) {
                milestoneRef.current = { text: '⭐ FIFER!', sub: `${bowlName} takes ${bWickets} wickets!`, color: '#e040fb', startedAt: now };
              } else if (bWickets === 3) {
                milestoneRef.current = { text: '🔥 3-FOR!', sub: `${bowlName} takes ${bWickets} wickets!`, color: '#ff5722', startedAt: now };
              }
            }

            m.thisOverBalls = [...m.thisOverBalls, b.value];
            m.ballsInCurrentOver++;
            bowlTeam.bowlingStats[bowlP].ballsInOver++;
            changed = true;

            // over completion
            if (m.ballsInCurrentOver >= BALLS_PER_OVER) {
              bowlTeam.bowlingStats[bowlP].overs++;
              if (m.currentOverRunsOnly === 0)
                bowlTeam.bowlingStats[bowlP].maidens++;
              bowlTeam.bowlingStats[bowlP].ballsInOver = 0;
              m.currentOver++;
              m.ballsInCurrentOver = 0;
              m.thisOverBalls = [];
              m.currentOverRunsOnly = 0;
              bowlTeam.currentBowlerIndex = pickNextBowler(
                bowlTeam,
                bowlTeam.currentBowlerIndex,
                m.currentOver
              );
              const nb =
                bowlTeam.bowlerIndices[
                  bowlTeam.currentBowlerIndex
                ];
              namesRef.current[2] =
                bowlTeam.playing11[nb]?.name ?? "?";

              // ── Impact player auto-substitution: BOWLER only (at over completion) ──
              // Bowler impact: sub in to bowl starting at triggerOver (the over after trigger).
              // Requirement: the swapped-out bowler must have bowled at least 2 overs before trigger.
              if (!bowlTeam.impactUsed && bowlTeam.impactPlayer) {
                const imp = bowlTeam.impactPlayer;
                const inningsOk = bowlTeam.impactInnings === 'any'
                  || (bowlTeam.impactInnings === '1st' && m.innings === 1)
                  || (bowlTeam.impactInnings === '2nd' && m.innings === 2);
                if (bowlTeam.impactCanBowl && inningsOk) {
                  const triggerOver = bowlTeam.impactTriggerOver;
                  const swapTarget = bowlTeam.impactSwapIdx;
                  // Check: swap target bowler must have bowled >= 2 overs
                  const swapBowlerOvers = swapTarget >= 0 && swapTarget < 11
                    ? bowlTeam.bowlingStats[swapTarget].overs : 0;
                  const swapBowlerReady = swapTarget < 0 || swapBowlerOvers >= 2;
                  // Trigger at the configured over if swap bowler is ready
                  const shouldTrigger = swapBowlerReady && m.currentOver >= triggerOver;
                  if (shouldTrigger) {
                    let swapIdx = bowlTeam.impactSwapIdx;
                    const currentBowlerActual = bowlTeam.bowlerIndices[bowlTeam.currentBowlerIndex];
                    if (swapIdx >= 0 && swapIdx < 11 && swapIdx !== currentBowlerActual && bowlTeam.bowlerIndices.includes(swapIdx)) {
                      // User chose a specific bowler to swap
                    } else {
                      swapIdx = -1;
                      let worstScore = Infinity;
                      for (const bi of bowlTeam.bowlerIndices) {
                        if (bi === currentBowlerActual) continue;
                        const pAb = getPlayerAbilities(bowlTeam.playing11[bi]);
                        if (pAb.bowl < worstScore) { worstScore = pAb.bowl; swapIdx = bi; }
                      }
                    }
                    if (swapIdx >= 0) {
                      const replacedName = bowlTeam.playing11[swapIdx]?.name ?? '?';
                      bowlTeam.playing11[swapIdx] = imp;
                      bowlTeam.bowlingStats[swapIdx] = { overs: 0, maidens: 0, runsConceded: 0, wickets: 0, ballsInOver: 0 };
                      bowlTeam.impactUsed = true;
                      bowlTeam.impactReplacedIdx = swapIdx;
                      bowlTeam.bowlerIndices = getBowlerIndices(bowlTeam.playing11);
                      impactAnimRef.current.push({ playerIn: imp.name, playerOut: replacedName, teamName: bowlTeam.team.shortName, role: 'bowl', startedAt: now });
                    }
                  }
                }
              }
            }
            return false;
          }
        }
        return true;
      });

      /* ── Impact player: BATTER substitution (triggers on wicket) ── */
      // Rules:
      //   1. Impact batter's position is impactBatPos (e.g. 4 = comes in at #4, after 3 wickets)
      //   2. The swap target must be out — if not out yet, wait until they get out
      //   3. Once swap target is out AND wickets >= impactBatPos-1, sub immediately
      //   4. Innings preference must match
      if (wicketBubble >= 0 && !batTeam.impactUsed && batTeam.impactPlayer) {
        const imp = batTeam.impactPlayer;
        const inningsOk = batTeam.impactInnings === 'any'
          || (batTeam.impactInnings === '1st' && m.innings === 1)
          || (batTeam.impactInnings === '2nd' && m.innings === 2);
        if (batTeam.impactCanBat && inningsOk) {
          const positionReached = batTeam.wickets >= (batTeam.impactBatPos - 1);
          const swapTarget = batTeam.impactSwapIdx;
          // Check if swap target got out (either just now or previously)
          const targetIsOut = swapTarget >= 0 && swapTarget < 11 && batTeam.battingStats[swapTarget].status === 'out';
          // In auto mode (swapTarget < 0), just need position reached
          const shouldTrigger = (swapTarget < 0 && positionReached) || (targetIsOut && positionReached);
          if (shouldTrigger) {
            // Find the slot to replace in the upcoming batting order
            const activeBats = new Set(batTeam.currentBatsmanIndices);
            let swapIdx = -1;
            if (swapTarget >= 0 && swapTarget < 11 && !activeBats.has(swapTarget)) {
              swapIdx = swapTarget; // user's chosen player to replace
            } else {
              // Find weakest yet-to-bat player
              let worstScore = Infinity;
              for (let pi = batTeam.nextBatsmanIndex; pi < 11; pi++) {
                if (activeBats.has(pi)) continue;
                const pAb = getPlayerAbilities(batTeam.playing11[pi]);
                if (pAb.bat < worstScore) { worstScore = pAb.bat; swapIdx = pi; }
              }
            }
            if (swapIdx >= 0) {
              const replacedName = batTeam.playing11[swapIdx]?.name ?? '?';
              // Mark the replaced player as impacted out (won't bat)
              batTeam.battingStats[swapIdx].status = 'out';
              batTeam.battingStats[swapIdx].outType = 'impact sub';
              // Place impact player at swapIdx slot first
              batTeam.playing11[swapIdx] = imp;
              batTeam.battingStats[swapIdx] = { runs: 0, balls: 0, fours: 0, sixes: 0, status: 'dnb', outType: '' };
              batTeam.impactUsed = true;
              batTeam.impactReplacedIdx = swapIdx;
              // Now shift: move impact player from swapIdx to targetPos (impactBatPos - 1)
              // If swapIdx is a bowler who completed their spell (subbed out), 
              // place impact player directly at impactBatPos instead of bowler's position
              const targetPos = batTeam.impactBatPos - 1;
              if (swapIdx !== targetPos && targetPos < 11) {
                // Place impact player at the desired batting position (targetPos)
                // Shift players between swapIdx and targetPos
                if (swapIdx > targetPos) {
                  // Impact player is below target — shift players between targetPos..swapIdx-1 down
                  const impPlayer = batTeam.playing11[swapIdx];
                  const impStat = batTeam.battingStats[swapIdx];
                  for (let si = swapIdx; si > targetPos; si--) {
                    batTeam.playing11[si] = batTeam.playing11[si - 1];
                    batTeam.battingStats[si] = batTeam.battingStats[si - 1];
                  }
                  batTeam.playing11[targetPos] = impPlayer;
                  batTeam.battingStats[targetPos] = impStat;
                } else {
                  // Impact player is above target — shift players between swapIdx+1..targetPos up
                  const impPlayer = batTeam.playing11[swapIdx];
                  const impStat = batTeam.battingStats[swapIdx];
                  for (let si = swapIdx; si < targetPos; si++) {
                    batTeam.playing11[si] = batTeam.playing11[si + 1];
                    batTeam.battingStats[si] = batTeam.battingStats[si + 1];
                  }
                  batTeam.playing11[targetPos] = impPlayer;
                  batTeam.battingStats[targetPos] = impStat;
                }
                batTeam.impactReplacedIdx = targetPos;
              }
              batTeam.bowlerIndices = getBowlerIndices(batTeam.playing11);
              impactAnimRef.current.push({ playerIn: imp.name, playerOut: replacedName, teamName: batTeam.team.shortName, role: 'bat', startedAt: now });
            }
          }
        }
      }

      /* new batsman after wicket */
      if (wicketBubble >= 0) {
        if (
          batTeam.nextBatsmanIndex < 11 &&
          batTeam.wickets < maxWk
        ) {
          batTeam.currentBatsmanIndices[wicketBubble] =
            batTeam.nextBatsmanIndex;
          batTeam.battingStats[batTeam.nextBatsmanIndex].status =
            "batting";
          batTeam.nextBatsmanIndex++;
          namesRef.current[wicketBubble] =
            batTeam.playing11[
              batTeam.currentBatsmanIndices[wicketBubble]
            ]?.name ?? "?";
        }
      }

      /* innings / match end */
      if (changed) {
        // 2nd innings chase
        if (
          m.innings === 2 &&
          m.target !== null &&
          batTeam.score >= m.target
        ) {
          endMatch(batTeam.team.shortName);
        } else if (
          batTeam.wickets >= maxWk ||
          m.currentOver >= maxOv
        ) {
          if (m.innings === 1) {
            switchInnings();
          } else {
            if (batTeam.score >= (m.target ?? Infinity))
              endMatch(batTeam.team.shortName);
            else if (batTeam.score === m.firstInningsScore)
              startSuperOver();
            else endMatch(bowlTeam.team.shortName);
          }
        }
      }

      /* floating cleanup */
      // (moved outside skipPhysics block)
      if ((changed || wicketBubble >= 0) && !mRef.current.isComplete) {
        setTeams([{ ...tRef.current[0] }, { ...tRef.current[1] }]);
        setMatchState({ ...mRef.current });
      }

      /* sync live stats to server periodically */
      syncLiveStats();
      } // end if (!skipPhysics)

      // Float cleanup runs always (even during rain)
      floatRef.current = floatRef.current.filter(
        (f) => {
          const age = now - f.createdAt;
          return age < 0 || age < (f.duration ?? 1500);
        }
      );

      // Animate rain drops
      if (rainPhaseRef.current === 'raining' || rainPhaseRef.current === 'resuming') {
        for (const drop of rainDropsRef.current) {
          drop.y += drop.speed;
          drop.x -= drop.speed * 0.3;
          if (drop.y > CH) { drop.y = -drop.length; drop.x = Math.random() * CW; }
          if (drop.x < 0) drop.x = CW;
        }
      }

      /* ═════════ CANVAS RENDERING ═════════ */
      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, CW, CH);

      // border
      ctx.strokeStyle = batTeam.team.primaryColor + "66";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        WALL_PADDING,
        WALL_PADDING,
        CW - 2 * WALL_PADDING,
        CH - 2 * WALL_PADDING
      );

      // pitch strip
      const pw = 60,
        ph = CH * 0.5;
      const px = CW / 2 - pw / 2,
        py = CH / 2 - ph / 2;
      ctx.fillStyle = "rgba(194,178,128,0.22)";
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = "rgba(194,178,128,0.40)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, pw, ph);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.moveTo(px, py + 30);
      ctx.lineTo(px + pw, py + 30);
      ctx.moveTo(px, py + ph - 30);
      ctx.lineTo(px + pw, py + ph - 30);
      ctx.stroke();

      // ── Cricket field decorations (very transparent) ──
      const cx0 = CW / 2, cy0 = CH / 2;
      const boundaryRx = (CW - 2 * WALL_PADDING) * 0.46;
      const boundaryRy = (CH - 2 * WALL_PADDING) * 0.46;

      // Boundary rope (outer oval)
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx0, cy0, boundaryRx, boundaryRy, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 30-yard circle (inner ring)
      const innerRx = boundaryRx * 0.52;
      const innerRy = boundaryRy * 0.52;
      ctx.beginPath();
      ctx.ellipse(cx0, cy0, innerRx, innerRy, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Fielder positions (angle from center, distance factor 0-1 of boundary)
      // Angles: 0=right, PI/2=down, PI=left, -PI/2=up
      // Batting end is top of pitch, bowling end is bottom
      const fielderPositions = [
        // Close catchers
        { a: -0.35, d: 0.22, label: "SL" },    // Slip
        { a: -0.55, d: 0.25, label: "GL" },    // Gully
        { a: 2.8,   d: 0.22, label: "LG" },    // Leg slip
        // Inner ring
        { a: -0.9,  d: 0.42, label: "PT" },    // Point
        { a: -1.1,  d: 0.55, label: "CV" },    // Cover
        { a: -1.6,  d: 0.52, label: "MO" },    // Mid-off
        { a: 1.6,   d: 0.52, label: "MN" },    // Mid-on
        { a: 2.0,   d: 0.48, label: "MW" },    // Mid-wicket
        { a: 2.5,   d: 0.42, label: "SL" },    // Square leg
        // Outer ring
        { a: -2.2,  d: 0.82, label: "LO" },    // Long-off
        { a: 2.2,   d: 0.82, label: "LN" },    // Long-on
        { a: -0.4,  d: 0.85, label: "3M" },    // Third man
        { a: 2.7,   d: 0.85, label: "FL" },    // Fine leg
        { a: -1.25, d: 0.80, label: "DP" },    // Deep point
        { a: 0.7,   d: 0.78, label: "DM" },    // Deep mid-wicket
      ];

      for (const fp of fielderPositions) {
        const fx = cx0 + Math.cos(fp.a) * boundaryRx * fp.d;
        const fy = cy0 + Math.sin(fp.a) * boundaryRy * fp.d;
        // Small transparent circle for fielder
        ctx.beginPath();
        ctx.arc(fx, fy, 5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.14)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(fx, fy, 5, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Batsman bats (small bat shapes at crease lines)
      const batY1 = py + 30;   // striker's crease
      const batY2 = py + ph - 30; // non-striker's crease
      ctx.save();
      ctx.globalAlpha = 0.20;
      // Striker bat (top crease, right side)
      ctx.fillStyle = "#c4a35a";
      ctx.translate(cx0 + 20, batY1);
      ctx.rotate(-0.3);
      ctx.fillRect(-2, -14, 5, 22);  // blade
      ctx.fillRect(-1, 8, 3, 10);     // handle
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // Non-striker bat (bottom crease, left side)
      ctx.translate(cx0 - 20, batY2);
      ctx.rotate(0.3);
      ctx.fillRect(-2, -14, 5, 22);
      ctx.fillRect(-1, 8, 3, 10);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.restore();

      // Stumps at both ends
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#c4a35a";
      // Top stumps (3 thin lines)
      for (let si = -3; si <= 3; si += 3) {
        ctx.fillRect(cx0 + si - 0.5, batY1 - 8, 1.5, 16);
      }
      // Bottom stumps
      for (let si = -3; si <= 3; si += 3) {
        ctx.fillRect(cx0 + si - 0.5, batY2 - 8, 1.5, 16);
      }
      ctx.restore();

      // Umpires (small cap/hat shapes)
      ctx.save();
      ctx.globalAlpha = 0.18;
      // Bowler's end umpire (behind bottom stumps)
      const umpY1 = batY2 + 35;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx0, umpY1, 6, Math.PI, 0);  // hat dome
      ctx.fill();
      ctx.fillRect(cx0 - 9, umpY1 - 1, 18, 3); // brim
      // Square leg umpire (to the side at striker's end)
      const umpX2 = cx0 + boundaryRx * 0.18;
      const umpY2 = batY1 + 15;
      ctx.beginPath();
      ctx.arc(umpX2, umpY2, 5, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(umpX2 - 8, umpY2 - 1, 16, 2.5);
      ctx.restore();

      // spikes
      if (spikeOn) {
        for (const s of spikes) {
          const tx = s.x + s.nx * spikeSize,
            ty = s.y + s.ny * spikeSize;
          const ppx = -s.ny,
            ppy = s.nx,
            hb = spikeSize / 2;
          ctx.beginPath();
          ctx.moveTo(s.x + ppx * hb, s.y + ppy * hb);
          ctx.lineTo(tx, ty);
          ctx.lineTo(s.x - ppx * hb, s.y - ppy * hb);
          ctx.closePath();
          ctx.fillStyle = "#fff";
          ctx.fill();
        }
      }

      // cricket balls
      for (const b of ballsRef.current) {
        if (b.collected) continue;
        const bc = BALL_COLORS[b.value] ?? "#fff";
        if (b.value === -1) {
          // Fierce flame glow for out balls
          const pulse = 0.6 + 0.4 * Math.sin(now * 0.01);
          // Outer flame aura
          ctx.save();
          ctx.globalAlpha = 0.25 * pulse;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius + 12, 0, Math.PI * 2);
          const flameOuter = ctx.createRadialGradient(b.x, b.y, b.radius * 0.3, b.x, b.y, b.radius + 12);
          flameOuter.addColorStop(0, "#ff1744");
          flameOuter.addColorStop(0.5, "#ff5252");
          flameOuter.addColorStop(1, "rgba(255,0,0,0)");
          ctx.fillStyle = flameOuter;
          ctx.fill();
          ctx.restore();
          // Inner glow ring
          ctx.save();
          ctx.globalAlpha = 0.4 * pulse;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius + 6, 0, Math.PI * 2);
          const flameInner = ctx.createRadialGradient(b.x, b.y, b.radius * 0.5, b.x, b.y, b.radius + 6);
          flameInner.addColorStop(0, "#ff8a80");
          flameInner.addColorStop(1, "rgba(244,67,54,0)");
          ctx.fillStyle = flameInner;
          ctx.fill();
          ctx.restore();
          // Main ball — deep red gradient
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          const gr = ctx.createRadialGradient(b.x - 2, b.y - 2, 1, b.x, b.y, b.radius);
          gr.addColorStop(0, "#ff5252");
          gr.addColorStop(0.6, "#d50000");
          gr.addColorStop(1, "#b71c1c");
          ctx.fillStyle = gr;
          ctx.fill();
          ctx.strokeStyle = "#ff1744";
          ctx.lineWidth = 2;
          ctx.stroke();
          // Draw 3 dark stumps
          const sx = b.x, sy = b.y;
          const stumpH = b.radius * 1.2;
          const stumpW = 2.5;
          const gap = 3.5;
          ctx.strokeStyle = "#1a1a1a";
          ctx.lineWidth = stumpW;
          ctx.lineCap = "round";
          for (let si = -1; si <= 1; si++) {
            const stX = sx + si * gap;
            ctx.beginPath();
            ctx.moveTo(stX, sy + stumpH * 0.42);
            ctx.lineTo(stX, sy - stumpH * 0.42);
            ctx.stroke();
          }
          // Draw 2 bails on top
          ctx.strokeStyle = "#ff6e40";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx - gap, sy - stumpH * 0.42);
          ctx.lineTo(sx, sy - stumpH * 0.50);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(sx, sy - stumpH * 0.50);
          ctx.lineTo(sx + gap, sy - stumpH * 0.42);
          ctx.stroke();
        } else {
          // Regular ball glow
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius + 4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.15)";
          ctx.fill();
          // Main ball
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          const gr = ctx.createRadialGradient(b.x - 3, b.y - 3, 2, b.x, b.y, b.radius);
          gr.addColorStop(0, "#fff");
          gr.addColorStop(1, bc);
          ctx.fillStyle = gr;
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.4)";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = "#000";
          ctx.font = "bold 13px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(BALL_LABELS[b.value] ?? "?", b.x, b.y);
        }
      }

      // special balls (wide / no ball / hit wicket)
      for (const sb of specialBallsRef.current) {
        if (sb.collected || !sb.specialType) continue;
        const life = sb.specialType === 'hitWicket' ? 2000 : SPECIAL_BALL_LIFETIME_MS;
        const age = now - sb.spawnedAt;
        const alpha = Math.max(0.3, 1 - (age / life) * 0.6);
        const col = SPECIAL_BALL_COLORS[sb.specialType] ?? '#fff';
        const lbl = SPECIAL_BALL_LABELS[sb.specialType] ?? '?';
        // Pulsing glow effect
        const pulse = 0.5 + 0.5 * Math.sin(now * 0.008);
        ctx.save();
        ctx.globalAlpha = alpha * 0.35 * pulse;
        ctx.beginPath();
        ctx.arc(sb.x, sb.y, sb.radius + 8, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.restore();
        // Main circle
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(sb.x, sb.y, sb.radius, 0, Math.PI * 2);
        const sbGr = ctx.createRadialGradient(sb.x - 3, sb.y - 3, 2, sb.x, sb.y, sb.radius);
        sbGr.addColorStop(0, '#fff');
        sbGr.addColorStop(1, col);
        ctx.fillStyle = sbGr;
        ctx.fill();
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // Label
        ctx.fillStyle = '#000';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(lbl, sb.x, sb.y);
        ctx.restore();
      }

      // bubbles
      for (let i = 0; i < n; i++) {
        const bx = x[i],
          by = y[i],
          br = r[i];
        const nm = namesRef.current[i] ?? "?";
        const tc =
          i < 2
            ? batTeam.team.primaryColor
            : bowlTeam.team.primaryColor;

        ctx.beginPath();
        ctx.arc(bx, by, br + 5, 0, Math.PI * 2);
        ctx.strokeStyle = tc;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        const bg = ctx.createRadialGradient(
          bx - br * 0.3,
          by - br * 0.3,
          br * 0.1,
          bx,
          by,
          br
        );
        bg.addColorStop(0, tc + "cc");
        bg.addColorStop(1, tc + "88");
        ctx.fillStyle = bg;
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.font = `bold ${br > 30 ? 18 : 12}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(getInitials(nm), bx, by);

        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();

        if (br >= 15) {
          const lbl =
            i < 2
              ? `🏏 ${nm}`
              : `⚾ ${nm}`;
          ctx.fillStyle = "#fff";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(lbl, bx, by + br + 16);
        }
      }

      // floating texts
      for (const f of floatRef.current) {
        const age = now - f.createdAt;
        if (age < 0) continue; // not yet visible (staggered)
        const dur = f.duration ?? 1500;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - age / dur);
        ctx.fillStyle = f.color;
        ctx.font = dur > 1500 ? "bold 26px sans-serif" : "bold 20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(f.text, f.x, f.y - age * 0.02);
        ctx.restore();
      }

      // Milestone highlight animation (2 sec overlay)
      if (milestoneRef.current) {
        const mAge = now - milestoneRef.current.startedAt;
        if (mAge > 2000) {
          milestoneRef.current = null;
        } else {
          const mAlpha = mAge < 300 ? mAge / 300 : mAge > 1700 ? (2000 - mAge) / 300 : 1;
          const mScale = mAge < 300 ? 0.5 + 0.5 * (mAge / 300) : 1;
          const mc = milestoneRef.current;
          ctx.save();
          // Dark overlay
          ctx.globalAlpha = mAlpha * 0.45;
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, CW, CH);
          // Glow behind text
          ctx.globalAlpha = mAlpha * 0.5;
          const glowGr = ctx.createRadialGradient(CW / 2, CH / 2, 0, CW / 2, CH / 2, 200);
          glowGr.addColorStop(0, mc.color + '88');
          glowGr.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGr;
          ctx.fillRect(0, 0, CW, CH);
          // Pulsing ring
          ctx.globalAlpha = mAlpha * (0.4 + 0.3 * Math.sin(mAge * 0.008));
          ctx.beginPath();
          ctx.arc(CW / 2, CH / 2, 80 + mAge * 0.04, 0, Math.PI * 2);
          ctx.strokeStyle = mc.color;
          ctx.lineWidth = 3;
          ctx.stroke();
          // Main text
          ctx.globalAlpha = mAlpha;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `bold ${Math.round(42 * mScale)}px sans-serif`;
          ctx.fillStyle = mc.color;
          ctx.shadowColor = mc.color;
          ctx.shadowBlur = 20;
          ctx.fillText(mc.text, CW / 2, CH / 2 - 18);
          ctx.shadowBlur = 0;
          // Sub text
          ctx.font = `bold ${Math.round(18 * mScale)}px sans-serif`;
          ctx.fillStyle = '#fff';
          ctx.fillText(mc.sub, CW / 2, CH / 2 + 22);
          ctx.restore();
        }
      }

      // ── Impact player animation (3s overlay, queued) ──
      impactAnimRef.current = impactAnimRef.current.filter(ia => now - ia.startedAt < 3200);
      if (impactAnimRef.current.length > 0) {
        // Show one at a time; stagger by offsetting startedAt of queued ones
        const ia = impactAnimRef.current[0];
        const iAge = now - ia.startedAt;
        if (iAge >= 0 && iAge < 3000) {
          const iAlpha = iAge < 400 ? iAge / 400 : iAge > 2600 ? (3000 - iAge) / 400 : 1;
          const iScale = iAge < 400 ? 0.6 + 0.4 * (iAge / 400) : 1;
          ctx.save();
          // Dark overlay
          ctx.globalAlpha = iAlpha * 0.55;
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, CW, CH);
          // Purple glow
          ctx.globalAlpha = iAlpha * 0.6;
          const gr = ctx.createRadialGradient(CW / 2, CH / 2, 0, CW / 2, CH / 2, 220);
          gr.addColorStop(0, '#9c27b0' + '66');
          gr.addColorStop(0.5, '#ce93d8' + '33');
          gr.addColorStop(1, 'transparent');
          ctx.fillStyle = gr;
          ctx.fillRect(0, 0, CW, CH);
          // Lightning bolt decorations
          ctx.globalAlpha = iAlpha * (0.5 + 0.3 * Math.sin(iAge * 0.012));
          ctx.font = `${Math.round(50 * iScale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('⚡', CW / 2 - 160, CH / 2 - 10);
          ctx.fillText('⚡', CW / 2 + 160, CH / 2 - 10);
          // Pulsing ring
          ctx.beginPath();
          ctx.arc(CW / 2, CH / 2, 100 + iAge * 0.03, 0, Math.PI * 2);
          ctx.strokeStyle = '#ce93d8';
          ctx.lineWidth = 2;
          ctx.stroke();
          // "IMPACT PLAYER" header
          ctx.globalAlpha = iAlpha;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `bold ${Math.round(16 * iScale)}px sans-serif`;
          ctx.fillStyle = '#ce93d8';
          ctx.fillText('⚡  I M P A C T   P L A Y E R  ⚡', CW / 2, CH / 2 - 48);
          // Player IN name
          ctx.font = `bold ${Math.round(32 * iScale)}px sans-serif`;
          ctx.fillStyle = '#e1bee7';
          ctx.shadowColor = '#9c27b0';
          ctx.shadowBlur = 25;
          ctx.fillText(ia.playerIn, CW / 2, CH / 2 - 8);
          ctx.shadowBlur = 0;
          // "replaces" text
          ctx.font = `${Math.round(14 * iScale)}px sans-serif`;
          ctx.fillStyle = '#aaa';
          ctx.fillText(ia.role === 'bat' ? 'bats in place of' : 'bowls in place of', CW / 2, CH / 2 + 22);
          // Player OUT name
          ctx.font = `bold ${Math.round(24 * iScale)}px sans-serif`;
          ctx.fillStyle = '#ef9a9a';
          ctx.fillText(ia.playerOut, CW / 2, CH / 2 + 52);
          // Team badge
          ctx.font = `bold ${Math.round(12 * iScale)}px sans-serif`;
          ctx.fillStyle = '#888';
          ctx.fillText(ia.teamName, CW / 2, CH / 2 + 78);
          ctx.restore();
        }
        // If there are queued anims, ensure they start after current one finishes
        if (impactAnimRef.current.length > 1) {
          const firstEnd = ia.startedAt + 3200;
          for (let qi = 1; qi < impactAnimRef.current.length; qi++) {
            if (impactAnimRef.current[qi].startedAt < firstEnd) {
              impactAnimRef.current[qi].startedAt = firstEnd + (qi - 1) * 3200;
            }
          }
        }
      }

      // ── Rain visual effects ──
      const rpNow = rainPhaseRef.current;
      if (rpNow === 'freeze') {
        // Frozen overlay — blue tint + "RAIN DELAY" text
        ctx.save();
        const freezeAge = now - rainFreezeStartRef.current;
        const freezeAlpha = Math.min(0.4, freezeAge / 1000);
        ctx.globalAlpha = freezeAlpha;
        ctx.fillStyle = '#1a237e';
        ctx.fillRect(0, 0, CW, CH);
        // Ice crystal particles
        ctx.globalAlpha = freezeAlpha * 1.5;
        ctx.fillStyle = '#e3f2fd';
        for (let ic = 0; ic < 30; ic++) {
          const icx = (CW * 0.1 + (ic * 31.7) % (CW * 0.8));
          const icy = (CH * 0.1 + (ic * 47.3) % (CH * 0.8));
          const ics = 2 + (ic % 3);
          ctx.beginPath();
          ctx.arc(icx, icy, ics, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillStyle = '#42a5f5';
        ctx.shadowColor = '#42a5f5';
        ctx.shadowBlur = 20;
        ctx.fillText('⏸ RAIN DELAY', CW / 2, CH / 2 - 20);
        ctx.shadowBlur = 0;
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = '#90caf9';
        ctx.fillText('Play suspended — covers coming on...', CW / 2, CH / 2 + 20);
        ctx.restore();
      } else if (rpNow === 'raining') {
        // Rain drops + dark overlay
        ctx.save();
        const rainAge = now - rainAnimStartRef.current;
        const rainAlpha = Math.min(0.5, rainAge / 600);
        ctx.globalAlpha = rainAlpha * 0.3;
        ctx.fillStyle = '#0d47a1';
        ctx.fillRect(0, 0, CW, CH);
        // Draw rain drops
        ctx.globalAlpha = rainAlpha;
        ctx.strokeStyle = '#90caf9';
        ctx.lineWidth = 1.5;
        for (const drop of rainDropsRef.current) {
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - drop.speed * 0.3 * 2, drop.y + drop.length);
          ctx.stroke();
        }
        // Splash effects at bottom
        ctx.fillStyle = 'rgba(144,202,249,0.3)';
        for (let sp = 0; sp < 20; sp++) {
          const spx = (sp * 53.7 + now * 0.05) % CW;
          const spy = CH - WALL_PADDING - Math.random() * 5;
          ctx.beginPath();
          ctx.arc(spx, spy, 2 + Math.random() * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        // Text
        ctx.globalAlpha = 1;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillStyle = '#e3f2fd';
        ctx.shadowColor = '#1565c0';
        ctx.shadowBlur = 15;
        ctx.fillText('🌧️ HEAVY RAIN', CW / 2, CH / 2 - 20);
        ctx.shadowBlur = 0;
        if (rainPctRef.current >= 100) {
          ctx.font = 'bold 18px sans-serif';
          ctx.fillStyle = '#ef5350';
          ctx.fillText('Match may be abandoned...', CW / 2, CH / 2 + 16);
        } else {
          ctx.font = 'bold 14px sans-serif';
          ctx.fillStyle = '#90caf9';
          ctx.fillText('Waiting for rain to stop...', CW / 2, CH / 2 + 16);
        }
        ctx.restore();
      } else if (rpNow === 'resuming') {
        // Fading rain effect
        ctx.save();
        const resAge = now - rainAnimStartRef.current;
        const resAlpha = Math.max(0, 1 - resAge / 1000);
        ctx.globalAlpha = resAlpha * 0.2;
        ctx.fillStyle = '#0d47a1';
        ctx.fillRect(0, 0, CW, CH);
        // Fading rain drops
        ctx.globalAlpha = resAlpha * 0.5;
        ctx.strokeStyle = '#90caf9';
        ctx.lineWidth = 1;
        for (const drop of rainDropsRef.current) {
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 2, drop.y + drop.length * 0.5);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillStyle = '#4caf50';
        ctx.shadowColor = '#4caf50';
        ctx.shadowBlur = 15;
        ctx.fillText('☀️ PLAY RESUMING', CW / 2, CH / 2 - 20);
        ctx.shadowBlur = 0;
        if (dlsTargetRef.current && m.innings === 2) {
          ctx.font = 'bold 16px sans-serif';
          ctx.fillStyle = '#ffd54f';
          ctx.fillText(`DLS Revised Target: ${dlsTargetRef.current}`, CW / 2, CH / 2 + 16);
        }
        const newMaxOv = effectiveOversRef.current;
        if (newMaxOv < matchOversProp) {
          ctx.font = 'bold 13px sans-serif';
          ctx.fillStyle = '#ff9800';
          ctx.fillText(`Match reduced to ${newMaxOv} overs per side`, CW / 2, CH / 2 + 40);
        }
        ctx.restore();
      } else if (rpNow === 'abandoned') {
        // Full abandoned screen
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, 0, CW, CH);
        ctx.globalAlpha = 1;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 40px sans-serif';
        ctx.fillStyle = '#ef5350';
        ctx.shadowColor = '#ef5350';
        ctx.shadowBlur = 20;
        ctx.fillText('MATCH ABANDONED', CW / 2, CH / 2 - 30);
        ctx.shadowBlur = 0;
        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#90caf9';
        ctx.fillText('Due to persistent rain', CW / 2, CH / 2 + 10);
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#888';
        ctx.fillText('No result — match called off', CW / 2, CH / 2 + 40);
        ctx.restore();
      }

      if (isRunning && !m.isComplete)
        animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [
    isRunning,
    speedMul,
    ballSpeed,
    spikeOn,
    spikes,
    canvasW,
    canvasH,
    detectSpikeHit,
    spikeSize,
    endMatch,
    switchInnings,
    pickNextBowler,
    startSuperOver,
    matchOversProp,
  ]);

  /* reset */
  const resetMatch = () => {
    setIsRunning(false);
    setGameStarted(false);
    const freshMatch: MatchState = {
      innings: 1,
      ballsInCurrentOver: 0,
      currentOver: 0,
      target: null,
      isComplete: false,
      winner: null,
      winMargin: null,
      potm: null,
      matchEndPhase: null,
      battingTeamIdx: 0,
      firstInningsScore: 0,
      thisOverBalls: [],
      currentOverRunsOnly: 0,
      isSuperOver: false,
      superOverNumber: 0,
    };
    mRef.current = freshMatch;
    setMatchState(freshMatch);
    setTeams((p) => [
      {
        ...p[0],
        score: 0,
        wickets: 0,
        ballsFaced: 0,
        battingStats: freshBattingStats(11),
        bowlingStats: freshBowlingStats(11),
        currentBatsmanIndices: [0, 1],
        nextBatsmanIndex: 2,
        currentBowlerIndex: 0,
        impactUsed: false,
        impactReplacedIdx: -1,
      },
      {
        ...p[1],
        score: 0,
        wickets: 0,
        ballsFaced: 0,
        battingStats: freshBattingStats(11),
        bowlingStats: freshBowlingStats(11),
        currentBatsmanIndices: [0, 1],
        nextBatsmanIndex: 2,
        currentBowlerIndex: 0,
        impactUsed: false,
        impactReplacedIdx: -1,
      },
    ]);
    ballsRef.current = [];
    specialBallsRef.current = [];
    widesThisInningsRef.current = 0;
    noBallsThisInningsRef.current = 0;
    hitWicketThisInningsRef.current = 0;
    widesCollectedRef.current = 0;
    noBallsCollectedRef.current = 0;
    hitWicketCollectedRef.current = 0;
    floatRef.current = [];
    milestoneRef.current = null;
    consecutiveWicketsRef.current = 0;
    impactAnimRef.current = [];
    superOverDataRef.current = null;
    cntRef.current = 0;
    // Clear arena bubbles
    xRef.current = new Float32Array(3);
    yRef.current = new Float32Array(3);
    vxRef.current = new Float32Array(3);
    vyRef.current = new Float32Array(3);
    rRef.current = new Float32Array(3);
    rTRef.current = new Float32Array(3);
    namesRef.current = [];
  };

  const fmtOv = (o: number, b: number) => `${o}.${b}`;

  /* ─── Scoreboard panel contents ─── */
  const batIdx = matchState.battingTeamIdx;
  const bowIdx = batIdx === 0 ? 1 : 0;
  const batting = teams[batIdx];
  const bowling = teams[bowIdx];

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        background: "#111",
        overflow: "hidden",
        fontFamily: "system-ui,sans-serif",
        color: "#fff",
      }}
    >
      {/* ARENA */}
      <div style={{ flex: 1, display: "flex", position: "relative" }}>
        <div
          ref={arenaRef}
          style={{
            flex: 1,
            position: "relative",
            background: "#1a1a2e",
            overflow: "hidden",
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasW}
            height={canvasH}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              background: "#0d0d0d",
            }}
          />

          {/* Pre-match rain delay overlay */}
          {preMatchRainOverlay && (
            <div style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.92)",
              zIndex: 1001,
              flexDirection: "column",
              gap: 16,
            }}>
              {preMatchRainOverlay === 'raining' && (
                <>
                  <div style={{ fontSize: 54, animation: "matchPopIn 0.4s ease-out" }}>🌧️</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#42a5f5", animation: "matchPopIn 0.5s ease-out" }}>
                    Rain Delay
                  </div>
                  <div style={{ fontSize: 14, color: "#aaa", animation: "matchPopIn 0.6s ease-out" }}>
                    Heavy rain before the start of play...
                  </div>
                  {/* Animated rain drops */}
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} style={{
                      position: "absolute",
                      left: `${(i * 2.5) % 100}%`,
                      top: `${(i * 7) % 100}%`,
                      width: 2,
                      height: 12 + (i % 8),
                      background: "rgba(66,165,245,0.4)",
                      borderRadius: 2,
                      animation: `rainDrop ${0.4 + (i % 5) * 0.1}s linear infinite`,
                      animationDelay: `${(i * 0.05)}s`,
                    }} />
                  ))}
                </>
              )}
              {preMatchRainOverlay === 'reduced' && (
                <>
                  <div style={{ fontSize: 54, animation: "matchPopIn 0.3s ease-out" }}>☁️</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#ff9800", animation: "matchPopIn 0.4s ease-out" }}>
                    Match Reduced
                  </div>
                  <div style={{ fontSize: 18, color: "#ffd700", fontWeight: 700, animation: "matchPopIn 0.5s ease-out" }}>
                    {MAX_OVERS} overs → {preMatchRainReduced.current} overs per side
                  </div>
                  <div style={{ fontSize: 13, color: "#aaa", marginTop: 4, animation: "matchPopIn 0.6s ease-out" }}>
                    Both teams will bat {preMatchRainReduced.current} overs
                  </div>
                </>
              )}
              <style>{`
                @keyframes rainDrop {
                  0% { transform: translateY(-20px); opacity: 0.8; }
                  100% { transform: translateY(120px); opacity: 0; }
                }
              `}</style>
            </div>
          )}

          {/* Toss */}
          {showToss && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.9)",
                zIndex: 1000,
              }}
            >
              <div style={{ textAlign: "center", maxWidth: 400 }}>
                {/* Coin */}
                <div style={{
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  background: tossCoinSide === 'heads' ? 'linear-gradient(135deg, #ffd54f, #ffb300)' : 'linear-gradient(135deg, #90caf9, #42a5f5)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 48,
                  fontWeight: 900,
                  color: tossCoinSide === 'heads' ? '#5d4037' : '#1a237e',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 2px 6px rgba(255,255,255,0.3)',
                  border: '3px solid rgba(255,255,255,0.2)',
                  marginBottom: 20,
                  animation: tossPhase === 'flipping' ? "coinFlip 0.6s linear infinite" : "coinLand 0.5s ease-out forwards",
                }}>
                  {tossPhase === 'flipping' ? '' : (tossCoinSide === 'heads' ? 'H' : 'T')}
                </div>

                {/* Phase: flipping */}
                {tossPhase === 'flipping' && (
                  <div style={{ fontSize: 18, color: "#aaa", fontWeight: 600, animation: "matchPopIn 0.3s ease-out" }}>
                    Coin is flipping...
                  </div>
                )}

                {/* Phase: called — show who called what */}
                {tossPhase === 'called' && (
                  <div style={{ animation: "matchPopIn 0.4s ease-out" }}>
                    <div style={{ fontSize: 16, color: "#ccc", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      {teamLogo(tossCallingTeam) && <img src={teamLogo(tossCallingTeam)} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />}
                      {tossCallingTeam} called <span style={{ color: "#ffd54f", fontWeight: 800, fontSize: 20 }}>{tossCall.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: 20, color: "#fff", fontWeight: 700 }}>
                      Coin landed on <span style={{ color: "#4caf50", fontWeight: 800 }}>{tossCoinSide.toUpperCase()}</span>
                    </div>
                  </div>
                )}

                {/* Phase: result — show winner and their choice */}
                {tossPhase === 'result' && tossResult && (
                  <div style={{ animation: "matchPopIn 0.5s ease-out" }}>
                    <div style={{ fontSize: 14, color: "#888", marginBottom: 6 }}>
                      {tossCallingTeam} called {tossCall.toUpperCase()} — Coin: {tossCoinSide.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#ffd54f", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      {teamLogo(tossWonTeam) && <img src={teamLogo(tossWonTeam)} alt="" style={{ width: 36, height: 36, objectFit: "contain" }} />}
                      🏆 {tossWonTeam} won the toss!
                    </div>
                    <div style={{ fontSize: 18, color: "#a5d6a7", fontWeight: 600 }}>
                      Elected to {tossChoice === 'bat' ? '🏏 BAT' : '⚾ BOWL'} first
                    </div>
                  </div>
                )}
              </div>
              <style>{`
                @keyframes coinFlip {
                  0% { transform: rotateY(0deg); }
                  100% { transform: rotateY(360deg); }
                }
                @keyframes coinLand {
                  0% { transform: rotateY(180deg) scale(1.3); }
                  50% { transform: rotateY(90deg) scale(1.1); }
                  100% { transform: rotateY(0deg) scale(1); }
                }
              `}</style>
            </div>
          )}

          {/* Innings transition */}
          {inningsTransition && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.9)",
                zIndex: 1000,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 20,
                    color: "#ffd54f",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  End of 1st Innings
                </div>
                <div
                  style={{
                    fontSize: 28,
                    color: "#fff",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  {teamLogo(batting.team.shortName) && <img src={teamLogo(batting.team.shortName)} alt="" style={{ width: 36, height: 36, objectFit: "contain" }} />}
                  {batting.team.shortName}: {batting.score}/
                  {batting.wickets}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    color: "#aaa",
                    marginTop: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {teamLogo(bowling.team.shortName) && <img src={teamLogo(bowling.team.shortName)} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />}
                  {bowling.team.shortName} needs{" "}
                  {batting.score + 1} to win
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SCOREBOARD PANEL */}
        <div
          style={{
            width: 320,
            height: "100vh",
            background: "rgba(8,8,8,0.95)",
            borderLeft: "3px solid rgba(61,59,59,0.55)",
            boxSizing: "border-box",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 10,
          }}
        >
          {/* Match header */}
          <div
            style={{
              textAlign: "center",
              padding: "6px 0",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              width: "100%",
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <img src={teamLogo(teams[0].team.shortName)} alt={teams[0].team.shortName}
                style={{ width: 28, height: 28, objectFit: "contain", opacity: 0.85 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#ffd700",
                  letterSpacing: 1,
                }}
              >
                {teams[0].team.shortName} vs {teams[1].team.shortName}
              </div>
              <img src={teamLogo(teams[1].team.shortName)} alt={teams[1].team.shortName}
                style={{ width: 28, height: 28, objectFit: "contain", opacity: 0.85 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
            {gameStarted && (
              <>
                <div
                  style={{ fontSize: 12, color: "#888", marginTop: 2 }}
                >
                  {matchState.isSuperOver ? `SUPER OVER ${matchState.superOverNumber}` : (matchState.innings === 1
                    ? "1st Innings"
                    : "2nd Innings")}{" "}
                  · {matchState.isSuperOver ? SUPER_OVER_MAX_OVERS : effectiveOversRef.current} Overs
                </div>
                {matchState.target && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#ef5350",
                      marginTop: 3,
                      fontWeight: 600,
                    }}
                  >
                    Target: {matchState.target} | Need{" "}
                    {Math.max(0, matchState.target - batting.score)} from{" "}
                    {((matchState.isSuperOver ? SUPER_OVER_MAX_OVERS : effectiveOversRef.current) - matchState.currentOver) * 6 -
                      matchState.ballsInCurrentOver}{" "}
                    balls
                    {dlsTargetRef.current && (
                      <span style={{ color: '#42a5f5', fontSize: 11, marginLeft: 6 }}>(DLS)</span>
                    )}
                  </div>
                )}
                {/* DLS Par Score — shown during 2nd innings when rain-affected */}
                {matchState.innings === 2 && rainAffectedProp && dlsParScoreRef.current > 0 && (
                  <div style={{
                    fontSize: 11,
                    marginTop: 2,
                    fontWeight: 600,
                    color: batting.score >= dlsParScoreRef.current ? '#4caf50' : '#ef5350',
                  }}>
                    DLS Par: {dlsParScoreRef.current}
                    {batting.score >= dlsParScoreRef.current
                      ? ` (ahead by ${batting.score - dlsParScoreRef.current})`
                      : ` (behind by ${dlsParScoreRef.current - batting.score})`
                    }
                  </div>
                )}
              </>
            )}
          </div>

          {!gameStarted && (
            <div style={{ textAlign: "center", color: "#888", fontSize: 13, marginTop: 20 }}>
              Press <span style={{ color: "#ffd700", fontWeight: 700 }}>Start Match</span> to begin
            </div>
          )}

          {/* Rain status indicator */}
          {gameStarted && rainAffectedProp && rainPhase !== 'none' && (
            <div style={{
              textAlign: "center", padding: "6px 10px", borderRadius: 8,
              background: rainPhase === 'abandoned' ? "rgba(239,83,80,0.2)" : "rgba(66,165,245,0.2)",
              border: `1px solid ${rainPhase === 'abandoned' ? '#ef5350' : '#42a5f5'}44`,
              marginBottom: 6, width: "100%",
            }}>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: rainPhase === 'abandoned' ? '#ef5350' : rainPhase === 'resuming' ? '#4caf50' : '#42a5f5',
              }}>
                {rainPhase === 'freeze' && '⏸ Rain Delay — Play Suspended'}
                {rainPhase === 'raining' && '🌧️ Heavy Rain'}
                {rainPhase === 'resuming' && '☀️ Play Resuming'}
                {rainPhase === 'abandoned' && '❌ Match Abandoned'}
              </span>
              {rainPhase !== 'abandoned' && matchState.innings === 2 && dlsTargetRef.current && (
                <div style={{ fontSize: 10, color: '#ff9800', marginTop: 2 }}>
                  DLS Target: {dlsTargetRef.current}
                  {dlsParScoreRef.current > 0 && ` · Par: ${dlsParScoreRef.current}`}
                </div>
              )}
            </div>
          )}

          {gameStarted && (<>
          {/* Batting team */}
          <div
            style={{
              padding: 8,
              borderRadius: 8,
              background: `${batting.team.primaryColor}22`,
              border: `1px solid ${batting.team.primaryColor}44`,
              width: "100%",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg,${batting.team.primaryColor},${batting.team.secondaryColor})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 7,
                  fontWeight: 800,
                  color: batting.team.textColor,
                  overflow: "hidden",
                }}
              >
                {teamLogo(batting.team.shortName) ? (
                  <img src={teamLogo(batting.team.shortName)} alt=""
                    style={{ width: 18, height: 18, objectFit: "contain" }} />
                ) : batting.team.shortName}
              </div>
              <span
                style={{
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {batting.team.shortName} (Bat)
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span
                style={{
                  color: "#fff",
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                {batting.score}/{batting.wickets}
              </span>
              <span style={{ color: "#aaa", fontSize: 14 }}>
                (
                {fmtOv(
                  matchState.currentOver,
                  matchState.ballsInCurrentOver
                )}
                )
              </span>
            </div>
            {/* Extras */}
            {(widesCollectedRef.current > 0 || noBallsCollectedRef.current > 0 || hitWicketCollectedRef.current > 0) && (
              <div style={{ color: '#999', fontSize: 10, marginTop: 2 }}>
                Extras: {widesCollectedRef.current + noBallsCollectedRef.current}
                {widesCollectedRef.current > 0 && <span style={{ color: '#42a5f5' }}> Wd:{widesCollectedRef.current}</span>}
                {noBallsCollectedRef.current > 0 && <span style={{ color: '#ff7043' }}> Nb:{noBallsCollectedRef.current}</span>}
                {hitWicketCollectedRef.current > 0 && <span style={{ color: '#ffd54f' }}> HW:{hitWicketCollectedRef.current}</span>}
              </div>
            )}
            {/* Current batsmen */}
            <div
              style={{
                display: "flex",
                gap: 4,
                marginTop: 6,
                flexWrap: "wrap",
              }}
            >
              {batting.currentBatsmanIndices.map((pIdx, i) => {
                const p = batting.playing11[pIdx];
                const bs = batting.battingStats[pIdx];
                if (!p) return null;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      background: "rgba(0,0,0,0.3)",
                      padding: "3px 6px",
                      borderRadius: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: ROLE_COLORS[p.role] + "44",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 7,
                        fontWeight: 700,
                        color: ROLE_COLORS[p.role],
                      }}
                    >
                      {getInitials(p.name)}
                    </div>
                    <span style={{ color: "#ccc", fontSize: 11 }}>
                      {p.name}: {bs.runs}({bs.balls})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* This over */}
          {matchState.thisOverBalls.length > 0 && (
            <div
              style={{
                padding: 6,
                borderRadius: 6,
                background: "rgba(255,255,255,0.05)",
                width: "100%",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  color: "#888",
                  fontSize: 11,
                  marginBottom: 3,
                }}
              >
                This Over:
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 3,
                  flexWrap: "wrap",
                }}
              >
                {matchState.thisOverBalls.map((v, i) => {
                  const isStr = typeof v === 'string';
                  const bg = isStr
                    ? v === 'Wd' ? '#42a5f5' : v === 'Nb' ? '#ff7043' : v === 'HW' ? '#ffd54f' : 'rgba(255,255,255,0.1)'
                    : v === -1 ? '#ef5350' : v === 0 ? 'rgba(255,255,255,0.06)' : v >= 4 ? '#ffd54f' : 'rgba(255,255,255,0.1)';
                  const fg = isStr
                    ? (v === 'HW' || v === 'Wd') ? '#000' : '#fff'
                    : v === -1 ? '#fff' : v === 0 ? '#666' : v >= 4 ? '#000' : '#fff';
                  const label = isStr ? v : v === -1 ? 'W' : v === 0 ? '•' : v;
                  return (
                    <span key={i} style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: 22, height: 22, borderRadius: isStr ? 6 : '50%',
                      padding: isStr ? '0 4px' : 0,
                      fontSize: isStr ? 9 : 10, fontWeight: 700,
                      background: bg, color: fg,
                    }}>
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bowling team */}
          <div
            style={{
              padding: 8,
              borderRadius: 8,
              background: `${bowling.team.primaryColor}11`,
              border: `1px solid ${bowling.team.primaryColor}22`,
              width: "100%",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg,${bowling.team.primaryColor},${bowling.team.secondaryColor})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 7,
                  fontWeight: 800,
                  color: bowling.team.textColor,
                  overflow: "hidden",
                }}
              >
                {teamLogo(bowling.team.shortName) ? (
                  <img src={teamLogo(bowling.team.shortName)} alt=""
                    style={{ width: 18, height: 18, objectFit: "contain" }} />
                ) : bowling.team.shortName}
              </div>
              <span
                style={{
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {bowling.team.shortName} (Bowl)
              </span>
            </div>
            {matchState.innings === 2 && (
              <div style={{ color: "#aaa", fontSize: 13 }}>
                1st Inn:{" "}
                <span style={{ color: "#fff", fontWeight: 600 }}>
                  {matchState.firstInningsScore}
                </span>
              </div>
            )}
            {bowling.bowlerIndices.length > 0 && (() => {
              const bpi =
                bowling.bowlerIndices[bowling.currentBowlerIndex];
              const bp = bowling.playing11[bpi];
              const bs = bowling.bowlingStats[bpi];
              if (!bp) return null;
              return (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 4,
                    background: "rgba(0,0,0,0.3)",
                    padding: "3px 6px",
                    borderRadius: 6,
                  }}
                >
                  <span style={{ fontSize: 12 }}>⚾</span>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: ROLE_COLORS[bp.role] + "44",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 7,
                      fontWeight: 700,
                      color: ROLE_COLORS[bp.role],
                    }}
                  >
                    {getInitials(bp.name)}
                  </div>
                  <span style={{ color: "#ccc", fontSize: 11 }}>
                    {bp.name}: {bs.overs}.
                    {bs.ballsInOver}-{bs.runsConceded}-{bs.wickets}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Run rate */}
          <div
            style={{
              padding: 6,
              borderRadius: 6,
              background: "rgba(255,255,255,0.03)",
              textAlign: "center",
              width: "100%",
              marginBottom: 6,
            }}
          >
            <span style={{ color: "#888", fontSize: 12 }}>CRR: </span>
            <span
              style={{
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {matchState.currentOver > 0 ||
              matchState.ballsInCurrentOver > 0
                ? (
                    batting.score /
                    (matchState.currentOver +
                      matchState.ballsInCurrentOver / 6)
                  ).toFixed(2)
                : "0.00"}
            </span>
            {matchState.target && matchState.innings === 2 && (
              <>
                <span
                  style={{
                    color: "#888",
                    fontSize: 12,
                    marginLeft: 6,
                  }}
                >
                  RRR:{" "}
                </span>
                <span
                  style={{
                    color: "#ef5350",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {(
                    (matchState.target - batting.score) /
                    Math.max(
                      0.1,
                      (matchState.isSuperOver ? SUPER_OVER_MAX_OVERS : effectiveOversRef.current) -
                        matchState.currentOver -
                        matchState.ballsInCurrentOver / 6
                    )
                  ).toFixed(2)}
                </span>
              </>
            )}
          </div>
          </>)}

        </div>
        {/* End of SCOREBOARD PANEL */}

        {/* Super Over splash */}
        {showSuperOverSplash && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.95)", zIndex: 1001,
          }}>
            <style>{`
              @keyframes soZoomIn { 0%{transform:scale(0);opacity:0} 50%{transform:scale(1.2);opacity:1} 100%{transform:scale(1)} }
              @keyframes soPulse { 0%,100%{text-shadow:0 0 20px #ffd700,0 0 40px #ff6600} 50%{text-shadow:0 0 40px #ffd700,0 0 80px #ff6600} }
              @keyframes soSlide { 0%{transform:translateY(30px);opacity:0} 100%{transform:translateY(0);opacity:1} }
            `}</style>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 80, animation: "soZoomIn 0.8s ease-out", marginBottom: 16 }}>⚡</div>
              <h1 style={{
                fontSize: 56, fontWeight: 900, color: "#ffd700", letterSpacing: 6,
                animation: "soZoomIn 0.8s ease-out 0.2s both, soPulse 1.5s infinite 1s",
                margin: "0 0 12px",
              }}>
                SUPER OVER!
              </h1>
              <div style={{ fontSize: 20, color: "#fff", fontWeight: 600, animation: "soSlide 0.6s ease-out 0.6s both" }}>
                Scores tied — deciding super over incoming...
              </div>
              <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 20, animation: "soSlide 0.6s ease-out 0.8s both" }}>
                {teams.map((tm, i) => (
                  <div key={i} style={{ padding: "10px 20px", borderRadius: 10, background: `${tm.team.primaryColor}22`, border: `2px solid ${tm.team.primaryColor}` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: tm.team.primaryColor }}>{tm.team.shortName}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{tm.score}/{tm.wickets}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Match complete — full-width animated overlay (covers arena + scoreboard) */}
        {matchState.isComplete && matchState.winner && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.92)",
                zIndex: 1000,
                overflow: "auto",
              }}
            >
              <style>{`
                @keyframes matchPopIn { 0%{transform:scale(0.3);opacity:0} 60%{transform:scale(1.08);opacity:1} 100%{transform:scale(1)} }
                @keyframes matchPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
                @keyframes matchSlideUp { 0%{transform:translateY(40px);opacity:0} 100%{transform:translateY(0);opacity:1} }
                @keyframes matchGlow { 0%,100%{box-shadow:0 0 20px rgba(255,215,0,0.4)} 50%{box-shadow:0 0 60px rgba(255,215,0,0.8)} }
                @keyframes confettiFall { 0%{transform:translateY(-100%) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
                @keyframes matchFadeIn { 0%{opacity:0} 100%{opacity:1} }
                .confetti-piece { position:absolute; width:8px; height:8px; animation:confettiFall 3s ease-in forwards; }
              `}</style>

              {/* Confetti */}
              {matchState.matchEndPhase === "winner" && Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="confetti-piece" style={{
                  left: `${Math.random() * 100}%`,
                  top: `-${Math.random() * 10}%`,
                  background: ["#ffd700", "#ff4081", "#4caf50", "#2196f3", "#ff9800", "#e040fb"][i % 6],
                  borderRadius: i % 3 === 0 ? "50%" : "0",
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }} />
              ))}

              {/* Phase 1: Winner */}
              {matchState.matchEndPhase === "winner" && (
                <div style={{ textAlign: "center", animation: "matchPopIn 0.6s ease-out" }}>
                  <div style={{ fontSize: 72, marginBottom: 8, animation: "matchPulse 1.5s infinite" }}>🏆</div>
                  <h1 style={{
                    color: matchState.winner === "Tie!" ? "#ffd54f" : (
                      teams.find(t => t.team.shortName === matchState.winner)?.team.primaryColor ?? "#4caf50"
                    ),
                    fontSize: 42, fontWeight: 900, margin: "0 0 8px", letterSpacing: 3,
                    textShadow: "0 0 30px rgba(255,215,0,0.6)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
                  }}>
                    {matchState.winner !== "Tie!" && teamLogo(matchState.winner!) && <img src={teamLogo(matchState.winner!)} alt="" style={{ width: 52, height: 52, objectFit: "contain" }} />}
                    {matchState.winner === "Tie!" ? "MATCH TIED!" : `${matchState.winner} WINS!`}
                  </h1>
                  <div style={{ fontSize: 22, fontWeight: 600, color: "#ffd54f", marginBottom: 16, animation: "matchSlideUp 0.8s ease-out 0.3s both" }}>
                    {matchState.winMargin}
                  </div>
                  <div style={{ display: "flex", gap: 24, justifyContent: "center", animation: "matchSlideUp 0.8s ease-out 0.5s both" }}>
                    {teams.map((tm, i) => (
                      <div key={i} style={{ padding: "12px 20px", borderRadius: 10, background: `${tm.team.primaryColor}22`, border: `2px solid ${tm.team.primaryColor}`, textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: tm.team.primaryColor, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          {teamLogo(tm.team.shortName) && <img src={teamLogo(tm.team.shortName)} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />}
                          {tm.team.shortName}
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{tm.score}/{tm.wickets}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phase 2: Detailed Scorecards — side-by-side, compact, no scroll */}
              {matchState.matchEndPhase === "scorecard" && (
                <div style={{ animation: "matchPopIn 0.5s ease-out", width: "96%", maxWidth: 1200, height: "92vh", display: "flex", flexDirection: "column", padding: "8px 0" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#ffd700", letterSpacing: 3, marginBottom: 8, textAlign: "center" }}>
                    📋 MATCH SCORECARD
                  </div>
                  <div style={{ display: "flex", gap: 10, flex: 1, minHeight: 0 }}>
                    {teams.map((tm, ti) => {
                      const isWinner = matchState.winner === tm.team.shortName;
                      return (
                        <div key={ti} style={{
                          flex: 1, background: "rgba(20,20,20,0.95)", borderRadius: 10, padding: "10px 12px",
                          border: `2px solid ${isWinner ? "#ffd700" : tm.team.primaryColor + "44"}`,
                          display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto",
                        }}>
                          {/* Team header */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, paddingBottom: 4, borderBottom: `1px solid ${tm.team.primaryColor}44` }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: "50%",
                              background: `linear-gradient(135deg,${tm.team.primaryColor},${tm.team.secondaryColor})`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 8, fontWeight: 800, color: tm.team.textColor, flexShrink: 0,
                              overflow: "hidden",
                            }}>
                              {teamLogo(tm.team.shortName) ? (
                                <img src={teamLogo(tm.team.shortName)} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
                              ) : tm.team.shortName}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: tm.team.primaryColor }}>{tm.team.shortName}</div>
                              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>
                                {/* Show main match scores + super over scores in super over, regular scores otherwise */}
                                {matchState.isSuperOver && superOverDataRef.current
                                  ? <>
                                      <span style={{ color: '#aaa' }}>{ti === 0 ? superOverDataRef.current.mainMatchT1Score : superOverDataRef.current.mainMatchT2Score}</span>
                                      <span style={{ color: '#ffd700' }}>/{tm.wickets}</span>
                                      <span style={{ color: '#666', fontSize: 16, marginLeft: 4 }}>→</span>
                                      <span style={{ color: '#fff' }}>{tm.score}</span>
                                      <span style={{ color: '#ef5350' }}>/{tm.wickets}</span>
                                    </>
                                  : `${tm.score}/${tm.wickets}`
                                }
                                {isWinner && <span style={{ color: "#ffd700", fontSize: 13, marginLeft: 6 }}>🏆</span>}
                              </div>
                            </div>
                          </div>
                          {/* Batting */}
                          <div style={{ marginBottom: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#81c784", letterSpacing: 1, marginBottom: 3 }}>🏏 BATTING</div>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead>
                                <tr>
                                  {["Batter", "R", "B", "4s", "6s", "SR"].map(h => (
                                    <th key={h} style={{ padding: "2px 4px", fontSize: 10, fontWeight: 700, color: "#888", textAlign: h === "Batter" ? "left" : "center", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {tm.playing11.map((p, i) => {
                                  const bs = tm.battingStats[i];
                                  if (bs.status === "dnb") return null;
                                  const sr = bs.balls > 0 ? ((bs.runs / bs.balls) * 100).toFixed(0) : "0";
                                  const isImpact = i === tm.impactReplacedIdx;
                                  return (
                                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: isImpact ? "rgba(206,147,216,0.15)" : undefined, boxShadow: isImpact ? "inset 0 0 12px rgba(206,147,216,0.25)" : undefined }}>
                                      <td style={{ padding: "2px 4px", fontSize: 12 }}>
                                        <span style={{ color: isImpact ? "#ce93d8" : bs.status === "batting" ? "#fff" : "#aaa", fontWeight: isImpact || bs.status === "batting" ? 700 : 400 }}>
                                          {p.name.split(" ").length > 1 ? p.name.split(" ").slice(-1)[0] : p.name}
                                        </span>
                                        {isImpact && <span style={{ color: "#ce93d8", fontSize: 9, marginLeft: 3, fontWeight: 700 }}>⚡IMP</span>}
                                        {bs.status === "out" && bs.outType && <span style={{ color: "#ef5350", fontSize: 10, marginLeft: 2 }}>({bs.outType})</span>}
                                        {bs.status === "batting" && <span style={{ color: "#4caf50", fontSize: 10, marginLeft: 2 }}>*</span>}
                                      </td>
                                      <td style={{ padding: "2px 4px", textAlign: "center", fontSize: 12, fontWeight: 700, color: bs.runs >= 50 ? "#ffd700" : "#fff" }}>{bs.runs}</td>
                                      <td style={{ padding: "2px 4px", textAlign: "center", fontSize: 11, color: "#aaa" }}>{bs.balls}</td>
                                      <td style={{ padding: "2px 4px", textAlign: "center", fontSize: 11, color: bs.fours > 0 ? "#81c784" : "#555" }}>{bs.fours}</td>
                                      <td style={{ padding: "2px 4px", textAlign: "center", fontSize: 11, color: bs.sixes > 0 ? "#ffd54f" : "#555" }}>{bs.sixes}</td>
                                      <td style={{ padding: "2px 4px", textAlign: "center", fontSize: 11, color: parseFloat(sr) > 150 ? "#4caf50" : parseFloat(sr) < 80 ? "#ef5350" : "#aaa" }}>{sr}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          {/* Bowling */}
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#ef5350", letterSpacing: 1, marginBottom: 3 }}>⚾ BOWLING</div>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead>
                                <tr>
                                  {["Bowler", "O", "M", "R", "W", "Econ"].map(h => (
                                    <th key={h} style={{ padding: "2px 4px", fontSize: 10, fontWeight: 700, color: "#888", textAlign: h === "Bowler" ? "left" : "center", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {tm.bowlerIndices.map((idx) => {
                                  const p = tm.playing11[idx];
                                  const bw = tm.bowlingStats[idx];
                                  const totBalls = bw.overs * 6 + bw.ballsInOver;
                                  if (totBalls === 0 && bw.wickets === 0) return null;
                                  const econ = totBalls > 0 ? ((bw.runsConceded / totBalls) * 6).toFixed(1) : "-";
                                  const isImpact = idx === tm.impactReplacedIdx;
                                  return (
                                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: isImpact ? "rgba(206,147,216,0.15)" : undefined }}>
                                      <td style={{ padding: "2px 4px", fontSize: 12, color: isImpact ? "#ce93d8" : "#ccc" }}>
                                        {p.name.split(" ").pop()}
                                        {isImpact && <span style={{ color: "#ce93d8", fontSize: 9, marginLeft: 3, fontWeight: 700 }}>⚡IMP</span>}
                                      </td>
                                      <td style={{ padding: "2px 4px", textAlign: "center", fontSize: 11, color: "#aaa" }}>{bw.overs}.{bw.ballsInOver}</td>
                                      <td style={{ padding: "2px 4px", textAlign: "center", fontSize: 11, color: bw.maidens > 0 ? "#81c784" : "#555" }}>{bw.maidens}</td>
                                      <td style={{ padding: "2px 4px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{bw.runsConceded}</td>
                                      <td style={{ padding: "2px 4px", textAlign: "center", fontSize: 12, fontWeight: 700, color: bw.wickets > 0 ? "#ef5350" : "#555" }}>{bw.wickets}</td>
                                      <td style={{ padding: "2px 4px", textAlign: "center", fontSize: 11, color: econ !== "-" && parseFloat(econ) < 7 ? "#4caf50" : econ !== "-" && parseFloat(econ) > 10 ? "#ef5350" : "#aaa" }}>{econ}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Phase 3: Player of the Match */}
              {matchState.matchEndPhase === "potm" && matchState.potm && (
                <div style={{ textAlign: "center", animation: "matchPopIn 0.6s ease-out" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#ffd700", letterSpacing: 3, marginBottom: 12 }}>
                    ⭐ PLAYER OF THE MATCH ⭐
                  </div>
                  <div style={{
                    display: "inline-block", padding: "28px 44px", borderRadius: 16,
                    background: `linear-gradient(135deg, ${matchState.potm.teamColor}33, rgba(0,0,0,0.8))`,
                    border: `3px solid ${matchState.potm.teamColor}`, animation: "matchGlow 2s infinite", minWidth: 260,
                  }}>
                    <div style={{
                      width: 80, height: 80, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${matchState.potm.teamColor}, ${matchState.potm.teamColor}88)`,
                      margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 28, fontWeight: 900, color: "#fff", border: "3px solid #ffd700",
                    }}>
                      {getInitials(matchState.potm.name)}
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{matchState.potm.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: matchState.potm.teamColor, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      {teamLogo(matchState.potm.team) && <img src={teamLogo(matchState.potm.team)} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />}
                      {matchState.potm.team}
                    </div>
                    <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
                      {matchState.potm.batting !== "-" && (
                        <div style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(76,175,80,0.15)", border: "1px solid rgba(76,175,80,0.4)" }}>
                          <div style={{ fontSize: 10, color: "#81c784", fontWeight: 600, marginBottom: 2 }}>BATTING</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>🏏 {matchState.potm.batting}</div>
                        </div>
                      )}
                      {matchState.potm.bowling !== "-" && (
                        <div style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(239,83,80,0.15)", border: "1px solid rgba(239,83,80,0.4)" }}>
                          <div style={{ fontSize: 10, color: "#ef5350", fontWeight: 600, marginBottom: 2 }}>BOWLING</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>⚾ {matchState.potm.bowling}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Phase 4: Tournament Points Table — all 10 IPL teams */}
              {matchState.matchEndPhase === "table" && (
                <div style={{ textAlign: "center", animation: "matchPopIn 0.5s ease-out", maxWidth: 700, width: "95%", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#ffd700", letterSpacing: 3, marginBottom: 16, flexShrink: 0 }}>
                    📊 IPL 2026 POINTS TABLE
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                  <table style={{
                    width: "100%", borderCollapse: "collapse",
                    background: "rgba(20,20,20,0.95)", borderRadius: 12, overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}>
                    <thead>
                      <tr style={{ background: "rgba(107,68,255,0.3)" }}>
                        {["#", "Team", "P", "W", "L", "T", "NRR", "Pts"].map(h => (
                          <th key={h} style={{
                            padding: "10px 6px", fontSize: 11, fontWeight: 700, color: "#ffd700",
                            textAlign: h === "Team" ? "left" : "center",
                            borderBottom: "2px solid rgba(255,215,0,0.3)",
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableStandings
                        .map((s) => ({ ...s, nrr: calcNRR(s) }))
                        .sort((a, b) => b.pts - a.pts || b.nrr - a.nrr)
                        .map((row, idx) => {
                          const iplTeam = IPL_TEAMS.find(t => t.shortName === row.shortName);
                          if (!iplTeam) return null;
                          const isPlaying = teams.some(t => t.team.shortName === row.shortName);
                          return (
                            <tr key={row.shortName} style={{
                              background: isPlaying ? `${iplTeam.primaryColor}15` : "transparent",
                              borderBottom: "1px solid rgba(255,255,255,0.05)",
                              transition: "background 0.3s",
                            }}>
                              <td style={{ padding: "8px 6px", textAlign: "center", fontSize: 13, fontWeight: 700, color: idx < 4 ? "#4caf50" : "#888" }}>
                                {idx + 1}
                              </td>
                              <td style={{ padding: "8px 6px", textAlign: "left" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{
                                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                                    background: `linear-gradient(135deg,${iplTeam.primaryColor},${iplTeam.secondaryColor})`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 7, fontWeight: 800, color: iplTeam.textColor,
                                    overflow: "hidden",
                                  }}>
                                    {teamLogo(iplTeam.shortName) ? (
                                      <img src={teamLogo(iplTeam.shortName)} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
                                    ) : iplTeam.shortName}
                                  </div>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: isPlaying ? iplTeam.primaryColor : "#bbb" }}>
                                    {iplTeam.shortName}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: "8px 6px", textAlign: "center", fontSize: 13, color: "#ccc" }}>{row.played}</td>
                              <td style={{ padding: "8px 6px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#4caf50" }}>{row.won}</td>
                              <td style={{ padding: "8px 6px", textAlign: "center", fontSize: 13, fontWeight: 700, color: row.lost > 0 ? "#ef5350" : "#555" }}>{row.lost}</td>
                              <td style={{ padding: "8px 6px", textAlign: "center", fontSize: 13, color: row.tied > 0 ? "#ffd54f" : "#555" }}>{row.tied}</td>
                              <td style={{ padding: "8px 6px", textAlign: "center", fontSize: 13, fontWeight: 600, color: row.nrr >= 0 ? "#4caf50" : "#ef5350" }}>
                                {row.played > 0 ? (row.nrr >= 0 ? "+" : "") + row.nrr.toFixed(3) : "-"}
                              </td>
                              <td style={{ padding: "8px 6px", textAlign: "center", fontSize: 15, fontWeight: 800, color: "#ffd700" }}>{row.pts}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  <div style={{ marginTop: 6, fontSize: 10, color: "#666", textAlign: "center" }}>
                    Top 4 qualify for playoffs • Points persist across matches
                  </div>
                  </div>
                </div>
              )}
              {matchState.matchEndPhase === "actions" && (
                <div style={{ textAlign: "center", animation: "matchPopIn 0.5s ease-out", maxWidth: 500, width: "95%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#ffd700", letterSpacing: 3, marginBottom: 10 }}>
                    ⚡ WHAT'S NEXT?
                  </div>
                  <button onClick={() => { resetMatch(); setTimeout(startMatch, 100); }}
                    style={{ padding: "16px 50px", width: "80%", background: "linear-gradient(90deg,#6b44ff,#a855f7)", border: "none", color: "#fff", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 17, letterSpacing: 1 }}>
                    🔄 Play Again
                  </button>
                  <button onClick={onBackToTeams}
                    style={{ padding: "16px 50px", width: "80%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 17 }}>
                    ↩ Back to Teams
                  </button>
                  <button onClick={() => { if (confirm("Reset all tournament data? This cannot be undone.")) { onResetTournament(); } }}
                    style={{ padding: "14px 40px", width: "60%", background: "rgba(239,83,80,0.15)", border: "1px solid rgba(239,83,80,0.3)", color: "#ef5350", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                    🗑 Reset Tournament
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      {/* CONTROLS PANEL */}
      <div
        style={{
          width: 240,
          minWidth: 200,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: 18,
          zIndex: 41,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 240,
            background: "rgba(24,24,24,0.95)",
            borderRadius: 12,
            padding: 12,
            boxSizing: "border-box",
            maxHeight: "88vh",
            overflowY: "auto",
          }}
        >
          {/* Toss Control — only before game starts */}
          {!gameStarted && (
            <div style={{ marginBottom: 10, padding: 8, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                <button onClick={() => setTossMode('auto')}
                  style={{ flex: 1, padding: "5px", fontSize: 11, fontWeight: 700, border: "none", borderRadius: "6px 0 0 6px", cursor: "pointer",
                    background: tossMode === 'auto' ? "#6b44ff" : "rgba(255,255,255,0.08)", color: tossMode === 'auto' ? "#fff" : "#888" }}>
                  🎲 Auto Toss
                </button>
                <button onClick={() => setTossMode('manual')}
                  style={{ flex: 1, padding: "5px", fontSize: 11, fontWeight: 700, border: "none", borderRadius: "0 6px 6px 0", cursor: "pointer",
                    background: tossMode === 'manual' ? "#ff9800" : "rgba(255,255,255,0.08)", color: tossMode === 'manual' ? "#fff" : "#888" }}>
                  ✋ Manual Toss
                </button>
              </div>
              {tossMode === 'manual' && (
                <div>
                  <div style={{ fontSize: 10, color: "#888", marginBottom: 4, fontWeight: 600 }}>TOSS WINNER</div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                    {teams.map((tm, idx) => (
                      <button key={idx} onClick={() => setManualTossWinner(idx as 0 | 1)}
                        style={{ flex: 1, padding: "6px 4px", fontSize: 11, fontWeight: 700, border: "none", borderRadius: 6, cursor: "pointer",
                          background: manualTossWinner === idx ? `${tm.team.primaryColor}44` : "rgba(255,255,255,0.06)",
                          color: manualTossWinner === idx ? tm.team.primaryColor : "#888",
                          outline: manualTossWinner === idx ? `2px solid ${tm.team.primaryColor}` : "none" }}>
                        {tm.team.shortName}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: "#888", marginBottom: 4, fontWeight: 600 }}>ELECTED TO</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => setManualTossChoice('bat')}
                      style={{ flex: 1, padding: "6px", fontSize: 11, fontWeight: 700, border: "none", borderRadius: 6, cursor: "pointer",
                        background: manualTossChoice === 'bat' ? "rgba(76,175,80,0.3)" : "rgba(255,255,255,0.06)",
                        color: manualTossChoice === 'bat' ? "#4caf50" : "#888",
                        outline: manualTossChoice === 'bat' ? "2px solid #4caf50" : "none" }}>
                      🏏 Bat First
                    </button>
                    <button onClick={() => setManualTossChoice('bowl')}
                      style={{ flex: 1, padding: "6px", fontSize: 11, fontWeight: 700, border: "none", borderRadius: 6, cursor: "pointer",
                        background: manualTossChoice === 'bowl' ? "rgba(33,150,243,0.3)" : "rgba(255,255,255,0.06)",
                        color: manualTossChoice === 'bowl' ? "#2196f3" : "#888",
                        outline: manualTossChoice === 'bowl' ? "2px solid #2196f3" : "none" }}>
                      ⚾ Bowl First
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {!isRunning && !matchState.isComplete ? (
              <button
                onClick={gameStarted ? () => setIsRunning(true) : startMatch}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "linear-gradient(90deg,#6b44ff,#a855f7)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: 1,
                }}
              >
                ▶ {gameStarted ? "Resume" : "Start Match"}
              </button>
            ) : (
              <button
                onClick={() => setIsRunning((r) => !r)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: isRunning ? "#ff4081" : "#6b44ff",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: 1,
                }}
              >
                {isRunning ? "⏸ Pause" : "▶ Resume"}
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <button
              onClick={onBackToTeams}
              style={{
                flex: 1,
                padding: 8,
                background: "#6b44ff",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              ↩ Teams
            </button>
            <button
              onClick={resetMatch}
              style={{
                flex: 1,
                padding: 8,
                background: "#ff9800",
                color: "#000",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              🔄 Reset
            </button>
          </div>

          {/* Test Mode toggle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center" }}>
            <label style={{
              flex: 1, display: "flex", alignItems: "center", gap: 6,
              padding: "6px 10px", borderRadius: 8, cursor: "pointer",
              background: testMode ? "rgba(255,152,0,0.2)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${testMode ? "#ff9800" : "rgba(255,255,255,0.1)"}`,
            }}>
              <input type="checkbox" checked={testMode}
                onChange={(e) => {
                  const v = e.target.checked;
                  onTestModeChange(v);
                  fetch("http://localhost:5000/api/cricket/testmode", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ enabled: v }),
                  }).catch(() => {});
                }}
                style={{ marginRight: 2 }}
              />
              <span style={{ color: testMode ? "#ff9800" : "#888", fontSize: 11, fontWeight: 600 }}>
                🧪 {testMode ? "TEST MODE" : "Test Mode"}
              </span>
            </label>
          </div>

          {/* Clear Stats buttons */}
          <div style={{ display: "flex", gap: 4, marginBottom: 10, width: "100%" }}>
            <button
              onClick={() => {
                if (!confirm("Clear MAIN stats (matches + standings)?")) return;
                  fetch("http://localhost:5000/api/cricket/clear/main", { method: "DELETE" }).catch(() => {});
                localStorage.removeItem("ipl_brawl_tournament_main");
                if (!testMode) onResetTournament();
              }}
              style={{ flex: 1, padding: "5px 4px", fontSize: 10, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer", background: "rgba(239,83,80,0.15)", color: "#ef5350" }}
            >🗑 Main</button>
            <button
              onClick={() => {
                if (!confirm("Clear TEST stats (matches + standings)?")) return;
                  fetch("http://localhost:5000/api/cricket/clear/test", { method: "DELETE" }).catch(() => {});
                localStorage.removeItem("ipl_brawl_tournament_test");
                if (testMode) onResetTournament();
              }}
              style={{ flex: 1, padding: "5px 4px", fontSize: 10, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer", background: "rgba(255,152,0,0.15)", color: "#ff9800" }}
            >🗑 Test</button>
            <button
              onClick={() => {
                if (!confirm("Clear ALL stats (main + test)?")) return;
                  fetch("http://localhost:5000/api/cricket/clear/both", { method: "DELETE" }).catch(() => {});
                localStorage.removeItem("ipl_brawl_tournament_main");
                localStorage.removeItem("ipl_brawl_tournament_test");
                onResetTournament();
              }}
              style={{ flex: 1, padding: "5px 4px", fontSize: 10, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer", background: "rgba(239,83,80,0.25)", color: "#ff5252" }}
            >🗑 Both</button>
          </div>

          {/* Backup button */}
          <div style={{ marginBottom: 10, width: "100%" }}>
            <button
              onClick={() => {
                  fetch("http://localhost:5000/api/cricket/backup", { method: "POST" })
                  .then(r => r.json())
                  .then(d => { if (d.ok) alert(`Backup saved: ${d.stamp}\nFiles: ${d.copied.join(", ")}`); else alert("Backup failed"); })
                  .catch(() => alert("Backup failed — server unreachable"));
              }}
              style={{ width: "100%", padding: "6px", fontSize: 11, fontWeight: 700, border: "none", borderRadius: 6, cursor: "pointer", background: "rgba(33,150,243,0.18)", color: "#42a5f5" }}
            >💾 Backup Stats</button>
          </div>

          {/* Auto / Manual phase toggle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center" }}>
            <button
              onClick={() => setAutoPhase(true)}
              style={{
                flex: 1, padding: "6px", fontSize: 11, fontWeight: 700,
                border: "none", borderRadius: "8px 0 0 8px", cursor: "pointer",
                background: autoPhase ? "#4caf50" : "rgba(255,255,255,0.08)",
                color: autoPhase ? "#fff" : "#888",
              }}
            >
              Auto (5s)
            </button>
            <button
              onClick={() => setAutoPhase(false)}
              style={{
                flex: 1, padding: "6px", fontSize: 11, fontWeight: 700,
                border: "none", borderRadius: "0 8px 8px 0", cursor: "pointer",
                background: !autoPhase ? "#6b44ff" : "rgba(255,255,255,0.08)",
                color: !autoPhase ? "#fff" : "#888",
              }}
            >
              Manual
            </button>
          </div>

          {/* Next Phase button (manual mode or always visible during end phases) */}
          {matchState.isComplete && matchState.matchEndPhase && matchState.matchEndPhase !== "table" && matchState.matchEndPhase !== "actions" && (
            <button
              onClick={advancePhase}
              style={{
                width: "100%", padding: "10px", marginBottom: 10,
                background: "linear-gradient(90deg,#6b44ff,#a855f7)",
                color: "#fff", border: "none", borderRadius: 8,
                cursor: "pointer", fontWeight: 700, fontSize: 13, letterSpacing: 1,
              }}
            >
              Next Phase →
            </button>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              width: "100%",
              padding: 8,
              marginBottom: 10,
              background: showSettings
                ? "#4caf50"
                : "rgba(255,255,255,0.08)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            ⚙️ {showSettings ? "Hide Settings" : "Settings"}
          </button>

          {showSettings && (
            <div>
              <div
                style={{
                  color: "#6b44ff",
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: 1,
                  marginBottom: 6,
                }}
              >
                ⚙ GAMEPLAY
              </div>
              <CSection title="Speed" icon="⚡" color="#6b44ff">
                <label
                  style={{
                    color: "#ccc",
                    fontSize: 12,
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Multiplier:{" "}
                  <span style={{ color: "#6b44ff", fontWeight: 600 }}>
                    {speedMul.toFixed(1)}x
                  </span>
                </label>
                <input
                  type="range"
                  min={0.5}
                  max={5}
                  step={0.1}
                  value={speedMul}
                  onChange={(e) => setSpeedMul(parseFloat(e.target.value))}
                  style={{ width: "100%", cursor: "pointer" }}
                />
                <label
                  style={{
                    color: "#ccc",
                    fontSize: 12,
                    display: "block",
                    marginTop: 8,
                    marginBottom: 4,
                  }}
                >
                  Ball Speed:{" "}
                  <span style={{ color: "#42a5f5", fontWeight: 600 }}>
                    {ballSpeed.toFixed(1)}
                  </span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={0.5}
                  value={ballSpeed}
                  onChange={(e) => setBallSpeed(parseFloat(e.target.value))}
                  style={{ width: "100%", cursor: "pointer" }}
                />
              </CSection>
              <CSection title="Spikes" icon="🔺" color="#ff9800">
                <label style={{ color: "#ccc", fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={spikeOn}
                    onChange={() => setSpikeOn((s) => !s)}
                    style={{ marginRight: 6 }}
                  />
                  Enable spikes
                </label>
                {spikeOn && (
                  <>
                    <label
                      style={{
                        color: "#ccc",
                        fontSize: 12,
                        display: "block",
                        marginTop: 6,
                        marginBottom: 4,
                      }}
                    >
                      Count:{" "}
                      <span style={{ color: "#fff", fontWeight: 600 }}>
                        {spikeCount}
                      </span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      step={1}
                      value={spikeCount}
                      onChange={(e) =>
                        setSpikeCount(parseInt(e.target.value))
                      }
                      style={{
                        width: "100%",
                        cursor: "pointer",
                        marginBottom: 8,
                      }}
                    />
                    <label
                      style={{
                        color: "#ccc",
                        fontSize: 12,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Size:{" "}
                      <span style={{ color: "#fff", fontWeight: 600 }}>
                        {spikeSize}px
                      </span>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={80}
                      step={1}
                      value={spikeSize}
                      onChange={(e) =>
                        setSpikeSize(parseInt(e.target.value))
                      }
                      style={{ width: "100%", cursor: "pointer" }}
                    />
                  </>
                )}
              </CSection>
              <CSection title="Ball Weights" icon="🎯" color="#e040fb">
                {/* Boundary Toggle + Slider */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <label style={{ color: "#ccc", fontSize: 12, flex: 1 }}>
                    Boundary (4/6)
                  </label>
                  <div
                    onClick={() => {
                      const next = !boundaryEnabled;
                      setBoundaryEnabled(next);
                      boundaryEnabledRef.current = next;
                    }}
                    style={{
                      width: 36, height: 20, borderRadius: 10, cursor: "pointer",
                      background: boundaryEnabled ? "#4caf50" : "#555",
                      position: "relative", transition: "background 0.2s",
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%", background: "#fff",
                      position: "absolute", top: 2,
                      left: boundaryEnabled ? 18 : 2,
                      transition: "left 0.2s",
                    }} />
                  </div>
                </div>
                {boundaryEnabled && (
                  <>
                    <label style={{ color: "#aaa", fontSize: 11, display: "block", marginBottom: 2 }}>
                      Extra boundary balls:{" "}
                      <span style={{ color: "#ffd54f", fontWeight: 700 }}>{extraBoundary}</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={1}
                      value={extraBoundary}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        setExtraBoundary(v);
                        extraBoundaryRef.current = v;
                      }}
                      style={{ width: "100%", cursor: "pointer" }}
                    />
                  </>
                )}

                {/* Out Toggle + Slider */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, marginTop: 10 }}>
                  <label style={{ color: "#ccc", fontSize: 12, flex: 1 }}>
                    Wicket (Out)
                  </label>
                  <div
                    onClick={() => {
                      const next = !outEnabled;
                      setOutEnabled(next);
                      outEnabledRef.current = next;
                    }}
                    style={{
                      width: 36, height: 20, borderRadius: 10, cursor: "pointer",
                      background: outEnabled ? "#ef5350" : "#555",
                      position: "relative", transition: "background 0.2s",
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%", background: "#fff",
                      position: "absolute", top: 2,
                      left: outEnabled ? 18 : 2,
                      transition: "left 0.2s",
                    }} />
                  </div>
                </div>
                {outEnabled && (
                  <>
                    <label style={{ color: "#aaa", fontSize: 11, display: "block", marginBottom: 2 }}>
                      Extra out balls:{" "}
                      <span style={{ color: "#ef5350", fontWeight: 700 }}>{extraOut}</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={1}
                      value={extraOut}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        setExtraOut(v);
                        extraOutRef.current = v;
                      }}
                      style={{ width: "100%", cursor: "pointer" }}
                    />
                  </>
                )}

                {/* Dot Ball Toggle + Slider */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, marginTop: 10 }}>
                  <label style={{ color: "#ccc", fontSize: 12, flex: 1 }}>
                    Dot Ball (0)
                  </label>
                  <div
                    onClick={() => {
                      const next = !dotEnabled;
                      setDotEnabled(next);
                      dotEnabledRef.current = next;
                    }}
                    style={{
                      width: 36, height: 20, borderRadius: 10, cursor: "pointer",
                      background: dotEnabled ? "#9e9e9e" : "#555",
                      position: "relative", transition: "background 0.2s",
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%", background: "#fff",
                      position: "absolute", top: 2,
                      left: dotEnabled ? 18 : 2,
                      transition: "left 0.2s",
                    }} />
                  </div>
                </div>
                {dotEnabled && (
                  <>
                    <label style={{ color: "#aaa", fontSize: 11, display: "block", marginBottom: 2 }}>
                      Extra dot balls:{" "}
                      <span style={{ color: "#9e9e9e", fontWeight: 700 }}>{extraDot}</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={1}
                      value={extraDot}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        setExtraDot(v);
                        extraDotRef.current = v;
                      }}
                      style={{ width: "100%", cursor: "pointer" }}
                    />
                  </>
                )}
              </CSection>
              <div
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 10,
                  color: "#aaa",
                  lineHeight: 1.8,
                  marginTop: 8,
                }}
              >
                <div>• 3 bubbles: 2 batsmen + 1 bowler</div>
                <div>• Ball values: 0,1,2,3,4,6 or W</div>
                <div>• Only bowlers &amp; all-rounders bowl</div>
                <div>• Max 4 overs per bowler</div>
                <div>• 6 balls/over, {MAX_OVERS} overs/innings</div>
                <div>• 10 wickets = all out</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* Collapsible Section */
const CSection: React.FC<{
  title: string;
  icon: string;
  color: string;
  children: React.ReactNode;
}> = ({ title, icon, color, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.05)",
        borderRadius: 8,
        marginBottom: 6,
        border: "1px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
      }}
    >
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: 10,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: open ? `${color}33` : "transparent",
          transition: "background 0.2s",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>
            {title}
          </span>
        </div>
        <span style={{ color: "#999", fontSize: 11 }}>
          {open ? "▼" : "▶"}
        </span>
      </div>
      {open && (
        <div style={{ padding: "0 10px 10px 10px" }}>{children}</div>
      )}
    </div>
  );
};

export default CricketPage;
