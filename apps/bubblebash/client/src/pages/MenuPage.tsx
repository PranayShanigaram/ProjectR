import { useState } from "react";
import { useNavigate } from "react-router-dom";

const MenuPage = () => {
  const navigate = useNavigate();
  const [joinMode, setJoinMode] = useState<"join" | "create">("join");

  const openGame = (url: string) => { window.location.href = url; };

  return (
    <div className="platform-shell">
      <header className="platform-header">
        <button className="back-link" onClick={() => navigate("/")}>← ProjectR</button>
        <nav><button>Home</button><button className="active">Games</button><button>Matches</button><button>Leaderboard</button></nav>
        <button className="profile-pill">Guest profile</button>
      </header>
      <main className="platform-content">
        <section className="platform-heading"><p className="eyebrow">THE ARENA AWAITS</p><h1>Choose your arena</h1><p>Different games. Same chaos.</p></section>
        <section className="game-grid">
          <button className="game-card game-card-brawl" onClick={() => navigate("/arena")}>
            <span className="game-art game-art-brawl">◉</span><span className="game-card-copy"><small>COMBAT ARENA</small><strong>Bubblebash</strong><em>Fast. Chaotic. Unpredictable.</em><span className="game-card-action">Play now →</span></span>
          </button>
          <button className="game-card game-card-football" onClick={() => openGame("/football")}>
            <span className="game-art game-art-football">⚽</span><span className="game-card-copy"><small>TEAM BATTLE</small><strong>Football</strong><em>Build your squad. Watch the battle.</em><span className="game-card-action">Play now →</span></span>
          </button>
          <button className="game-card game-card-cricket" onClick={() => openGame("/cricket")}>
            <span className="game-art game-art-cricket">🏏</span><span className="game-card-copy"><small>LEAGUE BATTLE</small><strong>IPL Cricket</strong><em>Pick your XI. Survive the innings.</em><span className="game-card-action">Play now →</span></span>
          </button>
        </section>
        <section className="match-panel">
          <div className="panel-tabs"><button className={joinMode === "join" ? "selected" : ""} onClick={() => setJoinMode("join")}>Join match</button><button className={joinMode === "create" ? "selected" : ""} onClick={() => setJoinMode("create")}>Create match</button></div>
          {joinMode === "join" ? <div className="match-panel-body"><div><small>ENTER MATCH CODE</small><input placeholder="e.g. BA1024" /></div><button className="primary-action" onClick={() => alert("Match lobby preview coming soon")}>Join</button><div className="upcoming-list"><small>UPCOMING PUBLIC MATCHES</small><span>RCB vs CSK Fan Arena <b>Join</b></span><span>World Cup Chaos <b>Join</b></span></div></div> : <div className="match-panel-body create-preview"><h2>Create a community match</h2><p>Set the mode, invite your community, then import the lobby into the existing local game.</p><button className="primary-action" onClick={() => alert("Create match preview coming soon")}>Continue setup →</button></div>}
        </section>
      </main>
    </div>
  );
};

export default MenuPage;
