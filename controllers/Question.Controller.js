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
const QuestionsMdl = require("../models/Questions");
const OptionMdl = require("../models/Options");

var jwt = require("jsonwebtoken");
const config = require("../config/Config");
const { ObjectId } = mongoose.Types;

function isValidObjectId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

const getQuizByQuizChapterForRevision = async (req, res) => {
  try {
    const { ChapterID } = req.params;
    if (isValidObjectId(ChapterID)) {
      const Questions = await QuestionsMdl.find({
        Chapter: ChapterID,
      }).populate({
        path: "Chapter",
        populate: {
          path: "QuizID",
          match: { Category: { $in: req.userDetails.categoryIDs } }, // Filter quizzes by the user's selected categories
          populate: {
            path: "Category", // Populating the Category inside the Quiz model
          },
        },
      });
      const filteredChapters = Questions.filter(
        (chapter) => chapter.Chapter.QuizID !== null
      ).map((chapter) => {
        const All = chapter.toObject(); // Get QuizID object
        console.log("All:", All);

        return {
          Question: All.Question,
          imageURL: All.imageURL,
          AudioUrl: All.AudioUrl,
          _id: All._id,
          chapterTitle: All.Chapter.Title,
          chapterID: All.Chapter._id,
          QuizTitle: All.Chapter.QuizID.Title,
          QuizID: All.Chapter.QuizID._id,
        };
      });
      if (filteredChapters.length > 0) {
        console.log(filteredChapters);
        // Fetch the options for each question and randomize the order
        const questionsWithOptions = await Promise.all(
          filteredChapters.map(async (question) => {
            const options = await OptionMdl.find({ Question: question._id });

            // Randomize the order of the options
            const shuffledOptions = options.sort(() => Math.random() - 0.5);

            return {
              ...question, // Spread the question data
              options: shuffledOptions, // Attach the randomized options
            };
          })
        );
        return res.send({ status: false, questionsWithOptions });
      } else {
        return res.send({ status: false, message: "Id is not valid" });
      }
    } else return res.send({ status: false, message: "Id is not valid" });
  } catch (error) {
    console.error("Error getting Questions:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};

module.exports = {
  getQuizByQuizChapterForRevision,
};
