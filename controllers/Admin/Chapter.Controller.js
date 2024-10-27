// controllers/userController.js
const QuizMdl = require("../../models/Quiz");
const ChapterMdl = require("../../models/Chapter");
const QuestionMdl = require("../../models/Questions");
const GetChapterByQuizID = async (req, res) => {
  try {
    const { QuizID } = req.params;
    const Chapters = await ChapterMdl.find({
      QuizID: QuizID,
      isDeleted: false,
    }).populate("QuizID");
    return res.send({ status: true, Chapters: Chapters });
  } catch (error) {
    console.error("Error getting chapters:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
const addChapter = async (req, res) => {
  try {
    const { QuizID, Title, Description, isDeleted = 0 } = req.body;

    const Quiz = new ChapterMdl({
      QuizID: QuizID,
      Title: Title,
      Description: Description,
      isDeleted: isDeleted,
    });
    await Quiz.save();
    const Chapters = await ChapterMdl.find({
      QuizID: QuizID,
      isDeleted: false,
    }).populate("QuizID");
    return res.send({ status: true, Chapters: Chapters });
  } catch (error) {
    console.error("Error creating Chapter:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
const GetAllChapter = async (req, res) => {
  try {
    const Chapters = await ChapterMdl.find({ isDeleted: false }).populate({
      path: "QuizID",
      populate: {
        path: "Category", // Populating the Category inside the Quiz model
      },
    });
    return res.send({ status: true, Chapters: Chapters });
  } catch (error) {
    console.error("Error getting chapters:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};

const getChapterByID = async (req, res) => {
  try {
    const { ChapterID } = req.params;
    const Chapter = await ChapterMdl.findOne({
      _id: ChapterID,
      isDeleted: false,
    });
    if (!Chapter) {
      return res.send({
        status: false,
        message: "Chapter not found",
      });
    }
    return res.send({
      status: true,
      Chapter: Chapter,
    });
  } catch (error) {
    return res.send({
      status: false,
      message: "something went wrong!",
    });
  }
};
const deleteChapter = async (req, res) => {
  try {
    const { ChapterID } = req.params;
    const findQuestion = await QuestionMdl.findOne({
      Chapter: ChapterID,
      isDeleted: false,
    });
    if (findQuestion) {
      return res.send({
        status: false,
        message: "Chapter assigned to Question already!",
      });
    }

    const deleteChapter = await ChapterMdl.findByIdAndUpdate(ChapterID, {
      isDeleted: true,
      updated: Date.now(),
    });

    const Chapters = await ChapterMdl.find({ isDeleted: false }).populate({
      path: "QuizID",
      populate: {
        path: "Category", // Populating the Category inside the Quiz model
      },
    });
    return res.send({ status: true, Chapters: Chapters });
  } catch (error) {
    return res.send({
      status: false,
      message: "something went wrong!",
    });
  }
};
const updateChapter = async (req, res) => {
  try {
    const { QuizID, Title, Description, ChapterID } = req.body;

    // Save the question
    const updateChapter = await ChapterMdl.findByIdAndUpdate(
      ChapterID,
      {
        QuizID: QuizID,
        Title: Title,
        Description: Description,
        updated: Date.now(),
      },
      { new: true }
    );
    return res.send({ status: true, Chapter: updateChapter });
  } catch (error) {
    return res.send({
      status: false,
      message: "something went wrong!",
    });
  }
};
module.exports = {
  addChapter,
  GetChapterByQuizID,
  GetAllChapter,
  getChapterByID,
  deleteChapter,
  updateChapter,
};
