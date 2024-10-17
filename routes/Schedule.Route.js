const auth = require("../middleware/authMiddleware");
const ScheduleController = require("../controllers/Schedule.Controller");
module.exports = (router) => {
  router.get("/getSchedule", auth, ScheduleController.classtimes);
};
