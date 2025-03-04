// controllers/userController.js
const mongoose = require("mongoose");
const UserServices = require("../service/user");
const RoleMdl = require("../models/Role");
const DeviceMdl = require("../models/userDevice");
const CategoryMdl = require("../models/Category");
const CategoryPurchasedMdl = require("../models/CategoryPurchased");
const ReportDetailsMdl = require("../models/ReportDetails");
const ReportingMdl = require("../models/Reporting");
const ChapterMdl = require("../models/Chapter");
const QuestionsMdl = require("../models/Questions");
const OptionMdl = require("../models/Options");

var jwt = require("jsonwebtoken");
const config = require("../config/Config");
const { count } = require("../models/User");
const { ObjectId } = mongoose.Types;

function isValidObjectId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

const getQuizByQuizChapterForRevision = async (req, res) => {
  try {
    const { ChapterID } = req.params;
    if (isValidObjectId(ChapterID)) {
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

      const checkCategoryAllowed = resultChapters.some((chapter) => {
        return (
          chapter.clickable === true && chapter._id.toString() === ChapterID
        );
      });

      if (checkCategoryAllowed) {
        const Questions = await QuestionsMdl.find({
          Chapter: ChapterID,
          isDeleted: false,
        }).populate({
          path: "Chapter",
          populate: {
            path: "QuizID",
            match: {
              Category: { $in: req.userDetails.categoryIDs },
              isDeleted: false,
            }, // Filter quizzes by the user's selected categories
            populate: {
              path: "Category",
              match: {
                _id: { $in: req.userDetails.categoryIDs },
                isDeleted: false,
              },
              select: "_id name description",
            },
          },
        });

        const filteredQuestions = await Questions.filter(
          (chapter) => chapter.Chapter.QuizID !== null
        ).map((chapter) => {
          const All = chapter.toObject(); // Get QuizID object
          return {
            Question: All.Question,
            imageURL: All.imageURL,
            AudioUrl: All.AudioUrl,
            _id: All._id,
            chapterTitle: All.Chapter.Title,
            chapterID: All.Chapter._id,
            QuizTitle: All.Chapter.QuizID.Title,
            QuizID: All.Chapter.QuizID._id,
            CatTitle: All.Chapter.QuizID.Category.name,
            CatID: All.Chapter.QuizID.Category._id,
          };
        });

        if (filteredQuestions.length > 0) {
          //Add chapter question to reporting
          // Get the first question's CategoryID, QuizID, and ChapterID
          const {
            CatID: CategoryID,
            QuizID,
            chapterID: ChapterID,
          } = filteredQuestions[0];

          // Add chapter question to reporting
          const addToReportData = new ReportingMdl({
            UserID: req.userDetails._id,
            CategoryID,
            QuizID,
            ChapterID,
            TestType: "revision",
          });
          const addToReport = await addToReportData.save();

          // Fetch the options for each question and randomize the order
          const questionsWithOptions = await Promise.all(
            filteredQuestions.map(async (question) => {
              const options = await OptionMdl.find({
                Question: question._id,
              }).select("_id Question Option isCorrect");

              // Randomize the order of the options
              const shuffledOptions = options.sort(() => Math.random() - 0.5);
              // Extract only IDs for GivenOptions
              const givenOptionsIds = shuffledOptions.map(
                (option) => option._id
              );

              // Find the correct option in shuffledOptions
              const correctOption = shuffledOptions.find(
                (option) => option.isCorrect === true
              );

              const QuestionAndOptionData = new ReportDetailsMdl({
                ReportingID: addToReport._id,
                QuestionID: question._id,
                GivenOptions: givenOptionsIds,
                //SelectedOption: correctOption ? correctOption._id : null,
                CorrectOption: correctOption ? correctOption._id : null,
              });
              const addToReportDetails = await QuestionAndOptionData.save();
              return {
                ...question, // Spread the question data
                options: shuffledOptions, // Attach the randomized options
              };
            })
          );
          return res.send({
            status: true,
            RevisionID: addToReport._id,
            questionsWithOptions: questionsWithOptions,
            TotalQuestion: questionsWithOptions.length,
            CurrentIndex: 1,
            isFinished: false,
          });
        } else {
          return res.send({
            status: false,
            message: "Questions Not Added To Selected ID!",
          });
        }
      } else {
        return res.send({
          status: false,
          message: "This Chapter Not Allowed To You!",
        });
      }
    } else
      return res.send({
        status: false,
        message: "Id is not valid",
      });
  } catch (error) {
    console.error("Error getting Questions:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
const setRevisionComplete = async (req, res) => {
  try {
    const { RevisionID } = req.params;
    if (isValidObjectId(RevisionID)) {
      const checkIsStarted = await ReportingMdl.findOne({
        UserID: req.userDetails._id,
        _id: RevisionID,
        TestType: "revision",
      });
      if (checkIsStarted) {
        if (checkIsStarted.EndDate) {
          return res.send({
            status: false,
            message: "Revision already completed",
          });
        } else {
          const EndDate = new Date();
          checkIsStarted.EndDate = EndDate;
          checkIsStarted.status = "complete";

          // Calculate time difference in milliseconds
          const timeDiffMs = EndDate - checkIsStarted.StartDate;

          // Convert milliseconds to hours, minutes, and seconds
          const hours = Math.floor(timeDiffMs / (1000 * 60 * 60));
          const minutes = Math.floor(
            (timeDiffMs % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((timeDiffMs % (1000 * 60)) / 1000);

          // Build completeTime string based on non-zero values
          // Format each unit with leading zeros if necessary
          const formattedHours = String(hours).padStart(2, "0");
          const formattedMinutes = String(minutes).padStart(2, "0");
          const formattedSeconds = String(seconds).padStart(2, "0");

          // Construct completeTime in "hh:mm:ss" format
          checkIsStarted.completeTime = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
          await checkIsStarted.save();
          return res.send({ status: true, message: "Revision completed!" });
        }
      } else {
        return res.send({ status: false, message: "In-valid Revision!" });
      }
    } else {
      return res.send({ status: false, message: "ID is not valid!" });
    }
  } catch (error) {
    console.error("Error getting Questions:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};

const getRevisionNextQuestion = async (req, res) => {
  try {
    const {
      RevisionID,
      CurrentIndex,
      TotalQuestion,
      QuestionID,
      SelectedOptionID,
    } = req.body;
    if (
      isValidObjectId(RevisionID) &&
      isValidObjectId(QuestionID) &&
      isValidObjectId(SelectedOptionID)
    ) {
      const checkReporting = await ReportingMdl.findOne({
        _id: RevisionID,
        UserID: req.userDetails._id,
      });
      if (checkReporting) {
        if (checkReporting.status == "in-process") {
          //
          if (SelectedOptionID) {
            await ReportDetailsMdl.updateOne(
              { ReportingID: RevisionID, QuestionID },
              { $set: { SelectedOption: SelectedOptionID } }
            );
          }
          // Get the next question based on the CurrentIndex
          const nextQuestion = await ReportDetailsMdl.findOne({
            ReportingID: RevisionID,
            SelectedOption: { $exists: false },
          }).populate("QuestionID GivenOptions CorrectOption");

          var questionsWithOptions = {
            Question: nextQuestion.QuestionID.Question,
            imageURL: nextQuestion.QuestionID.imageURL,
            AudioUrl: nextQuestion.QuestionID.AudioUrl,
            _id: nextQuestion.QuestionID._id,
            chapterID: checkReporting.ChapterID,
            QuizID: checkReporting.QuizID,
            CatID: checkReporting.CategoryID,
            options: nextQuestion.GivenOptions.map((option) => ({
              _id: option._id,
              Question: option.Question,
              Option: option.Option,
              isCorrect: option.isCorrect,
            })),
          };

          return res.send({
            status: true,
            RevisionID,
            questionsWithOptions,
            TotalQuestion,
            CurrentIndex: CurrentIndex + 1,
            isFinished: TotalQuestion > CurrentIndex ? false : true,
          });
        } else {
          return res.send({
            status: false,
            message: "This Revision Is Completed!",
          });
        }
      } else {
        return res.send({
          status: false,
          message: "Revision Not Found!",
        });
      }
    } else
      return res.send({
        status: false,
        message: "ID(s) are not valid",
      });
  } catch (error) {
    console.error("Error getting Questions:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};

const getQuizByChapterForPractice = async (req, res) => {
  try {
    const { ChapterID } = req.params;
    if (isValidObjectId(ChapterID)) {
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

      const checkCategoryAllowed = resultChapters.some((chapter) => {
        return (
          chapter.clickable === true && chapter._id.toString() === ChapterID
        );
      });

      if (checkCategoryAllowed) {
        const Questions = await QuestionsMdl.find({
          Chapter: ChapterID,
          isDeleted: false,
        }).populate({
          path: "Chapter",
          populate: {
            path: "QuizID",
            match: {
              Category: { $in: req.userDetails.categoryIDs },
              isDeleted: false,
            }, // Filter quizzes by the user's selected categories
            populate: {
              path: "Category",
              match: {
                _id: { $in: req.userDetails.categoryIDs },
                isDeleted: false,
              },
              select: "_id name description",
            },
          },
        });
        Questions.sort(() => Math.random() - 0.5);
        const filteredQuestions = await Questions.filter(
          (chapter) => chapter.Chapter.QuizID !== null
        ).map((chapter) => {
          const All = chapter.toObject(); // Get QuizID object
          return {
            Question: All.Question,
            imageURL: All.imageURL,
            AudioUrl: All.AudioUrl,
            _id: All._id,
            chapterTitle: All.Chapter.Title,
            chapterID: All.Chapter._id,
            QuizTitle: All.Chapter.QuizID.Title,
            QuizID: All.Chapter.QuizID._id,
            CatTitle: All.Chapter.QuizID.Category.name,
            CatID: All.Chapter.QuizID.Category._id,
          };
        });

        if (filteredQuestions.length > 0) {
          //Add chapter question to reporting
          // Get the first question's CategoryID, QuizID, and ChapterID
          const {
            CatID: CategoryID,
            QuizID,
            chapterID: ChapterID,
          } = filteredQuestions[0];

          // Add chapter question to reporting
          const addToReportData = new ReportingMdl({
            UserID: req.userDetails._id,
            CategoryID,
            QuizID,
            ChapterID,
            TestType: "practice",
          });
          const addToReport = await addToReportData.save();

          // Fetch the options for each question and randomize the order
          const questionsWithOptions = await Promise.all(
            filteredQuestions.map(async (question) => {
              const options = await OptionMdl.find({
                Question: question._id,
              }).select("_id Question Option isCorrect");

              // Randomize the order of the options
              const shuffledOptions = options.sort(() => Math.random() - 0.5);
              // Extract only IDs for GivenOptions
              const givenOptionsIds = shuffledOptions.map(
                (option) => option._id
              );

              // Find the correct option in shuffledOptions
              const correctOption = shuffledOptions.find(
                (option) => option.isCorrect === true
              );

              const QuestionAndOptionData = new ReportDetailsMdl({
                ReportingID: addToReport._id,
                QuestionID: question._id,
                GivenOptions: givenOptionsIds,
                //SelectedOption: correctOption ? correctOption._id : null,
                CorrectOption: correctOption ? correctOption._id : null,
              });
              const addToReportDetails = await QuestionAndOptionData.save();
              return {
                ...question, // Spread the question data
                options: shuffledOptions, // Attach the randomized options
              };
            })
          );
          return res.send({
            status: true,
            RevisionID: addToReport._id,
            questionsWithOptions:
              questionsWithOptions.length > 1
                ? questionsWithOptions[0]
                : questionsWithOptions,
            TotalQuestion: questionsWithOptions.length,
            CurrentIndex: 1,
            isFinished: false,
          });
        } else {
          return res.send({
            status: false,
            message: "Questions Not Added To Selected ID!",
          });
        }
      } else {
        return res.send({
          status: false,
          message: "This Chapter Not Allowed To You!",
        });
      }
    } else
      return res.send({
        status: false,
        message: "Id is not valid",
      });
  } catch (error) {
    console.error("Error getting Questions:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};

const calculatePercentage = async (reportingID) => {
  try {
    const result = await ReportDetailsMdl.aggregate([
      // Match documents with the given ReportingID
      {
        $match: { ReportingID: mongoose.Types.ObjectId(reportingID) },
      },
      // Add a field to check if the answer is correct
      {
        $addFields: {
          isCorrect: { $eq: ["$SelectedOption", "$CorrectOption"] },
        },
      },
      // Group and calculate total and correct answers
      {
        $group: {
          _id: "$ReportingID",
          totalQuestions: { $sum: 1 },
          correctAnswers: {
            $sum: { $cond: ["$isCorrect", 1, 0] },
          },
        },
      },
      // Add percentage calculation
      {
        $addFields: {
          percentage: {
            $multiply: [
              { $divide: ["$correctAnswers", "$totalQuestions"] },
              100,
            ],
          },
        },
      },
    ]);

    // Check if result exists
    if (result.length > 0) {
      const { totalQuestions, correctAnswers, percentage } = result[0];
      console.log(
        `Total Questions: ${totalQuestions}, Correct Answers: ${correctAnswers}, Percentage: ${percentage}%`
      );
      //return { totalQuestions, correctAnswers, percentage };
      return percentage;
    } else {
      console.log("No records found for the given ReportingID.");
      return 0.0;
    }
  } catch (error) {
    console.error("Error calculating percentage:", error);
    throw error;
  }
};

const setPracticeComplete = async (req, res) => {
  try {
    const { RevisionID } = req.params;
    if (isValidObjectId(RevisionID)) {
      const checkIsStarted = await ReportingMdl.findOne({
        UserID: req.userDetails._id,
        _id: RevisionID,
        TestType: "practice",
        status: "in-process",
      });
      if (checkIsStarted) {
        const EndDate = new Date();
        checkIsStarted.EndDate = EndDate;
        checkIsStarted.status = "complete";

        // Calculate time difference in milliseconds
        const timeDiffMs = EndDate - checkIsStarted.StartDate;

        // Convert milliseconds to hours, minutes, and seconds
        const hours = Math.floor(timeDiffMs / (1000 * 60 * 60));
        const minutes = Math.floor(
          (timeDiffMs % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((timeDiffMs % (1000 * 60)) / 1000);

        // Build completeTime string based on non-zero values
        // Format each unit with leading zeros if necessary
        const formattedHours = String(hours).padStart(2, "0");
        const formattedMinutes = String(minutes).padStart(2, "0");
        const formattedSeconds = String(seconds).padStart(2, "0");

        // Construct completeTime in "hh:mm:ss" format
        checkIsStarted.completeTime = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;

        const ResultPercentage = await calculatePercentage(RevisionID).catch(
          (err) => {
            return 0; // Return 0 in case of an error
          }
        );
        checkIsStarted.ResultPercentage = ResultPercentage;
        await checkIsStarted.save();
        return res.send({
          status: true,
          message: "Practice completed!",
          checkIsStarted,
        });
      } else {
        return res.send({ status: false, message: "In-valid Practice!" });
      }
    } else {
      return res.send({ status: false, message: "ID is not valid!" });
    }
  } catch (error) {
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
/*
const getPracticeNextQuestion = async (req, res) => {
  try {
    const {
      RevisionID,
      CurrentIndex,
      TotalQuestion,
      QuestionID,
      SelectedOptionID,
    } = req.body;
    if (
      isValidObjectId(RevisionID) &&
      isValidObjectId(QuestionID) &&
      isValidObjectId(SelectedOptionID)
    ) {
      const checkReporting = await ReportingMdl.findOne({
        _id: RevisionID,
        UserID: req.userDetails._id,
      });
      if (checkReporting) {
        if (checkReporting.status == "in-process") {
          //
          if (SelectedOptionID) {
            await ReportDetailsMdl.updateOne(
              { ReportingID: RevisionID, QuestionID },
              { $set: { SelectedOption: SelectedOptionID } }
            );
          }
          // Get the next question based on the CurrentIndex
          const nextQuestion = await ReportDetailsMdl.findOne({
            ReportingID: RevisionID,
            SelectedOption: { $exists: false },
          }).populate("QuestionID GivenOptions CorrectOption");

          var questionsWithOptions = {
            Question: nextQuestion.QuestionID.Question,
            imageURL: nextQuestion.QuestionID.imageURL,
            AudioUrl: nextQuestion.QuestionID.AudioUrl,
            _id: nextQuestion.QuestionID._id,
            chapterID: checkReporting.ChapterID,
            QuizID: checkReporting.QuizID,
            CatID: checkReporting.CategoryID,
            options: nextQuestion.GivenOptions.map((option) => ({
              _id: option._id,
              Question: option.Question,
              Option: option.Option,
              isCorrect: option.isCorrect,
            })),
          };

          return res.send({
            status: true,
            RevisionID,
            questionsWithOptions,
            TotalQuestion,
            CurrentIndex: CurrentIndex + 1,
            isFinished: TotalQuestion > CurrentIndex ? false : true,
          });
        } else {
          return res.send({
            status: false,
            message: "This Practice Is Completed!",
          });
        }
      } else {
        return res.send({
          status: false,
          message: "Practice Not Found!",
        });
      }
    } else
      return res.send({
        status: false,
        message: "ID(s) are not valid",
      });
  } catch (error) {
    console.error("Error getting Questions:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
*/
const getPracticeNextQuestion = async (req, res) => {
  try {
    const { RevisionID, CurrentIndex, NextIndex } = req.body;
    if (isValidObjectId(RevisionID)) {
      const checkReporting = await ReportingMdl.findOne({
        _id: RevisionID,
        UserID: req.userDetails._id,
        TestType: "practice",
      });
      if (checkReporting) {
        if (checkReporting.status == "in-process") {
          //getTotalCount
          const TotalQuestion = await ReportDetailsMdl.countDocuments({
            ReportingID: RevisionID,
          });
          const TotalAnsweredQuestion = await ReportDetailsMdl.countDocuments({
            ReportingID: RevisionID,
            SelectedOption: { $exists: true },
          });
          if (NextIndex > TotalQuestion) {
            return res.send({
              status: false,
              message: "Index Out Of Scope!",
            });
          }
          if (NextIndex < 1) {
            return res.send({
              status: false,
              message: "Index Out Of Scope!",
            });
          }
          const RealNext = NextIndex - 1;
          // Get the next question based on the CurrentIndex
          const nextQuestion = await ReportDetailsMdl.find({
            ReportingID: RevisionID,
          })
            .sort({ _id: 1 }) // Ensure consistent ordering
            .skip(RealNext)
            .limit(1)
            .populate("QuestionID GivenOptions CorrectOption")
            .exec();
          const questionData = nextQuestion[0];
          var questionsWithOptions = {
            Question: questionData.QuestionID.Question,
            imageURL: questionData.QuestionID.imageURL,
            AudioUrl: questionData.QuestionID.AudioUrl,
            _id: questionData.QuestionID._id,
            chapterID: checkReporting.ChapterID,
            QuizID: checkReporting.QuizID,
            CatID: checkReporting.CategoryID,
            options: questionData.GivenOptions.map((option) => ({
              _id: option._id,
              Question: option.Question,
              Option: option.Option,
              isCorrect: option.isCorrect,
            })),
          };
          return res.send({
            status: true,
            RevisionID,
            questionsWithOptions,
            isAnswered: questionData.SelectedOption ? true : false,
            selectedOption: questionData.SelectedOption
              ? questionData.SelectedOption
              : "",
            TotalQuestion,
            CurrentIndex: NextIndex,
            isFinished: TotalQuestion == TotalAnsweredQuestion ? true : false,
          });
        } else {
          return res.send({
            status: false,
            message: "This Practice Is Completed!",
          });
        }
      } else {
        return res.send({
          status: false,
          message: "Practice Not Found!",
        });
      }
    } else
      return res.send({
        status: false,
        message: "ID(s) are not valid",
      });
  } catch (error) {
    console.error("Error getting Questions:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
const submitPracticeAnswer = async (req, res) => {
  try {
    const { RevisionID, CurrentIndex, QuestionID, SelectedOptionID } = req.body;
    if (
      isValidObjectId(RevisionID) &&
      isValidObjectId(QuestionID) &&
      isValidObjectId(SelectedOptionID)
    ) {
      const checkReporting = await ReportingMdl.findOne({
        _id: RevisionID,
        UserID: req.userDetails._id,
        TestType: "practice",
      });
      if (checkReporting) {
        if (checkReporting.status == "in-process") {
          const checkQuestion = await ReportDetailsMdl.findOne({
            ReportingID: RevisionID,
            QuestionID: QuestionID,
            SelectedOption: { $exists: false },
          });
          if (checkQuestion) {
            const UpdateQuestion = await ReportDetailsMdl.updateOne(
              { ReportingID: RevisionID, QuestionID: QuestionID },
              { $set: { SelectedOption: SelectedOptionID } }
            );
            //getQuestionTotalCount
            const TotalQuestion = await ReportDetailsMdl.countDocuments({
              ReportingID: RevisionID,
            });
            //TotalAnsweredCount
            const TotalAnsweredQuestion = await ReportDetailsMdl.countDocuments(
              {
                ReportingID: RevisionID,
                SelectedOption: { $exists: true },
              }
            );

            const TotalCorrectCountQuestion =
              await ReportDetailsMdl.countDocuments({
                ReportingID: RevisionID,
                SelectedOption: { $exists: true, $ne: null }, // Ensures SelectedOption exists and is not null
                $expr: { $eq: ["$SelectedOption", "$CorrectOption"] }, // Compares SelectedOption with CorrectOption
              });
            const TotalWrongCountQuestion =
              await ReportDetailsMdl.countDocuments({
                ReportingID: RevisionID,
                SelectedOption: { $exists: true, $ne: null }, // Ensures SelectedOption exists and is not null
                $expr: { $ne: ["$SelectedOption", "$CorrectOption"] }, // Compares SelectedOption with CorrectOption
              });

            const allQuestions = await ReportDetailsMdl.find({
              ReportingID: RevisionID,
            })
              .sort({ _id: 1 }) // Sort by _id for consistent order
              .select("_id QuestionID SelectedOption") // Fetch only _id and SelectedOption fields
              .lean(); // Convert Mongoose documents to plain JavaScript objects

            // Extract question IDs and unanswered status
            const questionIds = allQuestions.map((question) => ({
              id: question._id.toString(),
              QuestionID: question.QuestionID.toString(),
              isAnswered: question.SelectedOption ? true : false,
            }));
            // Find the index of the current question ID
            const currentQIndex = questionIds.findIndex(
              (q) => q.QuestionID === QuestionID.toString()
            );
            // Determine the next question
            let nextQuestion = null;
            let selectedIndex = 0;
            for (let i = currentQIndex + 1; i < questionIds.length; i++) {
              if (!questionIds[i].isAnswered) {
                selectedIndex = i + 1;
                nextQuestion = await ReportDetailsMdl.findById(
                  questionIds[i].id
                )
                  .populate("QuestionID GivenOptions CorrectOption") // Populate references
                  .exec();
                break;
              }
            }
            // If no unanswered question is found after the current one, look for the earliest unanswered question
            if (!nextQuestion) {
              for (let i = 0; i < questionIds.length; i++) {
                if (!questionIds[i].isAnswered) {
                  selectedIndex = i + 1;
                  nextQuestion = await ReportDetailsMdl.findById(
                    questionIds[i].id
                  )
                    .populate("QuestionID GivenOptions CorrectOption") // Populate references
                    .exec();
                  break;
                }
              }
            }
            if (!nextQuestion) {
              selectedIndex = currentQIndex + 1;
              nextQuestion = await ReportDetailsMdl.findOne({
                ReportingID: RevisionID,
                QuestionID: QuestionID,
              }).populate("QuestionID GivenOptions CorrectOption"); // Populate references
            }

            const questionData = nextQuestion;
            var questionsWithOptions = {
              Question: questionData.QuestionID.Question,
              imageURL: questionData.QuestionID.imageURL,
              AudioUrl: questionData.QuestionID.AudioUrl,
              _id: questionData.QuestionID._id,
              chapterID: checkReporting.ChapterID,
              QuizID: checkReporting.QuizID,
              CatID: checkReporting.CategoryID,
              options: questionData.GivenOptions.map((option) => ({
                _id: option._id,
                Question: option.Question,
                Option: option.Option,
                isCorrect: option.isCorrect,
              })),
            };

            return res.send({
              status: true,
              RevisionID,
              questionsWithOptions,
              isAnswered: questionData.SelectedOption ? true : false,
              selectedOption: questionData.SelectedOption
                ? questionData.SelectedOption
                : "",
              TotalQuestion,
              CurrentIndex: selectedIndex,
              isFinished: TotalQuestion == TotalAnsweredQuestion ? true : false,
              CorrectCount: TotalCorrectCountQuestion,
              WrongCount: TotalWrongCountQuestion,
            });
          } else {
            return res.send({
              status: false,
              message: "Question Already Answered!",
            });
          }
        } else {
          return res.send({
            status: false,
            message: "This Practice Is Completed!",
          });
        }
      } else {
        return res.send({
          status: false,
          message: "Practice Not Found!",
        });
      }
    } else
      return res.send({
        status: false,
        message: "ID(s) are not valid",
      });
  } catch (error) {
    console.error("Error getting Questions:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
const getQuizByChapterForTest = async (req, res) => {
  try {
    const { ChapterID } = req.params;
    if (isValidObjectId(ChapterID)) {
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

      const checkCategoryAllowed = resultChapters.some((chapter) => {
        return (
          chapter.clickable === true && chapter._id.toString() === ChapterID
        );
      });

      if (checkCategoryAllowed) {
        const Questions = await QuestionsMdl.find({
          Chapter: ChapterID,
          isDeleted: false,
        }).populate({
          path: "Chapter",
          populate: {
            path: "QuizID",
            match: {
              Category: { $in: req.userDetails.categoryIDs },
              isDeleted: false,
            }, // Filter quizzes by the user's selected categories
            populate: {
              path: "Category",
              match: {
                _id: { $in: req.userDetails.categoryIDs },
                isDeleted: false,
              },
              select: "_id name description",
            },
          },
        });
        Questions.sort(() => Math.random() - 0.5);
        const filteredQuestions = await Questions.filter(
          (chapter) => chapter.Chapter.QuizID !== null
        ).map((chapter) => {
          const All = chapter.toObject(); // Get QuizID object
          return {
            Question: All.Question,
            imageURL: All.imageURL,
            AudioUrl: All.AudioUrl,
            _id: All._id,
            chapterTitle: All.Chapter.Title,
            chapterID: All.Chapter._id,
            QuizTitle: All.Chapter.QuizID.Title,
            QuizID: All.Chapter.QuizID._id,
            CatTitle: All.Chapter.QuizID.Category.name,
            CatID: All.Chapter.QuizID.Category._id,
          };
        });

        if (filteredQuestions.length > 0) {
          //Add chapter question to reporting
          // Get the first question's CategoryID, QuizID, and ChapterID
          const {
            CatID: CategoryID,
            QuizID,
            chapterID: ChapterID,
            chapterTitle,
          } = filteredQuestions[0];

          // Add chapter question to reporting
          const addToReportData = new ReportingMdl({
            UserID: req.userDetails._id,
            CategoryID,
            QuizID,
            ChapterID,
            TestType: "test",
          });
          const addToReport = await addToReportData.save();

          // Fetch the options for each question and randomize the order
          const questionsWithOptions = await Promise.all(
            filteredQuestions.map(async (question) => {
              const options = await OptionMdl.find({
                Question: question._id,
              }).select("_id Question Option isCorrect");

              // Randomize the order of the options
              const shuffledOptions = options.sort(() => Math.random() - 0.5);
              // Extract only IDs for GivenOptions
              const givenOptionsIds = shuffledOptions.map(
                (option) => option._id
              );

              // Find the correct option in shuffledOptions
              const correctOption = shuffledOptions.find(
                (option) => option.isCorrect === true
              );

              const QuestionAndOptionData = new ReportDetailsMdl({
                ReportingID: addToReport._id,
                QuestionID: question._id,
                GivenOptions: givenOptionsIds,
                //SelectedOption: correctOption ? correctOption._id : null,
                CorrectOption: correctOption ? correctOption._id : null,
              });
              const addToReportDetails = await QuestionAndOptionData.save();
              return {
                ...question, // Spread the question data
                options: shuffledOptions, // Attach the randomized options
              };
            })
          );

          // Get the next question based on the CurrentIndex
          const nextQuestion = await ReportDetailsMdl.find({
            ReportingID: addToReport._id,
          })
            .sort({ _id: 1 }) // Ensure consistent ordering
            .limit(1)
            .populate("QuestionID GivenOptions CorrectOption")
            .exec();
          const questionData = nextQuestion[0];
          var questionsWithOptionsFirst = {
            Question: questionData.QuestionID.Question,
            imageURL: questionData.QuestionID.imageURL,
            AudioUrl: questionData.QuestionID.AudioUrl,
            _id: questionData.QuestionID._id,
            chapterID: ChapterID,
            QuizID: QuizID,
            CatID: CategoryID,
            options: questionData.GivenOptions.map((option) => ({
              _id: option._id,
              Question: option.Question,
              Option: option.Option,
            })),
          };

          return res.send({
            status: true,
            RevisionID: addToReport._id,
            questionsWithOptions: questionsWithOptionsFirst,
            TotalQuestion: questionsWithOptions.length,
            CurrentIndex: 1,
            chapterTitle: chapterTitle,
            isFinished: false,
          });
        } else {
          return res.send({
            status: false,
            message: "Questions Not Added To Selected ID!",
          });
        }
      } else {
        return res.send({
          status: false,
          message: "This Chapter Not Allowed To You!",
        });
      }
    } else
      return res.send({
        status: false,
        message: "Id is not valid",
      });
  } catch (error) {
    console.error("Error getting Questions:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
const getTestNextQuestion = async (req, res) => {
  try {
    const { RevisionID, CurrentIndex, NextIndex } = req.body;
    if (isValidObjectId(RevisionID)) {
      const checkReporting = await ReportingMdl.findOne({
        _id: RevisionID,
        UserID: req.userDetails._id,
        TestType: "test",
      });
      if (checkReporting) {
        if (checkReporting.status == "in-process") {
          //getTotalCount
          const TotalQuestion = await ReportDetailsMdl.countDocuments({
            ReportingID: RevisionID,
          });
          const TotalAnsweredQuestion = await ReportDetailsMdl.countDocuments({
            ReportingID: RevisionID,
            SelectedOption: { $exists: true },
          });
          if (NextIndex > TotalQuestion) {
            return res.send({
              status: false,
              message: "Index Out Of Scope!",
            });
          }
          if (NextIndex < 1) {
            return res.send({
              status: false,
              message: "Index Out Of Scope!",
            });
          }
          const RealNext = NextIndex - 1;
          // Get the next question based on the CurrentIndex
          const nextQuestion = await ReportDetailsMdl.find({
            ReportingID: RevisionID,
          })
            .sort({ _id: 1 }) // Ensure consistent ordering
            .skip(RealNext)
            .limit(1)
            .populate("QuestionID GivenOptions CorrectOption")
            .exec();
          const questionData = nextQuestion[0];
          var questionsWithOptions = {
            Question: questionData.QuestionID.Question,
            imageURL: questionData.QuestionID.imageURL,
            AudioUrl: questionData.QuestionID.AudioUrl,
            _id: questionData.QuestionID._id,
            chapterID: checkReporting.ChapterID,
            QuizID: checkReporting.QuizID,
            CatID: checkReporting.CategoryID,
            options: questionData.GivenOptions.map((option) => ({
              _id: option._id,
              Question: option.Question,
              Option: option.Option,
            })),
          };
          return res.send({
            status: true,
            RevisionID,
            questionsWithOptions,
            isAnswered: questionData.SelectedOption ? true : false,
            selectedOption: questionData.SelectedOption
              ? questionData.SelectedOption
              : "",
            TotalQuestion,
            CurrentIndex: NextIndex,
            isFinished: TotalQuestion == TotalAnsweredQuestion ? true : false,
          });
        } else {
          return res.send({
            status: false,
            message: "This Test Is Completed!",
          });
        }
      } else {
        return res.send({
          status: false,
          message: "Test Not Found!",
        });
      }
    } else
      return res.send({
        status: false,
        message: "ID(s) are not valid",
      });
  } catch (error) {
    console.error("Error getting Questions:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
const submitTestAnswer = async (req, res) => {
  try {
    const { RevisionID, CurrentIndex, QuestionID, SelectedOptionID } = req.body;
    if (
      isValidObjectId(RevisionID) &&
      isValidObjectId(QuestionID) &&
      isValidObjectId(SelectedOptionID)
    ) {
      const checkReporting = await ReportingMdl.findOne({
        _id: RevisionID,
        UserID: req.userDetails._id,
        TestType: "test",
      });
      if (checkReporting) {
        if (checkReporting.status == "in-process") {
          const checkQuestion = await ReportDetailsMdl.findOne({
            ReportingID: RevisionID,
            QuestionID: QuestionID,
            SelectedOption: { $exists: false },
          });
          if (checkQuestion) {
            const UpdateQuestion = await ReportDetailsMdl.updateOne(
              { ReportingID: RevisionID, QuestionID: QuestionID },
              { $set: { SelectedOption: SelectedOptionID } }
            );
            //getQuestionTotalCount
            const TotalQuestion = await ReportDetailsMdl.countDocuments({
              ReportingID: RevisionID,
            });
            //TotalAnsweredCount
            const TotalAnsweredQuestion = await ReportDetailsMdl.countDocuments(
              {
                ReportingID: RevisionID,
                SelectedOption: { $exists: true },
              }
            );

            const TotalCorrectCountQuestion =
              await ReportDetailsMdl.countDocuments({
                ReportingID: RevisionID,
                SelectedOption: { $exists: true, $ne: null }, // Ensures SelectedOption exists and is not null
                $expr: { $eq: ["$SelectedOption", "$CorrectOption"] }, // Compares SelectedOption with CorrectOption
              });
            const TotalWrongCountQuestion =
              await ReportDetailsMdl.countDocuments({
                ReportingID: RevisionID,
                SelectedOption: { $exists: true, $ne: null }, // Ensures SelectedOption exists and is not null
                $expr: { $ne: ["$SelectedOption", "$CorrectOption"] }, // Compares SelectedOption with CorrectOption
              });

            const allQuestions = await ReportDetailsMdl.find({
              ReportingID: RevisionID,
            })
              .sort({ _id: 1 }) // Sort by _id for consistent order
              .select("_id QuestionID SelectedOption") // Fetch only _id and SelectedOption fields
              .lean(); // Convert Mongoose documents to plain JavaScript objects

            // Extract question IDs and unanswered status
            const questionIds = allQuestions.map((question) => ({
              id: question._id.toString(),
              QuestionID: question.QuestionID.toString(),
              isAnswered: question.SelectedOption ? true : false,
            }));
            // Find the index of the current question ID
            const currentQIndex = questionIds.findIndex(
              (q) => q.QuestionID === QuestionID.toString()
            );
            // Determine the next question
            let nextQuestion = null;
            let selectedIndex = 0;
            for (let i = currentQIndex + 1; i < questionIds.length; i++) {
              if (!questionIds[i].isAnswered) {
                selectedIndex = i + 1;
                nextQuestion = await ReportDetailsMdl.findById(
                  questionIds[i].id
                )
                  .populate("QuestionID GivenOptions CorrectOption") // Populate references
                  .exec();
                break;
              }
            }
            // If no unanswered question is found after the current one, look for the earliest unanswered question
            if (!nextQuestion) {
              for (let i = 0; i < questionIds.length; i++) {
                if (!questionIds[i].isAnswered) {
                  selectedIndex = i + 1;
                  nextQuestion = await ReportDetailsMdl.findById(
                    questionIds[i].id
                  )
                    .populate("QuestionID GivenOptions CorrectOption") // Populate references
                    .exec();
                  break;
                }
              }
            }
            if (!nextQuestion) {
              selectedIndex = currentQIndex + 1;
              nextQuestion = await ReportDetailsMdl.findOne({
                ReportingID: RevisionID,
                QuestionID: QuestionID,
              }).populate("QuestionID GivenOptions CorrectOption"); // Populate references
            }

            const questionData = nextQuestion;
            var questionsWithOptions = {
              Question: questionData.QuestionID.Question,
              imageURL: questionData.QuestionID.imageURL,
              AudioUrl: questionData.QuestionID.AudioUrl,
              _id: questionData.QuestionID._id,
              chapterID: checkReporting.ChapterID,
              QuizID: checkReporting.QuizID,
              CatID: checkReporting.CategoryID,
              options: questionData.GivenOptions.map((option) => ({
                _id: option._id,
                Question: option.Question,
                Option: option.Option,
              })),
            };

            return res.send({
              status: true,
              RevisionID,
              questionsWithOptions,
              isAnswered: questionData.SelectedOption ? true : false,
              selectedOption: questionData.SelectedOption
                ? questionData.SelectedOption
                : "",
              TotalQuestion,
              CurrentIndex: selectedIndex,
              isFinished: TotalQuestion == TotalAnsweredQuestion ? true : false,
              //CorrectCount: TotalCorrectCountQuestion,
              //WrongCount: TotalWrongCountQuestion,
            });
          } else {
            return res.send({
              status: false,
              message: "Question Already Answered!",
            });
          }
        } else {
          return res.send({
            status: false,
            message: "This Practice Is Completed!",
          });
        }
      } else {
        return res.send({
          status: false,
          message: "Practice Not Found!",
        });
      }
    } else
      return res.send({
        status: false,
        message: "ID(s) are not valid",
      });
  } catch (error) {
    console.error("Error getting Questions:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
const setTestComplete = async (req, res) => {
  try {
    const { RevisionID } = req.params;
    if (isValidObjectId(RevisionID)) {
      const checkIsStarted = await ReportingMdl.findOne({
        UserID: req.userDetails._id,
        _id: RevisionID,
        TestType: "test",
        status: "in-process",
      });
      if (checkIsStarted) {
        const EndDate = new Date();
        checkIsStarted.EndDate = EndDate;
        checkIsStarted.status = "complete";

        // Calculate time difference in milliseconds
        const timeDiffMs = EndDate - checkIsStarted.StartDate;

        // Convert milliseconds to hours, minutes, and seconds
        const hours = Math.floor(timeDiffMs / (1000 * 60 * 60));
        const minutes = Math.floor(
          (timeDiffMs % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((timeDiffMs % (1000 * 60)) / 1000);

        // Build completeTime string based on non-zero values
        // Format each unit with leading zeros if necessary
        const formattedHours = String(hours).padStart(2, "0");
        const formattedMinutes = String(minutes).padStart(2, "0");
        const formattedSeconds = String(seconds).padStart(2, "0");

        // Construct completeTime in "hh:mm:ss" format
        checkIsStarted.completeTime = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;

        const ResultPercentage = await calculatePercentage(RevisionID).catch(
          (err) => {
            return 0; // Return 0 in case of an error
          }
        );
        checkIsStarted.ResultPercentage = ResultPercentage;
        await checkIsStarted.save();
        return res.send({
          status: true,
          message: `Test completed. Your score is ${ResultPercentage.toFixed(
            2
          )}%`,
          checkIsStarted,
        });
      } else {
        return res.send({ status: false, message: "In-valid Practice!" });
      }
    } else {
      return res.send({ status: false, message: "ID is not valid!" });
    }
  } catch (error) {
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
module.exports = {
  getQuizByQuizChapterForRevision,
  getQuizByChapterForPractice,
  setRevisionComplete,
  getQuizByChapterForTest,
  getRevisionNextQuestion,
  getPracticeNextQuestion,
  getTestNextQuestion,
  setPracticeComplete,
  submitPracticeAnswer,
  submitTestAnswer,
  setTestComplete,
};
