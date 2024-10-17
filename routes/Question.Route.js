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
};
