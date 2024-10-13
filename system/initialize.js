const RoleMdl = require("../models/Role");
const PermissionMdl = require("../models/Permission");
const UserMdl = require("../models/User");
const config = require("../config/Config");
const initializeRoles = async () => {
  try {
    const existingRoles = await RoleMdl.find();
    if (existingRoles.length === 0) {
      await RoleMdl.create([{ RoleName: "admin" }, { RoleName: "user" }]);
      console.log("Roles initialized successfully.");
    } else {
      console.log("Roles already exist. No initialization needed.");
    }
  } catch (err) {
    console.error("Error initializing roles:", err);
  }
};
const initializePermission = async () => {
  try {
    const existingPermission = await PermissionMdl.find();
    if (existingPermission.length === 0) {
      await PermissionMdl.create([
        { PermissionName: "audio" },
        { PermissionName: "video" },
        { PermissionName: "all" },
      ]);
      console.log("Permission initialized successfully.");
    } else {
      console.log("Permission already exist. No initialization needed.");
    }
  } catch (err) {
    console.error("Error initializing Permission:", err);
  }
};
const initializeAdmin = async () => {
  try {
    const [role, permission] = await Promise.all([
      RoleMdl.findOne({ RoleName: "admin" }),
      PermissionMdl.findOne({ PermissionName: "all" }),
    ]);

    const existingUser = await UserMdl.find({
      EmailAddress: config.AdminEmail,
    });
    if (existingUser.length === 0) {
      await UserMdl.create({
        Username: "admin",
        EmailAddress: config.AdminEmail,
        Password: config.AdminAccountPassword,
        Status: "approved",
        RoleID: role._id,
        PermissionID: permission._id,
        jwt_token: "initializeAdmin",
      });
      console.log("Admin User Added successfully.");
    } else {
      console.log("Admin already exist. No initialization needed.");
    }
  } catch (err) {
    console.error("Error initializing Permission:", err);
  }
};
module.exports = {
  initializeRoles,
  initializePermission,
  initializeAdmin,
};
