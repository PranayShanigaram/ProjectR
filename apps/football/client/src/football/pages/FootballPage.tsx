// src/football/pages/FootballPage.tsx - Main Football Arena Entry Point
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  WORLD_CUP_2026_TEAMS,
} from "../data/worldcup2026_complete";
import {
  FootballTeam,
  FootballPlayer,
  FORMATION_TEMPLATES,
  FormationType,
} from "../types/football";
import { Team3DCard } from "../components/Team3DCard";
import FootballArena from "../components/FootballArena";
import "./FootballPage.css";

type GamePhaseType = "team-select" | "squad-select" | "formation-select" | "match" | "result";

interface GoalEventData {
  minute: number;
  team: "home" | "away";
  player: string;
}

interface ShootoutData {
  homeScore: number;
  awayScore: number;
  winner: "home" | "away";
  homeResults: boolean[];
  awayResults: boolean[];
}

interface MatchResultData {
  winner: "home" | "away" | "draw";
  goals: number;
  scoreline: string;
  stats: {
    homeShots: number;
    awayShots: number;
    homeShotsOnTarget: number;
    awayShotsOnTarget: number;
    goals: GoalEventData[];
  };
  shootout?: ShootoutData;
}

interface GameState {
  phase: GamePhaseType;
  homeTeam: FootballTeam | null;
  awayTeam: FootballTeam | null;
  homeSquad: FootballPlayer[] | null;
  awaySquad: FootballPlayer[] | null;
  homeFormation: FormationType | null;
  awayFormation: FormationType | null;
  matchResult?: MatchResultData;
}

export const FootballPage: React.FC = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>({
    phase: "team-select",
    homeTeam: null,
    awayTeam: null,
    homeSquad: null,
    awaySquad: null,
    homeFormation: null,
    awayFormation: null,
  });

  const [selectedTeamSide, setSelectedTeamSide] = useState<"home" | "away">("home");
  const [selectedSquad, setSelectedSquad] = useState<Set<string>>(new Set());
  const [selectedFormation, setSelectedFormation] = useState<FormationType>("4-3-3");
  // Play Again / Menu buttons appear only 10s after the score card is shown.
  const [showResultActions, setShowResultActions] = useState(false);

  const renderFormationPitch = (template: (typeof FORMATION_TEMPLATES)[FormationType]) => {
    // Parse the formation code (e.g. "4-2-3-1") into outfield bands so the mini
    // pitch shows the real shape rather than a flat DEF/MID/FWD grouping.
    const bands = template.type
      .split("-")
      .map((n) => parseInt(n, 10))
      .filter((n) => Number.isFinite(n) && n > 0);

    return (
      <div className="formation-pitch" aria-hidden>
        <div className="formation-pitch__markings" />
        {/* Forwards first (top), goalkeeper last (bottom). */}
        {[...bands].reverse().map((count, bandIndex) => (
          <div key={`${template.type}-band-${bandIndex}`} className="formation-pitch__row">
            {Array.from({ length: count }, (_, index) => (
              <span key={`b${bandIndex}-${index}`} className="formation-pitch__dot" />
            ))}
          </div>
        ))}
        <div className="formation-pitch__row gk">
          <span className="formation-pitch__dot gk" />
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (gameState.phase !== "result") return;
    setShowResultActions(false);
    const timer = setTimeout(() => setShowResultActions(true), 10000);
    return () => clearTimeout(timer);
  }, [gameState.phase]);

  /* ════════════════════════════════════════════════════════════
     TEAM SELECTION PHASE
     ════════════════════════════════════════════════════════════ */

  const handleTeamSelect = (team: FootballTeam) => {
    setGameState((prev) => {
      if (selectedTeamSide === "home") {
        return {
          ...prev,
          homeTeam: team,
          phase: "squad-select",
        };
      } else {
        return {
          ...prev,
          awayTeam: team,
          phase: "squad-select",
        };
      }
    });
  };

  /* ════════════════════════════════════════════════════════════
     SQUAD SELECTION PHASE
     ════════════════════════════════════════════════════════════ */

  const handlePlayerToggle = (playerId: string) => {
    const newSquad = new Set(selectedSquad);
    if (newSquad.has(playerId)) {
      newSquad.delete(playerId);
    } else {
      if (newSquad.size < 11) {
        newSquad.add(playerId);
      }
    }
    setSelectedSquad(newSquad);
  };

  const handleRandomSquadSelect = () => {
    const team = selectedTeamSide === "home" ? gameState.homeTeam : gameState.awayTeam;
    if (!team) return;

    const gkPool = team.players.filter((player) => player.position === "GK");
    const defPool = team.players.filter((player) => player.position === "DEF");
    const midPool = team.players.filter((player) => player.position === "MID");
    const fwdPool = team.players.filter((player) => player.position === "FWD");

    const shuffle = <T,>(items: T[]) => {
      const next = [...items];
      for (let index = next.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      }
      return next;
    };

    const randomSquad = [
      gkPool[0] ? gkPool[Math.floor(Math.random() * gkPool.length)] : null,
      ...shuffle(defPool).slice(0, 4),
      ...shuffle(midPool).slice(0, 3),
      ...shuffle(fwdPool).slice(0, 3),
    ].filter((player): player is FootballPlayer => Boolean(player));

    setSelectedSquad(new Set(randomSquad.map((player) => player.id)));
  };

  const handleSquadConfirm = () => {
    const team = selectedTeamSide === "home" ? gameState.homeTeam : gameState.awayTeam;
    if (!team || selectedSquad.size !== 11) {
      alert("Please select exactly 11 players");
      return;
    }

    const squadPlayers = Array.from(selectedSquad)
      .map((id) => team.players.find((p) => p.id === id))
      .filter((p) => p !== undefined) as FootballPlayer[];

    const willEnterFormationSelect =
      selectedTeamSide === "away" || (selectedTeamSide === "home" && !!gameState.awayTeam);

    setGameState((prev) => {
      if (selectedTeamSide === "home") {
        return {
          ...prev,
          homeSquad: squadPlayers,
          phase: prev.awayTeam ? "formation-select" : "team-select",
        };
      } else {
        return {
          ...prev,
          awaySquad: squadPlayers,
          phase: "formation-select",
        };
      }
    });

    setSelectedSquad(new Set());

    // If we are about to enter formation selection (both squads ready), start with HOME
    if (willEnterFormationSelect) {
      setSelectedTeamSide("home");
    } else if (selectedTeamSide === "home" && !gameState.awayTeam) {
      // Otherwise, switch to away team selection
      setSelectedTeamSide("away");
      setGameState((prev) => ({ ...prev, phase: "team-select" }));
    }
  };

  /* ════════════════════════════════════════════════════════════
     FORMATION SELECTION PHASE
     ════════════════════════════════════════════════════════════ */

  const handleFormationSelect = (formation: FormationType) => {
    setSelectedFormation(formation);
  };

  const handleFormationConfirm = () => {
    const otherFormationExists =
      selectedTeamSide === "home" ? !!gameState.awayFormation : !!gameState.homeFormation;

    if (otherFormationExists) {
      // Both formations will be set -> start match
      setGameState((prev) => ({
        ...prev,
        [selectedTeamSide === "home" ? "homeFormation" : "awayFormation"]: selectedFormation,
        phase: "match",
      }));
    } else {
      // Set formation for current side and switch to the other side to select theirs
      setGameState((prev) => ({
        ...prev,
        [selectedTeamSide === "home" ? "homeFormation" : "awayFormation"]: selectedFormation,
        phase: "formation-select",
      }));
      setSelectedTeamSide((prev) => (prev === "home" ? "away" : "home"));
    }
  };

  /* ════════════════════════════════════════════════════════════
     RENDER PHASES
     ════════════════════════════════════════════════════════════ */

  if (gameState.phase === "team-select") {
    return (
      <div className="football-container team-select-phase">
        <div className="platform-strip">
          <strong>◈ ProjectR</strong>
          <span>THREE ARENAS · ONE COMMUNITY</span>
          <button onClick={() => { window.location.href = "http://localhost:5173/menu"; }}>Games</button>
        </div>
        <div className="header">
          <h1>🏆 WORLD CUP 2026 - TEAM SELECT 🏆</h1>
          <p>
            {selectedTeamSide === "home" ? "Select HOME Team" : "Select AWAY Team"}
          </p>
        </div>

        <div className="teams-grid teams-grid-3d-cards">
          {WORLD_CUP_2026_TEAMS.map((team) => (
            <Team3DCard
              key={team.id}
              team={team}
              isSelected={
                (selectedTeamSide === "home" && team.id === gameState.homeTeam?.id) ||
                (selectedTeamSide === "away" && team.id === gameState.awayTeam?.id)
              }
              onClick={() => handleTeamSelect(team)}
            />
          ))}
        </div>

        <div className="footer-controls">
          <button onClick={() => navigate("/")} className="btn btn-secondary">
            ← BACK
          </button>
        </div>
      </div>
    );
  }

  if (gameState.phase === "squad-select") {
    const currentTeam = selectedTeamSide === "home" ? gameState.homeTeam : gameState.awayTeam;
    if (!currentTeam) return <div>Loading...</div>;

    // Group players by position (supports any squad size, e.g. 20+ players).
    const gk = currentTeam.players.filter((p) => p.position === "GK");
    const def = currentTeam.players.filter((p) => p.position === "DEF");
    const mid = currentTeam.players.filter((p) => p.position === "MID");
    const fwd = currentTeam.players.filter((p) => p.position === "FWD");

    const primary = currentTeam.primaryColor;
    const secondary = currentTeam.secondaryColor;
    const accent = currentTeam.accentColor || secondary;

    const renderPlayer = (player: FootballPlayer, index: number) => {
      const selected = selectedSquad.has(player.id);
      const locked = !selected && selectedSquad.size >= 11;
      return (
        <button
          key={player.id}
          type="button"
          className={`squad-card ${selected ? "selected" : ""} ${locked ? "locked" : ""}`}
          style={
            {
              "--jersey-primary": primary,
              "--jersey-secondary": secondary,
              "--jersey-accent": accent,
              animationDelay: `${Math.min(index, 12) * 0.035}s`,
            } as React.CSSProperties
          }
          onClick={() => handlePlayerToggle(player.id)}
        >
          <span className="squad-card__watermark">{player.jersey}</span>
          <span className="squad-card__shirt" aria-hidden>
            <span className="squad-card__shirt-num">{player.jersey}</span>
          </span>
          <span className="squad-card__info">
            <span className="squad-card__name">{player.name}</span>
            <span className="squad-card__meta">
              <span className="squad-card__pos">{player.position}</span>
              <span className="squad-card__stat">PAC {player.pace}</span>
              <span className="squad-card__stat">SHO {player.shooting}</span>
            </span>
          </span>
          <span className="squad-card__ovr">{player.overall}</span>
          {selected && <span className="squad-card__check">✓</span>}
        </button>
      );
    };

    const section = (title: string, emoji: string, players: FootballPlayer[]) => (
      <div className="squad-section">
        <div className="squad-section__head">
          <span>
            {emoji} {title}
          </span>
          <span className="squad-section__count">{players.length} available</span>
        </div>
        <div className="squad-cards">{players.map(renderPlayer)}</div>
      </div>
    );

    return (
      <div className="football-container squad-select-phase">
        <div
          className="squad-banner"
          style={{
            background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
          }}
        >
          <div className="squad-banner__flag">{currentTeam.flag}</div>
          <div className="squad-banner__info">
            <div className="squad-banner__name">{currentTeam.name}</div>
            <div className="squad-banner__sub">
              {currentTeam.shortCode} &middot; Selecting {selectedTeamSide === "home" ? "HOME" : "AWAY"} XI
            </div>
          </div>
          <div className="squad-banner__counter">
            <span className={selectedSquad.size === 11 ? "ready" : ""}>{selectedSquad.size}</span>
            <span className="squad-banner__counter-total">/ 11</span>
          </div>
        </div>

        <div className="squad-selection">
          {section("Goalkeepers", "🧤", gk)}
          {section("Defenders", "🛡️", def)}
          {section("Midfielders", "⚙️", mid)}
          {section("Forwards", "🎯", fwd)}
        </div>

        <div className="footer-controls">
          <button
            onClick={() => {
              setGameState((prev) => ({ ...prev, phase: "team-select" }));
              setSelectedSquad(new Set());
            }}
            className="btn btn-secondary"
          >
            ← BACK
          </button>
          <button onClick={() => setSelectedSquad(new Set())} className="btn btn-secondary">
            ✖ CLEAR
          </button>
          <button onClick={handleRandomSquadSelect} className="btn btn-secondary">
            🎲 RANDOM XI
          </button>
          <button
            onClick={handleSquadConfirm}
            disabled={selectedSquad.size !== 11}
            className="btn btn-primary"
          >
            CONTINUE →
          </button>
        </div>
      </div>
    );
  }

  if (gameState.phase === "formation-select") {
    const currentTeam = selectedTeamSide === "home" ? gameState.homeTeam : gameState.awayTeam;
    if (!currentTeam) return <div>Loading...</div>;

    return (
      <div className="football-container formation-select-phase">
        <div className="header">
          <h1>
            {currentTeam.flag} {currentTeam.name} - FORMATION SELECT {currentTeam.flag}
          </h1>
        </div>

        <div className="formations-grid">
          {Object.values(FORMATION_TEMPLATES).map((template) => (
            <div
              key={template.type}
              className={`formation-card ${selectedFormation === template.type ? "selected" : ""}`}
              onClick={() => handleFormationSelect(template.type)}
            >
              {renderFormationPitch(template)}
              <div className="formation-name">{template.name}</div>
              <div className="formation-type">{template.type}</div>
              <div className="formation-desc">{template.description}</div>
              <div className="formation-layout">
                <span><small>DEF</small>{template.layout.defenders}</span>
                <span><small>MID</small>{template.layout.midfielders}</span>
                <span><small>FWD</small>{template.layout.forwards}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="footer-controls">
          <button
            onClick={() => {
              setGameState((prev) => ({ ...prev, phase: "squad-select" }));
            }}
            className="btn btn-secondary"
          >
            ← BACK
          </button>
          <button
            onClick={handleFormationConfirm}
            className="btn btn-primary"
          >
            CONFIRM →
          </button>
        </div>
      </div>
    );
  }

  if (gameState.phase === "match") {
    if (!gameState.homeTeam || !gameState.awayTeam || !gameState.homeFormation || !gameState.awayFormation) {
      return <div>Loading match...</div>;
    }

    return (
      <div className="football-container match-phase">
        <FootballArena
          homeTeam={gameState.homeTeam}
          awayTeam={gameState.awayTeam}
          homeSquad={gameState.homeSquad || undefined}
          awaySquad={gameState.awaySquad || undefined}
          homeFormation={gameState.homeFormation || undefined}
          awayFormation={gameState.awayFormation || undefined}
          onMatchEnd={(result) => {
            setGameState((prev) => ({
              ...prev,
              phase: "result",
              matchResult: result,
            }));
          }}
        />
      </div>
    );
  }

  if (gameState.phase === "result") {
    const result = gameState.matchResult;
    if (!result || !gameState.homeTeam || !gameState.awayTeam) {
      return <div>Loading result...</div>;
    }

    const home = gameState.homeTeam;
    const away = gameState.awayTeam;
    const [homeScore, awayScore] = result.scoreline.split("-");
    const shootout = result.shootout;

    // Group goals by scorer for each side, collecting the minutes they scored.
    const scorersFor = (side: "home" | "away") => {
      const map = new Map<string, number[]>();
      result.stats.goals
        .filter((g) => g.team === side)
        .sort((a, b) => a.minute - b.minute)
        .forEach((g) => {
          const mins = map.get(g.player) ?? [];
          mins.push(g.minute);
          map.set(g.player, mins);
        });
      return Array.from(map.entries());
    };
    const homeScorers = scorersFor("home");
    const awayScorers = scorersFor("away");

    const winnerSide = result.winner;
    const winnerName = winnerSide === "home" ? home.name : winnerSide === "away" ? away.name : null;

    const resetGame = () => {
      setGameState({
        phase: "team-select",
        homeTeam: null,
        awayTeam: null,
        homeSquad: null,
        awaySquad: null,
        homeFormation: null,
        awayFormation: null,
      });
      setSelectedTeamSide("home");
      setSelectedSquad(new Set());
      setShowResultActions(false);
    };

    return (
      <div className="football-container result-phase">
        <div className="result-arena">
          <div className="result-pitch">
            <div className="scorecard">
              <div className="scorecard__title">FULL TIME</div>

          <div className="scorecard__main">
            <div className={`scorecard__team ${winnerSide === "home" ? "winner" : ""}`}>
              {winnerSide === "home" && <div className="scorecard__crown">👑</div>}
              <div className="scorecard__flag">{home.flag}</div>
              <div className="scorecard__code">{home.shortCode}</div>
            </div>

            <div className="scorecard__center">
              <div className="scorecard__scores">
                <span className={winnerSide === "home" ? "win" : ""}>{homeScore}</span>
                <span className="scorecard__vs">VS</span>
                <span className={winnerSide === "away" ? "win" : ""}>{awayScore}</span>
              </div>
              {shootout && (
                <div className="scorecard__pens">
                  ({shootout.homeScore} - {shootout.awayScore} pens)
                </div>
              )}
            </div>

            <div className={`scorecard__team ${winnerSide === "away" ? "winner" : ""}`}>
              {winnerSide === "away" && <div className="scorecard__crown">👑</div>}
              <div className="scorecard__flag">{away.flag}</div>
              <div className="scorecard__code">{away.shortCode}</div>
            </div>
          </div>

          {(homeScorers.length > 0 || awayScorers.length > 0) && (
            <div className="scorecard__scorers">
              <div className="scorecard__scorers-col left">
                {homeScorers.map(([name, mins]) => (
                  <div key={`h-${name}`} className="scorecard__scorer">
                    <span className="ball">⚽</span> {name}{" "}
                    <span className="mins">{mins.map((m) => `${m}'`).join(", ")}</span>
                  </div>
                ))}
              </div>
              <div className="scorecard__scorers-col right">
                {awayScorers.map(([name, mins]) => (
                  <div key={`a-${name}`} className="scorecard__scorer">
                    <span className="mins">{mins.map((m) => `${m}'`).join(", ")}</span> {name}{" "}
                    <span className="ball">⚽</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {shootout && (
            <div className="scorecard__shootout">
              <div className="scorecard__shootout-title">PENALTY SHOOTOUT</div>
              <div className="scorecard__shootout-row">
                <span className="code">{home.shortCode}</span>
                <span className="dots">
                  {shootout.homeResults.map((r, i) => (
                    <span key={`hp-${i}`} className={`dot ${r ? "scored" : "missed"}`} />
                  ))}
                </span>
                <span className="pens">{shootout.homeScore}</span>
              </div>
              <div className="scorecard__shootout-row">
                <span className="code">{away.shortCode}</span>
                <span className="dots">
                  {shootout.awayResults.map((r, i) => (
                    <span key={`ap-${i}`} className={`dot ${r ? "scored" : "missed"}`} />
                  ))}
                </span>
                <span className="pens">{shootout.awayScore}</span>
              </div>
            </div>
          )}

          <div className="scorecard__verdict">
            {winnerSide === "draw" ? (
              <span>🤝 IT&apos;S A DRAW</span>
            ) : (
              <span>
                🏆 {winnerName} {shootout ? "WIN ON PENALTIES" : "WIN"}
              </span>
            )}
          </div>
        </div>

          </div>
          <aside className="result-side">
            {showResultActions && (
              <div className="result-actions-card">
                <button onClick={resetGame} className="btn btn-primary">
                  🔄 PLAY AGAIN
                </button>
                <button onClick={() => navigate("/menu")} className="btn btn-secondary">
                  ← MENU
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  }

  return <div>Unknown phase</div>;
};

export default FootballPage;
