const API_EVENT = "http://localhost:5000/api/stats/event";

type Counts = Record<string, number>;

const hits: Counts = {};
const kills: Counts = {};
let sending = false;
let currentGame: string | null = null;
let currentArena: string | null = null; // '1v1'
let superbubblePlayer: string | null = null;
let currentTestMode: boolean = false;

export function setGame(id: string | null, arena?: string | null, _brawlMode?: string | null) {
  currentGame = id;
  currentArena = arena || null;
  superbubblePlayer = null;
}

export function setTestMode(enabled: boolean) {
  currentTestMode = enabled;
}

export function setSuperbubblePlayer(player: string | null) {
  superbubblePlayer = player;
}

export function getSuperbubblePlayer(): string | null {
  return superbubblePlayer;
}

export function recordHit(player?: string) {
  if (!player) return;
  const k = String(player);
  hits[k] = (hits[k] || 0) + 1;
}

export function recordKill(player?: string) {
  if (!player) return;
  const k = String(player);
  kills[k] = (kills[k] || 0) + 1;
}

async function flushOnce() {
  if (sending) return;
  const players = new Set<string>([...Object.keys(hits), ...Object.keys(kills)]);
  if (players.size === 0) return;
  sending = true;

  for (const p of players) {
    const body: any = { player: p, hits: hits[p] || 0, kills: kills[p] || 0 };
    if (currentGame) body.game = currentGame;
    if (currentArena) body.arena = currentArena;
    if (currentTestMode) body.testMode = currentTestMode;
    const playerBaseName = p.replace(/^superbubble-/, '');
    if (superbubblePlayer && (p === superbubblePlayer || playerBaseName === superbubblePlayer || p.startsWith('superbubble-'))) {
      body.isSuperbubble = true;
    }
    try {
      await fetch(API_EVENT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      delete hits[p];
      delete kills[p];
    } catch (e) {
      console.warn("statsClient: failed to send stats for", p, e);
    }
  }

  sending = false;
}

const FLUSH_INTERVAL = 3000;
setInterval(() => void flushOnce(), FLUSH_INTERVAL);

window.addEventListener("beforeunload", () => {
  try {
    void flushOnce();
  } catch (e) {}
});

export default {
  setGame,
  setTestMode,
  setSuperbubblePlayer,
  recordHit,
  recordKill,
  flush: flushOnce,
};
