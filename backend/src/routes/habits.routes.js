const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
  getHabits,
  createHabit,
  markHabitDone,
  deleteHabit,
} = require("../controllers/habits.controller");

const router = express.Router();

router.get("/", authMiddleware, getHabits);
router.post("/", authMiddleware, createHabit);
router.patch("/:id/done", authMiddleware, markHabitDone);
router.delete("/:id", authMiddleware, deleteHabit);

module.exports = router;