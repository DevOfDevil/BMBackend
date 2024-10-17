const auth = require("../middleware/authMiddleware");
const UserController = require("../controllers/User.Controller");
const multer = require("multer");
const upload = multer({ dest: "./public/data/uploads/" });
module.exports = (router) => {
  router.post("/users/login", UserController.login);

  router.post("/users/signup", UserController.signup);
  router.get("/users/getMycategories", auth, UserController.getMycategories);
  router.get("/users/getMyQuizzes", auth, UserController.getMyQuizzes);
  router.get("/users/getMyChapters", auth, UserController.getMyChapters);
  router.get(
    "/users/getMyCateogryTree",
    auth,
    UserController.getMyCateogryTree
  );
  router.get(
    "/users/getChapterByQuizID/:QuizID",
    auth,
    UserController.getChapterByQuizID
  );
};
