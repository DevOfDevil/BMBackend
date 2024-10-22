const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema({
  Title: {
    type: String,
    require: true,
  },
  Day: {
    type: String,
    enum: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    require: true,
  },
  Time: { type: String, require: true },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

const Schedule = mongoose.model("Schedule", ScheduleSchema);
module.exports = Schedule;
