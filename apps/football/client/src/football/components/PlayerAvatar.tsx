// src/football/components/PlayerAvatar.tsx - Player Bubble/Avatar Component
import React from "react";
import { FootballPlayer } from "../types/football";
import { getPositionIcon } from "../utils/footballUtils";

interface PlayerAvatarProps {
  player: FootballPlayer;
  x: number;
  y: number;
  stamina?: number; // 0-100
  isSelected?: boolean;
  teamColor: string;
  size?: number;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  player,
  x,
  y,
  stamina = 100,
  isSelected = false,
  teamColor,
  size = 60,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -50%)",
        zIndex: isSelected ? 100 : 50,
      }}
    >
      {/* Stamina ring (outer circle) */}
      <div
        style={{
          width: `${size + 10}px`,
          height: `${size + 10}px`,
          borderRadius: "50%",
          border: `3px solid ${teamColor}`,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `conic-gradient(#00d084 0% ${stamina}%, transparent ${stamina}%)`,
          opacity: stamina / 100,
        }}
      >
        {/* Main player bubble */}
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "50%",
            background: teamColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            fontWeight: "700",
            color: "#fff",
            position: "relative",
            boxShadow: isSelected ? `0 0 20px ${teamColor}` : "none",
            border: isSelected ? `3px solid #fff` : "none",
          }}
        >
          {player.jersey}
        </div>
      </div>

      {/* Player info popup on hover */}
      <div
        style={{
          position: "absolute",
          bottom: "-80px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#1a1e2e",
          border: "2px solid #00d084",
          borderRadius: "8px",
          padding: "8px",
          minWidth: "120px",
          textAlign: "center",
          fontSize: "11px",
          opacity: 0,
          pointerEvents: "none",
          transition: "opacity 0.3s",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ fontWeight: "600", color: "#fff" }}>{player.name}</div>
        <div style={{ color: "#a0a9b8" }}>{getPositionIcon(player.position)} {player.position}</div>
        <div style={{ color: "#ffc400" }}>⭐ {player.overall}</div>
      </div>
    </div>
  );
};
