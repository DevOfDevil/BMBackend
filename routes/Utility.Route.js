const auth = require("../middleware/authMiddleware");
const CommonController = require("../helper/Common.Controllers");
const multer = require("multer");
const upload = multer({ dest: "./public/data/uploads/" });
module.exports = (router) => {
  router.get("/getAllCatTree", CommonController.getAllCatTree);
};
