const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const questionSchema = new Schema(
  {
    Chapter: {
      type: Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
    },
    Question: {
      type: String,
      required: true,
    },
    imageURL: {
      type: String,
      default: null,
    },
    AudioUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
