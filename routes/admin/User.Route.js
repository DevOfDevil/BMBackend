const auth = require("../../middleware/adminMiddleware");
const UserController = require("../../controllers/Admin/User.Controller");
module.exports = (router) => {
  router.post("/login", UserController.login);
  router.get("/getAllUser", auth, UserController.getAllUser);
  router.post("/addClient", auth, UserController.addUser);
  router.post("/updateClient", auth, UserController.updateClient);
  router.post("/setClientPermission", auth, UserController.setClientPermission);
  router.get(
    "/getClientReportSummary/:ClientID",
    auth,
    UserController.getClientReportSummary
  );
  router.get(
    "/getClientReportSummary/:ClientID/:ReportID",
    auth,
    UserController.getClientDetailReportSummary
  );
};
