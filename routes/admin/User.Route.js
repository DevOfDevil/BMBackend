const auth = require("../../middleware/adminMiddleware");
const UserController = require("../../controllers/Admin/User.Controller");
module.exports = (router) => {
  router.post("/login", UserController.login);
  router.get("/getAllUser", auth, UserController.getAllUser);
  router.post("/addClient", auth, UserController.addUser);
  router.post("/setClientPermisiion", auth, UserController.setClientPermisiion);
};
