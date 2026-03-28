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
