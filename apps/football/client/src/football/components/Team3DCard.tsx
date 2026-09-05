import React from "react";
import { FootballTeam } from "../types/football";
import "../pages/FootballPage.css";

interface Team3DCardProps {
  team: FootballTeam;
  isSelected: boolean;
  onClick: () => void;
}

export const Team3DCard: React.FC<Team3DCardProps> = ({
  team,
  isSelected,
  onClick,
}) => {
  const style = {
    "--team-primary": team.primaryColor,
    "--team-secondary": team.secondaryColor,
    "--team-accent": team.accentColor,
  } as React.CSSProperties;

  return (
    <button
      type="button"
      className={`team-3d-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
      style={style}
      aria-label={`Select ${team.name}`}
    >
      <span className="team-3d-card__shine" />
      <span className="team-3d-card__jersey" aria-hidden>
        <span className="team-3d-card__neck" />
        <span className="team-3d-card__stripe" />
        <span className="team-3d-card__code">{team.shortCode}</span>
      </span>
      <span className="team-3d-card__flag-ring">
        <span className="team-3d-card__flag">{team.flag}</span>
      </span>
      <span className="team-3d-card__name">{team.name}</span>
      <span className="team-3d-card__rating">OVR {team.overallRating}</span>
    </button>
  );
};
