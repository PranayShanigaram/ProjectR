import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ArenaPage from "./pages/ArenaPage";
import PlatformPage from "./pages/PlatformPage";

// The engines remain in their game folders.  They are loaded only when a player
// reaches the live-game route, rather than being copied into the platform UI.
const FootballPage = lazy(() => import("../../../football/client/src/football/pages/FootballPage").then((module) => ({ default: module.FootballPage })));
const CricketPage = lazy(() => import("../../../ipl-cricket/client/src/pages/CricketPage"));

const GameFallback = () => <div className="engine-loading">Loading arena…</div>;

function App() {
  return (
    <Routes>
      <Route path="/" element={<PlatformPage />} />
      <Route path="/games" element={<PlatformPage />} />
      <Route path="/:game/:step" element={<PlatformPage />} />
      <Route path="/:game" element={<PlatformPage />} />
      <Route path="/bubblebash/game" element={<ArenaPage />} />
      <Route path="/football/game" element={<Suspense fallback={<GameFallback />}><FootballPage /></Suspense>} />
      <Route path="/cricket/game" element={<Suspense fallback={<GameFallback />}><CricketPage /></Suspense>} />
      <Route path="/menu" element={<Navigate to="/games" replace />} />
      <Route path="/arena" element={<Navigate to="/bubblebash/game" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
