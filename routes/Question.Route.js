const auth = require("../middleware/authMiddleware");
const QuestionController = require("../controllers/Question.Controller");
const multer = require("multer");
const upload = multer({ dest: "./public/data/uploads/" });
module.exports = (router) => {
  router.get(
    "/questions/revision/getQuizByQuizChapter/:ChapterID",
    auth,
    QuestionController.getQuizByQuizChapterForRevision
  );
  router.get(
    "/questions/revision/complete/:RevisionID",
    auth,
    QuestionController.setRevisionComplete
  );
  router.get(
    "/questions/practice/complete/:RevisionID",
    auth,
    QuestionController.setPracticeComplete
  );

  router.get(
    "/questions/practice/getQuizByChapter/:ChapterID",
    auth,
    QuestionController.getQuizByChapterForPractice
  );
  router.post(
    "/questions/revision/getNextQuestion",
    auth,
    QuestionController.getRevisionNextQuestion
  );
  router.post(
    "/questions/practice/getNextQuestion",
    auth,
    QuestionController.getPracticeNextQuestion
  );
  router.post(
    "/questions/practice/submitAnswer",
    auth,
    QuestionController.submitPracticeAnswer
  );

  router.get(
    "/questions/test/getQuizByChapter/:ChapterID",
    auth,
    QuestionController.getQuizByChapterForTest
  );
  router.post(
    "/questions/test/getNextQuestion",
    auth,
    QuestionController.getTestNextQuestion
  );
  /*
  router.post(
    "/questions/revision/getNextQuestion",
    auth,
    (req, res, next) => {
      // Add the parameter manually to the request body
      req.body.TestType = "revision"; // replace "your_value_here" with the actual value
      next(); // Pass control to the next middleware (QuestionController.getNextQuestion)
    },
    QuestionController.getNextQuestion
  );
  
  router.post(
    "/questions/practice/getNextQuestion",
    auth,
    (req, res, next) => {
      // Add the parameter manually to the request body
      req.body.TestType = "practice"; // replace "your_value_here" with the actual value
      next(); // Pass control to the next middleware (QuestionController.getNextQuestion)
    },
    QuestionController.getNextQuestion
  );
  router.post(
    "/questions/test/getNextQuestion",
    auth,
    (req, res, next) => {
      // Add the parameter manually to the request body
      req.body.TestType = "test"; // replace "your_value_here" with the actual value
      next(); // Pass control to the next middleware (QuestionController.getNextQuestion)
    },
    QuestionController.getNextQuestion
  );
  */
};
