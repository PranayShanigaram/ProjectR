const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const CommentaryGenerator = require("./commentaryGenerator");

const app = express();
const PORT = Number(process.env.PORT || 5002);

app.use(cors());
app.use(express.json());

// Serve static files for images
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/solo_brawls', express.static(path.join(__dirname, 'solo_brawls')));
app.use('/client-types', express.static(path.join(__dirname, '../client/src/types')));

// Supported image extensions
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];

// Helper function to find image file by name (without extension)
const findImageFile = (folder, baseName) => {
  const folderPath = path.join(__dirname, folder);
  if (!fs.existsSync(folderPath)) return null;
  
  const exactPath = path.join(folderPath, baseName);
  if (fs.existsSync(exactPath)) return exactPath;
  
  for (const ext of IMAGE_EXTENSIONS) {
    const filePath = path.join(folderPath, baseName + ext);
    if (fs.existsSync(filePath)) return filePath;
  }
  
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

// normalize a player identifier to the filename portion (strip URL/path and extensions)
const normalizePlayerKey = (p) => {
  try {
    let key = String(p || "");
    key = decodeURIComponent(key);
    key = key.replace(/^https?:\/\/[^\/]+\//, "").replace(/^\/+/, "");
    const parts = key.split('/');
    const fileName = parts[parts.length - 1] || String(p);
    return fileName.replace(/\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i, '');
  } catch (e) {
    return String(p);
  }
};

// Stats files
const STATS_BRAWL_FILE = path.join(__dirname, "stats_brawl.json");

// Test mode
let isTestMode = false;
let brawlGameCount = 0;

// Store: { games: {...}, totals_1v1: {...} }
let brawlStore = { games: {}, totals_1v1: {} };

const loadStats = () => {
  try {
    if (fs.existsSync(STATS_BRAWL_FILE)) {
      const raw = fs.readFileSync(STATS_BRAWL_FILE, "utf8");
      const parsed = raw ? JSON.parse(raw) : {};
      if (parsed && typeof parsed === 'object' && (parsed.games || parsed.totals_1v1)) {
        brawlStore = parsed;
        if (!brawlStore.totals_1v1) brawlStore.totals_1v1 = {};
        if (!brawlStore.games) brawlStore.games = {};
      } else {
        brawlStore = { games: {}, totals_1v1: {} };
        fs.writeFileSync(STATS_BRAWL_FILE, JSON.stringify(brawlStore, null, 2), 'utf8');
      }
    } else {
      brawlStore = { games: {}, totals_1v1: {} };
      fs.writeFileSync(STATS_BRAWL_FILE, JSON.stringify(brawlStore, null, 2), 'utf8');
    }
  } catch (e) {
    console.error("Failed to load stats files", e);
    brawlStore = { games: {}, totals_1v1: {} };
  }
};

const saveStats = () => {
  const tempFile = STATS_BRAWL_FILE + '.tmp';
  let retries = 3;
  while (retries > 0) {
    try {
      fs.writeFileSync(tempFile, JSON.stringify(brawlStore, null, 2), "utf8");
      if (fs.existsSync(STATS_BRAWL_FILE)) {
        try { fs.unlinkSync(STATS_BRAWL_FILE); } catch (unlinkErr) {
          if (retries > 1) { retries--; continue; }
          throw unlinkErr;
        }
      }
      fs.renameSync(tempFile, STATS_BRAWL_FILE);
      return;
    } catch (e) {
      retries--;
      if (retries === 0) {
        console.error("Failed to save brawl stats after retries:", e.message);
        try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch (cleanupErr) {}
      }
    }
  }
};

loadStats();
brawlGameCount = Object.keys(brawlStore.games || {}).length;

// ─── Image Endpoints ───

// 1v1 Brawl images endpoint - returns base names without extensions
app.get("/api/brawl1v1imgs", (req, res) => {
  const brawl1v1Dir = path.join(__dirname, "solo_brawls");
  if (!fs.existsSync(brawl1v1Dir)) {
    return res.json([]);
  }
  fs.readdir(brawl1v1Dir, (err, files) => {
    if (err) return res.status(500).json({ error: "Failed to read 1v1 brawl images" });
    const imageNames = files
      .filter(f => {
        const fullPath = path.join(brawl1v1Dir, f);
        return !fs.statSync(fullPath).isDirectory() && IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase());
      })
      .map(file => path.parse(file).name);
    res.json(imageNames);
  });
});

// Serve brawl image by name
app.get('/api/brawlimgs/:name', (req, res) => {
  const baseName = decodeURIComponent(req.params.name);
  
  let imagePath = findImageFile("solo_brawls/solovsmany", baseName);
  if (imagePath) return res.sendFile(imagePath);
  
  imagePath = findImageFile("solo_brawls", baseName);
  if (imagePath) return res.sendFile(imagePath);
  
  res.status(404).json({ error: `Image not found: ${baseName}` });
});

// Dynamic image serving for brawl images
app.get('/img/brawl/:name', (req, res) => {
  const decodedName = decodeURIComponent(req.params.name);
  
  let imagePath = findImageFile('solo_brawls/solovsmany', decodedName);
  if (imagePath) return res.sendFile(imagePath);
  
  imagePath = findImageFile('solo_brawls', decodedName);
  if (imagePath) return res.sendFile(imagePath);
  
  res.status(404).send('Image not found');
});

// ─── Stats Endpoints ───

// POST an event: { player, hits, kills, game, brawlMode }
app.post("/api/stats/event", (req, res) => {
  try {
    const { player, hits = 0, kills = 0, game, brawlMode } = req.body || {};
    if (!player) return res.status(400).json({ error: "player is required" });
    const p = normalizePlayerKey(player);
    const h = Number(hits) || 0;
    const k = Number(kills) || 0;

    // Update totals_1v1
    if (!brawlStore.totals_1v1[p]) {
      brawlStore.totals_1v1[p] = { hits: 0, kills: 0, wins: 0, games: 0 };
    }
    brawlStore.totals_1v1[p].hits += h;
    brawlStore.totals_1v1[p].kills += k;

    // Update game-specific bucket
    if (game) {
      const gid = String(game);
      if (!brawlStore.games[gid]) {
        const gameIndex = ++brawlGameCount;
        brawlStore.games[gid] = { players: {}, createdAt: Date.now(), gameIndex: `game-${gameIndex}`, brawlMode: brawlMode || '1v1' };
      }
      const isNewPlayerInGame = !brawlStore.games[gid].players[p];
      if (!brawlStore.games[gid].players[p]) {
        brawlStore.games[gid].players[p] = { hits: 0, kills: 0, wins: 0 };
      }
      brawlStore.games[gid].players[p].hits += h;
      brawlStore.games[gid].players[p].kills += k;
      
      if (isNewPlayerInGame && brawlStore.totals_1v1[p]) {
        brawlStore.totals_1v1[p].games = (brawlStore.totals_1v1[p].games || 0) + 1;
      }
    }

    saveStats();
    return res.json({ ok: true, player: p, totals: brawlStore.totals_1v1[p], game: game || null });
  } catch (e) {
    console.error("Error recording stat event", e);
    return res.status(500).json({ error: "failed to record event" });
  }
});

// GET leaderboard
app.get("/api/stats", (req, res) => {
  try {
    const { game } = req.query || {};
    
    if (game) {
      const gid = String(game);
      const g = brawlStore.games[gid];
      if (!g) return res.json([]);
      const entries = Object.keys(g.players || {}).map((p) => ({
        player: p, ...g.players[p]
      }));
      entries.sort((a, b) => (b.kills !== a.kills ? b.kills - a.kills : b.hits - a.hits));
      return res.json(entries);
    }

    const totals = brawlStore.totals_1v1 || {};
    const entries = Object.keys(totals).map((p) => ({
      player: p, ...totals[p]
    }));
    entries.sort((a, b) => (b.kills !== a.kills ? b.kills - a.kills : b.hits - a.hits));
    res.json(entries);
  } catch (e) {
    console.error("Error reading leaderboard", e);
    res.status(500).json({ error: "failed to read stats" });
  }
});

// GET game detail
app.get("/api/stats/game-detail", (req, res) => {
  try {
    const { game } = req.query || {};
    if (!game) return res.status(400).json({ error: "game param required" });
    const gid = String(game);
    const g = brawlStore.games[gid];
    if (!g) return res.json({ players: {} });
    
    res.json({
      players: g.players || {},
      createdAt: g.createdAt || null,
      winner: g.winner || null,
      brawlMode: g.brawlMode || '1v1',
    });
  } catch (e) {
    console.error("Error reading game detail", e);
    res.status(500).json({ error: "failed to read game detail" });
  }
});

// GET games list
app.get("/api/stats/games", (req, res) => {
  try {
    const games = Object.keys(brawlStore.games || {}).map((gid) => {
      const g = brawlStore.games[gid];
      return {
        gameIndex: g.gameIndex || null,
        id: gid,
        createdAt: g.createdAt || null,
        winner: g.winner || null,
        brawlMode: g.brawlMode || null,
      };
    });
    res.json(games);
  } catch (e) {
    console.error("Error reading games list", e);
    res.status(500).json({ error: "failed to read games" });
  }
});

// POST winner
app.post("/api/stats/winner", (req, res) => {
  try {
    const { game, player, brawlMode } = req.body || {};
    if (!game || !player) return res.status(400).json({ error: "game and player are required" });

    const pKey = normalizePlayerKey(player);
    const gid = String(game);

    if (!brawlStore.games[gid]) {
      const gameIndex = ++brawlGameCount;
      brawlStore.games[gid] = { players: {}, createdAt: Date.now(), gameIndex: `game-${gameIndex}`, brawlMode: brawlMode || '1v1' };
    }
    brawlStore.games[gid].winner = pKey;

    if (pKey !== 'draw') {
      if (!brawlStore.games[gid].players[pKey]) {
        brawlStore.games[gid].players[pKey] = { hits: 0, kills: 0, wins: 0 };
      }
      brawlStore.games[gid].players[pKey].wins = (brawlStore.games[gid].players[pKey].wins || 0) + 1;

      if (!brawlStore.totals_1v1[pKey]) brawlStore.totals_1v1[pKey] = { hits: 0, kills: 0, wins: 0, games: 0 };
      brawlStore.totals_1v1[pKey].wins = (brawlStore.totals_1v1[pKey].wins || 0) + 1;
    }

    saveStats();
    res.json({ ok: true, game: gid, winner: pKey });
  } catch (e) {
    console.error("Error setting winner", e);
    res.status(500).json({ error: "failed to set winner" });
  }
});

// GET raw store for debugging
app.get("/api/stats/raw", (req, res) => {
  res.json({ brawl: brawlStore });
});

// Test mode endpoints
app.get("/api/stats/testmode", (req, res) => {
  res.json({ testMode: isTestMode });
});

app.post("/api/stats/testmode", (req, res) => {
  const { enabled } = req.body;
  isTestMode = enabled === true;
  console.log(`Test mode ${isTestMode ? 'ENABLED' : 'DISABLED'}`);
  res.json({ success: true, testMode: isTestMode });
});

// DELETE reset stats
app.delete("/api/stats", (req, res) => {
  brawlStore = { games: {}, totals_1v1: {} };
  saveStats();
  res.json({ ok: true });
});

// DELETE specific player
app.delete("/api/stats/player", (req, res) => {
  const { player } = req.query || {};
  if (!player) return res.status(400).json({ error: "player required" });
  
  const playerKey = normalizePlayerKey(player);
  let deleted = false;
  
  if (brawlStore.totals_1v1 && brawlStore.totals_1v1[playerKey]) {
    delete brawlStore.totals_1v1[playerKey];
    deleted = true;
  }
  
  if (brawlStore.games) {
    Object.keys(brawlStore.games).forEach(gameId => {
      const game = brawlStore.games[gameId];
      if (game.players && game.players[playerKey]) {
        delete game.players[playerKey];
        deleted = true;
      }
    });
  }
  
  if (deleted) saveStats();
  res.json({ ok: true, player: playerKey, deleted });
});

// DELETE specific game
app.delete("/api/stats/game", (req, res) => {
  const { game } = req.query || {};
  if (!game) return res.status(400).json({ error: "game required" });
  
  if (brawlStore.games && brawlStore.games[game]) {
    const gamePlayers = brawlStore.games[game].players || {};
    Object.keys(gamePlayers).forEach(playerKey => {
      const gameStats = gamePlayers[playerKey];
      if (brawlStore.totals_1v1 && brawlStore.totals_1v1[playerKey]) {
        const total = brawlStore.totals_1v1[playerKey];
        total.hits = Math.max(0, (total.hits || 0) - (gameStats.hits || 0));
        total.kills = Math.max(0, (total.kills || 0) - (gameStats.kills || 0));
        total.wins = Math.max(0, (total.wins || 0) - (gameStats.wins || 0));
        total.games = Math.max(0, (total.games || 0) - 1);
        if (total.kills === 0 && total.hits === 0 && total.wins === 0 && total.games === 0) {
          delete brawlStore.totals_1v1[playerKey];
        }
      }
    });
    delete brawlStore.games[game];
    saveStats();
  }
  
  res.json({ ok: true, game });
});

/* ═══════════════════════════════════════════════════════
   CRICKET STATS — match history & points table
   ═══════════════════════════════════════════════════════ */
const CRICKET_MATCHES_MAIN = path.join(__dirname, "cricket_matches_main.json");
const CRICKET_MATCHES_TEST = path.join(__dirname, "cricket_matches_test.json");
const CRICKET_STANDINGS_MAIN = path.join(__dirname, "cricket_standings_main.json");
const CRICKET_STANDINGS_TEST = path.join(__dirname, "cricket_standings_test.json");
const CRICKET_LIVE_STATS = path.join(__dirname, "cricket_live_stats.json");

let cricketTestMode = false;

const cricketMatchesFile = () => cricketTestMode ? CRICKET_MATCHES_TEST : CRICKET_MATCHES_MAIN;
const cricketStandingsFile = () => cricketTestMode ? CRICKET_STANDINGS_TEST : CRICKET_STANDINGS_MAIN;

const loadJsonFile = (filePath, fallback) => {
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (e) { console.error("Error loading", filePath, e); }
  return fallback;
};

const saveJsonFile = (filePath, data) => {
  const tmp = filePath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, filePath);
};

// Cricket test mode
app.get("/api/cricket/testmode", (req, res) => {
  res.json({ testMode: cricketTestMode });
});

app.post("/api/cricket/testmode", (req, res) => {
  const { enabled } = req.body;
  cricketTestMode = enabled === true;
  console.log(`Cricket test mode ${cricketTestMode ? 'ENABLED' : 'DISABLED'}`);
  res.json({ success: true, testMode: cricketTestMode });
});

// Save a match result
app.post("/api/cricket/match", (req, res) => {
  try {
    const match = req.body;
    if (!match || !match.id) return res.status(400).json({ error: "match data with id required" });
    // Use mode from match data to determine correct file (not global flag)
    const isTest = match.mode === "test";
    const targetFile = isTest ? CRICKET_MATCHES_TEST : CRICKET_MATCHES_MAIN;
    const matches = loadJsonFile(targetFile, []);
    matches.push(match);
    saveJsonFile(targetFile, matches);
    console.log(`Cricket match saved (${isTest ? 'TEST' : 'MAIN'}): ${match.id}`);
    res.json({ ok: true, total: matches.length });
  } catch (e) {
    console.error("Error saving cricket match", e);
    res.status(500).json({ error: "failed to save match" });
  }
});

// Get all matches (always require explicit mode, default to "main")
app.get("/api/cricket/matches", (req, res) => {
  const mode = req.query.mode || "main";
  const file = mode === "test" ? CRICKET_MATCHES_TEST : CRICKET_MATCHES_MAIN;
  res.json(loadJsonFile(file, []));
});

// Save standings
app.post("/api/cricket/standings", (req, res) => {
  try {
    // Accept { standings, mode } or plain array for backwards compat
    let standings, mode;
    if (Array.isArray(req.body)) {
      standings = req.body;
      mode = cricketTestMode ? "test" : "main";
    } else {
      standings = req.body.standings;
      mode = req.body.mode || (cricketTestMode ? "test" : "main");
    }
    if (!Array.isArray(standings)) return res.status(400).json({ error: "standings array required" });
    const targetFile = mode === "test" ? CRICKET_STANDINGS_TEST : CRICKET_STANDINGS_MAIN;
    saveJsonFile(targetFile, standings);
    console.log(`Cricket standings saved (${mode.toUpperCase()})`);
    res.json({ ok: true });
  } catch (e) {
    console.error("Error saving cricket standings", e);
    res.status(500).json({ error: "failed to save standings" });
  }
});

// Get standings (always require explicit mode, default to "main")
app.get("/api/cricket/standings", (req, res) => {
  const mode = req.query.mode || "main";
  const file = mode === "test" ? CRICKET_STANDINGS_TEST : CRICKET_STANDINGS_MAIN;
  res.json(loadJsonFile(file, []));
});

// Live stats — save current match state periodically
app.post("/api/cricket/livestats", (req, res) => {
  try {
    const data = req.body;
    if (!data) return res.status(400).json({ error: "live stats data required" });
    saveJsonFile(CRICKET_LIVE_STATS, { ...data, updatedAt: new Date().toISOString() });
    res.json({ ok: true });
  } catch (e) {
    console.error("Error saving live stats", e);
    res.status(500).json({ error: "failed to save live stats" });
  }
});

app.get("/api/cricket/livestats", (req, res) => {
  res.json(loadJsonFile(CRICKET_LIVE_STATS, null));
});

app.delete("/api/cricket/livestats", (req, res) => {
  saveJsonFile(CRICKET_LIVE_STATS, null);
  res.json({ ok: true });
});

// Reset cricket stats — use ?mode=main|test|both (default: current mode)
app.delete("/api/cricket/matches", (req, res) => {
  const mode = req.query.mode || (cricketTestMode ? "test" : "main");
  if (mode === "both" || mode === "main") saveJsonFile(CRICKET_MATCHES_MAIN, []);
  if (mode === "both" || mode === "test") saveJsonFile(CRICKET_MATCHES_TEST, []);
  console.log(`Cricket matches cleared: ${mode}`);
  res.json({ ok: true, cleared: mode });
});

app.delete("/api/cricket/standings", (req, res) => {
  const mode = req.query.mode || (cricketTestMode ? "test" : "main");
  if (mode === "both" || mode === "main") saveJsonFile(CRICKET_STANDINGS_MAIN, []);
  if (mode === "both" || mode === "test") saveJsonFile(CRICKET_STANDINGS_TEST, []);
  console.log(`Cricket standings cleared: ${mode}`);
  res.json({ ok: true, cleared: mode });
});

// Explicit clear endpoints (no query param needed)
app.delete("/api/cricket/clear/main", (req, res) => {
  saveJsonFile(CRICKET_MATCHES_MAIN, []);
  saveJsonFile(CRICKET_STANDINGS_MAIN, []);
  console.log("Cricket MAIN stats cleared");
  res.json({ ok: true, cleared: "main" });
});

app.delete("/api/cricket/clear/test", (req, res) => {
  saveJsonFile(CRICKET_MATCHES_TEST, []);
  saveJsonFile(CRICKET_STANDINGS_TEST, []);
  console.log("Cricket TEST stats cleared");
  res.json({ ok: true, cleared: "test" });
});

app.delete("/api/cricket/clear/both", (req, res) => {
  saveJsonFile(CRICKET_MATCHES_MAIN, []);
  saveJsonFile(CRICKET_STANDINGS_MAIN, []);
  saveJsonFile(CRICKET_MATCHES_TEST, []);
  saveJsonFile(CRICKET_STANDINGS_TEST, []);
  console.log("Cricket ALL stats cleared");
  res.json({ ok: true, cleared: "both" });
});

// Backup main matches + standings to server/bkp with date stamp
app.post("/api/cricket/backup", (req, res) => {
  try {
    const bkpDir = path.join(__dirname, "bkp");
    if (!fs.existsSync(bkpDir)) fs.mkdirSync(bkpDir);
    const now = new Date();
    const stamp = now.toISOString().replace(/[T:]/g, "-").replace(/\..+/, "");
    const matchesSrc = path.join(__dirname, "cricket_matches_main.json");
    const standingsSrc = path.join(__dirname, "cricket_standings_main.json");
    const liveStatsSrc = path.join(__dirname, "cricket_live_stats.json");
    const matchesDst = path.join(bkpDir, `cricket_matches_main_${stamp}.json`);
    const standingsDst = path.join(bkpDir, `cricket_standings_main_${stamp}.json`);
    const liveStatsDst = path.join(bkpDir, `cricket_live_stats_${stamp}.json`);
    let copied = [];
    if (fs.existsSync(matchesSrc)) { fs.copyFileSync(matchesSrc, matchesDst); copied.push("matches"); }
    if (fs.existsSync(standingsSrc)) { fs.copyFileSync(standingsSrc, standingsDst); copied.push("standings"); }
    if (fs.existsSync(liveStatsSrc)) { fs.copyFileSync(liveStatsSrc, liveStatsDst); copied.push("live_stats"); }
    console.log(`Backup created: ${stamp} (${copied.join(", ")})`);
    res.json({ ok: true, stamp, copied });
  } catch (err) {
    console.error("Backup failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

if (require.main === module) app.listen(PORT, () => {
  console.log(`🚀 Football server running on http://localhost:${PORT}`);
  console.log(`📊 Brawl stats loaded: ${Object.keys(brawlStore.totals_1v1 || {}).length} players, ${Object.keys(brawlStore.games || {}).length} games`);
});

/* ═══════════════════════════════════════════════════════
   FOOTBALL COMMENTARY — Real-time match narration
   ═══════════════════════════════════════════════════════ */

// Storage for active commentary generators per match ID
const activeCommentaries = {};

// Initialize commentary session
app.post("/api/football/commentary/init", (req, res) => {
  try {
    const { matchId, homeTeam, awayTeam } = req.body;
    if (!matchId || !homeTeam || !awayTeam) {
      return res.status(400).json({ error: "matchId, homeTeam, and awayTeam required" });
    }

    // Create new commentary generator
    const commentary = new CommentaryGenerator(homeTeam, awayTeam, matchId);
    activeCommentaries[matchId] = commentary;
    
    commentary.matchStarted();
    
    const filePath = commentary.getCommentaryFile();
    console.log(`📝 Commentary initialized for match ${matchId}: ${filePath}`);
    
    res.json({ 
      ok: true, 
      matchId, 
      filePath,
      message: "Commentary session started"
    });
  } catch (e) {
    console.error("Error initializing commentary", e);
    res.status(500).json({ error: "failed to initialize commentary" });
  }
});

// Log commentary event
app.post("/api/football/commentary/event", (req, res) => {
  try {
    const { matchId, eventType, playerName, receiverName, teamName, scoreLine, shotOnTarget, cardType, shootoutScore, decision, reason, area } = req.body;
    
    if (!matchId || !eventType) {
      return res.status(400).json({ error: "matchId and eventType required" });
    }

    const commentary = activeCommentaries[matchId];
    if (!commentary) {
      return res.status(404).json({ error: "Commentary session not found for this match" });
    }

    // Handle different event types
    switch (eventType) {
      case "pass":
        commentary.passCommentary(playerName, receiverName, teamName);
        break;
      
      case "shot":
        commentary.shotCommentary(playerName, teamName, shotOnTarget === true);
        break;
      
      case "goal":
        commentary.goalCommentary(teamName, playerName, scoreLine);
        break;
      
      case "penalty":
        commentary.penaltyCommentary(teamName, playerName);
        break;
      
      case "goalKick":
        commentary.goalKickCommentary(teamName);
        break;
      
      case "corner":
        commentary.cornerCommentary(teamName);
        break;
      
      case "throwIn":
        commentary.throwInCommentary(teamName);
        break;
      
      case "card":
        commentary.cardCommentary(cardType, playerName);
        break;
      
      case "shootoutStart":
        commentary.shootoutCommentary();
        break;
      
      case "shootoutGoal":
        commentary.shootoutGoalCommentary(playerName, teamName, shootoutScore);
        break;
      
      case "shootoutMiss":
        commentary.shootoutMissCommentary(playerName, teamName, shootoutScore);
        break;
      
      case "matchEnd":
        const isShootout = shootoutScore ? true : false;
        commentary.matchEndCommentary(playerName, scoreLine, isShootout);
        break;

      case "dribble":
        commentary.dribbleCommentary(playerName, teamName);
        break;

      case "decision":
        commentary.decisionCommentary(playerName, decision, reason);
        break;

      case "block":
        commentary.blockCommentary(playerName, receiverName);
        break;

      case "possession":
        commentary.possessionCommentary(teamName, area);
        break;

      case "nearMiss":
        commentary.nearMissCommentary(playerName, teamName);
        break;
      
      default:
        return res.status(400).json({ error: `Unknown event type: ${eventType}` });
    }

    res.json({ ok: true, eventType, matchId });
  } catch (e) {
    console.error("Error logging commentary event", e);
    res.status(500).json({ error: "failed to log event" });
  }
});

// Get commentary file path for a match
app.get("/api/football/commentary/file", (req, res) => {
  try {
    const { matchId } = req.query;
    
    if (!matchId) {
      return res.status(400).json({ error: "matchId required" });
    }

    const commentary = activeCommentaries[matchId];
    if (!commentary) {
      return res.status(404).json({ error: "Commentary session not found" });
    }

    const filePath = commentary.getCommentaryFile();
    res.json({ 
      ok: true, 
      matchId, 
      filePath,
      exists: fs.existsSync(filePath)
    });
  } catch (e) {
    console.error("Error getting commentary file", e);
    res.status(500).json({ error: "failed to get file path" });
  }
});

// Get commentary content from file
app.get("/api/football/commentary/content", (req, res) => {
  try {
    const { matchId } = req.query;
    
    if (!matchId) {
      return res.status(400).json({ error: "matchId required" });
    }

    const commentary = activeCommentaries[matchId];
    if (!commentary) {
      return res.status(404).json({ error: "Commentary session not found" });
    }

    const filePath = commentary.getCommentaryFile();
    if (!fs.existsSync(filePath)) {
      return res.json({ ok: true, content: "" });
    }

    const content = fs.readFileSync(filePath, "utf8");
    res.json({ 
      ok: true, 
      matchId, 
      content,
      lines: content.split('\n').length
    });
  } catch (e) {
    console.error("Error reading commentary content", e);
    res.status(500).json({ error: "failed to read content" });
  }
});

// End commentary session
app.post("/api/football/commentary/end", (req, res) => {
  try {
    const { matchId } = req.body;
    
    if (!matchId) {
      return res.status(400).json({ error: "matchId required" });
    }

    if (activeCommentaries[matchId]) {
      const filePath = activeCommentaries[matchId].getCommentaryFile();
      delete activeCommentaries[matchId];
      console.log(`🏁 Commentary session ended for match ${matchId}`);
      res.json({ ok: true, matchId, message: "Commentary session ended" });
    } else {
      res.status(404).json({ error: "Commentary session not found" });
    }
  } catch (e) {
    console.error("Error ending commentary", e);
    res.status(500).json({ error: "failed to end session" });
  }
});

// List all active commentary sessions
app.get("/api/football/commentary/active", (req, res) => {
  try {
    const sessions = Object.keys(activeCommentaries).map(matchId => ({
      matchId,
      filePath: activeCommentaries[matchId].getCommentaryFile()
    }));
    res.json({ ok: true, sessions });
  } catch (e) {
    console.error("Error listing sessions", e);
    res.status(500).json({ error: "failed to list sessions" });
  }
});

module.exports = app;
