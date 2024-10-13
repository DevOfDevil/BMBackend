// middleware function is just a function that has access to req/res objects
// then uses next to move on to the next middlware function

const jwt = require("jsonwebtoken");
require("dotenv").config();
const UserMdl = require("../models/User");
const RoleMdl = require("../models/Role");
const jwtSecret = process.env.jwtSecret;

module.exports = async function (req, res, next) {
  try {
    const role = await RoleMdl.findOne({ RoleName: "user" });
    const authHeader = req.headers["authorization"];
    const token = authHeader.split(" ")[1] || authHeader;
    if (token == null)
      return res.status(401).json({ status: false, message: "token error" });
    jwt.verify(token, jwtSecret, async (err, decode) => {
      if (err)
        return res
          .status(401)
          .json({ status: false, message: "token error invalid" });

      const user = await UserMdl.find({ _id: decode._id, RoleID: role._id });
      if (user?.jwt_token != token)
        return res.status(401).json({ status: false, message: "token error" });

      req.userDetails = user;
      next();
    });
  } catch (error) {
    console.log("error:=", error.message);
    return res.status(401).json({ status: false, message: "token error" });
  }
};
