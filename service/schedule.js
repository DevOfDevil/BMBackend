const Schedule = require("../models/Schedule");

const getScheduleBy = async (payload) => {
  try {
    const post = await Schedule.findOne(payload);
    return post;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const addSchedule = async (payload) => {
  try {
    const post = new Schedule({
      Day: payload.Day,
      Time: payload.Time,
      Title: payload.Title,
    });
    await post.save();

    //return post;
    return true;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const updateSchedule = async (userID, payload, files = null) => {
  try {
    await Schedule.updateOne(
      { _id: userID },
      { ...payload, updated: Date.now() }
    );
    return Schedule.findOne({ _id: userID });
  } catch (error) {
    console.log(error);
    return null;
  }
};

const getAllSchedule = async () => {
  try {
    const AllSchedule = await Schedule.find({ isDeleted: false });
    return AllSchedule;
  } catch (error) {
    console.error("Error fetching user:", error.message);
    return null;
  }
};

module.exports = {
  getScheduleBy,
  addSchedule,
  updateSchedule,
  getAllSchedule,
};
