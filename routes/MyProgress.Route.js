const auth = require("../middleware/authMiddleware");
const MyProgressController = require("../controllers/MyProgress.Controller");
const multer = require("multer");
const upload = multer({ dest: "./public/data/uploads/" });
module.exports = (router) => {
  router.get("/progress/summary", auth, MyProgressController.getMySummary);
  router.get(
    "/progress/summary/details/:ReportID",
    auth,
    MyProgressController.getDetailReport
  );
};
