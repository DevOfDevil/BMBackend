const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    Username: { type: String, required: true },
    EmailAddress: { type: String, required: true, unique: true },
    Password: { type: String, required: true },
    jwt_token: { type: String, required: true },
    categoryIDs: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    ], // can now story array
    RoleID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    PermissionID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Permission",
      required: true,
    },
    Status: { type: String, enum: ["pending", "approved"], default: "pending" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
