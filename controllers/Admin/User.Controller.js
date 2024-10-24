const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const UserServices = require("../../service/user");
const RoleMdl = require("../../models/Role");
const PermissionMdl = require("../../models/Permission");
const DeviceMdl = require("../../models/userDevice");
const CategoryMdl = require("../../models/Category");
const CategoryPurchasedMdl = require("../../models/CategoryPurchased");
const paymentMdl = require("../../models/paymentTransaction");

var jwt = require("jsonwebtoken");
const config = require("../../config/Config");
function isValidObjectId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

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

const addUser = async (req, res) => {
  try {
    const {
      username,
      FirstName,
      LastName,
      email,
      password,
      categoryIds,
      DeviceType,
      DeviceMac,
      DniNumber,
      IsResident,
      Education,
      ContactNumber,
      Address,
      City,
      Gender,
      Permission, //"audio", "video", "all"
      ExpiryDate,
      LanguageConversionPermission, //"allow", "deny"
      QuestionAllowed, //"25", "50", "75", "100"
      PaidAmount,
    } = req.body;
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

      return { status: true, category }; // Category is valid
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

    const [role, permission] = await Promise.all([
      RoleMdl.findOne({ RoleName: "user" }),
      PermissionMdl.findOne({ PermissionName: Permission }),
    ]);

    if (!role)
      return res.status(400).send({ status: false, message: "Role Not Found" });
    if (!permission)
      return res
        .status(400)
        .send({ status: false, message: "Permission Not Found" });

    let addUser = await UserServices.addUserByAdmin({
      Username: username,
      FirstName: FirstName,
      LastName: LastName,
      EmailAddress: email,
      Password: password,
      categoryIDs: categoryIds, // Save the array of category IDs
      DniNumber: DniNumber,
      IsResident: IsResident,
      Education: Education,
      ContactNumber: ContactNumber,
      Address: Address,
      City: City,
      Gender: Gender,
      token: "pre-user",
      PayType: "Manually",
      ExpiryDate: ExpiryDate != null ? ExpiryDate : null,
      LanguageConversionPermission: LanguageConversionPermission,
      QuestionAllowed: QuestionAllowed,
      RoleID: role._id,
      PermissionID: permission._id,
    });

    if (addUser) {
      //add Device Data
      const AddDevic = new DeviceMdl({
        device_name: DeviceType,
        device_mac: DeviceMac,
        user_id: addUser._id,
        is_activated: true,
      });
      await AddDevic.save();
      //Add Category seperatly
      const AddCatPaymentProcess = categoryResults.map(async (category) => {
        const addCatPayment = new CategoryPurchasedMdl({
          userID: addUser._id,
          CatID: category.category._id,
          CatPrice: category.category.Price,
          IsDeleted: false,
        });
        await addCatPayment.save();
      });

      // Wait for all category checks to complete
      const AddCatPaymentResults = await Promise.all(AddCatPaymentProcess);
      const TotalFee = categoryResults.reduce(
        (sum, category) => sum + (category.Price || 0),
        0
      );
      const addPayment = new paymentMdl({
        userID: addUser._id,
        TotalPrice: TotalFee,
        isPaid: true,
        PaidAmount: PaidAmount,
        TransactionHash: "Added By Admin",
      });
      await addPayment.save();

      const user = await UserServices.getAllUserForBackend({
        RoleID: role._id,
      });
      return res.send({
        status: true,
        Users: user,
      });
    } else {
      return res.send({ status: false, message: "Error Adding User" });
    }
  } catch (error) {
    console.error("Error creating user:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
module.exports = {
  login,
  getAllUser,
  addUser,
};
