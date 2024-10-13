// controllers/userController.js
const QuizMdl = require("../../models/Quiz");
const CategoryMdl = require("../../models/Category");

const GetQuizByCatID = async (req, res) => {
  try {
    const { CatID } = req.params;
    const Quizs = await QuizMdl.find({ Category: CatID }).populate("Category");
    return res.send({ status: true, Quizs: Quizs });
  } catch (error) {
    console.error("Error getting Quiz:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
const addQuiz = async (req, res) => {
  try {
    const { CatID, Title, Description, isDeleted = 0 } = req.body;
    // Check if the CatID has no child categories
    const hasChildCategory = await CategoryMdl.findOne({
      parentCategory: CatID,
    });

    if (hasChildCategory) {
      return res.send({
        status: false,
        message: "Category has child categories and cannot add quiz to it.",
      });
    }

    const Quiz = new QuizMdl({
      Category: CatID,
      Title: Title,
      Description: Description,
      isDeleted: isDeleted,
    });
    await Quiz.save();
    const Quizs = await QuizMdl.find({ Category: CatID }).populate("Category");
    return res.send({ status: true, Quizs: Quizs });
  } catch (error) {
    console.error("Error creating user:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
const ListAllQuiz = async (req, res) => {
  try {
    const Quizs = await QuizMdl.find().populate("Category");
    return res.send({ status: true, Quizs: Quizs });
  } catch (error) {
    console.error("Error getting Quiz:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
module.exports = {
  addQuiz,
  GetQuizByCatID,
  ListAllQuiz,
};
