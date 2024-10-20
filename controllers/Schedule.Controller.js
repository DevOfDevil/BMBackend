// controllers/userController.js
const ScheduleServices = require("../service/schedule");

const classtimes = async (req, res) => {
  try {
    const Schedule = await ScheduleServices.getAllSchedule();
    // Exclude _id and timestamps (createdAt, updatedAt) from each schedule item
    const filteredSchedule = Schedule.map((item) => {
      const { _id, createdAt, updatedAt, ...rest } = item.toObject(); // convert to plain object and destructure
      return rest;
    });

    return res.send({ status: true, Schedule: filteredSchedule });
  } catch (error) {
    console.error("Error creating user:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};

module.exports = {
  classtimes,
};
