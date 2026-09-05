import type { BubbleData, Spike } from "../pages/ArenaPage";

export function getRandom(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export const checkCollision = (b1: BubbleData, b2: BubbleData) => {
  const dx = b1.x - b2.x;
  const dy = b1.y - b2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < b1.radius + b2.radius;
};

export function checkSpikeCollision(b: BubbleData, thorns: Spike[], spikeSize: number): Spike | null {
  for (const thorn of thorns) {
    const { x, y, nx, ny } = thorn;
    
    // Spike is a triangle with base at x, y and tip pointing inward along normal
    const tipX = x + nx * spikeSize;
    const tipY = y + ny * spikeSize;
    
    // Calculate perpendicular vector to normal for base width
    const perpX = -ny;
    const perpY = nx;
    
    // Triangle vertices: base left, base right, tip
    const halfBase = spikeSize / 2;
    const v1x = x + perpX * halfBase;
    const v1y = y + perpY * halfBase;
    const v2x = x - perpX * halfBase;
    const v2y = y - perpY * halfBase;
    const v3x = tipX;
    const v3y = tipY;
    
    // Check distance from bubble center to each of the three edges
    const dist1 = distanceToSegment(b.x, b.y, v1x, v1y, v2x, v2y); // base
    const dist2 = distanceToSegment(b.x, b.y, v2x, v2y, v3x, v3y); // right edge
    const dist3 = distanceToSegment(b.x, b.y, v3x, v3y, v1x, v1y); // left edge
    
    const minDist = Math.min(dist1, dist2, dist3);
    if (minDist <= b.radius) {
      return thorn;
    }
  }
  return null;
}

// Helper function to calculate the distance from a point to a line segment
function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  
  if (lengthSquared === 0) {
    // The segment is a point
    const dpx = px - x1;
    const dpy = py - y1;
    return Math.sqrt(dpx * dpx + dpy * dpy);
  }
  
  // Calculate the projection of point onto the line segment
  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t)); // Clamp to [0, 1] to stay on the segment
  
  // Find the closest point on the segment
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  
  // Calculate distance from point to closest point
  const distX = px - closestX;
  const distY = py - closestY;
  return Math.sqrt(distX * distX + distY * distY);
}