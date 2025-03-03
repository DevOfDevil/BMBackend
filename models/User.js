const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    Username: { type: String, required: true },
    FirstName: { type: String, required: true },
    LastName: { type: String, required: true },
    EmailAddress: { type: String, required: true, unique: true },
    Password: { type: String, required: true },
    DniNieNumber: { type: String, required: true },
    IsResident: { type: Boolean, required: true, default: false },
    Education: { type: String },
    ContactNumber: { type: String, required: true },
    Address: { type: String },
    City: { type: String },
    Gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Male",
    },
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
    Status: {
      type: String,
      enum: ["pending", "approved", "expired"],
      default: "pending",
    },
    ExpiryDate: {
      type: Date,
      default: null,
    },
    LanguageConversionPermission: {
      type: String,
      enum: ["allow", "deny"],
      default: "allow",
    },
    QuestionAllowed: {
      type: String,
      enum: ["25", "50", "75", "100"],
      default: "100",
    },
    PayType: {
      type: String,
      enum: ["Manually", "Online"],
      default: "Online",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
