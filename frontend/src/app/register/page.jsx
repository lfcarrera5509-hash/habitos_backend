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
