const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema({
  Day: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    require: true,
  },
  Time: { type: String, require: true },
});

const Schedule = mongoose.model("Schedule", ScheduleSchema);
module.exports = Schedule;