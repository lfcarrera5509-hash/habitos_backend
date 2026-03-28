const Habit = require("../models/Habit");
const getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user.id, isActive: true }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, habits });
  } catch (e) { return res.status(500).json({ success: false, message: "Error." }); }
};
const createHabit = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "El nombre es obligatorio." });
    const habit = await Habit.create({ userId: req.user.id, name, description });
    return res.status(201).json({ success: true, habit });
  } catch (e) { return res.status(500).json({ success: false, message: "Error." }); }
};
const completeHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user.id });
    if (!habit) return res.status(404).json({ success: false, message: "Habito no encontrado." });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const alreadyDone = habit.completedDates.some(d => {
      const date = new Date(d); date.setHours(0,0,0,0); return date.getTime() === today.getTime();
    });
    if (alreadyDone) return res.status(400).json({ success: false, message: "Ya completaste este habito hoy." });
    if (habit.lastCompletedDate) {
      const last = new Date(habit.lastCompletedDate); last.setHours(0,0,0,0);
      const diff = Math.round((today - last) / (1000 * 60 * 60 * 24));
      habit.streak = diff === 1 ? habit.streak + 1 : 1;
    } else { habit.streak = 1; }
    habit.lastCompletedDate = today;
    habit.completedDates.push(today);
    await habit.save();
    return res.status(200).json({ success: true, message: "Habito completado!", habit });
  } catch (e) { return res.status(500).json({ success: false, message: "Error." }); }
};
const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id }, { isActive: false }, { new: true }
    );
    if (!habit) return res.status(404).json({ success: false, message: "Habito no encontrado." });
    return res.status(200).json({ success: true, message: "Habito eliminado." });
  } catch (e) { return res.status(500).json({ success: false, message: "Error." }); }
};
module.exports = { getHabits, createHabit, completeHabit, deleteHabit };
