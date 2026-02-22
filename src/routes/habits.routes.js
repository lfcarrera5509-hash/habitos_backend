const express = require("express");
const Habit = require("../models/Habit");

const router = express.Router();

// ALTA: crear hábito
router.post("/", async (req, res) => {
  try {
    const { userId, name } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: "userId y name son obligatorios" });
    }

    const habit = await Habit.create({ userId, name });
    return res.status(201).json(habit);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// CAMBIO: actualizar hábito
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const habit = await Habit.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!habit) {
      return res.status(404).json({ error: "Hábito no encontrado" });
    }

    return res.json(habit);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// BAJA: eliminar hábito
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Habit.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Hábito no encontrado" });
    }

    return res.json({ message: "Hábito eliminado" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;