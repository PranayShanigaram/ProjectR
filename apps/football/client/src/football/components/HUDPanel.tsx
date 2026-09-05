// src/football/components/HUDPanel.tsx - Live Match Statistics HUD
import React from "react";
import { TeamMatchState } from "../types/football";

interface HUDPanelProps {
  team: TeamMatchState;
  isHome: boolean;
}

export const HUDPanel: React.FC<HUDPanelProps> = ({ team, isHome }) => {
  return (
    <div
      style={{
        position: "fixed",
        right: isHome ? "20px" : "auto",
        left: !isHome ? "20px" : "auto",
        top: "20px",
        background: "#1a1e2e",
        border: "2px solid #3a3e4e",
        borderRadius: "12px",
        padding: "20px",
        minWidth: "200px",
        color: "#fff",
        fontSize: "14px",
        fontFamily: "monospace",
        zIndex: 1000,
      }}
    >
      <div style={{ marginBottom: "15px", borderBottom: "2px solid #3a3e4e", paddingBottom: "10px" }}>
        <div style={{ fontSize: "16px", fontWeight: "600", color: team.team.primaryColor }}>
          {team.team.flag} {team.team.shortCode}
        </div>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <div style={{ color: "#ffc400", fontSize: "20px", fontWeight: "700" }}>
          {team.score}
        </div>
      </div>

      <div style={{ marginBottom: "15px", fontSize: "12px" }}>
        <div>POSSESSION: {team.possession}%</div>
        <div style={{ background: "rgba(0, 208, 132, 0.1)", height: "4px", borderRadius: "2px", marginTop: "2px" }}>
          <div
            style={{
              background: "#00d084",
              height: "100%",
              width: `${team.possession}%`,
              borderRadius: "2px",
            }}
          />
        </div>
      </div>

      <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
        <div>SHOTS: {team.shotsOnTarget}/{team.shotsOnTarget + team.shotsOffTarget}</div>
        <div>PASS ACC: {team.passAccuracy}%</div>
        <div>FOULS: {team.fouls}</div>
        <div style={{ color: "#FFB81C" }}>YELLOW: {team.yellowCards}</div>
        <div style={{ color: "#FF1744" }}>RED: {team.redCards}</div>
      </div>
    </div>
  );
};
