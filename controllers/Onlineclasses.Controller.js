// controllers/userController.js
const OnlineclassMdl = require("../models/Onlineclass");

const getOnlineClasses = async (req, res) => {
  try {
    const Onlineclass = await OnlineclassMdl.find();
    return res.send({ status: true, Onlineclasses: Onlineclass });
  } catch (error) {
    console.error("Error getting Online class:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};

module.exports = {
  getOnlineClasses,
};
