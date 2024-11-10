const express = require("express");
const router = express.Router();
require("./User.Route")(router);
require("./Utility.Route")(router);
require("./Onlineclass.Route")(router);
require("./Schedule.Route")(router);
require("./Question.Route")(router);
require("./MyProgress.Route")(router);
module.exports = router;
