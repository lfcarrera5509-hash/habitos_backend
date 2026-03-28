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
