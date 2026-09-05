// src/pages/ArenaPage.tsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

import "../App.css";
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
}

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

const SUPER_BUBBLE_TYPES: { [k: string]: SuperPower } = {
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

const ARENA_TYPES = {
  NORMAL: "normal",
  BOSS: "boss",
  BRAWL: "brawl",
} as const;

const ARENA_SHAPES = {
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
} as const;

type ArenaShape = typeof ARENA_SHAPES[keyof typeof ARENA_SHAPES];

const ARENA_SHAPE_INFO: { [key in ArenaShape]: { name: string; description: string } } = {
  [ARENA_SHAPES.RECTANGLE]: { name: "Rectangle", description: "Classic rectangular arena" },
  [ARENA_SHAPES.CIRCLE]: { name: "Circle", description: "Round arena with curved walls" },
  [ARENA_SHAPES.HEXAGON]: { name: "Hexagon", description: "Six-sided arena" },
  [ARENA_SHAPES.HOURGLASS]: { name: "Hourglass", description: "Narrow middle passage" },
  [ARENA_SHAPES.DIAMOND]: { name: "Diamond", description: "Rotated square shape" },
  [ARENA_SHAPES.CROSS]: { name: "Cross", description: "Plus-shaped arena" },
  [ARENA_SHAPES.PENTAGON]: { name: "Pentagon", description: "Five-sided arena" },
  [ARENA_SHAPES.SPIRAL]: { name: "Spiral", description: "Rounded rectangle shape" },
  [ARENA_SHAPES.FUNNEL]: { name: "Funnel", description: "Wide top, narrow bottom" },
  [ARENA_SHAPES.WAVE]: { name: "Wave", description: "Wavy boundaries" },
};

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
  if (count <= 5) return 40;
  if (count <= 10) return 30;
  if (count <= 50) return 27;
  if (count <= 100) return 20;
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

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const leaderboardRef = useRef<HTMLDivElement | null>(null);
  const imageListRef = useRef<string[]>([]);
  const bossImgRef = useRef<string>("");

  const [arenaType, setArenaType] = useState<string | null>(null);
  const [arenaTypeSelected, setArenaTypeSelected] = useState(false);
  const [arenaShape, setArenaShape] = useState<ArenaShape>(ARENA_SHAPES.RECTANGLE);
  const [arenaReady, setArenaReady] = useState(false); // tracks when arena setup is complete
  const [isRunning, setIsRunning] = useState(false);
  const gameStartTimeRef = useRef<number>(0); // Track when game started

  const [uiBubblesSnapshot, setUiBubblesSnapshot] = useState<BubbleData[]>([]);
  const [superBubbleSnapshot, setSuperBubbleSnapshot] = useState<BubbleData | null>(null);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const projectilesRef = useRef<Projectile[]>([]); // Ref for game loop

  const [winner, setWinner] = useState<BubbleData | null>(null);
  const [winnersList, setWinnersList] = useState<BubbleData[] | null>(null);
  const [winnersImages, setWinnersImages] = useState<string[] | null>(null);

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
  const [controlsOpen, setControlsOpen] = useState(false);
  const [pageBackgroundColor, setPageBackgroundColor] = useState('#111111');
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState('#1a1a1a');
  const [arenaInsideColor, setArenaInsideColor] = useState('#0d0d0d');

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
  const [firingMode, setFiringMode] = useState<"auto" | "manual">("manual");
  const autoFireRef = useRef<number | null>(null);
  const [projectileSpeedPerTick, setProjectileSpeedPerTick] = useState<number>(6);
  const [superbubbleProjectileCount, setSuperbubbleProjectileCount] = useState<number>(1); // 1 for single, >1 for multiple
  const [superbubblePowerMode, setSuperbubblePowerMode] = useState<"random" | "same">("random"); // random = different power per projectile, same = same power for all
  
  // Player Bubble Shooting (Boss Arena)
  const [playerBubblesFiringMode, setPlayerBubblesFiringMode] = useState<"auto" | "manual">("manual");
  const [playerBubblesAutoFire, setPlayerBubblesAutoFire] = useState<boolean>(false);
  const [playerBubblesProjectileSpeed, setPlayerBubblesProjectileSpeed] = useState<number>(4);
  const [playerBubblesProjectileCount, setPlayerBubblesProjectileCount] = useState<number>(1);
  const [playerBubblesPowerMode, setPlayerBubblesPowerMode] = useState<"random" | "same">("random");
  
  // Brawl Bubble Shooting
  const [brawlBubblesFiringMode, setBrawlBubblesFiringMode] = useState<"auto" | "manual">("manual");
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
  
  // Boss arena bubble size multiplier
  const [bossBubbleSizeMultiplier, setBossBubbleSizeMultiplier] = useState<number>(1.0);
  const baseBubbleRadiusRef = useRef<number>(0);
  const baseSuperBubbleRadiusRef = useRef<number>(60);

  // Brawl Arena State
  const [brawlMode, setBrawlMode] = useState<"1v1" | "1vMany">("1v1");
  const [brawlModeSelected, setBrawlModeSelected] = useState(false);
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
    shuriken: true,
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
  }, [playerPowersEnabled]);

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
  const imgSrcsRef = useRef<string[]>([]);
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
      if (applyDamage && damage !== undefined && healthRef.current) {
        healthRef.current[targetIndex] = Math.max(0, healthRef.current[targetIndex] - damage);
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

  const superBubbleRef = useRef<{ x: number; y: number; vx: number; vy: number; radius: number; health: number; imgSrc: string; id: number } | null>(null);

  // Get exact boundary vertices matching the clip-path definition
  const getShapeBoundaryVertices = (dims: { width: number; height: number }): { x: number; y: number }[] => {
    const w = dims.width;
    const h = dims.height;

    switch (arenaShape) {
      case ARENA_SHAPES.CIRCLE:
        // Circle boundary - use full radius
        const points: { x: number; y: number }[] = [];
        const radius = Math.min(w, h) / 2;
        const cx = w / 2;
        const cy = h / 2;
        for (let i = 0; i < 360; i += 5) {
          const angle = (i * Math.PI) / 180;
          points.push({
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle)
          });
        }
        return points;

      case ARENA_SHAPES.HEXAGON:
        // clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)
        return [
          { x: w * 0.50, y: h * 0.00 },
          { x: w * 1.00, y: h * 0.25 },
          { x: w * 1.00, y: h * 0.75 },
          { x: w * 0.50, y: h * 1.00 },
          { x: w * 0.00, y: h * 0.75 },
          { x: w * 0.00, y: h * 0.25 },
        ];

      case ARENA_SHAPES.PENTAGON:
        // clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)
        return [
          { x: w * 0.50, y: h * 0.00 },
          { x: w * 1.00, y: h * 0.38 },
          { x: w * 0.82, y: h * 1.00 },
          { x: w * 0.18, y: h * 1.00 },
          { x: w * 0.00, y: h * 0.38 },
        ];

      case ARENA_SHAPES.DIAMOND:
        // clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)
        return [
          { x: w * 0.50, y: h * 0.00 },
          { x: w * 1.00, y: h * 0.50 },
          { x: w * 0.50, y: h * 1.00 },
          { x: w * 0.00, y: h * 0.50 },
        ];

      case ARENA_SHAPES.HOURGLASS:
        // clip-path: polygon(0% 0%, 100% 0%, 70% 50%, 100% 100%, 0% 100%, 30% 50%)
        return [
          { x: w * 0.00, y: h * 0.00 },
          { x: w * 1.00, y: h * 0.00 },
          { x: w * 0.70, y: h * 0.50 },
          { x: w * 1.00, y: h * 1.00 },
          { x: w * 0.00, y: h * 1.00 },
          { x: w * 0.30, y: h * 0.50 },
        ];

      case ARENA_SHAPES.FUNNEL:
        // clip-path: polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)
        return [
          { x: w * 0.00, y: h * 0.00 },
          { x: w * 1.00, y: h * 0.00 },
          { x: w * 0.80, y: h * 1.00 },
          { x: w * 0.20, y: h * 1.00 },
        ];

      case ARENA_SHAPES.CROSS:
        // clip-path: polygon(40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%, 0% 40%, 40% 40%)
        return [
          { x: w * 0.40, y: h * 0.00 },
          { x: w * 0.60, y: h * 0.00 },
          { x: w * 0.60, y: h * 0.40 },
          { x: w * 1.00, y: h * 0.40 },
          { x: w * 1.00, y: h * 0.60 },
          { x: w * 0.60, y: h * 0.60 },
          { x: w * 0.60, y: h * 1.00 },
          { x: w * 0.40, y: h * 1.00 },
          { x: w * 0.40, y: h * 0.60 },
          { x: w * 0.00, y: h * 0.60 },
          { x: w * 0.00, y: h * 0.40 },
          { x: w * 0.40, y: h * 0.40 },
        ];

      case ARENA_SHAPES.SPIRAL:
        // Rounded rectangle approximation (8 vertices for smooth corners)
        const spiralRadius = Math.min(w, h) * 0.05; // 20px equivalent
        return [
          { x: spiralRadius, y: 0 },
          { x: w - spiralRadius, y: 0 },
          { x: w, y: spiralRadius },
          { x: w, y: h - spiralRadius },
          { x: w - spiralRadius, y: h },
          { x: spiralRadius, y: h },
          { x: 0, y: h - spiralRadius },
          { x: 0, y: spiralRadius },
        ];

      case ARENA_SHAPES.WAVE:
        // clip-path: polygon(0% 10%, 10% 0%, 20% 5%, 30% 0%, 40% 5%, 50% 0%, 60% 5%, 70% 0%, 80% 5%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 80% 95%, 70% 100%, 60% 95%, 50% 100%, 40% 95%, 30% 100%, 20% 95%, 10% 100%, 0% 90%)
        return [
          { x: w * 0.00, y: h * 0.10 },
          { x: w * 0.10, y: h * 0.00 },
          { x: w * 0.20, y: h * 0.05 },
          { x: w * 0.30, y: h * 0.00 },
          { x: w * 0.40, y: h * 0.05 },
          { x: w * 0.50, y: h * 0.00 },
          { x: w * 0.60, y: h * 0.05 },
          { x: w * 0.70, y: h * 0.00 },
          { x: w * 0.80, y: h * 0.05 },
          { x: w * 0.90, y: h * 0.00 },
          { x: w * 1.00, y: h * 0.10 },
          { x: w * 1.00, y: h * 0.90 },
          { x: w * 0.90, y: h * 1.00 },
          { x: w * 0.80, y: h * 0.95 },
          { x: w * 0.70, y: h * 1.00 },
          { x: w * 0.60, y: h * 0.95 },
          { x: w * 0.50, y: h * 1.00 },
          { x: w * 0.40, y: h * 0.95 },
          { x: w * 0.30, y: h * 1.00 },
          { x: w * 0.20, y: h * 0.95 },
          { x: w * 0.10, y: h * 1.00 },
          { x: w * 0.00, y: h * 0.90 },
        ];

      case ARENA_SHAPES.RECTANGLE:
      default:
        // Full rectangle boundaries
        return [
          { x: 0, y: 0 },
          { x: w, y: 0 },
          { x: w, y: h },
          { x: 0, y: h },
        ];
    }
  };

  const getArenaDimensions = () => {
    const arena = arenaRef.current;
    if (arena) {
      const rect = arena.getBoundingClientRect();
      // Circle arena uses square dimensions for perfect circle
      if (arenaShape === ARENA_SHAPES.CIRCLE) {
        const size = Math.min(rect.width, rect.height);
        return { width: size, height: size };
      }
      // All other shapes use full dimensions - clip-path handles the visual shape
      return { width: rect.width, height: rect.height };
    }
    // fallback
    const vh = window.innerHeight * 0.94;
    const vw = window.innerWidth * 0.6;
    if (arenaShape === ARENA_SHAPES.CIRCLE) {
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
      return distFromCenter + radius + 10 <= arenaRadius; // 10px safety margin
    }
    
    const vertices = getShapeBoundaryVertices(dims);
    if (vertices.length < 3) return false;
    
    const safetyMargin = 10; // Keep bubbles 10px inside boundaries
    
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

  // Constrain position to arena boundary
  const constrainToArenaBoundary = (x: number, y: number, radius: number, dims: { width: number; height: number }): { x: number; y: number; vx: number; vy: number } => {
    const cx = dims.width / 2;
    const cy = dims.height / 2;
    const safetyMargin = 10;

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

    // Find nearest boundary point and push inward if too close
    const vertices = getShapeBoundaryVertices(dims);
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
        
        // Calculate normal (perpendicular to edge, pointing inward)
        const edgeNormalX = -dy;
        const edgeNormalY = dx;
        const edgeLen = Math.sqrt(edgeNormalX * edgeNormalX + edgeNormalY * edgeNormalY);
        normalX = edgeNormalX / edgeLen;
        normalY = edgeNormalY / edgeLen;
        
        // Make sure normal points toward center
        const toCenterX = cx - nearestX;
        const toCenterY = cy - nearestY;
        if (normalX * toCenterX + normalY * toCenterY < 0) {
          normalX = -normalX;
          normalY = -normalY;
        }
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
          const maxSpawnRadius = arenaRadius - radius - 15; // 15px safety margin for spawning
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
    const inset = spikeSize * 0.4;
    spikes.forEach(s => {
      s.x += s.nx * inset;
      s.y += s.ny * inset;
    });

    return spikes;
  };

  // Get CSS styles for arena shape
  const getArenaShapeStyle = (): React.CSSProperties => {
    switch (arenaShape) {
      case ARENA_SHAPES.CIRCLE:
        return { borderRadius: "50%" };
      
      case ARENA_SHAPES.HEXAGON:
        return { clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" };
      
      case ARENA_SHAPES.PENTAGON:
        return { clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)" };
      
      case ARENA_SHAPES.DIAMOND:
        return { clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" };
      
      case ARENA_SHAPES.HOURGLASS:
        return { clipPath: "polygon(0% 0%, 100% 0%, 70% 50%, 100% 100%, 0% 100%, 30% 50%)" };
      
      case ARENA_SHAPES.CROSS:
        return { clipPath: "polygon(40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%, 0% 40%, 40% 40%)" };
      
      case ARENA_SHAPES.SPIRAL:
        return { borderRadius: "20px" };
      
      case ARENA_SHAPES.FUNNEL:
        return { clipPath: "polygon(0% 0%, 100% 0%, 80% 100%, 20% 100%)" };
      
      case ARENA_SHAPES.WAVE:
        return { clipPath: "polygon(0% 10%, 10% 0%, 20% 5%, 30% 0%, 40% 5%, 50% 0%, 60% 5%, 70% 0%, 80% 5%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 80% 95%, 70% 100%, 60% 95%, 50% 100%, 40% 95%, 30% 100%, 20% 95%, 10% 100%, 0% 90%)" };
      
      case ARENA_SHAPES.RECTANGLE:
      default:
        return { borderRadius: "0" };
    }
  };

  const ensureCapacity = (needed: number) => {
    let cap = MAX_CAPACITY.current;
    if (needed <= cap) return;
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

    idListRef.current = idNew;
    xRef.current = xNew;
    yRef.current = yNew;
    vxRef.current = vxNew;
    vyRef.current = vyNew;
    rRef.current = rNew;
    rTargetRef.current = rTargetNew;
    healthRef.current = healthNew;
    imgIndexRef.current = imgIdxNew;
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
          });
        }
        setUiBubblesSnapshot(snap);
        setActiveCount(snap.length);
        startRevealPipelineIfNeeded();
      };

      if (arenaType === ARENA_TYPES.NORMAL) {
        try {
          const res = await fetch("http://localhost:5000/api/images");
          const images: string[] = await res.json();
          imageListRef.current = images;
          const targetRadius = getRadiusForCount(images.length);
          const newBubbles: BubbleData[] = [];
          for (const img of images) {
            const pos = getRandomPositionInShape(targetRadius, arena);
            newBubbles.push({
              x: pos.x,
              y: pos.y,
              radius: targetRadius,
              health: 100,
              imgSrc: `http://localhost:5000/api/images/${encodeURIComponent(img)}`,
              vx: Math.cos(Math.random() * Math.PI * 2) * speed * 0.6,
              vy: Math.sin(Math.random() * Math.PI * 2) * speed * 0.6,
              id: nextBubbleId++,
            });
          }
          await addBubblesToArrays(newBubbles, false);
        } catch (e) {
          console.error("Error fetching normal images", e);
        }
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
          let src = "";
          if (imgs.length > 0) src = `http://localhost:5000/api/superbubbleimg/${encodeURIComponent(imgs[0])}`;
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
            const superbubbleName = imgs[0].replace(/\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i, '');
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
  }, [arenaType, arenaReady, bossSuperbubbleHealth]);

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
    // Sync blade damage refs
    normalBladeDamageRef.current = normalBladeDamage;
    bossNormalBladeDamageRef.current = bossNormalBladeDamage;
    bossSuperbubbleBladeDamageRef.current = bossSuperbubbleBladeDamage;
    brawlBladeDamageRef.current = brawlBladeDamage;
    // Sync blade assignments ref
    bladeAssignmentsRef.current = new Set(bladeAssignments);
  }, [playerBubblesProjectileCount, playerBubblesPowerMode, playerBubblesProjectileSpeed, brawlBubblesProjectileCount, brawlBubblesPowerMode, brawlBubblesProjectileSpeed, normalBladeDamage, bossNormalBladeDamage, bossSuperbubbleBladeDamage, brawlBladeDamage, bladeAssignments]);

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
      ctx.fillStyle = arenaInsideColor || "#1a1a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Reapply DPR transform
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      const dt = now - last;
      last = now;

      // Calculate health bar width based on bubble count
      const bubbleCount = countRef.current;
      let healthBarWidth = 4;
      if (bubbleCount > 5000) {
        healthBarWidth = 1;
      } else if (bubbleCount >= 1000 && bubbleCount <= 5000) {
        healthBarWidth = 1.5;
      } else if (bubbleCount >= 500 && bubbleCount < 1000) {
        healthBarWidth = 2;
      } else if (bubbleCount >= 100 && bubbleCount < 500) {
        healthBarWidth = 2.5;
      } else if (bubbleCount >= 50 && bubbleCount < 100) {
        healthBarWidth = 3;
      } else if (bubbleCount >= 10 && bubbleCount < 50) {
        healthBarWidth = 3.5;
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
      const hArrRender = healthRef.current!;
      const imgIdxArrRender = imgIndexRef.current!;

      for (let i = 0; i < nRender; i++) {
        const radius = rArrRender[i];
        const x = xArrRender[i];
        const y = yArrRender[i];
        const hp = hArrRender[i];
        const imgIdx = imgIdxArrRender[i];
        let strokeColor = "#ff4d4d";
        if (hp > 60) strokeColor = "#2ecc71";
        else if (hp > 30) strokeColor = "#f1c40f";

        let drawnImage = false;
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
            ctx.arc(x, y, radius + 2, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (hp / 100)));
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
        ctx.globalAlpha = 0.95;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, radius) + 2, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (hp / 100)));
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = healthBarWidth * 0.5;
        ctx.stroke();
      }
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
      if (!isRunning) {
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
      ctx.fillStyle = arenaInsideColor || "#1a1a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
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
        for (let i = 0; i < n; i++) {
          let nx = xArr[i] + vxArr[i] * MAX_MOVE_STEP;
          let ny = yArr[i] + vyArr[i] * MAX_MOVE_STEP;
          let nvx = vxArr[i];
          let nvy = vyArr[i];

          // Use shape-aware boundary checking
          const constrained = constrainToArenaBoundary(nx, ny, rArr[i], dims);
          
          if (constrained.vx !== 0 || constrained.vy !== 0) {
            // Bounce occurred - apply constraint and reverse velocity
            nx = constrained.x;
            ny = constrained.y;
            // Reflect velocity based on bounce normal, preserve full speed (no energy loss)
            nvx = constrained.vx * Math.abs(nvx);
            nvy = constrained.vy * Math.abs(nvy);
            
            // Apply configured bounce deviation (user-adjustable randomness)
            const randomAngle = (Math.random() - 0.5) * bounceDeviation; 
            const currentSpeed = Math.sqrt(nvx * nvx + nvy * nvy);
            const currentAngle = Math.atan2(nvy, nvx);
            const newAngle = currentAngle + randomAngle;
            nvx = Math.cos(newAngle) * currentSpeed;
            nvy = Math.sin(newAngle) * currentSpeed;
            // Speed is preserved after bounce - no forced slowdown
          }
          // Otherwise use unconstrained position (only constrain when bouncing)

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
                const nxPush = (dx / d) * 2;
                const nyPush = (dy / d) * 2;
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
                  hArr[i] = Math.max(hArr[i] - bossNormalBladeDamageRef.current, 0);
                  (damageCooldownRef.current as any)[cooldownKey] = nowMs;
                }
              }
            }
          }
        }

        // Player Powers Feature (Boss Arena only)
        // Only apply player powers if: enabled AND (no timer OR timer has expired)
        const playerPowersActive = playerPowersEnabledRef.current && (playerPowersAutoEnableTime === 0 || playerPowersAutoEnabledRef.current);
        if (arenaType === ARENA_TYPES.BOSS && playerPowersActive) {
          // Spawn power pickups in pickup mode
          if (playerPowerMode === "pickup") {
            const PICKUP_SPAWN_INTERVAL = 7000; // Spawn every 7 seconds
            if (nowMs - lastPickupSpawnRef.current > PICKUP_SPAWN_INTERVAL) {
              lastPickupSpawnRef.current = nowMs;
              
              // Get list of enabled powers
              const enabledPowers = (Object.keys(SUPER_BUBBLE_TYPES) as (keyof typeof SUPER_BUBBLE_TYPES)[]).filter(
                (k) => selectedPlayerPowers[k]
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
              // Shoot projectile every 3 seconds
              if (nowMs - power.lastShot >= 3000) {
                power.lastShot = nowMs;
                
                // Find superbubble to aim at
                const sb = superBubbleRef.current;
                if (sb) {
                  const dx = sb.x - xArr[bubbleIdx];
                  const dy = sb.y - yArr[bubbleIdx];
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
                
                // Shoot projectile every 3 seconds (plus stagger delay)
                if (nowMs - power.lastShot >= 3000 + shootDelay) {
                  power.lastShot = nowMs;
                  
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
            let sbNewX = sb.x + sb.vx * MAX_MOVE_STEP;
            let sbNewY = sb.y + sb.vy * MAX_MOVE_STEP;
            
            // Use shape-aware boundary checking for superbubble
            const constrained = constrainToArenaBoundary(sbNewX, sbNewY, sb.radius, dims);
            
            if (constrained.vx !== 0 || constrained.vy !== 0) {
              // Bounce occurred - apply constraint and reverse velocity
              sb.x = constrained.x;
              sb.y = constrained.y;
              sb.vx = constrained.vx * Math.abs(sb.vx);
              sb.vy = constrained.vy * Math.abs(sb.vy);
              
              // Add small random perturbation to prevent straight-line bouncing
              const randomAngle = (Math.random() - 0.5) * 0.15; // ±4.3 degrees
              const currentAngle = Math.atan2(sb.vy, sb.vx);
              const newAngle = currentAngle + randomAngle;
              // Enforce consistent superbubble speed
              const targetSpeedS = speed * 0.8;
              sb.vx = Math.cos(newAngle) * targetSpeedS;
              sb.vy = Math.sin(newAngle) * targetSpeedS;
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
                    hArr[i] = Math.max(0, hArr[i] - bossCollisionDamage);
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
              superBubbleRef.current.health = Math.max(0, superBubbleRef.current.health - (bossCollisionDamage * hits));
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

        let drawnImage = false;
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
            ctx.arc(x, y, radius + 2, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (hp / 100)));
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
        ctx.arc(x, y, Math.max(1, radius) + 2, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (hp / 100)));
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
        if (sb.radius >= IMAGE_SHOW_RADIUS && sb.imgSrc) {
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
    if (!isRunning || (arenaType !== ARENA_TYPES.BOSS && arenaType !== ARENA_TYPES.BRAWL)) return;
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
              // Use brawl arena power damage for this power type
              const damage = brawlPowerDamages[p.type] || 5;
              hArr[i] = Math.max(0, hArr[i] - damage);
              
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
        else if (p.fromBubbleId !== undefined && playerPowersEnabled) {
          const sb = superBubbleRef.current;
          if (sb) {
            const dx = sb.x - nx;
            const dy = sb.y - ny;
            if (dx * dx + dy * dy < sb.radius * sb.radius) {
              // Use boss arena normal bubble power damage for this power type
              const damage = bossNormalPowerDamages[p.type] || 5;
              sb.health = Math.max(0, sb.health - damage);
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
        // Projectile from superbubble (damages normal bubbles)
        else if (p.fromSuperbubble === true || p.fromBubbleId === undefined) {
          for (let i = 0; i < n; i++) {
            const dx = xArr[i] - nx;
            const dy = yArr[i] - ny;
            if (dx * dx + dy * dy < rArr[i] * rArr[i]) {
              // Use boss arena superbubble power damage for this power type
              const damage = bossSuperPowerDamages[p.type] || 5;
              hArr[i] = Math.max(0, hArr[i] - damage);
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
    for (let i = 0; i < cap; i++) {
      imgIndexRef.current[i] = -1;
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

  const pickRandomSelectedPower = (): keyof typeof SUPER_BUBBLE_TYPES => {
    const keys = Object.keys(SUPER_BUBBLE_TYPES) as (keyof typeof SUPER_BUBBLE_TYPES)[];
    const available = keys.filter((k) => selectedPowers[k]);
    if (available.length === 0) return "flame";
    return available[Math.floor(Math.random() * available.length)];
  };

  const pickRandomPlayerPower = (): keyof typeof SUPER_BUBBLE_TYPES => {
    const keys = Object.keys(SUPER_BUBBLE_TYPES) as (keyof typeof SUPER_BUBBLE_TYPES)[];
    const available = keys.filter((k) => selectedPlayerPowers[k]);
    if (available.length === 0) return "flame";
    return available[Math.floor(Math.random() * available.length)];
  };

  const pickRandomBrawlPower = (): keyof typeof SUPER_BUBBLE_TYPES => {
    const keys = Object.keys(SUPER_BUBBLE_TYPES) as (keyof typeof SUPER_BUBBLE_TYPES)[];
    const available = keys.filter((k) => selectedBrawlPowers[k]);
    if (available.length === 0) return "flame";
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
            <filter id={`plasmag low${p.id}`}><feGaussianBlur stdDeviation="2" /></filter>
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
      const expansion = ((Date.now() * 0.003) % 100);
      return (
        <svg key={`proj-${p.id}`} width={48} height={48} style={baseStyle} viewBox="0 0 48 48" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id={`sonicglow${p.id}`}><feGaussianBlur stdDeviation="1" /></filter>
          </defs>
          {/* Central shock point */}
          <circle cx="24" cy="24" r="4" fill="#00ffff" opacity="0.95" filter={`url(#sonicglow${p.id})`} />
          {/* Sonic wave rings - expanding */}
          <circle cx="24" cy="24" r={8 + expansion/2} fill="none" stroke="#00ffff" strokeWidth="1.2" opacity={0.8 - expansion/120} />
          <circle cx="24" cy="24" r={14 + expansion} fill="none" stroke="#00ccff" strokeWidth="0.9" opacity={0.5 - expansion/160} />
          <circle cx="24" cy="24" r={20 + expansion*1.5} fill="none" stroke="#0099ff" strokeWidth="0.7" opacity={0.3 - expansion/200} />
          {/* Velocity vectors */}
          <line x1="24" y1="2" x2="24" y2="10" stroke="#00ffff" strokeWidth="0.8" opacity="0.7" />
          <line x1="24" y1="38" x2="24" y2="46" stroke="#00ffff" strokeWidth="0.8" opacity="0.7" />
        </svg>
      );
    } else if (p.type === "shockwave") {
      return (
        <svg key={`proj-${p.id}`} width={56} height={16} style={{...baseStyle, transform: `translate(-50%,-50%) rotate(${angleDeg}deg)`}} viewBox="0 0 56 16" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`shockgrad${p.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#66ccff" />
              <stop offset="50%" stopColor="#0099ff" />
              <stop offset="100%" stopColor="#0066cc" />
            </linearGradient>
            <filter id={`shockglow${p.id}`}><feGaussianBlur stdDeviation="1" /></filter>
          </defs>
          {/* Main shockwave propagation */}
          <rect x="0" y="2" width="56" height="12" fill={`url(#shockgrad${p.id})`} opacity="0.7" filter={`url(#shockglow${p.id})`} />
          {/* Wave crest highlights */}
          <line x1="8" y1="1" x2="8" y2="3" stroke="#00ffff" strokeWidth="1" opacity="0.8" />
          <line x1="16" y1="0" x2="16" y2="4" stroke="#00ffff" strokeWidth="1.2" opacity="0.9" />
          <line x1="24" y1="1" x2="24" y2="3" stroke="#00ffff" strokeWidth="1" opacity="0.8" />
          <line x1="32" y1="0" x2="32" y2="4" stroke="#00ffff" strokeWidth="1.2" opacity="0.9" />
          <line x1="40" y1="1" x2="40" y2="3" stroke="#00ffff" strokeWidth="1" opacity="0.8" />
          <line x1="48" y1="0" x2="48" y2="4" stroke="#00ffff" strokeWidth="1.2" opacity="0.9" />
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

  const MAX_LEADER_ENTRIES = 8; // reduced to avoid scrollbar and overflow

  const renderLeaderboardNormal = () => {
    const top = [...uiBubblesSnapshot].sort((a, b) => b.health - a.health).slice(0, MAX_LEADER_ENTRIES);
    const aliveCount = uiBubblesSnapshot.length;
    return (
      <div style={{ width: "100%", padding: 8, boxSizing: "border-box", position: 'relative' }} ref={leaderboardRef}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: "2px solid rgba(255,215,0,0.5)" }}>
          <div style={{ fontSize: 20 }}>🏆</div>
          <h3 style={{ margin: 0, color: "#ffd700", fontSize: 16, fontWeight: 700 }}>Leaderboard</h3>
          <div style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#999" }}>{aliveCount} Alive players</div>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {top.map((entry, idx) => {
            const fullName = (entry.imgSrc.split("/").pop() ?? `#${entry.id}`).replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico)$/i, "");
            const healthColor = entry.health > 60 ? "#00ff00" : entry.health > 30 ? "#ffff00" : "#ff0000";
            return (
              <div 
                key={`entry-${entry.id}`} 
                style={{ 
                  display: "flex", 
                  gap: 15, 
                  alignItems: "center", 
                  padding: "10px", 
                  background: "rgba(255,255,255,0.05)",
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
                  width: 28,
                  height: 28,
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
                <img 
                  src={entry.imgSrc} 
                  alt={fullName} 
                  style={{ 
                    width: 36, 
                    height: 36, 
                    borderRadius: "50%", 
                    objectFit: "cover", 
                    flexShrink: 0,
                    border: `2px solid ${healthColor}`,
                    boxShadow: `0 0 8px ${healthColor}66`
                  }} 
                />
                
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
          <img src={watermarkUrl} alt="watermark" style={{ width: 48, height: 48, borderRadius: "50%", opacity: 0.6, pointerEvents: 'none', userSelect: 'none' }} />
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
          background: "rgba(76,175,80,0.1)", 
          borderRadius: 10,
          border: "1px solid rgba(76,175,80,0.3)",
          marginBottom: 12
        }}>
          <span style={{ fontSize: 18 }}>🟢</span>
          <div style={{ color: "#4caf50", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Team Heroes</div>
          <div style={{ marginLeft: "auto", fontSize: 11, color: "#999" }}>{normals.length} active</div>
        </div>
        
        {/* Normal Bubbles - Vertical Stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {normals.map((n, idx) => {
            const name = (n.imgSrc.split("/").pop() || "").replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico)$/i, "");
            const healthColor = n.health > 60 ? "#00ff00" : n.health > 30 ? "#ffff00" : "#ff0000";
            return (
              <div 
                key={`bubble-${n.id}`} 
                style={{ 
                  display: "flex", 
                  gap: 10, 
                  alignItems: "center",
                  padding: "10px",
                  background: "rgba(76,175,80,0.1)",
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
                  background: "rgba(76,175,80,0.2)",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#4caf50",
                  flexShrink: 0
                }}>
                  {idx + 1}
                </div>
                <img 
                  src={n.imgSrc} 
                  alt={name} 
                  style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: "50%", 
                    objectFit: "cover", 
                    flexShrink: 0,
                    border: `2px solid ${healthColor}`
                  }} 
                />
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
          background: "rgba(244,67,54,0.15)", 
          borderRadius: 10,
          border: "2px solid rgba(244,67,54,0.5)",
          boxShadow: "0 0 20px rgba(244,67,54,0.3)"
        }}>
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
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>Final Boss</div>
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
          <img src={watermarkUrl} alt="watermark" style={{ width: 48, height: 48, borderRadius: "50%", opacity: 0.6, pointerEvents: 'none', userSelect: 'none' }} />
        </div>
      </div>
    );
  };

  const renderBrawlVersusCard = () => {
    // For 1v1: display vertically - opponent 1 on top, opponent 2 on bottom
    if (brawlMode === "1v1" && uiBubblesSnapshot.length >= 2) {
      const left = uiBubblesSnapshot[0];
      const right = uiBubblesSnapshot[1];
      const leftName = decodeURIComponent((left.imgSrc.split("/").pop() ?? `#${left.id}`).replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico)$/i, "")).replace(/%20/g, " ");
      const rightName = decodeURIComponent((right.imgSrc.split("/").pop() ?? `#${right.id}`).replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico)$/i, "")).replace(/%20/g, " ");
      
      return (
        <div style={{ width: "100%", padding: 8 }}>
          {/* Player 1 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 8px", borderRadius: 8, background: "rgba(100,100,255,0.08)" }}>
            <img src={left.imgSrc} alt={leftName} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(100,150,255,0.5)" }} />
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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 8px", borderRadius: 8, background: "rgba(255,100,100,0.08)" }}>
            <img src={right.imgSrc} alt={rightName} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,100,100,0.5)" }} />
            <div style={{ textAlign: "center", width: "100%", minWidth: 0 }}>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, wordBreak: "break-word", maxWidth: "100%" }} title={rightName}>{rightName}</div>
              <div style={{ color: right.health > 60 ? "lime" : right.health > 30 ? "yellow" : "red", fontSize: 12, fontWeight: 600, marginTop: 6 }}>❤️ {Math.round(right.health)}</div>
            </div>
          </div>
          
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src={watermarkUrl} alt="watermark" style={{ width: 40, height: 40, borderRadius: "50%", opacity: 0.28, pointerEvents: 'none', userSelect: 'none' }} />
          </div>
        </div>
      );
    }
    
    // For 1vMany: show solo bubble on top, many opponents in vertical list below
    if (brawlMode === "1vMany" && uiBubblesSnapshot.length >= 2) {
      const solo = uiBubblesSnapshot[0];
      const many = uiBubblesSnapshot.slice(1, 10); // Up to 9 opponents
      const soloName = decodeURIComponent((solo.imgSrc.split("/").pop() ?? `#${solo.id}`).replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico)$/i, "")).replace(/%20/g, " ");
      
      return (
        <div style={{ width: "100%", padding: 6, maxHeight: "95vh", overflow: "auto" }}>
          {/* Solo Player Hero */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px", borderRadius: 10, background: "rgba(76,175,80,0.15)", marginBottom: 10 }}>
            <div style={{ fontSize: 18 }}>👑</div>
            <img src={solo.imgSrc} alt={soloName} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "3px solid #4caf50", boxShadow: "0 0 12px rgba(76,175,80,0.6)" }} />
            <div style={{ textAlign: "center", width: "100%" }}>
              <div style={{ color: "#4caf50", fontSize: 11, fontWeight: 600, marginBottom: 2 }}>SOLO HERO</div>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 700, wordBreak: "break-word" }} title={soloName}>{soloName}</div>
              <div style={{ color: solo.health > 60 ? "lime" : solo.health > 30 ? "yellow" : "red", fontSize: 12, fontWeight: 700, marginTop: 4 }}>❤️ {Math.round(solo.health)} HP</div>
            </div>
          </div>
          
          {/* VS Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0", justifyContent: "center" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,152,0,0.3)" }}></div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#ff9800", whiteSpace: "nowrap" }}>VS MANY</div>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,152,0,0.3)" }}></div>
          </div>
          
          {/* Many Opponents - Vertical Stack */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 6 }}>
            {many.map((opponent, idx) => {
              const opponentName = decodeURIComponent((opponent.imgSrc.split("/").pop() ?? `#${opponent.id}`).replace(/\.(png|jpg|jpeg|webp|gif|svg|bmp|ico)$/i, "")).replace(/%20/g, " ");
              return (
                <div key={`opponent-${opponent.id}`} style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px", background: "rgba(244,67,54,0.1)", border: "1px solid rgba(244,67,54,0.2)", borderRadius: 8, transition: "all 0.2s" }}>
                  <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "rgba(244,67,54,0.3)", borderRadius: "50%", fontSize: 12, fontWeight: 700, color: "#ff6b6b" }}>{idx + 1}</div>
                  <img src={opponent.imgSrc} alt={opponentName} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#ddd", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={opponentName}>{opponentName}</div>
                    <div style={{ color: opponent.health > 60 ? "lime" : opponent.health > 30 ? "yellow" : "red", fontSize: 11, fontWeight: 600, marginTop: 2 }}>❤️ {Math.round(opponent.health)} HP</div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src={watermarkUrl} alt="watermark" style={{ width: 40, height: 40, borderRadius: "50%", opacity: 0.28, pointerEvents: 'none', userSelect: 'none' }} />
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
    const isDraw = bubbleCount === 0 || winnerBubble?.imgSrc === "draw";
    console.log('isDraw:', isDraw, 'bubbleCount:', bubbleCount, 'winnerBubble?.imgSrc:', winnerBubble?.imgSrc);
    if (isDraw) {
      return (
        <div className="winner-modal" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, pointerEvents: "auto" }}>
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
        <div className="winner-modal" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, pointerEvents: "auto" }}>
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
        <div className="winner-modal" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, pointerEvents: "auto" }}>
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
      <div className="winner-modal" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, pointerEvents: "auto" }}>
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
    setShowArenaIntroAnimation(true);
    
    setTimeout(() => {
      setShowArenaIntroAnimation(false);
      
      // Show animations for enabled features with timer=0
      const needsSpikeAnimation = spikeEnabled && spikeAutoEnableTime === 0;
      const needsPowerAnimation = (
        (arenaType === ARENA_TYPES.BOSS && playerPowersEnabled && playerPowersAutoEnableTime === 0) ||
        (arenaType === ARENA_TYPES.BRAWL && brawlPowersEnabled && brawlPowersAutoEnableTime === 0)
      );
      
      if (needsSpikeAnimation || needsPowerAnimation) {
        // Pause game for animations
        animationPauseRef.current = true;
        
        // Show spike animation first
        if (needsSpikeAnimation) {
          setShowSpikeAnimation(true);
          setTimeout(() => {
            setShowSpikeAnimation(false);
            spikeAutoEnabledRef.current = true;
            
            // Show power animation after spike animation
            if (needsPowerAnimation) {
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

  // UI helpers for toggles (replace checkboxes)
  const ToggleButton: React.FC<{ on: boolean; onToggle: () => void; label: string }> = ({ on, onToggle, label }) => (
    <button onClick={onToggle} style={{ padding: "6px 10px", borderRadius: 8, background: on ? "#6b44ff" : "#333", color: "#fff", border: "none", cursor: "pointer" }}>
      {label}: {on ? "ON" : "OFF"}
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
  if (arenaTypeSelected && !isRunning && countRef.current === 0 && !winner && !winnersList && !winnersImages && (arenaType !== ARENA_TYPES.BRAWL || brawlModeSelected)) {
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
    <div className="arena-page" style={{ display: "flex", height: "100vh", width: "100vw", background: pageBackgroundColor, overflow: "hidden", position: "relative" }}>
      
      {/* Spike Animation Overlay - Centered in arena+leaderboard area */}
      {showSpikeAnimation && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "calc(100vw - 400px)", // Exclude right sidebar
          height: "100vh",
          background: "rgba(0,0,0,0.9)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "fadeIn 0.3s ease-out",
          overflow: "hidden",
          pointerEvents: "none"
        }}>
          <div style={{
            position: "relative",
            width: "500px",
            height: "300px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            perspective: "1000px"
          }}>
            {/* 3D Spikes rising from ground */}
            {[...Array(7)].map((_, i) => (
              <div key={`spike-visual-${i}`} style={{
                position: "absolute",
                bottom: "-80px",
                left: `${30 + i * 65}px`,
                width: "0",
                height: "0",
                borderLeft: "20px solid transparent",
                borderRight: "20px solid transparent",
                borderBottom: "100px solid #ff6600",
                filter: "drop-shadow(0 0 20px #ff4500)",
                animation: `spikeRise ${0.5 + i * 0.1}s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
                transformOrigin: "bottom center",
                opacity: 0
              }} />
            ))}
            
            {/* Glowing ground crack effect */}
            <div style={{
              position: "absolute",
              bottom: "0",
              width: "100%",
              height: "4px",
              background: "linear-gradient(90deg, transparent, #ff6600, #ff4500, #ff6600, transparent)",
              boxShadow: "0 0 20px #ff6600, 0 0 40px #ff4500",
              animation: "crackGlow 1s ease-in-out infinite"
            }} />
            
            {/* Main text */}
            <div style={{
              fontSize: "48px",
              fontWeight: "900",
              background: "linear-gradient(135deg, #ff4500, #ff8c00, #ffa500)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "0 0 40px rgba(255,69,0,0.8)",
              animation: "textPulse3D 1s ease-in-out infinite",
              transform: "rotateX(10deg)",
              letterSpacing: "4px",
              textTransform: "uppercase",
              zIndex: 10,
              position: "relative",
              marginBottom: "30px",
              textAlign: "center",
              whiteSpace: "nowrap"
            }}>
              ⚠️ SPIKES ENABLED
            </div>
            
            {/* Particle effects */}
            {[...Array(30)].map((_, i) => (
              <div key={i} style={{
                position: "absolute",
                width: "4px",
                height: "4px",
                background: "#ff6600",
                borderRadius: "50%",
                top: "50%",
                left: "50%",
                animation: `particle${i % 4} 2s ease-out infinite`,
                animationDelay: `${i * 0.05}s`,
                opacity: 0,
                boxShadow: "0 0 10px #ff6600"
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Blade Animation Overlay - Rotating saw blade enabled animation */}
      {showBladeAnimation && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "calc(100vw - 400px)",
          height: "100vh",
          background: "rgba(0,0,0,0.9)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "fadeIn 0.3s ease-out",
          overflow: "hidden",
          pointerEvents: "none"
        }}>
          <div style={{
            position: "relative",
            width: "500px",
            height: "400px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            perspective: "1000px"
          }}>
            {/* Rotating saw blades */}
            {[...Array(3)].map((_, i) => (
              <div key={`blade-anim-${i}`} style={{
                position: "absolute",
                width: `${100 + i * 40}px`,
                height: `${100 + i * 40}px`,
                animation: `bladeRotate ${1.5 - i * 0.3}s linear infinite`,
                opacity: 0.8 - i * 0.2,
                filter: `drop-shadow(0 0 ${15 + i * 5}px #ff4444)`
              }}>
                <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
                  <defs>
                    <linearGradient id={`bladeGrad${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#888" />
                      <stop offset="50%" stopColor="#ddd" />
                      <stop offset="100%" stopColor="#666" />
                    </linearGradient>
                  </defs>
                  {/* Main ring */}
                  <circle cx="50" cy="50" r="35" fill="none" stroke={`url(#bladeGrad${i})`} strokeWidth="8" />
                  {/* Teeth */}
                  {[...Array(12)].map((_, t) => {
                    const angle = (t * 30) * Math.PI / 180;
                    const innerR = 39;
                    const outerR = 48;
                    const x1 = 50 + Math.cos(angle - 0.15) * innerR;
                    const y1 = 50 + Math.sin(angle - 0.15) * innerR;
                    const x2 = 50 + Math.cos(angle) * outerR;
                    const y2 = 50 + Math.sin(angle) * outerR;
                    const x3 = 50 + Math.cos(angle + 0.15) * innerR;
                    const y3 = 50 + Math.sin(angle + 0.15) * innerR;
                    return (
                      <polygon
                        key={t}
                        points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
                        fill={`url(#bladeGrad${i})`}
                      />
                    );
                  })}
                  {/* Center hole */}
                  <circle cx="50" cy="50" r="15" fill="#222" stroke="#444" strokeWidth="2" />
                </svg>
              </div>
            ))}
            
            {/* Sparks flying outward */}
            {[...Array(20)].map((_, i) => (
              <div key={`spark-${i}`} style={{
                position: "absolute",
                width: "6px",
                height: "6px",
                background: i % 2 === 0 ? "#ffaa00" : "#ff4444",
                borderRadius: "50%",
                top: "50%",
                left: "50%",
                animation: `bladeSpark 1s ease-out infinite`,
                animationDelay: `${i * 0.05}s`,
                opacity: 0,
                boxShadow: `0 0 8px ${i % 2 === 0 ? "#ffaa00" : "#ff4444"}`,
                transform: `rotate(${i * 18}deg)`
              }} />
            ))}
            
            {/* Main text */}
            <div style={{
              fontSize: "48px",
              fontWeight: "900",
              background: "linear-gradient(135deg, #ff4444, #cc2222, #ff6666)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "0 0 40px rgba(255,68,68,0.8)",
              animation: "textPulse3D 1s ease-in-out infinite",
              transform: "rotateX(10deg)",
              letterSpacing: "4px",
              textTransform: "uppercase",
              zIndex: 10,
              position: "relative",
              marginBottom: "30px",
              textAlign: "center",
              whiteSpace: "nowrap"
            }}>
              ⚔️ BLADES ENABLED
            </div>
            
            {/* Bottom metallic line */}
            <div style={{
              position: "absolute",
              bottom: "60px",
              width: "80%",
              height: "4px",
              background: "linear-gradient(90deg, transparent, #888, #ddd, #888, transparent)",
              boxShadow: "0 0 15px rgba(255,255,255,0.5)",
              animation: "crackGlow 1s ease-in-out infinite"
            }} />
          </div>
        </div>
      )}

      {/* Arena Intro Animation - Shows arena type at game start */}
      {showArenaIntroAnimation && arenaType === ARENA_TYPES.NORMAL && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "calc(100vw - 400px)",
          height: "100vh",
          background: "linear-gradient(135deg, rgba(0,0,0,0.95), rgba(30,30,60,0.95))",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "fadeIn 0.3s ease-out",
          overflow: "hidden",
          pointerEvents: "none"
        }}>
          <div style={{
            position: "relative",
            width: "600px",
            height: "400px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {/* Bubbles colliding */}
            {[...Array(8)].map((_, i) => (
              <div key={`bubble-${i}`} style={{
                position: "absolute",
                width: `${60 + i * 10}px`,
                height: `${60 + i * 10}px`,
                borderRadius: "50%",
                background: `radial-gradient(circle at 30% 30%, ${['#4fc3f7', '#9c27b0', '#ff5722', '#4caf50', '#ffc107', '#e91e63', '#00bcd4', '#ff9800'][i]}, ${['#0288d1', '#6a1b9a', '#d32f2f', '#388e3c', '#f57c00', '#c2185b', '#0097a7', '#f57c00'][i]})`,
                boxShadow: `0 0 30px ${['#4fc3f7', '#9c27b0', '#ff5722', '#4caf50', '#ffc107', '#e91e63', '#00bcd4', '#ff9800'][i]}`,
                animation: `bubbleCollide${i % 4} 2s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
                opacity: 0.9
              }} />
            ))}
            
            {/* Crossed swords decoration */}
            <div style={{
              position: "absolute",
              top: "60px",
              left: "50px",
              fontSize: "80px",
              animation: "swordSlash 2s ease-in-out infinite",
              opacity: 0.6,
              filter: "drop-shadow(0 0 10px #4fc3f7)"
            }}>⚔️</div>
            <div style={{
              position: "absolute",
              top: "60px",
              right: "50px",
              fontSize: "80px",
              animation: "swordSlash 2s ease-in-out infinite",
              animationDelay: "1s",
              opacity: 0.6,
              filter: "drop-shadow(0 0 10px #ff5722)",
              transform: "scaleX(-1)"
            }}>⚔️</div>
            
            {/* Shield decorations */}
            <div style={{
              position: "absolute",
              bottom: "60px",
              left: "80px",
              fontSize: "60px",
              animation: "shieldBounce 1.5s ease-in-out infinite",
              opacity: 0.5,
              filter: "drop-shadow(0 0 10px #9c27b0)"
            }}>🛡️</div>
            <div style={{
              position: "absolute",
              bottom: "60px",
              right: "80px",
              fontSize: "60px",
              animation: "shieldBounce 1.5s ease-in-out infinite",
              animationDelay: "0.5s",
              opacity: 0.5,
              filter: "drop-shadow(0 0 10px #4caf50)"
            }}>🛡️</div>
            
            {/* Main title */}
            <div style={{
              fontSize: "56px",
              fontWeight: "900",
              background: "linear-gradient(135deg, #4fc3f7, #9c27b0, #ff5722)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 20px rgba(255,255,255,0.5))",
              animation: "titleBounce 1s ease-out",
              letterSpacing: "6px",
              textTransform: "uppercase",
              zIndex: 10,
              position: "relative",
              textAlign: "center"
            }}>
              🎯 PLAYERS ARENA
            </div>
            
            {/* Subtitle */}
            <div style={{
              fontSize: "20px",
              color: "#aaa",
              marginTop: "20px",
              animation: "fadeIn 0.5s ease-out 0.5s forwards",
              opacity: 0,
              textAlign: "center"
            }}>
              Last Brawler Standing Wins!
            </div>
          </div>
        </div>
      )}

      {showArenaIntroAnimation && arenaType === ARENA_TYPES.BOSS && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "calc(100vw - 400px)",
          height: "100vh",
          background: "linear-gradient(135deg, rgba(0,0,0,0.95), rgba(60,0,0,0.95))",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "fadeIn 0.3s ease-out",
          overflow: "hidden",
          pointerEvents: "none"
        }}>
          <div style={{
            position: "relative",
            width: "700px",
            height: "400px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {/* Giant skull behind boss */}
            <div style={{
              position: "absolute",
              fontSize: "280px",
              animation: "skullAppear 1.5s ease-out forwards",
              opacity: 0,
              filter: "drop-shadow(0 0 40px #ff1744)",
              zIndex: 10005
            }}>💀</div>
            
            {/* Danger symbols floating */}
            {[...Array(6)].map((_, i) => (
              <div key={`danger-${i}`} style={{
                position: "absolute",
                fontSize: "40px",
                animation: `dangerFloat${i % 3} 2s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
                opacity: 0.6,
                filter: "drop-shadow(0 0 10px #ff1744)",
                left: `${50 + (i % 3) * 150}px`,
                top: `${30 + Math.floor(i / 3) * 250}px`
              }}>⚠️</div>
            ))}
            
            {/* Giant boss bubble */}
            <div style={{
              position: "absolute",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: "radial-gradient(circle at 30% 30%, #ff1744, #c62828)",
              boxShadow: "0 0 60px #ff1744, inset 0 0 40px rgba(0,0,0,0.3)",
              animation: "bossGrow 1.5s ease-out forwards",
              transform: "scale(0)",
              zIndex: 5
            }} />
            
            {/* Small bubbles around boss */}
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30) * Math.PI / 180;
              return (
                <div key={`minion-${i}`} style={{
                  position: "absolute",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: `radial-gradient(circle at 30% 30%, #64b5f6, #1976d2)`,
                  boxShadow: "0 0 20px #64b5f6",
                  animation: `minionOrbit 2s linear infinite`,
                  animationDelay: `${i * 0.1}s`,
                  transformOrigin: "center",
                  left: `calc(50% + ${Math.cos(angle) * 180}px)`,
                  top: `calc(50% + ${Math.sin(angle) * 180}px)`,
                  opacity: 0.8
                }} />
              );
            })}
            
            {/* Title */}
            <div style={{
              fontSize: "56px",
              fontWeight: "900",
              background: "linear-gradient(135deg, #ff1744, #ff5252, #ff8a80)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 30px rgba(255,23,68,0.8))",
              animation: "titleBounce 1s ease-out",
              letterSpacing: "6px",
              textTransform: "uppercase",
              zIndex: 10,
              position: "relative",
              textAlign: "center",
              marginBottom: "250px"
            }}>
              👑 BOSS ARENA
            </div>
            
            {/* Subtitle */}
            <div style={{
              fontSize: "20px",
              color: "#aaa",
              animation: "fadeIn 0.5s ease-out 0.5s forwards",
              opacity: 0,
              textAlign: "center",
              position: "relative",
              zIndex: 10
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
          left: 0,
          width: "calc(100vw - 400px)",
          height: "100vh",
          background: "linear-gradient(135deg, rgba(0,0,0,0.95), rgba(40,0,40,0.95))",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "fadeIn 0.3s ease-out",
          overflow: "hidden",
          pointerEvents: "none"
        }}>
          <div style={{
            position: "relative",
            width: "700px",
            height: "400px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {/* Chaotic bubbles fighting */}
            {[...Array(15)].map((_, i) => (
              <div key={`brawl-${i}`} style={{
                position: "absolute",
                width: `${40 + (i % 3) * 20}px`,
                height: `${40 + (i % 3) * 20}px`,
                borderRadius: "50%",
                background: `radial-gradient(circle at 30% 30%, ${['#9c27b0', '#ff9800', '#4caf50', '#f44336', '#2196f3'][i % 5]}, ${['#6a1b9a', '#f57c00', '#388e3c', '#c62828', '#1565c0'][i % 5]})`,
                boxShadow: `0 0 25px ${['#9c27b0', '#ff9800', '#4caf50', '#f44336', '#2196f3'][i % 5]}`,
                animation: `brawlChaos${i % 4} ${1.5 + (i % 3) * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.05}s`,
                opacity: 0.85
              }} />
            ))}
            
            {/* Impact effects */}
            {[...Array(8)].map((_, i) => (
              <div key={`impact-${i}`} style={{
                position: "absolute",
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                border: "3px solid #fff",
                animation: `impactWave ${1 + i * 0.1}s ease-out infinite`,
                animationDelay: `${i * 0.2}s`,
                opacity: 0
              }} />
            ))}
            
            {/* Fighting fists */}
            <div style={{
              position: "absolute",
              top: "50px",
              left: "60px",
              fontSize: "70px",
              animation: "fistPunch 1s ease-in-out infinite",
              filter: "drop-shadow(0 0 15px #ff9800)"
            }}>👊</div>
            <div style={{
              position: "absolute",
              top: "50px",
              right: "60px",
              fontSize: "70px",
              animation: "fistPunch 1s ease-in-out infinite",
              animationDelay: "0.5s",
              filter: "drop-shadow(0 0 15px #9c27b0)",
              transform: "scaleX(-1)"
            }}>👊</div>
            
            {/* Explosion effects */}
            {[...Array(4)].map((_, i) => (
              <div key={`explosion-${i}`} style={{
                position: "absolute",
                fontSize: "50px",
                animation: `explosionPop 1.5s ease-out infinite`,
                animationDelay: `${i * 0.4}s`,
                opacity: 0,
                left: `${100 + i * 130}px`,
                top: `${150 + (i % 2) * 100}px`
              }}>💥</div>
            ))}
            
            {/* Title */}
            <div style={{
              fontSize: "56px",
              fontWeight: "900",
              background: "linear-gradient(135deg, #9c27b0, #ff9800, #f44336)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 30px rgba(156,39,176,0.8))",
              animation: "titleBounce 1s ease-out",
              letterSpacing: "6px",
              textTransform: "uppercase",
              zIndex: 10,
              position: "relative",
              textAlign: "center"
            }}>
              🥊 BRAWL ARENA
            </div>
            
            {/* Subtitle */}
            <div style={{
              fontSize: "20px",
              color: "#aaa",
              marginTop: "20px",
              animation: "fadeIn 0.5s ease-out 0.5s forwards",
              opacity: 0,
              textAlign: "center",
              zIndex: 10,
              position: "relative"
            }}>
              {brawlMode === "1v1" ? "Epic solo Battle!" : "Solo vs Squad Mayhem!"}
            </div>
          </div>
        </div>
      )}
      
      {/* Power Animation Overlay - Centered in arena+leaderboard area */}
      {showPowerAnimation && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "calc(100vw - 400px)", // Exclude right sidebar
          height: "100vh",
          background: "rgba(0,0,20,0.95)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "fadeIn 0.3s ease-out",
          overflow: "hidden",
          pointerEvents: "none"
        }}>
          <div style={{
            position: "relative",
            width: "500px",
            height: "300px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            perspective: "1000px"
          }}>
            {/* Lightning strikes */}
            {[...Array(5)].map((_, i) => (
              <svg key={`lightning-${i}`} style={{
                position: "absolute",
                top: "-40px",
                left: `${60 + i * 90}px`,
                width: "35px",
                height: "250px",
                animation: `lightning ${0.8 + i * 0.2}s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
                filter: "drop-shadow(0 0 10px #00f5ff) drop-shadow(0 0 20px #0080ff)",
                opacity: 0
              }}>
                <path
                  d={`M 18 0 L 14 70 L 22 70 L 10 130 L 14 130 L 5 250 L 18 105 L 11 105 L 23 45 L 16 45 Z`}
                  fill="#00f5ff"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
              </svg>
            ))}
            
            {/* Ground impact cracks */}
            {[...Array(5)].map((_, i) => (
              <div key={`crack-${i}`} style={{
                position: "absolute",
                bottom: "0",
                left: `${50 + i * 100}px`,
                width: "3px",
                height: "80px",
                background: "linear-gradient(180deg, #00f5ff, transparent)",
                boxShadow: "0 0 15px #00f5ff",
                animation: `crackExpand ${1 + i * 0.1}s ease-out forwards`,
                transformOrigin: "top center",
                opacity: 0
              }} />
            ))}
            
            {/* Electric ground glow */}
            <div style={{
              position: "absolute",
              bottom: "0",
              width: "100%",
              height: "6px",
              background: "linear-gradient(90deg, transparent, #00f5ff, #00d4ff, #00f5ff, transparent)",
              boxShadow: "0 0 30px #00f5ff, 0 -5px 50px #0080ff",
              animation: "electricPulse 0.8s ease-in-out infinite"
            }} />
            
            {/* Electric ripple effect */}
            {[...Array(3)].map((_, i) => (
              <div key={`ripple-${i}`} style={{
                position: "absolute",
                bottom: "0",
                left: "50%",
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                border: "2px solid #00f5ff",
                transform: "translateX(-50%)",
                animation: `ripple ${1.5}s ease-out infinite`,
                animationDelay: `${i * 0.5}s`,
                opacity: 0
              }} />
            ))}
            
            {/* Main text */}
            <div style={{
              fontSize: "48px",
              fontWeight: "900",
              background: "linear-gradient(135deg, #00f5ff, #00d4ff, #0080ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "0 0 40px rgba(0,245,255,0.8)",
              animation: "textPulse3D 1s ease-in-out infinite",
              transform: "rotateX(10deg)",
              letterSpacing: "4px",
              textTransform: "uppercase",
              zIndex: 10,
              position: "relative",
              marginBottom: "30px",
              textAlign: "center",
              whiteSpace: "nowrap"
            }}>
              ⚡ POWERS ENABLED
            </div>
            
            {/* Electric particles */}
            {[...Array(40)].map((_, i) => (
              <div key={i} style={{
                position: "absolute",
                width: "3px",
                height: "3px",
                background: "#00f5ff",
                borderRadius: "50%",
                top: "50%",
                left: "50%",
                animation: `particle${i % 4} 2s ease-out infinite`,
                animationDelay: `${i * 0.03}s`,
                opacity: 0,
                boxShadow: "0 0 15px #00f5ff"
              }} />
            ))}
          </div>
        </div>
      )}
      
      {/* Boss Power Animation Overlay - Centered in arena+leaderboard area */}
      {showBossPowerAnimation && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "calc(100vw - 400px)",
          height: "100vh",
          background: "rgba(20,0,0,0.95)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "fadeIn 0.3s ease-out",
          overflow: "hidden",
          pointerEvents: "none"
        }}>
          <div style={{
            position: "relative",
            width: "500px",
            height: "300px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            perspective: "1000px"
          }}>
            {/* Fire strikes */}
            {[...Array(5)].map((_, i) => (
              <svg key={`fire-strike-${i}`} style={{
                position: "absolute",
                top: "-40px",
                left: `${60 + i * 90}px`,
                width: "35px",
                height: "250px",
                animation: `lightning ${0.8 + i * 0.2}s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
                filter: "drop-shadow(0 0 10px #ff0000) drop-shadow(0 0 20px #ff4500)",
                opacity: 0
              }}>
                <path
                  d={`M 18 0 L 14 70 L 22 70 L 10 130 L 14 130 L 5 250 L 18 105 L 11 105 L 23 45 L 16 45 Z`}
                  fill="#ff0000"
                  stroke="#ff4500"
                  strokeWidth="1"
                />
              </svg>
            ))}
            
            {/* Ground fire cracks */}
            {[...Array(5)].map((_, i) => (
              <div key={`crack-${i}`} style={{
                position: "absolute",
                bottom: "0",
                left: `${50 + i * 100}px`,
                width: "3px",
                height: "80px",
                background: "linear-gradient(180deg, #ff0000, transparent)",
                boxShadow: "0 0 15px #ff0000",
                animation: `crackExpand ${1 + i * 0.1}s ease-out forwards`,
                transformOrigin: "top center",
                opacity: 0
              }} />
            ))}
            
            {/* Fire ground glow */}
            <div style={{
              position: "absolute",
              bottom: "0",
              width: "100%",
              height: "6px",
              background: "linear-gradient(90deg, transparent, #ff0000, #ff4500, #ff0000, transparent)",
              boxShadow: "0 0 30px #ff0000, 0 -5px 50px #ff4500",
              animation: "electricPulse 0.8s ease-in-out infinite"
            }} />
            
            {/* Fire ripple effect */}
            {[...Array(3)].map((_, i) => (
              <div key={`ripple-${i}`} style={{
                position: "absolute",
                bottom: "0",
                left: "50%",
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                border: "2px solid #ff0000",
                transform: "translateX(-50%)",
                animation: `ripple ${1.5}s ease-out infinite`,
                animationDelay: `${i * 0.5}s`,
                opacity: 0
              }} />
            ))}
            
            {/* Main text */}
            <div style={{
              fontSize: "48px",
              fontWeight: "900",
              background: "linear-gradient(135deg, #ff0000, #ff4500, #ff6600)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "0 0 40px rgba(255,0,0,0.8)",
              animation: "textPulse3D 1s ease-in-out infinite",
              transform: "rotateX(10deg)",
              letterSpacing: "4px",
              textTransform: "uppercase",
              zIndex: 10,
              position: "relative",
              marginBottom: "30px",
              textAlign: "center",
              whiteSpace: "nowrap"
            }}>
              👹 POWERS ENABLED FOR FINAL BOSS
            </div>
            
            {/* Fire particles */}
            {[...Array(40)].map((_, i) => (
              <div key={i} style={{
                position: "absolute",
                width: "3px",
                height: "3px",
                background: i % 2 === 0 ? "#ff0000" : "#ff4500",
                borderRadius: "50%",
                top: "50%",
                left: "50%",
                animation: `particle${i % 4} 2s ease-out infinite`,
                animationDelay: `${i * 0.03}s`,
                opacity: 0,
                boxShadow: "0 0 15px currentColor"
              }} />
            ))}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spikeRise {
          0% { transform: translateY(200px) scaleY(0); opacity: 0; }
          60% { transform: translateY(0) scaleY(1.2); opacity: 1; }
          100% { transform: translateY(0) scaleY(1); opacity: 1; }
        }
        @keyframes crackGlow {
          0%, 100% { opacity: 0.6; transform: scaleX(1); }
          50% { opacity: 1; transform: scaleX(1.1); }
        }
        @keyframes lightning {
          0%, 90%, 100% { opacity: 0; }
          10%, 15%, 20%, 25% { opacity: 1; }
          12%, 17%, 22% { opacity: 0.3; }
        }
        @keyframes crackExpand {
          0% { transform: scaleY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: scaleY(1); opacity: 0.8; }
        }
        @keyframes electricPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; box-shadow: 0 0 40px #00f5ff, 0 -5px 60px #0080ff; }
        }
        @keyframes ripple {
          0% { transform: translateX(-50%) scale(0); opacity: 1; }
          100% { transform: translateX(-50%) scale(6); opacity: 0; }
        }
        @keyframes textPulse3D {
          0%, 100% { transform: scale(1) rotateX(10deg); }
          50% { transform: scale(1.05) rotateX(15deg); }
        }
        @keyframes particle0 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(${Math.random() * 300 - 150}px, ${Math.random() * 300 - 150}px) scale(0); opacity: 0; }
        }
        @keyframes particle1 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(${Math.random() * 300 - 150}px, ${Math.random() * 300 - 150}px) scale(0); opacity: 0; }
        }
        @keyframes particle2 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(${Math.random() * 300 - 150}px, ${Math.random() * 300 - 150}px) scale(0); opacity: 0; }
        }
        @keyframes particle3 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(${Math.random() * 300 - 150}px, ${Math.random() * 300 - 150}px) scale(0); opacity: 0; }
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
        @keyframes bladeRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes bladeSpark {
          0% { opacity: 1; transform: translate(-50%, -50%) translateY(0) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) translateY(-100px) scale(0); }
        }
        @keyframes titleBounce {
          0% { transform: scale(0.3) translateY(-100px); opacity: 0; }
          60% { transform: scale(1.1) translateY(0); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes bubbleCollide0 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-40px, -30px); }
        }
        @keyframes bubbleCollide1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(40px, 30px); }
        }
        @keyframes bubbleCollide2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 40px); }
        }
        @keyframes bubbleCollide3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -40px); }
        }
        @keyframes bossGrow {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes minionOrbit {
          0% { transform: rotate(0deg) translateX(0) scale(1); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: rotate(360deg) translateX(0) scale(1); opacity: 0.8; }
        }
        @keyframes brawlChaos0 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-60px, -40px) rotate(90deg); }
          50% { transform: translate(60px, 40px) rotate(180deg); }
          75% { transform: translate(-40px, 60px) rotate(270deg); }
        }
        @keyframes brawlChaos1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(60px, -60px) rotate(-90deg); }
          50% { transform: translate(-60px, 60px) rotate(-180deg); }
          75% { transform: translate(60px, 60px) rotate(-270deg); }
        }
        @keyframes brawlChaos2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-50px, 50px) rotate(120deg); }
          50% { transform: translate(50px, -50px) rotate(240deg); }
          75% { transform: translate(-50px, -50px) rotate(360deg); }
        }
        @keyframes brawlChaos3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(40px, 60px) rotate(-120deg); }
          50% { transform: translate(-40px, -60px) rotate(-240deg); }
          75% { transform: translate(60px, -40px) rotate(-360deg); }
        }
        @keyframes impactWave {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes swordSlash {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          50% { transform: translateX(-10px) rotate(-15deg); }
        }
        @keyframes shieldBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(1.1); }
        }
        @keyframes skullAppear {
          0% { transform: scale(0) rotate(-30deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(5deg); opacity: 0.4; }
          100% { transform: scale(1) rotate(0deg); opacity: 0.3; }
        }
        @keyframes dangerFloat0 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        @keyframes dangerFloat1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(-10deg); }
        }
        @keyframes dangerFloat2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(15deg); }
        }
        @keyframes fistPunch {
          0%, 100% { transform: translateX(0) scale(1); }
          50% { transform: translateX(20px) scale(1.2); }
        }
        @keyframes explosionPop {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.5) rotate(180deg); opacity: 1; }
          100% { transform: scale(0.5) rotate(360deg); opacity: 0; }
        }
      `}</style>
      
      <div style={{ flex: 1, display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", gap: 0, position: "relative" }}>
        {/* Arena Frame */}
        <div
          ref={arenaRef}
          className={`arena ${winner || winnersList || winnersImages ? "arena-blur" : ""}`}
          style={{
            position: "relative",
            width: "60vw",
            height: "100vh",
            maxWidth: "920px",
            maxHeight: "none",
            ...(arenaShape === ARENA_SHAPES.CIRCLE ? { aspectRatio: "1 / 1" } : {}),
            background: canvasBackgroundColor,
            overflow: "hidden",
            ...getArenaShapeStyle(),
          }}
        >
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
                    
                    // Use normal vector for rotation, add 90 degrees clockwise
                    const angle = Math.atan2(spike.ny, spike.nx) * (180 / Math.PI) + 90;
                    
                    // Single upward-pointing triangle, rotated by normal
                    const points = `${w / 2},0 0,${h} ${w},${h}`;
                    
                    const style: React.CSSProperties = {
                      position: "absolute",
                      pointerEvents: "none",
                      zIndex: 120,
                      left: spike.x,
                      top: spike.y,
                      transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                      transformOrigin: "center center"
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
        </div>

        {/* Leaderboard next to arena */}
        <div
          className="leaderboard"
          style={{
            width: arenaType === ARENA_TYPES.NORMAL ? 200 : 220,
            height: "95vh",
            // maxHeight: "none",
            // minWidth: 220,
            // maxWidth: 360,
            background: "rgba(8,8,8,0.95)",
            borderLeft: "3px solid rgba(61,59,59,0.55)",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {arenaType === ARENA_TYPES.BOSS ? renderBossVersusCard() : arenaType === ARENA_TYPES.BRAWL ? renderBrawlVersusCard() : renderLeaderboardNormal()}
        </div>

        {/* Winner Overlay - positioned within arena+leaderboard container */}
        {(winner || winnersList || winnersImages) && <WinnerOverlay winnerBubble={winner ?? undefined} winners={winnersList ?? undefined} winnersImgs={winnersImages ?? undefined} bubbleCount={countRef.current} />}
      </div>

      {/* right controls sidebar */}
      <div style={{ width: 320, minWidth: 280, display: "flex", flexDirection: "column", alignItems: "center", marginTop: 18, position: "relative", zIndex: 41 }}>
        <div style={{ width: "100%", maxWidth: 320, background: "rgba(24,24,24,0.95)", borderRadius: 12, padding: 16, boxSizing: "border-box", maxHeight: "88vh", overflowY: "auto" }}>
          {/* Action Buttons */}
          <div style={{ marginBottom: 16 }}>
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
                    <div style={{ color: "#999", fontSize: 11, marginTop: 4 }}>If timer is set, spikes appear only after this delay. 0 = show from start</div>
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
                    <div style={{ color: "#999", fontSize: 11, marginTop: 4 }}>How long spikes stay active after enabling. 0 = stay forever</div>
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
                    <div style={{ color: "#999", fontSize: 11, marginTop: 4 }}>If timer is set, blades activate after this delay. 0 = active from start</div>
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
                    <div style={{ color: "#999", fontSize: 11, marginTop: 4 }}>How long blades stay active after enabling. 0 = stay forever</div>
                  </div>
                  {bladeEnabled && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ color: "#aaa", fontSize: 12, marginBottom: 6 }}>Assign Blades to Bubbles:</div>
                      <div style={{ color: "#999", fontSize: 11, marginBottom: 8 }}>
                        Click on bubble names below to toggle their blade on/off. Blades scale with bubble size.
                      </div>
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
                      
                      <div style={{ color: "#999", fontSize: 10, marginTop: 8 }}>
                        Assigned: {bladeAssignments.size} bubbles | Blade-to-blade: sparks only (no damage) | Blade-to-normal: 5 HP
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
                <div style={{ color: "#999", fontSize: 10, marginTop: 2 }}>Random angle added to bubble bounces (all arenas)</div>
              </div>

              {/* NORMAL ARENA CONFIG */}
              {arenaType === ARENA_TYPES.NORMAL && (
                <>
                  <div style={{ color: "#aaa", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Players Arena Damage:</div>
                  
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
                      <div style={{ color: "#999", fontSize: 10, marginTop: 2 }}>Initial health for superbubble</div>
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
                      <div style={{ color: "#999", fontSize: 10, marginTop: 2 }}>Damage to BOTH when superbubble & normal collide</div>
                    </div>

                    {/* Super Power Damages */}
                    <div style={{ color: "#aaa", fontSize: 11, marginBottom: 6 }}>Superbubble Power Damages:</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                      {(Object.keys(SUPER_BUBBLE_TYPES) as (keyof typeof SUPER_BUBBLE_TYPES)[]).map((powerKey) => (
                        <div key={powerKey} style={{ background: "rgba(0,0,0,0.2)", padding: "6px 8px", borderRadius: 4 }}>
                          <div style={{ color: "#999", fontSize: 10, marginBottom: 3 }}>{SUPER_BUBBLE_TYPES[powerKey].name}</div>
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
                      <div style={{ color: "#999", fontSize: 10, marginTop: 2 }}>Damage dealt to superbubble by normal bubbles' blades</div>
                    </div>

                    {/* Normal Power Damages */}
                    {playerPowersEnabled && (
                      <>
                        <div style={{ color: "#aaa", fontSize: 11, marginBottom: 6 }}>Normal Bubble Power Damages:</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                          {(Object.keys(selectedPlayerPowers) as (keyof typeof SUPER_BUBBLE_TYPES)[]).filter(k => selectedPlayerPowers[k]).map((powerKey) => (
                            <div key={powerKey} style={{ background: "rgba(0,0,0,0.2)", padding: "6px 8px", borderRadius: 4 }}>
                              <div style={{ color: "#999", fontSize: 10, marginBottom: 3 }}>{SUPER_BUBBLE_TYPES[powerKey].name}</div>
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
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                        {(Object.keys(SUPER_BUBBLE_TYPES) as (keyof typeof SUPER_BUBBLE_TYPES)[]).map((powerKey) => (
                          <div key={powerKey} style={{ background: "rgba(0,0,0,0.2)", padding: "6px 8px", borderRadius: 4 }}>
                            <div style={{ color: "#999", fontSize: 10, marginBottom: 3 }}>{SUPER_BUBBLE_TYPES[powerKey].name}</div>
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
                    <div style={{ color: "#999", fontSize: 11, marginTop: 4 }}>Value to set for selected bubble(s)</div>
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
                <div style={{ color: "#999", fontSize: 11, fontStyle: "italic" }}>
                  {isRunning ? "Size locked during game" : "Adjust before/between games"}
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
                        {(Object.keys(SUPER_BUBBLE_TYPES) as (keyof typeof SUPER_BUBBLE_TYPES)[]).map((k) => (
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
                            {SUPER_BUBBLE_TYPES[k].name}
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
                  <div style={{ color: "#999", fontSize: 11, marginTop: 4 }}>If timer is set, powers activate only after this delay. 0 = active from start</div>
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
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                          {(Object.keys(SUPER_BUBBLE_TYPES) as (keyof typeof SUPER_BUBBLE_TYPES)[]).map((k) => (
                            <button
                              key={k}
                              onClick={() => setSelectedPlayerPowers((s) => ({ ...s, [k]: !s[k] }))}
                              style={{
                                padding: "8px 6px",
                                borderRadius: 6,
                                background: selectedPlayerPowers[k] ? "#4caf50" : "rgba(255,255,255,0.08)",
                                color: selectedPlayerPowers[k] ? "#fff" : "#ccc",
                                border: selectedPlayerPowers[k] ? "1px solid #66bb6a" : "1px solid rgba(255,255,255,0.15)",
                                cursor: "pointer",
                                fontSize: 11,
                                fontWeight: selectedPlayerPowers[k] ? 600 : 400,
                                transition: "all 0.2s",
                                textAlign: "center"
                              }}
                              title={`${SUPER_BUBBLE_TYPES[k].name} (${SUPER_BUBBLE_TYPES[k].damage} dmg)`}
                            >
                              {SUPER_BUBBLE_TYPES[k].name}
                            </button>
                          ))}
                        </div>
                        <div style={{ color: "#999", fontSize: 11, marginTop: 8, fontStyle: "italic" }}>
                          Spawns every ~7s, lasts 5s, powers last 10s
                        </div>
                      </div>
                    )}

                    {/* Pre-assigned Mode Settings */}
                    {playerPowerMode === "preassigned" && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ color: "#ccc", fontSize: 12, marginBottom: 8, fontWeight: 500 }}>🎯 Quick Bubble Power Assignment:</div>
                        
                        {/* Power Grid - Assign powers to bubbles visually */}
                        <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: 10, marginBottom: 12 }}>
                          <div style={{ color: "#aaa", fontSize: 10, marginBottom: 8, fontStyle: "italic" }}>Click power → Click bubble(s) to assign. Max 8 bubbles.</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
                            {(Object.keys(SUPER_BUBBLE_TYPES) as (keyof typeof SUPER_BUBBLE_TYPES)[]).map((powerKey) => (
                              <button
                                key={powerKey}
                                onClick={() => {
                                  // Toggle power selection for assignment
                                  const existing = powerAssignments.filter(a => a.type === powerKey);
                                  if (existing.length > 0) {
                                    setPowerAssignments((prev) => prev.filter(a => a.type !== powerKey));
                                  }
                                }}
                                style={{
                                  padding: "6px 4px",
                                  borderRadius: 4,
                                  background: powerAssignments.some(a => a.type === powerKey) ? "#4caf50" : "rgba(255,255,255,0.08)",
                                  color: powerAssignments.some(a => a.type === powerKey) ? "#fff" : "#aaa",
                                  border: powerAssignments.some(a => a.type === powerKey) ? "1px solid #66bb6a" : "1px solid rgba(255,255,255,0.15)",
                                  cursor: "pointer",
                                  fontSize: 9,
                                  fontWeight: powerAssignments.some(a => a.type === powerKey) ? 600 : 400
                                }}
                                title={`${SUPER_BUBBLE_TYPES[powerKey].name} (${SUPER_BUBBLE_TYPES[powerKey].damage} dmg)`}
                              >
                                {SUPER_BUBBLE_TYPES[powerKey].name.substring(0, 8)}
                              </button>
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
                              {(Object.keys(SUPER_BUBBLE_TYPES) as (keyof typeof SUPER_BUBBLE_TYPES)[]).map((k) => (
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
                        <div style={{ color: "#999", fontSize: 11, fontStyle: "italic" }}>
                          Bubbles are indexed 0-based (first bubble = 0, second = 1, etc.)
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
                <div style={{ color: "#999", fontSize: 11, fontStyle: "italic" }}>
                  {isRunning ? "Size locked during game" : "Adjust before/between games"}
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
                  <div style={{ color: "#999", fontSize: 11, marginTop: 4 }}>If timer is set, powers activate only after this delay. 0 = active from start</div>
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
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                              {(Object.keys(SUPER_BUBBLE_TYPES) as (keyof typeof SUPER_BUBBLE_TYPES)[]).map((k) => (
                                <button
                                  key={k}
                                  onClick={() => setSelectedBrawlPowers((s) => ({ ...s, [k]: !s[k] }))}
                                  style={{
                                    padding: "8px 6px",
                                    borderRadius: 6,
                                    background: selectedBrawlPowers[k] ? "#ff9800" : "rgba(255,255,255,0.08)",
                                    color: selectedBrawlPowers[k] ? "#fff" : "#ccc",
                                    border: selectedBrawlPowers[k] ? "1px solid #ffa726" : "1px solid rgba(255,255,255,0.15)",
                                    cursor: "pointer",
                                    fontSize: 11,
                                    fontWeight: selectedBrawlPowers[k] ? 600 : 400,
                                    transition: "all 0.2s",
                                    textAlign: "center"
                                  }}
                                  title={`${SUPER_BUBBLE_TYPES[k].name} (${SUPER_BUBBLE_TYPES[k].damage} dmg)`}
                                >
                                  {SUPER_BUBBLE_TYPES[k].name}
                                </button>
                              ))}
                            </div>
                            <div style={{ color: "#999", fontSize: 11, marginTop: 8, fontStyle: "italic" }}>
                              Each fighter gets a random power from selected options
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
                                  {(Object.keys(SUPER_BUBBLE_TYPES) as (keyof typeof SUPER_BUBBLE_TYPES)[]).map((k) => (
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
                                  {(Object.keys(SUPER_BUBBLE_TYPES) as (keyof typeof SUPER_BUBBLE_TYPES)[]).map((k) => (
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
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                              {(Object.keys(SUPER_BUBBLE_TYPES) as (keyof typeof SUPER_BUBBLE_TYPES)[]).map((k) => (
                                <button
                                  key={k}
                                  onClick={() => setSelectedBrawlPowers((s) => ({ ...s, [k]: !s[k] }))}
                                  style={{
                                    padding: "8px 6px",
                                    borderRadius: 6,
                                    background: selectedBrawlPowers[k] ? "#ff9800" : "rgba(255,255,255,0.08)",
                                    color: selectedBrawlPowers[k] ? "#fff" : "#ccc",
                                    border: selectedBrawlPowers[k] ? "1px solid #ffa726" : "1px solid rgba(255,255,255,0.15)",
                                    cursor: "pointer",
                                    fontSize: 11,
                                    fontWeight: selectedBrawlPowers[k] ? 600 : 400,
                                    transition: "all 0.2s",
                                    textAlign: "center"
                                  }}
                                  title={`${SUPER_BUBBLE_TYPES[k].name} (${SUPER_BUBBLE_TYPES[k].damage} dmg)`}
                                >
                                  {SUPER_BUBBLE_TYPES[k].name}
                                </button>
                              ))}
                            </div>
                            <div style={{ color: "#999", fontSize: 11, marginTop: 8, fontStyle: "italic" }}>
                              All bubbles get random powers from selected options
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
                                  {(Object.keys(SUPER_BUBBLE_TYPES) as (keyof typeof SUPER_BUBBLE_TYPES)[]).map((k) => (
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
                            <div style={{ color: "#999", fontSize: 11, fontStyle: "italic" }}>
                              Solo bubble is index 0, "many" bubbles start from 1
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
