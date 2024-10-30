const mongoose = require("mongoose");
const Double = require("@mongoosejs/double");

const ReportDetailsSchema = new mongoose.Schema(
  {
    ReportingID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reporting",
      required: true,
    },
    QuestionID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    GivenOptions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Option",
        required: true,
      },
    ],
    SelectedOption: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Option",
    },
    CorrectOption: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Option",
      required: true,
    },
  },
  { timestamps: true }
);

const ReportDetails = mongoose.model("ReportDetails", ReportDetailsSchema);

module.exports = ReportDetails;
