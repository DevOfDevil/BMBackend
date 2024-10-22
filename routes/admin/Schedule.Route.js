const auth = require("../../middleware/adminMiddleware");
const ScheduleController = require("../../controllers/Admin/Schedule.Controller");
const multer = require("multer");
const upload = multer({ dest: "./public/data/uploads/" });
module.exports = (router) => {
  router.post("/schedule/add", auth, ScheduleController.addSchedule);
  router.get("/schedule/getAll", auth, ScheduleController.listAll);

  router.get(
    "/schedule/getScheduleByID/:ScheduleID",
    auth,
    ScheduleController.getScheduleByID
  );
  router.get(
    "/schedule/deleteScheduleByID/:ScheduleID",
    auth,
    ScheduleController.deleteSchedule
  );

  router.post("/schedule/update", auth, ScheduleController.updateSchedule);
};
