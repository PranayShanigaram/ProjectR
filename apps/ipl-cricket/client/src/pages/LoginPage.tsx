import React from "react";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="platform-landing">
      <header className="platform-nav"><strong className="platform-logo">◈ ProjectR</strong><span>IPL CRICKET / LEAGUE BATTLE</span><button className="platform-nav-button" onClick={() => navigate("/menu")}>Enter cricket</button></header>
      <main className="landing-hero"><div className="landing-copy"><p className="eyebrow">IPL CRICKET</p><h1>Pick your XI.<br /><span>Survive the innings.</span></h1><p className="landing-subtitle">Teams, impact players, rain, DLS and a full match-day scorecard.</p><button className="landing-cta" onClick={() => navigate("/menu")}>Enter the league <span>→</span></button></div><div className="landing-orbit" aria-hidden="true"><div className="orbit-core">🏏</div><div className="orbit-ring orbit-ring-one" /><div className="orbit-ring orbit-ring-two" /><div className="orbit-chip chip-cricket">20 OVERS</div><div className="orbit-chip chip-brawl">DLS READY</div></div></main>
      <div className="landing-stats"><span><b>10</b> IPL teams</span><span><b>20</b> Overs</span><span><b>1</b> Super over</span></div>
      <div className="cross-game-links"><button onClick={() => { window.location.href = "/bubblebash"; }}>Bubblebash</button><button onClick={() => { window.location.href = "/football"; }}>Football</button></div>
    </div>
  );
};

export default LoginPage;
