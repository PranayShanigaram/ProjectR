import React, { useEffect, useState } from "react";

const watermarkUrl = new URL('../types/watermarkfin.png', import.meta.url).href;

interface Row {
  player: string;
  hits: number;
  kills?: number;
  wins?: number;
  games?: number;
} 

type ArenaType = "normal" | "boss" | "brawl";
type BrawlMode = "all" | "1v1" | "1vMany";

const LeaderboardPage: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [arenaType, setArenaType] = useState<ArenaType>("normal");
  const [brawlMode, setBrawlMode] = useState<BrawlMode>("all");
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  // Helper function to remove file extensions from player names
  const cleanPlayerName = (playerName: string) => {
    return playerName.replace(/\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i, '');
  };

  const handleBackupStats = async () => {
    setBackupStatus("Creating backup...");
    try {
      const response = await fetch("http://localhost:5000/api/stats/backup", {
        method: "POST",
      });
      const result = await response.json();
      if (result.success) {
        setBackupStatus(`✅ Backup created: ${result.files.join(', ')}`);
        setTimeout(() => setBackupStatus(null), 5000);
      } else {
        setBackupStatus(`❌ Backup failed: ${result.error}`);
        setTimeout(() => setBackupStatus(null), 5000);
      }
    } catch (e) {
      console.error("Backup failed", e);
      setBackupStatus("❌ Backup failed: Network error");
      setTimeout(() => setBackupStatus(null), 5000);
    }
  };

  const fetchLeaderboard = async (arena: ArenaType, mode?: BrawlMode) => {
    setLoading(true);
    try {
      let url = `http://localhost:5000/api/stats?arena=${arena}`;
      if (arena === "brawl" && mode && mode !== "all") {
        url += `&brawlMode=${mode}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setRows(data || []);
    } catch (e) {
      console.error("Failed to fetch leaderboard", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayer = async (player: string) => {
    if (!confirm(`Delete player "${player}" from ${arenaType} leaderboard?`)) return;
    try {
      let url = `http://localhost:5000/api/stats/player?player=${encodeURIComponent(player)}&arena=${arenaType}`;
      if (arenaType === "brawl" && brawlMode !== "all") {
        url += `&brawlMode=${brawlMode}`;
      }
      const response = await fetch(url, {
        method: "DELETE",
      });
      const result = await response.json();
      console.log("Delete response:", result);
      if (response.ok) {
        fetchLeaderboard(arenaType, brawlMode);
      } else {
        console.error("Delete failed:", result);
        alert(`Failed to delete: ${result.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error("Failed to delete player", e);
      alert("Failed to delete player. Check console for details.");
    }
  };

  useEffect(() => {
    fetchLeaderboard(arenaType, brawlMode);
    const t = setInterval(() => fetchLeaderboard(arenaType, brawlMode), 5000);
    return () => clearInterval(t);
  }, [arenaType, brawlMode]);

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Leaderboard</h2>
        <button
          onClick={handleBackupStats}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded flex items-center gap-2"
          title="Create backup of all stats files"
        >
          💾 Backup Stats
        </button>
      </div>
      
      {/* Backup status message */}
      {backupStatus && (
        <div className="mb-4 p-3 bg-gray-800 rounded text-sm">
          {backupStatus}
        </div>
      )}
      
      {/* Arena Type Selector */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => { setArenaType("normal"); setBrawlMode("all"); }}
          className={`px-4 py-2 rounded ${arenaType === "normal" ? "bg-blue-600" : "bg-gray-700"} hover:opacity-80`}
        >
          Normal Arena
        </button>
        <button
          onClick={() => { setArenaType("boss"); setBrawlMode("all"); }}
          className={`px-4 py-2 rounded ${arenaType === "boss" ? "bg-purple-600" : "bg-gray-700"} hover:opacity-80`}
        >
          Boss Arena
        </button>
        <button
          onClick={() => { setArenaType("brawl"); setBrawlMode("all"); }}
          className={`px-4 py-2 rounded ${arenaType === "brawl" ? "bg-orange-600" : "bg-gray-700"} hover:opacity-80`}
        >
          Brawl Arena
        </button>
      </div>

      {/* Brawl Mode Sub-selector */}
      {arenaType === "brawl" && (
        <div className="mb-4 flex gap-2 items-center">
          <span className="text-gray-400">Mode:</span>
          <button
            onClick={() => setBrawlMode("all")}
            className={`px-3 py-1 rounded text-sm ${brawlMode === "all" ? "bg-orange-500" : "bg-gray-600"} hover:opacity-80`}
          >
            All
          </button>
          <button
            onClick={() => setBrawlMode("1v1")}
            className={`px-3 py-1 rounded text-sm ${brawlMode === "1v1" ? "bg-orange-500" : "bg-gray-600"} hover:opacity-80`}
          >
            1v1
          </button>
          <button
            onClick={() => setBrawlMode("1vMany")}
            className={`px-3 py-1 rounded text-sm ${brawlMode === "1vMany" ? "bg-orange-500" : "bg-gray-600"} hover:opacity-80`}
          >
            1vMany
          </button>
        </div>
      )}

      {loading && <div>Loading...</div>}
      <div className="bg-white/10 rounded-md overflow-hidden relative">
        <div className="relative z-10">
          <div className="grid grid-cols-12 gap-2 p-3 font-semibold bg-white/5">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Player</div>
            {arenaType !== "boss" && <div className="col-span-2 text-right">Kills</div>}
            {arenaType !== "boss" && <div className="col-span-2 text-right">Wins</div>}
            <div className="col-span-2 text-right">Hits</div>
            <div className="col-span-1 text-center">Action</div>
          </div>
          <div>
            {rows.map((r, i) => (
              <div key={r.player} className="grid grid-cols-12 gap-2 p-3 border-t border-white/5 items-center">
                <div className="col-span-1">{i + 1}</div>
                <div className="col-span-5 truncate">{cleanPlayerName(r.player)}</div>
                {arenaType !== "boss" && <div className="col-span-2 text-right">{r.kills || 0}</div>}
                {arenaType !== "boss" && <div className="col-span-2 text-right">{r.wins || 0}</div>}
                <div className="col-span-2 text-right">{r.hits}</div>
                <div className="col-span-1 text-center">
                  <button
                    onClick={() => handleDeletePlayer(r.player)}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                    title="Delete player"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {rows.length === 0 && !loading && <div className="p-4">No data yet.</div>}
          </div>
        </div>
      </div> 
    </div>
  );
};

export default LeaderboardPage;
