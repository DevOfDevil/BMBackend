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
  router.get(
    "/class/getClassByID/:classID",
    auth,
    OnlineClassesController.getClassByID
  );
  router.get(
    "/class/deleteClassByID/:classID",
    auth,
    OnlineClassesController.deleteClass
  );

  router.post(
    "/class/update",
    auth,
    upload.single("ClassThumbnail"),
    OnlineClassesController.updateClass
  );
};
