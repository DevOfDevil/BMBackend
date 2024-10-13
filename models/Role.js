const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  RoleName: {
    type: String,
    enum: ["admin", "user"],
  },
});

const Role = mongoose.model("Role", roleSchema);
module.exports = Role;
