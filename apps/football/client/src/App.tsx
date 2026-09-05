import { Routes, Route } from "react-router-dom";
import { FootballPage } from "./football";

function App() {
  return (
    <Routes>
      <Route path="/" element={<FootballPage />} />
      <Route path="/football" element={<FootballPage />} />
      <Route path="*" element={<FootballPage />} />
    </Routes>
  );
}

export default App;
