const auth = require("../../middleware/adminMiddleware");
const OnlineClassesController = require("../../controllers/Admin/OnlineClasses.Controller");
const multer = require("multer");
const upload = multer({ dest: "./public/data/uploads/" });
module.exports = (router) => {
  router.post(
    "/class/add",
    auth,
    upload.single("ClassThumbnail"),
    OnlineClassesController.addClass
  );
  router.get("/class/getAll", auth, OnlineClassesController.listAllClasses);
};
