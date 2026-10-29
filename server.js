// server.js — Voyago API entrypoint
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const destinationRoutes = require("./routes/destinations");
const bookingRoutes = require("./routes/bookings");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve the static frontend so the whole app can run from one process.
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.use("/api/auth", authRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true, service: "voyago-api" }));

// Fallback to the frontend for any non-API route (simple SPA support).
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

app.listen(PORT, () => {
  console.log(`Voyago API running at http://localhost:${PORT}`);
});
