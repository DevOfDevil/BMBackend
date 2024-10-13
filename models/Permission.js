const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
  PermissionName: {
    type: String,
    enum: ["audio", "video", "all"],
  },
});

const Permission = mongoose.model("Permission", permissionSchema);
module.exports = Permission;
