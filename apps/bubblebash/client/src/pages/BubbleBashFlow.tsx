import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SUPER_BUBBLE_TYPES, AVAILABLE_POWER_KEYS, ARENA_THEMES, RING_INNER_FRAC, RING_OUTER_FRAC, SHAPE_POLYGONS } from "./ArenaPage";
import { ARENA_THEME_IMAGES } from "./arenaThemeImages";
import "./BubbleBashFlow.css";
import "./BubbleBashFlowRedesign.css";
import "./BubbleBashAvatarFix.css";

type Step = "home" | "join" | "avatar" | "powers" | "review" | "waiting" | "mode" | "theme" | "shape" | "arena" | "players" | "create-review";
type FlowMode = "normal" | "boss" | "duel" | "many";
type SourceMode = "catalog" | "upload";
type Power = { key: string; name: string; damage: number; price: number };
type PlayerEntry = {
  name: string;
  avatar: number;
  color: string;
  hp: number;
  powers: Array<{ key: string; name: string; price: number }>;
  imageName?: string;
  bossImageName?: string;
  role?: "boss" | "solo" | "many" | "normal";
  match?: { mode: FlowMode; arena: string } | null;
};

const modes: Array<[string, string, FlowMode]> = [
  ["Normal Arena", "Many bubbles. Last one wins.", "normal"],
  ["Boss Arena", "Fight the superbubble.", "boss"],
  ["1 vs 1", "A classic duel.", "duel"],
  ["1 vs Many", "Can you survive the horde?", "many"],
];
// [title, symbol, shapeKey] — shapeKey must match ARENA_SHAPES values in ArenaPage.
const arenas: Array<[string, string, string]> = [
  ["Square", "⬜", "square"], ["Rectangle", "▭", "rectangle"], ["Circle", "⭕", "circle"], ["Oval", "⬭", "oval"],
  ["Triangle", "🔺", "triangle"], ["Pentagon", "⬠", "pentagon"], ["Hexagon", "⬡", "hexagon"], ["Octagon", "🛑", "octagon"],
  ["Diamond", "🔷", "diamond"], ["Star", "⭐", "star"], ["Cross", "➕", "cross"], ["Heart", "❤️", "heart"],
  ["Trapezoid", "⏢", "trapezoid"], ["Parallelogram", "▰", "parallelogram"], ["Hexagram", "✡️", "hexagram"], ["Crescent", "🌙", "crescent"],
  ["Ring", "💍", "ring"], ["Rounded Square", "🔲", "rounded_square"], ["Capsule", "💊", "capsule"], ["Hourglass", "⌛", "hourglass"],
  ["Bowtie", "🎀", "bowtie"], ["Clover", "🍀", "clover"], ["Gear", "⚙️", "gear"], ["Shield", "🛡️", "shield"],
];
const avatarColors = ["red", "cyan", "green", "yellow", "purple", "white"];
const api = "http://localhost:5000";

// ---- Redesigned selection flow (Mode -> Theme -> Shape -> Gameplay) ----------
type ThemeDef = (typeof ARENA_THEMES)[number];
// Keep the redesigned selector aligned with every shape supported by ArenaPage.
const flowShapes: Array<{ key: string; name: string }> = [
  ...arenas.map(([name, , key]) => ({ key, name })),
  { key: "spiral", name: "Spiral" },
  { key: "funnel", name: "Funnel" },
  { key: "wave", name: "Wave" },
];
const modeOrder: FlowMode[] = ["normal", "boss", "duel", "many"];
const modeMeta: Record<FlowMode, { name: string; tagline: string; players: string }> = {
  normal: { name: "Normal Arena", tagline: "Free-for-all. The last bubble standing wins.", players: "2 – 24 Players" },
  boss: { name: "Boss Arena", tagline: "A team of bubbles fights one powerful superbubble.", players: "Boss + Team" },
  duel: { name: "1v1 Arena", tagline: "Two opponents, one focused duel.", players: "2 Players" },
  many: { name: "1v Many", tagline: "One hero surrounded by the horde.", players: "1 vs Many" },
};

type PreviewBubble = { x: number; y: number; size: number; color: string };
const PREVIEW_PALETTE = ["#4aa3ff", "#ff5a6b", "#42d17a", "#ffd54f", "#b06bff", "#ffffff"];
const PREVIEW_POWER_SYMBOLS = ["✦", "⚡", "✹", "✧"];
// Bubble layout that visually represents the selected mode (flat top-down).
function previewLayout(mode: FlowMode): PreviewBubble[] {
  if (mode === "duel") {
    return [
      { x: 34, y: 50, size: 58, color: "#4aa3ff" },
      { x: 66, y: 50, size: 58, color: "#ff5a6b" },
    ];
  }
  if (mode === "boss") {
    return [
      { x: 50, y: 44, size: 78, color: "#ff5a6b" },
      { x: 33, y: 62, size: 38, color: "#4aa3ff" },
      { x: 50, y: 66, size: 38, color: "#42d17a" },
      { x: 67, y: 62, size: 38, color: "#ffd54f" },
    ];
  }
  if (mode === "many") {
    const ring: PreviewBubble[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      ring.push({ x: 50 + Math.cos(a) * 20, y: 50 + Math.sin(a) * 17, size: 34, color: PREVIEW_PALETTE[i % PREVIEW_PALETTE.length] });
    }
    return [{ x: 50, y: 50, size: 54, color: "#4aa3ff" }, ...ring];
  }
  // normal: scattered free-for-all
  return [
    { x: 38, y: 40, size: 44, color: "#4aa3ff" },
    { x: 60, y: 36, size: 44, color: "#ff5a6b" },
    { x: 46, y: 56, size: 44, color: "#42d17a" },
    { x: 64, y: 60, size: 44, color: "#ffd54f" },
    { x: 33, y: 58, size: 44, color: "#b06bff" },
  ];
}

// A flat, top-down 2D arena outline for the preview (no perspective).
function ArenaShapeSVG({ shapeKey, glow }: { shapeKey: string; glow: [string, string] }) {
  const common = {
    fill: "none", stroke: glow[0], strokeWidth: 3.4, strokeLinejoin: "round" as const,
    style: { filter: `drop-shadow(0 0 5px ${glow[0]}) drop-shadow(0 0 15px ${glow[1]})` },
  };
  let node;
  const sharedPolygon = SHAPE_POLYGONS[shapeKey];
  if (sharedPolygon && shapeKey !== "ring") {
    node = <polygon points={sharedPolygon.map(([x, y]) => `${x * 100},${y * 100}`).join(" ")} {...common} />;
  }
  switch (shapeKey) {
    case "circle": node = <circle cx="50" cy="50" r="48" {...common} />; break;
    case "ring": node = <path d={`M50 2 A48 48 0 1 1 49.99 2 M50 ${50 - (RING_INNER_FRAC / RING_OUTER_FRAC) * 48} A${(RING_INNER_FRAC / RING_OUTER_FRAC) * 48} ${(RING_INNER_FRAC / RING_OUTER_FRAC) * 48} 0 1 0 50.01 ${50 - (RING_INNER_FRAC / RING_OUTER_FRAC) * 48}`} fillRule="evenodd" {...common} />; break;
    default: break;
  }
  return <svg className="bbx-shape-svg" viewBox="0 0 100 100" preserveAspectRatio="none">{node}</svg>;
}

function previewClipPath(shapeKey: string) {
  const sharedPolygon = SHAPE_POLYGONS[shapeKey];
  if (sharedPolygon) return `polygon(${sharedPolygon.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(", ")})`;
  const clips: Record<string, string> = {
    circle: "circle(50%)", oval: "ellipse(50% 48% at 50% 50%)", triangle: "polygon(50% 0,100% 100%,0 100%)",
    pentagon: "polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%)", hexagon: "polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)",
    octagon: "polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)", diamond: "polygon(50% 0,100% 50%,50% 100%,0 50%)",
    star: "polygon(50% 0,61% 35%,96% 35%,68% 56%,79% 94%,50% 72%,21% 94%,32% 56%,4% 35%,39% 35%)",
    cross: "polygon(34% 0,66% 0,66% 34%,100% 34%,100% 66%,66% 66%,66% 100%,34% 100%,34% 66%,0 66%,0 34%,34% 34%)",
    heart: "polygon(50% 18%,62% 2%,84% 3%,100% 22%,96% 48%,78% 72%,50% 100%,22% 72%,4% 48%,0 22%,16% 3%,38% 2%)",
    trapezoid: "polygon(20% 0,80% 0,100% 100%,0 100%)", parallelogram: "polygon(25% 0,100% 0,75% 100%,0 100%)",
    hexagram: "polygon(50% 0,61% 32%,94% 25%,72% 50%,94% 75%,61% 68%,50% 100%,39% 68%,6% 75%,28% 50%,6% 25%,39% 32%)",
    capsule: "inset(0 round 50%)", hourglass: "polygon(0 0,100% 0,70% 50%,100% 100%,0 100%,30% 50%)",
    bowtie: "polygon(0 0,50% 42%,100% 0,100% 100%,50% 58%,0 100%)",
    clover: "polygon(50% 27%,38% 2%,13% 5%,14% 34%,0 49%,9% 73%,34% 67%,50% 100%,66% 67%,91% 73%,100% 49%,86% 34%,87% 5%,62% 2%)",
    gear: "polygon(42% 0,58% 0,62% 14%,74% 19%,85% 12%,96% 24%,89% 35%,100% 43%,100% 57%,89% 65%,96% 76%,85% 88%,74% 81%,62% 86%,58% 100%,42% 100%,38% 86%,26% 81%,15% 88%,4% 76%,11% 65%,0 57%,0 43%,11% 35%,4% 24%,15% 12%,26% 19%,38% 14%)",
    shield: "polygon(50% 0,96% 18%,90% 64%,76% 87%,50% 100%,24% 87%,10% 64%,4% 18%)",
    funnel: "polygon(0 0,100% 0,72% 100%,28% 100%)",
    wave: "polygon(0 18%,18% 4%,36% 18%,54% 4%,72% 18%,100% 4%,100% 82%,80% 96%,62% 82%,44% 96%,26% 82%,0 96%)",
    rounded_square: "inset(0 round 15%)", spiral: "inset(0 round 6%)",
  };
  return clips[shapeKey] ?? "inset(0 round 2%)";
}

// The arena board stays transparent to the one page-level theme image. Its
// obstacles mirror the live arena vocabulary without inventing a second scene.
function ArenaPreview({ mode, theme, shapeKey }: { mode: FlowMode; theme: ThemeDef; shapeKey: string }) {
  const bubbles = previewLayout(mode);
  const powerups: Array<{ x: number; y: number; icon: string; className: string }> = [
    { x: 27, y: 27, icon: PREVIEW_POWER_SYMBOLS[0], className: "pu-power" },
    { x: 73, y: 29, icon: "♥", className: "pu-health" },
    { x: 76, y: 70, icon: PREVIEW_POWER_SYMBOLS[1], className: "pu-boost" },
    { x: 30, y: 73, icon: PREVIEW_POWER_SYMBOLS[2], className: "pu-power" },
  ];
  return (
    <div className="bbx-preview" style={{ ["--glow-primary" as string]: theme.glow[0], ["--glow-secondary" as string]: theme.glow[1], ["--arena-inside" as string]: theme.inside } as CSSProperties}>
      <div className={`bbx-board bbx-board-${shapeKey}`} style={{ clipPath: previewClipPath(shapeKey) }}>
        <div className="bbx-board-haze" />
        <div className="bbx-spikes bbx-spikes-top" />
        <div className="bbx-spikes bbx-spikes-bottom" />
        <div className="bbx-bricks brick-a"><i /><i /><i /><i /></div>
        <div className="bbx-bricks brick-b"><i /><i /><i /></div>
        <div className="bbx-sand-block sand-a"><i /><i /></div>
        <div className="bbx-zone zone-a"><span>◈</span></div>
        <div className="bbx-zone zone-b"><span>◌</span></div>
        {powerups.map((p, i) => (
          <span key={i} className={`bbx-powerup ${p.className}`} style={{ left: `${p.x}%`, top: `${p.y}%` }}>{p.icon}</span>
        ))}
        <div className="bbx-bubbles">
          {bubbles.map((b, i) => (
            <div key={i} className={`bbx-bubble b${i % 6}`} style={{ left: `${b.x}%`, top: `${b.y}%`, width: b.size, height: b.size, ["--bc" as string]: b.color } as CSSProperties}>
              <i className="bbx-health" />
              {(i === 1 || (mode === "boss" && i === 0)) && <i className="bbx-blade" />}
            </div>
          ))}
        </div>
        <ArenaShapeSVG shapeKey={shapeKey} glow={theme.glow} />
      </div>
    </div>
  );
}

type WheelItem = { key: string; label: string; sub?: string; thumb?: string };
// Enlarged-center vertical selector: the active item is large and centered,
// neighbours shrink progressively; up/down arrows and clicks move the selection.
function WheelSelector({ items, index, onIndex, accent, withThumb }: {
  items: WheelItem[]; index: number; onIndex: (i: number) => void; accent: string; withThumb?: boolean;
}) {
  const move = (d: number) => onIndex((index + d + items.length) % items.length);
  const WINDOW = 2;
  const slots = [];
  for (let d = -WINDOW; d <= WINDOW; d++) {
    const i = (index + d + items.length) % items.length;
    const it = items[i];
    slots.push(
      <div key={d} className="bbx-slot" data-dist={Math.abs(d)}>
        <button
          className={`bbx-card${d === 0 ? " selected" : ""}`}
          style={d === 0 ? ({ ["--accent" as string]: accent } as CSSProperties) : undefined}
          onClick={() => onIndex(i)}
        >
          {withThumb && it.thumb && <span className="bbx-card-thumb" style={{ backgroundImage: `url(${it.thumb})` }} />}
          <span className="bbx-card-text"><b>{it.label}</b>{it.sub && <small>{it.sub}</small>}</span>
          {d === 0 && <i className="bbx-card-check">✓</i>}
        </button>
      </div>
    );
  }
  return (
    <div className="bbx-wheel">
      <button className="bbx-arrow" onClick={() => move(-1)} aria-label="Previous">▲</button>
      <div className="bbx-wheel-track">{slots}</div>
      <button className="bbx-arrow" onClick={() => move(1)} aria-label="Next">▼</button>
    </div>
  );
}

// Shared top bar + right-side preview header for the three selection screens.
function FlowTopBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="bbx-topbar">
      <button className="bbx-back" onClick={onBack} aria-label="Back">‹</button>
      <div className="bbx-title"><b>BUBBLEBASH <span>ARENA</span></b><small>{title}</small></div>
    </div>
  );
}
function PreviewHeader({ title, badge, sub, chips, accent }: { title: string; badge: string; sub: string; chips: string[]; accent: string }) {
  return (
    <div className="bbx-preview-head">
      <div className="bbx-preview-titlerow">
        <h2 style={{ ["--accent" as string]: accent } as CSSProperties}>{title}</h2>
        <span className="bbx-badge" style={{ ["--accent" as string]: accent } as CSSProperties}>✓ {badge}</span>
      </div>
      <p>{sub}</p>
      <div className="bbx-chips">{chips.map((c) => <span key={c}>{c}</span>)}</div>
    </div>
  );
}

function BubbleMark({ variant = 0, large = false }: { variant?: number; large?: boolean }) {
  return <div className={`bb-orb bb-orb-${variant} ${large ? "bb-orb-large" : ""}`}><i /><i /></div>;
}

function Header() {
  const navigate = useNavigate();
  return <header className="bb-header"><button className="bb-brand" onClick={() => navigate("/bubblebash")}><span>◈</span> ProjectR</button><nav><button onClick={() => navigate("/")}>Home</button><button className="active">Games</button><button>Matches</button><button>Leaderboard</button><button>Shop</button></nav><button className="bb-login">Admin</button></header>;
}

function Progress({ current }: { current: number }) {
  return <div className="bb-progress">{["Mode", "Arena", "Players", "Start"].map((label, index) => <div className={index + 1 === current ? "now" : index + 1 < current ? "done" : ""} key={label}><span>{index + 1}</span><small>{label}</small></div>)}</div>;
}

export default function BubbleBashFlow() {
  const routerNavigate = useNavigate();
  const { step: rawStep } = useParams();
  const step = (rawStep || "home") as Step;
  const [avatar, setAvatar] = useState(0);
  const [color, setColor] = useState("cyan");
  const [name, setName] = useState("Player One");
  const [hp, setHp] = useState(100);
  // Shared match configuration (persists across Mode -> Theme -> Shape -> Gameplay).
  const savedFlow = (() => {
    try { return JSON.parse(sessionStorage.getItem("bubblebash.flow") || "null") as { mode?: FlowMode; theme?: string; shape?: string } | null; }
    catch { return null; }
  })();
  const [mode, setMode] = useState<FlowMode>(savedFlow?.mode || "normal");
  const [arena, setArena] = useState(0);
  const [theme, setTheme] = useState(savedFlow?.theme || "galaxy");
  const [shapeKey, setShapeKey] = useState(savedFlow?.shape || "pentagon");
  const [cart, setCart] = useState<Power[]>([]);
  const [prices] = useState<Record<string, number>>(() => AVAILABLE_POWER_KEYS.reduce((result, key) => {
    result[key] = Math.floor(10 + Math.random() * 91);
    return result;
  }, {} as Record<string, number>));
  const [sourceMode, setSourceMode] = useState<SourceMode>("catalog");
  const [availablePlayers, setAvailablePlayers] = useState<string[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [uploadedEntries, setUploadedEntries] = useState<PlayerEntry[]>([]);
  const [bossPlayer, setBossPlayer] = useState("");
  const [bossImageOptions, setBossImageOptions] = useState<string[]>([]);
  const [bossImageName, setBossImageName] = useState("");
  const [soloPlayer, setSoloPlayer] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const powers = useMemo<Power[]>(() => AVAILABLE_POWER_KEYS.map((key) => {
    const powerKey = String(key);
    const power = SUPER_BUBBLE_TYPES[powerKey];
    return { key: powerKey, name: power.name, damage: power.damage, price: prices[powerKey] };
  }), [prices]);
  const selectedMode = modes.find((item) => item[2] === mode) || modes[0];
  const selectedArena = shapeKey;
  const navigate = (path: string) => routerNavigate(path);

  // Persist the shared configuration so back/forward and reload keep selections.
  useEffect(() => {
    sessionStorage.setItem("bubblebash.flow", JSON.stringify({ mode, theme, shape: shapeKey }));
  }, [mode, theme, shapeKey]);

  // Derived selector state for the redesigned screens.
  const activeTheme: ThemeDef = ARENA_THEMES.find((t) => t.key === theme) || ARENA_THEMES[0];
  const modeIndex = Math.max(0, modeOrder.indexOf(mode));
  const themeIndex = Math.max(0, ARENA_THEMES.findIndex((t) => t.key === theme));
  const shapeIndex = Math.max(0, flowShapes.findIndex((s) => s.key === shapeKey));
  const themeBg = ARENA_THEME_IMAGES[theme];
  // Falls back to the theme's own CSS background for plain-colour themes (no uploaded image).
  // Includes size/position/repeat inline so it also works on pages without the `.bbx-flow` layout class.
  const themePageStyle: CSSProperties = themeBg
    ? { backgroundImage: `url(${themeBg})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundAttachment: "fixed" }
    : { background: activeTheme.background };

  useEffect(() => {
    if (step !== "players") return;
    const endpoint = "/api/images";
    fetch(`${api}${endpoint}`).then((response) => response.json()).then((images: string[]) => setAvailablePlayers(images)).catch(() => setError("Could not load player images."));
  }, [mode, step]);

  useEffect(() => {
    if (step !== "players" || mode !== "boss") return;
    fetch(`${api}/api/superbubbleimg`).then((response) => response.json()).then((images: string[]) => {
      setBossImageOptions(images);
      setBossImageName((current) => current || images[0] || "");
      setSelectedPlayers((current) => [...current.filter((player) => !player.startsWith("boss:")), ...images.map((image) => `boss:${image}`)]);
    }).catch(() => setError("Could not load boss images."));
  }, [mode, step]);

  useEffect(() => {
    if (mode !== "duel") return;
    setSelectedPlayers((current) => current.filter((player) => !player.startsWith("boss:")).slice(0, 2));
  }, [mode, selectedPlayers.length]);

  const entry: PlayerEntry = { name: name.trim() || "Player One", avatar, color, hp, powers: cart.map(({ key, name: powerName, price }) => ({ key, name: powerName, price })), match: { mode, arena: selectedArena } };

  const saveEntries = async (entries: PlayerEntry[]) => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${api}/api/player-entries`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entries }) });
      if (!response.ok) throw new Error("save failed");
      return true;
    } catch {
      setError("Player entry could not be saved. Check that the server is running.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const enterJoinLobby = async () => {
    if (await saveEntries([entry])) navigate("/bubblebash/waiting");
  };

  const enterCreatedArena = async () => {
    if (mode === "duel" && selectedPlayers.length !== 2 && sourceMode === "catalog") {
      setError("1 vs 1 requires exactly two selected players.");
      return;
    }
    if (mode === "many" && sourceMode === "catalog") {
      if (selectedPlayers.length < 2) {
        setError("1 vs Many requires at least two selected players.");
        return;
      }
      if (!soloPlayer || !selectedPlayers.includes(soloPlayer)) {
        setError("Choose the solo player from the selected roster.");
        return;
      }
    }
    const normalRosterPlayers = selectedPlayers.filter((player) => !player.startsWith("boss:"));
    const selectedBossImage = bossPlayer.startsWith("boss:") ? bossPlayer.slice(5) : bossImageName;
    if (mode === "boss" && (!bossPlayer || !selectedBossImage) && sourceMode === "catalog") {
      setError("Choose the normal roster and superbubble image for the boss match.");
      return;
    }
    const selected: PlayerEntry[] = sourceMode === "upload"
      ? uploadedEntries.map((item) => ({ ...item, role: mode === "boss" && item.name === bossPlayer ? "boss" : mode === "many" && item.name === soloPlayer ? "solo" : mode === "many" ? "many" : mode === "duel" ? "solo" : "normal", bossImageName: mode === "boss" && item.name === bossPlayer ? selectedBossImage : undefined, match: { mode, arena: selectedArena } }))
      : normalRosterPlayers.map((player, index) => ({ ...entry, name: player, imageName: player, avatar: index % 6, bossImageName: undefined, powers: [], role: mode === "boss" && player === bossPlayer ? "boss" : mode === "many" && player === soloPlayer ? "solo" : mode === "many" ? "many" : mode === "duel" ? "solo" : "normal", match: { mode, arena: selectedArena } }));
    if (mode === "boss" && bossPlayer.startsWith("boss:")) {
      selected.push({ ...entry, name: selectedBossImage.replace(/\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i, ""), imageName: "", bossImageName: selectedBossImage, powers: [], role: "boss", match: { mode, arena: selectedArena } });
    }
    if (!selected.length) {
      setError("Select at least one player or upload player entry JSON files.");
      return;
    }
    sessionStorage.setItem("bubblebash.match", JSON.stringify({ mode, arena: selectedArena, theme, soloPlayer: mode === "many" ? soloPlayer : undefined, players: selected }));
    navigate(`/bubblebash/game?mode=${mode}&shape=${selectedArena}&theme=${theme}&roster=custom&match=${Date.now()}`);
  };

  const togglePower = (power: Power) => setCart((current) => current.some((item) => item.key === power.key) ? current.filter((item) => item.key !== power.key) : [...current, power]);

  if (step === "home") return <div className="bubblebash-ui"><Header /><main className="bb-main"><section className="bb-home"><div className="bb-intro"><BubbleMark large /><div><h1>BUBBLEBASH</h1><p>Fast. Chaotic. Unpredictable.</p></div></div><div className="bb-menu-cards"><button className="bb-menu-primary" onClick={() => navigate("/bubblebash/mode")}><b className="bb-menu-icon plus">+</b><span><strong>Create Match</strong><small>Pick a mode, arena and players, then battle</small></span><em>›</em></button></div></section></main></div>;

  if (step === "join") return <div className="bubblebash-ui"><Header /><main className="bb-main"><section className="bb-join"><button className="bb-back" onClick={() => navigate("/bubblebash")}>←</button><h1>Join or Create Match</h1><div className="bb-tabs"><button className="active">Join Match</button><button onClick={() => navigate("/bubblebash/mode")}>Create Match</button></div><label>ENTER MATCH CODE<input placeholder="e.g. BA1024" /></label><button className="bb-small-action" onClick={() => navigate("/bubblebash/avatar")}>Join</button><h3>Upcoming Public Matches</h3>{["Community Brawl #12", "Boss Fight Night", "1 vs Many Chaos"].map((match, index) => <div className="bb-match" key={match}><BubbleMark variant={index + 1} /><span><b>{match}</b><small>{index === 1 ? "Boss Arena" : index === 2 ? "1 vs Many" : "Normal Arena"}</small></span><button onClick={() => navigate("/bubblebash/avatar")}>Join</button></div>)}</section></main></div>;

  if (step === "avatar") return <div className="bubblebash-ui"><Header /><main className="bb-main"><section className="bb-avatar"><button className="bb-back" onClick={() => navigate("/bubblebash/join")}>←</button><h1>Create Your Bubble</h1><p>Customize your fighter</p><div className="bb-avatar-stage"><button onClick={() => setAvatar((value) => (value + 5) % 6)}>‹</button><BubbleMark variant={avatar} large /><button onClick={() => setAvatar((value) => (value + 1) % 6)}>›</button></div><label>DISPLAY NAME<input value={name} onChange={(event) => setName(event.target.value)} maxLength={20} /></label><span className="bb-label">CHOOSE COLOR</span><div className="bb-colors">{avatarColors.map((item) => <button aria-label={item} className={`${item} ${color === item ? "selected" : ""}`} onClick={() => setColor(item)} key={item} />)}</div><span className="bb-label">STARTING HP</span><div className="bb-hp"><input type="range" min="1" max="100" value={hp} onChange={(event) => setHp(Number(event.target.value))} /><b>{hp}</b></div><button className="bb-primary" onClick={() => navigate("/bubblebash/powers")}>Next: Choose Powers →</button></section></main></div>;

  if (step === "powers") return <div className="bubblebash-ui"><Header /><main className="bb-main"><section className="bb-wizard bb-power-shop"><Progress current={3} /><h1>Power Shop</h1><p>Prices are randomized for local testing. Click a price to add or remove a power from your cart.</p><div className="bb-power-grid">{powers.map((power) => <article className={cart.some((item) => item.key === power.key) ? "bb-power-card selected" : "bb-power-card"} key={power.key}><span className="bb-power-icon">✦</span><div><b>{power.name}</b><small>Damage {power.damage}</small></div><button onClick={() => togglePower(power)}>{cart.some((item) => item.key === power.key) ? "Added" : `Buy ${power.price} CR`}</button></article>)}</div><div className="bb-cart-bar"><strong>{cart.length} powers selected</strong><button className="bb-primary" onClick={() => navigate("/bubblebash/review")}>Next: Review Entry →</button></div></section></main></div>;

  if (step === "review") return <div className="bubblebash-ui"><Header /><main className="bb-main"><section className="bb-wizard bb-review"><Progress current={4} /><h1>Review Player Entry</h1><div className="bb-review-card"><BubbleMark variant={avatar} large /><div><h2>{entry.name}</h2><p>{entry.color} bubble · {entry.hp} HP</p><strong>{entry.powers.length ? entry.powers.map((power) => power.name).join(", ") : "No powers purchased"}</strong></div></div><p className="bb-review-note">Your entry card will be saved as JSON and used when the battle starts.</p><button className="bb-primary" disabled={saving} onClick={enterJoinLobby}>{saving ? "Saving..." : "Enter the game →"}</button>{error && <p className="bb-error">{error}</p>}</section></main></div>;

  if (step === "waiting") return <div className="bubblebash-ui"><Header /><main className="bb-main"><section className="bb-wait"><BubbleMark large /><p>MATCH CODE · BA1024</p><h1>Joined the battle</h1><h2>Waiting for the battle to start</h2><strong>Your player entry is ready</strong><div className="bb-ready-list"><div><BubbleMark variant={avatar} /><b>{entry.name}<small>{entry.powers.length} powers equipped</small></b><em>Ready</em></div></div><small>Online battle hosting is the next integration step. This route ends here until the host starts the match.</small></section></main></div>;

  if (step === "mode") return (
    <div className="bubblebash-ui bbx-flow">
      <FlowTopBar title="CHOOSE GAME MODE" onBack={() => navigate("/bubblebash")} />
      <div className="bbx-stage">
        <div className="bbx-left">
          <WheelSelector
            items={modeOrder.map((m) => ({ key: m, label: modeMeta[m].name }))}
            index={modeIndex}
            onIndex={(i) => setMode(modeOrder[i])}
            accent="#00e0ff"
          />
          <button className="bbx-next" onClick={() => navigate("/bubblebash/theme")}>NEXT ▸</button>
        </div>
        <div className="bbx-right">
          <PreviewHeader title={modeMeta[mode].name} badge="SELECTED" sub={modeMeta[mode].tagline} chips={[modeMeta[mode].players, "Flat top-down arena"]} accent="#00e0ff" />
          <ArenaPreview mode={mode} theme={activeTheme} shapeKey={shapeKey} />
        </div>
      </div>
    </div>
  );

  if (step === "theme") return (
    <div className="bubblebash-ui bbx-flow bbx-themed" style={themePageStyle}>
      <FlowTopBar title="CHOOSE ARENA THEME" onBack={() => navigate("/bubblebash/mode")} />
      <div className="bbx-stage">
        <div className="bbx-left">
          <WheelSelector
            items={ARENA_THEMES.map((t) => ({ key: t.key, label: t.name, sub: t.description, thumb: ARENA_THEME_IMAGES[t.key] }))}
            index={themeIndex}
            onIndex={(i) => setTheme(ARENA_THEMES[i].key)}
            accent="#ffb62c"
            withThumb
          />
          <button className="bbx-next" onClick={() => navigate("/bubblebash/shape")}>NEXT ▸</button>
        </div>
        <div className="bbx-right">
          <PreviewHeader title={activeTheme.name} badge="SELECTED" sub={activeTheme.description} chips={[modeMeta[mode].name, "Works with all modes", "Dynamic environment"]} accent={activeTheme.glow[0]} />
          <ArenaPreview mode={mode} theme={activeTheme} shapeKey={shapeKey} />
        </div>
      </div>
    </div>
  );

  if (step === "shape") return (
    <div className="bubblebash-ui bbx-flow bbx-themed" style={themePageStyle}>
      <FlowTopBar title="CHOOSE ARENA SHAPE" onBack={() => navigate("/bubblebash/theme")} />
      <div className="bbx-stage">
        <div className="bbx-left">
          <WheelSelector
            items={flowShapes.map((s) => ({ key: s.key, label: s.name }))}
            index={shapeIndex}
            onIndex={(i) => setShapeKey(flowShapes[i].key)}
            accent="#7c4dff"
          />
          <button className="bbx-next" onClick={() => navigate("/bubblebash/players")}>CHOOSE PLAYERS ▸</button>
        </div>
        <div className="bbx-right">
          <PreviewHeader title={flowShapes[shapeIndex].name} badge="SELECTED" sub={`${modeMeta[mode].name} · ${activeTheme.name}`} chips={[modeMeta[mode].name, activeTheme.name, "Flat 2D · top-down"]} accent="#7c4dff" />
          <ArenaPreview mode={mode} theme={activeTheme} shapeKey={shapeKey} />
        </div>
      </div>
    </div>
  );

  if (step === "players") return <div className="bubblebash-ui bbx-themed" style={themePageStyle}><Header /><main className="bb-main"><section className="bb-wizard bb-player-source"><Progress current={3} /><h1>Choose Players</h1><p>Select the exact roster for this match.</p><div className="bb-tabs"><button className={sourceMode === "catalog" ? "active" : ""} onClick={() => setSourceMode("catalog")}>Image catalog</button><button className={sourceMode === "upload" ? "active" : ""} onClick={() => setSourceMode("upload")}>Player entry JSON</button></div>{(mode === "boss" || mode === "duel" || mode === "many") && <div className="bb-role-panel"><strong>{mode === "boss" ? "Boss player" : mode === "duel" ? "Select exactly two solo players" : "1 vs Many teams"}</strong>{mode === "boss" && <select value={bossPlayer} onChange={(event) => setBossPlayer(event.target.value)}><option value="">Choose boss from selected players</option>{(sourceMode === "upload" ? uploadedEntries.map((item) => item.name) : selectedPlayers).map((player) => <option key={player} value={player}>{player}</option>)}</select>}{mode === "many" && <select value={soloPlayer} onChange={(event) => setSoloPlayer(event.target.value)}><option value="">Choose solo player</option>{(sourceMode === "upload" ? uploadedEntries.map((item) => item.name) : selectedPlayers).map((player) => <option key={player} value={player}>{player}</option>)}</select>}</div>}{sourceMode === "catalog" ? <><div className="bb-player-actions"><button onClick={() => setSelectedPlayers(availablePlayers)}>Select all</button><button onClick={() => setSelectedPlayers(availablePlayers.length ? [availablePlayers[Math.floor(Math.random() * availablePlayers.length)]] : [])}>Random select</button><button onClick={() => setSelectedPlayers([])}>Clear</button></div><div className="bb-player-grid">{availablePlayers.map((player) => <button className={selectedPlayers.includes(player) ? "selected" : ""} onClick={() => setSelectedPlayers((current) => current.includes(player) ? current.filter((item) => item !== player) : [...current, player])} key={player}><span>{player.slice(0, 2).toUpperCase()}</span><b>{player}</b>{selectedPlayers.includes(player) && <i>✓</i>}</button>)}</div></> : <><label className="bb-upload">Upload one or more JSON entry cards<input type="file" accept="application/json,.json" multiple onChange={async (event) => { const files = Array.from(event.target.files || []); const parsed: PlayerEntry[] = []; for (const file of files) { try { const value = JSON.parse(await file.text()); if (value.name) parsed.push(value); } catch { setError(`Could not read ${file.name}`); } } setUploadedEntries(parsed); }} /></label><div className="bb-upload-list">{uploadedEntries.map((item) => <span key={item.name}>{item.name} · {item.powers?.length || 0} powers</span>)}</div></>}<button className="bb-primary" onClick={() => navigate("/bubblebash/create-review")}>Review Players →</button>{error && <p className="bb-error">{error}</p>}</section></main></div>;

  if (step === "create-review") return <div className="bubblebash-ui bbx-themed" style={themePageStyle}><Header /><main className="bb-main"><section className="bb-wizard bb-review"><Progress current={4} /><h1>Review Match Entries</h1><p>{selectedMode[0]} · {flowShapes[shapeIndex].name} · {activeTheme.name}</p><div className="bb-upload-list">{(sourceMode === "upload" ? uploadedEntries : selectedPlayers.map((player) => ({ name: player, powers: [] }))).map((item) => <span key={item.name}>{item.name} · {item.powers?.length || 0} powers</span>)}</div><button className="bb-primary" disabled={saving} onClick={enterCreatedArena}>{saving ? "Saving..." : "Enter the arena →"}</button>{error && <p className="bb-error">{error}</p>}</section></main></div>;

  return null;
}
