const auth = require("../../middleware/adminMiddleware");
const ChapterController = require("../../controllers/Admin/Chapter.Controller");
const multer = require("multer");
const upload = multer({ dest: "./public/data/uploads/" });
module.exports = (router) => {
  router.post("/chapter/add", auth, ChapterController.addChapter);
  router.get(
    "/chapter/getByQuizID/:QuizID",
    auth,
    ChapterController.GetChapterByQuizID
  );
  router.get("/chapter/getAll", auth, ChapterController.GetAllChapter);
};
