const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());

// Serve static files for images
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/bossimgs', express.static(path.join(__dirname, 'bossimgs')));
app.use('/leaderboardimgs', express.static(path.join(__dirname, 'leaderboardimgs')));
app.use('/superbubbleimg', express.static(path.join(__dirname, 'superbubbleimg')));
app.use('/superimgstorage', express.static(path.join(__dirname, 'superimgstorage')));
app.use('/solo_brawls', express.static(path.join(__dirname, 'solo_brawls')));
app.use('/client-types', express.static(path.join(__dirname, '../client/src/types')));

const PLAYER_ENTRIES_DIR = path.join(__dirname, 'player_entries');
if (!fs.existsSync(PLAYER_ENTRIES_DIR)) fs.mkdirSync(PLAYER_ENTRIES_DIR, { recursive: true });

const playerEntryFileName = (name) => {
  const slug = String(name || 'player')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'player';
  return `${Date.now()}-${slug}.json`;
};

const savePlayerEntry = (entry) => {
  if (!entry || !String(entry.name || '').trim()) throw new Error('Player name is required');
  const normalized = {
    version: 1,
    id: entry.id || `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: String(entry.name).trim(),
    avatar: entry.avatar ?? 0,
    color: entry.color || 'cyan',
    hp: Number(entry.hp) || 100,
    powers: Array.isArray(entry.powers) ? entry.powers : [],
    match: entry.match || null,
    createdAt: entry.createdAt || new Date().toISOString(),
  };
  const fileName = playerEntryFileName(normalized.name);
  fs.writeFileSync(path.join(PLAYER_ENTRIES_DIR, fileName), JSON.stringify(normalized, null, 2), 'utf8');
  return { fileName, entry: normalized };
};

app.get('/api/player-entries', (_req, res) => {
  try {
    const entries = fs.readdirSync(PLAYER_ENTRIES_DIR)
      .filter((file) => file.endsWith('.json'))
      .map((file) => ({ fileName: file, entry: JSON.parse(fs.readFileSync(path.join(PLAYER_ENTRIES_DIR, file), 'utf8')) }));
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read player entries' });
  }
});

app.post('/api/player-entries', (req, res) => {
  try {
    const payload = Array.isArray(req.body?.entries) ? req.body.entries : [req.body];
    const saved = payload.map(savePlayerEntry);
    res.status(201).json({ ok: true, entries: saved });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to save player entry' });
  }
});

// Supported image extensions
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];

// Helper function to find image file by name (without extension)
const findImageFile = (folder, baseName) => {
  const folderPath = path.join(__dirname, folder);
  if (!fs.existsSync(folderPath)) return null;
  
  // First try exact match (if baseName has extension)
  const exactPath = path.join(folderPath, baseName);
  if (fs.existsSync(exactPath)) return exactPath;
  
  // Try each extension
  for (const ext of IMAGE_EXTENSIONS) {
    const filePath = path.join(folderPath, baseName + ext);
    if (fs.existsSync(filePath)) return filePath;
  }
  
  // Try case-insensitive search
  try {
    const files = fs.readdirSync(folderPath);
    const baseNameLower = baseName.toLowerCase();
    for (const file of files) {
      const fileNameWithoutExt = path.parse(file).name.toLowerCase();
      if (fileNameWithoutExt === baseNameLower) {
        return path.join(folderPath, file);
      }
    }
  } catch (e) {}
  
  return null;
};

// Dynamic image serving - finds image by name without extension
app.get('/img/:folder/:name', (req, res) => {
  const { folder, name } = req.params;
  const allowedFolders = ['images', 'bossimgs', 'superbubbleimg', 'superimgstorage'];
  
  if (!allowedFolders.includes(folder)) {
    return res.status(404).send('Folder not found');
  }
  
  const imagePath = findImageFile(folder, decodeURIComponent(name));
  if (imagePath) {
    return res.sendFile(imagePath);
  }
  
  res.status(404).send('Image not found');
});

// Dynamic image serving for brawl images (solo_brawls/solovsmany)
app.get('/img/brawl/:name', (req, res) => {
  const { name } = req.params;
  const decodedName = decodeURIComponent(name);
  
  // Try solo_brawls/solovsmany first
  let imagePath = findImageFile('solo_brawls/solovsmany', decodedName);
  if (imagePath) return res.sendFile(imagePath);
  
  // Try solo_brawls folder
  imagePath = findImageFile('solo_brawls', decodedName);
  if (imagePath) return res.sendFile(imagePath);
  
  res.status(404).send('Image not found');
});

// API routes for serving images by name (without extension)
// These find the image file regardless of its extension
app.get('/api/images/:name', (req, res) => {
  const { name } = req.params;
  const imagePath = findImageFile('images', decodeURIComponent(name));
  if (imagePath) return res.sendFile(imagePath);
  res.status(404).send('Image not found');
});

app.get('/api/bossimgs/:name', (req, res) => {
  const { name } = req.params;
  const imagePath = findImageFile('bossimgs', decodeURIComponent(name));
  if (imagePath) return res.sendFile(imagePath);
  res.status(404).send('Image not found');
});

app.get('/api/leaderboardimgs/:name', (req, res) => {
  const { name } = req.params;
  const imagePath = findImageFile('leaderboardimgs', decodeURIComponent(name));
  if (imagePath) return res.sendFile(imagePath);
  res.status(404).send('Image not found');
});

app.get('/api/superbubbleimg/:name', (req, res) => {
  const { name } = req.params;
  const imagePath = findImageFile('superbubbleimg', decodeURIComponent(name));
  if (imagePath) return res.sendFile(imagePath);
  res.status(404).send('Image not found');
});

app.get('/api/superimgstorage/:name', (req, res) => {
  const { name } = req.params;
  const imagePath = findImageFile('superimgstorage', decodeURIComponent(name));
  if (imagePath) return res.sendFile(imagePath);
  res.status(404).send('Image not found');
});

app.get('/api/brawlimgs/:name', (req, res) => {
  const { name } = req.params;
  const decodedName = decodeURIComponent(name);
  
  // Try solo_brawls/solovsmany first
  let imagePath = findImageFile('solo_brawls/solovsmany', decodedName);
  if (imagePath) return res.sendFile(imagePath);
  
  // Try solo_brawls folder
  imagePath = findImageFile('solo_brawls', decodedName);
  if (imagePath) return res.sendFile(imagePath);
  
  res.status(404).send('Image not found');
});

// Persistent leaderboard stores (file-backed) - normal, boss, and brawl separated
const STATS_FILE = path.join(__dirname, "stats.json");
const STATS_BOSS_FILE = path.join(__dirname, "stats_boss.json");
const STATS_BRAWL_FILE = path.join(__dirname, "stats_brawl.json");

// Test mode stats files
const STATS_TEST_FILE = path.join(__dirname, "stats_test.json");
const STATS_BOSS_TEST_FILE = path.join(__dirname, "stats_boss_test.json");
const STATS_BRAWL_TEST_FILE = path.join(__dirname, "stats_brawl_test.json");

// Test mode tracking
let isTestMode = false;

// Game indexing for easy reference (game-1, game-2, etc.)
let normalGameCount = 0;
let bossGameCount = 0;
let brawlGameCount = 0;

// store shape (for each):
// { games: { [gameId]: { players: { [player]: { hits,kills,wins } }, winner?: string, createdAt, gameIndex } }, totals: { [player]: { hits,kills,wins } } }
let leaderboardStore = { games: {}, totals: {} };
let bossStore = { games: {}, totals: {} };
let brawlStore = { games: {}, totals: {} };

// Test stores
let leaderboardTestStore = { games: {}, totals: {} };
let bossTestStore = { games: {}, totals: {} };
let brawlTestStore = { games: {}, totals: {} };

// normalize a player identifier to the filename portion (strip URL/path and extensions)
const normalizePlayerKey = (p) => {
  try {
    let key = String(p || "");
    // Decode URL-encoded characters (e.g., %20 -> space)
    key = decodeURIComponent(key);
    key = key.replace(/^https?:\/\/[^\/]+\//, "").replace(/^\/+/, "");
    const parts = key.split('/');
    const fileName = parts[parts.length - 1] || String(p);
    // Remove image extensions
    return fileName.replace(/\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i, '');
  } catch (e) {
    return String(p);
  }
};
const loadStats = () => {
  try {
    // load normal stats
    if (fs.existsSync(STATS_FILE)) {
      const raw = fs.readFileSync(STATS_FILE, "utf8");
      const parsed = raw ? JSON.parse(raw) : {};
      if (parsed && typeof parsed === "object") {
        if (parsed.games || parsed.totals) {
          leaderboardStore = parsed;
        } else {
          // migrate legacy flat format -> normalized totals
          leaderboardStore = { games: {}, totals: {} };
          Object.keys(parsed).forEach((p) => {
            const v = parsed[p] || {};
            let key = String(p || '');
            try { key = key.replace(/^https?:\/\/[^\/]+\//, '').replace(/^\/+/, ''); const parts = key.split('/'); key = parts[parts.length - 1] || String(p); } catch (e) {}
            const existing = leaderboardStore.totals[key] || { hits: 0, kills: 0, wins: 0 };
            existing.hits = (existing.hits || 0) + Number(v.hits || 0);
            existing.kills = (existing.kills || 0) + Number(v.kills || 0);
            existing.wins = (existing.wins || 0) + Number(v.wins || 0);
            leaderboardStore.totals[key] = existing;
          });
          try { fs.writeFileSync(STATS_FILE, JSON.stringify(leaderboardStore, null, 2), 'utf8'); } catch (e) {}
        }
      }
    } else { leaderboardStore = { games: {}, totals: {} }; fs.writeFileSync(STATS_FILE, JSON.stringify(leaderboardStore, null, 2), "utf8"); }

    // load boss stats (if exists), otherwise initialize
    if (fs.existsSync(STATS_BOSS_FILE)) {
      const rawB = fs.readFileSync(STATS_BOSS_FILE, "utf8");
      const parsedB = rawB ? JSON.parse(rawB) : {};
      if (parsedB && typeof parsedB === 'object' && (parsedB.games || parsedB.totals)) {
        bossStore = parsedB;
      } else {
        bossStore = { games: {}, totals: {} };
        try { fs.writeFileSync(STATS_BOSS_FILE, JSON.stringify(bossStore, null, 2), 'utf8'); } catch (e) {}
      }
    } else {
      bossStore = { games: {}, totals: {} };
      fs.writeFileSync(STATS_BOSS_FILE, JSON.stringify(bossStore, null, 2), 'utf8');
    }

    // load brawl stats (if exists), otherwise initialize
    if (fs.existsSync(STATS_BRAWL_FILE)) {
      const rawBrawl = fs.readFileSync(STATS_BRAWL_FILE, "utf8");
      const parsedBrawl = rawBrawl ? JSON.parse(rawBrawl) : {};
      if (parsedBrawl && typeof parsedBrawl === 'object' && (parsedBrawl.games || parsedBrawl.totals || parsedBrawl.totals_1v1 || parsedBrawl.totals_1vMany)) {
        brawlStore = parsedBrawl;
        // Ensure the new structure exists
        if (!brawlStore.totals_1v1) brawlStore.totals_1v1 = {};
        if (!brawlStore.totals_1vMany) brawlStore.totals_1vMany = {};
        if (!brawlStore.games) brawlStore.games = {};
      } else {
        brawlStore = { games: {}, totals_1v1: {}, totals_1vMany: {} };
        try { fs.writeFileSync(STATS_BRAWL_FILE, JSON.stringify(brawlStore, null, 2), 'utf8'); } catch (e) {}
      }
    } else {
      brawlStore = { games: {}, totals_1v1: {}, totals_1vMany: {} };
      fs.writeFileSync(STATS_BRAWL_FILE, JSON.stringify(brawlStore, null, 2), 'utf8');
    }
    
    // Load test stats files (create if they don't exist)
    if (fs.existsSync(STATS_TEST_FILE)) {
      const raw = fs.readFileSync(STATS_TEST_FILE, "utf8");
      leaderboardTestStore = JSON.parse(raw) || { games: {}, totals: {} };
    } else {
      leaderboardTestStore = { games: {}, totals: {} };
      fs.writeFileSync(STATS_TEST_FILE, JSON.stringify(leaderboardTestStore, null, 2), 'utf8');
    }
    
    if (fs.existsSync(STATS_BOSS_TEST_FILE)) {
      const raw = fs.readFileSync(STATS_BOSS_TEST_FILE, "utf8");
      bossTestStore = JSON.parse(raw) || { games: {}, totals: {} };
    } else {
      bossTestStore = { games: {}, totals: {} };
      fs.writeFileSync(STATS_BOSS_TEST_FILE, JSON.stringify(bossTestStore, null, 2), 'utf8');
    }
    
    if (fs.existsSync(STATS_BRAWL_TEST_FILE)) {
      const raw = fs.readFileSync(STATS_BRAWL_TEST_FILE, "utf8");
      brawlTestStore = JSON.parse(raw) || { games: {}, totals_1v1: {}, totals_1vMany: {} };
    } else {
      brawlTestStore = { games: {}, totals_1v1: {}, totals_1vMany: {} };
      fs.writeFileSync(STATS_BRAWL_TEST_FILE, JSON.stringify(brawlTestStore, null, 2), 'utf8');
    }
  } catch (e) {
    console.error("Failed to load stats files", e);
    leaderboardStore = { games: {}, totals: {} };
    bossStore = { games: {}, totals: {} };
    brawlStore = { games: {}, totals: {} };
    leaderboardTestStore = { games: {}, totals: {} };
    bossTestStore = { games: {}, totals: {} };
    brawlTestStore = { games: {}, totals_1v1: {}, totals_1vMany: {} };
  }
};

// Migration function to remove extensions from existing player keys
const migratePlayerNames = () => {
  console.log("Running migration to remove extensions from player names...");

  let changed = false;

  // Helper function to migrate a store
  const migrateStore = (store, storeName) => {
    let storeChanged = false;

    // Migrate totals
    if (store.totals) {
      const newTotals = {};
      for (const [player, stats] of Object.entries(store.totals)) {
        const cleanPlayer = normalizePlayerKey(player);
        // Skip draw, team, and superbubble - they should not be in totals
        if (cleanPlayer === 'draw' || cleanPlayer === 'team' || cleanPlayer === 'superbubble') {
          storeChanged = true;
          console.log(`${storeName}: Removing invalid player "${cleanPlayer}" from totals`);
          continue;
        }
        // For boss arena, remove entries with 0 hits and 0 games (likely superbubble presence events)
        if (storeName === 'boss' && stats.hits === 0 && stats.games === 0) {
          storeChanged = true;
          console.log(`${storeName}: Removing zero-stat entry "${cleanPlayer}" from totals (likely superbubble)`);
          continue;
        }
        if (cleanPlayer !== player) {
          storeChanged = true;
          console.log(`${storeName}: Migrating player "${player}" to "${cleanPlayer}"`);
        }

        // Merge stats if clean name already exists
        if (newTotals[cleanPlayer]) {
          newTotals[cleanPlayer].hits = (newTotals[cleanPlayer].hits || 0) + (stats.hits || 0);
          newTotals[cleanPlayer].kills = (newTotals[cleanPlayer].kills || 0) + (stats.kills || 0);
          newTotals[cleanPlayer].wins = (newTotals[cleanPlayer].wins || 0) + (stats.wins || 0);
          newTotals[cleanPlayer].games = (newTotals[cleanPlayer].games || 0) + (stats.games || 0);
        } else {
          newTotals[cleanPlayer] = { ...stats };
        }
      }
      store.totals = newTotals;
    }

    // Migrate brawl totals (1v1 and 1vMany)
    if (store.totals_1v1) {
      const newTotals1v1 = {};
      for (const [player, stats] of Object.entries(store.totals_1v1)) {
        const cleanPlayer = normalizePlayerKey(player);
        // Skip draw, team, and superbubble - they should not be in totals
        if (cleanPlayer === 'draw' || cleanPlayer === 'team' || cleanPlayer === 'superbubble') {
          storeChanged = true;
          console.log(`${storeName}: Removing invalid player "${cleanPlayer}" from totals_1v1`);
          continue;
        }
        if (cleanPlayer !== player) storeChanged = true;

        if (newTotals1v1[cleanPlayer]) {
          newTotals1v1[cleanPlayer].hits = (newTotals1v1[cleanPlayer].hits || 0) + (stats.hits || 0);
          newTotals1v1[cleanPlayer].kills = (newTotals1v1[cleanPlayer].kills || 0) + (stats.kills || 0);
          newTotals1v1[cleanPlayer].wins = (newTotals1v1[cleanPlayer].wins || 0) + (stats.wins || 0);
          newTotals1v1[cleanPlayer].games = (newTotals1v1[cleanPlayer].games || 0) + (stats.games || 0);
        } else {
          newTotals1v1[cleanPlayer] = { ...stats };
        }
      }
      store.totals_1v1 = newTotals1v1;
    }

    if (store.totals_1vMany) {
      const newTotals1vMany = {};
      for (const [player, stats] of Object.entries(store.totals_1vMany)) {
        const cleanPlayer = normalizePlayerKey(player);
        // Skip draw, team, and superbubble - they should not be in totals
        if (cleanPlayer === 'draw' || cleanPlayer === 'team' || cleanPlayer === 'superbubble') {
          storeChanged = true;
          console.log(`${storeName}: Removing invalid player "${cleanPlayer}" from totals_1vMany`);
          continue;
        }
        if (cleanPlayer !== player) storeChanged = true;

        if (newTotals1vMany[cleanPlayer]) {
          newTotals1vMany[cleanPlayer].hits = (newTotals1vMany[cleanPlayer].hits || 0) + (stats.hits || 0);
          newTotals1vMany[cleanPlayer].kills = (newTotals1vMany[cleanPlayer].kills || 0) + (stats.kills || 0);
          newTotals1vMany[cleanPlayer].wins = (newTotals1vMany[cleanPlayer].wins || 0) + (stats.wins || 0);
          newTotals1vMany[cleanPlayer].games = (newTotals1vMany[cleanPlayer].games || 0) + (stats.games || 0);
        } else {
          newTotals1vMany[cleanPlayer] = { ...stats };
        }
      }
      store.totals_1vMany = newTotals1vMany;
    }

    // Migrate games
    if (store.games) {
      for (const [gameId, game] of Object.entries(store.games)) {
        if (game.players) {
          const newPlayers = {};
          for (const [player, stats] of Object.entries(game.players)) {
            const cleanPlayer = normalizePlayerKey(player);
            // Keep superbubble in game.players (it's stored there), but skip if it's "draw"
            if (cleanPlayer === 'draw') {
              storeChanged = true;
              console.log(`${storeName} game ${gameId}: Removing "draw" from players (should only be in winner)`);
              continue;
            }
            if (cleanPlayer !== player) {
              storeChanged = true;
              console.log(`${storeName} game ${gameId}: Migrating player "${player}" to "${cleanPlayer}"`);
            }

            // Merge stats if clean name already exists
            if (newPlayers[cleanPlayer]) {
              newPlayers[cleanPlayer].hits = (newPlayers[cleanPlayer].hits || 0) + (stats.hits || 0);
              newPlayers[cleanPlayer].kills = (newPlayers[cleanPlayer].kills || 0) + (stats.kills || 0);
              newPlayers[cleanPlayer].wins = (newPlayers[cleanPlayer].wins || 0) + (stats.wins || 0);
            } else {
              newPlayers[cleanPlayer] = { ...stats };
            }
          }
          game.players = newPlayers;
        }

        // Migrate winner if it exists
        if (game.winner) {
          const cleanWinner = normalizePlayerKey(game.winner);
          if (cleanWinner !== game.winner) {
            storeChanged = true;
            console.log(`${storeName} game ${gameId}: Migrating winner "${game.winner}" to "${cleanWinner}"`);
            game.winner = cleanWinner;
          }
        }

        // Migrate soloPlayer if it exists
        if (game.soloPlayer) {
          const cleanSolo = normalizePlayerKey(game.soloPlayer);
          if (cleanSolo !== game.soloPlayer) {
            storeChanged = true;
            game.soloPlayer = cleanSolo;
          }
        }
      }
    }

    return storeChanged;
  };

  // Migrate all stores
  if (migrateStore(leaderboardStore, 'normal')) {
    changed = true;
    saveStats('normal');
  }

  if (migrateStore(bossStore, 'boss')) {
    changed = true;
    saveStats('boss');
  }

  if (migrateStore(brawlStore, 'brawl')) {
    changed = true;
    saveStats('brawl');
  }

  if (changed) {
    console.log("Migration completed - extensions removed from player names and URL-encoded names decoded");
  } else {
    console.log("Migration completed - no changes needed");
  }
};

const saveStats = (which='normal', useTestMode=null) => {
  const testMode = useTestMode !== null ? useTestMode : isTestMode;
  
  let targetFile, data;
  if (testMode) {
    targetFile = which === 'brawl' ? STATS_BRAWL_TEST_FILE : (which === 'boss' ? STATS_BOSS_TEST_FILE : STATS_TEST_FILE);
    data = which === 'brawl' ? brawlTestStore : (which === 'boss' ? bossTestStore : leaderboardTestStore);
  } else {
    targetFile = which === 'brawl' ? STATS_BRAWL_FILE : (which === 'boss' ? STATS_BOSS_FILE : STATS_FILE);
    data = which === 'brawl' ? brawlStore : (which === 'boss' ? bossStore : leaderboardStore);
  }
  
  const tempFile = targetFile + '.tmp';
  
  let retries = 3;
  while (retries > 0) {
    try {
      // Write to temp file first (atomic operation)
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf8");
      
      // Try to delete old file if it exists
      if (fs.existsSync(targetFile)) {
        try {
          fs.unlinkSync(targetFile);
        } catch (unlinkErr) {
          // File might be locked, wait and retry
          if (retries > 1) {
            retries--;
            continue;
          }
          throw unlinkErr;
        }
      }
      
      // Rename temp file to target
      fs.renameSync(tempFile, targetFile);
      return; // Success
    } catch (e) {
      retries--;
      if (retries === 0) {
        console.error(`Failed to save ${which} stats after retries:`, e.message);
        // Clean up temp file if it exists
        try {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        } catch (cleanupErr) {}
      }
    }
  }
};

loadStats();
migratePlayerNames();

// Initialize game counters based on existing games
normalGameCount = Object.keys(leaderboardStore.games || {}).length;
bossGameCount = Object.keys(bossStore.games || {}).length;
brawlGameCount = Object.keys(brawlStore.games || {}).length;

// helper: determine which store to use based on arena param, game id, or player name heuristic
const detectBossByKey = (s) => {
  try {
    const k = String(s||'').toLowerCase();
    // check for explicit markers
    if (k.includes('boss') || k.includes('superbubble-') || k.includes('super') || k.includes('bossimg')) return true;
    // check for superbubbleimg path
    if (k.includes('/superbubbleimg/')) return true;
    return false;
  } catch(e){return false}
};

const reconcileStores = () => {
  try {
    // move games from normal -> boss if any player key looks like a boss asset
    Object.keys(leaderboardStore.games || {}).forEach((gid) => {
      const g = leaderboardStore.games[gid];
      const playerKeys = Object.keys((g && g.players) || {});
      const hasBossKey = playerKeys.some(pk => detectBossByKey(pk) || detectBossByKey(g.winner));
      if (hasBossKey) {
        // ensure boss store game exists and copy
        bossStore.games[gid] = g;
        // remove from normal store
        delete leaderboardStore.games[gid];
        // move totals contributions for these players from normal -> boss (hits only)
        playerKeys.forEach(pk => {
          const normKey = normalizePlayerKey(pk);
          const pStats = (g.players && g.players[pk]) || { hits: 0, kills: 0, wins: 0 };
          // subtract from normal totals if present
          if (leaderboardStore.totals && leaderboardStore.totals[normKey]) {
            leaderboardStore.totals[normKey].hits = Math.max(0, (leaderboardStore.totals[normKey].hits || 0) - (pStats.hits || 0));
            leaderboardStore.totals[normKey].kills = Math.max(0, (leaderboardStore.totals[normKey].kills || 0) - (pStats.kills || 0));
            leaderboardStore.totals[normKey].wins = Math.max(0, (leaderboardStore.totals[normKey].wins || 0) - (pStats.wins || 0));
            // if totals become empty, leave hits (0) — we'll clean zeros later
          }
          // add to boss totals (hits only)
          const bKey = normalizePlayerKey(pk);
          if (!bossStore.totals[bKey]) bossStore.totals[bKey] = { hits: 0, games: 0 };
          bossStore.totals[bKey].hits = (bossStore.totals[bKey].hits || 0) + (pStats.hits || 0);
        });
      }
    });

    // Ensure boss store has only hits (zero kills/wins across totals and games)
    Object.keys(bossStore.totals || {}).forEach((p) => {
      // remove kills/wins properties entirely for boss totals
      delete bossStore.totals[p].kills;
      delete bossStore.totals[p].wins;
      bossStore.totals[p].hits = bossStore.totals[p].hits || 0;
      bossStore.totals[p].games = bossStore.totals[p].games || 0;
    });
    Object.keys(bossStore.games || {}).forEach((gid) => {
      const g = bossStore.games[gid];
      g.players = g.players || {};
      Object.keys(g.players).forEach((pk) => {
        // remove kills/wins from game-level boss entries as well
        delete g.players[pk].kills;
        delete g.players[pk].wins;
        g.players[pk].hits = g.players[pk].hits || 0;
      });
    });

    // persist any modifications
    saveStats('normal');
    saveStats('boss');
    saveStats('brawl');
  } catch (e) {
    console.error('Error reconciling stores', e);
  }
};

reconcileStores();

const getStoreFor = ({ arena, game, player, testMode } = {}) => {
  const useTestMode = testMode !== undefined ? testMode : isTestMode;
  
  if (arena === 'brawl') return { store: useTestMode ? brawlTestStore : brawlStore, which: 'brawl', isTest: useTestMode };
  if (arena === 'boss') return { store: useTestMode ? bossTestStore : bossStore, which: 'boss', isTest: useTestMode };
  if (arena === 'normal') return { store: useTestMode ? leaderboardTestStore : leaderboardStore, which: 'normal', isTest: useTestMode };
  // game id hint
  if (game && String(game).toLowerCase().includes('brawl')) return { store: useTestMode ? brawlTestStore : brawlStore, which: 'brawl', isTest: useTestMode };
  if (game && String(game).toLowerCase().includes('boss')) return { store: useTestMode ? bossTestStore : bossStore, which: 'boss', isTest: useTestMode };
  // player hint
  if (player && detectBossByKey(player)) return { store: useTestMode ? bossTestStore : bossStore, which: 'boss', isTest: useTestMode };
  // default to normal
  return { store: useTestMode ? leaderboardTestStore : leaderboardStore, which: 'normal', isTest: useTestMode };
};

// Get brawl totals based on mode (1v1, 1vMany, or all)
const getBrawlTotals = (mode, useTestMode = false) => {
  // Select store based on test mode
  const store = useTestMode ? brawlTestStore : brawlStore;
  // brawlStore structure: { games: {...}, totals: {...}, totals_1v1: {...}, totals_1vMany: {...} }
  if (mode === '1v1') return store.totals_1v1 || {};
  if (mode === '1vMany') return store.totals_1vMany || {};
  // 'all' or default: combine both
  const combined = {};
  const t1v1 = store.totals_1v1 || {};
  const t1vMany = store.totals_1vMany || {};
  // Merge 1v1 stats
  Object.keys(t1v1).forEach(p => {
    if (!combined[p]) combined[p] = { hits: 0, kills: 0, wins: 0, games: 0 };
    combined[p].hits += t1v1[p].hits || 0;
    combined[p].kills += t1v1[p].kills || 0;
    combined[p].wins += t1v1[p].wins || 0;
    combined[p].games += t1v1[p].games || 0;
  });
  // Merge 1vMany stats
  Object.keys(t1vMany).forEach(p => {
    if (!combined[p]) combined[p] = { hits: 0, kills: 0, wins: 0, games: 0 };
    combined[p].hits += t1vMany[p].hits || 0;
    combined[p].kills += t1vMany[p].kills || 0;
    combined[p].wins += t1vMany[p].wins || 0;
    combined[p].games += t1vMany[p].games || 0;
  });
  return combined;
};

// Helper: copy superbubble image to superimgstorage with game-specific name
// IMPORTANT: Only store images in non-test mode to avoid clutter
const storeSuperBubbleImage = (playerPath, gameId, useTestMode) => {
  // Skip image storage in test mode
  if (useTestMode) {
    console.log(`[SuperBubble Image] Skipping image storage for test mode game ${gameId}`);
    return null;
  }

  try {
    if (!playerPath) {
      console.warn(`[SuperBubble Image] No playerPath provided for game ${gameId}`);
      return null;
    }

    // Extract filename and try to find it
    let sourceFile = null;
    const dirs = [
      path.join(__dirname, 'superbubbleimg'),
      path.join(__dirname, 'bossimgs'),
      path.join(__dirname, 'images')
    ];

    console.log(`[SuperBubble Image] Searching for image matching "${playerPath}" for game ${gameId}`);

    // Search for the file in different directories
    for (const dir of dirs) {
      try {
        const files = fs.readdirSync(dir);
        const match = files.find(f => playerPath.includes(f) || playerPath.includes(f.split('.')[0]));
        if (match) {
          sourceFile = path.join(dir, match);
          console.log(`[SuperBubble Image] Found match "${match}" in ${dir}`);
          break;
        }
      } catch (readErr) {
        // Directory might not exist, skip it
      }
    }

    if (!sourceFile || !fs.existsSync(sourceFile)) {
      console.warn(`[SuperBubble Image] Could not find source file for "${playerPath}" in game ${gameId}`);
      return null;
    }

    // Create superimgstorage directory if it doesn't exist
    const storageDir = path.join(__dirname, 'superimgstorage');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
      console.log(`[SuperBubble Image] Created storage directory`);
    }

    // Copy to storage with game-specific name
    const ext = path.extname(sourceFile);
    const storageName = `game-${gameId}-superbubble${ext}`;
    const destFile = path.join(storageDir, storageName);
    fs.copyFileSync(sourceFile, destFile);

    console.log(`[SuperBubble Image] Successfully stored superbubble image as "${storageName}" for game ${gameId}`);
    return storageName;
  } catch(e) {
    console.error(`[SuperBubble Image] Failed to store superbubble image for game ${gameId}:`, e.message);
    return null;
  }
};

// POST an event: { player: string, hits?: number, kills?: number, game?: string, arena?: string, brawlMode?: string, isSuperbubble?: boolean, testMode?: boolean }
app.post("/api/stats/event", (req, res) => {
  try {
    const { player, hits = 0, kills = 0, game, arena, brawlMode, isSuperbubble, testMode } = req.body || {};
    if (!player) return res.status(400).json({ error: "player is required" });
    const pRaw = player;
    const p = normalizePlayerKey(player);
    const h = Number(hits) || 0;
    const k = Number(kills) || 0;

    // Determine test mode: use explicit testMode parameter from request, or fall back to global isTestMode
    const useTestMode = testMode !== undefined ? testMode : isTestMode;

    // Use getStoreFor to respect test mode
    const { store, which } = getStoreFor({ arena, game, player: pRaw, testMode: useTestMode });

    // update totals in selected store
    // debug: log boss events to help diagnose missing hits
  
    // For boss arena: only add to totals if NOT superbubble (superbubble only in game-level)
    // Check both the isSuperbubble flag and detectBossByKey - must be boss arena
    const isSuperBubbleEvent = which === 'boss' && (isSuperbubble === true || detectBossByKey(pRaw));
    if (!isSuperBubbleEvent) {
      // For brawl arena, use mode-specific totals
      if (which === 'brawl' && brawlMode) {
        const totalsKey = brawlMode === '1v1' ? 'totals_1v1' : 'totals_1vMany';
        if (!store[totalsKey]) store[totalsKey] = {};
        if (!store[totalsKey][p]) {
          store[totalsKey][p] = { hits: 0, kills: 0, wins: 0, games: 0 };
        }
        store[totalsKey][p].hits += h;
        store[totalsKey][p].kills += k;
      } else if (which !== 'brawl') {
        // Normal/boss arena handling
        if (!store.totals[p]) {
          if (which === 'boss') {
            store.totals[p] = { hits: 0, games: 0 };
          } else {
            store.totals[p] = { hits: 0, kills: 0, wins: 0, games: 0 };
          }
        }
        // Always record hits. For boss arena we intentionally ignore kills/wins.
        store.totals[p].hits += h;
        if (which !== 'boss') {
          store.totals[p].kills += k;
        }
      }
    }

    // update game-specific bucket if provided

    if (game) {
      const gid = String(game);
      if (!store.games[gid]) {
        // Assign game index
        let gameIndex;
        if (which === 'boss') {
          gameIndex = ++bossGameCount;
        } else if (which === 'brawl') {
          gameIndex = ++brawlGameCount;
        } else {
          gameIndex = ++normalGameCount;
        }
        store.games[gid] = { players: {}, createdAt: Date.now(), gameIndex: `game-${gameIndex}` };
        // Store brawlMode with the game if provided
        if (which === 'brawl' && brawlMode) {
          store.games[gid].brawlMode = brawlMode;
        }
      }
      // Determine if this is a superbubble entry (for boss arena only)
      // Use explicit isSuperbubble flag from frontend, or fall back to key detection
      const isSuperBubble = which === 'boss' && (isSuperbubble === true || detectBossByKey(pRaw));
      if (isSuperBubble) {
        // Record superbubble hits INSIDE players as 'superbubble' key
        if (!store.games[gid].players['superbubble']) {
          store.games[gid].players['superbubble'] = { hits: 0 };
          // Store the superbubble image on first hit (only in non-test mode)
          const sbImageName = storeSuperBubbleImage(pRaw, gid, useTestMode);
          if (sbImageName) {
            store.games[gid].players['superbubble'].image = sbImageName;
          }
        }
        store.games[gid].players['superbubble'].hits += h;
      } else {
        // Normal player entry
        const isNewPlayerInGame = !store.games[gid].players[p];
        if (!store.games[gid].players[p]) {
          if (which === 'boss') {
            store.games[gid].players[p] = { hits: 0 };
          } else {
            store.games[gid].players[p] = { hits: 0, kills: 0, wins: 0 };
          }
        }
        // Record hits for all arenas. Only record kills for non-boss arenas.
        store.games[gid].players[p].hits += h;
        if (which !== 'boss') {
          store.games[gid].players[p].kills += k;
        }
        // Increment games counter in totals when player first appears in this game
        if (isNewPlayerInGame) {
          if (which === 'brawl' && brawlMode) {
            const totalsKey = brawlMode === '1v1' ? 'totals_1v1' : 'totals_1vMany';
            if (store[totalsKey] && store[totalsKey][p]) {
              store[totalsKey][p].games = (store[totalsKey][p].games || 0) + 1;
            }
            // Store solo player for 1vMany mode (first player recorded is assumed solo)
            if (brawlMode === '1vMany' && !store.games[gid].soloPlayer) {
              store.games[gid].soloPlayer = p;
            }
          } else if (store.totals[p]) {
            store.totals[p].games = (store.totals[p].games || 0) + 1;
          }
        }
      }
    }

    saveStats(which);
    
    // Return appropriate totals based on arena type
    let playerTotals = null;
    if (which === 'brawl' && brawlMode) {
      const totalsKey = brawlMode === '1v1' ? 'totals_1v1' : 'totals_1vMany';
      playerTotals = store[totalsKey] ? store[totalsKey][p] : null;
    } else {
      playerTotals = store.totals ? store.totals[p] : null;
    }
    
    return res.json({ ok: true, player: p, totals: playerTotals, game: game || null, arena: which, brawlMode: brawlMode || null });
  } catch (e) {
    console.error("Error recording stat event", e);
    return res.status(500).json({ error: "failed to record event" });
  }
});

// Return aggregated leaderboard sorted by kills then hits
// GET aggregated leaderboard
// query params: ?game=gameId (returns game-specific), ?scope=combined (or default combined), ?brawlMode=1v1|1vMany (for brawl arena)
app.get("/api/stats", (req, res) => {
  try {
    const { game, scope, arena, brawlMode, testMode } = req.query || {};
    // IMPORTANT: Only use test mode if explicitly requested via query parameter
    // This ensures user leaderboard is NEVER affected by global test mode flag
    const useTestMode = testMode === 'true' ? true : false;
    const { store, which } = getStoreFor({ arena, game, testMode: useTestMode });
    if (game) {
      const gid = String(game);
      const g = store.games[gid];
      if (!g) return res.json([]);
        const entries = Object.keys(g.players || {})
          .filter(p => p !== 'superbubble') // Exclude superbubble from leaderboard - only show in game-detail
          .map((p) => {
            const e = { player: p, ...g.players[p] };
            if (which === 'boss') { delete e.kills; delete e.wins; }
            return e;
          });
        if (which === 'boss') entries.sort((a, b) => (b.hits || 0) - (a.hits || 0));
        else entries.sort((a, b) => (b.kills !== a.kills ? b.kills - a.kills : b.hits - a.hits));
      return res.json(entries);
    }

    // For brawl arena, use mode-specific totals
    if (which === 'brawl') {
      const totals = getBrawlTotals(brawlMode, useTestMode);
      const entries = Object.keys(totals).map((p) => {
        return { player: p, ...totals[p] };
      });
      entries.sort((a, b) => (b.kills !== a.kills ? b.kills - a.kills : b.hits - a.hits));
      return res.json(entries);
    }

    // default: combined totals from selected store
    const entries = Object.keys(store.totals || {})
      .filter(p => p !== 'superbubble') // Exclude superbubble from leaderboard totals
      .map((p) => {
        const e = { player: p, ...store.totals[p] };
        if (which === 'boss') { delete e.kills; delete e.wins; }
        return e;
      });
    if (which === 'boss') entries.sort((a, b) => (b.hits || 0) - (a.hits || 0));
    else entries.sort((a, b) => (b.kills !== a.kills ? b.kills - a.kills : b.hits - a.hits));
    res.json(entries);
  } catch (e) {
    console.error("Error reading leaderboard", e);
    res.status(500).json({ error: "failed to read stats" });
  }
});

// Optional: return full game details (including superbubble if present)
app.get("/api/stats/game-detail", (req, res) => {
  try {
    const { game, arena, testMode } = req.query || {};
    if (!game) return res.status(400).json({ error: "game param required" });
    // IMPORTANT: Only use test mode if explicitly requested via query parameter
    const useTestMode = testMode === 'true' ? true : false;
    const { store, which } = getStoreFor({ arena, game: String(game), testMode: useTestMode });
    const gid = String(game);
    const g = store.games[gid];
    if (!g) return res.json({ players: {}, superbubble: null });
    
    // Return game details: players + superbubble (if present inside players)
    const result = {
      players: {},
      superbubble: null,
      createdAt: g.createdAt || null,
      winner: g.winner || null,
      brawlMode: g.brawlMode || null,
      soloPlayer: g.soloPlayer || null
    };
    
    // Map players and extract superbubble if present
    Object.keys(g.players || {}).forEach((p) => {
      if (p === 'superbubble') {
        // superbubble is inside players, extract it separately
        result.superbubble = g.players[p];
      } else {
        const e = { ...g.players[p] };
        if (which === 'boss') { delete e.kills; delete e.wins; }
        result.players[p] = e;
      }
    });
    
    res.json(result);
  } catch (e) {
    console.error("Error reading game detail", e);
    res.status(500).json({ error: "failed to read game detail" });
  }
});

// Optional: return raw store
app.get("/api/stats/raw", (req, res) => {
  // return all stores for debugging
  res.json({ normal: leaderboardStore, boss: bossStore, brawl: brawlStore });
});

// Backup all stats files to statsbackup folder with timestamp
app.post("/api/stats/backup", (req, res) => {
  try {
    const backupDir = path.join(__dirname, "statsbackup");
    
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Create timestamp for filenames
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    const backups = [];
    
    // Backup stats.json
    if (fs.existsSync(STATS_FILE)) {
      const backupPath = path.join(backupDir, `stats_${timestamp}.json`);
      fs.copyFileSync(STATS_FILE, backupPath);
      backups.push(`stats_${timestamp}.json`);
    }
    
    // Backup stats_boss.json
    if (fs.existsSync(STATS_BOSS_FILE)) {
      const backupPath = path.join(backupDir, `stats_boss_${timestamp}.json`);
      fs.copyFileSync(STATS_BOSS_FILE, backupPath);
      backups.push(`stats_boss_${timestamp}.json`);
    }
    
    // Backup stats_brawl.json
    if (fs.existsSync(STATS_BRAWL_FILE)) {
      const backupPath = path.join(backupDir, `stats_brawl_${timestamp}.json`);
      fs.copyFileSync(STATS_BRAWL_FILE, backupPath);
      backups.push(`stats_brawl_${timestamp}.json`);
    }
    
    console.log(`Stats backup created: ${backups.join(', ')}`);
    res.json({ success: true, message: `Backup created successfully`, files: backups, timestamp });
  } catch (error) {
    console.error("Backup failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test mode toggle
app.get("/api/stats/testmode", (req, res) => {
  res.json({ testMode: isTestMode });
});

app.post("/api/stats/testmode", (req, res) => {
  const { enabled } = req.body;
  isTestMode = enabled === true;
  console.log(`Test mode ${isTestMode ? 'ENABLED' : 'DISABLED'}`);
  res.json({ success: true, testMode: isTestMode });
});

// Fetch stats for test mode (user leaderboard)
app.get("/api/stats/test", (req, res) => {
  try {
    const { arena, brawlMode } = req.query;
    const { store } = getStoreFor({ arena, testMode: true });
    
    if (arena === 'boss') {
      const totals = store.totals || {};
      const rows = Object.keys(totals)
        .filter(p => p !== 'superbubble') // Exclude superbubble from boss leaderboard
        .map((p) => ({
          player: p,
          hits: totals[p].hits || 0,
        }));
      rows.sort((a, b) => b.hits - a.hits);
      return res.json(rows);
    }
    
    if (arena === 'brawl') {
      const mode = brawlMode || '';
      let totals;
      if (mode === '1v1') totals = store.totals_1v1 || {};
      else if (mode === '1vMany') totals = store.totals_1vMany || {};
      else {
        const combined = {};
        const t1v1 = store.totals_1v1 || {};
        const t1vMany = store.totals_1vMany || {};
        Object.keys(t1v1).forEach(p => {
          if (!combined[p]) combined[p] = { hits: 0, kills: 0, wins: 0 };
          combined[p].hits += t1v1[p].hits || 0;
          combined[p].kills += t1v1[p].kills || 0;
          combined[p].wins += t1v1[p].wins || 0;
        });
        Object.keys(t1vMany).forEach(p => {
          if (!combined[p]) combined[p] = { hits: 0, kills: 0, wins: 0 };
          combined[p].hits += t1vMany[p].hits || 0;
          combined[p].kills += t1vMany[p].kills || 0;
          combined[p].wins += t1vMany[p].wins || 0;
        });
        totals = combined;
      }
      
      const rows = Object.keys(totals).map((p) => ({
        player: p,
        hits: totals[p].hits || 0,
        kills: totals[p].kills || 0,
        wins: totals[p].wins || 0,
      }));
      rows.sort((a, b) => b.kills - a.kills);
      return res.json(rows);
    }
    
    // Normal arena
    const totals = store.totals || {};
    const rows = Object.keys(totals)
      .filter(p => p !== 'superbubble') // Exclude superbubble from leaderboard
      .map((p) => ({
        player: p,
        hits: totals[p].hits || 0,
        kills: totals[p].kills || 0,
        wins: totals[p].wins || 0,
      }));
    rows.sort((a, b) => b.kills - a.kills);
    res.json(rows);
  } catch (e) {
    console.error("Failed to fetch test stats", e);
    res.status(500).json({ error: e.message });
  }
});

// Reset all test stats (admin only)
app.delete("/api/stats/test/reset", (req, res) => {
  try {
    leaderboardTestStore = { games: {}, totals: {} };
    bossTestStore = { games: {}, totals: {} };
    brawlTestStore = { games: {}, totals_1v1: {}, totals_1vMany: {} };
    saveStats('normal', true);
    saveStats('boss', true);
    saveStats('brawl', true);
    console.log('Test stats reset successfully');
    res.json({ ok: true, message: 'All test stats cleared' });
  } catch (e) {
    console.error("Failed to reset test stats", e);
    res.status(500).json({ error: e.message });
  }
});

// Return list of games (ids + createdAt + winner)
app.get("/api/stats/games", (req, res) => {
  try {
    const { arena, testMode } = req.query || {};
    // IMPORTANT: Only use test mode if explicitly requested via query parameter
    // This ensures user leaderboard is NEVER affected by global test mode flag
    const useTestMode = testMode === 'true' ? true : false;
    const { store } = getStoreFor({ arena, testMode: useTestMode });
    const games = Object.keys(store.games || {}).map((gid) => {
      const g = store.games[gid];
      return {
        gameIndex: g.gameIndex || null,
        id: gid,
        createdAt: g.createdAt || null,
        winner: g.winner || null,
        brawlMode: g.brawlMode || null,
        soloPlayer: g.soloPlayer || null
      };
    });
    res.json(games);
  } catch (e) {
    console.error("Error reading games list", e);
    res.status(500).json({ error: "failed to read games" });
  }
});

// set winner for a game: { game, player, arena, brawlMode, teamMembers }
app.post("/api/stats/winner", (req, res) => {
  try {
    const { game, player, arena, brawlMode, teamMembers, testMode } = req.body || {};
    if (!game || !player) return res.status(400).json({ error: "game and player are required" });

    // Determine test mode: use explicit testMode parameter from request, or fall back to global isTestMode
    const useTestMode = testMode !== undefined ? testMode : isTestMode;

    // Skip recording draw - just mark the game
    const pKey = normalizePlayerKey(player);
    if (pKey === 'draw') {
      const { store, which } = getStoreFor({ arena, game, player, testMode: useTestMode });
      if (!store.games[game]) {
        // Assign game index
        let gameIndex;
        if (which === 'boss') {
          gameIndex = ++bossGameCount;
        } else if (which === 'brawl') {
          gameIndex = ++brawlGameCount;
        } else {
          gameIndex = ++normalGameCount;
        }
        store.games[game] = { players: {}, createdAt: Date.now(), gameIndex: `game-${gameIndex}` };
        if (which === 'brawl' && brawlMode) {
          store.games[game].brawlMode = brawlMode;
        }
      }
      store.games[game].winner = 'draw';
      saveStats(which, useTestMode);
      return res.json({ ok: true, game, winner: 'draw', arena: which });
    }

    const gid = String(game);
    const { store, which } = getStoreFor({ arena, game, player, testMode: useTestMode });
    if (!store.games[gid]) {
      // Assign game index
      let gameIndex;
      if (which === 'boss') {
        gameIndex = ++bossGameCount;
      } else if (which === 'brawl') {
        gameIndex = ++brawlGameCount;
      } else {
        gameIndex = ++normalGameCount;
      }
      store.games[gid] = { players: {}, createdAt: Date.now(), gameIndex: `game-${gameIndex}` };
      // Store brawlMode with the game if provided
      if (which === 'brawl' && brawlMode) {
        store.games[gid].brawlMode = brawlMode;
      }
    }
    store.games[gid].winner = pKey;
    
    // Handle team wins - give +1 win to all team members
    if (pKey === 'team' && teamMembers && Array.isArray(teamMembers) && which === 'brawl' && brawlMode) {
      const totalsKey = brawlMode === '1v1' ? 'totals_1v1' : 'totals_1vMany';
      if (!store[totalsKey]) store[totalsKey] = {};
      
      for (const member of teamMembers) {
        const memberKey = normalizePlayerKey(member);
        // Create game entry if needed
        if (!store.games[gid].players[memberKey]) {
          store.games[gid].players[memberKey] = { hits: 0, kills: 0, wins: 0 };
        }
        store.games[gid].players[memberKey].wins = (store.games[gid].players[memberKey].wins || 0) + 1;
        
        // Update totals
        if (!store[totalsKey][memberKey]) store[totalsKey][memberKey] = { hits: 0, kills: 0, wins: 0, games: 0 };
        store[totalsKey][memberKey].wins = (store[totalsKey][memberKey].wins || 0) + 1;
      }
    }
    // Handle "team" wins in boss arena (normals beat superbubble) - don't record "team" in totals
    else if (pKey === 'team' && which === 'boss') {
      // Just store the winner in the game but don't add to totals
      // The individual normal players already have their hits recorded
    }
    // Handle special winners (superbubble)
    else if (pKey === 'superbubble') {
      // Don't increment wins for superbubble
    }
    // Handle regular player wins
    else {
      // For regular players, create entry if needed
      if (!store.games[gid].players[pKey]) {
        if (which === 'boss') {
          store.games[gid].players[pKey] = { hits: 0 };
        } else {
          store.games[gid].players[pKey] = { hits: 0, kills: 0, wins: 0 };
        }
      }
      if (which !== 'boss') {
        store.games[gid].players[pKey].wins = (store.games[gid].players[pKey].wins || 0) + 1;
        // For brawl arena, update mode-specific totals
        if (which === 'brawl' && brawlMode) {
          const totalsKey = brawlMode === '1v1' ? 'totals_1v1' : 'totals_1vMany';
          if (!store[totalsKey]) store[totalsKey] = {};
          if (!store[totalsKey][pKey]) store[totalsKey][pKey] = { hits: 0, kills: 0, wins: 0, games: 0 };
          store[totalsKey][pKey].wins = (store[totalsKey][pKey].wins || 0) + 1;
        } else if (which !== 'brawl') {
          if (!store.totals[pKey]) store.totals[pKey] = { hits: 0, kills: 0, wins: 0, games: 0 };
          store.totals[pKey].wins = (store.totals[pKey].wins || 0) + 1;
        }
      } else {
        if (!store.totals[pKey]) store.totals[pKey] = { hits: 0, games: 0 };
      }
    }

    saveStats(which, useTestMode);
    res.json({ ok: true, game: gid, winner: pKey, arena: which, brawlMode: brawlMode || null });
  } catch (e) {
    console.error("Error setting winner", e);
    res.status(500).json({ error: "failed to set winner" });
  }
});

// Optional: reset leaderboard
app.delete("/api/stats", (req, res) => {
  const { arena, testMode } = req.query || {};
  const useTestMode = testMode === 'true';
  if (arena === 'boss') {
    if (useTestMode) {
      bossTestStore = { games: {}, totals: {} };
      saveStats('boss', true);
    } else {
      bossStore = { games: {}, totals: {} };
      saveStats('boss', false);
    }
    return res.json({ ok: true, arena: 'boss', testMode: useTestMode });
  }
  if (arena === 'brawl') {
    if (useTestMode) {
      brawlTestStore = { games: {}, totals_1v1: {}, totals_1vMany: {} };
      saveStats('brawl', true);
    } else {
      brawlStore = { games: {}, totals_1v1: {}, totals_1vMany: {} };
      saveStats('brawl', false);
    }
    return res.json({ ok: true, arena: 'brawl', testMode: useTestMode });
  }
  if (useTestMode) {
    leaderboardTestStore = { games: {}, totals: {} };
    saveStats('normal', true);
  } else {
    leaderboardStore = { games: {}, totals: {} };
    saveStats('normal', false);
  }
  res.json({ ok: true, arena: 'normal', testMode: useTestMode });
});

// Delete specific player from leaderboard
app.delete("/api/stats/player", (req, res) => {
  const { player, arena, brawlMode, testMode } = req.query || {};
  if (!player) return res.status(400).json({ error: "player required" });
  
  const useTestMode = testMode === 'true';
  const { store, which } = getStoreFor({ arena, testMode: useTestMode });
  
  // Try both the raw player name and normalized version
  const playerKey = normalizePlayerKey(player);
  const rawPlayer = String(player);
  
  console.log(`DELETE player request: raw="${rawPlayer}", normalized="${playerKey}", arena="${which}", brawlMode="${brawlMode}"`);
  
  let deleted = false;
  
  // For brawl arena, delete from mode-specific totals
  if (which === 'brawl') {
    if (brawlMode === '1v1' || !brawlMode) {
      if (store.totals_1v1 && store.totals_1v1[playerKey]) {
        delete store.totals_1v1[playerKey];
        deleted = true;
      }
      if (store.totals_1v1 && store.totals_1v1[rawPlayer] && rawPlayer !== playerKey) {
        delete store.totals_1v1[rawPlayer];
        deleted = true;
      }
    }
    if (brawlMode === '1vMany' || !brawlMode) {
      if (store.totals_1vMany && store.totals_1vMany[playerKey]) {
        delete store.totals_1vMany[playerKey];
        deleted = true;
      }
      if (store.totals_1vMany && store.totals_1vMany[rawPlayer] && rawPlayer !== playerKey) {
        delete store.totals_1vMany[rawPlayer];
        deleted = true;
      }
    }
  } else {
    // Remove from totals - try both keys
    if (store.totals && store.totals[playerKey]) {
      delete store.totals[playerKey];
      deleted = true;
    }
    if (store.totals && store.totals[rawPlayer] && rawPlayer !== playerKey) {
      delete store.totals[rawPlayer];
      deleted = true;
    }
  }
  
  // Remove from all games - try both keys (filter by brawlMode if specified)
  if (store.games) {
    Object.keys(store.games).forEach(gameId => {
      const game = store.games[gameId];
      // For brawl, optionally filter by brawlMode
      if (which === 'brawl' && brawlMode && game.brawlMode !== brawlMode) {
        return; // Skip games that don't match the mode
      }
      if (game.players) {
        if (game.players[playerKey]) {
          delete game.players[playerKey];
          deleted = true;
        }
        if (game.players[rawPlayer] && rawPlayer !== playerKey) {
          delete game.players[rawPlayer];
          deleted = true;
        }
      }
    });
  }
  
  if (deleted) {
    saveStats(which, useTestMode);
    console.log(`Successfully deleted player: ${playerKey}`);
  } else {
    console.log(`Player not found: ${playerKey}`);
  }
  
  res.json({ ok: true, player: playerKey, deleted });
});

// Delete specific game from leaderboard
app.delete("/api/stats/game", (req, res) => {
  const { game, arena, testMode } = req.query || {};
  if (!game) return res.status(400).json({ error: "game required" });
  
  const useTestMode = testMode === 'true';
  const { store, which } = getStoreFor({ arena, testMode: useTestMode });
  
  if (store.games && store.games[game]) {
    // Get all players from this game
    const gamePlayers = store.games[game].players || {};
    
    // Subtract game stats from totals
    Object.keys(gamePlayers).forEach(playerKey => {
      const gameStats = gamePlayers[playerKey];
      if (store.totals && store.totals[playerKey]) {
        const total = store.totals[playerKey];
        total.hits = Math.max(0, (total.hits || 0) - (gameStats.hits || 0));
        if (which !== 'boss') {
          total.kills = Math.max(0, (total.kills || 0) - (gameStats.kills || 0));
          total.wins = Math.max(0, (total.wins || 0) - (gameStats.wins || 0));
        }
        total.games = Math.max(0, (total.games || 0) - 1);
        
        // Remove player from totals if all stats are 0
        const shouldDelete = which === 'boss' 
          ? (total.hits === 0 && total.games === 0)
          : (total.kills === 0 && total.hits === 0 && total.wins === 0 && total.games === 0);
        if (shouldDelete) {
          delete store.totals[playerKey];
        }
      }
    });
    
    // Delete the game
    delete store.games[game];
  }
  
  saveStats(which, useTestMode);
  res.json({ ok: true, game });
});

// Normal images - returns base names without extensions
app.get("/api/images", (req, res) => {
  const imagesDir = path.join(__dirname, "images");
  fs.readdir(imagesDir, (err, files) => {
    if (err) return res.status(500).json({ error: "Failed to read images" });
    // Return just the base names without extensions
    const imageNames = files
      .filter(f => !fs.statSync(path.join(imagesDir, f)).isDirectory())
      .map(file => path.parse(file).name);
    res.json(imageNames);
  });
});
app.use("/images", express.static(path.join(__dirname, "images")));

// Boss images (normal bubbles) - returns base names without extensions
app.get("/api/bossimgs", (req, res) => {
  const bossImgsDir = path.join(__dirname, "bossimgs");
  fs.readdir(bossImgsDir, (err, files) => {
    if (err) return res.status(500).json({ error: "Failed to read boss images" });
    // Return just the base names without extensions
    const imageNames = files
      .filter(f => !fs.statSync(path.join(bossImgsDir, f)).isDirectory())
      .map(file => path.parse(file).name);
    res.json(imageNames);
  });
});
app.use("/bossimgs", express.static(path.join(__dirname, "bossimgs")));

// Super bubble images - returns base names without extensions
app.get("/api/superbubbleimg", (req, res) => {
  const superBubbleDir = path.join(__dirname, "superbubbleimg");
  fs.readdir(superBubbleDir, (err, files) => {
    if (err)
      return res.status(500).json({ error: "Failed to read superbubble images" });
    const imageNames = files
      .filter(f => !fs.statSync(path.join(superBubbleDir, f)).isDirectory())
      .map(file => path.parse(file).name);
    res.json(imageNames);
  });
});
app.use("/superbubbleimg", express.static(path.join(__dirname, "superbubbleimg")));

// Brawl 1v1 images - returns base names without extensions
app.get("/api/brawl1v1imgs", (req, res) => {
  const brawl1v1Dir = path.join(__dirname, "solo_brawls");
  fs.readdir(brawl1v1Dir, (err, files) => {
    if (err) return res.status(500).json({ error: "Failed to read brawl 1v1 images" });
    const imageNames = files
      .filter(f => !fs.statSync(path.join(brawl1v1Dir, f)).isDirectory())
      .map(file => path.parse(file).name);
    res.json(imageNames);
  });
});
app.use("/solo_brawls", express.static(path.join(__dirname, "solo_brawls")));

// Brawl 1vMany images - returns base names without extensions
app.get("/api/brawlmanyimgs", (req, res) => {
  const brawlManyDir = path.join(__dirname, "solo_brawls", "solovsmany");
  fs.readdir(brawlManyDir, (err, files) => {
    if (err) return res.status(500).json({ error: "Failed to read brawl many images" });
    const imageNames = files
      .filter(f => !fs.statSync(path.join(brawlManyDir, f)).isDirectory())
      .map(file => path.parse(file).name);
    res.json(imageNames);
  });
});
app.use("/solo_brawls/solovsmany", express.static(path.join(__dirname, "solo_brawls", "solovsmany")));

if (require.main === module) app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Serve a simple standalone leaderboard HTML on the server port
app.get("/leaderboard", (req, res) => {
  res.sendFile(path.join(__dirname, "leaderboard.html"));
});

// Public user-facing leaderboard (limited controls)
app.get("/leaderboard/user", (req, res) => {
  res.sendFile(path.join(__dirname, "leaderboard_user.html"));
});

// Test leaderboard (shows test stats)
app.get("/leaderboard/test", (req, res) => {
  res.sendFile(path.join(__dirname, "leaderboard_user_test.html"));
});

module.exports = app;
