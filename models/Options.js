const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OptionSchema = new Schema(
  {
    Question: {
      type: Schema.Types.ObjectId,
      ref: "Questions",
      required: true,
    },
    Option: {
      type: String,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Option = mongoose.model("Option", OptionSchema);

module.exports = Option;
