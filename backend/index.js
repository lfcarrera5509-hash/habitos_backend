require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const habitRoutes = require("./routes/habits");
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use((req, res) => res.status(404).json({ success: false, message: "Ruta no encontrada." }));
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/habitos_db";
mongoose.connect(MONGO_URI)
  .then(() => { console.log("Conectado a MongoDB"); app.listen(PORT, () => console.log("Servidor en puerto " + PORT)); })
  .catch(err => { console.error("Error MongoDB:", err.message); process.exit(1); });
module.exports = app;
