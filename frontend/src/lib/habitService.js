const API_URL = "http://localhost:3000/api/habits";

export const getHabits = async (token) => {
  const response = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};

export const createHabit = async (name, token) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  return response.json();
};

export const markHabitDone = async (habitId, token) => {
  const response = await fetch(`${API_URL}/${habitId}/done`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};