const express = require("express");
const mongoose = require("mongoose");
const system = require("./system/bot");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");
const router = require("./routes");
const AuctionController = require("./controller/Auction.Controller");

const bodyParser = require("body-parser");
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
const contractAddress = process.env.SmartContractAddress;
const BullContractAddress = process.env.BullContractAddress;
const MongoClient = require("mongodb").MongoClient;
const axios = require("axios");
const AuctionBidModel = require("./models/AuctionBid");
const MetaModel = require("./models/MetadataModel");
const PreMetadataModel = require("./models/PreRevelMetadata");
const ArtWatch = require("./models/Art");
//bull
const BullArtWatch = require("./models/bull/Art");
const BullMetaModel = require("./models/bull/MetadataModel");
const bullPreMetadataModel = require("./models/bull/PreRevelMetadata");
const cron = require("node-cron");
const UserController = require("./controller/User.Controller");
const pendingEvents = require("./system/PendingEvents");
const Transferevents = require("./system/TransferEvents");

// bull
const BullpendingEvents = require("./system/bull/BullPendingEvents");
const BullTransferevents = require("./system/bull/BullTransferEvents");
const BullSystem = require("./system/bull/BullBot");
connectDB();

const server = require("http").createServer(app);
var io = require("socket.io")(server, {
  cors: { origin: "*" },
});
io.on("connection", (socket) => {
  socket.on("AuctionLeaderBoard", (userId) => {
    system.AuctionLeaderBoard(io);
  });
});

var fs = require("fs");

var options = {
  key: fs.readFileSync("/etc/letsencrypt/live/barbearians.quest/privkey.pem"),
  cert: fs.readFileSync(
    "/etc/letsencrypt/live/barbearians.quest/fullchain.pem"
  ),
};
const httpsServer = require("https").createServer(options);
var io2 = require("socket.io")(httpsServer, {
  cors: { origin: "*" },
});
io2.on("connection", (socket) => {
  socket.on("AuctionLeaderBoard", (userId) => {
    system.AuctionLeaderBoard(io2, "8151");
  });
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api", router);
app.use("/api/bull", require("./routes/bull"));
server.listen(PORT, () => {
  console.log(`Node app is running on port ${PORT}`);
});

httpsServer.listen(8151, () => {
  console.log("Https socket Server has started!");
});

// write outside of cron
system.getEthPriceUpdate();
// bull
BullSystem.getEthPriceUpdate();

cron.schedule("* * * * *", () => {
  //system.calculateDailyBattleReward();
  pendingEvents.PendingTransactionLogs();
  // bull
  BullpendingEvents.BullPendingTransactionLogs();

  //check Territories expiry
  system.updateExpiredTDMTerritories();
  system.updateExpiredDominationTerritories();
});

cron.schedule("*/5 * * * *", () => {
  system.calculateDailyBattleReward();
  system.calculateDailyRescueReward();
  system.calculateDailyHostageReward();

  // bull
  BullSystem.calculateDailyBattleReward();
  BullSystem.calculateDailyRescueReward();
  BullSystem.calculateDailyHostageReward();

  //war rewards
  system.calculateDailyWarReward();

  //go to Martyr
  system.checkMartyrArt();
  BullSystem.checkMartyrArt();
});

// cron to update nft details if user send nft to other wallet
cron.schedule("* * * * *", () => {
  io2.emit("LastRefreshTime", new Date());
  Transferevents.GetTransferEvents();
});
cron.schedule("10 * * * *", () => {
  //UserController.getWinnerUserPNL();
  //UserController.getWinnerUserEthSim();
});

AuctionBidModel.watch([
  { $match: { operationType: { $in: ["insert", "update"] } } },
]).on("change", (data) => {
  system.AuctionLeaderBoard(io, "8151");
  //system.AuctionLeaderBoard(io);
});

ArtWatch.watch([{ $match: { operationType: { $in: ["update", "insert"] } } }], {
  fullDocument: "updateLookup",
}).on("change", async (data) => {
  let checkMetaData = await MetaModel.findOne({
    name: data.fullDocument.tokenId,
  });
  if (checkMetaData) {
    const convertedToArray = JSON.parse(checkMetaData.metadata);
    let myObjecty = {};
    Object.keys(convertedToArray).forEach((key) => {
      if (key != "attributes") {
        myObjecty[key] = convertedToArray[key];
      } else if (key == "attributes") {
        let anotherObject = [];
        const isArrayObject = convertedToArray[key];
        isArrayObject.forEach((elem) => {
          let anotherObjectTrait = {};
          if (
            elem.trait_type.trim() != "Bear Type" &&
            elem.trait_type.trim() != "Locked" &&
            elem.trait_type.trim() != "State"
          ) {
            Object.keys(elem).forEach((keyExtra) => {
              anotherObjectTrait[keyExtra] = elem[keyExtra];
            });

            anotherObject.push(anotherObjectTrait);
          }
        });
        anotherObject.push({
          trait_type: "Bear Type",
          value: data.fullDocument.bearType,
        });
        if (
          data.fullDocument.bearType == "Fighter Bear" &&
          data.fullDocument.missionState == "in training"
        ) {
          anotherObject.push({
            trait_type: "Locked",
            value: "Yes",
          });
        } else if (
          data.fullDocument.bearType == "Fighter Bear" &&
          data.fullDocument.missionState == "in battle"
        ) {
          anotherObject.push({
            trait_type: "Locked",
            value: "Yes",
          });
        } else if (data.fullDocument.bearType == "Hostage Bear") {
          anotherObject.push({
            trait_type: "Locked",
            value: "Yes",
          });
        } else {
          anotherObject.push({
            trait_type: "Locked",
            value: data.fullDocument.lockedState == true ? "Yes" : "No",
          });
        }
        anotherObject.push({
          trait_type: "State",
          value: data.fullDocument.missionState,
        });
        myObjecty["attributes"] = anotherObject;
      }
    });
    const updateMata = await MetaModel.updateOne(
      { name: data.fullDocument.tokenId },
      { $set: { metadata: JSON.stringify(myObjecty) } }
    );
    /*
    const updatePreMata = await PreMetadataModel.updateOne(
      { name: data.fullDocument.tokenId },
      { $set: { metadata: JSON.stringify(myObjecty) } }
    );
    */
  }

  let PrecheckMetaData = await PreMetadataModel.findOne({
    name: data.fullDocument.tokenId,
  });
  if (PrecheckMetaData) {
    const convertedToArray = JSON.parse(PrecheckMetaData.metadata);
    let myObjecty = {};
    Object.keys(convertedToArray).forEach((key) => {
      if (
        data.fullDocument.bearType == "Fighter Bear" &&
        key == "description"
      ) {
        myObjecty["description"] = "Grr, I'm a bear!";
      } else if (
        data.fullDocument.bearType == "Noobie Bear" &&
        key == "description"
      ) {
        myObjecty["description"] = "Grr, I'm a bear!";
      } else if (
        data.fullDocument.bearType == "Fighter Bear" &&
        key == "image"
      ) {
        myObjecty["image"] =
          "https://gateway.pinata.cloud/ipfs/QmaJwWKeT7MwJic3BqMbDDGSr1BNTzakrXb83EPAvvB4i4";
      } else if (
        data.fullDocument.bearType == "Noobie Bear" &&
        key == "image"
      ) {
        myObjecty["image"] =
          "https://gateway.pinata.cloud/ipfs/QmX5r9RWRLtC5HPPD13wex7v4rcUhNWoVLht8NnFwKEFo7";
      } else if (key == "attributes") {
        let anotherObject = [];
        const isArrayObject = convertedToArray[key];
        isArrayObject.forEach((elem) => {
          let anotherObjectTrait = {};
          if (
            elem.trait_type.trim() != "Bear Type" &&
            elem.trait_type.trim() != "Locked" &&
            elem.trait_type.trim() != "State"
          ) {
            Object.keys(elem).forEach((keyExtra) => {
              anotherObjectTrait[keyExtra] = elem[keyExtra];
            });

            anotherObject.push(anotherObjectTrait);
          }
        });
        anotherObject.push({
          trait_type: "Bear Type",
          value: data.fullDocument.bearType,
        });
        if (
          data.fullDocument.bearType == "Fighter Bear" &&
          data.fullDocument.missionState == "in training"
        ) {
          anotherObject.push({
            trait_type: "Locked",
            value: "Yes",
          });
        } else if (
          data.fullDocument.bearType == "Fighter Bear" &&
          data.fullDocument.missionState == "in battle"
        ) {
          anotherObject.push({
            trait_type: "Locked",
            value: "Yes",
          });
        } else if (data.fullDocument.bearType == "Hostage Bear") {
          anotherObject.push({
            trait_type: "Locked",
            value: "Yes",
          });
        } else {
          anotherObject.push({
            trait_type: "Locked",
            value: data.fullDocument.lockedState == true ? "Yes" : "No",
          });
        }
        anotherObject.push({
          trait_type: "State",
          value: "",
        });
        myObjecty["attributes"] = anotherObject;
      } else {
        myObjecty[key] = convertedToArray[key];
      }
    });
    console.log("myObjecty:=", JSON.stringify(myObjecty));
    const updatePreMata = await PreMetadataModel.updateOne(
      { name: data.fullDocument.tokenId },
      { $set: { metadata: JSON.stringify(myObjecty) } },
      { new: true, runValidators: true }
    );
    console.log("updatePreMata:=", updatePreMata);
  }
  try {
    const api_res = await axios.post(
      `https://testnets-api.opensea.io/api/v2/chain/goerli/contract/${contractAddress}/nfts/${data.fullDocument.tokenId}/refresh`
    );
  } catch (error) {
    console.log("metaData refresh:=" + error.message);
  }
});
BullArtWatch.watch(
  [{ $match: { operationType: { $in: ["update", "insert"] } } }],
  {
    fullDocument: "updateLookup",
  }
).on("change", async (data) => {
  let bullcheckMetaData = await BullMetaModel.findOne({
    name: data.fullDocument.tokenId,
  });
  if (bullcheckMetaData) {
    const convertedToArray = JSON.parse(bullcheckMetaData.metadata);
    let myObjecty = {};
    Object.keys(convertedToArray).forEach((key) => {
      if (key != "attributes") {
        myObjecty[key] = convertedToArray[key];
      } else if (key == "attributes") {
        let anotherObject = [];
        const isArrayObject = convertedToArray[key];
        isArrayObject.forEach((elem) => {
          let anotherObjectTrait = {};
          if (
            elem.trait_type.trim() != "Bull Type" &&
            elem.trait_type.trim() != "Locked" &&
            elem.trait_type.trim() != "State"
          ) {
            Object.keys(elem).forEach((keyExtra) => {
              anotherObjectTrait[keyExtra] = elem[keyExtra];
            });

            anotherObject.push(anotherObjectTrait);
          }
        });
        anotherObject.push({
          trait_type: "Bull Type",
          value: data.fullDocument.bearType,
        });
        if (
          data.fullDocument.bearType == "Fighter Bull" &&
          data.fullDocument.missionState == "in training"
        ) {
          anotherObject.push({
            trait_type: "Locked",
            value: "Yes",
          });
        } else if (
          data.fullDocument.bearType == "Fighter Bull" &&
          data.fullDocument.missionState == "in battle"
        ) {
          anotherObject.push({
            trait_type: "Locked",
            value: "Yes",
          });
        } else if (data.fullDocument.bearType == "Hostage Bull") {
          anotherObject.push({
            trait_type: "Locked",
            value: "Yes",
          });
        } else {
          anotherObject.push({
            trait_type: "Locked",
            value: data.fullDocument.lockedState == true ? "Yes" : "No",
          });
        }
        anotherObject.push({
          trait_type: "State",
          value: data.fullDocument.missionState,
        });
        myObjecty["attributes"] = anotherObject;
      }
    });
    const updateMata = await BullMetaModel.updateOne(
      { name: data.fullDocument.tokenId },
      { $set: { metadata: JSON.stringify(myObjecty) } }
    );
    /*
    const updatePreMata = await PreMetadataModel.updateOne(
      { name: data.fullDocument.tokenId },
      { $set: { metadata: JSON.stringify(myObjecty) } }
    );
    */
  }

  let bull_PrecheckMetaData = await bullPreMetadataModel.findOne({
    name: data.fullDocument.tokenId,
  });
  if (bull_PrecheckMetaData) {
    const convertedToArray = JSON.parse(bull_PrecheckMetaData.metadata);
    let myObjecty = {};
    Object.keys(convertedToArray).forEach((key) => {
      if (
        data.fullDocument.bearType == "Fighter Bull" &&
        key == "description"
      ) {
        myObjecty["description"] = "Grr, I'm a bull!";
      } else if (
        data.fullDocument.bearType == "Noobie Bull" &&
        key == "description"
      ) {
        myObjecty["description"] = "Grr, I'm a bull!";
      } else if (
        data.fullDocument.bearType == "Fighter Bull" &&
        key == "image"
      ) {
        myObjecty["image"] =
          "https://bafkreihobu4asz7w7jnmtqid6pg474ll5izyajedow6awnq5ubpkgk3qze.ipfs.nftstorage.link/";
      } else if (
        data.fullDocument.bearType == "Noobie Bull" &&
        key == "image"
      ) {
        myObjecty["image"] =
          "https://bafkreiehkmfl3u4xxx7wahodr6cfq7dlfdm5apd2jak7k7w4jykuf76hwe.ipfs.nftstorage.link/";
      } else if (key == "attributes") {
        let anotherObject = [];
        const isArrayObject = convertedToArray[key];
        isArrayObject.forEach((elem) => {
          let anotherObjectTrait = {};
          if (
            elem.trait_type.trim() != "Bull Type" &&
            elem.trait_type.trim() != "Locked" &&
            elem.trait_type.trim() != "State"
          ) {
            Object.keys(elem).forEach((keyExtra) => {
              anotherObjectTrait[keyExtra] = elem[keyExtra];
            });

            anotherObject.push(anotherObjectTrait);
          }
        });
        anotherObject.push({
          trait_type: "Bull Type",
          value: data.fullDocument.bearType,
        });
        if (
          data.fullDocument.bearType == "Fighter bull" &&
          data.fullDocument.missionState == "in training"
        ) {
          anotherObject.push({
            trait_type: "Locked",
            value: "Yes",
          });
        } else if (
          data.fullDocument.bearType == "Fighter Bull" &&
          data.fullDocument.missionState == "in battle"
        ) {
          anotherObject.push({
            trait_type: "Locked",
            value: "Yes",
          });
        } else if (data.fullDocument.bearType == "Hostage Bull") {
          anotherObject.push({
            trait_type: "Locked",
            value: "Yes",
          });
        } else {
          anotherObject.push({
            trait_type: "Locked",
            value: data.fullDocument.lockedState == true ? "Yes" : "No",
          });
        }
        anotherObject.push({
          trait_type: "State",
          value: "",
        });
        myObjecty["attributes"] = anotherObject;
      } else {
        myObjecty[key] = convertedToArray[key];
      }
    });
    console.log("myObjecty:=", JSON.stringify(myObjecty));
    const updatePreMata = await bullPreMetadataModel.updateOne(
      { name: data.fullDocument.tokenId },
      { $set: { metadata: JSON.stringify(myObjecty) } },
      { new: true, runValidators: true }
    );
    console.log("updatePreMata:=", updatePreMata);
  }
  try {
    const api_res = await axios.post(
      `https://testnets-api.opensea.io/api/v2/chain/goerli/contract/${BullContractAddress}/nfts/${data.fullDocument.tokenId}/refresh`
    );
  } catch (error) {
    console.log("metaData refresh:=" + error.message);
  }
});
