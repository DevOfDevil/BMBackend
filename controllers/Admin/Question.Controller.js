const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose"); // Make sure you have mongoose imported
const OptionMdl = require("../../models/Options");
const QuestionMdl = require("../../models/Questions");
const { ObjectId } = mongoose.Types;

function isValidObjectId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

const GetQuestionByChapterID = async (req, res) => {
  try {
    const { ChapterID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ChapterID)) {
      return res
        .status(400)
        .send({ status: false, message: "Invalid ChapterID" });
    }

    const Questions = await QuestionMdl.find({
      Chapter: ChapterID,
      isDeleted: false,
    }).populate({
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
        const options = await OptionMdl.find({
          Question: question._id,
          isDeleted: false,
        });

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
/*
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
    const Questions = await QuestionMdl.find({ Chapter: ChapterID }).populate({
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
    console.error("Error creating question:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
*/

const addQuestion = async (req, res) => {
  try {
    const { ChapterID, QuestionTitle } = req.body;
    if (!isValidObjectId(ChapterID)) {
      return res.send({ status: false, message: "Chapter ID is not Valid!" });
    }
    const QuestionImage = req.files["QuestionImage"]
      ? req.files["QuestionImage"][0]
      : null;
    const QuestionAudio = req.files["QuestionAudio"]
      ? req.files["QuestionAudio"][0]
      : null;
    const QuestionOption = JSON.parse(req.body.QuestionOption);
    if (!Array.isArray(QuestionOption)) {
      return res.send({
        status: false,
        message: "QuestionOption should be an array",
      });
    }

    let imageURL = "";
    let AudioUrl = "";

    // Handle image as Base64
    if (QuestionImage) {
      const validMimeTypes = ["image/jpeg", "image/png"];
      if (!validMimeTypes.includes(QuestionImage.mimetype)) {
        // Remove temp file if invalid format
        fs.unlink(QuestionImage.path, (err) => {
          if (err) console.error("Error removing temp file:", err);
        });
        return res.send({ status: false, message: "Invalid image file type" });
      }

      const imageExtension = path.extname(QuestionImage.originalname);
      const uniqueImageFileName = `${Date.now()}${imageExtension}`;
      const ImageFilePath = path.join(
        __dirname,
        "../../public/data/uploads/",
        uniqueImageFileName
      );

      // Move the Image file to the desired directory with the new unique name
      fs.rename(QuestionImage.path, ImageFilePath, (err) => {
        if (err) {
          console.error("Error moving Image file:", err);
          return res.send({
            status: false,
            message: "Error saving image file",
          });
        }
      });

      // Set the audio file URL
      imageURL = `/public/data/uploads/${uniqueImageFileName}`;
    }

    // Handle audio file by saving to directory with unique name
    if (QuestionAudio) {
      const validAudioTypes = [
        "audio/mpeg",
        "audio/wav",
        "audio/mp3",
        "audio/ogg",
      ];
      if (!validAudioTypes.includes(QuestionAudio.mimetype)) {
        // Remove temp file if invalid format
        fs.unlink(QuestionAudio.path, (err) => {
          if (err) console.error("Error removing temp file:", err);
        });
        return res.send({ status: false, message: "Invalid audio file type" });
      }

      // Extract the file extension (e.g., .mp3, .wav)
      const audioExtension = path.extname(QuestionAudio.originalname);

      // Generate a unique file name using Date.now() and the file extension
      const uniqueAudioFileName = `${Date.now()}${audioExtension}`;
      const audioFilePath = path.join(
        __dirname,
        "../../public/data/uploads/",
        uniqueAudioFileName
      );

      // Move the audio file to the desired directory with the new unique name
      fs.rename(QuestionAudio.path, audioFilePath, (err) => {
        if (err) {
          console.error("Error moving audio file:", err);
          return res.send({
            status: false,
            message: "Error saving audio file",
          });
        }
      });

      // Set the audio file URL
      AudioUrl = `/public/data/uploads/${uniqueAudioFileName}`;
    }

    // Save the question
    const AddQuestion = new QuestionMdl({
      Chapter: ChapterID,
      Question: QuestionTitle,
      imageURL: imageURL,
      AudioUrl: AudioUrl,
      isDeleted: false,
    });
    await AddQuestion.save();

    // Save the options related to this question
    const optionPromises = QuestionOption.map((option) => {
      const newOption = new OptionMdl({
        Question: AddQuestion._id, // Reference to the question ID
        Option: option.option,
        isCorrect: option.IsCorrect,
        isDeleted: false,
      });
      return newOption.save();
    });

    // Wait for all options to be saved
    await Promise.all(optionPromises);

    // Fetch all questions related to the QuizID
    const Questions = await QuestionMdl.find({
      Chapter: ChapterID,
      isDeleted: false,
    }).populate({
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
        const options = await OptionMdl.find({
          Question: question._id,
          isDeleted: false,
        });

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
    const Questions = await QuestionMdl.find({
      isDeleted: false,
    }).populate({
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
        const options = await OptionMdl.find({
          Question: question._id,
          isDeleted: false,
        });

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

const importQuestions = async (req, res) => {
  try {
    const { ChapterID, QuestionTitle } = req.body;
    const QuestionImage = req.files["QuestionImage"]
      ? req.files["QuestionImage"][0]
      : null;
    const QuestionAudio = req.files["QuestionAudio"]
      ? req.files["QuestionAudio"][0]
      : null;
    const QuestionOption = JSON.parse(req.body.QuestionOption);
    if (!Array.isArray(QuestionOption)) {
      return res.send({
        status: false,
        message: "QuestionOption should be an array",
      });
    }

    let imageURL = "";
    let AudioUrl = "";

    // Handle image as Base64
    if (QuestionImage) {
      const validMimeTypes = ["image/jpeg", "image/png"];
      if (!validMimeTypes.includes(QuestionImage.mimetype)) {
        // Remove temp file if invalid format
        fs.unlink(QuestionImage.path, (err) => {
          if (err) console.error("Error removing temp file:", err);
        });
        return res.send({ status: false, message: "Invalid image file type" });
      }

      const imageExtension = path.extname(QuestionImage.originalname);
      const uniqueImageFileName = `${Date.now()}${imageExtension}`;
      const ImageFilePath = path.join(
        __dirname,
        "../../public/data/uploads/",
        uniqueImageFileName
      );

      // Move the Image file to the desired directory with the new unique name
      fs.rename(QuestionImage.path, ImageFilePath, (err) => {
        if (err) {
          console.error("Error moving Image file:", err);
          return res.send({
            status: false,
            message: "Error saving image file",
          });
        }
      });

      // Set the audio file URL
      imageURL = `/public/data/uploads/${uniqueImageFileName}`;
    }

    // Handle audio file by saving to directory with unique name
    if (QuestionAudio) {
      const validAudioTypes = [
        "audio/mpeg",
        "audio/wav",
        "audio/mp3",
        "audio/ogg",
      ];
      if (!validAudioTypes.includes(QuestionAudio.mimetype)) {
        // Remove temp file if invalid format
        fs.unlink(QuestionAudio.path, (err) => {
          if (err) console.error("Error removing temp file:", err);
        });
        return res.send({ status: false, message: "Invalid audio file type" });
      }

      // Extract the file extension (e.g., .mp3, .wav)
      const audioExtension = path.extname(QuestionAudio.originalname);

      // Generate a unique file name using Date.now() and the file extension
      const uniqueAudioFileName = `${Date.now()}${audioExtension}`;
      const audioFilePath = path.join(
        __dirname,
        "../../public/data/uploads/",
        uniqueAudioFileName
      );

      // Move the audio file to the desired directory with the new unique name
      fs.rename(QuestionAudio.path, audioFilePath, (err) => {
        if (err) {
          console.error("Error moving audio file:", err);
          return res.send({
            status: false,
            message: "Error saving audio file",
          });
        }
      });

      // Set the audio file URL
      AudioUrl = `/public/data/uploads/${uniqueAudioFileName}`;
    }

    // Save the question
    const AddQuestion = new QuestionMdl({
      Chapter: ChapterID,
      Question: QuestionTitle,
      imageURL: imageURL,
      AudioUrl: AudioUrl,
    });
    await AddQuestion.save();

    // Save the options related to this question
    const optionPromises = QuestionOption.map((option) => {
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
    const Questions = await QuestionMdl.find({ Chapter: ChapterID }).populate({
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
    console.error("Error creating question:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};

const getQuestionByID = async (req, res) => {
  try {
    const { QuestionID } = req.params;
    const Questions = await QuestionMdl.find({
      _id: QuestionID,
      isDeleted: false,
    }).populate({
      path: "Chapter",
      populate: {
        path: "QuizID",
        populate: {
          path: "Category", // Populating the Category inside the Quiz model
        },
      },
    });
    if (Questions.length) {
      // Fetch the options for each question and randomize the order
      const questionsWithOptions = await Promise.all(
        Questions.map(async (question) => {
          const options = await OptionMdl.find({
            Question: question._id,
            isDeleted: false,
          });

          // Randomize the order of the options
          const shuffledOptions = options.sort(() => Math.random() - 0.5);

          return {
            ...question._doc, // Spread the question data
            options: shuffledOptions, // Attach the randomized options
          };
        })
      );
      return res.send({ status: true, Question: questionsWithOptions });
    } else {
      return res.send({ status: false, message: "message not found!" });
    }
  } catch (error) {
    return res.send({
      status: false,
      message: "something went wrong!",
    });
  }
};
const deleteQuestion = async (req, res) => {
  try {
    const { QuestionID } = req.params;

    const deleteQuestion = await QuestionMdl.findByIdAndUpdate(QuestionID, {
      isDeleted: true,
      updated: Date.now(),
    });

    const Questions = await QuestionMdl.find({
      isDeleted: false,
    }).populate({
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
        const options = await OptionMdl.find({
          Question: question._id,
          isDeleted: false,
        });

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
    return res.send({
      status: false,
      message: "something went wrong!",
    });
  }
};
const updateQuestion = async (req, res) => {
  try {
    const {
      QuestionID,
      ChapterID,
      QuestionTitle,
      isImageDeleted,
      isAudioDeleted,
    } = req.body;
    if (!isValidObjectId(ChapterID)) {
      return res.send({ status: false, message: "Chapter ID is not Valid!" });
    }
    if (!isValidObjectId(QuestionID)) {
      return res.send({ status: false, message: "Question ID is not Valid!" });
    }

    const chkQuestions = await QuestionMdl.findOne({
      _id: QuestionID,
      isDeleted: false,
    });
    if (!chkQuestions) {
      return res.send({
        status: false,
        message: "Question Not Exits!",
      });
    }

    const QuestionImage = req.files["QuestionImage"]
      ? req.files["QuestionImage"][0]
      : null;
    const QuestionAudio = req.files["QuestionAudio"]
      ? req.files["QuestionAudio"][0]
      : null;
    const QuestionOption = JSON.parse(req.body.QuestionOption);
    if (!Array.isArray(QuestionOption)) {
      return res.send({
        status: false,
        message: "QuestionOption should be an array",
      });
    }

    let imageURL = chkQuestions.imageURL;
    let AudioUrl = chkQuestions.AudioUrl;
    if (isImageDeleted == true) {
      imageURL = "";
    }
    if (isAudioDeleted == true) {
      AudioUrl = "";
    }
    // Handle image as Base64
    if (QuestionImage) {
      const validMimeTypes = ["image/jpeg", "image/png"];
      if (!validMimeTypes.includes(QuestionImage.mimetype)) {
        // Remove temp file if invalid format
        fs.unlink(QuestionImage.path, (err) => {
          if (err) console.error("Error removing temp file:", err);
        });
        return res.send({ status: false, message: "Invalid image file type" });
      }

      const imageExtension = path.extname(QuestionImage.originalname);
      const uniqueImageFileName = `${Date.now()}${imageExtension}`;
      const ImageFilePath = path.join(
        __dirname,
        "../../public/data/uploads/",
        uniqueImageFileName
      );

      // Move the Image file to the desired directory with the new unique name
      fs.rename(QuestionImage.path, ImageFilePath, (err) => {
        if (err) {
          console.error("Error moving Image file:", err);
          return res.send({
            status: false,
            message: "Error saving image file",
          });
        }
      });

      // Set the audio file URL
      imageURL = `/public/data/uploads/${uniqueImageFileName}`;
    }

    // Handle audio file by saving to directory with unique name
    if (QuestionAudio) {
      const validAudioTypes = [
        "audio/mpeg",
        "audio/wav",
        "audio/mp3",
        "audio/ogg",
      ];
      if (!validAudioTypes.includes(QuestionAudio.mimetype)) {
        // Remove temp file if invalid format
        fs.unlink(QuestionAudio.path, (err) => {
          if (err) console.error("Error removing temp file:", err);
        });
        return res.send({ status: false, message: "Invalid audio file type" });
      }

      // Extract the file extension (e.g., .mp3, .wav)
      const audioExtension = path.extname(QuestionAudio.originalname);

      // Generate a unique file name using Date.now() and the file extension
      const uniqueAudioFileName = `${Date.now()}${audioExtension}`;
      const audioFilePath = path.join(
        __dirname,
        "../../public/data/uploads/",
        uniqueAudioFileName
      );

      // Move the audio file to the desired directory with the new unique name
      fs.rename(QuestionAudio.path, audioFilePath, (err) => {
        if (err) {
          console.error("Error moving audio file:", err);
          return res.send({
            status: false,
            message: "Error saving audio file",
          });
        }
      });

      // Set the audio file URL
      AudioUrl = `/public/data/uploads/${uniqueAudioFileName}`;
    }

    const updateQuestion = await QuestionMdl.findOneAndUpdate(
      { _id: QuestionID, Chapter: ChapterID },
      {
        Chapter: ChapterID,
        Question: QuestionTitle,
        imageURL: imageURL,
        AudioUrl: AudioUrl,
        updated: Date.now(),
      }
    );

    const updateOptions = await OptionMdl.findAllAndUpdate(
      { Question: QuestionID },
      {
        isDeleted: true,
      }
    );

    // Save the options related to this question
    const optionPromises = QuestionOption.map((option) => {
      const newOption = new OptionMdl({
        Question: QuestionID, // Reference to the question ID
        Option: option.option,
        isCorrect: option.IsCorrect,
      });
      return newOption.save();
    });

    // Wait for all options to be saved
    await Promise.all(optionPromises);

    const Questions = await QuestionMdl.find({
      _id: QuestionID,
      isDeleted: false,
    }).populate({
      path: "Chapter",
      populate: {
        path: "QuizID",
        populate: {
          path: "Category", // Populating the Category inside the Quiz model
        },
      },
    });
    if (Questions.length) {
      // Fetch the options for each question and randomize the order
      const questionsWithOptions = await Promise.all(
        Questions.map(async (question) => {
          const options = await OptionMdl.find({
            Question: question._id,
            isDeleted: false,
          });

          // Randomize the order of the options
          const shuffledOptions = options.sort(() => Math.random() - 0.5);

          return {
            ...question._doc, // Spread the question data
            options: shuffledOptions, // Attach the randomized options
          };
        })
      );
      return res.send({ status: true, Question: questionsWithOptions });
    }
  } catch (error) {
    console.error("Error creating question:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
module.exports = {
  addQuestion,
  GetQuestionByChapterID,
  GetAllQuestions,
  importQuestions,
  getQuestionByID,
  deleteQuestion,
  updateQuestion,
};
