// controllers/userController.js
const mongoose = require("mongoose");
const UserServices = require("../service/user");
const RoleMdl = require("../models/Role");
const DeviceMdl = require("../models/userDevice");
const CategoryMdl = require("../models/Category");
const CategoryPurchasedMdl = require("../models/CategoryPurchased");
const paymentMdl = require("../models/paymentTransaction");
const QuizMdl = require("../models/Quiz");
const ChapterMdl = require("../models/Chapter");

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
    } = req.body;

    const checkEmailExits = await UserServices.getUserBy({
      EmailAddress: email,
    });
    if (checkEmailExits) {
      return res.send({ status: false, message: "Email Already Exits" });
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

    // Add the user if all categories are valid
    let addUser = await UserServices.addUser({
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
      PayType: "Online",
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
      // Generate JWT token
      var token = jwt.sign({ data: addUser._id }, config.jwt_secret, {
        expiresIn: config.jwt_expire,
      });
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
    } else {
      return res.send({ status: false, message: "Error during signup" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Error during signup" });
  }
};

const getMycategories = async (req, res) => {
  try {
    const myCategories = await CategoryMdl.find({
      _id: { $in: req.userDetails.categoryIDs },
    }).select("_id name description");
    return res.send({ status: true, myCategories: myCategories });
  } catch (error) {
    console.error("Error creating user:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};

const getMyQuizzes = async (req, res) => {
  try {
    // Find quizzes that belong to the user's selected categories and populate the category data in one query
    const myQuizzes = await QuizMdl.find({
      isDeleted: false,
      Category: { $in: req.userDetails.categoryIDs }, // Filter quizzes by the user's selected category IDs
    })
      .populate("Category", "_id name description")
      .select("_id Title Description"); // Populate the category field with only _id, name, and description

    // Iterate through each quiz and find the chapter count
    const quizzesWithChapterCount = await Promise.all(
      myQuizzes.map(async (quiz) => {
        const chapterCount = await ChapterMdl.countDocuments({
          isDeleted: false,
          QuizID: quiz._id, // Count chapters where QuizID matches the quiz
        });

        // Attach the chapter count to the quiz object
        return {
          ...quiz.toObject(), // Convert the Mongoose document to a plain object
          chapterCount, // Add the chapter count
        };
      })
    );

    return res.send({ status: true, myQuizzes: quizzesWithChapterCount });
  } catch (error) {
    console.error("Error fetching quizzes:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};

/*
const getMyChapters = async (req, res) => {
  try {
    // Find chapters where the related quiz belongs to the user's selected categories
    const myChapters = await ChapterMdl.find({
      isDeleted: false,
    })
      .populate({
        path: "QuizID", // Populate the quiz field
        match: {
          Category: { $in: req.userDetails.categoryIDs },
          isDeleted: false,
        }, // Filter quizzes by the user's selected categories
        select: "_id Title Description category", // Select necessary quiz fields
        populate: {
          path: "Category", // Populate the category field within each quiz
          match: {
            _id: { $in: req.userDetails.categoryIDs },
            isDeleted: false,
          },
          select: "_id name description",
        },
      })
      .select("_id Title Description");
    // Filter out chapters that do not have populated quizzes (because they didn't match the category)
    const filteredChapters = myChapters.filter(
      (chapter) => chapter.QuizID !== null
    );

    return res.send({ status: true, myChapters: filteredChapters });
  } catch (error) {
    console.error("Error fetching chapters:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
*/
/*
const getMyChapters = async (req, res) => {
  try {
    // Find chapters where the related quiz belongs to the user's selected categories
    const myChapters = await ChapterMdl.find({
      isDeleted: false,
    })
      .populate({
        path: "QuizID", // Populate the quiz field
        match: {
          Category: { $in: req.userDetails.categoryIDs },
          isDeleted: false,
        }, // Filter quizzes by the user's selected categories
        select: "_id Title Description category", // Select necessary quiz fields
        populate: {
          path: "Category", // Populate the category field within each quiz
          match: {
            _id: { $in: req.userDetails.categoryIDs },
            isDeleted: false,
          },
          select: "_id name description",
        },
      })
      .select("_id Title Description");

    // Filter out chapters that do not have populated quizzes (because they didn't match the category)
    const filteredChapters = myChapters.filter(
      (chapter) => chapter.QuizID !== null
    );

    // Determine the clickable percentage based on QuestionAllowed value
    const percentage = req.userDetails.QuestionAllowed; // Can be 25, 50, 75, or 100
    console.log("percentage:=", percentage);
    const totalChapters = filteredChapters.length;
    const clickableCount = Math.floor((percentage / 100) * totalChapters);
    console.log("clickableCount:=", clickableCount);
    // Assign clickable property to the first `clickableCount` chapters
    // Convert chapters to plain JavaScript objects and add the `clickable` property
    const resultChapters = filteredChapters.map((chapter, index) => {
      // Convert to plain object to add properties
      const chapterObj = chapter.toObject();
      chapterObj.clickable = index < clickableCount;
      return chapterObj;
    });

    return res.send({ status: true, myChapters: resultChapters });
  } catch (error) {
    console.error("Error fetching chapters:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
*/
const getMyChapters = async (req, res) => {
  try {
    // Fetch chapters related to the user's selected categories
    const myChapters = await ChapterMdl.find({
      isDeleted: false,
    })
      .populate({
        path: "QuizID",
        match: {
          Category: { $in: req.userDetails.categoryIDs },
          isDeleted: false,
        },
        select: "_id Title Description category",
        populate: {
          path: "Category",
          match: {
            _id: { $in: req.userDetails.categoryIDs },
            isDeleted: false,
          },
          select: "_id name description",
        },
      })
      .select("_id Title Description");

    // Filter chapters that have populated quizzes
    const filteredChapters = myChapters.filter(
      (chapter) => chapter.QuizID !== null
    );

    // Group chapters by QuizID
    const chaptersByQuiz = filteredChapters.reduce((acc, chapter) => {
      const quizId = chapter.QuizID._id.toString();
      if (!acc[quizId]) {
        acc[quizId] = [];
      }
      acc[quizId].push(chapter);
      return acc;
    }, {});

    // Retrieve the allowed percentage for clickable chapters
    const allowedPercentage = req.userDetails.QuestionAllowed; // 25 or 50, for example
    const resultChapters = [];

    // Set clickable property for each QuizID group based on the allowed percentage
    for (const quizId in chaptersByQuiz) {
      const chapters = chaptersByQuiz[quizId];
      const totalChapters = chapters.length;
      const clickableCount = Math.ceil(
        (allowedPercentage / 100) * totalChapters
      );
      // Set `clickable: true` for the allowed percentage of chapters, others are `clickable: false`
      const processedChapters = chapters.map((chapter, index) => {
        const chapterObj = chapter.toObject();
        chapterObj.clickable = index < clickableCount;
        return chapterObj;
      });

      resultChapters.push(...processedChapters);
    }

    return res.send({ status: true, myChapters: resultChapters });
  } catch (error) {
    console.error("Error fetching chapters:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
/*
const getChapterByQuizID = async (req, res) => {
  try {
    const { QuizID } = req.params;
    // Find chapters where the related quiz belongs to the user's selected categories
    const myChapters = await ChapterMdl.find({
      isDeleted: false,
      QuizID: QuizID,
    })
      .populate({
        path: "QuizID", // Populate the quiz field
        match: {
          Category: { $in: req.userDetails.categoryIDs },
          isDeleted: false,
        }, // Filter quizzes by the user's selected categories
        select: "_id Title Description category", // Select necessary quiz fields
        populate: {
          path: "Category", // Populate the category field within each quiz
          match: {
            _id: { $in: req.userDetails.categoryIDs },
            isDeleted: false,
          },
          select: "_id name description",
        },
      })
      .select("_id Title Description")
      .exec();

    // const filteredChapters = myChapters
    //   .filter((chapter) => chapter.QuizID !== null)
    //   .map((chapter) => {
    //     const { QuizID, ...chapterWithoutQuizID } = chapter.toObject(); // Exclude QuizID
    //     return chapterWithoutQuizID;
    //   });
    const filteredChapters = myChapters
      .filter((chapter) => chapter.QuizID !== null)
      .map((chapter) => {
        const { QuizID, ...chapterWithoutQuizID } = chapter.toObject(); // Get QuizID object
        return {
          ...chapterWithoutQuizID, // Include chapter fields
          quizTitle: QuizID.Title, // Only include QuizID.Title and rename it to 'quizTitle'
        };
      });

    return res.send({ status: true, myChapters: filteredChapters });
  } catch (error) {
    console.error("Error fetching chapters:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
*/

const getChapterByQuizID = async (req, res) => {
  try {
    const { QuizID } = req.params;

    // Fetch chapters for the specified QuizID
    const myChapters = await ChapterMdl.find({
      isDeleted: false,
      QuizID: QuizID,
    })
      .populate({
        path: "QuizID",
        match: {
          Category: { $in: req.userDetails.categoryIDs },
          isDeleted: false,
        },
        select: "_id Title Description category",
        populate: {
          path: "Category",
          match: {
            _id: { $in: req.userDetails.categoryIDs },
            isDeleted: false,
          },
          select: "_id name description",
        },
      })
      .select("_id Title Description")
      .exec();

    // Filter chapters with populated QuizID
    const filteredChapters = myChapters
      .filter((chapter) => chapter.QuizID !== null)
      .map((chapter) => {
        const { QuizID, ...chapterWithoutQuizID } = chapter.toObject();
        return {
          ...chapterWithoutQuizID,
          quizTitle: QuizID.Title,
        };
      });

    // Determine the clickable percentage based on QuestionAllowed
    const allowedPercentage = req.userDetails.QuestionAllowed;
    const totalChapters = filteredChapters.length;
    const clickableCount = Math.ceil((allowedPercentage / 100) * totalChapters);

    // Set clickable: true for the allowed percentage of chapters
    const resultChapters = filteredChapters.map((chapter, index) => ({
      ...chapter,
      clickable: index < clickableCount,
    }));

    return res.send({ status: true, myChapters: resultChapters });
  } catch (error) {
    console.error("Error fetching chapters:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};

const getMyCateogryTree = async (req, res) => {
  try {
    // Step 1: Get categories assigned to the user
    const myCategories = await CategoryMdl.find({
      _id: { $in: req.userDetails.categoryIDs },
    })
      .select("_id name description")
      .sort({ name: 1 }); // Sort categories alphabetically by name

    // Step 2: Get quizzes related to the categories
    //console.log("req.userDetails.categoryIDs:=", req.userDetails.categoryIDs);
    const myQuizzes = await QuizMdl.find({
      isDeleted: false,
      Category: { $in: req.userDetails.categoryIDs },
    })
      .select("_id Title Description Category")
      .sort({ Title: 1 }); // Sort quizzes alphabetically by title
    //console.log("myQuizzes:=", myQuizzes);
    // Step 3: Get chapters related to the quizzes
    const quizIDs = myQuizzes.map((quiz) => quiz._id);
    // console.log("quizIDs:=", quizIDs);
    const myChapters = await ChapterMdl.find({
      isDeleted: false,
      QuizID: { $in: quizIDs },
    })
      .select("_id Title Description QuizID")
      .sort({ Title: 1 }); // Sort chapters alphabetically by title
    //console.log("myChapters:=", myChapters);
    // Step 4: Structure the data as you need
    const result = myCategories.map((category) => {
      // Find quizzes for this category
      const quizzesForCategory = myQuizzes
        .filter((quiz) => String(quiz.Category) === String(category._id))
        .map((quiz) => {
          // Find chapters for this quiz
          const chaptersForQuiz = myChapters.filter(
            (chapter) => String(chapter.QuizID) === String(quiz._id)
          );
          return {
            _id: quiz._id,
            Title: quiz.Title,
            Description: quiz.Description,
            chapters: chaptersForQuiz,
          };
        });
      return {
        _id: category._id,
        name: category.name,
        description: category.description,
        quizzes: quizzesForCategory,
      };
    });

    return res.send({ status: true, myCategories: result });
  } catch (error) {
    console.error("Error fetching data:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};

module.exports = {
  login,
  signup,
  getMycategories,
  getMyQuizzes,
  getMyChapters,
  getMyCateogryTree,
  getChapterByQuizID,
};
