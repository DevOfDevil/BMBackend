// controllers/userController.js
const QuizMdl = require("../../models/Quiz");
const ChapterMdl = require("../../models/Chapter");

const GetChapterByQuizID = async (req, res) => {
  try {
    const { QuizID } = req.params;
    const Chapters = await ChapterMdl.find({ QuizID: QuizID }).populate(
      "QuizID"
    );
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
    const Chapters = await ChapterMdl.find({ QuizID: QuizID }).populate(
      "QuizID"
    );
    return res.send({ status: true, Chapters: Chapters });
  } catch (error) {
    console.error("Error creating Chapter:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
const GetAllChapter = async (req, res) => {
  try {
    const Chapters = await ChapterMdl.find().populate({
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
module.exports = {
  addChapter,
  GetChapterByQuizID,
  GetAllChapter,
};
