const express = require("express");
const cors = require("cors");

const habitsRoutes = require("./routes/habits.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitsRoutes);

module.exports = app;