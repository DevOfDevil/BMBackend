const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");

const reportingSchema = new mongoose.Schema(
  {
    UserID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    CategoryID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    QuizID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    ChapterID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
    },
    TestType: {
      type: String,
      enum: ["revision", "practice", "test"],
      default: "revision",
    },
    status: {
      type: String,
      enum: ["in-process", "complete"],
      default: "in-process",
    },
    StartDate: {
      type: Date,
      default: Date.now, // Sets the current date and time
      required: true,
    },
    EndDate: {
      type: Date,
      required: false,
    },
    completeTime: {
      type: String,
    },
    ResultPercentage: {
      type: Double,
      default: 0.0,
    },
  },
  { timestamps: true }
);

const Reporting = mongoose.model("Reporting", reportingSchema);

module.exports = Reporting;
