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
    "/questions/practice/getQuizByChapter/:ChapterID",
    auth,
    QuestionController.getQuizByChapterForPractice
  );
};
