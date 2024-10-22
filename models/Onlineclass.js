const mongoose = require("mongoose");

const onlineClassSchema = new mongoose.Schema(
  {
    Title: {
      type: String,
      require: true,
    },
    Thumbnail: {
      type: String,
      require: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Onlineclass = mongoose.model("Onlineclass", onlineClassSchema);
module.exports = Onlineclass;
