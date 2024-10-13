const express = require("express");
const router = express.Router();
require("./User.Route")(router);
require("./Utility.Route")(router);
module.exports = router;
