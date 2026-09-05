# ProjectR: Three-Game Sports Arena Platform

## Purpose

ProjectR is a parent folder containing three independent React/Vite games with separate Express backends:

1. **Bubblebash**: configurable bubble combat arenas.
2. **IPL Cricket**: a playable IPL cricket match simulator.
3. **Football**: a World Cup-style football team, squad, formation, and AI match simulator.

The games share a workspace but do not share simulation state. Each game owns its client, server, assets, persistent files, and API port.

## Important Safety Rule

The core game logic is already working and must be treated as protected:

- Do not rewrite physics, collision detection, AI decision code, innings rules, score calculations, winner logic, timers, or API payload shapes while improving presentation.
- UI improvements should normally be limited to CSS, layout wrappers, visual components, canvas framing, responsive rules, and non-behavioral labels.
- Do not rename game state variables or alter routes unless the task explicitly requires it.
- Do not move persistent JSON files without updating the owning server's `__dirname`-relative paths.

---

## Repository Layout

```text
projectR/
├── README.md
├── package.json                 # descriptive parent package; no shared runtime
├── manifest/
│   └── games.json               # app registry, ports, and entry files
├── common/                      # reserved for future shared contracts only
└── apps/
    ├── bubblebash/
    │   ├── client/
    │   └── server/
    ├── ipl-cricket/
    │   ├── client/
    │   └── server/
    └── football/
        ├── client/
        └── server/
```

### Runtime Ports

| Game | Client dev server | Backend | Main client entry |
|---|---:|---:|---|
| Bubblebash | `5173` | `5000` | `apps/bubblebash/client/src/pages/ArenaPage.tsx` |
| IPL Cricket | `5174` | `5001` | `apps/ipl-cricket/client/src/pages/CricketPage.tsx` |
| Football | `5175` | `5002` | `apps/football/client/src/football/pages/FootballPage.tsx` |

Each backend accepts `PORT` from the environment and otherwise uses its assigned default.

---

# 1. Bubblebash

## Product Concept

Bubblebash is a high-volume canvas battle. Image-based bubbles move inside configurable arena shapes, collide, receive damage, use powers, trigger hazards, and eventually produce a winner.

The screen is organized as:

- Full-screen arena canvas/game surface.
- Right-side control drawer.
- Right-side live leaderboard.
- Settings and play controls.
- Winner overlay/modal.

## Current Visual Language

The current base UI is dark and utilitarian:

- Page background: `#111` or `#121212`.
- Arena background: near-black `rgba(8, 8, 8, 0.942)`.
- Generic panels: `#222`.
- Primary button color: purple `#6200ea`.
- Hover purple: `#3700b3` / `#5d00a0`.
- Accent border/reference purple: `#bb86fc`.
- Play button: green / dark green.
- Leaderboard background: near-black with translucent blur.
- Winner border: gold.
- Default font: system UI.

### Main Dimensions

- Root page: `100vw × 100vh`.
- Arena: approximately `100vw × 95vh`.
- Arena container: full available width and height.
- Arena-to-leaderboard flex ratio: approximately `16 : 2.25`.
- Leaderboard avatars: `30 × 30px`.
- Winner bubble: `150 × 150px`, gold border.
- Control drawer: `12rem` wide by default.

These dimensions are presentation defaults. The simulation should continue using its own measured canvas dimensions.

## Client Routes

```text
/        LoginPage
/menu    MenuPage
/arena   ArenaPage
*        redirects to /
```

## User Flow

```text
Login
  -> Menu
      -> Arena
          -> Select arena type
              -> Select shape and settings
                  -> Start game
                      -> Live simulation
                          -> Winner overlay
```

The actual ArenaPage supports multiple internal modes:

### Normal Arena

- Many independent bubbles.
- Bubbles move and collide.
- Health decreases from collision, spikes, blades, and powers.
- Last surviving bubble wins.
- Uses normal image assets and normal leaderboard stats.

### Boss Arena

- Normal bubbles fight a special superbubble.
- Superbubble has separate health and power behavior.
- Projectiles and power assignments are configurable.
- Normal bubbles may use player powers depending on configuration.
- Winner is either the superbubble or the remaining normal team.

### Brawl Arena

Two brawl modes exist:

- `1v1`: two bubble players fight.
- `1vMany`: one solo bubble fights a group/team.

Brawl-specific state includes team ownership, solo image, many-member images, power assignment mode, projectile settings, and brawl winner credit.

## Arena Shapes

The ArenaPage defines these shape identifiers:

```text
rectangle
circle
hexagon
hourglass
diamond
cross
pentagon
spiral
funnel
wave
```

Each shape affects boundaries, spike placement, collision behavior, and spawn positions.

## Combat Systems

### Bubble State

A bubble typically contains:

- `x`, `y`
- radius and target radius
- health
- image source/name
- velocity `vx`, `vy`
- numeric id

### Hazards

- Spikes placed along arena boundaries.
- Rotating blades assigned to bubbles.
- Collision damage.
- Projectile damage.
- Optional automatic activation delays and active durations.

### Powers

The catalogue includes classic weapons, original powers, anime powers, Marvel powers, DC powers, Dragon Ball powers, Naruto powers, One Piece powers, Bleach powers, My Hero Academia powers, and other named powers.

Power examples:

```text
missile, bomb, rocket, laser, grenade, flame, shuriken,
kamehameha, rasengan, spirit_bomb, heat_vision, final_flash,
getsuga_tensho, one_for_all, atomic_breath, dimension_rift
```

Each power has a display name and damage value. Visual motion families include flicker, pulse, spin, surge, and float.

### Performance Design

- Uses refs and typed arrays for high-frequency simulation state.
- Uses canvas rendering for bubbles and projectiles.
- Uses workers for image/texture processing in the current client.
- Limits active projectiles.
- Uses indexed removal/death queues in high-volume modes.
- UI snapshots are separated from the high-frequency simulation loop.

## Bubblebash Backend

Server file:

```text
apps/bubblebash/server/index.js
```

Persistent storage is backend-local and resolved with `__dirname`:

```text
stats.json
stats_boss.json
stats_brawl.json
stats_test.json
stats_boss_test.json
stats_brawl_test.json
statsbackup/
images/
bossimgs/
leaderboardimgs/
superbubbleimg/
superimgstorage/
solo_brawls/
```

Important API groups:

```text
GET  /api/images
GET  /api/bossimgs
GET  /api/superbubbleimg
GET  /api/brawl1v1imgs
GET  /api/brawlmanyimgs
GET  /api/images/:name
GET  /api/bossimgs/:name
GET  /api/brawlimgs/:name
GET  /api/superbubbleimg/:name

POST /api/stats/event
POST /api/stats/winner
GET  /api/stats
GET  /api/stats/game-detail
GET  /api/stats/games
GET  /api/stats/raw
GET  /api/stats/testmode
POST /api/stats/testmode
POST /api/stats/backup
DELETE /api/stats
DELETE /api/stats/player
DELETE /api/stats/game
DELETE /api/stats/test/reset

GET  /leaderboard
GET  /leaderboard/user
GET  /leaderboard/test
```

The server normalizes player identifiers by removing URL prefixes, paths, and image extensions before storing stats.

---

# 2. IPL Cricket

## Product Concept

IPL Cricket is a full cricket match simulator presented through bubble/ball arena interactions. The user selects two IPL teams, chooses squads and impact players, configures match conditions, watches two innings, and receives a scorecard, result, Player of the Match, and tournament standings.

## Current Visual Language

The current shared base styling is dark and compact:

- Page background: `#121212`.
- Generic arena gradient: `#1f1f2e` to `#3a3a5e`.
- Arena border reference: `#bb86fc`.
- Buttons: purple `#6200ea` with darker hover `#3700b3`.
- Text: white with gray secondary labels.
- Cricket accent colors in inline UI: gold `#ffd700` / `#ffd54f`, green `#4caf50`, blue rain/DLS `#42a5f5`, orange weather/config accents.
- Team logos come from backend-served image files.
- Default font is system UI.

The CricketPage is visually dense and uses many inline styles because it combines team selection, squad configuration, match HUD, scorecard, standings, and admin/test controls in one module.

## Main Dimensions

The exact match layout is dynamically measured, but the design uses:

- Full viewport page.
- Flexible left/main arena and right/side information panels.
- Compact controls with small labels and sliders.
- Bubble radius approximately `50px`.
- Cricket ball radius approximately `14px`.
- Canvas/arena dimensions are measured from the parent container.
- Simulation tick target: `30ms`.

## Client Routes

```text
/        LoginPage
/menu    MenuPage
/cricket CricketPage
```

## User Flow

```text
Login
  -> IPL Cricket menu
      -> Select two teams
          -> Select playing XI for each team
              -> Configure impact players
                  -> Configure overs and rain/interruption settings
                      -> Toss
                          -> Innings 1
                              -> Innings 2 target chase
                                  -> Optional super over
                                      -> Winner
                                          -> Scorecard
                                              -> Player of Match
                                                  -> Tournament table/actions
```

## Team and Squad System

Data source:

```text
apps/ipl-cricket/client/src/data/iplTeams.ts
```

Each IPL team includes:

- id and short name
- primary/secondary/text colors
- captain
- player squad
- role metadata
- overseas status

Player roles:

```text
batsman
bowler
all-rounder
wicket-keeper
```

The user selects two teams and playing XIs. Impact-player configuration includes:

- impact player
- batting position
- player to replace
- trigger over
- innings availability
- can bat
- can bowl

## Match Logic

The CricketPage contains the match state machine and arena mechanics.

### Match State

- innings `1` or `2`
- balls in current over
- current over
- target score
- completion state
- winner and win margin
- Player of the Match
- scorecard phase
- first innings score
- current-over balls
- super-over state

### Match Constants

```text
20 maximum overs by default
6 balls per over
10 maximum wickets
30ms simulation tick
700ms ball spawn interval
8s normal ball lifetime
2.5s special-ball lifetime
1 super-over over
2 super-over wickets
```

### Ball Outcomes

Normal scoring includes:

```text
0, 1, 2, 3, 4, 6, wicket/out
```

Special balls include:

```text
wide
no-ball
hit-wicket
```

Ball outcomes are influenced by:

- batting ability
- bowling ability
- distance zone: near, mid, far
- over phase
- wickets lost
- boundary toggle and weighting
- out toggle and weighting
- dot-ball toggle and weighting
- boundary/out/dot adjustment sliders

### DLS

The game includes a DLS-style resource table and calculations for:

- resource remaining
- resource used
- par score
- revised target after interruptions

Rain can be configured before or during innings with interruption count and timing options.

### Persistent Tournament Standings

Client localStorage keys:

```text
ipl_brawl_tournament_main
ipl_brawl_tournament_test
```

Standings contain:

- played
- won/lost/tied
- runs scored/conceded
- overs played/bowled
- points
- net run rate calculation

The server is also used to synchronize standings and match history.

## IPL Cricket Backend

Server file:

```text
apps/ipl-cricket/server/index.js
```

Default backend port: `5001`.

Backend-local data files:

```text
cricket_matches_main.json
cricket_matches_test.json
cricket_standings_main.json
cricket_standings_test.json
cricket_live_stats.json
stats_brawl.json
images/team logos/
```

Important API groups:

```text
GET  /images/*
GET  /api/cricket/testmode
POST /api/cricket/testmode

POST /api/cricket/match
GET  /api/cricket/matches?mode=main|test

POST /api/cricket/standings
GET  /api/cricket/standings?mode=main|test
DELETE /api/cricket/standings

POST /api/cricket/livestats
GET  /api/cricket/livestats
DELETE /api/cricket/livestats

DELETE /api/cricket/matches
DELETE /api/cricket/clear/main
DELETE /api/cricket/clear/test
DELETE /api/cricket/clear/both
POST /api/cricket/backup
```

The server also retains compatibility stats/commentary endpoints inherited from the extracted project. The active Cricket client primarily uses the cricket-specific endpoints above.

---

# 3. Football

## Product Concept

Football is a team-selection and AI-driven match simulator using player bubbles on a football pitch. The user selects two national teams, builds an XI for each, selects formations, and watches an accelerated match with passing, dribbling, possession, shooting, fouls, cards, goals, penalties, and optional shootouts.

## Current Visual Language

The current Football UI is more expressive than the other two apps:

- Page background: dark blue/charcoal gradient from `#0f1419` to `#1a1e2e`.
- Primary football accent: green `#00d084` / `#00a86b`.
- Secondary accent: gold/yellow `#ffc400`.
- Panels: `#1a1e2e`, `#252b3b`, `#2a2e3e`.
- Borders: `#3a3e4e`.
- Primary buttons: green gradient.
- Secondary buttons: dark charcoal with light border.
- Cards use gradients, shadows, hover lift, perspective, shine, and 3D transforms.
- Football team cards display flags, team codes, jersey silhouettes, ratings, primary/secondary/accent colors.
- Formation cards display mini-pitch diagrams.

## Main Dimensions

Defined in `FootballArena.tsx`:

```text
pitch: 1200 × 620
margin: 70px
HUD height: 74px
canvas width: pitch width + 2 × margin
canvas height: pitch height + 2 × margin + HUD height
player radius: 17px
ball radius: 8px
goal height: 170px
goal depth: 42px
match duration: 180000ms accelerated match clock
clock speed: 1.12
physics decision timing: roughly 100–180ms
```

The football arena is rendered as a large canvas-like match surface with overlay HUD/announcement elements.

## Client Routes

```text
/          FootballPage
/football  FootballPage
*          FootballPage
```

The standalone Football app intentionally opens directly into FootballPage instead of the IPL menu.

## User Flow

```text
Team select
  -> Select HOME team
      -> Select HOME squad of exactly 11
          -> Select AWAY team
              -> Select AWAY squad of exactly 11
                  -> Select HOME formation
                      -> Select AWAY formation
                          -> Match introduction
                              -> Start match
                                  -> AI match simulation
                                      -> Full time
                                          -> Optional penalty shootout
                                              -> Result scorecard
                                                  -> Play again / menu actions
```

## Team and Player Data

Primary files:

```text
client/src/football/data/worldcup2026_complete.ts
client/src/football/types/football.ts
```

Teams contain:

- id, name, short code
- country code and flag
- primary, secondary, and accent colors
- player list
- overall, attack, defense, midfield ratings

Players contain:

- id, name, jersey
- position: `GK`, `DEF`, `MID`, `FWD`
- overall rating
- pace
- shooting
- passing
- defense
- strength
- stamina
- country code

Supported formations:

```text
4-3-3
4-4-2
4-2-3-1
3-5-2
5-3-2
3-4-3
4-5-1
4-1-4-1
5-4-1
4-2-4
```

## Football Simulation

The active match component is:

```text
client/src/football/components/FootballArena.tsx
```

### Player AI

Each player bubble tracks:

- team and player data
- position and home position
- velocity
- ball possession
- tactical intent: shape, press, support, run
- facing angle and target rotation
- AI state: idle, scan, stop, rotate, pass, dribble, shoot
- planned action
- pass target
- aerial-pass choice
- decision cooldown
- yellow/red cards

### Ball State

The ball tracks:

- position and velocity
- current holder
- target and last touch
- mode: held, pass, shot, penalty, loose
- curl and spin
- rotation
- vertical height and velocity for airborne balls

### Match Events

The match supports:

- possession changes
- passing
- dribbling
- shots and shots on target
- goals
- fouls
- yellow and red cards
- penalties
- penalty shootouts
- half-time side switching
- goal and event banners
- match commentary

### Match Dimensions and Physics

- Logical pitch: `1200 × 620`.
- Player movement is clamped inside pitch boundaries.
- Home and away sides attack opposite goals.
- The second half flips visual sides without changing the internal simulation orientation.
- Match clock is accelerated so a match completes quickly.

## Football Commentary and Audio

Client service:

```text
client/src/utils/commentaryClient.ts
```

Backend generator:

```text
server/commentaryGenerator.js
```

Commentary event types include:

```text
pass
shot
goal
penalty
goalKick
corner
throwIn
card
shootoutStart
shootoutGoal
shootoutMiss
matchEnd
dribble
decision
block
possession
nearMiss
```

Football audio assets are bundled from:

```text
client/src/football/sounds/
```

These include goal sounds, crowd/background audio, and commentary audio.

## Football Backend

Server file:

```text
apps/football/server/index.js
```

Default backend port: `5002`.

Storage:

```text
stats_brawl.json
cricket_matches_main.json          # compatibility data inherited from source project
cricket_matches_test.json
cricket_standings_main.json
cricket_standings_test.json
cricket_live_stats.json
server/commentary/                 # generated commentary files
```

Important active API group:

```text
POST /api/football/commentary/init
POST /api/football/commentary/event
GET  /api/football/commentary/file
GET  /api/football/commentary/content
POST /api/football/commentary/end
GET  /api/football/commentary/active
```

The backend also exposes compatibility brawl/stats/cricket routes because the server originated from the IPL extraction. The Football client uses the Football commentary service and local Football stats utilities.

---

# Shared Technical Architecture

All three clients use:

```text
React 19
TypeScript
Vite
React Router
CSS + Tailwind base utilities
Canvas for simulation-heavy surfaces
```

Each app has:

```text
client/src/App.tsx       route ownership
client/src/main.tsx      React mount point
client/src/index.css     global styles
client/src/App.css       app-level styles where present
server/index.js          Express backend
```

The games are intentionally independent:

- Separate ports.
- Separate asset directories.
- Separate persistent JSON files.
- Separate frontend state.
- Separate game-specific logic.

The `common/` directory is reserved for future small shared contracts only. Do not move domain rules there unless there is a deliberate migration plan.

---

# Running the Games

## Bubblebash

Terminal 1:

```powershell
cd E:\arenabrawl\projectR\apps\bubblebash\server
node index.js
```

Terminal 2:

```powershell
cd E:\arenabrawl\projectR\apps\bubblebash\client
npm run dev
```

Open:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:5000
```

## IPL Cricket

Terminal 1:

```powershell
cd E:\arenabrawl\projectR\apps\ipl-cricket\server
node index.js
```

Terminal 2:

```powershell
cd E:\arenabrawl\projectR\apps\ipl-cricket\client
npm run dev
```

Open:

```text
http://localhost:5174
```

Backend:

```text
http://localhost:5001
```

## Football

Terminal 1:

```powershell
cd E:\arenabrawl\projectR\apps\football\server
node index.js
```

Terminal 2:

```powershell
cd E:\arenabrawl\projectR\apps\football\client
npm run dev
```

Open:

```text
http://localhost:5175
```

Backend:

```text
http://localhost:5002
```

---

# Handoff Prompt for Another Model

Use this project as a three-game sports arena platform with independent apps:

- Bubblebash is a configurable bubble combat simulator. Prioritize arena readability, live leaderboard hierarchy, control-panel clarity, and high-volume visual performance.
- IPL Cricket is a dense two-innings cricket simulator. Prioritize score visibility, team identity, ball-by-ball readability, match state, standings, and scorecard presentation.
- Football is an AI match simulator. Prioritize team-selection cards, squad/formation comparison, pitch framing, score HUD, event banners, and final result presentation.

When changing UI:

1. Preserve all existing game state and simulation logic.
2. Prefer CSS and wrapper-level layout changes.
3. Keep each app’s current colors and visual identity unless intentionally redesigning that app.
4. Keep dimensions stable for canvases, boards, balls, bubbles, and HUD panels.
5. Ensure mobile and desktop layouts do not overlap or hide controls.
6. Do not change backend API payloads or persistent storage formats for a visual task.
7. Run the correct client build after every UI pass.
8. Test each backend independently on ports `5000`, `5001`, and `5002`.

The primary visual goal is a viewer-friendly broadcast experience: clear match state, strong team/player identity, readable controls, visible outcomes, and visually layered arenas without sacrificing simulation performance.
