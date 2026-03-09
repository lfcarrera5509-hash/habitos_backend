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
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-4xl font-bold text-slate-800">
          Hábitos - Semana 3
        </h1>
        <p className="mb-8 text-slate-600">
          Lista dinámica de hábitos usando Redux + Tailwind CSS
        </p>

        {status === "loading" && (
          <p className="rounded-lg bg-white p-4 text-slate-700 shadow">
            Cargando hábitos...
          </p>
        )}

        {status === "failed" && (
          <p className="rounded-lg bg-red-100 p-4 text-red-700 shadow">
            Error: {error}
          </p>
        )}

        {status === "succeeded" && items.length === 0 && (
          <p className="rounded-lg bg-white p-4 text-slate-700 shadow">
            No hay hábitos registrados.
          </p>
        )}

        {status === "succeeded" && items.length > 0 && (
          <div className="space-y-4">
            {items.map((habit) => (
              <div
                key={habit._id}
                className="rounded-xl bg-white p-5 shadow-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">
                      {habit.name}
                    </h2>
                    <p className="text-sm text-slate-500">
                      Usuario: {habit.userId}
                    </p>
                  </div>

                  <button className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700">
                    Done
                  </button>
                </div>

                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">
                    Progreso
                  </span>
                  <span className="text-sm text-slate-500">25 / 66 días</span>
                </div>

                <div className="h-4 w-full overflow-hidden rounded-full bg-red-200">
                  <div className="h-4 w-1/3 rounded-full bg-yellow-400"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}