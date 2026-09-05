const express = require("../apps/bubblebash/server/node_modules/express");
const cors = require("../apps/bubblebash/server/node_modules/cors");
const path = require("path");

const bubblebash = require("../apps/bubblebash/server");
const cricket = require("../apps/ipl-cricket/server");
const football = require("../apps/football/server");
const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.get("/api/health", (_req, res) => res.json({ ok: true, games: ["bubblebash", "football", "cricket"] }));

function namespace(engine, prefix) {
  return (req, res, next) => {
    req.url = prefix + req.url;
    engine(req, res, next);
  };
}

app.use("/api/bubblebash", namespace(bubblebash, "/api"));
app.use("/api/cricket", namespace(cricket, "/api/cricket"));
app.use("/api/football", namespace(football, "/api/football"));
app.use("/images/team logos", express.static(path.join(__dirname, "../apps/ipl-cricket/server/images/team logos")));
// Compatibility for the existing Bubblebash canvas while it is hosted by the
// platform client; new consumers should use /api/bubblebash/*.
// Mount the exported Express application directly so its full route table,
// including collection endpoints such as /api/images, remains available.
app.use(bubblebash);

app.listen(PORT, () => console.log(`ProjectR unified API running on http://localhost:${PORT}`));
