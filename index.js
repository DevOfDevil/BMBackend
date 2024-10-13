const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");
const router = require("./routes");
const Adminrouter = require("./routes/admin");
const bodyParser = require("body-parser");
const system = require("./system/initialize");
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "500mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "500mb",
    extended: true,
    parameterLimit: 5000000,
  })
);
const PORT = process.env.PORT || 5000;

connectDB();
const server = require("http").createServer(app);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api", router);
app.use("/admin", Adminrouter);
server.listen(PORT, () => {
  console.log(`Node app is running on port ${PORT}`);
  system.initializePermission();
  system.initializeRoles();
  system.initializeAdmin();
});
