// controllers/userController.js
const QuizMdl = require("../../models/Quiz");
const CategoryMdl = require("../../models/Category");
const ChapterMdl = require("../../models/Chapter");

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

const getQuizById = async (req, res) => {
  try {
    const { QuizID } = req.params.QuizID;
    const Quiz = await QuizMdl.find({ _id: QuizID });
    if (!Quiz) {
      return res.send({
        status: false,
        message: "Quiz not found",
      });
    }
    return res.send({
      status: true,
      Quiz: Quiz,
    });
  } catch (error) {
    return res.send({
      status: false,
      message: "something went wrong!",
    });
  }
};
const deleteQuiz = async (req, res) => {
  try {
    const { QuizID } = req.params.QuizID;
    const findChapter = await ChapterMdl.find({ QuizID: QuizID });
    if (findChapter) {
      return res.send({
        status: false,
        message: "Quiz assigned to chapter already!",
      });
    }

    const deleteQuiz = await QuizMdl.findByIdAndUpdate(QuizID, {
      isDeleted: true,
      updated: Date.now(),
    });

    const Quizs = await QuizMdl.find({ Category: CatID }).populate("Category");
    return res.send({ status: true, Quizs: Quizs });
  } catch (error) {
    return res.send({
      status: false,
      message: "something went wrong!",
    });
  }
};
const updateQuiz = async (req, res) => {
  try {
    const { CatID, Title, Description, QuizID } = req.body;
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

    // Save the question
    const updateQuiz = await QuizMdl.findByIdAndUpdate(
      QuizID,
      { Title: Title, Description: Description, updated: Date.now() },
      { new: true }
    );
    return res.send({ status: true, Quiz: updateQuiz });
  } catch (error) {
    return res.send({
      status: false,
      message: "something went wrong!",
    });
  }
};

module.exports = {
  addQuiz,
  GetQuizByCatID,
  ListAllQuiz,
  getQuizById,
  deleteQuiz,
  updateQuiz,
};
