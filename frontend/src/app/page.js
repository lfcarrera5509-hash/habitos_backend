"use client";

import { useEffect, useState } from "react";
import { loginUser, registerUser } from "../lib/authService";
import { getHabits, createHabit, markHabitDone } from "../lib/habitService";

export default function Home() {
  const [token, setToken] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [habitName, setHabitName] = useState("");
  const [habits, setHabits] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("token");

    if (savedToken) {
      setToken(savedToken);
      loadHabits(savedToken);
    }
  }, []);

  const loadHabits = async (currentToken) => {
    const data = await getHabits(currentToken);

    if (Array.isArray(data)) {
      setHabits(data);
    } else {
      setHabits([]);
    }
  };

  const handleAuthChange = (e) => {
    setAuthForm({
      ...authForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (isLogin) {
      const data = await loginUser({
        email: authForm.email,
        password: authForm.password,
      });

      if (data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setMessage("Login exitoso");
        loadHabits(data.token);
      } else {
        setMessage(data.error || "Error al iniciar sesión");
      }
    } else {
      const data = await registerUser(authForm);

      if (data.user) {
        setMessage("Usuario registrado correctamente. Ahora inicia sesión.");
        setIsLogin(true);
        setAuthForm({
          name: "",
          email: "",
          password: "",
        });
      } else {
        setMessage(data.error || "Error al registrar usuario");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setHabits([]);
    setMessage("Sesión cerrada");
  };

  const handleCreateHabit = async (e) => {
    e.preventDefault();

    if (!habitName.trim()) {
      setMessage("Escribe el nombre del hábito");
      return;
    }

    const data = await createHabit(habitName, token);

    if (data._id) {
      setHabitName("");
      setMessage("Hábito creado correctamente");
      loadHabits(token);
    } else {
      setMessage(data.error || "Error al crear hábito");
    }
  };

  const handleDone = async (habitId) => {
    const data = await markHabitDone(habitId, token);

    if (data.habit) {
      setMessage(data.message || "Hábito actualizado");
      loadHabits(token);
    } else {
      setMessage(data.error || "Error al marcar hábito");
    }
  };

  const getProgressPercent = (streakCount) => {
    return Math.min((streakCount / 66) * 100, 100);
  };

  const getProgressColor = (progress) => {
    if (progress < 34) return "bg-red-500";
    if (progress < 67) return "bg-yellow-400";
    return "bg-green-500";
  };

  if (!token) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-md">
          <h1 className="mb-2 text-3xl font-bold text-slate-800">
            Habit Tracker
          </h1>
          <p className="mb-6 text-slate-600">
            {isLogin ? "Inicia sesión" : "Crea tu cuenta"}
          </p>

          {message && (
            <p className="mb-4 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
              {message}
            </p>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {!isLogin && (
              <input
                type="text"
                name="name"
                placeholder="Nombre"
                value={authForm.name}
                onChange={handleAuthChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2"
              />
            )}

            <input
              type="email"
              name="email"
              placeholder="Correo"
              value={authForm.email}
              onChange={handleAuthChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-2"
            />

            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              value={authForm.password}
              onChange={handleAuthChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-2"
            />

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              {isLogin ? "Login" : "Register"}
            </button>
          </form>

          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage("");
            }}
            className="mt-4 text-sm font-medium text-blue-600 hover:underline"
          >
            {isLogin
              ? "¿No tienes cuenta? Regístrate"
              : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-800">
              Hábitos - Semana 4
            </h1>
            <p className="text-slate-600">
              Seguimiento de racha + botón Done + barra dinámica
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {message && (
          <p className="mb-4 rounded-lg bg-white p-4 text-slate-700 shadow">
            {message}
          </p>
        )}

        <form
          onSubmit={handleCreateHabit}
          className="mb-8 flex gap-3 rounded-xl bg-white p-4 shadow-md"
        >
          <input
            type="text"
            placeholder="Nuevo hábito"
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2"
          />

          <button
            type="submit"
            className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
          >
            Agregar
          </button>
        </form>

        {habits.length === 0 ? (
          <p className="rounded-lg bg-white p-4 text-slate-700 shadow">
            No hay hábitos registrados.
          </p>
        ) : (
          <div className="space-y-4">
            {habits.map((habit) => {
              const progress = getProgressPercent(habit.streakCount);
              const progressColor = getProgressColor(progress);

              return (
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
                        Racha actual: {habit.streakCount} día(s)
                      </p>
                    </div>

                    <button
                      onClick={() => handleDone(habit._id)}
                      className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700"
                    >
                      Done
                    </button>
                  </div>

                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">
                      Progreso
                    </span>
                    <span className="text-sm text-slate-500">
                      {habit.streakCount} / 66 días
                    </span>
                  </div>

                  <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-4 rounded-full ${progressColor}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}