const Habit = require("../models/Habit");

const normalizeDate = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const getYesterday = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday;
};

const getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({
      userId: req.user.id,
      isActive: true,
    });

    const yesterday = getYesterday();

    const updatedHabits = await Promise.all(
      habits.map(async (habit) => {
        if (habit.lastCompletedDate) {
          const lastDate = normalizeDate(habit.lastCompletedDate);

          if (lastDate < yesterday && habit.streakCount > 0) {
            habit.streakCount = 0;
            await habit.save();
          }
        }

        return habit;
      })
    );

    return res.json(updatedHabits);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const createHabit = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name es obligatorio" });
    }

    const habit = await Habit.create({
      userId: req.user.id,
      name,
    });

    return res.status(201).json(habit);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const markHabitDone = async (req, res) => {
  try {
    const { id } = req.params;

    const habit = await Habit.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!habit) {
      return res.status(404).json({ error: "Hábito no encontrado" });
    }

    const today = normalizeDate(new Date());
    const yesterday = getYesterday();

    if (!habit.lastCompletedDate) {
      habit.streakCount = 1;
      habit.lastCompletedDate = today;
    } else {
      const lastDate = normalizeDate(habit.lastCompletedDate);

      if (lastDate.getTime() === today.getTime()) {
        return res.json({
          message: "Este hábito ya fue marcado hoy",
          habit,
        });
      }

      if (lastDate.getTime() === yesterday.getTime()) {
        habit.streakCount += 1;
      } else {
        habit.streakCount = 1;
      }

      habit.lastCompletedDate = today;
    }

    await habit.save();

    return res.json({
      message: "Hábito actualizado correctamente",
      habit,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const deleteHabit = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Habit.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Hábito no encontrado" });
    }

    return res.json({ message: "Hábito eliminado" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getHabits,
  createHabit,
  markHabitDone,
  deleteHabit,
};