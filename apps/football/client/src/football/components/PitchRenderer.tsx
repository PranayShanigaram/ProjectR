// src/football/components/PitchRenderer.tsx - Football Pitch Canvas Component
import React, { useRef, useEffect } from "react";
import { PENALTY_BOX_WIDTH, PENALTY_BOX_HEIGHT, GOAL_AREA_WIDTH, GOAL_AREA_HEIGHT } from "../types/football";

interface PitchRendererProps {
  width?: number;
  height?: number;
}

export const PitchRenderer: React.FC<PitchRendererProps> = ({ 
  width = 1200, 
  height = 600,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Draw pitch background (grass)
    ctx.fillStyle = "#1a6b2b";
    ctx.fillRect(0, 0, width, height);

    // Draw pitch lines (white)
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;

    // Halfway line
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 50, 0, Math.PI * 2);
    ctx.stroke();

    // Center spot
    ctx.fillStyle = "#fff";
    ctx.fillRect(width / 2 - 2, height / 2 - 2, 4, 4);

    // Left penalty box
    ctx.strokeRect(0, (height - PENALTY_BOX_HEIGHT) / 2, PENALTY_BOX_WIDTH, PENALTY_BOX_HEIGHT);

    // Right penalty box
    ctx.strokeRect(width - PENALTY_BOX_WIDTH, (height - PENALTY_BOX_HEIGHT) / 2, PENALTY_BOX_WIDTH, PENALTY_BOX_HEIGHT);

    // Left goal area
    ctx.strokeRect(0, (height - GOAL_AREA_HEIGHT) / 2, GOAL_AREA_WIDTH, GOAL_AREA_HEIGHT);

    // Right goal area
    ctx.strokeRect(width - GOAL_AREA_WIDTH, (height - GOAL_AREA_HEIGHT) / 2, GOAL_AREA_WIDTH, GOAL_AREA_HEIGHT);

    // Left corner arcs
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, height, 20, 0, Math.PI * 2);
    ctx.stroke();

    // Right corner arcs
    ctx.beginPath();
    ctx.arc(width, 0, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width, height, 20, 0, Math.PI * 2);
    ctx.stroke();

  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        border: "2px solid #00d084",
        borderRadius: "8px",
        display: "block",
        margin: "0 auto",
        maxWidth: "100%",
        height: "auto",
      }}
    />
  );
};
