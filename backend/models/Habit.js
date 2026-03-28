const mongoose = require("mongoose");
const habitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: "" },
  streak: { type: Number, default: 0 },
  lastCompletedDate: { type: Date, default: null },
  completedDates: { type: [Date], default: [] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
habitSchema.virtual("progress").get(function () {
  return Math.min(Math.round((this.streak / 66) * 100), 100);
});
habitSchema.set("toJSON", { virtuals: true });
module.exports = mongoose.model("Habit", habitSchema);
