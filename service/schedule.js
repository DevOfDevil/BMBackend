const Schedule = require("../models/Schedule");

const getScheduleBy = async (payload) => {
  try {
    const post = await User.findOne(payload);
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
    await User.updateOne({ _id: userID }, { ...payload, updated: Date.now() });
    return User.findOne({ _id: userID });
  } catch (error) {
    console.log(error);
    return null;
  }
};

const deleteSchedule = async (userId) => {
  try {
    const post = await User.findOne({ _id: userId });
    post.deleted = true;
    await post.save();
    return post;
    // res.status(204).send();
  } catch (error) {
    console.log(error);
    return null;
  }
};

const getAllSchedule = async () => {
  try {
    const AllSchedule = await Schedule.find();
    return AllSchedule;
  } catch (error) {
    console.error("Error fetching user:", error.message);
    return null;
  }
};

module.exports = {
  getScheduleBy,
  deleteSchedule,
  addSchedule,
  updateSchedule,
  getAllSchedule,
};