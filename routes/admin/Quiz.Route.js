const auth = require("../../middleware/adminMiddleware");
const QuizController = require("../../controllers/Admin/Quiz.Controller");
const multer = require("multer");
const upload = multer({ dest: "./public/data/uploads/" });
module.exports = (router) => {
  router.post("/quiz/add", auth, QuizController.addQuiz);
  router.get("/quiz/getByCatID/:CatID", auth, QuizController.GetQuizByCatID);
  router.get("/quiz/getAll", auth, QuizController.ListAllQuiz);
  router.get("/quiz/getQuizById/:QuizID", auth, QuizController.getQuizById);

  router.get("/quiz/deleteQuizByID/:QuizID", auth, QuizController.deleteQuiz);
  router.post("/quiz/update", auth, QuizController.updateQuiz);
};
