// src/pages/ArenaPage.tsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import "../App.css";
import "./ArenaVisual.css";
import { ARENA_THEME_IMAGES } from "./arenaThemeImages";
import statsClient, { recordHit, recordKill, setSuperbubblePlayer } from "../utils/statsClient";

const watermarkUrl = new URL('../types/watermarkfin.png', import.meta.url).href; 


export interface BubbleData {
  x: number;
  y: number;
  radius: number;
  health: number;
  imgSrc: string;
  vx: number;
  vy: number;
  id: number;
  name?: string;
  avatar?: number;
}

type MatchPlayer = {
  name?: string;
  username?: string;
  playerName?: string;
  avatar?: number;
  hp?: number;
  imageName?: string;
  bossImageName?: string;
  image?: string;
  imageSrc?: string;
  powers?: Array<{ key: keyof typeof SUPER_BUBBLE_TYPES }>;
  role?: "boss" | "solo" | "many" | "normal";
};

type MatchPayload = { mode: string; arena: string; soloPlayer?: string; players: MatchPlayer[] };

export interface Spike {
  x: number;
  y: number;
  nx: number; // inward normal x
  ny: number; // inward normal y
}

interface SuperPower {
  name: string;
  damage: number;
}

/* ---------- Constants ---------- */

export const SUPER_BUBBLE_TYPES: { [k: string]: SuperPower } = {
  // CLASSIC WEAPONS (12 Powers)
  missile: { name: "Missile", damage: 8 },
  bomb: { name: "Bomb", damage: 7.5 },
  drone: { name: "Drone Strike", damage: 6.5 },
  rocket: { name: "Rocket", damage: 8.5 },
  grenade: { name: "Grenade", damage: 6 },
  laser: { name: "Laser Beam", damage: 7 },
  plasma: { name: "Plasma Blast", damage: 8 },
  emp_pulse: { name: "EMP Pulse", damage: 5.5 },
  flamethrower: { name: "Flamethrower", damage: 7.5 },
  sonic_boom: { name: "Sonic Boom", damage: 6.5 },
  shockwave: { name: "Shockwave", damage: 7 },
  acid_spray: { name: "Acid Spray", damage: 6 },

  // Original Powers
  flame: { name: "Flame Shot", damage: 5 },
  arrow: { name: "Arrow Shot", damage: 5 },
  bullet: { name: "Bullet Shot", damage: 7 },
  kunai: { name: "Kunai", damage: 7.5 },
  shuriken: { name: "Shuriken", damage: 7 },
  katana: { name: "Katana Slash", damage: 5.5 },
  energy_blast: { name: "Energy Blast", damage: 8 },
  ice_shard: { name: "Ice Shard", damage: 3 },

  // Anime Powers (7)
  kamehameha: { name: "Kamehameha", damage: 8 },
  rasengan: { name: "Rasengan", damage: 6.5 },
  chidori: { name: "Chidori", damage: 7.5 },
  spirit_bomb: { name: "Spirit Bomb", damage: 9 },
  phoenix_strike: { name: "Phoenix Strike", damage: 7 },
  void_slash: { name: "Void Slash", damage: 8.5 },
  holy_light: { name: "Holy Light", damage: 6 },

  // MARVEL UNIVERSE (10 Powers)
  repulsor_blast: { name: "Repulsor Blast", damage: 7 },
  mjolnir_strike: { name: "Mjolnir Strike", damage: 8.5 },
  gamma_smash: { name: "Gamma Smash", damage: 9.5 },
  web_shot: { name: "Web Shot", damage: 5.5 },
  frost_bolt: { name: "Frost Bolt", damage: 6.5 },
  captain_energy: { name: "Captain Energy", damage: 8 },
  mystic_spell: { name: "Mystic Spell", damage: 7.5 },
  widow_bite: { name: "Widow Bite", damage: 6 },
  scarlet_hex: { name: "Scarlet Hex", damage: 8.5 },
  vision_beam: { name: "Vision Beam", damage: 9 },

  // DC UNIVERSE (10 Powers)
  heat_vision: { name: "Heat Vision", damage: 9 },
  freeze_ray: { name: "Freeze Ray", damage: 6.5 },
  lightning_power: { name: "Lightning Power", damage: 7.5 },
  lasso_energy: { name: "Lasso Energy", damage: 7 },
  green_lantern: { name: "Green Lantern", damage: 8 },
  aqua_surge: { name: "Aqua Surge", damage: 7 },
  kryptonite_pulse: { name: "Kryptonite Pulse", damage: 8.5 },
  dark_side: { name: "Dark Side", damage: 9.5 },
  cyborg_cannon: { name: "Cyborg Cannon", damage: 8 },
  crow_strike: { name: "Crow Strike", damage: 7 },

  // DRAGON BALL Z (8 Powers)
  solar_flare: { name: "Solar Flare", damage: 5 },
  galick_gun: { name: "Galick Gun", damage: 9 },
  destructo_disk: { name: "Destructo Disk", damage: 7 },
  special_beam: { name: "Special Beam", damage: 8.5 },
  final_flash: { name: "Final Flash", damage: 9.5 },
  spirit_ball: { name: "Spirit Ball", damage: 6 },
  dodon_ray: { name: "Dodon Ray", damage: 7.5 },
  potential_unlock: { name: "Potential Unlock", damage: 8 },

  // NARUTO UNIVERSE (10 Powers)
  sand_shield: { name: "Sand Shield", damage: 6.5 },
  paper_storm: { name: "Paper Storm", damage: 7.5 },
  needle_barrage: { name: "Needle Barrage", damage: 6 },
  genjutsu_trap: { name: "Genjutsu Trap", damage: 7 },
  wind_blade: { name: "Wind Blade", damage: 7.5 },
  earth_spear: { name: "Earth Spear", damage: 6.5 },
  lightning_cage: { name: "Lightning Cage", damage: 8.5 },
  ice_crystal: { name: "Ice Crystal", damage: 7 },
  lava_flow: { name: "Lava Flow", damage: 8 },
  wood_style: { name: "Wood Style", damage: 8 },

  // ONE PIECE UNIVERSE (8 Powers)
  gum_gum_pistol: { name: "Gum Gum Pistol", damage: 7 },
  flame_kick: { name: "Flame Kick", damage: 8 },
  sword_slash: { name: "Sword Slash", damage: 8.5 },
  thunder_tempo: { name: "Thunder Tempo", damage: 7.5 },
  cannon_strike: { name: "Cannon Strike", damage: 7 },
  soul_surge: { name: "Soul Surge", damage: 6.5 },
  shadow_clone: { name: "Shadow Clone", damage: 7 },
  magma_fist: { name: "Magma Fist", damage: 9 },

  // BLEACH UNIVERSE (7 Powers)
  getsuga_tensho: { name: "Getsuga Tensho", damage: 9 },
  senbonzakura: { name: "Senbonzakura", damage: 7.5 },
  hyorinmaru: { name: "Hyorinmaru", damage: 8.5 },
  bakudo_spell: { name: "Bakudo Spell", damage: 6.5 },
  cero_blast: { name: "Cero Blast", damage: 8.5 },
  hadou_spell: { name: "Hadou Spell", damage: 7.5 },
  bankai_power: { name: "Bankai Power", damage: 9.5 },

  // MY HERO ACADEMIA (6 Powers)
  one_for_all: { name: "One For All", damage: 9 },
  explosion_strike: { name: "Explosion Strike", damage: 8.5 },
  half_cold_hot: { name: "Half Cold Half Hot", damage: 8 },
  dark_erase: { name: "Dark Erase", damage: 5.5 },
  dna_boost: { name: "DNA Boost", damage: 6 },
  compression_pulse: { name: "Compression Pulse", damage: 7 },

  // OTHER FAMOUS PROPERTIES (5 Powers)
  force_push: { name: "Force Push", damage: 7.5 },
  atomic_breath: { name: "Atomic Breath", damage: 9.5 },
  infinity_snap: { name: "Infinity Snap", damage: 10 },
  time_stop_burst: { name: "Time Stop Burst", damage: 8 },
  dimension_rift: { name: "Dimension Rift", damage: 8.5 },
};

// Curated set of genuine, visually-distinct powers whose on-canvas shape clearly
// matches their name. The full catalogue above is kept intact (damage maps,
// rendering, and types all still resolve every key); only the powers listed here
// are surfaced to players in the shop, settings panels, and random selection.
export const AVAILABLE_POWER_KEYS = [
  // Classic weapons
  "missile", "rocket", "drone", "bomb", "grenade", "laser", "flamethrower", "plasma",
  "emp_pulse", "sonic_boom", "shockwave", "acid_spray",
  // Original
  "arrow", "bullet", "kunai", "shuriken", "katana", "energy_blast", "ice_shard",
  // Anime / signature
  "kamehameha", "rasengan", "chidori", "spirit_bomb", "phoenix_strike", "void_slash",
  "getsuga_tensho", "destructo_disk",
  // Marvel / target / arena
  "mjolnir_strike", "web_shot",
  // Self / arena / control
  "sand_shield", "potential_unlock", "shadow_clone", "time_stop_burst",
  "infinity_snap", "dimension_rift", "force_push", "atomic_breath",
] as (keyof typeof SUPER_BUBBLE_TYPES)[];

const AVAILABLE_POWER_KEY_SET = new Set<string>(AVAILABLE_POWER_KEYS as string[]);

const ARENA_TYPES = {
  NORMAL: "normal",
  BOSS: "boss",
  BRAWL: "brawl",
} as const;

const ARENA_SHAPES = {
  // Original set (kept intact — do not change geometry/feel)
  RECTANGLE: "rectangle",
  CIRCLE: "circle",
  HEXAGON: "hexagon",
  HOURGLASS: "hourglass",
  DIAMOND: "diamond",
  CROSS: "cross",
  PENTAGON: "pentagon",
  SPIRAL: "spiral",
  FUNNEL: "funnel",
  WAVE: "wave",
  // Catalogue additions (spec section 3)
  SQUARE: "square",
  OVAL: "oval",
  TRIANGLE: "triangle",
  OCTAGON: "octagon",
  STAR: "star",
  HEART: "heart",
  TRAPEZOID: "trapezoid",
  PARALLELOGRAM: "parallelogram",
  HEXAGRAM: "hexagram",
  CRESCENT: "crescent",
  RING: "ring",
  ROUNDED_SQUARE: "rounded_square",
  CAPSULE: "capsule",
  BOWTIE: "bowtie",
  CLOVER: "clover",
  GEAR: "gear",
  SHIELD: "shield",
} as const;

type ArenaShape = typeof ARENA_SHAPES[keyof typeof ARENA_SHAPES];

// Only shapes whose collision math assumes a single radius (true circles) need an
// equal-radius square box. Every other shape derives its boundary from normalized
// polygon points scaled independently by width/height, so it can fill the full
// rectangular arena box (using all the freed-up space) without breaking physics.
const SQUARE_ARENA_SHAPES = new Set<string>([
  ARENA_SHAPES.CIRCLE, ARENA_SHAPES.RING,
]);
const isSquareArenaShape = (shape: string) => SQUARE_ARENA_SHAPES.has(shape);

// Build a regular / parametric polygon in normalized [0..1] coordinates.
const buildRegularPolygon = (sides: number, rotationDeg: number, rx = 0.5, ry = 0.5): [number, number][] => {
  const pts: [number, number][] = [];
  const rot = (rotationDeg * Math.PI) / 180;
  for (let i = 0; i < sides; i++) {
    const a = rot + (i / sides) * Math.PI * 2;
    pts.push([0.5 + rx * Math.cos(a), 0.5 + ry * Math.sin(a)]);
  }
  return pts;
};
const buildStarPolygon = (points: number, outer: number, inner: number, rotationDeg: number): [number, number][] => {
  const pts: [number, number][] = [];
  const rot = (rotationDeg * Math.PI) / 180;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i / (points * 2)) * Math.PI * 2;
    pts.push([0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)]);
  }
  return pts;
};
const buildEllipsePolygon = (rx: number, ry: number, segments = 48): [number, number][] => {
  const pts: [number, number][] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push([0.5 + rx * Math.cos(a), 0.5 + ry * Math.sin(a)]);
  }
  return pts;
};
// Bumpy circle whose radius is modulated by cos(lobes*θ) — used for clover/gear.
const buildLobedPolygon = (lobes: number, base: number, amp: number, segments: number, rotationDeg = 0): [number, number][] => {
  const pts: [number, number][] = [];
  const rot = (rotationDeg * Math.PI) / 180;
  for (let i = 0; i < segments; i++) {
    const a = rot + (i / segments) * Math.PI * 2;
    const r = base + amp * Math.cos(lobes * a);
    pts.push([0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)]);
  }
  return pts;
};
// Clover: exact union boundary of 4 overlapping circles (N/E/S/W), so each lobe
// is a real rounded circle and the notches between lobes are true concave cuts.
const buildCloverPolygon = (lobeR: number, offset: number, segments: number): [number, number][] => {
  const centers: [number, number][] = [[offset, 0], [-offset, 0], [0, offset], [0, -offset]];
  const pts: [number, number][] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const dx = Math.cos(a), dy = Math.sin(a);
    let maxT = 0;
    for (const [cx, cy] of centers) {
      const k = dx * cx + dy * cy;
      const discriminant = lobeR * lobeR - (cx * cx + cy * cy - k * k);
      if (discriminant < 0) continue;
      const t = k + Math.sqrt(discriminant);
      if (t > maxT) maxT = t;
    }
    pts.push([0.5 + maxT * dx, 0.5 + maxT * dy]);
  }
  return pts;
};
// Alternating outer/inner radius teeth for a cog silhouette.
const buildGearPolygon = (teeth: number, outer: number, inner: number): [number, number][] => {
  const pts: [number, number][] = [];
  const steps = teeth * 4;
  for (let i = 0; i < steps; i++) {
    const phase = i % 4;
    const r = phase === 0 || phase === 1 ? outer : inner;
    const a = (i / steps) * Math.PI * 2 - Math.PI / 2;
    pts.push([0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)]);
  }
  return pts;
};
// Rounded-rectangle outline as a polygon with arc-approximated corners.
const buildRoundedRectPolygon = (radius: number, cornerSteps = 6): [number, number][] => {
  const r = radius;
  const pts: [number, number][] = [];
  const corners: [number, number, number][] = [
    [r, r, 180], [1 - r, r, 270], [1 - r, 1 - r, 0], [r, 1 - r, 90],
  ];
  for (const [cx, cy, start] of corners) {
    for (let s = 0; s <= cornerSteps; s++) {
      const a = ((start + (s / cornerSteps) * 90) * Math.PI) / 180;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  }
  return pts;
};
// Heart: dense samples of the classic parametric heart curve give smooth,
// rounded lobes and sides instead of a faceted straight-edge polygon.
const buildHeartPolygon = (): [number, number][] => {
  const segs = 120;
  const raw: [number, number][] = [];
  for (let i = 0; i < segs; i++) {
    const t = (i / segs) * Math.PI * 2;
    const rx = 16 * Math.pow(Math.sin(t), 3);
    const ry = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    raw.push([rx, ry]);
  }
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  for (const [rx, ry] of raw) {
    if (rx < xMin) xMin = rx;
    if (rx > xMax) xMax = rx;
    if (ry < yMin) yMin = ry;
    if (ry > yMax) yMax = ry;
  }
  const pad = 0.05;
  const span = 1 - pad * 2;
  return raw.map(([rx, ry]) => [
    pad + ((rx - xMin) / (xMax - xMin)) * span,
    // yMax (lobes) -> top (0); yMin (bottom point) -> bottom (1)
    pad + ((yMax - ry) / (yMax - yMin)) * span,
  ]);
};

// Crescent: exact outer/inner-circle intersections create a clean moon silhouette.
const buildCrescentPolygon = (): [number, number][] => {
  const pts: [number, number][] = [];
  const ocx = 0.5, ocy = 0.5, outerRadius = 0.46;
  const icx = 0.68, icy = 0.5, innerRadius = 0.38;
  const distance = icx - ocx;
  const intersectionX = (distance * distance + outerRadius * outerRadius - innerRadius * innerRadius) / (2 * distance);
  const outerAngle = Math.acos(intersectionX / outerRadius);
  const innerAngle = Math.acos((intersectionX - distance) / innerRadius);
  const segs = 56;
  // Outer arc travels around the left side from the upper intersection to the lower one.
  const oStart = -outerAngle, oEnd = -Math.PI * 2 + outerAngle;
  for (let i = 0; i <= segs; i++) {
    const a = oStart + (i / segs) * (oEnd - oStart);
    pts.push([ocx + outerRadius * Math.cos(a), ocy + outerRadius * Math.sin(a)]);
  }
  // Inner arc returns through the bite's left side, preserving a deep, rounded cavity.
  const iStart = innerAngle, iEnd = Math.PI * 2 - innerAngle;
  for (let i = 0; i <= segs; i++) {
    const a = iStart + (i / segs) * (iEnd - iStart);
    pts.push([icx + innerRadius * Math.cos(a), icy + innerRadius * Math.sin(a)]);
  }
  return pts;
};

// Normalized [0..1] polygon per shape. Single source of truth for collision
// vertices, CSS clip-path, and the neon SVG outline. Circle stays special-cased.
// Ring's donut geometry (fraction of the min container span) so the mask,
// outline, spike placement, and collision all draw the exact same tube.
export const RING_OUTER_FRAC = 0.48;
export const RING_INNER_FRAC = 0.17;

export const SHAPE_POLYGONS: { [key: string]: [number, number][] } = {
  [ARENA_SHAPES.RECTANGLE]: [[0, 0], [1, 0], [1, 1], [0, 1]],
  [ARENA_SHAPES.SQUARE]: [[0, 0], [1, 0], [1, 1], [0, 1]],
  [ARENA_SHAPES.HEXAGON]: [[0.5, 0], [1, 0.25], [1, 0.75], [0.5, 1], [0, 0.75], [0, 0.25]],
  [ARENA_SHAPES.PENTAGON]: [[0.5, 0], [1, 0.38], [0.82, 1], [0.18, 1], [0, 0.38]],
  [ARENA_SHAPES.DIAMOND]: [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]],
  [ARENA_SHAPES.HOURGLASS]: [[0, 0], [1, 0], [0.7, 0.5], [1, 1], [0, 1], [0.3, 0.5]],
  [ARENA_SHAPES.FUNNEL]: [[0, 0], [1, 0], [0.8, 1], [0.2, 1]],
  [ARENA_SHAPES.CROSS]: [
    [0.4, 0], [0.6, 0], [0.6, 0.4], [1, 0.4], [1, 0.6], [0.6, 0.6],
    [0.6, 1], [0.4, 1], [0.4, 0.6], [0, 0.6], [0, 0.4], [0.4, 0.4],
  ],
  [ARENA_SHAPES.WAVE]: [
    [0, 0.1], [0.1, 0], [0.2, 0.05], [0.3, 0], [0.4, 0.05], [0.5, 0], [0.6, 0.05],
    [0.7, 0], [0.8, 0.05], [0.9, 0], [1, 0.1], [1, 0.9], [0.9, 1], [0.8, 0.95],
    [0.7, 1], [0.6, 0.95], [0.5, 1], [0.4, 0.95], [0.3, 1], [0.2, 0.95], [0.1, 1], [0, 0.9],
  ],
  [ARENA_SHAPES.TRIANGLE]: [[0.5, 0.02], [0.98, 0.96], [0.02, 0.96]],
  [ARENA_SHAPES.OCTAGON]: [
    [0.3, 0], [0.7, 0], [1, 0.3], [1, 0.7], [0.7, 1], [0.3, 1], [0, 0.7], [0, 0.3],
  ],
  [ARENA_SHAPES.STAR]: buildStarPolygon(5, 0.5, 0.21, -90),
  [ARENA_SHAPES.HEXAGRAM]: buildStarPolygon(6, 0.5, 0.27, -90),
  [ARENA_SHAPES.TRAPEZOID]: [[0.2, 0], [0.8, 0], [1, 1], [0, 1]],
  [ARENA_SHAPES.PARALLELOGRAM]: [[0.25, 0], [1, 0], [0.75, 1], [0, 1]],
  [ARENA_SHAPES.BOWTIE]: [[0, 0], [0.5, 0.42], [1, 0], [1, 1], [0.5, 0.58], [0, 1]],
  [ARENA_SHAPES.SHIELD]: [
    [0.5, 0], [0.95, 0.14], [0.95, 0.5], [0.78, 0.82], [0.5, 1], [0.22, 0.82], [0.05, 0.5], [0.05, 0.14],
  ],
  [ARENA_SHAPES.HEART]: buildHeartPolygon(),
  [ARENA_SHAPES.OVAL]: buildEllipsePolygon(0.5, 0.42, 40),
  [ARENA_SHAPES.RING]: buildEllipsePolygon(RING_OUTER_FRAC, RING_OUTER_FRAC, 40),
  [ARENA_SHAPES.CAPSULE]: buildRoundedRectPolygon(0.28, 8),
  [ARENA_SHAPES.ROUNDED_SQUARE]: buildRoundedRectPolygon(0.16, 6),
  [ARENA_SHAPES.SPIRAL]: buildRoundedRectPolygon(0.06, 4),
  [ARENA_SHAPES.CLOVER]: buildCloverPolygon(0.32, 0.17, 72),
  [ARENA_SHAPES.GEAR]: buildGearPolygon(10, 0.5, 0.32),
  [ARENA_SHAPES.CRESCENT]: buildCrescentPolygon(),
};

const polygonToClipPath = (poly: [number, number][]): string =>
  `polygon(${poly.map(([x, y]) => `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`).join(", ")})`;
const polygonToSvgPoints = (poly: [number, number][]): string =>
  poly.map(([x, y]) => `${(x * 100).toFixed(2)},${(y * 100).toFixed(2)}`).join(" ");

const ARENA_SHAPE_INFO: { [key in ArenaShape]: { name: string; description: string } } = {
  [ARENA_SHAPES.SQUARE]: { name: "Square", description: "The classic. Balanced and simple." },
  [ARENA_SHAPES.RECTANGLE]: { name: "Rectangle", description: "Wider space, more room to dodge." },
  [ARENA_SHAPES.CIRCLE]: { name: "Circle", description: "No corners. Pure skill." },
  [ARENA_SHAPES.OVAL]: { name: "Oval", description: "Similar to circle but wider." },
  [ARENA_SHAPES.TRIANGLE]: { name: "Triangle", description: "Tight space. High intensity." },
  [ARENA_SHAPES.PENTAGON]: { name: "Pentagon", description: "A unique 5-sided challenge." },
  [ARENA_SHAPES.HEXAGON]: { name: "Hexagon", description: "Smooth flow with 6 sides." },
  [ARENA_SHAPES.OCTAGON]: { name: "Octagon", description: "A classic combat shape." },
  [ARENA_SHAPES.DIAMOND]: { name: "Diamond", description: "Fast-paced and dynamic." },
  [ARENA_SHAPES.STAR]: { name: "Star", description: "Stylish and unpredictable." },
  [ARENA_SHAPES.CROSS]: { name: "Cross", description: "Fight across multiple lanes." },
  [ARENA_SHAPES.HEART]: { name: "Heart", description: "For a fun and unique twist." },
  [ARENA_SHAPES.TRAPEZOID]: { name: "Trapezoid", description: "Angles add a new challenge." },
  [ARENA_SHAPES.PARALLELOGRAM]: { name: "Parallelogram", description: "A tilted battleground." },
  [ARENA_SHAPES.HEXAGRAM]: { name: "Hexagram", description: "Complex and exciting." },
  [ARENA_SHAPES.CRESCENT]: { name: "Crescent", description: "Open and tactical." },
  [ARENA_SHAPES.RING]: { name: "Ring", description: "Fight around the center." },
  [ARENA_SHAPES.ROUNDED_SQUARE]: { name: "Rounded Square", description: "Classic with smooth edges." },
  [ARENA_SHAPES.CAPSULE]: { name: "Capsule", description: "Sleek and modern." },
  [ARENA_SHAPES.HOURGLASS]: { name: "Hourglass", description: "Narrow middle, high tension." },
  [ARENA_SHAPES.BOWTIE]: { name: "Bowtie", description: "Unique and unpredictable." },
  [ARENA_SHAPES.CLOVER]: { name: "Clover", description: "A playful arena shape." },
  [ARENA_SHAPES.GEAR]: { name: "Gear", description: "Obstacle-style edges." },
  [ARENA_SHAPES.SHIELD]: { name: "Shield", description: "Defend your ground." },
  [ARENA_SHAPES.SPIRAL]: { name: "Spiral", description: "Rounded rectangle shape." },
  [ARENA_SHAPES.FUNNEL]: { name: "Funnel", description: "Wide top, narrow bottom." },
  [ARENA_SHAPES.WAVE]: { name: "Wave", description: "Wavy boundaries." },
};

// ============================================================================
// ARENA THEMES (spec section 2) — visual appearance only, never gameplay stats.
// Each theme supplies a neon glow palette [primary, secondary], a CSS background
// for the playfield surface, and an inner fill tint. Backgrounds are pure CSS
// (gradients) so they stay performant and self-contained.
// ============================================================================
type ArenaThemeDef = {
  key: string;
  name: string;
  description: string;
  glow: [string, string];
  background: string;
  inside: string;
};
export const ARENA_THEMES: ArenaThemeDef[] = [
  {
    key: "galaxy", name: "Galaxy Core",
    description: "A cosmic battlefield with drifting nebula energy.",
    glow: ["#a855f7", "#4263ff"],
    background:
      "radial-gradient(120% 120% at 30% 20%, rgba(124,77,255,0.55), rgba(20,12,48,0) 55%)," +
      "radial-gradient(120% 120% at 75% 80%, rgba(0,150,255,0.45), rgba(10,8,30,0) 55%)," +
      "radial-gradient(circle at 60% 40%, rgba(255,60,172,0.25), rgba(0,0,0,0) 45%)," +
      "linear-gradient(160deg, #120a2e, #0a0820 70%, #05040f)",
    inside: "#0c0722",
  },
  {
    key: "frozen", name: "Frozen Crystal",
    description: "Slippery ice, glowing crystals, and a cold, premium feel.",
    glow: ["#7ee8ff", "#2f6bff"],
    background:
      "radial-gradient(120% 120% at 25% 15%, rgba(120,220,255,0.4), rgba(10,25,45,0) 55%)," +
      "linear-gradient(160deg, #0e2740, #0a2036 70%, #06131f)",
    inside: "#0b2135",
  },
  {
    key: "volcanic", name: "Volcanic Rift",
    description: "Molten edges, lava cracks, and intense heat effects.",
    glow: ["#ff5a2c", "#ffb62c"],
    background:
      "radial-gradient(120% 120% at 50% 100%, rgba(255, 90, 20, 0.36), rgba(30,8,4,0) 55%)," +
      "linear-gradient(160deg, #23100a, #1a0b07 70%, #0d0503)",
    inside: "#1a0b06",
  },
  {
    key: "grass", name: "Grass Field",
    description: "Fresh green grass with a clean white border.",
    glow: ["#7CFC66", "#22c55e"],
    background: "linear-gradient(160deg, #1f5f2a, #17491f 70%, #0f3315)",
    inside: "#164a1e",
  },
  {
    key: "industrial", name: "Industrial Zone",
    description: "Grey metal panels with yellow/black hazard accents.",
    glow: ["#ffd21f", "#7a7a7a"],
    background:
      "repeating-linear-gradient(45deg, rgba(255,210,31,0.05) 0 22px, rgba(0,0,0,0) 22px 44px)," +
      "linear-gradient(160deg, #2b2d31, #212327 70%, #17181b)",
    inside: "#212327",
  },
  {
    key: "desert", name: "Desert Arena",
    description: "Warm sand-colored floor under an open sky.",
    glow: ["#ffd58a", "#e0a044"],
    background: "linear-gradient(160deg, #a97a45ab, #8a613699 70%, #6b4a28ab)",
    inside: "#8a6136c0",
  },
  {
    key: "ice", name: "Ice Arena",
    description: "Light-blue cracked ice, crisp and bright.",
    glow: ["#bfe9ff", "#6fb7ff"],
    background: "linear-gradient(160deg, #cfe8f7, #a9d3ec 70%, #86bce0)",
    inside: "#bcdcf0",
  },
  {
    key: "space", name: "Space Arena",
    description: "Minimal dark space with distant stars.",
    glow: ["#8ab4ff", "#4263ff"],
    background:
      "radial-gradient(1px 1px at 20% 30%, #fff, rgba(0,0,0,0) 60%)," +
      "radial-gradient(1px 1px at 70% 60%, #cfe0ff, rgba(0,0,0,0) 60%)," +
      "radial-gradient(1px 1px at 45% 80%, #fff, rgba(0,0,0,0) 60%)," +
      "linear-gradient(160deg, #0a0e1a, #070912 70%, #04050c)",
    inside: "#070912",
  },
  {
    key: "wooden", name: "Wooden Deck",
    description: "Warm wooden planks underfoot.",
    glow: ["#e0a86b", "#a9743c"],
    background:
      "repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0 2px, rgba(0,0,0,0) 2px 90px)," +
      "linear-gradient(160deg, #7a4f2a, #6b4423 70%, #55351b)",
    inside: "#6b4423",
  },
  {
    key: "neon", name: "Neon Grid",
    description: "Dark futuristic grid with electric lines.",
    glow: ["#00f5ff", "#ff3cac"],
    background:
      "repeating-linear-gradient(0deg, rgba(0,245,255,0.08) 0 1px, rgba(0,0,0,0) 1px 40px)," +
      "repeating-linear-gradient(90deg, rgba(0,245,255,0.08) 0 1px, rgba(0,0,0,0) 1px 40px)," +
      "linear-gradient(160deg, #0a0f1e, #070b16 70%, #04060e)",
    inside: "#070b16",
  },
  {
    key: "minimal", name: "Minimal",
    description: "Plain, quiet surface with almost no effects.",
    glow: ["#c8c8c8", "#8a8a8a"],
    background: "linear-gradient(160deg, #2a2a2e, #232327 70%, #1c1c1f)",
    inside: "#232327",
  },
  {
    key: "classic_blue", name: "Classic Blue",
    description: "Simple blue background with a white border.",
    glow: ["#4aa3ff", "#2f6bff"],
    background: "linear-gradient(160deg, #16335e, #112a4e 70%, #0b1c36)",
    inside: "#112a4e",
  },
  // ---- Plain solid-colour backgrounds (no uploaded image; CSS-only). ----
  {
    key: "plain_red", name: "Crimson Red",
    description: "A bold solid red backdrop, minimal and clean.",
    glow: ["#ff4d4d", "#ff8a8a"],
    background: "linear-gradient(160deg, #7a1414, #5c0f0f 70%, #3d0a0a)",
    inside: "#4a0f0f",
  },
  {
    key: "plain_blue", name: "Royal Blue",
    description: "A bold solid blue backdrop, minimal and clean.",
    glow: ["#3b82f6", "#60a5fa"],
    background: "linear-gradient(160deg, #0f2a66, #0b2050 70%, #071536)",
    inside: "#0b2050",
  },
  {
    key: "plain_green", name: "Emerald Green",
    description: "A bold solid green backdrop, minimal and clean.",
    glow: ["#22c55e", "#4ade80"],
    background: "linear-gradient(160deg, #0f5c33, #0b4526 70%, #072e19)",
    inside: "#0b4526",
  },
  {
    key: "plain_purple", name: "Royal Purple",
    description: "A bold solid purple backdrop, minimal and clean.",
    glow: ["#a855f7", "#c084fc"],
    background: "linear-gradient(160deg, #4c1d7a, #3a155c 70%, #260d3d)",
    inside: "#3a155c",
  },
  {
    key: "plain_black", name: "Jet Black",
    description: "Pure black backdrop for maximum contrast.",
    glow: ["#ffffff", "#9ca3af"],
    background: "linear-gradient(160deg, #141414, #0c0c0c 70%, #050505)",
    inside: "#0c0c0c",
  },
  {
    key: "plain_white", name: "Pure White",
    description: "Bright white backdrop with sharp dark accents.",
    glow: ["#e5e7eb", "#9ca3af"],
    background: "linear-gradient(160deg, #e9ecef, #d8dce1 70%, #c3c9d1)",
    inside: "#d8dce1",
  },
];
const ARENA_THEME_MAP: { [key: string]: ArenaThemeDef } = Object.fromEntries(ARENA_THEMES.map((t) => [t.key, t]));
const DEFAULT_ARENA_THEME = "galaxy";
// Convert a #rrggbb hex to an rgba() string (used to derive themed outer glow).
const hexToRgba = (hex: string, alpha: number): string => {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
// Builds the page background behind + around the arena so the selected theme
// extends OUTSIDE the shape (matching the board look in the reference art), with
// a soft themed glow pooling toward the arena. Visual only.
const buildArenaOuterBackground = (theme: ArenaThemeDef): string =>
  `radial-gradient(55% 60% at 42% 50%, ${hexToRgba(theme.glow[0], 0.18)} 0%, rgba(0,0,0,0) 60%),` +
  `radial-gradient(85% 90% at 42% 50%, ${hexToRgba(theme.glow[1], 0.12)} 0%, rgba(0,0,0,0) 72%)`;

let nextBubbleId = 1;
let nextProjectileId = Date.now(); // Start with timestamp to ensure uniqueness across renders
// Keep bursts visually impressive without allowing a single multi-shot setting to
// monopolise the animation frame. Older shots are discarded first.
const MAX_ACTIVE_PROJECTILES = 96;

type Projectile = { 
  id: number; 
  x: number; 
  y: number; 
  vx: number; 
  vy: number; 
  type: keyof typeof SUPER_BUBBLE_TYPES;
  fromBubbleId?: number; // Track which bubble fired this (for normal bubble powers)
  fromSuperbubble?: boolean; // Track if fired by superbubble
  createdAt?: number; // Timestamp to prevent immortal projectiles
};

const getPowerMotion = (type: keyof typeof SUPER_BUBBLE_TYPES) => {
  const name = String(type);
  if (/laser|beam|ray|chidori|lightning|dodon|thunder|vision/.test(name)) return "power-flicker";
  if (/bomb|grenade|spirit|pulse|shockwave|smash|blast|cannon|flare/.test(name)) return "power-pulse";
  if (/slash|sword|katana|kunai|shuriken|disk|blade|mjolnir/.test(name)) return "power-spin";
  if (/flame|lava|magma|phoenix|atomic|heat|acid/.test(name)) return "power-surge";
  return "power-float";
};

const appendProjectile = (projectiles: Projectile[], projectile: Projectile) => {
  const overflow = projectiles.length - MAX_ACTIVE_PROJECTILES + 1;
  if (overflow > 0) projectiles.splice(0, overflow);
  projectiles.push(projectile);
};

type PowerPickup = {
  id: number;
  x: number;
  y: number;
  type: keyof typeof SUPER_BUBBLE_TYPES;
  createdAt: number;
  expiresAt: number;
};

type BubblePower = {
  type: keyof typeof SUPER_BUBBLE_TYPES;
  expiresAt: number;
  lastShot: number;
};

type PowerAssignment = {
  bubbleId: number;
  type: keyof typeof SUPER_BUBBLE_TYPES;
  duration: number; // in seconds
};

// ============================================================================
// ARENA PICKUPS (spec section 4) — collectible objects that modify ONE bubble
// (the bubble that touches them). Default OFF; when OFF nothing spawns/renders.
// Effects are adapted to this autonomous-physics game: they apply per-bubble.
// ============================================================================
type ArenaPickupKind =
  | "health_kit" | "mega_health" | "shield" | "speed_boost" | "damage_boost"
  | "regeneration" | "magnet" | "impact_boost" | "second_chance" | "ghost_mode"
  | "poison" | "bomb" | "slow" | "weakness" | "reverse_controls" | "shrink"
  | "locked" | "bleed" | "stun" | "curse";

// Timed per-bubble status produced by a pickup (or later by zones/events).
type ArenaStatusType =
  | "speed_boost" | "damage_boost" | "regeneration" | "magnet" | "ghost"
  | "poison" | "slow" | "weakness" | "reverse" | "shrink" | "locked"
  | "bleed" | "stun";

type ArenaPickup = {
  id: number;
  x: number;
  y: number;
  kind: ArenaPickupKind;
  createdAt: number;
  expiresAt: number;
  vy?: number; // falling speed for event rain (health_rain/item_chaos); undefined = static
};

type ArenaStatus = {
  id: number;
  type: ArenaStatusType;
  startedAt: number;
  expiresAt: number;
  lastTick?: number;   // for HP-over-time effects
  origR?: number;      // for shrink: original radius to restore
  origTgt?: number;    // for shrink: original target radius to restore
};

const ARENA_PICKUP_RADIUS = 18;
type ArenaPickupMeta = { name: string; icon: string; good: boolean; color: string };
const ARENA_PICKUP_INFO: Record<ArenaPickupKind, ArenaPickupMeta> = {
  // GOOD (green/cyan)
  health_kit:       { name: "Health Kit",       icon: "❤️", good: true,  color: "#22c55e" },
  mega_health:      { name: "Mega Health",      icon: "💖", good: true,  color: "#10b981" },
  shield:           { name: "Shield",           icon: "🛡️", good: true,  color: "#38bdf8" },
  speed_boost:      { name: "Speed Boost",      icon: "⚡", good: true,  color: "#22d3ee" },
  damage_boost:     { name: "Damage Boost",     icon: "🔥", good: true,  color: "#f59e0b" },
  regeneration:     { name: "Regeneration",     icon: "💚", good: true,  color: "#34d399" },
  magnet:           { name: "Magnet",           icon: "🧲", good: true,  color: "#60a5fa" },
  impact_boost:     { name: "Impact Boost",     icon: "💥", good: true,  color: "#f472b6" },
  second_chance:    { name: "Second Chance",    icon: "👼", good: true,  color: "#a7f3d0" },
  ghost_mode:       { name: "Ghost Mode",       icon: "👻", good: true,  color: "#c4b5fd" },
  // BAD (red/magenta)
  poison:           { name: "Poison",           icon: "☠️", good: false, color: "#a855f7" },
  bomb:             { name: "Bomb",             icon: "💣", good: false, color: "#ef4444" },
  slow:             { name: "Slow",             icon: "🐌", good: false, color: "#f59e0b" },
  weakness:         { name: "Weakness",         icon: "🔻", good: false, color: "#fb7185" },
  reverse_controls: { name: "Reverse Controls", icon: "↔️", good: false, color: "#e879f9" },
  shrink:           { name: "Shrink",           icon: "↘️", good: false, color: "#f0abfc" },
  locked:           { name: "Locked",           icon: "🔒", good: false, color: "#94a3b8" },
  bleed:            { name: "Bleed",            icon: "🩸", good: false, color: "#dc2626" },
  stun:             { name: "Stun",             icon: "💫", good: false, color: "#fca5a5" },
  curse:            { name: "Curse",            icon: "🌀", good: false, color: "#d946ef" },
};
const ARENA_PICKUP_KINDS = Object.keys(ARENA_PICKUP_INFO) as ArenaPickupKind[];
const GOOD_PICKUP_KINDS = ARENA_PICKUP_KINDS.filter((k) => ARENA_PICKUP_INFO[k].good);
const BAD_PICKUP_KINDS = ARENA_PICKUP_KINDS.filter((k) => !ARENA_PICKUP_INFO[k].good);
// Curse resolves to exactly one of these on collection.
const CURSE_OUTCOMES: ArenaPickupKind[] = ["poison", "slow", "weakness", "reverse_controls", "shrink", "stun"];

// ============================================================================
// BLOCKADES (spec section 5) — physical objects with independent collision
// geometry. Default OFF. Two primitives only: axis-aligned rect and circle
// (a rotating bar is a rect resolved in its own rotated frame).
// ============================================================================
type ArenaBlockadeKind =
  | "stone" | "breakable" | "spike_block" | "bouncy_pad" | "moving_block"
  | "rotating_bar" | "conveyor" | "laser_wall" | "rotating_blade" | "energy_wall"
  | "invisible_wall" | "asteroid" | "moving_asteroid" | "vanishing_block"
  | "pusher" | "teleport_gate";

type ArenaBlockade = {
  id: number;
  kind: ArenaBlockadeKind;
  shape: "rect" | "circle";
  x: number; y: number;          // center
  w: number; h: number;          // rect half-extents are w/2, h/2
  r: number;                     // circle radius
  solid: boolean;                // blocks movement (false = field/hazard only)
  createdAt: number;
  expiresAt?: number;            // vanishing block / energy wall
  hp?: number;                   // breakable
  angle?: number;                // rotating bar / blade current rotation (rad)
  spin?: number;                 // rad per ms
  ax?: number; ay?: number;      // path endpoint A (moving kinds)
  bx?: number; by?: number;      // path endpoint B
  t?: number;                    // 0..1 position along path
  dir?: number;                  // +1 / -1 path direction
  pathSpeed?: number;            // t per ms
  fx?: number; fy?: number;      // conveyor / pusher force direction (unit)
  active?: boolean;              // laser wall pulsing state
  linkId?: number;               // teleport gate partner id
  fading?: boolean;              // vanishing block visual state
};

type ArenaBlockadeMeta = { name: string; icon: string; color: string; desc: string };
const ARENA_BLOCKADE_INFO: Record<ArenaBlockadeKind, ArenaBlockadeMeta> = {
  stone:          { name: "Stone Block",     icon: "🧱", color: "#94a3b8", desc: "Static solid, bounces bubbles" },
  breakable:      { name: "Breakable Block", icon: "📦", color: "#a8a29e", desc: "Solid with 3 HP, then shatters" },
  spike_block:    { name: "Spike",           icon: "🔺", color: "#ef4444", desc: "Contact damage on cooldown" },
  bouncy_pad:     { name: "Bouncy Pad",      icon: "🟢", color: "#22c55e", desc: "Launches bubbles outward" },
  moving_block:   { name: "Moving Block",    icon: "↔️", color: "#64748b", desc: "Solid block on a patrol path" },
  rotating_bar:   { name: "Rotating Bar",    icon: "🌀", color: "#60a5fa", desc: "Spinning solid bar" },
  conveyor:       { name: "Conveyor",        icon: "➡️", color: "#38bdf8", desc: "Pushes bubbles along a direction" },
  laser_wall:     { name: "Laser Wall",      icon: "⚡", color: "#f97316", desc: "Pulsing damage beam" },
  rotating_blade: { name: "Rotating Blade",  icon: "☸️", color: "#fb7185", desc: "Spinning hazard, damage + knockback" },
  energy_wall:    { name: "Energy Wall",     icon: "🟦", color: "#818cf8", desc: "Temporary solid wall" },
  invisible_wall: { name: "Invisible Wall",  icon: "👁️", color: "#cbd5e1", desc: "Solid but barely visible" },
  asteroid:       { name: "Asteroid",        icon: "🪨", color: "#a1a1aa", desc: "Static round obstacle" },
  moving_asteroid:{ name: "Moving Asteroid", icon: "☄️", color: "#d6d3d1", desc: "Drifting round obstacle" },
  vanishing_block:{ name: "Vanishing Block", icon: "⬛", color: "#71717a", desc: "Solid, then fades away" },
  pusher:         { name: "Pusher",          icon: "💨", color: "#22d3ee", desc: "Continuous directional force field" },
  teleport_gate:  { name: "Teleport Gate",   icon: "🌌", color: "#c084fc", desc: "Linked gates, enter A exit B" },
};
const ARENA_BLOCKADE_KINDS = Object.keys(ARENA_BLOCKADE_INFO) as ArenaBlockadeKind[];
const BLOCKADE_SPIKE_DAMAGE = 15;
const BLOCKADE_BLADE_DAMAGE = 10;
const BLOCKADE_LASER_DAMAGE = 8;
const BLOCKADE_CONTACT_COOLDOWN_MS = 500;
// Plain static/moving wall blockades render as a brick cluster instead of a
// colored box. Hazard kinds (spikes, blades, lasers, etc.) keep their icon.
const BLOCKADE_WALL_KINDS: ArenaBlockadeKind[] = [
  "stone", "breakable", "invisible_wall", "moving_block", "energy_wall", "vanishing_block",
];
// Sand-colored bricks for the softer/temporary wall kinds; red bricks otherwise.
const BLOCKADE_SAND_KINDS: ArenaBlockadeKind[] = ["breakable", "vanishing_block"];

// ============================================================================
// ZONES (spec section 6) — circular areas that apply effects while a bubble is
// inside. They never block movement. Default OFF.
// ============================================================================
type ArenaZoneKind =
  | "ice" | "fire" | "poison_zone" | "heal" | "speed_zone"
  | "gravity" | "wind" | "slow_zone" | "invisibility";

type ArenaZone = {
  id: number;
  kind: ArenaZoneKind;
  x: number; y: number;
  r: number;
  createdAt: number;
  expiresAt: number;
  fx?: number; fy?: number;   // wind direction (unit)
};

type ArenaZoneMeta = { name: string; icon: string; color: string; desc: string };
const ARENA_ZONE_INFO: Record<ArenaZoneKind, ArenaZoneMeta> = {
  ice:          { name: "Ice Zone",          icon: "🧊", color: "#7dd3fc", desc: "Slippery, bubbles slide" },
  fire:         { name: "Fire Zone",         icon: "🔥", color: "#f97316", desc: "-5 HP/sec inside" },
  poison_zone:  { name: "Poison Zone",       icon: "☠️", color: "#a855f7", desc: "-2 HP/sec and slower" },
  heal:         { name: "Heal Zone",         icon: "💚", color: "#22c55e", desc: "+3 HP/sec inside" },
  speed_zone:   { name: "Speed Zone",        icon: "⚡", color: "#22d3ee", desc: "Speed x1.5 inside" },
  gravity:      { name: "Gravity Zone",      icon: "🌑", color: "#8b5cf6", desc: "Pulls bubbles to its center" },
  wind:         { name: "Wind Zone",         icon: "🌬️", color: "#93c5fd", desc: "Continuous directional push" },
  slow_zone:    { name: "Slow Zone",         icon: "🐌", color: "#facc15", desc: "Speed x0.5 inside" },
  invisibility: { name: "Invisibility Zone", icon: "👁️", color: "#64748b", desc: "Bubbles fade, collision stays" },
};
const ARENA_ZONE_KINDS = Object.keys(ARENA_ZONE_INFO) as ArenaZoneKind[];

// ============================================================================
// EVENTS (spec section 7) — temporary global match changes. Default OFF.
// Each runs warning -> active -> end -> cleanup. Only one at a time.
// ============================================================================
type ArenaEventKind =
  | "health_rain" | "item_chaos" | "double_damage" | "low_gravity"
  | "shrinking_arena" | "reverse_arena" | "meteor_shower" | "random_modifier";

type ArenaEventState = {
  kind: ArenaEventKind;
  phase: "warning" | "active";
  startedAt: number;
  endsAt: number;
  label: string;          // shown in the banner (resolved modifier for Random)
  modifier?: string;      // chosen sub-modifier for random_modifier
};

type ArenaMeteor = { id: number; x: number; y: number; vx: number; vy: number; r: number };
// Decorative falling swords for the Double Damage event (no collision, visual only).
type ArenaSword = { id: number; x: number; y: number; vy: number; rot: number };

type ArenaEventMeta = { name: string; icon: string; color: string; durationMs: number; desc: string };
const ARENA_EVENT_INFO: Record<ArenaEventKind, ArenaEventMeta> = {
  health_rain:     { name: "Health Rain",     icon: "💗", color: "#22c55e", durationMs: 5000,  desc: "Health kits rain into the arena" },
  item_chaos:      { name: "Item Chaos",      icon: "🎲", color: "#f59e0b", durationMs: 5000,  desc: "Random good and bad pickups flood in" },
  double_damage:   { name: "Double Damage",   icon: "⚔️", color: "#ef4444", durationMs: 8000,  desc: "All collision damage x2" },
  low_gravity:     { name: "Low Gravity",     icon: "🎈", color: "#38bdf8", durationMs: 8000,  desc: "Movement becomes floaty" },
  shrinking_arena: { name: "Shrinking Arena", icon: "🔻", color: "#fb7185", durationMs: 10000, desc: "Playable boundary contracts" },
  reverse_arena:   { name: "Reverse Arena",   icon: "🔄", color: "#e879f9", durationMs: 8000,  desc: "Every bubble reverses direction" },
  meteor_shower:   { name: "Meteor Shower",   icon: "☄️", color: "#f97316", durationMs: 6000,  desc: "Falling meteors damage on contact" },
  random_modifier: { name: "Random Modifier", icon: "❓", color: "#facc15", durationMs: 8000,  desc: "One random modifier is chosen" },
};
const ARENA_EVENT_KINDS = Object.keys(ARENA_EVENT_INFO) as ArenaEventKind[];
const EVENT_WARNING_MS = 1500;
const RANDOM_MODIFIER_CHOICES = ["double_damage", "low_gravity", "speed_boost", "slow", "reverse_controls", "pickup_frenzy"] as const;

// Shared control-bar widgets for the four modifier systems (spec section 11).
function SegRow<T extends string | number>({ label, value, options, onPick, accent }: {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onPick: (v: T) => void;
  accent: string;
}) {
  return (
    <div>
      <div style={{ color: "#ccc", fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", gap: 6 }}>
        {options.map(([val, text]) => (
          <button key={String(val)} onClick={() => onPick(val)}
            style={{
              flex: 1, padding: "6px 2px", fontSize: 10,
              borderRadius: 6, cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)",
              background: value === val ? accent : "rgba(255,255,255,0.06)",
              color: value === val ? "#06210f" : "#ccc", fontWeight: 700,
            }}>{text}</button>
        ))}
      </div>
    </div>
  );
}

// Uniform icon-only toggle grid — no names/descriptions, hover title for identification.
function ItemChips<K extends string>({ label, kinds, info, selected, onToggle, onAll, onNone }: {
  label: string;
  kinds: readonly K[];
  info: Record<K, { name: string; icon: string; color: string }>;
  selected: Set<K>;
  onToggle: (k: K) => void;
  onAll: () => void;
  onNone: () => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ color: "#ccc", fontSize: 11 }}>{label}</span>
        <span style={{ display: "flex", gap: 6 }}>
          <button onClick={onAll} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#ccc" }}>All</button>
          <button onClick={onNone} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#ccc" }}>None</button>
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(34px, 1fr))", gap: 5 }}>
        {kinds.map((k) => {
          const meta = info[k];
          const on = selected.has(k);
          return (
            <button key={k} title={meta.name} onClick={() => onToggle(k)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 34, height: 30, fontSize: 15, borderRadius: 6, cursor: "pointer",
                border: `1px solid ${on ? meta.color : "rgba(255,255,255,0.12)"}`,
                background: on ? `${meta.color}22` : "rgba(255,255,255,0.04)",
                opacity: on ? 1 : 0.55,
              }}>
              {meta.icon}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const MODE_OPTIONS = [["auto", "Random / Auto"], ["custom", "Custom"]] as const;
const FREQ_OPTIONS = [["low", "Low"], ["medium", "Medium"], ["high", "High"]] as const;
const DURATION_OPTIONS = [[0, "Auto"], [3, "3s"], [5, "5s"], [8, "8s"], [12, "12s"]] as const;

// Short badge derived from a power name (no per-power icon data exists) — keeps
// the grid uniform/aligned instead of variable-width full-name buttons.
const powerBadge = (name: string): string => name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

// Uniform icon-badge toggle grid for power catalogues — replaces variable-width
// full-name buttons that caused misaligned rows.
function PowerChips({ powerKey, active, onToggle, accent }: {
  powerKey: keyof typeof SUPER_BUBBLE_TYPES; active: boolean; onToggle: () => void; accent: string;
}) {
  const power = SUPER_BUBBLE_TYPES[powerKey];
  return (
    <button key={powerKey} title={`${power.name} \u00b7 ${power.damage} dmg`} onClick={onToggle}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 34, height: 30, fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: "pointer",
        border: `1px solid ${active ? accent : "rgba(255,255,255,0.12)"}`,
        background: active ? `${accent}33` : "rgba(255,255,255,0.04)",
        color: active ? "#fff" : "#888", opacity: active ? 1 : 0.55,
      }}>
      {powerBadge(power.name)}
    </button>
  );
}



/* ---------- Helpers ---------- */

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const dist2 = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
};
const dist = (x1: number, y1: number, x2: number, y2: number) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy) || 0.0001;
};

const getRadiusForCount = (count: number) => {
  if (count <= 5) return 19;
  if (count <= 10) return 17;
  if (count <= 50) return 15;
  if (count <= 100) return 14;
  if (count <= 500) return 12;
  if (count <= 1000) return 11;
  if (count <= 2000) return 10;
  if (count <= 4000) return 9;
  if (count <= 5000) return 8;
  if (count <= 6000) return 7.5;
  if (count <= 7000) return 7;
  if (count <= 9000) return 6;
  if (count <= 10000) return 3;
  if (count <= 50000) return 2;
  if (count <= 100000) return 1.5;
  return 1;
};

const IMAGE_SHOW_RADIUS = 9;
const REVEAL_THRESHOLD = 7000;
const IMAGE_DECODE_CONCURRENCY = 2;
const AVATAR_SPRITE_SRC = "/css/images/bubblebash-avatars.png";
const ARENA_GLOW_PALETTES = [
  ["#ff3156", "#ff8a3d"],
  ["#00d9ff", "#4263ff"],
  ["#a855f7", "#ff3cac"],
  ["#00f5a0", "#00d9ff"],
  ["#ffd166", "#ff6b35"],
];

const BUCKET_SIZES = [8, 11, 13, 15, 20, 27, 30, 40, 64];
const REVEAL_BATCH_PER_TICK = 120;
const MASKED_CACHE_PIXEL_SOFT_LIMIT = 140 * 1024 * 1024;

const separatePair = (ax: number, ay: number, ar: number, bx: number, by: number, br: number) => {
  const dx = bx - ax;
  const dy = by - ay;
  const d = Math.sqrt(dx * dx + dy * dy) || 0.0001;
  const overlap = ar + br - d;
  if (overlap > 0) {
    const ux = dx / d;
    const uy = dy / d;
    return {
      ax: ax - ux * (overlap / 2),
      ay: ay - uy * (overlap / 2),
      bx: bx + ux * (overlap / 2),
      by: by + uy * (overlap / 2),
    };
  }
  return { ax, ay, bx, by };
};

const bouncePairVel = (avx: number, avy: number, bvx: number, bvy: number, ax: number, ay: number, bx: number, by: number) => {
  const vx = avx - bvx;
  const vy = avy - bvy;
  const dx = ax - bx;
  const dy = ay - by;
  const d2 = dx * dx + dy * dy;
  if (d2 === 0) return { avx, avy, bvx, bvy };
  const dot = vx * dx + vy * dy;
  if (dot > 0) return { avx, avy, bvx, bvy };
  const collisionScale = dot / d2;
  const cx = dx * collisionScale;
  const cy = dy * collisionScale;
  avx = avx - cx;
  avy = avy - cy;
  bvx = bvx + cx;
  bvy = bvy + cy;
  // do not apply additional damping here - keep collision energy consistent
  // small, explicit damping was removed because it caused noticeable slowdowns over time
  // (previously: multiply velocities by 0.98)
  return { avx, avy, bvx, bvy };
};

/* ---------- New growth animation constants ---------- */

const INITIAL_RADIUS = 3; // tiny circular placeholder
const GROW_DURATION_MS = 700; // time to grow from INITIAL_RADIUS to target

/* ---------- Superbubble collision cooldown ---------- */

const SB_COLLISION_COOLDOWN_MS = 120; // each normal only takes damage from superbubble at this interval

/* ---------- Component ---------- */

const ArenaPage: React.FC = () => {
  const speed = 3;
  const [searchParams] = useSearchParams();
  const matchQuery = searchParams.toString();
  const requestedMode = searchParams.get("mode");
  const customRosterRequested = searchParams.get("roster") === "custom";
  const requestedArenaType = requestedMode === "boss" ? ARENA_TYPES.BOSS : requestedMode === "duel" || requestedMode === "many" ? ARENA_TYPES.BRAWL : requestedMode === "normal" ? ARENA_TYPES.NORMAL : null;
  const requestedShape = searchParams.get("shape") as ArenaShape | null;
  const initialArenaShape = requestedShape && Object.values(ARENA_SHAPES).includes(requestedShape) ? requestedShape : ARENA_SHAPES.RECTANGLE;
  const requestedTheme = searchParams.get("theme");
  const initialArenaTheme = requestedTheme && ARENA_THEME_MAP[requestedTheme] ? requestedTheme : DEFAULT_ARENA_THEME;

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const [arenaFrame, setArenaFrame] = useState<React.CSSProperties>({ top: 0, left: 0, width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const leaderboardRef = useRef<HTMLDivElement | null>(null);
  const imageListRef = useRef<string[]>([]);
  const bossImgRef = useRef<string>("");

  const [arenaType, setArenaType] = useState<string | null>(requestedArenaType);
  const [arenaTypeSelected, setArenaTypeSelected] = useState(Boolean(requestedArenaType));
  const [arenaShape, setArenaShape] = useState<ArenaShape>(initialArenaShape);
  const [arenaTheme, setArenaTheme] = useState<string>(initialArenaTheme);
  const [arenaReady, setArenaReady] = useState(Boolean(requestedShape)); // tracks when arena setup is complete

  useLayoutEffect(() => {
    const arena = arenaRef.current;
    if (!arena) return;
    const updateArenaFrame = () => {
      const rect = arena.getBoundingClientRect();
      setArenaFrame({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    };
    updateArenaFrame();
    const observer = new ResizeObserver(updateArenaFrame);
    observer.observe(arena);
    window.addEventListener("resize", updateArenaFrame);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateArenaFrame);
    };
  }, [arenaShape, arenaReady]);
  const [isRunning, setIsRunning] = useState(false);
  const gameStartTimeRef = useRef<number>(0); // Track when game started

  const [uiBubblesSnapshot, setUiBubblesSnapshot] = useState<BubbleData[]>([]);
  const [superBubbleSnapshot, setSuperBubbleSnapshot] = useState<BubbleData | null>(null);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const projectilesRef = useRef<Projectile[]>([]); // Ref for game loop

  const [winner, setWinner] = useState<BubbleData | null>(null);
  const [winnersList, setWinnersList] = useState<BubbleData[] | null>(null);
  const [winnersImages, setWinnersImages] = useState<string[] | null>(null);
  const [eliminatedSide, setEliminatedSide] = useState<"boss" | "heroes" | null>(null);
  const gameEndedRef = useRef(false);

  useEffect(() => {
    if (!winner && !winnersList && !winnersImages) return;
    gameEndedRef.current = true;
    countRef.current = 0;
    projectilesRef.current = [];
    setProjectiles([]);
  }, [winner, winnersList, winnersImages]);

  const [spikeEnabled, setSpikeEnabled] = useState(false);
  const [spikeCount, setSpikeCount] = useState(1);
  const [spikeSize, setSpikeSize] = useState(30);
  const [spikePositions, setSpikePositions] = useState<Omit<Spike, "size">[]>([]);
  const [spikeAutoEnableTime, setSpikeAutoEnableTime] = useState(0); // seconds, 0 = disabled
  const [spikeActiveDuration, setSpikeActiveDuration] = useState(0); // seconds, 0 = forever
  const spikeAutoEnabledRef = useRef(false);
  const spikeEnabledAtRef = useRef<number>(0); // timestamp when spikes were enabled
  
  // Rotating Blade Configuration
  const [bladeEnabled, setBladeEnabled] = useState(false);
  const [bladeAutoEnableTime, setBladeAutoEnableTime] = useState(0); // seconds, 0 = start immediately
  const [bladeActiveDuration, setBladeActiveDuration] = useState(0); // seconds, 0 = forever
  const bladeAutoEnabledRef = useRef(false);
  const bladeEnabledAtRef = useRef<number>(0); // timestamp when blades were enabled
  const [bladeAssignments, setBladeAssignments] = useState<Set<number>>(new Set()); // Which bubble IDs have blades
  const bladeAssignmentsRef = useRef<Set<number>>(new Set()); // Ref for game loop to access current blade assignments
  const bladeRotationRef = useRef<number>(0); // Current blade rotation angle
  
  // Animation states
  const [showSpikeAnimation, setShowSpikeAnimation] = useState(false);
  const [showPowerAnimation, setShowPowerAnimation] = useState(false);
  const [showBladeAnimation, setShowBladeAnimation] = useState(false);
  const [showArenaIntroAnimation, setShowArenaIntroAnimation] = useState(false);
  const [showBossPowerAnimation, setShowBossPowerAnimation] = useState(false);
  const animationPauseRef = useRef(false);
  const animationPauseStartRef = useRef<number | null>(null);
  const spikeAnimationShownRef = useRef(false); // Track if animation was already shown
  const bladeAnimationShownRef = useRef(false); // Track if animation was already shown
  const bossPowerAnimationShownRef = useRef(false); // Track if boss power animation was already shown

  const [speedMultiplier, setSpeedMultiplier] = useState(1.5);
  const [controlsOpen, setControlsOpen] = useState(true);
  const [pageBackgroundColor, setPageBackgroundColor] = useState('#111111');
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState('#1a1a1a');
  const [arenaInsideColor, setArenaInsideColor] = useState('#0d0d0d');
  // Neon edge palette follows the selected theme (visual only, no gameplay effect).
  const activeArenaTheme = ARENA_THEME_MAP[arenaTheme] || ARENA_THEME_MAP[DEFAULT_ARENA_THEME];
  const arenaGlowPalette = activeArenaTheme.glow;
  // Themed background for the whole page so the theme extends outside the arena too.
  const arenaOuterBackground = buildArenaOuterBackground(activeArenaTheme);
  // Uploaded theme background image (matches the selection-flow preview for continuity).
  const activeThemeBgImage = ARENA_THEME_IMAGES[activeArenaTheme.key];

  const [superpowerEnabled, setSuperpowerEnabled] = useState(false);
  const [superpowerAutoEnableTime, setSuperpowerAutoEnableTime] = useState(0); // seconds, 0 = start immediately
  const [superpowerActiveDuration, setSuperpowerActiveDuration] = useState(0); // seconds, 0 = forever
  const superpowerAutoEnabledRef = useRef(false);
  const superpowerEnabledAtRef = useRef<number>(0);
  const [selectedPowers, setSelectedPowers] = useState<{ [k in keyof typeof SUPER_BUBBLE_TYPES]?: boolean }>({
    // Classic Weapons
    // missile: true,
    // bomb: true,
    // drone: true,
    // rocket: true,
    // grenade: true,
    // laser: true,
    // plasma: true,
    // emp_pulse: false,
    // flamethrower: true,
    // sonic_boom: false,
    // shockwave: false,
    // acid_spray: false,
    // Original
    shuriken: true,
  });
  const [firingMode, setFiringMode] = useState<"auto" | "manual">("auto");
  const autoFireRef = useRef<number | null>(null);
  const [projectileSpeedPerTick, setProjectileSpeedPerTick] = useState<number>(6);
  const [superbubbleProjectileCount, setSuperbubbleProjectileCount] = useState<number>(1); // 1 for single, >1 for multiple
  const [superbubblePowerMode, setSuperbubblePowerMode] = useState<"random" | "same">("random"); // random = different power per projectile, same = same power for all
  
  // Player Bubble Shooting (Boss Arena)
  const [playerBubblesFiringMode, setPlayerBubblesFiringMode] = useState<"auto" | "manual">("auto");
  const [playerBubblesAutoFire, setPlayerBubblesAutoFire] = useState<boolean>(false);
  const [playerBubblesProjectileSpeed, setPlayerBubblesProjectileSpeed] = useState<number>(4);
  const [playerBubblesProjectileCount, setPlayerBubblesProjectileCount] = useState<number>(1);
  const [playerBubblesPowerMode, setPlayerBubblesPowerMode] = useState<"random" | "same">("random");
  
  // Brawl Bubble Shooting
  const [brawlBubblesFiringMode, setBrawlBubblesFiringMode] = useState<"auto" | "manual">("auto");
  const [brawlBubblesAutoFire, setBrawlBubblesAutoFire] = useState<boolean>(false);
  const [brawlBubblesProjectileSpeed, setBrawlBubblesProjectileSpeed] = useState<number>(4);
  const [brawlBubblesProjectileCount, setBrawlBubblesProjectileCount] = useState<number>(1);
  const [brawlBubblesPowerMode, setBrawlBubblesPowerMode] = useState<"random" | "same">("random");
  
  const [muzzleFlashes, setMuzzleFlashes] = useState<{ id: number; x: number; y: number; createdAt: number }[]>([]);
  const [hitEffects, setHitEffects] = useState<{ id: number; x: number; y: number; createdAt: number }[]>([]);
  const [bladeSparkEffects, setBladeSparkEffects] = useState<{ id: number; x: number; y: number; createdAt: number }[]>([]);
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    speed: false,
    spikes: false,
    blades: false,
    damage: false,
    colors: false,
    shapes: false,
    superpowers: false,
    playerPowers: false,
    brawlPowers: false,
    health: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // Player Powers Feature (Boss Arena only)
  const [playerPowersEnabled, setPlayerPowersEnabled] = useState(false);
  const [playerPowerMode, setPlayerPowerMode] = useState<"pickup" | "preassigned">("pickup");
  const [playerPowersAutoEnableTime, setPlayerPowersAutoEnableTime] = useState(0); // seconds, 0 = disabled
  const playerPowersAutoEnabledRef = useRef(false);
  const [selectedPlayerPowers, setSelectedPlayerPowers] = useState<{ [k in keyof typeof SUPER_BUBBLE_TYPES]?: boolean }>({
    // Classic Weapons
    // missile: true,
    // bomb: true,
    // drone: true,
    // rocket: true,
    // grenade: true,
    // laser: true,
    // plasma: true,
    // Original
    // flame: true,
    // arrow: true,
    // bullet: true,
    // kunai: true,
    shuriken: true,
    // katana: true,
    // energy_blast: true,
    // ice_shard: true,
  });
  const [powerPickups, setPowerPickups] = useState<PowerPickup[]>([]);
  const playerPowersEnabledRef = useRef(false); // Ref to avoid re-running game loop on toggle
  const [normalPowersEnabled, setNormalPowersEnabled] = useState(false);
  const normalPowersEnabledRef = useRef(false);
  const [selectedNormalPowers, setSelectedNormalPowers] = useState<{ [k in keyof typeof SUPER_BUBBLE_TYPES]?: boolean }>({ shuriken: true });
  const [normalPowerDamages, setNormalPowerDamages] = useState<{ [k: string]: number }>({ shuriken: 7 });
  const powerPickupsRef = useRef<PowerPickup[]>([]); // Ref for game loop

  // When any overlay animation is shown we want to pause game time and resume
  // after the last animation finishes. This effect centralizes pause tracking
  // and shifts all relevant timestamps so timers resume from where they left off.
  useEffect(() => {
    const anyShown = showSpikeAnimation || showBladeAnimation || showPowerAnimation || showArenaIntroAnimation || showBossPowerAnimation;
    if (anyShown && animationPauseStartRef.current == null) {
      // start pause
      animationPauseStartRef.current = Date.now();
      animationPauseRef.current = true;
    } else if (!anyShown && animationPauseStartRef.current != null) {
      // resume: compute paused duration and shift time refs
      const pausedFor = Date.now() - animationPauseStartRef.current;
      animationPauseStartRef.current = null;
      animationPauseRef.current = false;

      // Shift primary time anchors so timers continue from the paused point
      if (gameStartTimeRef.current > 0) gameStartTimeRef.current += pausedFor;
      if (spikeEnabledAtRef.current > 0) spikeEnabledAtRef.current += pausedFor;
      if (bladeEnabledAtRef.current > 0) bladeEnabledAtRef.current += pausedFor;
      if (lastPickupSpawnRef.current > 0) lastPickupSpawnRef.current += pausedFor;

      // also shift any effect timestamps so their remaining lifetimes aren't shortened
      setMuzzleFlashes((arr) => arr.map(a => ({ ...a, createdAt: a.createdAt + pausedFor })));
      setHitEffects((arr) => arr.map(a => ({ ...a, createdAt: a.createdAt + pausedFor })));
      setBladeSparkEffects((arr) => arr.map(a => ({ ...a, createdAt: a.createdAt + pausedFor })));
    }
  // Intentionally depend only on the overlay booleans
  }, [showSpikeAnimation, showBladeAnimation, showPowerAnimation, showArenaIntroAnimation, showBossPowerAnimation]);
  const [bubblePowers, setBubblePowers] = useState<Map<number, BubblePower>>(new Map());
  const [powerAssignments, setPowerAssignments] = useState<PowerAssignment[]>([]);
  const bubblePowersRef = useRef<Map<number, BubblePower>>(new Map());
  const lastPickupSpawnRef = useRef<number>(0);
  const preAssignedAppliedRef = useRef<boolean>(false);

  // ===== Arena Pickups (spec section 4) — default OFF =====
  const [pickupsEnabled, setPickupsEnabled] = useState(false);
  const pickupsEnabledRef = useRef(false);
  useEffect(() => { pickupsEnabledRef.current = pickupsEnabled; }, [pickupsEnabled]);
  const [pickupFrequency, setPickupFrequency] = useState<"low" | "medium" | "high">("medium");
  const [pickupMax, setPickupMax] = useState<number>(3);
  const [pickupRatio, setPickupRatio] = useState<"good" | "balanced" | "bad">("balanced");
  const pickupFrequencyRef = useRef(pickupFrequency);
  const pickupMaxRef = useRef(pickupMax);
  const pickupRatioRef = useRef(pickupRatio);
  useEffect(() => { pickupFrequencyRef.current = pickupFrequency; }, [pickupFrequency]);
  useEffect(() => { pickupMaxRef.current = pickupMax; }, [pickupMax]);
  useEffect(() => { pickupRatioRef.current = pickupRatio; }, [pickupRatio]);
  const [arenaPickups, setArenaPickups] = useState<ArenaPickup[]>([]);
  const arenaPickupsRef = useRef<ArenaPickup[]>([]);
  const lastArenaPickupSpawnRef = useRef<number>(0);
  // Granular control (spec §11): "auto" = random pool as before; "custom" = user picks
  // exactly which kinds spawn and (optionally) a fixed effect duration in seconds.
  const [pickupMode, setPickupMode] = useState<"auto" | "custom">("auto");
  const [pickupSelected, setPickupSelected] = useState<Set<ArenaPickupKind>>(() => new Set(ARENA_PICKUP_KINDS));
  const [pickupDurationSec, setPickupDurationSec] = useState<number>(0); // 0 = auto (use each effect's default)
  const pickupModeRef = useRef(pickupMode);
  const pickupSelectedRef = useRef(pickupSelected);
  const pickupDurationOverrideRef = useRef(0); // ms; 0 = no override
  useEffect(() => { pickupModeRef.current = pickupMode; }, [pickupMode]);
  useEffect(() => { pickupSelectedRef.current = pickupSelected; }, [pickupSelected]);
  useEffect(() => { pickupDurationOverrideRef.current = pickupDurationSec > 0 ? pickupDurationSec * 1000 : 0; }, [pickupDurationSec]);

  // ===== Blockades (spec section 5) — default OFF =====
  const [blockadesEnabled, setBlockadesEnabled] = useState(false);
  const blockadesEnabledRef = useRef(false);
  useEffect(() => {
    blockadesEnabledRef.current = blockadesEnabled;
    if (!blockadesEnabled) {
      arenaBlockadesRef.current = [];
      setArenaBlockades([]);
      blockadeBuiltForRef.current = "";
      blockadeHitCooldownRef.current.clear();
      teleportCooldownRef.current.clear();
    }
  }, [blockadesEnabled]);
  const [blockadeDensity, setBlockadeDensity] = useState<"low" | "medium" | "high">("medium");
  const [blockadeMovement, setBlockadeMovement] = useState<"low" | "medium" | "high">("medium");
  const [blockadeMode, setBlockadeMode] = useState<"auto" | "custom">("auto");
  const [blockadeSelected, setBlockadeSelected] = useState<Set<ArenaBlockadeKind>>(() => new Set(ARENA_BLOCKADE_KINDS));
  const [blockadeDurationSec, setBlockadeDurationSec] = useState<number>(0); // 0 = auto (permanent / per-kind default)
  const blockadeDensityRef = useRef(blockadeDensity);
  const blockadeMovementRef = useRef(blockadeMovement);
  const blockadeModeRef = useRef(blockadeMode);
  const blockadeSelectedRef = useRef(blockadeSelected);
  const blockadeDurationOverrideRef = useRef(0);
  useEffect(() => { blockadeDensityRef.current = blockadeDensity; }, [blockadeDensity]);
  useEffect(() => { blockadeMovementRef.current = blockadeMovement; }, [blockadeMovement]);
  useEffect(() => { blockadeModeRef.current = blockadeMode; }, [blockadeMode]);
  useEffect(() => { blockadeSelectedRef.current = blockadeSelected; }, [blockadeSelected]);
  useEffect(() => { blockadeDurationOverrideRef.current = blockadeDurationSec > 0 ? blockadeDurationSec * 1000 : 0; }, [blockadeDurationSec]);
  const [arenaBlockades, setArenaBlockades] = useState<ArenaBlockade[]>([]);
  const arenaBlockadesRef = useRef<ArenaBlockade[]>([]);
  const blockadeBuiltForRef = useRef<string>("");   // config signature the current layout was built for
  const blockadeHitCooldownRef = useRef<Map<string, number>>(new Map()); // `${bubbleId}:${blockadeId}` -> ts
  const teleportCooldownRef = useRef<Map<number, number>>(new Map());

  // ===== Zones (spec section 6) — default OFF =====
  const [zonesEnabled, setZonesEnabled] = useState(false);
  const zonesEnabledRef = useRef(false);
  useEffect(() => {
    zonesEnabledRef.current = zonesEnabled;
    if (!zonesEnabled) {
      arenaZonesRef.current = [];
      setArenaZones([]);
      zoneTickRef.current.clear();
      fadedBubblesRef.current.clear();
    }
  }, [zonesEnabled]);
  const [zoneFrequency, setZoneFrequency] = useState<"low" | "medium" | "high">("medium");
  const [zoneMode, setZoneMode] = useState<"auto" | "custom">("auto");
  const [zoneSelected, setZoneSelected] = useState<Set<ArenaZoneKind>>(() => new Set(ARENA_ZONE_KINDS));
  const [zoneDurationSec, setZoneDurationSec] = useState<number>(0); // 0 = auto (12s default)
  const zoneFrequencyRef = useRef(zoneFrequency);
  const zoneModeRef = useRef(zoneMode);
  const zoneSelectedRef = useRef(zoneSelected);
  const zoneDurationOverrideRef = useRef(0);
  useEffect(() => { zoneFrequencyRef.current = zoneFrequency; }, [zoneFrequency]);
  useEffect(() => { zoneModeRef.current = zoneMode; }, [zoneMode]);
  useEffect(() => { zoneSelectedRef.current = zoneSelected; }, [zoneSelected]);
  useEffect(() => { zoneDurationOverrideRef.current = zoneDurationSec > 0 ? zoneDurationSec * 1000 : 0; }, [zoneDurationSec]);
  const [arenaZones, setArenaZones] = useState<ArenaZone[]>([]);
  const arenaZonesRef = useRef<ArenaZone[]>([]);
  const lastZoneSpawnRef = useRef<number>(0);
  const zoneTickRef = useRef<Map<number, number>>(new Map()); // bubbleId -> last zone HP tick
  const fadedBubblesRef = useRef<Set<number>>(new Set());     // inside an invisibility zone

  // ===== Events (spec section 7) — default OFF =====
  const [eventsEnabled, setEventsEnabled] = useState(false);
  const eventsEnabledRef = useRef(false);
  useEffect(() => {
    eventsEnabledRef.current = eventsEnabled;
    if (!eventsEnabled) {
      activeEventRef.current = null;
      setActiveEvent(null);
      globalDamageMultRef.current = 1;
      globalStepMultRef.current = 1;
      arenaShrinkPadRef.current = 0;
      setArenaShrinkPad(0);
      arenaMeteorsRef.current = [];
      setArenaMeteors([]);
      arenaSwordsRef.current = [];
      setArenaSwords([]);
    }
  }, [eventsEnabled]);
  const [eventFrequency, setEventFrequency] = useState<"low" | "medium" | "high">("medium");
  const [eventMode, setEventMode] = useState<"auto" | "custom">("auto");
  const [eventSelected, setEventSelected] = useState<Set<ArenaEventKind>>(() => new Set(ARENA_EVENT_KINDS));
  const [eventDurationSec, setEventDurationSec] = useState<number>(0); // 0 = auto (per-event default)
  const eventFrequencyRef = useRef(eventFrequency);
  const eventModeRef = useRef(eventMode);
  const eventSelectedRef = useRef(eventSelected);
  const eventDurationOverrideRef = useRef(0);
  useEffect(() => { eventFrequencyRef.current = eventFrequency; }, [eventFrequency]);
  useEffect(() => { eventModeRef.current = eventMode; }, [eventMode]);
  useEffect(() => { eventSelectedRef.current = eventSelected; }, [eventSelected]);
  useEffect(() => { eventDurationOverrideRef.current = eventDurationSec > 0 ? eventDurationSec * 1000 : 0; }, [eventDurationSec]);
  const [activeEvent, setActiveEvent] = useState<ArenaEventState | null>(null);
  const activeEventRef = useRef<ArenaEventState | null>(null);
  const lastEventAtRef = useRef<number>(0);
  const eventTickRef = useRef<number>(0);
  const rainTickRef = useRef<number>(0); // throttles continuous event rain spawns (health_rain/item_chaos/meteor_shower/double_damage)
  const [arenaMeteors, setArenaMeteors] = useState<ArenaMeteor[]>([]);
  const arenaMeteorsRef = useRef<ArenaMeteor[]>([]);
  const [arenaSwords, setArenaSwords] = useState<ArenaSword[]>([]);
  const arenaSwordsRef = useRef<ArenaSword[]>([]);
  // Global multipliers driven by events; always restored to neutral on cleanup.
  const globalDamageMultRef = useRef(1);
  const globalStepMultRef = useRef(1);
  const arenaShrinkPadRef = useRef(0); // extra boundary padding (px) for Shrinking Arena
  const [arenaShrinkPad, setArenaShrinkPad] = useState(0);
  // Drop every temporary arena object on unmount (spec section 13).
  useEffect(() => () => {
    arenaBlockadesRef.current = [];
    arenaZonesRef.current = [];
    arenaMeteorsRef.current = [];
    arenaSwordsRef.current = [];
    activeEventRef.current = null;
    blockadeHitCooldownRef.current.clear();
    teleportCooldownRef.current.clear();
    zoneTickRef.current.clear();
    fadedBubblesRef.current.clear();
    globalDamageMultRef.current = 1;
    globalStepMultRef.current = 1;
    arenaShrinkPadRef.current = 0;
  }, []);
  // Per-bubble timed statuses (keyed by bubbleId). One-shot flags kept separately.
  const bubbleStatusesRef = useRef<Map<number, ArenaStatus[]>>(new Map());
  const arenaShieldRef = useRef<Map<number, number>>(new Map());   // bubbleId -> remaining shield strength
  const secondChanceRef = useRef<Set<number>>(new Set());          // bubbleIds with a pending revive
  const impactBoostRef = useRef<Set<number>>(new Set());           // bubbleIds with a pending knockback
  const lockedUntilRef = useRef<Map<number, number>>(new Map());   // bubbleId -> ts until which it can't collect
  // Floating "+20", "Poison!" style collection labels (visual only).
  type PickupFx = { id: number; x: number; y: number; text: string; color: string; createdAt: number };
  const [pickupFx, setPickupFx] = useState<PickupFx[]>([]);
  const pickupFxRef = useRef<PickupFx[]>([]);
  
  // Boss arena bubble size multiplier
  const [bossBubbleSizeMultiplier, setBossBubbleSizeMultiplier] = useState<number>(1.0);
  const [superbubbleImageOptions, setSuperbubbleImageOptions] = useState<string[]>([]);
  const selectedSuperbubbleImageRef = useRef<string>("");
  const baseBubbleRadiusRef = useRef<number>(0);
  const baseSuperBubbleRadiusRef = useRef<number>(60);

  // Brawl Arena State
  const [brawlMode, setBrawlMode] = useState<"1v1" | "1vMany">(requestedMode === "many" ? "1vMany" : "1v1");
  const [brawlModeSelected, setBrawlModeSelected] = useState(requestedMode === "duel" || requestedMode === "many");
  const [brawlBubbleSizeMultiplier, setBrawlBubbleSizeMultiplier] = useState<number>(1.0);
  const brawl1v1ImagesRef = useRef<string[]>([]); // Images from solo_brawl/
  const brawlSoloImageRef = useRef<string>(""); // Solo bubble image for 1vMany
  const brawlManyImagesRef = useRef<string[]>([]); // Images from solo_brawl/solovsmany/
  const [brawlPowersEnabled, setBrawlPowersEnabled] = useState(false);
  const brawlPowersEnabledRef = useRef(false); // Ref to avoid re-running game loop on toggle
  const [brawlPowersAutoEnableTime, setBrawlPowersAutoEnableTime] = useState(0); // seconds, 0 = disabled
  const brawlPowersAutoEnabledRef = useRef(false);
  const [brawl1v1PowerMode, setBrawl1v1PowerMode] = useState<"random" | "preassigned">("random"); // Power mode for 1v1
  const [brawl1v1PowerAssignments, setBrawl1v1PowerAssignments] = useState<PowerAssignment[]>([]); // Pre-assign for 1v1
  const [brawl1vManyPowerMode, setBrawl1vManyPowerMode] = useState<"random" | "preassigned">("random"); // Power mode for 1vMany
  const [brawl1vManyPowerAssignments, setBrawl1vManyPowerAssignments] = useState<PowerAssignment[]>([]); // Pre-assign for 1vMany
  const [selectedBrawlPowers, setSelectedBrawlPowers] = useState<{ [k in keyof typeof SUPER_BUBBLE_TYPES]?: boolean }>({
    // Classic Weapons
    // missile: true,
    // bomb: true,
    // drone: true,
    // rocket: true,
    // grenade: true,
    // laser: true,
    // plasma: true,
    // // Original
    // flame: true,
    // arrow: true,
    // bullet: true,
    // kunai: true,
    shuriken: false,
    // katana: true,
    // energy_blast: true,
    // ice_shard: true,
  });
  const brawlTeamsRef = useRef<Map<number, "solo" | "many">>(new Map()); // Track which team each bubble is on (for 1vMany)
  const brawl1vManyAllMembersRef = useRef<string[]>([]); // Track all many team member images from start (for win credit)

  // Projectile Settings Refs (sync with state via useEffect)
  const playerBubblesProjectileCountRef = useRef<number>(1);
  const playerBubblesPowerModeRef = useRef<"random" | "same">("random");
  const playerBubblesProjectileSpeedRef = useRef<number>(4);
  const brawlBubblesProjectileCountRef = useRef<number>(1);
  const brawlBubblesPowerModeRef = useRef<"random" | "same">("random");
  const brawlBubblesProjectileSpeedRef = useRef<number>(4);
  // Firing-mode refs + manual shoot trigger (read inside the game loop)
  const playerBubblesFiringModeRef = useRef<"auto" | "manual">("auto");
  const brawlBubblesFiringModeRef = useRef<"auto" | "manual">("auto");
  const manualShootRequestRef = useRef<boolean>(false);

  // Special (SELF / ARENA / TARGET) power effects. These are NOT projectiles.
  //  - shields: bubbleId -> shield that absorbs damage until it expires
  //  - webbed: bubbleId -> movement slow + a drawn tether from the caster
  //  - timeStopUntil: while now < value, all bubbles/projectiles freeze (rendering continues)
  const shieldsRef = useRef<Map<number, { expiresAt: number }>>(new Map());
  const webbedRef = useRef<Map<number, { until: number; factor: number; fromX: number; fromY: number }>>(new Map());
  const timeStopUntilRef = useRef<number>(0);

  // Blade Damage Refs (sync with state via useEffect)
  const normalBladeDamageRef = useRef<number>(15);
  const bossNormalBladeDamageRef = useRef<number>(15);
  const bossSuperbubbleBladeDamageRef = useRef<number>(15);
  const brawlBladeDamageRef = useRef<number>(15);

  // Test Mode State
  const [testMode, setTestMode] = useState<boolean>(false);

  // HP Control State (for manual health adjustment)
  const [hpControlMode, setHpControlMode] = useState<'single' | 'multiple' | 'all'>('all');
  const [hpValue, setHpValue] = useState<number>(100);
  const [selectedBubblesForHp, setSelectedBubblesForHp] = useState<Set<number>>(new Set());
  const [hpPerBubble, setHpPerBubble] = useState<Map<number, number>>(new Map()); // Track individual HP per bubble

  // Function to apply HP changes to bubbles immediately
  const applyHpChanges = () => {
    if (!healthRef.current || !idListRef.current) return;
    
    const n = countRef.current;
    const healthArr = healthRef.current;
    const idArr = idListRef.current;
    const updatedBubbleIds = new Set<number>();
    
    if (hpControlMode === 'all') {
      // Set all bubbles to hpValue
      for (let i = 0; i < n; i++) {
        if (healthArr[i] > 0) {
          healthArr[i] = hpValue;
          updatedBubbleIds.add(idArr[i]);
        }
      }
    } else if (hpControlMode === 'single') {
      // Set single selected bubble
      selectedBubblesForHp.forEach((bubbleId) => {
        for (let i = 0; i < n; i++) {
          if (idArr[i] === bubbleId && healthArr[i] > 0) {
            healthArr[i] = hpValue;
            updatedBubbleIds.add(bubbleId);
          }
        }
      });
    } else if (hpControlMode === 'multiple') {
      // Set multiple bubbles with their individual HP values
      selectedBubblesForHp.forEach((bubbleId) => {
        const bubbleHp = hpPerBubble.get(bubbleId) || 100;
        for (let i = 0; i < n; i++) {
          if (idArr[i] === bubbleId && healthArr[i] > 0) {
            healthArr[i] = bubbleHp;
            updatedBubbleIds.add(bubbleId);
          }
        }
      });
    }
    
    // Update uiBubblesSnapshot to reflect changes and trigger re-render
    setUiBubblesSnapshot((prev) =>
      prev.map((bubble) =>
        updatedBubbleIds.has(bubble.id)
          ? { 
              ...bubble, 
              health: hpControlMode === 'multiple' 
                ? (hpPerBubble.get(bubble.id) || bubble.health)
                : hpValue
            }
          : bubble
      )
    );
  };

  // Update HP for a specific bubble when slider changes and apply immediately
  const updateBubbleHp = (bubbleId: number, newHp: number) => {
    setHpPerBubble((prev) => new Map(prev).set(bubbleId, newHp));
    
    // Apply immediately to healthRef so leaderboard updates
    if (healthRef.current && idListRef.current) {
      const n = countRef.current;
      const healthArr = healthRef.current;
      const idArr = idListRef.current;
      for (let i = 0; i < n; i++) {
        if (idArr[i] === bubbleId && healthArr[i] > 0) {
          healthArr[i] = newHp;
        }
      }
    }
    
    // Update uiBubblesSnapshot to reflect the change and trigger re-render
    setUiBubblesSnapshot((prev) =>
      prev.map((bubble) =>
        bubble.id === bubbleId ? { ...bubble, health: newHp } : bubble
      )
    );
  };

  // Fetch test mode status on component mount
  useEffect(() => {
    const fetchTestMode = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/stats/testmode');
        const data = await res.json();
        setTestMode(data.testMode || false);
        // Update statsClient with test mode
        try {
          const statsClient = (window as any).__statsClient || await import('../utils/statsClient').then(m => m.default);
          if (statsClient && typeof statsClient.setTestMode === 'function') {
            statsClient.setTestMode(data.testMode || false);
          }
        } catch (e) {
          console.warn('Could not update statsClient with test mode:', e);
        }
      } catch (e) {
        console.warn('Failed to fetch test mode status:', e);
      }
    };
    fetchTestMode();
  }, []);

  // Damage and Physics Configuration - Arena Specific
  const [bounceDeviation, setBounceDeviation] = useState<number>(0.25); // radians (applies to all arenas)
  
  // Normal Arena Damage Config
  const [normalBubbleCollisionDamage, setNormalBubbleCollisionDamage] = useState<number>(5);
  const [normalSpikeDamage, setNormalSpikeDamage] = useState<number>(18);
  const [normalBladeDamage, setNormalBladeDamage] = useState<number>(15);
  
  // Boss Arena - Superbubble Config
  const [bossSuperbubbleHealth, setBossSuperbubbleHealth] = useState<number>(100); // Initial HP for superbubble
  const [bossCollisionDamage, setBossCollisionDamage] = useState<number>(2); // Damage to BOTH when they collide
  const [bossSuperPowerDamages, setBossSuperPowerDamages] = useState<{ [k: string]: number }>({
    // Classic Weapons
    missile: 8, bomb: 7.5, drone: 6.5, rocket: 8.5, grenade: 6, laser: 7, plasma: 8, emp_pulse: 5.5, flamethrower: 7.5, sonic_boom: 6.5, shockwave: 7, acid_spray: 6,
    // Original
    flame: 5, arrow: 5, bullet: 7, kunai: 7.5, shuriken: 7, katana: 5.5, energy_blast: 8, ice_shard: 3,
    // Anime
    kamehameha: 8, rasengan: 6.5, chidori: 7.5, spirit_bomb: 9, phoenix_strike: 7, void_slash: 8.5, holy_light: 6,
    // Marvel
    repulsor_blast: 7, mjolnir_strike: 8.5, gamma_smash: 9.5, web_shot: 5.5, frost_bolt: 6.5, captain_energy: 8, mystic_spell: 7.5, widow_bite: 6, scarlet_hex: 8.5, vision_beam: 9,
    // DC
    heat_vision: 9, freeze_ray: 6.5, lightning_power: 7.5, lasso_energy: 7, green_lantern: 8, aqua_surge: 7, kryptonite_pulse: 8.5, dark_side: 9.5, cyborg_cannon: 8, crow_strike: 7,
    // Dragon Ball
    solar_flare: 5, galick_gun: 9, destructo_disk: 7, special_beam: 8.5, final_flash: 9.5, spirit_ball: 6, dodon_ray: 7.5, potential_unlock: 8,
    // Naruto
    sand_shield: 6.5, paper_storm: 7.5, needle_barrage: 6, genjutsu_trap: 7, wind_blade: 7.5, earth_spear: 6.5, lightning_cage: 8.5, ice_crystal: 7, lava_flow: 8, wood_style: 8,
    // One Piece
    gum_gum_pistol: 7, flame_kick: 8, sword_slash: 8.5, thunder_tempo: 7.5, cannon_strike: 7, soul_surge: 6.5, shadow_clone: 7, magma_fist: 9,
    // Bleach
    getsuga_tensho: 9, senbonzakura: 7.5, hyorinmaru: 8.5, bakudo_spell: 6.5, cero_blast: 8.5, hadou_spell: 7.5, bankai_power: 9.5,
    // My Hero Academia
    one_for_all: 9, explosion_strike: 8.5, half_cold_hot: 8, dark_erase: 5.5, dna_boost: 6, compression_pulse: 7,
    // Other
    force_push: 7.5, atomic_breath: 9.5, infinity_snap: 10, time_stop_burst: 8, dimension_rift: 8.5
  });
  
  // Boss Arena - Normal Bubble Damage Config
  const [bossNormalSpikeDamage, setBossNormalSpikeDamage] = useState<number>(18);
  const [bossNormalBladeDamage, setBossNormalBladeDamage] = useState<number>(15);
  const [bossSuperbubbleBladeDamage, setBossSuperbubbleBladeDamage] = useState<number>(15);
  const [bossNormalPowerDamages, setBossNormalPowerDamages] = useState<{ [k: string]: number }>({
    // Classic Weapons
    missile: 8, bomb: 7.5, drone: 6.5, rocket: 8.5, grenade: 6, laser: 7, plasma: 8, emp_pulse: 5.5, flamethrower: 7.5, sonic_boom: 6.5, shockwave: 7, acid_spray: 6,
    // Original
    flame: 5, arrow: 5, bullet: 7, kunai: 7.5, shuriken: 7, katana: 5.5, energy_blast: 8, ice_shard: 3,
    // Anime + All others (full set)
    kamehameha: 8, rasengan: 6.5, chidori: 7.5, spirit_bomb: 9, phoenix_strike: 7, void_slash: 8.5, holy_light: 6,
    repulsor_blast: 7, mjolnir_strike: 8.5, gamma_smash: 9.5, web_shot: 5.5, frost_bolt: 6.5, captain_energy: 8, mystic_spell: 7.5, widow_bite: 6, scarlet_hex: 8.5, vision_beam: 9,
    heat_vision: 9, freeze_ray: 6.5, lightning_power: 7.5, lasso_energy: 7, green_lantern: 8, aqua_surge: 7, kryptonite_pulse: 8.5, dark_side: 9.5, cyborg_cannon: 8, crow_strike: 7,
    solar_flare: 5, galick_gun: 9, destructo_disk: 7, special_beam: 8.5, final_flash: 9.5, spirit_ball: 6, dodon_ray: 7.5, potential_unlock: 8,
    sand_shield: 6.5, paper_storm: 7.5, needle_barrage: 6, genjutsu_trap: 7, wind_blade: 7.5, earth_spear: 6.5, lightning_cage: 8.5, ice_crystal: 7, lava_flow: 8, wood_style: 8,
    gum_gum_pistol: 7, flame_kick: 8, sword_slash: 8.5, thunder_tempo: 7.5, cannon_strike: 7, soul_surge: 6.5, shadow_clone: 7, magma_fist: 9,
    getsuga_tensho: 9, senbonzakura: 7.5, hyorinmaru: 8.5, bakudo_spell: 6.5, cero_blast: 8.5, hadou_spell: 7.5, bankai_power: 9.5,
    one_for_all: 9, explosion_strike: 8.5, half_cold_hot: 8, dark_erase: 5.5, dna_boost: 6, compression_pulse: 7,
    force_push: 7.5, atomic_breath: 9.5, infinity_snap: 10, time_stop_burst: 8, dimension_rift: 8.5
  });
  
  // Brawl Arena Damage Config
  const [brawlBubbleCollisionDamage, setBrawlBubbleCollisionDamage] = useState<number>(5);
  const [brawlSpikeDamage, setBrawlSpikeDamage] = useState<number>(18);
  const [brawlBladeDamage, setBrawlBladeDamage] = useState<number>(15);
  const [brawlPowerDamages, setBrawlPowerDamages] = useState<{ [k: string]: number }>({
    // Classic Weapons
    missile: 8, bomb: 7.5, drone: 6.5, rocket: 8.5, grenade: 6, laser: 7, plasma: 8, emp_pulse: 5.5, flamethrower: 7.5, sonic_boom: 6.5, shockwave: 7, acid_spray: 6,
    // Original
    flame: 5, arrow: 5, bullet: 7, kunai: 7.5, shuriken: 7, katana: 5.5, energy_blast: 8, ice_shard: 3,
    // Anime
    kamehameha: 8, rasengan: 6.5, chidori: 7.5, spirit_bomb: 9, phoenix_strike: 7, void_slash: 8.5, holy_light: 6,
    // Marvel
    repulsor_blast: 7, mjolnir_strike: 8.5, gamma_smash: 9.5, web_shot: 5.5, frost_bolt: 6.5, captain_energy: 8, mystic_spell: 7.5, widow_bite: 6, scarlet_hex: 8.5, vision_beam: 9,
    // DC
    heat_vision: 9, freeze_ray: 6.5, lightning_power: 7.5, lasso_energy: 7, green_lantern: 8, aqua_surge: 7, kryptonite_pulse: 8.5, dark_side: 9.5, cyborg_cannon: 8, crow_strike: 7,
    // Dragon Ball
    solar_flare: 5, galick_gun: 9, destructo_disk: 7, special_beam: 8.5, final_flash: 9.5, spirit_ball: 6, dodon_ray: 7.5, potential_unlock: 8,
    // Naruto
    sand_shield: 6.5, paper_storm: 7.5, needle_barrage: 6, genjutsu_trap: 7, wind_blade: 7.5, earth_spear: 6.5, lightning_cage: 8.5, ice_crystal: 7, lava_flow: 8, wood_style: 8,
    // One Piece
    gum_gum_pistol: 7, flame_kick: 8, sword_slash: 8.5, thunder_tempo: 7.5, cannon_strike: 7, soul_surge: 6.5, shadow_clone: 7, magma_fist: 9,
    // Bleach
    getsuga_tensho: 9, senbonzakura: 7.5, hyorinmaru: 8.5, bakudo_spell: 6.5, cero_blast: 8.5, hadou_spell: 7.5, bankai_power: 9.5,
    // My Hero Academia
    one_for_all: 9, explosion_strike: 8.5, half_cold_hot: 8, dark_erase: 5.5, dna_boost: 6, compression_pulse: 7,
    // Other
    force_push: 7.5, atomic_breath: 9.5, infinity_snap: 10, time_stop_burst: 8, dimension_rift: 8.5
  });

  // Sync playerPowersEnabled state to ref to avoid restarting game loop when toggled
  useEffect(() => {
    playerPowersEnabledRef.current = playerPowersEnabled;
    normalPowersEnabledRef.current = normalPowersEnabled;
  }, [playerPowersEnabled, normalPowersEnabled]);

  // Sync brawlPowersEnabled state to ref to avoid restarting game loop when toggled
  useEffect(() => {
    brawlPowersEnabledRef.current = brawlPowersEnabled;
  }, [brawlPowersEnabled]);

  // typed arrays & resources
  const MAX_CAPACITY = useRef<number>(1024 * 64);
  const countRef = useRef<number>(0);
  const idListRef = useRef<Int32Array | null>(null);
  const xRef = useRef<Float32Array | null>(null);
  const yRef = useRef<Float32Array | null>(null);
  const vxRef = useRef<Float32Array | null>(null);
  const vyRef = useRef<Float32Array | null>(null);
  const rRef = useRef<Float32Array | null>(null);
  const rTargetRef = useRef<Float32Array | null>(null); // per-bubble target radius
  const healthRef = useRef<Float32Array | null>(null);
  const imgIndexRef = useRef<Int32Array | null>(null);
  const avatarIndexRef = useRef<Int32Array | null>(null);
  const imgSrcsRef = useRef<string[]>([]);
  const playerNamesRef = useRef<Map<number, string>>(new Map());
  const textureCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const imageBitmapCache = useRef<Map<string, ImageBitmap>>(new Map());
  const imageDecodeWorkerRef = useRef<Worker | null>(null);
  const imageMaskWorkerRef = useRef<Worker | null>(null);
  const imagesToDecodeRef = useRef<Set<string>>(new Set());
  const imagesDecodingRef = useRef<Set<string>>(new Set());

  const maskedBitmapCacheRef = useRef<Map<string, ImageBitmap>>(new Map());
  const maskedLruRef = useRef<string[]>([]);
  const maskedPixelBytesRef = useRef<number>(0);
  const maskedCreateQueueRef = useRef<string[]>([]);
  const maskedCreatingSetRef = useRef<Set<string>>(new Set());
  const revealStartedRef = useRef<boolean>(false);

  const damageCooldownRef = useRef<Record<number, number>>({});
  const sbCollisionCooldownRef = useRef<Record<number, number>>({}); // per-normal cooldown for superbubble collisions
  const dyingRef = useRef<Record<number, number>>({});
  const deathQueueRef = useRef<number[]>([]);
  const deathQueueSetRef = useRef<Set<number>>(new Set());
  const lastDamagerRef = useRef<Record<number, string | null>>({});
  const indexOfIdRef = useRef<Record<number, number>>({});
  const lastUiSnapshotTimeRef = useRef<number>(0);
  const arenaAudioContextRef = useRef<AudioContext | null>(null);
  const arenaMasterGainRef = useRef<GainNode | null>(null);
  const arenaCompressorRef = useRef<DynamicsCompressorNode | null>(null);
  const arenaNoiseBufferRef = useRef<AudioBuffer | null>(null);
  const lastArenaSoundAtRef = useRef<Record<string, number>>({});
  const lastArenaSoundOverallRef = useRef(0);
  const lastArenaContactSoundAtRef = useRef(0);

  const getArenaAudioContext = (): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!arenaAudioContextRef.current) {
      const AudioContextConstructor = window.AudioContext
        ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) return null;
      const context = new AudioContextConstructor();
      const master = context.createGain();
      const compressor = context.createDynamicsCompressor();
      master.gain.value = 1;
      compressor.threshold.value = -2;
      compressor.knee.value = 3;
      compressor.ratio.value = 16;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.18;
      master.connect(compressor);
      compressor.connect(context.destination);
      arenaAudioContextRef.current = context;
      arenaMasterGainRef.current = master;
      arenaCompressorRef.current = compressor;
    }
    return arenaAudioContextRef.current;
  };

  const unlockArenaAudio = () => {
    const context = getArenaAudioContext();
    if (context?.state === "suspended") void context.resume().catch(() => {});
  };

  type ArenaSoundKind =
    | "bounce" | "collision" | "blade" | "spikeHit" | "intro" | "spikeEnable" | "bladeEnable"
    | "powerEnable" | "bossPowerEnable" | "eventWarning" | "eventStart" | "eventEnd" | "eventImpact"
    | "powerRelease" | "powerHit";
  type ArenaSoundProfile = {
    start: number;
    end: number;
    duration: number;
    volume: number;
    wave: OscillatorType;
    cooldown: number;
    noiseVolume: number;
    noiseFrequency: number;
    noiseType: BiquadFilterType;
  };

  const playArenaSound = (kind: ArenaSoundKind, variant = "", durationOverride?: number) => {
    const context = arenaAudioContextRef.current;
    if (!context || context.state !== "running") return;

    const profiles: Record<ArenaSoundKind, ArenaSoundProfile> = {
      bounce: { start: 205, end: 115, duration: 0.1, volume: 0.5, wave: "sine", cooldown: 180, noiseVolume: 0.025, noiseFrequency: 420, noiseType: "lowpass" },
      collision: { start: 165, end: 58, duration: 0.14, volume: 0.86, wave: "triangle", cooldown: 150, noiseVolume: 0.22, noiseFrequency: 650, noiseType: "lowpass" },
      blade: { start: 920, end: 210, duration: 0.32, volume: 0.78, wave: "sawtooth", cooldown: 220, noiseVolume: 0.16, noiseFrequency: 2400, noiseType: "highpass" },
      spikeHit: { start: 155, end: 52, duration: 0.16, volume: 0.82, wave: "triangle", cooldown: 180, noiseVolume: 0.24, noiseFrequency: 1050, noiseType: "bandpass" },
      intro: { start: 78, end: 740, duration: 3, volume: 0.72, wave: "sine", cooldown: 300, noiseVolume: 0.12, noiseFrequency: 900, noiseType: "lowpass" },
      spikeEnable: { start: 160, end: 920, duration: 3, volume: 0.78, wave: "triangle", cooldown: 300, noiseVolume: 0.2, noiseFrequency: 1500, noiseType: "highpass" },
      bladeEnable: { start: 1040, end: 190, duration: 3, volume: 0.74, wave: "sawtooth", cooldown: 300, noiseVolume: 0.2, noiseFrequency: 3100, noiseType: "highpass" },
      powerEnable: { start: 190, end: 980, duration: 3, volume: 0.78, wave: "sine", cooldown: 300, noiseVolume: 0.15, noiseFrequency: 1800, noiseType: "bandpass" },
      bossPowerEnable: { start: 65, end: 430, duration: 3, volume: 0.86, wave: "triangle", cooldown: 300, noiseVolume: 0.18, noiseFrequency: 620, noiseType: "lowpass" },
      eventWarning: { start: 660, end: 440, duration: 0.18, volume: 0.62, wave: "sine", cooldown: 220, noiseVolume: 0.06, noiseFrequency: 1200, noiseType: "lowpass" },
      eventStart: { start: 155, end: 650, duration: 0.65, volume: 0.8, wave: "triangle", cooldown: 220, noiseVolume: 0.2, noiseFrequency: 1250, noiseType: "lowpass" },
      eventEnd: { start: 420, end: 180, duration: 0.24, volume: 0.62, wave: "sine", cooldown: 220, noiseVolume: 0.12, noiseFrequency: 900, noiseType: "lowpass" },
      eventImpact: { start: 130, end: 42, duration: 0.19, volume: 0.82, wave: "sawtooth", cooldown: 120, noiseVolume: 0.28, noiseFrequency: 720, noiseType: "lowpass" },
      powerRelease: { start: 340, end: 210, duration: 0.18, volume: 0.58, wave: "triangle", cooldown: 150, noiseVolume: 0.12, noiseFrequency: 1800, noiseType: "bandpass" },
      powerHit: { start: 250, end: 80, duration: 0.2, volume: 0.86, wave: "triangle", cooldown: 150, noiseVolume: 0.24, noiseFrequency: 1400, noiseType: "lowpass" },
    };
    const profile = { ...profiles[kind] };
    const soundKey = `${kind}:${variant}`;
    let isMetalPower = false;
    let isShuriken = false;
    if (kind === "powerRelease" || kind === "powerHit") {
      const key = variant.toLowerCase();
      const hash = Array.from(key).reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);
      isShuriken = key.includes("shuriken");
      isMetalPower = /shuriken|kunai|katana|sword|blade|disk|mjolnir|spear|arrow/.test(key);
      const family = /slash|sword|katana|kunai|shuriken|blade|tensho|disk/.test(key) ? "blade"
        : /bomb|grenade|rocket|missile|smash|atomic|explosion|cannon/.test(key) ? "explosive"
        : /laser|beam|ray|vision|kamehameha|final_flash/.test(key) ? "beam"
        : /lightning|thunder|chidori|emp|shock|electric/.test(key) ? "electric"
        : /ice|frost|freeze|hyorinmaru/.test(key) ? "ice"
        : /flame|fire|phoenix|magma|lava|heat/.test(key) ? "fire"
        : /holy|mystic|spirit|rasengan|chakra|void/.test(key) ? "mystic"
        : "energy";
      const familyProfile: Record<string, [number, number, OscillatorType, number, BiquadFilterType]> = {
        blade: [kind === "powerRelease" ? 820 : 145, kind === "powerRelease" ? 300 : 55, "sawtooth", 3000, "highpass"],
        explosive: [kind === "powerRelease" ? 155 : 105, 42, "sawtooth", 520, "lowpass"],
        beam: [kind === "powerRelease" ? 780 : 1080, kind === "powerRelease" ? 260 : 330, "sine", 2200, "bandpass"],
        electric: [kind === "powerRelease" ? 480 : 910, kind === "powerRelease" ? 135 : 210, "square", 2800, "highpass"],
        ice: [kind === "powerRelease" ? 1040 : 1280, kind === "powerRelease" ? 570 : 390, "sine", 3400, "highpass"],
        fire: [kind === "powerRelease" ? 260 : 190, kind === "powerRelease" ? 90 : 55, "sawtooth", 1000, "lowpass"],
        mystic: [kind === "powerRelease" ? 390 : 560, kind === "powerRelease" ? 170 : 230, "sine", 1700, "bandpass"],
        energy: [kind === "powerRelease" ? 340 : 430, kind === "powerRelease" ? 160 : 105, "triangle", 1800, "lowpass"],
      };
      const [start, end, wave, noiseFrequency, noiseType] = familyProfile[family];
      profile.start = start + (hash % 95);
      profile.end = end + (hash % 35);
      profile.wave = wave;
      profile.noiseFrequency = noiseFrequency;
      profile.noiseType = noiseType;
      profile.duration += (hash % 4) * 0.012;
      if (isShuriken && kind === "powerRelease") {
        profile.start = 1450 + (hash % 160);
        profile.end = 510 + (hash % 80);
        profile.duration = 0.62;
        profile.wave = "sawtooth";
        profile.volume = 0.82;
        profile.noiseFrequency = 5200;
        profile.noiseType = "highpass";
        profile.noiseVolume = 0.3;
      } else if (isMetalPower && kind === "powerHit") {
        profile.start = 1480 + (hash % 220);
        profile.end = 390 + (hash % 90);
        profile.duration = 0.42;
        profile.wave = "sine";
        profile.volume = 0.95;
        profile.noiseFrequency = 4700;
        profile.noiseType = "highpass";
        profile.noiseVolume = 0.34;
      }
    } else if (kind.startsWith("event")) {
      const hash = Array.from(variant).reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 3);
      profile.start += hash % 150;
      profile.end += hash % 70;
    }
    if (durationOverride !== undefined) profile.duration = durationOverride;

    const now = performance.now();
    const isPowerSound = kind === "powerRelease" || kind === "powerHit";
    const isContactSound = kind === "bounce" || kind === "collision" || kind === "spikeHit" || kind === "eventImpact";
    const isPrioritySound = kind === "blade" || kind === "spikeHit" || kind === "eventImpact"
      || kind === "spikeEnable" || kind === "bladeEnable" || kind === "powerEnable" || kind === "bossPowerEnable";
    if (now - (lastArenaSoundAtRef.current[soundKey] ?? 0) < profile.cooldown) return;
    if (isContactSound) {
      if (now - lastArenaContactSoundAtRef.current < 110) return;
      lastArenaContactSoundAtRef.current = now;
    }
    if (isPowerSound) {
      const powerKindKey = `power:${kind}`;
      if (now - (lastArenaSoundAtRef.current[powerKindKey] ?? 0) < 85) return;
      lastArenaSoundAtRef.current[powerKindKey] = now;
    } else if (!isPrioritySound) {
      if (now - lastArenaSoundOverallRef.current < 35) return;
      lastArenaSoundOverallRef.current = now;
    }
    lastArenaSoundAtRef.current[soundKey] = now;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startAt = context.currentTime;
    oscillator.type = profile.wave;
    oscillator.frequency.setValueAtTime(profile.start, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(profile.end, startAt + profile.duration);
    gain.gain.setValueAtTime(0.0001, startAt);
    const volume = profile.volume * 1.5;
    gain.gain.exponentialRampToValueAtTime(volume * (kind === "blade" || kind === "bladeEnable" ? 0.72 : 1), startAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + profile.duration);
    oscillator.connect(gain);
    gain.connect(arenaMasterGainRef.current ?? context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + profile.duration + 0.01);

    if (kind === "blade" || kind === "bladeEnable" || (kind === "powerRelease" && isShuriken)) {
      const rotor = context.createOscillator();
      const rotorDepth = context.createGain();
      rotor.type = "sine";
      rotor.frequency.setValueAtTime(kind === "blade" ? 28 : isShuriken ? 25 : 16, startAt);
      rotorDepth.gain.setValueAtTime(volume * (isShuriken ? 0.4 : 0.28), startAt);
      rotor.connect(rotorDepth);
      rotorDepth.connect(gain.gain);
      rotor.start(startAt);
      rotor.stop(startAt + profile.duration);
    }

    if (isMetalPower && (!isShuriken || kind === "powerHit")) {
      for (const ratio of [1.47, 2.13]) {
        const partial = context.createOscillator();
        const partialGain = context.createGain();
        partial.type = "sine";
        partial.frequency.setValueAtTime(profile.start * ratio, startAt);
        partial.frequency.exponentialRampToValueAtTime(profile.end * ratio, startAt + profile.duration * 0.9);
        partialGain.gain.setValueAtTime(0.0001, startAt);
        partialGain.gain.exponentialRampToValueAtTime(volume * 0.24, startAt + 0.004);
        partialGain.gain.exponentialRampToValueAtTime(0.0001, startAt + profile.duration * 0.9);
        partial.connect(partialGain);
        partialGain.connect(arenaMasterGainRef.current ?? context.destination);
        partial.start(startAt);
        partial.stop(startAt + profile.duration);
      }
    }

    if (profile.noiseVolume > 0) {
      if (!arenaNoiseBufferRef.current) {
        const length = Math.ceil(context.sampleRate * 1.2);
        const buffer = context.createBuffer(1, length, context.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) samples[i] = Math.random() * 2 - 1;
        arenaNoiseBufferRef.current = buffer;
      }
      const noise = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const noiseGain = context.createGain();
      noise.buffer = arenaNoiseBufferRef.current;
      filter.type = profile.noiseType;
      filter.frequency.setValueAtTime(profile.noiseFrequency, startAt);
      noiseGain.gain.setValueAtTime(0.0001, startAt);
      const noiseDuration = Math.min(profile.duration * 0.72, 0.32);
      noiseGain.gain.exponentialRampToValueAtTime(profile.noiseVolume * 1.5, startAt + 0.012);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, startAt + noiseDuration);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(arenaMasterGainRef.current ?? context.destination);
      noise.start(startAt, Math.random() * 0.5);
      noise.stop(startAt + noiseDuration + 0.02);
    }
  };
  
  const normalizePlayer = (p?: string | null) => {
    if (!p) return '';
    try {
      const raw = String(p || '');
      const stripped = raw.replace(/^https?:\/\/[^\/]+\//, '').replace(/^\/+/, '');
      const parts = stripped.split('/');
      const filename = parts[parts.length - 1] || raw;
      // Remove file extensions
      return filename.replace(/\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i, '');
    } catch (e) {
      return String(p);
    }
  };
  
  // ===== Arena pickup status helpers (spec section 8) =====
  // A bubble's active timed statuses, pruned of expired entries.
  const getActiveStatuses = (bubbleId: number, now: number): ArenaStatus[] => {
    const list = bubbleStatusesRef.current.get(bubbleId);
    if (!list || list.length === 0) return [];
    return list.filter((s) => now < s.expiresAt);
  };
  const hasStatus = (bubbleId: number, type: ArenaStatusType, now: number): boolean =>
    getActiveStatuses(bubbleId, now).some((s) => s.type === type);
  // Movement step multiplier from Speed Boost / Slow / Stun (0 = frozen).
  const pickupSpeedFactor = (bubbleId: number, now: number): number => {
    const list = bubbleStatusesRef.current.get(bubbleId);
    if (!list || list.length === 0) return 1;
    let m = 1;
    for (const s of list) {
      if (now >= s.expiresAt) continue;
      if (s.type === "stun") return 0;
      if (s.type === "speed_boost") m *= 1.5;
      else if (s.type === "slow") m *= 0.5;
    }
    return m;
  };
  const getDamageDealtMult = (bubbleId: number, now: number): number =>
    hasStatus(bubbleId, "damage_boost", now) ? 1.5 : 1;
  const getDamageTakenMult = (bubbleId: number, now: number): number =>
    hasStatus(bubbleId, "weakness", now) ? 1.5 : 1;

  const nextPickupFxIdRef = useRef(1);
  // Floating label above a bubble's current position (visual only).
  const spawnPickupFx = (bubbleId: number, text: string, color: string) => {
    const idArr = idListRef.current, xArr = xRef.current, yArr = yRef.current;
    if (!idArr || !xArr || !yArr) return;
    let idx = -1;
    for (let i = 0; i < countRef.current; i++) { if (idArr[i] === bubbleId) { idx = i; break; } }
    if (idx < 0) return;
    const fx: PickupFx = { id: nextPickupFxIdRef.current++, x: xArr[idx], y: yArr[idx], text, color, createdAt: Date.now() };
    pickupFxRef.current.push(fx);
    if (pickupFxRef.current.length > 40) pickupFxRef.current.shift();
    setPickupFx([...pickupFxRef.current]);
  };

  // Add or refresh a timed status on a bubble (no infinite stacking — refresh duration).
  const addStatus = (bubbleId: number, type: ArenaStatusType, durationMs: number, now: number, extra?: Partial<ArenaStatus>) => {
    let list = bubbleStatusesRef.current.get(bubbleId);
    if (!list) { list = []; bubbleStatusesRef.current.set(bubbleId, list); }
    const existing = list.find((s) => s.type === type && now < s.expiresAt);
    if (existing) {
      existing.expiresAt = now + durationMs; // refresh duration
      return;
    }
    list.push({ id: nextPickupFxIdRef.current++, type, startedAt: now, expiresAt: now + durationMs, lastTick: now, ...extra });
  };

  // Apply a pickup's effect to the collecting bubble (index i, id bubbleId).
  const applyPickupEffect = (kind: ArenaPickupKind, bubbleId: number, i: number, now: number) => {
    const hArr = healthRef.current, vxArr = vxRef.current, vyArr = vyRef.current;
    const rArr = rRef.current, rTgt = rTargetRef.current;
    const heal = (amt: number) => { if (hArr) hArr[i] = hArr[i] + amt; }; // no upper cap: more pickups = more HP, same in every arena mode
    // In custom mode the user can force a fixed duration (seconds) for all timed effects.
    const dur = (d: number) => (pickupDurationOverrideRef.current > 0 ? pickupDurationOverrideRef.current : d);
    switch (kind) {
      case "health_kit":   heal(20); spawnPickupFx(bubbleId, "+20", "#22c55e"); break;
      case "mega_health":  heal(40); spawnPickupFx(bubbleId, "+40", "#10b981"); break;
      case "shield":       arenaShieldRef.current.set(bubbleId, 20); spawnPickupFx(bubbleId, "Shield", "#38bdf8"); break;
      case "speed_boost":  addStatus(bubbleId, "speed_boost", dur(5000), now); spawnPickupFx(bubbleId, "Speed+", "#22d3ee"); break;
      case "damage_boost": addStatus(bubbleId, "damage_boost", dur(6000), now); spawnPickupFx(bubbleId, "Dmg+", "#f59e0b"); break;
      case "regeneration": addStatus(bubbleId, "regeneration", dur(5000), now); spawnPickupFx(bubbleId, "Regen", "#34d399"); break;
      case "magnet":       addStatus(bubbleId, "magnet", dur(5000), now); spawnPickupFx(bubbleId, "Magnet", "#60a5fa"); break;
      case "impact_boost": impactBoostRef.current.add(bubbleId); spawnPickupFx(bubbleId, "Impact!", "#f472b6"); break;
      case "second_chance": secondChanceRef.current.add(bubbleId); spawnPickupFx(bubbleId, "2nd Chance", "#a7f3d0"); break;
      case "ghost_mode":   addStatus(bubbleId, "ghost", dur(4000), now); spawnPickupFx(bubbleId, "Ghost", "#c4b5fd"); break;
      case "poison":       addStatus(bubbleId, "poison", dur(5000), now); spawnPickupFx(bubbleId, "Poison", "#a855f7"); break;
      case "bomb":         if (hArr) hArr[i] = Math.max(0, hArr[i] - 20); spawnPickupFx(bubbleId, "-20", "#ef4444"); break;
      case "slow":         addStatus(bubbleId, "slow", dur(4000), now); spawnPickupFx(bubbleId, "Slow", "#f59e0b"); break;
      case "weakness":     addStatus(bubbleId, "weakness", dur(6000), now); spawnPickupFx(bubbleId, "Weak", "#fb7185"); break;
      case "reverse_controls":
        // Autonomous game: reverse the bubble's travel direction (one-time flip) + mark status.
        if (vxArr && vyArr) { vxArr[i] = -vxArr[i]; vyArr[i] = -vyArr[i]; }
        addStatus(bubbleId, "reverse", dur(4000), now); spawnPickupFx(bubbleId, "Reversed", "#e879f9"); break;
      case "shrink":
        if (rArr && rTgt) addStatus(bubbleId, "shrink", dur(6000), now, { origR: rArr[i], origTgt: rTgt[i] });
        if (rArr) rArr[i] *= 0.7;
        if (rTgt) rTgt[i] *= 0.7;
        spawnPickupFx(bubbleId, "Shrink", "#f0abfc"); break;
      case "locked":       lockedUntilRef.current.set(bubbleId, now + dur(5000)); spawnPickupFx(bubbleId, "Locked", "#94a3b8"); break;
      case "bleed":        addStatus(bubbleId, "bleed", dur(5000), now); spawnPickupFx(bubbleId, "Bleed", "#dc2626"); break;
      case "stun":         addStatus(bubbleId, "stun", dur(2000), now); spawnPickupFx(bubbleId, "Stun", "#fca5a5"); break;
      case "curse": {
        const outcome = CURSE_OUTCOMES[Math.floor(Math.random() * CURSE_OUTCOMES.length)];
        spawnPickupFx(bubbleId, `Curse: ${ARENA_PICKUP_INFO[outcome].name}`, "#d946ef");
        applyPickupEffect(outcome, bubbleId, i, now);
        break;
      }
    }
  };

  // helper for recording collision hits with cooldown checking
  const recordCollisionHit = (
    targetIndex: number,
    attackerImgIdx: number,
    attackerId: number,
    nowMs: number,
    applyDamage: boolean,
    damage?: number,
    COOLDOWN_MS: number = 150
  ): boolean => {
    const bubbleId = idListRef.current![targetIndex];
    const lastHit = damageCooldownRef.current[bubbleId] ?? 0;
    if (nowMs - lastHit > COOLDOWN_MS) {
      // Sand Shield absorbs the hit: register the contact but negate damage.
      if (applyDamage && shieldsRef.current.size > 0) {
        const s = shieldsRef.current.get(bubbleId);
        if (s && nowMs < s.expiresAt) applyDamage = false;
        else if (s) shieldsRef.current.delete(bubbleId);
      }
      if (applyDamage && damage !== undefined && healthRef.current) {
        let dmg = damage;
        // Global event multiplier (Double Damage) — neutral 1 when no event runs.
        dmg *= globalDamageMultRef.current;
        // Arena-pickup damage modifiers (spec section 8) — only when pickups are ON.
        if (pickupsEnabledRef.current) {
          dmg *= getDamageDealtMult(attackerId, nowMs);   // attacker's Damage Boost
          dmg *= getDamageTakenMult(bubbleId, nowMs);      // receiver's Weakness
          // Pickup Shield absorbs the next qualifying damage.
          const shield = arenaShieldRef.current.get(bubbleId);
          if (shield && shield > 0) {
            const absorbed = Math.min(shield, dmg);
            dmg -= absorbed;
            const remaining = shield - absorbed;
            if (remaining > 0) arenaShieldRef.current.set(bubbleId, remaining);
            else arenaShieldRef.current.delete(bubbleId);
          }
        }
        const newHp = Math.max(0, healthRef.current[targetIndex] - dmg);
        // Second Chance: instead of dying, revive to 25 HP once.
        if (newHp <= 0 && pickupsEnabledRef.current && secondChanceRef.current.has(bubbleId)) {
          secondChanceRef.current.delete(bubbleId);
          healthRef.current[targetIndex] = 25;
          spawnPickupFx(bubbleId, "Revived!", "#a7f3d0");
        } else {
          healthRef.current[targetIndex] = newHp;
        }
      }
      damageCooldownRef.current[bubbleId] = nowMs;
      try {
        const rawAttacker = imgSrcsRef.current[attackerImgIdx] ?? `player-${attackerId}`;
        const attacker = normalizePlayer(rawAttacker);
        if (applyDamage) {
          lastDamagerRef.current[bubbleId] = attacker;
        }
        try { recordHit(attacker); } catch (e) {}
      } catch (e) {}
      return true;
    }
    return false;
  };
  
  const currentGameRef = useRef<string | null>(null);
  const customMatchLoadedRef = useRef(false);
  const customMatchPayloadRef = useRef("");

  const superBubbleRef = useRef<BubbleData | null>(null);

  // Get exact boundary vertices matching the clip-path definition
  const getShapeBoundaryVertices = (dims: { width: number; height: number }): { x: number; y: number }[] => {
    const w = dims.width;
    const h = dims.height;

    // Circle keeps its dense analytic boundary for smooth curved collision.
    if (arenaShape === ARENA_SHAPES.CIRCLE) {
      const points: { x: number; y: number }[] = [];
      const radius = Math.min(w, h) / 2;
      const cx = w / 2;
      const cy = h / 2;
      for (let i = 0; i < 360; i += 5) {
        const angle = (i * Math.PI) / 180;
        points.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
      }
      return points;
    }

    // All other shapes derive their collision boundary from the shared normalized
    // polygon map, so the visual clip-path and the physics boundary always match.
    const poly = SHAPE_POLYGONS[arenaShape] || SHAPE_POLYGONS[ARENA_SHAPES.RECTANGLE];
    return poly.map(([nx, ny]) => ({ x: nx * w, y: ny * h }));
  };

  const getArenaDimensions = () => {
    const arena = arenaRef.current;
    if (arena) {
      const rect = arena.getBoundingClientRect();
      // Square-render shapes use a 1:1 box so regular geometry doesn't stretch
      if (isSquareArenaShape(arenaShape)) {
        const size = Math.min(rect.width, rect.height);
        return { width: size, height: size };
      }
      // Remaining shapes use full dimensions - clip-path handles the visual shape
      return { width: rect.width, height: rect.height };
    }
    // fallback
    const vh = window.innerHeight * 0.94;
    const vw = window.innerWidth * 0.6;
    if (isSquareArenaShape(arenaShape)) {
      const size = Math.min(Math.min(vh, vw), 1500);
      return { width: size, height: size };
    }
    return { width: Math.min(vw, 1500), height: Math.min(vh, 1500) };
  };

  // Check if point is inside arena boundary for different shapes
  const isInsideArenaBoundary = (x: number, y: number, radius: number, dims: { width: number; height: number }): boolean => {
    // Special optimized check for circle
    if (arenaShape === ARENA_SHAPES.CIRCLE) {
      const cx = dims.width / 2;
      const cy = dims.height / 2;
      const arenaRadius = Math.min(dims.width, dims.height) / 2;
      const distFromCenter = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      return distFromCenter + radius + 4 <= arenaRadius; // 4px safety margin — hug the visual edge
    }
    if (arenaShape === ARENA_SHAPES.RING) {
      const cx = dims.width / 2;
      const cy = dims.height / 2;
      const distanceFromCenter = Math.hypot(x - cx, y - cy);
      const span = Math.min(dims.width, dims.height);
      const outerRadius = span * RING_OUTER_FRAC;
      const innerRadius = span * RING_INNER_FRAC;
      const safetyMargin = 5;
      return distanceFromCenter + radius + safetyMargin <= outerRadius
        && distanceFromCenter - radius - safetyMargin >= innerRadius;
    }
    
    const vertices = getShapeBoundaryVertices(dims);
    if (vertices.length < 3) return false;
    
    const safetyMargin = 8; // Small clearance only — cavity should track the visual boundary closely
    
    // Test if point is inside polygon (ray casting algorithm)
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x, yi = vertices[i].y;
      const xj = vertices[j].x, yj = vertices[j].y;
      
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    // Must be at least radius + safety margin distance from all edges
    if (inside) {
      for (let i = 0; i < vertices.length; i++) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % vertices.length];
        const dist = distanceToSegment(x, y, v1.x, v1.y, v2.x, v2.y);
        if (dist < radius + safetyMargin) return false;
      }
    }
    
    return inside;
  };

  // Helper: distance from point to line segment
  const distanceToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
  };

  const bounceWithDeviation = (vx: number, vy: number, normalX: number, normalY: number, deviation: number) => {
    const speed = Math.hypot(vx, vy);
    const normalVelocity = vx * normalX + vy * normalY;
    if (speed < 0.001 || normalVelocity >= 0) return { vx, vy };

    const reflectedVx = vx - 2 * normalVelocity * normalX;
    const reflectedVy = vy - 2 * normalVelocity * normalY;
    const inwardAngle = Math.atan2(normalY, normalX);
    const reflectedAngle = Math.atan2(reflectedVy, reflectedVx);
    const relativeAngle = Math.atan2(
      Math.sin(reflectedAngle - inwardAngle),
      Math.cos(reflectedAngle - inwardAngle),
    );
    const randomAngle = (Math.random() * 2 - 1) * deviation;
    const adjustedAngle = clamp(relativeAngle + randomAngle, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
    const angle = inwardAngle + adjustedAngle;
    return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
  };

  // Constrain position to arena boundary
  const constrainToArenaBoundary = (x: number, y: number, radius: number, dims: { width: number; height: number }): { x: number; y: number; vx: number; vy: number } => {
    const cx = dims.width / 2;
    const cy = dims.height / 2;
    const safetyMargin = 8;

    let newX = x;
    let newY = y;
    let bounceVx = 0;
    let bounceVy = 0;

    // Special optimized constraint for circle
    if (arenaShape === ARENA_SHAPES.CIRCLE) {
      const arenaRadius = Math.min(dims.width, dims.height) / 2;
      const dx = x - cx;
      const dy = y - cy;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);
      const maxDist = arenaRadius - radius - safetyMargin;
      
      if (distFromCenter > maxDist) {
        // Push back toward center
        const angle = Math.atan2(dy, dx);
        newX = cx + maxDist * Math.cos(angle);
        newY = cy + maxDist * Math.sin(angle);
        
        // Calculate bounce normal (pointing toward center)
        const len = Math.sqrt(dx * dx + dy * dy);
        bounceVx = -dx / len;
        bounceVy = -dy / len;
      }

      return { x: newX, y: newY, vx: bounceVx, vy: bounceVy };
    }
    if (arenaShape === ARENA_SHAPES.RING) {
      const span = Math.min(dims.width, dims.height);
      const outerRadius = span * RING_OUTER_FRAC;
      const innerRadius = span * RING_INNER_FRAC;
      const dx = x - cx;
      const dy = y - cy;
      const distanceFromCenter = Math.hypot(dx, dy) || 0.0001;
      const safetyMargin = 5;
      const maxDistance = outerRadius - radius - safetyMargin;
      const minDistance = innerRadius + radius + safetyMargin;
      const nx = dx / distanceFromCenter;
      const ny = dy / distanceFromCenter;

      if (distanceFromCenter > maxDistance) {
        return { x: cx + nx * maxDistance, y: cy + ny * maxDistance, vx: -nx, vy: -ny };
      }
      if (distanceFromCenter < minDistance) {
        return { x: cx + nx * minDistance, y: cy + ny * minDistance, vx: nx, vy: ny };
      }
      return { x, y, vx: 0, vy: 0 };
    }

    // Find nearest boundary point and push inward if too close
    const vertices = getShapeBoundaryVertices(dims);

    // "Inward" must come from the polygon's own winding, not a toward-box-center
    // heuristic: concave shapes like the crescent have a bounding-box center that
    // sits inside the carved-out hole, not inside the playable material, which
    // flipped the push direction near the inner arc and let bubbles leak out.
    let windingSum = 0;
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      windingSum += v1.x * v2.y - v2.x * v1.y;
    }
    const flipNormal = windingSum < 0;

    let minDist = Infinity;
    let nearestX = x;
    let nearestY = y;
    let normalX = 0;
    let normalY = 0;

    // Check distance to each edge
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      
      // Distance to edge
      const dist = distanceToSegment(x, y, v1.x, v1.y, v2.x, v2.y);
      if (dist < minDist) {
        minDist = dist;
        
        // Find closest point on segment
        const dx = v2.x - v1.x;
        const dy = v2.y - v1.y;
        const len2 = dx * dx + dy * dy;
        let t = ((x - v1.x) * dx + (y - v1.y) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        
        nearestX = v1.x + t * dx;
        nearestY = v1.y + t * dy;
        
        // Calculate normal (perpendicular to edge, pointing inward per polygon winding)
        let edgeNormalX = -dy;
        let edgeNormalY = dx;
        if (flipNormal) {
          edgeNormalX = -edgeNormalX;
          edgeNormalY = -edgeNormalY;
        }
        const edgeLen = Math.sqrt(edgeNormalX * edgeNormalX + edgeNormalY * edgeNormalY);
        normalX = edgeNormalX / edgeLen;
        normalY = edgeNormalY / edgeLen;
      }
    }

    // If too close to boundary, push back with safety margin
    const requiredDist = radius + safetyMargin;
    if (minDist < requiredDist) {
      const pushDist = requiredDist - minDist;
      newX = x + normalX * pushDist;
      newY = y + normalY * pushDist;
      bounceVx = normalX;
      bounceVy = normalY;
    }

    return { x: newX, y: newY, vx: bounceVx, vy: bounceVy };
  };

  // Generate a random position inside the arena shape
  const getRandomPositionInShape = (radius: number, dims: { width: number; height: number }): { x: number; y: number } => {
    const cx = dims.width / 2;
    const cy = dims.height / 2;
    let attempts = 0;
    const maxAttempts = 2000;

    while (attempts < maxAttempts) {
      attempts++;
      let x = 0;
      let y = 0;

      switch (arenaShape) {
        case ARENA_SHAPES.CIRCLE: {
          const arenaRadius = Math.min(dims.width, dims.height) / 2;
          const maxSpawnRadius = arenaRadius - radius - 8; // keep the full avatar inside the neon ring
          const angle = Math.random() * Math.PI * 2;
          const r = Math.sqrt(Math.random()) * maxSpawnRadius;
          x = cx + r * Math.cos(angle);
          y = cy + r * Math.sin(angle);
          return { x, y }; // Always valid for circle
        }
        case ARENA_SHAPES.HEXAGON:
        case ARENA_SHAPES.PENTAGON:
        case ARENA_SHAPES.DIAMOND: {
          // Generate random point in rectangle and check if it's inside
          x = radius + Math.random() * (dims.width - 2 * radius);
          y = radius + Math.random() * (dims.height - 2 * radius);
          if (isInsideArenaBoundary(x, y, radius, dims)) {
            return { x, y };
          }
          continue;
        }
        case ARENA_SHAPES.HOURGLASS: {
          // Try to place in valid regions
          x = radius + Math.random() * (dims.width - 2 * radius);
          y = radius + Math.random() * (dims.height - 2 * radius);
          if (isInsideArenaBoundary(x, y, radius, dims)) {
            return { x, y };
          }
          continue;
        }
        case ARENA_SHAPES.CROSS: {
          // Choose horizontal or vertical bar
          if (Math.random() < 0.5) {
            // Horizontal bar
            x = radius + Math.random() * (dims.width - 2 * radius);
            y = cy * 0.5 + Math.random() * cy;
          } else {
            // Vertical bar
            x = cx * 0.5 + Math.random() * cx;
            y = radius + Math.random() * (dims.height - 2 * radius);
          }
          break;
        }
        case ARENA_SHAPES.SPIRAL:
        case ARENA_SHAPES.FUNNEL:
        case ARENA_SHAPES.WAVE: {
          x = radius + Math.random() * (dims.width - 2 * radius);
          y = radius + Math.random() * (dims.height - 2 * radius);
          if (isInsideArenaBoundary(x, y, radius, dims)) {
            return { x, y };
          }
          continue;
        }
        default: {
          // Rectangle
          x = radius + Math.random() * (dims.width - 2 * radius);
          y = radius + Math.random() * (dims.height - 2 * radius);
          break;
        }
      }
      if (isInsideArenaBoundary(x, y, radius, dims)) {
        return { x, y };
      }
    }

    // Fallback to center
    return { x: cx, y: cy };
  };

  // ===== Blockade / zone geometry helpers (spec sections 5, 6, 10) =====

  // Half-extents of a blockade's collision box (rect kinds) in its own frame.
  const blockadeHalf = (b: ArenaBlockade) => ({ hw: b.w / 2, hh: b.h / 2 });

  // Bounding radius used for spawn-overlap tests.
  const blockadeBound = (b: ArenaBlockade) =>
    b.shape === "circle" ? b.r : Math.sqrt(b.w * b.w + b.h * b.h) / 2;

  // True when a bubble at (x,y,r) overlaps the blockade's collision geometry.
  const overlapsBlockade = (b: ArenaBlockade, x: number, y: number, r: number): boolean => {
    if (b.shape === "circle") {
      const dx = x - b.x, dy = y - b.y;
      const rr = b.r + r;
      return dx * dx + dy * dy < rr * rr;
    }
    // Rect (optionally rotated): test in the blockade's local frame.
    const a = b.angle || 0;
    const cos = Math.cos(-a), sin = Math.sin(-a);
    const dx = x - b.x, dy = y - b.y;
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    const { hw, hh } = blockadeHalf(b);
    const nx = Math.max(-hw, Math.min(hw, lx));
    const ny = Math.max(-hh, Math.min(hh, ly));
    const ox = lx - nx, oy = ly - ny;
    return ox * ox + oy * oy < r * r;
  };

  // Push a bubble out of a solid blockade and return the surface normal to
  // bounce along. Returns null when there is no penetration to resolve.
  const resolveBlockadePush = (
    b: ArenaBlockade, x: number, y: number, r: number
  ): { x: number; y: number; nx: number; ny: number } | null => {
    if (b.shape === "circle") {
      const dx = x - b.x, dy = y - b.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const need = b.r + r;
      if (d >= need) return null;
      const nx = d > 0.001 ? dx / d : 1;
      const ny = d > 0.001 ? dy / d : 0;
      return { x: b.x + nx * need, y: b.y + ny * need, nx, ny };
    }
    const a = b.angle || 0;
    const cos = Math.cos(-a), sin = Math.sin(-a);
    const dx = x - b.x, dy = y - b.y;
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    const { hw, hh } = blockadeHalf(b);
    const cxl = Math.max(-hw, Math.min(hw, lx));
    const cyl = Math.max(-hh, Math.min(hh, ly));
    let ox = lx - cxl, oy = ly - cyl;
    let d = Math.sqrt(ox * ox + oy * oy);
    if (d >= r) return null;
    if (d < 0.001) {
      // Center is inside the box: eject along the shallowest axis.
      const px = hw - Math.abs(lx);
      const py = hh - Math.abs(ly);
      if (px < py) { ox = lx >= 0 ? 1 : -1; oy = 0; }
      else { ox = 0; oy = ly >= 0 ? 1 : -1; }
      d = 1;
    }
    const lnx = ox / d, lny = oy / d;
    const tlx = cxl + lnx * r;
    const tly = cyl + lny * r;
    // Back to world space.
    const wcos = Math.cos(a), wsin = Math.sin(a);
    return {
      x: b.x + (tlx * wcos - tly * wsin),
      y: b.y + (tlx * wsin + tly * wcos),
      nx: lnx * wcos - lny * wsin,
      ny: lnx * wsin + lny * wcos,
    };
  };

  // Build a fresh blockade layout for the current arena + settings.
  const buildBlockadeLayout = (now: number): ArenaBlockade[] => {
    const dims = getArenaDimensions();
    const density = blockadeDensityRef.current;
    const total = density === "low" ? 4 : density === "high" ? 12 : 8;
    const mv = blockadeMovementRef.current;
    const mvScale = mv === "low" ? 0.5 : mv === "high" ? 1.8 : 1;
    const pool = blockadeModeRef.current === "custom"
      ? ARENA_BLOCKADE_KINDS.filter((k) => blockadeSelectedRef.current.has(k))
      : ARENA_BLOCKADE_KINDS;
    if (pool.length === 0) return [];
    const override = blockadeDurationOverrideRef.current;
    const out: ArenaBlockade[] = [];
    const span = Math.min(dims.width, dims.height);

    const place = (radius: number): { x: number; y: number } | null => {
      const xArr = xRef.current, yArr = yRef.current, rArr = rRef.current;
      const n = countRef.current;
      for (let attempt = 0; attempt < 24; attempt++) {
        const pos = getRandomPositionInShape(radius + 12, dims);
        let ok = true;
        for (const o of out) {
          const dx = o.x - pos.x, dy = o.y - pos.y;
          const need = blockadeBound(o) + radius + 26;
          if (dx * dx + dy * dy < need * need) { ok = false; break; }
        }
        // Never drop a blockade on top of a live bubble (spec section 10).
        if (ok && xArr && yArr && rArr) {
          for (let b = 0; b < n; b++) {
            const dx = xArr[b] - pos.x, dy = yArr[b] - pos.y;
            const need = rArr[b] + radius + 14;
            if (dx * dx + dy * dy < need * need) { ok = false; break; }
          }
        }
        if (ok) return pos;
      }
      return null;
    };

    for (let i = 0; i < total; i++) {
      const kind = pool[Math.floor(Math.random() * pool.length)];
      const meta = kind;
      let b: ArenaBlockade | null = null;
      const id = nextProjectileId++;
      const base = { id, kind, createdAt: now, x: 0, y: 0, w: 0, h: 0, r: 0 };

      switch (meta) {
        case "stone":
        case "invisible_wall":
        case "breakable": {
          const w = span * 0.11, h = span * 0.06;
          const p = place(Math.max(w, h) / 2); if (!p) break;
          b = { ...base, shape: "rect", x: p.x, y: p.y, w, h, r: 0, solid: true, hp: meta === "breakable" ? 3 : undefined };
          break;
        }
        case "spike_block": {
          const s = span * 0.05;
          const p = place(s / 2); if (!p) break;
          b = { ...base, shape: "rect", x: p.x, y: p.y, w: s, h: s, r: 0, solid: true };
          break;
        }
        case "bouncy_pad": {
          const s = span * 0.07;
          const p = place(s / 2); if (!p) break;
          b = { ...base, shape: "circle", x: p.x, y: p.y, w: 0, h: 0, r: s / 2, solid: false };
          break;
        }
        case "moving_block": {
          const w = span * 0.09, h = span * 0.055;
          const p = place(Math.max(w, h) / 2); if (!p) break;
          const q = place(Math.max(w, h) / 2) || p;
          b = {
            ...base, shape: "rect", x: p.x, y: p.y, w, h, r: 0, solid: true,
            ax: p.x, ay: p.y, bx: q.x, by: q.y, t: 0, dir: 1, pathSpeed: 0.00018 * mvScale,
          };
          break;
        }
        case "rotating_bar": {
          const w = span * 0.24, h = span * 0.035;
          const p = place(w / 2); if (!p) break;
          b = { ...base, shape: "rect", x: p.x, y: p.y, w, h, r: 0, solid: true, angle: Math.random() * Math.PI, spin: 0.0009 * mvScale };
          break;
        }
        case "conveyor": {
          const w = span * 0.16, h = span * 0.07;
          const p = place(Math.max(w, h) / 2); if (!p) break;
          const ang = Math.random() * Math.PI * 2;
          b = { ...base, shape: "rect", x: p.x, y: p.y, w, h, r: 0, solid: false, fx: Math.cos(ang), fy: Math.sin(ang) };
          break;
        }
        case "laser_wall": {
          const horizontal = Math.random() < 0.5;
          const w = horizontal ? span * 0.3 : span * 0.02;
          const h = horizontal ? span * 0.02 : span * 0.3;
          const p = place(Math.max(w, h) / 2); if (!p) break;
          b = { ...base, shape: "rect", x: p.x, y: p.y, w, h, r: 0, solid: false, active: true };
          break;
        }
        case "rotating_blade": {
          const rr = span * 0.05;
          const p = place(rr); if (!p) break;
          b = { ...base, shape: "circle", x: p.x, y: p.y, w: 0, h: 0, r: rr, solid: false, angle: 0, spin: 0.004 * mvScale };
          break;
        }
        case "energy_wall": {
          const w = span * 0.2, h = span * 0.025;
          const p = place(w / 2); if (!p) break;
          b = { ...base, shape: "rect", x: p.x, y: p.y, w, h, r: 0, solid: true, expiresAt: now + (override || 8000) };
          break;
        }
        case "asteroid": {
          const rr = span * (0.035 + Math.random() * 0.03);
          const p = place(rr); if (!p) break;
          b = { ...base, shape: "circle", x: p.x, y: p.y, w: 0, h: 0, r: rr, solid: true };
          break;
        }
        case "moving_asteroid": {
          const rr = span * 0.04;
          const p = place(rr); if (!p) break;
          const q = place(rr) || p;
          b = {
            ...base, shape: "circle", x: p.x, y: p.y, w: 0, h: 0, r: rr, solid: true,
            ax: p.x, ay: p.y, bx: q.x, by: q.y, t: 0, dir: 1, pathSpeed: 0.00015 * mvScale,
          };
          break;
        }
        case "vanishing_block": {
          const w = span * 0.09, h = span * 0.05;
          const p = place(Math.max(w, h) / 2); if (!p) break;
          b = { ...base, shape: "rect", x: p.x, y: p.y, w, h, r: 0, solid: true, expiresAt: now + (override || 6000 + Math.random() * 4000) };
          break;
        }
        case "pusher": {
          const rr = span * 0.09;
          const p = place(rr); if (!p) break;
          const ang = Math.random() * Math.PI * 2;
          b = { ...base, shape: "circle", x: p.x, y: p.y, w: 0, h: 0, r: rr, solid: false, fx: Math.cos(ang), fy: Math.sin(ang) };
          break;
        }
        case "teleport_gate": {
          const rr = span * 0.045;
          const p = place(rr); if (!p) break;
          const q = place(rr); if (!q) break;
          const idB = nextProjectileId++;
          const gateA: ArenaBlockade = { ...base, shape: "circle", x: p.x, y: p.y, w: 0, h: 0, r: rr, solid: false, linkId: idB };
          const gateB: ArenaBlockade = { id: idB, kind: "teleport_gate", createdAt: now, shape: "circle", x: q.x, y: q.y, w: 0, h: 0, r: rr, solid: false, linkId: id };
          out.push(gateA, gateB);
          break;
        }
      }
      if (b) {
        if (override > 0 && b.expiresAt === undefined) b.expiresAt = now + override;
        out.push(b);
      }
    }
    return out;
  };

  // Spawn one zone of an allowed kind at a valid position.
  const spawnArenaZone = (now: number) => {
    const pool = zoneModeRef.current === "custom"
      ? ARENA_ZONE_KINDS.filter((k) => zoneSelectedRef.current.has(k))
      : ARENA_ZONE_KINDS;
    if (pool.length === 0) return;
    const dims = getArenaDimensions();
    const kind = pool[Math.floor(Math.random() * pool.length)];
    const span = Math.min(dims.width, dims.height);
    const r = span * (0.08 + Math.random() * 0.06);
    let placed: { x: number; y: number } | null = null;
    for (let attempt = 0; attempt < 16; attempt++) {
      const pos = getRandomPositionInShape(r * 0.5, dims);
      let ok = true;
      for (const z of arenaZonesRef.current) {
        const dx = z.x - pos.x, dy = z.y - pos.y;
        const need = z.r + r;
        if (dx * dx + dy * dy < need * need) { ok = false; break; }
      }
      if (ok) { placed = pos; break; }
    }
    if (!placed) return;
    const life = zoneDurationOverrideRef.current || 12000;
    const ang = Math.random() * Math.PI * 2;
    arenaZonesRef.current.push({
      id: nextProjectileId++, kind, x: placed.x, y: placed.y, r,
      createdAt: now, expiresAt: now + life,
      fx: Math.cos(ang), fy: Math.sin(ang),
    });
    setArenaZones([...arenaZonesRef.current]);
  };

  // Reset every global multiplier an event may have changed (spec section 8).
  const clearEventGlobals = () => {
    globalDamageMultRef.current = 1;
    globalStepMultRef.current = 1;
    arenaShrinkPadRef.current = 0;
    setArenaShrinkPad(0);
    arenaMeteorsRef.current = [];
    setArenaMeteors([]);
    arenaSwordsRef.current = [];
    setArenaSwords([]);
  };


  // Generate spike positions on arena shape boundaries
  const generateSpikesForShape = (count: number, _size: number, dims: { width: number; height: number }): Omit<Spike, "size">[] => {
    const spikes: Omit<Spike, "size">[] = [];
    const vertices = getShapeBoundaryVertices(dims);
    
    if (vertices.length < 2 || count === 0) return spikes;

    // Calculate total perimeter and edge lengths
    let totalPerimeter = 0;
    const edgeLengths: number[] = [];
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % vertices.length];
      const dx = v2.x - v1.x;
      const dy = v2.y - v1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      edgeLengths.push(length);
      totalPerimeter += length;
    }

    if (totalPerimeter === 0) return spikes;

    // Distribute spikes evenly along perimeter
    const spacing = totalPerimeter / count;

    for (let i = 0; i < count; i++) {
      // Calculate target distance along perimeter
      const targetDist = (i + 0.5) * spacing;
      
      // Find which edge this spike should be on
      let accumulatedDist = 0;
      let edgeIndex = 0;
      
      for (let j = 0; j < edgeLengths.length; j++) {
        if (targetDist >= accumulatedDist && targetDist < accumulatedDist + edgeLengths[j]) {
          edgeIndex = j;
          break;
        }
        accumulatedDist += edgeLengths[j];
      }
      
      const v1 = vertices[edgeIndex];
      const v2 = vertices[(edgeIndex + 1) % vertices.length];
      const edgeLen = edgeLengths[edgeIndex];
      
      // Calculate position along this edge
      const distAlongEdge = targetDist - accumulatedDist;
      const t = distAlongEdge / edgeLen;
      
      const x = v1.x + (v2.x - v1.x) * t;
      const y = v1.y + (v2.y - v1.y) * t;
      
      // Calculate edge direction and normal (pointing inward)
      const edgeDx = v2.x - v1.x;
      const edgeDy = v2.y - v1.y;
      const edgeLenAtPos = Math.hypot(edgeDx, edgeDy);
      
      // Normal perpendicular to edge (rotate edge vector by 90°)
      let nx = -edgeDy / edgeLenAtPos;
      let ny = edgeDx / edgeLenAtPos;
      
      // Make sure normal points toward center
      const cx = dims.width / 2;
      const cy = dims.height / 2;
      const toCenterX = cx - x;
      const toCenterY = cy - y;
      if (nx * toCenterX + ny * toCenterY < 0) {
        nx = -nx;
        ny = -ny;
      }
      
      spikes.push({ x, y, nx, ny });
    }

    // Inset spikes slightly so they sit inside the wall
    return spikes;
  };

  // Get CSS styles for arena shape. Circle stays a border-radius; every other
  // shape derives its clip-path from the same normalized polygon used for physics.
  const getArenaShapeStyle = (): React.CSSProperties => {
    if (arenaShape === ARENA_SHAPES.CIRCLE) return { borderRadius: "50%" };
    if (arenaShape === ARENA_SHAPES.RING) {
      // Stops are expressed as % of "closest-side" (center-to-edge distance) so they
      // land on the exact same radius as the SVG outline's rx/ry (fraction of box width).
      // Without the explicit "closest-side" keyword, bare percentages resolve against
      // farthest-corner (the diagonal) — a different, larger reference length — which is
      // why the mask's visible material previously sat well inside the neon SVG outline.
      const innerPct = RING_INNER_FRAC * 200;
      const outerPct = RING_OUTER_FRAC * 200;
      const gradient = `radial-gradient(circle closest-side at 50% 50%, transparent 0 ${(innerPct - 0.4).toFixed(1)}%, #000 ${(innerPct + 0.4).toFixed(1)}% ${outerPct}%, transparent ${(outerPct + 0.8).toFixed(1)}%)`;
      return {
        borderRadius: "50%",
        WebkitMaskImage: gradient,
        maskImage: gradient,
      };
    }
    if (arenaShape === ARENA_SHAPES.RECTANGLE || arenaShape === ARENA_SHAPES.SQUARE) return { borderRadius: "0" };
    const poly = SHAPE_POLYGONS[arenaShape];
    if (!poly) return { borderRadius: "0" };
    return { clipPath: polygonToClipPath(poly) };
  };

  // CSS clipping keeps the game mechanics inside each arena. This separate SVG
  // traces the exact same geometry so non-rectangular arenas get a real neon
  // edge instead of a rectangular CSS border.
  const renderArenaOutline = () => {
    const props = { fill: "none", stroke: "var(--arena-glow-primary)", strokeWidth: 8, vectorEffect: "non-scaling-stroke" as const };
    if (arenaShape === ARENA_SHAPES.CIRCLE) return <ellipse cx="50" cy="50" rx="50" ry="50" {...props} />;
    if (arenaShape === ARENA_SHAPES.RECTANGLE || arenaShape === ARENA_SHAPES.SQUARE) {
      return <rect x="0" y="0" width="100" height="100" {...props} />;
    }
    if (arenaShape === ARENA_SHAPES.RING) {
      // Ring draws both the outer boundary and the inner tube wall — a closed donut.
      return (
        <>
          <ellipse cx="50" cy="50" rx={RING_OUTER_FRAC * 100} ry={RING_OUTER_FRAC * 100} {...props} />
          <ellipse cx="50" cy="50" rx={RING_INNER_FRAC * 100} ry={RING_INNER_FRAC * 100} {...props} />
        </>
      );
    }
    const poly = SHAPE_POLYGONS[arenaShape];
    if (poly) return <polygon points={polygonToSvgPoints(poly)} {...props} />;
    return <rect x="0" y="0" width="100" height="100" {...props} />;
  };

  const ensureCapacity = (needed: number) => {
    let cap = MAX_CAPACITY.current;
    if (needed <= cap && idListRef.current && avatarIndexRef.current) return;
    while (cap < needed) cap = Math.max(cap * 2, cap + 1024);
    const idNew = new Int32Array(cap);
    const xNew = new Float32Array(cap);
    const yNew = new Float32Array(cap);
    const vxNew = new Float32Array(cap);
    const vyNew = new Float32Array(cap);
    const rNew = new Float32Array(cap);
    const rTargetNew = new Float32Array(cap);
    const healthNew = new Float32Array(cap);
    const imgIdxNew = new Int32Array(cap);
    const avatarIdxNew = new Int32Array(cap);

    const n = countRef.current;
    if (idListRef.current) idNew.set(idListRef.current.subarray(0, n));
    if (xRef.current) xNew.set(xRef.current.subarray(0, n));
    if (yRef.current) yNew.set(yRef.current.subarray(0, n));
    if (vxRef.current) vxNew.set(vxRef.current.subarray(0, n));
    if (vyRef.current) vyNew.set(vyRef.current.subarray(0, n));
    if (rRef.current) rNew.set(rRef.current.subarray(0, n));
    if (rTargetRef.current) rTargetNew.set(rTargetRef.current.subarray(0, n));
    if (healthRef.current) healthNew.set(healthRef.current.subarray(0, n));
    if (imgIndexRef.current) imgIdxNew.set(imgIndexRef.current.subarray(0, n));
    if (avatarIndexRef.current) avatarIdxNew.set(avatarIndexRef.current.subarray(0, n));

    idListRef.current = idNew;
    xRef.current = xNew;
    yRef.current = yNew;
    vxRef.current = vxNew;
    vyRef.current = vyNew;
    rRef.current = rNew;
    rTargetRef.current = rTargetNew;
    healthRef.current = healthNew;
    imgIndexRef.current = imgIdxNew;
    avatarIndexRef.current = avatarIdxNew;
    MAX_CAPACITY.current = cap;
  };

  // ---------- Workers init & image pipeline (kept mostly) ----------

  const initImageDecodeWorker = () => {
    if (imageDecodeWorkerRef.current) return;
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      imageDecodeWorkerRef.current = new Worker(new URL("../workers/imageDecoderWorker.js", import.meta.url), { type: "module" });
      imageDecodeWorkerRef.current.onmessage = (ev: MessageEvent) => {
        const { type, src, bitmap, success } = ev.data;
        if (type === "decoded" && success && bitmap) {
          imageBitmapCache.current.set(src, bitmap);
          imagesDecodingRef.current.delete(src);
          processMaskCreationQueue();
          processImageDecodeQueue();
        } else if (type === "decoded") {
          imagesDecodingRef.current.delete(src);
          imagesToDecodeRef.current.delete(src);
          processImageDecodeQueue();
        }
      };
    } catch (e) {
      console.warn("Image decode worker failed to initialize:", e);
    }
  };

  const initImageMaskWorker = () => {
    if (imageMaskWorkerRef.current) return;
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      imageMaskWorkerRef.current = new Worker(new URL("../workers/imageMaskWorker.js", import.meta.url), { type: "module" });
      imageMaskWorkerRef.current.onmessage = (ev: MessageEvent) => {
        const { type, id, bitmap, success } = ev.data;
        if (type === "masked") {
          const key = id as string;
          maskedCreatingSetRef.current.delete(key);
          if (success && bitmap) {
            try {
              const old = maskedBitmapCacheRef.current.get(key);
              if (old && (old as any).close) {
                try {
                  (old as any).close();
                } catch (e) {}
              }
              maskedBitmapCacheRef.current.set(key, bitmap);
              maskedLruRef.current.push(key);
              const sizeMatch = key.match(/::r(\d+)$/);
              const bucket = sizeMatch ? parseInt(sizeMatch[1], 10) : 32;
              const px = Math.max(1, bucket * 2);
              maskedPixelBytesRef.current += px * px * 4;
              while (maskedPixelBytesRef.current > MASKED_CACHE_PIXEL_SOFT_LIMIT && maskedLruRef.current.length > 0) {
                const evictKey = maskedLruRef.current.shift()!;
                const evictBmp = maskedBitmapCacheRef.current.get(evictKey);
                if (evictBmp) {
                  maskedPixelBytesRef.current -= (Math.max(1, parseInt(evictKey.split("::r").pop() || "16") * 2) ** 2) * 4;
                  try {
                    (evictBmp as any).close && (evictBmp as any).close();
                  } catch (e) {}
                  maskedBitmapCacheRef.current.delete(evictKey);
                }
              }
            } catch (e) {}
          }
          processMaskCreationQueue(0);
        }
      };
    } catch (e) {
      console.warn("Image mask worker failed to initialize:", e);
    }
  };

  const queueImageDecode = (src: string) => {
    if (!src) return;
    if (imageBitmapCache.current.has(src)) return;
    if (imagesDecodingRef.current.has(src)) return;
    if (imagesToDecodeRef.current.has(src)) return;
    imagesToDecodeRef.current.add(src);
    processImageDecodeQueue();
  };

  const processImageDecodeQueue = () => {
    if (!imageDecodeWorkerRef.current) return;
    if (imagesDecodingRef.current.size >= IMAGE_DECODE_CONCURRENCY) return;
    const toProcess = imagesToDecodeRef.current;
    if (toProcess.size === 0) return;
    const nextSrc = toProcess.values().next().value;
    if (!nextSrc) return;
    toProcess.delete(nextSrc);
    imagesDecodingRef.current.add(nextSrc);
    try {
      imageDecodeWorkerRef.current.postMessage({ type: "decode", id: Math.random(), src: nextSrc });
    } catch (e) {
      imagesDecodingRef.current.delete(nextSrc);
    }
  };

  const preloadImage = (src: string) =>
    new Promise<void>((resolve, reject) => {
      if (!src) return reject("no-src");
      if (textureCache.current.has(src)) return resolve();
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        textureCache.current.set(src, img);
        // queue decode (worker)
        queueImageDecode(src);
        resolve();
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });

  const getImgIndex = (src: string) => {
    if (!src) return -1;
    let idx = imgSrcsRef.current.indexOf(src);
    if (idx >= 0) return idx;
    idx = imgSrcsRef.current.length;
    imgSrcsRef.current.push(src);
    return idx;
  };

  const pickBucketForRadius = (r: number) => {
    for (let i = 0; i < BUCKET_SIZES.length; i++) {
      if (r <= BUCKET_SIZES[i]) return BUCKET_SIZES[i];
    }
    return BUCKET_SIZES[BUCKET_SIZES.length - 1];
  };

  const maskedKey = (src: string, bucket: number) => `${src}::r${bucket}`;

  const enqueueMaskedCreation = (src: string, bucket: number) => {
    const key = maskedKey(src, bucket);
    if (maskedBitmapCacheRef.current.has(key) || maskedCreatingSetRef.current.has(key)) return;
    if (maskedCreateQueueRef.current.indexOf(key) >= 0) return;
    maskedCreateQueueRef.current.push(key);
    processMaskCreationQueue();
  };

  const processMaskCreationQueue = (budget = REVEAL_BATCH_PER_TICK) => {
    if (!imageMaskWorkerRef.current) return;
    let sent = 0;
    const concurrency = Math.max(2, navigator.hardwareConcurrency || 2);
    while (
      maskedCreateQueueRef.current.length > 0 &&
      sent < budget &&
      maskedCreatingSetRef.current.size < concurrency
    ) {
      const key = maskedCreateQueueRef.current.shift()!;
      if (!key) break;
      if (maskedBitmapCacheRef.current.has(key)) continue;
      if (maskedCreatingSetRef.current.has(key)) continue;
      maskedCreatingSetRef.current.add(key);
      sent++;
      const parts = key.split("::r");
      const src = parts[0];
      const bucket = parseInt(parts[1], 10) || 32;
      const outSize = Math.max(2, bucket * 2);
      try {
        imageMaskWorkerRef.current.postMessage({ type: "mask", id: key, src, size: outSize });
      } catch (e) {
        maskedCreatingSetRef.current.delete(key);
      }
    }
  };

  const touchMaskedKey = (key: string) => {
    const idx = maskedLruRef.current.indexOf(key);
    if (idx >= 0) {
      maskedLruRef.current.splice(idx, 1);
      maskedLruRef.current.push(key);
    } else {
      maskedLruRef.current.push(key);
    }
  };

  // ---------- Spike placement & detection ----------

  const detectSpikeHit = (bx: number, by: number, br: number) => {
    for (const s of spikePositions) {
      // Spike is a triangle with base at s.x, s.y and tip pointing inward along normal
      const tipX = s.x + s.nx * spikeSize;
      const tipY = s.y + s.ny * spikeSize;
      
      // Calculate perpendicular vector to normal for base width
      const perpX = -s.ny;
      const perpY = s.nx;
      
      // Triangle vertices: base left, base right, tip
      const halfBase = spikeSize / 2;
      const v1x = s.x + perpX * halfBase;
      const v1y = s.y + perpY * halfBase;
      const v2x = s.x - perpX * halfBase;
      const v2y = s.y - perpY * halfBase;
      const v3x = tipX;
      const v3y = tipY;
      
      // Check distance from bubble center to each of the three edges
      const dist1 = distanceToSegment(bx, by, v1x, v1y, v2x, v2y); // base
      const dist2 = distanceToSegment(bx, by, v2x, v2y, v3x, v3y); // right edge
      const dist3 = distanceToSegment(bx, by, v3x, v3y, v1x, v1y); // left edge
      
      const minDist = Math.min(dist1, dist2, dist3);
      if (minDist <= br) {
        return s;
      }
    }
    return null;
  };

  // ---------- Blade collision detection ----------
  
  const detectBladeHit = (bubbleAX: number, bubbleAY: number, bubbleARadius: number, bubbleBX: number, bubbleBY: number, bubbleBRadius: number, bubbleBHasBlade: boolean, isSuperbubbleBlade: boolean = false): boolean => {
    if (!bubbleBHasBlade) return false;
    
    // Blade uses proportional sizing (matching visual rendering)
    // For normal: 10% gap, 15% ring, 20% teeth
    // For super: 8% gap, 12% ring, 18% teeth
    const gapFromBubble = isSuperbubbleBlade ? bubbleBRadius * 0.08 : bubbleBRadius * 0.10;
    const ringThickness = isSuperbubbleBlade ? bubbleBRadius * 0.12 : bubbleBRadius * 0.15;
    const toothLength = isSuperbubbleBlade ? bubbleBRadius * 0.18 : bubbleBRadius * 0.20;
    const ringInnerRadius = bubbleBRadius + gapFromBubble;
    const ringOuterRadius = ringInnerRadius + ringThickness;
    const bladeOuterEdge = ringOuterRadius + toothLength;
    
    const dx = bubbleAX - bubbleBX;
    const dy = bubbleAY - bubbleBY;
    const distanceBetweenCenters = Math.sqrt(dx * dx + dy * dy);
    
    // Bubble A hits blade if it touches the ring or teeth area (from ringInnerRadius to bladeOuterEdge)
    const closestDistFromA = distanceBetweenCenters - bubbleARadius;
    const farthestDistFromA = distanceBetweenCenters + bubbleARadius;
    
    // Check if bubble A overlaps with the blade zone
    if (closestDistFromA <= bladeOuterEdge && farthestDistFromA >= ringInnerRadius) {
      return true;
    }
    
    return false;
  };
  
  // Detect blade-to-blade collision (both bubbles have blades)
  const detectBladeToBladeCollision = (bubble1X: number, bubble1Y: number, bubble1Radius: number, bubble2X: number, bubble2Y: number, bubble2Radius: number, isBubble1Super: boolean = false, isBubble2Super: boolean = false): { collides: boolean; contactX: number; contactY: number } => {
    // Calculate blade outer edges using proportional sizing
    const gap1 = isBubble1Super ? bubble1Radius * 0.08 : bubble1Radius * 0.10;
    const ring1 = isBubble1Super ? bubble1Radius * 0.12 : bubble1Radius * 0.15;
    const tooth1 = isBubble1Super ? bubble1Radius * 0.18 : bubble1Radius * 0.20;
    const blade1OuterEdge = bubble1Radius + gap1 + ring1 + tooth1;
    
    const gap2 = isBubble2Super ? bubble2Radius * 0.08 : bubble2Radius * 0.10;
    const ring2 = isBubble2Super ? bubble2Radius * 0.12 : bubble2Radius * 0.15;
    const tooth2 = isBubble2Super ? bubble2Radius * 0.18 : bubble2Radius * 0.20;
    const blade2OuterEdge = bubble2Radius + gap2 + ring2 + tooth2;
    
    const dx = bubble2X - bubble1X;
    const dy = bubble2Y - bubble1Y;
    const distanceBetweenCenters = Math.sqrt(dx * dx + dy * dy);
    
    // Blades collide if distance between centers is less than sum of blade outer edges
    if (distanceBetweenCenters < blade1OuterEdge + blade2OuterEdge) {
      // Calculate contact point (midpoint between blade edges)
      const ratio = blade1OuterEdge / (blade1OuterEdge + blade2OuterEdge);
      const contactX = bubble1X + dx * ratio;
      const contactY = bubble1Y + dy * ratio;
      return { collides: true, contactX, contactY };
    }
    
    return { collides: false, contactX: 0, contactY: 0 };
  };

  // ---------- Canvas blade drawing function (for perfect sync) ----------
  const drawBladeOnCanvas = (ctx: CanvasRenderingContext2D, x: number, y: number, targetRadius: number, rotation: number, isSuperbubble: boolean = false) => {
    // Proportional sizing matching the collision detection
    const gapFromBubble = isSuperbubble ? targetRadius * 0.08 : targetRadius * 0.10;
    const ringThickness = isSuperbubble ? targetRadius * 0.12 : targetRadius * 0.15;
    const toothLength = isSuperbubble ? targetRadius * 0.18 : targetRadius * 0.20;
    const ringInnerRadius = targetRadius + gapFromBubble;
    const ringOuterRadius = ringInnerRadius + ringThickness;
    const numTeeth = isSuperbubble ? 32 : 24;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    // Draw ring (donut shape)
    const ringMiddle = (ringInnerRadius + ringOuterRadius) / 2;
    ctx.beginPath();
    ctx.arc(0, 0, ringMiddle, 0, Math.PI * 2);
    ctx.lineWidth = ringThickness;
    
    // Create gradient for metallic look
    const gradient = ctx.createLinearGradient(-ringOuterRadius, -ringOuterRadius, ringOuterRadius, ringOuterRadius);
    if (isSuperbubble) {
      gradient.addColorStop(0, '#ff9999');
      gradient.addColorStop(0.5, '#cc4444');
      gradient.addColorStop(1, '#882222');
    } else {
      gradient.addColorStop(0, '#d0d0d0');
      gradient.addColorStop(0.5, '#888888');
      gradient.addColorStop(1, '#606060');
    }
    ctx.strokeStyle = gradient;
    ctx.stroke();
    
    // Draw teeth pointing outward
    const toothFill = isSuperbubble ? '#cc5555' : '#a0a0a0';
    const toothStroke = isSuperbubble ? '#662222' : '#505050';
    
    for (let i = 0; i < numTeeth; i++) {
      const angle = (i / numTeeth) * Math.PI * 2;
      const halfToothAngle = (0.3 / numTeeth) * Math.PI * 2;
      
      // Base of tooth on outer edge of ring
      const baseX1 = Math.cos(angle - halfToothAngle) * ringOuterRadius;
      const baseY1 = Math.sin(angle - halfToothAngle) * ringOuterRadius;
      const baseX2 = Math.cos(angle + halfToothAngle) * ringOuterRadius;
      const baseY2 = Math.sin(angle + halfToothAngle) * ringOuterRadius;
      
      // Tip of tooth pointing outward
      const tipX = Math.cos(angle) * (ringOuterRadius + toothLength);
      const tipY = Math.sin(angle) * (ringOuterRadius + toothLength);
      
      ctx.beginPath();
      ctx.moveTo(baseX1, baseY1);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(baseX2, baseY2);
      ctx.closePath();
      ctx.fillStyle = toothFill;
      ctx.fill();
      ctx.strokeStyle = toothStroke;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    
    ctx.restore();
  };

  const drawAvatarOnCanvas = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, avatarIndex: number): boolean => {
    const image = textureCache.current.get(AVATAR_SPRITE_SRC);
    if (!image || !image.complete || !image.naturalWidth) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = ["#ef4444", "#22d3ee", "#22c55e", "#facc15", "#a855f7", "#e5e7eb"][avatarIndex % 6];
      ctx.fill();
      return false;
    }
    const sourceWidth = image.naturalWidth / 6;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(image, Math.max(0, avatarIndex % 6) * sourceWidth, 0, sourceWidth, image.naturalHeight, x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
    return true;
  };

  const drawBubbleGlowAndTrail = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, vx: number, vy: number, color: string) => {
    const velocity = Math.hypot(vx, vy);
    if (velocity < 0.05 || radius < 16) return;
    const directionX = vx / velocity;
    const directionY = vy / velocity;
    const trailLength = Math.min(radius * 1.6, 12 + velocity * 2.5);
    const trailParticles = [
      { distance: radius * 0.95 + trailLength * 0.2, size: radius * 0.22, alpha: 0.72 },
      { distance: radius * 0.95 + trailLength * 0.58, size: radius * 0.15, alpha: 0.42 },
      { distance: radius * 0.95 + trailLength, size: radius * 0.09, alpha: 0.2 },
    ];
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = Math.max(5, radius * 0.2);
    ctx.globalCompositeOperation = "lighter";
    for (const particle of trailParticles) {
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(
        x - directionX * particle.distance,
        y - directionY * particle.distance,
        particle.size,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();
  };

  // ---------- Loading images & creating particles ----------

  useLayoutEffect(() => {
    if (!arenaType) return;
    if (!arenaReady) return; // only run after shape selection is complete
    if (isRunning) return;

    (async () => {
      const arena = getArenaDimensions();

      const addBubblesToArrays = async (bubblesToAdd: BubbleData[], preloadImages = false) => {
        const currentN = countRef.current;
        const needed = currentN + bubblesToAdd.length;
        ensureCapacity(needed);
        const idArr = idListRef.current!;
        const xArr = xRef.current!;
        const yArr = yRef.current!;
        const vxArr = vxRef.current!;
        const vyArr = vyRef.current!;
        const rArr = rRef.current!;
        const rTArr = rTargetRef.current!;
        const hArr = healthRef.current!;
        const imgIdxArr = imgIndexRef.current!;
          const avatarIdxArr = avatarIndexRef.current!;

        for (let i = 0; i < bubblesToAdd.length; i++) {
          const b = bubblesToAdd[i];
          const idx = currentN + i;
          idArr[idx] = b.id;
          indexOfIdRef.current[b.id] = idx;
          xArr[idx] = clamp(b.x, b.radius, arena.width - b.radius);
          yArr[idx] = clamp(b.y, b.radius, arena.height - b.radius);
          vxArr[idx] = b.vx;
          vyArr[idx] = b.vy;
          // start small and animate to the target
          rTArr[idx] = b.radius;
          rArr[idx] = INITIAL_RADIUS;
          hArr[idx] = b.health;
          avatarIdxArr[idx] = b.avatar ?? -1;
          if (b.imgSrc) {
            const imgSrc = b.imgSrc;
            const imgIndex = getImgIndex(imgSrc);
            imgIdxArr[idx] = imgIndex;
            if (preloadImages) {
              // only preload small number or when reveal is desired — avoid mass main-thread work
              preloadImage(imgSrc).catch(() => {});
            }
          } else {
            imgIdxArr[idx] = -1;
          }
        }
        countRef.current = needed;
        const snap: BubbleData[] = [];
        for (let k = 0; k < countRef.current; k++) {
          snap.push({
            x: xArr[k],
            y: yArr[k],
            radius: rArr[k],
            health: hArr[k],
            imgSrc: imgSrcsRef.current[imgIdxArr[k]] ?? "",
            vx: vxArr[k],
            vy: vyArr[k],
            id: idArr[k],
            name: playerNamesRef.current.get(idArr[k]),
            avatar: avatarIdxArr[k] >= 0 ? avatarIdxArr[k] : undefined,
          });
        }
        setUiBubblesSnapshot(snap);
        setActiveCount(snap.length);
        startRevealPipelineIfNeeded();
      };

      let matchPayload: MatchPayload | null = null;
      try {
        const rawPayload = sessionStorage.getItem("bubblebash.match");
        if (rawPayload) matchPayload = JSON.parse(rawPayload) as MatchPayload;
        if (customRosterRequested && rawPayload !== customMatchPayloadRef.current) {
          customMatchPayloadRef.current = rawPayload || "";
          customMatchLoadedRef.current = false;
        }
      } catch (e) {
        console.warn("Could not read Bubble Bash match payload", e);
      }

      if (customRosterRequested && matchPayload?.players?.length) {
        if (customMatchLoadedRef.current) return;
        customMatchLoadedRef.current = true;
        brawlTeamsRef.current.clear();
        brawl1vManyAllMembersRef.current = [];
        preloadImage(AVATAR_SPRITE_SRC).catch(() => {});
        const targetRadius = arenaType === ARENA_TYPES.BRAWL || arenaType === ARENA_TYPES.BOSS ? 50 : getRadiusForCount(matchPayload.players.length);
        baseBubbleRadiusRef.current = targetRadius;
        const imagePath = "images";
        const makePlayerBubble = (player: MatchPlayer, index: number): BubbleData => {
          const position = getRandomPositionInShape(targetRadius, arena);
          const id = nextBubbleId++;
          const playerName = player.name || player.username || player.playerName || `Player ${index + 1}`;
          const imageName = player.imageName || player.image || player.imageSrc;
          const imageSrc = imageName ? (imageName.startsWith("http") || imageName.startsWith("/") ? imageName : `http://localhost:5000/api/${imagePath}/${encodeURIComponent(imageName)}`) : "";
          playerNamesRef.current.set(id, playerName);
            if (arenaType === ARENA_TYPES.BRAWL) {
              const team = matchPayload?.mode === "duel"
                ? index === 0 ? "solo" : "many"
                : matchPayload?.soloPlayer
                  ? matchPayload.soloPlayer === playerName ? "solo" : "many"
                  : player.role === "solo" ? "solo" : "many";
              brawlTeamsRef.current.set(id, team);
            }
          return {
            x: position.x,
            y: position.y,
            radius: targetRadius,
            health: player.hp || 100,
            imgSrc: imageSrc,
            avatar: imageSrc ? undefined : (player.avatar ?? index % 6),
            vx: Math.cos(Math.random() * Math.PI * 2) * speed * 0.5,
            vy: Math.sin(Math.random() * Math.PI * 2) * speed * 0.5,
            id,
            name: playerName,
          };
        };

        const assignEntryPowers = (players: MatchPlayer[], startIndex: number) => {
          // Normal-mode powers are opt-in only via the in-arena "Normal Powers" toggle —
          // never auto-armed from roster data, so bubbles don't fire until the user enables it.
          if (arenaType === ARENA_TYPES.NORMAL) return;
          const nowMs = Date.now();
          players.forEach((player, index) => {
            const power = player.powers?.[0]?.key;
            const bubbleId = idListRef.current?.[startIndex + index];
            if (power && bubbleId != null) {
              bubblePowersRef.current.set(bubbleId, { type: power, expiresAt: Infinity, lastShot: nowMs - 1000 });
            }
          });
          if (bubblePowersRef.current.size) {
            setBubblePowers(new Map(bubblePowersRef.current));
            brawlPowersEnabledRef.current = true;
            brawlPowersAutoEnabledRef.current = true;
            preAssignedAppliedRef.current = true;
          }
        };

        if (arenaType === ARENA_TYPES.BOSS) {
          const bossPlayer = matchPayload.players.find((player) => player.role === "boss") || matchPayload.players[0];
          const normalPlayers = matchPayload.players.filter((player) => player.role !== "boss" && player !== bossPlayer);
          const startIndex = countRef.current;
          await addBubblesToArrays(normalPlayers.map(makePlayerBubble));
          assignEntryPowers(normalPlayers, startIndex);
          const bossPosition = getRandomPositionInShape(baseSuperBubbleRadiusRef.current, arena);
          const bossImagesResponse = await fetch("http://localhost:5000/api/superbubbleimg");
          const bossImages: string[] = await bossImagesResponse.json();
          setSuperbubbleImageOptions(bossImages);
          const selectedBossImage = bossPlayer.bossImageName || selectedSuperbubbleImageRef.current || bossImages[0] || "";
          const bossImageSrc = bossPlayer.bossImageName
            ? `http://localhost:5000/api/superbubbleimg/${encodeURIComponent(bossPlayer.bossImageName)}`
            : bossPlayer.imageName
              ? (bossPlayer.imageName.startsWith("http") || bossPlayer.imageName.startsWith("/") ? bossPlayer.imageName : `http://localhost:5000/api/images/${encodeURIComponent(bossPlayer.imageName)}`)
              : (selectedBossImage ? `http://localhost:5000/api/superbubbleimg/${encodeURIComponent(selectedBossImage)}` : "");
          const bossName = (bossPlayer.bossImageName ? selectedBossImage : bossPlayer.name || bossPlayer.imageName || selectedBossImage).replace(/\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i, '') || "Boss";
          superBubbleRef.current = {
            x: bossPosition.x,
            y: bossPosition.y,
            radius: baseSuperBubbleRadiusRef.current,
            health: bossSuperbubbleHealth,
            imgSrc: bossImageSrc,
            avatar: bossImageSrc ? undefined : 0,
            name: bossName,
            vx: speed * 0.6,
            vy: speed * 0.4,
            id: nextBubbleId++,
          };
          setSuperBubbleSnapshot({ ...superBubbleRef.current });
        } else {
          const startIndex = countRef.current;
          await addBubblesToArrays(matchPayload.players.map(makePlayerBubble));
          assignEntryPowers(matchPayload.players, startIndex);
        }
        return;
      }

      if (arenaType === ARENA_TYPES.NORMAL) {
        // Enter the arena even when the images API is down or empty: fall back to
        // a default set of image-less bubbles (rendered as colored avatars).
        const FALLBACK_BUBBLE_COUNT = 20;
        let images: string[] = [];
        try {
          const res = await fetch("http://localhost:5000/api/images");
          const data = await res.json();
          if (Array.isArray(data)) images = data;
        } catch (e) {
          console.warn("Images API unavailable — entering arena without bubble images", e);
        }
        imageListRef.current = images;
        const count = images.length > 0 ? images.length : FALLBACK_BUBBLE_COUNT;
        const targetRadius = getRadiusForCount(count);
        const newBubbles: BubbleData[] = [];
        for (let i = 0; i < count; i++) {
          const img = images[i];
          const pos = getRandomPositionInShape(targetRadius, arena);
          newBubbles.push({
            x: pos.x,
            y: pos.y,
            radius: targetRadius,
            health: 100,
            imgSrc: img ? `http://localhost:5000/api/images/${encodeURIComponent(img)}` : "",
            avatar: img ? undefined : i % 6,
            vx: Math.cos(Math.random() * Math.PI * 2) * speed * 0.6,
            vy: Math.sin(Math.random() * Math.PI * 2) * speed * 0.6,
            id: nextBubbleId++,
          });
        }
        await addBubblesToArrays(newBubbles, false);
      } else if (arenaType === ARENA_TYPES.BRAWL) {
        // brawl arena
        try {
          if (brawlMode === "1v1") {
            // Load two images from solo_brawls folder
            const res = await fetch("http://localhost:5000/api/brawl1v1imgs");
            const images: string[] = await res.json();
            if (images.length < 2) {
              console.error("Need at least 2 images for 1v1 brawl");
              return;
            }
            brawl1v1ImagesRef.current = images;
            const targetRadius = 50; // Fixed radius for brawl bubbles
            baseBubbleRadiusRef.current = targetRadius;
            
            // Pick two random images
            const img1 = images[Math.floor(Math.random() * images.length)];
            let img2 = images[Math.floor(Math.random() * images.length)];
            while (img2 === img1 && images.length > 1) {
              img2 = images[Math.floor(Math.random() * images.length)];
            }
            
            const newBubbles: BubbleData[] = [];
            // Place them on opposite sides
            const pos1 = getRandomPositionInShape(targetRadius, arena);
            const bubble1Id = nextBubbleId++;
            newBubbles.push({
              x: pos1.x,
              y: pos1.y,
              radius: targetRadius,
              health: 100,
              imgSrc: `http://localhost:5000/api/brawlimgs/${encodeURIComponent(img1)}`,
              vx: Math.cos(Math.random() * Math.PI * 2) * speed * 0.5,
              vy: Math.sin(Math.random() * Math.PI * 2) * speed * 0.5,
              id: bubble1Id,
            });
            brawlTeamsRef.current.set(bubble1Id, "solo"); // Bubble 1 is solo team
            
            const pos2 = getRandomPositionInShape(targetRadius, arena);
            const bubble2Id = nextBubbleId++;
            newBubbles.push({
              x: pos2.x,
              y: pos2.y,
              radius: targetRadius,
              health: 100,
              imgSrc: `http://localhost:5000/api/brawlimgs/${encodeURIComponent(img2)}`,
              vx: Math.cos(Math.random() * Math.PI * 2) * speed * 0.5,
              vy: Math.sin(Math.random() * Math.PI * 2) * speed * 0.5,
              id: bubble2Id,
            });
            brawlTeamsRef.current.set(bubble2Id, "many"); // Bubble 2 is many team (opposing)
            await addBubblesToArrays(newBubbles, false);
          } else {
            // 1vMany mode
            const res1v1 = await fetch("http://localhost:5000/api/brawl1v1imgs");
            const soloImages: string[] = await res1v1.json();
            const resManyImages = await fetch("http://localhost:5000/api/brawlmanyimgs");
            const manyImages: string[] = await resManyImages.json();
            
            if (soloImages.length === 0 || manyImages.length === 0) {
              console.error("Need images for both solo and many sides");
              return;
            }
            
            brawlSoloImageRef.current = soloImages[Math.floor(Math.random() * soloImages.length)];
            brawlManyImagesRef.current = manyImages;
            
            const targetRadius = 50;
            baseBubbleRadiusRef.current = targetRadius;
            const newBubbles: BubbleData[] = [];
            
            // Solo bubble
            const soloPos = getRandomPositionInShape(targetRadius, arena);
            const soloId = nextBubbleId++;
            newBubbles.push({
              x: soloPos.x,
              y: soloPos.y,
              radius: targetRadius,
              health: 100,
              imgSrc: `http://localhost:5000/api/brawlimgs/${encodeURIComponent(brawlSoloImageRef.current)}`,
              vx: Math.cos(Math.random() * Math.PI * 2) * speed * 0.5,
              vy: Math.sin(Math.random() * Math.PI * 2) * speed * 0.5,
              id: soloId,
            });
            brawlTeamsRef.current.set(soloId, "solo");
            
            // Track all many team members for win credits
            brawl1vManyAllMembersRef.current = manyImages.map(img => `http://localhost:5000/api/brawlimgs/${encodeURIComponent(img)}`);
            
            // Many bubbles
            for (const img of manyImages) {
              let tries = 0;
              let x = 0;
              let y = 0;
              let valid = false;
              while (!valid && tries < 200) {
                tries++;
                const pos = getRandomPositionInShape(targetRadius, arena);
                x = pos.x;
                y = pos.y;
                valid = true;
                for (const nb of newBubbles) {
                  const dx = x - nb.x;
                  const dy = y - nb.y;
                  if (Math.sqrt(dx * dx + dy * dy) < targetRadius * 2) {
                    valid = false;
                    break;
                  }
                }
              }
              const manyId = nextBubbleId++;
              newBubbles.push({
                x,
                y,
                radius: targetRadius,
                health: 100,
                imgSrc: `http://localhost:5000/api/brawlimgs/${encodeURIComponent(img)}`,
                vx: Math.cos(Math.random() * Math.PI * 2) * speed * 0.5,
                vy: Math.sin(Math.random() * Math.PI * 2) * speed * 0.5,
                id: manyId,
              });
              brawlTeamsRef.current.set(manyId, "many");
            }
            await addBubblesToArrays(newBubbles, false);
          }
        } catch (e) {
          console.error("Error fetching brawl images", e);
        }
      } else {
        // boss
        try {
          const res = await fetch("http://localhost:5000/api/bossimgs");
          const images: string[] = await res.json();
          imageListRef.current = images;
          const targetRadius = getRadiusForCount(images.length);
          baseBubbleRadiusRef.current = targetRadius;
          const sizeMultiplier = arenaType === ARENA_TYPES.BRAWL ? brawlBubbleSizeMultiplier : bossBubbleSizeMultiplier;
          const appliedRadius = targetRadius * sizeMultiplier;
          const newBubbles: BubbleData[] = [];
          for (const img of images) {
            let tries = 0;
            let x = 0;
            let y = 0;
            let valid = false;
            while (!valid && tries < 200) {
              tries++;
              const pos = getRandomPositionInShape(targetRadius, arena);
              x = pos.x;
              y = pos.y;
              valid = true;
              for (const nb of newBubbles) {
                const dx = x - nb.x;
                const dy = y - nb.y;
                if (Math.sqrt(dx * dx + dy * dy) < targetRadius * 2) {
                  valid = false;
                  break;
                }
              }
            }
            newBubbles.push({
              x,
              y,
              radius: appliedRadius,
              health: 100,
              imgSrc: `http://localhost:5000/api/bossimgs/${encodeURIComponent(img)}`,
              vx: Math.cos(Math.random() * Math.PI * 2) * speed * 0.4, // give boss normals some motion
              vy: Math.sin(Math.random() * Math.PI * 2) * speed * 0.4,
              id: nextBubbleId++,
            });
          }
          countRef.current = 0;
          imgSrcsRef.current = [];
          textureCache.current.clear();
          ensureCapacity(newBubbles.length + 8);
          await addBubblesToArrays(newBubbles, true);
        } catch (e) {
          console.error("Error fetching boss images", e);
        }

        // superbubble image & init
        try {
          const res2 = await fetch("http://localhost:5000/api/superbubbleimg");
          const imgs: string[] = await res2.json();
          setSuperbubbleImageOptions(imgs);
          let src = "";
          const selectedImage = selectedSuperbubbleImageRef.current || imgs[0] || "";
          if (selectedImage) src = `http://localhost:5000/api/superbubbleimg/${encodeURIComponent(selectedImage)}`;
          bossImgRef.current = src;
          const dim = getArenaDimensions();
          const appliedSuperRadius = baseSuperBubbleRadiusRef.current * bossBubbleSizeMultiplier;
          superBubbleRef.current = {
            x: dim.width / 2,
            y: dim.height / 2,
            radius: appliedSuperRadius,
            health: bossSuperbubbleHealth,
            imgSrc: src,
            vx: Math.cos(Math.random() * Math.PI * 2) * speed * 0.8, // closer magnitude to normals
            vy: Math.sin(Math.random() * Math.PI * 2) * speed * 0.8,
            id: nextBubbleId++,
          };
          // Register the superbubble player name with stats client (remove extension from the name)
          if (imgs.length > 0) {
            const superbubbleName = selectedImage.replace(/\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i, '');
            setSuperbubblePlayer(superbubbleName);
          }
          setSuperBubbleSnapshot(
            superBubbleRef.current
              ? {
                  x: superBubbleRef.current.x,
                  y: superBubbleRef.current.y,
                  radius: superBubbleRef.current.radius,
                  health: superBubbleRef.current.health,
                  imgSrc: superBubbleRef.current.imgSrc,
                  vx: superBubbleRef.current.vx,
                  vy: superBubbleRef.current.vy,
                  id: superBubbleRef.current.id,
                }
              : null
          );
          if (src) preloadImage(src).catch(() => {});
        } catch (e) {
          console.error("Error fetching superbubble image", e);
        }
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arenaType, arenaReady, bossSuperbubbleHealth, matchQuery]);

  // Update boss bubble sizes when multiplier changes
  useEffect(() => {
    if (arenaType !== ARENA_TYPES.BOSS && arenaType !== ARENA_TYPES.BRAWL) return;
    if (!arenaReady || isRunning) return;
    if (baseBubbleRadiusRef.current === 0) return;

    // Update normal bubbles
    const n = countRef.current;
    if (n > 0) {
      const sizeMultiplier = arenaType === ARENA_TYPES.BRAWL ? brawlBubbleSizeMultiplier : bossBubbleSizeMultiplier;
      const newRadius = baseBubbleRadiusRef.current * sizeMultiplier;
      const rArr = rRef.current!;
      const rTargetArr = rTargetRef.current!;
      for (let i = 0; i < n; i++) {
        rArr[i] = newRadius;
        rTargetArr[i] = newRadius;
      }
      // Update UI snapshot
      const xArr = xRef.current!;
      const yArr = yRef.current!;
      const hArr = healthRef.current!;
      const idArr = idListRef.current!;
      const imgIdxArr = imgIndexRef.current!;
      const snap: BubbleData[] = [];
      for (let k = 0; k < n; k++) {
        snap.push({
          x: xArr[k],
          y: yArr[k],
          radius: newRadius,
          health: hArr[k],
          imgSrc: imgSrcsRef.current[imgIdxArr[k]] ?? "",
          vx: vxRef.current![k],
          vy: vyRef.current![k],
          id: idArr[k],
        });
      }
      setUiBubblesSnapshot(snap);
    }

    // Update superbubble
    if (superBubbleRef.current) {
      const newSuperRadius = baseSuperBubbleRadiusRef.current * bossBubbleSizeMultiplier;
      superBubbleRef.current.radius = newSuperRadius;
      setSuperBubbleSnapshot({
        x: superBubbleRef.current.x,
        y: superBubbleRef.current.y,
        radius: newSuperRadius,
        health: superBubbleRef.current.health,
        imgSrc: superBubbleRef.current.imgSrc,
        vx: superBubbleRef.current.vx,
        vy: superBubbleRef.current.vy,
        id: superBubbleRef.current.id,
        name: superBubbleRef.current.name,
        avatar: superBubbleRef.current.avatar,
      });
    }
  }, [bossBubbleSizeMultiplier, brawlBubbleSizeMultiplier, arenaType, arenaReady, isRunning]);

  // Start reveal pipeline
  const startRevealPipelineIfNeeded = () => {
    if (arenaType !== ARENA_TYPES.NORMAL) return;
    if (revealStartedRef.current) return;
    const n = countRef.current;
    revealStartedRef.current = true;
    try {
      const imgIdxArr = imgIndexRef.current!;
      const rArr = rRef.current!;
      const unique = new Set<string>();
      if (n > 0 && n <= REVEAL_THRESHOLD) {
        for (let i = 0; i < n; i++) {
          const idx = imgIdxArr[i];
          if (idx == null || idx < 0) continue;
          const src = imgSrcsRef.current[idx];
          if (!src || unique.has(src)) continue;
          unique.add(src);
          queueImageDecode(src);
          // Only do HTMLImage preloads for small sets
          try {
            preloadImage(src).catch(() => {});
          } catch {}
          const bucket = pickBucketForRadius(rArr[i] ?? getRadiusForCount(n));
          enqueueMaskedCreation(src, bucket);
        }
        return;
      }

      if ((n === 0 || n > REVEAL_THRESHOLD) && uiBubblesSnapshot.length > 0) {
        const sample = [...uiBubblesSnapshot].sort((a, b) => b.radius - a.radius);
        for (const s of sample) {
          if (!s.imgSrc || unique.has(s.imgSrc)) continue;
          unique.add(s.imgSrc);
          queueImageDecode(s.imgSrc);
          try {
            preloadImage(s.imgSrc).catch(() => {});
          } catch {}
          const b = pickBucketForRadius(s.radius ?? getRadiusForCount(sample.length || 1));
          enqueueMaskedCreation(s.imgSrc, b);
          if (unique.size >= Math.max(200, REVEAL_BATCH_PER_TICK)) break;
        }
      }

      if (n > 0 && n <= REVEAL_THRESHOLD * 2 && n > REVEAL_THRESHOLD) {
        const unique2 = new Set<string>();
        const sampleIndices: number[] = Array.from({ length: n }, (_, i) => i)
          .map((i) => ({ i, r: rArr[i] }))
          .sort((a, b) => b.r - a.r)
          .slice(0, Math.min(n, 1000))
          .map((s) => s.i);
        for (const idx of sampleIndices) {
          const ii = imgIdxArr[idx];
          if (ii == null || ii < 0) continue;
          const src = imgSrcsRef.current[ii];
          if (!src || unique2.has(src)) continue;
          unique2.add(src);
          queueImageDecode(src);
          try {
            preloadImage(src).catch(() => {});
          } catch {}
          enqueueMaskedCreation(src, pickBucketForRadius(rArr[idx]));
        }
      }
    } catch (e) {
      console.warn("startRevealPipelineIfNeeded error:", e);
    }
  };

  // ---------- Initialize workers and cleanup ----------

  useEffect(() => {
    initImageDecodeWorker();
    initImageMaskWorker();

    return () => {
      if (imageDecodeWorkerRef.current) {
        imageDecodeWorkerRef.current.terminate();
        imageDecodeWorkerRef.current = null;
      }
      if (imageMaskWorkerRef.current) {
        imageMaskWorkerRef.current.terminate();
        imageMaskWorkerRef.current = null;
      }
      imageBitmapCache.current.forEach((bmp) => {
        try {
          (bmp as any).close && (bmp as any).close();
        } catch (e) {}
      });
      maskedBitmapCacheRef.current.forEach((bmp) => {
        try {
          (bmp as any).close && (bmp as any).close();
        } catch (e) {}
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync projectile settings to refs for game loop access
  useEffect(() => {
    playerBubblesProjectileCountRef.current = playerBubblesProjectileCount;
    playerBubblesPowerModeRef.current = playerBubblesPowerMode;
    playerBubblesProjectileSpeedRef.current = playerBubblesProjectileSpeed;
    brawlBubblesProjectileCountRef.current = brawlBubblesProjectileCount;
    brawlBubblesPowerModeRef.current = brawlBubblesPowerMode;
    brawlBubblesProjectileSpeedRef.current = brawlBubblesProjectileSpeed;
    // Sync firing-mode refs
    playerBubblesFiringModeRef.current = playerBubblesFiringMode;
    brawlBubblesFiringModeRef.current = brawlBubblesFiringMode;
    // Sync blade damage refs
    normalBladeDamageRef.current = normalBladeDamage;
    bossNormalBladeDamageRef.current = bossNormalBladeDamage;
    bossSuperbubbleBladeDamageRef.current = bossSuperbubbleBladeDamage;
    brawlBladeDamageRef.current = brawlBladeDamage;
    // Sync blade assignments ref
    bladeAssignmentsRef.current = new Set(bladeAssignments);
  }, [playerBubblesProjectileCount, playerBubblesPowerMode, playerBubblesProjectileSpeed, brawlBubblesProjectileCount, brawlBubblesPowerMode, brawlBubblesProjectileSpeed, playerBubblesFiringMode, brawlBubblesFiringMode, normalBladeDamage, bossNormalBladeDamage, bossSuperbubbleBladeDamage, brawlBladeDamage, bladeAssignments]);

  // Spike placement effect (respect arena dims)
  useEffect(() => {
    if (!spikeEnabled) {
      setSpikePositions([]);
      return;
    }
    const arena = getArenaDimensions();
    const newPositions = generateSpikesForShape(spikeCount, spikeSize, arena);
    setSpikePositions(newPositions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spikeEnabled, spikeCount, arenaRef.current?.clientWidth, arenaRef.current?.clientHeight, spikeSize, arenaShape]);

  // ---------- UI snapshot update ----------

  const updateUiSnapshotFromArrays = (force: boolean = false) => {
    const now = Date.now();
    if (!force && now - lastUiSnapshotTimeRef.current < 150) return;
    lastUiSnapshotTimeRef.current = now;

    const n = countRef.current;
    const idArr = idListRef.current!;
    const xArr = xRef.current!;
    const yArr = yRef.current!;
    const vxArr = vxRef.current!;
    const vyArr = vyRef.current!;
    const rArr = rRef.current!;
    const hArr = healthRef.current!;
    const imgIdxArr = imgIndexRef.current!;
    const snap: BubbleData[] = [];
    for (let i = 0; i < n; i++) {
      snap.push({
        x: xArr[i],
        y: yArr[i],
        radius: rArr[i],
        health: hArr[i],
        imgSrc: imgSrcsRef.current[imgIdxArr[i]] ?? "",
        vx: vxArr[i],
        vy: vyArr[i],
        id: idArr[i],
        name: playerNamesRef.current.get(idArr[i]),
        avatar: avatarIndexRef.current && avatarIndexRef.current[i] >= 0 ? avatarIndexRef.current[i] : undefined,
      });
    }
    setUiBubblesSnapshot(snap);
    if (superBubbleRef.current) {
      setSuperBubbleSnapshot({
        x: superBubbleRef.current.x,
        y: superBubbleRef.current.y,
        radius: superBubbleRef.current.radius,
        health: superBubbleRef.current.health,
        imgSrc: superBubbleRef.current.imgSrc,
        vx: superBubbleRef.current.vx,
        vy: superBubbleRef.current.vy,
        id: superBubbleRef.current.id,
      });
    } else {
      setSuperBubbleSnapshot(null);
    }
    setActiveCount(n);
  };

  const [_activeCount, setActiveCount] = useState<number>(0);

  // Clear canvas when switching between running/preview modes
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }, [isRunning]);

  // ---------- Preview renderer (not running) ----------
  // Keep a preview renderer for when arenaType is set but sim not running.
  useEffect(() => {
    if (!arenaType || isRunning) return;
    const canvas = canvasRef.current;
    const arena = arenaRef.current;
    if (!canvas || !arena) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Utility function to reset canvas state
    const resetCtx = (ctx: CanvasRenderingContext2D) => {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
    };

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = arena.getBoundingClientRect();
      // Circle arena uses square dimensions
      if (arenaShape === ARENA_SHAPES.CIRCLE) {
        const size = Math.max(1, Math.floor(Math.min(rect.width, rect.height)));
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        canvas.width = Math.round(size * dpr);
        canvas.height = Math.round(size * dpr);
      } else {
        // All other shapes use full dimensions
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(arena);

    let rafId = 0;
    let last = performance.now();

    const loop = (now: number) => {
      // HARD GUARD: prevent dual rendering
      if (isRunning) {
        cancelAnimationFrame(rafId);
        return;
      }
      rafId = requestAnimationFrame(loop);
      
      const dpr = window.devicePixelRatio || 1;
      
      // STEP 1-2: Reset transform, clear state, hard fill canvas
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
      
      // Hard fill to eliminate all trails (more reliable than clearRect)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Reapply DPR transform
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      const dt = now - last;
      last = now;

      // Calculate health bar width based on bubble count
      const bubbleCount = countRef.current;
      let healthBarWidth = 3;
      if (bubbleCount > 5000) {
        healthBarWidth = 1;
      } else if (bubbleCount >= 1000 && bubbleCount <= 5000) {
        healthBarWidth = 1.5;
      } else if (bubbleCount >= 500 && bubbleCount < 1000) {
        healthBarWidth = 2;
      } else if (bubbleCount >= 100 && bubbleCount < 500) {
        healthBarWidth = 2.2;
      } else if (bubbleCount >= 50 && bubbleCount < 100) {
        healthBarWidth = 2.5;
      } else if (bubbleCount >= 10 && bubbleCount < 50) {
        healthBarWidth = 2.8;
      }

      processImageDecodeQueue();
      processMaskCreationQueue(6);

      // Reset state before drawing
      resetCtx(ctx);

      // animate radius growth here as well for preview
      const TICK_MS = Math.max(1, dt);
      const nPreview = countRef.current;
      if (rRef.current && rTargetRef.current && nPreview > 0) {
        const lerpAlpha = Math.min(1, TICK_MS / GROW_DURATION_MS);
        for (let i = 0; i < nPreview; i++) {
          const cur = rRef.current[i];
          const tgt = rTargetRef.current[i];
          if (!tgt) continue; // Skip if no target set
          if (cur < tgt) {
            const nextR = cur + (tgt - cur) * lerpAlpha;
            rRef.current[i] = nextR;
            if (nextR >= IMAGE_SHOW_RADIUS) {
              const imgIdx = imgIndexRef.current![i];
              if (imgIdx != null && imgIdx >= 0) {
                const src = imgSrcsRef.current[imgIdx];
                if (src) {
                  queueImageDecode(src);
                  enqueueMaskedCreation(src, pickBucketForRadius(Math.round(nextR)));
                }
              }
            }
          } else if (cur > tgt) {
            rRef.current[i] = tgt;
          }
        }
      }

      // no canvas spikes to avoid duplication (we render spikes as DOM SVGs)
      const nRender = countRef.current;
      const rArrRender = rRef.current!;
      const xArrRender = xRef.current!;
      const yArrRender = yRef.current!;
      const vxArrRender = vxRef.current!;
      const vyArrRender = vyRef.current!;
      const hArrRender = healthRef.current!;
      const imgIdxArrRender = imgIndexRef.current!;
      const idArrRender = idListRef.current!;
      const fadedSet = fadedBubblesRef.current;

      for (let i = 0; i < nRender; i++) {
        const radius = rArrRender[i];
        const x = xArrRender[i];
        const y = yArrRender[i];
        const hp = hArrRender[i];
        const imgIdx = imgIdxArrRender[i];
        const avatarIdx = avatarIndexRef.current?.[i] ?? -1;
        // Invisibility Zone only fades the visuals; collision is untouched.
        const faded = fadedSet.size > 0 && fadedSet.has(idArrRender[i]);
        ctx.globalAlpha = faded ? 0.28 : 1;
        let strokeColor = "#ff4d4d";
        if (hp > 60) strokeColor = "#2ecc71";
        else if (hp > 30) strokeColor = "#f1c40f";

        drawBubbleGlowAndTrail(ctx, x, y, radius, vxArrRender[i], vyArrRender[i], strokeColor);
        let drawnImage = false;
        if (avatarIdx >= 0) {
          drawAvatarOnCanvas(ctx, x, y, radius, avatarIdx);
          if (radius >= 8) {
            ctx.beginPath();
            ctx.arc(x, y, radius + 2, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * Math.min(1, hp / 100)));
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = healthBarWidth;
            ctx.stroke();
          }
          continue;
        }
        if (radius >= IMAGE_SHOW_RADIUS && imgIdx >= 0) {
          const src = imgSrcsRef.current[imgIdx];
          const bucket = pickBucketForRadius(radius);
          const key = maskedKey(src, bucket);
          const maskedBmp = maskedBitmapCacheRef.current.get(key);
          if (maskedBmp) {
            touchMaskedKey(key);
            ctx.drawImage(maskedBmp, x - radius, y - radius, radius * 2, radius * 2);
            drawnImage = true;
          } else {
            // prefer clipping to avoid square flash
            const bmp = imageBitmapCache.current.get(src);
            const img = textureCache.current.get(src);
            if (bmp || (img && img.complete)) {
              enqueueMaskedCreation(src, bucket);
              // draw clipped circular image to avoid square flash
              try {
                ctx.save();
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.clip();
                if (bmp) ctx.drawImage(bmp, x - radius, y - radius, radius * 2, radius * 2);
                else if (img) ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
                ctx.restore();
                drawnImage = true;
              } catch (e) {
                try {
                  ctx.restore();
                } catch {}
              }
            } else {
              const shouldDecodeNow = revealStartedRef.current || countRef.current <= REVEAL_THRESHOLD;
              if (src && shouldDecodeNow) {
                queueImageDecode(src);
                preloadImage(src).catch(() => {});
              }
            }
          }
        }

        if (drawnImage) {
          if (radius >= 8) {
            ctx.beginPath();
            ctx.arc(x, y, radius + 2, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * Math.min(1, hp / 100)));
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = healthBarWidth;
            ctx.stroke();
          }
          continue;
        }

        // fallback circle
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, radius), 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = faded ? 0.25 : 0.95;
        ctx.fill();
        ctx.globalAlpha = faded ? 0.28 : 1;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, radius) + 2, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * Math.min(1, hp / 100)));
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = healthBarWidth * 0.5;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      resetCtx(ctx);
      // superbubble draw in preview (if present)
      const sbToRender = superBubbleRef.current || superBubbleSnapshot;
      if (sbToRender && arenaType === ARENA_TYPES.BOSS) {
        const sb = sbToRender;
        const sbRadius = sb.radius;
        if (sbRadius >= IMAGE_SHOW_RADIUS && sb.imgSrc) {
          const src = sb.imgSrc;
          const bucket = pickBucketForRadius(sbRadius);
          const key = maskedKey(src, bucket);
          const maskedBmp = maskedBitmapCacheRef.current.get(key);
          if (maskedBmp) {
            ctx.drawImage(maskedBmp, sb.x - sbRadius, sb.y - sbRadius, sbRadius * 2, sbRadius * 2);
          } else {
            // Queue image decode and mask creation
            queueImageDecode(src);
            enqueueMaskedCreation(src, bucket);
            // Draw white circle while loading
            ctx.beginPath();
            ctx.arc(sb.x, sb.y, sbRadius, 0, Math.PI * 2);
            ctx.fillStyle = "#fff";
            ctx.globalAlpha = 0.95;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        } else {
          ctx.beginPath();
          ctx.arc(sb.x, sb.y, sbRadius, 0, Math.PI * 2);
          ctx.fillStyle = "#fff";
          ctx.globalAlpha = 0.95;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arenaType, isRunning, arenaReady, spikeEnabled, spikeCount, spikeSize, uiBubblesSnapshot, superBubbleSnapshot]);

  // ---------- Main simulation & render loop ----------

  useEffect(() => {
    if (!arenaType || !isRunning) return;
    const canvas = canvasRef.current;
    const arena = arenaRef.current;
    if (!canvas || !arena) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    initImageDecodeWorker();
    initImageMaskWorker();

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = arena.getBoundingClientRect();
      // Circle arena uses square dimensions
      if (arenaShape === ARENA_SHAPES.CIRCLE) {
        const size = Math.max(1, Math.floor(Math.min(rect.width, rect.height)));
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        canvas.width = Math.round(size * dpr);
        canvas.height = Math.round(size * dpr);
      } else {
        // All other shapes use full dimensions
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(arena);

    // Utility function to reset canvas state
    const resetCtx = (ctx: CanvasRenderingContext2D) => {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
    };

    const TICK_MS = 30;
    let rafId = 0;
    let last = performance.now();
    let acc = 0;
    let startGrace = true;
    const graceTimeout = window.setTimeout(() => (startGrace = false), 10);
    let healthBarWidth = 4;

    const loop = (now: number) => {
      // HARD GUARD: only render when running
      if (!isRunning || gameEndedRef.current) {
        cancelAnimationFrame(rafId);
        return;
      }
      rafId = requestAnimationFrame(loop);
      
      const dpr = window.devicePixelRatio || 1;
      
      // STEP 1-2: Reset transform, clear state, hard fill canvas
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
      
      // Hard fill to eliminate all trails (more reliable than clearRect)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Reapply DPR transform
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      const dt = now - last;
      last = now;
      acc += dt;

      // logic ticks
      while (acc >= TICK_MS) {
        // Skip physics updates if animation is playing
        if (animationPauseRef.current) {
          acc -= TICK_MS;
          continue;
        }
        
        acc -= TICK_MS;
        const nowMs = Date.now();
        
        // Update auto-enable flags based on elapsed time and trigger animations
        if (spikeEnabled && spikeAutoEnableTime > 0 && !spikeAutoEnabledRef.current && !spikeAnimationShownRef.current && gameStartTimeRef.current > 0) {
          const elapsedSeconds = (nowMs - gameStartTimeRef.current) / 1000;
          if (elapsedSeconds >= spikeAutoEnableTime) {
            // Trigger animation
            spikeAnimationShownRef.current = true;
            animationPauseRef.current = true;
            playArenaSound("spikeEnable", "", 3);
            setShowSpikeAnimation(true);
            setTimeout(() => {
              setShowSpikeAnimation(false);
              spikeAutoEnabledRef.current = true;
              spikeEnabledAtRef.current = Date.now(); // Track when enabled
              animationPauseRef.current = false;
              console.log(`🔺 Spikes now active after ${spikeAutoEnableTime}s`);
            }, 3000);
          }
        }
        
        // Check if spikes should be disabled after duration
        if (spikeEnabled && spikeAutoEnabledRef.current && spikeActiveDuration > 0 && spikeEnabledAtRef.current > 0) {
          const activeSeconds = (nowMs - spikeEnabledAtRef.current) / 1000;
          if (activeSeconds >= spikeActiveDuration) {
            spikeAutoEnabledRef.current = false;
            spikeEnabledAtRef.current = 0;
            console.log(`🔺 Spikes disabled after ${spikeActiveDuration}s duration`);
          }
        }
        
        // Update blade auto-enable flag with animation
        if (bladeEnabled && bladeAutoEnableTime > 0 && !bladeAutoEnabledRef.current && !bladeAnimationShownRef.current && gameStartTimeRef.current > 0) {
          const elapsedSeconds = (nowMs - gameStartTimeRef.current) / 1000;
          if (elapsedSeconds >= bladeAutoEnableTime) {
            // Trigger animation
            bladeAnimationShownRef.current = true;
            animationPauseRef.current = true;
            playArenaSound("bladeEnable", "", 3);
            setShowBladeAnimation(true);
            setTimeout(() => {
              setShowBladeAnimation(false);
              bladeAutoEnabledRef.current = true;
              bladeEnabledAtRef.current = Date.now(); // Track when enabled
              animationPauseRef.current = false;
              console.log(`⚔️ Blades now active after ${bladeAutoEnableTime}s`);
            }, 3000);
          }
        }
        
        // Check if blades should be disabled after duration
        if (bladeEnabled && bladeAutoEnabledRef.current && bladeActiveDuration > 0 && bladeEnabledAtRef.current > 0) {
          const activeSeconds = (nowMs - bladeEnabledAtRef.current) / 1000;
          if (activeSeconds >= bladeActiveDuration) {
            bladeAutoEnabledRef.current = false;
            bladeEnabledAtRef.current = 0;
            console.log(`⚔️ Blades disabled after ${bladeActiveDuration}s duration`);
          }
        }
        
        // Handle immediate enable (timer = 0) - set enabled timestamp
        if (spikeEnabled && spikeAutoEnableTime === 0 && spikeEnabledAtRef.current === 0 && gameStartTimeRef.current > 0) {
          spikeEnabledAtRef.current = gameStartTimeRef.current;
        }
        if (bladeEnabled && bladeAutoEnableTime === 0 && bladeEnabledAtRef.current === 0 && gameStartTimeRef.current > 0) {
          bladeEnabledAtRef.current = gameStartTimeRef.current;
        }
        
        // Check duration for immediate-enabled spikes/blades
        if (spikeEnabled && spikeAutoEnableTime === 0 && spikeActiveDuration > 0 && spikeEnabledAtRef.current > 0) {
          const activeSeconds = (nowMs - spikeEnabledAtRef.current) / 1000;
          if (activeSeconds >= spikeActiveDuration) {
            spikeEnabledAtRef.current = -1; // Mark as expired (use -1 to prevent re-triggering)
            console.log(`🔺 Spikes disabled after ${spikeActiveDuration}s duration (immediate mode)`);
          }
        }
        if (bladeEnabled && bladeAutoEnableTime === 0 && bladeActiveDuration > 0 && bladeEnabledAtRef.current > 0) {
          const activeSeconds = (nowMs - bladeEnabledAtRef.current) / 1000;
          if (activeSeconds >= bladeActiveDuration) {
            bladeEnabledAtRef.current = -1; // Mark as expired
            console.log(`⚔️ Blades disabled after ${bladeActiveDuration}s duration (immediate mode)`);
          }
        }
        
        // Update player powers auto-enable flag (Boss arena only)
        if (arenaType === ARENA_TYPES.BOSS && playerPowersEnabledRef.current && playerPowersAutoEnableTime > 0 && !playerPowersAutoEnabledRef.current && gameStartTimeRef.current > 0) {
          const elapsedSeconds = (nowMs - gameStartTimeRef.current) / 1000;
          if (elapsedSeconds >= playerPowersAutoEnableTime) {
            // Trigger animation
            animationPauseRef.current = true;
            playArenaSound("powerEnable", "", 3);
            setShowPowerAnimation(true);
            setTimeout(() => {
              setShowPowerAnimation(false);
              playerPowersAutoEnabledRef.current = true;
              animationPauseRef.current = false;
              console.log(`⚡ Player powers now active after ${playerPowersAutoEnableTime}s`);
            }, 3000);
          }
        }
        
        // Update brawl powers auto-enable flag (Brawl arena only)
        if (arenaType === ARENA_TYPES.BRAWL && brawlPowersEnabledRef.current && brawlPowersAutoEnableTime > 0 && !brawlPowersAutoEnabledRef.current && gameStartTimeRef.current > 0) {
          const elapsedSeconds = (nowMs - gameStartTimeRef.current) / 1000;
          if (elapsedSeconds >= brawlPowersAutoEnableTime) {
            // Trigger animation
            animationPauseRef.current = true;
            playArenaSound("powerEnable", "", 3);
            setShowPowerAnimation(true);
            setTimeout(() => {
              setShowPowerAnimation(false);
              brawlPowersAutoEnabledRef.current = true;
              animationPauseRef.current = false;
              console.log(`⚔️ Brawl powers now active after ${brawlPowersAutoEnableTime}s`);
            }, 3000);
          }
        }
        
        // Superbubble power enable for boss arena with timing controls
        if (arenaType === ARENA_TYPES.BOSS && superpowerEnabled && superpowerAutoEnableTime > 0 && !superpowerAutoEnabledRef.current && !bossPowerAnimationShownRef.current && gameStartTimeRef.current > 0) {
          const elapsedSeconds = (nowMs - gameStartTimeRef.current) / 1000;
          if (elapsedSeconds >= superpowerAutoEnableTime) {
            bossPowerAnimationShownRef.current = true;
            animationPauseRef.current = true;
            playArenaSound("bossPowerEnable", "", 3);
            setShowBossPowerAnimation(true);
            setTimeout(() => {
              setShowBossPowerAnimation(false);
              superpowerAutoEnabledRef.current = true;
              superpowerEnabledAtRef.current = Date.now();
              animationPauseRef.current = false;
              console.log(`👹 Boss powers now active after ${superpowerAutoEnableTime}s`);
            }, 3000);
          }
        }
        
        // Check if superpowers should be disabled after duration
        if (arenaType === ARENA_TYPES.BOSS && superpowerEnabled && superpowerAutoEnabledRef.current && superpowerActiveDuration > 0 && superpowerEnabledAtRef.current > 0) {
          const activeSeconds = (nowMs - superpowerEnabledAtRef.current) / 1000;
          if (activeSeconds >= superpowerActiveDuration) {
            superpowerAutoEnabledRef.current = false;
            superpowerEnabledAtRef.current = 0;
            console.log(`👹 Boss powers disabled after ${superpowerActiveDuration}s duration`);
          }
        }
        
        // Handle immediate enable (timer = 0) - set enabled timestamp
        if (arenaType === ARENA_TYPES.BOSS && superpowerEnabled && superpowerAutoEnableTime === 0 && superpowerEnabledAtRef.current === 0 && gameStartTimeRef.current > 0) {
          superpowerEnabledAtRef.current = gameStartTimeRef.current;
        }
        
        // Check duration for immediate-enabled superpowers
        if (arenaType === ARENA_TYPES.BOSS && superpowerEnabled && superpowerAutoEnableTime === 0 && superpowerActiveDuration > 0 && superpowerEnabledAtRef.current > 0) {
          const activeSeconds = (nowMs - superpowerEnabledAtRef.current) / 1000;
          if (activeSeconds >= superpowerActiveDuration) {
            superpowerEnabledAtRef.current = -1;
            console.log(`👹 Boss powers disabled after ${superpowerActiveDuration}s duration (immediate mode)`);
          }
        }

        const bubbleCount = countRef.current;
        // Get arena-specific collision damage
        let baseDamage = normalBubbleCollisionDamage;
        if (arenaType === ARENA_TYPES.BRAWL) {
          baseDamage = brawlBubbleCollisionDamage;
        }
        // For boss arena, baseDamage isn't used for normal bubble collisions (they don't collide with each other)
        
        let DEATH_DELAY_MS = 30;
        let MAX_DEATHS_PER_TICK = 60;
        // Use constant speed multiplier - no scaling based on bubble count
        const localSpeedMult = speedMultiplier;

        // Only adjust death processing and health bar width based on bubble count
        if (bubbleCount > 5000) {
          DEATH_DELAY_MS = 3;
          MAX_DEATHS_PER_TICK = 300;
          healthBarWidth = 1;
        } else if (bubbleCount >= 1000 && bubbleCount <= 5000) {
          DEATH_DELAY_MS = 30;
          MAX_DEATHS_PER_TICK = 60;
          healthBarWidth = 1.5;
        } else if (bubbleCount >= 500 && bubbleCount < 1000) {
          DEATH_DELAY_MS = 30;
          MAX_DEATHS_PER_TICK = 60;
          healthBarWidth = 2;
        } else if (bubbleCount >= 100 && bubbleCount < 500) {
          DEATH_DELAY_MS = 30;
          MAX_DEATHS_PER_TICK = 60;
          healthBarWidth = 2.5;
        } else if (bubbleCount >= 50 && bubbleCount < 100) {
          DEATH_DELAY_MS = 30;
          MAX_DEATHS_PER_TICK = 60;
          healthBarWidth = 3;
        } else if (bubbleCount >= 10 && bubbleCount < 50) {
          DEATH_DELAY_MS = 30;
          MAX_DEATHS_PER_TICK = 60;
          healthBarWidth = 3.5;
        } else {
          DEATH_DELAY_MS = 60;
          MAX_DEATHS_PER_TICK = 20;
          healthBarWidth = 4;
        }

        // Apply base speed boost to make all speeds feel faster
        // Speed 1 now feels like 2.5, Speed 5 feels like 8.5, etc.
        const MAX_MOVE_STEP = localSpeedMult * 1.8 + 0.7;

        const n = countRef.current;
        const idArr = idListRef.current!;
        const xArr = xRef.current!;
        const yArr = yRef.current!;
        const vxArr = vxRef.current!;
        const vyArr = vyRef.current!;
        const rArr = rRef.current!;
        const rTArr = rTargetRef.current!;
        const hArr = healthRef.current!;
        const imgIdxArr = imgIndexRef.current!;
        
        // Debug: log bubble count every few seconds
        if (playerPowersEnabledRef.current && Math.floor(nowMs / 3000) !== Math.floor((nowMs - TICK_MS) / 3000)) {
          console.log(`📊 Game loop: ${n} normal bubbles, ${powerPickupsRef.current.length} pickups active`);
        }

        // animate radius growth per tick
        if (rRef.current && rTargetRef.current) {
          const lerpAlpha = Math.min(1, TICK_MS / GROW_DURATION_MS);
          for (let i = 0; i < n; i++) {
            const curR = rArr[i];
            const tgt = rTArr[i];
            if (!tgt) continue; // Skip if no target set
            if (curR < tgt) {
              const nextR = curR + (tgt - curR) * lerpAlpha;
              rArr[i] = nextR;
              // when crossing the visible threshold, trigger decode/mask
              if (nextR >= IMAGE_SHOW_RADIUS) {
                const imgIdx = imgIdxArr[i];
                if (imgIdx != null && imgIdx >= 0) {
                  const src = imgSrcsRef.current[imgIdx];
                  if (src) {
                    queueImageDecode(src);
                    enqueueMaskedCreation(src, pickBucketForRadius(Math.round(nextR)));
                  }
                }
              }
            } else if (curR > tgt) {
              rArr[i] = tgt;
            }
          }
        }

        // move normals
        const dims = getArenaDimensions();
        const frozen = isTimeStopped();

        // ---- 1. Event state (spec section 7) -------------------------------
        if (eventsEnabledRef.current) {
          const ev = activeEventRef.current;
          if (ev) {
            if (ev.phase === "warning" && nowMs >= ev.startedAt + EVENT_WARNING_MS) {
              // Warning finished: activate the event and apply its global effect.
              const meta = ARENA_EVENT_INFO[ev.kind];
              const life = eventDurationOverrideRef.current || meta.durationMs;
              const started: ArenaEventState = { ...ev, phase: "active", startedAt: nowMs, endsAt: nowMs + life };
              const mod = ev.kind === "random_modifier" ? ev.modifier : ev.kind;
              playArenaSound("eventStart", mod || ev.kind);
              if (mod === "double_damage") globalDamageMultRef.current = 2;
              else if (mod === "low_gravity") globalStepMultRef.current = 0.6;
              else if (mod === "speed_boost") globalStepMultRef.current = 1.5;
              else if (mod === "slow") globalStepMultRef.current = 0.5;
              else if (mod === "reverse_controls" || mod === "reverse_arena") {
                for (let i = 0; i < n; i++) { vxArr[i] = -vxArr[i]; vyArr[i] = -vyArr[i]; }
              }
              rainTickRef.current = 0;
              activeEventRef.current = started;
              setActiveEvent(started);
            } else if (ev.phase === "active") {
              if (nowMs >= ev.endsAt) {
                // ---- end + cleanup: every global returns to neutral.
                playArenaSound("eventEnd", ev.kind);
                clearEventGlobals();
                activeEventRef.current = null;
                setActiveEvent(null);
                lastEventAtRef.current = nowMs;
              } else {
                const elapsed = nowMs - ev.startedAt;
                const total = Math.max(1, ev.endsAt - ev.startedAt);
                const mod = ev.kind === "random_modifier" ? ev.modifier : ev.kind;
                if (mod === "shrinking_arena") {
                  // Contract for the first 70% then release; never teleports bubbles.
                  const p = elapsed / total;
                  const grow = p < 0.7 ? p / 0.7 : Math.max(0, (1 - p) / 0.3);
                  arenaShrinkPadRef.current = grow * Math.min(dims.width, dims.height) * 0.12;
                  if (nowMs - eventTickRef.current > 100) setArenaShrinkPad(arenaShrinkPadRef.current);
                }
                // ---- Falling "rain" spawners: items fall from the top of the arena to
                // the bottom for the full active duration (health_rain/item_chaos hearts
                // or power icons, double_damage swords, meteor_shower meteors).
                if (nowMs - rainTickRef.current > 220) {
                  rainTickRef.current = nowMs;
                  if ((mod === "health_rain" || mod === "item_chaos" || mod === "pickup_frenzy") && arenaPickupsRef.current.length < 24) {
                    const kind: ArenaPickupKind = mod === "health_rain"
                      ? (Math.random() < 0.5 ? "health_kit" : "mega_health")
                      : ARENA_PICKUP_KINDS[Math.floor(Math.random() * ARENA_PICKUP_KINDS.length)];
                    const rx = ARENA_PICKUP_RADIUS + Math.random() * (dims.width - 2 * ARENA_PICKUP_RADIUS);
                    arenaPickupsRef.current.push({
                      id: nextProjectileId++, x: rx, y: -ARENA_PICKUP_RADIUS, kind,
                      createdAt: nowMs, expiresAt: nowMs + total + 4000,
                      vy: 3 + Math.random() * 2,
                    });
                    setArenaPickups([...arenaPickupsRef.current]);
                  } else if (mod === "meteor_shower" && arenaMeteorsRef.current.length < 24) {
                    const r = 14;
                    const rx = r + Math.random() * (dims.width - 2 * r);
                    arenaMeteorsRef.current.push({
                      id: nextProjectileId++, x: rx, y: -r,
                      vx: (Math.random() - 0.5) * 0.6, vy: 4 + Math.random() * 2.5, r,
                    });
                    setArenaMeteors([...arenaMeteorsRef.current]);
                  } else if (mod === "double_damage" && arenaSwordsRef.current.length < 24) {
                    const rx = 16 + Math.random() * (dims.width - 32);
                    arenaSwordsRef.current.push({
                      id: nextProjectileId++, x: rx, y: -24,
                      vy: 4 + Math.random() * 2.5, rot: Math.random() * 360,
                    });
                    setArenaSwords([...arenaSwordsRef.current]);
                  }
                }
                if (nowMs - eventTickRef.current > 100) eventTickRef.current = nowMs;
              }
            }
          } else if (!startGrace && n > 0) {
            const gapMs = eventFrequencyRef.current === "low" ? 25000 : eventFrequencyRef.current === "high" ? 9000 : 16000;
            if (nowMs - lastEventAtRef.current > gapMs) {
              const pool = eventModeRef.current === "custom"
                ? ARENA_EVENT_KINDS.filter((k) => eventSelectedRef.current.has(k))
                : ARENA_EVENT_KINDS;
              if (pool.length > 0) {
                const kind = pool[Math.floor(Math.random() * pool.length)];
                const modifier = kind === "random_modifier"
                  ? RANDOM_MODIFIER_CHOICES[Math.floor(Math.random() * RANDOM_MODIFIER_CHOICES.length)]
                  : undefined;
                const label = modifier
                  ? `${ARENA_EVENT_INFO.random_modifier.name}: ${modifier.replace(/_/g, " ")}`
                  : ARENA_EVENT_INFO[kind].name;
                const next: ArenaEventState = { kind, phase: "warning", startedAt: nowMs, endsAt: 0, label, modifier };
                playArenaSound("eventWarning", modifier || kind);
                activeEventRef.current = next;
                setActiveEvent(next);
                lastEventAtRef.current = nowMs;
              }
            }
          }
          // Meteors fall top-to-bottom and expire once they pass the arena floor,
          // independent of the event phase (so already-falling ones finish their drop).
          if (arenaMeteorsRef.current.length > 0) {
            for (const m of arenaMeteorsRef.current) { m.x += m.vx; m.y += m.vy; }
            arenaMeteorsRef.current = arenaMeteorsRef.current.filter((m) => m.y - m.r <= dims.height + 40);
            setArenaMeteors([...arenaMeteorsRef.current]);
          }
          // Falling swords deal one collision-damage hit, then disappear.
          if (arenaSwordsRef.current.length > 0) {
            const spentSwords = new Set<number>();
            for (const s of arenaSwordsRef.current) {
              s.y += s.vy;
              s.rot += 6;
              for (let i = 0; i < n; i++) {
                if (hArr[i] <= 0) continue;
                const dx = xArr[i] - s.x;
                const dy = yArr[i] - s.y;
                const hitRadius = rArr[i] + 12;
                if (dx * dx + dy * dy >= hitRadius * hitRadius) continue;
                const collisionDamage = arenaType === ARENA_TYPES.BOSS ? bossCollisionDamage : baseDamage;
                const damage = Math.round(collisionDamage * globalDamageMultRef.current);
                hArr[i] = Math.max(0, hArr[i] - damage);
                playArenaSound("eventImpact", "double_damage");
                spawnPickupFx(idArr[i], `-${damage}`, "#ef4444");
                spentSwords.add(s.id);
                break;
              }
            }
            arenaSwordsRef.current = arenaSwordsRef.current.filter((s) => !spentSwords.has(s.id) && s.y <= dims.height + 40);
            setArenaSwords([...arenaSwordsRef.current]);
          }
        }

        // ---- 2. Zones (spec section 6) -------------------------------------
        if (zonesEnabledRef.current) {
          const zFreq = zoneFrequencyRef.current;
          const zMax = zFreq === "low" ? 2 : zFreq === "high" ? 5 : 3;
          const zGap = zFreq === "low" ? 9000 : zFreq === "high" ? 3500 : 6000;
          if (!startGrace && arenaZonesRef.current.length < zMax && nowMs - lastZoneSpawnRef.current > zGap) {
            lastZoneSpawnRef.current = nowMs;
            spawnArenaZone(nowMs);
          }
          const before = arenaZonesRef.current.length;
          arenaZonesRef.current = arenaZonesRef.current.filter((z) => nowMs < z.expiresAt);
          if (arenaZonesRef.current.length !== before) setArenaZones([...arenaZonesRef.current]);
        }

        // ---- 3. Blockade positions (spec section 5) ------------------------
        if (blockadesEnabledRef.current) {
          const sig = `${arenaShape}|${blockadeDensityRef.current}|${blockadeMovementRef.current}|${blockadeModeRef.current}|${blockadeDurationSec}|${blockadeSelectedRef.current.size}`;
          if (blockadeBuiltForRef.current !== sig) {
            blockadeBuiltForRef.current = sig;
            arenaBlockadesRef.current = buildBlockadeLayout(nowMs);
            blockadeHitCooldownRef.current.clear();
            setArenaBlockades([...arenaBlockadesRef.current]);
          }
          let structureChanged = false;
          for (const b of arenaBlockadesRef.current) {
            if (b.spin) b.angle = (b.angle || 0) + b.spin * TICK_MS;
            if (b.pathSpeed !== undefined && b.ax !== undefined) {
              let t = (b.t || 0) + (b.dir || 1) * b.pathSpeed * TICK_MS;
              if (t > 1) { t = 1; b.dir = -1; } else if (t < 0) { t = 0; b.dir = 1; }
              b.t = t;
              b.x = b.ax + (b.bx! - b.ax) * t;
              b.y = b.ay! + (b.by! - b.ay!) * t;
            }
            if (b.kind === "laser_wall") {
              // Pulsing ACTIVE/INACTIVE so the beam is dodgeable.
              const cyclePos = ((nowMs - b.createdAt) % 3000) / 3000;
              const nextActive = cyclePos > 0.35;
              if (nextActive !== b.active) { b.active = nextActive; structureChanged = true; }
            }
            if (b.kind === "vanishing_block" && b.expiresAt && !b.fading && nowMs > b.expiresAt - 1200) {
              b.fading = true; structureChanged = true;
            }
          }
          const alive = arenaBlockadesRef.current.filter(
            (b) => (b.expiresAt === undefined || nowMs < b.expiresAt) && (b.hp === undefined || b.hp > 0)
          );
          if (alive.length !== arenaBlockadesRef.current.length) { arenaBlockadesRef.current = alive; structureChanged = true; }
          if (structureChanged) setArenaBlockades([...arenaBlockadesRef.current]);
        } else if (arenaBlockadesRef.current.length > 0) {
          arenaBlockadesRef.current = [];
          blockadeBuiltForRef.current = "";
          setArenaBlockades([]);
        }

        for (let i = 0; i < n; i++) {
          // Time Stop freezes movement; Web Shot slows the tethered bubble.
          // Pickup statuses (Speed Boost / Slow / Stun) scale this bubble's step.
          const pickupFactor = pickupsEnabledRef.current ? pickupSpeedFactor(idArr[i], nowMs) : 1;
          // Zones and events layer on as multipliers; base values are never overwritten.
          let zoneFactor = 1;
          let icy = false;
          if (zonesEnabledRef.current && arenaZonesRef.current.length > 0) {
            for (const z of arenaZonesRef.current) {
              const zdx = xArr[i] - z.x, zdy = yArr[i] - z.y;
              if (zdx * zdx + zdy * zdy > z.r * z.r) continue;
              if (z.kind === "speed_zone") zoneFactor *= 1.5;
              else if (z.kind === "slow_zone") zoneFactor *= 0.5;
              else if (z.kind === "poison_zone") zoneFactor *= 0.75;
              else if (z.kind === "ice") icy = true;
              else if (z.kind === "gravity") {
                // Continuous pull toward the zone center (never a teleport).
                const d = Math.sqrt(zdx * zdx + zdy * zdy) || 1;
                vxArr[i] -= (zdx / d) * 0.12;
                vyArr[i] -= (zdy / d) * 0.12;
              } else if (z.kind === "wind") {
                vxArr[i] += (z.fx || 0) * 0.1;
                vyArr[i] += (z.fy || 0) * 0.1;
              }
            }
          }
          if (icy) zoneFactor *= 1.15; // slides further before the bounce settles
          const step = frozen ? 0 : MAX_MOVE_STEP * webStepFactor(idArr[i]) * pickupFactor * zoneFactor * globalStepMultRef.current;
          let nx = xArr[i] + vxArr[i] * step;
          let ny = yArr[i] + vyArr[i] * step;
          let nvx = vxArr[i];
          let nvy = vyArr[i];

          // Use shape-aware boundary checking (Shrinking Arena adds padding)
          const constrained = constrainToArenaBoundary(nx, ny, rArr[i] + arenaShrinkPadRef.current, dims);
          
          if (constrained.vx !== 0 || constrained.vy !== 0) {
            playArenaSound("bounce");
            nx = constrained.x;
            ny = constrained.y;
            const bounced = bounceWithDeviation(nvx, nvy, constrained.vx, constrained.vy, bounceDeviation);
            nvx = bounced.vx;
            nvy = bounced.vy;
          }
          // Otherwise use unconstrained position (only constrain when bouncing)

          // ---- 8. Blockade collision (spec section 5) ----------------------
          if (blockadesEnabledRef.current && arenaBlockadesRef.current.length > 0) {
            const bid = idArr[i];
            // Ghost Mode lets a bubble pass through solid blockades.
            const ghost = pickupsEnabledRef.current && hasStatus(bid, "ghost", nowMs);
            for (const b of arenaBlockadesRef.current) {
              if (!overlapsBlockade(b, nx, ny, rArr[i])) continue;
              const hitKey = `${bid}:${b.id}`;
              const lastHit = blockadeHitCooldownRef.current.get(hitKey) ?? 0;
              const canHit = nowMs - lastHit > BLOCKADE_CONTACT_COOLDOWN_MS;

              // Non-solid fields: force / damage / teleport, never a bounce.
              if (!b.solid) {
                if (b.kind === "conveyor" || b.kind === "pusher") {
                  nvx += (b.fx || 0) * 0.6;
                  nvy += (b.fy || 0) * 0.6;
                } else if (b.kind === "bouncy_pad") {
                  const dx = nx - b.x, dy = ny - b.y;
                  const d = Math.sqrt(dx * dx + dy * dy) || 1;
                  nvx = (dx / d) * Math.abs(nvx || 1) * 1.8;
                  nvy = (dy / d) * Math.abs(nvy || 1) * 1.8;
                  if (pickupsEnabledRef.current) addStatus(bid, "speed_boost", 900, nowMs);
                } else if (b.kind === "laser_wall") {
                  if (b.active && canHit) {
                    blockadeHitCooldownRef.current.set(hitKey, nowMs);
                    const dmg = Math.round(BLOCKADE_LASER_DAMAGE * globalDamageMultRef.current);
                    hArr[i] = Math.max(0, hArr[i] - dmg);
                    spawnPickupFx(bid, `-${dmg}`, "#f97316");
                  }
                } else if (b.kind === "rotating_blade") {
                  if (canHit) {
                    blockadeHitCooldownRef.current.set(hitKey, nowMs);
                    const dmg = Math.round(BLOCKADE_BLADE_DAMAGE * globalDamageMultRef.current);
                    hArr[i] = Math.max(0, hArr[i] - dmg);
                    spawnPickupFx(bid, `-${dmg}`, "#fb7185");
                    const dx = nx - b.x, dy = ny - b.y;
                    const d = Math.sqrt(dx * dx + dy * dy) || 1;
                    nx = b.x + (dx / d) * (b.r + rArr[i] + 2);
                    ny = b.y + (dy / d) * (b.r + rArr[i] + 2);
                    nvx = (dx / d) * Math.abs(nvx || 1);
                    nvy = (dy / d) * Math.abs(nvy || 1);
                  }
                } else if (b.kind === "teleport_gate" && b.linkId !== undefined) {
                  const tpLast = teleportCooldownRef.current.get(bid) ?? 0;
                  if (nowMs - tpLast > 1200) {
                    const exit = arenaBlockadesRef.current.find((o) => o.id === b.linkId);
                    if (exit) {
                      teleportCooldownRef.current.set(bid, nowMs);
                      const sp = Math.sqrt(nvx * nvx + nvy * nvy) || 1;
                      nx = exit.x + (nvx / sp) * (exit.r + rArr[i] + 4);
                      ny = exit.y + (nvy / sp) * (exit.r + rArr[i] + 4);
                    }
                  }
                }
                continue;
              }

              if (ghost) continue;

              // Solid: eject to the surface and reflect along its normal.
              const push = resolveBlockadePush(b, nx, ny, rArr[i]);
              if (!push) continue;
              nx = push.x;
              ny = push.y;
              const dot = nvx * push.nx + nvy * push.ny;
              if (dot < 0) {
                nvx -= 2 * dot * push.nx;
                nvy -= 2 * dot * push.ny;
              }
              if (b.kind === "spike_block" && canHit) {
                blockadeHitCooldownRef.current.set(hitKey, nowMs);
                const dmg = Math.round(BLOCKADE_SPIKE_DAMAGE * globalDamageMultRef.current);
                hArr[i] = Math.max(0, hArr[i] - dmg);
                spawnPickupFx(bid, `-${dmg}`, "#ef4444");
              } else if (b.kind === "breakable" && canHit) {
                blockadeHitCooldownRef.current.set(hitKey, nowMs);
                b.hp = (b.hp ?? 3) - 1;
              } else if (b.kind === "invisible_wall" && canHit) {
                blockadeHitCooldownRef.current.set(hitKey, nowMs);
                b.active = true; // subtle discovery feedback
              }
            }
          }

          xArr[i] = nx;
          yArr[i] = ny;
          vxArr[i] = nvx;
          vyArr[i] = nvy;
          
          // Enforce consistent speed for ALL arena types after movement
          // This ensures bubbles maintain the same speed throughout the game
          const currentSpeed = Math.sqrt(vxArr[i] * vxArr[i] + vyArr[i] * vyArr[i]);
          const targetSpeed = speed * 0.6; // Match initial velocity magnitude
          if (currentSpeed > 0.01) {
            const factor = targetSpeed / currentSpeed;
            vxArr[i] *= factor;
            vyArr[i] *= factor;
          } else {
            // If nearly stopped, give random velocity at target speed
            const angle = Math.random() * Math.PI * 2;
            vxArr[i] = Math.cos(angle) * targetSpeed;
            vyArr[i] = Math.sin(angle) * targetSpeed;
          }
        }

        // sampled collisions - normal-normal collisions
        // In normal arena: deal damage and record hits
        // In boss arena: bounce only (no damage), but still record hits for all normals
        if (!startGrace && n > 1) {
          // Use nested loop for proper collision detection
          // To optimize, only check each pair once (j starts from i+1)
          for (let i = 0; i < n - 1; i++) {
            if (hArr[i] <= 0) continue;
            
            // Check against all bubbles after this one
            for (let j = i + 1; j < n; j++) {
              if (hArr[j] <= 0) continue;
              
              const dx = xArr[i] - xArr[j];
              const dy = yArr[i] - yArr[j];
              const distSq = dx * dx + dy * dy;
              const minD = rArr[i] + rArr[j];
              const minD2 = minD * minD;
              
              if (distSq < minD2) {
                playArenaSound("collision");
                // Store original positions for correct bounce calculation
                const origXi = xArr[i];
                const origYi = yArr[i];
                const origXj = xArr[j];
                const origYj = yArr[j];
                
                // separate bubbles
                const separated = separatePair(xArr[i], yArr[i], rArr[i], xArr[j], yArr[j], rArr[j]);
                xArr[i] = separated.ax;
                yArr[i] = separated.ay;
                xArr[j] = separated.bx;
                yArr[j] = separated.by;
                
                // bounce velocities using original positions
                // Store original speeds before bounce
                const origSpeedI = Math.sqrt(vxArr[i] * vxArr[i] + vyArr[i] * vyArr[i]);
                const origSpeedJ = Math.sqrt(vxArr[j] * vxArr[j] + vyArr[j] * vyArr[j]);
                
                const bounced = bouncePairVel(vxArr[i], vyArr[i], vxArr[j], vyArr[j], origXi, origYi, origXj, origYj);
                vxArr[i] = bounced.avx;
                vyArr[i] = bounced.avy;
                vxArr[j] = bounced.bvx;
                vyArr[j] = bounced.bvy;
                
                // Normalize velocities to preserve original speeds (prevent slowdown)
                const newSpeedI = Math.sqrt(bounced.avx * bounced.avx + bounced.avy * bounced.avy);
                const newSpeedJ = Math.sqrt(bounced.bvx * bounced.bvx + bounced.bvy * bounced.bvy);
                if (newSpeedI > 0.01 && origSpeedI > 0.01) {
                  const factorI = origSpeedI / newSpeedI;
                  vxArr[i] *= factorI;
                  vyArr[i] *= factorI;
                }
                if (newSpeedJ > 0.01 && origSpeedJ > 0.01) {
                  const factorJ = origSpeedJ / newSpeedJ;
                  vxArr[j] *= factorJ;
                  vyArr[j] *= factorJ;
                }

                // Check if blades are active and either bubble has a blade
                // Blades are active if: 1) enabled with delay and auto-enabled, OR 2) immediate enable (time=0) and not expired (not -1)
                const bladesActive = bladeEnabled && ((bladeAutoEnableTime === 0 && bladeEnabledAtRef.current !== -1) || bladeAutoEnabledRef.current);
                const iHasBlade = bladesActive && bladeAssignmentsRef.current.has(idArr[i]);
                const jHasBlade = bladesActive && bladeAssignmentsRef.current.has(idArr[j]);
                
                // Apply damage based on arena type
                // If either bubble has a blade enabled, skip normal collision damage
                // (blade-specific damage will be handled separately in blade collision section)
                if (arenaType === ARENA_TYPES.NORMAL) {
                  const damage = baseDamage;
                  // normal arena: apply damage to both bubbles, but NOT if either has a blade
                  if (!iHasBlade && !jHasBlade) {
                    recordCollisionHit(i, imgIdxArr[j], idArr[j], nowMs, true, damage);
                    recordCollisionHit(j, imgIdxArr[i], idArr[i], nowMs, true, damage);
                  }
                } else if (arenaType === ARENA_TYPES.BRAWL) {
                  // brawl arena: damage depends on teams
                  const damage = baseDamage;
                  const teamI = brawlTeamsRef.current.get(idArr[i]);
                  const teamJ = brawlTeamsRef.current.get(idArr[j]);
                  
                  // Skip damage if either bubble has a blade (blade damage handled separately)
                  if (!iHasBlade && !jHasBlade) {
                    if (brawlMode === "1v1") {
                      // 1v1: both bubbles damage each other
                      recordCollisionHit(i, imgIdxArr[j], idArr[j], nowMs, true, damage);
                      recordCollisionHit(j, imgIdxArr[i], idArr[i], nowMs, true, damage);
                    } else if (brawlMode === "1vMany" && teamI !== teamJ) {
                      // 1vMany: only damage if from different teams
                      recordCollisionHit(i, imgIdxArr[j], idArr[j], nowMs, true, damage);
                      recordCollisionHit(j, imgIdxArr[i], idArr[i], nowMs, true, damage);
                    }
                    // Same team = no damage
                  }
                } else {
                  // boss arena: record hits for both without damage
                  // Skip if either has a blade (blade collision handled separately)
                  if (!iHasBlade && !jHasBlade) {
                    recordCollisionHit(i, imgIdxArr[j], idArr[j], nowMs, false);
                    recordCollisionHit(j, imgIdxArr[i], idArr[i], nowMs, false);
                  }
                }

                // small outward push to reduce sticking
                const d = Math.sqrt(Math.max(0.0001, distSq));
                // Impact Boost pickup: bigger knockback on this collision, consumed once.
                let pushMag = 2;
                if (pickupsEnabledRef.current && impactBoostRef.current.size > 0) {
                  if (impactBoostRef.current.has(idArr[i])) { pushMag = 10; impactBoostRef.current.delete(idArr[i]); }
                  else if (impactBoostRef.current.has(idArr[j])) { pushMag = 10; impactBoostRef.current.delete(idArr[j]); }
                }
                const nxPush = (dx / d) * pushMag;
                const nyPush = (dy / d) * pushMag;
                xArr[i] += nxPush;
                yArr[i] += nyPush;
                xArr[j] -= nxPush;
                yArr[j] -= nyPush;
                
                // Enforce consistent speed - all bubbles should maintain their initial speed magnitude
                // Initial speed is speed * 0.6 = 1.8, so use that as the target
                const targetSpeed = speed * 0.6;
                const speedI = Math.sqrt(vxArr[i] * vxArr[i] + vyArr[i] * vyArr[i]);
                const speedJ = Math.sqrt(vxArr[j] * vxArr[j] + vyArr[j] * vyArr[j]);
                if (speedI > 0.01) {
                  const factor = targetSpeed / speedI;
                  vxArr[i] *= factor;
                  vyArr[i] *= factor;
                }
                if (speedJ > 0.01) {
                  const factor = targetSpeed / speedJ;
                  vxArr[j] *= factor;
                  vyArr[j] *= factor;
                }
              }
            }
          }
        }

        // spikes (damage & reposition) - spikes damage normals only
        // Only apply spikes if: enabled AND (no timer OR timer has expired)
        const spikesActive = spikeEnabled && (spikeAutoEnableTime === 0 || spikeAutoEnabledRef.current);
        if (spikesActive && spikePositions.length > 0) {
          const SPIKE_COOLDOWN_MS = 250; // Cooldown between spike hits for same bubble
          
          // Optimize: skip spike checks for bubbles beyond a limit in boss/brawl to reduce lag
          const spikeCheckLimit = arenaType === ARENA_TYPES.NORMAL ? n : Math.min(n, 600);
          
          for (let i = 0; i < spikeCheckLimit; i++) {
            const s = detectSpikeHit(xArr[i], yArr[i], rArr[i]);
            if (s) {
              playArenaSound("spikeHit");
              const bubbleId = idArr[i];
              const lastSpikeHit = damageCooldownRef.current[bubbleId] ?? 0;
              
              // Only apply damage if cooldown has passed
              if (nowMs - lastSpikeHit > SPIKE_COOLDOWN_MS) {
                // Use arena-specific spike damage
                const spikeHitDamage = arenaType === ARENA_TYPES.BRAWL ? brawlSpikeDamage : 
                                       arenaType === ARENA_TYPES.BOSS ? bossNormalSpikeDamage : normalSpikeDamage;
                hArr[i] = Math.max(hArr[i] - spikeHitDamage, 0);
                damageCooldownRef.current[bubbleId] = nowMs;
              }
              
              // Always bounce away from spike, regardless of damage cooldown
              const vDotN = vxArr[i] * s.nx + vyArr[i] * s.ny;
              if (vDotN < 0) { // Only bounce if moving toward spike
                vxArr[i] -= 2 * vDotN * s.nx;
                vyArr[i] -= 2 * vDotN * s.ny;
              }
              
              // Push bubble away from spike strongly
              const pushDist = spikeSize * 0.8 + rArr[i] + 5;
              xArr[i] = s.x + s.nx * pushDist;
              yArr[i] = s.y + s.ny * pushDist;
            }
          }
        }

        // Blade collision damage - check if bubbles hit other bubbles' blades
        // Blade Damage Rules:
        //  - Normal Arena: Player blade vs player bubble = 5 HP damage
        //  - Boss Arena: Player blades DO damage other players = 5 HP damage
        //  - Brawl Arena: Blade damage only between opposing teams (same team = no damage)
        // Blades are active if: 1) enabled with delay and auto-enabled, OR 2) immediate enable (time=0) and not expired (not -1)
        const bladesActive = bladeEnabled && ((bladeAutoEnableTime === 0 && bladeEnabledAtRef.current !== -1) || bladeAutoEnabledRef.current);
        if (bladesActive && bladeAssignmentsRef.current.size > 0) {
          const BLADE_COOLDOWN_MS = 150; // Cooldown between blade hits for same bubble
          const SPARK_COOLDOWN_MS = 100; // Cooldown between spark effects
          
          // Update blade rotation
          bladeRotationRef.current = (bladeRotationRef.current + 6) % 360;
          
          // Track blade-to-blade pairs already checked to avoid duplicates
          const checkedBladePairs = new Set<string>();
          
          // Optimize: only check up to 500 bubbles for blade collision
          const checkLimit = Math.min(n, 500);
          for (let i = 0; i < checkLimit; i++) {
            const bubbleId = idArr[i];
            const iHasBlade = bladeAssignmentsRef.current.has(bubbleId);
            
            // Check if this bubble collides with any other bubble's blade
            for (let j = i + 1; j < checkLimit; j++) {
              const otherBubbleId = idArr[j];
              const otherHasBlade = bladeAssignmentsRef.current.has(otherBubbleId);
              
              // Case 1: BLADE-TO-BLADE collision (both have blades) - NO DAMAGE, only sparks
              if (iHasBlade && otherHasBlade) {
                const pairKey = `${Math.min(bubbleId, otherBubbleId)}_${Math.max(bubbleId, otherBubbleId)}`;
                if (!checkedBladePairs.has(pairKey)) {
                  checkedBladePairs.add(pairKey);
                  
                  const collision = detectBladeToBladeCollision(
                    xArr[i], yArr[i], rArr[i],
                    xArr[j], yArr[j], rArr[j],
                    false, false
                  );
                  
                  if (collision.collides) {
                    // Show welding spark effect at contact point
                    const sparkCooldownKey = `spark_${pairKey}`;
                    const lastSpark = (damageCooldownRef.current as any)[sparkCooldownKey] ?? 0;
                    
                    if (nowMs - lastSpark > SPARK_COOLDOWN_MS) {
                      (damageCooldownRef.current as any)[sparkCooldownKey] = nowMs;
                      const sparkId = Date.now() + Math.random();
                      setBladeSparkEffects(prev => [...prev, {
                        id: sparkId,
                        x: collision.contactX,
                        y: collision.contactY,
                        createdAt: nowMs
                      }]);
                      // Remove spark after animation
                      setTimeout(() => {
                        setBladeSparkEffects(prev => prev.filter(s => s.id !== sparkId));
                      }, 300);
                    }
                  }
                }
                continue; // No damage for blade-to-blade
              }
              
              // Case 2: Normal bubble (no blade) hits another bubble's blade - apply damage
              if (!iHasBlade && otherHasBlade) {
                if (detectBladeHit(xArr[i], yArr[i], rArr[i], xArr[j], yArr[j], rArr[j], true, false)) {
                  const cooldownKey = `blade_${bubbleId}`;
                  const lastBladeHit = (damageCooldownRef.current as any)[cooldownKey] ?? 0;
                  
                  if (nowMs - lastBladeHit > BLADE_COOLDOWN_MS) {
                    // Use arena-specific blade damage
                    let bladeDamage = normalBladeDamageRef.current;
                    if (arenaType === ARENA_TYPES.BOSS) {
                      bladeDamage = bossNormalBladeDamageRef.current;
                    } else if (arenaType === ARENA_TYPES.BRAWL) {
                      bladeDamage = brawlBladeDamageRef.current;
                    }
                    
                    let shouldApplyDamage = true;
                    
                    // Check team logic for brawl mode
                    if (arenaType === ARENA_TYPES.BRAWL) {
                      const teamI = brawlTeamsRef.current.get(bubbleId);
                      const teamJ = brawlTeamsRef.current.get(otherBubbleId);
                      
                      // Only apply blade damage if teams are different
                      if (teamI === teamJ) {
                        shouldApplyDamage = false; // Same team - no damage
                      }
                    }
                    // In boss arena, blades DO damage between player bubbles
                    
                    if (shouldApplyDamage) {
                      playArenaSound("blade");
                      hArr[i] = Math.max(hArr[i] - bladeDamage, 0);
                      (damageCooldownRef.current as any)[cooldownKey] = nowMs;
                      
                      // Record hit for stats
                      try {
                        const attacker = imgSrcsRef.current[imgIdxArr[j]] ?? `player-${otherBubbleId}`;
                        lastDamagerRef.current[bubbleId] = normalizePlayer(attacker);
                        recordHit(normalizePlayer(attacker));
                      } catch (e) {}
                    }
                  }
                }
              }
              
              // Case 3: Normal bubble with blade hits another bubble without blade - apply damage to other
              if (iHasBlade && !otherHasBlade) {
                if (detectBladeHit(xArr[j], yArr[j], rArr[j], xArr[i], yArr[i], rArr[i], true, false)) {
                  const cooldownKey = `blade_${otherBubbleId}`;
                  const lastBladeHit = (damageCooldownRef.current as any)[cooldownKey] ?? 0;
                  
                  if (nowMs - lastBladeHit > BLADE_COOLDOWN_MS) {
                    // Use arena-specific blade damage
                    let bladeDamage = normalBladeDamageRef.current;
                    if (arenaType === ARENA_TYPES.BOSS) {
                      bladeDamage = bossNormalBladeDamageRef.current;
                    } else if (arenaType === ARENA_TYPES.BRAWL) {
                      bladeDamage = brawlBladeDamageRef.current;
                    }
                    
                    let shouldApplyDamage = true;
                    
                    // Check team logic for brawl mode
                    if (arenaType === ARENA_TYPES.BRAWL) {
                      const teamI = brawlTeamsRef.current.get(bubbleId);
                      const teamJ = brawlTeamsRef.current.get(otherBubbleId);
                      
                      // Only apply blade damage if teams are different
                      if (teamI === teamJ) {
                        shouldApplyDamage = false; // Same team - no damage
                      }
                    }
                    
                    if (shouldApplyDamage) {
                      playArenaSound("blade");
                      hArr[j] = Math.max(hArr[j] - bladeDamage, 0);
                      (damageCooldownRef.current as any)[cooldownKey] = nowMs;
                      
                      // Record hit for stats
                      try {
                        const attacker = imgSrcsRef.current[imgIdxArr[i]] ?? `player-${bubbleId}`;
                        lastDamagerRef.current[otherBubbleId] = normalizePlayer(attacker);
                        recordHit(normalizePlayer(attacker));
                      } catch (e) {}
                    }
                  }
                }
              }
            }
            
            // Check if superbubble collides with this bubble's blade (Boss arena only)
            if (arenaType === ARENA_TYPES.BOSS && superBubbleRef.current && iHasBlade) {
              const sb = superBubbleRef.current;
              const sbHasBlade = bladeAssignmentsRef.current.has(sb.id);
              
              // Blade-to-blade between normal and superbubble
              if (sbHasBlade) {
                const collision = detectBladeToBladeCollision(
                  xArr[i], yArr[i], rArr[i],
                  sb.x, sb.y, sb.radius,
                  false, true
                );
                
                if (collision.collides) {
                  const sparkCooldownKey = `spark_sb_${bubbleId}`;
                  const lastSpark = (damageCooldownRef.current as any)[sparkCooldownKey] ?? 0;
                  
                  if (nowMs - lastSpark > SPARK_COOLDOWN_MS) {
                    (damageCooldownRef.current as any)[sparkCooldownKey] = nowMs;
                    const sparkId = Date.now() + Math.random();
                    setBladeSparkEffects(prev => [...prev, {
                      id: sparkId,
                      x: collision.contactX,
                      y: collision.contactY,
                      createdAt: nowMs
                    }]);
                    setTimeout(() => {
                      setBladeSparkEffects(prev => prev.filter(s => s.id !== sparkId));
                    }, 300);
                  }
                }
              } else {
                // Superbubble has no blade, hit by normal bubble's blade
                if (detectBladeHit(sb.x, sb.y, sb.radius, xArr[i], yArr[i], rArr[i], true, false)) {
                  const cooldownKey = `blade_sb`;
                  const lastBladeHit = (damageCooldownRef.current as any)[cooldownKey] ?? 0;
                  
                  if (nowMs - lastBladeHit > BLADE_COOLDOWN_MS) {
                    playArenaSound("blade");
                    sb.health = Math.max(sb.health - bossSuperbubbleBladeDamageRef.current, 0);
                    (damageCooldownRef.current as any)[cooldownKey] = nowMs;
                  }
                }
              }
            }
          }
          
          // Check if superbubble's blade hits normal bubbles (if superbubble has a blade)
          if (arenaType === ARENA_TYPES.BOSS && superBubbleRef.current && bladeAssignmentsRef.current.has(superBubbleRef.current.id)) {
            const sb = superBubbleRef.current;
            for (let i = 0; i < n; i++) {
              const bubbleId = idArr[i];
              const iHasBlade = bladeAssignmentsRef.current.has(bubbleId);
              
              // Skip if bubble has blade (handled above as blade-to-blade)
              if (iHasBlade) continue;
              
              if (detectBladeHit(xArr[i], yArr[i], rArr[i], sb.x, sb.y, sb.radius, true, true)) {
                const cooldownKey = `blade_from_sb_${bubbleId}`;
                const lastBladeHit = (damageCooldownRef.current as any)[cooldownKey] ?? 0;
                
                if (nowMs - lastBladeHit > BLADE_COOLDOWN_MS) {
                  playArenaSound("blade");
                  hArr[i] = Math.max(hArr[i] - bossNormalBladeDamageRef.current, 0);
                  (damageCooldownRef.current as any)[cooldownKey] = nowMs;
                }
              }
            }
          }
        }

        // ===== Arena Pickups (spec section 4) — spawn, collect, status ticks =====
        // Spawn/magnet/status-ticks are gated by the "Pickups" toggle, but collect+expire
        // always runs so event-spawned pickups (health_rain/item_chaos) still work even
        // when the separate "Pickups" system is off.
        if (pickupsEnabledRef.current) {
          // 1) SPAWN on interval, respecting max count + valid placement.
          const freqMs = pickupFrequencyRef.current === "low" ? 6000 : pickupFrequencyRef.current === "high" ? 2500 : 4000;
          if (nowMs - lastArenaPickupSpawnRef.current > freqMs && arenaPickupsRef.current.length < pickupMaxRef.current && n > 0) {
            lastArenaPickupSpawnRef.current = nowMs;
            let pool: ArenaPickupKind[];
            if (pickupModeRef.current === "custom") {
              // Custom: only the kinds the user explicitly enabled.
              pool = ARENA_PICKUP_KINDS.filter((k) => pickupSelectedRef.current.has(k));
            } else {
              // Auto: random good/bad pool weighted by ratio (original behavior).
              const roll = Math.random();
              if (pickupRatioRef.current === "good") pool = roll < 0.8 ? GOOD_PICKUP_KINDS : BAD_PICKUP_KINDS;
              else if (pickupRatioRef.current === "bad") pool = roll < 0.8 ? BAD_PICKUP_KINDS : GOOD_PICKUP_KINDS;
              else pool = roll < 0.5 ? GOOD_PICKUP_KINDS : BAD_PICKUP_KINDS;
            }
            if (pool.length === 0) { /* nothing enabled — skip this spawn */ }
            else {
            const kind = pool[Math.floor(Math.random() * pool.length)];
            let placed: { x: number; y: number } | null = null;
            for (let attempt = 0; attempt < 12; attempt++) {
              const pos = getRandomPositionInShape(ARENA_PICKUP_RADIUS, dims);
              let ok = true;
              for (let b = 0; b < n; b++) {
                const ddx = xArr[b] - pos.x, ddy = yArr[b] - pos.y;
                const rr = rArr[b] + ARENA_PICKUP_RADIUS;
                if (ddx * ddx + ddy * ddy < rr * rr) { ok = false; break; }
              }
              if (ok) {
                for (const p of arenaPickupsRef.current) {
                  const ddx = p.x - pos.x, ddy = p.y - pos.y;
                  const rr = ARENA_PICKUP_RADIUS * 2;
                  if (ddx * ddx + ddy * ddy < rr * rr) { ok = false; break; }
                }
              }
              // Never inside a solid blockade (spec section 10).
              if (ok && blockadesEnabledRef.current) {
                for (const b of arenaBlockadesRef.current) {
                  if (b.solid && overlapsBlockade(b, pos.x, pos.y, ARENA_PICKUP_RADIUS)) { ok = false; break; }
                }
              }
              if (ok) { placed = pos; break; }
            }
            if (placed) {
              arenaPickupsRef.current.push({ id: nextProjectileId++, x: placed.x, y: placed.y, kind, createdAt: nowMs, expiresAt: nowMs + 9000 });
              setArenaPickups([...arenaPickupsRef.current]);
            }
            }
          }

          // 2) MAGNET: pull idle pickups toward bubbles with an active magnet.
          if (arenaPickupsRef.current.length > 0) {
            for (let b = 0; b < n; b++) {
              if (hArr[b] <= 0 || !hasStatus(idArr[b], "magnet", nowMs)) continue;
              for (const p of arenaPickupsRef.current) {
                const ddx = xArr[b] - p.x, ddy = yArr[b] - p.y;
                const d2 = ddx * ddx + ddy * ddy;
                if (d2 < 200 * 200 && d2 > 1) {
                  const d = Math.sqrt(d2);
                  p.x += (ddx / d) * 3;
                  p.y += (ddy / d) * 3;
                }
              }
            }
          }
        }

        // 3) COLLECT + EXPIRE — always runs (even with "Pickups" off) so event-spawned
        // pickups (health_rain/item_chaos) remain collectible/visible.
        if (arenaPickupsRef.current.length > 0) {
          const remove: number[] = [];
          for (const p of arenaPickupsRef.current) {
            if (p.vy) p.y += p.vy; // falling rain pickups drop top-to-bottom
            if (nowMs > p.expiresAt || (p.vy != null && p.y - ARENA_PICKUP_RADIUS > dims.height)) { remove.push(p.id); continue; }
            for (let b = 0; b < n; b++) {
              if (hArr[b] <= 0) continue;
              const ddx = xArr[b] - p.x, ddy = yArr[b] - p.y;
              const hit = rArr[b] + ARENA_PICKUP_RADIUS;
              if (ddx * ddx + ddy * ddy < hit * hit) {
                const bid = idArr[b];
                if (nowMs < (lockedUntilRef.current.get(bid) ?? 0)) continue; // Locked
                applyPickupEffect(p.kind, bid, b, nowMs);
                playArenaSound("eventImpact", p.kind);
                remove.push(p.id);
                break;
              }
            }
          }
          if (remove.length > 0) {
            arenaPickupsRef.current = arenaPickupsRef.current.filter((p) => !remove.includes(p.id));
            setArenaPickups([...arenaPickupsRef.current]);
          }
        }

        if (pickupsEnabledRef.current) {
          // 4) STATUS TICKS (HP over time) + expiry cleanup (shrink restore).
          const rTgtArr = rTargetRef.current;
          if (bubbleStatusesRef.current.size > 0) {
            for (let b = 0; b < n; b++) {
              const list = bubbleStatusesRef.current.get(idArr[b]);
              if (!list) continue;
              for (const s of list) {
                if (nowMs >= s.expiresAt) continue;
                if ((s.type === "poison" || s.type === "bleed" || s.type === "regeneration") && nowMs - (s.lastTick ?? s.startedAt) >= 1000) {
                  s.lastTick = nowMs;
                  if (s.type === "poison") hArr[b] = Math.max(0, hArr[b] - 5);
                  else if (s.type === "bleed") hArr[b] = Math.max(0, hArr[b] - 2);
                  else hArr[b] = hArr[b] + 3; // regeneration: no upper cap
                }
              }
            }
            for (const [bid, list] of bubbleStatusesRef.current) {
              let bIdx = -1;
              for (let b = 0; b < n; b++) { if (idArr[b] === bid) { bIdx = b; break; } }
              const kept: ArenaStatus[] = [];
              for (const s of list) {
                if (nowMs < s.expiresAt) { kept.push(s); continue; }
                if (s.type === "shrink" && bIdx >= 0 && s.origR !== undefined) {
                  rArr[bIdx] = s.origR;
                  if (rTgtArr && s.origTgt !== undefined) rTgtArr[bIdx] = s.origTgt;
                }
              }
              if (kept.length > 0) bubbleStatusesRef.current.set(bid, kept);
              else bubbleStatusesRef.current.delete(bid);
            }
          }
        }

        // Prune expired Locked entries and old floating labels — always runs so
        // labels from event-spawned pickups (collected while "Pickups" is off) clean up too.
        if (lockedUntilRef.current.size > 0) {
          for (const [bid, until] of lockedUntilRef.current) if (nowMs >= until) lockedUntilRef.current.delete(bid);
        }
        if (pickupFxRef.current.length > 0) {
          const before = pickupFxRef.current.length;
          pickupFxRef.current = pickupFxRef.current.filter((fx) => nowMs - fx.createdAt < 900);
          if (pickupFxRef.current.length !== before) setPickupFx([...pickupFxRef.current]);
        }

        // ---- 11. Zone effects (spec section 6) — HP ticks + fade tracking ---
        if (zonesEnabledRef.current && arenaZonesRef.current.length > 0) {
          const faded = fadedBubblesRef.current;
          const wasFaded = faded.size;
          faded.clear();
          for (let i = 0; i < n; i++) {
            if (hArr[i] <= 0) continue;
            const bid = idArr[i];
            let hpDelta = 0;
            for (const z of arenaZonesRef.current) {
              const dx = xArr[i] - z.x, dy = yArr[i] - z.y;
              if (dx * dx + dy * dy > z.r * z.r) continue;
              if (z.kind === "fire") hpDelta -= 5;
              else if (z.kind === "poison_zone") hpDelta -= 2;
              else if (z.kind === "heal") hpDelta += 3;
              else if (z.kind === "invisibility") faded.add(bid);
            }
            // Tick once per second, never every frame.
            if (hpDelta !== 0) {
              const last = zoneTickRef.current.get(bid) ?? 0;
              if (nowMs - last >= 1000) {
                zoneTickRef.current.set(bid, nowMs);
                hArr[i] = Math.max(0, hArr[i] + hpDelta); // no upper cap on heal zones
              }
            }
          }
          if (wasFaded !== faded.size) setArenaZones([...arenaZonesRef.current]);
        } else if (fadedBubblesRef.current.size > 0) {
          fadedBubblesRef.current.clear();
        }

        // ---- Meteor hazards (spec section 7) — damage + knockback on contact -
        if (eventsEnabledRef.current && arenaMeteorsRef.current.length > 0) {
          const spent: number[] = [];
          for (const m of arenaMeteorsRef.current) {
            for (let i = 0; i < n; i++) {
              if (hArr[i] <= 0) continue;
              const dx = xArr[i] - m.x, dy = yArr[i] - m.y;
              const need = m.r + rArr[i];
              if (dx * dx + dy * dy >= need * need) continue;
              const meteorDmg = Math.round(12 * globalDamageMultRef.current);
              hArr[i] = Math.max(0, hArr[i] - meteorDmg);
              playArenaSound("eventImpact", "meteor");
              spawnPickupFx(idArr[i], `-${meteorDmg}`, "#f97316");
              const d = Math.sqrt(dx * dx + dy * dy) || 1;
              vxArr[i] += (dx / d) * 2;
              vyArr[i] += (dy / d) * 2;
              spent.push(m.id);
              break;
            }
          }
          if (spent.length > 0) {
            arenaMeteorsRef.current = arenaMeteorsRef.current.filter((m) => !spent.includes(m.id));
            setArenaMeteors([...arenaMeteorsRef.current]);
          }
        }

        // Player Powers Feature (Boss Arena only)
        // Only apply player powers if: enabled AND (no timer OR timer has expired)
        const playerPowersActive = playerPowersEnabledRef.current && (playerPowersAutoEnableTime === 0 || playerPowersAutoEnabledRef.current);
        const normalPowersActive = normalPowersEnabledRef.current;
        if ((arenaType === ARENA_TYPES.BOSS && playerPowersActive) || (arenaType === ARENA_TYPES.NORMAL && normalPowersActive)) {
          // Spawn power pickups in pickup mode
          if (arenaType === ARENA_TYPES.NORMAL && normalPowersEnabledRef.current && !preAssignedAppliedRef.current && n > 0) {
            const enabledPowers = (Object.keys(selectedNormalPowers) as (keyof typeof SUPER_BUBBLE_TYPES)[]).filter((key) => selectedNormalPowers[key]);
            if (enabledPowers.length > 0) {
              for (let i = 0; i < n; i++) {
                bubblePowersRef.current.set(idArr[i], { type: enabledPowers[i % enabledPowers.length], expiresAt: Infinity, lastShot: nowMs - 1000 });
              }
              setBubblePowers(new Map(bubblePowersRef.current));
              preAssignedAppliedRef.current = true;
            }
          }

          if (playerPowerMode === "pickup") {
            const PICKUP_SPAWN_INTERVAL = 7000; // Spawn every 7 seconds
            if (nowMs - lastPickupSpawnRef.current > PICKUP_SPAWN_INTERVAL) {
              lastPickupSpawnRef.current = nowMs;
              
              // Get list of enabled powers
              const enabledPowers = AVAILABLE_POWER_KEYS.filter(
                (k) => arenaType === ARENA_TYPES.NORMAL ? selectedNormalPowers[k] : selectedPlayerPowers[k]
              );
              
              if (enabledPowers.length > 0) {
                const randomPower = enabledPowers[Math.floor(Math.random() * enabledPowers.length)];
                const pos = getRandomPositionInShape(20, dims);
                const newPickup: PowerPickup = {
                  id: nextProjectileId++,
                  x: pos.x,
                  y: pos.y,
                  type: randomPower,
                  createdAt: nowMs,
                  expiresAt: nowMs + 5000, // 5 seconds
                };
                console.log(`🌟 Spawned ${randomPower} pickup at (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)})`);
                powerPickupsRef.current.push(newPickup);
                setPowerPickups([...powerPickupsRef.current]);
              }
            }
          }

          // Check pickup collisions (before filtering expired ones)
          if (playerPowerMode === "pickup" && powerPickupsRef.current.length > 0) {
            console.log(`🔍 Checking ${powerPickupsRef.current.length} pickups against ${n} bubbles`);
            const pickupsToRemove: number[] = [];
            
            for (const pickup of powerPickupsRef.current) {
              // Mark expired pickups for removal
              if (nowMs > pickup.expiresAt) {
                pickupsToRemove.push(pickup.id);
                console.log(`Pickup ${pickup.id} (${pickup.type}) expired and removed`);
                continue;
              }
              
              // Check collision with normal bubbles
              let collected = false;
              for (let i = 0; i < n; i++) {
                const dx = xArr[i] - pickup.x;
                const dy = yArr[i] - pickup.y;
                const distSq = dx * dx + dy * dy;
                const hitRadius = rArr[i] + 20; // 20 is pickup radius
                const hitRadiusSq = hitRadius * hitRadius;
                const dist = Math.sqrt(distSq);
                
                // Log every check to see what's happening
                if (i === 0 || dist < 100) { // Log first bubble or close ones
                  console.log(`   Bubble ${i} (id: ${idArr[i]}) at (${xArr[i].toFixed(0)},${yArr[i].toFixed(0)}) vs pickup at (${pickup.x.toFixed(0)},${pickup.y.toFixed(0)}): dist=${dist.toFixed(1)}, hitRadius=${hitRadius.toFixed(1)}, collision=${dist < hitRadius}`);
                }
                
                if (distSq < hitRadiusSq) {
                  // Grant power to this bubble
                  const bubbleId = idArr[i];
                  if (!bubblePowersRef.current.has(bubbleId)) {
                    console.log(`✅ Bubble ${bubbleId} (pos: ${xArr[i].toFixed(0)},${yArr[i].toFixed(0)}, r: ${rArr[i].toFixed(0)}) picked up ${pickup.type} power at (${pickup.x.toFixed(0)},${pickup.y.toFixed(0)})! Distance: ${Math.sqrt(distSq).toFixed(1)}`);
                    bubblePowersRef.current.set(bubbleId, {
                      type: pickup.type,
                      expiresAt: nowMs + 15000, // 15 seconds
                      lastShot: nowMs - 1000, // Start almost ready to shoot
                    });
                    setBubblePowers(new Map(bubblePowersRef.current));
                    pickupsToRemove.push(pickup.id);
                    collected = true;
                    break;
                  } else {
                    console.log(`❌ Bubble ${bubbleId} already has power, can't pick up ${pickup.type}`);
                  }
                }
              }
              if (collected) break; // Only process one pickup per tick
            }
            
            // Remove collected and expired pickups in one update
            if (pickupsToRemove.length > 0) {
              powerPickupsRef.current = powerPickupsRef.current.filter((p) => !pickupsToRemove.includes(p.id));
              setPowerPickups([...powerPickupsRef.current]);
            }
          }

          // Apply pre-assigned powers at game start
          if (playerPowerMode === "preassigned" && powerAssignments.length > 0 && !preAssignedAppliedRef.current && n > 0) {
            for (const assignment of powerAssignments) {
              // Find bubble by index (0-based)
              if (assignment.bubbleId >= 0 && assignment.bubbleId < n) {
                const actualBubbleId = idArr[assignment.bubbleId];
                if (!bubblePowersRef.current.has(actualBubbleId)) {
                  bubblePowersRef.current.set(actualBubbleId, {
                    type: assignment.type,
                    expiresAt: nowMs + assignment.duration * 1000,
                    lastShot: nowMs - 1000, // Start ready to shoot
                  });
                }
              }
            }
            setBubblePowers(new Map(bubblePowersRef.current));
            preAssignedAppliedRef.current = true;
          }

          // Remove expired powers and shoot projectiles
          const updatedPowers = new Map<number, BubblePower>();
          let playerProjectilesFired = false;
          for (const [bubbleId, power] of bubblePowersRef.current.entries()) {
            if (nowMs > power.expiresAt) {
              continue; // Expired
            }
            
            // Find bubble index
            let bubbleIdx = -1;
            for (let i = 0; i < n; i++) {
              if (idArr[i] === bubbleId) {
                bubbleIdx = i;
                break;
              }
            }
            
            if (bubbleIdx >= 0) {
              // Shoot every 3s in auto mode, or once per manual shoot request.
              const autoFire = playerBubblesFiringModeRef.current !== "manual";
              if ((autoFire && nowMs - power.lastShot >= 3000) || (!autoFire && manualShootRequestRef.current)) {
                power.lastShot = nowMs;

                // SELF/ARENA/TARGET powers apply an effect instead of firing a projectile.
                if (isSpecialPower(power.type)) {
                  applySpecialPower(power.type, bubbleId, bubbleIdx);
                  playerProjectilesFired = true;
                  updatedPowers.set(bubbleId, power);
                  continue;
                }

                // Aim target: superbubble in Boss arena, nearest other bubble in Normal arena.
                let tx = 0, ty = 0, haveTarget = false;
                if (arenaType === ARENA_TYPES.NORMAL) {
                  let best = -1, bestD = Infinity;
                  for (let j = 0; j < n; j++) {
                    if (idArr[j] === bubbleId || hArr[j] <= 0) continue;
                    const ddx = xArr[j] - xArr[bubbleIdx], ddy = yArr[j] - yArr[bubbleIdx];
                    const dd = ddx * ddx + ddy * ddy;
                    if (dd < bestD) { bestD = dd; best = j; }
                  }
                  if (best >= 0) { tx = xArr[best]; ty = yArr[best]; haveTarget = true; }
                } else {
                  const sb = superBubbleRef.current;
                  if (sb) { tx = sb.x; ty = sb.y; haveTarget = true; }
                }
                if (haveTarget) {
                  const dx = tx - xArr[bubbleIdx];
                  const dy = ty - yArr[bubbleIdx];
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  if (dist > 0) {
                    const speed = playerBubblesProjectileSpeedRef.current || 4;
                    const playerProjCountRef = playerBubblesProjectileCountRef.current || 1;
                    
                    // Fire multiple projectiles using exact superbubble logic
                    for (let i = 0; i < playerProjCountRef; i++) {
                      let vx = (dx / dist) * speed;
                      let vy = (dy / dist) * speed;
                      
                      // Add angle deviation for multiple projectiles to spread them out (same as superbubble)
                      if (playerProjCountRef > 1) {
                        const baseAngle = Math.atan2(dy, dx);
                        const spreadArc = 0.15; // ~8.6 degrees total spread
                        const angleOffset = (i - (playerProjCountRef - 1) / 2) * (spreadArc / Math.max(1, playerProjCountRef - 1));
                        const newAngle = baseAngle + angleOffset;
                        vx = Math.cos(newAngle) * speed;
                        vy = Math.sin(newAngle) * speed;
                      }
                      
                      // Get power type (random or same)
                      const powerKey = playerBubblesPowerModeRef.current === "random" ? (pickRandomPlayerPower() || power.type) : power.type;
                      
                      nextProjectileId++;
                      const id = nextProjectileId;
                      const newProj: Projectile = { id, x: xArr[bubbleIdx], y: yArr[bubbleIdx], vx, vy, type: powerKey, fromBubbleId: bubbleId, fromSuperbubble: false, createdAt: Date.now() };
                      appendProjectile(projectilesRef.current, newProj);
                      playArenaSound("powerRelease", String(powerKey));
                    }
                    
                    playerProjectilesFired = true;
                    
                    // Add muzzle flash
                    const flashId = Date.now() + Math.floor(Math.random() * 10000);
                    setMuzzleFlashes((m) => [...m, { id: flashId, x: xArr[bubbleIdx], y: yArr[bubbleIdx], createdAt: Date.now() }]);
                    setTimeout(() => {
                      setMuzzleFlashes((m) => m.filter((mf) => mf.id !== flashId));
                    }, 100);
                  }
                }
              }
              
              updatedPowers.set(bubbleId, power);
            }
          }
          
          // Call setProjectiles ONCE after all projectiles created (not inside loop)
          if (playerProjectilesFired) {
            setProjectiles([...projectilesRef.current]);
          }
          // Consume a manual shoot request after this firing pass.
          if (playerBubblesFiringModeRef.current === "manual") manualShootRequestRef.current = false;

          if (updatedPowers.size !== bubblePowersRef.current.size) {
            bubblePowersRef.current = updatedPowers;
            setBubblePowers(new Map(updatedPowers));
          }
        }

        // Brawl Arena: Handle bubble powers shooting at enemy bubbles
        // Only apply brawl powers if: enabled AND (no timer OR timer has expired)
        const brawlPowersActive = brawlPowersEnabledRef.current && (brawlPowersAutoEnableTime === 0 || brawlPowersAutoEnabledRef.current);
        if (arenaType === ARENA_TYPES.BRAWL && brawlPowersActive) {
          const nowMs = Date.now();
          
          // Apply powers for 1v1 mode
          if (brawlMode === "1v1" && !preAssignedAppliedRef.current && n >= 2) {
            if (brawl1v1PowerMode === "random") {
              // Random power assignment
              const selectedPowerTypes = Object.keys(selectedBrawlPowers).filter(k => selectedBrawlPowers[k as keyof typeof SUPER_BUBBLE_TYPES]);
              if (selectedPowerTypes.length > 0) {
                // Assign random power to first bubble
                const power1 = selectedPowerTypes[Math.floor(Math.random() * selectedPowerTypes.length)] as keyof typeof SUPER_BUBBLE_TYPES;
                bubblePowersRef.current.set(idArr[0], {
                  type: power1,
                  expiresAt: Infinity, // Permanent for 1v1
                  lastShot: nowMs - 1000, // Start ready to shoot
                });
                
                // Assign random power to second bubble
                const power2 = selectedPowerTypes[Math.floor(Math.random() * selectedPowerTypes.length)] as keyof typeof SUPER_BUBBLE_TYPES;
                bubblePowersRef.current.set(idArr[1], {
                  type: power2,
                  expiresAt: Infinity, // Permanent for 1v1
                  lastShot: nowMs - 1000,
                });
                
                setBubblePowers(new Map(bubblePowersRef.current));
                preAssignedAppliedRef.current = true;
                console.log(`🎲 1v1 Random powers assigned: ${power1} vs ${power2}`);
              }
            } else if (brawl1v1PowerMode === "preassigned" && brawl1v1PowerAssignments.length > 0) {
              // Pre-assigned powers for 1v1
              for (const assignment of brawl1v1PowerAssignments) {
                if (assignment.bubbleId >= 0 && assignment.bubbleId < n) {
                  const actualBubbleId = idArr[assignment.bubbleId];
                  if (!bubblePowersRef.current.has(actualBubbleId)) {
                    bubblePowersRef.current.set(actualBubbleId, {
                      type: assignment.type,
                      expiresAt: Infinity, // Permanent for 1v1
                      lastShot: nowMs - 1000,
                    });
                  }
                }
              }
              setBubblePowers(new Map(bubblePowersRef.current));
              preAssignedAppliedRef.current = true;
              console.log(`🎯 1v1 Pre-assigned powers applied`);
            }
          }
          
          // Apply powers for 1vMany mode
          if (brawlMode === "1vMany" && !preAssignedAppliedRef.current && n > 0) {
            if (brawl1vManyPowerMode === "random") {
              // Random power assignment for 1vMany
              const selectedPowerTypes = Object.keys(selectedBrawlPowers).filter(k => selectedBrawlPowers[k as keyof typeof SUPER_BUBBLE_TYPES]);
              if (selectedPowerTypes.length > 0) {
                for (let i = 0; i < n; i++) {
                  const randomPower = selectedPowerTypes[Math.floor(Math.random() * selectedPowerTypes.length)] as keyof typeof SUPER_BUBBLE_TYPES;
                  bubblePowersRef.current.set(idArr[i], {
                    type: randomPower,
                    expiresAt: Infinity, // Permanent
                    lastShot: nowMs - 1000,
                  });
                }
                setBubblePowers(new Map(bubblePowersRef.current));
                preAssignedAppliedRef.current = true;
                console.log(`🎲 1vMany Random powers assigned to all bubbles`);
              }
            } else if (brawl1vManyPowerMode === "preassigned" && brawl1vManyPowerAssignments.length > 0) {
              // Pre-assigned powers for 1vMany
              for (const assignment of brawl1vManyPowerAssignments) {
                if (assignment.bubbleId >= 0 && assignment.bubbleId < n) {
                  const actualBubbleId = idArr[assignment.bubbleId];
                  if (!bubblePowersRef.current.has(actualBubbleId)) {
                    bubblePowersRef.current.set(actualBubbleId, {
                      type: assignment.type,
                      expiresAt: Infinity, // Permanent
                      lastShot: nowMs - 1000,
                    });
                  }
                }
              }
              setBubblePowers(new Map(bubblePowersRef.current));
              preAssignedAppliedRef.current = true;
              console.log(`🎯 1vMany Pre-assigned powers applied`);
            }
          }
          
          // Shoot projectiles
          if (bubblePowersRef.current.size > 0) {
            const updatedPowers = new Map<number, BubblePower>();
            let projectilesFired = false;
          
            for (const [bubbleId, power] of bubblePowersRef.current.entries()) {
              // Check if power is still active
              if (nowMs > power.expiresAt) {
                continue; // Expired
              }
              
              // Find bubble index
              let bubbleIdx = -1;
              for (let i = 0; i < n; i++) {
                if (idArr[i] === bubbleId) {
                  bubbleIdx = i;
                  break;
                }
              }
            
              if (bubbleIdx >= 0) {
                // Add staggered delay for 1v1 mode (750ms offset) to prevent simultaneous nullification
                const shootDelay = brawlMode === "1v1" ? (bubbleIdx % 2) * 750 : 0;
                
                // Shoot every 3s in auto mode (plus stagger), or once per manual shoot request.
                const autoFireBrawl = brawlBubblesFiringModeRef.current !== "manual";
                if ((autoFireBrawl && nowMs - power.lastShot >= 3000 + shootDelay) || (!autoFireBrawl && manualShootRequestRef.current)) {
                  power.lastShot = nowMs;

                  // SELF/ARENA/TARGET powers apply an effect instead of firing a projectile.
                  if (isSpecialPower(power.type)) {
                    applySpecialPower(power.type, bubbleId, bubbleIdx);
                    projectilesFired = true;
                    updatedPowers.set(bubbleId, power);
                    continue;
                  }

                  // Find a random enemy bubble to aim at (any other bubble)
                  const enemyIndices: number[] = [];
                  const shooterTeam = brawlTeamsRef.current.get(bubbleId);
                  for (let j = 0; j < n; j++) {
                    if (j !== bubbleIdx && hArr[j] > 0) {
                      // In 1vMany mode, only target opposite team
                      if (brawlMode === "1vMany" && shooterTeam !== undefined) {
                        const targetTeam = brawlTeamsRef.current.get(idArr[j]);
                        if (shooterTeam === targetTeam) continue; // Skip same team
                      }
                      enemyIndices.push(j);
                    }
                  }
                  
                  if (enemyIndices.length > 0) {
                    const targetIdx = enemyIndices[Math.floor(Math.random() * enemyIndices.length)];
                    const dx = xArr[targetIdx] - xArr[bubbleIdx];
                    const dy = yArr[targetIdx] - yArr[bubbleIdx];
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > 0) {
                      const speed = brawlBubblesProjectileSpeedRef.current || 4;
                      const projCountRef = brawlBubblesProjectileCountRef.current || 1;
                      
                      // Fire multiple projectiles using exact superbubble logic
                      for (let i = 0; i < projCountRef; i++) {
                        let vx = (dx / dist) * speed;
                        let vy = (dy / dist) * speed;
                        
                        // Add angle deviation for multiple projectiles to spread them out (same as superbubble)
                        if (projCountRef > 1) {
                          const baseAngle = Math.atan2(dy, dx);
                          const spreadArc = 0.15; // ~8.6 degrees total spread
                          const angleOffset = (i - (projCountRef - 1) / 2) * (spreadArc / Math.max(1, projCountRef - 1));
                          const newAngle = baseAngle + angleOffset;
                          vx = Math.cos(newAngle) * speed;
                          vy = Math.sin(newAngle) * speed;
                        }
                        
                        // Get power type (random or same)
                        const powerKey = brawlBubblesPowerModeRef.current === "random" ? (pickRandomBrawlPower() || power.type) : power.type;
                        
                        nextProjectileId++;
                        const id = nextProjectileId;
                        const newProj: Projectile = { id, x: xArr[bubbleIdx], y: yArr[bubbleIdx], vx, vy, type: powerKey, fromBubbleId: bubbleId, fromSuperbubble: false, createdAt: Date.now() };
                        appendProjectile(projectilesRef.current, newProj);
                        playArenaSound("powerRelease", String(powerKey));
                      }
                      
                      projectilesFired = true;
                      
                      // Add muzzle flash
                      const flashId = Date.now() + Math.floor(Math.random() * 10000);
                      setMuzzleFlashes((m) => [...m, { id: flashId, x: xArr[bubbleIdx], y: yArr[bubbleIdx], createdAt: Date.now() }]);
                      setTimeout(() => {
                        setMuzzleFlashes((m) => m.filter((mf) => mf.id !== flashId));
                      }, 100);
                    }
                  }
                }
              
                updatedPowers.set(bubbleId, power);
              }
            }
            
            // Call setProjectiles ONCE after all projectiles created (not inside loop)
            if (projectilesFired) {
              setProjectiles([...projectilesRef.current]);
            }
            
            if (updatedPowers.size !== bubblePowersRef.current.size) {
              bubblePowersRef.current = updatedPowers;
              setBubblePowers(new Map(updatedPowers));
            }
          }
          // Consume a manual shoot request after the brawl firing pass.
          if (brawlBubblesFiringModeRef.current === "manual") manualShootRequestRef.current = false;
        }

        // dying handling
        for (let i = 0; i < n; i++) {
          if (hArr[i] <= 0 && !(idArr[i] in dyingRef.current)) {
            dyingRef.current[idArr[i]] = nowMs;
          }
        }

        // queue removals
        const toQueueIds: number[] = [];
        for (let i = 0; i < n; i++) {
          if (hArr[i] <= 0) {
            const dyingAt = dyingRef.current[idArr[i]] ?? nowMs;
            if (nowMs - dyingAt >= DEATH_DELAY_MS) {
              toQueueIds.push(idArr[i]);
            }
          }
        }
        for (const idToQ of toQueueIds) {
          if (!deathQueueSetRef.current.has(idToQ)) {
            deathQueueRef.current.push(idToQ);
            deathQueueSetRef.current.add(idToQ);
          }
        }

        let deathsProcessed = 0;
        let targetDeathsPerTick = MAX_DEATHS_PER_TICK;
        if (countRef.current > 5000) {
          targetDeathsPerTick = Math.min(1000, deathQueueRef.current.length);
        }

        while (deathQueueRef.current.length > 0 && deathsProcessed < targetDeathsPerTick) {
          const idToRemove = deathQueueRef.current.shift()!;
          deathQueueSetRef.current.delete(idToRemove);

          let foundIndex = indexOfIdRef.current[idToRemove];
          if (foundIndex === undefined) {
            delete damageCooldownRef.current[idToRemove];
            delete dyingRef.current[idToRemove];
            // ensure we clear any lastDamager leftover
            delete lastDamagerRef.current[idToRemove];
            continue;
          }

          // attribute kill to last damager if present
          try {
            const killer = lastDamagerRef.current[idToRemove];
            if (killer) {
              try { recordKill(killer); } catch (e) {}
            }
          } catch (e) {}
          // clear attribution for removed id
          delete lastDamagerRef.current[idToRemove];

          const currN = countRef.current;
          const idArrLocal = idListRef.current!;
          const lastIdx = currN - 1;
          const xA = xRef.current!;
          const yA = yRef.current!;
          const vxA = vxRef.current!;
          const vyA = vyRef.current!;
          const rA = rRef.current!;
          const rTA = rTargetRef.current!;
          const hA = healthRef.current!;
          const imgA = imgIndexRef.current!;

          if (foundIndex !== lastIdx) {
            const movedId = idArrLocal[lastIdx];
            idArrLocal[foundIndex] = movedId;
            xA[foundIndex] = xA[lastIdx];
            yA[foundIndex] = yA[lastIdx];
            vxA[foundIndex] = vxA[lastIdx];
            vyA[foundIndex] = vyA[lastIdx];
            rA[foundIndex] = rA[lastIdx];
            rTA[foundIndex] = rTA[lastIdx];
            hA[foundIndex] = hA[lastIdx];
            imgA[foundIndex] = imgA[lastIdx];
            indexOfIdRef.current[movedId] = foundIndex;
          }

          delete indexOfIdRef.current[idToRemove];
          countRef.current = lastIdx;

          delete damageCooldownRef.current[idToRemove];
          delete dyingRef.current[idToRemove];
          deathsProcessed++;
        }

        // update radius targets for survivors (animate to new radius)
        // For boss arena, keep the multiplied size; for normal arena, scale based on count
        if (arenaType === ARENA_TYPES.BOSS || arenaType === ARENA_TYPES.BRAWL) {
          const sizeMultiplier = arenaType === ARENA_TYPES.BRAWL ? brawlBubbleSizeMultiplier : bossBubbleSizeMultiplier;
          const preservedRadius = baseBubbleRadiusRef.current * sizeMultiplier;
          for (let i = 0; i < countRef.current; i++) {
            rTargetRef.current![i] = preservedRadius;
          }
        } else {
          // Normal arena: scale size based on bubble count
          const newRadius = getRadiusForCount(countRef.current);
          for (let i = 0; i < countRef.current; i++) {
            rTargetRef.current![i] = newRadius;
          }
        }

        // winners check for normal
        if (arenaType === ARENA_TYPES.NORMAL) {
          if (countRef.current <= 1) {
            setIsRunning(false);
            gameEndedRef.current = true;
            if (countRef.current === 1) {
              const i = 0;
              const winnerBubbleData: BubbleData = {
                x: xRef.current![i],
                y: yRef.current![i],
                radius: rRef.current![i],
                health: healthRef.current![i],
                imgSrc: imgSrcsRef.current[imgIndexRef.current![i]] ?? "",
                vx: vxRef.current![i],
                vy: vyRef.current![i],
                id: idListRef.current![i],
              };
              setWinner(winnerBubbleData);
            } else if (countRef.current === 0) {
              // Everyone died - show draw screen
              console.log('Normal arena: Setting draw winner, countRef:', countRef.current);
              setWinner({
                x: 0,
                y: 0,
                radius: 50,
                health: 0,
                imgSrc: "draw", // Special marker for draw
                vx: 0,
                vy: 0,
                id: -1,
              });
              setWinnersImages([]); // Empty array triggers "no winner" display
            }
          }
        }

        // Brawl winner check
        if (arenaType === ARENA_TYPES.BRAWL) {
          if (brawlMode === "1v1") {
            // 1v1: Last bubble standing wins
            if (countRef.current <= 1) {
              setIsRunning(false);
              gameEndedRef.current = true;
              if (countRef.current === 1) {
                const i = 0;
                const winnerBubbleData: BubbleData = {
                  x: xRef.current![i],
                  y: yRef.current![i],
                  radius: rRef.current![i],
                  health: healthRef.current![i],
                  imgSrc: imgSrcsRef.current[imgIndexRef.current![i]] ?? "",
                  vx: vxRef.current![i],
                  vy: vyRef.current![i],
                  id: idListRef.current![i],
                };
                setWinner(winnerBubbleData);
              } else if (countRef.current === 0) {
                // Both died - show draw screen
                console.log('1v1 brawl: Setting draw winner, countRef:', countRef.current);
                setWinner({
                  x: 0,
                  y: 0,
                  radius: 50,
                  health: 0,
                  imgSrc: "draw", // Special marker for draw
                  vx: 0,
                  vy: 0,
                  id: -1,
                });
                setWinnersImages([]);
              }
            }
          } else if (brawlMode === "1vMany") {
            // 1vMany: Check team status
            // Solo wins if all "many" team are dead
            // Many team wins if solo bubble is dead
            const soloAlive = Array.from(brawlTeamsRef.current.entries()).some(([bubbleId, team]) => {
              if (team !== "solo") return false;
              // Check if this bubble is still in the game
              const idArr = idListRef.current!;
              for (let i = 0; i < countRef.current; i++) {
                if (idArr[i] === bubbleId && healthRef.current![i] > 0) return true;
              }
              return false;
            });
            
            const manyAlive = Array.from(brawlTeamsRef.current.entries()).some(([bubbleId, team]) => {
              if (team !== "many") return false;
              // Check if this bubble is still in the game
              const idArr = idListRef.current!;
              for (let i = 0; i < countRef.current; i++) {
                if (idArr[i] === bubbleId && healthRef.current![i] > 0) return true;
              }
              return false;
            });
            
            if (!soloAlive || !manyAlive) {
              setIsRunning(false);
              gameEndedRef.current = true;
              
              if (!soloAlive && !manyAlive) {
                // Both teams dead - draw
                console.log('1vMany brawl: Setting draw winner, soloAlive:', soloAlive, 'manyAlive:', manyAlive);
                setWinner({
                  x: 0,
                  y: 0,
                  radius: 50,
                  health: 0,
                  imgSrc: "draw",
                  vx: 0,
                  vy: 0,
                  id: -1,
                });
                setWinnersImages([]);
              } else if (!soloAlive && manyAlive) {
                // Many team wins - collect ALL many team members from game start for win credit
                const allManyTeamImages = brawl1vManyAllMembersRef.current;
                const allManyTeamPlayers = allManyTeamImages.map(imgSrc => normalizePlayer(imgSrc) || imgSrc);
                
                // Find a surviving many bubble as representative winner
                let winnerBubbleData: BubbleData | null = null;
                const idArr = idListRef.current!;
                for (let i = 0; i < countRef.current; i++) {
                  const bubbleId = idArr[i];
                  if (brawlTeamsRef.current.get(bubbleId) === "many" && healthRef.current![i] > 0) {
                    winnerBubbleData = {
                      x: xRef.current![i],
                      y: yRef.current![i],
                      radius: rRef.current![i],
                      health: healthRef.current![i],
                      imgSrc: "team", // Special marker for team win
                      vx: vxRef.current![i],
                      vy: vyRef.current![i],
                      id: bubbleId,
                    };
                    break;
                  }
                }
                
                if (winnerBubbleData) {
                  setWinner(winnerBubbleData);
                  setWinnersImages(allManyTeamImages);
                  // Store team members for server
                  (winnerBubbleData as any).teamMembers = allManyTeamPlayers;
                }
              } else if (soloAlive && !manyAlive) {
                // Solo wins
                const idArr = idListRef.current!;
                for (let i = 0; i < countRef.current; i++) {
                  const bubbleId = idArr[i];
                  if (brawlTeamsRef.current.get(bubbleId) === "solo" && healthRef.current![i] > 0) {
                    const winnerBubbleData: BubbleData = {
                      x: xRef.current![i],
                      y: yRef.current![i],
                      radius: rRef.current![i],
                      health: healthRef.current![i],
                      imgSrc: imgSrcsRef.current[imgIndexRef.current![i]] ?? "",
                      vx: vxRef.current![i],
                      vy: vyRef.current![i],
                      id: bubbleId,
                    };
                    setWinner(winnerBubbleData);
                    break;
                  }
                }
              }
            }
          }
        }

        // boss logic
        if (arenaType === ARENA_TYPES.BOSS) {
          // normal-normal collisions: separate & bounce, but DO NOT damage normals
          for (let i = 0; i < countRef.current; i++) {
            for (let j = i + 1; j < countRef.current; j++) {
              const A = { x: xArr[i], y: yArr[i], r: rArr[i] };
              const B = { x: xArr[j], y: yArr[j], r: rArr[j] };
              const minD2 = (A.r + B.r) * (A.r + B.r);
              if (dist2(A, B) < minD2) {
                const sep = separatePair(A.x, A.y, A.r, B.x, B.y, B.r);
                xArr[i] = sep.ax;
                yArr[i] = sep.ay;
                xArr[j] = sep.bx;
                yArr[j] = sep.by;
                const bounced = bouncePairVel(vxArr[i], vyArr[i], vxArr[j], vyArr[j], xArr[i], yArr[i], xArr[j], yArr[j]);
                vxArr[i] = bounced.avx;
                vyArr[i] = bounced.avy;
                vxArr[j] = bounced.bvx;
                vyArr[j] = bounced.bvy;
                // no health change here for normal-normal in boss mode
                
                // Add small random perturbation to prevent patterns
                const randI = (Math.random() - 0.5) * 0.1; // ±2.9 degrees
                const randJ = (Math.random() - 0.5) * 0.1;
                const angleI = Math.atan2(vyArr[i], vxArr[i]) + randI;
                const angleJ = Math.atan2(vyArr[j], vxArr[j]) + randJ;
                // Enforce consistent speed after collision
                const targetSpeed = speed * 0.6;
                vxArr[i] = Math.cos(angleI) * targetSpeed;
                vyArr[i] = Math.sin(angleI) * targetSpeed;
                vxArr[j] = Math.cos(angleJ) * targetSpeed;
                vyArr[j] = Math.sin(angleJ) * targetSpeed;
              }
            }
          }

          // superbubble movement + collisions
          if (superBubbleRef.current) {
            // move superbubble using the same max step multiplier so speed is consistent
            let sb = superBubbleRef.current;
            const sbStep = isTimeStopped() ? 0 : MAX_MOVE_STEP;
            let sbNewX = sb.x + sb.vx * sbStep;
            let sbNewY = sb.y + sb.vy * sbStep;
            
            // Use shape-aware boundary checking for superbubble
            const constrained = constrainToArenaBoundary(sbNewX, sbNewY, sb.radius, dims);
            
            if (constrained.vx !== 0 || constrained.vy !== 0) {
              playArenaSound("bounce");
              // Bounce occurred - apply constraint and reverse velocity
              sb.x = constrained.x;
              sb.y = constrained.y;
              sb.vx = constrained.vx * Math.abs(sb.vx);
              sb.vy = constrained.vy * Math.abs(sb.vy);
              
              const bounced = bounceWithDeviation(sb.vx, sb.vy, constrained.vx, constrained.vy, bounceDeviation);
              sb.vx = bounced.vx;
              sb.vy = bounced.vy;
              const targetSpeedS = speed * 0.8;
              const bouncedSpeed = Math.hypot(sb.vx, sb.vy);
              if (bouncedSpeed > 0.01) {
                const factor = targetSpeedS / bouncedSpeed;
                sb.vx *= factor;
                sb.vy *= factor;
              }
            } else {
              // No bounce, use unconstrained position
              sb.x = sbNewX;
              sb.y = sbNewY;
            }
            
            // Always enforce superbubble speed (even when not bouncing)
            const sbCurrentSpeed = Math.sqrt(sb.vx * sb.vx + sb.vy * sb.vy);
            const sbTargetSpeed = speed * 0.8;
            if (sbCurrentSpeed > 0.01) {
              const sbFactor = sbTargetSpeed / sbCurrentSpeed;
              sb.vx *= sbFactor;
              sb.vy *= sbFactor;
            }

            let hits = 0;
            for (let i = 0; i < countRef.current; i++) {
              const n = { x: xArr[i], y: yArr[i], r: rArr[i] };
              const minD2 = (n.r + sb.radius) * (n.r + sb.radius);
              if (dist2(n, sb) < minD2) {
                playArenaSound("collision");
                // symmetric separation (move both bodies out of overlap)
                const sep = separatePair(n.x, n.y, n.r, sb.x, sb.y, sb.radius);
                // apply both sides
                xArr[i] = sep.ax;
                yArr[i] = sep.ay;
                sb.x = sep.bx;
                sb.y = sep.by;

                // bounce velocities for both using helper
                const bounced = bouncePairVel(vxArr[i], vyArr[i], sb.vx, sb.vy, xArr[i], yArr[i], sb.x, sb.y);
                vxArr[i] = bounced.avx;
                vyArr[i] = bounced.avy;
                sb.vx = bounced.bvx;
                sb.vy = bounced.bvy;
                
                // Enforce consistent speeds after collision
                const targetSpeedN = speed * 0.6; // Normal bubble speed
                const targetSpeedS = speed * 0.8; // Superbubble speed (slightly faster)
                
                // Normalize normal bubble speed
                const newSpeedN = Math.sqrt(vxArr[i] * vxArr[i] + vyArr[i] * vyArr[i]);
                if (newSpeedN > 0.01) {
                  const factorN = targetSpeedN / newSpeedN;
                  vxArr[i] *= factorN;
                  vyArr[i] *= factorN;
                }
                
                // Normalize superbubble speed
                const newSpeedS = Math.sqrt(sb.vx * sb.vx + sb.vy * sb.vy);
                if (newSpeedS > 0.01) {
                  const factorS = targetSpeedS / newSpeedS;
                  sb.vx *= factorS;
                  sb.vy *= factorS;
                }

                // small outward push for visual separation (applies to normal)
                const dx = n.x - sb.x;
                const dy = n.y - sb.y;
                const d = dist(n.x, n.y, sb.x, sb.y);
                xArr[i] += (dx / d) * 2;
                yArr[i] += (dy / d) * 2;

                // per-normal cooldown to avoid multi-tick rapid damage
                const lastHit = sbCollisionCooldownRef.current[idArr[i]] ?? 0;
                if (nowMs - lastHit > SB_COLLISION_COOLDOWN_MS) {
                  // Check if normal bubble has blade enabled - if so, skip collision damage
                  // Blades are active if: 1) enabled with delay and auto-enabled, OR 2) immediate enable (time=0) and not expired (not -1)
                  const bladesActive = bladeEnabled && ((bladeAutoEnableTime === 0 && bladeEnabledAtRef.current !== -1) || bladeAutoEnabledRef.current);
                  const normalBubbleHasBlade = bladesActive && bladeAssignmentsRef.current.has(idArr[i]);
                  
                  // Apply configured collision damage to normal bubble ONLY if it doesn't have blade
                  if (!normalBubbleHasBlade) {
                    hArr[i] = Math.max(0, hArr[i] - bossCollisionDamage * globalDamageMultRef.current);
                  }
                  sbCollisionCooldownRef.current[idArr[i]] = nowMs;
                  try {
                    const rawAttacker = superBubbleRef.current?.imgSrc ?? "superbubble";
                    // prefix superbubble key with "superbubble-" to make it recognizable on server
                    const attacker = "superbubble-" + normalizePlayer(rawAttacker);
                    lastDamagerRef.current[idArr[i]] = attacker;
                    try { recordHit(attacker); } catch (e) {}
                  } catch (e) {}
                  hits++;
                }
              }
            }
            // Apply collision damage to superbubble (same damage value)
            if (hits > 0) {
              superBubbleRef.current.health = Math.max(0, superBubbleRef.current.health - (bossCollisionDamage * hits * globalDamageMultRef.current));
            }
          }

          // spikes damage normals only (handled above for normals)
          // projectiles movement + hit handled by projectiles effect below
          const aliveNormals = [];
          for (let i = 0; i < countRef.current; i++) {
            if (hArr[i] > 0) aliveNormals.push(i);
          }
          
          // Check for draw - both superbubble and all normals are dead
          if (superBubbleRef.current && superBubbleRef.current.health <= 0 && aliveNormals.length === 0) {
            setIsRunning(false);
            gameEndedRef.current = true;
            setUiBubblesSnapshot([]);
            setProjectiles([]);
            projectilesRef.current = [];
            setSuperBubbleSnapshot(null);
            // Draw - no winner
            console.log('Boss arena: Setting draw winner, superbubble dead and no normals alive');
            setWinner({
              x: 0,
              y: 0,
              radius: 50,
              health: 0,
              imgSrc: "draw",
              vx: 0,
              vy: 0,
              id: -1,
            });
            setWinnersList(null);
            setWinnersImages([]);
            superBubbleRef.current = null;
            return;
          }
          
          if (superBubbleRef.current && superBubbleRef.current.health <= 0) {
            setIsRunning(false);
            gameEndedRef.current = true;
            const snapNormals: BubbleData[] = [];
            for (const idx of aliveNormals) {
              snapNormals.push({
                x: xArr[idx],
                y: yArr[idx],
                radius: rArr[idx],
                health: hArr[idx],
                imgSrc: imgSrcsRef.current[imgIdxArr[idx]] ?? "",
                vx: vxArr[idx],
                vy: vyArr[idx],
                id: idArr[idx],
              });
            }
            setUiBubblesSnapshot(snapNormals);
            setEliminatedSide("boss");
            setSuperBubbleSnapshot((previous) => previous ? { ...previous, health: 0 } : null);
            setProjectiles((p) => p);
            // Team wins - record "team" as winner
            setWinner({
              x: 0,
              y: 0,
              radius: 0,
              health: 100,
              imgSrc: "team",
              vx: 0,
              vy: 0,
              id: 999999, // Valid ID to avoid draw detection
            });
            setWinnersList(snapNormals);
            // Show ALL normal player images from imgSrcsRef
            const allBossImgs = Array.from(new Set(imgSrcsRef.current.filter(src => src && src.length > 0)));
            setWinnersImages(allBossImgs.length > 0 ? allBossImgs : null);
            superBubbleRef.current = null;
            return;
          }
          if (aliveNormals.length === 0 && superBubbleRef.current) {
            // Superbubble wins - capture data before nulling the ref
            const sbSnapshot = {
              x: superBubbleRef.current.x,
              y: superBubbleRef.current.y,
              radius: superBubbleRef.current.radius,
              health: Math.round(superBubbleRef.current.health),
              imgSrc: superBubbleRef.current.imgSrc,
              vx: superBubbleRef.current.vx,
              vy: superBubbleRef.current.vy,
              id: superBubbleRef.current.id,
            };
            
            setIsRunning(false);
            gameEndedRef.current = true;
            setEliminatedSide("heroes");
            setUiBubblesSnapshot([]);
            setProjectiles([]);
            projectilesRef.current = [];
            setSuperBubbleSnapshot(sbSnapshot);
            setWinner(sbSnapshot);
            setWinnersList(null);
            setWinnersImages(sbSnapshot.imgSrc ? [sbSnapshot.imgSrc] : null);
            superBubbleRef.current = null;
            return;
          }
        } // end boss logic

        updateUiSnapshotFromArrays();
      } // end logic ticks

      // render pass
      processImageDecodeQueue();
      processMaskCreationQueue(8);

      // Reset state before drawing
      resetCtx(ctx);

      // draw bubbles
      const nRender = countRef.current;
      const rArrRender = rRef.current!;
      const xArrRender = xRef.current!;
      const yArrRender = yRef.current!;
      const hArrRender = healthRef.current!;
      const vxArrRender = vxRef.current!;
      const vyArrRender = vyRef.current!;
      const imgIdxArrRender = imgIndexRef.current!;
      const idArrRender = idListRef.current!;

      for (let i = 0; i < nRender; i++) {
        const radius = rArrRender[i];
        let x = xArrRender[i];
        let y = yArrRender[i];
        const hp = hArrRender[i];
        const imgIdx = imgIdxArrRender[i];
        let strokeColor = "#ff4d4d";
        if (hp > 60) strokeColor = "#2ecc71";
        else if (hp > 30) strokeColor = "#f1c40f";

        // clamp again to ensure no overflow drawing
        const dims = getArenaDimensions();
        x = clamp(x, radius, dims.width - radius);
        y = clamp(y, radius, dims.height - radius);

        const avatarIdx = avatarIndexRef.current?.[i] ?? -1;
        drawBubbleGlowAndTrail(ctx, x, y, radius, vxArrRender[i], vyArrRender[i], strokeColor);
        let drawnImage = false;
        if (avatarIdx >= 0) {
          drawAvatarOnCanvas(ctx, x, y, radius, avatarIdx);
          if (radius >= 8) {
            ctx.beginPath();
            ctx.arc(x, y, radius + 2, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * Math.min(1, hp / 100)));
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = healthBarWidth;
            ctx.stroke();
          }
          continue;
        }
        if (radius >= IMAGE_SHOW_RADIUS && imgIdx >= 0) {
          const src = imgSrcsRef.current[imgIdx];
          const bucket = pickBucketForRadius(radius);
          const key = maskedKey(src, bucket);
          const maskedBmp = maskedBitmapCacheRef.current.get(key);
          if (maskedBmp) {
            touchMaskedKey(key);
            ctx.drawImage(maskedBmp, x - radius, y - radius, radius * 2, radius * 2);
            drawnImage = true;
          } else {
            const bitmap = imageBitmapCache.current.get(src);
            const img = textureCache.current.get(src);
            if (bitmap || (img && img.complete)) {
              enqueueMaskedCreation(src, bucket);
              // clipped draw to avoid square flash
              try {
                ctx.save();
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.clip();
                if (bitmap) ctx.drawImage(bitmap, x - radius, y - radius, radius * 2, radius * 2);
                else if (img) ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
                ctx.restore();
                drawnImage = true;
              } catch (e) {
                try {
                  ctx.restore();
                } catch {}
              }
            } else {
              const shouldDecodeNow = radius >= IMAGE_SHOW_RADIUS || revealStartedRef.current === true;
              if (src && shouldDecodeNow) {
                queueImageDecode(src);
                preloadImage(src).catch(() => {});
              }
            }
          }
        }

        if (drawnImage) {
          if (radius >= 8) {
            ctx.beginPath();
            ctx.arc(x, y, radius + 2, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * Math.min(1, hp / 100)));
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = healthBarWidth;
            ctx.stroke();
          }
          
          // Draw team arrow for brawl 1vMany mode
          if (arenaType === ARENA_TYPES.BRAWL && brawlMode === "1vMany") {
            const team = brawlTeamsRef.current.get(idArrRender[i]);
            if (team) {
              const arrowSize = radius * 0.35;
              const arrowY = y - radius - arrowSize - 5;
              ctx.fillStyle = team === "solo" ? "#4caf50" : "#f44336";
              ctx.beginPath();
              ctx.moveTo(x, arrowY + arrowSize); // bottom point
              ctx.lineTo(x - arrowSize * 0.6, arrowY); // top left
              ctx.lineTo(x + arrowSize * 0.6, arrowY); // top right
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = "#000";
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          }
          
          continue;
        }

        // fallback circle
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, radius), 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = 0.95;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, radius) + 2, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * Math.min(1, hp / 100)));
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = healthBarWidth * 0.5;
        ctx.stroke();
        
        // Draw team arrow for brawl 1vMany mode
        if (arenaType === ARENA_TYPES.BRAWL && brawlMode === "1vMany") {
          const team = brawlTeamsRef.current.get(idArrRender[i]);
          if (team) {
            const arrowSize = radius * 0.35;
            const arrowY = y - radius - arrowSize - 5;
            ctx.fillStyle = team === "solo" ? "#4caf50" : "#f44336";
            ctx.beginPath();
            ctx.moveTo(x, arrowY + arrowSize); // bottom point
            ctx.lineTo(x - arrowSize * 0.6, arrowY); // top left
            ctx.lineTo(x + arrowSize * 0.6, arrowY); // top right
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }

      // Draw blades on canvas for perfect sync (after all bubbles are drawn)
      // Blades are active if: 1) enabled with delay and auto-enabled, OR 2) immediate enable (time=0) and not expired (not -1)
      const bladesActive = bladeEnabled && ((bladeAutoEnableTime === 0 && bladeEnabledAtRef.current !== -1) || bladeAutoEnabledRef.current);
      if (bladesActive && bladeAssignmentsRef.current.size > 0) {
        const rTargetArrRender = rTargetRef.current!;
        for (let i = 0; i < nRender; i++) {
          const bubbleId = idArrRender[i];
          if (bladeAssignmentsRef.current.has(bubbleId)) {
            const x = xArrRender[i];
            const y = yArrRender[i];
            const targetRadius = rTargetArrRender[i]; // Use target radius for consistent size
            drawBladeOnCanvas(ctx, x, y, targetRadius, bladeRotationRef.current * Math.PI / 180, false);
          }
        }
      }

      // superbubble draw (if present) - show both during game and preview
      const sbToRender = superBubbleRef.current || (arenaReady && superBubbleSnapshot);
      if (sbToRender) {
        const sb = sbToRender;
        let drawn = false;
        if (sb.avatar != null) {
          drawAvatarOnCanvas(ctx, sb.x, sb.y, sb.radius, sb.avatar);
          drawn = true;
        }
        if (!drawn && sb.radius >= IMAGE_SHOW_RADIUS && sb.imgSrc) {
          const src = sb.imgSrc;
          const bucket = pickBucketForRadius(sb.radius);
          const key = maskedKey(src, bucket);
          const maskedBmp = maskedBitmapCacheRef.current.get(key);
          if (maskedBmp) {
            ctx.drawImage(maskedBmp, sb.x - sb.radius, sb.y - sb.radius, sb.radius * 2, sb.radius * 2);
            drawn = true;
          } else {
            const bitmap = imageBitmapCache.current.get(src);
            const img = textureCache.current.get(src);
            if (bitmap || (img && img.complete)) {
              enqueueMaskedCreation(src, bucket);
              try {
                ctx.save();
                ctx.beginPath();
                ctx.arc(sb.x, sb.y, sb.radius, 0, Math.PI * 2);
                ctx.clip();
                if (bitmap) ctx.drawImage(bitmap, sb.x - sb.radius, sb.y - sb.radius, sb.radius * 2, sb.radius * 2);
                else if (img) ctx.drawImage(img, sb.x - sb.radius, sb.y - sb.radius, sb.radius * 2, sb.radius * 2);
                ctx.restore();
                drawn = true;
              } catch (e) {
                try {
                  ctx.restore();
                } catch {}
              }
            } else {
              if (sb.imgSrc) preloadImage(sb.imgSrc).catch(() => {});
            }
          }
        }

        if (!drawn) {
          ctx.beginPath();
          ctx.arc(sb.x, sb.y, sb.radius, 0, Math.PI * 2);
          ctx.fillStyle = "#fff";
          ctx.fill();
        }

        // superbubble health bar above (only show during game)
        if (isRunning) {
          ctx.fillStyle = "#444";
          ctx.fillRect(sb.x - sb.radius, sb.y - sb.radius - 18, sb.radius * 2, 8);
          ctx.fillStyle = "#e74c3c";
          const pct = Math.max(0, Math.min(1, sb.health / bossSuperbubbleHealth));
          ctx.fillRect(sb.x - sb.radius, sb.y - sb.radius - 18, sb.radius * 2 * pct, 8);
        }
        
        // Draw superbubble blade on canvas (if assigned)
        // Blades are active if: 1) enabled with delay and auto-enabled, OR 2) immediate enable (time=0) and not expired (not -1)
        const sbBladesActive = bladeEnabled && ((bladeAutoEnableTime === 0 && bladeEnabledAtRef.current !== -1) || bladeAutoEnabledRef.current);
        if (sbBladesActive && bladeAssignmentsRef.current.has(sb.id)) {
          drawBladeOnCanvas(ctx, sb.x, sb.y, sb.radius, bladeRotationRef.current * Math.PI / 180, true);
        }
      }

      // Draw special-power overlays: shield domes, web tethers, time-stop tint.
      drawPowerFx(ctx);
    }; // end loop

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(graceTimeout);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arenaType, isRunning, spikeEnabled, spikeCount, spikeSize, speedMultiplier]);

  // ---------- projectiles handling ----------

  useEffect(() => {
    if (!isRunning || (arenaType !== ARENA_TYPES.NORMAL && arenaType !== ARENA_TYPES.BOSS && arenaType !== ARENA_TYPES.BRAWL)) return;
    const interval = window.setInterval(() => {
      const arena = getArenaDimensions();
      const nextProjectiles: Projectile[] = [];
      const projSnapshot = projectilesRef.current.slice();
      const n = countRef.current;
      const idArr = idListRef.current!;
      const imgIdxArr = imgIndexRef.current!;
      const xArr = xRef.current!;
      const yArr = yRef.current!;
      const rArr = rRef.current!;
      const hArr = healthRef.current!;
      
      const projectilesToKeep: boolean[] = new Array(projSnapshot.length).fill(true);
      
      // Check projectile-projectile collisions first.
      if (playerPowersEnabled || (arenaType === ARENA_TYPES.BRAWL && brawlPowersEnabled)) {
        for (let i = 0; i < projSnapshot.length; i++) {
          if (!projectilesToKeep[i]) continue;
          const p1 = projSnapshot[i];
          
          for (let j = i + 1; j < projSnapshot.length; j++) {
            if (!projectilesToKeep[j]) continue;
            const p2 = projSnapshot[j];
            
            // Determine if projectiles should collide and neutralize based on teams
            let shouldCollide = false;
            
            const brawlPowersActive = brawlPowersEnabledRef.current && (brawlPowersAutoEnableTime === 0 || brawlPowersAutoEnabledRef.current);
            if (arenaType === ARENA_TYPES.BRAWL && brawlPowersActive) {
              // In brawl mode, check teams
              if (brawlMode === "1v1") {
                // In 1v1, everyone is enemies, so all projectiles neutralize
                shouldCollide = true;
              } else if (brawlMode === "1vMany") {
                // In 1vMany, only neutralize if from different teams
                const p1Team = p1.fromBubbleId !== undefined ? brawlTeamsRef.current.get(p1.fromBubbleId) : undefined;
                const p2Team = p2.fromBubbleId !== undefined ? brawlTeamsRef.current.get(p2.fromBubbleId) : undefined;
                // Only neutralize if both have teams and teams are different
                if (p1Team !== undefined && p2Team !== undefined && p1Team !== p2Team) {
                  shouldCollide = true;
                }
              }
            } else if (playerPowersEnabledRef.current && (playerPowersAutoEnableTime === 0 || playerPowersAutoEnabledRef.current) && arenaType === ARENA_TYPES.BOSS) {
              // In boss mode, only super vs normal projectiles collide
              const p1FromSuper = p1.fromSuperbubble === true;
              const p2FromSuper = p2.fromSuperbubble === true;
              const p1FromNormal = p1.fromBubbleId !== undefined && !p1.fromSuperbubble;
              const p2FromNormal = p2.fromBubbleId !== undefined && !p2.fromSuperbubble;
              // Neutralize if one is from super and one is from normal
              shouldCollide = (p1FromSuper && p2FromNormal) || (p1FromNormal && p2FromSuper);
            }
            
            if (shouldCollide) {
              // Check collision
              const dx = p1.x - p2.x;
              const dy = p1.y - p2.y;
              const distSq = dx * dx + dy * dy;
              const collisionDist = 15; // Projectile collision radius
              
              if (distSq < collisionDist * collisionDist) {
                // Both projectiles vanish
                projectilesToKeep[i] = false;
                projectilesToKeep[j] = false;
                break;
              }
            }
          }
        }
      }
      
      const nowMs = Date.now();
      for (let idx = 0; idx < projSnapshot.length; idx++) {
        if (!projectilesToKeep[idx]) continue;
        
        const p = projSnapshot[idx];
        
        // Remove projectiles older than 10 seconds (safety check for stuck projectiles)
        if (p.createdAt && nowMs - p.createdAt > 10000) {
          projectilesToKeep[idx] = false;
          continue;
        }

        // Time Stop freezes projectiles in place (no advance, no collision).
        if (nowMs < timeStopUntilRef.current) {
          nextProjectiles.push({ ...p });
          continue;
        }

        const nx = p.x + p.vx;
        const ny = p.y + p.vy;
        
        // Vanish projectiles that touch or reach arena boundaries
        if (nx <= 0 || ny <= 0 || nx >= arena.width || ny >= arena.height) {
          projectilesToKeep[idx] = false;
          continue;
        }
        
        let hit = false;
        
        // Brawl Arena: Projectile damages any bubble except the shooter
        if (arenaType === ARENA_TYPES.BRAWL && brawlPowersEnabledRef.current && p.fromBubbleId !== undefined) {
          for (let i = 0; i < n; i++) {
            // Don't hit the shooter itself
            if (idArr[i] === p.fromBubbleId) continue;
            
            // In 1vMany mode, don't damage same-team bubbles
            if (brawlMode === "1vMany") {
              const shooterTeam = brawlTeamsRef.current.get(p.fromBubbleId);
              const targetTeam = brawlTeamsRef.current.get(idArr[i]);
              if (shooterTeam === targetTeam) continue; // Skip same team
            }
            
            const dx = xArr[i] - nx;
            const dy = yArr[i] - ny;
            if (dx * dx + dy * dy < rArr[i] * rArr[i]) {
              // Sand Shield absorbs the projectile without taking damage.
              if (hasActiveShield(idArr[i])) { hit = true; break; }
              // Use brawl arena power damage for this power type
              const damage = (brawlPowerDamages[p.type] || 5) * globalDamageMultRef.current;
              hArr[i] = Math.max(0, hArr[i] - damage);
              playArenaSound("powerHit", String(p.type));
              
              // Track last damager
              try {
                const shooterIdx = idArr.indexOf(p.fromBubbleId);
                if (shooterIdx >= 0) {
                  const rawAttacker = imgSrcsRef.current[imgIdxArr[shooterIdx]] ?? "brawler";
                  const attacker = normalizePlayer(rawAttacker);
                  lastDamagerRef.current[idArr[i]] = attacker;
                  try { recordHit(attacker); } catch (e) {}
                }
              } catch (e) {}
              
              hit = true;
              const hitId = Date.now() + Math.floor(Math.random() * 10000);
              setHitEffects((h) => [...h, { id: hitId, x: xArr[i], y: yArr[i], createdAt: Date.now() }]);
              setTimeout(() => {
                setHitEffects((h) => h.filter((he) => he.id !== hitId));
              }, 300);
              break;
            }
          }
        }
        // Projectile from normal bubble (only damages superbubble)
        else if (p.fromBubbleId !== undefined && (playerPowersEnabled || normalPowersEnabled || normalPowersEnabledRef.current || bubblePowersRef.current.size > 0)) {
          if (arenaType === ARENA_TYPES.NORMAL) {
            for (let i = 0; i < n; i++) {
              if (idArr[i] === p.fromBubbleId) continue;
              const dx = xArr[i] - nx;
              const dy = yArr[i] - ny;
              if (dx * dx + dy * dy < rArr[i] * rArr[i]) {
                if (hasActiveShield(idArr[i])) { hit = true; break; }
                hArr[i] = Math.max(0, hArr[i] - (normalPowerDamages[p.type] || 5) * globalDamageMultRef.current);
                playArenaSound("powerHit", String(p.type));
                hit = true;
                break;
              }
            }
          } else {
          const sb = superBubbleRef.current;
          if (sb) {
            const dx = sb.x - nx;
            const dy = sb.y - ny;
            if (dx * dx + dy * dy < sb.radius * sb.radius) {
              // Use boss arena normal bubble power damage for this power type
              const damage = (bossNormalPowerDamages[p.type] || 5) * globalDamageMultRef.current;
              sb.health = Math.max(0, sb.health - damage);
              playArenaSound("powerHit", String(p.type));
              superBubbleRef.current = { ...sb };
              updateUiSnapshotFromArrays();
              hit = true;
              
              const hitId = Date.now() + Math.floor(Math.random() * 10000);
              setHitEffects((h) => [...h, { id: hitId, x: sb.x, y: sb.y, createdAt: Date.now() }]);
              setTimeout(() => {
                setHitEffects((h) => h.filter((he) => he.id !== hitId));
              }, 300);
            }
          }
          }
        }
        // Projectile from superbubble (damages normal bubbles)
        else if (p.fromSuperbubble === true || p.fromBubbleId === undefined) {
          for (let i = 0; i < n; i++) {
            const dx = xArr[i] - nx;
            const dy = yArr[i] - ny;
            if (dx * dx + dy * dy < rArr[i] * rArr[i]) {
              // Sand Shield absorbs the superbubble projectile.
              if (hasActiveShield(idArr[i])) { hit = true; break; }
              // Use boss arena superbubble power damage for this power type
              const damage = (bossSuperPowerDamages[p.type] || 5) * globalDamageMultRef.current;
              hArr[i] = Math.max(0, hArr[i] - damage);
              playArenaSound("powerHit", String(p.type));
              try {
                const rawAttacker = superBubbleRef.current?.imgSrc ?? "superbubble";
                const attacker = normalizePlayer(rawAttacker);
                lastDamagerRef.current[idArr[i]] = attacker;
                try { recordHit(attacker); } catch (e) {}
              } catch (e) {}
              hit = true;
              const hitId = Date.now() + Math.floor(Math.random() * 10000);
              setHitEffects((h) => [...h, { id: hitId, x: xArr[i], y: yArr[i], createdAt: Date.now() }]);
              setTimeout(() => {
                setHitEffects((h) => h.filter((he) => he.id !== hitId));
              }, 300);
              break;
            }
          }
        }
        
        if (!hit) {
          nextProjectiles.push({ ...p, x: nx, y: ny });
        }
      }
      projectilesRef.current = nextProjectiles;
      setProjectiles([...nextProjectiles]);
      updateUiSnapshotFromArrays();
    }, 80); // Increased from 50ms to 80ms to reduce update frequency and improve frame rate

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, arenaType]);

  // Flush buffered stats shortly after a match ends so server receives final tallies
  useEffect(() => {
    if (isRunning) return;
    const t = window.setTimeout(() => {
      try {
        if (statsClient && typeof (statsClient as any).flush === "function") {
          void (statsClient as any).flush();
        }
      } catch (e) {}
    }, 250);
    return () => clearTimeout(t);
  }, [isRunning]);
  // also clear current game when match ends (in case there was no winner effect)
  useEffect(() => {
    if (isRunning) return;
    // if there is a winner pending, don't clear here — winner effect will flush and clear
    if (winner) return;
    (async () => {
      try {
        // Flush any remaining stats with game/arena context before clearing
        if (statsClient && typeof (statsClient as any).flush === 'function') {
          try { await (statsClient as any).flush(); } catch (e) {}
        }
        // Give flush time to complete before clearing context
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {}
      try {
        if (statsClient && typeof (statsClient as any).setGame === "function") {
          (statsClient as any).setGame(null, null, null);
        }
      } catch (e) {}
      currentGameRef.current = null;
    })();
  }, [isRunning, winner]);

  // When a winner is set, post the winner for the current game and clear the game id
  useEffect(() => {
    if (!winner) return;
    const gid = currentGameRef.current;
    if (!gid) return;
    (async () => {
      try {
        // Flush all pending stats with game/arena context FIRST
        try { if (statsClient && typeof (statsClient as any).flush === 'function') await (statsClient as any).flush(); } catch (e) {}
        // Wait a bit for flush to complete
        await new Promise(r => setTimeout(r, 100));
        
        // Use imgSrc directly for team/superbubble, or normalize player name
        let player = winner.imgSrc;
        
        // Check for draw condition FIRST (before checking id)
        if (player === "draw" || player === "") {
          player = "draw";
        }
        // Check if this is a team win (boss arena)
        else if (player === "team") {
          player = "team";
        }
        // Check if this is a superbubble winner by path
        else {
          const lowerImgSrc = (player || '').toLowerCase();
          if (lowerImgSrc.includes('superbubble') || lowerImgSrc.includes('superbubbleimg') || lowerImgSrc.includes('superimgstorage')) {
            player = "superbubble";
          } else if (player !== "superbubble") {
            const normalizedPlayer = normalizePlayer(player);
            // Only use normalized name if it's valid, otherwise mark as draw
            player = normalizedPlayer && normalizedPlayer.length > 0 ? normalizedPlayer : "draw";
          }
        }
        const winnerBody: any = { game: gid, player, arena: arenaType || ARENA_TYPES.NORMAL };
        if (arenaType === ARENA_TYPES.BRAWL) winnerBody.brawlMode = brawlMode;
        if (testMode) winnerBody.testMode = testMode;
        // Include team members if team won
        if (player === "team" && (winner as any).teamMembers) {
          winnerBody.teamMembers = (winner as any).teamMembers;
        }
        await fetch('http://localhost:5000/api/stats/winner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(winnerBody),
        });
      } catch (e) {
        console.warn('Failed to post winner', e);
      } finally {
        // NOW clear the game context after all stats have been sent
        try { statsClient && typeof (statsClient as any).setGame === 'function' && (statsClient as any).setGame(null, null, null); } catch (e) {}
        currentGameRef.current = null;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner]);

  // ---------- setters utilities ----------

  const setBubblesFromArraysToUi = (arr: BubbleData[]) => {
    imgSrcsRef.current = [];
    textureCache.current.clear();
    countRef.current = 0;
    ensureCapacity(arr.length + 8);
    const idArr = idListRef.current!;
    const xArr = xRef.current!;
    const yArr = yRef.current!;
    const vxArr = vxRef.current!;
    const vyArr = vyRef.current!;
    const rArr = rRef.current!;
    const rTArr = rTargetRef.current!;
    const hArr = healthRef.current!;
    const imgIdxArr = imgIndexRef.current!;
    for (let i = 0; i < arr.length; i++) {
      const b = arr[i];
      idArr[i] = b.id;
      indexOfIdRef.current[b.id] = i;
      xArr[i] = b.x;
      yArr[i] = b.y;
      vxArr[i] = b.vx;
      vyArr[i] = b.vy;
      // start small; animate to target
      rTArr[i] = b.radius;
      rArr[i] = INITIAL_RADIUS;
      hArr[i] = b.health;
      imgIdxArr[i] = b.imgSrc ? getImgIndex(b.imgSrc) : -1;
      if (b.imgSrc) preloadImage(b.imgSrc).catch(() => {});
    }
    countRef.current = arr.length;
    updateUiSnapshotFromArrays(true);
    startRevealPipelineIfNeeded();
  };

  // ---------- UI original behaviours ----------

  const resetArenaKeepType = () => {
    setIsRunning(false);
    gameEndedRef.current = false;
    setEliminatedSide(null);
    setWinner(null);
    setWinnersList(null);
    setWinnersImages(null);
    countRef.current = 0;
    idListRef.current = null;
    xRef.current = null;
    yRef.current = null;
    vxRef.current = null;
    vyRef.current = null;
    rRef.current = null;
    rTargetRef.current = null;
    healthRef.current = null;
    imgIndexRef.current = null;
    imgSrcsRef.current = [];
    textureCache.current.clear();
    imageBitmapCache.current.clear();
    imagesToDecodeRef.current.clear();
    imagesDecodingRef.current.clear();
    damageCooldownRef.current = {};
    sbCollisionCooldownRef.current = {}; // clear sb cooldowns
    dyingRef.current = {};
    deathQueueRef.current = [];
    deathQueueSetRef.current.clear();
    indexOfIdRef.current = {};
    setUiBubblesSnapshot([]);
    setSuperBubbleSnapshot(null);
    superBubbleRef.current = null;
    setProjectiles([]);
    projectilesRef.current = [];
    setMuzzleFlashes([]);
    setHitEffects([]);
    setBladeSparkEffects([]);
    setActiveCount(0);
    // Clear special-power effects so they never leak across games.
    shieldsRef.current.clear();
    webbedRef.current.clear();
    timeStopUntilRef.current = 0;
    manualShootRequestRef.current = false;

    maskedBitmapCacheRef.current.forEach((bmp) => {
      try {
        (bmp as any).close && (bmp as any).close();
      } catch (e) {}
    });
    maskedBitmapCacheRef.current.clear();
    maskedLruRef.current = [];
    maskedPixelBytesRef.current = 0;
    maskedCreateQueueRef.current = [];
    maskedCreatingSetRef.current.clear();
    revealStartedRef.current = false;

    // re-initialize typed arrays immediately so UI code doesn't crash
    const cap = MAX_CAPACITY.current;
    idListRef.current = new Int32Array(cap);
    xRef.current = new Float32Array(cap);
    yRef.current = new Float32Array(cap);
    vxRef.current = new Float32Array(cap);
    vyRef.current = new Float32Array(cap);
    rRef.current = new Float32Array(cap);
    rTargetRef.current = new Float32Array(cap);
    healthRef.current = new Float32Array(cap);
    imgIndexRef.current = new Int32Array(cap);
    avatarIndexRef.current = new Int32Array(cap);
    for (let i = 0; i < cap; i++) {
      imgIndexRef.current[i] = -1;
      avatarIndexRef.current[i] = -1;
      rRef.current[i] = INITIAL_RADIUS;
      rTargetRef.current[i] = INITIAL_RADIUS;
    }
  };

  const resetArenaKeepTypePublic = () => {
    resetArenaKeepType();
    setTimeout(() => {
      setWinner(null);
      setIsRunning(false);
      setWinnersList(null);
      setWinnersImages(null);
      setProjectiles([]);
      projectilesRef.current = [];
      setPowerPickups([]);
      powerPickupsRef.current = [];
      setBubblePowers(new Map());
      bubblePowersRef.current = new Map();
      preAssignedAppliedRef.current = false;
      lastPickupSpawnRef.current = 0;
      // Clear arena pickups + all per-bubble statuses (spec section 13 cleanup).
      setArenaPickups([]);
      arenaPickupsRef.current = [];
      lastArenaPickupSpawnRef.current = 0;
      bubbleStatusesRef.current = new Map();
      arenaShieldRef.current = new Map();
      secondChanceRef.current = new Set();
      impactBoostRef.current = new Set();
      lockedUntilRef.current = new Map();
      setPickupFx([]);
      pickupFxRef.current = [];
      // Clear blockades, zones and events (spec section 13 cleanup).
      setArenaBlockades([]);
      arenaBlockadesRef.current = [];
      blockadeBuiltForRef.current = "";
      blockadeHitCooldownRef.current.clear();
      teleportCooldownRef.current.clear();
      setArenaZones([]);
      arenaZonesRef.current = [];
      lastZoneSpawnRef.current = 0;
      zoneTickRef.current.clear();
      fadedBubblesRef.current.clear();
      setActiveEvent(null);
      activeEventRef.current = null;
      lastEventAtRef.current = 0;
      eventTickRef.current = 0;
      clearEventGlobals();
      // Reset blade assignments
      setBladeAssignments(new Set());
      bladeRotationRef.current = 0;
      bladeAutoEnabledRef.current = false;
    }, 0);
  };

  const handleBack = () => {
    resetArenaKeepType();
    setArenaType(null);
    setArenaTypeSelected(false);
    setArenaReady(false);
  };

  // ---------- Superpower helpers ----------

  // SELF / ARENA / TARGET powers that must NOT behave like a travelling projectile.
  const SPECIAL_POWER_KEYS = new Set<string>(["sand_shield", "time_stop_burst", "web_shot"]);
  const isSpecialPower = (k: string | number) => SPECIAL_POWER_KEYS.has(String(k));

  // Apply a special power's effect. Returns true when handled so the caller
  // skips normal projectile spawning for that shot.
  const applySpecialPower = (
    powerKey: keyof typeof SUPER_BUBBLE_TYPES,
    shooterId: number,
    shooterIdx: number
  ): boolean => {
    const now = Date.now();
    if (powerKey === "sand_shield") {
      // SELF SHIELD: absorbs incoming damage for a few seconds.
      shieldsRef.current.set(shooterId, { expiresAt: now + 3500 });
      return true;
    }
    if (powerKey === "time_stop_burst") {
      // ARENA: freeze all movement briefly (rendering continues).
      timeStopUntilRef.current = now + 1500;
      return true;
    }
    if (powerKey === "web_shot") {
      // TARGET tether: slow the nearest enemy and draw a web line to it.
      const xArr = xRef.current, yArr = yRef.current, hArr = healthRef.current, idArr = idListRef.current;
      const n = countRef.current;
      if (!xArr || !yArr || !hArr || !idArr) return true;
      const shooterTeam = brawlTeamsRef.current.get(shooterId);
      let best = -1, bestD = Infinity;
      for (let j = 0; j < n; j++) {
        if (idArr[j] === shooterId || hArr[j] <= 0) continue;
        if (arenaType === ARENA_TYPES.BRAWL && brawlMode === "1vMany" && shooterTeam !== undefined) {
          if (brawlTeamsRef.current.get(idArr[j]) === shooterTeam) continue;
        }
        const dx = xArr[j] - xArr[shooterIdx], dy = yArr[j] - yArr[shooterIdx];
        const d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = j; }
      }
      if (best >= 0) {
        webbedRef.current.set(idArr[best], { until: now + 2500, factor: 0.35, fromX: xArr[shooterIdx], fromY: yArr[shooterIdx] });
      }
      return true;
    }
    return false;
  };

  // Returns true while a bubble's movement should be frozen by Time Stop.
  const isTimeStopped = () => Date.now() < timeStopUntilRef.current;
  // Movement step multiplier for a bubble id (Web Shot slow); prunes expired webs.
  const webStepFactor = (bubbleId: number): number => {
    const w = webbedRef.current.get(bubbleId);
    if (!w) return 1;
    if (Date.now() >= w.until) { webbedRef.current.delete(bubbleId); return 1; }
    return w.factor;
  };
  // True if the bubble currently has an active damage-absorbing shield.
  const hasActiveShield = (bubbleId: number): boolean => {
    const s = shieldsRef.current.get(bubbleId);
    if (!s) return false;
    if (Date.now() >= s.expiresAt) { shieldsRef.current.delete(bubbleId); return false; }
    return true;
  };

  // Draw shield domes, web tethers and the time-stop tint on top of bubbles.
  const drawPowerFx = (ctx: CanvasRenderingContext2D) => {
    const now = Date.now();
    const xArr = xRef.current, yArr = yRef.current, rArr = rRef.current, hArr = healthRef.current, idArr = idListRef.current;
    if (!xArr || !yArr || !rArr || !idArr) return;
    // Sand Shield domes.
    for (const [id, s] of shieldsRef.current) {
      if (now >= s.expiresAt) { shieldsRef.current.delete(id); continue; }
      const i = idArr.indexOf(id);
      if (i < 0 || (hArr && hArr[i] <= 0)) continue;
      const r = rArr[i] + 9;
      const pulse = 0.5 + 0.5 * Math.sin(now / 110);
      ctx.save();
      ctx.strokeStyle = `rgba(224,190,110,${0.55 + 0.35 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(xArr[i], yArr[i], r, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = `rgba(255,226,150,${0.22 * pulse})`;
      ctx.lineWidth = 9;
      ctx.beginPath(); ctx.arc(xArr[i], yArr[i], r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    // Web Shot tethers.
    for (const [id, w] of webbedRef.current) {
      if (now >= w.until) { webbedRef.current.delete(id); continue; }
      const i = idArr.indexOf(id);
      if (i < 0) continue;
      ctx.save();
      ctx.strokeStyle = "rgba(232,236,255,0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(w.fromX, w.fromY); ctx.lineTo(xArr[i], yArr[i]); ctx.stroke();
      ctx.setLineDash([]);
      const wr = rArr[i] * 0.7;
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath(); ctx.arc(xArr[i], yArr[i], wr, 0, Math.PI * 2); ctx.stroke();
      for (let a = 0; a < 6; a++) {
        const ang = (a / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(xArr[i], yArr[i]);
        ctx.lineTo(xArr[i] + Math.cos(ang) * wr, yArr[i] + Math.sin(ang) * wr);
        ctx.stroke();
      }
      ctx.restore();
    }
    // Time Stop tint.
    if (now < timeStopUntilRef.current) {
      ctx.save();
      ctx.fillStyle = "rgba(90,150,255,0.10)";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
  };

  const pickRandomSelectedPower = (): keyof typeof SUPER_BUBBLE_TYPES => {
    const keys = AVAILABLE_POWER_KEYS;
    const available = keys.filter((k) => selectedPowers[k]);
    if (available.length === 0) return "missile";
    return available[Math.floor(Math.random() * available.length)];
  };

  const pickRandomPlayerPower = (): keyof typeof SUPER_BUBBLE_TYPES => {
    const keys = AVAILABLE_POWER_KEYS;
    const available = keys.filter((k) => selectedPlayerPowers[k]);
    if (available.length === 0) return "missile";
    return available[Math.floor(Math.random() * available.length)];
  };

  const pickRandomBrawlPower = (): keyof typeof SUPER_BUBBLE_TYPES => {
    const keys = AVAILABLE_POWER_KEYS;
    const available = keys.filter((k) => selectedBrawlPowers[k]);
    if (available.length === 0) return "missile";
    return available[Math.floor(Math.random() * available.length)];
  };

  const COMPASS = [
    { name: "E", vx: 1, vy: 0 },
    { name: "W", vx: -1, vy: 0 },
    { name: "N", vx: 0, vy: -1 },
    { name: "S", vx: 0, vy: 1 },
    { name: "NE", vx: 0.70710678, vy: -0.70710678 },
    { name: "NW", vx: -0.70710678, vy: -0.70710678 },
    { name: "SE", vx: 0.70710678, vy: 0.70710678 },
    { name: "SW", vx: -0.70710678, vy: 0.70710678 },
  ];

  const pickRandomDirection = () => COMPASS[Math.floor(Math.random() * COMPASS.length)];

  const handleShoot = () => {
    if (!superBubbleRef.current || arenaType !== ARENA_TYPES.BOSS || !isRunning || !superpowerEnabled) return;
    
    // Check if superpowers are active (either no timer or timer has expired)
    const powersActive = superpowerAutoEnableTime === 0 || superpowerAutoEnabledRef.current;
    // Check if not expired by duration
    const notExpired = superpowerEnabledAtRef.current !== -1;
    
    if (!powersActive || !notExpired) return;
    
    const sb = superBubbleRef.current;
    
    // Get power for this shot (same for all if "same" mode, or pick per projectile if "random")
    const basePowerKey = superbubblePowerMode === "same" ? pickRandomSelectedPower() : null;
    
    const xArr = xRef.current;
    const yArr = yRef.current;
    const hArr = healthRef.current;
    const n = countRef.current;
    
    // Build list of alive bubbles once
    const aliveBubbles: number[] = [];
    if (xArr && yArr && hArr && n > 0) {
      for (let j = 0; j < n; j++) {
        if (hArr[j] > 0) {
          aliveBubbles.push(j);
        }
      }
    }
    
    // Shoot multiple projectiles if configured
    for (let i = 0; i < superbubbleProjectileCount; i++) {
      let dir: { vx: number; vy: number };
      
      // Find alive normal bubbles to aim at
      if (aliveBubbles.length > 0 && xArr && yArr) {
        // Pick a random alive bubble to aim at
        const targetIdx = aliveBubbles[Math.floor(Math.random() * aliveBubbles.length)];
        const dx = xArr[targetIdx] - sb.x;
        const dy = yArr[targetIdx] - sb.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          // Aim at the target bubble
          dir = { vx: dx / dist, vy: dy / dist };
        } else {
          dir = pickRandomDirection();
        }
      } else {
        dir = pickRandomDirection();
      }
      
      // Add angle deviation for multiple projectiles to spread them out (3-5% deviation)
      if (superbubbleProjectileCount > 1) {
        const baseAngle = Math.atan2(dir.vy, dir.vx);
        // Spread projectiles evenly across a 0.1 radian arc (about 5.7 degrees)
        const spreadArc = 0.1; // ~5.7 degrees total spread
        const angleOffset = (i - (superbubbleProjectileCount - 1) / 2) * (spreadArc / Math.max(1, superbubbleProjectileCount - 1));
        const newAngle = baseAngle + angleOffset;
        dir = { vx: Math.cos(newAngle), vy: Math.sin(newAngle) };
      }
      
      // Get power type (same for all or random per projectile)
      const powerKey = basePowerKey || pickRandomSelectedPower();
      
      const vx = dir.vx * projectileSpeedPerTick;
      const vy = dir.vy * projectileSpeedPerTick;
      nextProjectileId++;
      const id = nextProjectileId;
      const newProj = { id, x: sb.x, y: sb.y, vx, vy, type: powerKey, fromSuperbubble: true, createdAt: Date.now() };
      // Ensure no duplicate IDs
      projectilesRef.current = projectilesRef.current.filter(p => p.id !== id);
      appendProjectile(projectilesRef.current, newProj);
      playArenaSound("powerRelease", String(powerKey));
    }
    setProjectiles([...projectilesRef.current]);
    const mfId = Date.now() + Math.floor(Math.random() * 10000);
    setMuzzleFlashes((m) => [...m, { id: mfId, x: sb.x, y: sb.y, createdAt: Date.now() }]);
    setTimeout(() => {
      setMuzzleFlashes((m) => m.filter((mm) => mm.id !== mfId));
    }, 220);
  };

  useEffect(() => {
    return () => {
      if (autoFireRef.current) {
        window.clearInterval(autoFireRef.current);
        autoFireRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (autoFireRef.current) {
      window.clearInterval(autoFireRef.current);
      autoFireRef.current = null;
    }
    if (arenaType === ARENA_TYPES.BOSS && isRunning && superpowerEnabled && firingMode === "auto") {
      // Check if powers are active
      const checkAndFire = () => {
        const powersActive = superpowerAutoEnableTime === 0 || superpowerAutoEnabledRef.current;
        const notExpired = superpowerEnabledAtRef.current !== -1;
        if (powersActive && notExpired) {
          handleShoot();
        }
      };
      
      const id = window.setInterval(checkAndFire, 3000);
      autoFireRef.current = id as unknown as number;
      return () => {
        if (autoFireRef.current) {
          window.clearInterval(autoFireRef.current);
          autoFireRef.current = null;
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arenaType, isRunning, superpowerEnabled, firingMode, selectedPowers, projectileSpeedPerTick]);

  // ---------- Projectiles DOM rendering & muzzle/hit (unchanged) ----------

  const renderProjectileVisual = (p: Projectile) => {
    const angleDeg = Math.atan2(p.vy, p.vx) * (180 / Math.PI);
    
    // Determine glow color based on source
    const isFromSuperbubble = p.fromSuperbubble === true;
    let glowColor = isFromSuperbubble ? "rgba(180, 20, 20, 0.9)" : "rgba(20, 180, 20, 0.9)"; // Darker red/green, lower alpha
    
    // In brawl 1vMany mode, make many-team projectiles red
    if (!isFromSuperbubble && arenaType === ARENA_TYPES.BRAWL && brawlMode === "1vMany" && p.fromBubbleId !== undefined) {
      const shooterTeam = brawlTeamsRef.current.get(p.fromBubbleId);
      if (shooterTeam === "many") {
        glowColor = "rgba(180, 20, 20, 0.9)"; // Red glow for many team
      }
    }
    
    const glowSize = isFromSuperbubble ? 15 : 12;
    
    const baseStyle: React.CSSProperties = {
      position: "absolute",
      left: p.x,
      top: p.y,
      transform: `translate(-50%,-50%) rotate(${angleDeg}deg)`,
      zIndex: 1200,
      pointerEvents: "none",
      filter: `drop-shadow(0 0 ${glowSize}px ${glowColor}) drop-shadow(0 0 ${glowSize * 1.5}px ${glowColor})`,
      animation: `${getPowerMotion(p.type)} ${p.type === "spirit_bomb" || p.type === "bomb" ? "0.42s" : "0.7s"} ease-in-out infinite`,
      animationDelay: `-${p.id % 700}ms`,
      willChange: "opacity",
    };

    if (p.type === "flame") {
      return (
        <svg key={`proj-${p.id}`} width={48} height={56} style={baseStyle} viewBox="0 0 48 56" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`fg${p.id}`} cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="20%" stopColor="#ffeb3b" />
              <stop offset="40%" stopColor="#ff9800" />
              <stop offset="70%" stopColor="#ff5722" />
              <stop offset="100%" stopColor="#c62828" />
            </radialGradient>
            <filter id={`fglow${p.id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <ellipse cx="24" cy="30" rx="20" ry="26" fill={`url(#fg${p.id})`} opacity="0.3" filter={`url(#fglow${p.id})`} />
          <path d="M24 50 C28 38, 38 32, 38 24 C38 16, 30 12, 24 4 C18 12, 10 16, 10 24 C10 32, 20 38, 24 50 Z" 
                fill={`url(#fg${p.id})`} stroke="#e65100" strokeWidth="0.5" opacity="0.95" />
          <path d="M24 36 C26 30, 30 26, 30 22 C30 18, 26 16, 24 12 C22 16, 18 18, 18 22 C18 26, 22 30, 24 36 Z" 
                fill="#ffeb3b" opacity="0.9" />
          <ellipse cx="24" cy="22" rx="3" ry="4" fill="#ffffff" opacity="0.8" />
          <circle cx="20" cy="18" r="1.5" fill="#ffeb3b" opacity="0.7" />
          <circle cx="28" cy="16" r="1.2" fill="#ffeb3b" opacity="0.6" />
          <circle cx="24" cy="14" r="1" fill="#ffffff" opacity="0.9" />
        </svg>
      );
    } else if (p.type === "arrow") {
      return (
        <svg key={`proj-${p.id}`} width={64} height={14} style={baseStyle} viewBox="0 0 64 14" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`shaft${p.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#8d6e63" />
              <stop offset="50%" stopColor="#6d4c41" />
              <stop offset="100%" stopColor="#5d4037" />
            </linearGradient>
            <linearGradient id={`tip${p.id}`} x1="0" x2="1">
              <stop offset="0%" stopColor="#90a4ae" />
              <stop offset="50%" stopColor="#607d8b" />
              <stop offset="100%" stopColor="#455a64" />
            </linearGradient>
          </defs>
          <rect x="6" y="6" width="44" height="2" fill={`url(#shaft${p.id})`} />
          <polygon points="50,3 64,7 50,11" fill={`url(#tip${p.id})`} stroke="#263238" strokeWidth="0.5" />
          <polygon points="50,5 58,7 50,9" fill="#b0bec5" opacity="0.6" />
          <path d="M6,4 L12,7 L6,10 Z" fill="#f44336" opacity="0.85" stroke="#c62828" strokeWidth="0.3" />
          <path d="M2,5 L8,7 L2,9 Z" fill="#ef5350" opacity="0.85" stroke="#c62828" strokeWidth="0.3" />
          <line x1="15" y1="6.5" x2="45" y2="6.5" stroke="#4e342e" strokeWidth="0.3" opacity="0.3" />
        </svg>
      );
    } else if (p.type === "bullet") {
      // AWM-style: long, slim, pointed, metallic, with a red base
      return (
        <svg key={`proj-${p.id}`} width={60} height={10} style={baseStyle} viewBox="0 0 60 10" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`awmCasing${p.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#bdbdbd" />
              <stop offset="60%" stopColor="#757575" />
              <stop offset="100%" stopColor="#212121" />
            </linearGradient>
            <radialGradient id={`awmTip${p.id}`} cx="90%" cy="50%">
              <stop offset="0%" stopColor="#e0e0e0" />
              <stop offset="80%" stopColor="#bdbdbd" />
              <stop offset="100%" stopColor="#757575" />
            </radialGradient>
          </defs>
          {/* Casing */}
          <rect x="6" y="3.2" width="40" height="3.6" rx="1.2" fill={`url(#awmCasing${p.id})`} stroke="#616161" strokeWidth="0.6" />
          {/* Tip */}
          <polygon points="46,2 59,5 46,8" fill={`url(#awmTip${p.id})`} stroke="#757575" strokeWidth="0.5" />
          {/* Red base */}
          <rect x="3" y="3.7" width="5" height="2.6" rx="1.1" fill="#b71c1c" stroke="#880000" strokeWidth="0.5" />
          {/* Shine */}
          <rect x="10" y="3.5" width="8" height="1.2" rx="0.6" fill="#fff" opacity="0.18" />
          {/* Rim at base */}
          <rect x="8" y="3.3" width="1.5" height="3.4" rx="0.5" fill="#757575" opacity="0.7" />
        </svg>
      );
    } else if (p.type === "kunai") {
      return (
        <svg key={`proj-${p.id}`} width={56} height={16} style={baseStyle} viewBox="0 0 56 16" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`blade${p.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#b0bec5" />
              <stop offset="50%" stopColor="#90a4ae" />
              <stop offset="100%" stopColor="#78909c" />
            </linearGradient>
          </defs>
          <rect x="2" y="6" width="18" height="4" fill="#37474f" />
          <line x1="4" y1="6" x2="4" y2="10" stroke="#546e7a" strokeWidth="0.5" />
          <line x1="7" y1="6" x2="7" y2="10" stroke="#546e7a" strokeWidth="0.5" />
          <line x1="10" y1="6" x2="10" y2="10" stroke="#546e7a" strokeWidth="0.5" />
          <line x1="13" y1="6" x2="13" y2="10" stroke="#546e7a" strokeWidth="0.5" />
          <line x1="16" y1="6" x2="16" y2="10" stroke="#546e7a" strokeWidth="0.5" />
          <circle cx="4" cy="8" r="3" fill="none" stroke="#757575" strokeWidth="0.8" />
          <circle cx="4" cy="8" r="2" fill="none" stroke="#bdbdbd" strokeWidth="0.4" />
          <polygon points="20,8 45,4 54,8 45,12" fill={`url(#blade${p.id})`} stroke="#546e7a" strokeWidth="0.5" />
          <polygon points="22,8 45,5.5 50,8 45,10.5" fill="#eceff1" opacity="0.5" />
          <line x1="45" y1="4" x2="54" y2="8" stroke="#ffffff" strokeWidth="0.5" opacity="0.8" />
        </svg>
      );
    } else if (p.type === "shuriken") {
      const rotation = (Date.now() * 0.5) % 360;
      const spinStyle: React.CSSProperties = { ...baseStyle, transform: `translate(-50%,-50%) rotate(${rotation}deg)` };
      return (
        <svg key={`proj-${p.id}`} width={32} height={32} style={spinStyle} viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`star${p.id}`} cx="50%" cy="50%">
              <stop offset="0%" stopColor="#cfd8dc" />
              <stop offset="50%" stopColor="#90a4ae" />
              <stop offset="100%" stopColor="#546e7a" />
            </radialGradient>
          </defs>
          <polygon points="16,2 18,14 16,16 14,14" fill={`url(#star${p.id})`} stroke="#37474f" strokeWidth="0.5" />
          <polygon points="30,16 18,18 16,16 18,14" fill={`url(#star${p.id})`} stroke="#37474f" strokeWidth="0.5" />
          <polygon points="16,30 14,18 16,16 18,18" fill={`url(#star${p.id})`} stroke="#37474f" strokeWidth="0.5" />
          <polygon points="2,16 14,14 16,16 14,18" fill={`url(#star${p.id})`} stroke="#37474f" strokeWidth="0.5" />
          <circle cx="16" cy="16" r="3" fill="#263238" stroke="#000" strokeWidth="0.5" />
          <circle cx="16" cy="16" r="2" fill="none" stroke="#546e7a" strokeWidth="0.3" />
          <polygon points="16,4 17,14 16,15 15,14" fill="#eceff1" opacity="0.6" />
          <polygon points="28,16 18,17 17,16 18,15" fill="#eceff1" opacity="0.6" />
        </svg>
      );
    } else if (p.type === "katana") {
      return (
        <svg key={`proj-${p.id}`} width={72} height={18} style={baseStyle} viewBox="0 0 72 18" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`katanaBlade${p.id}`} x1="0" x2="1" y1="0.5" y2="0.5">
              <stop offset="0%" stopColor="#b0bec5" />
              <stop offset="40%" stopColor="#eceff1" />
              <stop offset="60%" stopColor="#eceff1" />
              <stop offset="100%" stopColor="#90a4ae" />
            </linearGradient>
          </defs>
          <rect x="2" y="7" width="16" height="4" fill="#1a237e" stroke="#0d47a1" strokeWidth="0.3" />
          <line x1="4" y1="7" x2="6" y2="11" stroke="#7c4dff" strokeWidth="0.5" />
          <line x1="8" y1="7" x2="10" y2="11" stroke="#7c4dff" strokeWidth="0.5" />
          <line x1="12" y1="7" x2="14" y2="11" stroke="#7c4dff" strokeWidth="0.5" />
          <rect x="17" y="5" width="3" height="8" fill="#424242" stroke="#212121" strokeWidth="0.4" rx="0.5" />
          <circle cx="18.5" cy="9" r="0.8" fill="#ffd700" />
          <polygon points="20,9 68,6 72,9 68,12" fill={`url(#katanaBlade${p.id})`} stroke="#607d8b" strokeWidth="0.5" />
          <path d="M 25,9 Q 35,8.5 45,9 T 65,8.5" stroke="#b0bec5" strokeWidth="0.4" fill="none" opacity="0.7" />
          <polygon points="22,9 68,7 70,9" fill="#ffffff" opacity="0.5" />
          <line x1="68" y1="6" x2="72" y2="9" stroke="#ffffff" strokeWidth="0.6" opacity="0.9" />
        </svg>
      );
    } else if (p.type === "energy_blast") {
      return (
        <svg key={`proj-${p.id}`} width={48} height={48} style={baseStyle} viewBox="0 0 48 48" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`energy${p.id}`} cx="50%" cy="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#00e5ff" />
              <stop offset="60%" stopColor="#00b0ff" />
              <stop offset="100%" stopColor="#0091ea" />
            </radialGradient>
            <filter id={`eblur${p.id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="24" cy="24" r="20" fill="#00b0ff" opacity="0.3" filter={`url(#eblur${p.id})`} />
          <circle cx="24" cy="24" r="14" fill={`url(#energy${p.id})`} opacity="0.9" />
          <circle cx="24" cy="24" r="8" fill="#e1f5fe" opacity="0.9" />
          <circle cx="24" cy="24" r="4" fill="#ffffff" />
          <path d="M 24,10 Q 28,18 24,24" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.7" />
          <path d="M 38,24 Q 30,20 24,24" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.7" />
          <path d="M 24,38 Q 20,30 24,24" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.7" />
          <circle cx="20" cy="20" r="2" fill="#ffffff" opacity="0.8" />
          <circle cx="28" cy="22" r="1.5" fill="#ffffff" opacity="0.6" />
        </svg>
      );
    } else if (p.type === "ice_shard") {
      return (
        <svg key={`proj-${p.id}`} width={52} height={20} style={baseStyle} viewBox="0 0 52 20" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`ice${p.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#e1f5fe" />
              <stop offset="30%" stopColor="#b3e5fc" />
              <stop offset="70%" stopColor="#81d4fa" />
              <stop offset="100%" stopColor="#4fc3f7" />
            </linearGradient>
            <filter id={`iblur${p.id}`}>
              <feGaussianBlur stdDeviation="1" />
            </filter>
          </defs>
          <polygon points="2,10 16,5 36,8 50,10 36,12 16,15" fill="#b3e5fc" opacity="0.4" filter={`url(#iblur${p.id})`} />
          <polygon points="4,10 18,6 38,9 52,10 38,11 18,14" fill={`url(#ice${p.id})`} stroke="#0288d1" strokeWidth="0.5" />
          <polygon points="8,10 20,7.5 38,9.5 46,10 38,10.5 20,12.5" fill="#ffffff" opacity="0.6" />
          <line x1="15" y1="6" x2="15" y2="14" stroke="#81d4fa" strokeWidth="0.3" opacity="0.5" />
          <line x1="25" y1="8" x2="25" y2="12" stroke="#81d4fa" strokeWidth="0.3" opacity="0.5" />
          <line x1="35" y1="9" x2="35" y2="11" stroke="#81d4fa" strokeWidth="0.3" opacity="0.5" />
          <circle cx="20" cy="9" r="1.5" fill="#ffffff" opacity="0.8" />
          <circle cx="30" cy="10" r="1" fill="#ffffff" opacity="0.7" />
          <circle cx="40" cy="10" r="1.2" fill="#ffffff" opacity="0.9" />
          <circle cx="8" cy="10" r="1" fill="#b3e5fc" opacity="0.5" />
          <circle cx="12" cy="8" r="0.8" fill="#b3e5fc" opacity="0.4" />
          <circle cx="12" cy="12" r="0.8" fill="#b3e5fc" opacity="0.4" />
        </svg>
      );
    } else if (p.type === "kamehameha") {
      // Kamehameha: Spiraling blue energy beam cone
      return (
        <svg key={`proj-${p.id}`} width={90} height={36} style={baseStyle} viewBox="0 0 90 36" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`kame${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="20%" stopColor="#00ffff" />
              <stop offset="50%" stopColor="#00d4ff" />
              <stop offset="100%" stopColor="#0091ea" />
            </linearGradient>
            <linearGradient id={`kamecore${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#ffffcc" />
              <stop offset="100%" stopColor="#ffff99" />
            </linearGradient>
            <filter id={`kameblur${p.id}`}>
              <feGaussianBlur stdDeviation="1.5" />
            </filter>
          </defs>

          {/* Main beam cone - diverging */}
          <polygon points="4,18 20,10 88,6 88,12 20,16 4,18" fill={`url(#kame${p.id})`} stroke="#0091ea" strokeWidth="0.8" opacity="0.9" />
          <polygon points="4,18 20,26 88,24 88,30 20,20 4,18" fill={`url(#kame${p.id})`} stroke="#0091ea" strokeWidth="0.8" opacity="0.9" />

          {/* Inner bright core */}
          <polygon points="6,18 22,12 86,8 86,10 22,16 6,18" fill={`url(#kamecore${p.id})`} opacity="0.8" stroke="#ffffff" strokeWidth="0.5" />
          <polygon points="6,18 22,24 86,26 86,28 22,20 6,18" fill={`url(#kamecore${p.id})`} opacity="0.8" stroke="#ffffff" strokeWidth="0.5" />

          {/* Spiral energy swirls */}
          <path d="M 20 16 Q 35 12 50 14 Q 65 16 80 12" fill="none" stroke="#00ffff" strokeWidth="0.8" opacity="0.7" filter={`url(#kameblur${p.id})`} />
          <path d="M 20 20 Q 35 24 50 22 Q 65 20 80 24" fill="none" stroke="#00ffff" strokeWidth="0.8" opacity="0.7" filter={`url(#kameblur${p.id})`} />

          {/* Energy particles */}
          <circle cx="25" cy="16" r="0.8" fill="#ffffff" opacity="0.9" />
          <circle cx="40" cy="18" r="0.7" fill="#ffff99" opacity="0.8" />
          <circle cx="55" cy="16" r="0.8" fill="#ffffff" opacity="0.7" />
          <circle cx="70" cy="18" r="0.7" fill="#ffff99" opacity="0.8" />
          <circle cx="85" cy="16" r="0.8" fill="#ffffff" opacity="0.7" />
        </svg>
      );
    } else if (p.type === "rasengan") {
      // Rasengan: Spinning spiral vortex
      const rotation = (Date.now() * 0.9) % 360; // Consistent rotation speed
      return (
        <svg key={`proj-${p.id}`} width={48} height={48} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${rotation}deg)`}} viewBox="0 0 48 48" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`ras${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#00d4ff" />
              <stop offset="70%" stopColor="#0091ea" />
              <stop offset="100%" stopColor="#004ba0" />
            </radialGradient>
          </defs>
          <circle cx="24" cy="24" r="22" fill={`url(#ras${p.id})`} />
          <path d="M 24 6 Q 30 12 28 20 Q 20 22 18 18 Q 18 12 24 6" fill="#ffffff" opacity="0.6" />
          <path d="M 24 24 Q 28 28 28 36 Q 24 38 20 36 Q 20 28 24 24" fill="#ffffff" opacity="0.6" />
          <path d="M 36 24 Q 38 30 34 36 Q 28 34 28 30 Q 32 26 36 24" fill="#ffffff" opacity="0.6" />
          <path d="M 12 24 Q 10 20 14 14 Q 20 16 20 20 Q 16 26 12 24" fill="#ffffff" opacity="0.6" />
          <circle cx="24" cy="24" r="6" fill="#ffffff" opacity="0.9" />
          <circle cx="24" cy="24" r="3" fill="#00d4ff" opacity="0.8" />
        </svg>
      );
    } else if (p.type === "chidori") {
      // Chidori: Lightning spike projectile
      return (
        <svg key={`proj-${p.id}`} width={48} height={40} style={baseStyle} viewBox="0 0 48 40" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`chi${p.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#2d0ff4" />
            </linearGradient>
            <filter id={`chiblur${p.id}`}>
              <feGaussianBlur stdDeviation="1.5" />
            </filter>
          </defs>
          <polygon points="24,2 42,20 36,20 44,38 20,26 26,26" fill={`url(#chi${p.id})`} stroke="#00d4ff" strokeWidth="1" />
          <line x1="24" y1="2" x2="20" y2="12" stroke="#00d4ff" strokeWidth="1.5" opacity="0.7" />
          <line x1="24" y1="2" x2="28" y2="12" stroke="#00d4ff" strokeWidth="1.5" opacity="0.7" />
          <line x1="42" y1="20" x2="38" y2="18" stroke="#00d4ff" strokeWidth="1" opacity="0.6" />
          <line x1="42" y1="20" x2="46" y2="18" stroke="#00d4ff" strokeWidth="1" opacity="0.6" />
          <line x1="44" y1="38" x2="40" y2="32" stroke="#00d4ff" strokeWidth="1" opacity="0.6" />
          <line x1="44" y1="38" x2="48" y2="32" stroke="#00d4ff" strokeWidth="1" opacity="0.6" />
          <circle cx="24" cy="12" r="2" fill="#ffffff" opacity="0.8" />
          <circle cx="36" cy="20" r="1.5" fill="#ffffff" opacity="0.7" />
          <circle cx="30" cy="28" r="1.5" fill="#ffffff" opacity="0.7" />
        </svg>
      );
    } else if (p.type === "spirit_bomb") {
      // Spirit Bomb: Massive glowing energy sphere
      return (
        <svg key={`proj-${p.id}`} width={64} height={64} style={baseStyle} viewBox="0 0 64 64" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`spirit${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffff00" />
              <stop offset="25%" stopColor="#ffcc00" />
              <stop offset="60%" stopColor="#ff9800" />
              <stop offset="100%" stopColor="#ff6f00" />
            </radialGradient>
            <filter id={`spiritblur${p.id}`}>
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          <circle cx="32" cy="32" r="30" fill={`url(#spirit${p.id})`} />
          <circle cx="32" cy="32" r="28" fill="none" stroke="#ffff00" strokeWidth="2" opacity="0.6" />
          <circle cx="32" cy="32" r="24" fill="none" stroke="#ffcc00" strokeWidth="1.5" opacity="0.4" />
          <circle cx="32" cy="32" r="18" fill="none" stroke="#ff9800" strokeWidth="1" opacity="0.3" />
          <circle cx="32" cy="32" r="26" fill={`url(#spirit${p.id})`} opacity="0.3" filter={`url(#spiritblur${p.id})`} />
          <circle cx="32" cy="32" r="12" fill="#ffffff" opacity="0.6" />
          <circle cx="32" cy="32" r="8" fill="#ffff00" opacity="0.8" />
          <circle cx="25" cy="25" r="3" fill="#ffffff" opacity="0.9" />
          <circle cx="39" cy="25" r="2.5" fill="#ffffff" opacity="0.8" />
          <circle cx="32" cy="42" r="2" fill="#ffffff" opacity="0.7" />
        </svg>
      );
    } else if (p.type === "phoenix_strike") {
      // Phoenix Strike: Flame-based fire strike
      return (
        <svg key={`proj-${p.id}`} width={56} height={48} style={baseStyle} viewBox="0 0 56 48" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`phoe${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#ffff00" />
              <stop offset="60%" stopColor="#ff6f00" />
              <stop offset="100%" stopColor="#c41c3b" />
            </linearGradient>
            <filter id={`phoeblur${p.id}`}>
              <feGaussianBlur stdDeviation="1.5" />
            </filter>
          </defs>
          <path d="M 28 4 L 40 16 L 32 20 L 44 32 L 28 24 L 20 36 L 24 20 L 16 16 Z" fill={`url(#phoe${p.id})`} stroke="#ff4500" strokeWidth="0.5" />
          <path d="M 28 8 L 36 14 L 32 18 L 40 26 L 28 22 L 22 30 L 24 18 L 18 14 Z" fill="#ffffff" opacity="0.5" />
          <ellipse cx="28" cy="16" rx="6" ry="8" fill="#ffff00" opacity="0.4" filter={`url(#phoeblur${p.id})`} />
          <circle cx="28" cy="16" r="3" fill="#ff4500" opacity="0.7" />
          <path d="M 12 20 L 8 22 L 10 26 Z" fill="#ff6f00" opacity="0.6" />
          <path d="M 44 20 L 48 22 L 46 26 Z" fill="#ff6f00" opacity="0.6" />
        </svg>
      );
    } else if (p.type === "void_slash") {
      // Void Slash: Dark angular slash with void energy
      return (
        <svg key={`proj-${p.id}`} width={56} height={32} style={baseStyle} viewBox="0 0 56 32" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`void${p.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#5d00ff" />
              <stop offset="40%" stopColor="#3d0080" />
              <stop offset="100%" stopColor="#1a0033" />
            </linearGradient>
            <filter id={`voidblur${p.id}`}>
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
          </defs>
          <polygon points="4,16 20,4 52,10 40,16 52,22 20,28 4,16" fill={`url(#void${p.id})`} stroke="#7c3aed" strokeWidth="1" />
          <polygon points="8,16 22,8 48,12 40,16 48,20 22,24 8,16" fill="none" stroke="#a855f7" strokeWidth="0.8" opacity="0.6" />
          <path d="M 20 4 Q 28 10 40 16 Q 28 22 20 28" fill="none" stroke="#c084fc" strokeWidth="1" opacity="0.4" />
          <circle cx="20" cy="16" r="2" fill="#a855f7" opacity="0.8" />
          <circle cx="40" cy="16" r="1.5" fill="#a855f7" opacity="0.6" />
        </svg>
      );
    } else if (p.type === "holy_light") {
      // Holy Light: Divine star burst with radiating light rays
      return (
        <svg key={`proj-${p.id}`} width={64} height={64} style={baseStyle} viewBox="0 0 64 64" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`holystar${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#ffff99" />
              <stop offset="100%" stopColor="#ffd700" />
            </linearGradient>
            <linearGradient id={`holyray${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#fffacd" />
              <stop offset="100%" stopColor="#ffed4e" />
            </linearGradient>
            <filter id={`holyblur${p.id}`}>
              <feGaussianBlur stdDeviation="1.5" />
            </filter>
          </defs>

          {/* Main star center */}
          <polygon points="32,12 38,28 56,32 40,40 48,56 32,44 16,56 24,40 8,32 26,28" fill={`url(#holystar${p.id})`} stroke="#ffff00" strokeWidth="1" opacity="0.95" />
          <polygon points="32,14 37,26 54,30 40,38 46,54 32,43 18,54 24,38 10,30 27,26" fill="#ffffff" opacity="0.6" stroke="#fffacd" strokeWidth="0.5" />

          {/* Radiating light rays - 8 directions */}
          <line x1="32" y1="2" x2="32" y2="12" stroke={`url(#holyray${p.id})`} strokeWidth="2" opacity="0.9" filter={`url(#holyblur${p.id})`} />
          <line x1="32" y1="52" x2="32" y2="62" stroke={`url(#holyray${p.id})`} strokeWidth="2" opacity="0.9" filter={`url(#holyblur${p.id})`} />
          <line x1="2" y1="32" x2="12" y2="32" stroke={`url(#holyray${p.id})`} strokeWidth="2" opacity="0.9" filter={`url(#holyblur${p.id})`} />
          <line x1="52" y1="32" x2="62" y2="32" stroke={`url(#holyray${p.id})`} strokeWidth="2" opacity="0.9" filter={`url(#holyblur${p.id})`} />

          <line x1="10" y1="10" x2="18" y2="18" stroke={`url(#holyray${p.id})`} strokeWidth="1.5" opacity="0.8" filter={`url(#holyblur${p.id})`} />
          <line x1="46" y1="46" x2="54" y2="54" stroke={`url(#holyray${p.id})`} strokeWidth="1.5" opacity="0.8" filter={`url(#holyblur${p.id})`} />
          <line x1="54" y1="10" x2="46" y2="18" stroke={`url(#holyray${p.id})`} strokeWidth="1.5" opacity="0.8" filter={`url(#holyblur${p.id})`} />
          <line x1="18" y1="46" x2="10" y2="54" stroke={`url(#holyray${p.id})`} strokeWidth="1.5" opacity="0.8" filter={`url(#holyblur${p.id})`} />

          {/* Center glow */}
          <circle cx="32" cy="32" r="8" fill="#ffffff" opacity="0.8" filter={`url(#holyblur${p.id})`} />
          <circle cx="32" cy="32" r="5" fill="#ffff99" opacity="0.9" />
          <circle cx="32" cy="32" r="2" fill="#ffffff" opacity="1" />
        </svg>
      );
    // MARVEL UNIVERSE POWERS
    } else if (p.type === "repulsor_blast") {
      // Repulsor Blast: Horizontal energy beam from repulsor glove
      return (
        <svg key={`proj-${p.id}`} width={70} height={40} style={baseStyle} viewBox="0 0 70 40" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`repulsorgrad${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffff99" />
              <stop offset="30%" stopColor="#ffff00" />
              <stop offset="60%" stopColor="#ff8c00" />
              <stop offset="100%" stopColor="#ff4500" />
            </linearGradient>
            <linearGradient id={`repulsorcore${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#ffffcc" />
              <stop offset="100%" stopColor="#ffff99" />
            </linearGradient>
            <filter id={`repulsorglow${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>

          {/* Main beam rays - upper and lower */}
          <polygon points="8,20 18,12 66,8 70,14 20,18 8,20" fill={`url(#repulsorgrad${p.id})`} stroke="#ff8c00" strokeWidth="0.8" opacity="0.9" />
          <polygon points="8,20 18,28 66,32 70,26 20,22 8,20" fill={`url(#repulsorgrad${p.id})`} stroke="#ff8c00" strokeWidth="0.8" opacity="0.9" />

          {/* Inner bright core beam */}
          <polygon points="10,20 20,14 64,10 68,16 20,20 10,20" fill={`url(#repulsorcore${p.id})`} opacity="0.8" stroke="#ffffff" strokeWidth="0.5" />
          <polygon points="10,20 20,26 64,30 68,24 20,20 10,20" fill={`url(#repulsorcore${p.id})`} opacity="0.8" stroke="#ffffff" strokeWidth="0.5" />

          {/* Expansion wave rings */}
          <path d="M 18 20 Q 30 16 45 18 Q 58 20 68 18" fill="none" stroke="#ffff00" strokeWidth="0.8" opacity="0.6" filter={`url(#repulsorglow${p.id})`} />
          <path d="M 18 20 Q 30 24 45 22 Q 58 20 68 22" fill="none" stroke="#ffff00" strokeWidth="0.8" opacity="0.6" filter={`url(#repulsorglow${p.id})`} />

          {/* Energy particles */}
          <circle cx="25" cy="18" r="0.8" fill="#ffffff" opacity="0.9" />
          <circle cx="40" cy="20" r="0.7" fill="#ffff99" opacity="0.8" />
          <circle cx="55" cy="18" r="0.8" fill="#ffffff" opacity="0.7" />

          {/* Glove attachment point (left side) */}
          <rect x="4" y="16" width="8" height="8" rx="1" fill="#666666" stroke="#444444" strokeWidth="0.5" />
        </svg>
      );
    } else if (p.type === "mjolnir_strike") {
      const rotation = (Date.now() * 0.4) % 360; // Slower rotation for massive hammer
      return (
        <svg key={`proj-${p.id}`} width={64} height={72} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${rotation}deg)`}} viewBox="0 0 64 72" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`mjolnir${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#ffff99" />
              <stop offset="70%" stopColor="#ffa500" />
              <stop offset="100%" stopColor="#ff8800" />
            </linearGradient>
            <linearGradient id={`mjolnirhandle${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#8b6f47" />
              <stop offset="50%" stopColor="#6d5437" />
              <stop offset="100%" stopColor="#4a3728" />
            </linearGradient>
            <filter id={`mjolnirglow${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>

          {/* Hammer Head - Large rectangular block with rounded edges */}
          <rect x="18" y="6" width="28" height="22" rx="3" ry="3" fill={`url(#mjolnir${p.id})`} stroke="#cc8800" strokeWidth="1" />

          {/* Hammer head highlights and details */}
          <rect x="20" y="8" width="24" height="8" rx="2" ry="2" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
          <polygon points="22,10 42,10 40,14 24,14" fill="#ffff99" opacity="0.4" />

          {/* Top edge of hammer - sharp edges */}
          <line x1="18" y1="6" x2="46" y2="6" stroke="#ffff00" strokeWidth="1" opacity="0.8" />

          {/* Side ridges for 3D effect */}
          <line x1="18" y1="10" x2="18" y2="28" stroke="#ff9900" strokeWidth="1" opacity="0.6" />
          <line x1="46" y1="10" x2="46" y2="28" stroke="#cc7700" strokeWidth="1" opacity="0.8" />

          {/* Center strike surface highlight */}
          <rect x="22" y="12" width="20" height="12" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />

          {/* Handle - strong wooden grip */}
          <rect x="28" y="28" width="8" height="38" rx="2" ry="2" fill={`url(#mjolnirhandle${p.id})`} stroke="#3d2817" strokeWidth="0.8" />

          {/* Handle ridges/grip pattern */}
          <line x1="28" y1="34" x2="36" y2="34" stroke="#5d3d2d" strokeWidth="0.3" opacity="0.6" />
          <line x1="28" y1="40" x2="36" y2="40" stroke="#5d3d2d" strokeWidth="0.3" opacity="0.6" />
          <line x1="28" y1="46" x2="36" y2="46" stroke="#5d3d2d" strokeWidth="0.3" opacity="0.6" />
          <line x1="28" y1="52" x2="36" y2="52" stroke="#5d3d2d" strokeWidth="0.3" opacity="0.6" />
          <line x1="28" y1="58" x2="36" y2="58" stroke="#5d3d2d" strokeWidth="0.3" opacity="0.6" />

          {/* Handle highlight */}
          <line x1="29" y1="30" x2="29" y2="64" stroke="#9d7d6d" strokeWidth="0.4" opacity="0.4" />

          {/* Energy crackles around hammer */}
          <path d="M 20 8 Q 15 6 12 10" fill="none" stroke="#00d4ff" strokeWidth="0.8" opacity="0.6" filter={`url(#mjolnirglow${p.id})`} />
          <path d="M 44 8 Q 49 6 52 10" fill="none" stroke="#00d4ff" strokeWidth="0.8" opacity="0.6" filter={`url(#mjolnirglow${p.id})`} />
          <path d="M 32 26 Q 30 32 32 38" fill="none" stroke="#00d4ff" strokeWidth="0.6" opacity="0.5" filter={`url(#mjolnirglow${p.id})`} />
        </svg>
      );
    } else if (p.type === "gamma_smash") {
      //Gamma Smash: Powerful fist impact with green energy rings
      return (
        <svg key={`proj-${p.id}`} width={50} height={50} style={baseStyle} viewBox="0 0 50 50" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`gamma${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#00ff00" />
              <stop offset="50%" stopColor="#00cc00" />
              <stop offset="100%" stopColor="#008800" />
            </linearGradient>
            <linearGradient id={`fistgradient${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffb366" />
              <stop offset="50%" stopColor="#ff9933" />
              <stop offset="100%" stopColor="#ff6600" />
            </linearGradient>
            <filter id={`gammablur${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>

          {/* Fist shape */}
          <rect x="10" y="14" width="30" height="20" rx="3" fill={`url(#fistgradient${p.id})`} stroke="#cc5500" strokeWidth="0.8" />

          {/* Knuckles */}
          <circle cx="16" cy="15" r="2.5" fill="#ffcc99" opacity="0.8" />
          <circle cx="25" cy="14" r="2.5" fill="#ffcc99" opacity="0.8" />
          <circle cx="34" cy="15" r="2.5" fill="#ffcc99" opacity="0.8" />

          {/* Green impact energy rings - explosion effect */}
          <circle cx="25" cy="25" r="20" fill="none" stroke={`url(#gamma${p.id})`} strokeWidth="1" opacity="0.7" filter={`url(#gammablur${p.id})`} />
          <circle cx="25" cy="25" r="14" fill="none" stroke="#00ff00" strokeWidth="1" opacity="0.6" filter={`url(#gammablur${p.id})`} />
          <circle cx="25" cy="25" r="8" fill="none" stroke="#00ff00" strokeWidth="0.8" opacity="0.5" />

          {/* Energy shockwave spikes */}
          <polygon points="25,5 30,15 25,13 20,15" fill={`url(#gamma${p.id})`} opacity="0.8" />
          <polygon points="45,25 35,30 37,25 35,20" fill={`url(#gamma${p.id})`} opacity="0.8" />
          <polygon points="25,45 20,35 25,37 30,35" fill={`url(#gamma${p.id})`} opacity="0.8" />
          <polygon points="5,25 15,20 13,25 15,30" fill={`url(#gamma${p.id})`} opacity="0.8" />

          {/* Center core glow */}
          <circle cx="25" cy="25" r="5" fill="#ffffff" opacity="0.6" filter={`url(#gammablur${p.id})`} />
          <circle cx="25" cy="25" r="2" fill="#00ff00" opacity="0.9" />
        </svg>
      );
    } else if (p.type === "web_shot") {
      // Web Shot: Sticky web projectile with spider web pattern
      return (
        <svg key={`proj-${p.id}`} width={52} height={52} style={baseStyle} viewBox="0 0 52 52" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`webgrad${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#dddddd" />
              <stop offset="50%" stopColor="#bbbbbb" />
              <stop offset="100%" stopColor="#999999" />
            </linearGradient>
            <filter id={`webglow${p.id}`}><feGaussianBlur stdDeviation="0.5" /></filter>
          </defs>

          {/* Spider at center */}
          <circle cx="26" cy="26" r="3" fill="#222222" />
          <circle cx="26" cy="26" r="2" fill="#111111" opacity="0.8" />

          {/* Radial web strands - 8 directions */}
          <line x1="26" y1="26" x2="26" y2="4" stroke={`url(#webgrad${p.id})`} strokeWidth="0.6" opacity="0.8" />
          <line x1="26" y1="26" x2="42" y2="10" stroke={`url(#webgrad${p.id})`} strokeWidth="0.6" opacity="0.8" />
          <line x1="26" y1="26" x2="48" y2="26" stroke={`url(#webgrad${p.id})`} strokeWidth="0.6" opacity="0.8" />
          <line x1="26" y1="26" x2="42" y2="42" stroke={`url(#webgrad${p.id})`} strokeWidth="0.6" opacity="0.8" />
          <line x1="26" y1="26" x2="26" y2="48" stroke={`url(#webgrad${p.id})`} strokeWidth="0.6" opacity="0.8" />
          <line x1="26" y1="26" x2="10" y2="42" stroke={`url(#webgrad${p.id})`} strokeWidth="0.6" opacity="0.8" />
          <line x1="26" y1="26" x2="4" y2="26" stroke={`url(#webgrad${p.id})`} strokeWidth="0.6" opacity="0.8" />
          <line x1="26" y1="26" x2="10" y2="10" stroke={`url(#webgrad${p.id})`} strokeWidth="0.6" opacity="0.8" />

          {/* Concentric circular web rows */}
          <circle cx="26" cy="26" r="6" fill="none" stroke={`url(#webgrad${p.id})`} strokeWidth="0.6" opacity="0.8" />
          <circle cx="26" cy="26" r="12" fill="none" stroke={`url(#webgrad${p.id})`} strokeWidth="0.6" opacity="0.7" />
          <circle cx="26" cy="26" r="18" fill="none" stroke={`url(#webgrad${p.id})`} strokeWidth="0.6" opacity="0.6" filter={`url(#webglow${p.id})`} />

          {/* Decorative corner web nodes */}
          <circle cx="12" cy="12" r="1.2" fill={`url(#webgrad${p.id})`} opacity="0.7" />
          <circle cx="40" cy="12" r="1.2" fill={`url(#webgrad${p.id})`} opacity="0.7" />
          <circle cx="40" cy="40" r="1.2" fill={`url(#webgrad${p.id})`} opacity="0.7" />
          <circle cx="12" cy="40" r="1.2" fill={`url(#webgrad${p.id})`} opacity="0.7" />

          {/* Sticky glow effect */}
          <circle cx="26" cy="26" r="22" fill="none" stroke="#ffff99" strokeWidth="0.4" opacity="0.4" filter={`url(#webglow${p.id})`} />
        </svg>
      );
    } else if (p.type === "frost_bolt") {
      return (
        <svg key={`proj-${p.id}`} width={48} height={40} style={baseStyle} viewBox="0 0 48 40" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`frost${p.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#e0f7ff" />
              <stop offset="50%" stopColor="#80ddff" />
              <stop offset="100%" stopColor="#0099cc" />
            </linearGradient>
          </defs>
          <polygon points="24,2 42,18 36,20 44,38 24,28 12,38 20,20 14,18" fill={`url(#frost${p.id})`} stroke="#0099cc" strokeWidth="1" />
          <line x1="24" y1="2" x2="20" y2="12" stroke="#e0f7ff" strokeWidth="1" opacity="0.7" />
          <line x1="24" y1="2" x2="28" y2="12" stroke="#e0f7ff" strokeWidth="1" opacity="0.7" />
          <circle cx="28" cy="18" r="1.5" fill="#ffffff" opacity="0.9" />
          <circle cx="20" cy="20" r="1" fill="#ffffff" opacity="0.8" />
        </svg>
      );
    } else if (p.type === "captain_energy") {
      // Captain Energy: Shield emblem with patriotic design
      return (
        <svg key={`proj-${p.id}`} width={60} height={48} style={baseStyle} viewBox="0 0 60 48" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`captain${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ff6600" />
              <stop offset="40%" stopColor="#ffcc00" />
              <stop offset="100%" stopColor="#ff6600" />
            </linearGradient>
            <linearGradient id={`captainmetal${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#c0c0c0" />
              <stop offset="50%" stopColor="#a0a0a0" />
              <stop offset="100%" stopColor="#808080" />
            </linearGradient>
            <filter id={`capglow${p.id}`}><feGaussianBlur stdDeviation="1.2" /></filter>
          </defs>

          {/* Shield shape - wide pentagon */}
          <path d="M 30 2 L 50 10 L 52 22 Q 52 35 30 44 Q 8 35 8 22 L 10 10 Z" fill={`url(#captain${p.id})`} stroke="#cc3300" strokeWidth="0.8" />

          {/* Shield inner bevel */}
          <path d="M 30 4 L 48 12 L 50 22 Q 50 32 30 40 Q 12 32 12 22 L 14 12 Z" fill="none" stroke="#ffff99" strokeWidth="0.5" opacity="0.6" />

          {/* Star in center */}
          <polygon points="30,12 33,20 42,20 36,25 39,33 30,28 21,33 24,25 18,20 27,20" fill="#0066cc" stroke="#003399" strokeWidth="0.6" opacity="0.9" />

          {/* Metal ring highlight */}
          <circle cx="30" cy="24" r="16" fill="none" stroke={`url(#captainmetal${p.id})`} strokeWidth="0.6" opacity="0.5" />

          {/* Center glow */}
          <circle cx="30" cy="24" r="8" fill="#ffffff" opacity="0.4" filter={`url(#capglow${p.id})`} />
        </svg>
      );
    } else if (p.type === "mystic_spell") {
      // Mystic Spell: Magical rune circles swirling with arcane energy
      const rotation = (Date.now() * 0.9) % 360; // Consistent rotation
      return (
        <svg key={`proj-${p.id}`} width={56} height={56} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${rotation}deg)`}} viewBox="0 0 56 56" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`mystic${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ff00ff" />
              <stop offset="40%" stopColor="#7700ff" />
              <stop offset="100%" stopColor="#0000ff" />
            </linearGradient>
            <linearGradient id={`mysticcircle${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffff99" />
              <stop offset="50%" stopColor="#ff00ff" />
              <stop offset="100%" stopColor="#7700ff" />
            </linearGradient>
            <filter id={`mysticglow${p.id}`}><feGaussianBlur stdDeviation="0.8" /></filter>
          </defs>

          {/* Outer mystic circles - rotating */}
          <circle cx="28" cy="28" r="24" fill="none" stroke={`url(#mystic${p.id})`} strokeWidth="0.8" opacity="0.8" />
          <circle cx="28" cy="28" r="18" fill="none" stroke="#ff00ff" strokeWidth="0.6" opacity="0.6" />
          <circle cx="28" cy="28" r="12" fill="none" stroke="#7700ff" strokeWidth="0.6" opacity="0.5" />

          {/* Magical rune symbols at cardinal points */}
          <g>
            {/* Top rune */}
            <circle cx="28" cy="8" r="2" fill="none" stroke={`url(#mysticcircle${p.id})`} strokeWidth="0.8" opacity="0.9" />
            <line x1="27" y1="7" x2="29" y2="9" stroke="#ff00ff" strokeWidth="0.6" opacity="0.7" />
          </g>

          <g>
            {/* Right rune */}
            <circle cx="48" cy="28" r="2" fill="none" stroke={`url(#mysticcircle${p.id})`} strokeWidth="0.8" opacity="0.9" />
            <line x1="47" y1="27" x2="49" y2="29" stroke="#ff00ff" strokeWidth="0.6" opacity="0.7" />
          </g>

          <g>
            {/* Bottom rune */}
            <circle cx="28" cy="48" r="2" fill="none" stroke={`url(#mysticcircle${p.id})`} strokeWidth="0.8" opacity="0.9" />
            <line x1="27" y1="47" x2="29" y2="49" stroke="#ff00ff" strokeWidth="0.6" opacity="0.7" />
          </g>

          <g>
            {/* Left rune */}
            <circle cx="8" cy="28" r="2" fill="none" stroke={`url(#mysticcircle${p.id})`} strokeWidth="0.8" opacity="0.9" />
            <line x1="7" y1="27" x2="9" y2="29" stroke="#ff00ff" strokeWidth="0.6" opacity="0.7" />
          </g>

          {/* Diagonal runes */}
          <circle cx="40" cy="16" r="1.5" fill="#ff00ff" opacity="0.7" filter={`url(#mysticglow${p.id})`} />
          <circle cx="16" cy="40" r="1.5" fill="#ff00ff" opacity="0.7" filter={`url(#mysticglow${p.id})`} />
          <circle cx="40" cy="40" r="1.5" fill="#7700ff" opacity="0.7" filter={`url(#mysticglow${p.id})`} />
          <circle cx="16" cy="16" r="1.5" fill="#7700ff" opacity="0.7" filter={`url(#mysticglow${p.id})`} />

          {/* Center power core */}
          <circle cx="28" cy="28" r="6" fill="none" stroke="#ffff99" strokeWidth="1" opacity="0.8" filter={`url(#mysticglow${p.id})`} />
          <circle cx="28" cy="28" r="3" fill="#ff00ff" opacity="0.85" />
        </svg>
      );
    } else if (p.type === "widow_bite") {
      // Widow Bite: Hourglass web venom projectile with spider fangs
      return (
        <svg key={`proj-${p.id}`} width={48} height={60} style={baseStyle} viewBox="0 0 48 60" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`widowgrad${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ff3300" />
              <stop offset="50%" stopColor="#ff0000" />
              <stop offset="100%" stopColor="#990000" />
            </linearGradient>
            <linearGradient id={`venom${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ff6600" />
              <stop offset="100%" stopColor="#cc0000" />
            </linearGradient>
            <filter id={`widowglow${p.id}`}><feGaussianBlur stdDeviation="0.8" /></filter>
          </defs>

          {/* Upper hourglass lobe */}
          <path d="M 14 4 L 26 18 L 38 4 Q 38 12 24 16 Q 10 12 14 4" fill={`url(#widowgrad${p.id})`} stroke="#990000" strokeWidth="0.8" opacity="0.9" />

          {/* Hourglass middle pinch */}
          <polygon points="16 16 20 22 24 20 28 22 32 16" fill="#ff0000" stroke="#660000" strokeWidth="0.5" opacity="0.8" />

          {/* Lower hourglass lobe */}
          <path d="M 14 28 L 26 42 L 38 28 Q 38 36 24 40 Q 10 36 14 28" fill={`url(#widowgrad${p.id})`} stroke="#990000" strokeWidth="0.8" opacity="0.9" />

          {/* Spider body (bottom part) */}
          <ellipse cx="24" cy="50" rx="6" ry="8" fill="#1a1a1a" stroke="#000000" strokeWidth="0.5" />

          {/* Spider fangs  */}
          <line x1="21" y1="56" x2="18" y2="60" stroke={`url(#venom${p.id})`} strokeWidth="1.2" opacity="0.9" filter={`url(#widowglow${p.id})`} />
          <line x1="27" y1="56" x2="30" y2="60" stroke={`url(#venom${p.id})`} strokeWidth="1.2" opacity="0.9" filter={`url(#widowglow${p.id})`} />

          {/* Red venom drips */}
          <circle cx="18" cy="60" r="1" fill="#ff0000" opacity="0.8" filter={`url(#widowglow${p.id})`} />
          <circle cx="30" cy="60" r="1" fill="#ff0000" opacity="0.8" filter={`url(#widowglow${p.id})`} />

          {/* Spider eyes */}
          <circle cx="22" cy="48" r="0.8" fill="#ffff00" opacity="0.8" />
          <circle cx="26" cy="48" r="0.8" fill="#ffff00" opacity="0.8" />

          {/* Web silk glow */}
          <path d="M 24 18 Q 24 25 24 50" fill="none" stroke="#ffff99" strokeWidth="0.4" opacity="0.3" />
        </svg>
      );
    } else if (p.type === "scarlet_hex") {
      // Scarlet Hex: Hexagonal energy sigil with magical ramps
      return (
        <svg key={`proj-${p.id}`} width={52} height={60} style={baseStyle} viewBox="0 0 52 60" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`scarletgrad${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ff3333" />
              <stop offset="50%" stopColor="#ff0000" />
              <stop offset="100%" stopColor="#cc0000" />
            </linearGradient>
            <linearGradient id={`scarletcore${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffcccc" />
              <stop offset="50%" stopColor="#ff6666" />
              <stop offset="100%" stopColor="#ff0000" />
            </linearGradient>
            <filter id={`scarletglow${p.id}`}><feGaussianBlur stdDeviation="1.2" /></filter>
          </defs>

          {/* Main hexagonal sigil */}
          <polygon points="26,4 42,14 42,34 26,44 10,34 10,14" fill={`url(#scarletgrad${p.id})`} stroke="#cc0000" strokeWidth="1" opacity="0.95" />

          {/* Inner hexagon highlight */}
          <polygon points="26,8 40,16 40,32 26,40 12,32 12,16" fill="none" stroke="#ff6666" strokeWidth="0.8" opacity="0.7" />

          {/* Magical curse runes on sides */}
          <circle cx="8" cy="24" r="1.8" fill="none" stroke={`url(#scarletcore${p.id})`} strokeWidth="0.8" opacity="0.8" filter={`url(#scarletglow${p.id})`} />
          <circle cx="44" cy="24" r="1.8" fill="none" stroke={`url(#scarletcore${p.id})`} strokeWidth="0.8" opacity="0.8" filter={`url(#scarletglow${p.id})`} />

          {/* Top and bottom power points */}
          <circle cx="26" cy="2" r="1.5" fill="#ff0000" opacity="0.9" filter={`url(#scarletglow${p.id})`} />
          <circle cx="26" cy="46" r="1.5" fill="#ff0000" opacity="0.9" filter={`url(#scarletglow${p.id})`} />

          {/* Center glyph */}
          <circle cx="26" cy="24" r="6" fill="none" stroke={`url(#scarletcore${p.id})`} strokeWidth="1" opacity="0.8" filter={`url(#scarletglow${p.id})`} />
          <circle cx="26" cy="24" r="3" fill="#ff0000" opacity="0.85" />

          {/* Energy rays emanating from hex points */}
          <line x1="26" y1="2" x2="26" y2="-2" stroke="#ff6666" strokeWidth="0.8" opacity="0.6" />
          <line x1="42" y1="14" x2="46" y2="10" stroke="#ff6666" strokeWidth="0.8" opacity="0.6" />
          <line x1="42" y1="34" x2="46" y2="38" stroke="#ff6666" strokeWidth="0.8" opacity="0.6" />
          <line x1="26" y1="44" x2="26" y2="50" stroke="#ff6666" strokeWidth="0.8" opacity="0.6" />
        </svg>
      );
    } else if (p.type === "vision_beam") {
      // Vision Beam: Intense yellow laser cone from android eyes
      return (
        <svg key={`proj-${p.id}`} width={75} height={44} style={baseStyle} viewBox="0 0 75 44" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`visionbeam${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffff00" />
              <stop offset="30%" stopColor="#ffdd00" />
              <stop offset="60%" stopColor="#ffaa00" />
              <stop offset="100%" stopColor="#ff6600" />
            </linearGradient>
            <linearGradient id={`visioncore${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#ffffcc" />
              <stop offset="100%" stopColor="#ffff99" />
            </linearGradient>
            <filter id={`visionglow${p.id}`}><feGaussianBlur stdDeviation="2" /></filter>
          </defs>

          {/* Main laser beam - diverging cone */}
          <polygon points="6,22 18,10 72,4 75,8 20,14 6,22" fill={`url(#visionbeam${p.id})`} stroke="#ffaa00" strokeWidth="0.8" opacity="0.92" />
          <polygon points="6,22 18,34 72,40 75,36 20,30 6,22" fill={`url(#visionbeam${p.id})`} stroke="#ffaa00" strokeWidth="0.8" opacity="0.92" />

          {/* Inner bright core */}
          <polygon points="8,22 20,14 70,8 72,12 22,18 8,22" fill={`url(#visioncore${p.id})`} opacity="0.9" stroke="#ffffff" strokeWidth="0.5" />
          <polygon points="8,22 20,30 70,36 72,32 22,26 8,22" fill={`url(#visioncore${p.id})`} opacity="0.9" stroke="#ffffff" strokeWidth="0.5" />

          {/* Heat distortion ripples on beam */}
          <path d="M 18 22 Q 35 18 55 20 Q 70 22 75 24" fill="none" stroke="#ffff99" strokeWidth="0.8" opacity="0.6" filter={`url(#visionglow${p.id})`} />
          <path d="M 18 22 Q 35 26 55 24 Q 70 22 75 20" fill="none" stroke="#ffff99" strokeWidth="0.8" opacity="0.6" filter={`url(#visionglow${p.id})`} />

          {/* Ocular lens effect (starting point) */}
          <circle cx="6" cy="22" r="3" fill="none" stroke="#ffff00" strokeWidth="0.8" opacity="0.8" />
          <circle cx="6" cy="22" r="1.5" fill="#ffff99" opacity="0.9" filter={`url(#visionglow${p.id})`} />

          {/* Energy particles trailing */}
          <circle cx="28" cy="20" r="0.7" fill="#ffffff" opacity="0.8" />
          <circle cx="42" cy="22" r="0.6" fill="#ffff99" opacity="0.7" />
          <circle cx="58" cy="22" r="0.7" fill="#ffffff" opacity="0.7" />
        </svg>
      );
    } else if (p.type === "heat_vision") {
      return (
        <svg key={`proj-${p.id}`} width={56} height={48} style={baseStyle} viewBox="0 0 56 48" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`heatray${p.id}`} x1="0" x2="1" y1="0.5" y2="0.5">
              <stop offset="0%" stopColor="#ff0000" />
              <stop offset="30%" stopColor="#ff6600" />
              <stop offset="70%" stopColor="#ffaa00" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
            <filter id={`heatglow${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>
          {/* Energy source center */}
          <circle cx="8" cy="24" r="5" fill="#ff0000" stroke="#ff6600" strokeWidth="1" />
          
          {/* Twin heat rays diverging */}
          <path d="M 12 18 L 48 4 L 48 12 Z" fill={`url(#heatray${p.id})`} stroke="#ff3300" strokeWidth="0.8" opacity="0.95" />
          <path d="M 12 30 L 48 44 L 48 36 Z" fill={`url(#heatray${p.id})`} stroke="#ff3300" strokeWidth="0.8" opacity="0.95" />
          
          {/* Heat shimmer effect */}
          <path d="M 14 18 Q 25 14 48 6" fill="none" stroke="#ffff00" strokeWidth="0.8" opacity="0.6" filter={`url(#heatglow${p.id})`} />
          <path d="M 14 30 Q 25 34 48 42" fill="none" stroke="#ffff00" strokeWidth="0.8" opacity="0.6" filter={`url(#heatglow${p.id})`} />
          
          {/* Center ray */}
          <polygon points="13,24 50,24 50,28 13,28" fill={`url(#heatray${p.id})`} stroke="#ff3300" strokeWidth="0.8" opacity="0.85" />
        </svg>
      );
    } else if (p.type === "freeze_ray") {
      return (
        <svg key={`proj-${p.id}`} width={52} height={48} style={baseStyle} viewBox="0 0 52 48" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`freezeray${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#e0f7ff" />
              <stop offset="40%" stopColor="#4fc3f7" />
              <stop offset="100%" stopColor="#01579b" />
            </linearGradient>
            <filter id={`frostglow${p.id}`}><feGaussianBlur stdDeviation="1" /></filter>
          </defs>
          {/* Energy source */}
          <circle cx="8" cy="24" r="4" fill="#4fc3f7" stroke="#0288d1" strokeWidth="0.8" />
          
          {/* Twin freeze rays */}
          <path d="M 12 16 L 48 6 L 48 14 Z" fill={`url(#freezeray${p.id})`} stroke="#0288d1" strokeWidth="0.8" opacity="0.95" />
          <path d="M 12 32 L 48 42 L 48 34 Z" fill={`url(#freezeray${p.id})`} stroke="#0288d1" strokeWidth="0.8" opacity="0.95" />
          
          {/* Frost shimmer */}
          <path d="M 14 16 Q 25 12 48 8" fill="none" stroke="#e0f7ff" strokeWidth="1" opacity="0.7" filter={`url(#frostglow${p.id})`} />
          <path d="M 14 32 Q 25 36 48 40" fill="none" stroke="#e0f7ff" strokeWidth="1" opacity="0.7" filter={`url(#frostglow${p.id})`} />
          
          {/* Center ray */}
          <polygon points="13,22 50,22 50,26 13,26" fill={`url(#freezeray${p.id})`} stroke="#0288d1" strokeWidth="0.8" opacity="0.85" />
          
          {/* Ice crystals on rays */}
          <circle cx="30" cy="10" r="1" fill="#e0f7ff" opacity="0.8" />
          <circle cx="35" cy="8" r="0.8" fill="#e0f7ff" opacity="0.8" />
          <circle cx="45" cy="6" r="0.9" fill="#4fc3f7" opacity="0.7" />
          <circle cx="30" cy="38" r="1" fill="#e0f7ff" opacity="0.8" />
          <circle cx="35" cy="40" r="0.8" fill="#e0f7ff" opacity="0.8" />
          <circle cx="45" cy="42" r="0.9" fill="#4fc3f7" opacity="0.7" />
        </svg>
      );
    } else if (p.type === "lightning_power") {
      return (
        <svg key={`proj-${p.id}`} width={44} height={56} style={baseStyle} viewBox="0 0 44 56" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`lightninggrad${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffff00" />
              <stop offset="50%" stopColor="#ffcc00" />
              <stop offset="100%" stopColor="#ff9900" />
            </linearGradient>
            <filter id={`lightningglow${p.id}`}><feGaussianBlur stdDeviation="1.2" /></filter>
          </defs>
          {/* Main lightning bolt - jagged path */}
          <polygon points="22,2 30,14 26,18 32,28 20,28 24,18 14,16 18,6" fill={`url(#lightninggrad${p.id})`} stroke="#ff6600" strokeWidth="1" />
          <polygon points="22,4 32,34 28,38 36,54 22,42 8,54 16,38 12,34 20,8" fill={`url(#lightninggrad${p.id})`} stroke="#ff6600" strokeWidth="0.8" opacity="0.9" />
          
          {/* Inner bright core */}
          <polygon points="22,6 28,16 25,22 30,36 22,28 14,36 19,22 16,16 20,8" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.8" filter={`url(#lightningglow${p.id})`} />
          
          {/* Side lightning arcs */}
          <path d="M 16 20 L 10 28 L 12 26" fill="none" stroke="#ffff00" strokeWidth="1" opacity="0.6" />
          <path d="M 28 20 L 34 28 L 32 26" fill="none" stroke="#ffff00" strokeWidth="1" opacity="0.6" />
        </svg>
      );
    } else if (p.type === "lasso_energy") {
      // Lasso Energy: Spiraling golden lasso rope with energy
      const rotation = (Date.now() * 0.9) % 360; // Consistent rotation
      return (
        <svg key={`proj-${p.id}`} width={60} height={54} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${rotation}deg)`}} viewBox="0 0 60 54" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`lassograd${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffff99" />
              <stop offset="40%" stopColor="#ffdd00" />
              <stop offset="100%" stopColor="#ff9900" />
            </linearGradient>
            <linearGradient id={`lassocord${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffcc44" />
              <stop offset="100%" stopColor="#ff8800" />
            </linearGradient>
            <filter id={`lassoglow${p.id}`}><feGaussianBlur stdDeviation="1" /></filter>
          </defs>

          {/* Main lasso loop in center */}
          <ellipse cx="30" cy="27" rx="16" ry="20" fill="none" stroke={`url(#lassograd${p.id})`} strokeWidth="2" opacity="0.95" />
          <ellipse cx="30" cy="27" rx="14" ry="18" fill="none" stroke="#ffdd00" strokeWidth="1" opacity="0.7" />

          {/* Lasso rope with spiral twist */}
          <path d="M 30 7 Q 25 15 28 27 Q 32 38 30 47" fill="none" stroke={`url(#lassocord${p.id})`} strokeWidth="1.2" opacity="0.8" filter={`url(#lassoglow${p.id})`} />
          <path d="M 30 7 Q 35 15 32 27 Q 28 38 30 47" fill="none" stroke={`url(#lassocord${p.id})`} strokeWidth="1.2" opacity="0.8" filter={`url(#lassoglow${p.id})`} />

          {/* Energy sparkles on rope */}
          <circle cx="28" cy="17" r="0.8" fill="#ffffff" opacity="0.9" />
          <circle cx="30" cy="27" r="1" fill="#ffff99" opacity="0.8" />
          <circle cx="31" cy="37" r="0.8" fill="#ffffff" opacity="0.7" />

          {/* Handle attachment (top) */}
          <rect x="28" y="2" width="4" height="6" rx="1" fill="#8b6f47" stroke="#6d5437" strokeWidth="0.4" opacity="0.8" />

          {/* Golden aura around lasso */}
          <ellipse cx="30" cy="27" rx="20" ry="24" fill="none" stroke="#ffff99" strokeWidth="0.6" opacity="0.3" filter={`url(#lassoglow${p.id})`} />
        </svg>
      );
    } else if (p.type === "green_lantern") {
      // Green Lantern: Construct energy platform/shape
      const rotation = (Date.now() * 0.9) % 360;
      return (
        <svg key={`proj-${p.id}`} width={56} height={48} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${rotation}deg)`}} viewBox="0 0 56 48" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`lanterngrad${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#00ff00" />
              <stop offset="40%" stopColor="#00dd00" />
              <stop offset="100%" stopColor="#00aa00" />
            </linearGradient>
            <linearGradient id={`lanterncore${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ccffcc" />
              <stop offset="100%" stopColor="#00ff00" />
            </linearGradient>
            <filter id={`lanternglow${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>

          {/* Construct energy platform - stepped rectangle */}
          <rect x="12" y="6" width="32" height="12" rx="2" fill={`url(#lanterngrad${p.id})`} stroke="#009900" strokeWidth="0.8" opacity="0.9" />

          {/* Lower support section */}
          <rect x="16" y="18" width="24" height="14" rx="2" fill={`url(#lanterngrad${p.id})`} stroke="#009900" strokeWidth="0.8" opacity="0.85" />

          {/* Bright core highlight */}
          <rect x="14" y="8" width="28" height="10" fill="none" stroke={`url(#lanterncore${p.id})`} strokeWidth="0.8" opacity="0.7" rx="1" />
          <rect x="18" y="20" width="20" height="10" fill="none" stroke={`url(#lanterncore${p.id})`} strokeWidth="0.8" opacity="0.7" rx="1" />

          {/* Energy lattice pattern */}
          <line x1="20" y1="6" x2="20" y2="32" stroke="#00ff00" strokeWidth="0.4" opacity="0.4" />
          <line x1="28" y1="6" x2="28" y2="32" stroke="#00ff00" strokeWidth="0.4" opacity="0.4" />
          <line x1="36" y1="6" x2="36" y2="32" stroke="#00ff00" strokeWidth="0.4" opacity="0.4" />

          {/* Construct glow edges */}
          <path d="M 10 6 L 46 6" fill="none" stroke="#00ff00" strokeWidth="0.6" opacity="0.5" filter={`url(#lanternglow${p.id})`} />
          <path d="M 14 32 L 42 32" fill="none" stroke="#00ff00" strokeWidth="0.6" opacity="0.5" filter={`url(#lanternglow${p.id})`} />
        </svg>
      );
    } else if (p.type === "aqua_surge") {
      return (
        <svg key={`proj-${p.id}`} width={56} height={44} style={baseStyle} viewBox="0 0 56 44" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`aquagrad${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="50%" stopColor="#0091ea" />
              <stop offset="100%" stopColor="#004ba0" />
            </linearGradient>
            <filter id={`aquaglow${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>
          {/* Main water surge wave */}
          <path d="M 2 22 Q 10 12 18 14 Q 26 8 34 14 Q 42 12 50 18 Q 54 20 54 24 Q 54 26 50 30 Q 42 32 34 30 Q 26 36 18 30 Q 10 32 2 28 Z" fill={`url(#aquagrad${p.id})`} stroke="#0d47a1" strokeWidth="0.8" />
          
          {/* Water splash effect */}
          <path d="M 8 14 Q 12 6 16 12" fill="none" stroke="#00d4ff" strokeWidth="1.2" opacity="0.7" filter={`url(#aquaglow${p.id})`} />
          <path d="M 28 6 Q 32 2 36 8" fill="none" stroke="#00d4ff" strokeWidth="1.2" opacity="0.7" filter={`url(#aquaglow${p.id})`} />
          <path d="M 44 14 Q 48 8 52 14" fill="none" stroke="#00d4ff" strokeWidth="1.2" opacity="0.7" filter={`url(#aquaglow${p.id})`} />
          
          {/* Water droplets */}
          <circle cx="15" cy="10" r="1.2" fill="#00d4ff" opacity="0.8" />
          <circle cx="32" cy="6" r="1" fill="#00d4ff" opacity="0.7" />
          <circle cx="48" cy="12" r="1.1" fill="#00d4ff" opacity="0.7" />
          
          {/* Water shimmer top */}
          <path d="M 5 18 Q 15 16 25 18 Q 35 16 45 19" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.5" />
        </svg>
      );
    } else if (p.type === "kryptonite_pulse") {
      // Kryptonite Pulse: Jagged green crystal shard - vertical
      return (
        <svg key={`proj-${p.id}`} width={52} height={68} style={baseStyle} viewBox="0 0 52 68" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`kryptonitegrad${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ccffcc" />
              <stop offset="30%" stopColor="#00ff00" />
              <stop offset="60%" stopColor="#00dd00" />
              <stop offset="100%" stopColor="#009900" />
            </linearGradient>
            <linearGradient id={`kryptonitecore${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#ccffcc" />
              <stop offset="100%" stopColor="#00ff00" />
            </linearGradient>
            <filter id={`kryptoniteglow${p.id}`}><feGaussianBlur stdDeviation="1.2" /></filter>
          </defs>

          {/* Main crystal shard - sharp pointed top */}
          <polygon points="26,2 34,16 32,20 40,36 26,44 12,36 20,20 18,16" fill={`url(#kryptonitegrad${p.id})`} stroke="#009900" strokeWidth="0.8" opacity="0.95" />

          {/* Lower crystal extension */}
          <polygon points="20,44 32,54 26,62 20,54" fill={`url(#kryptonitegrad${p.id})`} stroke="#009900" strokeWidth="0.8" opacity="0.9" />

          {/* Inner bright core */}
          <polygon points="26,4 32,14 30,20 38,34 26,42 14,34 22,20 20,14" fill="none" stroke={`url(#kryptonitecore${p.id})`} strokeWidth="0.8" opacity="0.8" />

          {/* Crystal facets - light reflection */}
          <line x1="26" y1="2" x2="26" y2="20" stroke="#ffffff" strokeWidth="0.6" opacity="0.6" filter={`url(#kryptoniteglow${p.id})`} />
          <line x1="34" y1="16" x2="40" y2="36" stroke="#ccffcc" strokeWidth="0.5" opacity="0.5" />
          <line x1="18" y1="16" x2="12" y2="36" stroke="#ccffcc" strokeWidth="0.5" opacity="0.5" />

          {/* Radioactive pulses */}
          <circle cx="26" cy="40" r="18" fill="none" stroke="#00ff00" strokeWidth="0.6" opacity="0.4" filter={`url(#kryptoniteglow${p.id})`} />
          <circle cx="26" cy="40" r="12" fill="none" stroke="#00ff00" strokeWidth="0.5" opacity="0.3" />

          {/* Energy emanation points */}
          <circle cx="26" cy="2" r="1.2" fill="#00ff00" opacity="0.9" filter={`url(#kryptoniteglow${p.id})`} />
          <circle cx="40" cy="36" r="1" fill="#00ff00" opacity="0.8" />
          <circle cx="12" cy="36" r="1" fill="#00ff00" opacity="0.8" />
        </svg>
      );
    } else if (p.type === "dark_side") {
      // Dark Side: Dark corrupted energy orb with evil aura and tendrils
      return (
        <svg key={`proj-${p.id}`} width={52} height={60} style={baseStyle} viewBox="0 0 52 60" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`darksidegrad${p.id}`} cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#330000" />
              <stop offset="50%" stopColor="#110000" />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>
            <radialGradient id={`darksidecor e${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff3333" />
              <stop offset="100%" stopColor="#660000" />
            </radialGradient>
            <filter id={`darksideglow${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>

          {/* Main dark orb */}
          <circle cx="26" cy="26" r="18" fill={`url(#darksidegrad${p.id})`} opacity="0.95" />

          {/* Dark mist aura */}
          <circle cx="26" cy="26" r="22" fill="none" stroke="#330000" strokeWidth="1" opacity="0.6" filter={`url(#darksideglow${p.id})`} />
          <circle cx="26" cy="26" r="20" fill="none" stroke="#1a0000" strokeWidth="0.8" opacity="0.4" />

          {/* Corrupting tendrils descending */}
          <path d="M 18 44 Q 14 48 16 56" fill="none" stroke="#ff3333" strokeWidth="0.8" opacity="0.7" filter={`url(#darksideglow${p.id})`} />
          <path d="M 26 44 Q 26 50 26 58" fill="none" stroke="#ff3333" strokeWidth="0.8" opacity="0.7" filter={`url(#darksideglow${p.id})`} />
          <path d="M 34 44 Q 38 48 36 56" fill="none" stroke="#ff3333" strokeWidth="0.8" opacity="0.7" filter={`url(#darksideglow${p.id})`} />

          {/* Evil eye glow at center */}
          <circle cx="26" cy="26" r="6" fill="none" stroke="#ff6666" strokeWidth="0.8" opacity="0.6" filter={`url(#darksideglow${p.id})`} />
          <circle cx="26" cy="26" r="3" fill="#ff3333" opacity="0.75" />

          {/* Corruption wisps around orb */}
          <path d="M 22 16 Q 18 14 16 18" fill="none" stroke="#ff3333" strokeWidth="0.6" opacity="0.5" />
          <path d="M 30 14 Q 34 12 36 16" fill="none" stroke="#ff3333" strokeWidth="0.6" opacity="0.5" />
          <path d="M 20 36 Q 16 38 14 34" fill="none" stroke="#ff3333" strokeWidth="0.6" opacity="0.5" />
          <path d="M 32 38 Q 36 40 38 36" fill="none" stroke="#ff3333" strokeWidth="0.6" opacity="0.5" />

          {/* Dark energy particles */}
          <circle cx="16" cy="20" r="0.8" fill="#ff3333" opacity="0.6" />
          <circle cx="36" cy="20" r="0.8" fill="#ff3333" opacity="0.6" />
          <circle cx="16" cy="32" r="0.7" fill="#ff3333" opacity="0.5" />
          <circle cx="36" cy="32" r="0.7" fill="#ff3333" opacity="0.5" />
        </svg>
      );
    } else if (p.type === "cyborg_cannon") {
      return (
        <svg key={`proj-${p.id}`} width={50} height={40} style={baseStyle} viewBox="0 0 50 40" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`cyborg${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="50%" stopColor="#0048a3" />
              <stop offset="100%" stopColor="#0d47a1" />
            </linearGradient>
          </defs>
          <polygon points="25,4 40,16 35,20 45,36 25,26 5,36 15,20 10,16" fill={`url(#cyborg${p.id})`} stroke="#0048a3" strokeWidth="1" />
          <circle cx="30" cy="16" r="2" fill="#00d4ff" opacity="0.9" />
          <circle cx="20" cy="16" r="2" fill="#00d4ff" opacity="0.9" />
        </svg>
      );
    } else if (p.type === "crow_strike") {
      return (
        <svg key={`proj-${p.id}`} width={48} height={44} style={baseStyle} viewBox="0 0 48 44" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`crow${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffff00" />
              <stop offset="50%" stopColor="#ff8800" />
              <stop offset="100%" stopColor="#ff3300" />
            </linearGradient>
          </defs>
          <polygon points="24,2 34,12 28,20 36,34 24,24 12,34 20,20 14,12" fill={`url(#crow${p.id})`} stroke="#ff3300" strokeWidth="1" />
          <circle cx="28" cy="14" r="1.5" fill="#ffffff" opacity="0.9" />
        </svg>
      );
    // DRAGON BALL Z POWERS
    } else if (p.type === "solar_flare") {
      return (
        <svg key={`proj-${p.id}`} width={56} height={56} style={baseStyle} viewBox="0 0 56 56" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`solar${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffff00" />
              <stop offset="40%" stopColor="#ffcc00" />
              <stop offset="100%" stopColor="#ff9900" />
            </radialGradient>
            <filter id={`solarblur${p.id}`}><feGaussianBlur stdDeviation="3" /></filter>
          </defs>
          <circle cx="28" cy="28" r="24" fill={`url(#solar${p.id})`} />
          <circle cx="28" cy="28" r="20" fill="none" stroke="#ffff00" strokeWidth="2" opacity="0.7" />
          <circle cx="28" cy="28" r="16" fill="none" stroke="#ffcc00" strokeWidth="1" opacity="0.4" />
          <polygon points="28,8 38,16 36,28 38,40 28,48 18,40 20,28 18,16" fill="none" stroke="#ffff00" strokeWidth="1" opacity="0.5" />
          <circle cx="28" cy="28" r="12" fill="#ffffff" filter={`url(#solarblur${p.id})`} opacity="0.8" />
        </svg>
      );
    } else if (p.type === "galick_gun") {
      return (
        <svg key={`proj-${p.id}`} width={100} height={36} style={baseStyle} viewBox="0 0 100 36" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`galickbeam${p.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#9933ff" />
              <stop offset="50%" stopColor="#6600ff" />
              <stop offset="100%" stopColor="#3333cc" />
            </linearGradient>
            <radialGradient id={`galickcore${p.id}`} cx="30%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#cc99ff" />
              <stop offset="100%" stopColor="#6600ff" />
            </radialGradient>
            <filter id={`galickglow${p.id}`}><feGaussianBlur stdDeviation="2" /></filter>
          </defs>
          {/* Main beam body - double diverging polygons */}
          <polygon points="8,14 35,8 90,6 92,8 35,12 8,14" fill={`url(#galickbeam${p.id})`} stroke="#cc99ff" strokeWidth="0.8" opacity="0.9" filter={`url(#galickglow${p.id})`} />
          <polygon points="8,22 35,24 90,30 92,28 35,24 8,22" fill={`url(#galickbeam${p.id})`} stroke="#cc99ff" strokeWidth="0.8" opacity="0.9" filter={`url(#galickglow${p.id})`} />

          {/* Energy swirls within beam */}
          <path d="M 15,18 Q 25,10 40,8" fill="none" stroke="#ffffff" strokeWidth="0.6" opacity="0.6" />
          <path d="M 20,18 Q 35,20 55,26" fill="none" stroke="#ffffff" strokeWidth="0.6" opacity="0.6" />
          <path d="M 45,12 Q 65,8 85,10" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
          <path d="M 50,24 Q 70,28 90,26" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />

          {/* Explosive wave rings from center */}
          <circle cx="30" cy="18" r="4" fill="none" stroke="#cc99ff" strokeWidth="0.8" opacity="0.7" />
          <circle cx="30" cy="18" r="8" fill="none" stroke="#cc99ff" strokeWidth="0.5" opacity="0.4" />
          <circle cx="60" cy="18" r="5" fill="none" stroke="#cc99ff" strokeWidth="0.7" opacity="0.6" />
          <circle cx="80" cy="18" r="6" fill="none" stroke="#cc99ff" strokeWidth="0.6" opacity="0.5" />

          {/* Core bright center */}
          <ellipse cx="28" cy="18" rx="5" ry="6" fill={`url(#galickcore${p.id})`} opacity="0.85" filter={`url(#galickglow${p.id})`} />
        </svg>
      );
    } else if (p.type === "destructo_disk") {
      const rotation = (Date.now() * 2) % 360;
      return (
        <svg key={`proj-${p.id}`} width={42} height={42} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${rotation}deg)`}} viewBox="0 0 42 42" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`destructo${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffff00" />
              <stop offset="50%" stopColor="#ff6600" />
              <stop offset="100%" stopColor="#ff0000" />
            </radialGradient>
          </defs>
          <circle cx="21" cy="21" r="18" fill={`url(#destructo${p.id})`} />
          <circle cx="21" cy="21" r="16" fill="none" stroke="#ff6600" strokeWidth="1.5" opacity="0.7" />
          <polygon points="21,3 33,9 39,21 33,33 21,39 9,33 3,21 9,9" fill="none" stroke="#ffff00" strokeWidth="1" opacity="0.6" />
        </svg>
      );
    } else if (p.type === "special_beam") {
      return (
        <svg key={`proj-${p.id}`} width={70} height={40} style={baseStyle} viewBox="0 0 70 40" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`specialbeam${p.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#ff00ff" />
              <stop offset="50%" stopColor="#cc00ff" />
              <stop offset="100%" stopColor="#6600ff" />
            </linearGradient>
            <radialGradient id={`specialbeamcore${p.id}`} cx="20%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#ff99ff" />
              <stop offset="100%" stopColor="#cc00ff" />
            </radialGradient>
            <filter id={`specialbeamglow${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>
          {/* Focused beam cone - very tight and piercing */}
          <polygon points="8,16 12,14 60,18 65,20 60,22 12,26 8,24" fill={`url(#specialbeam${p.id})`} stroke="#ff99ff" strokeWidth="0.8" opacity="0.95" filter={`url(#specialbeamglow${p.id})`} />

          {/* Concentrating energy threads */}
          <path d="M 10,18 L 25,16 L 50,18" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.7" />
          <path d="M 10,22 L 25,24 L 50,22" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.7" />
          <path d="M 15,18 Q 35,15 60,18" fill="none" stroke="#ffffff" strokeWidth="0.4" opacity="0.5" />
          <path d="M 15,22 Q 35,25 60,22" fill="none" stroke="#ffffff" strokeWidth="0.4" opacity="0.5" />

          {/* Piercing point at front */}
          <polygon points="65,20 68,19 68,21" fill="#ffffff" opacity="0.9" />

          {/* Tight spiral compression */}
          <circle cx="18" cy="20" r="2.5" fill="none" stroke="#ff99ff" strokeWidth="0.7" opacity="0.6" />
          <circle cx="28" cy="20" r="3.5" fill="none" stroke="#ff99ff" strokeWidth="0.6" opacity="0.5" />
          <circle cx="42" cy="20" r="4" fill="none" stroke="#ff99ff" strokeWidth="0.5" opacity="0.4" />

          {/* Core bright beam */}
          <ellipse cx="16" cy="20" rx="3" ry="3.5" fill={`url(#specialbeamcore${p.id})`} opacity="0.8" filter={`url(#specialbeamglow${p.id})`} />
        </svg>
      );
    } else if (p.type === "final_flash") {
      return (
        <svg key={`proj-${p.id}`} width={120} height={44} style={baseStyle} viewBox="0 0 120 44" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`finalflashbeam${p.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#ffff00" />
              <stop offset="40%" stopColor="#ff9900" />
              <stop offset="80%" stopColor="#0066ff" />
              <stop offset="100%" stopColor="#0033cc" />
            </linearGradient>
            <radialGradient id={`finalflashcore${p.id}`} cx="25%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#ffff99" />
              <stop offset="70%" stopColor="#0066ff" />
              <stop offset="100%" stopColor="#0033cc" />
            </radialGradient>
            <filter id={`finalflashglow${p.id}`}><feGaussianBlur stdDeviation="2.5" /></filter>
          </defs>
          {/* Massive diverging beam - ultimate attack */}
          <polygon points="10,16 40,8 110,6 115,10 110,14 40,14 10,16" fill={`url(#finalflashbeam${p.id})`} stroke="#ffff99" strokeWidth="1" opacity="0.95" filter={`url(#finalflashglow${p.id})`} />
          <polygon points="10,28 40,30 110,30 115,34 110,38 40,30 10,28" fill={`url(#finalflashbeam${p.id})`} stroke="#ffff99" strokeWidth="1" opacity="0.95" filter={`url(#finalflashglow${p.id})`} />

          {/* Explosive energy waves throughout */}
          <path d="M 20,22 Q 35,12 55,10" fill="none" stroke="#ffffff" strokeWidth="0.7" opacity="0.7" />
          <path d="M 25,22 Q 45,18 75,12" fill="none" stroke="#ffffff" strokeWidth="0.6" opacity="0.6" />
          <path d="M 30,22 Q 55,28 90,32" fill="none" stroke="#ffffff" strokeWidth="0.6" opacity="0.6" />
          <path d="M 20,22 Q 50,10 100,8" fill="none" stroke="#ffff99" strokeWidth="0.5" opacity="0.5" />
          <path d="M 25,22 Q 60,32 110,34" fill="none" stroke="#ffff99" strokeWidth="0.5" opacity="0.5" />

          {/* Multiple explosion rings - building power */}
          <circle cx="35" cy="22" r="5" fill="none" stroke="#ffff99" strokeWidth="0.9" opacity="0.7" />
          <circle cx="35" cy="22" r="10" fill="none" stroke="#ffff99" strokeWidth="0.6" opacity="0.4" />
          <circle cx="65" cy="22" r="6" fill="none" stroke="#ffff99" strokeWidth="0.8" opacity="0.6" />
          <circle cx="65" cy="22" r="12" fill="none" stroke="#ffff99" strokeWidth="0.5" opacity="0.3" />
          <circle cx="95" cy="22" r="7" fill="none" stroke="#ffff99" strokeWidth="0.7" opacity="0.5" />

          {/* Intense bright core */}
          <ellipse cx="32" cy="22" rx="6" ry="8" fill={`url(#finalflashcore${p.id})`} opacity="0.9" filter={`url(#finalflashglow${p.id})`} />
        </svg>
      );
    } else if (p.type === "spirit_ball") {
      const rotation = (Date.now() * 0.8) % 360;
      return (
        <svg key={`proj-${p.id}`} width={44} height={44} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${rotation}deg)`}} viewBox="0 0 44 44" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`spiritball${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffff00" />
              <stop offset="50%" stopColor="#ff9900" />
              <stop offset="100%" stopColor="#ff3300" />
            </radialGradient>
          </defs>
          <circle cx="22" cy="22" r="18" fill={`url(#spiritball${p.id})`} />
          <circle cx="22" cy="22" r="16" fill="none" stroke="#ff9900" strokeWidth="1.5" opacity="0.6" />
          <path d="M 22 6 Q 30 12 32 22 Q 30 32 22 38 Q 14 32 12 22 Q 14 12 22 6" fill="none" stroke="#ffff00" strokeWidth="1" opacity="0.5" />
        </svg>
      );
    } else if (p.type === "dodon_ray") {
      return (
        <svg key={`proj-${p.id}`} width={48} height={40} style={baseStyle} viewBox="0 0 48 40" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`dodon${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ff0000" />
              <stop offset="50%" stopColor="#ff6600" />
              <stop offset="100%" stopColor="#ffaa00" />
            </linearGradient>
          </defs>
          <polygon points="24,4 36,14 32,20 40,36 24,26 8,36 16,20 12,14" fill={`url(#dodon${p.id})`} stroke="#ff0000" strokeWidth="1" />
          <circle cx="28" cy="16" r="2" fill="#ffffff" opacity="0.9" />
        </svg>
      );
    } else if (p.type === "potential_unlock") {
      const rotation = (Date.now() * 0.9) % 360;
      return (
        <svg key={`proj-${p.id}`} width={56} height={56} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${rotation}deg)`}} viewBox="0 0 56 56" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`potentialyellow${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#ffff99" />
              <stop offset="100%" stopColor="#ffcc00" />
            </radialGradient>
            <filter id={`potentialglow${p.id}`}><feGaussianBlur stdDeviation="2" /></filter>
          </defs>
          {/* Central unleashed power core */}
          <circle cx="28" cy="28" r="8" fill={`url(#potentialyellow${p.id})`} opacity="0.9" filter={`url(#potentialglow${p.id})`} />
          <circle cx="28" cy="28" r="6" fill="#ffffff" opacity="0.7" />

          {/* 8 radiating energy beams unlocking potential */}
          <line x1="28" y1="8" x2="28" y2="2" stroke="#ffff99" strokeWidth="1.5" opacity="0.8" />
          <line x1="28" y1="48" x2="28" y2="54" stroke="#ffff99" strokeWidth="1.5" opacity="0.8" />
          <line x1="8" y1="28" x2="2" y2="28" stroke="#ffff99" strokeWidth="1.5" opacity="0.8" />
          <line x1="48" y1="28" x2="54" y2="28" stroke="#ffff99" strokeWidth="1.5" opacity="0.8" />
          <line x1="15" y1="15" x2="11" y2="11" stroke="#ffff99" strokeWidth="1.2" opacity="0.7" />
          <line x1="41" y1="41" x2="45" y2="45" stroke="#ffff99" strokeWidth="1.2" opacity="0.7" />
          <line x1="41" y1="15" x2="45" y2="11" stroke="#ffff99" strokeWidth="1.2" opacity="0.7" />
          <line x1="15" y1="41" x2="11" y2="45" stroke="#ffff99" strokeWidth="1.2" opacity="0.7" />

          {/* Potential energy aura rings */}
          <circle cx="28" cy="28" r="14" fill="none" stroke="#ffff99" strokeWidth="0.8" opacity="0.6" />
          <circle cx="28" cy="28" r="20" fill="none" stroke="#ffff99" strokeWidth="0.6" opacity="0.4" />

          {/* Unlocking spark particles */}
          <circle cx="22" cy="12" r="0.8" fill="#ffff99" opacity="0.7" />
          <circle cx="34" cy="14" r="0.7" fill="#ffff99" opacity="0.6" />
          <circle cx="14" cy="22" r="0.8" fill="#ffff99" opacity="0.7" />
          <circle cx="42" cy="20" r="0.7" fill="#ffff99" opacity="0.6" />
          <circle cx="42" cy="36" r="0.8" fill="#ffff99" opacity="0.7" />
          <circle cx="34" cy="44" r="0.7" fill="#ffff99" opacity="0.6" />
          <circle cx="22" cy="46" r="0.8" fill="#ffff99" opacity="0.7" />
          <circle cx="14" cy="36" r="0.7" fill="#ffff99" opacity="0.6" />
        </svg>
      );
    // NARUTO POWERS (continuing in next section...)
    } else if (p.type === "sand_shield") {
      return (
        <svg key={`proj-${p.id}`} width={52} height={48} style={baseStyle} viewBox="0 0 52 48" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`sandgrad${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e8b87e" />
              <stop offset="50%" stopColor="#cc9966" />
              <stop offset="100%" stopColor="#996633" />
            </radialGradient>
            <filter id={`sandblur${p.id}`}><feGaussianBlur stdDeviation="1.2" /></filter>
          </defs>
          {/* Shield dome shape */}
          <path d="M 4 26 Q 8 8 26 4 Q 44 8 48 26 Q 44 40 26 44 Q 8 40 4 26" fill={`url(#sandgrad${p.id})`} stroke="#996633" strokeWidth="0.8" />
          
          {/* Sand particles scattered around shield */}
          <circle cx="8" cy="16" r="1.8" fill="#e8b87e" opacity="0.8" filter={`url(#sandblur${p.id})`} />
          <circle cx="14" cy="10" r="1.5" fill="#d4a574" opacity="0.7" />
          <circle cx="22" cy="8" r="1.6" fill="#e8b87e" opacity="0.8" />
          <circle cx="30" cy="10" r="1.4" fill="#d4a574" opacity="0.7" />
          <circle cx="38" cy="14" r="1.7" fill="#e8b87e" opacity="0.8" />
          <circle cx="44" cy="20" r="1.5" fill="#d4a574" opacity="0.7" />
          
          {/* Inner shield layer */}
          <path d="M 8 26 Q 12 12 26 8 Q 40 12 44 26 Q 40 36 26 40 Q 12 36 8 26" fill="none" stroke="#e8b87e" strokeWidth="1.2" opacity="0.6" />
          
          {/* Sand swirl effect */}
          <path d="M 18 18 Q 26 14 34 18" fill="none" stroke="#d4a574" strokeWidth="1" opacity="0.5" filter={`url(#sandblur${p.id})`} />
          <path d="M 18 34 Q 26 38 34 34" fill="none" stroke="#d4a574" strokeWidth="1" opacity="0.5" filter={`url(#sandblur${p.id})`} />
        </svg>
      );
    } else if (p.type === "paper_storm") {
      // Paper Storm: Spinning sheets of paper in a whirlwind pattern
      const rotation = (Date.now() * 1.5) % 360; // Fast spinning for paper storm
      return (
        <svg key={`proj-${p.id}`} width={60} height={56} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${rotation}deg)`}} viewBox="0 0 60 56" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`paper${p.id}`} x1="0" x2="1" y1="0.2" y2="0.8">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#f0f0f0" />
              <stop offset="100%" stopColor="#d0d0d0" />
            </linearGradient>
            <linearGradient id={`papershad${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#e8e8e8" />
              <stop offset="100%" stopColor="#b0b0b0" />
            </linearGradient>
            <filter id={`papershadow${p.id}`}>
              <feDropShadow dx="0.8" dy="0.8" stdDeviation="0.8" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Center whirlwind vortex */}
          <circle cx="30" cy="28" r="4" fill="#f5f5f5" opacity="0.8" />
          <circle cx="30" cy="28" r="6" fill="none" stroke="#cccccc" strokeWidth="0.5" opacity="0.4" />
          <circle cx="30" cy="28" r="10" fill="none" stroke="#dddddd" strokeWidth="0.3" opacity="0.3" />

          {/* Large paper sheet - top/center */}
          <g opacity="0.9" filter={`url(#papershadow${p.id})`}>
            <rect x="16" y="4" width="28" height="18" fill={`url(#paper${p.id})`} stroke="#999999" strokeWidth="0.6" rx="1.5" />
            <line x1="18" y1="4" x2="18" y2="22" stroke="#e0e0e0" strokeWidth="0.3" opacity="0.5" />
            <line x1="24" y1="4" x2="24" y2="22" stroke="#e0e0e0" strokeWidth="0.3" opacity="0.5" />
            <line x1="30" y1="4" x2="30" y2="22" stroke="#e0e0e0" strokeWidth="0.3" opacity="0.5" />
            <line x1="36" y1="4" x2="36" y2="22" stroke="#e0e0e0" strokeWidth="0.3" opacity="0.5" />
            <line x1="42" y1="4" x2="42" y2="22" stroke="#e0e0e0" strokeWidth="0.3" opacity="0.5" />
          </g>

          {/* Medium paper sheet - left side */}
          <g opacity="0.75" filter={`url(#papershadow${p.id})`}>
            <rect x="2" y="20" width="22" height="14" fill={`url(#papershad${p.id})`} stroke="#888888" strokeWidth="0.5" rx="1" />
            <line x1="5" y1="20" x2="5" y2="34" stroke="#d0d0d0" strokeWidth="0.3" opacity="0.4" />
            <line x1="10" y1="20" x2="10" y2="34" stroke="#d0d0d0" strokeWidth="0.3" opacity="0.4" />
            <line x1="15" y1="20" x2="15" y2="34" stroke="#d0d0d0" strokeWidth="0.3" opacity="0.4" />
            <line x1="20" y1="20" x2="20" y2="34" stroke="#d0d0d0" strokeWidth="0.3" opacity="0.4" />
          </g>

          {/* Medium paper sheet - right side */}
          <g opacity="0.75" filter={`url(#papershadow${p.id})`}>
            <rect x="36" y="20" width="22" height="14" fill={`url(#papershad${p.id})`} stroke="#888888" strokeWidth="0.5" rx="1" />
            <line x1="39" y1="20" x2="39" y2="34" stroke="#d0d0d0" strokeWidth="0.3" opacity="0.4" />
            <line x1="44" y1="20" x2="44" y2="34" stroke="#d0d0d0" strokeWidth="0.3" opacity="0.4" />
            <line x1="49" y1="20" x2="49" y2="34" stroke="#d0d0d0" strokeWidth="0.3" opacity="0.4" />
          </g>

          {/* Small paper sheet - bottom left */}
          <g opacity="0.6" filter={`url(#papershadow${p.id})`}>
            <rect x="6" y="38" width="16" height="12" fill={`url(#paper${p.id})`} stroke="#777777" strokeWidth="0.4" rx="0.8" />
            <line x1="9" y1="38" x2="9" y2="50" stroke="#e0e0e0" strokeWidth="0.2" opacity="0.3" />
            <line x1="13" y1="38" x2="13" y2="50" stroke="#e0e0e0" strokeWidth="0.2" opacity="0.3" />
          </g>

          {/* Small paper sheet - bottom right */}
          <g opacity="0.6" filter={`url(#papershadow${p.id})`}>
            <rect x="38" y="38" width="16" height="12" fill={`url(#paper${p.id})`} stroke="#777777" strokeWidth="0.4" rx="0.8" />
            <line x1="41" y1="38" x2="41" y2="50" stroke="#e0e0e0" strokeWidth="0.2" opacity="0.3" />
            <line x1="45" y1="38" x2="45" y2="50" stroke="#e0e0e0" strokeWidth="0.2" opacity="0.3" />
          </g>

          {/* Tiny paper fragments for storm effect */}
          <rect x="8" y="10" width="6" height="4" fill="#e8e8e8" stroke="#aaaaaa" strokeWidth="0.3" opacity="0.5" rx="0.4" />
          <rect x="46" y="12" width="6" height="4" fill="#e8e8e8" stroke="#aaaaaa" strokeWidth="0.3" opacity="0.5" rx="0.4" />
          <rect x="12" y="50" width="5" height="3" fill="#e8e8e8" stroke="#aaaaaa" strokeWidth="0.3" opacity="0.4" rx="0.3" />
          <rect x="44" y="48" width="5" height="3" fill="#e8e8e8" stroke="#aaaaaa" strokeWidth="0.3" opacity="0.4" rx="0.3" />
        </svg>
      );
    } else if (p.type === "needle_barrage") {
      // Needle Barrage: Cluster of sharp metallic needles flying forward
      return (
        <svg key={`proj-${p.id}`} width={52} height={60} style={baseStyle} viewBox="0 0 52 60" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`needle${p.id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f5f5f5" />
              <stop offset="40%" stopColor="#c0c0c0" />
              <stop offset="70%" stopColor="#808080" />
              <stop offset="100%" stopColor="#303030" />
            </linearGradient>
            <filter id={`needlesharp${p.id}`}><feGaussianBlur stdDeviation="0.3" /></filter>
          </defs>
          {/* Main center needle - longest and most prominent */}
          <line x1="26" y1="2" x2="26" y2="58" stroke={`url(#needle${p.id})`} strokeWidth="2.5" strokeLinecap="round" filter={`url(#needlesharp${p.id})`} />
          <polygon points="26,0 29,6 26,8 23,6" fill="#505050" stroke="#303030" strokeWidth="0.3" />

          {/* Upper-left needle cluster */}
          <line x1="14" y1="8" x2="10" y2="45" stroke={`url(#needle${p.id})`} strokeWidth="2" opacity="0.95" />
          <polygon points="10,8 12,14 10,16 8,14" fill="#505050" stroke="#303030" strokeWidth="0.3" />

          {/* Upper-right needle cluster */}
          <line x1="38" y1="8" x2="42" y2="45" stroke={`url(#needle${p.id})`} strokeWidth="2" opacity="0.95" />
          <polygon points="42,8 44,14 42,16 40,14" fill="#505050" stroke="#303030" strokeWidth="0.3" />

          {/* Far left needle */}
          <line x1="6" y1="14" x2="4" y2="52" stroke={`url(#needle${p.id})`} strokeWidth="1.6" opacity="0.85" filter={`url(#needlesharp${p.id})`} />
          <polygon points="4,14 5.5,19 4,21 2.5,19" fill="#505050" stroke="#303030" strokeWidth="0.2" />

          {/* Far right needle */}
          <line x1="46" y1="14" x2="48" y2="52" stroke={`url(#needle${p.id})`} strokeWidth="1.6" opacity="0.85" filter={`url(#needlesharp${p.id})`} />
          <polygon points="48,14 49.5,19 48,21 46.5,19" fill="#505050" stroke="#303030" strokeWidth="0.2" />

          {/* Back-left needle */}
          <line x1="18" y1="16" x2="15" y2="55" stroke={`url(#needle${p.id})`} strokeWidth="1.5" opacity="0.8" />

          {/* Back-right needle */}
          <line x1="34" y1="16" x2="37" y2="55" stroke={`url(#needle${p.id})`} strokeWidth="1.5" opacity="0.8" />

          {/* Reflective highlights on main needles */}
          <line x1="26.8" y1="8" x2="26.8" y2="50" stroke="#ffffff" strokeWidth="0.6" opacity="0.8" />
          <line x1="14.6" y1="15" x2="10.6" y2="40" stroke="#ffffff" strokeWidth="0.4" opacity="0.6" />
          <line x1="37.4" y1="15" x2="41.4" y2="40" stroke="#ffffff" strokeWidth="0.4" opacity="0.6" />
        </svg>
      );
    } else if (p.type === "genjutsu_trap") {
      const rotation = (Date.now() * 0.7) % 360;
      return (
        <svg key={`proj-${p.id}`} width={50} height={50} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${rotation}deg)`}} viewBox="0 0 50 50" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`genjutsu${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff0066" />
              <stop offset="50%" stopColor="#cc0044" />
              <stop offset="100%" stopColor="#990033" />
            </radialGradient>
            <filter id={`genjutsuglitch${p.id}`}><feGaussianBlur stdDeviation="0.8" /></filter>
          </defs>
          {/* Hypnotic concentric circles */}
          <circle cx="25" cy="25" r="20" fill="none" stroke="#ff0066" strokeWidth="2" opacity="0.9" />
          <circle cx="25" cy="25" r="16" fill="none" stroke="#ff0066" strokeWidth="1.5" opacity="0.7" />
          <circle cx="25" cy="25" r="12" fill="none" stroke="#ff0066" strokeWidth="1" opacity="0.6" />
          <circle cx="25" cy="25" r="8" fill="none" stroke="#ff0066" strokeWidth="1" opacity="0.5" />
          {/* Spiral lines for illusion effect */}
          <path d="M 25 7 Q 35 15, 30 25" fill="none" stroke="#ff0066" strokeWidth="0.8" opacity="0.7" filter={`url(#genjutsuglitch${p.id})`} />
          <path d="M 25 43 Q 35 35, 30 25" fill="none" stroke="#ff0066" strokeWidth="0.8" opacity="0.7" filter={`url(#genjutsuglitch${p.id})`} />
          <path d="M 7 25 Q 15 35, 25 30" fill="none" stroke="#ff0066" strokeWidth="0.8" opacity="0.7" filter={`url(#genjutsuglitch${p.id})`} />
          <path d="M 43 25 Q 35 35, 25 30" fill="none" stroke="#ff0066" strokeWidth="0.8" opacity="0.7" filter={`url(#genjutsuglitch${p.id})`} />
          {/* Center hypnotic center */}
          <circle cx="25" cy="25" r="3" fill="#ff0066" opacity="0.9" />
        </svg>
      );
    } else if (p.type === "wind_blade") {
      // Wind Blade: Sharp cutting wind slashes
      return (
        <svg key={`proj-${p.id}`} width={60} height={32} style={baseStyle} viewBox="0 0 60 32" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`windblade${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#00ff99" />
              <stop offset="50%" stopColor="#00cc88" />
              <stop offset="100%" stopColor="#009966" />
            </linearGradient>
            <filter id={`windblur${p.id}`}><feGaussianBlur stdDeviation="1" /></filter>
          </defs>
          {/* Main wind slash */}
          <path d="M 2 16 Q 15 8 30 4 Q 45 2 58 6" fill="none" stroke={`url(#windblade${p.id})`} strokeWidth="3" />
          {/* Secondary slash below */}
          <path d="M 4 22 Q 18 28 32 30 Q 46 31 58 28" fill="none" stroke={`url(#windblade${p.id})`} strokeWidth="2" opacity="0.8" />
          {/* Wind particle dots */}
          <circle cx="15" cy="10" r="1" fill="#00ff99" opacity="0.7" />
          <circle cx="25" cy="6" r="1.2" fill="#00ff99" opacity="0.8" />
          <circle cx="35" cy="8" r="1" fill="#00ff99" opacity="0.7" />
          <circle cx="45" cy="5" r="1.3" fill="#00ff99" opacity="0.8" />
          <circle cx="18" cy="26" r="1" fill="#00ff99" opacity="0.6" />
          <circle cx="28" cy="29" r="1.2" fill="#00ff99" opacity="0.7" />
          <circle cx="40" cy="28" r="1" fill="#00ff99" opacity="0.6" />
          {/* Wind aura */}
          <path d="M 2 16 Q 15 8 30 4 Q 45 2 58 6" fill="none" stroke="#00ff99" strokeWidth="1" opacity="0.4" filter={`url(#windblur${p.id})`} />
        </svg>
      );
    } else if (p.type === "earth_spear") {
      // Earth Spear: Actual spear made of rocky earth with pointed tip
      return (
        <svg key={`proj-${p.id}`} width={56} height={52} style={baseStyle} viewBox="0 0 56 52" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`earth${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#a9967c" />
              <stop offset="40%" stopColor="#8b7355" />
              <stop offset="70%" stopColor="#654321" />
              <stop offset="100%" stopColor="#3d2817" />
            </linearGradient>
            <linearGradient id={`earthtip${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#d4a574" />
              <stop offset="50%" stopColor="#b8956a" />
              <stop offset="100%" stopColor="#7d6043" />
            </linearGradient>
            <filter id={`earthglow${p.id}`}><feGaussianBlur stdDeviation="0.8" /></filter>
          </defs>

          {/* Spear tip - sharp pointed rock */}
          <polygon points="28,2 35,12 28,10 21,12" fill={`url(#earthtip${p.id})`} stroke="#4a3728" strokeWidth="0.5" />

          {/* Main spearhead shaft */}
          <polygon points="24,10 32,10 34,36 28,40 22,36" fill={`url(#earth${p.id})`} stroke="#4a3728" strokeWidth="0.6" />

          {/* Rocky texture on shaft */}
          <circle cx="26" cy="18" r="1.5" fill="#654321" opacity="0.6" />
          <circle cx="30" cy="22" r="1.2" fill="#654321" opacity="0.5" />
          <circle cx="27" cy="28" r="1.4" fill="#654321" opacity="0.6" />
          <circle cx="31" cy="32" r="1.3" fill="#654321" opacity="0.5" />

          {/* Cracks in stone for detail */}
          <line x1="24" y1="14" x2="26" y2="22" stroke="#3d2817" strokeWidth="0.4" opacity="0.5" />
          <line x1="32" y1="16" x2="30" y2="24" stroke="#3d2817" strokeWidth="0.4" opacity="0.5" />
          <line x1="28" y1="26" x2="28" y2="35" stroke="#3d2817" strokeWidth="0.3" opacity="0.4" />

          {/* Edge highlights - left side */}
          <line x1="24" y1="12" x2="22" y2="36" stroke="#d4a574" strokeWidth="0.6" opacity="0.5" filter={`url(#earthglow${p.id})`} />

          {/* Edge highlights - right side */}
          <line x1="32" y1="12" x2="34" y2="36" stroke="#8b7355" strokeWidth="0.6" opacity="0.4" />

          {/* Sharp point emphasis */}
          <line x1="28" y1="2" x2="28" y2="12" stroke="#e8c99e" strokeWidth="0.8" opacity="0.6" filter={`url(#earthglow${p.id})`} />

          {/* Root-like protrusions from shaft */}
          <line x1="22" y1="20" x2="18" y2="24" stroke="#654321" strokeWidth="0.8" opacity="0.5" />
          <line x1="34" y1="24" x2="38" y2="28" stroke="#654321" strokeWidth="0.8" opacity="0.5" />
        </svg>
      );
    } else if (p.type === "lightning_cage") {
      return (
        <svg key={`proj-${p.id}`} width={48} height={48} style={baseStyle} viewBox="0 0 48 48" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`cagegrad${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffff99" />
              <stop offset="50%" stopColor="#ffff00" />
              <stop offset="100%" stopColor="#ffcc00" />
            </linearGradient>
            <filter id={`cageglow${p.id}`}><feGaussianBlur stdDeviation="1.2" /></filter>
          </defs>
          {/* Outer cage bars - hexagon */}
          <polygon points="24,6 40,14 40,34 24,42 8,34 8,14" fill="none" stroke={`url(#cagegrad${p.id})`} strokeWidth="2" />
          {/* Inner cage bars - vertical */}
          <line x1="24" y1="6" x2="24" y2="42" stroke={`url(#cagegrad${p.id})`} strokeWidth="1.5" opacity="0.8" />
          <line x1="16" y1="8" x2="16" y2="40" stroke={`url(#cagegrad${p.id})`} strokeWidth="1" opacity="0.6" />
          <line x1="32" y1="8" x2="32" y2="40" stroke={`url(#cagegrad${p.id})`} strokeWidth="1" opacity="0.6" />
          {/* Inner cage bars - horizontal */}
          <line x1="10" y1="20" x2="38" y2="20" stroke={`url(#cagegrad${p.id})`} strokeWidth="1" opacity="0.6" />
          <line x1="10" y1="28" x2="38" y2="28" stroke={`url(#cagegrad${p.id})`} strokeWidth="1" opacity="0.6" />
          {/* Lightning arcs inside cage */}
          <path d="M 18 15 Q 24 18 30 15" fill="none" stroke="#ffff00" strokeWidth="1.2" opacity="0.7" filter={`url(#cageglow${p.id})`} />
          <path d="M 18 33 Q 24 30 30 33" fill="none" stroke="#ffff00" strokeWidth="1.2" opacity="0.7" filter={`url(#cageglow${p.id})`} />
          {/* Center energy */}
          <circle cx="24" cy="24" r="4" fill="#ffff00" opacity="0.9" filter={`url(#cageglow${p.id})`} />
        </svg>
      );
    } else if (p.type === "ice_crystal") {
      return (
        <svg key={`proj-${p.id}`} width={48} height={56} style={baseStyle} viewBox="0 0 48 56" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`icecrystalgrad${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#e8f7ff" />
              <stop offset="50%" stopColor="#80e1ff" />
              <stop offset="100%" stopColor="#0095d4" />
            </linearGradient>
            <filter id={`iceglint${p.id}`}><feGaussianBlur stdDeviation="0.8" /></filter>
          </defs>
          {/* Main crystal spike */}
          <polygon points="24,2 32,16 28,24 36,50 24,34 12,50 20,24 16,16" fill={`url(#icecrystalgrad${p.id})`} stroke="#0288d1" strokeWidth="1" />
          
          {/* Inner light reflection */}
          <polygon points="24,4 30,14 27,22 33,48 24,34 15,48 21,22 18,14" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.7" filter={`url(#iceglint${p.id})`} />
          
          {/* Side crystal shards */}
          <polygon points="10,24 16,28 14,40 8,44" fill={`url(#icecrystalgrad${p.id})`} stroke="#0288d1" strokeWidth="0.8" opacity="0.8" />
          <polygon points="38,24 44,28 42,40 36,44" fill={`url(#icecrystalgrad${p.id})`} stroke="#0288d1" strokeWidth="0.8" opacity="0.8" />
          
          {/* Crack/refraction lines */}
          <line x1="24" y1="2" x2="24" y2="50" stroke="#00d4ff" strokeWidth="0.5" opacity="0.4" />
          <line x1="20" y1="10" x2="28" y2="14" stroke="#00d4ff" strokeWidth="0.4" opacity="0.3" />
          <line x1="20" y1="40" x2="28" y2="44" stroke="#00d4ff" strokeWidth="0.4" opacity="0.3" />
        </svg>
      );
    } else if (p.type === "lava_flow") {
      return (
        <svg key={`proj-${p.id}`} width={56} height={40} style={baseStyle} viewBox="0 0 56 40" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`lavagrad${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ff6600" />
              <stop offset="50%" stopColor="#ff3300" />
              <stop offset="100%" stopColor="#cc0000" />
            </linearGradient>
            <filter id={`lavaglow${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>
          {/* Main lava blob with organic flowing shape */}
          <path d="M 6 20 Q 8 10 14 8 Q 20 6 28 8 Q 36 6 42 10 Q 50 14 52 20 Q 50 28 42 32 Q 36 34 28 32 Q 20 34 14 32 Q 8 28 6 20" fill={`url(#lavagrad${p.id})`} stroke="#ff9900" strokeWidth="0.8" />
          {/* Inner lighter lava glow */}
          <path d="M 10 20 Q 12 12 18 10 Q 24 8 28 10 Q 32 8 36 10 Q 44 14 48 20 Q 46 26 36 30 Q 32 32 28 30 Q 24 32 18 30 Q 12 26 10 20" fill="none" stroke="#ffaa00" strokeWidth="1" opacity="0.7" filter={`url(#lavaglow${p.id})`} />
          {/* Lava drip down */}
          <ellipse cx="28" cy="32" rx="3" ry="6" fill={`url(#lavagrad${p.id})`} opacity="0.8" />
          {/* Secondary lava drip */}
          <ellipse cx="18" cy="35" rx="2" ry="4" fill={`url(#lavagrad${p.id})`} opacity="0.7" />
          <ellipse cx="38" cy="35" rx="2" ry="4" fill={`url(#lavagrad${p.id})`} opacity="0.7" />
          {/* Cracks in lava */}
          <line x1="24" y1="15" x2="24" y2="25" stroke="#990000" strokeWidth="0.6" opacity="0.5" />
          <line x1="32" y1="15" x2="32" y2="25" stroke="#990000" strokeWidth="0.6" opacity="0.5" />
        </svg>
      );
    } else if (p.type === "wood_style") {
      return (
        <svg key={`proj-${p.id}`} width={50} height={56} style={baseStyle} viewBox="0 0 50 56" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`woodgrad${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#2d5016" />
              <stop offset="50%" stopColor="#0d6b0d" />
              <stop offset="100%" stopColor="#00aa00" />
            </linearGradient>
            <filter id={`woodglow${p.id}`}><feGaussianBlur stdDeviation="1" /></filter>
          </defs>
          {/* Left tree trunk */}
          <rect x="4" y="28" width="8" height="20" fill="#8b5500" stroke="#663300" strokeWidth="0.5" />
          {/* Left tree foliage */}
          <polygon points="8,10 16,20 0,20" fill={`url(#woodgrad${p.id})`} stroke="#0a7a0a" strokeWidth="0.5" />
          <polygon points="8,16 18,26 -2,26" fill={`url(#woodgrad${p.id})`} stroke="#0a7a0a" strokeWidth="0.5" opacity="0.9" />
          
          {/* Center tree trunk - larger */}
          <rect x="20" y="24" width="12" height="28" fill="#8b5500" stroke="#663300" strokeWidth="0.7" />
          {/* Center tree foliage - large */}
          <polygon points="26,4 38,18 14,18" fill={`url(#woodgrad${p.id})`} stroke="#0a7a0a" strokeWidth="0.6" />
          <polygon points="26,12 40,28 12,28" fill={`url(#woodgrad${p.id})`} stroke="#0a7a0a" strokeWidth="0.6" opacity="0.95" />
          
          {/* Right tree trunk */}
          <rect x="38" y="28" width="8" height="20" fill="#8b5500" stroke="#663300" strokeWidth="0.5" />
          {/* Right tree foliage */}
          <polygon points="42,10 50,20 34,20" fill={`url(#woodgrad${p.id})`} stroke="#0a7a0a" strokeWidth="0.5" />
          <polygon points="42,16 52,26 32,26" fill={`url(#woodgrad${p.id})`} stroke="#0a7a0a" strokeWidth="0.5" opacity="0.9" />
          
          {/* Green glow around foliage */}
          <circle cx="26" cy="16" r="8" fill="none" stroke="#00ff00" strokeWidth="0.5" opacity="0.4" filter={`url(#woodglow${p.id})`} />
        </svg>
      );
    // ONE PIECE POWERS (continuing below...)
    } else if (p.type === "gum_gum_pistol") {
      return (
        <svg key={`proj-${p.id}`} width={48} height={48} style={baseStyle} viewBox="0 0 48 48" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`gumfist${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ff9999" />
              <stop offset="50%" stopColor="#ff6666" />
              <stop offset="100%" stopColor="#cc0000" />
            </linearGradient>
            <filter id={`punchglow${p.id}`}><feGaussianBlur stdDeviation="1" /></filter>
          </defs>
          {/* Fist/punch head */}
          <circle cx="36" cy="24" r="10" fill={`url(#gumfist${p.id})`} stroke="#990000" strokeWidth="1" />
          
          {/* Arm trailing behind */}
          <rect x="16" y="20" width="20" height="8" fill={`url(#gumfist${p.id})`} stroke="#990000" strokeWidth="0.8" rx="2" />
          
          {/* Fist fingers/details */}
          <circle cx="32" cy="18" r="2" fill="#ff9999" opacity="0.8" />
          <circle cx="34" cy="16" r="1.5" fill="#ff9999" opacity="0.7" />
          <circle cx="38" cy="16" r="1.5" fill="#ff9999" opacity="0.7" />
          <circle cx="40" cy="18" r="2" fill="#ff9999" opacity="0.8" />
          
          {/* Impact effect lines radiating from fist */}
          <line x1="42" y1="14" x2="48" y2="8" stroke="#ff6666" strokeWidth="1" opacity="0.7" />
          <line x1="44" y1="10" x2="52" y2="6" stroke="#ff9999" strokeWidth="0.8" opacity="0.6" />
          <line x1="44" y1="24" x2="52" y2="24" stroke="#ff6666" strokeWidth="1" opacity="0.7" filter={`url(#punchglow${p.id})`} />
          <line x1="42" y1="34" x2="48" y2="40" stroke="#ff6666" strokeWidth="1" opacity="0.7" />
          <line x1="44" y1="38" x2="52" y2="42" stroke="#ff9999" strokeWidth="0.8" opacity="0.6" />
          
          {/* Punch impact aura */}
          <circle cx="36" cy="24" r="12" fill="none" stroke="#ff6666" strokeWidth="0.8" opacity="0.5" filter={`url(#punchglow${p.id})`} />
        </svg>
      );
    } else if (p.type === "flame_kick") {
      return (
        <svg key={`proj-${p.id}`} width={56} height={48} style={baseStyle} viewBox="0 0 56 48" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`flamekickgrad${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ff6600" />
              <stop offset="50%" stopColor="#ff3300" />
              <stop offset="100%" stopColor="#cc0000" />
            </linearGradient>
            <filter id={`flameglow${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>
          {/* Leg/foot shape */}
          <polygon points="10,20 22,16 28,20 24,32 14,32" fill={`url(#flamekickgrad${p.id})`} stroke="#990000" strokeWidth="0.8" />
          
          {/* Flame trails behind kick */}
          <path d="M 16 18 Q 10 12 8 8" fill="none" stroke="#ff6600" strokeWidth="1.5" opacity="0.8" filter={`url(#flameglow${p.id})`} />
          <path d="M 20 16 Q 12 8 6 4" fill="none" stroke="#ff9900" strokeWidth="1.2" opacity="0.7" />
          <path d="M 24 20 Q 20 10 16 4" fill="none" stroke="#ffaa00" strokeWidth="1" opacity="0.6" />
          
          {/* Flame burst at foot */}
          <circle cx="26" cy="22" r="4" fill="#ff6600" opacity="0.8" filter={`url(#flameglow${p.id})`} />
          <circle cx="26" cy="22" r="6" fill="none" stroke="#ff6600" strokeWidth="1" opacity="0.5" />
          
          {/* Multiple flame petals */}
          <path d="M 28 24 Q 35 28 38 32" fill="none" stroke="#ff3300" strokeWidth="1.2" opacity="0.7" />
          <path d="M 28 20 Q 38 18 42 16" fill="none" stroke="#ff6600" strokeWidth="1.2" opacity="0.7" />
          <path d="M 26 26 Q 38 32 44 36" fill="none" stroke="#ff9900" strokeWidth="1" opacity="0.6" />
          
          {/* Inner white hot core */}
          <circle cx="26" cy="22" r="2" fill="#ffffff" opacity="0.8" />
        </svg>
      );
    } else if (p.type === "sword_slash") {
      return (
        <svg key={`proj-${p.id}`} width={64} height={52} style={baseStyle} viewBox="0 0 64 52" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`swordgrad${p.id}`} x1="0" x2="1" y1="0.2" y2="0.8">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#e0e0e0" />
              <stop offset="100%" stopColor="#808080" />
            </linearGradient>
            <filter id={`swordglow${p.id}`}><feGaussianBlur stdDeviation="1" /></filter>
          </defs>
          {/* Main diagonal slash effect */}
          <path d="M 8 44 L 56 8" stroke={`url(#swordgrad${p.id})`} strokeWidth="4" strokeLinecap="round" opacity="0.95" filter={`url(#swordglow${p.id})`} />
          
          {/* Secondary slash lines for depth */}
          <path d="M 10 46 L 58 10" stroke="url(#swordgrad${p.id}}" strokeWidth="2" opacity="0.6" />
          <path d="M 6 42 L 54 6" stroke={`url(#swordgrad${p.id})`} strokeWidth="2" opacity="0.6" />
          
          {/* Glowing edge highlight */}
          <path d="M 8 44 L 56 8" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" filter={`url(#swordglow${p.id})`} />
          
          {/* Slash impact aura at center */}
          <circle cx="32" cy="26" r="6" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
          <circle cx="32" cy="26" r="8" fill="none" stroke="#e0e0e0" strokeWidth="0.8" opacity="0.3" />
          
          {/* Blade energy particles trailing the slash */}
          <circle cx="26" cy="32" r="1.2" fill="#ffffff" opacity="0.8" />
          <circle cx="20" cy="38" r="1" fill="#e0e0e0" opacity="0.7" />
          <circle cx="38" cy="20" r="1.1" fill="#ffffff" opacity="0.8" />
          <circle cx="44" cy="14" r="0.9" fill="#e0e0e0" opacity="0.7" />
        </svg>
      );
    } else if (p.type === "thunder_tempo") {
      // Thunder Tempo: Jagged lightning bolt with electrical effects
      return (
        <svg key={`proj-${p.id}`} width={48} height={64} style={baseStyle} viewBox="0 0 48 64" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`thunder${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffff99" />
              <stop offset="30%" stopColor="#ffff00" />
              <stop offset="60%" stopColor="#ffcc00" />
              <stop offset="100%" stopColor="#ff9900" />
            </linearGradient>
            <linearGradient id={`thundercore${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#ffffcc" />
              <stop offset="100%" stopColor="#ffff99" />
            </linearGradient>
            <filter id={`thunderglow${p.id}`}><feGaussianBlur stdDeviation="1.2" /></filter>
          </defs>

          {/* Main lightning bolt - main zigzag */}
          <polygon points="24,2 32,20 26,24 34,40 20,36 26,56 18,48 14,64 24,50 20,32 28,28 22,12" fill={`url(#thunder${p.id})`} stroke="#ff6600" strokeWidth="1" />

          {/* Inner bright core of lightning */}
          <polygon points="24,4 30,18 26,22 32,38 21,35 25,54 20,47 16,62 24,48 21,33 27,29 23,14" fill={`url(#thundercore${p.id})`} opacity="0.85" stroke="#ffffff" strokeWidth="0.5" />

          {/* Side lightning branches - left */}
          <path d="M 22 24 Q 14 28 10 35" fill="none" stroke={`url(#thunder${p.id})`} strokeWidth="1.5" opacity="0.8" filter={`url(#thunderglow${p.id})`} />
          <path d="M 20 36 Q 12 42 8 50" fill="none" stroke={`url(#thunder${p.id})`} strokeWidth="1.2" opacity="0.7" />

          {/* Side lightning branches - right */}
          <path d="M 26 24 Q 34 30 38 38" fill="none" stroke={`url(#thunder${p.id})`} strokeWidth="1.5" opacity="0.8" filter={`url(#thunderglow${p.id})`} />
          <path d="M 28 40 Q 36 46 40 54" fill="none" stroke={`url(#thunder${p.id})`} strokeWidth="1.2" opacity="0.7" />

          {/* Minor branches from main bolt */}
          <path d="M 28 28 L 32 24" fill="none" stroke="#ffff00" strokeWidth="0.8" opacity="0.6" />
          <path d="M 24 50 L 20 54" fill="none" stroke="#ffff00" strokeWidth="0.8" opacity="0.6" />

          {/* Electric energy particles */}
          <circle cx="28" cy="20" r="1.2" fill="#ffffff" opacity="0.9" filter={`url(#thunderglow${p.id})`} />
          <circle cx="32" cy="38" r="1" fill="#ffff99" opacity="0.8" />
          <circle cx="22" cy="35" r="0.9" fill="#ffff99" opacity="0.8" />
          <circle cx="26" cy="54" r="1.1" fill="#ffffff" opacity="0.7" />

          {/* Electric arcs around bolt */}
          <path d="M 20 18 Q 16 20 15 24" fill="none" stroke="#ffff00" strokeWidth="0.6" opacity="0.5" />
          <path d="M 28 32 Q 32 35 35 38" fill="none" stroke="#ffff00" strokeWidth="0.6" opacity="0.5" />
        </svg>
      );
    } else if (p.type === "cannon_strike") {
      return (
        <svg key={`proj-${p.id}`} width={56} height={44} style={baseStyle} viewBox="0 0 56 44" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`cannongrad${p.id}`} cx="80%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#ffaa00" />
              <stop offset="40%" stopColor="#ff6600" />
              <stop offset="100%" stopColor="#ff3300" />
            </radialGradient>
            <filter id={`cannonglow${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>
          {/* Cannonball at front */}
          <circle cx="44" cy="22" r="8" fill={`url(#cannongrad${p.id})`} stroke="#990000" strokeWidth="1" />
          
          {/* Energy trail behind */}
          <ellipse cx="30" cy="22" rx="10" ry="6" fill={`url(#cannongrad${p.id})`} opacity="0.7" />
          <ellipse cx="18" cy="22" rx="8" ry="5" fill={`url(#cannongrad${p.id})`} opacity="0.5" />
          
          {/* Explosion/spark effect at cannonball */}
          <polygon points="44,14 50,18 52,22 50,26 44,30 38,26 36,22 38,18" fill="#ffbb00" opacity="0.8" filter={`url(#cannonglow${p.id})`} />
          
          {/* Spark particles */}
          <circle cx="48" cy="16" r="1.5" fill="#ffff00" opacity="0.9" />
          <circle cx="52" cy="20" r="1.2" fill="#ffff00" opacity="0.8" />
          <circle cx="54" cy="26" r="1" fill="#ffff00" opacity="0.7" />
          <circle cx="50" cy="32" r="1.3" fill="#ffaa00" opacity="0.8" />
          <circle cx="46" cy="34" r="1" fill="#ff8800" opacity="0.7" />
          
          {/* Flame trails */}
          <path d="M 36 20 L 28 14 L 26 12" fill="none" stroke="#ff6600" strokeWidth="1.2" opacity="0.7" />
          <path d="M 36 24 L 28 30 L 26 32" fill="none" stroke="#ff6600" strokeWidth="1.2" opacity="0.7" />
        </svg>
      );
    } else if (p.type === "soul_surge") {
      const rotation = (Date.now() * 0.9) % 360;
      return (
        <svg key={`proj-${p.id}`} width={52} height={52} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${rotation}deg)`}} viewBox="0 0 52 52" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`soulgrad${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffff00" />
              <stop offset="30%" stopColor="#ffcc00" />
              <stop offset="70%" stopColor="#ff6600" />
              <stop offset="100%" stopColor="#ff3300" />
            </radialGradient>
            <filter id={`soulglow${p.id}`}><feGaussianBlur stdDeviation="2" /></filter>
          </defs>
          {/* Soul energy orb */}
          <circle cx="26" cy="26" r="22" fill={`url(#soulgrad${p.id})`} />
          <circle cx="26" cy="26" r="20" fill="none" stroke="#ffcc00" strokeWidth="2" opacity="0.7" />
          
          {/* Soul ripple effect */}
          <path d="M 26 6 Q 32 14 30 22 Q 26 28 20 26 Q 16 22 18 14 Q 22 8 26 6" fill="none" stroke="#ff6600" strokeWidth="1.2" opacity="0.7" filter={`url(#soulglow${p.id})`} />
          <path d="M 26 46 Q 20 38 22 30 Q 26 24 32 26 Q 36 30 34 38 Q 30 44 26 46" fill="none" stroke="#ff6600" strokeWidth="1.2" opacity="0.7" filter={`url(#soulglow${p.id})`} />
          
          {/* Soul sparkles */}
          <circle cx="12" cy="26" r="1.5" fill="#ffff00" opacity="0.9" />
          <circle cx="40" cy="26" r="1.5" fill="#ffff00" opacity="0.9" />
          <circle cx="26" cy="10" r="1.3" fill="#ffcc00" opacity="0.8" />
          <circle cx="26" cy="42" r="1.3" fill="#ffcc00" opacity="0.8" />
          
          {/* Center flame core */}
          <circle cx="26" cy="26" r="8" fill="#ffffff" filter={`url(#soulglow${p.id})`} opacity="0.8" />
          <circle cx="26" cy="26" r="4" fill="#ff6600" opacity="0.95" />
        </svg>
      );
    } else if (p.type === "shadow_clone") {
      // Shadow Clone: Shows multiple shadow clones being created and dispersed
      const shadowRotation = (Date.now() * 0.5) % 360;
      return (
        <svg key={`proj-${p.id}`} width={64} height={64} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${shadowRotation}deg)`}} viewBox="0 0 64 64" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`shadow1${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#333333" />
              <stop offset="50%" stopColor="#111111" />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>
            <radialGradient id={`shadow2${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#222222" />
              <stop offset="50%" stopColor="#000000" />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>
            <filter id={`shadowglow${p.id}`}><feGaussianBlur stdDeviation="1.2" /></filter>
          </defs>

          {/* Main center clone - most opaque */}
          <circle cx="32" cy="32" r="12" fill={`url(#shadow1${p.id})`} opacity="0.95" />
          <polygon points="32,16 40,24 40,40 32,48 24,40 24,24" fill="none" stroke="#333333" strokeWidth="1.2" opacity="0.7" />

          {/* Clone dispersing upward-left */}
          <circle cx="20" cy="18" r="9" fill={`url(#shadow2${p.id})`} opacity="0.65" filter={`url(#shadowglow${p.id})`} />
          <polygon points="20,8 26,14 26,26 20,32 14,26 14,14" fill="none" stroke="#222222" strokeWidth="0.8" opacity="0.5" />

          {/* Clone dispersing upward-right */}
          <circle cx="44" cy="18" r="9" fill={`url(#shadow2${p.id})`} opacity="0.65" filter={`url(#shadowglow${p.id})`} />
          <polygon points="44,8 50,14 50,26 44,32 38,26 38,14" fill="none" stroke="#222222" strokeWidth="0.8" opacity="0.5" />

          {/* Clone dispersing downward-left */}
          <circle cx="18" cy="46" r="9" fill={`url(#shadow2${p.id})`} opacity="0.65" filter={`url(#shadowglow${p.id})`} />
          <polygon points="18,36 24,42 24,54 18,60 12,54 12,42" fill="none" stroke="#222222" strokeWidth="0.8" opacity="0.5" />

          {/* Clone dispersing downward-right */}
          <circle cx="46" cy="46" r="9" fill={`url(#shadow2${p.id})`} opacity="0.65" filter={`url(#shadowglow${p.id})`} />
          <polygon points="46,36 52,42 52,54 46,60 40,54 40,42" fill="none" stroke="#222222" strokeWidth="0.8" opacity="0.5" />

          {/* Shadow mist trails connecting clones */}
          <path d="M 32 32 L 20 18" stroke="#333333" strokeWidth="0.8" opacity="0.3" strokeDasharray="2,2" />
          <path d="M 32 32 L 44 18" stroke="#333333" strokeWidth="0.8" opacity="0.3" strokeDasharray="2,2" />
          <path d="M 32 32 L 18 46" stroke="#333333" strokeWidth="0.8" opacity="0.3" strokeDasharray="2,2" />
          <path d="M 32 32 L 46 46" stroke="#333333" strokeWidth="0.8" opacity="0.3" strokeDasharray="2,2" />

          {/* Purple energy aura (shadow magic) */}
          <circle cx="32" cy="32" r="16" fill="none" stroke="#5d00ff" strokeWidth="0.8" opacity="0.4" filter={`url(#shadowglow${p.id})`} />
        </svg>
      );
    } else if (p.type === "magma_fist") {
      return (
        <svg key={`proj-${p.id}`} width={46} height={56} style={baseStyle} viewBox="0 0 46 56" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`magmafistgrad${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffaa00" />
              <stop offset="50%" stopColor="#ff3300" />
              <stop offset="100%" stopColor="#990000" />
            </linearGradient>
            <radialGradient id={`magmacore${p.id}`} cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#ffccaa" />
              <stop offset="100%" stopColor="#ff3300" />
            </radialGradient>
            <filter id={`magmaglow${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>
          {/* Fist body - balled hand with magma */}
          <ellipse cx="23" cy="20" rx="12" ry="14" fill={`url(#magmafistgrad${p.id})`} stroke="#ff3300" strokeWidth="0.8" opacity="0.95" filter={`url(#magmaglow${p.id})`} />

          {/* Fist knuckles - rounded bumps */}
          <circle cx="15" cy="10" r="3" fill={`url(#magmacore${p.id})`} opacity="0.9" stroke="#ff3300" strokeWidth="0.6" />
          <circle cx="23" cy="6" r="3" fill={`url(#magmacore${p.id})`} opacity="0.9" stroke="#ff3300" strokeWidth="0.6" />
          <circle cx="31" cy="10" r="3" fill={`url(#magmacore${p.id})`} opacity="0.9" stroke="#ff3300" strokeWidth="0.6" />

          {/* Magma cracks */}
          <path d="M 18 18 Q 20 22 18 28" fill="none" stroke="#ffaa00" strokeWidth="0.6" opacity="0.6" />
          <path d="M 28 20 Q 26 24 28 30" fill="none" stroke="#ffaa00" strokeWidth="0.6" opacity="0.6" />
          <path d="M 23 16 Q 25 20 23 26" fill="none" stroke="#ffaa00" strokeWidth="0.5" opacity="0.5" />

          {/* Forearm/palm extension */}
          <path d="M 18 32 Q 16 40 18 48" fill="none" stroke={`url(#magmafistgrad${p.id})`} strokeWidth="6" opacity="0.9" filter={`url(#magmaglow${p.id})`} />
          <path d="M 28 32 Q 30 40 28 48" fill="none" stroke={`url(#magmafistgrad${p.id})`} strokeWidth="6" opacity="0.9" filter={`url(#magmaglow${p.id})`} />

          {/* Dripping lava effect */}
          <path d="M 16 48 Q 14 50 15 54" fill="none" stroke="#ff3300" strokeWidth="1.2" opacity="0.8" />
          <path d="M 23 48 Q 21 51 22 56" fill="none" stroke="#ff3300" strokeWidth="1.2" opacity="0.8" />
          <path d="M 30 48 Q 32 50 31 54" fill="none" stroke="#ff3300" strokeWidth="1.2" opacity="0.8" />

          {/* Magma drips at base */}
          <circle cx="15" cy="54" r="1.5" fill="#ff3300" opacity="0.75" />
          <circle cx="23" cy="55" r="1.5" fill="#ff3300" opacity="0.75" />
          <circle cx="31" cy="54" r="1.2" fill="#ff3300" opacity="0.7" />
        </svg>
      );
    // BLEACH POWERS (continuing below...)
    } else if (p.type === "getsuga_tensho") {
      return (
        <svg key={`proj-${p.id}`} width={60} height={54} style={baseStyle} viewBox="0 0 60 54" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`getsugagrad${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="30%" stopColor="#0091ea" />
              <stop offset="70%" stopColor="#0066ff" />
              <stop offset="100%" stopColor="#0033cc" />
            </linearGradient>
            <filter id={`getsugaglow${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>
          {/* Main diagonal slash (Getsuga is a crescent slash) */}
          <path d="M 10 46 Q 30 8 56 12" fill="none" stroke={`url(#getsugagrad${p.id})`} strokeWidth="5" strokeLinecap="round" opacity="0.95" filter={`url(#getsugaglow${p.id})`} />
          <path d="M 10 50 Q 30 16 56 18" fill="none" stroke={`url(#getsugagrad${p.id})`} strokeWidth="3" opacity="0.7" />
          
          {/* Crescent moon shape - signature Getsuga effect */}
          <path d="M 12 44 Q 35 10 54 14 Q 32 22 12 48" fill="none" stroke="#00d4ff" strokeWidth="2" opacity="0.7" filter={`url(#getsugaglow${p.id})`} />
          
          {/* White hot core */}
          <path d="M 10 46 Q 30 10 56 12" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.8" filter={`url(#getsugaglow${p.id})`} />
          
          {/* Energy trail particles */}
          <circle cx="28" cy="18" r="1.5" fill="#00d4ff" opacity="0.8" />
          <circle cx="38" cy="14" r="1.2" fill="#0091ea" opacity="0.7" />
          <circle cx="48" cy="13" r="1.3" fill="#00d4ff" opacity="0.8" />
          <circle cx="20" cy="32" r="1" fill="#0066ff" opacity="0.6" />
        </svg>
      );
    } else if (p.type === "senbonzakura") {
      // Senbonzakura: Thousand flying cherry blossom petal blades
      const rotation = (Date.now() * 2.2) % 360; // Fast swirling for petal blades
      return (
        <svg key={`proj-${p.id}`} width={56} height={56} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${rotation}deg)`}} viewBox="0 0 56 56" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`petal${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ff99ff" />
              <stop offset="50%" stopColor="#ff66ff" />
              <stop offset="100%" stopColor="#dd33ff" />
            </linearGradient>
            <linearGradient id={`petaldark${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ff66ff" />
              <stop offset="100%" stopColor="#bb22dd" />
            </linearGradient>
            <filter id={`petalglow${p.id}`}><feGaussianBlur stdDeviation="0.8" /></filter>
          </defs>

          {/* Center swirling core */}
          <circle cx="28" cy="28" r="3" fill="#ff99ff" opacity="0.9" filter={`url(#petalglow${p.id})`} />
          <circle cx="28" cy="28" r="6" fill="none" stroke="#ff66ff" strokeWidth="0.4" opacity="0.5" />

          {/* Outer petal swirl circle */}
          <circle cx="28" cy="28" r="20" fill="none" stroke="#ff99ff" strokeWidth="0.5" opacity="0.3" />

          {/* Large petal blade - top */}
          <polygon points="28,8 32,18 28,22 24,18" fill={`url(#petal${p.id})`} stroke="#dd33ff" strokeWidth="0.6" opacity="0.9" />

          {/* Large petal blade - bottom-right */}
          <polygon points="40,32 44,42 38,42 36,32" fill={`url(#petal${p.id})`} stroke="#dd33ff" strokeWidth="0.6" opacity="0.9" />

          {/* Large petal blade - bottom-left */}
          <polygon points="16,32 20,42 14,42 12,32" fill={`url(#petal${p.id})`} stroke="#dd33ff" strokeWidth="0.6" opacity="0.9" />

          {/* Medium petal blade - upper-right */}
          <polygon points="38,14 42,20 38,24 34,18" fill={`url(#petaldark${p.id})`} stroke="#bb22dd" strokeWidth="0.5" opacity="0.8" />

          {/* Medium petal blade - upper-left */}
          <polygon points="18,14 22,20 18,24 14,18" fill={`url(#petaldark${p.id})`} stroke="#bb22dd" strokeWidth="0.5" opacity="0.8" />

          {/* Medium petal blade - lower-right */}
          <polygon points="40,42 44,50 40,52 36,46" fill={`url(#petaldark${p.id})`} stroke="#bb22dd" strokeWidth="0.5" opacity="0.8" />

          {/* Medium petal blade - lower-left */}
          <polygon points="16,42 20,50 16,52 12,46" fill={`url(#petaldark${p.id})`} stroke="#bb22dd" strokeWidth="0.5" opacity="0.8" />

          {/* Small petal blades - sides */}
          <polygon points="48,26 50,32 46,32 46,28" fill="#ff99ff" stroke="#ff66ff" strokeWidth="0.4" opacity="0.7" />
          <polygon points="8,26 10,32 6,32 6,28" fill="#ff99ff" stroke="#ff66ff" strokeWidth="0.4" opacity="0.7" />

          {/* Tiny petals for swirling effect */}
          <polygon points="36,10 38,12 36,14 34,12" fill="#ff66ff" opacity="0.6" />
          <polygon points="20,10 22,12 20,14 18,12" fill="#ff66ff" opacity="0.6" />
          <polygon points="42,28 44,30 42,32 40,30" fill="#ff66ff" opacity="0.6" />
          <polygon points="14,28 16,30 14,32 12,30" fill="#ff66ff" opacity="0.6" />

          {/* Petal trail effect */}
          <circle cx="32" cy="16" r="0.8" fill="#ff99ff" opacity="0.5" />
          <circle cx="24" cy="16" r="0.8" fill="#ff99ff" opacity="0.5" />
          <circle cx="40" cy="38" r="0.7" fill="#ff99ff" opacity="0.4" />
          <circle cx="16" cy="38" r="0.7" fill="#ff99ff" opacity="0.4" />
        </svg>
      );
    } else if (p.type === "hyorinmaru") {
      return (
        <svg key={`proj-${p.id}`} width={50} height={60} style={baseStyle} viewBox="0 0 50 60" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`hyoringrad${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#66ffff" />
              <stop offset="100%" stopColor="#0066ff" />
            </linearGradient>
            <radialGradient id={`hyorincore${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#66ffff" />
              <stop offset="100%" stopColor="#0066ff" />
            </radialGradient>
            <filter id={`hyoringlow${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>
          {/* Central ice core */}
          <circle cx="25" cy="28" r="8" fill={`url(#hyorincore${p.id})`} opacity="0.9" filter={`url(#hyoringlow${p.id})`} />

          {/* Upper icicle spikes - forming dragon head */}
          <polygon points="18,18 20,8 22,16" fill={`url(#hyoringrad${p.id})`} stroke="#66ffff" strokeWidth="0.6" opacity="0.85" filter={`url(#hyoringlow${p.id})`} />
          <polygon points="25,12 27,2 29,12" fill={`url(#hyoringrad${p.id})`} stroke="#66ffff" strokeWidth="0.6" opacity="0.85" filter={`url(#hyoringlow${p.id})`} />
          <polygon points="32,16 34,8 36,18" fill={`url(#hyoringrad${p.id})`} stroke="#66ffff" strokeWidth="0.6" opacity="0.85" filter={`url(#hyoringlow${p.id})`} />

          {/* Side icicles - dragon wings/body */}
          <polygon points="10,28 4,26 12,30" fill={`url(#hyoringrad${p.id})`} stroke="#66ffff" strokeWidth="0.6" opacity="0.8" filter={`url(#hyoringlow${p.id})`} />
          <polygon points="40,30 46,28 38,32" fill={`url(#hyoringrad${p.id})`} stroke="#66ffff" strokeWidth="0.6" opacity="0.8" filter={`url(#hyoringlow${p.id})`} />

          {/* Lower icicle tail */}
          <polygon points="20,42 18,52 22,44" fill={`url(#hyoringrad${p.id})`} stroke="#66ffff" strokeWidth="0.6" opacity="0.85" filter={`url(#hyoringlow${p.id})`} />
          <polygon points="28,44 26,56 30,46" fill={`url(#hyoringrad${p.id})`} stroke="#66ffff" strokeWidth="0.6" opacity="0.85" filter={`url(#hyoringlow${p.id})`} />
          <polygon points="35,42 38,52 32,44" fill={`url(#hyoringrad${p.id})`} stroke="#66ffff" strokeWidth="0.6" opacity="0.85" filter={`url(#hyoringlow${p.id})`} />

          {/* Ice dragon mouth/fangs */}
          <path d="M 15 28 Q 20 26 25 28" fill="none" stroke="#66ffff" strokeWidth="0.8" opacity="0.8" />
          <path d="M 25 28 Q 30 30 35 28" fill="none" stroke="#66ffff" strokeWidth="0.8" opacity="0.8" />

          {/* Crystalline aura */}
          <circle cx="25" cy="28" r="18" fill="none" stroke="#66ffff" strokeWidth="0.6" opacity="0.5" filter={`url(#hyoringlow${p.id})`} />
        </svg>
      );
    } else if (p.type === "bakudo_spell") {
      return (
        <svg key={`proj-${p.id}`} width={48} height={52} style={baseStyle} viewBox="0 0 48 52" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`bakudograd${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffff99" />
              <stop offset="50%" stopColor="#ffcc00" />
              <stop offset="100%" stopColor="#ff9900" />
            </linearGradient>
            <radialGradient id={`bakudocore${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#ffff99" />
              <stop offset="100%" stopColor="#ff9900" />
            </radialGradient>
            <filter id={`bakudoglow${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>
          {/* Central binding orb */}
          <circle cx="24" cy="24" r="8" fill={`url(#bakudocore${p.id})`} opacity="0.9" filter={`url(#bakudoglow${p.id})`} />

          {/* Binding chains/bars forming a cage around power */}
          <rect x="4" y="12" width="40" height="24" fill="none" stroke={`url(#bakudograd${p.id})`} strokeWidth="1.2" opacity="0.85" filter={`url(#bakudoglow${p.id})`} />
          <rect x="8" y="16" width="32" height="16" fill="none" stroke={`url(#bakudograd${p.id})`} strokeWidth="0.9" opacity="0.7" />

          {/* Horizontal binding chains */}
          <line x1="8" y1="20" x2="40" y2="20" stroke="#ffff99" strokeWidth="1" opacity="0.8" />
          <line x1="8" y1="28" x2="40" y2="28" stroke="#ffff99" strokeWidth="1" opacity="0.8" />

          {/* Vertical binding chains */}
          <line x1="16" y1="12" x2="16" y2="36" stroke="#ffff99" strokeWidth="0.9" opacity="0.7" />
          <line x1="32" y1="12" x2="32" y2="36" stroke="#ffff99" strokeWidth="0.9" opacity="0.7" />

          {/* Diagonal restriction marks */}
          <path d="M 12 14 L 36 34" fill="none" stroke="#ffcc00" strokeWidth="0.8" opacity="0.6" />
          <path d="M 36 14 L 12 34" fill="none" stroke="#ffcc00" strokeWidth="0.8" opacity="0.6" />

          {/* Binding energy at edges */}
          <circle cx="4" cy="24" r="2" fill="#ffff99" opacity="0.7" filter={`url(#bakudoglow${p.id})`} />
          <circle cx="44" cy="24" r="2" fill="#ffff99" opacity="0.7" filter={`url(#bakudoglow${p.id})`} />
          <circle cx="24" cy="8" r="2" fill="#ffff99" opacity="0.7" filter={`url(#bakudoglow${p.id})`} />
          <circle cx="24" cy="40" r="2" fill="#ffff99" opacity="0.7" filter={`url(#bakudoglow${p.id})`} />
        </svg>
      );
    } else if (p.type === "cero_blast") {
      return (
        <svg key={`proj-${p.id}`} width={65} height={65} style={baseStyle} viewBox="0 0 65 65" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`ceropurple${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#dd00ff" />
              <stop offset="55%" stopColor="#8800cc" />
              <stop offset="100%" stopColor="#330066" />
            </radialGradient>
            <filter id={`ceroglow${p.id}`}><feGaussianBlur stdDeviation="2.5" /></filter>
          </defs>
          {/* Main destructive hollow energy sphere */}
          <circle cx="32.5" cy="32.5" r="28" fill={`url(#ceropurple${p.id})`} />
          <circle cx="32.5" cy="32.5" r="26" fill="none" stroke="#dd00ff" strokeWidth="2" opacity="0.85" />
          <circle cx="32.5" cy="32.5" r="22" fill="none" stroke="#8800cc" strokeWidth="1.5" opacity="0.6" />

          {/* Cardinal energy spikes - aggressive hollow effect */}
          <polygon points="32.5,5 38,14 34,22 40,14 38,5 32.5,5" fill="#dd00ff" opacity="0.95" filter={`url(#ceroglow${p.id})`} />
          <polygon points="60,32.5 51,38 43,34 51,40 60,38" fill="#dd00ff" opacity="0.95" filter={`url(#ceroglow${p.id})`} />
          <polygon points="32.5,60 27,51 31,43 25,51 27,60" fill="#dd00ff" opacity="0.95" filter={`url(#ceroglow${p.id})`} />
          <polygon points="5,32.5 14,27 22,31 14,25 5,27" fill="#dd00ff" opacity="0.95" filter={`url(#ceroglow${p.id})`} />

          {/* Extra diagonal spikes - more aggressive */}
          <polygon points="50,12 44,18 40,16 46,20 48,12" fill="#8800cc" opacity="0.85" />
          <polygon points="53,50 49,44 51,40 45,46 53,48" fill="#8800cc" opacity="0.85" />
          <polygon points="15,52 19,46 21,48 17,44 15,52" fill="#8800cc" opacity="0.85" />
          <polygon points="12,15 18,17 16,21 14,19 12,15" fill="#8800cc" opacity="0.85" />

          {/* Additional micro spikes */}
          <polygon points="28,14 30,10 32,14" fill="#dd00ff" opacity="0.7" />
          <polygon points="51,28 55,30 51,32" fill="#dd00ff" opacity="0.7" />
          <polygon points="36,50 34,54 32,50" fill="#dd00ff" opacity="0.7" />
          <polygon points="14,36 10,34 14,32" fill="#dd00ff" opacity="0.7" />

          {/* Hollow eye effect at core */}
          <circle cx="32.5" cy="32.5" r="14" fill="none" stroke="#8800cc" strokeWidth="1" opacity="0.6" />
          <circle cx="32.5" cy="32.5" r="10" fill="#ffffff" filter={`url(#ceroglow${p.id})`} opacity="0.8" />
          <circle cx="32.5" cy="32.5" r="6" fill="#dd00ff" opacity="0.9" />
        </svg>
      );
    } else if (p.type === "hadou_spell") {
      return (
        <svg key={`proj-${p.id}`} width={75} height={42} style={baseStyle} viewBox="0 0 75 42" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`hadoubeam${p.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#ff3333" />
              <stop offset="50%" stopColor="#cc0000" />
              <stop offset="100%" stopColor="#660000" />
            </linearGradient>
            <radialGradient id={`hadoucore${p.id}`} cx="15%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#ff6666" />
              <stop offset="100%" stopColor="#cc0000" />
            </radialGradient>
            <filter id={`hadouglow${p.id}`}><feGaussianBlur stdDeviation="2" /></filter>
          </defs>
          {/* Wide destructive kido blast beam */}
          <polygon points="8,14 18,10 65,16 70,21 65,26 18,32 8,28" fill={`url(#hadoubeam${p.id})`} stroke="#ff3333" strokeWidth="0.9" opacity="0.95" filter={`url(#hadouglow${p.id})`} />

          {/* Destructive energy pulses */}
          <path d="M 12,21 Q 25,16 40,18" fill="none" stroke="#ffffff" strokeWidth="0.7" opacity="0.7" />
          <path d="M 15,21 Q 35,26 55,24" fill="none" stroke="#ffffff" strokeWidth="0.7" opacity="0.7" />
          <path d="M 20,21 Q 40,15 65,19" fill="none" stroke="#ff6666" strokeWidth="0.6" opacity="0.6" />

          {/* Explosive force rings */}
          <circle cx="20" cy="21" r="3.5" fill="none" stroke="#ff3333" strokeWidth="0.8" opacity="0.7" />
          <circle cx="40" cy="21" r="4.5" fill="none" stroke="#ff3333" strokeWidth="0.7" opacity="0.6" />
          <circle cx="60" cy="21" r="5" fill="none" stroke="#ff3333" strokeWidth="0.6" opacity="0.5" />

          {/* Offensive sharp point at front */}
          <polygon points="70,21 73,20 73,22" fill="#ffffff" opacity="0.9" />

          {/* Core bright destructive center */}
          <ellipse cx="15" cy="21" rx="4" ry="5" fill={`url(#hadoucore${p.id})`} opacity="0.85" filter={`url(#hadouglow${p.id})`} />
        </svg>
      );
    } else if (p.type === "bankai_power") {
      const rotation = (Date.now() * 0.85) % 360;
      return (
        <svg key={`proj-${p.id}`} width={60} height={60} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${rotation}deg)`}} viewBox="0 0 60 60" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`bankaigrad${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#66ffff" />
              <stop offset="65%" stopColor="#0066ff" />
              <stop offset="100%" stopColor="#0033aa" />
            </radialGradient>
            <radialGradient id={`bankaicore${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#00d4ff" />
              <stop offset="100%" stopColor="#0066ff" />
            </radialGradient>
            <filter id={`bankaiglow${p.id}`}><feGaussianBlur stdDeviation="2" /></filter>
          </defs>
          {/* Central intense power core */}
          <circle cx="30" cy="30" r="12" fill={`url(#bankaicore${p.id})`} opacity="0.95" filter={`url(#bankaiglow${p.id})`} />

          {/* 8 radiating power release beams */}
          <line x1="30" y1="6" x2="30" y2="2" stroke="#66ffff" strokeWidth="2" opacity="0.9" />
          <line x1="30" y1="54" x2="30" y2="58" stroke="#66ffff" strokeWidth="2" opacity="0.9" />
          <line x1="6" y1="30" x2="2" y2="30" stroke="#66ffff" strokeWidth="2" opacity="0.9" />
          <line x1="54" y1="30" x2="58" y2="30" stroke="#66ffff" strokeWidth="2" opacity="0.9" />
          <line x1="14" y1="14" x2="10" y2="10" stroke="#66ffff" strokeWidth="1.5" opacity="0.8" />
          <line x1="46" y1="46" x2="50" y2="50" stroke="#66ffff" strokeWidth="1.5" opacity="0.8" />
          <line x1="46" y1="14" x2="50" y2="10" stroke="#66ffff" strokeWidth="1.5" opacity="0.8" />
          <line x1="14" y1="46" x2="10" y2="50" stroke="#66ffff" strokeWidth="1.5" opacity="0.8" />

          {/* Power aura rings - multiple layers */}
          <circle cx="30" cy="30" r="20" fill="none" stroke="#00d4ff" strokeWidth="1.2" opacity="0.7" />
          <circle cx="30" cy="30" r="26" fill="none" stroke="#00d4ff" strokeWidth="0.9" opacity="0.5" />
          <circle cx="30" cy="30" r="32" fill="none" stroke="#0066ff" strokeWidth="0.6" opacity="0.3" />

          {/* Bankai activation particles */}
          <circle cx="20" cy="14" r="1" fill="#66ffff" opacity="0.8" />
          <circle cx="40" cy="16" r="0.9" fill="#66ffff" opacity="0.7" />
          <circle cx="14" cy="30" r="1" fill="#66ffff" opacity="0.8" />
          <circle cx="46" cy="28" r="0.9" fill="#66ffff" opacity="0.7" />
          <circle cx="40" cy="44" r="1" fill="#66ffff" opacity="0.8" />
          <circle cx="20" cy="46" r="0.9" fill="#66ffff" opacity="0.7" />
          <circle cx="16" cy="30" r="1" fill="#66ffff" opacity="0.8" />
          <circle cx="44" cy="30" r="0.9" fill="#66ffff" opacity="0.7" />
        </svg>
      );
    // MY HERO ACADEMIA POWERS
    } else if (p.type === "one_for_all") {
      const rotation = (Date.now() * 0.75) % 360;
      return (
        <svg key={`proj-${p.id}`} width={58} height={58} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${rotation}deg)`}} viewBox="0 0 58 58" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`ofarallgrad${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#ffff99" />
              <stop offset="100%" stopColor="#ffcc00" />
            </radialGradient>
            <filter id={`ofaglow${p.id}`}><feGaussianBlur stdDeviation="1.8" /></filter>
          </defs>
          {/* Central core of all inherited quirks */}
          <circle cx="29" cy="29" r="12" fill={`url(#ofarallgrad${p.id})`} opacity="0.95" filter={`url(#ofaglow${p.id})`} />

          {/* Layered inheritance rings - all previous users */}
          <circle cx="29" cy="29" r="18" fill="none" stroke="#ffff99" strokeWidth="1.2" opacity="0.7" filter={`url(#ofaglow${p.id})`} />
          <circle cx="29" cy="29" r="23" fill="none" stroke="#ffff99" strokeWidth="0.9" opacity="0.5" />
          <circle cx="29" cy="29" r="28" fill="none" stroke="#ffcc00" strokeWidth="0.7" opacity="0.3" />

          {/* Inherited power connection points - 5 predecessors */}
          <circle cx="29" cy="8" r="2.5" fill="#ffff99" opacity="0.8" filter={`url(#ofaglow${p.id})`} />
          <circle cx="50" cy="20" r="2.5" fill="#ffff99" opacity="0.8" filter={`url(#ofaglow${p.id})`} />
          <circle cx="44" cy="48" r="2.5" fill="#ffff99" opacity="0.8" filter={`url(#ofaglow${p.id})`} />
          <circle cx="14" cy="48" r="2.5" fill="#ffff99" opacity="0.8" filter={`url(#ofaglow${p.id})`} />
          <circle cx="8" cy="20" r="2.5" fill="#ffff99" opacity="0.8" filter={`url(#ofaglow${p.id})`} />

          {/* Connection lines to previous users */}
          <line x1="29" y1="29" x2="29" y2="8" stroke="#ffff99" strokeWidth="0.8" opacity="0.6" />
          <line x1="29" y1="29" x2="50" y2="20" stroke="#ffff99" strokeWidth="0.8" opacity="0.6" />
          <line x1="29" y1="29" x2="44" y2="48" stroke="#ffff99" strokeWidth="0.8" opacity="0.6" />
          <line x1="29" y1="29" x2="14" y2="48" stroke="#ffff99" strokeWidth="0.8" opacity="0.6" />
          <line x1="29" y1="29" x2="8" y2="20" stroke="#ffff99" strokeWidth="0.8" opacity="0.6" />

          {/* Current user power aura */}
          <circle cx="29" cy="29" r="32" fill="none" stroke="#ffcc00" strokeWidth="0.5" opacity="0.2" />
        </svg>
      );
    } else if (p.type === "explosion_strike") {
      return (
        <svg key={`proj-${p.id}`} width={65} height={65} style={baseStyle} viewBox="0 0 65 65" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`explosiongrad${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#ffaa00" />
              <stop offset="70%" stopColor="#ff3300" />
              <stop offset="100%" stopColor="#cc0000" />
            </radialGradient>
            <filter id={`explosionglow${p.id}`}><feGaussianBlur stdDeviation="2.5" /></filter>
          </defs>
          {/* Central explosive blast core */}
          <circle cx="32.5" cy="32.5" r="14" fill={`url(#explosiongrad${p.id})`} opacity="0.95" filter={`url(#explosionglow${p.id})`} />

          {/* Multiple explosion shockwave rings */}
          <circle cx="32.5" cy="32.5" r="20" fill="none" stroke="#ffaa00" strokeWidth="1.4" opacity="0.8" filter={`url(#explosionglow${p.id})`} />
          <circle cx="32.5" cy="32.5" r="26" fill="none" stroke="#ff6600" strokeWidth="1" opacity="0.6" />
          <circle cx="32.5" cy="32.5" r="31" fill="none" stroke="#ff3300" strokeWidth="0.8" opacity="0.4" />

          {/* Explosive blast fragments radiating outward */}
          <polygon points="32.5,4 37,12 34,20 39,12 37,4" fill="#ffaa00" opacity="0.85" filter={`url(#explosionglow${p.id})`} />
          <polygon points="61,32.5 53,37 45,34 53,39 61,37" fill="#ffaa00" opacity="0.85" filter={`url(#explosionglow${p.id})`} />
          <polygon points="32.5,61 28,53 31,45 26,53 28,61" fill="#ffaa00" opacity="0.85" filter={`url(#explosionglow${p.id})`} />
          <polygon points="4,32.5 12,28 20,31 12,26 4,28" fill="#ffaa00" opacity="0.85" filter={`url(#explosionglow${p.id})`} />

          {/* Diagonal explosion fragments */}
          <polygon points="50,10 45,16 42,14 47,18 49,10" fill="#ff6600" opacity="0.8" />
          <polygon points="55,50 51,44 53,40 47,46 55,48" fill="#ff6600" opacity="0.8" />
          <polygon points="15,55 19,49 21,51 17,45 15,55" fill="#ff6600" opacity="0.8" />
          <polygon points="10,15 16,17 14,21 12,19 10,15" fill="#ff6600" opacity="0.8" />

          {/* Hot spark particles */}
          <circle cx="24" cy="18" r="1.2" fill="#ffaa00" opacity="0.8" />
          <circle cx="48" cy="24" r="1" fill="#ffaa00" opacity="0.7" />
          <circle cx="48" cy="42" r="1.2" fill="#ffaa00" opacity="0.8" />
          <circle cx="24" cy="48" r="1" fill="#ffaa00" opacity="0.7" />
          <circle cx="17" cy="32.5" r="1.1" fill="#ffaa00" opacity="0.75" />
        </svg>
      );
    } else if (p.type === "half_cold_hot") {
      return (
        <svg key={`proj-${p.id}`} width={50} height={50} style={baseStyle} viewBox="0 0 50 50" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`halfcold${p.id}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#4fc3f7" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ff6600" />
            </linearGradient>
          </defs>
          <circle cx="25" cy="25" r="20" fill={`url(#halfcold${p.id})`} />
          <line x1="25" y1="5" x2="25" y2="45" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
          <polygon points="25,7 33,15 33,35 25,43 17,35 17,15" fill="none" stroke="#4fc3f7" strokeWidth="1.5" opacity="0.6" />
          <polygon points="25,7 33,15 33,35 25,43 17,35 17,15" fill="none" stroke="#ff6600" strokeWidth="1.5" opacity="0.6" />
        </svg>
      );
    } else if (p.type === "dark_erase") {
      const rotation = (Date.now() * 0.7) % 360;
      return (
        <svg key={`proj-${p.id}`} width={50} height={56} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${rotation}deg)`}} viewBox="0 0 50 56" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`darkerasegrad${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#444444" />
              <stop offset="60%" stopColor="#222222" />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>
            <filter id={`darkglow${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>
          {/* Dark absorbing core - erases quirks */}
          <circle cx="25" cy="28" r="10" fill={`url(#darkerasegrad${p.id})`} opacity="0.9" filter={`url(#darkglow${p.id})`} />

          {/* Absorbing vortex effect - spiraling inward */}
          <path d="M 12 28 Q 16 22 25 20 Q 34 22 38 28" fill="none" stroke="#666666" strokeWidth="0.8" opacity="0.7" />
          <path d="M 10 28 Q 15 18 25 16 Q 35 18 40 28" fill="none" stroke="#666666" strokeWidth="0.7" opacity="0.5" />
          <path d="M 8 36 Q 14 40 25 40 Q 36 40 42 36" fill="none" stroke="#666666" strokeWidth="0.8" opacity="0.7" />
          <path d="M 6 44 Q 12 50 25 52 Q 38 50 44 44" fill="none" stroke="#666666" strokeWidth="0.7" opacity="0.5" />

          {/* Spiraling erasure lines */}
          <path d="M 25 12 Q 20 18 22 28 Q 28 32 25 40" fill="none" stroke="#999999" strokeWidth="0.6" opacity="0.6" />
          <path d="M 25 12 Q 30 18 28 28 Q 22 32 25 40" fill="none" stroke="#999999" strokeWidth="0.6" opacity="0.6" />

          {/* Erasing aura - darkness spreading outward */}
          <circle cx="25" cy="28" r="16" fill="none" stroke="#333333" strokeWidth="0.8" opacity="0.5" filter={`url(#darkglow${p.id})`} />
          <circle cx="25" cy="28" r="22" fill="none" stroke="#333333" strokeWidth="0.5" opacity="0.2" />

          {/* Eye glow effect (Aizawa's erasing eyes) */}
          <circle cx="20" cy="26" r="1.5" fill="#ff3333" opacity="0.6" />
          <circle cx="30" cy="30" r="1.5" fill="#ff3333" opacity="0.6" />
        </svg>
      );
    } else if (p.type === "dna_boost") {
      const rotation = (Date.now() * 0.8) % 360;
      return (
        <svg key={`proj-${p.id}`} width={52} height={60} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${rotation}deg)`}} viewBox="0 0 52 60" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`dnagrad${p.id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#99ff00" />
              <stop offset="50%" stopColor="#66cc00" />
              <stop offset="100%" stopColor="#339900" />
            </linearGradient>
            <radialGradient id={`dnacore${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#99ff00" />
              <stop offset="100%" stopColor="#66cc00" />
            </radialGradient>
            <filter id={`dnaglow${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>
          {/* Central DNA core */}
          <circle cx="26" cy="30" r="6" fill={`url(#dnacore${p.id})`} opacity="0.9" filter={`url(#dnaglow${p.id})`} />

          {/* Double helix spiral - left strand */}
          <path d="M 16 8 Q 20 16 16 24 Q 12 32 16 40 Q 20 48 16 56" fill="none" stroke={`url(#dnagrad${p.id})`} strokeWidth="2" opacity="0.85" filter={`url(#dnaglow${p.id})`} />

          {/* Double helix spiral - right strand */}
          <path d="M 36 8 Q 32 16 36 24 Q 40 32 36 40 Q 32 48 36 56" fill="none" stroke={`url(#dnagrad${p.id})`} strokeWidth="2" opacity="0.85" filter={`url(#dnaglow${p.id})`} />

          {/* Connecting base pairs */}
          <line x1="17" y1="14" x2="35" y2="14" stroke="#99ff00" strokeWidth="0.8" opacity="0.6" />
          <line x1="14" y1="24" x2="38" y2="24" stroke="#99ff00" strokeWidth="0.8" opacity="0.6" />
          <line x1="14" y1="36" x2="38" y2="36" stroke="#99ff00" strokeWidth="0.8" opacity="0.6" />
          <line x1="17" y1="46" x2="35" y2="46" stroke="#99ff00" strokeWidth="0.8" opacity="0.6" />

          {/* Energy nodes on helixes */}
          <circle cx="16" cy="16" r="1.5" fill="#99ff00" opacity="0.8" />
          <circle cx="36" cy="24" r="1.5" fill="#99ff00" opacity="0.8" />
          <circle cx="16" cy="36" r="1.5" fill="#99ff00" opacity="0.8" />
          <circle cx="36" cy="44" r="1.5" fill="#99ff00" opacity="0.8" />

          {/* DNA boost aura */}
          <circle cx="26" cy="30" r="22" fill="none" stroke="#66cc00" strokeWidth="0.6" opacity="0.4" filter={`url(#dnaglow${p.id})`} />
        </svg>
      );
    } else if (p.type === "compression_pulse") {
      return (
        <svg key={`proj-${p.id}`} width={56} height={52} style={baseStyle} viewBox="0 0 56 52" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`compressiongrad${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#66ffff" />
              <stop offset="100%" stopColor="#0066ff" />
            </radialGradient>
            <filter id={`compressionglow${p.id}`}><feGaussianBlur stdDeviation="1.8" /></filter>
          </defs>
          {/* Central compressed core - squeezed inward */}
          <circle cx="28" cy="26" r="8" fill={`url(#compressiongrad${p.id})`} opacity="0.9" filter={`url(#compressionglow${p.id})`} />

          {/* Compression rings - compression force */}
          <circle cx="28" cy="26" r="14" fill="none" stroke="#66ffff" strokeWidth="1.2" opacity="0.8" filter={`url(#compressionglow${p.id})`} />
          <circle cx="28" cy="26" r="20" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.6" />
          <circle cx="28" cy="26" r="26" fill="none" stroke="#0066ff" strokeWidth="0.8" opacity="0.4" />

          {/* Horizontal compression lines - squeezed from sides */}
          <line x1="4" y1="26" x2="12" y2="26" stroke="#66ffff" strokeWidth="1.5" opacity="0.85" />
          <line x1="44" y1="26" x2="52" y2="26" stroke="#66ffff" strokeWidth="1.5" opacity="0.85" />
          <line x1="8" y1="26" x2="16" y2="26" stroke="#00d4ff" strokeWidth="1" opacity="0.7" />
          <line x1="40" y1="26" x2="48" y2="26" stroke="#00d4ff" strokeWidth="1" opacity="0.7" />

          {/* Vertical compression indicators */}
          <line x1="28" y1="6" x2="28" y2="12" stroke="#66ffff" strokeWidth="1" opacity="0.7" />
          <line x1="28" y1="40" x2="28" y2="46" stroke="#66ffff" strokeWidth="1" opacity="0.7" />
          <line x1="28" y1="8" x2="28" y2="14" stroke="#00d4ff" strokeWidth="0.8" opacity="0.5" />
          <line x1="28" y1="38" x2="28" y2="44" stroke="#00d4ff" strokeWidth="0.8" opacity="0.5" />

          {/* Diagonal compression vectors */}
          <path d="M 12 12 L 20 20" fill="none" stroke="#66ffff" strokeWidth="0.8" opacity="0.6" />
          <path d="M 44 12 L 36 20" fill="none" stroke="#66ffff" strokeWidth="0.8" opacity="0.6" />
          <path d="M 12 40 L 20 32" fill="none" stroke="#66ffff" strokeWidth="0.8" opacity="0.6" />
          <path d="M 44 40 L 36 32" fill="none" stroke="#66ffff" strokeWidth="0.8" opacity="0.6" />

          {/* Compression energy particles */}
          <circle cx="10" cy="26" r="1" fill="#66ffff" opacity="0.8" />
          <circle cx="46" cy="26" r="1" fill="#66ffff" opacity="0.8" />
          <circle cx="28" cy="10" r="1" fill="#66ffff" opacity="0.8" />
          <circle cx="28" cy="42" r="1" fill="#66ffff" opacity="0.8" />
        </svg>
      );
    // OTHER FAMOUS PROPERTIES
    } else if (p.type === "force_push") {
      return (
        <svg key={`proj-${p.id}`} width={70} height={50} style={baseStyle} viewBox="0 0 70 50" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`forcegrad${p.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="50%" stopColor="#0091ea" />
              <stop offset="100%" stopColor="#004ba0" />
            </linearGradient>
            <radialGradient id={`forcecore${p.id}`} cx="15%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#66ffff" />
              <stop offset="100%" stopColor="#0091ea" />
            </radialGradient>
            <filter id={`forceglow${p.id}`}><feGaussianBlur stdDeviation="2" /></filter>
          </defs>
          {/* Telekinetic push source - clenched fist energy */}
          <circle cx="12" cy="25" r="7" fill={`url(#forcecore${p.id})`} opacity="0.9" filter={`url(#forceglow${p.id})`} />

          {/* Expanding force push waves */}
          <ellipse cx="25" cy="25" rx="8" ry="9" fill="none" stroke="#00d4ff" strokeWidth="1.2" opacity="0.7" filter={`url(#forceglow${p.id})`} />
          <ellipse cx="40" cy="25" rx="12" ry="13" fill="none" stroke="#0091ea" strokeWidth="1" opacity="0.5" />
          <ellipse cx="55" cy="25" rx="16" ry="17" fill="none" stroke="#0091ea" strokeWidth="0.8" opacity="0.3" />

          {/* Radial force push lines from center */}
          <line x1="12" y1="8" x2="35" y2="4" stroke="#66ffff" strokeWidth="0.8" opacity="0.6" />
          <line x1="12" y1="12" x2="50" y2="8" stroke="#66ffff" strokeWidth="0.7" opacity="0.5" />
          <line x1="12" y1="42" x2="50" y2="42" stroke="#66ffff" strokeWidth="0.7" opacity="0.5" />
          <line x1="12" y1="38" x2="35" y2="46" stroke="#66ffff" strokeWidth="0.8" opacity="0.6" />

          {/* Central force vector arrow */}
          <polygon points="63,25 68,23 68,27" fill="#ffffff" opacity="0.9" />
          <line x1="20" y1="25" x2="60" y2="25" stroke="#66ffff" strokeWidth="1.2" opacity="0.8" />

          {/* Force push particles */}
          <circle cx="30" cy="15" r="0.8" fill="#66ffff" opacity="0.7" />
          <circle cx="45" cy="12" r="0.7" fill="#66ffff" opacity="0.6" />
          <circle cx="45" cy="38" r="0.7" fill="#66ffff" opacity="0.6" />
          <circle cx="60" cy="20" r="0.6" fill="#66ffff" opacity="0.5" />
        </svg>
      );
    } else if (p.type === "atomic_breath") {
      return (
        <svg key={`proj-${p.id}`} width={90} height={48} style={baseStyle} viewBox="0 0 90 48" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`atomicbeam${p.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#ff3300" />
              <stop offset="40%" stopColor="#ff6600" />
              <stop offset="70%" stopColor="#ffaa00" />
              <stop offset="100%" stopColor="#ffff00" />
            </linearGradient>
            <radialGradient id={`atomiccore${p.id}`} cx="10%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#ffff99" />
              <stop offset="100%" stopColor="#ff3300" />
            </radialGradient>
            <filter id={`atomicglow${p.id}`}><feGaussianBlur stdDeviation="3" /></filter>
          </defs>
          {/* Godzilla's atomic breath source */}
          <circle cx="10" cy="24" r="6" fill={`url(#atomiccore${p.id})`} opacity="0.95" filter={`url(#atomicglow${p.id})`} />

          {/* Main heat beam - expanding as it travels */}
          <polygon points="8,12 15,8 80,14 85,18 80,22 15,28 8,24" fill={`url(#atomicbeam${p.id})`} stroke="#ffff00" strokeWidth="0.9" opacity="0.95" filter={`url(#atomicglow${p.id})`} />
          <polygon points="8,36 15,32 80,34 85,30 80,26 15,20 8,24" fill={`url(#atomicbeam${p.id})`} stroke="#ff6600" strokeWidth="0.9" opacity="0.85" />

          {/* Heat distortion waves */}
          <path d="M 20,18 Q 35,10 55,12 Q 75,14 85,18" fill="none" stroke="#ffff99" strokeWidth="0.8" opacity="0.7" />
          <path d="M 20,30 Q 40,36 60,34 Q 75,32 85,30" fill="none" stroke="#ffff99" strokeWidth="0.8" opacity="0.7" />
          <path d="M 25,20 Q 50,8 75,16" fill="none" stroke="#ffffff" strokeWidth="0.6" opacity="0.6" />
          <path d="M 25,28 Q 50,40 75,32" fill="none" stroke="#ffffff" strokeWidth="0.6" opacity="0.6" />

          {/* Atomic reaction rings */}
          <circle cx="30" cy="24" r="4" fill="none" stroke="#ffaa00" strokeWidth="0.8" opacity="0.6" />
          <circle cx="50" cy="24" r="5.5" fill="none" stroke="#ffaa00" strokeWidth="0.7" opacity="0.5" />
          <circle cx="70" cy="24" r="7" fill="none" stroke="#ffaa00" strokeWidth="0.6" opacity="0.4" />

          {/* Hot spark particles */}
          <circle cx="15" cy="12" r="0.8" fill="#ffff99" opacity="0.8" />
          <circle cx="35" cy="10" r="0.7" fill="#ffff99" opacity="0.7" />
          <circle cx="55" cy="8" r="0.8" fill="#ffff99" opacity="0.8" />
          <circle cx="75" cy="10" r="0.7" fill="#ffff99" opacity="0.7" />
        </svg>
      );
    } else if (p.type === "infinity_snap") {
      return (
        <svg key={`proj-${p.id}`} width={70} height={70} style={baseStyle} viewBox="0 0 70 70" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`infinitygrad${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffff00" />
              <stop offset="20%" stopColor="#ff00ff" />
              <stop offset="40%" stopColor="#00ffff" />
              <stop offset="60%" stopColor="#ff0000" />
              <stop offset="100%" stopColor="#0000ff" />
            </radialGradient>
            <filter id={`infinityglow${p.id}`}><feGaussianBlur stdDeviation="3.5" /></filter>
          </defs>
          {/* Main infinity snap sphere - colorful destruction */}
          <circle cx="35" cy="35" r="30" fill={`url(#infinitygrad${p.id})`} />
          <circle cx="35" cy="35" r="28" fill="none" stroke="#ffff00" strokeWidth="2" opacity="0.8" />
          <circle cx="35" cy="35" r="24" fill="none" stroke="#ff00ff" strokeWidth="1.5" opacity="0.6" />
          <circle cx="35" cy="35" r="18" fill="none" stroke="#00ffff" strokeWidth="1" opacity="0.5" />
          
          {/* Destructive energy spikes radiating */}
          <polygon points="35,7 38,18 35,13 32,18" fill="#ffff00" opacity="0.9" />
          <polygon points="63,35 52,38 57,35 52,32" fill="#ff00ff" opacity="0.95" />
          <polygon points="35,63 32,52 35,57 38,52" fill="#00ffff" opacity="0.9" />
          <polygon points="7,35 18,32 13,35 18,38" fill="#ff0000" opacity="0.95" />
          
          {/* Diagonal energy spikes */}
          <polygon points="54,16 45,24 48,20 44,24" fill="#ffff00" opacity="0.8" />
          <polygon points="54,54 52,44 48,50 52,48" fill="#ff00ff" opacity="0.8" />
          <polygon points="16,54 22,46 20,50 24,44" fill="#00ffff" opacity="0.8" />
          <polygon points="16,16 24,24 20,20 24,24" fill="#ff0000" opacity="0.8" />
          
          {/* Super bright white core */}
          <circle cx="35" cy="35" r="14" fill="#ffffff" filter={`url(#infinityglow${p.id})`} opacity="0.9" />
          <circle cx="35" cy="35" r="8" fill="#ffff00" opacity="1" />
          <circle cx="35" cy="35" r="4" fill="#ffffff" opacity="1" />
        </svg>
      );
    } else if (p.type === "time_stop_burst") {
      const rotation = (Date.now() * 0.5) % 360; // Slow rotation for stopped time effect
      return (
        <svg key={`proj-${p.id}`} width={64} height={64} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${rotation}deg)`}} viewBox="0 0 64 64" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`timegrad${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffff99" />
              <stop offset="35%" stopColor="#ffff00" />
              <stop offset="70%" stopColor="#ffaa00" />
              <stop offset="100%" stopColor="#ff6600" />
            </radialGradient>
            <filter id={`timeglow${p.id}`}><feGaussianBlur stdDeviation="2.5" /></filter>
          </defs>
          {/* Clock face */}
          <circle cx="32" cy="32" r="28" fill={`url(#timegrad${p.id})`} opacity="0.9" filter={`url(#timeglow${p.id})`} />
          <circle cx="32" cy="32" r="26" fill="none" stroke="#ffff00" strokeWidth="2" opacity="0.85" />
          <circle cx="32" cy="32" r="22" fill="none" stroke="#ff6600" strokeWidth="1.5" opacity="0.6" />

          {/* Hour markers - 12 clock positions */}
          <line x1="32" y1="8" x2="32" y2="12" stroke="#ffaa00" strokeWidth="2" opacity="0.8" />
          <line x1="53" y1="32" x2="49" y2="32" stroke="#ffaa00" strokeWidth="2" opacity="0.8" />
          <line x1="32" y1="56" x2="32" y2="52" stroke="#ffaa00" strokeWidth="2" opacity="0.8" />
          <line x1="11" y1="32" x2="15" y2="32" stroke="#ffaa00" strokeWidth="2" opacity="0.8" />

          {/* Diagonal hour markers */}
          <line x1="48" y1="16" x2="45" y2="19" stroke="#ffaa00" strokeWidth="1.5" opacity="0.7" />
          <line x1="48" y1="48" x2="45" y2="45" stroke="#ffaa00" strokeWidth="1.5" opacity="0.7" />
          <line x1="16" y1="48" x2="19" y2="45" stroke="#ffaa00" strokeWidth="1.5" opacity="0.7" />
          <line x1="16" y1="16" x2="19" y2="19" stroke="#ffaa00" strokeWidth="1.5" opacity="0.7" />

          {/* Frozen clock hands */}
          <line x1="32" y1="32" x2="32" y2="16" stroke="#ffffff" strokeWidth="2.5" opacity="0.95" />
          <line x1="32" y1="32" x2="44" y2="32" stroke="#ffffff" strokeWidth="2" opacity="0.9" />
          <circle cx="32" cy="32" r="2.5" fill="#ffffff" />

          {/* Time stop aura rings - frozen in place */}
          <circle cx="32" cy="32" r="12" fill="none" stroke="#ffff99" strokeWidth="1.2" opacity="0.7" />
          <circle cx="32" cy="32" r="17" fill="none" stroke="#ffff99" strokeWidth="0.9" opacity="0.5" />
          <circle cx="32" cy="32" r="22" fill="none" stroke="#ff6600" strokeWidth="0.7" opacity="0.3" />

          {/* Center frozen point - time stopped */}
          <circle cx="32" cy="32" r="5" fill="#ffffff" filter={`url(#timeglow${p.id})`} opacity="0.85" />
          <circle cx="32" cy="32" r="2" fill="#ffff00" opacity="1" />
        </svg>
      );
    } else if (p.type === "dimension_rift") {
      const rotation = (Date.now() * 0.6) % 360;
      return (
        <svg key={`proj-${p.id}`} width={62} height={62} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${rotation}deg)`}} viewBox="0 0 62 62" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`dimensiongrad${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00ff99" />
              <stop offset="35%" stopColor="#00dd88" />
              <stop offset="70%" stopColor="#00aa66" />
              <stop offset="100%" stopColor="#006633" />
            </radialGradient>
            <radialGradient id={`riftvortex${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#66ffcc" />
              <stop offset="50%" stopColor="#00aa66" />
              <stop offset="100%" stopColor="#003333" />
            </radialGradient>
            <filter id={`dimensionglow${p.id}`}><feGaussianBlur stdDeviation="2" /></filter>
          </defs>
          {/* Central rift portal vortex */}
          <circle cx="31" cy="31" r="12" fill={`url(#riftvortex${p.id})`} opacity="0.95" filter={`url(#dimensionglow${p.id})`} />

          {/* Spiraling dimension rift rings */}
          <circle cx="31" cy="31" r="18" fill="none" stroke="#00ff99" strokeWidth="1.4" opacity="0.8" filter={`url(#dimensionglow${p.id})`} />
          <circle cx="31" cy="31" r="25" fill="none" stroke="#00dd88" strokeWidth="1" opacity="0.6" />
          <circle cx="31" cy="31" r="31" fill="none" stroke="#00aa66" strokeWidth="0.8" opacity="0.4" />

          {/* Dimensional fracture lines - reality breaking */}
          <path d="M 15 30 Q 20 20 31 18 Q 42 20 47 30" fill="none" stroke="#66ffcc" strokeWidth="0.9" opacity="0.7" />
          <path d="M 15 32 Q 20 42 31 44 Q 42 42 47 32" fill="none" stroke="#66ffcc" strokeWidth="0.9" opacity="0.7" />
          <path d="M 20 18 Q 30 15 42 20" fill="none" stroke="#00ff99" strokeWidth="0.7" opacity="0.6" />
          <path d="M 20 44 Q 30 47 42 42" fill="none" stroke="#00ff99" strokeWidth="0.7" opacity="0.6" />

          {/* Rift distortion points - dimensional tears */}
          <circle cx="12" cy="31" r="1.8" fill="#66ffcc" opacity="0.8" filter={`url(#dimensionglow${p.id})`} />
          <circle cx="50" cy="31" r="1.8" fill="#66ffcc" opacity="0.8" filter={`url(#dimensionglow${p.id})`} />
          <circle cx="31" cy="12" r="1.8" fill="#66ffcc" opacity="0.8" filter={`url(#dimensionglow${p.id})`} />
          <circle cx="31" cy="50" r="1.8" fill="#66ffcc" opacity="0.8" filter={`url(#dimensionglow${p.id})`} />

          {/* Diagonal dimensional fractures */}
          <path d="M 18 18 L 28 28" fill="none" stroke="#00ff99" strokeWidth="0.8" opacity="0.6" />
          <path d="M 44 18 L 34 28" fill="none" stroke="#00ff99" strokeWidth="0.8" opacity="0.6" />
          <path d="M 18 44 L 28 34" fill="none" stroke="#00ff99" strokeWidth="0.8" opacity="0.6" />
          <path d="M 44 44 L 34 34" fill="none" stroke="#00ff99" strokeWidth="0.8" opacity="0.6" />

          {/* Swirling energy particles inside rift */}
          <circle cx="25" cy="22" r="0.8" fill="#66ffcc" opacity="0.7" />
          <circle cx="37" cy="24" r="0.7" fill="#66ffcc" opacity="0.6" />
          <circle cx="26" cy="40" r="0.8" fill="#66ffcc" opacity="0.7" />
          <circle cx="38" cy="38" r="0.7" fill="#66ffcc" opacity="0.6" />
        </svg>
      );

    // CLASSIC WEAPONS (12 Powers)
    } else if (p.type === "missile") {
      return (
        <svg key={`proj-${p.id}`} width={50} height={16} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${angleDeg}deg)`}} viewBox="0 0 50 16" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`missilegrad${p.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#666" />
              <stop offset="40%" stopColor="#333" />
              <stop offset="100%" stopColor="#111" />
            </linearGradient>
            <filter id={`missileglow${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>
          {/* Missile body */}
          <rect x="2" y="4" width="36" height="8" rx="2" fill="#222" stroke="#ff4500" strokeWidth="0.8" />
          {/* Warhead nose cone */}
          <polygon points="38,4 50,8 38,12" fill="#ff4500" stroke="#cc3300" strokeWidth="0.5" />
          {/* Rocket fins */}
          <polygon points="3,0 8,4 3,4" fill="#888" stroke="#444" strokeWidth="0.4" />
          <polygon points="3,12 8,12 3,16" fill="#888" stroke="#444" strokeWidth="0.4" />
          {/* Window/sensor ports */}
          <circle cx="12" cy="8" r="1.2" fill="#0ff" opacity="0.7" />
          <circle cx="22" cy="8" r="1.2" fill="#0ff" opacity="0.7" />
          {/* Rocket exhaust trail glow */}
          <ellipse cx="2" cy="8" rx="2" ry="4" fill="#ff6600" opacity="0.6" filter={`url(#missileglow${p.id})`} />
        </svg>
      );
    } else if (p.type === "bomb") {
      return (
        <svg key={`proj-${p.id}`} width={32} height={36} style={baseStyle} viewBox="0 0 32 36" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`bombgrad${p.id}`} cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#333" />
              <stop offset="50%" stopColor="#111" />
              <stop offset="100%" stopColor="#000" />
            </radialGradient>
            <filter id={`bombglow${p.id}`}><feGaussianBlur stdDeviation="1" /></filter>
          </defs>
          {/* Round bomb body */}
          <circle cx="16" cy="18" r="13" fill={`url(#bombgrad${p.id})`} stroke="#333" strokeWidth="0.5" />
          {/* Shine highlight */}
          <ellipse cx="10" cy="12" rx="4" ry="5" fill="#555" opacity="0.6" />
          {/* Fuse */}
          <path d="M 16 4 Q 14 8 16 14" fill="none" stroke="#8B4513" strokeWidth="1.5" />
          {/* Fuse spark/flame */}
          <circle cx="16" cy="3" r="2" fill="#ff6b00" opacity="0.9" filter={`url(#bombglow${p.id})`} />
          <polygon points="16,2 14,5 18,5" fill="#ffaa00" opacity="0.8" />
          {/* Detail scratches */}
          <line x1="8" y1="16" x2="5" y2="18" stroke="#222" strokeWidth="0.4" opacity="0.5" />
          <line x1="24" y1="15" x2="27" y2="13" stroke="#222" strokeWidth="0.4" opacity="0.5" />
        </svg>
      );
    } else if (p.type === "drone") {
      const tilt = (Date.now() * 0.002) % 360;
      return (
        <svg key={`proj-${p.id}`} width={44} height={44} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${tilt}deg)`}} viewBox="0 0 44 44" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id={`droneglow${p.id}`}><feGaussianBlur stdDeviation="1" /></filter>
          </defs>
          {/* Drone body - central square */}
          <rect x="12" y="12" width="20" height="20" rx="2" fill="#333" stroke="#0f0" strokeWidth="0.8" />
          {/* Camera lens center */}
          <circle cx="22" cy="22" r="3" fill="#000" stroke="#0f0" strokeWidth="0.5" />
          <circle cx="22" cy="22" r="1.5" fill="#0f0" opacity="0.8" />
          {/* Propeller arms extending out */}
          <line x1="6" y1="22" x2="38" y2="22" stroke="#666" strokeWidth="1" />
          <line x1="22" y1="6" x2="22" y2="38" stroke="#666" strokeWidth="1" />
          {/* Propellers at arms end */}
          <circle cx="4" cy="22" r="3.5" fill="none" stroke="#0f0" strokeWidth="0.6" opacity="0.7" />
          <circle cx="40" cy="22" r="3.5" fill="none" stroke="#0f0" strokeWidth="0.6" opacity="0.7" />
          <circle cx="22" cy="4" r="3.5" fill="none" stroke="#0f0" strokeWidth="0.6" opacity="0.7" />
          <circle cx="22" cy="40" r="3.5" fill="none" stroke="#0f0" strokeWidth="0.6" opacity="0.7" />
          {/* Sensor lights corner */}
          <circle cx="14" cy="14" r="1" fill="#0f0" opacity="0.8" />
          <circle cx="30" cy="14" r="1" fill="#0f0" opacity="0.8" />
          <circle cx="14" cy="30" r="1" fill="#0f0" opacity="0.8" />
          <circle cx="30" cy="30" r="1" fill="#0f0" opacity="0.8" />
        </svg>
      );
    } else if (p.type === "rocket") {
      return (
        <svg key={`proj-${p.id}`} width={48} height={20} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${angleDeg}deg)`}} viewBox="0 0 48 20" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`rocketbody${p.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#cc0000" />
              <stop offset="50%" stopColor="#990000" />
              <stop offset="100%" stopColor="#660000" />
            </linearGradient>
            <filter id={`rocketglow${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>
          {/* Rocket main body */}
          <rect x="4" y="6" width="32" height="8" rx="1" fill={`url(#rocketbody${p.id})`} stroke="#330000" strokeWidth="0.5" />
          {/* Pointed nose cone */}
          <polygon points="36,6 48,10 36,14" fill="#ffaa00" stroke="#ff6600" strokeWidth="0.5" />
          {/* Stabilizer fins */}
          <polygon points="2,4 6,6 2,8" fill="#888" stroke="#444" />
          <polygon points="2,12 6,12 2,14" fill="#888" stroke="#444" />
          {/* Window stripe */}
          <rect x="10" y="7" width="12" height="6" fill="none" stroke="#ffaa00" strokeWidth="0.4" opacity="0.5" />
          {/* Rocket flame exhaust */}
          <polygon points="4,7 -2,10 4,13" fill="#ff6600" opacity="0.8" filter={`url(#rocketglow${p.id})`} />
          <polygon points="4,8 -4,10 4,12" fill="#ffaa00" opacity="0.6" />
        </svg>
      );
    } else if (p.type === "grenade") {
      return (
        <svg key={`proj-${p.id}`} width={28} height={32} style={baseStyle} viewBox="0 0 28 32" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`grenadegrad${p.id}`} cx="35%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#555" />
              <stop offset="60%" stopColor="#222" />
              <stop offset="100%" stopColor="#000" />
            </radialGradient>
          </defs>
          {/* Grenade body - bumpy */}
          <circle cx="14" cy="16" r="11" fill={`url(#grenadegrad${p.id})`} stroke="#111" strokeWidth="0.5" />
          {/* Bumps for texture */}
          <circle cx="8" cy="10" r="2" fill="#333" />
          <circle cx="20" cy="9" r="2" fill="#333" />
          <circle cx="10" cy="22" r="2" fill="#333" />
          <circle cx="18" cy="23" r="2" fill="#333" />
          {/* Pin handler ring */}
          <circle cx="14" cy="6" r="3.5" fill="none" stroke="#999" strokeWidth="0.8" />
          {/* Safety lever/pin */}
          <rect x="12" y="2" width="4" height="3" fill="#999" stroke="#666" strokeWidth="0.3" />
          {/* Spark/detonator glow */}
          <circle cx="14" cy="5" r="1" fill="#ff3300" opacity="0.8" />
        </svg>
      );
    } else if (p.type === "laser") {
      const intensity = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
      return (
        <svg key={`proj-${p.id}`} width={56} height={12} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${angleDeg}deg)`}} viewBox="0 0 56 12" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`lasergrad${p.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#ff0000" />
              <stop offset="50%" stopColor="#ff6600" />
              <stop offset="100%" stopColor="#ffaa00" />
            </linearGradient>
            <filter id={`laserglow${p.id}`}><feGaussianBlur stdDeviation="1.2" /></filter>
          </defs>
          {/* Main laser beam */}
          <rect x="0" y="4" width="56" height="4" fill={`url(#lasergrad${p.id})`} opacity={intensity} filter={`url(#laserglow${p.id})`} />
          {/* Laser pulse trail */}
          <rect x="0" y="4.5" width="56" height="3" fill="#ffff00" opacity={intensity * 0.6} />
          {/* Bright core */}
          <rect x="0" y="5" width="56" height="2" fill="#ffffff" opacity={intensity * 0.4} />
        </svg>
      );
    } else if (p.type === "plasma") {
      const wobble = Math.sin(Date.now() * 0.01) * 2;
      return (
        <svg key={`proj-${p.id}`} width={40} height={40} style={{...baseStyle}} viewBox="0 0 40 40" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`plasmagrad${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffff00" />
              <stop offset="30%" stopColor="#ff8800" />
              <stop offset="70%" stopColor="#ff0000" />
              <stop offset="100%" stopColor="#660000" />
            </radialGradient>
            <radialGradient id={`plasmacore${p.id}`} cx="50%" cy="50%" r="40%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#ffff00" />
              <stop offset="100%" stopColor="#ff0000" />
            </radialGradient>
            <filter id={`plasmaglow${p.id}`}><feGaussianBlur stdDeviation="2" /></filter>
          </defs>
          {/* Outer plasma aura */}
          <circle cx="20" cy="20" r="18" fill={`url(#plasmagrad${p.id})`} opacity="0.9" filter={`url(#plasmaglow${p.id})`} />
          {/* Middle plasma ring */}
          <circle cx="20" cy="20" r="13" fill="none" stroke="#ffff00" strokeWidth="1.2" opacity={0.7 + wobble * 0.2} />
          {/* Inner core */}
          <circle cx="20" cy="20" r="7" fill={`url(#plasmacore${p.id})`} opacity="0.95" filter={`url(#plasmaglow${p.id})`} />
          {/* Plasma arc particles */}
          <circle cx="12" cy="15" r="1.2" fill="#ffff00" opacity="0.8" />
          <circle cx="28" cy="18" r="1" fill="#ff8800" opacity="0.7" />
          <circle cx="15" cy="28" r="1.1" fill="#ffff00" opacity="0.75" />
          <circle cx="26" cy="26" r="1" fill="#ff0000" opacity="0.7" />
        </svg>
      );
    } else if (p.type === "emp_pulse") {
      const expansion = (Date.now() * 0.005) % 100;
      return (
        <svg key={`proj-${p.id}`} width={44} height={44} style={baseStyle} viewBox="0 0 44 44" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`empgrad${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00ff00" />
              <stop offset="40%" stopColor="#00aa00" />
              <stop offset="100%" stopColor="#005500" />
            </radialGradient>
            <filter id={`empglow${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>
          {/* Central EMP core */}
          <circle cx="22" cy="22" r="6" fill={`url(#empgrad${p.id})`} opacity="0.95" filter={`url(#empglow${p.id})`} />
          {/* Expanding pulse rings */}
          <circle cx="22" cy="22" r={10 + expansion/2} fill="none" stroke="#00ff00" strokeWidth="1.2" opacity={0.8 - expansion/150} />
          <circle cx="22" cy="22" r={16 + expansion} fill="none" stroke="#00aa00" strokeWidth="0.8" opacity={0.5 - expansion/200} />
          {/* Electromagnetic grid lines */}
          <line x1="10" y1="22" x2="34" y2="22" stroke="#00ff00" strokeWidth="0.6" opacity="0.6" />
          <line x1="22" y1="10" x2="22" y2="34" stroke="#00ff00" strokeWidth="0.6" opacity="0.6" />
          <path d="M 15 15 L 29 29" fill="none" stroke="#00ff00" strokeWidth="0.5" opacity="0.4" />
          <path d="M 29 15 L 15 29" fill="none" stroke="#00ff00" strokeWidth="0.5" opacity="0.4" />
        </svg>
      );
    } else if (p.type === "flamethrower") {
      return (
        <svg key={`proj-${p.id}`} width={52} height={24} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${angleDeg}deg)`}} viewBox="0 0 52 24" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`flamegrad${p.id}`} x1="1" x2="0" y1="0.5" y2="0.5">
              <stop offset="0%" stopColor="#ffcc00" />
              <stop offset="40%" stopColor="#ff6600" />
              <stop offset="100%" stopColor="#ff0000" />
            </linearGradient>
            <filter id={`flameglow${p.id}`}><feGaussianBlur stdDeviation="2" /></filter>
          </defs>
          {/* Flame cone shape - tapering burst */}
          <path d="M 52 8 L 30 4 L 32 12 L 30 20 L 52 16 Z" fill={`url(#flamegrad${p.id})`} opacity="0.9" filter={`url(#flameglow${p.id})`} />
          {/* Inner bright flame core */}
          <path d="M 50 10 L 35 8 L 36 12 L 35 16 L 50 14 Z" fill="#ffff00" opacity="0.8" />
          {/* Nozzle/barrel */}
          <rect x="2" y="9" width="30" height="6" rx="1" fill="#333" stroke="#666" strokeWidth="0.5" />
          {/* Fuel tank */}
          <circle cx="10" cy="12" r="4" fill="#555" stroke="#333" strokeWidth="0.4" />
        </svg>
      );
    } else if (p.type === "sonic_boom") {
      // Directional expanding chevron shockwave: ))) ► (not concentric circles).
      const t = ((Date.now() * 0.006) % 1);
      return (
        <svg key={`proj-${p.id}`} width={56} height={40} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${angleDeg}deg)`}} viewBox="0 0 56 40" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id={`sonicglow${p.id}`}><feGaussianBlur stdDeviation="0.8" /></filter>
          </defs>
          {/* Emitter core */}
          <circle cx="8" cy="20" r="4" fill="#00ffff" opacity="0.95" filter={`url(#sonicglow${p.id})`} />
          {/* Forward-travelling curved chevron waves */}
          <path d="M 16 8 Q 26 20 16 32" fill="none" stroke="#00ffff" strokeWidth="2.4" opacity={0.9 - t * 0.3} filter={`url(#sonicglow${p.id})`} />
          <path d="M 26 6 Q 38 20 26 34" fill="none" stroke="#00ccff" strokeWidth="2" opacity={0.7 - t * 0.3} />
          <path d="M 36 5 Q 50 20 36 35" fill="none" stroke="#0099ff" strokeWidth="1.6" opacity={0.5 - t * 0.2} />
          {/* Leading edge spark */}
          <circle cx={44 + t * 8} cy="20" r="1.6" fill="#ffffff" opacity={0.8 - t * 0.6} />
        </svg>
      );
    } else if (p.type === "shockwave") {
      // Radial burst wavefront expanding from the leading edge.
      const t = ((Date.now() * 0.005) % 1);
      return (
        <svg key={`proj-${p.id}`} width={52} height={52} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${angleDeg}deg)`}} viewBox="0 0 52 52" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`shockgrad${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="55%" stopColor="rgba(102,204,255,0)" />
              <stop offset="85%" stopColor="#0099ff" />
              <stop offset="100%" stopColor="rgba(0,102,204,0)" />
            </radialGradient>
            <filter id={`shockglow${p.id}`}><feGaussianBlur stdDeviation="1" /></filter>
          </defs>
          {/* Expanding ring burst */}
          <circle cx="26" cy="26" r={12 + t * 12} fill="none" stroke="#66ccff" strokeWidth={3 - t * 1.5} opacity={0.9 - t * 0.7} filter={`url(#shockglow${p.id})`} />
          <circle cx="26" cy="26" r={6 + t * 10} fill="none" stroke="#00ccff" strokeWidth="1.6" opacity={0.7 - t * 0.5} />
          {/* Compressed leading crescent (direction of travel) */}
          <path d="M 34 12 Q 48 26 34 40" fill="none" stroke="#ffffff" strokeWidth="2" opacity={0.85 - t * 0.4} filter={`url(#shockglow${p.id})`} />
          <circle cx="26" cy="26" r="3" fill="#bfefff" opacity="0.9" />
        </svg>
      );
    } else if (p.type === "acid_spray") {
      return (
        <svg key={`proj-${p.id}`} width={44} height={44} style={baseStyle} viewBox="0 0 44 44" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id={`acidgrad${p.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00ff00" />
              <stop offset="40%" stopColor="#00cc00" />
              <stop offset="100%" stopColor="#006600" />
            </radialGradient>
            <filter id={`acidglow${p.id}`}><feGaussianBlur stdDeviation="1.5" /></filter>
          </defs>
          {/* Central acid droplet */}
          <ellipse cx="22" cy="18" rx="9" ry="10" fill={`url(#acidgrad${p.id})`} opacity="0.95" filter={`url(#acidglow${p.id})`} />
          {/* Dripping acid effect - multiple droplets */}
          <circle cx="16" cy="32" r="2.5" fill="#00ff00" opacity="0.8" />
          <circle cx="22" cy="36" r="2" fill="#00ff00" opacity="0.7" />
          <circle cx="28" cy="32" r="2.5" fill="#00ff00" opacity="0.8" />
          {/* Corrosive vapor aura */}
          <circle cx="22" cy="18" r="14" fill="none" stroke="#00ff00" strokeWidth="1" opacity="0.5" />
          {/* Sizzle points */}
          <circle cx="10" cy="18" r="1" fill="#00ff00" opacity="0.7" />
          <circle cx="34" cy="18" r="1" fill="#00ff00" opacity="0.7" />
          <circle cx="22" cy="8" r="1" fill="#00ff00" opacity="0.7" />
        </svg>
      );
    } else {
      return (
        <svg key={`proj-${p.id}`} width={20} height={20} style={baseStyle} viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" fill="#ff4081" stroke="#c51162" strokeWidth="1" />
        </svg>
      );
    }
  };

  const renderAllProjectiles = () => {
    // Filter out duplicates by ID before rendering
    const seen = new Set<number>();
    const uniqueProjectiles = projectiles.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    return uniqueProjectiles.map((p) => renderProjectileVisual(p));
  };

  const renderMuzzleFlashes = () =>
    muzzleFlashes.map((m) => (
      <div
        key={`muzzle-${m.id}`}
        style={{
          position: "absolute",
          left: m.x,
          top: m.y,
          transform: "translate(-50%,-50%)",
          width: 56,
          height: 56,
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 1400,
          background: "radial-gradient(circle at 40% 30%, rgba(255,240,180,0.9) 0%, rgba(255,140,60,0.6) 30%, rgba(255,80,0,0.25) 60%, rgba(0,0,0,0) 100%)",
          boxShadow: "0 0 10px rgba(255,160,50,0.6)",
          animation: "muzzleFlashPulse 220ms ease-out forwards",
        }}
      />
    ));

  const renderHitEffects = () =>
    hitEffects.map((h) => (
      <div
        key={`hit-${h.id}`}
        style={{
          position: "absolute",
          left: h.x,
          top: h.y,
          transform: "translate(-50%,-50%)",
          width: 34,
          height: 34,
          borderRadius: 8,
          pointerEvents: "none",
          zIndex: 1400,
          background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9) 0%, rgba(255,200,60,0.9) 30%, rgba(255,80,0,0.6) 60%, rgba(0,0,0,0) 100%)",
          mixBlendMode: "screen",
          animation: "hitPop 280ms ease-out forwards",
        }}
      />
    ));
  
  // Render welding spark effects for blade-to-blade collisions
  const renderBladeSparkEffects = () =>
    bladeSparkEffects.map((s) => (
      <div
        key={`spark-${s.id}`}
        style={{
          position: "absolute",
          left: s.x,
          top: s.y,
          transform: "translate(-50%,-50%)",
          pointerEvents: "none",
          zIndex: 1500,
        }}
      >
        {/* Central bright flash */}
        <div style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,230,150,0.9) 30%, rgba(255,180,50,0.5) 60%, transparent 100%)",
          animation: "sparkFlash 300ms ease-out forwards",
        }} />
        {/* Flying sparks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
          const distance = 15 + Math.random() * 25;
          const size = 2 + Math.random() * 3;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: size,
                height: size,
                borderRadius: "50%",
                background: `radial-gradient(circle, #fff 0%, ${Math.random() > 0.5 ? '#ff8c00' : '#ffcc00'} 50%, #ff4500 100%)`,
                boxShadow: `0 0 ${size * 2}px ${Math.random() > 0.5 ? '#ff8c00' : '#ffcc00'}`,
                animation: `sparkFly${i % 4} 300ms ease-out forwards`,
                transform: `translate(-50%,-50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
              }}
            />
          );
        })}
        {/* Bright line streaks */}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
          const length = 10 + Math.random() * 20;
          return (
            <div
              key={`streak-${i}`}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 2,
                height: length,
                background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,200,50,0.6), transparent)",
                transformOrigin: "top center",
                transform: `translate(-50%, 0) rotate(${angle * (180 / Math.PI)}deg)`,
                animation: "sparkStreak 250ms ease-out forwards",
              }}
            />
          );
        })}
      </div>
    ));

  // ---------- Leaderboard rendering (no images, no numbering) ----------

  const MAX_LEADER_ENTRIES = 5; // reduced to avoid scrollbar and overflow

  const BubbleAvatar: React.FC<{ avatar?: number; size?: number }> = ({ avatar = 0, size = 52 }) => (
    <div style={{ width: size, height: size, borderRadius: "50%", backgroundImage: `url(${AVATAR_SPRITE_SRC})`, backgroundSize: `${size * 6}px ${size}px`, backgroundPosition: `${-(avatar % 6) * size}px 0`, backgroundColor: ["#ef4444", "#22d3ee", "#22c55e", "#facc15", "#a855f7", "#e5e7eb"][avatar % 6], border: "2px solid rgba(255,255,255,0.75)", boxShadow: "0 0 10px rgba(0,217,255,0.55)", flexShrink: 0 }} />
  );

  const renderLeaderboardNormal = () => {
    const top = [...uiBubblesSnapshot].sort((a, b) => b.health - a.health).slice(0, MAX_LEADER_ENTRIES);
    const aliveCount = uiBubblesSnapshot.length;
    return (
      <div style={{ width: "80%", padding: 8, boxSizing: "border-box", position: 'relative' }} ref={leaderboardRef}>
        {/* <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: "2px solid rgba(255,215,0,0.5)" }}>
          <div style={{ fontSize: 20 }}>🏆</div>
          <h3 style={{ margin: 0, color: "#ffd700", fontSize: 16, fontWeight: 700 }}>Leaderboard</h3>
          
        </div> */}
        
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {top.map((entry, idx) => {
            const fullName = entry.name || decodeURIComponent((entry.imgSrc.split("/").pop() ?? `#${entry.id}`).replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico)$/i, ""));
            const healthColor = entry.health > 60 ? "#00ff00" : entry.health > 30 ? "#ffff00" : "#ff0000";
            return (
              <div 
                key={`entry-${entry.id}`} 
                style={{ 
                  display: "flex", 
                  gap: 5, 
                  alignItems: "center", 
                  padding: "8px 9px", 
                  background: "rgba(0,0,0,0.55)",
                  borderRadius: 8,
                  border: `1px solid ${healthColor}33`,
                  boxSizing: "border-box",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {/* Rank Badge */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: idx === 0 ? "rgba(255,215,0,0.3)" : idx === 1 ? "rgba(192,192,192,0.3)" : idx === 2 ? "rgba(205,127,50,0.3)" : "rgba(255,255,255,0.1)",
                  border: idx === 0 ? "2px solid #ffd700" : idx === 1 ? "2px solid #c0c0c0" : idx === 2 ? "2px solid #cd7f32" : "1px solid rgba(255,255,255,0.2)",
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                </div>
                
                {/* Player Image */}
                {entry.imgSrc ? (
                  <img src={entry.imgSrc} alt={fullName} style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${healthColor}`, boxShadow: `0 0 8px ${healthColor}66` }} />
                ) : (
                  <BubbleAvatar avatar={entry.avatar} size={25} />
                )}
                
                {/* Player Info */}
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                  <div 
                    title={fullName} 
                    style={{ 
                      color: "#fff", 
                      fontSize: 11, 
                      fontWeight: 700, 
                      whiteSpace: "nowrap", 
                      overflow: "hidden", 
                      textOverflow: "ellipsis",
                      maxWidth: "100%"
                    }}
                  >
                    {fullName}
                  </div>
                  <div style={{ color: healthColor, fontSize: 10, fontWeight: 600, marginTop: 1 }}>
                    ❤️ {Math.round(entry.health)} HP
                  </div>
                </div>
              </div>
            );
          })}
          
        </div>
        
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src={watermarkUrl} alt="watermark" style={{ width: 48, height: 48, borderRadius: "50%", opacity: 1, pointerEvents: 'none', userSelect: 'none' }} />
          <div style={{ marginLeft: 12, fontSize: 15, fontWeight: 700, color: "#fff" }}>{aliveCount} Alive</div>
        </div>
      </div>
    );
  };

  const renderBossVersusCard = () => {
    const normals = uiBubblesSnapshot.slice(0, 8);
    const sbHealth = superBubbleSnapshot ? Math.max(0, Math.round(superBubbleSnapshot.health)) : 0;
    const sbHealthPct = superBubbleSnapshot ? Math.max(0, (superBubbleSnapshot.health / bossSuperbubbleHealth) * 100) : 0;
    
    return (
      <div style={{ width: "100%", padding: 8, maxHeight: "95vh", overflow: "auto" }}>
        {/* Team Header */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 8, 
          padding: "12px 8px", 
          background: "rgb(81 93 82 / 50%)", 
          borderRadius: 10,
          border: "1px solid rgba(76,175,80,0.3)",
          marginBottom: 12,
          position: "relative"
        }}>
          {eliminatedSide === "heroes" && <div style={{ position: "absolute", inset: 8, display: "grid", placeItems: "center", zIndex: 2, pointerEvents: "none", transform: "rotate(-10deg)", color: "#ff5252", fontSize: 18, fontWeight: 900, letterSpacing: 1, border: "2px solid #ff5252", textShadow: "0 0 8px #000" }}>ELIMINATED</div>}
          <span style={{ fontSize: 18 }}>🟢</span>
          <div style={{ color: "#ffffff", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Team Heroes</div>
          <div style={{ marginLeft: "auto", fontSize: 11, color: "#999" }}>{normals.length} active</div>
        </div>
        
        {/* Normal Bubbles - Vertical Stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {normals.map((n, idx) => {
            const name = n.name || decodeURIComponent((n.imgSrc.split("/").pop() || `Player ${idx + 1}`).replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico)$/i, ""));
            const healthColor = n.health > 60 ? "#00ff00" : n.health > 30 ? "#ffff00" : "#ff0000";
            return (
              <div 
                key={`bubble-${n.id}`} 
                style={{ 
                  display: "flex", 
                  gap: 10, 
                  alignItems: "center",
                  padding: "10px",
                  background: "rgb(81 93 82 / 50%)",
                  border: `1px solid ${healthColor}33`,
                  borderRadius: 8
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "rgb(81 93 82 / 50%)",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#4caf50",
                  flexShrink: 0
                }}>
                  {idx + 1}
                </div>
                {n.imgSrc ? (
                  <img src={n.imgSrc} alt={name} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${healthColor}` }} />
                ) : (
                  <BubbleAvatar avatar={n.avatar} size={40} />
                )}
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                  <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                  <div style={{ color: healthColor, fontSize: 11, fontWeight: 600, marginTop: 2 }}>❤️ {Math.round(n.health)}</div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* VS Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0", justifyContent: "center" }}>
          <div style={{ flex: 1, height: "2px", background: "linear-gradient(90deg, rgba(244,67,54,0), rgba(244,67,54,0.8), rgba(244,67,54,0))" }}></div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#ff6b6b", whiteSpace: "nowrap" }}>⚔️ VS ⚔️</div>
          <div style={{ flex: 1, height: "2px", background: "linear-gradient(90deg, rgba(244,67,54,0), rgba(244,67,54,0.8), rgba(244,67,54,0))" }}></div>
        </div>
        
        {/* Final Boss */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          gap: 12, 
          padding: "14px 12px", 
          background: "rgba(185, 81, 81, 0.5)", 
          borderRadius: 10,
          border: "2px solid rgba(244,67,54,0.5)",
          boxShadow: "0 0 20px rgba(244,67,54,0.3)",
          position: "relative"
        }}>
          {eliminatedSide === "boss" && <div style={{ position: "absolute", inset: 18, display: "grid", placeItems: "center", zIndex: 2, pointerEvents: "none", transform: "rotate(-12deg)", color: "#ff5252", fontSize: 22, fontWeight: 900, letterSpacing: 2, border: "3px solid #ff5252", textShadow: "0 0 10px #000", opacity: 0.9 }}>ELIMINATED</div>}
          <div style={{ fontSize: 28 }}>☠️</div>
          {superBubbleSnapshot && superBubbleSnapshot.imgSrc && (
            <img 
              src={superBubbleSnapshot.imgSrc} 
              alt="Super Bubble" 
              style={{ 
                width: 56, 
                height: 56, 
                borderRadius: "50%", 
                objectFit: "cover", 
                flexShrink: 0, 
                border: "3px solid #ff6b6b",
                boxShadow: "0 0 16px rgba(244,67,54,0.8)"
              }} 
            />
          )}
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>{superBubbleSnapshot?.name || "Final Boss"}</div>
            <div style={{ color: sbHealthPct > 65 ? "#00ff00" : sbHealthPct > 30 ? "#ffff00" : "#ff0000", fontSize: 13, fontWeight: 700, marginTop: 6 }}>
              ❤️ {sbHealth} / {Math.round(bossSuperbubbleHealth)}
            </div>
            <div style={{ 
              width: "100%", 
              height: 8, 
              background: "rgba(0,0,0,0.3)", 
              borderRadius: 4, 
              marginTop: 8, 
              overflow: "hidden",
              border: "1px solid rgba(244,67,54,0.5)"
            }}>
              <div style={{ 
                height: "100%", 
                width: `${sbHealthPct}%`, 
                background: sbHealthPct > 65 ? "linear-gradient(90deg, #00ff00, #00cc00)" : sbHealthPct > 30 ? "linear-gradient(90deg, #ffff00, #ffcc00)" : "linear-gradient(90deg, #ff0000, #cc0000)",
                transition: "width 0.2s"
              }}></div>
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src={watermarkUrl} alt="watermark" style={{ width: 48, height: 48, borderRadius: "50%", opacity: 1, pointerEvents: 'none', userSelect: 'none' }} />
        </div>
      </div>
    );
  };

  const renderBrawlVersusCard = () => {
    // For 1v1: display vertically - opponent 1 on top, opponent 2 on bottom
    if (brawlMode === "1v1" && uiBubblesSnapshot.length >= 2) {
      const left = uiBubblesSnapshot[0];
      const right = uiBubblesSnapshot[1];
      const leftName = left.name || decodeURIComponent((left.imgSrc.split("/").pop() ?? `#${left.id}`).replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico)$/i, "")).replace(/%20/g, " ");
      const rightName = right.name || decodeURIComponent((right.imgSrc.split("/").pop() ?? `#${right.id}`).replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico)$/i, "")).replace(/%20/g, " ");
      
      return (
        <div style={{ width: "100%", padding: 8 }}>
          {/* Player 1 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 8px", borderRadius: 8, background: "rgb(0 0 0 / 50%)" }}>
              {left.imgSrc ? <img src={left.imgSrc} alt={leftName} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(100,150,255,0.5)" }} /> : <BubbleAvatar avatar={left.avatar} />}
            <div style={{ textAlign: "center", width: "100%", minWidth: 0 }}>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, wordBreak: "break-word", maxWidth: "100%" }} title={leftName}>{leftName}</div>
              <div style={{ color: left.health > 60 ? "lime" : left.health > 30 ? "yellow" : "red", fontSize: 12, fontWeight: 600, marginTop: 6 }}>❤️ {Math.round(left.health)}</div>
            </div>
          </div>
          
          {/* VS Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0", justifyContent: "center" }}>
            <div style={{ flex: 1, height: "2px", background: "linear-gradient(90deg, rgba(255,152,0,0), rgba(255,152,0,0.8), rgba(255,152,0,0))" }}></div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#ff9800", whiteSpace: "nowrap" }}>⚡ VS ⚡</div>
            <div style={{ flex: 1, height: "2px", background: "linear-gradient(90deg, rgba(255,152,0,0), rgba(255,152,0,0.8), rgba(255,152,0,0))" }}></div>
          </div>
          
          {/* Player 2 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 8px", borderRadius: 8, background: "rgb(0 0 0 / 50%)" }}>
              {right.imgSrc ? <img src={right.imgSrc} alt={rightName} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,100,100,0.5)" }} /> : <BubbleAvatar avatar={right.avatar} />}
            <div style={{ textAlign: "center", width: "100%", minWidth: 0 }}>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, wordBreak: "break-word", maxWidth: "100%" }} title={rightName}>{rightName}</div>
              <div style={{ color: right.health > 60 ? "lime" : right.health > 30 ? "yellow" : "red", fontSize: 12, fontWeight: 600, marginTop: 6 }}>❤️ {Math.round(right.health)}</div>
            </div>
          </div>
          
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src={watermarkUrl} alt="watermark" style={{ width: 40, height: 40, borderRadius: "50%", opacity: 1, pointerEvents: 'none', userSelect: 'none' }} />
          </div>
        </div>
      );
    }
    
    // For 1vMany: show solo bubble on top, many opponents in vertical list below
    if (brawlMode === "1vMany" && uiBubblesSnapshot.length >= 2) {
      const solo = uiBubblesSnapshot.find((bubble) => brawlTeamsRef.current.get(bubble.id) === "solo") ?? uiBubblesSnapshot[0];
      const many = uiBubblesSnapshot
        .filter((bubble) => bubble.id !== solo.id && brawlTeamsRef.current.get(bubble.id) !== "solo")
        .slice(0, 9); // Up to 9 opponents
      const soloName = solo.name || decodeURIComponent((solo.imgSrc.split("/").pop() ?? `#${solo.id}`).replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico)$/i, "")).replace(/%20/g, " ");
      
      return (
        <div style={{ width: "100%", padding: 6, maxHeight: "95vh", overflow: "auto" }}>
          {/* Solo Player Hero */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px", borderRadius: 10, background: "rgba(0,0,0,50%)", marginBottom: 10 }}>
            <div style={{ fontSize: 18 }}>👑</div>
            {solo.imgSrc ? <img src={solo.imgSrc} alt={soloName} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "3px solid #4caf50", boxShadow: "0 0 12px rgba(76,175,80,0.6)" }} /> : <BubbleAvatar avatar={solo.avatar} size={56} />}
            <div style={{ textAlign: "center", width: "100%" }}>
              <div style={{ color: "#4caf50", fontSize: 11, fontWeight: 600, marginBottom: 2 }}>SOLO HERO</div>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 700, wordBreak: "break-word" }} title={soloName}>{soloName}</div>
              <div style={{ color: solo.health > 60 ? "lime" : solo.health > 30 ? "yellow" : "red", fontSize: 12, fontWeight: 700, marginTop: 4 }}>❤️ {Math.round(solo.health)} HP</div>
            </div>
          </div>
          
          {/* VS Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0", justifyContent: "center" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,152,0,0.3)" }}></div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#ff9800", whiteSpace: "nowrap" }}>VS</div>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,152,0,0.3)" }}></div>
          </div>
          
          {/* Many Opponents - Vertical Stack */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 6 }}>
            {many.map((opponent, idx) => {
              const opponentName = opponent.name || decodeURIComponent((opponent.imgSrc.split("/").pop() ?? `#${opponent.id}`).replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico)$/i, "")).replace(/%20/g, " ");
              return (
                <div key={`opponent-${opponent.id}`} style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px", background: "rgba(0,0,0,50%)", border: "1px solid rgba(244,67,54,0.2)", borderRadius: 8, transition: "all 0.2s" }}>
                  <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "rgba(244,67,54,0.3)", borderRadius: "50%", fontSize: 12, fontWeight: 700, color: "#ff6b6b" }}>{idx + 1}</div>
                  {opponent.imgSrc ? <img src={opponent.imgSrc} alt={opponentName} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} /> : <BubbleAvatar avatar={opponent.avatar} size={40} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#ddd", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={opponentName}>{opponentName}</div>
                    <div style={{ color: opponent.health > 60 ? "lime" : opponent.health > 30 ? "yellow" : "red", fontSize: 11, fontWeight: 600, marginTop: 2 }}>❤️ {Math.round(opponent.health)} HP</div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src={watermarkUrl} alt="watermark" style={{ width: 40, height: 40, borderRadius: "50%", opacity: 1, pointerEvents: 'none', userSelect: 'none' }} />
          </div>
        </div>
      );
    }
    
    // Fallback if not enough bubbles yet
    return (
      <div style={{ width: "100%", padding: 8, textAlign: "center", color: "#999", fontSize: 12 }}>
        Waiting for bubbles to load...
      </div>
    );
  };

  const WinnerOverlay: React.FC<{ winnerBubble?: BubbleData; winners?: BubbleData[]; winnersImgs?: string[]; bubbleCount: number }> = ({ winnerBubble, winners, winnersImgs, bubbleCount }) => {
    console.log('WinnerOverlay render:', { winnerBubble, winnersImgs, bubbleCount });
    
    // Helper to extract username from image URL
    const getNameFromImgSrc = (imgSrc: string): string => {
      if (!imgSrc) return '';
      // Extract filename from URL like http://localhost:5000/api/images/username.jpg
      const parts = imgSrc.split('/');
      const filename = parts[parts.length - 1];
      // Remove extension and decode URI
      const name = decodeURIComponent(filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, ''));
      // Replace underscores with spaces and capitalize
      return name.replace(/_/g, ' ');
    };
    
    // Handle draw/no winner case - check if bubble count is 0 or if winner is marked as draw
    const isDraw = winnerBubble?.imgSrc === "draw";
    console.log('isDraw:', isDraw, 'bubbleCount:', bubbleCount, 'winnerBubble?.imgSrc:', winnerBubble?.imgSrc);
    if (isDraw) {
      return (
        <div className="winner-modal" style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20000, pointerEvents: "auto" }}>
          <div
            onClick={() => {
              resetArenaKeepType();
              setArenaType(null);
              setArenaTypeSelected(false);
              setArenaReady(false);
              setWinner(null);
              setWinnersList(null);
              setWinnersImages(null);
            }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
          />
          <div style={{ position: "relative", zIndex: 10000, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, animation: "winnerPop 700ms ease both", color: "#fff" }}>
            <h2 style={{ margin: 0, fontSize: "3rem" }}>🤝 Draw!</h2>
            <p style={{ margin: 0, color: "#aaa", fontSize: "1.2rem" }}>Everyone died ☠️</p>
          </div>
        </div>
      );
    }
    
    if (winnersImgs && winnersImgs.length > 0) {
      // Check if it's superbubble win (single image) or team win (multiple images)
      const isSuperBubbleWin = winnersImgs.length === 1 && winnerBubble && winnerBubble.imgSrc === winnersImgs[0];
      const title = isSuperBubbleWin ? "Final Boss ☠️ Wins!" : "Players Win!";
      
      return (
        <div className="winner-modal" style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20000, pointerEvents: "auto" }}>
          <div
            onClick={() => {
              resetArenaKeepType();
              setArenaType(null);
              setArenaTypeSelected(false);
              setArenaReady(false);
              setWinner(null);
              setWinnersList(null);
              setWinnersImages(null);
            }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
          />
          <div style={{ position: "relative", zIndex: 10000, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, animation: "winnerPop 700ms ease both", color: "#fff" }}>
            <h2 style={{ margin: 0 }}>{title}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 12, width: "80vw", maxWidth: 600 }}>
              {winnersImgs.map((src, idx) => (
                <div key={`winimg-${idx}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: 8, borderRadius: 8 }}>
                  <img src={src} alt={`win-${idx}`} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
                  <div style={{ marginTop: 6, fontSize: "0.85rem", color: "#fff", textAlign: "center", wordBreak: "break-word" }}>{getNameFromImgSrc(src)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    if (winners && winners.length > 0) {
      return (
        <div className="winner-modal" style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20000, pointerEvents: "auto" }}>
          <div
            onClick={() => {
              resetArenaKeepType();
              setArenaType(null);
              setArenaTypeSelected(false);
              setArenaReady(false);
              setWinner(null);
              setWinnersList(null);
              setWinnersImages(null);
            }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
          />
          <div style={{ position: "relative", zIndex: 10000, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, animation: "winnerPop 700ms ease both", color: "#fff" }}>
            <h2 style={{ margin: 0 }}>Players Win!</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 12, width: "80vw", maxWidth: 600 }}>
              {winners.map((w) => (
                <div key={`winner-${w.id}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: 8, borderRadius: 8 }}>
                  {w.imgSrc ? (
                    <img src={w.imgSrc} alt={`winner`} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                  )}
                  <div style={{ marginTop: 6, fontSize: "0.85rem", color: "#fff", textAlign: "center", wordBreak: "break-word" }}>{w.name || getNameFromImgSrc(w.imgSrc)}</div>
                  <div style={{ fontSize: "0.75rem", color: w.health > 60 ? "#4ade80" : w.health > 30 ? "#facc15" : "#f87171" }}>{Math.round(w.health)} hp</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    if (!winnerBubble) return null;
    
    // Check if this is a draw or regular winner
    if (isDraw) {
      // Draw was already handled above, but this shouldn't happen
      return null;
    }
    
    const isSuperBubbleWin = winnerBubble.imgSrc === superBubbleSnapshot?.imgSrc && superBubbleSnapshot !== null;
    const displayHealth = Math.round(winnerBubble.health);
    const winnerName = winnerBubble.name || getNameFromImgSrc(winnerBubble.imgSrc);
    
    return (
      <div className="winner-modal" style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20000, pointerEvents: "auto" }}>
        <div
          onClick={() => {
            resetArenaKeepType();
            setArenaType(null);
            setArenaTypeSelected(false);
            setArenaReady(false);
            setWinner(null);
            setWinnersList(null);
            setWinnersImages(null);
          }}
          style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
        />
        <div style={{ position: "relative", zIndex: 10000, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, animation: "winnerPop 700ms ease both" }}>
          <h2 style={{ color: "#fff", margin: 0, transform: "translateY(-20px)" }}>{isSuperBubbleWin ? "Final Boss ☠️ Wins!" : "Winner!"}</h2>
          <div style={{ width: winnerBubble.radius * 4, height: winnerBubble.radius * 4, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transformOrigin: "center", animation: "bubbleZoom 700ms ease both", boxShadow: "0 8px 40px rgba(0,0,0,0.6)", background: "rgba(0,0,0,0.2)" }}>
            <img src={winnerBubble.imgSrc} alt="winner" style={{ width: "86%", height: "86%", borderRadius: "50%", objectFit: "cover" }} />
          </div>
          {winnerName && <div style={{ color: "#fff", fontSize: "1.5rem", fontWeight: "bold", marginTop: 4 }}>{winnerName}</div>}
          <div style={{ color: "#aaa", fontSize: "1rem" }}>{displayHealth} hp</div>
        </div>
        <style>{`@keyframes bubbleZoom { 0% { transform: scale(0.4) translateY(40px); opacity: 0; } 60% { transform: scale(1.08) translateY(-6px); opacity: 1; } 100% { transform: scale(1) translateY(0); opacity: 1; } } @keyframes winnerPop { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } @keyframes muzzleFlashPulse { 0% { transform: translate(-50%,-50%) scale(0.6); opacity: 1; } 80% { transform: translate(-50%,-50%) scale(1.05); opacity: 0.65; } 100% { transform: translate(-50%,-50%) scale(1.2); opacity: 0; } } @keyframes hitPop { 0% { transform: translate(-50%,-50%) scale(0.6); opacity: 1; } 100% { transform: translate(-50%,-50%) scale(1.5); opacity: 0; } }`}</style>
      </div>
    );
  };

  // ---------- Initial typed arrays ----------

  useEffect(() => {
    if (idListRef.current && avatarIndexRef.current) return;
    const cap = MAX_CAPACITY.current;
    idListRef.current = new Int32Array(cap);
    xRef.current = new Float32Array(cap);
    yRef.current = new Float32Array(cap);
    vxRef.current = new Float32Array(cap);
    vyRef.current = new Float32Array(cap);
    rRef.current = new Float32Array(cap);
    rTargetRef.current = new Float32Array(cap);
    healthRef.current = new Float32Array(cap);
    imgIndexRef.current = new Int32Array(cap);
    for (let i = 0; i < cap; i++) {
      imgIndexRef.current[i] = -1;
      rRef.current[i] = INITIAL_RADIUS;
      rTargetRef.current[i] = INITIAL_RADIUS;
    }
    return () => {};
  }, []);

  // ---------- Play handler ----------

  const handlePlay = () => {
    unlockArenaAudio();
    if ((idListRef.current === null || countRef.current === 0) && uiBubblesSnapshot.length > 0) {
      setBubblesFromArraysToUi(uiBubblesSnapshot);
    }
    // create a new game id for this match and tell statsClient to tag events with it
    const gid = `game-${Date.now()}`;
    currentGameRef.current = gid;
    try {
      const bm = arenaType === ARENA_TYPES.BRAWL ? brawlMode : null;
      statsClient && typeof (statsClient as any).setGame === "function" && (statsClient as any).setGame(gid, arenaType || ARENA_TYPES.NORMAL, bm);
    } catch (e) {}

    // Immediately post a zero-count presence event for every participant so
    // the server will create game-level entries for all players (prevents
    // boss games from containing only the single player who later generated
    // events). Include `arena` so entries go to the correct store.
    try {
      const seen = new Set();
      const players: string[] = [];
      // collect from current image list (normal bubbles)
      const imgs = imgSrcsRef.current || [];
      for (const s of imgs) {
        if (!s) continue;
        const key = (String(s || '') || '').replace(/^https?:\/\/[^\/]+\//, '').replace(/^\/+/, '').split('/').pop() || String(s);
        if (!seen.has(key)) { seen.add(key); players.push(key); }
      }
      // include superbubble if present
      let superbubbleKey = null;
      if (superBubbleRef.current && superBubbleRef.current.imgSrc) {
        const sb = String(superBubbleRef.current.imgSrc || '');
        const key = sb.replace(/^https?:\/\/[^\/]+\//, '').replace(/^\/+/, '').split('/').pop() || sb;
        if (!seen.has(key)) { 
          seen.add(key); 
          superbubbleKey = key; // Track this separately to mark it in the presence event
          players.push(key); 
        }
      }
      // fire-and-forget presence posts
      const presenceBrawlMode = arenaType === ARENA_TYPES.BRAWL ? brawlMode : undefined;
      for (const p of players) {
        try {
          const eventBody: any = { player: p, hits: 0, kills: 0, game: gid, arena: arenaType || ARENA_TYPES.NORMAL };
          if (presenceBrawlMode) eventBody.brawlMode = presenceBrawlMode;
          if (testMode) eventBody.testMode = testMode;
          // Mark superbubble presence events with isSuperbubble flag
          if (superbubbleKey && p === superbubbleKey) {
            eventBody.isSuperbubble = true;
          }
          fetch('http://localhost:5000/api/stats/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventBody),
          }).catch(() => {});
        } catch (e) {}
      }
    } catch (e) {}
    
    // Show arena intro animation first
    animationPauseRef.current = true;
    playArenaSound("intro", "", 3);
    setShowArenaIntroAnimation(true);
    
    setTimeout(() => {
      setShowArenaIntroAnimation(false);
      
      // Show animations for enabled features with timer=0
      const needsSpikeAnimation = spikeEnabled && spikeAutoEnableTime === 0;
      const needsPowerAnimation = (
        (arenaType === ARENA_TYPES.BOSS && playerPowersEnabled && playerPowersAutoEnableTime === 0) ||
        (arenaType === ARENA_TYPES.BRAWL && brawlPowersEnabled && brawlPowersAutoEnableTime === 0)
      );
      if (bladeEnabled && bladeAutoEnableTime === 0) playArenaSound("bladeEnable", "", 1.2);
      
      if (needsSpikeAnimation || needsPowerAnimation) {
        // Pause game for animations
        animationPauseRef.current = true;
        
        // Show spike animation first
        if (needsSpikeAnimation) {
          playArenaSound("spikeEnable", "", 4);
          setShowSpikeAnimation(true);
          setTimeout(() => {
            setShowSpikeAnimation(false);
            spikeAutoEnabledRef.current = true;
            
            // Show power animation after spike animation
            if (needsPowerAnimation) {
              playArenaSound("powerEnable", "", 4);
              setShowPowerAnimation(true);
              setTimeout(() => {
                setShowPowerAnimation(false);
                if (arenaType === ARENA_TYPES.BOSS) playerPowersAutoEnabledRef.current = true;
                if (arenaType === ARENA_TYPES.BRAWL) brawlPowersAutoEnabledRef.current = true;
                animationPauseRef.current = false; // Resume game
              }, 4000);
            } else {
              animationPauseRef.current = false; // Resume game
            }
          }, 4000);
        } else if (needsPowerAnimation) {
          // Only power animation
          playArenaSound("powerEnable", "", 4);
          setShowPowerAnimation(true);
          setTimeout(() => {
            setShowPowerAnimation(false);
            if (arenaType === ARENA_TYPES.BOSS) playerPowersAutoEnabledRef.current = true;
            if (arenaType === ARENA_TYPES.BRAWL) brawlPowersAutoEnabledRef.current = true;
            animationPauseRef.current = false; // Resume game
          }, 4000);
        }
      } else {
        // No feature animations, just resume game after arena intro
        animationPauseRef.current = false;
      }
    }, 3000); // 3 second arena intro animation
    
    setIsRunning(true);
    gameStartTimeRef.current = Date.now();
    spikeAutoEnabledRef.current = false;
    bladeAutoEnabledRef.current = false;
    playerPowersAutoEnabledRef.current = false;
    brawlPowersAutoEnabledRef.current = false;
    spikeEnabledAtRef.current = 0;
    bladeEnabledAtRef.current = 0;
    spikeAnimationShownRef.current = false;
    bladeAnimationShownRef.current = false;
    setWinner(null);
    setWinnersList(null);
    setWinnersImages(null);
    lastPickupSpawnRef.current = Date.now();
    preAssignedAppliedRef.current = false; // Reset for new game
    if (arenaType === ARENA_TYPES.NORMAL && !revealStartedRef.current) {
      startRevealPipelineIfNeeded();
    }
  };

  // UI helpers for toggles — sliding pill switch (label prop kept for API compat, not rendered).
  const ToggleButton: React.FC<{ on: boolean; onToggle: () => void; label: string }> = ({ on, onToggle }) => (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      style={{
        position: "relative", width: 44, height: 24, borderRadius: 999, border: "none", cursor: "pointer",
        padding: 0, flexShrink: 0,
        background: on ? "linear-gradient(90deg, #7c3aed, #22d3ee)" : "rgba(255,255,255,0.15)",
        boxShadow: on ? "0 0 10px rgba(124,58,237,0.7)" : "inset 0 0 0 1px rgba(255,255,255,0.15)",
        transition: "background 0.2s ease",
      }}
    >
      <span
        style={{
          position: "absolute", top: 2, left: on ? 22 : 2,
          width: 20, height: 20, borderRadius: "50%",
          background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
          transition: "left 0.18s ease",
        }}
      />
    </button>
  );

  // ---------- JSX ----------

  // Step 1: Arena Type Selection (Normal vs Boss vs Brawl)
  if (!arenaTypeSelected) {
    return (
      <div style={{ height: "100vh", background: "#111", color: "white", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 20 }}>
        <h1 style={{ fontSize: 42, fontWeight: 700, marginBottom: 10 }}>Select Arena Type</h1>
        <div style={{ display: "flex", gap: 16 }}>
          <button 
            onClick={() => {
              setArenaType(ARENA_TYPES.NORMAL);
              setArenaTypeSelected(true);
            }} 
            style={{ 
              padding: "16px 32px", 
              fontSize: 18, 
              fontWeight: 600,
              background: "#6b44ff",
              border: "none",
              borderRadius: 12,
              color: "#fff",
              cursor: "pointer"
            }}
          >
            ⚔️ Players Arena
          </button>
          <button 
            onClick={() => {
              setArenaType(ARENA_TYPES.BOSS);
              setArenaTypeSelected(true);
            }} 
            style={{ 
              padding: "16px 32px", 
              fontSize: 18, 
              fontWeight: 600,
              background: "#ff4081",
              border: "none",
              borderRadius: 12,
              color: "#fff",
              cursor: "pointer"
            }}
          >
            👹 Boss Arena
          </button>
          <button 
            onClick={() => {
              setArenaType(ARENA_TYPES.BRAWL);
              setArenaTypeSelected(true);
            }} 
            style={{ 
              padding: "16px 32px", 
              fontSize: 18, 
              fontWeight: 600,
              background: "#ff9800",
              border: "none",
              borderRadius: 12,
              color: "#fff",
              cursor: "pointer"
            }}
          >
            🥊 Brawl Arena
          </button>
        </div>
      </div>
    );
  }

  // Step 1.5: Brawl Mode Selection (if brawl arena is selected)
  if (arenaTypeSelected && arenaType === ARENA_TYPES.BRAWL && !brawlModeSelected) {
    return (
      <div style={{ height: "100vh", background: "#111", color: "white", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 20 }}>
        <h1 style={{ fontSize: 42, fontWeight: 700, marginBottom: 10 }}>Select Brawl Mode</h1>
        <p style={{ fontSize: 16, color: "#999", marginBottom: 20 }}>Choose between 1v1 or 1vMany battle</p>
        <div style={{ display: "flex", gap: 16 }}>
          <button 
            onClick={() => {
              setBrawlMode("1v1");
              setBrawlModeSelected(true);
            }} 
            style={{ 
              padding: "16px 32px", 
              fontSize: 18, 
              fontWeight: 600,
              background: "#4caf50",
              border: "none",
              borderRadius: 12,
              color: "#fff",
              cursor: "pointer"
            }}
          >
            🥊 1v1 Brawl
          </button>
          <button 
            onClick={() => {
              setBrawlMode("1vMany");
              setBrawlModeSelected(true);
            }} 
            style={{ 
              padding: "16px 32px", 
              fontSize: 18, 
              fontWeight: 600,
              background: "#f44336",
              border: "none",
              borderRadius: 12,
              color: "#fff",
              cursor: "pointer"
            }}
          >
            ⚔️ 1 vs Many
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Arena Shape Selection
  if (arenaTypeSelected && !requestedShape && !isRunning && countRef.current === 0 && !winner && !winnersList && !winnersImages && (arenaType !== ARENA_TYPES.BRAWL || brawlModeSelected)) {
    return (
      <div style={{ height: "100vh", background: "#111", color: "white", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 20, padding: "40px" }}>
        <h1 style={{ fontSize: 42, fontWeight: 700, marginBottom: 10 }}>Choose Arena Shape</h1>
        <p style={{ fontSize: 16, color: "#999", marginBottom: 20 }}>Selected: {arenaType === ARENA_TYPES.NORMAL ? '⚔️ Players Arena' : arenaType === ARENA_TYPES.BOSS ? '👹 Boss Arena' : `🥊 Brawl Arena (${brawlMode})`}</p>
        
        <div style={{ width: "90%", maxWidth: 1100 }}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: 16,
            padding: 20,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)"
          }}>
            {(Object.values(ARENA_SHAPES) as ArenaShape[]).map((shape) => (
              <button
                key={shape}
                onClick={() => setArenaShape(shape)}
                style={{
                  padding: "16px 14px",
                  background: arenaShape === shape ? "#6b44ff" : "rgba(255,255,255,0.08)",
                  border: arenaShape === shape ? "2px solid #8b66ff" : "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  color: arenaShape === shape ? "#fff" : "#ccc",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: arenaShape === shape ? 700 : 500,
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {ARENA_SHAPE_INFO[shape].name}
                </div>
                <div style={{ fontSize: 11, opacity: 0.8, textAlign: "center", lineHeight: 1.4 }}>
                  {ARENA_SHAPE_INFO[shape].description}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 20 }}>
          <button
            onClick={() => {
              setArenaTypeSelected(false);
              setArenaType(null);
            }}
            style={{
              padding: "12px 24px",
              fontSize: 16,
              background: "#444",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              cursor: "pointer"
            }}
          >
            ← Back
          </button>
          <button
            onClick={() => {
              // Trigger arena initialization by setting arenaReady
              setArenaReady(true);
            }}
            style={{
              padding: "12px 32px",
              fontSize: 16,
              fontWeight: 600,
              background: "#6b44ff",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              cursor: "pointer"
            }}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // Layout: shaped arena + leaderboard + right sidebar controls
  return (
    <div className="arena-page" style={{ display: "flex", height: "100vh", width: "100vw", background: activeThemeBgImage ? `${arenaOuterBackground}, url(${activeThemeBgImage}) center / cover, ${activeArenaTheme.background}` : `${arenaOuterBackground}, ${activeArenaTheme.background}, ${pageBackgroundColor}`, overflow: "hidden", position: "relative" }}>
      {/* Spike Animation Overlay - Centered in arena+leaderboard area */}
      {showSpikeAnimation && (
        <div style={{
          position: "absolute",
          top: 0,
          left: "320px",
          width: "calc(100vw - 320px)",
          height: "100vh",
          background: "radial-gradient(circle at 50% 50%, rgba(20,10,5,0.75), rgba(0,0,0,0.93) 70%)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "animeContainerBurst 0.5s cubic-bezier(0.2,0.9,0.3,1) both",
          overflow: "hidden",
          pointerEvents: "none"
        }}>
          <div className="anime-impact-fx" aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", width: "220vmax", height: "220vmax", marginLeft: "-110vmax", marginTop: "-110vmax", background: "repeating-conic-gradient(from 0deg, #ff660022 0deg 2deg, transparent 2deg 10deg)", animation: "speedLinesPulse 0.7s ease-out both", mixBlendMode: "screen" }} />
            <div style={{ position: "absolute", top: 0, left: "-10%", width: "70%", height: "100%", background: "linear-gradient(100deg, transparent, #ff6600cc 45%, transparent 55%)", clipPath: "polygon(0 0, 70% 0, 55% 100%, 0% 100%)", animation: "animeBarLeft 0.6s cubic-bezier(0.16,1,0.3,1) both", filter: "blur(1px)" }} />
            <div style={{ position: "absolute", top: 0, right: "-10%", width: "70%", height: "100%", background: "linear-gradient(260deg, transparent, #ff4500cc 45%, transparent 55%)", clipPath: "polygon(30% 0, 100% 0, 100% 100%, 45% 100%)", animation: "animeBarRight 0.6s cubic-bezier(0.16,1,0.3,1) both", filter: "blur(1px)" }} />
            <div style={{ position: "absolute", inset: 0, background: "#fff", animation: "animeFlashStrike 0.5s ease-out both", mixBlendMode: "overlay" }} />
          </div>
          <div style={{
            position: "relative",
            width: "900px",
            height: "260px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {/* Diagonal blade slash sweeping across the screen */}
            <div style={{
              position: "absolute",
              top: "50%",
              left: "-20%",
              width: "140%",
              height: "10px",
              background: "linear-gradient(90deg, transparent, #fff 20%, #ff6600 50%, #fff 80%, transparent)",
              boxShadow: "0 0 30px #ff6600, 0 0 60px #ff4500",
              transformOrigin: "left center",
              animation: "bladeWipe 0.5s cubic-bezier(0.7,0,0.3,1) 0.1s both"
            }} />
            {/* Metal shards kicked up by the slash */}
            {[...Array(10)].map((_, i) => (
              <div key={`shard-${i}`} style={{
                position: "absolute",
                top: "50%",
                left: `${8 + i * 9}%`,
                width: "14px",
                height: "14px",
                background: "linear-gradient(135deg, #ffcc80, #ff4500)",
                clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                animation: `shardFall 0.9s ease-in ${0.35 + i * 0.03}s both`,
                opacity: 0
              }} />
            ))}
            {/* Title revealed by the blade's wipe */}
            <div style={{
              fontSize: "64px",
              fontWeight: 900,
              background: "linear-gradient(135deg, #fff5e6, #ff8c00, #ff4500)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "0 0 30px rgba(255,120,0,0.9)",
              letterSpacing: "6px",
              textTransform: "uppercase",
              textAlign: "center",
              whiteSpace: "nowrap",
              clipPath: "inset(0 100% 0 0)",
              animation: "textWipeReveal 0.45s steps(18) 0.3s forwards, animeTextGlitch 1.3s ease-in-out 0.8s infinite"
            }}>
              SPIKES ENABLED
            </div>
          </div>
        </div>
      )}

      {/* Blade Animation Overlay - Rotating saw blade enabled animation */}
      {showBladeAnimation && (
        <div style={{
          position: "absolute",
          top: 0,
          left: "320px",
          width: "calc(100vw - 320px)",
          height: "100vh",
          background: "radial-gradient(circle at 50% 50%, rgba(25,8,8,0.75), rgba(0,0,0,0.93) 70%)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "animeContainerBurst 0.5s cubic-bezier(0.2,0.9,0.3,1) both",
          overflow: "hidden",
          pointerEvents: "none"
        }}>
          <div className="anime-impact-fx" aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", width: "220vmax", height: "220vmax", marginLeft: "-110vmax", marginTop: "-110vmax", background: "repeating-conic-gradient(from 0deg, #ff444422 0deg 2deg, transparent 2deg 10deg)", animation: "speedLinesPulse 0.7s ease-out both", mixBlendMode: "screen" }} />
            <div style={{ position: "absolute", top: 0, left: "-10%", width: "70%", height: "100%", background: "linear-gradient(100deg, transparent, #ff4444cc 45%, transparent 55%)", clipPath: "polygon(0 0, 70% 0, 55% 100%, 0% 100%)", animation: "animeBarLeft 0.6s cubic-bezier(0.16,1,0.3,1) both", filter: "blur(1px)" }} />
            <div style={{ position: "absolute", top: 0, right: "-10%", width: "70%", height: "100%", background: "linear-gradient(260deg, transparent, #cc2222cc 45%, transparent 55%)", clipPath: "polygon(30% 0, 100% 0, 100% 100%, 45% 100%)", animation: "animeBarRight 0.6s cubic-bezier(0.16,1,0.3,1) both", filter: "blur(1px)" }} />
            <div style={{ position: "absolute", inset: 0, background: "#fff", animation: "animeFlashStrike 0.5s ease-out both", mixBlendMode: "overlay" }} />
          </div>
          <div style={{
            position: "relative",
            width: "420px",
            height: "420px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {/* Mechanical iris aperture spinning open and away */}
            <div style={{
              position: "absolute",
              width: "320px",
              height: "320px",
              borderRadius: "50%",
              background: "conic-gradient(#3a3a3a 0deg 40deg, transparent 40deg 45deg, #3a3a3a 45deg 85deg, transparent 85deg 90deg, #3a3a3a 90deg 130deg, transparent 130deg 135deg, #3a3a3a 135deg 175deg, transparent 175deg 180deg, #3a3a3a 180deg 220deg, transparent 220deg 225deg, #3a3a3a 225deg 265deg, transparent 265deg 270deg, #3a3a3a 270deg 310deg, transparent 310deg 315deg, #3a3a3a 315deg 355deg, transparent 355deg 360deg)",
              boxShadow: "0 0 40px rgba(255,68,68,0.5)",
              animation: "irisSpinOpen 0.7s cubic-bezier(0.6,0,0.2,1) both"
            }} />
            <div style={{
              position: "absolute",
              width: "140px",
              height: "140px",
              borderRadius: "50%",
              border: "4px solid #ff4444",
              boxShadow: "0 0 20px #ff4444",
              animation: "ringPulseOut 0.8s ease-out 0.25s both"
            }} />
            {/* Twinkling sparks at the iris edge */}
            {[...Array(16)].map((_, i) => {
              const a = (i * 22.5) * Math.PI / 180;
              return (
                <div key={`spark2-${i}`} style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: i % 2 ? "#ffaa00" : "#ff4444",
                  boxShadow: "0 0 10px currentColor",
                  transform: `translate(${Math.cos(a) * 160}px, ${Math.sin(a) * 160}px)`,
                  animation: `sparkTwinkle 0.7s ease-out ${0.4 + i * 0.015}s both`
                }} />
              );
            })}
            {/* Title stamped on a rotating metal plate */}
            <div style={{
              position: "relative",
              fontSize: "40px",
              fontWeight: 900,
              background: "linear-gradient(135deg, #fff, #ff6666, #cc2222)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "0 0 30px rgba(255,68,68,0.9)",
              letterSpacing: "3px",
              textTransform: "uppercase",
              textAlign: "center",
              whiteSpace: "nowrap",
              animation: "stampDown 0.5s cubic-bezier(0.2,0.9,0.3,1) 0.55s both, animeTextGlitch 1.3s ease-in-out 1.1s infinite"
            }}>
              BLADES ENABLED
            </div>
          </div>
        </div>
      )}

      {/* Arena Intro Animation - Shows arena type at game start */}
      {showArenaIntroAnimation && arenaType === ARENA_TYPES.NORMAL && (
        <div style={{
          position: "absolute",
          top: 0,
          left: "320px",
          width: "calc(100vw - 320px)",
          height: "100vh",
          background: "radial-gradient(circle at 50% 40%, rgba(40,40,80,0.85), rgba(0,0,0,0.96) 75%)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "animeContainerBurst 0.55s cubic-bezier(0.2,0.9,0.3,1) both",
          overflow: "hidden",
          pointerEvents: "none"
        }}>
          <div className="anime-impact-fx" aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", width: "220vmax", height: "220vmax", marginLeft: "-110vmax", marginTop: "-110vmax", background: "repeating-conic-gradient(from 0deg, #4fc3f722 0deg 2deg, transparent 2deg 10deg)", animation: "speedLinesPulse 0.8s ease-out both", mixBlendMode: "screen" }} />
            <div style={{ position: "absolute", top: 0, left: "-10%", width: "70%", height: "100%", background: "linear-gradient(100deg, transparent, #4fc3f7cc 45%, transparent 55%)", clipPath: "polygon(0 0, 70% 0, 55% 100%, 0% 100%)", animation: "animeBarLeft 0.65s cubic-bezier(0.16,1,0.3,1) both", filter: "blur(1px)" }} />
            <div style={{ position: "absolute", top: 0, right: "-10%", width: "70%", height: "100%", background: "linear-gradient(260deg, transparent, #ff5722cc 45%, transparent 55%)", clipPath: "polygon(30% 0, 100% 0, 100% 100%, 45% 100%)", animation: "animeBarRight 0.65s cubic-bezier(0.16,1,0.3,1) both", filter: "blur(1px)" }} />
            <div style={{ position: "absolute", inset: 0, background: "#fff", animation: "animeFlashStrike 0.55s ease-out both", mixBlendMode: "overlay" }} />
          </div>
          <div style={{
            position: "relative",
            width: "760px",
            height: "360px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {/* Two banners drop in from top/bottom and clash */}
            <div style={{
              position: "absolute",
              top: 0,
              left: "50%",
              width: "120%",
              height: "55%",
              background: "linear-gradient(160deg, #4fc3f7, #0288d1)",
              clipPath: "polygon(0 0, 100% 0, 85% 100%, 15% 100%)",
              transform: "translateX(-50%) translateY(-100%)",
              animation: "bannerDropTop 0.55s cubic-bezier(0.2,0.9,0.3,1) both",
              boxShadow: "0 10px 40px rgba(79,195,247,0.5)"
            }} />
            <div style={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              width: "120%",
              height: "55%",
              background: "linear-gradient(-20deg, #ff5722, #d32f2f)",
              clipPath: "polygon(15% 0, 85% 0, 100% 100%, 0 100%)",
              transform: "translateX(-50%) translateY(100%)",
              animation: "bannerDropBottom 0.55s cubic-bezier(0.2,0.9,0.3,1) both",
              boxShadow: "0 -10px 40px rgba(255,87,34,0.5)"
            }} />
            {/* Shockwave at the clash point */}
            <div style={{
              position: "absolute",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              border: "3px solid #fff",
              animation: "shockwaveRing 0.6s ease-out 0.5s both"
            }} />
            {/* Title letters drop in from alternating directions */}
            <div style={{ position: "relative", zIndex: 10, display: "flex" }}>
              {"PLAYERS ARENA".split("").map((ch, i) => (
                <span key={i} style={{
                  display: "inline-block",
                  fontSize: "52px",
                  fontWeight: 900,
                  color: "#fff",
                  textShadow: "0 0 20px rgba(255,255,255,0.8)",
                  minWidth: ch === " " ? "20px" : undefined,
                  animation: `${i % 2 === 0 ? "letterDrop0" : "letterDrop1"} 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.65 + i * 0.03}s both`
                }}>{ch === " " ? "\u00A0" : ch}</span>
              ))}
            </div>
            {/* Subtitle typed out like a VN dialogue line */}
            <div style={{
              position: "absolute",
              bottom: "26px",
              fontSize: "17px",
              color: "#cfe8ff",
              fontFamily: "monospace",
              letterSpacing: "2px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              borderRight: "2px solid #4fc3f7",
              width: 0,
              animation: "typeReveal 0.6s steps(22) 1.3s forwards"
            }}>
              &gt; LAST BRAWLER STANDING WINS
            </div>
          </div>
        </div>
      )}

      {showArenaIntroAnimation && arenaType === ARENA_TYPES.BOSS && (
        <div style={{
          position: "absolute",
          top: 0,
          left: "320px",
          width: "calc(100vw - 320px)",
          height: "100vh",
          background: "radial-gradient(circle at 50% 40%, rgba(90,0,0,0.85), rgba(0,0,0,0.96) 75%)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "animeContainerBurst 0.55s cubic-bezier(0.2,0.9,0.3,1) both",
          overflow: "hidden",
          pointerEvents: "none"
        }}>
          <div className="anime-impact-fx" aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", width: "220vmax", height: "220vmax", marginLeft: "-110vmax", marginTop: "-110vmax", background: "repeating-conic-gradient(from 0deg, #ff174422 0deg 2deg, transparent 2deg 10deg)", animation: "speedLinesPulse 0.8s ease-out both", mixBlendMode: "screen" }} />
            <div style={{ position: "absolute", top: 0, left: "-10%", width: "70%", height: "100%", background: "linear-gradient(100deg, transparent, #ff1744cc 45%, transparent 55%)", clipPath: "polygon(0 0, 70% 0, 55% 100%, 0% 100%)", animation: "animeBarLeft 0.65s cubic-bezier(0.16,1,0.3,1) both", filter: "blur(1px)" }} />
            <div style={{ position: "absolute", top: 0, right: "-10%", width: "70%", height: "100%", background: "linear-gradient(260deg, transparent, #c62828cc 45%, transparent 55%)", clipPath: "polygon(30% 0, 100% 0, 100% 100%, 45% 100%)", animation: "animeBarRight 0.65s cubic-bezier(0.16,1,0.3,1) both", filter: "blur(1px)" }} />
            <div style={{ position: "absolute", inset: 0, background: "#fff", animation: "animeFlashStrike 0.55s ease-out both", mixBlendMode: "overlay" }} />
          </div>
          <div style={{
            position: "relative",
            width: "640px",
            height: "380px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {/* Concentric danger rings */}
            {[0, 1, 2].map((i) => (
              <div key={`ring-${i}`} style={{
                position: "absolute",
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                border: "2px solid #ff1744",
                boxShadow: "0 0 20px #ff1744",
                animation: `dangerRingOut 1.4s ease-out ${i * 0.3}s infinite`
              }} />
            ))}
            {/* A giant eye slowly opens */}
            <div style={{
              position: "relative",
              width: "220px",
              height: "120px",
              borderRadius: "50%",
              background: "radial-gradient(circle, #3a0000, #000)",
              animation: "eyeOpen 0.9s cubic-bezier(0.2,0.9,0.3,1) 0.15s forwards",
              boxShadow: "0 0 60px rgba(255,23,68,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <div style={{
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                background: "radial-gradient(circle at 35% 35%, #ff5252, #ff1744 60%, #4a0000)",
                boxShadow: "0 0 40px #ff1744",
                animation: "irisGlow 1.2s ease-in-out infinite"
              }} />
            </div>
            {/* Title burns in */}
            <div style={{
              marginTop: "28px",
              fontSize: "58px",
              fontWeight: 900,
              background: "linear-gradient(90deg, #4a0000, #ff1744, #ff8a80, #ff1744, #4a0000)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "0 0 30px rgba(255,23,68,0.7)",
              letterSpacing: "6px",
              textTransform: "uppercase",
              textAlign: "center",
              whiteSpace: "nowrap",
              opacity: 0,
              animation: "emberReveal 0.9s ease-out 1.0s forwards, emberSweep 2.5s linear 1.9s infinite"
            }}>
              BOSS ARENA
            </div>
            <div style={{
              fontSize: "18px",
              color: "#ffb3b3",
              marginTop: "12px",
              opacity: 0,
              animation: "fadeIn 0.5s ease-out 1.6s forwards"
            }}>
              Defeat the Mighty Boss!
            </div>
          </div>
        </div>
      )}

      {showArenaIntroAnimation && arenaType === ARENA_TYPES.BRAWL && (
        <div style={{
          position: "absolute",
          top: 0,
          left: "320px",
          width: "calc(100vw - 320px)",
          height: "100vh",
          background: "radial-gradient(circle at 50% 40%, rgba(70,0,70,0.85), rgba(0,0,0,0.96) 75%)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "animeContainerBurst 0.55s cubic-bezier(0.2,0.9,0.3,1) both",
          overflow: "hidden",
          pointerEvents: "none"
        }}>
          <div className="anime-impact-fx" aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", width: "220vmax", height: "220vmax", marginLeft: "-110vmax", marginTop: "-110vmax", background: "repeating-conic-gradient(from 0deg, #9c27b022 0deg 2deg, transparent 2deg 10deg)", animation: "speedLinesPulse 0.8s ease-out both", mixBlendMode: "screen" }} />
            <div style={{ position: "absolute", top: 0, left: "-10%", width: "70%", height: "100%", background: "linear-gradient(100deg, transparent, #9c27b0cc 45%, transparent 55%)", clipPath: "polygon(0 0, 70% 0, 55% 100%, 0% 100%)", animation: "animeBarLeft 0.65s cubic-bezier(0.16,1,0.3,1) both", filter: "blur(1px)" }} />
            <div style={{ position: "absolute", top: 0, right: "-10%", width: "70%", height: "100%", background: "linear-gradient(260deg, transparent, #ff9800cc 45%, transparent 55%)", clipPath: "polygon(30% 0, 100% 0, 100% 100%, 45% 100%)", animation: "animeBarRight 0.65s cubic-bezier(0.16,1,0.3,1) both", filter: "blur(1px)" }} />
            <div style={{ position: "absolute", inset: 0, background: "#fff", animation: "animeFlashStrike 0.55s ease-out both", mixBlendMode: "overlay" }} />
          </div>
          <div style={{
            position: "relative",
            width: "680px",
            height: "320px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {/* Targeting corner brackets converge */}
            {[
              { top: 0, left: 0, from: "translate(-300px,-300px)", edges: { borderTop: true, borderLeft: true } },
              { top: 0, right: 0, from: "translate(300px,-300px)", edges: { borderTop: true, borderRight: true } },
              { bottom: 0, right: 0, from: "translate(300px,300px)", edges: { borderBottom: true, borderRight: true } },
              { bottom: 0, left: 0, from: "translate(-300px,300px)", edges: { borderBottom: true, borderLeft: true } },
            ].map((c, i) => (
              <div key={i} style={{
                position: "absolute",
                top: c.top,
                left: c.left,
                right: c.right,
                bottom: c.bottom,
                width: "50px",
                height: "50px",
                borderTop: c.edges.borderTop ? "5px solid #ff9800" : undefined,
                borderLeft: c.edges.borderLeft ? "5px solid #ff9800" : undefined,
                borderRight: c.edges.borderRight ? "5px solid #ff9800" : undefined,
                borderBottom: c.edges.borderBottom ? "5px solid #ff9800" : undefined,
                filter: "drop-shadow(0 0 10px #ff9800)",
                transform: c.from,
                animation: `bracketConverge 0.5s cubic-bezier(0.2,0.9,0.3,1) ${i * 0.05}s forwards`
              }} />
            ))}
            {/* Oversized VS stamp behind the title */}
            <div style={{
              position: "absolute",
              fontSize: "140px",
              fontWeight: 900,
              color: "rgba(156,39,176,0.18)",
              transform: "rotate(-12deg) scale(2)",
              letterSpacing: "4px",
              whiteSpace: "nowrap",
              animation: "stampFade 0.6s ease-out 0.3s both"
            }}>VS</div>
            {/* Confetti shards bursting out */}
            {[...Array(14)].map((_, i) => {
              const a = (i * 25.7) * Math.PI / 180;
              const dist = 140 + (i % 3) * 40;
              return (
                <div key={`confetti-${i}`} style={{
                  position: "absolute",
                  width: "10px",
                  height: "16px",
                  background: i % 2 ? "#ff9800" : "#9c27b0",
                  transform: `translate(${Math.cos(a) * dist}px, ${Math.sin(a) * dist}px) rotate(${i * 40}deg)`,
                  animation: `confettiBurst 0.7s ease-out ${0.5 + i * 0.02}s both`,
                  opacity: 0
                }} />
              );
            })}
            {/* Title */}
            <div style={{
              position: "relative",
              zIndex: 10,
              fontSize: "52px",
              fontWeight: 900,
              background: "linear-gradient(135deg, #e040fb, #ff9800, #f44336)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "0 0 30px rgba(156,39,176,0.8)",
              letterSpacing: "5px",
              textTransform: "uppercase",
              textAlign: "center",
              whiteSpace: "nowrap",
              animation: "popSettle 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.55s both"
            }}>
              BRAWL ARENA
            </div>
            <div style={{
              position: "absolute",
              bottom: "6px",
              fontSize: "18px",
              color: "#eac4ff",
              opacity: 0,
              animation: "fadeIn 0.5s ease-out 0.95s forwards"
            }}>
              {brawlMode === "1v1" ? "Epic Solo Battle!" : "Solo vs Squad Mayhem!"}
            </div>
          </div>
        </div>
      )}
      
      {/* Power Animation Overlay - Centered in arena+leaderboard area */}
      {showPowerAnimation && (
        <div style={{
          position: "absolute",
          top: 0,
          left: "320px",
          width: "calc(100vw - 320px)",
          height: "100vh",
          background: "radial-gradient(circle at 50% 50%, rgba(0,50,70,0.85), rgba(0,0,20,0.96) 75%)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "animeContainerBurst 0.5s cubic-bezier(0.2,0.9,0.3,1) both",
          overflow: "hidden",
          pointerEvents: "none"
        }}>
          <div className="anime-impact-fx" aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", width: "220vmax", height: "220vmax", marginLeft: "-110vmax", marginTop: "-110vmax", background: "repeating-conic-gradient(from 0deg, #00f5ff22 0deg 2deg, transparent 2deg 10deg)", animation: "speedLinesPulse 0.7s ease-out both", mixBlendMode: "screen" }} />
            <div style={{ position: "absolute", top: 0, left: "-10%", width: "70%", height: "100%", background: "linear-gradient(100deg, transparent, #00f5ffcc 45%, transparent 55%)", clipPath: "polygon(0 0, 70% 0, 55% 100%, 0% 100%)", animation: "animeBarLeft 0.6s cubic-bezier(0.16,1,0.3,1) both", filter: "blur(1px)" }} />
            <div style={{ position: "absolute", top: 0, right: "-10%", width: "70%", height: "100%", background: "linear-gradient(260deg, transparent, #0080ffcc 45%, transparent 55%)", clipPath: "polygon(30% 0, 100% 0, 100% 100%, 45% 100%)", animation: "animeBarRight 0.6s cubic-bezier(0.16,1,0.3,1) both", filter: "blur(1px)" }} />
            <div style={{ position: "absolute", inset: 0, background: "#fff", animation: "animeFlashStrike 0.5s ease-out both", mixBlendMode: "overlay" }} />
          </div>
          <div style={{
            position: "relative",
            width: "560px",
            height: "300px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {/* Reactor core spinning up */}
            <svg viewBox="0 0 100 100" style={{
              position: "absolute",
              width: "160px",
              height: "160px",
              animation: "hexSpin 1.4s linear infinite",
              filter: "drop-shadow(0 0 16px #00f5ff)"
            }}>
              <polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" fill="none" stroke="#00f5ff" strokeWidth="4" />
            </svg>
            <div style={{
              position: "absolute",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "radial-gradient(circle, #e0feff, #00f5ff 55%, #004a66)",
              boxShadow: "0 0 40px #00f5ff",
              animation: "coreThrob 0.7s ease-in-out infinite"
            }} />
            {/* Charge rings expanding outward */}
            {[0, 1, 2].map((i) => (
              <div key={`charge-${i}`} style={{
                position: "absolute",
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                border: "2px solid #00f5ff",
                animation: `chargeRingOut 1.1s ease-out ${i * 0.35}s infinite`
              }} />
            ))}
            {/* Title revealed by a scanning laser line */}
            <div style={{ position: "relative", marginTop: "140px", overflow: "hidden" }}>
              <div style={{
                fontSize: "46px",
                fontWeight: 900,
                background: "linear-gradient(135deg, #e0feff, #00d4ff, #0080ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textShadow: "0 0 30px rgba(0,245,255,0.8)",
                letterSpacing: "4px",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                clipPath: "inset(0 100% 0 0)",
                animation: "scanReveal 0.5s steps(20) 0.6s forwards, animeTextGlitch 1.3s ease-in-out 1.1s infinite"
              }}>
                POWERS ENABLED
              </div>
              <div style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: "3px",
                background: "#fff",
                boxShadow: "0 0 14px #fff, 0 0 30px #00f5ff",
                animation: "scanBarMove 0.5s linear 0.6s forwards"
              }} />
            </div>
          </div>
        </div>
      )}
      
      {/* Boss Power Animation Overlay - Centered in arena+leaderboard area */}
      {showBossPowerAnimation && (
        <div style={{
          position: "absolute",
          top: 0,
          left: "320px",
          width: "calc(100vw - 320px)",
          height: "100vh",
          background: "radial-gradient(circle at 50% 50%, rgba(80,0,0,0.85), rgba(20,0,0,0.96) 75%)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "animeContainerBurst 0.5s cubic-bezier(0.2,0.9,0.3,1) both",
          overflow: "hidden",
          pointerEvents: "none"
        }}>
          <div className="anime-impact-fx" aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", width: "220vmax", height: "220vmax", marginLeft: "-110vmax", marginTop: "-110vmax", background: "repeating-conic-gradient(from 0deg, #ff000022 0deg 2deg, transparent 2deg 10deg)", animation: "speedLinesPulse 0.7s ease-out both", mixBlendMode: "screen" }} />
            <div style={{ position: "absolute", top: 0, left: "-10%", width: "70%", height: "100%", background: "linear-gradient(100deg, transparent, #ff0000cc 45%, transparent 55%)", clipPath: "polygon(0 0, 70% 0, 55% 100%, 0% 100%)", animation: "animeBarLeft 0.6s cubic-bezier(0.16,1,0.3,1) both", filter: "blur(1px)" }} />
            <div style={{ position: "absolute", top: 0, right: "-10%", width: "70%", height: "100%", background: "linear-gradient(260deg, transparent, #ff4500cc 45%, transparent 55%)", clipPath: "polygon(30% 0, 100% 0, 100% 100%, 45% 100%)", animation: "animeBarRight 0.6s cubic-bezier(0.16,1,0.3,1) both", filter: "blur(1px)" }} />
            <div style={{ position: "absolute", inset: 0, background: "#fff", animation: "animeFlashStrike 0.5s ease-out both", mixBlendMode: "overlay" }} />
          </div>
          <div style={{
            position: "relative",
            width: "560px",
            height: "300px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {/* Rune seal spins and fades as it shatters */}
            <svg viewBox="0 0 100 100" style={{
              position: "absolute",
              width: "180px",
              height: "180px",
              animation: "runeSpinFade 0.8s ease-in both",
              filter: "drop-shadow(0 0 16px #ff4500)"
            }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="#ff4500" strokeWidth="2" />
              <circle cx="50" cy="50" r="34" fill="none" stroke="#ff8800" strokeWidth="1.5" strokeDasharray="4 3" />
              {[...Array(12)].map((_, i) => {
                const a = (i * 30) * Math.PI / 180;
                const x1 = 50 + Math.cos(a) * 42, y1 = 50 + Math.sin(a) * 42;
                const x2 = 50 + Math.cos(a) * 36, y2 = 50 + Math.sin(a) * 36;
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ff4500" strokeWidth="2" />;
              })}
            </svg>
            {/* Shards flying outward from the shattered seal */}
            {[...Array(12)].map((_, i) => {
              const a = (i * 30) * Math.PI / 180;
              const dist = 130 + (i % 3) * 30;
              return (
                <div key={`rune-shard-${i}`} style={{
                  position: "absolute",
                  width: "16px",
                  height: "16px",
                  background: "linear-gradient(135deg, #ffcc80, #ff0000)",
                  clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                  transform: `translate(${Math.cos(a) * dist}px, ${Math.sin(a) * dist}px) rotate(${i * 45}deg)`,
                  animation: `runeShatter 0.6s ease-out ${0.35 + i * 0.02}s both`,
                  opacity: 0
                }} />
              );
            })}
            {/* Title emerges from the shatter */}
            <div style={{
              fontSize: "42px",
              fontWeight: 900,
              background: "linear-gradient(135deg, #fff2cc, #ff4500, #ff0000)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "0 0 30px rgba(255,0,0,0.85)",
              letterSpacing: "3px",
              textTransform: "uppercase",
              textAlign: "center",
              whiteSpace: "nowrap",
              opacity: 0,
              animation: "emberReveal 0.6s ease-out 0.5s forwards, heatFlicker 0.6s ease-in-out 1.1s infinite"
            }}>
              FINAL BOSS POWERS
            </div>
            <div style={{
              fontSize: "16px",
              color: "#ffb380",
              marginTop: "10px",
              opacity: 0,
              animation: "fadeIn 0.5s ease-out 0.9s forwards"
            }}>
              The Boss Grows Stronger!
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes animeContainerBurst {
          0% { opacity: 0; transform: scale(1.3); filter: brightness(4) contrast(1.4); }
          20% { opacity: 1; filter: brightness(2) contrast(1.2); }
          100% { opacity: 1; transform: scale(1); filter: brightness(1) contrast(1); }
        }
        @keyframes speedLinesPulse {
          0% { opacity: 0; transform: scale(0.6) rotate(0deg); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.15) rotate(8deg); }
        }
        @keyframes animeBarLeft {
          0% { transform: translateX(-120%) skewX(-8deg); opacity: 0; }
          55% { transform: translateX(0%) skewX(-8deg); opacity: 1; }
          100% { transform: translateX(-8%) skewX(-8deg); opacity: 0.85; }
        }
        @keyframes animeBarRight {
          0% { transform: translateX(120%) skewX(-8deg); opacity: 0; }
          55% { transform: translateX(0%) skewX(-8deg); opacity: 1; }
          100% { transform: translateX(8%) skewX(-8deg); opacity: 0.85; }
        }
        @keyframes animeFlashStrike {
          0% { opacity: 0.9; }
          12% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes bladeWipe {
          0% { transform: translateY(-50%) rotate(-8deg) scaleX(0); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(-50%) rotate(-8deg) scaleX(1); opacity: 1; }
        }
        @keyframes shardFall {
          0% { opacity: 1; transform: translateY(-50%) translate(0,0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translateY(-50%) translate(0, 120px) rotate(200deg) scale(0.4); }
        }
        @keyframes textWipeReveal {
          from { clip-path: inset(0 100% 0 0); }
          to { clip-path: inset(0 0% 0 0); }
        }
        @keyframes irisSpinOpen {
          0% { transform: scale(0.2) rotate(0deg); opacity: 0.9; }
          70% { transform: scale(1.3) rotate(200deg); opacity: 0.5; }
          100% { transform: scale(2.2) rotate(260deg); opacity: 0; }
        }
        @keyframes ringPulseOut {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes sparkTwinkle {
          0% { opacity: 0; }
          15% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes stampDown {
          0% { transform: scale(2) rotate(-4deg); opacity: 0; }
          60% { transform: scale(0.95) rotate(1deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes bannerDropTop {
          0% { transform: translateX(-50%) translateY(-100%); }
          60% { transform: translateX(-50%) translateY(6%); }
          100% { transform: translateX(-50%) translateY(0%); }
        }
        @keyframes bannerDropBottom {
          0% { transform: translateX(-50%) translateY(100%); }
          60% { transform: translateX(-50%) translateY(-6%); }
          100% { transform: translateX(-50%) translateY(0%); }
        }
        @keyframes shockwaveRing {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(10); opacity: 0; }
        }
        @keyframes letterDrop0 {
          0% { transform: translateY(-60px) rotate(-20deg); opacity: 0; }
          100% { transform: translateY(0) rotate(0deg); opacity: 1; }
        }
        @keyframes letterDrop1 {
          0% { transform: translateY(60px) rotate(20deg); opacity: 0; }
          100% { transform: translateY(0) rotate(0deg); opacity: 1; }
        }
        @keyframes typeReveal {
          to { width: 320px; }
        }
        @keyframes eyeOpen {
          0% { clip-path: ellipse(50% 0% at 50% 50%); }
          100% { clip-path: ellipse(50% 50% at 50% 50%); }
        }
        @keyframes irisGlow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        @keyframes dangerRingOut {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(6); opacity: 0; }
        }
        @keyframes emberReveal {
          from { opacity: 0; transform: scale(1.3); filter: blur(8px); }
          to { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes emberSweep {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes bracketConverge {
          from { opacity: 0; }
          to { opacity: 1; transform: translate(0,0); }
        }
        @keyframes stampFade {
          from { opacity: 0; transform: rotate(-12deg) scale(3); }
          to { opacity: 1; transform: rotate(-12deg) scale(2); }
        }
        @keyframes confettiBurst {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes popSettle {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes hexSpin {
          0% { transform: rotate(0deg) scale(0.6); opacity: 0.3; }
          100% { transform: rotate(360deg) scale(1); opacity: 1; }
        }
        @keyframes coreThrob {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.25); }
        }
        @keyframes chargeRingOut {
          0% { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(5); opacity: 0; }
        }
        @keyframes scanReveal {
          to { clip-path: inset(0 0% 0 0); }
        }
        @keyframes scanBarMove {
          from { left: 0; }
          to { left: 100%; }
        }
        @keyframes runeSpinFade {
          0% { transform: rotate(0deg) scale(1); opacity: 1; }
          100% { transform: rotate(140deg) scale(1.4); opacity: 0; }
        }
        @keyframes runeShatter {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes heatFlicker {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
        @keyframes textPulse3D {
          0%, 100% { transform: scale(1) rotateX(10deg); }
          50% { transform: scale(1.05) rotateX(15deg); }
        }
        @keyframes flameFlicker {
          0% { transform: scale(1, 1) translateY(0); opacity: 0; }
          10% { opacity: 1; }
          25% { transform: scale(1.1, 0.9) translateY(-5px); opacity: 0.9; }
          50% { transform: scale(0.9, 1.1) translateY(0); opacity: 0.85; }
          75% { transform: scale(1.05, 0.95) translateY(-3px); opacity: 0.95; }
          100% { transform: scale(1, 1) translateY(0); opacity: 1; }
        }
        
        @keyframes darkParticle0 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0); opacity: 0; }
        }
        @keyframes darkParticle1 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0); opacity: 0; }
        }
        @keyframes darkParticle2 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0); opacity: 0; }
        }
        @keyframes darkParticle3 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0); opacity: 0; }
        }
        
        @keyframes skullFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        
        @keyframes bossTextPulse {
          0%, 100% { transform: scale(1) rotateX(10deg); }
          50% { transform: scale(1.06) rotateX(12deg); }
        }
        
        @keyframes energyRing {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
        }
        @keyframes spinBlade {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes sparkFlash {
          0% { transform: translate(-50%,-50%) scale(0.5); opacity: 1; }
          50% { transform: translate(-50%,-50%) scale(1.5); opacity: 1; }
          100% { transform: translate(-50%,-50%) scale(2); opacity: 0; }
        }
        @keyframes sparkFly0 {
          0% { opacity: 1; transform: translate(-50%,-50%) translate(0,0) scale(1); }
          100% { opacity: 0; transform: translate(-50%,-50%) translate(${-20 - Math.random() * 30}px, ${-15 - Math.random() * 25}px) scale(0); }
        }
        @keyframes sparkFly1 {
          0% { opacity: 1; transform: translate(-50%,-50%) translate(0,0) scale(1); }
          100% { opacity: 0; transform: translate(-50%,-50%) translate(${20 + Math.random() * 30}px, ${-15 - Math.random() * 25}px) scale(0); }
        }
        @keyframes sparkFly2 {
          0% { opacity: 1; transform: translate(-50%,-50%) translate(0,0) scale(1); }
          100% { opacity: 0; transform: translate(-50%,-50%) translate(${-20 - Math.random() * 30}px, ${15 + Math.random() * 25}px) scale(0); }
        }
        @keyframes sparkFly3 {
          0% { opacity: 1; transform: translate(-50%,-50%) translate(0,0) scale(1); }
          100% { opacity: 0; transform: translate(-50%,-50%) translate(${20 + Math.random() * 30}px, ${15 + Math.random() * 25}px) scale(0); }
        }
        @keyframes sparkStreak {
          0% { opacity: 1; transform: translate(-50%, 0) scaleY(1); }
          100% { opacity: 0; transform: translate(-50%, 0) scaleY(0.2); }
        }
        @keyframes animeTitleImpact {
          0% { transform: scale(3) skewX(15deg); opacity: 0; filter: blur(14px); }
          35% { transform: scale(0.9) skewX(-6deg); opacity: 1; filter: blur(0px); }
          45% { transform: scale(1.08) skewX(4deg) translateX(-6px); }
          55% { transform: scale(1) skewX(-3deg) translateX(6px); }
          65% { transform: scale(1) skewX(2deg) translateX(-3px); }
          100% { transform: scale(1) skewX(0deg) translateX(0); opacity: 1; }
        }
        @keyframes animeTextGlitch {
          0%, 100% { transform: translateX(0); filter: brightness(1) drop-shadow(0 0 6px currentColor); }
          2% { transform: translateX(-2px); }
          4% { transform: translateX(2px); }
          6% { transform: translateX(0); }
          50% { filter: brightness(1.5) drop-shadow(0 0 20px currentColor); }
        }
      `}</style>
      
      <div className="arena-layout" style={{ flex: 1, display: "flex", height: "100vh", alignItems: "center", justifyContent: "flex-start", gap: 0, position: "relative" }}>
        {/* Centers the arena in all space left over once the leaderboard is pinned to the viewport edge. */}
        <div className="arena-playfield-wrap" style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Arena Frame */}
        <div
          ref={arenaRef}
          className={`arena arena-playfield shape-${arenaShape}`}
          style={{
            "--arena-glow-primary": arenaGlowPalette[0],
            "--arena-glow-secondary": arenaGlowPalette[1],
            position: "relative",
            width: isSquareArenaShape(arenaShape) ? "min(62vw, calc(100vh - 36px))" : "64vw",
            height: isSquareArenaShape(arenaShape) ? "auto" : "calc(100vh - 28px)",
            maxWidth: "920px",
            maxHeight: "none",
            ...(isSquareArenaShape(arenaShape) ? { aspectRatio: "1 / 1" } : {}),
            background: "transparent",
            overflow: "hidden",
            ...getArenaShapeStyle(),
          } as React.CSSProperties}
        >
            {/* Theme background layer — visual only, clipped by the arena shape */}
            <div aria-hidden="true" style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              background: `linear-gradient(rgba(3, 7, 16, 0.28), rgba(3, 7, 16, 0.58)), ${activeArenaTheme.inside}d9`,
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute",
              ...(arenaShape === ARENA_SHAPES.CIRCLE ? {
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)"
              } : {
                left: 0,
                top: 0,
                width: "100%",
                height: "100%"
              })
            }}>
              <canvas 
                ref={canvasRef} 
                style={{ 
                  display: "block",
                  zIndex: 100,
                  ...getArenaShapeStyle()
                }} 
              />
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                {renderAllProjectiles()}
                {renderMuzzleFlashes()}
                {renderHitEffects()}
                {renderBladeSparkEffects()}

                {/* Power Pickups Rendering */}
                {/* Only show pickups if: enabled AND (no timer OR timer has expired) */}
                {/* ===== Arena Zones (spec section 6) — soft areas under the bubbles ===== */}
                {zonesEnabled && arenaZones.map((z) => {
                  const meta = ARENA_ZONE_INFO[z.kind];
                  const remaining = Math.max(0, z.expiresAt - Date.now()) / 1000;
                  const opacity = remaining < 2 ? 0.55 * (remaining / 2) : 0.55;
                  return (
                    <div
                      key={`arena-zone-${z.id}`}
                      style={{
                        position: "absolute", left: z.x, top: z.y,
                        width: z.r * 2, height: z.r * 2,
                        transform: "translate(-50%, -50%)", zIndex: 60,
                        pointerEvents: "none", opacity, borderRadius: "50%",
                        background: `radial-gradient(circle, ${meta.color}55, ${meta.color}11 70%, transparent)`,
                        border: `2px dashed ${meta.color}aa`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: Math.max(14, z.r * 0.4),
                      }}
                    >
                      <span style={{ opacity: 0.55 }}>{meta.icon}</span>
                    </div>
                  );
                })}

                {/* ===== Blockades (spec section 5) — physical objects ===== */}
                {blockadesEnabled && arenaBlockades.map((b) => {
                  const meta = ARENA_BLOCKADE_INFO[b.kind];
                  const isCircle = b.shape === "circle";
                  const w = isCircle ? b.r * 2 : b.w;
                  const h = isCircle ? b.r * 2 : b.h;
                  // Invisible walls stay near-transparent until a bubble discovers them.
                  const hidden = b.kind === "invisible_wall" && !b.active;
                  const laserOff = b.kind === "laser_wall" && !b.active;
                  let opacity = hidden ? 0.06 : laserOff ? 0.2 : 1;
                  if (b.fading && b.expiresAt) {
                    opacity *= Math.max(0, (b.expiresAt - Date.now()) / 1200);
                  }
                  const isWall = BLOCKADE_WALL_KINDS.includes(b.kind);
                  if (isWall) {
                    // Plain wall blockades render as a row of 2-3 bricks, no box/border behind them.
                    const sand = BLOCKADE_SAND_KINDS.includes(b.kind);
                    const brickFace = sand
                      ? "linear-gradient(165deg, #d7b685, #b4915c 55%, #8f7140)"
                      : "linear-gradient(165deg, #b3503f, #8f3a2c 55%, #6b2a1f)";
                    const mortar = sand ? "#6e5a38" : "#4a1f17";
                    const count = 2 + (b.id % 2); // deterministic 2 or 3 bricks per blockade
                    const gap = Math.max(1, w * 0.03);
                    return (
                      <div
                        key={`arena-blockade-${b.id}`}
                        style={{
                          position: "absolute", left: b.x, top: b.y,
                          width: w, height: h,
                          transform: `translate(-50%, -50%) rotate(${b.angle || 0}rad)`,
                          zIndex: b.solid ? 110 : 70,
                          pointerEvents: "none", opacity,
                          display: "flex", gap,
                          filter: `drop-shadow(0 0 6px ${meta.color}aa)`,
                        }}
                      >
                        {Array.from({ length: count }).map((_, i) => (
                          <div key={i} style={{
                            flex: 1, height: "100%", borderRadius: 2,
                            background: brickFace,
                            border: `1px solid ${mortar}`,
                            boxShadow: "inset 0 -2px 2px rgba(0,0,0,0.35)",
                          }} />
                        ))}
                        {b.kind === "breakable" && b.hp !== undefined && (
                          <span style={{
                            position: "absolute", bottom: -14, left: "50%", transform: "translateX(-50%)",
                            fontSize: 9, fontWeight: 800, color: meta.color, textShadow: "0 1px 2px #000",
                          }}>{b.hp}</span>
                        )}
                      </div>
                    );
                  }
                  // Hazard / mechanism kinds keep their icon, glow only — no boxed panel.
                  return (
                    <div
                      key={`arena-blockade-${b.id}`}
                      style={{
                        position: "absolute", left: b.x, top: b.y,
                        width: w, height: h,
                        transform: `translate(-50%, -50%) rotate(${b.angle || 0}rad)`,
                        zIndex: b.solid ? 110 : 70,
                        pointerEvents: "none", opacity,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: Math.max(10, Math.min(w, h) * 0.6),
                        filter: `drop-shadow(0 0 8px ${meta.color}cc)`,
                      }}
                    >
                      <span style={{ opacity: 0.9 }}>{meta.icon}</span>
                    </div>
                  );
                })}

                {/* ===== Meteors (spec section 7) ===== */}
                {eventsEnabled && arenaMeteors.map((m) => (
                  <div
                    key={`arena-meteor-${m.id}`}
                    style={{
                      position: "absolute", left: m.x, top: m.y,
                      width: m.r * 2, height: m.r * 2,
                      transform: "translate(-50%, -50%)", zIndex: 1160,
                      pointerEvents: "none", borderRadius: "50%",
                      background: "radial-gradient(circle, #fde68a, #f97316 60%, #7c2d12)",
                      boxShadow: "0 0 16px #f97316, 0 0 30px rgba(249,115,22,0.6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14,
                    }}
                  >☄️</div>
                ))}

                {/* ===== Falling swords (Double Damage event) — decorative rain ===== */}
                {eventsEnabled && arenaSwords.map((s) => (
                  <div
                    key={`arena-sword-${s.id}`}
                    style={{
                      position: "absolute", left: s.x, top: s.y,
                      transform: `translate(-50%, -50%) rotate(${s.rot}deg)`, zIndex: 1160,
                      pointerEvents: "none", fontSize: 24,
                      filter: "drop-shadow(0 0 10px #ef4444) drop-shadow(0 0 18px rgba(239,68,68,0.6))",
                    }}
                  >⚔️</div>
                ))}

                {/* Shrinking Arena: shows where the contracted boundary now sits. */}
                {eventsEnabled && arenaShrinkPad > 0 && (
                  <div style={{
                    position: "absolute", inset: arenaShrinkPad,
                    zIndex: 1140, pointerEvents: "none",
                    border: "2px dashed rgba(251,113,133,0.75)",
                    borderRadius: 12,
                    boxShadow: "inset 0 0 40px rgba(251,113,133,0.25)",
                  }} />
                )}

                {/* ===== Event banner (spec section 7): warning then active ===== */}
                {eventsEnabled && activeEvent && (() => {
                  const meta = ARENA_EVENT_INFO[activeEvent.kind];
                  const warning = activeEvent.phase === "warning";
                  return (
                    <div style={{
                      position: "absolute", top: 18, left: "50%",
                      transform: "translateX(-50%)", zIndex: 1400,
                      pointerEvents: "none", display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 16px", borderRadius: 999,
                      background: warning ? "rgba(20,10,0,0.85)" : "rgba(10,6,24,0.85)",
                      border: `2px solid ${meta.color}`,
                      boxShadow: `0 0 20px ${meta.color}99`,
                      color: "#fff", fontWeight: 800, fontSize: 13, whiteSpace: "nowrap",
                      animation: warning ? "pulse 0.7s infinite" : undefined,
                    }}>
                      <span style={{ fontSize: 17 }}>{warning ? "⚠️" : meta.icon}</span>
                      <span>{warning ? `INCOMING: ${activeEvent.label}` : activeEvent.label}</span>
                    </div>
                  );
                })()}

                {/* Active-event screen tint: confirms the effect is live even when the */}
                {/* modifier itself (damage/gravity/speed) has no other visible marker. */}
                {eventsEnabled && activeEvent && activeEvent.phase === "active" && (() => {
                  const meta = ARENA_EVENT_INFO[activeEvent.kind];
                  return (
                    <div style={{
                      position: "absolute", inset: 0, zIndex: 1130, pointerEvents: "none",
                      boxShadow: `inset 0 0 60px ${meta.color}66, inset 0 0 14px ${meta.color}aa`,
                      border: `3px solid ${meta.color}88`, borderRadius: 10,
                      animation: "pulse 1.4s ease-in-out infinite",
                    }} />
                  );
                })()}

                {/* ===== Arena Pickups (spec section 4) — DOM overlay, visual only ===== */}
                {/* Always render: event-spawned pickups (health_rain/item_chaos) must stay
                    visible even when the separate "Pickups" toggle is off; the array itself
                    only contains system pickups when that toggle is on (spawn is gated). */}
                {arenaPickups.map((p) => {
                  const meta = ARENA_PICKUP_INFO[p.kind];
                  const remaining = Math.max(0, p.expiresAt - Date.now()) / 1000;
                  const opacity = remaining < 1.5 ? 0.25 + 0.5 * (remaining / 1.5) : 1;
                  return (
                    <div
                      key={`arena-pickup-${p.id}`}
                      style={{
                        position: "absolute", left: p.x, top: p.y,
                        transform: "translate(-50%, -50%)", zIndex: 1150,
                        pointerEvents: "none", opacity,
                      }}
                    >
                      <div style={{
                        width: ARENA_PICKUP_RADIUS * 2, height: ARENA_PICKUP_RADIUS * 2,
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${meta.color}, rgba(0,0,0,0.35))`,
                        border: `2px solid ${meta.color}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18,
                        boxShadow: `0 0 14px ${meta.color}`,
                        animation: "pulse 1.2s infinite",
                      }}>
                        {meta.icon}
                      </div>
                    </div>
                  );
                })}
                {/* Floating collection labels */}
                {pickupFx.map((fx) => {
                  const age = (Date.now() - fx.createdAt) / 900;
                  return (
                    <div
                      key={`pickup-fx-${fx.id}`}
                      style={{
                        position: "absolute", left: fx.x, top: fx.y - age * 26,
                        transform: "translate(-50%, -50%)", zIndex: 1200,
                        pointerEvents: "none", opacity: Math.max(0, 1 - age),
                        fontSize: 13, fontWeight: 800, color: fx.color,
                        whiteSpace: "nowrap", textShadow: "0 0 5px #000, 0 1px 2px #000",
                      }}
                    >
                      {fx.text}
                    </div>
                  );
                })}

                {arenaType === ARENA_TYPES.BOSS && playerPowersEnabled && (playerPowersAutoEnableTime === 0 || playerPowersAutoEnabledRef.current) && playerPowerMode === "pickup" && powerPickups.map((pickup) => {
                  const powerInfo = SUPER_BUBBLE_TYPES[pickup.type];
                  const remainingTime = Math.max(0, pickup.expiresAt - Date.now()) / 1000;
                  const opacity = remainingTime < 1 ? 0.3 + 0.7 * remainingTime : 1;
                  
                  return (
                    <div
                      key={`pickup-${pickup.id}`}
                      style={{
                        position: "absolute",
                        left: pickup.x,
                        top: pickup.y,
                        transform: "translate(-50%, -50%)",
                        zIndex: 1150,
                        pointerEvents: "none",
                        opacity
                      }}
                    >
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: `radial-gradient(circle, #4caf50, #2e7d32)`,
                        border: "3px solid #66bb6a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        boxShadow: "0 0 20px rgba(76,175,80,0.8)",
                        animation: "pulse 1s infinite"
                      }}>
                        ⚡
                      </div>
                      <div style={{
                        position: "absolute",
                        top: -20,
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: 10,
                        color: "#4caf50",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        textShadow: "0 0 4px #000"
                      }}>
                        {powerInfo.name}
                      </div>
                    </div>
                  );
                })}

                {/* Powered Bubble Indicators */}
                {arenaType === ARENA_TYPES.BOSS && playerPowersEnabled && Array.from(bubblePowers.entries()).map(([bubbleId, power]) => {
                  // Find bubble position
                  const n = countRef.current;
                  const idArr = idListRef.current;
                  const xArr = xRef.current;
                  const yArr = yRef.current;
                  const rArr = rRef.current;
                  
                  let bubbleX = -1, bubbleY = -1, bubbleR = 0;
                  for (let i = 0; i < n; i++) {
                    if (idArr![i] === bubbleId) {
                      bubbleX = xArr![i];
                      bubbleY = yArr![i];
                      bubbleR = rArr![i];
                      break;
                    }
                  }
                  
                  if (bubbleX === -1 || bubbleY === -1) return null;
                  
                  return (
                    <div
                      key={`power-${bubbleId}`}
                      style={{
                        position: "absolute",
                        left: bubbleX,
                        top: bubbleY - bubbleR - 15,
                        transform: "translateX(-50%)",
                        zIndex: 1100,
                        pointerEvents: "none"
                      }}
                    >
                      <div style={{
                        background: "rgba(76,175,80,0.9)",
                        color: "#fff",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: 9,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        border: "1px solid #4caf50"
                      }}>
                        ⚡{SUPER_BUBBLE_TYPES[power.type].name}
                      </div>
                    </div>
                  );
                })}

                {/* spikes as SVG DOM for sharpness */}
                {/* Only show spikes if: enabled AND (no timer OR timer has expired) */}
                {spikeEnabled && (spikeAutoEnableTime === 0 || spikeAutoEnabledRef.current) && (() => {
                  return spikePositions.map((spike, i) => {
                    const w = spikeSize;
                    const h = spikeSize;
                    
                    // Anchor the flat base to the exact boundary and point the tip inward.
                    const angle = Math.atan2(-spike.nx, spike.ny) * (180 / Math.PI);
                    
                    // Single upward-pointing triangle, rotated by normal
                    const points = `0,0 ${w},0 ${w / 2},${h}`;
                    
                    const style: React.CSSProperties = {
                      position: "absolute",
                      pointerEvents: "none",
                      zIndex: 120,
                      left: spike.x - w / 2,
                      top: spike.y,
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: "50% 0"
                    };
                    
                    return (
                      <svg key={`spike-${i}`} width={w} height={h} style={style}>
                        <polygon points={points} fill="#fff" />
                      </svg>
                    );
                  });
                })()}

                {/* Blades are now drawn on canvas for perfect sync - no SVG elements needed */}
              </div>
            </div>
            <svg className="arena-shape-outline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {renderArenaOutline()}
            </svg>
        </div>
        </div>

        {(winner || winnersList || winnersImages) && <WinnerOverlay winnerBubble={winner ?? undefined} winners={winnersList ?? undefined} winnersImgs={winnersImages ?? undefined} bubbleCount={countRef.current} />}

        {/* Leaderboard next to arena — pinned flush to the right edge */}
        <div
          className="leaderboard bb-arena-leaderboard"
          style={{
            width: arenaType === ARENA_TYPES.NORMAL ? 180 : 190,
            height: "95vh",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {arenaType === ARENA_TYPES.BOSS ? renderBossVersusCard() : arenaType === ARENA_TYPES.BRAWL ? renderBrawlVersusCard() : renderLeaderboardNormal()}
        </div>

      </div>

      {/* right controls sidebar */}
      <div className="arena-controls-shell" style={{ width: 320, minWidth: 280, display: "flex", flexDirection: "column", alignItems: "center", marginTop: 12, position: "relative", zIndex: 41 }}>
        <div className="arena-controls-panel" style={{ width: "100%", maxWidth: 320, padding: "16px 10px", boxSizing: "border-box", maxHeight: "calc(100vh - 24px)", overflowY: "auto" }}>
          {/* Brand header — top-left of the gameplay page */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 0.5, color: "#fff" }}>BUBBLE<span style={{ color: "#00e0ff" }}>BASH</span></span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#8fb3ff" }}>ARENA</span>
          </div>
          {/* Action Buttons */}
          <div className="arena-action-bar" style={{ marginBottom: 16 }}>
            <button onClick={handlePlay} disabled={isRunning} style={{ width: "100%", height: 44, marginBottom: 8, fontSize: 16, fontWeight: "bold" }}>
              ▶ {isRunning ? "Playing..." : "Play"}
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button onClick={handleBack} disabled={isRunning} style={{ height: 38 }}>
                ⤺ Back
              </button>
              <button onClick={resetArenaKeepTypePublic} disabled={!winner && !winnersList && !winnersImages} style={{ height: 38 }}>
                🔄 Reset
              </button>
            </div>
          </div>

          {/* Settings Toggle */}
          <button 
            onClick={() => setControlsOpen((s) => !s)} 
            style={{ 
              width: "100%", 
              height: 38, 
              marginBottom: 12,
              background: controlsOpen ? "#6b44ff" : "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600
            }}
          >
            ⚙️ {controlsOpen ? "Hide Settings" : "Show Settings"}
          </button>

          {/* Settings Panel */}
          <div style={{ display: controlsOpen ? "block" : "none", color: "#ddd", width: "100%" }}>
            
            {/* Group Label: Core Gameplay */}
            <div style={{ color: "#6b44ff", fontSize: 11, fontWeight: 700, marginBottom: 10, marginTop: 6, textTransform: "uppercase", letterSpacing: 0.5, paddingLeft: 8 }}>⚙️ Core Gameplay</div>
            
            {/* Speed Control */}
            <div style={{ 
              background: "rgba(255,255,255,0.05)", 
              borderRadius: 8, 
              marginBottom: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              overflow: "hidden"
            }}>
              <div 
                onClick={() => toggleSection('speed')}
                style={{ 
                  padding: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: expandedSections.speed ? "rgba(107,68,255,0.2)" : "transparent",
                  transition: "background 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>⚡</span>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Speed</span>
                </div>
                <span style={{ color: "#999", fontSize: 12 }}>{expandedSections.speed ? "▼" : "▶"}</span>
              </div>
              {expandedSections.speed && (
                <div style={{ padding: "0 12px 12px 12px" }}>
                  <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                    Multiplier: <span style={{ color: "#6b44ff", fontWeight: 600 }}>{speedMultiplier.toFixed(1)}x</span>
                  </label>
                  <input 
                    type="range" 
                    min={0.5} 
                    max={30} 
                    step={0.1} 
                    value={speedMultiplier} 
                    onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))} 
                    style={{ width: "100%", cursor: "pointer" }} 
                  />
                </div>
              )}
            </div>

            {/* Spikes Control */}
            <div style={{ 
              background: "rgba(255,255,255,0.05)", 
              borderRadius: 8, 
              marginBottom: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              overflow: "hidden"
            }}>
              <div 
                onClick={() => toggleSection('spikes')}
                style={{ 
                  padding: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: expandedSections.spikes ? "rgba(255,152,0,0.2)" : "transparent",
                  transition: "background 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🔺</span>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Spikes</span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ToggleButton on={spikeEnabled} onToggle={() => setSpikeEnabled((s) => !s)} label={spikeEnabled ? "ON" : "OFF"} />
                  </div>
                </div>
                <span style={{ color: "#999", fontSize: 12 }}>{expandedSections.spikes ? "▼" : "▶"}</span>
              </div>
              {expandedSections.spikes && (
                <div style={{ padding: "0 12px 12px 12px" }}>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                      ⏱️ Auto-Enable After (seconds): <span style={{ color: "#ffa500", fontWeight: 600 }}>{spikeAutoEnableTime === 0 ? "Disabled" : `${spikeAutoEnableTime}s`}</span>
                    </label>
                    <input 
                      type="number" 
                      min={0} 
                      max={3600} 
                      step={1} 
                      value={spikeAutoEnableTime} 
                      onChange={(e) => setSpikeAutoEnableTime(parseInt(e.target.value) || 0)} 
                      style={{ width: "100%", padding: "6px", borderRadius: 4, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }} 
                      placeholder="0 = disabled"
                    />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                      ⏳ Active Duration (seconds): <span style={{ color: "#ffa500", fontWeight: 600 }}>{spikeActiveDuration === 0 ? "Forever" : `${spikeActiveDuration}s`}</span>
                    </label>
                    <input 
                      type="number" 
                      min={0} 
                      max={3600} 
                      step={1} 
                      value={spikeActiveDuration} 
                      onChange={(e) => setSpikeActiveDuration(parseInt(e.target.value) || 0)} 
                      style={{ width: "100%", padding: "6px", borderRadius: 4, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }} 
                      placeholder="0 = forever"
                    />
                  </div>
                  {spikeEnabled && (
                    <>
                      <div style={{ marginBottom: 10 }}>
                        <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                          Count: <span style={{ color: "#fff", fontWeight: 600 }}>{spikeCount}</span>
                        </label>
                        <input 
                          type="range" 
                          min={1} 
                          max={20} 
                          step={1} 
                          value={spikeCount} 
                          onChange={(e) => setSpikeCount(parseInt(e.target.value))} 
                          style={{ width: "100%", cursor: "pointer" }} 
                        />
                      </div>
                      <div>
                        <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                          Size: <span style={{ color: "#fff", fontWeight: 600 }}>{spikeSize}px</span>
                        </label>
                        <input 
                          type="range" 
                          min={10} 
                          max={80} 
                          step={1} 
                          value={spikeSize} 
                          onChange={(e) => setSpikeSize(parseInt(e.target.value))} 
                          style={{ width: "100%", cursor: "pointer" }} 
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Rotating Blades Control */}
            <div style={{ 
              background: "rgba(255,255,255,0.05)", 
              borderRadius: 8, 
              marginBottom: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              overflow: "hidden"
            }}>
              <div 
                onClick={() => toggleSection('blades')}
                style={{ 
                  padding: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: expandedSections.blades ? "rgba(255,68,68,0.2)" : "transparent",
                  transition: "background 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>⚔️</span>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Rotating Blades</span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ToggleButton on={bladeEnabled} onToggle={() => setBladeEnabled((s) => !s)} label={bladeEnabled ? "ON" : "OFF"} />
                  </div>
                </div>
                <span style={{ color: "#999", fontSize: 12 }}>{expandedSections.blades ? "▼" : "▶"}</span>
              </div>
              {expandedSections.blades && (
                <div style={{ padding: "0 12px 12px 12px" }}>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                      ⏱️ Auto-Enable After (seconds): <span style={{ color: "#ff4444", fontWeight: 600 }}>{bladeAutoEnableTime === 0 ? "From Start" : `${bladeAutoEnableTime}s`}</span>
                    </label>
                    <input 
                      type="number" 
                      min={0} 
                      max={3600} 
                      step={1} 
                      value={bladeAutoEnableTime} 
                      onChange={(e) => setBladeAutoEnableTime(parseInt(e.target.value) || 0)} 
                      style={{ width: "100%", padding: "6px", borderRadius: 4, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }} 
                      placeholder="0 = start immediately"
                    />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                      ⏳ Active Duration (seconds): <span style={{ color: "#ff4444", fontWeight: 600 }}>{bladeActiveDuration === 0 ? "Forever" : `${bladeActiveDuration}s`}</span>
                    </label>
                    <input 
                      type="number" 
                      min={0} 
                      max={3600} 
                      step={1} 
                      value={bladeActiveDuration} 
                      onChange={(e) => setBladeActiveDuration(parseInt(e.target.value) || 0)} 
                      style={{ width: "100%", padding: "6px", borderRadius: 4, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }} 
                      placeholder="0 = forever"
                    />
                  </div>
                  {bladeEnabled && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ color: "#aaa", fontSize: 12, marginBottom: 6 }}>Assign Blades to Bubbles:</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                        <button
                          onClick={() => setBladeAssignments(new Set())}
                          style={{
                            padding: "4px 8px",
                            fontSize: 11,
                            background: "rgba(255,68,68,0.2)",
                            border: "1px solid rgba(255,68,68,0.4)",
                            borderRadius: 4,
                            color: "#ff4444",
                            cursor: "pointer"
                          }}
                        >
                          Clear All
                        </button>
                        <button
                          onClick={() => {
                            const newSet = new Set<number>();
                            const n = countRef.current;
                            const idArr = idListRef.current;
                            if (idArr && n > 0) {
                              for (let i = 0; i < n; i++) {
                                newSet.add(idArr[i]);
                              }
                            }
                            setBladeAssignments(newSet);
                          }}
                          style={{
                            padding: "4px 8px",
                            fontSize: 11,
                            background: "rgba(68,255,68,0.2)",
                            border: "1px solid rgba(68,255,68,0.4)",
                            borderRadius: 4,
                            color: "#44ff44",
                            cursor: "pointer"
                          }}
                        >
                          All Normals
                        </button>
                        {arenaType === ARENA_TYPES.BOSS && (
                          <button
                            onClick={() => {
                              const newSet = new Set(bladeAssignments);
                              if (superBubbleRef.current) {
                                if (newSet.has(superBubbleRef.current.id)) {
                                  newSet.delete(superBubbleRef.current.id);
                                } else {
                                  newSet.add(superBubbleRef.current.id);
                                }
                                setBladeAssignments(newSet);
                              }
                            }}
                            style={{
                              padding: "4px 8px",
                              fontSize: 11,
                              background: superBubbleRef.current && bladeAssignments.has(superBubbleRef.current.id) ? "rgba(255,68,68,0.4)" : "rgba(255,255,255,0.1)",
                              border: "1px solid rgba(255,255,255,0.2)",
                              borderRadius: 4,
                              color: "#fff",
                              cursor: "pointer"
                            }}
                          >
                            Superbubble {superBubbleRef.current && bladeAssignments.has(superBubbleRef.current.id) ? "✓" : ""}
                          </button>
                        )}
                      </div>
                      
                      {/* Individual Bubble Selection */}
                      <div style={{ 
                        maxHeight: 200, 
                        overflowY: "auto", 
                        background: "rgba(0,0,0,0.3)", 
                        borderRadius: 6, 
                        padding: 8,
                        border: "1px solid rgba(255,255,255,0.1)"
                      }}>
                        <div style={{ color: "#888", fontSize: 10, marginBottom: 6 }}>Individual Bubbles ({uiBubblesSnapshot.length}):</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {uiBubblesSnapshot.map((bubble) => {
                            const name = (bubble.imgSrc.split("/").pop() ?? `#${bubble.id}`).replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico)$/i, "");
                            const isAssigned = bladeAssignments.has(bubble.id);
                            return (
                              <button
                                key={bubble.id}
                                onClick={() => {
                                  const newSet = new Set(bladeAssignments);
                                  if (isAssigned) {
                                    newSet.delete(bubble.id);
                                  } else {
                                    newSet.add(bubble.id);
                                  }
                                  setBladeAssignments(newSet);
                                }}
                                style={{
                                  padding: "3px 6px",
                                  fontSize: 10,
                                  background: isAssigned ? "rgba(68,255,68,0.3)" : "rgba(255,255,255,0.05)",
                                  border: isAssigned ? "1px solid rgba(68,255,68,0.6)" : "1px solid rgba(255,255,255,0.15)",
                                  borderRadius: 4,
                                  color: isAssigned ? "#44ff44" : "#aaa",
                                  cursor: "pointer",
                                  maxWidth: 100,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap"
                                }}
                                title={`${name} (ID: ${bubble.id}) - Click to ${isAssigned ? 'remove' : 'add'} blade`}
                              >
                                {isAssigned ? "⚙️" : ""} {name.length > 12 ? name.substring(0, 10) + "…" : name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Group Label: Balance & Physics */}
            <div style={{ color: "#ff5722", fontSize: 11, fontWeight: 700, marginBottom: 10, marginTop: 12, textTransform: "uppercase", letterSpacing: 0.5, paddingLeft: 8 }}>⚡ Balance & Physics</div>

            {/* Damage & Physics Configuration */}
            <div style={{ 
              background: "rgba(255,87,34,0.1)", 
              borderRadius: 8, 
              marginBottom: 8,
              border: "1px solid rgba(255,87,34,0.3)",
              overflow: "hidden"
            }}>
              <div 
                onClick={() => toggleSection('damage')}
                style={{ 
                  padding: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: expandedSections.damage ? "rgba(255,87,34,0.3)" : "transparent",
                  transition: "background 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>⚙️</span>
                  <span style={{ color: "#ff5722", fontWeight: 600, fontSize: 14 }}>Damage & Physics</span>
                </div>
                <span style={{ color: "#999", fontSize: 12 }}>{expandedSections.damage ? "▼" : "▶"}</span>
              </div>

              {expandedSections.damage && (
                <div style={{ padding: "0 12px 12px 12px" }}>
                  {/* Bounce Deviation - Always shown */}
                  <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                      Bounce Deviation: <span style={{ color: "#fff", fontWeight: 600 }}>{(bounceDeviation * 57.3).toFixed(1)}°</span>
                    </label>
                    <input 
                      type="range" 
                      min={0} 
                      max={0.785} 
                  step={0.01} 
                  value={bounceDeviation} 
                  onChange={(e) => setBounceDeviation(parseFloat(e.target.value))} 
                  style={{ width: "100%", cursor: "pointer" }} 
                />
              </div>

              {/* NORMAL ARENA CONFIG */}
              {arenaType === ARENA_TYPES.NORMAL && (
                <>
                  <div style={{ color: "#aaa", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Players Arena Damage:</div>
                  <div style={{ marginBottom: 12, padding: 8, border: "1px solid rgba(0,217,255,0.25)", borderRadius: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ color: "#00d9ff", fontSize: 12, fontWeight: 700 }}>Player Powers</span>
                      <ToggleButton on={normalPowersEnabled} onToggle={() => setNormalPowersEnabled((enabled) => !enabled)} label={normalPowersEnabled ? "ON" : "OFF"} />
                    </div>
                    {normalPowersEnabled && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(34px, 1fr))", gap: 5 }}>
                        {AVAILABLE_POWER_KEYS.map((powerKey) => (
                          <PowerChips key={powerKey} powerKey={powerKey} active={!!selectedNormalPowers[powerKey]} accent="#00d9ff"
                            onToggle={() => setSelectedNormalPowers((powers) => ({ ...powers, [powerKey]: !powers[powerKey] }))} />
                        ))}
                      </div>
                    )}
                    {normalPowersEnabled && (Object.keys(selectedNormalPowers) as (keyof typeof SUPER_BUBBLE_TYPES)[]).filter((key) => selectedNormalPowers[key]).map((powerKey) => (
                      <label key={`normal-damage-${powerKey}`} title={String(SUPER_BUBBLE_TYPES[powerKey].name)} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, color: "#bbb", fontSize: 10 }}>
                        {powerBadge(SUPER_BUBBLE_TYPES[powerKey].name)}
                        <input type="number" min={0} max={50} step={0.5} value={normalPowerDamages[powerKey] ?? 5} onChange={(event) => setNormalPowerDamages((damages) => ({ ...damages, [powerKey]: parseFloat(event.target.value) || 0 }))} style={{ width: 52, padding: "3px 4px" }} />
                      </label>
                    ))}
                  </div>
                  
                  {/* Bubble Collision */}
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                      Bubble Collision: <span style={{ color: "#fff", fontWeight: 600 }}>{normalBubbleCollisionDamage}</span>
                    </label>
                    <input 
                      type="range" 
                      min={0} 
                      max={50} 
                      step={0.5} 
                      value={normalBubbleCollisionDamage} 
                      onChange={(e) => setNormalBubbleCollisionDamage(parseFloat(e.target.value))} 
                      style={{ width: "100%", cursor: "pointer" }} 
                    />
                  </div>

                  {/* Spike Damage */}
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                      Spike Damage: <span style={{ color: "#fff", fontWeight: 600 }}>{normalSpikeDamage}</span>
                    </label>
                    <input 
                      type="range" 
                      min={0} 
                      max={100} 
                      step={1} 
                      value={normalSpikeDamage} 
                      onChange={(e) => setNormalSpikeDamage(parseFloat(e.target.value))} 
                      style={{ width: "100%", cursor: "pointer" }} 
                    />
                  </div>

                  {/* Blade Damage */}
                  <div style={{ marginBottom: 0 }}>
                    <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                      Blade Damage: <span style={{ color: "#fff", fontWeight: 600 }}>{normalBladeDamage}</span>
                    </label>
                    <input 
                      type="range" 
                      min={0} 
                      max={100} 
                      step={1} 
                      value={normalBladeDamage} 
                      onChange={(e) => setNormalBladeDamage(parseFloat(e.target.value))} 
                      style={{ width: "100%", cursor: "pointer" }} 
                    />
                  </div>
                </>
              )}

              {/* BOSS ARENA CONFIG */}
              {arenaType === ARENA_TYPES.BOSS && (
                <>
                  {/* Superbubble Health & Collision */}
                  <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ color: "#f44336", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>🔴 Superbubble Configuration:</div>

                    <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 10 }}>
                      Boss Bubble Image:
                      <select
                        value={selectedSuperbubbleImageRef.current}
                        onChange={(e) => {
                          const imageName = e.target.value;
                          selectedSuperbubbleImageRef.current = imageName;
                          const imageSrc = imageName ? `http://localhost:5000/api/superbubbleimg/${encodeURIComponent(imageName)}` : "";
                          if (superBubbleRef.current && !isRunning) {
                            superBubbleRef.current.imgSrc = imageSrc;
                            superBubbleRef.current.name = imageName.replace(/\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i, "") || "Boss";
                            setSuperBubbleSnapshot({ ...superBubbleRef.current });
                            if (imageSrc) preloadImage(imageSrc).catch(() => {});
                          }
                          setSuperbubbleImageOptions((options) => [...options]);
                        }}
                        disabled={isRunning || superbubbleImageOptions.length === 0}
                        style={{ display: "block", width: "100%", marginTop: 6, padding: "7px 8px", background: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 6 }}
                      >
                        {superbubbleImageOptions.length === 0 && <option value="">Loading boss images...</option>}
                        {superbubbleImageOptions.map((image) => <option key={image} value={image}>{image}</option>)}
                      </select>
                    </label>
                    
                    {/* Superbubble Health */}
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                        Superbubble Health (HP): <span style={{ color: "#fff", fontWeight: 600 }}>{bossSuperbubbleHealth}</span>
                      </label>
                      <input 
                        type="range" 
                        min={10} 
                        max={1000} 
                        step={10} 
                        value={bossSuperbubbleHealth} 
                        onChange={(e) => setBossSuperbubbleHealth(parseFloat(e.target.value))} 
                        style={{ width: "100%", cursor: "pointer" }} 
                      />
                    </div>

                    {/* Collision Damage (applies to both) */}
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                        Collision Damage: <span style={{ color: "#fff", fontWeight: 600 }}>{bossCollisionDamage}</span>
                      </label>
                      <input 
                        type="range" 
                        min={0} 
                        max={50} 
                        step={0.5} 
                        value={bossCollisionDamage} 
                        onChange={(e) => setBossCollisionDamage(parseFloat(e.target.value))} 
                        style={{ width: "100%", cursor: "pointer" }} 
                      />
                    </div>

                    {/* Super Power Damages */}
                    <div style={{ color: "#aaa", fontSize: 11, marginBottom: 6 }}>Superbubble Power Damages:</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: 8 }}>
                      {AVAILABLE_POWER_KEYS.map((powerKey) => (
                        <div key={powerKey} title={String(SUPER_BUBBLE_TYPES[powerKey].name)} style={{ background: "rgba(0,0,0,0.2)", padding: "6px 8px", borderRadius: 4 }}>
                          <div style={{ color: "#999", fontSize: 10, marginBottom: 3 }}>{powerBadge(SUPER_BUBBLE_TYPES[powerKey].name)}</div>
                          <input 
                            type="number" 
                            min={0} 
                            max={50} 
                            step={0.5} 
                            value={bossSuperPowerDamages[powerKey] || 5} 
                            onChange={(e) => setBossSuperPowerDamages(prev => ({ ...prev, [powerKey]: parseFloat(e.target.value) || 0 }))}
                            style={{ 
                              width: "100%", 
                              padding: "4px 6px", 
                              background: "rgba(255,255,255,0.05)", 
                              border: "1px solid rgba(255,255,255,0.1)", 
                              borderRadius: 3, 
                              color: "#fff",
                              fontSize: 12
                            }} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Normal Bubble Damage Section */}
                  <div>
                    <div style={{ color: "#4caf50", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>🟢 Normal Bubble Damage:</div>

                    {/* Normal Spike Damage */}
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                        Spike Damage: <span style={{ color: "#fff", fontWeight: 600 }}>{bossNormalSpikeDamage}</span>
                      </label>
                      <input 
                        type="range" 
                        min={0} 
                        max={100} 
                        step={1} 
                        value={bossNormalSpikeDamage} 
                        onChange={(e) => setBossNormalSpikeDamage(parseFloat(e.target.value))} 
                        style={{ width: "100%", cursor: "pointer" }} 
                      />
                    </div>

                    {/* Normal Blade Damage */}
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                        Blade Damage (to Normals): <span style={{ color: "#fff", fontWeight: 600 }}>{bossNormalBladeDamage}</span>
                      </label>
                      <input 
                        type="range" 
                        min={0} 
                        max={100} 
                        step={1} 
                        value={bossNormalBladeDamage} 
                        onChange={(e) => setBossNormalBladeDamage(parseFloat(e.target.value))} 
                        style={{ width: "100%", cursor: "pointer" }} 
                      />
                    </div>

                    {/* Superbubble Blade Damage */}
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                        Blade Damage (to Superbubble): <span style={{ color: "#fff", fontWeight: 600 }}>{bossSuperbubbleBladeDamage}</span>
                      </label>
                      <input 
                        type="range" 
                        min={0} 
                        max={100} 
                        step={1} 
                        value={bossSuperbubbleBladeDamage} 
                        onChange={(e) => setBossSuperbubbleBladeDamage(parseFloat(e.target.value))} 
                        style={{ width: "100%", cursor: "pointer" }} 
                      />
                    </div>

                    {/* Normal Power Damages */}
                    {playerPowersEnabled && (
                      <>
                        <div style={{ color: "#aaa", fontSize: 11, marginBottom: 6 }}>Normal Bubble Power Damages:</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: 8 }}>
                          {(Object.keys(selectedPlayerPowers) as (keyof typeof SUPER_BUBBLE_TYPES)[]).filter(k => selectedPlayerPowers[k]).map((powerKey) => (
                            <div key={powerKey} title={String(SUPER_BUBBLE_TYPES[powerKey].name)} style={{ background: "rgba(0,0,0,0.2)", padding: "6px 8px", borderRadius: 4 }}>
                              <div style={{ color: "#999", fontSize: 10, marginBottom: 3 }}>{powerBadge(SUPER_BUBBLE_TYPES[powerKey].name)}</div>
                              <input 
                                type="number" 
                                min={0} 
                                max={50} 
                                step={0.5} 
                                value={bossNormalPowerDamages[powerKey] || 5} 
                                onChange={(e) => setBossNormalPowerDamages(prev => ({ ...prev, [powerKey]: parseFloat(e.target.value) || 0 }))}
                                style={{ 
                                  width: "100%", 
                                  padding: "4px 6px", 
                                  background: "rgba(255,255,255,0.05)", 
                                  border: "1px solid rgba(255,255,255,0.1)", 
                                  borderRadius: 3, 
                                  color: "#fff",
                                  fontSize: 12
                                }} 
                              />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* BRAWL ARENA CONFIG */}
              {arenaType === ARENA_TYPES.BRAWL && (
                <>
                  <div style={{ color: "#aaa", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Brawl Arena Damage:</div>
                  
                  {/* Bubble Collision */}
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                      Bubble Collision: <span style={{ color: "#fff", fontWeight: 600 }}>{brawlBubbleCollisionDamage}</span>
                    </label>
                    <input 
                      type="range" 
                      min={0} 
                      max={50} 
                      step={0.5} 
                      value={brawlBubbleCollisionDamage} 
                      onChange={(e) => setBrawlBubbleCollisionDamage(parseFloat(e.target.value))} 
                      style={{ width: "100%", cursor: "pointer" }} 
                    />
                  </div>

                  {/* Spike Damage */}
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                      Spike Damage: <span style={{ color: "#fff", fontWeight: 600 }}>{brawlSpikeDamage}</span>
                    </label>
                    <input 
                      type="range" 
                      min={0} 
                      max={100} 
                      step={1} 
                      value={brawlSpikeDamage} 
                      onChange={(e) => setBrawlSpikeDamage(parseFloat(e.target.value))} 
                      style={{ width: "100%", cursor: "pointer" }} 
                    />
                  </div>

                  {/* Blade Damage */}
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                      Blade Damage: <span style={{ color: "#fff", fontWeight: 600 }}>{brawlBladeDamage}</span>
                    </label>
                    <input 
                      type="range" 
                      min={0} 
                      max={100} 
                      step={1} 
                      value={brawlBladeDamage} 
                      onChange={(e) => setBrawlBladeDamage(parseFloat(e.target.value))} 
                      style={{ width: "100%", cursor: "pointer" }} 
                    />
                  </div>

                  {/* Brawl Power Damages */}
                  {brawlPowersEnabled && (
                    <>
                      <div style={{ color: "#aaa", fontSize: 11, marginBottom: 6 }}>Power Damages (All Available):</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: 8 }}>
                        {AVAILABLE_POWER_KEYS.map((powerKey) => (
                          <div key={powerKey} title={String(SUPER_BUBBLE_TYPES[powerKey].name)} style={{ background: "rgba(0,0,0,0.2)", padding: "6px 8px", borderRadius: 4 }}>
                            <div style={{ color: "#999", fontSize: 10, marginBottom: 3 }}>{powerBadge(SUPER_BUBBLE_TYPES[powerKey].name)}</div>
                            <input 
                              type="number" 
                              min={0} 
                              max={50} 
                              step={0.5} 
                              value={brawlPowerDamages[powerKey] || 5} 
                              onChange={(e) => setBrawlPowerDamages(prev => ({ ...prev, [powerKey]: parseFloat(e.target.value) || 0 }))}
                              style={{ 
                                width: "100%", 
                                padding: "4px 6px", 
                                background: "rgba(255,255,255,0.05)", 
                                border: "1px solid rgba(255,255,255,0.1)", 
                                borderRadius: 3, 
                                color: "#fff",
                                fontSize: 12
                              }} 
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
                </div>
              )}
            </div>

            {/* HP Control Section */}
            {(arenaType === ARENA_TYPES.NORMAL || arenaType === ARENA_TYPES.BOSS || arenaType === ARENA_TYPES.BRAWL) && (
              <div style={{ 
                background: "rgba(100,200,255,0.1)", 
                borderRadius: 8, 
                marginBottom: 12,
                border: "1px solid rgba(100,200,255,0.3)",
                overflow: "hidden"
              }}>
                <div
                  onClick={() => toggleSection('health')}
                  style={{ 
                    padding: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: expandedSections.health ? "rgba(100,200,255,0.2)" : "transparent",
                    transition: "background 0.2s"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>💊</span>
                    <span style={{ color: "#64c8ff", fontWeight: 600, fontSize: 14 }}>Health Control</span>
                  </div>
                  <span style={{ color: "#999", fontSize: 12 }}>{expandedSections.health ? "▼" : "▶"}</span>
                </div>

                {expandedSections.health && (
                <div style={{ padding: "12px" }}>
                
                {/* HP Mode Selection */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: "#ccc", fontSize: 12, marginBottom: 8, fontWeight: 500 }}>Control Mode:</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                    <button
                      onClick={() => {
                        setHpControlMode('single');
                        setSelectedBubblesForHp(new Set());
                      }}
                      style={{
                        padding: "8px",
                        borderRadius: 6,
                        background: hpControlMode === 'single' ? "#64c8ff" : "rgba(255,255,255,0.08)",
                        color: hpControlMode === 'single' ? "#000" : "#ccc",
                        border: hpControlMode === 'single' ? "1px solid #90e0ff" : "1px solid rgba(255,255,255,0.15)",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: hpControlMode === 'single' ? 700 : 400
                      }}
                    >
                      Single
                    </button>
                    <button
                      onClick={() => {
                        setHpControlMode('multiple');
                        setSelectedBubblesForHp(new Set());
                      }}
                      style={{
                        padding: "8px",
                        borderRadius: 6,
                        background: hpControlMode === 'multiple' ? "#64c8ff" : "rgba(255,255,255,0.08)",
                        color: hpControlMode === 'multiple' ? "#000" : "#ccc",
                        border: hpControlMode === 'multiple' ? "1px solid #90e0ff" : "1px solid rgba(255,255,255,0.15)",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: hpControlMode === 'multiple' ? 700 : 400
                      }}
                    >
                      Multiple
                    </button>
                    <button
                      onClick={() => setHpControlMode('all')}
                      style={{
                        padding: "8px",
                        borderRadius: 6,
                        background: hpControlMode === 'all' ? "#64c8ff" : "rgba(255,255,255,0.08)",
                        color: hpControlMode === 'all' ? "#000" : "#ccc",
                        border: hpControlMode === 'all' ? "1px solid #90e0ff" : "1px solid rgba(255,255,255,0.15)",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: hpControlMode === 'all' ? 700 : 400
                      }}
                    >
                      All Bubbles
                    </button>
                  </div>
                </div>

                {/* HP Value Input - for single and all modes */}
                {(hpControlMode === 'single' || hpControlMode === 'all') && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                      HP Value: <span style={{ color: "#64c8ff", fontWeight: 600 }}>{hpValue}</span>
                    </label>
                    <input 
                      type="range" 
                      min={1} 
                      max={500} 
                      step={1} 
                      value={hpValue} 
                      onChange={(e) => setHpValue(parseInt(e.target.value))} 
                      style={{ width: "100%", cursor: "pointer" }} 
                    />
                  </div>
                )}

                {/* Bubble Selection for Single Mode */}
                {hpControlMode === 'single' && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: "#ccc", fontSize: 12, marginBottom: 8, fontWeight: 500 }}>Select Bubble:</div>
                    {uiBubblesSnapshot.length === 0 ? (
                      <div style={{ color: "#666", fontSize: 11, padding: 8, textAlign: "center" }}>No bubbles in arena</div>
                    ) : (
                      <div style={{ 
                        maxHeight: 150, 
                        overflowY: "auto", 
                        background: "rgba(0,0,0,0.3)", 
                        borderRadius: 6, 
                        padding: 8,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        border: "1px solid rgba(100,200,255,0.2)"
                      }}>
                        {uiBubblesSnapshot.map((bubble) => {
                          const name = (bubble.imgSrc.split("/").pop() ?? `#${bubble.id}`).replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico)$/i, "");
                          const isSelected = selectedBubblesForHp.has(bubble.id);
                          return (
                            <button
                              key={bubble.id}
                              onClick={() => setSelectedBubblesForHp(new Set([bubble.id]))}
                              style={{
                                padding: "6px 10px",
                                fontSize: 10,
                                background: isSelected ? "rgba(100,200,255,0.3)" : "rgba(255,255,255,0.05)",
                                border: isSelected ? "1px solid rgba(100,200,255,0.6)" : "1px solid rgba(255,255,255,0.15)",
                                borderRadius: 4,
                                color: isSelected ? "#64c8ff" : "#aaa",
                                cursor: "pointer",
                                maxWidth: 90,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }}
                              title={`${name} - Current HP: ${Math.round(bubble.health)}`}
                            >
                              {isSelected ? '✓ ' : ''}{name.length > 10 ? name.substring(0, 8) + '…' : name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Bubble Selection with Individual HP for Multiple Mode */}
                {hpControlMode === 'multiple' && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: "#ccc", fontSize: 12, marginBottom: 8, fontWeight: 500 }}>Select Bubbles & Set Individual HP:</div>
                    {uiBubblesSnapshot.length === 0 ? (
                      <div style={{ color: "#666", fontSize: 11, padding: 8, textAlign: "center" }}>No bubbles in arena</div>
                    ) : (
                      <div style={{ 
                        maxHeight: 250, 
                        overflowY: "auto", 
                        background: "rgba(0,0,0,0.3)", 
                        borderRadius: 6, 
                        padding: 8,
                        border: "1px solid rgba(100,200,255,0.2)"
                      }}>
                        {uiBubblesSnapshot.map((bubble) => {
                          const name = (bubble.imgSrc.split("/").pop() ?? `#${bubble.id}`).replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico)$/i, "");
                          const isSelected = selectedBubblesForHp.has(bubble.id);
                          const bubbleHp = hpPerBubble.get(bubble.id) || Math.round(bubble.health);
                          return (
                            <div
                              key={bubble.id}
                              style={{
                                padding: "10px",
                                background: isSelected ? "rgba(100,200,255,0.15)" : "rgba(255,255,255,0.05)",
                                border: isSelected ? "1px solid rgba(100,200,255,0.5)" : "1px solid rgba(255,255,255,0.1)",
                                borderRadius: 6,
                                marginBottom: 8
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <button
                                  onClick={() => {
                                    const newSet = new Set(selectedBubblesForHp);
                                    if (isSelected) {
                                      newSet.delete(bubble.id);
                                      const newMap = new Map(hpPerBubble);
                                      newMap.delete(bubble.id);
                                      setHpPerBubble(newMap);
                                    } else {
                                      newSet.add(bubble.id);
                                      setHpPerBubble((prev) => new Map(prev).set(bubble.id, Math.round(bubble.health)));
                                    }
                                    setSelectedBubblesForHp(newSet);
                                  }}
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 4,
                                    background: isSelected ? "#64c8ff" : "rgba(255,255,255,0.1)",
                                    border: isSelected ? "1px solid #90e0ff" : "1px solid rgba(255,255,255,0.2)",
                                    color: isSelected ? "#000" : "#666",
                                    cursor: "pointer",
                                    fontWeight: 700,
                                    fontSize: 12
                                  }}
                                >
                                  {isSelected ? '✓' : '+'}
                                </button>
                                <div style={{ flex: 1 }}>
                                  <div style={{ color: isSelected ? "#64c8ff" : "#aaa", fontSize: 11, fontWeight: 600 }}>
                                    {name.length > 20 ? name.substring(0, 18) + '…' : name}
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <div>
                                  <label style={{ color: "#ccc", fontSize: 11, display: "block", marginBottom: 4 }}>
                                    HP: <span style={{ color: "#64c8ff", fontWeight: 600 }}>{bubbleHp}</span>
                                  </label>
                                  <input
                                    type="range"
                                    min="1"
                                    max="500"
                                    step="1"
                                    value={bubbleHp}
                                    onChange={(e) => updateBubbleHp(bubble.id, parseInt(e.target.value))}
                                    style={{ width: "100%", cursor: "pointer" }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Apply Button or Info Message */}
                {hpControlMode === 'multiple' && selectedBubblesForHp.size > 0 ? (
                  <div style={{
                    padding: 12,
                    background: "rgba(100,200,255,0.1)",
                    borderRadius: 6,
                    border: "1px solid rgba(100,200,255,0.3)",
                    color: "#64c8ff",
                    fontSize: 12,
                    textAlign: "center"
                  }}>
                    ✓ HP updates in real-time as you adjust sliders
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      applyHpChanges();
                    }}
                    disabled={uiBubblesSnapshot.length === 0 || (hpControlMode !== 'all' && selectedBubblesForHp.size === 0)}
                    style={{
                      width: "100%",
                      height: 40,
                      background: uiBubblesSnapshot.length === 0 || (hpControlMode !== 'all' && selectedBubblesForHp.size === 0) ? "rgba(100,200,255,0.1)" : "#64c8ff",
                      color: uiBubblesSnapshot.length === 0 || (hpControlMode !== 'all' && selectedBubblesForHp.size === 0) ? "#666" : "#000",
                      border: "none",
                      borderRadius: 6,
                      cursor: uiBubblesSnapshot.length === 0 || (hpControlMode !== 'all' && selectedBubblesForHp.size === 0) ? "not-allowed" : "pointer",
                      fontSize: 13,
                      fontWeight: 700,
                      transition: "all 0.2s"
                    }}
                  >
                    {hpControlMode === 'single' ? '🩹 Apply HP: ' + hpValue : '🩹 Apply to All'}
                  </button>
                )}
                </div>
                )}
              </div>
            )}

            {/* Group Label: Appearance */}
            <div style={{ color: "#9c27b0", fontSize: 11, fontWeight: 700, marginBottom: 10, marginTop: 12, textTransform: "uppercase", letterSpacing: 0.5, paddingLeft: 8 }}>🎨 Appearance</div>

            {/* Color Customization */}
            <div style={{ 
              background: "rgba(255,255,255,0.05)", 
              borderRadius: 8, 
              marginBottom: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              overflow: "hidden"
            }}>
              <div 
                onClick={() => toggleSection('colors')}
                style={{ 
                  padding: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: expandedSections.colors ? "rgba(255,255,255,0.1)" : "transparent",
                  transition: "background 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🎨</span>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Colors</span>
                </div>
                <span style={{ color: "#999", fontSize: 12 }}>{expandedSections.colors ? "▼" : "▶"}</span>
              </div>
              
              {expandedSections.colors && (
                <div style={{ padding: "0 12px 12px 12px" }}>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ color: "#aaa", fontSize: 11, display: "block", marginBottom: 4 }}>Page Background</label>
                    <input
                      type="color"
                      value={pageBackgroundColor}
                      onChange={(e) => setPageBackgroundColor(e.target.value)}
                      style={{
                        width: "100%",
                        height: 36,
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 6,
                        cursor: "pointer",
                        background: "rgba(255,255,255,0.05)"
                      }}
                    />
                  </div>
              
              <div style={{ marginBottom: 10 }}>
                <label style={{ color: "#aaa", fontSize: 11, display: "block", marginBottom: 4 }}>Arena Background</label>
                <input
                  type="color"
                  value={canvasBackgroundColor}
                  onChange={(e) => setCanvasBackgroundColor(e.target.value)}
                  style={{
                    width: "100%",
                    height: 36,
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 6,
                    cursor: "pointer",
                    background: "rgba(255,255,255,0.05)"
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 10 }}>
                <label style={{ color: "#aaa", fontSize: 11, display: "block", marginBottom: 4 }}>Arena Inside (Play Area)</label>
                <input
                  type="color"
                  value={arenaInsideColor}
                  onChange={(e) => setArenaInsideColor(e.target.value)}
                  style={{
                    width: "100%",
                    height: 36,
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 6,
                    cursor: "pointer",
                    background: "rgba(255,255,255,0.05)"
                  }}
                />
              </div>
                </div>
              )}
            </div>

            {/* Arena Modifier presets (spec section 11) — every value stays editable after. */}
            <div style={{
              background: "rgba(255,255,255,0.05)", padding: 12, borderRadius: 8,
              marginBottom: 12, border: "1px solid rgba(255,255,255,0.12)"
            }}>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 13, marginBottom: 8 }}>🎛️ Arena Presets</div>
              <div style={{ display: "flex", gap: 6 }}>
                {([
                  ["CLASSIC", false, false, false, false, "#94a3b8"],
                  ["CASUAL", true, false, false, false, "#22c55e"],
                  ["HAZARD", false, true, true, false, "#f97316"],
                  ["CHAOS", true, true, true, true, "#e879f9"],
                ] as const).map(([name, p, b, z, e, color]) => {
                  const current = pickupsEnabled === p && blockadesEnabled === b && zonesEnabled === z && eventsEnabled === e;
                  return (
                    <button key={name}
                      onClick={() => { setPickupsEnabled(p); setBlockadesEnabled(b); setZonesEnabled(z); setEventsEnabled(e); }}
                      style={{
                        flex: 1, padding: "7px 2px", fontSize: 10, fontWeight: 800,
                        borderRadius: 6, cursor: "pointer",
                        border: `1px solid ${current ? color : "rgba(255,255,255,0.15)"}`,
                        background: current ? color : "rgba(255,255,255,0.06)",
                        color: current ? "#0b0b0b" : "#ccc",
                      }}>{name}</button>
                  );
                })}
              </div>
            </div>

            {/* Arena Modifiers — Pickups (spec sections 4 & 11). Default OFF. */}
            <div style={{
              background: "rgba(34,197,94,0.08)",
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
              border: "1px solid rgba(34,197,94,0.3)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🎁</span>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Pickups</span>
                </div>
                <ToggleButton on={pickupsEnabled} onToggle={() => setPickupsEnabled((s) => !s)} label={pickupsEnabled ? "ON" : "OFF"} />
              </div>
              {pickupsEnabled && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Mode: Random/Auto (as before) vs Custom (pick which kinds + fixed duration) */}
                  <div>
                    <div style={{ color: "#ccc", fontSize: 11, marginBottom: 4 }}>Mode</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {([["auto", "Random / Auto"], ["custom", "Custom"]] as const).map(([val, label]) => (
                        <button key={val} onClick={() => setPickupMode(val)}
                          style={{
                            flex: 1, padding: "6px 0", fontSize: 11,
                            borderRadius: 6, cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)",
                            background: pickupMode === val ? "#22c55e" : "rgba(255,255,255,0.06)",
                            color: pickupMode === val ? "#06210f" : "#ccc", fontWeight: 700,
                          }}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#ccc", fontSize: 11, marginBottom: 4 }}>Frequency</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {(["low", "medium", "high"] as const).map((f) => (
                        <button key={f} onClick={() => setPickupFrequency(f)}
                          style={{
                            flex: 1, padding: "6px 0", fontSize: 11, textTransform: "capitalize",
                            borderRadius: 6, cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)",
                            background: pickupFrequency === f ? "#22c55e" : "rgba(255,255,255,0.06)",
                            color: pickupFrequency === f ? "#06210f" : "#ccc", fontWeight: 700,
                          }}>{f}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#ccc", fontSize: 11, marginBottom: 4 }}>Maximum on screen</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[1, 2, 3, 5].map((m) => (
                        <button key={m} onClick={() => setPickupMax(m)}
                          style={{
                            flex: 1, padding: "6px 0", fontSize: 11,
                            borderRadius: 6, cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)",
                            background: pickupMax === m ? "#22c55e" : "rgba(255,255,255,0.06)",
                            color: pickupMax === m ? "#06210f" : "#ccc", fontWeight: 700,
                          }}>{m}</button>
                      ))}
                    </div>
                  </div>
                  {pickupMode === "auto" ? (
                    <div>
                      <div style={{ color: "#ccc", fontSize: 11, marginBottom: 4 }}>Good / Bad ratio</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {([["good", "Mostly Good"], ["balanced", "Balanced"], ["bad", "Mostly Bad"]] as const).map(([val, label]) => (
                          <button key={val} onClick={() => setPickupRatio(val)}
                            style={{
                              flex: 1, padding: "6px 2px", fontSize: 10,
                              borderRadius: 6, cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)",
                              background: pickupRatio === val ? "#22c55e" : "rgba(255,255,255,0.06)",
                              color: pickupRatio === val ? "#06210f" : "#ccc", fontWeight: 700,
                            }}>{label}</button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Effect duration: fixed seconds override, or Auto to keep each effect's default. */}
                      <div>
                        <div style={{ color: "#ccc", fontSize: 11, marginBottom: 4 }}>Effect duration</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {([[0, "Auto"], [3, "3s"], [5, "5s"], [8, "8s"], [12, "12s"]] as const).map(([val, label]) => (
                            <button key={val} onClick={() => setPickupDurationSec(val)}
                              style={{
                                flex: 1, padding: "6px 0", fontSize: 10,
                                borderRadius: 6, cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)",
                                background: pickupDurationSec === val ? "#22c55e" : "rgba(255,255,255,0.06)",
                                color: pickupDurationSec === val ? "#06210f" : "#ccc", fontWeight: 700,
                              }}>{label}</button>
                          ))}
                        </div>
                      </div>
                      {/* Per-kind enable: choose exactly which pickups can spawn. */}
                      <ItemChips
                        label="Enabled pickups"
                        kinds={ARENA_PICKUP_KINDS}
                        info={ARENA_PICKUP_INFO}
                        selected={pickupSelected}
                        onToggle={(k) => setPickupSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(k)) next.delete(k); else next.add(k);
                          return next;
                        })}
                        onAll={() => setPickupSelected(new Set(ARENA_PICKUP_KINDS))}
                        onNone={() => setPickupSelected(new Set())}
                      />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Arena Modifiers — Blockades (spec sections 5 & 11). Default OFF. */}
            <div style={{
              background: "rgba(148,163,184,0.08)", padding: 12, borderRadius: 8,
              marginBottom: 12, border: "1px solid rgba(148,163,184,0.3)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🧱</span>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Blockades</span>
                </div>
                <ToggleButton on={blockadesEnabled} onToggle={() => setBlockadesEnabled((s) => !s)} label={blockadesEnabled ? "ON" : "OFF"} />
              </div>
              {blockadesEnabled && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  <SegRow label="Mode" value={blockadeMode} options={MODE_OPTIONS} onPick={setBlockadeMode} accent="#94a3b8" />
                  <SegRow label="Density" value={blockadeDensity} options={FREQ_OPTIONS} onPick={setBlockadeDensity} accent="#94a3b8" />
                  <SegRow label="Movement" value={blockadeMovement} options={FREQ_OPTIONS} onPick={setBlockadeMovement} accent="#94a3b8" />
                  {blockadeMode === "custom" && (
                    <>
                      <SegRow label="Lifetime" value={blockadeDurationSec} options={DURATION_OPTIONS} onPick={setBlockadeDurationSec} accent="#94a3b8" />
                      <ItemChips
                        label="Enabled blockades"
                        kinds={ARENA_BLOCKADE_KINDS}
                        info={ARENA_BLOCKADE_INFO}
                        selected={blockadeSelected}
                        onToggle={(k) => setBlockadeSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(k)) next.delete(k); else next.add(k);
                          return next;
                        })}
                        onAll={() => setBlockadeSelected(new Set(ARENA_BLOCKADE_KINDS))}
                        onNone={() => setBlockadeSelected(new Set())}
                      />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Arena Modifiers — Zones (spec sections 6 & 11). Default OFF. */}
            <div style={{
              background: "rgba(56,189,248,0.08)", padding: 12, borderRadius: 8,
              marginBottom: 12, border: "1px solid rgba(56,189,248,0.3)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🌀</span>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Zones</span>
                </div>
                <ToggleButton on={zonesEnabled} onToggle={() => setZonesEnabled((s) => !s)} label={zonesEnabled ? "ON" : "OFF"} />
              </div>
              {zonesEnabled && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  <SegRow label="Mode" value={zoneMode} options={MODE_OPTIONS} onPick={setZoneMode} accent="#38bdf8" />
                  <SegRow label="Frequency" value={zoneFrequency} options={FREQ_OPTIONS} onPick={setZoneFrequency} accent="#38bdf8" />
                  {zoneMode === "custom" && (
                    <>
                      <SegRow label="Zone lifetime" value={zoneDurationSec} options={DURATION_OPTIONS} onPick={setZoneDurationSec} accent="#38bdf8" />
                      <ItemChips
                        label="Enabled zones"
                        kinds={ARENA_ZONE_KINDS}
                        info={ARENA_ZONE_INFO}
                        selected={zoneSelected}
                        onToggle={(k) => setZoneSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(k)) next.delete(k); else next.add(k);
                          return next;
                        })}
                        onAll={() => setZoneSelected(new Set(ARENA_ZONE_KINDS))}
                        onNone={() => setZoneSelected(new Set())}
                      />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Arena Modifiers — Events (spec sections 7 & 11). Default OFF. */}
            <div style={{
              background: "rgba(250,204,21,0.08)", padding: 12, borderRadius: 8,
              marginBottom: 12, border: "1px solid rgba(250,204,21,0.3)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>⚡</span>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Events</span>
                </div>
                <ToggleButton on={eventsEnabled} onToggle={() => setEventsEnabled((s) => !s)} label={eventsEnabled ? "ON" : "OFF"} />
              </div>
              {eventsEnabled && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  <SegRow label="Mode" value={eventMode} options={MODE_OPTIONS} onPick={setEventMode} accent="#facc15" />
                  <SegRow label="Frequency" value={eventFrequency} options={FREQ_OPTIONS} onPick={setEventFrequency} accent="#facc15" />
                  {eventMode === "custom" && (
                    <>
                      <SegRow label="Event duration" value={eventDurationSec} options={DURATION_OPTIONS} onPick={setEventDurationSec} accent="#facc15" />
                      <ItemChips
                        label="Enabled events"
                        kinds={ARENA_EVENT_KINDS}
                        info={ARENA_EVENT_INFO}
                        selected={eventSelected}
                        onToggle={(k) => setEventSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(k)) next.delete(k); else next.add(k);
                          return next;
                        })}
                        onAll={() => setEventSelected(new Set(ARENA_EVENT_KINDS))}
                        onNone={() => setEventSelected(new Set())}
                      />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Arena Shapes */}
            <div style={{ 
              background: "rgba(255,255,255,0.05)", 
              borderRadius: 8, 
              marginBottom: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              overflow: "hidden"
            }}>
              <div 
                onClick={() => toggleSection('shapes')}
                style={{ 
                  padding: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: expandedSections.shapes ? "rgba(255,255,255,0.1)" : "transparent",
                  transition: "background 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🔷</span>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Arena Shapes</span>
                </div>
                <span style={{ color: "#999", fontSize: 12 }}>{expandedSections.shapes ? "▼" : "▶"}</span>
              </div>
              
              {expandedSections.shapes && (
                <div style={{ padding: "0 12px 12px 12px" }}>

            {/* Boss Arena Bubble Size Controller */}
            {arenaType === ARENA_TYPES.BOSS && (
              <div style={{ 
                background: "rgba(255,180,0,0.1)", 
                padding: 12, 
                borderRadius: 8, 
                marginBottom: 12,
                border: "1px solid rgba(255,180,0,0.3)"
              }}>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Bubble Size</div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "flex", alignItems: "center", color: "#ccc", fontSize: 12, marginBottom: 6 }}>
                    Normal Bubbles: {bossBubbleSizeMultiplier.toFixed(2)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={bossBubbleSizeMultiplier}
                    disabled={isRunning}
                    onChange={(e) => setBossBubbleSizeMultiplier(parseFloat(e.target.value))}
                    style={{ width: "100%", cursor: isRunning ? "not-allowed" : "pointer" }}
                  />
                </div>
              </div>
            )}

            {/* Boss Arena Powers */}
            {arenaType === ARENA_TYPES.BOSS && (
              <div style={{ 
                background: "rgba(107,68,255,0.1)", 
                padding: 12, 
                borderRadius: 8, 
                marginBottom: 12,
                border: "1px solid rgba(107,68,255,0.3)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Super Powers</div>
                  <ToggleButton on={superpowerEnabled} onToggle={() => setSuperpowerEnabled((s) => !s)} label={superpowerEnabled ? "ON" : "OFF"} />
                </div>

                {superpowerEnabled && (
                  <>
                    {/* Power Selection Grid */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ color: "#ccc", fontSize: 12, marginBottom: 8, fontWeight: 500 }}>Select Powers:</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                        {AVAILABLE_POWER_KEYS.map((k) => (
                          <button
                            key={k}
                            onClick={() => setSelectedPowers((s) => ({ ...s, [k]: !s[k] }))}
                            style={{
                              padding: "8px 6px",
                              borderRadius: 6,
                              background: selectedPowers[k] ? "#6b44ff" : "rgba(255,255,255,0.08)",
                              color: selectedPowers[k] ? "#fff" : "#ccc",
                              border: selectedPowers[k] ? "1px solid #8b66ff" : "1px solid rgba(255,255,255,0.15)",
                              cursor: "pointer",
                              fontSize: 11,
                              fontWeight: selectedPowers[k] ? 600 : 400,
                              transition: "all 0.2s",
                              textAlign: "center"
                            }}
                            title={`${SUPER_BUBBLE_TYPES[k].name} (${SUPER_BUBBLE_TYPES[k].damage} dmg)`}
                          >
                            {powerBadge(SUPER_BUBBLE_TYPES[k].name)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Firing Mode */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ color: "#ccc", fontSize: 12, marginBottom: 8, fontWeight: 500 }}>Firing Mode:</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        <label 
                          style={{ 
                            padding: "8px 10px",
                            borderRadius: 6,
                            background: firingMode === "manual" ? "#6b44ff" : "rgba(255,255,255,0.08)",
                            border: firingMode === "manual" ? "1px solid #8b66ff" : "1px solid rgba(255,255,255,0.15)",
                            color: firingMode === "manual" ? "#fff" : "#ccc",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            fontSize: 12,
                            fontWeight: firingMode === "manual" ? 600 : 400
                          }}
                        >
                          <input 
                            type="radio" 
                            name="firemode" 
                            value="manual" 
                            checked={firingMode === "manual"} 
                            onChange={() => setFiringMode("manual")}
                            style={{ margin: 0 }}
                          />
                          Manual
                        </label>
                        <label 
                          style={{ 
                            padding: "8px 10px",
                            borderRadius: 6,
                            background: firingMode === "auto" ? "#6b44ff" : "rgba(255,255,255,0.08)",
                            border: firingMode === "auto" ? "1px solid #8b66ff" : "1px solid rgba(255,255,255,0.15)",
                            color: firingMode === "auto" ? "#fff" : "#ccc",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            fontSize: 12,
                            fontWeight: firingMode === "auto" ? 600 : 400
                          }}
                        >
                          <input 
                            type="radio" 
                            name="firemode" 
                            value="auto" 
                            checked={firingMode === "auto"} 
                            onChange={() => setFiringMode("auto")}
                            style={{ margin: 0 }}
                          />
                          Auto (1s)
                        </label>
                      </div>
                    </div>

                    {/* Projectile Speed */}
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                        Projectile Speed: <span style={{ color: "#fff", fontWeight: 600 }}>{projectileSpeedPerTick}px/tick</span>
                      </label>
                      <input 
                        type="range" 
                        min={1} 
                        max={18} 
                        step={0.5} 
                        value={projectileSpeedPerTick} 
                        onChange={(e) => setProjectileSpeedPerTick(parseFloat(e.target.value))} 
                        style={{ width: "100%", cursor: "pointer" }} 
                      />
                    </div>

                    {/* Superbubble Power Timing Controls */}
                    <div style={{ marginBottom: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                      <div style={{ color: "#ccc", fontSize: 13, marginBottom: 8, fontWeight: 600 }}>⏱️ Power Timing:</div>
                      
                      {/* Auto-enable time */}
                      <div style={{ marginBottom: 10 }}>
                        <label style={{ color: "#ccc", fontSize: 12, display: "block", marginBottom: 6 }}>
                          Enable After: <span style={{ color: "#fff", fontWeight: 600 }}>{superpowerAutoEnableTime === 0 ? "Start" : `${superpowerAutoEnableTime}s`}</span>
                        </label>
                        <input 
                          type="range" 
                          min={0} 
                          max={300} 
                          step={5} 
                          value={superpowerAutoEnableTime} 
                          onChange={(e) => setSuperpowerAutoEnableTime(parseInt(e.target.value))} 
                          style={{ width: "100%", cursor: "pointer" }} 
                          disabled={isRunning}
                        />
                        <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>
                          {superpowerAutoEnableTime === 0 ? "Powers enabled at game start" : `Powers enabled after ${superpowerAutoEnableTime} seconds`}
                        </div>
                      </div>
                      
                      {/* Duration */}
                      <div style={{ marginBottom: 10 }}>
                        <label style={{ color: "#ccc", fontSize: 12, display: "block", marginBottom: 6 }}>
                          Duration: <span style={{ color: "#fff", fontWeight: 600 }}>{superpowerActiveDuration === 0 ? "Forever" : `${superpowerActiveDuration}s`}</span>
                        </label>
                        <input 
                          type="range" 
                          min={0} 
                          max={300} 
                          step={5} 
                          value={superpowerActiveDuration} 
                          onChange={(e) => setSuperpowerActiveDuration(parseInt(e.target.value))} 
                          style={{ width: "100%", cursor: "pointer" }} 
                          disabled={isRunning}
                        />
                        <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>
                          {superpowerActiveDuration === 0 ? "Powers active until game ends" : `Powers active for ${superpowerActiveDuration} seconds`}
                        </div>
                      </div>
                    </div>

                    {/* Superbubble Projectile Count */}
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                        Final Boss ☠️ Projectiles: <span style={{ color: "#fff", fontWeight: 600 }}>{superbubbleProjectileCount}</span>
                      </label>
                      <input 
                        type="range" 
                        min={1} 
                        max={10} 
                        step={1} 
                        value={superbubbleProjectileCount} 
                        onChange={(e) => setSuperbubbleProjectileCount(parseInt(e.target.value))} 
                        style={{ width: "100%", cursor: "pointer" }} 
                      />
                    </div>

                    {/* Superbubble Power Mode (only show when multiple projectiles) */}
                    {superbubbleProjectileCount > 1 && (
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                          Multi-Projectile Power Mode:
                        </label>
                        <div style={{ display: "flex", gap: 8 }}>
                          <label style={{
                            flex: 1,
                            padding: "8px 12px",
                            borderRadius: 8,
                            background: superbubblePowerMode === "random" ? "#6b44ff" : "rgba(255,255,255,0.08)",
                            border: superbubblePowerMode === "random" ? "1px solid #8b66ff" : "1px solid rgba(255,255,255,0.15)",
                            color: superbubblePowerMode === "random" ? "#fff" : "#ccc",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: superbubblePowerMode === "random" ? 600 : 400
                          }}>
                            <input 
                              type="radio" 
                              name="powerMode" 
                              checked={superbubblePowerMode === "random"} 
                              onChange={() => setSuperbubblePowerMode("random")} 
                              style={{ display: "none" }} 
                            />
                            🎲 Random
                          </label>
                          <label style={{
                            flex: 1,
                            padding: "8px 12px",
                            borderRadius: 8,
                            background: superbubblePowerMode === "same" ? "#6b44ff" : "rgba(255,255,255,0.08)",
                            border: superbubblePowerMode === "same" ? "1px solid #8b66ff" : "1px solid rgba(255,255,255,0.15)",
                            color: superbubblePowerMode === "same" ? "#fff" : "#ccc",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: superbubblePowerMode === "same" ? 600 : 400
                          }}>
                            <input 
                              type="radio" 
                              name="powerMode" 
                              checked={superbubblePowerMode === "same"} 
                              onChange={() => setSuperbubblePowerMode("same")} 
                              style={{ display: "none" }} 
                            />
                            🎯 Same Power
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Manual Shoot Button */}
                    {firingMode === "manual" && (
                      <button 
                        onClick={() => handleShoot()} 
                        disabled={!isRunning || !superBubbleRef.current || !superpowerEnabled} 
                        style={{ 
                          width: "100%", 
                          height: 40,
                          background: (!isRunning || !superBubbleRef.current) ? "rgba(255,255,255,0.1)" : "#ff4081",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          cursor: (!isRunning || !superBubbleRef.current) ? "not-allowed" : "pointer",
                          fontSize: 14,
                          fontWeight: 700
                        }}
                      >
                        🔫 Shoot Projectile
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Player Powers (Boss Arena only) */}
            {arenaType === ARENA_TYPES.BOSS && (
              <div style={{ 
                background: "rgba(76,175,80,0.1)", 
                padding: 12, 
                borderRadius: 8, 
                marginBottom: 12,
                border: "1px solid rgba(76,175,80,0.3)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Player Powers</div>
                  <ToggleButton on={playerPowersEnabled} onToggle={() => setPlayerPowersEnabled((s) => !s)} label={playerPowersEnabled ? "ON" : "OFF"} />
                </div>
                
                {/* Auto-Enable Timer */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ color: "#ccc", fontSize: 12, display: "block", marginBottom: 6 }}>
                    ⏱️ Auto-Enable After (seconds): <span style={{ color: "#4caf50", fontWeight: 600 }}>{playerPowersAutoEnableTime === 0 ? "Disabled" : `${playerPowersAutoEnableTime}s`}</span>
                  </label>
                  <input 
                    type="number" 
                    min={0} 
                    max={3600} 
                    step={1} 
                    value={playerPowersAutoEnableTime} 
                    onChange={(e) => setPlayerPowersAutoEnableTime(parseInt(e.target.value) || 0)} 
                    style={{ width: "100%", padding: "6px", borderRadius: 4, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(76,175,80,0.3)" }} 
                    placeholder="0 = disabled"
                  />
                </div>

                {playerPowersEnabled && (
                  <>
                    {/* Mode Selection */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ color: "#ccc", fontSize: 12, marginBottom: 8, fontWeight: 500 }}>Power Mode:</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        <label 
                          style={{ 
                            padding: "8px 10px",
                            borderRadius: 6,
                            background: playerPowerMode === "pickup" ? "#4caf50" : "rgba(255,255,255,0.08)",
                            border: playerPowerMode === "pickup" ? "1px solid #66bb6a" : "1px solid rgba(255,255,255,0.15)",
                            color: playerPowerMode === "pickup" ? "#fff" : "#ccc",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            fontSize: 12,
                            fontWeight: playerPowerMode === "pickup" ? 600 : 400
                          }}
                        >
                          <input 
                            type="radio" 
                            name="playerPowerMode" 
                            value="pickup" 
                            checked={playerPowerMode === "pickup"} 
                            onChange={() => setPlayerPowerMode("pickup")}
                            style={{ margin: 0 }}
                          />
                          Pickup
                        </label>
                        <label 
                          style={{ 
                            padding: "8px 10px",
                            borderRadius: 6,
                            background: playerPowerMode === "preassigned" ? "#4caf50" : "rgba(255,255,255,0.08)",
                            border: playerPowerMode === "preassigned" ? "1px solid #66bb6a" : "1px solid rgba(255,255,255,0.15)",
                            color: playerPowerMode === "preassigned" ? "#fff" : "#ccc",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            fontSize: 12,
                            fontWeight: playerPowerMode === "preassigned" ? 600 : 400
                          }}
                        >
                          <input 
                            type="radio" 
                            name="playerPowerMode" 
                            value="preassigned" 
                            checked={playerPowerMode === "preassigned"} 
                            onChange={() => setPlayerPowerMode("preassigned")}
                            style={{ margin: 0 }}
                          />
                          Pre-assign
                        </label>
                      </div>
                    </div>

                    {/* Pickup Mode Settings */}
                    {playerPowerMode === "pickup" && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ color: "#ccc", fontSize: 12, marginBottom: 8, fontWeight: 500 }}>Select Powers to Spawn:</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(34px, 1fr))", gap: 5 }}>
                          {AVAILABLE_POWER_KEYS.map((k) => (
                            <PowerChips key={k} powerKey={k} active={!!selectedPlayerPowers[k]} accent="#4caf50"
                              onToggle={() => setSelectedPlayerPowers((s) => ({ ...s, [k]: !s[k] }))} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pre-assigned Mode Settings */}
                    {playerPowerMode === "preassigned" && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ color: "#ccc", fontSize: 12, marginBottom: 8, fontWeight: 500 }}>🎯 Quick Bubble Power Assignment:</div>
                        
                        {/* Power Grid - Assign powers to bubbles visually */}
                        <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: 10, marginBottom: 12 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(34px, 1fr))", gap: 5, marginBottom: 12 }}>
                            {AVAILABLE_POWER_KEYS.map((powerKey) => (
                              <PowerChips key={powerKey} powerKey={powerKey} active={powerAssignments.some(a => a.type === powerKey)} accent="#4caf50"
                                onToggle={() => {
                                  const existing = powerAssignments.filter(a => a.type === powerKey);
                                  if (existing.length > 0) {
                                    setPowerAssignments((prev) => prev.filter(a => a.type !== powerKey));
                                  }
                                }} />
                            ))}
                          </div>
                        </div>

                        <div style={{ color: "#ccc", fontSize: 12, marginBottom: 8, fontWeight: 500 }}>Current Assignments:</div>
                        <div style={{ 
                          maxHeight: 150, 
                          overflowY: "auto", 
                          background: "rgba(0,0,0,0.3)", 
                          borderRadius: 6, 
                          padding: 8,
                          marginBottom: 8
                        }}>
                          {powerAssignments.length === 0 ? (
                            <div style={{ color: "#666", fontSize: 11, textAlign: "center", padding: 8 }}>No assignments yet</div>
                          ) : (
                            powerAssignments.map((assignment, idx) => (
                              <div 
                                key={idx} 
                                style={{ 
                                  display: "flex", 
                                  justifyContent: "space-between", 
                                  alignItems: "center",
                                  padding: "6px 8px",
                                  background: "rgba(255,255,255,0.05)",
                                  borderRadius: 4,
                                  marginBottom: 4,
                                  fontSize: 11
                                }}
                              >
                                <span style={{ color: "#fff" }}>
                                  Bubble #{assignment.bubbleId + 1} - {SUPER_BUBBLE_TYPES[assignment.type].name} ({assignment.duration}s)
                                </span>
                                <button 
                                  onClick={() => setPowerAssignments((prev) => prev.filter((_, i) => i !== idx))}
                                  style={{
                                    background: "#f44336",
                                    border: "none",
                                    color: "#fff",
                                    padding: "2px 6px",
                                    borderRadius: 3,
                                    cursor: "pointer",
                                    fontSize: 10
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                        
                        {/* Add Assignment Form */}
                        <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: 8, marginBottom: 8 }}>
                          <div style={{ marginBottom: 6 }}>
                            <label style={{ color: "#ccc", fontSize: 11, display: "block", marginBottom: 4 }}>Bubble Index (0-based):</label>
                            <input 
                              id="bubbleIndexInput"
                              type="number" 
                              min="0"
                              placeholder="e.g., 0 for first bubble"
                              style={{
                                width: "100%",
                                padding: "6px",
                                borderRadius: 4,
                                background: "rgba(255,255,255,0.1)",
                                color: "#fff",
                                border: "1px solid rgba(255,255,255,0.2)",
                                fontSize: 11
                              }}
                            />
                          </div>
                          <div style={{ marginBottom: 6 }}>
                            <label style={{ color: "#ccc", fontSize: 11, display: "block", marginBottom: 4 }}>Power Type:</label>
                            <select 
                              id="powerTypeSelect"
                              style={{
                                width: "100%",
                                padding: "6px",
                                borderRadius: 4,
                                background: "rgba(255,255,255,0.1)",
                                color: "#fff",
                                border: "1px solid rgba(255,255,255,0.2)",
                                fontSize: 11
                              }}
                            >
                              {AVAILABLE_POWER_KEYS.map((k) => (
                                <option key={k} value={k}>
                                  {SUPER_BUBBLE_TYPES[k].name} ({SUPER_BUBBLE_TYPES[k].damage} dmg)
                                </option>
                              ))}
                            </select>
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <label style={{ color: "#ccc", fontSize: 11, display: "block", marginBottom: 4 }}>Duration (seconds):</label>
                            <input 
                              id="durationInput"
                              type="number" 
                              min="1"
                              defaultValue="10"
                              placeholder="e.g., 10"
                              style={{
                                width: "100%",
                                padding: "6px",
                                borderRadius: 4,
                                background: "rgba(255,255,255,0.1)",
                                color: "#fff",
                                border: "1px solid rgba(255,255,255,0.2)",
                                fontSize: 11
                              }}
                            />
                          </div>
                          <button 
                            onClick={() => {
                              const bubbleIdInput = document.getElementById("bubbleIndexInput") as HTMLInputElement;
                              const powerTypeSelect = document.getElementById("powerTypeSelect") as HTMLSelectElement;
                              const durationInput = document.getElementById("durationInput") as HTMLInputElement;
                              
                              const bubbleId = parseInt(bubbleIdInput.value);
                              const powerType = powerTypeSelect.value as keyof typeof SUPER_BUBBLE_TYPES;
                              const duration = parseInt(durationInput.value);
                              
                              if (!isNaN(bubbleId) && bubbleId >= 0 && !isNaN(duration) && duration > 0) {
                                setPowerAssignments((prev) => [...prev, {
                                  bubbleId: bubbleId,
                                  type: powerType,
                                  duration: duration
                                }]);
                                // Clear inputs
                                bubbleIdInput.value = "";
                                durationInput.value = "10";
                              } else {
                                alert("Please enter valid bubble index and duration");
                              }
                            }}
                            disabled={isRunning}
                            style={{
                              width: "100%",
                              padding: "6px",
                              background: isRunning ? "rgba(255,255,255,0.1)" : "#4caf50",
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              cursor: isRunning ? "not-allowed" : "pointer",
                              fontSize: 11,
                              fontWeight: 600
                            }}
                          >
                            + Add Assignment
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Player Bubbles Shooting (Boss Arena only) */}
            {arenaType === ARENA_TYPES.BOSS && playerPowersEnabled && (
              <div style={{ 
                background: "rgba(76,175,80,0.1)", 
                padding: 12, 
                borderRadius: 8, 
                marginBottom: 12,
                border: "1px solid rgba(76,175,80,0.3)"
              }}>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 14, marginBottom: 12 }}>🔫 Shooting Capability</div>
                
                {/* Firing Mode */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: "#ccc", fontSize: 12, marginBottom: 8, fontWeight: 500 }}>Firing Mode:</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <label 
                      style={{ 
                        padding: "8px 10px",
                        borderRadius: 6,
                        background: playerBubblesFiringMode === "manual" ? "#4caf50" : "rgba(255,255,255,0.08)",
                        border: playerBubblesFiringMode === "manual" ? "1px solid #66bb6a" : "1px solid rgba(255,255,255,0.15)",
                        color: playerBubblesFiringMode === "manual" ? "#fff" : "#ccc",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        fontSize: 12,
                        fontWeight: playerBubblesFiringMode === "manual" ? 600 : 400
                      }}
                    >
                      <input 
                        type="radio" 
                        name="playerBubblesFiringMode" 
                        value="manual" 
                        checked={playerBubblesFiringMode === "manual"} 
                        onChange={() => setPlayerBubblesFiringMode("manual")}
                        style={{ margin: 0 }}
                      />
                      Manual
                    </label>
                    <label 
                      style={{ 
                        padding: "8px 10px",
                        borderRadius: 6,
                        background: playerBubblesFiringMode === "auto" ? "#4caf50" : "rgba(255,255,255,0.08)",
                        border: playerBubblesFiringMode === "auto" ? "1px solid #66bb6a" : "1px solid rgba(255,255,255,0.15)",
                        color: playerBubblesFiringMode === "auto" ? "#fff" : "#ccc",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        fontSize: 12,
                        fontWeight: playerBubblesFiringMode === "auto" ? 600 : 400
                      }}
                    >
                      <input 
                        type="radio" 
                        name="playerBubblesFiringMode" 
                        value="auto" 
                        checked={playerBubblesFiringMode === "auto"} 
                        onChange={() => setPlayerBubblesFiringMode("auto")}
                        style={{ margin: 0 }}
                      />
                      Auto (1s)
                    </label>
                  </div>
                </div>

                {/* Manual Shoot Button (player bubbles) */}
                {playerBubblesFiringMode === "manual" && (
                  <button
                    onClick={() => { manualShootRequestRef.current = true; }}
                    disabled={!isRunning}
                    style={{
                      width: "100%", height: 38, marginBottom: 12,
                      background: !isRunning ? "rgba(255,255,255,0.1)" : "#4caf50",
                      color: "#fff", border: "none", borderRadius: 6,
                      cursor: !isRunning ? "not-allowed" : "pointer",
                      fontSize: 14, fontWeight: 700
                    }}
                  >
                    🔫 Shoot Now
                  </button>
                )}

                {/* Projectile Count */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                    Projectiles per Shot: <span style={{ color: "#fff", fontWeight: 600 }}>{playerBubblesProjectileCount}</span>
                  </label>
                  <input 
                    type="range" 
                    min={1} 
                    max={6} 
                    step={1} 
                    value={playerBubblesProjectileCount} 
                    onChange={(e) => setPlayerBubblesProjectileCount(parseInt(e.target.value))} 
                    style={{ width: "100%", cursor: "pointer" }} 
                  />
                </div>

                {/* Power Mode (only show when multiple projectiles) */}
                {playerBubblesProjectileCount > 1 && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                      Multi-Projectile Power Mode:
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <label style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: playerBubblesPowerMode === "random" ? "#4caf50" : "rgba(255,255,255,0.08)",
                        border: playerBubblesPowerMode === "random" ? "1px solid #66bb6a" : "1px solid rgba(255,255,255,0.15)",
                        color: playerBubblesPowerMode === "random" ? "#fff" : "#ccc",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: playerBubblesPowerMode === "random" ? 600 : 400
                      }}>
                        <input 
                          type="radio" 
                          name="playerPowerMode2" 
                          checked={playerBubblesPowerMode === "random"} 
                          onChange={() => setPlayerBubblesPowerMode("random")} 
                          style={{ display: "none" }} 
                        />
                        🎲 Random
                      </label>
                      <label style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: playerBubblesPowerMode === "same" ? "#4caf50" : "rgba(255,255,255,0.08)",
                        border: playerBubblesPowerMode === "same" ? "1px solid #66bb6a" : "1px solid rgba(255,255,255,0.15)",
                        color: playerBubblesPowerMode === "same" ? "#fff" : "#ccc",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: playerBubblesPowerMode === "same" ? 600 : 400
                      }}>
                        <input 
                          type="radio" 
                          name="playerPowerMode2" 
                          checked={playerBubblesPowerMode === "same"} 
                          onChange={() => setPlayerBubblesPowerMode("same")} 
                          style={{ display: "none" }} 
                        />
                        🎯 Same Power
                      </label>
                    </div>
                  </div>
                )}

                {/* Projectile Speed */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                    Projectile Speed: <span style={{ color: "#fff", fontWeight: 600 }}>{playerBubblesProjectileSpeed}px/tick</span>
                  </label>
                  <input 
                    type="range" 
                    min={1} 
                    max={12} 
                    step={0.5} 
                    value={playerBubblesProjectileSpeed} 
                    onChange={(e) => setPlayerBubblesProjectileSpeed(parseFloat(e.target.value))} 
                    style={{ width: "100%", cursor: "pointer" }} 
                  />
                </div>
              </div>
            )}

            {/* Brawl Bubble Size (Brawl Arena only) */}
            {arenaType === ARENA_TYPES.BRAWL && (
              <div style={{ 
                background: "rgba(255,152,0,0.1)", 
                padding: 12, 
                borderRadius: 8, 
                marginBottom: 12,
                border: "1px solid rgba(255,152,0,0.3)"
              }}>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Bubble Size</div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "flex", alignItems: "center", color: "#ccc", fontSize: 12, marginBottom: 6 }}>
                    Brawl Bubbles: {brawlBubbleSizeMultiplier.toFixed(2)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={brawlBubbleSizeMultiplier}
                    disabled={isRunning}
                    onChange={(e) => setBrawlBubbleSizeMultiplier(parseFloat(e.target.value))}
                    style={{ width: "100%", cursor: isRunning ? "not-allowed" : "pointer" }}
                  />
                </div>
              </div>
            )}

            {/* Brawl 

            {/* Brawl Powers (Brawl Arena only) */}
            {arenaType === ARENA_TYPES.BRAWL && (
              <div style={{ 
                background: "rgba(255,152,0,0.1)", 
                padding: 12, 
                borderRadius: 8, 
                marginBottom: 12,
                border: "1px solid rgba(255,152,0,0.3)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>Brawl Powers</div>
                  <ToggleButton on={brawlPowersEnabled} onToggle={() => setBrawlPowersEnabled((s) => !s)} label={brawlPowersEnabled ? "ON" : "OFF"} />
                </div>
                
                {/* Auto-Enable Timer */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ color: "#ccc", fontSize: 12, display: "block", marginBottom: 6 }}>
                    ⏱️ Auto-Enable After (seconds): <span style={{ color: "#ff9800", fontWeight: 600 }}>{brawlPowersAutoEnableTime === 0 ? "Disabled" : `${brawlPowersAutoEnableTime}s`}</span>
                  </label>
                  <input 
                    type="number" 
                    min={0} 
                    max={3600} 
                    step={1} 
                    value={brawlPowersAutoEnableTime} 
                    onChange={(e) => setBrawlPowersAutoEnableTime(parseInt(e.target.value) || 0)} 
                    style={{ width: "100%", padding: "6px", borderRadius: 4, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,152,0,0.3)" }} 
                    placeholder="0 = disabled"
                  />
                </div>

                {brawlPowersEnabled && (
                  <>
                    {/* 1v1 Mode Powers */}
                    {brawlMode === "1v1" && (
                      <div style={{ marginBottom: 12 }}>
                        {/* Power Mode Selector */}
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ color: "#ccc", fontSize: 12, marginBottom: 6, fontWeight: 500 }}>Power Mode:</div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => setBrawl1v1PowerMode("random")}
                              style={{
                                flex: 1,
                                padding: "8px",
                                borderRadius: 6,
                                background: brawl1v1PowerMode === "random" ? "#ff9800" : "rgba(255,255,255,0.08)",
                                color: brawl1v1PowerMode === "random" ? "#fff" : "#ccc",
                                border: brawl1v1PowerMode === "random" ? "1px solid #ffa726" : "1px solid rgba(255,255,255,0.15)",
                                cursor: "pointer",
                                fontSize: 11,
                                fontWeight: brawl1v1PowerMode === "random" ? 600 : 400
                              }}
                            >
                              Random
                            </button>
                            <button
                              onClick={() => setBrawl1v1PowerMode("preassigned")}
                              style={{
                                flex: 1,
                                padding: "8px",
                                borderRadius: 6,
                                background: brawl1v1PowerMode === "preassigned" ? "#ff9800" : "rgba(255,255,255,0.08)",
                                color: brawl1v1PowerMode === "preassigned" ? "#fff" : "#ccc",
                                border: brawl1v1PowerMode === "preassigned" ? "1px solid #ffa726" : "1px solid rgba(255,255,255,0.15)",
                                cursor: "pointer",
                                fontSize: 11,
                                fontWeight: brawl1v1PowerMode === "preassigned" ? 600 : 400
                              }}
                            >
                              Pre-assign
                            </button>
                          </div>
                        </div>

                        {/* Random Mode: Select power types */}
                        {brawl1v1PowerMode === "random" && (
                          <>
                            <div style={{ color: "#ccc", fontSize: 12, marginBottom: 8, fontWeight: 500 }}>
                              Select Powers (Random assignment):
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(34px, 1fr))", gap: 5 }}>
                              {AVAILABLE_POWER_KEYS.map((k) => (
                                <PowerChips key={k} powerKey={k} active={!!selectedBrawlPowers[k]} accent="#ff9800"
                                  onToggle={() => setSelectedBrawlPowers((s) => ({ ...s, [k]: !s[k] }))} />
                              ))}
                            </div>
                          </>
                        )}

                        {/* Pre-assigned Mode: Manual assignment */}
                        {brawl1v1PowerMode === "preassigned" && (
                          <>
                            <div style={{ color: "#ccc", fontSize: 12, marginBottom: 8, fontWeight: 500 }}>Power Assignments:</div>
                            <div style={{ 
                              maxHeight: 120, 
                              overflowY: "auto", 
                              background: "rgba(0,0,0,0.3)", 
                              borderRadius: 6, 
                              padding: 8,
                              marginBottom: 8
                            }}>
                              {brawl1v1PowerAssignments.length === 0 ? (
                                <div style={{ color: "#666", fontSize: 11, textAlign: "center", padding: 8 }}>No assignments yet</div>
                              ) : (
                                brawl1v1PowerAssignments.map((assignment, idx) => (
                                  <div 
                                    key={idx} 
                                    style={{ 
                                      display: "flex", 
                                      justifyContent: "space-between", 
                                      alignItems: "center",
                                      padding: "6px 8px",
                                      background: "rgba(255,255,255,0.05)",
                                      borderRadius: 4,
                                      marginBottom: 4,
                                      fontSize: 11
                                    }}
                                  >
                                    <span style={{ color: "#fff" }}>
                                      Fighter #{assignment.bubbleId + 1} - {SUPER_BUBBLE_TYPES[assignment.type].name}
                                    </span>
                                    <button 
                                      onClick={() => setBrawl1v1PowerAssignments((prev) => prev.filter((_, i) => i !== idx))}
                                      style={{
                                        background: "#f44336",
                                        border: "none",
                                        color: "#fff",
                                        padding: "2px 6px",
                                        borderRadius: 3,
                                        cursor: "pointer",
                                        fontSize: 10
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                            
                            {/* Quick assign buttons for both fighters */}
                            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ color: "#4caf50", fontSize: 11, marginBottom: 4, fontWeight: 500 }}>Fighter #1:</div>
                                <select 
                                  id="fighter1Power"
                                  style={{ width: "100%", padding: 6, borderRadius: 4, fontSize: 11, background: "#333", color: "#fff", border: "1px solid #555" }}
                                >
                                  {AVAILABLE_POWER_KEYS.map((k) => (
                                    <option key={k} value={k}>{SUPER_BUBBLE_TYPES[k].name}</option>
                                  ))}
                                </select>
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ color: "#f44336", fontSize: 11, marginBottom: 4, fontWeight: 500 }}>Fighter #2:</div>
                                <select 
                                  id="fighter2Power"
                                  style={{ width: "100%", padding: 6, borderRadius: 4, fontSize: 11, background: "#333", color: "#fff", border: "1px solid #555" }}
                                >
                                  {AVAILABLE_POWER_KEYS.map((k) => (
                                    <option key={k} value={k}>{SUPER_BUBBLE_TYPES[k].name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const f1Select = document.getElementById("fighter1Power") as HTMLSelectElement;
                                const f2Select = document.getElementById("fighter2Power") as HTMLSelectElement;
                                const f1Power = f1Select.value as keyof typeof SUPER_BUBBLE_TYPES;
                                const f2Power = f2Select.value as keyof typeof SUPER_BUBBLE_TYPES;
                                setBrawl1v1PowerAssignments([
                                  { bubbleId: 0, type: f1Power, duration: Infinity },
                                  { bubbleId: 1, type: f2Power, duration: Infinity }
                                ]);
                              }}
                              style={{
                                width: "100%",
                                padding: "8px",
                                background: "#ff9800",
                                color: "#fff",
                                border: "none",
                                borderRadius: 4,
                                cursor: "pointer",
                                fontSize: 11,
                                fontWeight: 600
                              }}
                            >
                              Set Powers for Both Fighters
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* 1vMany Mode Powers */}
                    {brawlMode === "1vMany" && (
                      <div style={{ marginBottom: 12 }}>
                        {/* Power Mode Selector */}
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ color: "#ccc", fontSize: 12, marginBottom: 6, fontWeight: 500 }}>Power Mode:</div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => setBrawl1vManyPowerMode("random")}
                              style={{
                                flex: 1,
                                padding: "8px",
                                borderRadius: 6,
                                background: brawl1vManyPowerMode === "random" ? "#ff9800" : "rgba(255,255,255,0.08)",
                                color: brawl1vManyPowerMode === "random" ? "#fff" : "#ccc",
                                border: brawl1vManyPowerMode === "random" ? "1px solid #ffa726" : "1px solid rgba(255,255,255,0.15)",
                                cursor: "pointer",
                                fontSize: 11,
                                fontWeight: brawl1vManyPowerMode === "random" ? 600 : 400
                              }}
                            >
                              Random
                            </button>
                            <button
                              onClick={() => setBrawl1vManyPowerMode("preassigned")}
                              style={{
                                flex: 1,
                                padding: "8px",
                                borderRadius: 6,
                                background: brawl1vManyPowerMode === "preassigned" ? "#ff9800" : "rgba(255,255,255,0.08)",
                                color: brawl1vManyPowerMode === "preassigned" ? "#fff" : "#ccc",
                                border: brawl1vManyPowerMode === "preassigned" ? "1px solid #ffa726" : "1px solid rgba(255,255,255,0.15)",
                                cursor: "pointer",
                                fontSize: 11,
                                fontWeight: brawl1vManyPowerMode === "preassigned" ? 600 : 400
                              }}
                            >
                              Pre-assign
                            </button>
                          </div>
                        </div>

                        {/* Random Mode: Select power types */}
                        {brawl1vManyPowerMode === "random" && (
                          <>
                            <div style={{ color: "#ccc", fontSize: 12, marginBottom: 8, fontWeight: 500 }}>
                              Select Powers (Random assignment):
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(34px, 1fr))", gap: 5 }}>
                              {AVAILABLE_POWER_KEYS.map((k) => (
                                <PowerChips key={k} powerKey={k} active={!!selectedBrawlPowers[k]} accent="#ff9800"
                                  onToggle={() => setSelectedBrawlPowers((s) => ({ ...s, [k]: !s[k] }))} />
                              ))}
                            </div>
                          </>
                        )}

                        {/* Pre-assigned Mode: Manual assignment */}
                        {brawl1vManyPowerMode === "preassigned" && (
                          <>
                            <div style={{ color: "#ccc", fontSize: 12, marginBottom: 8, fontWeight: 500 }}>Power Assignments:</div>
                            <div style={{ 
                              maxHeight: 150, 
                              overflowY: "auto", 
                              background: "rgba(0,0,0,0.3)", 
                              borderRadius: 6, 
                              padding: 8,
                              marginBottom: 8
                            }}>
                              {brawl1vManyPowerAssignments.length === 0 ? (
                                <div style={{ color: "#666", fontSize: 11, textAlign: "center", padding: 8 }}>No assignments yet</div>
                              ) : (
                                brawl1vManyPowerAssignments.map((assignment, idx) => (
                                  <div 
                                    key={idx} 
                                    style={{ 
                                      display: "flex", 
                                      justifyContent: "space-between", 
                                      alignItems: "center",
                                      padding: "6px 8px",
                                      background: "rgba(255,255,255,0.05)",
                                      borderRadius: 4,
                                      marginBottom: 4,
                                      fontSize: 11
                                    }}
                                  >
                                    <span style={{ color: "#fff" }}>
                                      {assignment.bubbleId === 0 ? "Solo" : `Many #${assignment.bubbleId}`} - {SUPER_BUBBLE_TYPES[assignment.type].name}
                                    </span>
                                    <button 
                                      onClick={() => setBrawl1vManyPowerAssignments((prev) => prev.filter((_, i) => i !== idx))}
                                      style={{
                                        background: "#f44336",
                                        border: "none",
                                        color: "#fff",
                                        padding: "2px 6px",
                                        borderRadius: 3,
                                        cursor: "pointer",
                                        fontSize: 10
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                        
                            {/* Add Assignment Form */}
                            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: 8, marginBottom: 8 }}>
                              <div style={{ marginBottom: 6 }}>
                                <label style={{ color: "#ccc", fontSize: 11, display: "block", marginBottom: 4 }}>Bubble (0=Solo, 1+=Many):</label>
                                <input 
                                  id="brawlBubbleIndexInput"
                                  type="number" 
                                  min="0"
                                  placeholder="0 for solo, 1-N for many side"
                                  style={{
                                    width: "100%",
                                    padding: "6px",
                                    borderRadius: 4,
                                    background: "rgba(255,255,255,0.1)",
                                    color: "#fff",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                    fontSize: 11
                                  }}
                                />
                              </div>
                              <div style={{ marginBottom: 6 }}>
                                <label style={{ color: "#ccc", fontSize: 11, display: "block", marginBottom: 4 }}>Power Type:</label>
                                <select 
                                  id="brawlPowerTypeSelect"
                                  style={{
                                    width: "100%",
                                    padding: "6px",
                                    borderRadius: 4,
                                    background: "rgba(255,255,255,0.1)",
                                    color: "#fff",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                    fontSize: 11
                                  }}
                                >
                                  {AVAILABLE_POWER_KEYS.map((k) => (
                                    <option key={k} value={k}>
                                      {SUPER_BUBBLE_TYPES[k].name} ({SUPER_BUBBLE_TYPES[k].damage} dmg)
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div style={{ marginBottom: 6 }}>
                                <label style={{ color: "#ccc", fontSize: 11, display: "block", marginBottom: 4 }}>Duration (seconds):</label>
                                <input 
                                  id="brawlDurationInput"
                                  type="number" 
                                  min="1"
                                  defaultValue="10"
                                  style={{
                                    width: "100%",
                                    padding: "6px",
                                    borderRadius: 4,
                                    background: "rgba(255,255,255,0.1)",
                                    color: "#fff",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                    fontSize: 11
                                  }}
                                />
                              </div>
                              <button 
                                onClick={() => {
                                  const bubbleIdInput = document.getElementById("brawlBubbleIndexInput") as HTMLInputElement;
                                  const powerTypeSelect = document.getElementById("brawlPowerTypeSelect") as HTMLSelectElement;
                                  const durationInput = document.getElementById("brawlDurationInput") as HTMLInputElement;
                                  
                                  const bubbleId = parseInt(bubbleIdInput.value);
                                  const powerType = powerTypeSelect.value as keyof typeof SUPER_BUBBLE_TYPES;
                                  const duration = parseInt(durationInput.value);
                                  
                                  if (!isNaN(bubbleId) && bubbleId >= 0 && !isNaN(duration) && duration > 0) {
                                    setBrawl1vManyPowerAssignments((prev) => [...prev, {
                                      bubbleId,
                                      type: powerType,
                                      duration
                                    }]);
                                    // Clear inputs
                                    bubbleIdInput.value = "";
                                    durationInput.value = "10";
                                  } else {
                                    alert("Please enter valid bubble index and duration");
                                  }
                                }}
                                disabled={isRunning}
                                style={{
                                  width: "100%",
                                  padding: "6px",
                                  background: isRunning ? "rgba(255,255,255,0.1)" : "#ff9800",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: 4,
                                  cursor: isRunning ? "not-allowed" : "pointer",
                                  fontSize: 11,
                                  fontWeight: 600
                                }}
                              >
                                + Add Assignment
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Brawl Bubbles Shooting */}
                    <div style={{ 
                      background: "rgba(255,152,0,0.1)", 
                      padding: 12, 
                      borderRadius: 8, 
                      marginBottom: 12,
                      border: "1px solid rgba(255,152,0,0.3)"
                    }}>
                      <div style={{ color: "#fff", fontWeight: 600, fontSize: 14, marginBottom: 12 }}>🔫 Shooting Capability</div>
                      
                      {/* Firing Mode */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ color: "#ccc", fontSize: 12, marginBottom: 8, fontWeight: 500 }}>Firing Mode:</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                          <label 
                            style={{ 
                              padding: "8px 10px",
                              borderRadius: 6,
                              background: brawlBubblesFiringMode === "manual" ? "#ff9800" : "rgba(255,255,255,0.08)",
                              border: brawlBubblesFiringMode === "manual" ? "1px solid #ffa726" : "1px solid rgba(255,255,255,0.15)",
                              color: brawlBubblesFiringMode === "manual" ? "#fff" : "#ccc",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                              fontSize: 12,
                              fontWeight: brawlBubblesFiringMode === "manual" ? 600 : 400
                            }}
                          >
                            <input 
                              type="radio" 
                              name="brawlBubblesFiringMode" 
                              value="manual" 
                              checked={brawlBubblesFiringMode === "manual"} 
                              onChange={() => setBrawlBubblesFiringMode("manual")}
                              style={{ margin: 0 }}
                            />
                            Manual
                          </label>
                          <label 
                            style={{ 
                              padding: "8px 10px",
                              borderRadius: 6,
                              background: brawlBubblesFiringMode === "auto" ? "#ff9800" : "rgba(255,255,255,0.08)",
                              border: brawlBubblesFiringMode === "auto" ? "1px solid #ffa726" : "1px solid rgba(255,255,255,0.15)",
                              color: brawlBubblesFiringMode === "auto" ? "#fff" : "#ccc",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                              fontSize: 12,
                              fontWeight: brawlBubblesFiringMode === "auto" ? 600 : 400
                            }}
                          >
                            <input 
                              type="radio" 
                              name="brawlBubblesFiringMode" 
                              value="auto" 
                              checked={brawlBubblesFiringMode === "auto"} 
                              onChange={() => setBrawlBubblesFiringMode("auto")}
                              style={{ margin: 0 }}
                            />
                            Auto (1s)
                          </label>
                        </div>
                      </div>

                      {/* Manual Shoot Button (brawl bubbles) */}
                      {brawlBubblesFiringMode === "manual" && (
                        <button
                          onClick={() => { manualShootRequestRef.current = true; }}
                          disabled={!isRunning}
                          style={{
                            width: "100%", height: 38, marginBottom: 12,
                            background: !isRunning ? "rgba(255,255,255,0.1)" : "#ff9800",
                            color: "#fff", border: "none", borderRadius: 6,
                            cursor: !isRunning ? "not-allowed" : "pointer",
                            fontSize: 14, fontWeight: 700
                          }}
                        >
                          🔫 Shoot Now
                        </button>
                      )}

                      {/* Projectile Count */}
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                          Projectiles per Shot: <span style={{ color: "#fff", fontWeight: 600 }}>{brawlBubblesProjectileCount}</span>
                        </label>
                        <input 
                          type="range" 
                          min={1} 
                          max={6} 
                          step={1} 
                          value={brawlBubblesProjectileCount} 
                          onChange={(e) => setBrawlBubblesProjectileCount(parseInt(e.target.value))} 
                          style={{ width: "100%", cursor: "pointer" }} 
                        />
                      </div>

                      {/* Power Mode (only show when multiple projectiles) */}
                      {brawlBubblesProjectileCount > 1 && (
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                            Multi-Projectile Power Mode:
                          </label>
                          <div style={{ display: "flex", gap: 8 }}>
                            <label style={{
                              flex: 1,
                              padding: "8px 12px",
                              borderRadius: 8,
                              background: brawlBubblesPowerMode === "random" ? "#ff9800" : "rgba(255,255,255,0.08)",
                              border: brawlBubblesPowerMode === "random" ? "1px solid #ffa726" : "1px solid rgba(255,255,255,0.15)",
                              color: brawlBubblesPowerMode === "random" ? "#fff" : "#ccc",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: brawlBubblesPowerMode === "random" ? 600 : 400
                            }}>
                              <input 
                                type="radio" 
                                name="brawlPowerModeShooting" 
                                checked={brawlBubblesPowerMode === "random"} 
                                onChange={() => setBrawlBubblesPowerMode("random")} 
                                style={{ display: "none" }} 
                              />
                              🎲 Random
                            </label>
                            <label style={{
                              flex: 1,
                              padding: "8px 12px",
                              borderRadius: 8,
                              background: brawlBubblesPowerMode === "same" ? "#ff9800" : "rgba(255,255,255,0.08)",
                              border: brawlBubblesPowerMode === "same" ? "1px solid #ffa726" : "1px solid rgba(255,255,255,0.15)",
                              color: brawlBubblesPowerMode === "same" ? "#fff" : "#ccc",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: brawlBubblesPowerMode === "same" ? 600 : 400
                            }}>
                              <input 
                                type="radio" 
                                name="brawlPowerModeShooting" 
                                checked={brawlBubblesPowerMode === "same"} 
                                onChange={() => setBrawlBubblesPowerMode("same")} 
                                style={{ display: "none" }} 
                              />
                              🎯 Same Power
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Projectile Speed */}
                      <div style={{ marginBottom: 0 }}>
                        <label style={{ color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 }}>
                          Projectile Speed: <span style={{ color: "#fff", fontWeight: 600 }}>{brawlBubblesProjectileSpeed}px/tick</span>
                        </label>
                        <input 
                          type="range" 
                          min={1} 
                          max={12} 
                          step={0.5} 
                          value={brawlBubblesProjectileSpeed} 
                          onChange={(e) => setBrawlBubblesProjectileSpeed(parseFloat(e.target.value))} 
                          style={{ width: "100%", cursor: "pointer" }} 
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArenaPage;
