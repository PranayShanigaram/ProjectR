/* Shared style constants to reduce file size */

export const STYLES = {
  // Section containers
  settingsSection: {
    background: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    marginBottom: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  
  // Section headers
  sectionHeader: {
    padding: 12,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    transition: "background 0.2s",
  },
  
  sectionHeaderSpeed: {
    padding: 12,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: (expanded: boolean) => expanded ? "rgba(107,68,255,0.2)" : "transparent",
    transition: "background 0.2s",
  },

  // Content areas
  sectionContent: { padding: "0 12px 12px 12px" },
  
  // Typography
  sectionTitle: { display: "flex", alignItems: "center", gap: 8 },
  sectionIcon: { fontSize: 18 },
  sectionLabel: { color: "#fff", fontWeight: 600, fontSize: 14 },
  sectionArrow: { color: "#999", fontSize: 12 },
  
  // Labels
  controlLabel: { color: "#ccc", fontSize: 13, display: "block", marginBottom: 6 },
  labelValue: { color: "#fff", fontWeight: 600 },
  helpText: { color: "#999", fontSize: 11, marginTop: 4 },
  
  // Inputs
  sliderInput: { width: "100%", cursor: "pointer" },
  numberInput: {
    width: "100%",
    padding: "6px",
    borderRadius: 4,
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)",
    fontSize: 12,
  },
  
  // Buttons
  presetButton: (active: boolean) => ({
    padding: "6px 8px",
    fontSize: 11,
    background: active ? "#4caf50" : "rgba(255,255,255,0.1)",
    border: active ? "1px solid #4caf50" : "1px solid rgba(255,255,255,0.2)",
    borderRadius: 4,
    color: "#fff",
    cursor: "pointer",
    fontWeight: active ? 600 : 400,
  }),

  // Leaderboard
  leaderboardContainer: {
    width: "100%",
    padding: 8,
    boxSizing: "border-box",
    position: "relative",
  },
  
  leaderboardEntry: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    boxSizing: "border-box",
    paddingRight: 6,
  },
  
  leaderboardImage: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },
  
  // Brawl vertical layout
  verticalBubbleDisplay: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: 8,
    background: "rgba(255,255,255,0.03)",
    borderRadius: 6,
    marginBottom: 8,
  },
  
  bubbleImage: {
    borderRadius: "50%",
    objectFit: "cover",
  },
  
  bubbleInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    textAlign: "center",
  },
  
  bubbleName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
    wordBreak: "break-word",
  },
  
  bubbleHealth: (health: number) => ({
    fontSize: 11,
    fontWeight: 600,
    color: health > 60 ? "lime" : health > 30 ? "yellow" : "red",
  }),
  
  vsSeparator: {
    fontSize: 22,
    fontWeight: 700,
    color: "#ff9800",
    margin: "4px 0",
  },
  
  // Watermark
  watermark: {
    borderRadius: "50%",
    opacity: 0.28,
    pointerEvents: "none",
    userSelect: "none",
  },
};
