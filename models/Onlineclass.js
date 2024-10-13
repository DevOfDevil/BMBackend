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
  },
  { timestamps: true }
);

const Onlineclass = mongoose.model("Onlineclass", onlineClassSchema);
module.exports = Onlineclass;
