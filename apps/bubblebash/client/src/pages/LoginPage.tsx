import React from "react";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="platform-landing">
      <div className="platform-nav">
        <strong className="platform-logo">◈ ProjectR</strong>
        <span>ONE PLATFORM · THREE ARENAS</span>
        <button className="platform-nav-button" onClick={() => navigate("/menu")}>Enter Arena</button>
      </div>
      <main className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">BRAWLERS ARENA / PROJECTR</p>
          <h1>Three arenas.<br /><span>One community.</span></h1>
          <p className="landing-subtitle">Build your fighter. Choose your team. Watch the chaos unfold.</p>
          <button className="landing-cta" onClick={() => navigate("/menu")}>Explore the arenas <span>→</span></button>
        </div>
        <div className="landing-orbit" aria-hidden="true">
          <div className="orbit-core">◈</div>
          <div className="orbit-ring orbit-ring-one" />
          <div className="orbit-ring orbit-ring-two" />
          <div className="orbit-chip chip-brawl">BRAWL</div>
          <div className="orbit-chip chip-football">FOOTBALL</div>
          <div className="orbit-chip chip-cricket">CRICKET</div>
        </div>
      </main>
      <div className="landing-stats">
        <span><b>100K+</b> Players</span>
        <span><b>500+</b> Battles</span>
        <span><b>3</b> Game universes</span>
      </div>
    </div>
  );
};

export default LoginPage;
