// controllers/userController.js
const mongoose = require("mongoose");
const UserServices = require("../service/user");
const RoleMdl = require("../models/Role");
const DeviceMdl = require("../models/userDevice");
const CategoryMdl = require("../models/Category");
const CategoryPurchasedMdl = require("../models/CategoryPurchased");
const ReportDetailsMdl = require("../models/ReportDetails");
const ReportingMdl = require("../models/Reporting");
const ChapterMdl = require("../models/Chapter");
const QuestionsMdl = require("../models/Questions");
const OptionMdl = require("../models/Options");

var jwt = require("jsonwebtoken");
const config = require("../config/Config");
const { count } = require("../models/User");
const { ObjectId } = mongoose.Types;

function isValidObjectId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

const getMySummary = async (req, res) => {
  try {
    const mySummary = await ReportingMdl.find({
      UserID: req.userDetails._id,
    })
      .populate({
        path: "QuizID",
        match: {
          Category: { $in: req.userDetails.categoryIDs },
          isDeleted: false,
        },
        select: { Title: 1, _id: 0 },
        populate: {
          path: "Category",
          match: {
            _id: { $in: req.userDetails.categoryIDs },
            isDeleted: false,
          },
          select: { name: 1, _id: 0 },
        },
      })
      .populate({
        path: "ChapterID",
        select: { Title: 1, _id: 0 },
      })
      .select({
        TestType: 1,
        status: 1,
        StartDate: 1,
        EndDate: 1,
        completeTime: 1,
        _id: 1,
      });
    return res.send({
      status: true,
      mySummary: mySummary,
    });
  } catch (error) {
    console.error("Error getting summary:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
const getDetailReport = async (req, res) => {
  try {
    const { ReportID } = req.params;
    if (!isValidObjectId(ReportID)) {
      return res.send({
        status: false,
        message: "Id is not Valid!",
      });
    }

    const myReportSummary = await ReportingMdl.findOne({
      UserID: req.userDetails._id,
      _id: ReportID,
    }).select({
      status: 1,
      TestType: 1,
      StartDate: 1,
      completeTime: 1,
      ResultPercentage: 1,
    });

    if (!myReportSummary) {
      return res.send({
        status: false,
        message: "This is Not Your Report!",
      });
    }
    const mySummary = await ReportDetailsMdl.find({
      ReportingID: ReportID,
    })
      .populate({
        path: "QuestionID",
        select: { Question: 1, _id: 0 },
      })
      .populate({
        path: "SelectedOption",
        select: { Option: 1, _id: 0 },
      })
      .populate({
        path: "CorrectOption",
        select: { Option: 1, _id: 0 },
      })
      .select({ QuestionID: 1, SelectedOption: 1, CorrectOption: 1, _id: 0 });
    return res.send({
      status: true,
      mySummary: mySummary,
      myReportSummary: myReportSummary,
    });
  } catch (error) {
    console.error("Error getting summary:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
module.exports = {
  getMySummary,
  getDetailReport,
};
