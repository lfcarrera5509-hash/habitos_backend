"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchHabits } from "../store/habitsSlice";

export default function Home() {
  const dispatch = useDispatch();

  const items = useSelector((state) => state.habits.items);
  const status = useSelector((state) => state.habits.status);
  const error = useSelector((state) => state.habits.error);

  useEffect(() => {
    dispatch(fetchHabits());
  }, [dispatch]);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Hábitos (Semana 2)</h1>

      {status === "loading" && <p>Cargando...</p>}
      {status === "failed" && (
        <p style={{ color: "red" }}>Error: {error}</p>
      )}

      {status === "succeeded" && (
        <ul>
          {items.map((h) => (
            <li key={h._id}>
              {h.name} — <small>{h.userId}</small>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}