// controllers/userController.js
const mongoose = require("mongoose");
const UserServices = require("../service/user");
const RoleMdl = require("../models/Role");
const CategoryMdl = require("../models/Category");
const paymentMdl = require("../models/paymentTransaction");

var jwt = require("jsonwebtoken");
const config = require("../config/Config");
const { ObjectId } = mongoose.Types;

function isValidObjectId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const role = await RoleMdl.findOne({ RoleName: "user" });
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
    // Update the user with the token
    const updateUser = await UserServices.updateUser(user._id, {
      jwt_token: token,
    });
    // Get user details
    const userDetails = await UserServices.getUserFrontendDetails(
      updateUser._id
    );
    if (userDetails.Status == "pending") {
      const getPayment = await paymentMdl.findOne({ userID: updateUser._id });
      return res.send({
        status: true,
        userDetails: userDetails,
        TotalFee: getPayment.TotalPrice,
      });
    } else return res.send({ status: true, userDetails: userDetails });
  } catch (error) {
    console.error("Error creating user:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
/*
const signup = async (req, res) => {
  try {
    const { username, email, password, categoryIds } = req.body;
    // Save the options related to this question
    const optionPromises = categoryIds.map((option) => {
      //wants to check any Category has child category
    });

    let addUser = await UserService.addUser({
      Username: username,
      EmailAddress: email,
      Password: password,
      categoryIDs: categoryIds,
      token: "pre-user",
    });
    var token = jwt.sign({ data: addUser._id }, config.jwt_secret, {
      expiresIn: config.jwt_expire,
    });
    const userDetails = await updateUser.getUserBy(addUser._id, {
      jwt_token: token,
    });
    return res.send({ status: true, userDetails: userDetails });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};
*/
const signup = async (req, res) => {
  try {
    const { username, email, password, categoryIds } = req.body;
    const checkEmailExits = await UserServices.getUserBy({
      EmailAddress: email,
    });
    if (checkEmailExits) {
      return res.send({ status: true, message: "Email Already Exits" });
    }
    // Validate and process category IDs
    const categoryPromises = categoryIds.map(async (categoryId) => {
      if (!isValidObjectId(categoryId)) {
        return {
          status: false,
          message: `Category with ID ${categoryId} is not a valid ObjectId`,
        };
      }

      const category = await CategoryMdl.findById(categoryId); // Check if the category exists
      if (!category) {
        return {
          status: false,
          message: `Category with ID ${categoryId} does not exist`,
        };
      }

      // Check if the category has child categories
      const hasChildren = await CategoryMdl.findOne({
        parentCategory: categoryId,
      });
      if (hasChildren) {
        return {
          status: false,
          message: `Category with ID ${categoryId} has child categories`,
        };
      }

      return { status: true }; // Category is valid
    });

    // Wait for all category checks to complete
    const categoryResults = await Promise.all(categoryPromises);

    // Filter out any errors
    const errors = categoryResults.filter((result) => !result.status);

    // If there are errors, respond with the validation issues
    if (errors.length > 0) {
      const errorMessages = errors.map((error) => error.message).join(", ");
      return res.status(400).send({ status: false, message: errorMessages });
    }

    // Add the user if all categories are valid
    let addUser = await UserServices.addUser({
      Username: username,
      EmailAddress: email,
      Password: password,
      categoryIDs: categoryIds, // Save the array of category IDs
      token: "pre-user",
    });

    // Generate JWT token
    var token = jwt.sign({ data: addUser._id }, config.jwt_secret, {
      expiresIn: config.jwt_expire,
    });

    // Update the user with the token
    const updateUser = await UserServices.updateUser(addUser._id, {
      jwt_token: token,
    });
    console.log(updateUser._id);
    // Get user details
    const userDetails = await UserServices.getUserFrontendDetails(
      updateUser._id
    );
    const TotalFee = userDetails.categoryIDs.reduce(
      (sum, category) => sum + (category.Price || 0),
      0
    );
    const addPayment = new paymentMdl({
      userID: updateUser._id,
      TotalPrice: TotalFee,
    });
    await addPayment.save();
    // Send response with user details
    return res.send({ status: true, userDetails: userDetails, TotalFee });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Error during signup" });
  }
};

module.exports = {
  login,
  signup,
};
