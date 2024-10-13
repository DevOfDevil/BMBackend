const auth = require("../../middleware/adminMiddleware");
const QuestionController = require("../../controllers/Admin/Question.Controller");
const multer = require("multer");
const upload = multer({ dest: "./public/data/uploads/" });
module.exports = (router) => {
  router.post("/question/add", auth, QuestionController.addQuestion);

  router.get(
    "/question/getByChapterID/:ChapterID",
    auth,
    QuestionController.GetQuestionByChapterID
  );
  router.get("/question/getAll", auth, QuestionController.GetAllQuestions);
  router.get(
    "/question/importQuestions",
    auth,
    upload.single("questionCsv"),
    QuestionController.GetAllQuestions
  );
};
