const auth = require("../middleware/authMiddleware");
const OnlineclassesController = require("../controllers/Onlineclasses.Controller");
module.exports = (router) => {
  router.get(
    "/getOnlineClasses",
    auth,
    OnlineclassesController.getOnlineClasses
  );
};
