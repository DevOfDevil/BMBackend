const auth = require("../middleware/authMiddleware");
const UserController = require("../controllers/User.Controller");
const multer = require("multer");
const upload = multer({ dest: "./public/data/uploads/" });
module.exports = (router) => {
  router.post("/users/login", UserController.login);

  router.post("/users/signup", UserController.signup);
};
