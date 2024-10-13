const auth = require("../../middleware/adminMiddleware");
const CatController = require("../../controllers/Admin/categoryControllers");
const multer = require("multer");
const upload = multer({ dest: "./public/data/uploads/" });
module.exports = (router) => {
  router.post("/category/add", auth, CatController.addCategory);

  router.get("/category/all", auth, CatController.ListAll);
};
