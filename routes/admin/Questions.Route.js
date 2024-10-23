const auth = require("../../middleware/adminMiddleware");
const QuestionController = require("../../controllers/Admin/Question.Controller");
const multer = require("multer");
const upload = multer({ dest: "./public/data/uploads/" });
module.exports = (router) => {
  router.post(
    "/question/add",
    auth,
    upload.fields([
      { name: "QuestionImage", maxCount: 1 },
      { name: "QuestionAudio", maxCount: 1 },
    ]),
    QuestionController.addQuestion
  );

  router.get(
    "/question/getByChapterID/:ChapterID",
    auth,
    QuestionController.GetQuestionByChapterID
  );
  router.get("/question/getAll", auth, QuestionController.GetAllQuestions);
  router.post(
    "/question/importQuestions",
    auth,
    upload.single("questionCsv"),
    QuestionController.importQuestions
  );

  router.get(
    "/question/getQuestionByID/:QuestionID",
    auth,
    QuestionController.getQuestionByID
  );
  router.get(
    "/question/deleteQuestion/:QuestionID",
    auth,
    QuestionController.deleteQuestion
  );
  router.post(
    "/question/update",
    auth,
    upload.fields([
      { name: "QuestionImage", maxCount: 1 },
      { name: "QuestionAudio", maxCount: 1 },
    ]),
    QuestionController.updateQuestion
  );
};
