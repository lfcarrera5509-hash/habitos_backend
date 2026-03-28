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
