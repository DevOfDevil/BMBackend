const mongoose = require("mongoose"); // Make sure you have mongoose imported
const OptionMdl = require("../../models/Options");
const QuestionMdl = require("../../models/Questions");

const GetQuestionByChapterID = async (req, res) => {
  try {
    const { ChapterID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ChapterID)) {
      return res
        .status(400)
        .send({ status: false, message: "Invalid ChapterID" });
    }

    const Questions = await QuestionMdl.find({ Chapter: ChapterID });
    // Fetch the options for each question and randomize the order
    const questionsWithOptions = await Promise.all(
      Questions.map(async (question) => {
        const options = await OptionMdl.find({ Question: question._id });

        // Randomize the order of the options
        const shuffledOptions = options.sort(() => Math.random() - 0.5);

        return {
          ...question._doc, // Spread the question data
          options: shuffledOptions, // Attach the randomized options
        };
      })
    );
    return res.send({ status: true, Questions: questionsWithOptions });
  } catch (error) {
    console.error("Error getting Questions:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
/*
const addQuestion = async (req, res) => {
  try {
    const { QuizID, QuestionTitle, imageURL, AudioUrl, Options } = req.body;

    const Question = new QuestionMdl({
      Quiz: QuizID,
      Question: QuestionTitle,
      imageURL: imageURL,
      AudioUrl: AudioUrl,
    });
    await Question.save();
    //wants to save options in options mdl


    const Questions = await QuestionMdl.find({ Quiz: QuizID });
    return res.send({ status: true, Questions: Questions });
  } catch (error) {
    console.error("Error creating user:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
*/
const addQuestion = async (req, res) => {
  try {
    const { ChapterID, QuestionTitle, imageURL, AudioUrl, Options } = req.body;
    // Save the question
    const AddQuestion = new QuestionMdl({
      Chapter: ChapterID,
      Question: QuestionTitle,
      imageURL: imageURL,
      AudioUrl: AudioUrl,
    });
    await AddQuestion.save();

    // Save the options related to this question
    const optionPromises = Options.map((option) => {
      const newOption = new OptionMdl({
        Question: AddQuestion._id, // Reference to the question ID
        Option: option.option,
        isCorrect: option.IsCorrect,
      });
      return newOption.save();
    });

    // Wait for all options to be saved
    await Promise.all(optionPromises);

    // Fetch all questions related to the QuizID
    const Questions = await QuestionMdl.find({ Chapter: ChapterID });

    // Fetch the options for each question and randomize the order
    const questionsWithOptions = await Promise.all(
      Questions.map(async (question) => {
        const options = await OptionMdl.find({ Question: question._id });

        // Randomize the order of the options
        const shuffledOptions = options.sort(() => Math.random() - 0.5);

        return {
          ...question._doc, // Spread the question data
          options: shuffledOptions, // Attach the randomized options
        };
      })
    );

    return res.send({ status: true, Questions: questionsWithOptions });
  } catch (error) {
    console.error("Error creating question:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
const GetAllQuestions = async (req, res) => {
  try {
    const Questions = await QuestionMdl.find().populate({
      path: "Chapter",
      populate: {
        path: "QuizID",
        populate: {
          path: "Category", // Populating the Category inside the Quiz model
        },
      },
    });
    // Fetch the options for each question and randomize the order
    const questionsWithOptions = await Promise.all(
      Questions.map(async (question) => {
        const options = await OptionMdl.find({ Question: question._id });

        // Randomize the order of the options
        const shuffledOptions = options.sort(() => Math.random() - 0.5);

        return {
          ...question._doc, // Spread the question data
          options: shuffledOptions, // Attach the randomized options
        };
      })
    );
    return res.send({ status: true, Questions: questionsWithOptions });
  } catch (error) {
    console.error("Error getting Questions:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
module.exports = {
  addQuestion,
  GetQuestionByChapterID,
  GetAllQuestions,
};
