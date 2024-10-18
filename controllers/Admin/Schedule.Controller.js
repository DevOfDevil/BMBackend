// controllers/userController.js
const ScheduleServices = require("../../service/schedule");

function isValidTime(time) {
  // Regular expression to match HH:MM format (24-hour format)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  // Test if the input matches the time format
  return timeRegex.test(time);
}

const listAll = async (req, res) => {
  try {
    const Schedule = await ScheduleServices.getAllSchedule();
    return res.send({ status: true, Schedule: Schedule });
  } catch (error) {
    console.error("Error creating user:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
/*
const addSchedule = async (req, res) => {
  try {
    const { day, time } = req.body;
    if (isValidTime(time)) {
      const Schedule = await ScheduleServices.addSchedule({
        Day: day,
        Time: time,
      });
      if (Schedule) {
        const Schedule = await ScheduleServices.getAllSchedule();
        return res.send({ status: true, Schedule: Schedule });
      } else {
        return res.send({ status: false, message: "Something went wrong!" });
      }
    } else {
      return res.send({
        status: false,
        message: "Time is not in proper format!",
      });
    }
  } catch (error) {
    console.error("Error creating user:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
*/
const addSchedule = async (req, res) => {
  try {
    const { Title, day, time } = req.body;

    const Schedule = await ScheduleServices.addSchedule({
      Day: day,
      Time: time,
      Title: Title,
    });
    if (Schedule) {
      const Schedule = await ScheduleServices.getAllSchedule();
      return res.send({ status: true, Schedule: Schedule });
    } else {
      return res.send({ status: false, message: "Something went wrong!" });
    }
  } catch (error) {
    console.error("Error creating user:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
module.exports = {
  listAll,
  addSchedule,
};
