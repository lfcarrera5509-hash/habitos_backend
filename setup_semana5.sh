#!/bin/bash
# Ejecuta esto desde la raiz de tu proyecto habitos_backend
# Uso: bash setup_semana5.sh

mkdir -p backend/middleware backend/models backend/controllers backend/routes
mkdir -p frontend/app/login frontend/app/register frontend/app/dashboard frontend/components frontend/lib

# ── backend/middleware/auth.js
cat > backend/middleware/auth.js << 'EOF'
const jwt = require("jsonwebtoken");
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Acceso denegado. Token no proporcionado." });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expirado." });
    }
    return res.status(401).json({ success: false, message: "Token invalido." });
  }
};
module.exports = authMiddleware;
EOF

# ── backend/models/User.js
cat > backend/models/User.js << 'EOF'
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
}, { timestamps: true });
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};
module.exports = mongoose.model("User", userSchema);
EOF

# ── backend/models/Habit.js
cat > backend/models/Habit.js << 'EOF'
const mongoose = require("mongoose");
const habitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: "" },
  streak: { type: Number, default: 0 },
  lastCompletedDate: { type: Date, default: null },
  completedDates: { type: [Date], default: [] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
habitSchema.virtual("progress").get(function () {
  return Math.min(Math.round((this.streak / 66) * 100), 100);
});
habitSchema.set("toJSON", { virtuals: true });
module.exports = mongoose.model("Habit", habitSchema);
EOF

# ── backend/controllers/authController.js
cat > backend/controllers/authController.js << 'EOF'
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const generateToken = (user) =>
  jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: "7d" });
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: "Todos los campos son obligatorios." });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: "El email ya esta registrado." });
    const user = await User.create({ name, email, password });
    const token = generateToken(user);
    return res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) { return res.status(500).json({ success: false, message: "Error interno." }); }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email y contrasena son obligatorios." });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: "Credenciales incorrectas." });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Credenciales incorrectas." });
    const token = generateToken(user);
    return res.status(200).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) { return res.status(500).json({ success: false, message: "Error interno." }); }
};
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    return res.status(200).json({ success: true, user });
  } catch (e) { return res.status(500).json({ success: false, message: "Error." }); }
};
module.exports = { register, login, getMe };
EOF

# ── backend/controllers/habitController.js
cat > backend/controllers/habitController.js << 'EOF'
const Habit = require("../models/Habit");
const getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user.id, isActive: true }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, habits });
  } catch (e) { return res.status(500).json({ success: false, message: "Error." }); }
};
const createHabit = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "El nombre es obligatorio." });
    const habit = await Habit.create({ userId: req.user.id, name, description });
    return res.status(201).json({ success: true, habit });
  } catch (e) { return res.status(500).json({ success: false, message: "Error." }); }
};
const completeHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user.id });
    if (!habit) return res.status(404).json({ success: false, message: "Habito no encontrado." });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const alreadyDone = habit.completedDates.some(d => {
      const date = new Date(d); date.setHours(0,0,0,0); return date.getTime() === today.getTime();
    });
    if (alreadyDone) return res.status(400).json({ success: false, message: "Ya completaste este habito hoy." });
    if (habit.lastCompletedDate) {
      const last = new Date(habit.lastCompletedDate); last.setHours(0,0,0,0);
      const diff = Math.round((today - last) / (1000 * 60 * 60 * 24));
      habit.streak = diff === 1 ? habit.streak + 1 : 1;
    } else { habit.streak = 1; }
    habit.lastCompletedDate = today;
    habit.completedDates.push(today);
    await habit.save();
    return res.status(200).json({ success: true, message: "Habito completado!", habit });
  } catch (e) { return res.status(500).json({ success: false, message: "Error." }); }
};
const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id }, { isActive: false }, { new: true }
    );
    if (!habit) return res.status(404).json({ success: false, message: "Habito no encontrado." });
    return res.status(200).json({ success: true, message: "Habito eliminado." });
  } catch (e) { return res.status(500).json({ success: false, message: "Error." }); }
};
module.exports = { getHabits, createHabit, completeHabit, deleteHabit };
EOF

# ── backend/routes/auth.js
cat > backend/routes/auth.js << 'EOF'
const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");
router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);
module.exports = router;
EOF

# ── backend/routes/habits.js
cat > backend/routes/habits.js << 'EOF'
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { getHabits, createHabit, completeHabit, deleteHabit } = require("../controllers/habitController");
router.use(authMiddleware);
router.get("/", getHabits);
router.post("/", createHabit);
router.patch("/:id/complete", completeHabit);
router.delete("/:id", deleteHabit);
module.exports = router;
EOF

# ── backend/index.js
cat > backend/index.js << 'EOF'
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
EOF

# ── backend/.env.example
cat > backend/.env.example << 'EOF'
PORT=5000
MONGO_URI=mongodb://localhost:27017/habitos_db
JWT_SECRET=cambia_esto_por_algo_seguro
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
EOF

# ── frontend/lib/api.js
cat > frontend/lib/api.js << 'EOF'
import axios from "axios";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const api = axios.create({ baseURL: API_URL, headers: { "Content-Type": "application/json" } });
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = "Bearer " + token;
  }
  return config;
}, (error) => Promise.reject(error));
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
export const authService = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};
export const habitService = {
  getAll: () => api.get("/habits"),
  create: (data) => api.post("/habits", data),
  complete: (id) => api.patch("/habits/" + id + "/complete"),
  delete: (id) => api.delete("/habits/" + id),
};
export default api;
EOF

# ── frontend/lib/AuthContext.jsx
cat > frontend/lib/AuthContext.jsx << 'EOF'
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "@/lib/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) setUser(JSON.parse(savedUser));
    setLoading(false);
  }, []);
  const login = async (email, password) => {
    const { data } = await authService.login({ email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };
  const register = async (name, email, password) => {
    const { data } = await authService.register({ name, email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };
  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
EOF

# ── frontend/app/layout.jsx
cat > frontend/app/layout.jsx << 'EOF'
import { AuthProvider } from "@/lib/AuthContext";
import "./globals.css";
export const metadata = { title: "Habitos Tracker", description: "Seguimiento de habitos" };
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
EOF

# ── frontend/app/page.jsx
cat > frontend/app/page.jsx << 'EOF'
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading) router.push(user ? "/dashboard" : "/login"); }, [user, loading, router]);
  return <div className="home-redirect"><p>Cargando...</p></div>;
}
EOF

# ── frontend/app/login/page.jsx
cat > frontend/app/login/page.jsx << 'EOF'
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try { await login(form.email, form.password); router.push("/dashboard"); }
    catch (err) { setError(err.response?.data?.message || "Error al iniciar sesion."); }
    finally { setLoading(false); }
  };
  return (
    <main className="auth-container">
      <div className="auth-card">
        <h1>Iniciar Sesion</h1>
        <p className="auth-subtitle">Continua construyendo tus habitos</p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Email<input type="email" name="email" value={form.email} onChange={handleChange} placeholder="correo@ejemplo.com" required /></label>
          <label>Contrasena<input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required /></label>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Ingresando..." : "Ingresar"}</button>
        </form>
        <p className="auth-link">No tienes cuenta? <Link href="/register">Registrate aqui</Link></p>
      </div>
    </main>
  );
}
EOF

# ── frontend/app/register/page.jsx
cat > frontend/app/register/page.jsx << 'EOF'
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (form.password !== form.confirm) return setError("Las contrasenas no coinciden.");
    if (form.password.length < 6) return setError("Minimo 6 caracteres.");
    setLoading(true);
    try { await register(form.name, form.email, form.password); router.push("/dashboard"); }
    catch (err) { setError(err.response?.data?.message || "Error al registrarse."); }
    finally { setLoading(false); }
  };
  return (
    <main className="auth-container">
      <div className="auth-card">
        <h1>Crear Cuenta</h1>
        <p className="auth-subtitle">Empieza tu camino de 66 dias</p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Nombre<input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Tu nombre" required /></label>
          <label>Email<input type="email" name="email" value={form.email} onChange={handleChange} placeholder="correo@ejemplo.com" required /></label>
          <label>Contrasena<input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Minimo 6 caracteres" required /></label>
          <label>Confirmar<input type="password" name="confirm" value={form.confirm} onChange={handleChange} placeholder="Repite tu contrasena" required /></label>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? "Registrando..." : "Registrarme"}</button>
        </form>
        <p className="auth-link">Ya tienes cuenta? <Link href="/login">Inicia sesion</Link></p>
      </div>
    </main>
  );
}
EOF

# ── frontend/app/dashboard/page.jsx
cat > frontend/app/dashboard/page.jsx << 'EOF'
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { habitService } from "@/lib/api";
import HabitCard from "@/components/HabitCard";
import AddHabitForm from "@/components/AddHabitForm";
export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [habits, setHabits] = useState([]);
  const [habitsLoading, setHabitsLoading] = useState(true);
  const [message, setMessage] = useState("");
  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);
  useEffect(() => { if (user) fetchHabits(); }, [user]);
  const fetchHabits = async () => {
    setHabitsLoading(true);
    try { const { data } = await habitService.getAll(); setHabits(data.habits); }
    catch (e) { console.error(e); }
    finally { setHabitsLoading(false); }
  };
  const showMsg = (text, isError = false) => { setMessage({ text, isError }); setTimeout(() => setMessage(""), 3000); };
  const handleAddHabit = async (form) => {
    const { data } = await habitService.create(form);
    setHabits(prev => [data.habit, ...prev]);
    showMsg("Habito creado exitosamente!");
  };
  const handleComplete = async (id) => {
    try {
      const { data } = await habitService.complete(id);
      setHabits(prev => prev.map(h => h._id === id ? data.habit : h));
      showMsg("Racha actualizada! Dia " + data.habit.streak);
    } catch (err) { showMsg(err.response?.data?.message || "Error", true); }
  };
  const handleDelete = async (id) => {
    if (!confirm("Eliminar este habito?")) return;
    try { await habitService.delete(id); setHabits(prev => prev.filter(h => h._id !== id)); showMsg("Habito eliminado."); }
    catch { showMsg("Error al eliminar.", true); }
  };
  const handleLogout = () => { logout(); router.push("/login"); };
  if (loading) return <div className="loading-screen">Cargando...</div>;
  if (!user) return null;
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div><h1>Mis Habitos</h1><p>Hola, {user.name}!</p></div>
        <button onClick={handleLogout} className="btn-logout">Cerrar sesion</button>
      </header>
      {message && <div className={"flash-message " + (message.isError ? "flash-error" : "flash-success")}>{message.text}</div>}
      <AddHabitForm onAdd={handleAddHabit} />
      <section className="habits-grid">
        {habitsLoading ? <p className="loading-text">Cargando habitos...</p>
          : habits.length === 0 ? <div className="empty-state"><p>Aun no tienes habitos. Crea el primero!</p></div>
          : habits.map(habit => <HabitCard key={habit._id} habit={habit} onComplete={handleComplete} onDelete={handleDelete} />)}
      </section>
    </div>
  );
}
EOF

# ── frontend/components/HabitCard.jsx
cat > frontend/components/HabitCard.jsx << 'EOF'
"use client";
const MAX_DAYS = 66;
export default function HabitCard({ habit, onComplete, onDelete }) {
  const progress = Math.min(Math.round((habit.streak / MAX_DAYS) * 100), 100);
  const getColor = () => progress < 33 ? "#ef4444" : progress < 66 ? "#f59e0b" : "#22c55e";
  const isCompletedToday = () => {
    if (!habit.lastCompletedDate) return false;
    const last = new Date(habit.lastCompletedDate);
    const today = new Date();
    return last.getDate() === today.getDate() && last.getMonth() === today.getMonth() && last.getFullYear() === today.getFullYear();
  };
  const done = isCompletedToday();
  return (
    <div className={"habit-card " + (done ? "completed" : "")}>
      <div className="habit-header">
        <div>
          <h3 className="habit-name">{habit.name}</h3>
          {habit.description && <p className="habit-description">{habit.description}</p>}
        </div>
        <button className="btn-delete" onClick={() => onDelete(habit._id)}>X</button>
      </div>
      <div className="progress-wrapper">
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: progress + "%", backgroundColor: getColor(), transition: "width 0.4s ease" }} />
        </div>
        <span className="progress-label">{habit.streak} / {MAX_DAYS} dias ({progress}%)</span>
      </div>
      <button className={"btn-complete " + (done ? "done" : "")} onClick={() => !done && onComplete(habit._id)} disabled={done}>
        {done ? "Completado hoy" : "Marcar como completado"}
      </button>
    </div>
  );
}
EOF

# ── frontend/components/AddHabitForm.jsx
cat > frontend/components/AddHabitForm.jsx << 'EOF'
"use client";
import { useState } from "react";
export default function AddHabitForm({ onAdd }) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (!form.name.trim()) return setError("El nombre del habito es obligatorio.");
    setLoading(true);
    try { await onAdd(form); setForm({ name: "", description: "" }); }
    catch (err) { setError(err.response?.data?.message || "Error al crear habito."); }
    finally { setLoading(false); }
  };
  return (
    <form onSubmit={handleSubmit} className="add-habit-form">
      <h2>Agregar nuevo habito</h2>
      {error && <div className="error-banner">{error}</div>}
      <div className="form-row">
        <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Nombre del habito" className="input-field" required />
        <input type="text" name="description" value={form.description} onChange={handleChange} placeholder="Descripcion (opcional)" className="input-field" />
        <button type="submit" disabled={loading} className="btn-primary">{loading ? "Agregando..." : "+ Agregar"}</button>
      </div>
    </form>
  );
}
EOF

# ── frontend/app/globals.css
cat > frontend/app/globals.css << 'EOF'
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root { --bg: #0f172a; --surface: #1e293b; --surface2: #273548; --border: #334155; --text: #f1f5f9; --text-muted: #94a3b8; --primary: #6366f1; --primary-hover: #4f46e5; --danger: #ef4444; --success: #22c55e; --radius: 12px; --shadow: 0 4px 24px rgba(0,0,0,0.4); }
body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; line-height: 1.6; }
.auth-container { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 1rem; }
.auth-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 2.5rem; width: 100%; max-width: 420px; box-shadow: var(--shadow); }
.auth-card h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.25rem; }
.auth-subtitle { color: var(--text-muted); margin-bottom: 1.75rem; font-size: 0.95rem; }
.auth-form { display: flex; flex-direction: column; gap: 1rem; }
.auth-form label { display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.875rem; font-weight: 500; color: var(--text-muted); }
.auth-form input { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 1rem; padding: 0.65rem 0.85rem; outline: none; transition: border-color 0.2s; }
.auth-form input:focus { border-color: var(--primary); }
.auth-link { margin-top: 1.25rem; text-align: center; font-size: 0.875rem; color: var(--text-muted); }
.auth-link a { color: var(--primary); text-decoration: none; font-weight: 500; }
.btn-primary { background: var(--primary); color: #fff; border: none; border-radius: 8px; padding: 0.7rem 1.25rem; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 0.5rem; }
.btn-primary:hover:not(:disabled) { background: var(--primary-hover); }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-logout { background: transparent; border: 1px solid var(--border); color: var(--text-muted); border-radius: 8px; padding: 0.5rem 1rem; font-size: 0.875rem; cursor: pointer; }
.btn-logout:hover { border-color: var(--danger); color: var(--danger); }
.btn-delete { background: transparent; border: none; color: var(--text-muted); font-size: 1rem; cursor: pointer; padding: 0.25rem 0.5rem; border-radius: 6px; }
.btn-delete:hover { color: var(--danger); }
.btn-complete { width: 100%; padding: 0.6rem; border-radius: 8px; border: none; font-size: 0.9rem; font-weight: 600; cursor: pointer; background: var(--primary); color: #fff; }
.btn-complete:hover:not(:disabled) { background: var(--primary-hover); }
.btn-complete.done { background: rgba(34,197,94,0.15); color: var(--success); cursor: default; }
.dashboard { max-width: 960px; margin: 0 auto; padding: 2rem 1rem 4rem; }
.dashboard-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
.dashboard-header h1 { font-size: 1.75rem; font-weight: 700; }
.dashboard-header p { color: var(--text-muted); font-size: 0.9rem; }
.add-habit-form { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; margin-bottom: 2rem; }
.add-habit-form h2 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.form-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.input-field { flex: 1; min-width: 180px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 0.95rem; padding: 0.65rem 0.85rem; outline: none; }
.input-field:focus { border-color: var(--primary); }
.habits-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
.habit-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
.habit-card:hover { border-color: var(--primary); }
.habit-card.completed { border-color: rgba(34,197,94,0.4); }
.habit-header { display: flex; justify-content: space-between; align-items: flex-start; }
.habit-name { font-size: 1rem; font-weight: 600; }
.habit-description { font-size: 0.825rem; color: var(--text-muted); margin-top: 0.2rem; }
.progress-wrapper { display: flex; flex-direction: column; gap: 0.4rem; }
.progress-bar-bg { width: 100%; height: 8px; background: var(--surface2); border-radius: 999px; overflow: hidden; }
.progress-bar-fill { height: 100%; border-radius: 999px; }
.progress-label { font-size: 0.75rem; color: var(--text-muted); }
.flash-message { position: fixed; bottom: 1.5rem; right: 1.5rem; padding: 0.75rem 1.25rem; border-radius: 10px; font-size: 0.9rem; font-weight: 500; z-index: 999; }
.flash-success { background: rgba(34,197,94,0.2); border: 1px solid var(--success); color: var(--success); }
.flash-error { background: rgba(239,68,68,0.2); border: 1px solid var(--danger); color: var(--danger); }
.error-banner { background: rgba(239,68,68,0.1); border: 1px solid var(--danger); color: var(--danger); border-radius: 8px; padding: 0.65rem 0.85rem; font-size: 0.875rem; margin-bottom: 0.5rem; }
.empty-state { grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted); border: 1px dashed var(--border); border-radius: var(--radius); }
.loading-screen, .loading-text { text-align: center; padding: 3rem; color: var(--text-muted); }
.home-redirect { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
EOF

cat > frontend/.env.local.example << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000/api
EOF

echo ""
echo "✅ TODOS LOS ARCHIVOS CREADOS"
echo ""
echo "Ahora corre:"
echo "  git add ."
echo "  git commit -m 'semana5: middleware JWT, auth frontend, flujo habitos'"
echo "  git push origin semana5"
