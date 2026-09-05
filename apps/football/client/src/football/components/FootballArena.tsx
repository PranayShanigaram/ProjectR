import React, { useEffect, useRef, useState } from "react";
import { FootballPlayer, FootballTeam, PlayerPosition } from "../types/football";
import {
  initializeCommentary,
  logGoal,
  logPass,
  logDribble,
  logPossessionChange,
  endCommentary,
  getCurrentMatchId,
} from "../../utils/commentaryClient";
import { getAudioManager, resetAudioManager } from "../../utils/audioManager";

type TeamSide = "home" | "away";

interface ShootoutSummary {
  homeScore: number;
  awayScore: number;
  winner: TeamSide;
  homeResults: boolean[];
  awayResults: boolean[];
}

interface MatchResult {
  winner: TeamSide | "draw";
  goals: number;
  scoreline: string;
  stats: {
    homeShots: number;
    awayShots: number;
    homeShotsOnTarget: number;
    awayShotsOnTarget: number;
    goals: GoalEvent[];
  };
  // Present only when the match was decided by a penalty shootout.
  shootout?: ShootoutSummary;
}

interface Props {
  homeTeam: FootballTeam;
  awayTeam: FootballTeam;
  homeSquad?: FootballPlayer[];
  awaySquad?: FootballPlayer[];
  homeFormation?: string;
  awayFormation?: string;
  onMatchEnd?: (result: MatchResult) => void;
}

interface PlayerBubble {
  id: string;
  team: TeamSide;
  player: FootballPlayer;
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  role: PlayerPosition;
  hasBall: boolean;
  intent: "shape" | "press" | "support" | "run";
  facingAngle: number;
  targetRotation: number;
  aiState: "IDLE" | "SCAN" | "STOP" | "ROTATE" | "PASS" | "DRIBBLE" | "SHOOT";
  plannedAction: "pass" | "shoot" | "dribble" | null;
  passTargetId: string | null;
  plannedAerial: boolean;
  supportTargetX: number;
  supportTargetY: number;
  decisionCooldown: number;
  yellowCards: number;
  redCard: boolean;
}

interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  holderId: string | null;
  targetId: string | null;
  lastTouchId: string | null;
  mode: "held" | "pass" | "shot" | "penalty" | "loose";
  curl: number; // sideways acceleration giving the ball a curved flight
  spin: number; // angular velocity for the rolling soccer-ball pattern
  rotation: number; // current visual rotation of the ball pattern
  z: number; // height of the ball above the pitch (0 = on the ground)
  vz: number; // vertical velocity for lofted / airborne balls
}

interface GoalEvent {
  minute: number;
  team: TeamSide;
  player: string;
}

interface GameState {
  homeScore: number;
  awayScore: number;
  timePassed: number;
  // The match only runs once the user presses Start. Before that the pitch is
  // shown frozen so the line-up and shootout option can be set.
  started: boolean;
  // When enabled, a level match at full time is settled by a penalty shootout.
  shootoutEnabled: boolean;
  // Manually added stoppage time (in match-clock ms) added by the user.
  addedTimeMs: number;
  possession: TeamSide;
  homePlayers: PlayerBubble[];
  awayPlayers: PlayerBubble[];
  ball: BallState;
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homePossessionTicks: number;
  awayPossessionTicks: number;
  matchEnded: boolean;
  goals: GoalEvent[];
  goalFlash: { text: string; until: number } | null;
  // Sliding text banner (goals, penalties, cards) that slides across screen
  slideFlash: { text: string; color: string; until: number; duration?: number } | null;
  // Short announcement banner shown during a penalty (e.g. "PENALTY - NAME").
  penaltyBanner: { text: string; until: number } | null;
  // While timePassed < restartPauseUntil the game is frozen with players in
  // position (after a goal, penalty, or kickoff) before play resumes.
  restartPauseUntil: number;
  nextDecisionAt: number;
  recentPasses: string[];
  dribbleUntil: number;
  ballHeldUntil: number;
  intro: {
    active: boolean;
    phase: "card" | "home" | "away" | "done";
    phaseTimeMs: number;
  } | null;
  goalLineEscape: {
    holderId: string;
    team: TeamSide;
    line: "left" | "right";
    deadline: number;
  } | null;
  penalty: {
    team: TeamSide;
    shooterId: string;
    awaitingDecision: boolean;
    mode: "auto" | "manual";
    outcome: boolean | null;
    startedAt: number;
    shootAt: number | null;
    chosenOutcome: boolean | null;
  } | null;
  // Penalty shootout state machine (only set once a drawn match goes to a
  // shootout). The kick itself reuses the normal `penalty` object + view.
  shootout: {
    active: boolean;
    phase: "announce" | "lineup" | "kick" | "done";
    phaseUntil: number;
    homeKickers: string[];
    awayKickers: string[];
    homeResults: boolean[];
    awayResults: boolean[];
    homeScore: number;
    awayScore: number;
    current: TeamSide;
    round: number;
    resultFlash: { text: string; goal: boolean; until: number } | null;
    winner: TeamSide | null;
  } | null;
  halfTimeTriggered?: boolean;
  // Second-half visual side switch. The simulation is never mirrored (home
  // still attacks "right" internally); only the on-pitch rendering is flipped
  // so the teams appear to have swapped ends after the interval.
  secondHalf: boolean;
  // Match-clock moment at which the side switch + second-half kickoff fire.
  halfTimeSwitchAt: number | null;
}

const PITCH_WIDTH = 1200;
const PITCH_HEIGHT = 620;
const MARGIN = 70;
const HUD_HEIGHT = 74;
const CANVAS_WIDTH = PITCH_WIDTH + MARGIN * 2;
const CANVAS_HEIGHT = PITCH_HEIGHT + MARGIN * 2 + HUD_HEIGHT;
// The HUD sits across the very top of the canvas, so the pitch is drawn
// shifted down by this amount to keep the top touchline fully visible.
const PITCH_OFFSET_Y = HUD_HEIGHT;

const PLAYER_RADIUS = 17;
const BALL_RADIUS = 8;
const AIR_GRAVITY = 0.6; // downward acceleration for lofted (airborne) balls
const MATCH_DURATION = 180000;
// Slightly speed up the match clock (1.0 = real time, >1 = faster)
const CLOCK_SPEED = 1.12;
const GOAL_HEIGHT = 170;
const GOAL_DEPTH = 42;
const GOAL_TOP = MARGIN + PITCH_HEIGHT / 2 - GOAL_HEIGHT / 2;
const GOAL_BOTTOM = MARGIN + PITCH_HEIGHT / 2 + GOAL_HEIGHT / 2;
const LEFT_GOAL_X = MARGIN;
const RIGHT_GOAL_X = MARGIN + PITCH_WIDTH;
const PASS_RANGE = 420;
// Circular "radar" the ball carrier scans for team-mates when the user asks
// for a manual pass. ~25 m on the pitch (PITCH_WIDTH 1200px ≈ 105 m, so
// 1 m ≈ 11.4px → 25 m ≈ 285px). Used for the pass target + the on-screen count.
const PASS_RADAR_RADIUS = 285;
const ROTATION_SPEED = 0.12;
// Support angle/radius helpers removed (support positioning now uses relative runs)
const COUNTER_SPEED = 1.05;const BUILDUP_SPEED = 0.72;const CUTBACK_DISTANCE = 140;
const DECISION_MIN = 100;
const DECISION_MAX = 180;
// How long the sliding GOAL / NO-GOAL result text is shown between shootout kicks.
const SHOOTOUT_RESULT_MS = 2600;
const INTRO_CARD_MS = 2800;
const INTRO_SQUAD_MS = 2500;

const ROLE_ORDER: PlayerPosition[] = ["GK", "DEF", "MID", "FWD"];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

// Lighten (percent > 0) or darken (percent < 0) a #rrggbb colour. Non-hex
// inputs are returned unchanged so callers stay safe with any colour string.
const shadeColor = (color: string, percent: number) => {
  const hex = color.replace("#", "");
  if (hex.length !== 6) return color;
  const num = parseInt(hex, 16);
  if (Number.isNaN(num)) return color;
  const amt = Math.round(2.55 * percent);
  const r = clamp((num >> 16) + amt, 0, 255);
  const g = clamp(((num >> 8) & 0xff) + amt, 0, 255);
  const b = clamp((num & 0xff) + amt, 0, 255);
  return `rgb(${r}, ${g}, ${b})`;
};

const distance = (x1: number, y1: number, x2: number, y2: number) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy) || 0.0001;
};

const moveToward = (bubble: PlayerBubble, targetX: number, targetY: number, speed: number) => {
  const dx = targetX - bubble.x;
  const dy = targetY - bubble.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Stop almost completely while deciding if the ball is held
  if (
    bubble.hasBall &&
    (
      bubble.aiState === "SCAN" ||
      bubble.aiState === "STOP" ||
      bubble.aiState === "ROTATE" ||
      bubble.aiState === "PASS" ||
      bubble.aiState === "SHOOT"
    )
  ) {
    bubble.vx *= 0.35;
    bubble.vy *= 0.35;
    if (Math.abs(bubble.vx) < 0.02) bubble.vx = 0;
    if (Math.abs(bubble.vy) < 0.02) bubble.vy = 0;
    return;
  }

  if (dist < 1) {
    bubble.vx *= 0.8;
    bubble.vy *= 0.8;
    return;
  }

  // Slow down when approaching target
  let desiredSpeed = speed;
  if (dist < 60) desiredSpeed *= dist / 60;
  const desiredVx = (dx / dist) * desiredSpeed;
  const desiredVy = (dy / dist) * desiredSpeed;
  const steering = 0.18;
  bubble.vx += (desiredVx - bubble.vx) * steering;
  bubble.vy += (desiredVy - bubble.vy) * steering;

  const maxSpeed = speed;
  const currentSpeed = Math.hypot(bubble.vx, bubble.vy);
  if (currentSpeed > maxSpeed) {
    bubble.vx = (bubble.vx / currentSpeed) * maxSpeed;
    bubble.vy = (bubble.vy / currentSpeed) * maxSpeed;
  }
};

const keepInsidePitch = (bubble: PlayerBubble) => {
  const minX = MARGIN + PLAYER_RADIUS;
  const maxX = MARGIN + PITCH_WIDTH - PLAYER_RADIUS;
  const minY = MARGIN + PLAYER_RADIUS;
  const maxY = MARGIN + PITCH_HEIGHT - PLAYER_RADIUS;
  bubble.x = clamp(bubble.x, minX, maxX);
  bubble.y = clamp(bubble.y, minY, maxY);
};

const normalizeAngle = (angle: number) => {
  let normalized = angle % (Math.PI * 2);
  if (normalized <= -Math.PI) normalized += Math.PI * 2;
  if (normalized > Math.PI) normalized -= Math.PI * 2;
  return normalized;
};

const angleDifference = (source: number, target: number) => {
  return normalizeAngle(target - source);
};

const rotateToward = (bubble: PlayerBubble, targetRotation: number, maxDelta: number) => {
  const delta = angleDifference(bubble.facingAngle, targetRotation);
  if (Math.abs(delta) <= maxDelta) {
    bubble.facingAngle = normalizeAngle(targetRotation);
  } else {
    bubble.facingAngle = normalizeAngle(bubble.facingAngle + Math.sign(delta) * maxDelta);
  }
};

const getBallHolder = (state: GameState) => findPlayer(state, state.ball.holderId);

const executeQueuedPass = (state: GameState, holder: PlayerBubble) => {
  if (holder.plannedAction === "pass" && holder.passTargetId) {
    const target = findPlayer(state, holder.passTargetId);
    if (target) {
      startPass(state, holder, target, holder.plannedAerial);
      return;
    }
  }

  if (holder.plannedAction === "shoot") {
    startShot(state, holder);
    return;
  }

  resetPlayerAI(holder);
};

const slowPlayer = (bubble: PlayerBubble) => {
  bubble.vx *= 0.52;
  bubble.vy *= 0.52;
};

const getAngleBetween = (x1: number, y1: number, x2: number, y2: number) => Math.atan2(y2 - y1, x2 - x1);

const scheduleDecision = (state: GameState, minDelay = DECISION_MIN, maxDelay = DECISION_MAX) => {
  state.nextDecisionAt = state.timePassed + minDelay + Math.random() * (maxDelay - minDelay);
};

const resetPlayerAI = (player: PlayerBubble) => {
  player.aiState = "IDLE";
  player.plannedAction = null;
  player.passTargetId = null;
  player.plannedAerial = false;
  player.decisionCooldown = 0;
  player.targetRotation = player.facingAngle;
  player.supportTargetX = player.homeX;
  player.supportTargetY = player.homeY;
};

const preparePass = (state: GameState, holder: PlayerBubble, target: PlayerBubble, aerial = false) => {
  holder.passTargetId = target.id;
  holder.plannedAction = "pass";
  holder.plannedAerial = aerial;
  const opponents = opposingPlayers(state, holder.team).filter((p) => !p.redCard);
  let bestAngle = Math.atan2(target.y - holder.y, target.x - holder.x);
  let bestScore = -999999;
  for (let deg = -90; deg <= 90; deg += 10) {
    const angle = bestAngle + (deg * Math.PI) / 180;
    const px = holder.x + Math.cos(angle) * 140;
    const py = holder.y + Math.sin(angle) * 140;
    const nearest = Math.min(...opponents.map((op) => distance(op.x, op.y, px, py)));
    if (nearest > bestScore) {
      bestScore = nearest;
      bestAngle = angle;
    }
  }
  holder.targetRotation = bestAngle;
  holder.facingAngle = normalizeAngle(holder.facingAngle);
  holder.vx = 0;
  holder.vy = 0;
  holder.aiState = "ROTATE";
  scheduleDecision(state, 180, 280);
};

const prepareShot = (state: GameState, holder: PlayerBubble) => {
  const goal = goalCenterFor(holder.team);
  holder.passTargetId = null;
  holder.plannedAction = "shoot";
  holder.targetRotation = getAngleBetween(holder.x, holder.y, goal.x, goal.y);
  holder.aiState = "ROTATE";
  scheduleDecision(state, 180, 280);
};

const startPass = (state: GameState, holder: PlayerBubble, target: PlayerBubble, aerial = false) => {
  let aimX = target.x;
  let aimY = target.y;
  const direction = holder.team === "home" ? 1 : -1;
  if (target.role === "FWD") {
    aimX += direction * 25;
    aimY += target.vy * 4;
  }
  const dx = aimX - holder.x;
  const dy = aimY - holder.y;
  const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
  // Medium, realistic pass pace (longer passes carry a little more weight).
  const speed = clamp(5.2 + holder.player.passing / 26 + dist / 220, 5, 8.4);

  state.ball.holderId = null;
  state.ball.targetId = target.id;
  state.ball.lastTouchId = holder.id;
  state.ball.mode = "pass";
  state.goalLineEscape = null;
  state.ball.vx = (dx / dist) * speed;
  state.ball.vy = (dy / dist) * speed;
  // Sometimes the pass is chipped into the air (forced for balls played over
  // an opponent, otherwise an occasional long ball). Airborne balls curl more.
  const playAerial = aerial || (dist > 165 && Math.random() < 0.2);
  if (playAerial) {
    const frames = clamp(dist / Math.max(2, speed), 8, 60);
    state.ball.vz = clamp((AIR_GRAVITY * frames) / 2, 3, 8.5);
    state.ball.z = 7;
    state.ball.curl = (Math.random() - 0.5) * 0.26 * (0.7 + holder.player.passing / 100);
    state.ball.spin = speed * 0.12 * (Math.random() < 0.5 ? 1 : -1);
  } else {
    state.ball.z = 0;
    state.ball.vz = 0;
    state.ball.curl = (Math.random() - 0.5) * 0.16 * (0.6 + holder.player.passing / 100);
    state.ball.spin = speed * 0.06 * (Math.random() < 0.5 ? 1 : -1);
  }
  holder.hasBall = false;
  if (Math.random() < 0.22) {
    holder.intent = "run";
    holder.supportTargetX = target.x + (holder.team === "home" ? 55 : -55);
    holder.supportTargetY = target.y;
  }
  holder.aiState = "IDLE";
  holder.passTargetId = null;
  holder.decisionCooldown = 0;
  holder.plannedAction = null;
  holder.plannedAerial = false;
  state.recentPasses = [...state.recentPasses, `${holder.id}>${target.id}`].slice(-18);
  state.ballHeldUntil = state.timePassed + 3000;
  state.nextDecisionAt = state.timePassed + 400;
};

const startShot = (state: GameState, holder: PlayerBubble) => {
  const rawGoal = goalCenterFor(holder.team);
  const shotZones = [
    GOAL_TOP + 20,
    GOAL_TOP + 55,
    MARGIN + PITCH_HEIGHT / 2,
    GOAL_BOTTOM - 55,
    GOAL_BOTTOM - 20,
  ];
  const goal = {
    x: rawGoal.x,
    y: shotZones[Math.floor(Math.random() * shotZones.length)],
  };
  const dx = goal.x - holder.x;
  const dy = goal.y - holder.y;
  const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));

  state.ball.holderId = null;
  state.ball.targetId = null;
  state.ball.lastTouchId = holder.id;
  state.ball.mode = "shot";
  state.goalLineEscape = null;
  // Medium-paced, visible shot rather than an instant blast.
  const shotPower = 6.8 + holder.player.shooting / 26 + Math.random() * 1.4;
  state.ball.vx = (dx / dist) * shotPower;
  state.ball.vy = (dy / dist) * shotPower;
  // Bend and spin on the shot for a realistic curling flight.
  state.ball.curl = (Math.random() - 0.5) * 0.22 * (0.6 + holder.player.shooting / 100);
  state.ball.spin = shotPower * 0.08 * (Math.random() < 0.5 ? 1 : -1);
  // Occasionally lift the shot for a dipping, curling effort.
  if (Math.random() < 0.3) {
    state.ball.z = 4;
    state.ball.vz = 2.4 + Math.random() * 1.8;
  } else {
    state.ball.z = 0;
    state.ball.vz = 0;
  }
  holder.hasBall = false;
  state.ballHeldUntil = state.timePassed + 3000;
  state.nextDecisionAt = state.timePassed + 400;
  if (holder.team === "home") {
    state.homeShots += 1;
  } else {
    state.awayShots += 1;
  }
};

const startDribble = (state: GameState, holder: PlayerBubble) => {
  holder.plannedAction = "dribble";
  holder.aiState = "DRIBBLE";
  // Dribbling skill blends overall rating and pace, so elite carriers (Messi /
  // Ronaldo types) keep the ball noticeably longer and drive at the defence,
  // while lower-rated players release it much sooner.
  const dribbleSkill = holder.player.overall * 0.7 + holder.player.pace * 0.3;
  const skillBonus = clamp(dribbleSkill - 70, 0, 30) * 46; // 0 .. ~1380ms
  state.dribbleUntil = state.timePassed + 780 + Math.random() * 680 + skillBonus;
  state.nextDecisionAt = state.dribbleUntil;
};

// Loft the ball into open space (used when a manual pass finds no team-mate).
// The ball flies as an airborne loose ball so whichever side reaches it first
// can collect it once it drops, rather than the ball freezing on the spot.
const startAerialClearance = (state: GameState, holder: PlayerBubble, aimX: number, aimY: number) => {
  const dx = aimX - holder.x;
  const dy = aimY - holder.y;
  const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
  const speed = clamp(5.5 + dist / 200, 5, 8);
  state.ball.holderId = null;
  state.ball.targetId = null;
  state.ball.lastTouchId = holder.id;
  state.ball.mode = "loose";
  state.ball.vx = (dx / dist) * speed;
  state.ball.vy = (dy / dist) * speed;
  const frames = clamp(dist / Math.max(2, speed), 8, 60);
  state.ball.vz = clamp((AIR_GRAVITY * frames) / 2, 3, 8.5);
  state.ball.z = 7;
  state.ball.curl = 0;
  state.ball.spin = speed * 0.1 * (Math.random() < 0.5 ? 1 : -1);
  holder.hasBall = false;
  holder.aiState = "IDLE";
  holder.plannedAction = null;
  state.ballHeldUntil = state.timePassed + 2600;
  state.nextDecisionAt = state.timePassed + 500;
};

const getSquad = (team: FootballTeam, selected?: FootballPlayer[]) =>
  selected && selected.length === 11 ? selected : team.players.slice(0, 11);

const sortSquadForFormation = (players: FootballPlayer[]) =>
  [...players].sort((a, b) => {
    const roleDiff = ROLE_ORDER.indexOf(a.position) - ROLE_ORDER.indexOf(b.position);
    return roleDiff || a.jersey - b.jersey;
  });

const parseFormation = (formation?: string) => {
  const numbers = (formation || "4-3-3")
    .split("-")
    .map((part) => Number(part))
    .filter((value) => Number.isFinite(value) && value > 0);
  const defenders = numbers[0] || 4;
  const forwards = numbers[numbers.length - 1] || 3;
  const midfielders = Math.max(1, 10 - defenders - forwards);
  return { defenders, midfielders, forwards };
};

const distributeY = (count: number) => {
  if (count <= 1) return [MARGIN + PITCH_HEIGHT / 2];
  const top = MARGIN + PITCH_HEIGHT * 0.18;
  const bottom = MARGIN + PITCH_HEIGHT * 0.82;
  return Array.from({ length: count }, (_, index) => top + ((bottom - top) * index) / (count - 1));
};

const buildFormationSlots = (formation: string | undefined, side: TeamSide) => {
  const isHome = side === "home";
  const direction = isHome ? 1 : -1;
  const { defenders, midfielders, forwards } = parseFormation(formation);
  const slotGroups = [
    { role: "GK" as PlayerPosition, count: 1, x: isHome ? 82 : PITCH_WIDTH - 82 },
    { role: "DEF" as PlayerPosition, count: defenders, x: isHome ? PITCH_WIDTH * 0.22 : PITCH_WIDTH * 0.78 },
    { role: "MID" as PlayerPosition, count: midfielders, x: isHome ? PITCH_WIDTH * 0.47 : PITCH_WIDTH * 0.53 },
    { role: "FWD" as PlayerPosition, count: forwards, x: isHome ? PITCH_WIDTH * 0.74 : PITCH_WIDTH * 0.26 },
  ];

  return slotGroups.flatMap((group) =>
    distributeY(group.count).map((y) => ({
      role: group.role,
      x: MARGIN + group.x + (Math.random() - 0.5) * 8 * direction,
      y,
    }))
  );
};

const makeTeamBubbles = (
  team: FootballTeam,
  side: TeamSide,
  formation: string | undefined,
  selected?: FootballPlayer[]
): PlayerBubble[] => {
  const players = sortSquadForFormation(getSquad(team, selected));
  const slots = buildFormationSlots(formation, side);

  return slots.slice(0, 11).map((slot, index) => {
    const player =
      players.find((candidate) => candidate.position === slot.role && !players.slice(0, index).includes(candidate)) ||
      players[index] ||
      players[players.length - 1];

    return {
      id: `${side}-${player.id}-${index}`,
      team: side,
      player,
      x: slot.x,
      y: slot.y,
      vx: 0,
      vy: 0,
      homeX: slot.x,
      homeY: slot.y,
      role: slot.role,
      hasBall: false,
      intent: "shape",
      facingAngle: side === "home" ? 0 : Math.PI,
      targetRotation: side === "home" ? 0 : Math.PI,
      aiState: "IDLE",
      plannedAction: null,
      passTargetId: null,
      plannedAerial: false,
      supportTargetX: slot.x,
      supportTargetY: slot.y,
      decisionCooldown: 0,
      yellowCards: 0,
      redCard: false,
    };
  });
};

const playerSpeed = (player: FootballPlayer, intent: PlayerBubble["intent"]) => {
  const base = 1.05 + (player.pace / 100) * 1.5;
  if (intent === "press" || intent === "run") return base * 1.05;
  if (intent === "support") return base * 0.85;
  return base * 0.78;
};

const goalCenterFor = (team: TeamSide) => ({
  x: team === "home" ? RIGHT_GOAL_X - 6 : LEFT_GOAL_X + 6,
  y: MARGIN + PITCH_HEIGHT / 2,
});

const findPlayer = (state: GameState, id: string | null) => {
  if (!id) return null;
  return [...state.homePlayers, ...state.awayPlayers].find((player) => player.id === id) || null;
};

const teamPlayers = (state: GameState, team: TeamSide) => (team === "home" ? state.homePlayers : state.awayPlayers);

const opposingPlayers = (state: GameState, team: TeamSide) => (team === "home" ? state.awayPlayers : state.homePlayers);

const activeTeamPlayers = (state: GameState, team: TeamSide) =>
  teamPlayers(state, team).filter((player) => !player.redCard);

// Team-mates (outfield, on the pitch) inside the ball carrier's circular pass
// radar. Works from any player position, so it keeps counting while the carrier
// dribbles or drifts. Excludes the carrier itself, the keeper and red cards.
const teammatesInRadar = (state: GameState, holder: PlayerBubble) =>
  activeTeamPlayers(state, holder.team).filter(
    (p) =>
      p.id !== holder.id &&
      p.role !== "GK" &&
      distance(holder.x, holder.y, p.x, p.y) <= PASS_RADAR_RADIUS
  );

// removed lerp (unused after support movement refactor)

const pointToLineDistance = (x: number, y: number, x1: number, y1: number, x2: number, y2: number) => {
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D || 1;
  const t = Math.max(0, Math.min(1, dot / lenSq));
  const projX = x1 + C * t;
  const projY = y1 + D * t;
  return distance(x, y, projX, projY);
};

const isPassPathBlocked = (state: GameState, from: PlayerBubble, to: PlayerBubble) => {
  return opposingPlayers(state, from.team).some((opponent) => {
    if (opponent.redCard) return false;
    const ahead = (opponent.x - from.x) * (from.team === "home" ? 1 : -1) > -24;
    if (!ahead) return false;
    const d = pointToLineDistance(opponent.x, opponent.y, from.x, from.y, to.x, to.y);
    const between =
      (opponent.x - from.x) * (to.x - from.x) + (opponent.y - from.y) * (to.y - from.y) > 0 &&
      (opponent.x - to.x) * (from.x - to.x) + (opponent.y - to.y) * (from.y - to.y) > 0;
    return between && d < 58 && distance(opponent.x, opponent.y, from.x, from.y) < 180;
  });
};

type PassDirectionCategory = "forward" | "side" | "backward";

interface PassCandidate {
  mate: PlayerBubble;
  d: number;
  forwardDistance: number;
  lateralDistance: number;
  laneClear: boolean;
  directionCategory: PassDirectionCategory;
  score: number;
}

const passDirectionCategory = (holder: PlayerBubble, mate: PlayerBubble) => {
  const direction = holder.team === "home" ? 1 : -1;
  const forwardDistance = (mate.x - holder.x) * direction;
  if (forwardDistance > 28) return "forward" as const;
  if (forwardDistance < -28) return "backward" as const;
  return "side" as const;
};

const passRoleScore = (holder: PlayerBubble, mate: PlayerBubble) => {
  if (holder.role === "DEF") {
    if (mate.role === "MID") return 40;
    if (mate.role === "DEF") return 18;
    if (mate.role === "FWD") return 10;
  }
  if (holder.role === "MID") {
    if (mate.role === "MID") return 65;
    if (mate.role === "FWD") return 60;
    if (mate.role === "DEF") return 55;
  }
  if (holder.role === "FWD") {
    if (mate.role === "MID") return 72;
    if (mate.role === "FWD") return 46;
    if (mate.role === "DEF") return 8;
  }
  return 24;
};

const getPassCandidates = (state: GameState, holder: PlayerBubble): PassCandidate[] => {
  const direction = holder.team === "home" ? 1 : -1;
  const opponents = opposingPlayers(state, holder.team).filter((opponent) => !opponent.redCard);

  return activeTeamPlayers(state, holder.team)
    .filter((mate) => mate.id !== holder.id)
    .map((mate) => {
      const d = distance(holder.x, holder.y, mate.x, mate.y);
      if (d > PASS_RANGE) return null as null;

      const forwardDistance = (mate.x - holder.x) * direction;
      const lateralDistance = Math.abs(mate.y - holder.y);
      const directionCategory = passDirectionCategory(holder, mate);
      const laneClear = !isPassPathBlocked(state, holder, mate);
      const laneScore = laneClear ? 108 : 18;
      const roleScore = passRoleScore(holder, mate);
      const repeatedPassPenalty = state.recentPasses.filter(
        (pass) => pass === `${holder.id}>${mate.id}` || pass === `${mate.id}>${holder.id}`
      ).length * 180;
      const distanceScore = Math.max(0, 220 - d) * 0.72;
      const backwardPenalty = holder.role === "FWD" ? -85 : -42;
      const directionBonus =
        directionCategory === "side"
          ? 88
          : directionCategory === "backward"
          ? backwardPenalty
          : directionCategory === "forward"
          ? 96
          : 0;
      const supportBonus =
        directionCategory === "side"
          ? 70
          : directionCategory === "backward"
          ? holder.role === "FWD" ? -55 : -22
          : 0;

      const passAngle = Math.atan2(mate.y - holder.y, mate.x - holder.x);
      const rotationCost = Math.abs(angleDifference(holder.facingAngle, passAngle)) * 8;
      const nearbyOpponents = opponents.filter(
        (op) => distance(op.x, op.y, mate.x, mate.y) < 90
      ).length;
      const lanePressure = opponents.filter(
        (op) => pointToLineDistance(op.x, op.y, holder.x, holder.y, mate.x, mate.y) < 45
      ).length;
      const freeSpace = Math.min(
        ...opponents.map((op) => distance(op.x, op.y, mate.x, mate.y))
      );

      const score =
        freeSpace * 2.1 +
        laneScore * 2.4 +
        roleScore * 1.2 +
        distanceScore +
        directionBonus * 1.6 +
        supportBonus * 1.6 -
        lanePressure * 70 -
        nearbyOpponents * 45 -
        repeatedPassPenalty -
        rotationCost;

      return {
        mate,
        d,
        forwardDistance,
        lateralDistance,
        laneClear,
        directionCategory,
        score,
      };
    })
    .filter((candidate): candidate is PassCandidate => Boolean(candidate));
};

const choosePassTarget = (state: GameState, holder: PlayerBubble) => {
  const candidates = getPassCandidates(state, holder);
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates.filter((c) => c.score > candidates[0].score - 35);
  return best[Math.floor(Math.random() * best.length)].mate;
};

const chooseEscapePassTarget = (state: GameState, holder: PlayerBubble) => {
  const candidates = getPassCandidates(state, holder).filter((c) => c.laneClear);
  if (!candidates.length) return choosePassTarget(state, holder);

  const progressive = candidates.filter((c) => c.directionCategory !== "backward");
  const pool = progressive.length ? progressive : candidates;
  pool.sort((a, b) => {
    const aDirection = a.directionCategory === "forward" ? 70 : a.directionCategory === "side" ? 55 : -70;
    const bDirection = b.directionCategory === "forward" ? 70 : b.directionCategory === "side" ? 55 : -70;
    return b.score + bDirection - b.d * 0.25 - (a.score + aDirection - a.d * 0.25);
  });

  const best = pool.filter((c) => c.score > pool[0].score - 55);
  return best[Math.floor(Math.random() * best.length)].mate;
};

const getForwardRuns = (state: GameState, holder: PlayerBubble) => {
  const direction = holder.team === "home" ? 1 : -1;
  return activeTeamPlayers(state, holder.team)
    .filter((p) => p.id !== holder.id && p.role === "FWD")
    .filter((p) => {
      const forward = (p.x - holder.x) * direction;
      return forward > 40;
    });
};

// Finds a teammate in a clearly better scoring position than the ball carrier:
// closer to goal, with a clear passing lane and space away from defenders.
const chooseGoalScorerPass = (state: GameState, holder: PlayerBubble) => {
  const goal = goalCenterFor(holder.team);
  const holderGoalDist = distance(holder.x, holder.y, goal.x, goal.y);
  const opponents = opposingPlayers(state, holder.team).filter((p) => !p.redCard);
  const candidates = activeTeamPlayers(state, holder.team)
    .filter((mate) => mate.id !== holder.id && mate.role !== "GK")
    .map((mate) => {
      const d = distance(holder.x, holder.y, mate.x, mate.y);
      const mateGoalDist = distance(mate.x, mate.y, goal.x, goal.y);
      const nearestOpp = opponents.length
        ? Math.min(...opponents.map((op) => distance(op.x, op.y, mate.x, mate.y)))
        : 999;
      const laneClear = !isPassPathBlocked(state, holder, mate);
      return { mate, d, mateGoalDist, nearestOpp, laneClear };
    })
    .filter(
      (c) =>
        c.d < PASS_RANGE &&
        c.laneClear &&
        c.mateGoalDist < holderGoalDist - 30 &&
        c.mateGoalDist < 260 &&
        c.nearestOpp > 44
    );
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.mateGoalDist - b.mateGoalDist);
  return candidates[0].mate;
};

// Picks a lofted target: a teammate with a clear sight of goal that the holder
// can chip the ball to over an advanced goalkeeper.
const chooseLobOverKeeper = (state: GameState, holder: PlayerBubble) => {
  const oppTeam: TeamSide = holder.team === "home" ? "away" : "home";
  const keeper = activeTeamPlayers(state, oppTeam).find((p) => p.role === "GK");
  if (!keeper) return null;
  const goal = goalCenterFor(holder.team);
  const dir = holder.team === "home" ? 1 : -1;
  // The keeper has to be ahead of the holder for a chip to make sense.
  if ((keeper.x - holder.x) * dir < -10) return null;
  const mates = activeTeamPlayers(state, holder.team).filter(
    (m) => m.id !== holder.id && m.role !== "GK"
  );
  const candidates = mates.filter((m) => {
    const mateGoalDist = distance(m.x, m.y, goal.x, goal.y);
    const mateForward = (m.x - holder.x) * dir;
    const openView = Math.abs(m.y - goal.y) < 130;
    const pastOrLevelWithKeeper = (m.x - keeper.x) * dir > -40;
    return mateGoalDist < 240 && mateForward > -10 && openView && pastOrLevelWithKeeper;
  });
  if (!candidates.length) return null;
  candidates.sort(
    (a, b) => distance(a.x, a.y, goal.x, goal.y) - distance(b.x, b.y, goal.x, goal.y)
  );
  return candidates[0];
};

// Works out where a dribbler should carry the ball. If the path straight
// towards goal is blocked by a defender, the carrier turns to the most open
// side (or drops back) instead of running into the wall of defenders.
const computeDribbleTarget = (state: GameState, player: PlayerBubble) => {
  const dir = player.team === "home" ? 1 : -1;
  const goalX = player.team === "home" ? RIGHT_GOAL_X - 28 : LEFT_GOAL_X + 28;
  const opponents = opposingPlayers(state, player.team).filter((p) => !p.redCard);
  const minY = MARGIN + 50;
  const maxY = MARGIN + PITCH_HEIGHT - 50;
  const blocker = opponents.find((op) => {
    const ahead = (op.x - player.x) * dir;
    // Higher-rated carriers treat only very tight defenders as true blockers,
    // so they can knife through small gaps instead of always turning away.
    const skill = player.player.overall;
    const gapTol = clamp(58 - (skill - 70) * 0.8, 34, 58);
    const aheadTol = clamp(105 - (skill - 70) * 0.7, 74, 105);
    return ahead > 0 && ahead < aheadTol && Math.abs(op.y - player.y) < gapTol;
  });
  if (!blocker) {
    return {
      x: goalX,
      y: clamp(player.y + (Math.random() - 0.5) * 24, minY, maxY),
    };
  }
  // Forward route blocked: turn out first. A short drop is only a pressure
  // release, not the default route for attackers.
  const backX = clamp(player.x - dir * 42, MARGIN + 40, MARGIN + PITCH_WIDTH - 40);
  const options = [
    { x: player.x + dir * 42, y: clamp(player.y - 118, minY, maxY), backward: false },
    { x: player.x + dir * 42, y: clamp(player.y + 118, minY, maxY), backward: false },
    { x: player.x + dir * 16, y: clamp(player.y - 72, minY, maxY), backward: false },
    { x: player.x + dir * 16, y: clamp(player.y + 72, minY, maxY), backward: false },
    { x: backX, y: clamp(player.y - 54, minY, maxY), backward: true },
    { x: backX, y: clamp(player.y + 54, minY, maxY), backward: true },
  ];
  let best = options[0];
  let bestOpen = -Infinity;
  for (const opt of options) {
    const nearest = opponents.length
      ? Math.min(...opponents.map((op) => distance(op.x, op.y, opt.x, opt.y)))
      : 999;
    const forwardGain = (opt.x - player.x) * dir;
    const openScore = nearest + forwardGain * 0.45 - (opt.backward ? 125 : 0);
    if (openScore > bestOpen) {
      bestOpen = openScore;
      best = opt;
    }
  }
  return best;
};

const chooseThroughBall = (state: GameState, holder: PlayerBubble) => {
  const runs = getForwardRuns(state, holder);
  if (!runs.length) return null;
  runs.sort((a, b) => {
    const da = distance(holder.x, holder.y, a.x, a.y);
    const db = distance(holder.x, holder.y, b.x, b.y);
    return da - db;
  });
  return runs[0];
};

const isWidePlayer = (player: PlayerBubble) => {
  return (
    player.role === "MID" &&
    (player.y < MARGIN + 150 || player.y > MARGIN + PITCH_HEIGHT - 150)
  );
};

const shouldCross = (holder: PlayerBubble) => {
  return (
    isWidePlayer(holder) &&
    (holder.team === "home"
      ? holder.x > RIGHT_GOAL_X - 260
      : holder.x < LEFT_GOAL_X + 260)
  );
};

const setBallToPlayer = (state: GameState, player: PlayerBubble) => {
  if (player.redCard) return;
  [...state.homePlayers, ...state.awayPlayers].forEach((bubble) => {
    bubble.hasBall = bubble.id === player.id;
    if (bubble.id !== player.id) resetPlayerAI(bubble);
  });
  state.possession = player.team;
  state.ball.holderId = player.id;
  state.ball.targetId = null;
  state.ball.lastTouchId = player.id;
  state.ball.mode = "held";
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.ball.curl = 0;
  state.ball.spin = 0;
  state.ball.z = 0;
  state.ball.vz = 0;
  state.ball.x = player.x + (player.team === "home" ? PLAYER_RADIUS + 8 : -PLAYER_RADIUS - 8);
  state.ball.y = player.y;
  // GK releases immediately; outfield players hold briefly before deciding.
  // Elite players hold the ball noticeably longer, so they keep possession and
  // dictate play rather than being rushed into an early pass.
  const outfieldHold = 1200 + clamp(player.player.overall - 70, 0, 30) * 40; // 1200 .. 2400ms
  state.ballHeldUntil = state.timePassed + (player.role === "GK" ? 200 : outfieldHold);
  state.nextDecisionAt = state.timePassed + (player.role === "GK" ? 80 : 140);
  resetPlayerAI(player);
};


const startPenaltyShot = (state: GameState, shooter: PlayerBubble, isGoal: boolean) => {
  const goal = goalCenterFor(shooter.team);
  const isHome = shooter.team === "home";
  let targetY: number;
  let targetX = goal.x;

  if (isGoal) {
    // Aim into a corner, away from the keeper who stands centrally.
    const side = Math.random() < 0.5 ? -1 : 1;
    targetY = clamp(goal.y + side * (45 + Math.random() * 30), GOAL_TOP + 14, GOAL_BOTTOM - 14);
    targetX = goal.x;
  } else {
    // A miss must clearly NOT be a goal: either straight at the keeper (a save)
    // or wide of / past the post (off target). Never into an empty corner.
    if (Math.random() < 0.5) {
      // Hit it straight at the keeper standing in the middle of the goal.
      targetY = goal.y + (Math.random() - 0.5) * 24;
      targetX = goal.x;
    } else {
      // Drag it wide — the ball misses the frame entirely (outside the posts).
      const high = Math.random() < 0.5;
      targetY = high ? GOAL_TOP - 55 : GOAL_BOTTOM + 55;
      targetX = isHome ? RIGHT_GOAL_X + 70 : LEFT_GOAL_X - 70;
    }
  }

  const d = distance(shooter.x, shooter.y, targetX, targetY) || 1;
  // Medium pace so the penalty is clearly visible as it travels.
  const speed = 5.4 + shooter.player.shooting / 28;

  state.ball.holderId = null;
  state.ball.targetId = null;
  state.ball.lastTouchId = shooter.id;
  state.ball.mode = "penalty";
  state.ball.vx = ((targetX - state.ball.x) / d) * speed;
  state.ball.vy = ((targetY - state.ball.y) / d) * speed;
  // No curl/spin on penalties — the ball travels straight to where it is aimed
  // so a "no goal" never bends back into the net.
  state.ball.curl = 0;
  state.ball.spin = speed * 0.08 * (Math.random() < 0.5 ? 1 : -1);
  state.ball.z = 0;
  state.ball.vz = 0;
  shooter.hasBall = false;
};

const resetAfterGoal = (state: GameState, concedingTeam: TeamSide) => {
  state.homePlayers.forEach((player) => {
    player.x = player.homeX;
    player.y = player.homeY;
    player.vx = 0;
    player.vy = 0;
    player.hasBall = false;
  });
  state.awayPlayers.forEach((player) => {
    player.x = player.homeX;
    player.y = player.homeY;
    player.vx = 0;
    player.vy = 0;
    player.hasBall = false;
  });
  const forwards = teamPlayers(state, concedingTeam).filter((p) => p.role === "FWD");
  const kicker = forwards[0] || teamPlayers(state, concedingTeam)[0];
  const receiver = forwards[1] || teamPlayers(state, concedingTeam)[1];
  kicker.x = MARGIN + PITCH_WIDTH / 2 - (concedingTeam === "home" ? 12 : -12);
  kicker.y = MARGIN + PITCH_HEIGHT / 2;
  receiver.x = MARGIN + PITCH_WIDTH / 2 + (concedingTeam === "home" ? 30 : -30);
  receiver.y = MARGIN + PITCH_HEIGHT / 2;
  setBallToPlayer(state, kicker);
  if (receiver) {
    preparePass(state, kicker, receiver);
  }
  // Freeze play for a few seconds so players reset and the ball sits on the
  // centre spot before the match resumes.
  state.restartPauseUntil = state.timePassed + 3500;
  state.nextDecisionAt = state.restartPauseUntil + 300;
};

const resetAfterPenalty = (state: GameState, kickTeam: TeamSide) => {
  state.homePlayers.forEach((player) => {
    player.x = player.homeX;
    player.y = player.homeY;
    player.vx = 0;
    player.vy = 0;
    player.hasBall = false;
  });
  state.awayPlayers.forEach((player) => {
    player.x = player.homeX;
    player.y = player.homeY;
    player.vx = 0;
    player.vy = 0;
    player.hasBall = false;
  });

  const starter = teamPlayers(state, kickTeam).find((player) => player.role === "FWD") || teamPlayers(state, kickTeam)[0];
  if (!starter) return;
  const centerX = MARGIN + PITCH_WIDTH / 2;
  const centerY = MARGIN + PITCH_HEIGHT / 2;
  const ballOffset = PLAYER_RADIUS + 8;
  starter.x = centerX - (kickTeam === "home" ? ballOffset : -ballOffset);
  starter.y = centerY;
  starter.vx = 0;
  starter.vy = 0;
  setBallToPlayer(state, starter);
  state.ballHeldUntil = state.timePassed + 8000;
  // Pause so everyone resets to position before the restart is played.
  state.restartPauseUntil = state.timePassed + 3500;
  state.nextDecisionAt = state.restartPauseUntil + 300;
};

// Picks the five highest-calibre penalty takers for a shootout (best shooters
// first, falling back to overall) from the players still on the pitch.
const pickShootoutKickers = (state: GameState, team: TeamSide): string[] =>
  activeTeamPlayers(state, team)
    .slice()
    .sort((a, b) => b.player.shooting - a.player.shooting || b.player.overall - a.player.overall)
    .slice(0, 5)
    .map((p) => p.id);

// Standard shootout winner rule: during the first five kicks a side wins as
// soon as the other cannot mathematically catch up; afterwards it is sudden
// death decided whenever the teams are level on kicks taken.
const computeShootoutWinner = (so: GameState["shootout"]): TeamSide | null => {
  if (!so) return null;
  const ht = so.homeResults.length;
  const at = so.awayResults.length;
  const hs = so.homeScore;
  const as = so.awayScore;
  const hRem = Math.max(0, 5 - ht);
  const aRem = Math.max(0, 5 - at);
  if (hRem > 0 || aRem > 0) {
    if (hs > as + aRem) return "home";
    if (as > hs + hRem) return "away";
    return null;
  }
  // Sudden death: decide only on completed rounds (equal kicks taken).
  if (ht === at && hs !== as) return hs > as ? "home" : "away";
  return null;
};

const createInitialState = (
  homeTeam: FootballTeam,
  awayTeam: FootballTeam,
  homeSquad: FootballPlayer[] | undefined,
  awaySquad: FootballPlayer[] | undefined,
  homeFormation: string | undefined,
  awayFormation: string | undefined
): GameState => {
  const homePlayers = makeTeamBubbles(homeTeam, "home", homeFormation, homeSquad);
  const awayPlayers = makeTeamBubbles(awayTeam, "away", awayFormation, awaySquad);
  const starter = homePlayers.find((player) => player.role === "FWD") || homePlayers[0];
  const state: GameState = {
    homeScore: 0,
    awayScore: 0,
    timePassed: 0,
    started: false,
    shootoutEnabled: false,
    addedTimeMs: 0,
    possession: "home",
    homePlayers,
    awayPlayers,
    ball: {
      x: MARGIN + PITCH_WIDTH / 2,
      y: MARGIN + PITCH_HEIGHT / 2,
      vx: 0,
      vy: 0,
      holderId: null,
      targetId: null,
      lastTouchId: null,
      mode: "loose",
      curl: 0,
      spin: 0,
      rotation: 0,
      z: 0,
      vz: 0,
    },
    homeShots: 0,
    awayShots: 0,
    homeShotsOnTarget: 0,
    awayShotsOnTarget: 0,
    homePossessionTicks: 0,
    awayPossessionTicks: 0,
    matchEnded: false,
    goals: [],
    goalFlash: null,
    slideFlash: null,
    penaltyBanner: null,
    restartPauseUntil: 2200,
    nextDecisionAt: 2400,
    recentPasses: [],
    dribbleUntil: 0,
    ballHeldUntil: 0,
    intro: null,
    goalLineEscape: null,
    penalty: null,
    shootout: null,
    halfTimeTriggered: false,
    secondHalf: false,
    halfTimeSwitchAt: null,
  };
  // Place the starter at center circle for kickoff, ball at center.
  starter.x = MARGIN + PITCH_WIDTH / 2 - 12;
  starter.y = MARGIN + PITCH_HEIGHT / 2;
  starter.hasBall = true;
  state.ball.holderId = starter.id;
  state.ball.lastTouchId = starter.id;
  state.ball.mode = "held";
  state.ball.x = MARGIN + PITCH_WIDTH / 2;
  state.ball.y = MARGIN + PITCH_HEIGHT / 2;
  state.possession = "home";
  return state;
};

const shortPlayerName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0] || "";
  return parts[parts.length - 1];
};

// Draws a classic black-and-white soccer ball that visibly rotates via the
// `rotation` angle, giving passes and shots a real spinning-ball look.
const drawSoccerBall = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rotation: number
) => {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#f6f6f6";
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  const pentagon = (cx: number, cy: number, size: number, rot: number) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const a = rot + (i * Math.PI * 2) / 5 - Math.PI / 2;
      const px = cx + Math.cos(a) * size;
      const py = cy + Math.sin(a) * size;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  };

  ctx.fillStyle = "#1a1a1a";
  pentagon(0, 0, r * 0.36, 0);
  for (let i = 0; i < 5; i += 1) {
    const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
    const cx = Math.cos(a) * r * 0.7;
    const cy = Math.sin(a) * r * 0.7;
    pentagon(cx, cy, r * 0.2, a + Math.PI);
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1, r * 0.16);
  ctx.strokeStyle = "#1c1c1c";
  ctx.stroke();
};

// Draws the ball lifted by its height `z` with a soft ground shadow beneath it,
// so airborne passes and lofted shots clearly read as being off the ground.
const drawBallWithShadow = (
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  z: number,
  r: number,
  rotation: number
) => {
  const lift = Math.max(0, z);
  const shadowScale = 1 + lift / 55;
  ctx.save();
  ctx.globalAlpha = Math.max(0.08, 0.34 - lift / 240);
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.ellipse(x, groundY, r * 1.05 * shadowScale, r * 0.5 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawSoccerBall(ctx, x, groundY - lift, r, rotation);
};

export const FootballArena: React.FC<Props> = ({
  homeTeam,
  awayTeam,
  homeSquad,
  awaySquad,
  homeFormation,
  awayFormation,
  onMatchEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const matchEndedNotifiedRef = useRef(false);
  const gameStateRef = useRef<GameState>(
    createInitialState(homeTeam, awayTeam, homeSquad, awaySquad, homeFormation, awayFormation)
  );
  
  // Tracking refs for continuous commentary logging
  const lastCommentaryLogRef = useRef<number>(0);
  const lastBallHolderRef = useRef<string | null>(null);
  const lastPossessionTeamRef = useRef<TeamSide | null>(null);
  const lastPassModeRef = useRef<string | null>(null);
  
  const [matchState, setMatchState] = useState(gameStateRef.current);
  const [shootoutOptIn, setShootoutOptIn] = useState(false);
  const currentHolder = findPlayer(matchState, matchState.ball.holderId);
  // Live count of team-mates inside the carrier's pass radar (for the panel).
  const radarTeammateCount = currentHolder ? teammatesInRadar(matchState, currentHolder).length : 0;

  useEffect(() => {
    gameStateRef.current = createInitialState(homeTeam, awayTeam, homeSquad, awaySquad, homeFormation, awayFormation);
    setMatchState(gameStateRef.current);
    setShootoutOptIn(false);
    matchEndedNotifiedRef.current = false;
    lastTimeRef.current = 0;
  }, [homeTeam, awayTeam, homeSquad, awaySquad, homeFormation, awayFormation]);

  const updatePlayers = (state: GameState) => {
      const activeTeam = state.possession;

    // Limit how many players from each team converge on the ball so the
    // pitch does not collapse into a swarm around the striker.
    const ballHolder = getBallHolder(state);
    const MAX_PRESSERS = 3; // defenders chasing the ball carrier
    const MAX_SUPPORTERS = 4; // attackers offering close support
    const presserIds = new Set<string>();
    const supporterIds = new Set<string>();
    if (ballHolder) {
      const defendingTeam: TeamSide = ballHolder.team === "home" ? "away" : "home";
      activeTeamPlayers(state, defendingTeam)
        .filter((p) => p.role !== "GK")
        .sort(
          (a, b) =>
            distance(a.x, a.y, ballHolder.x, ballHolder.y) -
            distance(b.x, b.y, ballHolder.x, ballHolder.y)
        )
        .slice(0, MAX_PRESSERS)
        .forEach((p) => presserIds.add(p.id));
      activeTeamPlayers(state, ballHolder.team)
        .filter((p) => p.role !== "GK" && p.id !== ballHolder.id)
        .sort(
          (a, b) =>
            distance(a.x, a.y, ballHolder.x, ballHolder.y) -
            distance(b.x, b.y, ballHolder.x, ballHolder.y)
        )
        .slice(0, MAX_SUPPORTERS)
        .forEach((p) => supporterIds.add(p.id));
    }

    // When the ball is loose (no holder), the nearest outfield player from each
    // team breaks to chase it down so play does not freeze around a free ball.
    const looseBall = !ballHolder;
    const chaserIds = new Set<string>();
    if (looseBall) {
      ((["home", "away"] as TeamSide[])).forEach((side) => {
        const nearest = activeTeamPlayers(state, side)
          .filter((p) => p.role !== "GK")
          .sort(
            (a, b) =>
              distance(a.x, a.y, state.ball.x, state.ball.y) -
              distance(b.x, b.y, state.ball.x, state.ball.y)
          )[0];
        if (nearest) chaserIds.add(nearest.id);
      });
      if (state.ball.targetId) chaserIds.add(state.ball.targetId);
    }

    [...state.homePlayers, ...state.awayPlayers].forEach((player) => {
      if (player.redCard) {
        player.hasBall = false;
        player.vx *= 0.72;
        player.vy *= 0.72;
        return;
      }

      const isPossessionTeam = player.team === activeTeam;
      let targetX = player.homeX;
      let targetY = player.homeY;

      player.intent = "shape";

      if (player.id === state.ball.holderId) {
        switch (player.aiState) {
          case "SCAN": {
            const target = choosePassTarget(state, player);
            if (target) {
              preparePass(state, player, target);
            } else {
              player.aiState = "DRIBBLE";
            }
            break;
          }
          case "STOP":
            slowPlayer(player);
            targetX = player.x;
            targetY = player.y;
            player.intent = "shape";
            if (Math.abs(player.vx) < 0.05 && Math.abs(player.vy) < 0.05) {
              player.aiState = "ROTATE";
            }
            break;
          case "ROTATE":
            targetX = player.x;
            targetY = player.y;
            rotateToward(player, player.targetRotation, ROTATION_SPEED);
            // if (Math.abs(angleDifference(player.facingAngle, player.targetRotation)) < 0.08) {
            //   executeQueuedPass(state, player);
            // }
            const diff =
            Math.abs(
            angleDifference(
            player.facingAngle,
            player.targetRotation
            )
            );

            if(diff<0.04){

            executeQueuedPass(
            state,
            player
            );

            }
            break;
          case "PASS":
            targetX = player.x;
            targetY = player.y;
            slowPlayer(player);
            if (state.timePassed >= state.nextDecisionAt && player.plannedAction === "pass" && player.passTargetId) {
              const target = findPlayer(state, player.passTargetId);
              if (target) {
                startPass(state, player, target);
              } else {
                resetPlayerAI(player);
                scheduleDecision(state);
              }
            }
            break;
          case "SHOOT":
            targetX = player.x;
            targetY = player.y;
            slowPlayer(player);
            if (state.timePassed >= state.nextDecisionAt && player.plannedAction === "shoot") {
              startShot(state, player);
            }
            break;
          case "DRIBBLE": {
            player.intent = "run";
            // Defender-aware carry: head for goal, but turn out to the open
            // side (or drop back) when the forward route is blocked.
            const dribble = computeDribbleTarget(state, player);
            targetX = dribble.x;
            targetY = dribble.y;
            break;
          }
          default:
            player.aiState = "DRIBBLE";
            player.intent = "run";
            {
              const finishX =
                player.team === "home"
                  ? RIGHT_GOAL_X - 28
                  : LEFT_GOAL_X + 28;
              targetX = finishX;
              targetY = MARGIN + PITCH_HEIGHT / 2;
            }
        }
      } else if (looseBall && chaserIds.has(player.id)) {
        // Sprint to the loose ball (lead its motion slightly).
        targetX = state.ball.x + state.ball.vx * 4;
        targetY = state.ball.y + state.ball.vy * 4;
        player.intent = "run";
      } else if (player.role === "GK") {
        const goalCenter = goalCenterFor(player.team);
        const keeperLine =
          player.team === "home"
            ? MARGIN + 55
            : MARGIN + PITCH_WIDTH - 55;
        const ballDistance =
          distance(
            state.ball.x,
            state.ball.y,
            goalCenter.x,
            goalCenter.y
          );
        if (
          state.ball.mode === "shot" &&
          ballDistance < 220
        ) {
          targetX = clamp(
            state.ball.x,
            keeperLine - 60,
            keeperLine + 60
          );
          targetY = state.ball.y;
        } else if (
          state.ball.mode === "pass" &&
          ballDistance < 180
        ) {
          targetX =
            keeperLine +
            (player.team === "home"
              ? 20
              : -20);
          targetY = state.ball.y;
        } else {
          targetX = keeperLine;
          targetY = clamp(
            state.ball.y,
            goalCenter.y - 90,
            goalCenter.y + 90
          );
        }
        player.intent = "shape";
      } else if (isPossessionTeam) {
        const holder = getBallHolder(state);
        if (holder && supporterIds.has(player.id)) {
          const direction = holder.team === "home" ? 1 : -1;
          const dx = player.homeX - holder.homeX;
          const dy = player.homeY - holder.homeY;
          targetX = holder.x + clamp(dx, -160, 160);
          targetY = holder.y + clamp(dy, -120, 120);
          if (player.role === "FWD") {
            const forwards = activeTeamPlayers(state, player.team)
              .filter((p) => p.role === "FWD")
              .sort((a, b) => a.homeY - b.homeY);
            const lane = forwards.findIndex((p) => p.id === player.id);
            targetX += direction * 70;
            if (lane === 0) targetY -= 90;
            else if (lane === 2) targetY += 90;
          }
          if (player.role === "MID") {
            const mids = activeTeamPlayers(state, player.team)
              .filter((p) => p.role === "MID")
              .sort(
                (a, b) =>
                  distance(a.x, a.y, holder.x, holder.y) -
                  distance(b.x, b.y, holder.x, holder.y)
              );
            const rank = mids.findIndex((p) => p.id === player.id);
            // Offer options ahead, beside and behind the ball carrier
            if (rank === 0) {
              targetX += direction * 45;
              targetY -= 80;
            } else if (rank === 1) {
              targetX -= direction * 35; // drop behind to recycle possession
              targetY += 80;
            } else {
              targetX -= direction * 20;
            }
          }
          if (player.role === "DEF") {
            targetX -= direction * 55; // stay behind as a safe backward option
          }
          player.intent = "support";
          if (state.ball.targetId === player.id) {
            targetX = state.ball.x;
            targetY = state.ball.y;
            player.intent = "run";
          }
        } else if (holder) {
          // Not a close supporter: keep formation shape but shift toward the
          // ball so the team stays compact and shuffles across as a unit.
          const direction = holder.team === "home" ? 1 : -1;
          targetX =
            player.homeX +
            clamp((holder.x - holder.homeX) * 0.5, -90, 90) +
            direction * 10;
          targetY = player.homeY + clamp((holder.y - holder.homeY) * 0.35, -70, 70);
          player.intent = "shape";
          if (state.ball.targetId === player.id) {
            targetX = state.ball.x;
            targetY = state.ball.y;
            player.intent = "run";
          }
        }
      } else {
        const attackers = opposingPlayers(state, player.team)
          .filter((p) => !p.redCard);
        const holder = getBallHolder(state);
        if (!holder) {
          targetX = player.homeX;
          targetY = player.homeY;
          player.intent = "shape";
        } else if (presserIds.has(player.id)) {
          // Only the closest few defenders actually chase the ball carrier.
          if (player.role === "FWD") {
            const nearest = attackers.reduce((a, b) =>
              distance(player.x, player.y, a.x, a.y) <
              distance(player.x, player.y, b.x, b.y)
                ? a
                : b
            );
            targetX = nearest.x;
            targetY = nearest.y;
            player.intent = "press";
          } else {
            const offset = player.team === "home" ? -22 : 22;
            targetX = holder.x + offset;
            targetY = holder.y;
            player.intent = "press";
          }
        } else {
          // Hold defensive shape, staying goal-side and tracking the ball.
          const direction = player.team === "home" ? 1 : -1;
          targetX = player.homeX - direction * 8;
          targetY = player.homeY + clamp((holder.y - player.homeY) * 0.25, -55, 55);
          player.intent = "shape";
        }
      }

      moveToward(
        player,
        targetX,
        targetY,
        playerSpeed(player.player, player.intent) * (Math.abs(((getBallHolder(state)?.x) ?? player.x) - player.homeX) > 240 ? COUNTER_SPEED : BUILDUP_SPEED)
      );
      player.x += player.vx;
      player.y += player.vy;

      // Players who are not on the ball turn to face the direction they are
      // actually moving, so sideways and backward runs look natural rather
      // than everyone always facing straight ahead.
      if (player.id !== state.ball.holderId) {
        const moveSpeed = Math.hypot(player.vx, player.vy);
        if (moveSpeed > 0.18) {
          const moveAngle = Math.atan2(player.vy, player.vx);
          player.targetRotation = moveAngle;
          rotateToward(player, moveAngle, ROTATION_SPEED * 1.6);
        }
      } else if (player.aiState === "DRIBBLE" || player.aiState === "IDLE") {
        // The ball carrier faces where they are dribbling.
        const moveSpeed = Math.hypot(player.vx, player.vy);
        if (moveSpeed > 0.2) {
          const moveAngle = Math.atan2(player.vy, player.vx);
          player.targetRotation = moveAngle;
          rotateToward(player, moveAngle, ROTATION_SPEED * 1.4);
        }
      }
      teamPlayers(state, player.team).forEach((mate) => {
        if (mate.id === player.id) return;
        const d = distance(player.x, player.y, mate.x, mate.y);
        if (d < 42) {
          const push = (42 - d) / 2;
          const dx = (player.x - mate.x) / d;
          const dy = (player.y - mate.y) / d;
          player.x += dx * push;
          player.y += dy * push;
        }
      });
      player.vx *= 0.88;
      player.vy *= 0.88;
      keepInsidePitch(player);
    });
  };

  const separatePlayers = (state: GameState) => {
    const players = [...state.homePlayers, ...state.awayPlayers];
    for (let i = 0; i < players.length; i += 1) {
      for (let j = i + 1; j < players.length; j += 1) {
        const a = players[i];
        const b = players[j];
        const d = distance(a.x, a.y, b.x, b.y);
        const minDistance = PLAYER_RADIUS * 2 + 4;
        if (d < minDistance) {
          const overlap = (minDistance - d) / 2;
          const ux = (b.x - a.x) / d;
          const uy = (b.y - a.y) / d;
          a.x -= ux * overlap;
          a.y -= uy * overlap;
          b.x += ux * overlap;
          b.y += uy * overlap;
          keepInsidePitch(a);
          keepInsidePitch(b);
        }
      }
    }
  };

  const updateBall = (state: GameState) => {
    const holder = findPlayer(state, state.ball.holderId);
    if (holder) {
      state.ball.x = holder.x + (holder.team === "home" ? PLAYER_RADIUS + 8 : -PLAYER_RADIUS - 8);
      state.ball.y = holder.y;
      state.ball.vx = holder.vx;
      state.ball.vy = holder.vy;
      // Ball rolls as the player carries it.
      state.ball.rotation += Math.hypot(holder.vx, holder.vy) * 0.05;
      state.ball.curl = 0;
      state.ball.spin = 0;
      state.ball.z = 0;
      state.ball.vz = 0;
      return;
    }

    // Apply curl: a sideways acceleration perpendicular to the direction of
    // travel so passes and shots bend through the air instead of going straight.
    const speed = Math.hypot(state.ball.vx, state.ball.vy);
    if (
      speed > 0.4 &&
      Math.abs(state.ball.curl) > 0.0001 &&
      (state.ball.mode === "pass" || state.ball.mode === "shot" || state.ball.mode === "penalty")
    ) {
      const perpX = -state.ball.vy / speed;
      const perpY = state.ball.vx / speed;
      state.ball.vx += perpX * state.ball.curl;
      state.ball.vy += perpY * state.ball.curl;
      state.ball.curl *= 0.965;
    }

    state.ball.x += state.ball.vx;
    state.ball.y += state.ball.vy;
    state.ball.vx *= state.ball.mode === "shot" || state.ball.mode === "penalty" ? 0.980 : 0.970;
    state.ball.vy *= state.ball.mode === "shot" || state.ball.mode === "penalty" ? 0.980 : 0.970;

    // A shot that has run out of pace (missed everything and slowed down, e.g.
    // a "kick goal" from distance) becomes a normal loose ball so any outfield
    // player can chase it down instead of it floating uncollectable in "shot"
    // mode (which only a keeper is allowed to gather).
    if (
      state.ball.mode === "shot" &&
      state.ball.z <= 2 &&
      Math.hypot(state.ball.vx, state.ball.vy) < 2.2
    ) {
      state.ball.mode = "loose";
    }

    // Spin the visual pattern; spin bleeds off but is topped up by travel speed.
    state.ball.rotation += state.ball.spin + speed * 0.03;
    state.ball.spin *= 0.98;

    // Vertical motion for airborne balls (chips, lobs and lofted shots).
    if (state.ball.z > 0 || state.ball.vz !== 0) {
      state.ball.vz -= AIR_GRAVITY;
      state.ball.z += state.ball.vz;
      if (state.ball.z <= 0) {
        state.ball.z = 0;
        // A small bounce when it lands hard, otherwise it settles.
        state.ball.vz = state.ball.vz < -4 ? -state.ball.vz * 0.32 : 0;
      }
    }

    if (state.ball.y < MARGIN + BALL_RADIUS || state.ball.y > MARGIN + PITCH_HEIGHT - BALL_RADIUS) {
      state.ball.y = clamp(state.ball.y, MARGIN + BALL_RADIUS, MARGIN + PITCH_HEIGHT - BALL_RADIUS);
      state.ball.vy *= -0.72;
      state.ball.mode = "loose";
    }

    const defenders = [...state.homePlayers, ...state.awayPlayers].filter(
      (p) => !p.redCard && p.role === "DEF"
    );
    for (const d of defenders) {
      if (
        distance(d.x, d.y, state.ball.x, state.ball.y) < 18 &&
        state.ball.z < 16 &&
        state.ball.mode === "shot"
      ) {
        state.ball.vx *= -0.45;
        state.ball.vy *= 0.55;
        state.ball.mode = "loose";
        return;
      }
    }

    const insideGoalMouth = state.ball.y > GOAL_TOP && state.ball.y < GOAL_BOTTOM;
    if (
      state.ball.x >= RIGHT_GOAL_X - BALL_RADIUS &&
      insideGoalMouth &&
      (state.ball.mode === "shot" || state.ball.mode === "penalty")
    ) {
      if (state.ball.mode === "penalty") {
        // During a shootout the kick result is tracked separately.
        if (state.shootout?.active) {
          resolveShootoutKick(state.penalty?.outcome === true);
          return;
        }
        if (state.penalty?.outcome) {
          state.penalty = null;
          recordGoal(state, "home", false, true);
          resetAfterPenalty(state, "away");
        } else {
          state.slideFlash = {
            text: "PENALTY SAVED!",
            color: "#ff6b6b",
            until: state.timePassed + 1600,
          };
          state.ball.mode = "loose";
          state.ball.x = RIGHT_GOAL_X - BALL_RADIUS - 2;
          state.ball.vx *= -0.28;
          state.ball.vy *= 0.64;
          state.penalty = null;
          resetAfterPenalty(state, "away");
        }
      } else {
        recordGoal(state, "home");
      }
      return;
    }
    if (
      state.ball.x <= LEFT_GOAL_X + BALL_RADIUS &&
      insideGoalMouth &&
      (state.ball.mode === "shot" || state.ball.mode === "penalty")
    ) {
      if (state.ball.mode === "penalty") {
        // During a shootout the kick result is tracked separately.
        if (state.shootout?.active) {
          resolveShootoutKick(state.penalty?.outcome === true);
          return;
        }
        if (state.penalty?.outcome) {
          state.penalty = null;
          recordGoal(state, "away", false, true);
          resetAfterPenalty(state, "home");
        } else {
          state.slideFlash = {
            text: "PENALTY SAVED!",
            color: "#ff6b6b",
            until: state.timePassed + 1600,
          };
          state.ball.mode = "loose";
          state.ball.x = LEFT_GOAL_X + BALL_RADIUS + 2;
          state.ball.vx *= -0.28;
          state.ball.vy *= 0.64;
          state.penalty = null;
          resetAfterPenalty(state, "home");
        }
      } else {
        recordGoal(state, "away");
      }
      return;
    }
    if (state.ball.mode === "penalty" && state.penalty?.outcome === false) {
      const isOutOfPlay =
        state.ball.x < MARGIN + BALL_RADIUS ||
        state.ball.x > MARGIN + PITCH_WIDTH - BALL_RADIUS ||
        state.ball.y < MARGIN + BALL_RADIUS ||
        state.ball.y > MARGIN + PITCH_HEIGHT - BALL_RADIUS;
      if (isOutOfPlay || state.timePassed >= state.penalty.startedAt + 2200) {
        if (state.shootout?.active) {
          resolveShootoutKick(false);
          return;
        }
        const restartTeam = state.penalty.team === "home" ? "away" : "home";
        state.penalty = null;
        resetAfterPenalty(state, restartTeam);
        return;
      }
    }

    if (state.ball.x < MARGIN + BALL_RADIUS || state.ball.x > MARGIN + PITCH_WIDTH - BALL_RADIUS) {
      handleOutOfPlay(state);
    }
  };

  const resolveGoalLineRestart = (state: GameState, line: "left" | "right", lastTeam: TeamSide) => {
    state.goalLineEscape = null;
    const defendingTeam: TeamSide = line === "right" ? "away" : "home";
    const attackingTeam: TeamSide = defendingTeam === "home" ? "away" : "home";

    if (lastTeam === attackingTeam) {
      startGoalKick(state, defendingTeam);
    } else {
      startCorner(state, attackingTeam);
    }
  };

  const handleGoalLineEscape = (state: GameState) => {
    const holder = getBallHolder(state);
    if (!holder || holder.role !== "FWD" || state.penalty || state.shootout?.active) {
      state.goalLineEscape = null;
      return false;
    }

    const line = holder.team === "home" ? "right" : "left";
    const atLine =
      line === "right"
        ? holder.x >= RIGHT_GOAL_X - PLAYER_RADIUS - 2 || state.ball.x >= RIGHT_GOAL_X - BALL_RADIUS
        : holder.x <= LEFT_GOAL_X + PLAYER_RADIUS + 2 || state.ball.x <= LEFT_GOAL_X + BALL_RADIUS;

    if (!atLine) {
      state.goalLineEscape = null;
      return false;
    }

    if (!state.goalLineEscape || state.goalLineEscape.holderId !== holder.id) {
      state.goalLineEscape = {
        holderId: holder.id,
        team: holder.team,
        line,
        deadline: state.timePassed + 5000,  // 5 seconds for striker to shoot
      };

      // Reposition players for goal line scenario
      const direction = holder.team === "home" ? 1 : -1;
      const ownGoalX = holder.team === "home" ? RIGHT_GOAL_X : LEFT_GOAL_X;
      const oppGoalX = holder.team === "home" ? LEFT_GOAL_X : RIGHT_GOAL_X;
      const centerY = MARGIN + PITCH_HEIGHT / 2;

      // Reset all players to home positions first
      [...state.homePlayers, ...state.awayPlayers].forEach((p) => {
        p.x = p.homeX;
        p.y = p.homeY;
        p.vx = 0;
        p.vy = 0;
        p.hasBall = false;
        resetPlayerAI(p);
      });

      // Same team players: Position CLOSE to striker (supporting line)
      const teammates = activeTeamPlayers(state, holder.team).filter((p) => p.id !== holder.id);
      teammates.forEach((p, idx) => {
        if (p.role === "MID") {
          p.x = oppGoalX + direction * (200 + idx * 40);
          p.y = centerY + (idx % 2 === 0 ? -80 : 80);
        } else if (p.role === "DEF") {
          p.x = oppGoalX + direction * (350 + idx * 30);
          p.y = centerY + (idx % 3) * 80 - 80;
        }
      });

      // Opposing players: Position FAR (defensive line)
      const opponents = activeTeamPlayers(state, holder.team === "home" ? "away" : "home");
      opponents.forEach((p, idx) => {
        if (p.role === "GK") {
          p.x = ownGoalX - direction * 50;
          p.y = centerY;
        } else {
          p.x = ownGoalX - direction * (100 + idx * 40);
          p.y = centerY + (idx % 3) * 100 - 100;
        }
      });
    }

    holder.vx = 0;
    holder.vy = 0;

    if (state.timePassed >= state.goalLineEscape.deadline) {
      // Timeout: Award goal kick to defending team
      resolveGoalLineRestart(state, line, holder.team);
      return true;
    }

    // Striker on goal line: PRIORITY 1 - Attempt shot (aerial preferred)
    if (holder.plannedAction !== "shoot" && Math.random() < 0.5) {
      prepareShot(state, holder);
      return true;
    }

    // PRIORITY 2 - Try another shot attempt if first fails
    if (holder.plannedAction !== "shoot" && Math.random() < 0.5) {
      prepareShot(state, holder);
      return true;
    }

    // Otherwise hold position and try again next decision cycle
    return true;
  };

  const handleOutOfPlay = (state: GameState) => {
    const last = findPlayer(state, state.ball.lastTouchId);
    if (!last) return;
      const topSide = state.ball.y < MARGIN;
    const bottomSide = state.ball.y > MARGIN + PITCH_HEIGHT;
    if (topSide || bottomSide) {
      startThrowIn(state, last.team === "home" ? "away" : "home");
      return;
    }
    const attackedGoal = last.team === "home" ? RIGHT_GOAL_X : LEFT_GOAL_X;
    const crossedGoalSide = Math.abs(state.ball.x - attackedGoal) < 40;
    if (crossedGoalSide) {
      resolveGoalLineRestart(state, state.ball.x > MARGIN + PITCH_WIDTH / 2 ? "right" : "left", last.team);
    } else {
      if (last.team === "home") {
        startCorner(state, "away");
      } else {
        startCorner(state, "home");
      }
    }
  };

  const startThrowIn = (state: GameState, team: TeamSide) => {
    const receiver = teamPlayers(state, team).find((p) => p.role === "DEF") || teamPlayers(state, team)[0];
    if (!receiver) return;
    setBallToPlayer(state, receiver);
    receiver.x = clamp(state.ball.x, MARGIN + 20, MARGIN + PITCH_WIDTH - 20);
    receiver.y = clamp(state.ball.y, MARGIN + 6, MARGIN + PITCH_HEIGHT - 6);
    // Brief pause so the thrower settles before play restarts.
    const throwDelay = 1800;
    state.restartPauseUntil = state.timePassed + throwDelay;
    state.ballHeldUntil = state.restartPauseUntil + 400;
    state.nextDecisionAt = state.restartPauseUntil + 250;
    state.slideFlash = {
      text: `THROW-IN - ${team === "home" ? homeTeam.shortCode : awayTeam.shortCode}`,
      color: "#b0bec5",
      until: state.timePassed + 1800,
      duration: 1800,
    };
  };

  const startGoalKick = (state: GameState, team: TeamSide) => {
    const keeper = teamPlayers(state, team).find((p) => p.role === "GK");
    if (!keeper) return;
    state.goalLineEscape = null;
    const direction = team === "home" ? 1 : -1;
    const ownGoalX = team === "home" ? LEFT_GOAL_X : RIGHT_GOAL_X;
    const buildX = (fromGoal: number) => clamp(ownGoalX + direction * fromGoal, MARGIN + 30, MARGIN + PITCH_WIDTH - 30);
    const yAt = (ratio: number) => MARGIN + PITCH_HEIGHT * ratio;
    const place = (player: PlayerBubble, x: number, y: number) => {
      player.x = x;
      player.y = y;
      player.vx = 0;
      player.vy = 0;
      player.hasBall = false;
      resetPlayerAI(player);
    };

    [...state.homePlayers, ...state.awayPlayers].forEach((player) => {
      place(player, player.homeX, player.homeY);
    });

    // OWN TEAM: Position CLOSE to keeper (first line support)
    const defenders = activeTeamPlayers(state, team).filter((p) => p.role === "DEF").sort((a, b) => a.homeY - b.homeY);
    defenders.forEach((player, index) => {
      const ySlots = [0.22, 0.38, 0.62, 0.78];
      const wide = index === 0 || index === defenders.length - 1;
      place(player, buildX(wide ? 120 : 80), yAt(ySlots[index % ySlots.length])); // Closer to keeper
    });

    const midfielders = activeTeamPlayers(state, team).filter((p) => p.role === "MID").sort((a, b) => a.homeY - b.homeY);
    midfielders.forEach((player, index) => {
      const ySlots = [0.3, 0.5, 0.7, 0.42, 0.58];
      place(player, buildX(index < 2 ? 200 : 280), yAt(ySlots[index % ySlots.length])); // Closer
    });

    const forwards = activeTeamPlayers(state, team).filter((p) => p.role === "FWD").sort((a, b) => a.homeY - b.homeY);
    forwards.forEach((player, index) => {
      const ySlots = [0.26, 0.5, 0.74];
      place(player, buildX(420), yAt(ySlots[index % ySlots.length])); // Closer
    });

    // OPPOSING TEAM: Position FAR (pressing but from distance)
    const pressingTeam: TeamSide = team === "home" ? "away" : "home";
    const pressers = activeTeamPlayers(state, pressingTeam).filter((p) => p.role === "FWD").sort((a, b) => a.homeY - b.homeY);
    pressers.forEach((player, index) => {
      const ySlots = [0.36, 0.5, 0.64];
      place(player, buildX(280 + index * 35), yAt(ySlots[index % ySlots.length])); // Further away
    });

    const markers = activeTeamPlayers(state, pressingTeam).filter((p) => p.role === "MID").sort((a, b) => a.homeY - b.homeY);
    markers.forEach((player, index) => {
      const ySlots = [0.28, 0.44, 0.56, 0.72];
      place(player, buildX(400 + (index % 2) * 40), yAt(ySlots[index % ySlots.length])); // Further back
    });

    const compactDefs = activeTeamPlayers(state, pressingTeam).filter((p) => p.role === "DEF").sort((a, b) => a.homeY - b.homeY);
    compactDefs.forEach((player, index) => {
      const ySlots = [0.25, 0.4, 0.6, 0.75];
      place(player, buildX(550), yAt(ySlots[index % ySlots.length])); // Deep back line
    });

    keeper.x = buildX(48);
    keeper.y = MARGIN + PITCH_HEIGHT / 2;
    setBallToPlayer(state, keeper);
    const restartDelay = 2200 + Math.random() * 1800;
    state.ballHeldUntil = state.timePassed + restartDelay + 350;
    state.restartPauseUntil = state.timePassed + restartDelay;
    state.nextDecisionAt = state.restartPauseUntil + 250;
    // Sliding caption announcing the goal kick (same style as corners).
    state.slideFlash = {
      text: `GOAL KICK - ${team === "home" ? homeTeam.shortCode : awayTeam.shortCode}`,
      color: "#81c784",
      until: state.timePassed + 2200,
      duration: 2200,
    };
  };

  const startCorner = (state: GameState, team: TeamSide) => {
    const taker = teamPlayers(state, team).find((p) => p.role === "MID") || teamPlayers(state, team)[0];
    if (!taker) return;
    state.goalLineEscape = null;
    const direction = team === "home" ? 1 : -1;
    const oppGoalX = team === "home" ? LEFT_GOAL_X : RIGHT_GOAL_X;
    const cornerY = state.ball.y < MARGIN + PITCH_HEIGHT / 2 ? MARGIN + 6 : MARGIN + PITCH_HEIGHT - 6;
    const centerY = MARGIN + PITCH_HEIGHT / 2;
    
    const place = (player: PlayerBubble, x: number, y: number) => {
      player.x = x;
      player.y = y;
      player.vx = 0;
      player.vy = 0;
      player.hasBall = false;
      resetPlayerAI(player);
    };

    // Reset all players to home positions first
    [...state.homePlayers, ...state.awayPlayers].forEach((player) => {
      place(player, player.homeX, player.homeY);
    });

    // ATTACKING TEAM (CORNER TAKER): Position CLOSE in penalty box (first line to score)
    const attackers = activeTeamPlayers(state, team)
      .filter((p) => p.id !== taker.id && p.role !== "GK")
      .sort((a, b) => b.player.strength - a.player.strength || b.player.shooting - a.player.shooting);
    
    attackers.forEach((player, index) => {
      // Position close to goal in penalty box formation
      const boxY = [centerY - 70, centerY - 28, centerY + 28, centerY + 70, centerY - 108, centerY + 108];
      const xDist = index < 3 ? 50 : 100; // Closer for strikers, wider for support
      place(player, oppGoalX - direction * xDist, clamp(boxY[index % boxY.length], MARGIN + 45, MARGIN + PITCH_HEIGHT - 45));
    });

    // DEFENDING TEAM: Position FAR (back line to defend)
    const defendingTeam: TeamSide = team === "home" ? "away" : "home";
    const keeper = activeTeamPlayers(state, defendingTeam).find((p) => p.role === "GK");
    if (keeper) {
      place(keeper, oppGoalX + direction * 30, centerY);
    }

    // Defenders in back line (further from ball)
    const defenders = activeTeamPlayers(state, defendingTeam).filter((p) => p.role === "DEF").sort((a, b) => a.homeY - b.homeY);
    defenders.forEach((player, index) => {
      const backY = [centerY - 88, centerY - 42, centerY, centerY + 42, centerY + 88];
      place(player, oppGoalX + direction * 120, clamp(backY[index % backY.length], MARGIN + 35, MARGIN + PITCH_HEIGHT - 35));
    });

    // Defending midfielders further back
    const clearingMids = activeTeamPlayers(state, defendingTeam).filter((p) => p.role === "MID").sort((a, b) => a.homeY - b.homeY);
    clearingMids.forEach((player, index) => {
      const edgeY = [centerY - 95, centerY, centerY + 95, centerY - 48, centerY + 48];
      place(player, oppGoalX + direction * 180, clamp(edgeY[index % edgeY.length], MARGIN + 45, MARGIN + PITCH_HEIGHT - 45));
    });

    // Corner taker at corner flag
    place(taker, team === "home" ? RIGHT_GOAL_X - 12 : LEFT_GOAL_X + 12, cornerY);
    setBallToPlayer(state, taker);
    // Freeze play for ~2.5s so everyone settles into the box before the corner
    // is taken (mirrors the goal-kick restart pause).
    const cornerDelay = 2500;
    state.restartPauseUntil = state.timePassed + cornerDelay;
    state.ballHeldUntil = state.restartPauseUntil + 400;
    state.nextDecisionAt = state.restartPauseUntil + 250;
    // Sliding caption announcing the corner (same style as goals / penalties).
    state.slideFlash = {
      text: `CORNER KICK - ${team === "home" ? homeTeam.shortCode : awayTeam.shortCode}`,
      color: "#4fc3f7",
      until: state.timePassed + 2200,
      duration: 2200,
    };
  };

  const resolveTouches = (state: GameState) => {
    if (state.ball.holderId) return;
    // A penalty shot's outcome is pre-decided; don't let anyone intercept it
    // in flight. updateBall handles the goal / save / miss resolution.
    if (state.ball.mode === "penalty") return;
    // A ball flying above head height cannot be controlled by players on the
    // ground, which lets lofted passes sail over the keeper and defenders.
    if (state.ball.z > 16) return;

    const allPlayers = [...state.homePlayers, ...state.awayPlayers].filter((player) => !player.redCard);
    const nearest = allPlayers.reduce(
      (best, player) => {
        const d = distance(player.x, player.y, state.ball.x, state.ball.y);
        return d < best.distance ? { player, distance: d } : best;
      },
      { player: allPlayers[0], distance: Number.POSITIVE_INFINITY }
    );

    if (nearest.distance < PLAYER_RADIUS + BALL_RADIUS + 8) {
      if (state.ball.mode === "shot") {
        if (nearest.player.role !== "GK") {
          return;
        }
        if (nearest.distance > PLAYER_RADIUS + BALL_RADIUS + 3) {
          return;
        }
      }
      if (
        nearest.player.role === "GK" &&
        state.ball.mode === "shot"
      ) {
        const keeper = nearest.player;
        const saveChance =
          0.20 +
          keeper.player.overall / 130;
        if (Math.random() < saveChance) {
          if (Math.random() < 0.65) {
            setBallToPlayer(state, keeper);
          } else {
            state.ball.mode = "loose";
            state.ball.holderId = null;
            state.ball.vx *= -0.6;
            state.ball.vy *= 0.8;
            state.ball.lastTouchId = keeper.id;
          }
        }
      } else {
        setBallToPlayer(state, nearest.player);
      }
      state.nextDecisionAt = state.timePassed + 360 + Math.random() * 620;
    }
  };

  const makeDecision = (state: GameState) => {
    const holder = findPlayer(state, state.ball.holderId);
    const forceDecision =
      state.timePassed >= state.ballHeldUntil &&
      state.ball.mode === "held";
    if (
      !holder ||
      holder.redCard ||
      state.penalty
    ) return;
    if (
      !forceDecision &&
      state.timePassed < state.nextDecisionAt
    ) return;
    const goal = goalCenterFor(holder.team);
    const goalDistance = distance(
      holder.x,
      holder.y,
      goal.x,
      goal.y
    );
    const nearestOpponent = Math.min(
      ...opposingPlayers(state, holder.team)
        .filter((p) => !p.redCard)
        .map((p) =>
          distance(
            p.x,
            p.y,
            holder.x,
            holder.y
          )
        )
    );
    const passTarget = choosePassTarget(state, holder);
    const throughBall = chooseThroughBall(state, holder);
    const scorerPass = chooseGoalScorerPass(state, holder);
    const cross = shouldCross(holder);
    const attackRoll = Math.random();
    const teamStrength = holder.player.overall;
    let attackStyle = Math.random();
    if (teamStrength > 88) {
      attackStyle = Math.min(1, attackStyle + 0.28);
    } else {
      attackStyle = Math.max(0, attackStyle - 0.12);
    }
    const directFootball = attackStyle < 0.33;

    // Chip over an advanced keeper to a teammate with a clear sight of goal.
    if (goalDistance < 200) {
      const lobMate = chooseLobOverKeeper(state, holder);
      if (lobMate && Math.random() < 0.5) {
        preparePass(state, holder, lobMate, true);
        return;
      }
    }

    //-------------------------------------------------
    // INSIDE / NEAR THE BOX — shoot first, otherwise feed an open scorer.
    //-------------------------------------------------
    if (goalDistance < 130) {
      // Strong urge to shoot when this close to goal.
      const shootChance = holder.role === "FWD" ? 0.9 : 0.78;
      if (attackRoll < shootChance) {
        prepareShot(state, holder);
        return;
      }
      // Not shooting: square it to a teammate in a better scoring spot.
      if (scorerPass) {
        preparePass(state, holder, scorerPass);
        return;
      }
      if (passTarget) {
        preparePass(state, holder, passTarget);
        return;
      }
      prepareShot(state, holder);
      return;
    }

    // If a teammate is clearly through on goal and open, find them.
    if (goalDistance < 360 && scorerPass && attackRoll < 0.6) {
      preparePass(state, holder, scorerPass);
      return;
    }

    // Forward route blocked by a defender: turn out and play it to an open
    // teammate (sideways or back) rather than running into trouble.
    const forwardBlocked = opposingPlayers(state, holder.team)
      .filter((p) => !p.redCard)
      .some((op) => {
        const ahead = (op.x - holder.x) * (holder.team === "home" ? 1 : -1);
        return ahead > 0 && ahead < 85 && Math.abs(op.y - holder.y) < 46;
      });
    if (forwardBlocked && passTarget && attackRoll < 0.82) {
      preparePass(state, holder, chooseEscapePassTarget(state, holder) || passTarget);
      return;
    }

    // Cutback: square to midfield runners when near by
    if (goalDistance < CUTBACK_DISTANCE && Math.random() < 0.2) {
      const mids = activeTeamPlayers(state, holder.team).filter((p) => p.role === "MID");
      if (mids.length) {
        preparePass(state, holder, mids[Math.floor(Math.random() * mids.length)]);
        return;
      }
    }
    //-------------------------------------------------
    // LONG SHOT FROM MIDFIELD
    if (holder.role === "MID" && goalDistance < 320 && Math.random() < 0.16) {
      prepareShot(state, holder);
      return;
    }

    //-------------------------------------------------
    // EDGE OF BOX
    //-------------------------------------------------
    if (goalDistance < 210) {
      if (
        holder.role === "FWD" &&
        attackRoll < 0.72
      ) {
        prepareShot(state, holder);
        return;
      }
      if (
        holder.role === "MID" &&
        attackRoll < 0.42
      ) {
        prepareShot(state, holder);
        return;
      }
      if (scorerPass) {
        preparePass(state, holder, scorerPass);
        return;
      }
      if (
        passTarget &&
        attackRoll < 0.75
      ) {
        if (directFootball && throughBall) {
          preparePass(state, holder, throughBall);
        } else {
          preparePass(state, holder, passTarget);
        }
        return;
      }
      startDribble(state, holder);
      return;
    }
    //-------------------------------------------------
    // CROSS
    //-------------------------------------------------
    if (
      cross &&
      attackRoll < 0.55
    ) {
      const forwards =
        activeTeamPlayers(
          state,
          holder.team
        ).filter(
          (p) => p.role === "FWD"
        );
      if (forwards.length) {
        preparePass(
          state,
          holder,
          forwards[
            Math.floor(
              Math.random() *
              forwards.length
            )
          ]
        );
        return;
      }
    }
    //-------------------------------------------------
    // THROUGH BALL
    //-------------------------------------------------
    if (
      throughBall &&
      attackRoll < 0.18
    ) {
      preparePass(
        state,
        holder,
        throughBall
      );
      return;
    }
    //-------------------------------------------------
    // UNDER PRESSURE
    //-------------------------------------------------
    if (
      nearestOpponent < 55
    ) {
      if (
        passTarget &&
        attackRoll < 0.75
      ) {
        if (directFootball && throughBall) {
          preparePass(state, holder, throughBall);
        } else {
          preparePass(state, holder, passTarget);
        }
      } else {
        startDribble(
          state,
          holder
        );
      }
      return;
    }
    //-------------------------------------------------
    // MIDFIELD BUILDUP
    //-------------------------------------------------
    if (
      holder.role === "MID"
    ) {
      if (
        passTarget &&
        attackRoll < 0.70
      ) {
        if (directFootball && throughBall) {
          preparePass(state, holder, throughBall);
        } else {
          preparePass(state, holder, passTarget);
        }
      } else {
        startDribble(
          state,
          holder
        );
      }
      return;
    }
    //-------------------------------------------------
    // DEFENDERS
    //-------------------------------------------------
    if (
      holder.role === "DEF"
    ) {
      if (passTarget) {
        if (directFootball && throughBall) {
          preparePass(state, holder, throughBall);
        } else {
          preparePass(state, holder, passTarget);
        }
        return;
      }
    }
    //-------------------------------------------------
    // FORWARDS
    //-------------------------------------------------
    if (
      holder.role === "FWD"
    ) {
      if (
        attackRoll < 0.56
      ) {
        startDribble(
          state,
          holder
        );
      } else if (
        passTarget
      ) {
        if (directFootball && throughBall) {
          preparePass(state, holder, throughBall);
        } else {
          preparePass(state, holder, passTarget);
        }
      }
      return;
    }
    //-------------------------------------------------
    if (passTarget) {
      if (directFootball && throughBall) {
        preparePass(state, holder, throughBall);
      } else {
        preparePass(state, holder, passTarget);
      }
    } else {
      startDribble(
        state,
        holder
      );
    }
  };

  const recordGoal = (state: GameState, scoringTeam: TeamSide, restart = true, isPenalty = false) => {
    const scorer = findPlayer(state, state.ball.lastTouchId) || teamPlayers(state, scoringTeam)[0];
    if (scoringTeam === "home") {
      state.homeScore += 1;
      state.homeShotsOnTarget += 1;
    } else {
      state.awayScore += 1;
      state.awayShotsOnTarget += 1;
    }

    const teamName = scoringTeam === "home" ? homeTeam.shortCode : awayTeam.shortCode;
    state.goals.push({
      minute: Math.max(1, Math.floor((state.timePassed / MATCH_DURATION) * 90)),
      team: scoringTeam,
      player: scorer.player.name,
    });
    
    // Sliding text effect (like shootout)
    state.slideFlash = {
      text: `GOAL ${teamName} - ${scorer.player.name}`,
      color: scoringTeam === "home" ? homeTeam.primaryColor : awayTeam.primaryColor,
      until: state.timePassed + 2400,
      duration: 2400,
    };
    
    // Log goal to commentary system
    const scoreLine = `${state.homeScore} - ${state.awayScore}`;
    logGoal(scorer.player.name, teamName, scoreLine);
    
    // Play goal sound immediately (no latency)
    const audioManager = getAudioManager();
    if (isPenalty) {
      // Penalty goal
      audioManager.playPenaltyGoalSound();
    } else {
      // Regular match goal
      const goalNumber = state.goals.length % 2 === 0 ? 2 : 1;
      audioManager.playGoalSound(goalNumber as 1 | 2);
    }
    
    state.recentPasses = [];
    state.dribbleUntil = 0;
    if (restart) {
      resetAfterGoal(state, scoringTeam === "home" ? "away" : "home");
    }
  };

  const refreshMatchState = () => {
    setMatchState({ ...gameStateRef.current });
  };

  const issueCardToHolder = (card: "yellow" | "red") => {
    const state = gameStateRef.current;
    const holder = findPlayer(state, state.ball.holderId);
    if (!holder || state.matchEnded) return;

    if (card === "yellow") {
      holder.yellowCards += 1;
      if (holder.yellowCards >= 2) {
        holder.redCard = true;
      }
    } else {
      holder.redCard = true;
    }

    state.slideFlash = {
      text: `${card === "yellow" ? "YELLOW" : "RED"} CARD - ${holder.player.name}`,
      color: card === "yellow" ? "#ffd54f" : "#ff5252",
      until: state.timePassed + 2400,
      duration: 2400,
    };

    if (holder.redCard) {
      holder.hasBall = false;
      state.ball.holderId = null;
      state.ball.targetId = null;
      state.ball.mode = "loose";
      state.ball.vx = holder.team === "home" ? -3 : 3;
      state.ball.vy = 0;
      state.nextDecisionAt = state.timePassed + 900;
    }

    refreshMatchState();
  };

  // Manual "PASS" control: the current ball carrier plays an aerial ball to the
  // best teammate. Preference goes to a team-mate ahead of the carrier (toward
  // the opponent goal); if nobody is ahead (e.g. striker pinned on the goal
  // line) the ball is lofted back to the nearest team-mate behind instead.
  const passToNearestTeammate = () => {
    const state = gameStateRef.current;
    if (state.matchEnded || state.penalty || state.shootout?.active) return;
    const holder = findPlayer(state, state.ball.holderId);
    if (!holder || holder.redCard) return;

    const direction = holder.team === "home" ? 1 : -1;
    const nearestOf = (list: PlayerBubble[]) =>
      list.reduce((best, p) =>
        distance(holder.x, holder.y, p.x, p.y) < distance(holder.x, holder.y, best.x, best.y)
          ? p
          : best
      );

    // 1) Scan the circular radar around the carrier for team-mates.
    const inRadar = teammatesInRadar(state, holder);

    let target: PlayerBubble | null = null;
    if (inRadar.length) {
      // Prefer a team-mate ahead (toward the opponent goal); otherwise the
      // nearest one behind so a pinned striker can still lay it off.
      const ahead = inRadar.filter((p) => (p.x - holder.x) * direction > 15);
      target = ahead.length ? nearestOf(ahead) : nearestOf(inRadar);
    } else {
      // 2) Radar empty: fall back to the nearest team-mate anywhere on the
      // pitch so the pass button always does something useful.
      const allMates = activeTeamPlayers(state, holder.team).filter(
        (p) => p.id !== holder.id && p.role !== "GK"
      );
      if (allMates.length) target = nearestOf(allMates);
    }

    state.goalLineEscape = null;

    if (target) {
      startPass(state, holder, target, true); // always aerial
    } else {
      // 3) No team-mate at all (extreme edge case): loft the ball into space
      // ahead so possession is at least contested rather than frozen.
      const clearX = clamp(holder.x + direction * 220, MARGIN + 40, MARGIN + PITCH_WIDTH - 40);
      const clearY = clamp(holder.y + (Math.random() - 0.5) * 160, MARGIN + 40, MARGIN + PITCH_HEIGHT - 40);
      startAerialClearance(state, holder, clearX, clearY);
    }
    refreshMatchState();
  };

  // Manual "KICK GOAL" control: the current carrier immediately shoots at goal,
  // no matter where they are. The outcome is left to the normal shot/keeper
  // physics -- it just guarantees the striker actually pulls the trigger.
  const kickAtGoal = () => {
    const state = gameStateRef.current;
    if (state.matchEnded || state.penalty || state.shootout?.active) return;
    const holder = findPlayer(state, state.ball.holderId);
    if (!holder || holder.redCard) return;

    state.goalLineEscape = null;
    startShot(state, holder);
    refreshMatchState();
  };

  const awardPenalty = (team?: TeamSide, mode?: "auto" | "manual") => {
    const state = gameStateRef.current;
    if (state.matchEnded || state.shootout?.active) return;

    const holder = findPlayer(state, state.ball.holderId);
    const penaltyTeam = team || holder?.team || state.possession;
    const shooter =
      holder && holder.team === penaltyTeam && !holder.redCard
        ? holder
        : [...activeTeamPlayers(state, penaltyTeam)].sort((a, b) => b.player.shooting - a.player.shooting)[0];

    if (!shooter) return;

    const opponentTeam = penaltyTeam === "home" ? "away" : "home";
    const keeper = activeTeamPlayers(state, opponentTeam).find((player) => player.role === "GK") ||
      activeTeamPlayers(state, opponentTeam)[0];

    state.penalty = {
      team: penaltyTeam,
      shooterId: shooter.id,
      awaitingDecision: true,
      mode: mode || "auto",
      outcome: null,
      startedAt: state.timePassed,
      // Auto kicks fire after a 3s build-up; manual waits for the user's
      // goal / no-goal choice before starting its own 3s countdown.
      shootAt: (mode || "auto") === "auto" ? state.timePassed + 3000 : null,
      chosenOutcome: null,
    };
    // Only a short "PENALTY KICK - COUNTRY" announcement is shown; no internal status.
    const countryName = penaltyTeam === "home" ? homeTeam.name : awayTeam.name;
    state.penaltyBanner = {
      text: `PENALTY KICK - ${countryName}`,
      until: state.timePassed + 2600,
    };
    // Broadcast-style sliding caption shown over the penalty view.
    state.slideFlash = {
      text: `PENALTY - ${penaltyTeam === "home" ? homeTeam.shortCode : awayTeam.shortCode}`,
      color: "#ff5252",
      until: state.timePassed + 2600,
      duration: 2600,
    };
    state.goalFlash = null;

    // Penalty geometry: ball on the spot, striker behind it, keeper on the line.
    const isHome = penaltyTeam === "home";
    const penSpotX = isHome ? RIGHT_GOAL_X - 132 : LEFT_GOAL_X + 132;
    const centerY = MARGIN + PITCH_HEIGHT / 2;
    const gkX = isHome ? RIGHT_GOAL_X - 14 : LEFT_GOAL_X + 14;

    [...state.homePlayers, ...state.awayPlayers].forEach((player) => {
      if (player.id === shooter.id || player.id === keeper?.id) return;
      player.x = player.homeX;
      player.y = player.homeY;
      player.vx = 0;
      player.vy = 0;
      player.hasBall = false;
    });

    if (keeper) {
      keeper.x = gkX;
      keeper.y = centerY;
      keeper.vx = 0;
      keeper.vy = 0;
      keeper.hasBall = false;
    }

    // Striker starts well back from the spot and runs up during the build-up.
    shooter.x = isHome ? penSpotX - 90 : penSpotX + 90;
    shooter.y = centerY;
    shooter.vx = 0;
    shooter.vy = 0;
    shooter.hasBall = false;

    // Ball sits on the penalty spot (not carried) until the shot is taken.
    state.ball.holderId = null;
    state.ball.targetId = null;
    state.ball.lastTouchId = shooter.id;
    state.ball.mode = "held";
    state.ball.x = penSpotX;
    state.ball.y = centerY;
    state.ball.vx = 0;
    state.ball.vy = 0;
    state.ball.curl = 0;
    state.ball.spin = 0;
    state.ball.z = 0;
    state.ball.vz = 0;
    refreshMatchState();
  };

  const resolvePenalty = (isGoal: boolean) => {
    const state = gameStateRef.current;
    if (!state.penalty) return;

    const shooter = findPlayer(state, state.penalty.shooterId);
    const penaltyTeam = state.penalty.team;
    const opponent = penaltyTeam === "home" ? "away" : "home";
    const keeper = activeTeamPlayers(state, opponent).find((player) => player.role === "GK") || activeTeamPlayers(state, opponent)[0];

    if (!shooter) return;

    state.penalty.awaitingDecision = false;
    state.penalty.outcome = isGoal;
    state.penalty.startedAt = state.timePassed;

    const isHome = penaltyTeam === "home";
    const penSpotX = isHome ? RIGHT_GOAL_X - 132 : LEFT_GOAL_X + 132;
    const centerY = MARGIN + PITCH_HEIGHT / 2;

    if (keeper) {
      // Keeper stays on the line and dives; a save dives toward the ball, a
      // goal dives the wrong way for a realistic beaten-keeper look.
      keeper.x = isHome ? RIGHT_GOAL_X - 14 : LEFT_GOAL_X + 14;
      keeper.y = centerY + (isGoal ? (Math.random() < 0.5 ? -1 : 1) * 70 : (Math.random() - 0.5) * 30);
      keeper.vx = 0;
      keeper.vy = 0;
      keeper.hasBall = false;
    }

    // Striker stands just behind the ball on the spot.
    shooter.x = isHome ? penSpotX - 30 : penSpotX + 30;
    shooter.y = centerY;
    shooter.vx = 0;
    shooter.vy = 0;

    state.ball.x = penSpotX;
    state.ball.y = centerY;
    state.ball.lastTouchId = shooter.id;
    state.ball.holderId = null;
    state.ball.targetId = null;
    state.ball.mode = "penalty";
    startPenaltyShot(state, shooter, isGoal);

    if (!state.shootout?.active) {
      if (penaltyTeam === "home") state.homeShots += 1;
      else state.awayShots += 1;
    }

    refreshMatchState();
  };

  const chooseManualPenalty = (isGoal: boolean) => {
    const state = gameStateRef.current;
    if (
      !state.penalty ||
      state.shootout?.active ||
      state.penalty.mode !== "manual" ||
      !state.penalty.awaitingDecision ||
      state.penalty.chosenOutcome !== null
    ) {
      return;
    }
    // Lock in the chosen result and start the 3s run-up before the shot fires.
    state.penalty.chosenOutcome = isGoal;
    state.penalty.shootAt = state.timePassed + 3000;
    refreshMatchState();
  };

  // Kick off the match once the user is ready; the shootout option is locked in
  // at this point.
  const startMatch = () => {
    const state = gameStateRef.current;
    state.shootoutEnabled = shootoutOptIn;
    state.started = true;
    state.intro = { active: true, phase: "card", phaseTimeMs: 0 };
    state.timePassed = 0;
    lastTimeRef.current = 0;
    
    // Initialize commentary for this match
    if (!getCurrentMatchId()) {
      const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      initializeCommentary(matchId, 
        { name: homeTeam.name, flag: homeTeam.flag },
        { name: awayTeam.name, flag: awayTeam.flag }
      );
    }
    
    // Initialize background crowd audio
    const audioManager = getAudioManager();
    audioManager.initializeBackground(0); // Start from beginning
    
    refreshMatchState();
  };

  // Add (or remove) manual stoppage time. 90 display-minutes map to the match
  // duration, so each minute is that fraction of the clock.
  const addStoppageTime = (minutes: number) => {
    const state = gameStateRef.current;
    if (state.matchEnded) return;
    state.addedTimeMs = Math.max(0, state.addedTimeMs + minutes * (MATCH_DURATION / 90));
    refreshMatchState();
  };

  // ---- Penalty shootout -------------------------------------------------
  const startShootout = (state: GameState) => {
    state.shootout = {
      active: true,
      phase: "announce",
      phaseUntil: state.timePassed + 3200,
      homeKickers: pickShootoutKickers(state, "home"),
      awayKickers: pickShootoutKickers(state, "away"),
      homeResults: [],
      awayResults: [],
      homeScore: 0,
      awayScore: 0,
      current: "home",
      round: 0,
      resultFlash: null,
      winner: null,
    };
    state.penalty = null;
    state.goalFlash = null;
    state.penaltyBanner = null;
    [...state.homePlayers, ...state.awayPlayers].forEach((p) => {
      p.x = p.homeX;
      p.y = p.homeY;
      p.vx = 0;
      p.vy = 0;
      p.hasBall = false;
    });
    state.ball.holderId = null;
    state.ball.targetId = null;
    state.ball.mode = "loose";
    state.ball.x = MARGIN + PITCH_WIDTH / 2;
    state.ball.y = MARGIN + PITCH_HEIGHT / 2;
    state.ball.vx = 0;
    state.ball.vy = 0;
    state.ball.z = 0;
    state.ball.vz = 0;
  };

  // Sets up the next kick: positions the taker, keeper and ball, then arms a
  // penalty (reusing the normal penalty object + zoomed view).
  const setupShootoutKick = (state: GameState) => {
    const so = state.shootout;
    if (!so) return;
    const team = so.current;
    const idx = team === "home" ? so.homeResults.length : so.awayResults.length;
    const kickers = team === "home" ? so.homeKickers : so.awayKickers;
    const shooterId = kickers[idx % Math.max(1, kickers.length)];
    const shooter = findPlayer(state, shooterId) || activeTeamPlayers(state, team)[0];
    if (!shooter) return;
    const opponentTeam: TeamSide = team === "home" ? "away" : "home";
    const keeper =
      activeTeamPlayers(state, opponentTeam).find((p) => p.role === "GK") ||
      activeTeamPlayers(state, opponentTeam)[0];
    const isHome = team === "home";
    const penSpotX = isHome ? RIGHT_GOAL_X - 132 : LEFT_GOAL_X + 132;
    const centerY = MARGIN + PITCH_HEIGHT / 2;
    const gkX = isHome ? RIGHT_GOAL_X - 14 : LEFT_GOAL_X + 14;

    [...state.homePlayers, ...state.awayPlayers].forEach((p) => {
      p.x = p.homeX;
      p.y = p.homeY;
      p.vx = 0;
      p.vy = 0;
      p.hasBall = false;
    });
    if (keeper) {
      keeper.x = gkX;
      keeper.y = centerY;
      keeper.vx = 0;
      keeper.vy = 0;
      keeper.hasBall = false;
    }
    shooter.x = isHome ? penSpotX - 90 : penSpotX + 90;
    shooter.y = centerY;
    shooter.vx = 0;
    shooter.vy = 0;
    shooter.hasBall = false;

    state.ball.holderId = null;
    state.ball.targetId = null;
    state.ball.lastTouchId = shooter.id;
    state.ball.mode = "held";
    state.ball.x = penSpotX;
    state.ball.y = centerY;
    state.ball.vx = 0;
    state.ball.vy = 0;
    state.ball.curl = 0;
    state.ball.spin = 0;
    state.ball.z = 0;
    state.ball.vz = 0;

    state.penalty = {
      team,
      shooterId: shooter.id,
      awaitingDecision: true,
      mode: "manual",
      outcome: null,
      startedAt: state.timePassed,
      shootAt: null,
      chosenOutcome: null,
    };
    so.phaseUntil = 0;
  };

  // Records a kick result and advances the shootout (next taker, or finish).
  const resolveShootoutKick = (isGoal: boolean) => {
    const state = gameStateRef.current;
    const so = state.shootout;
    if (!so || !so.active) return;
    if (so.current === "home") {
      so.homeResults.push(isGoal);
      if (isGoal) so.homeScore += 1;
    } else {
      so.awayResults.push(isGoal);
      if (isGoal) so.awayScore += 1;
    }
    // Sliding result banner shown for a couple of seconds before the next taker.
    so.resultFlash = {
      text: isGoal ? "GOAL!" : "NO GOAL",
      goal: isGoal,
      until: state.timePassed + SHOOTOUT_RESULT_MS,
    };
    // Play shootout goal/miss sound
    if (isGoal) {
      const audioManager = getAudioManager();
      audioManager.playShootoutGoalSound();
    }
    state.penalty = null;
    state.ball.mode = "loose";
    state.ball.vx = 0;
    state.ball.vy = 0;
    state.ball.vz = 0;

    const winner = computeShootoutWinner(so);
    if (winner) {
      so.winner = winner;
      so.phase = "done";
      so.phaseUntil = state.timePassed + SHOOTOUT_RESULT_MS + 2000;
    } else {
      if (so.current === "home") {
        so.current = "away";
      } else {
        so.current = "home";
        so.round += 1;
      }
      so.phase = "kick";
      // Wait out the sliding result text before arming the next taker.
      so.phaseUntil = state.timePassed + SHOOTOUT_RESULT_MS;
    }
  };

  // User decision for the current shootout kick: auto (by skill), score or miss.
  const decideShootoutKick = (choice: "auto" | "goal" | "miss") => {
    const state = gameStateRef.current;
    const so = state.shootout;
    const pen = state.penalty;
    if (!so?.active || !pen || !pen.awaitingDecision || pen.chosenOutcome !== null) return;
    let isGoal: boolean;
    if (choice === "auto") {
      const rating = findPlayer(state, pen.shooterId)?.player.shooting ?? 75;
      isGoal = Math.random() < clamp(0.55 + (rating / 100) * 0.4, 0.55, 0.95);
    } else {
      isGoal = choice === "goal";
    }
    pen.chosenOutcome = isGoal;
    pen.shootAt = state.timePassed + 2200;
    refreshMatchState();
  };

  const updateGameState = (deltaMs: number) => {
    const state = gameStateRef.current;
    if (state.matchEnded) return;
    // The match is frozen until the user presses Start.
    if (!state.started) return;

    if (state.intro?.active) {
      state.intro.phaseTimeMs += deltaMs;
      const duration = state.intro.phase === "card" ? INTRO_CARD_MS : INTRO_SQUAD_MS;
      if (state.intro.phaseTimeMs >= duration) {
        if (state.intro.phase === "card") {
          state.intro.phase = "home";
          state.intro.phaseTimeMs = 0;
        } else if (state.intro.phase === "home") {
          state.intro.phase = "away";
          state.intro.phaseTimeMs = 0;
        } else {
          state.intro = null;
        }
      }
      return;
    }

    // Keep one clock moving for restart and shootout phase timers. Possession
    // stats only accrue during normal play. Advance the clock slightly faster
    // than real-time to make the match feel snappier.
    const prevTime = state.timePassed;
    state.timePassed += deltaMs * CLOCK_SPEED;

    // HALF-TIME: when the match clock crosses the halfway mark, freeze play and
    // show a "HALF TIME" banner, then flip which end each team is rendered at
    // (a purely visual swap) and restart from the centre spot for the 2nd half.
    // The simulation itself is untouched -- home still attacks "right"
    // internally -- so none of the AI / goal / penalty logic can be thrown off.
    const halfMark = MATCH_DURATION / 2;
    if (
      !state.halfTimeTriggered &&
      prevTime < halfMark &&
      state.timePassed >= halfMark &&
      !state.penalty &&
      !state.shootout
    ) {
      state.halfTimeTriggered = true;
      state.slideFlash = {
        text: "HALF TIME",
        color: "#ffd54f",
        until: state.timePassed + 3200,
        duration: 3200,
      };
      // Freeze all movement during the interval.
      [...state.homePlayers, ...state.awayPlayers].forEach((p) => {
        p.vx = 0;
        p.vy = 0;
        p.hasBall = false;
      });
      state.ball.mode = "loose";
      state.ball.vx = 0;
      state.ball.vy = 0;
      state.restartPauseUntil = state.timePassed + 3600;
      state.nextDecisionAt = state.restartPauseUntil + 300;
      // Apply the visual switch + second-half kickoff midway through the pause.
      state.halfTimeSwitchAt = state.timePassed + 1600;
    }

    if (state.halfTimeSwitchAt !== null && state.timePassed >= state.halfTimeSwitchAt) {
      state.halfTimeSwitchAt = null;
      state.secondHalf = true;
      // The side that did not kick off the first half restarts the second.
      resetAfterGoal(state, "away");
    }

    if (!state.shootout) {
      if (state.possession === "home") state.homePossessionTicks += 1;
      else state.awayPossessionTicks += 1;
    }

    // Penalty shootout takes over the whole flow once a drawn match goes to it.
    if (state.shootout?.active) {
      const so = state.shootout;
      if (so.resultFlash && state.timePassed > so.resultFlash.until) so.resultFlash = null;
      // While a kick is live (penalty armed) fall through to the penalty
      // handling below; otherwise run the announce / line-up / gap / done timers.
      if (!(so.phase === "kick" && state.penalty)) {
        [...state.homePlayers, ...state.awayPlayers].forEach((p) => {
          p.vx = 0;
          p.vy = 0;
        });
        if (so.phase === "announce") {
          if (state.timePassed >= so.phaseUntil) {
            so.phase = "lineup";
            so.phaseUntil = state.timePassed + 3200;
          }
          return;
        }
        if (so.phase === "lineup") {
          if (state.timePassed >= so.phaseUntil) {
            so.phase = "kick";
            setupShootoutKick(state);
          }
          return;
        }
        if (so.phase === "kick") {
          // Between kicks: hold while the sliding result text plays, then arm
          // the next taker so the goal / no-goal slide is fully shown.
          if (so.phaseUntil && state.timePassed < so.phaseUntil) {
            updateBall(state);
            return;
          }
          setupShootoutKick(state);
          return;
        }
        if (so.phase === "done") {
          if (state.timePassed >= so.phaseUntil) state.matchEnded = true;
          return;
        }
      }
    }

    if (state.penalty?.awaitingDecision) {
      const isHome = state.penalty.team === "home";
      const penSpotX = isHome ? RIGHT_GOAL_X - 132 : LEFT_GOAL_X + 132;
      const centerY = MARGIN + PITCH_HEIGHT / 2;
      const shooter = findPlayer(state, state.penalty.shooterId);
      if (shooter) {
        // Striker jogs up to a spot just behind the ball, ready to strike.
        const standX = isHome ? penSpotX - 30 : penSpotX + 30;
        shooter.x += (standX - shooter.x) * 0.12;
        shooter.y += (centerY - shooter.y) * 0.12;
        shooter.vx = 0;
        shooter.vy = 0;
        shooter.hasBall = false;
      }
      // Keep the ball pinned to the penalty spot until the kick is taken.
      state.ball.x = penSpotX;
      state.ball.y = centerY;
      state.ball.vx = 0;
      state.ball.vy = 0;

      if (state.penaltyBanner && state.timePassed > state.penaltyBanner.until) {
        state.penaltyBanner = null;
      }

      if (
        state.penalty.mode === "auto" &&
        state.penalty.shootAt !== null &&
        state.timePassed >= state.penalty.shootAt
      ) {
        // High-calibre takers convert far more often than weak ones.
        const shooterRating = findPlayer(state, state.penalty?.shooterId)?.player.shooting || 70;
        const scoringChance = clamp(0.3 + (shooterRating / 100) * 0.65, 0.3, 0.95);
        resolvePenalty(Math.random() < scoringChance);
      } else if (
        state.penalty.mode === "manual" &&
        state.penalty.shootAt !== null &&
        state.penalty.chosenOutcome !== null &&
        state.timePassed >= state.penalty.shootAt
      ) {
        // Fire the shot with the outcome the user selected 3s earlier.
        resolvePenalty(state.penalty.chosenOutcome);
      }
      return;
    }

    // Penalty kick in flight: keep everyone frozen and only move the ball so
    // the zoomed penalty view shows a clean strike toward goal.
    if (state.penalty && !state.penalty.awaitingDecision) {
      [...state.homePlayers, ...state.awayPlayers].forEach((player) => {
        player.vx = 0;
        player.vy = 0;
      });
      updateBall(state);
      return;
    }

    // Restart pause: after a goal or penalty the players are already reset to
    // their positions with the ball on the spot. Freeze play for a few seconds
    // (ball in the middle) before the match resumes, instead of kicking off
    // instantly.
    if (state.timePassed < state.restartPauseUntil) {
      // Hold the carrier still on the ball; allow other players to settle.
      [...state.homePlayers, ...state.awayPlayers].forEach((player) => {
        player.vx = 0;
        player.vy = 0;
      });
      updateBall(state);
      if (state.goalFlash && state.timePassed > state.goalFlash.until) {
        state.goalFlash = null;
      }
      return;
    }

    updatePlayers(state);
    separatePlayers(state);
    updateBall(state);
    if (handleGoalLineEscape(state)) return;
    resolveTouches(state);
    makeDecision(state);

    if (state.goalFlash && state.timePassed > state.goalFlash.until) {
      state.goalFlash = null;
    }
    if (state.penaltyBanner && state.timePassed > state.penaltyBanner.until) {
      state.penaltyBanner = null;
    }

    // Full time (including any manually added stoppage time).
    const fullTime = MATCH_DURATION + state.addedTimeMs;
    if (state.timePassed >= fullTime && !state.shootout) {
      const drawn = state.homeScore === state.awayScore;
      if (drawn && state.shootoutEnabled) {
        // A level match with the shootout option enabled is settled on penalties.
        startShootout(state);
      } else {
        // A team in the lead simply wins — no shootout even if it was enabled.
        state.matchEnded = true;
      }
    }
  };

  const drawPitch = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "#0c1726";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = "#234f17";
    ctx.fillRect(MARGIN - GOAL_DEPTH, MARGIN, PITCH_WIDTH + GOAL_DEPTH * 2, PITCH_HEIGHT);

    for (let i = 0; i < 8; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? "#347224" : "#2d651f";
      ctx.fillRect(MARGIN + (PITCH_WIDTH / 8) * i, MARGIN, PITCH_WIDTH / 8, PITCH_HEIGHT);
    }

    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.lineWidth = 3;
    ctx.strokeRect(MARGIN, MARGIN, PITCH_WIDTH, PITCH_HEIGHT);

    ctx.beginPath();
    ctx.moveTo(MARGIN + PITCH_WIDTH / 2, MARGIN);
    ctx.lineTo(MARGIN + PITCH_WIDTH / 2, MARGIN + PITCH_HEIGHT);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(MARGIN + PITCH_WIDTH / 2, MARGIN + PITCH_HEIGHT / 2, 62, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(MARGIN + PITCH_WIDTH / 2, MARGIN + PITCH_HEIGHT / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();

    const penaltyWidth = 330;
    const penaltyHeight = 242;
    const boxY = MARGIN + (PITCH_HEIGHT - penaltyHeight) / 2;
    ctx.strokeRect(MARGIN, boxY, penaltyWidth, penaltyHeight);
    ctx.strokeRect(MARGIN + PITCH_WIDTH - penaltyWidth, boxY, penaltyWidth, penaltyHeight);

    const sixY = MARGIN + (PITCH_HEIGHT - 120) / 2;
    ctx.strokeRect(MARGIN, sixY, 92, 120);
    ctx.strokeRect(MARGIN + PITCH_WIDTH - 92, sixY, 92, 120);

    ctx.strokeStyle = "#dff5df";
    ctx.lineWidth = 4;
    ctx.strokeRect(MARGIN - GOAL_DEPTH, GOAL_TOP, GOAL_DEPTH, GOAL_HEIGHT);
    ctx.strokeRect(MARGIN + PITCH_WIDTH, GOAL_TOP, GOAL_DEPTH, GOAL_HEIGHT);

    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1;
    for (let y = GOAL_TOP + 16; y < GOAL_BOTTOM; y += 16) {
      ctx.beginPath();
      ctx.moveTo(MARGIN - GOAL_DEPTH, y);
      ctx.lineTo(MARGIN, y);
      ctx.moveTo(MARGIN + PITCH_WIDTH, y);
      ctx.lineTo(MARGIN + PITCH_WIDTH + GOAL_DEPTH, y);
      ctx.stroke();
    }
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, bubble: PlayerBubble, team: FootballTeam) => {
    const isHolding = bubble.hasBall;
    const fill = bubble.team === "home" ? team.primaryColor : team.primaryColor;
    const outline = bubble.team === "home" ? team.secondaryColor : team.accentColor || team.secondaryColor;

    // During the mirrored second half, labels/numbers must be counter-flipped
    // so text stays readable while the pitch itself is drawn reversed.
    const flipText = gameStateRef.current.secondHalf;
    const drawUpright = (render: () => void, cx: number, cy: number) => {
      if (!flipText) {
        render();
        return;
      }
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(-1, 1);
      ctx.translate(-cx, -cy);
      render();
      ctx.restore();
    };

    ctx.save();
    ctx.globalAlpha = bubble.redCard ? 0.38 : 1;

    const displayName = shortPlayerName(bubble.player.name);
    ctx.font = "800 11px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const nameWidth = Math.max(42, ctx.measureText(displayName).width + 12);
    ctx.fillStyle = "rgba(5,10,18,0.82)";
    ctx.beginPath();
    ctx.roundRect(bubble.x - nameWidth / 2, bubble.y - PLAYER_RADIUS - 26, nameWidth, 17, 5);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    drawUpright(
      () => ctx.fillText(displayName, bubble.x, bubble.y - PLAYER_RADIUS - 17),
      bubble.x,
      bubble.y - PLAYER_RADIUS - 17
    );

    ctx.shadowColor = isHolding ? "#fff176" : "rgba(0,0,0,0.35)";
    ctx.shadowBlur = isHolding ? 16 : 5;
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = isHolding ? 4 : 2.5;
    ctx.strokeStyle = outline || "#ffffff";
    ctx.stroke();

    // Facing indicator: a small arrow on the rim showing which way the player
    // is turned, so sideways and backward movement is clearly visible.
    ctx.shadowBlur = 0;
    const fa = bubble.facingAngle;
    const tipX = bubble.x + Math.cos(fa) * (PLAYER_RADIUS + 6);
    const tipY = bubble.y + Math.sin(fa) * (PLAYER_RADIUS + 6);
    const baseX = bubble.x + Math.cos(fa) * (PLAYER_RADIUS - 1);
    const baseY = bubble.y + Math.sin(fa) * (PLAYER_RADIUS - 1);
    const perp = fa + Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(baseX + Math.cos(perp) * 5, baseY + Math.sin(perp) * 5);
    ctx.lineTo(baseX - Math.cos(perp) * 5, baseY - Math.sin(perp) * 5);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, PLAYER_RADIUS - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(bubble.x - 4, bubble.y - PLAYER_RADIUS, 8, PLAYER_RADIUS * 2);
    ctx.fillStyle = outline || "#ffffff";
    ctx.globalAlpha = bubble.redCard ? 0.35 : 0.22;
    ctx.fillRect(bubble.x - PLAYER_RADIUS, bubble.y - PLAYER_RADIUS, 6, PLAYER_RADIUS * 2);
    ctx.fillRect(bubble.x + PLAYER_RADIUS - 6, bubble.y - PLAYER_RADIUS, 6, PLAYER_RADIUS * 2);
    ctx.restore();

    if (bubble.role === "GK") {
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#f5f7fb";
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 1.5;
      const gloveY = bubble.y - 2;
      ctx.beginPath();
      ctx.roundRect(bubble.x - PLAYER_RADIUS - 10, gloveY - 6, 8, 12, 3);
      ctx.roundRect(bubble.x + PLAYER_RADIUS + 2, gloveY - 6, 8, 12, 3);
      ctx.fill();
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = 3;
    ctx.font = "700 12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    drawUpright(
      () => {
        ctx.strokeText(String(bubble.player.jersey), bubble.x, bubble.y);
        ctx.fillText(String(bubble.player.jersey), bubble.x, bubble.y);
      },
      bubble.x,
      bubble.y
    );

    if (isHolding) {
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, PLAYER_RADIUS + 7, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,241,118,0.95)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (bubble.yellowCards > 0 || bubble.redCard) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = bubble.redCard ? "#f44336" : "#ffeb3b";
      ctx.fillRect(bubble.x + PLAYER_RADIUS - 2, bubble.y - PLAYER_RADIUS - 3, 8, 12);
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.lineWidth = 1;
      ctx.strokeRect(bubble.x + PLAYER_RADIUS - 2, bubble.y - PLAYER_RADIUS - 3, 8, 12);
    }
    ctx.restore();
  };

  const drawBall = (ctx: CanvasRenderingContext2D) => {
    const ball = gameStateRef.current.ball;
    drawBallWithShadow(ctx, ball.x, ball.y, ball.z, BALL_RADIUS, ball.rotation);
  };

  const drawHud = (ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    const addedMin = Math.round(state.addedTimeMs / (MATCH_DURATION / 90));
    // 90 mins of normal time plus any added minutes (e.g. +1 added => up to 95).
    const totalDisplayMin = 90 + addedMin;
    const playedSeconds = Math.floor(
      clamp(state.timePassed / (MATCH_DURATION + state.addedTimeMs), 0, 1) * totalDisplayMin * 60
    );
    const minute = Math.floor(playedSeconds / 60);
    const second = playedSeconds % 60;
    const totalTicks = state.homePossessionTicks + state.awayPossessionTicks || 1;
    const homePossession = Math.round((state.homePossessionTicks / totalTicks) * 100);
    const awayPossession = 100 - homePossession;

    ctx.fillStyle = "rgba(10,18,30,0.92)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);

    ctx.textBaseline = "middle";
    ctx.font = "800 26px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText(`${homeTeam.flag} ${homeTeam.shortCode}`, 24, 24);
    ctx.font = "700 13px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.76)";
    ctx.fillText(`${homePossession}% POS | ${state.homeShotsOnTarget}/${state.homeShots} SOT`, 24, 54);

    ctx.textAlign = "right";
    ctx.font = "800 26px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${awayTeam.shortCode} ${awayTeam.flag}`, CANVAS_WIDTH - 24, 24);
    ctx.font = "700 13px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.76)";
    ctx.fillText(`${awayPossession}% POS | ${state.awayShotsOnTarget}/${state.awayShots} SOT`, CANVAS_WIDTH - 24, 54);

    ctx.textAlign = "center";
    ctx.font = "900 34px Arial";
    ctx.fillStyle = "#f7f7f7";
    ctx.fillText(`${state.homeScore}  -  ${state.awayScore}`, CANVAS_WIDTH / 2, 25);
    ctx.font = "800 15px Arial";
    ctx.fillStyle = "#b9f6ca";
    ctx.fillText(`${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`, CANVAS_WIDTH / 2, 56);
    if (addedMin > 0) {
      ctx.font = "800 12px Arial";
      ctx.fillStyle = "#ffd54f";
      ctx.fillText(`+${addedMin}'`, CANVAS_WIDTH / 2, 70);
    }

    if (state.goalFlash && !state.penalty) {
      const flashY = PITCH_OFFSET_Y + MARGIN + PITCH_HEIGHT / 2;
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(CANVAS_WIDTH / 2 - 250, flashY - 45, 500, 90);
      ctx.strokeStyle = "#fff176";
      ctx.lineWidth = 3;
      ctx.strokeRect(CANVAS_WIDTH / 2 - 250, flashY - 45, 500, 90);
      ctx.fillStyle = "#fff176";
      ctx.font = "900 30px Arial";
      ctx.fillText(state.goalFlash.text, CANVAS_WIDTH / 2, flashY);
    }
  };

  const drawPenaltyView = (ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    const pen = state.penalty;
    if (!pen) return;
    const isHome = pen.team === "home";

    const penaltyWidth = 330;
    const penaltyHeight = 242;
    const boxY = MARGIN + (PITCH_HEIGHT - penaltyHeight) / 2;

    // Source rectangle (pitch coords) covering the attacking penalty box + goal.
    const srcLeft = isHome
      ? MARGIN + PITCH_WIDTH - penaltyWidth - 30
      : LEFT_GOAL_X - GOAL_DEPTH - 14;
    const srcRight = isHome
      ? RIGHT_GOAL_X + GOAL_DEPTH + 14
      : MARGIN + penaltyWidth + 30;
    const srcTop = boxY - 30;
    const srcBottom = boxY + penaltyHeight + 30;
    const srcW = srcRight - srcLeft;
    const srcH = srcBottom - srcTop;

    const viewTop = HUD_HEIGHT;
    const viewH = CANVAS_HEIGHT - HUD_HEIGHT;
    const scale = Math.min(CANVAS_WIDTH / srcW, viewH / srcH);
    const drawW = srcW * scale;
    const drawH = srcH * scale;
    const offsetX = (CANVAS_WIDTH - drawW) / 2;
    const offsetY = viewTop + (viewH - drawH) / 2;

    const mapX = (x: number) => offsetX + (x - srcLeft) * scale;
    const mapY = (y: number) => offsetY + (y - srcTop) * scale;

    // Grass with mowing stripes.
    for (let i = 0; i < 6; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? "#347224" : "#2d651f";
      ctx.fillRect(offsetX + (drawW / 6) * i, offsetY, drawW / 6 + 1, drawH);
    }

    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.lineWidth = 3;

    // Penalty box.
    const boxLeft = isHome ? MARGIN + PITCH_WIDTH - penaltyWidth : MARGIN;
    ctx.strokeRect(mapX(boxLeft), mapY(boxY), penaltyWidth * scale, penaltyHeight * scale);

    // 6-yard box.
    const sixY = MARGIN + (PITCH_HEIGHT - 120) / 2;
    const sixLeft = isHome ? MARGIN + PITCH_WIDTH - 92 : MARGIN;
    ctx.strokeRect(mapX(sixLeft), mapY(sixY), 92 * scale, 120 * scale);

    // Goal posts.
    const goalX = isHome ? RIGHT_GOAL_X : LEFT_GOAL_X - GOAL_DEPTH;
    ctx.strokeStyle = "#dff5df";
    ctx.lineWidth = 4;
    ctx.strokeRect(mapX(goalX), mapY(GOAL_TOP), GOAL_DEPTH * scale, GOAL_HEIGHT * scale);

    // Penalty spot.
    const spotX = isHome ? RIGHT_GOAL_X - 132 : LEFT_GOAL_X + 132;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(mapX(spotX), mapY(MARGIN + PITCH_HEIGHT / 2), 4, 0, Math.PI * 2);
    ctx.fill();

    const opponent: TeamSide = isHome ? "away" : "home";
    const keeper = activeTeamPlayers(state, opponent).find((p) => p.role === "GK") || null;
    const shooter = findPlayer(state, pen.shooterId);

    const drawPenPlayer = (p: PlayerBubble | null, team: FootballTeam, label: string) => {
      if (!p) return;
      const px = mapX(p.x);
      const py = mapY(p.y);
      const r = PLAYER_RADIUS * scale * 0.85;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = team.primaryColor;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = team.secondaryColor || "#fff";
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "800 14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, px, py);
    };
    drawPenPlayer(keeper, isHome ? awayTeam : homeTeam, "GK");
    drawPenPlayer(shooter, isHome ? homeTeam : awayTeam, String(shooter?.player.jersey ?? ""));

    // Ball (spinning soccer ball with height shadow).
    drawBallWithShadow(
      ctx,
      mapX(state.ball.x),
      mapY(state.ball.y),
      state.ball.z * scale,
      BALL_RADIUS * scale,
      state.ball.rotation
    );

    // Only a brief "PENALTY - TEAM" announcement banner is shown at the top.
    if (state.penaltyBanner) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(CANVAS_WIDTH / 2 - 150, viewTop + 8, 300, 34);
      ctx.strokeStyle = "#fff176";
      ctx.lineWidth = 2;
      ctx.strokeRect(CANVAS_WIDTH / 2 - 150, viewTop + 8, 300, 34);
      ctx.fillStyle = "#fff176";
      ctx.font = "800 18px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(state.penaltyBanner.text, CANVAS_WIDTH / 2, viewTop + 25);
    }
  };

  // Draws one team's shootout result dots (green = scored, red = missed,
  // hollow = still to take).
  const drawResultDots = (
    ctx: CanvasRenderingContext2D,
    results: boolean[],
    x: number,
    y: number,
    align: "left" | "right"
  ) => {
    const total = Math.max(5, results.length);
    const dir = align === "left" ? 1 : -1;
    for (let i = 0; i < total; i += 1) {
      const dx = x + dir * i * 22;
      ctx.beginPath();
      ctx.arc(dx, y, 7, 0, Math.PI * 2);
      if (i < results.length) {
        ctx.fillStyle = results[i] ? "#4caf50" : "#ef5350";
        ctx.fill();
      } else {
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  };

  const drawShootoutScoreboard = (
    ctx: CanvasRenderingContext2D,
    so: NonNullable<GameState["shootout"]>
  ) => {
    const w = 520;
    const h = 56;
    const x = (CANVAS_WIDTH - w) / 2;
    const y = HUD_HEIGHT + 8;
    ctx.fillStyle = "rgba(8,17,31,0.92)";
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();

    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = "800 18px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${homeTeam.flag} ${homeTeam.shortCode}`, x + 16, y + 17);
    drawResultDots(ctx, so.homeResults, x + 18, y + 39, "left");

    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${awayTeam.shortCode} ${awayTeam.flag}`, x + w - 16, y + 17);
    drawResultDots(ctx, so.awayResults, x + w - 18, y + 39, "right");

    ctx.textAlign = "center";
    ctx.font = "900 26px Arial";
    ctx.fillStyle = "#ffd54f";
    ctx.fillText(`${so.homeScore} - ${so.awayScore}`, CANVAS_WIDTH / 2, y + 28);
  };

  // Sliding GOAL / NO-GOAL result text that scrolls across the screen for a
  // couple of seconds between kicks before the next taker steps up.
  const drawShootoutResultSlide = (
    ctx: CanvasRenderingContext2D,
    so: NonNullable<GameState["shootout"]>
  ) => {
    const state = gameStateRef.current;
    const rf = so.resultFlash;
    if (!rf) return;
    const remaining = rf.until - state.timePassed;
    const progress = clamp(1 - remaining / SHOOTOUT_RESULT_MS, 0, 1);
    const color = rf.goal ? "#69f0ae" : "#ff8a80";
    drawBroadcastCaption(ctx, rf.text, color, progress);
  };

  // Shared broadcast-style caption used by goals/penalties/cards and shootout
  // results. The font size is fitted to the canvas width so long captions
  // (e.g. "CORNER KICK - COUNTRY") always stay fully on screen.
  const drawBroadcastCaption = (
    ctx: CanvasRenderingContext2D,
    text: string,
    color: string,
    progress: number
  ) => {
    const y = CANVAS_HEIGHT / 2;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeIn = (t: number) => t * t * t;
    let centerX: number;
    if (progress < 0.24) {
      centerX = CANVAS_WIDTH + 380 - easeOut(progress / 0.24) * (CANVAS_WIDTH / 2 + 380);
    } else if (progress > 0.76) {
      centerX = CANVAS_WIDTH / 2 - easeIn((progress - 0.76) / 0.24) * (CANVAS_WIDTH / 2 + 380);
    } else {
      centerX = CANVAS_WIDTH / 2;
    }
    const pop = 1 + 0.045 * Math.sin(clamp((progress - 0.1) / 0.8, 0, 1) * Math.PI);

    // Fit the font so the whole caption (plus padding) stays inside the canvas.
    const maxTextW = CANVAS_WIDTH - 220;
    let fontSize = 58;
    ctx.font = `900 ${fontSize}px Arial`;
    let textW = ctx.measureText(text).width;
    if (textW > maxTextW) {
      fontSize = Math.max(30, Math.floor((fontSize * maxTextW) / textW));
      ctx.font = `900 ${fontSize}px Arial`;
      textW = ctx.measureText(text).width;
    }

    const bandH = fontSize + 46;
    const bandW = Math.min(CANVAS_WIDTH - 20, textW + 150);

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.translate(centerX, y);
    ctx.scale(pop, pop);

    const bandGrad = ctx.createLinearGradient(-bandW / 2, 0, bandW / 2, 0);
    bandGrad.addColorStop(0, "rgba(4,10,20,0)");
    bandGrad.addColorStop(0.12, "rgba(4,10,20,0.9)");
    bandGrad.addColorStop(0.88, "rgba(4,10,20,0.9)");
    bandGrad.addColorStop(1, "rgba(4,10,20,0)");
    ctx.fillStyle = bandGrad;
    ctx.fillRect(-bandW / 2, -bandH / 2, bandW, bandH);

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.92;
    ctx.fillRect(-bandW * 0.4, -bandH / 2, bandW * 0.8, 4);
    ctx.fillRect(-bandW * 0.4, bandH / 2 - 4, bandW * 0.8, 4);
    ctx.globalAlpha = 1;

    const tg = ctx.createLinearGradient(0, -fontSize / 2, 0, fontSize / 2);
    tg.addColorStop(0, "#ffffff");
    tg.addColorStop(0.5, color);
    tg.addColorStop(1, "#ffffff");
    ctx.font = `900 ${fontSize}px Arial`;
    ctx.fillStyle = tg;
    ctx.shadowColor = color;
    ctx.shadowBlur = 22;
    ctx.fillText(text, 0, 3);
    ctx.restore();
  };

  // Sliding text for goals, penalties, and cards (broadcast-style caption that
  // sweeps in from the right, holds in the centre, then sweeps out to the left).
  const drawSlideFlash = (ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    const flash = state.slideFlash;
    if (!flash) return;

    const remaining = flash.until - state.timePassed;
    if (remaining <= 0) {
      state.slideFlash = null;
      return;
    }

    const duration = flash.duration ?? 2000;
    const progress = clamp(1 - remaining / duration, 0, 1);
    drawBroadcastCaption(ctx, flash.text, flash.color, progress);
  };

  const drawIntroOverlay = (ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    const intro = state.intro;
    if (!intro?.active) return;

    const duration = intro.phase === "card" ? INTRO_CARD_MS : INTRO_SQUAD_MS;
    const progress = clamp(intro.phaseTimeMs / duration, 0, 1);
    const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    const panelW = 820;
    const panelH = 500;
    const panelX = (CANVAS_WIDTH - panelW) / 2;
    const panelY = (CANVAS_HEIGHT - panelH) / 2 - 8;
    const rise = (1 - eased) * 24;
    const floatOffset = Math.sin(state.timePassed / 220) * 6;
    const centerX = CANVAS_WIDTH / 2;

    ctx.save();
    ctx.fillStyle = "rgba(2,7,14,0.96)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const glow = ctx.createRadialGradient(centerX, CANVAS_HEIGHT / 2, 20, centerX, CANVAS_HEIGHT / 2, 500);
    glow.addColorStop(0, "rgba(255,213,79,0.28)");
    glow.addColorStop(0.45, "rgba(74,117,255,0.16)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.translate(panelX + panelW / 2, panelY + panelH / 2 + rise + floatOffset);
    ctx.scale(0.96 + eased * 0.04, 0.96 + eased * 0.04);
    ctx.translate(-(panelX + panelW / 2), -(panelY + panelH / 2 + rise + floatOffset));

    ctx.shadowColor = "rgba(0,0,0,0.74)";
    ctx.shadowBlur = 42;
    ctx.fillStyle = "rgba(6,12,22,0.98)";
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 32);
    ctx.fill();
    ctx.shadowBlur = 0;

    const borderGradient = ctx.createLinearGradient(panelX, panelY, panelX + panelW, panelY + panelH);
    borderGradient.addColorStop(0, "rgba(255,255,255,0.26)");
    borderGradient.addColorStop(0.5, "rgba(255,213,79,0.3)");
    borderGradient.addColorStop(1, "rgba(255,255,255,0.16)");
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 32);
    ctx.stroke();

    const sheen = ctx.createLinearGradient(panelX, panelY, panelX + panelW, panelY + panelH);
    sheen.addColorStop(0, "rgba(255,255,255,0.2)");
    sheen.addColorStop(0.35, "rgba(255,255,255,0.06)");
    sheen.addColorStop(1, "rgba(255,255,255,0.08)");
    ctx.fillStyle = sheen;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 32);
    ctx.fill();

    ctx.fillStyle = "rgba(255,213,79,0.16)";
    ctx.fillRect(panelX + 18, panelY + 18, panelW - 36, 10);
    ctx.fillRect(panelX + 18, panelY + panelH - 28, panelW - 36, 10);
    ctx.restore();

    ctx.globalAlpha = 0.92 + 0.08 * eased;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (intro.phase === "card") {
      // 3D "team vs team" presentation: two glossy colour-plates flanking a
      // gold VS medallion, with an animated shine sweeping across the card.
      const midY = panelY + panelH / 2 + 6;
      const plateW = (panelW - 150) / 2;
      const plateH = 300;
      const plateY = midY - plateH / 2;
      const leftPlateX = panelX + 40;
      const rightPlateX = panelX + panelW - 40 - plateW;
      const shine = (state.timePassed / 1100) % 1;

      // Stadium spotlight streaks fanning down behind the plates.
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(panelX + 12, panelY + 12, panelW - 24, panelH - 24, 26);
      ctx.clip();
      for (let i = 0; i < 7; i += 1) {
        const beamX = panelX + (panelW / 6) * i + Math.sin(state.timePassed / 900 + i) * 12;
        const beam = ctx.createLinearGradient(beamX, panelY, beamX + 60, panelY + panelH);
        beam.addColorStop(0, "rgba(255,255,255,0.10)");
        beam.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(beamX, panelY);
        ctx.lineTo(beamX + 40, panelY);
        ctx.lineTo(beamX + 120, panelY + panelH);
        ctx.lineTo(beamX + 20, panelY + panelH);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      const drawTeamPlate = (baseX: number, t: FootballTeam, side: -1 | 1) => {
        const slide = (1 - eased) * 150 * side; // slide in from the outer edge
        const x = baseX + slide;
        const cx = x + plateW / 2;
        const cy = plateY + plateH / 2;

        ctx.save();
        ctx.globalAlpha = eased;

        // Team-coloured glow pooled behind the plate.
        const glowGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, plateW * 0.95);
        glowGrad.addColorStop(0, shadeColor(t.primaryColor, 20));
        glowGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = eased * 0.55;
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, plateW * 0.95, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = eased;

        // Angle the panel inward like a real broadcast VS billboard.
        ctx.translate(cx, cy);
        ctx.transform(1, side * 0.05, 0, 1, 0, 0);
        ctx.translate(-cx, -cy);

        // Reflection of the panel on a glossy floor beneath it.
        ctx.save();
        ctx.globalAlpha = eased * 0.18;
        ctx.translate(0, plateY + plateH + (plateY + plateH));
        ctx.scale(1, -1);
        const refl = ctx.createLinearGradient(x, plateY, x, plateY + plateH);
        refl.addColorStop(0, shadeColor(t.primaryColor, -20));
        refl.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = refl;
        ctx.beginPath();
        ctx.roundRect(x, plateY, plateW, plateH * 0.7, 22);
        ctx.fill();
        ctx.restore();

        const grad = ctx.createLinearGradient(x, plateY, x, plateY + plateH);
        grad.addColorStop(0, shadeColor(t.primaryColor, 16));
        grad.addColorStop(1, shadeColor(t.primaryColor, -46));
        ctx.shadowColor = "rgba(0,0,0,0.55)";
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 10;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, plateY, plateW, plateH, 22);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        const gloss = ctx.createLinearGradient(x, plateY, x, plateY + plateH * 0.5);
        gloss.addColorStop(0, "rgba(255,255,255,0.34)");
        gloss.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gloss;
        ctx.beginPath();
        ctx.roundRect(x, plateY, plateW, plateH, 22);
        ctx.fill();

        // Inner bevel ring for depth.
        ctx.strokeStyle = "rgba(255,255,255,0.28)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x + 6, plateY + 6, plateW - 12, plateH - 12, 18);
        ctx.stroke();

        ctx.strokeStyle = t.secondaryColor || "rgba(255,255,255,0.42)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(x, plateY, plateW, plateH, 22);
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "900 96px Arial";
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 14;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(t.flag, cx, plateY + 96);
        ctx.shadowBlur = 0;

        ctx.font = "900 58px Arial";
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillText(t.shortCode, cx + 2, plateY + 198 + 2);
        const codeGrad = ctx.createLinearGradient(cx, plateY + 170, cx, plateY + 226);
        codeGrad.addColorStop(0, "#ffffff");
        codeGrad.addColorStop(1, "#dfe7f5");
        ctx.fillStyle = codeGrad;
        ctx.fillText(t.shortCode, cx, plateY + 198);

        // Name plate strip along the bottom.
        ctx.fillStyle = "rgba(0,0,0,0.32)";
        ctx.beginPath();
        ctx.roundRect(x + 16, plateY + plateH - 52, plateW - 32, 34, 10);
        ctx.fill();
        ctx.font = "800 17px Arial";
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fillText(t.name.toUpperCase(), cx, plateY + plateH - 35);
        ctx.restore();
      };

      drawTeamPlate(leftPlateX, homeTeam, -1);
      drawTeamPlate(rightPlateX, awayTeam, 1);

      // Central gold "VS" medallion.
      ctx.save();
      const medR = 58;
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 24;
      const mg = ctx.createRadialGradient(centerX - 14, midY - 16, 8, centerX, midY, medR);
      mg.addColorStop(0, "#fff7d6");
      mg.addColorStop(0.55, "#ffd54f");
      mg.addColorStop(1, "#b8860b");
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(centerX, midY, medR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(centerX, midY, medR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "900 50px Arial";
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillText("VS", centerX + 2, midY + 3);
      ctx.fillStyle = "#3a2a00";
      ctx.fillText("VS", centerX, midY);
      ctx.restore();

      // Title + subtitle.
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "900 30px Arial";
      ctx.fillStyle = "#ffd54f";
      ctx.fillText("MATCH DAY", centerX, panelY + 54);
      ctx.font = "700 16px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.fillText("Kick-off", centerX, panelY + panelH - 28);

      // Animated shine sweep across the whole card.
      const sweepX = panelX + shine * (panelW + 240) - 120;
      const sweep = ctx.createLinearGradient(sweepX - 70, 0, sweepX + 70, 0);
      sweep.addColorStop(0, "rgba(255,255,255,0)");
      sweep.addColorStop(0.5, "rgba(255,255,255,0.13)");
      sweep.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sweep;
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, panelW, panelH, 32);
      ctx.fill();
    } else {
      const squad = intro.phase === "home" ? (homeSquad?.length ? homeSquad : homeTeam.players) : (awaySquad?.length ? awaySquad : awayTeam.players);
      const team = intro.phase === "home" ? homeTeam : awayTeam;
      
      const entries = squad.slice(0, 11);
      const innerX = panelX + 44;
      // Reserve a larger header bar so the country name sits inside it
      const headerH = 64;
      const innerY = panelY + 34 + headerH + 12; // header + gap
      const innerW = panelW - 88;
      const innerH = panelH - (headerH + 68);
      const cardW = 332;
      const cardH = 40;
      const gapX = 20;
      const gapY = 12;
      const leftX = centerX - cardW - gapX / 2;
      const rowCount = Math.ceil(entries.length / 2);

      // Header bar in the team's colours with a "STARTING XI" subtitle.
      const hg = ctx.createLinearGradient(panelX + 30, panelY + 34, panelX + panelW - 30, panelY + 34);
      hg.addColorStop(0, shadeColor(team.primaryColor, -8));
      hg.addColorStop(1, shadeColor(team.primaryColor, -46));
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 16;
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.roundRect(panelX + 30, panelY + 34, panelW - 60, headerH, 20);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = team.secondaryColor || "rgba(255,255,255,0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(panelX + 30, panelY + 34, panelW - 60, headerH, 20);
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 27px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${team.flag} ${team.name.toUpperCase()}`, centerX, panelY + 34 + headerH / 2 - 9);
      ctx.font = "800 12px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.fillText("STARTING XI", centerX, panelY + 34 + headerH / 2 + 16);

      // Panel background (roster container)
      ctx.fillStyle = "rgba(10,20,34,0.97)";
      ctx.beginPath();
      ctx.roundRect(innerX, innerY, innerW, innerH, 24);
      ctx.fill();
      ctx.strokeStyle = `${team.primaryColor}55`;
      ctx.lineWidth = 2;
      ctx.stroke();

      const rosterHeight = Math.max(220, rowCount * (cardH + gapY) - gapY);
      const rosterTop = Math.min(panelY + 176, panelY + panelH - 90 - rosterHeight);

      entries.forEach((player, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        // Staggered broadcast reveal: tiles slide in one after another.
        const revealAt = 0.12 + index * 0.05;
        const local = clamp((progress - revealAt) / 0.22, 0, 1);
        const localEase = 1 - Math.pow(1 - local, 3);
        if (local <= 0) return;
        const x = leftX + col * (cardW + gapX) + (1 - localEase) * (col === 0 ? -40 : 40);
        const y = rosterTop + row * (cardH + gapY);
        const isCaptain = index === 0;
        const accent = isCaptain ? "#ffd54f" : team.primaryColor;

        ctx.save();
        ctx.globalAlpha = localEase;

        // Tile body with a soft team-tinted gradient and drop shadow.
        const tileGrad = ctx.createLinearGradient(x, y, x, y + cardH);
        tileGrad.addColorStop(0, "rgba(255,255,255,0.12)");
        tileGrad.addColorStop(1, "rgba(255,255,255,0.04)");
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 3;
        ctx.fillStyle = tileGrad;
        ctx.beginPath();
        ctx.roundRect(x, y, cardW, cardH, 12);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Left colour spine.
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.roundRect(x, y, 5, cardH, 3);
        ctx.fill();

        ctx.strokeStyle = isCaptain ? "rgba(255,213,79,0.7)" : "rgba(255,255,255,0.14)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(x, y, cardW, cardH, 12);
        ctx.stroke();

        // Team-coloured jersey badge with the shirt number.
        const badgeGrad = ctx.createLinearGradient(x + 14, y + 6, x + 14, y + cardH - 6);
        badgeGrad.addColorStop(0, shadeColor(accent, 18));
        badgeGrad.addColorStop(1, shadeColor(accent, -30));
        ctx.fillStyle = badgeGrad;
        ctx.beginPath();
        ctx.arc(x + 26, y + cardH / 2, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = "800 13px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(player.jersey), x + 26, y + cardH / 2);

        // Player name.
        ctx.textAlign = "left";
        ctx.fillStyle = isCaptain ? "#ffe082" : "#ffffff";
        ctx.font = "700 15px Arial";
        const name = player.name.length > 22 ? player.name.slice(0, 20) + "…" : player.name;
        ctx.fillText(name, x + 50, y + cardH / 2);

        // Position tag + captain armband.
        ctx.textAlign = "right";
        ctx.font = "800 11px Arial";
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillText(isCaptain ? "© " + player.position : player.position, x + cardW - 14, y + cardH / 2);
        ctx.restore();
      });
    }

    ctx.restore();
  };

  const drawShootoutLineup = (
    ctx: CanvasRenderingContext2D,
    so: NonNullable<GameState["shootout"]>
  ) => {
    const state = gameStateRef.current;
    const nameOf = (id: string) => shortPlayerName(findPlayer(state, id)?.player.name ?? "");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffd54f";
    ctx.font = "900 42px Arial";
    ctx.fillText("SHOOTOUT LINE-UP", CANVAS_WIDTH / 2, 140);

    const colY = 232;
    const rowH = 50;
    const leftX = CANVAS_WIDTH * 0.3;
    const rightX = CANVAS_WIDTH * 0.7;

    ctx.font = "800 24px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${homeTeam.flag} ${homeTeam.name}`, leftX, colY - 52);
    ctx.fillText(`${awayTeam.flag} ${awayTeam.name}`, rightX, colY - 52);

    so.homeKickers.forEach((id, i) => {
      ctx.font = "700 21px Arial";
      ctx.fillStyle = "#cfe3ff";
      ctx.fillText(`${i + 1}.  ${nameOf(id)}`, leftX, colY + i * rowH);
    });
    so.awayKickers.forEach((id, i) => {
      ctx.font = "700 21px Arial";
      ctx.fillStyle = "#ffd9cf";
      ctx.fillText(`${i + 1}.  ${nameOf(id)}`, rightX, colY + i * rowH);
    });
  };

  const drawShootoutDoneCard = (
    ctx: CanvasRenderingContext2D,
    so: NonNullable<GameState["shootout"]>
  ) => {
    const winnerTeam = so.winner === "home" ? homeTeam : awayTeam;
    // Align final shootout card to the pitch centre rather than full-canvas centre
    const pitchCenterX = MARGIN + PITCH_WIDTH / 2;
    const pitchCenterY = PITCH_OFFSET_Y + MARGIN + PITCH_HEIGHT / 2;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffd54f";
    ctx.font = "900 50px Arial";
    ctx.fillText(`${winnerTeam.flag} ${winnerTeam.name} WIN`, pitchCenterX, pitchCenterY - 70);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 30px Arial";
    ctx.fillText(`${so.homeScore} - ${so.awayScore} on penalties`, pitchCenterX, pitchCenterY - 10);
    drawShootoutScoreboard(ctx, so);
  };

  const drawShootout = (ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    const so = state.shootout;
    if (!so) return;

    // A kick is live: reuse the zoomed penalty view plus a scoreboard strip.
    if (so.phase === "kick" && state.penalty) {
      drawPenaltyView(ctx);
      drawShootoutScoreboard(ctx, so);
      if (so.resultFlash) drawShootoutResultSlide(ctx, so);
      return;
    }

    // Otherwise a full-screen card for the announce / line-up / result phases.
    ctx.fillStyle = "#08111f";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (so.phase === "announce") {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffd54f";
      ctx.font = "900 58px Arial";
      ctx.fillText("PENALTY SHOOTOUT", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 28px Arial";
      ctx.fillText(
        `Match drawn ${state.homeScore} - ${state.awayScore}`,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2 + 20
      );
      const pulse = 0.55 + 0.45 * Math.sin(state.timePassed / 200);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = "#9fd0ff";
      ctx.font = "700 20px Arial";
      ctx.fillText("It all comes down to spot-kicks...", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 68);
      ctx.globalAlpha = 1;
    } else if (so.phase === "lineup") {
      drawShootoutLineup(ctx, so);
    } else if (so.phase === "done") {
      // Stop all audio when the final shootout card is shown so the final
      // scorecard is silent immediately.
      const audioManager = getAudioManager();
      audioManager.stopBackground();
      resetAudioManager();
      drawShootoutDoneCard(ctx, so);
    } else {
      // Between kicks: scoreboard plus the sliding result banner.
      drawShootoutScoreboard(ctx, so);
      if (so.resultFlash) drawShootoutResultSlide(ctx, so);
    }
  };

  const drawFrame = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const state = gameStateRef.current;

    // Clear the whole canvas first (areas not covered by pitch/HUD).
    ctx.fillStyle = "#0c1726";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (state.shootout?.active) {
      drawShootout(ctx);
      drawHud(ctx);
      return;
    }

    if (state.penalty) {
      // Penalty mode: show only the zoomed-in penalty area, full width.
      drawPenaltyView(ctx);
      drawHud(ctx);
      drawSlideFlash(ctx);
      return;
    }

    // Normal mode: draw the pitch shifted below the HUD. During the second half
    // the whole pitch layer is mirrored horizontally so the teams appear to have
    // switched ends (the simulation itself is never mirrored).
    ctx.save();
    ctx.translate(0, PITCH_OFFSET_Y);
    if (state.secondHalf) {
      ctx.translate(CANVAS_WIDTH, 0);
      ctx.scale(-1, 1);
    }
    drawPitch(ctx);
    state.homePlayers.forEach((player) => drawPlayer(ctx, player, homeTeam));
    state.awayPlayers.forEach((player) => drawPlayer(ctx, player, awayTeam));
    drawBall(ctx);
    ctx.restore();

    drawHud(ctx);

    // Draw the pre-match intro presentation on top of the live pitch.
    drawIntroOverlay(ctx);
    
    // Draw sliding text effects (goals, penalties, cards)
    drawSlideFlash(ctx);
  };

  useEffect(() => {
    const gameLoop = (currentTime: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const deltaMs = Math.min(currentTime - lastTimeRef.current, 32);
      lastTimeRef.current = currentTime;

      updateGameState(deltaMs);
      drawFrame();
      setMatchState({ ...gameStateRef.current });

      const state = gameStateRef.current;
      
      // Log continuous events (dribbling, possession, passes) periodically
      if (getCurrentMatchId() && state.started && !state.matchEnded) {
        const now = Date.now();
        const holder = findPlayer(state, state.ball.holderId);
        
        // Log pass completions (when ball transitions from pass mode to held with a new holder)
        if (lastPassModeRef.current === "pass" && state.ball.mode === "held" && holder) {
          logPass(holder.player.name, holder.player.name, holder.team === "home" ? homeTeam.shortCode : awayTeam.shortCode);
        }
        lastPassModeRef.current = state.ball.mode;
        
        if (now - lastCommentaryLogRef.current > 2000) { // Log every 2 seconds
          lastCommentaryLogRef.current = now;
          
          if (holder && state.ball.mode === "held") {
            // Log dribbling if ball holder changed
            if (holder.id !== lastBallHolderRef.current) {
              lastBallHolderRef.current = holder.id;
              logDribble(holder.player.name, holder.team === "home" ? homeTeam.shortCode : awayTeam.shortCode, "forward");
            }
            
            // Log possession
            if (holder.team !== lastPossessionTeamRef.current) {
              lastPossessionTeamRef.current = holder.team;
              const area = holder.x < 400 ? "defense" : holder.x < 800 ? "midfield" : "attack";
              logPossessionChange(holder.team === "home" ? homeTeam.shortCode : awayTeam.shortCode, area);
            }
          }
          
          // Sync background audio timeline to match time
          if (getCurrentMatchId()) {
            const audioManager = getAudioManager();
            audioManager.updateBackgroundTime(state.timePassed);
          }
        }
      }
      
      if (!state.matchEnded) {
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      if (!matchEndedNotifiedRef.current) {
        matchEndedNotifiedRef.current = true;
        // Silence all match audio immediately so the final score card is quiet.
        const audioManager = getAudioManager();
        audioManager.stopBackground();
        endCommentary();
        resetAudioManager();
        const so = state.shootout;
        const shootoutWinner = so?.winner ?? null;
        onMatchEnd?.({
          winner: shootoutWinner
            ? shootoutWinner
            : state.homeScore === state.awayScore
            ? "draw"
            : state.homeScore > state.awayScore
            ? "home"
            : "away",
          goals: state.homeScore + state.awayScore,
          scoreline: `${state.homeScore}-${state.awayScore}`,
          stats: {
            homeShots: state.homeShots,
            awayShots: state.awayShots,
            homeShotsOnTarget: state.homeShotsOnTarget,
            awayShotsOnTarget: state.awayShotsOnTarget,
            goals: state.goals,
          },
          shootout:
            so && so.winner
              ? {
                  homeScore: so.homeScore,
                  awayScore: so.awayScore,
                  winner: so.winner,
                  homeResults: so.homeResults,
                  awayResults: so.awayResults,
                }
              : undefined,
        });
      }
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      // Ensure no crowd/effect audio keeps playing once the arena unmounts
      // (e.g. when the page switches to the final score card).
      const audioManager = getAudioManager();
      audioManager.stopBackground();
      resetAudioManager();
    };
  }, [homeTeam, awayTeam, onMatchEnd]);

  // Cleanup commentary and audio when match ends
  useEffect(() => {
    if (matchState.matchEnded && getCurrentMatchId()) {
      endCommentary();
      const audioManager = getAudioManager();
      audioManager.stopBackground();
      resetAudioManager();
    }
  }, [matchState.matchEnded]);

  return (
    <div
      className="football-arena-stage"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 260px",
        gap: 14,
        width: "100%",
        minHeight: "100vh",
        padding: 14,
        boxSizing: "border-box",
        background: "#08111f",
      }}
    >
      <div style={{ minWidth: 0, position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            width: "100%",
            maxHeight: "calc(100vh - 28px)",
            aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
            display: "block",
            background: "#0c1726",
            border: "2px solid rgba(255,255,255,0.25)",
            borderRadius: 8,
          }}
        />
        {matchState.matchEnded && (
          <div
            style={{
              position: "absolute",
              left: `${((MARGIN + PITCH_WIDTH / 2) / CANVAS_WIDTH) * 100}%`,
              top: `${((PITCH_OFFSET_Y + MARGIN + PITCH_HEIGHT / 2) / CANVAS_HEIGHT) * 100}%`,
              transform: "translate(-50%, -50%)",
              background: "rgba(2,6,12,0.88)",
              color: "#fff",
              padding: "14px 18px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              fontWeight: 900,
              zIndex: 20,
            }}
          >
            Match Ended: {matchState.homeScore} - {matchState.awayScore}
          </div>
        )}

        {!matchState.started && !matchState.matchEnded && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(6,12,22,0.82)",
              borderRadius: 8,
              backdropFilter: "blur(2px)",
            }}
          >
            <div
              style={{
                width: "min(440px, 86%)",
                background: "linear-gradient(160deg, rgba(18,30,48,0.98), rgba(10,18,32,0.98))",
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: 16,
                padding: "26px 24px",
                color: "#fff",
                textAlign: "center",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
            >
              <div style={{ fontSize: 13, letterSpacing: 2, color: "#9fb0c8", fontWeight: 800 }}>
                KICK-OFF
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  margin: "16px 0 8px",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    padding: "12px 6px",
                    borderRadius: 12,
                    background: `linear-gradient(160deg, ${homeTeam.primaryColor}, rgba(0,0,0,0.28))`,
                    border: `1px solid ${homeTeam.secondaryColor || "rgba(255,255,255,0.3)"}`,
                    boxShadow: "0 12px 24px rgba(0,0,0,0.4)",
                    transform: "perspective(620px) rotateY(9deg)",
                  }}
                >
                  <div style={{ fontSize: 32, lineHeight: 1 }}>{homeTeam.flag}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, marginTop: 4 }}>{homeTeam.shortCode}</div>
                </div>
                <div
                  style={{
                    flex: "0 0 auto",
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    fontWeight: 900,
                    color: "#3a2a00",
                    background: "radial-gradient(circle at 40% 35%, #fff7d6, #ffd54f 55%, #b8860b)",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.45)",
                  }}
                >
                  VS
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: "12px 6px",
                    borderRadius: 12,
                    background: `linear-gradient(160deg, ${awayTeam.primaryColor}, rgba(0,0,0,0.28))`,
                    border: `1px solid ${awayTeam.secondaryColor || "rgba(255,255,255,0.3)"}`,
                    boxShadow: "0 12px 24px rgba(0,0,0,0.4)",
                    transform: "perspective(620px) rotateY(-9deg)",
                  }}
                >
                  <div style={{ fontSize: 32, lineHeight: 1 }}>{awayTeam.flag}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, marginTop: 4 }}>{awayTeam.shortCode}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#b7c5d8", marginBottom: 18 }}>
                {homeTeam.name} &nbsp;—&nbsp; {awayTeam.name}
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: shootoutOptIn ? "rgba(255,213,79,0.16)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${shootoutOptIn ? "rgba(255,213,79,0.55)" : "rgba(255,255,255,0.14)"}`,
                  marginBottom: 18,
                  transition: "all 0.15s ease",
                }}
              >
                <input
                  type="checkbox"
                  checked={shootoutOptIn}
                  onChange={(e) => setShootoutOptIn(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "#ffd54f" }}
                />
                Penalty shootout if drawn
              </label>

              <button
                onClick={startMatch}
                style={{
                  width: "100%",
                  minHeight: 50,
                  border: "none",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #4caf50, #2e7d32)",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 18,
                  letterSpacing: 1,
                  cursor: "pointer",
                  boxShadow: "0 12px 28px rgba(46,125,50,0.45)",
                }}
              >
                ▶ START MATCH
              </button>
            </div>
          </div>
        )}
      </div>

      <aside
        style={{
          background: "rgba(10,18,30,0.96)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 8,
          color: "#fff",
          padding: 14,
          boxSizing: "border-box",
          fontFamily: "system-ui, -apple-system, sans-serif",
          height: "calc(100vh - 28px)",
          overflowY: "auto",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>Match Control</div>

        {matchState.shootout?.active && (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: "rgba(255,213,79,0.1)",
              border: "1px solid rgba(255,213,79,0.4)",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 900, color: "#ffd54f", letterSpacing: 1 }}>
              PENALTY SHOOTOUT
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, margin: "6px 0" }}>
              {homeTeam.shortCode} {matchState.shootout.homeScore} - {matchState.shootout.awayScore}{" "}
              {awayTeam.shortCode}
            </div>
            {matchState.shootout.winner ? (
              <div style={{ fontSize: 13, fontWeight: 800, color: "#69f0ae" }}>
                {(matchState.shootout.winner === "home" ? homeTeam : awayTeam).shortCode} win the shootout
              </div>
            ) : matchState.shootout.phase === "kick" &&
              matchState.penalty?.awaitingDecision &&
              matchState.penalty.chosenOutcome === null ? (
              <>
                <div style={{ fontSize: 12, color: "#e7eefb", marginBottom: 8 }}>
                  {(matchState.shootout.current === "home" ? homeTeam : awayTeam).shortCode} to take:{" "}
                  <strong>
                    {findPlayer(matchState, matchState.penalty.shooterId)?.player.name ?? ""}
                  </strong>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <button onClick={() => decideShootoutKick("auto")} style={controlButtonStyle("#64b5f6", "#06111f", false)}>
                    Auto kick (by skill)
                  </button>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button onClick={() => decideShootoutKick("goal")} style={controlButtonStyle("#66bb6a", "#041407", false)}>
                      Score
                    </button>
                    <button onClick={() => decideShootoutKick("miss")} style={controlButtonStyle("#ef5350", "#fff", false)}>
                      Miss / save
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: "#cdd9ec" }}>
                {matchState.shootout.phase === "announce"
                  ? "Match drawn — preparing shootout..."
                  : matchState.shootout.phase === "lineup"
                  ? "Selecting takers..."
                  : "Striker stepping up..."}
              </div>
            )}
          </div>
        )}

        <div
          style={{
            padding: 10,
            borderRadius: 8,
            background: "rgba(255,255,255,0.06)",
            marginBottom: 12,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontSize: 11, color: "#9fb0c8", textTransform: "uppercase", fontWeight: 800 }}>
            Added Time
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4 }}>
            +{Math.round(matchState.addedTimeMs / (MATCH_DURATION / 90))} min
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 8 }}>
            <button onClick={() => addStoppageTime(1)} disabled={matchState.matchEnded} style={controlButtonStyle("#64b5f6", "#06111f", matchState.matchEnded)}>
              +1:00
            </button>
            <button onClick={() => addStoppageTime(2)} disabled={matchState.matchEnded} style={controlButtonStyle("#64b5f6", "#06111f", matchState.matchEnded)}>
              +2:00
            </button>
            <button onClick={() => addStoppageTime(-1)} disabled={matchState.matchEnded} style={controlButtonStyle("#90a4ae", "#071014", matchState.matchEnded)}>
              -1:00
            </button>
          </div>
        </div>

        <div
          style={{
            padding: 10,
            borderRadius: 8,
            background: "rgba(255,255,255,0.06)",
            marginBottom: 12,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontSize: 11, color: "#9fb0c8", textTransform: "uppercase", fontWeight: 800 }}>
            Ball Holder
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, marginTop: 4 }}>
            {currentHolder ? `${currentHolder.player.name} (${currentHolder.team === "home" ? homeTeam.shortCode : awayTeam.shortCode})` : "Loose ball"}
          </div>
          {currentHolder && (
            <div style={{ fontSize: 12, color: "#b7c5d8", marginTop: 3 }}>
              #{currentHolder.player.jersey} | {currentHolder.role} | OVR {currentHolder.player.overall}
            </div>
          )}
        </div>

        <div
          style={{
            padding: 10,
            borderRadius: 8,
            background: radarTeammateCount > 0 ? "rgba(79,195,247,0.12)" : "rgba(255,255,255,0.06)",
            marginBottom: 12,
            border: `1px solid ${radarTeammateCount > 0 ? "rgba(79,195,247,0.4)" : "rgba(255,255,255,0.08)"}`,
          }}
        >
          <div style={{ fontSize: 11, color: "#9fb0c8", textTransform: "uppercase", fontWeight: 800 }}>
            Pass Radar (~25m)
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: radarTeammateCount > 0 ? "#4fc3f7" : "#7a869a" }}>
              {radarTeammateCount}
            </span>
            <span style={{ fontSize: 12, color: "#b7c5d8" }}>
              team-mate{radarTeammateCount === 1 ? "" : "s"} in range
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#8a97ab", marginTop: 2 }}>
            {currentHolder
              ? radarTeammateCount > 0
                ? "Good to pass — nearest in radar will receive an aerial ball."
                : "No team-mate in radar — pass will find the nearest player anywhere."
              : "No ball carrier."}
          </div>
        </div>

        <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
          <button
            onClick={() => issueCardToHolder("yellow")}
            disabled={!currentHolder}
            style={controlButtonStyle("#f6c945", "#1b1600", !currentHolder)}
          >
            Yellow card holder
          </button>
          <button
            onClick={() => issueCardToHolder("red")}
            disabled={!currentHolder}
            style={controlButtonStyle("#ef5350", "#ffffff", !currentHolder)}
          >
            Red card holder
          </button>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.12)", margin: "12px 0" }} />

        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Striker Actions</div>
        <div style={{ display: "grid", gap: 8, marginBottom: 4 }}>
          <button
            onClick={passToNearestTeammate}
            disabled={!currentHolder}
            style={controlButtonStyle("#4fc3f7", "#04121f", !currentHolder)}
          >
            ⬆ Pass (aerial){currentHolder ? ` · ${radarTeammateCount} in radar` : ""}
          </button>
          <button
            onClick={kickAtGoal}
            disabled={!currentHolder}
            style={controlButtonStyle("#ff8a65", "#1f0a04", !currentHolder)}
          >
            ⚽ Kick goal (shoot now)
          </button>
        </div>
        <div style={{ fontSize: 11, color: "#9fb0c8", lineHeight: 1.5, marginBottom: 6 }}>
          Pass lofts the ball to the best team-mate (ahead if possible, else back). Kick goal makes the carrier shoot at once.
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.12)", margin: "12px 0" }} />

        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Penalties</div>
        <div style={{ display: "grid", gap: 8 }}>
          <button onClick={() => awardPenalty(undefined, "auto")} style={controlButtonStyle("#64b5f6", "#06111f", false)}>
            Auto penalty to holder team
          </button>
          <button onClick={() => awardPenalty(undefined, "manual")} style={controlButtonStyle("#6abf69", "#061f0a", false)}>
            Manual penalty to holder team
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button onClick={() => awardPenalty("home", "auto")} style={controlButtonStyle(homeTeam.primaryColor, "#fff", false)}>
              {homeTeam.shortCode} auto
            </button>
            <button onClick={() => awardPenalty("away", "auto")} style={controlButtonStyle(awayTeam.primaryColor, "#fff", false)}>
              {awayTeam.shortCode} auto
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button onClick={() => awardPenalty("home", "manual")} style={controlButtonStyle("#6abf69", "#061f0a", false)}>
              {homeTeam.shortCode} manual
            </button>
            <button onClick={() => awardPenalty("away", "manual")} style={controlButtonStyle("#6abf69", "#061f0a", false)}>
              {awayTeam.shortCode} manual
            </button>
          </div>
          <button
            onClick={() => chooseManualPenalty(true)}
            disabled={
              !matchState.penalty ||
              matchState.penalty.mode === "auto" ||
              matchState.penalty.chosenOutcome !== null
            }
            style={controlButtonStyle(
              "#66bb6a",
              "#041407",
              !matchState.penalty ||
                matchState.penalty.mode === "auto" ||
                matchState.penalty.chosenOutcome !== null
            )}
          >
            Penalty result: goal
          </button>
          <button
            onClick={() => chooseManualPenalty(false)}
            disabled={
              !matchState.penalty ||
              matchState.penalty.mode === "auto" ||
              matchState.penalty.chosenOutcome !== null
            }
            style={controlButtonStyle(
              "#90a4ae",
              "#071014",
              !matchState.penalty ||
                matchState.penalty.mode === "auto" ||
                matchState.penalty.chosenOutcome !== null
            )}
          >
            Penalty result: no goal
          </button>
        </div>

        {matchState.penalty && (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 8,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: 12,
              color: "#d8e4f5",
            }}
          >
            Pending penalty for {matchState.penalty.team === "home" ? homeTeam.shortCode : awayTeam.shortCode}.
            Mode: {matchState.penalty.mode.toUpperCase()}.
            {matchState.penalty.mode === "manual"
              ? matchState.penalty.chosenOutcome === null
                ? " Choose goal or no goal — the striker shoots 3s after you decide."
                : ` Locked: ${matchState.penalty.chosenOutcome ? "GOAL" : "NO GOAL"}. Striker shooting...`
              : " Striker shoots automatically after a 3s run-up."}
          </div>
        )}

        <div style={{ height: 1, background: "rgba(255,255,255,0.12)", margin: "14px 0" }} />

        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Discipline</div>
        <div style={{ fontSize: 12, color: "#b7c5d8", lineHeight: 1.55 }}>
          Yellow cards show as yellow tabs on players. A second yellow automatically turns red. Red-carded players fade and stop joining play.
        </div>
      </aside>
    </div>
  );
};

const controlButtonStyle = (background: string, color: string, disabled: boolean): React.CSSProperties => ({
  width: "100%",
  minHeight: 38,
  border: "none",
  borderRadius: 8,
  background: disabled ? "rgba(255,255,255,0.12)" : background,
  color: disabled ? "rgba(255,255,255,0.42)" : color,
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: 800,
  fontSize: 12,
  boxShadow: disabled ? "none" : "0 8px 20px rgba(0,0,0,0.22)",
});

export default FootballArena;
