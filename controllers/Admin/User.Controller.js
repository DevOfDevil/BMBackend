// controllers/userController.js
const UserServices = require("../../service/user");
const RoleMdl = require("../../models/Role");
var jwt = require("jsonwebtoken");
const config = require("../../config/Config");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const role = await RoleMdl.findOne({ RoleName: "admin" });
    const user = await UserServices.getUserBy({
      EmailAddress: email,
      Password: password,
      RoleID: role._id,
    });
    if (!user) {
      return res.send({
        status: false,
        message: "Email/Password is Incorrect!",
      });
    }
    var token = jwt.sign({ data: user._id }, config.jwt_secret, {
      expiresIn: config.jwt_expire,
    });
    console.log("token:=" + token);
    if (!user) {
      return res.send({
        status: false,
        message: "Email/Password is Incorrect!",
      });
    }

    const userDetails = await UserServices.updateUser(user._id, {
      jwt_token: token,
    });
    return res.send({
      status: true,
      userDetails: {
        Username: userDetails.Username,
        EmailAddress: userDetails.EmailAddress,
        jwt_token: userDetails.jwt_token,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};

const getAllUser = async (req, res) => {
  try {
    const role = await RoleMdl.findOne({ RoleName: "user" });
    const user = await UserServices.getAllUserForBackend({
      RoleID: role._id,
    });
    return res.send({
      status: true,
      Users: user,
    });
  } catch (error) {
    console.error("Error creating user:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};

module.exports = {
  login,
  getAllUser,
};
