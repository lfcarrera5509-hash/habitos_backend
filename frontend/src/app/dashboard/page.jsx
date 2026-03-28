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
