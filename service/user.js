const User = require("../models/User");
const RoleMdl = require("../models/Role");
const PermissionMdl = require("../models/Permission");

const getUserBy = async (payload) => {
  try {
    const post = await User.findOne(payload);
    return post;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const addUser = async (payload) => {
  try {
    // Fetch Role and Permission IDs by their names
    const [role, permission] = await Promise.all([
      RoleMdl.findOne({ RoleName: "user" }),
      PermissionMdl.findOne({ PermissionName: "all" }),
    ]);

    if (!role) throw new Error(`Role '${payload.RoleName}' not found.`);
    if (!permission)
      throw new Error(`Permission '${payload.PermissionName}' not found.`);

    const post = new User({
      Username: payload.Username,
      EmailAddress: payload.EmailAddress,
      Password: payload.Password,
      categoryIDs: payload.categoryIDs,
      FirstName: payload.FirstName,
      LastName: payload.LastName,
      RoleID: role._id,
      PermissionID: permission._id,
      jwt_token: payload.token,
      PayType: payload.PayType,
      DniNieNumber: payload.DniNumber,
      IsResident: payload.IsResident,
      Education: payload.Education,
      ContactNumber: payload.ContactNumber,
      Address: payload.Address,
      City: payload.City,
      Gender: payload.Gender,
      ExpiryDate: payload.ExpiryDate,
      Status: payload.Status,
    });

    await post.save();

    return post;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const addUserByAdmin = async (payload) => {
  try {
    const post = new User({
      Username: payload.Username,
      EmailAddress: payload.EmailAddress,
      Password: payload.Password,
      categoryIDs: payload.categoryIDs,
      FirstName: payload.FirstName,
      LastName: payload.LastName,
      jwt_token: payload.token,
      PayType: payload.PayType,
      DniNieNumber: payload.DniNumber,
      IsResident: payload.IsResident,
      Education: payload.Education,
      ContactNumber: payload.ContactNumber,
      Address: payload.Address,
      City: payload.City,
      Gender: payload.Gender,
      ExpiryDate: payload.ExpiryDate,
      LanguageConversionPermission: payload.LanguageConversionPermission,
      QuestionAllowed: payload.QuestionAllowed,
      RoleID: payload.RoleID,
      PermissionID: payload.PermissionID,
    });

    await post.save();

    return post;
  } catch (error) {
    console.log(error);
    return null;
  }
};
const updateUser = async (userID, payload, files = null) => {
  try {
    await User.updateOne({ _id: userID }, { ...payload, updated: Date.now() });
    return User.findOne({ _id: userID });
  } catch (error) {
    console.log(error);
    return null;
  }
};
/*
const deleteUser = async (userId) => {
	try {
		const post = await User.findOne({ _id: userId });
		post.deleted = true;
		await post.save();
		return post;
		// res.status(204).send();
	} catch (error) {
		console.log(error);
		return null;
	}
}
*/

const getUserFrontendDetails = async (userId) => {
  try {
    const user = await User.findOne({ _id: userId })
      .populate("RoleID", "RoleName") // Populates RoleID with RoleName
      .populate("PermissionID", "PermissionName") // Populates PermissionID with PermissionName
      .populate("categoryIDs");

    if (!user) {
      console.log("User not found.");
      return;
    }

    // Format the response to include RoleName and PermissionName
    const userDetails = {
      _id: user._id,
      Username: user.Username,
      FirstName: user.FirstName,
      LastName: user.LastName,
      EmailAddress: user.EmailAddress,
      RoleName: user.RoleID?.RoleName, // RoleID is now populated with the document
      PermissionName: user.PermissionID?.PermissionName, // PermissionID is now populated with the document
      DniNieNumber: user.DniNieNumber,
      Education: user.Education,
      IsResident: user.IsResident,
      ContactNumber: user.ContactNumber,
      Address: user.Address,
      City: user.City,
      Gender: user.Gender,
      Status: user.Status,
      jwt_token: user.jwt_token,
      categoryIDs: user.categoryIDs.map((category) => ({
        _id: category._id,
        name: category.name,
        description: category.description,
        Price: category.Price,
      })), // Map the categoryIDs to include required fields
    };

    return userDetails;
    //console.log("User details:", userDetails);
  } catch (error) {
    console.error("Error fetching user:", error.message);
  }
};

const getAllUserForBackend = async (Payload) => {
  try {
    const Users = await User.find({ ...Payload })
      .populate("RoleID", "RoleName") // Populates RoleID with RoleName
      .populate("PermissionID", "PermissionName") // Populates PermissionID with PermissionName
      .populate("categoryIDs")
      .sort({ createdAt: -1 });

    return Users;
  } catch (error) {
    console.error("Error fetching user:", error.message);
  }
};

module.exports = {
  getUserBy,
  addUser,
  updateUser,
  getUserFrontendDetails,
  getAllUserForBackend,
  addUserByAdmin,
};
