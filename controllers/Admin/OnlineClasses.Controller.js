const path = require("path");
const fs = require("fs");
const OnlineclassMdl = require("../../models/Onlineclass");

const listAllClasses = async (req, res) => {
  try {
    const Onlineclass = await OnlineclassMdl.find({ isDeleted: false });
    return res.send({ status: true, Onlineclasses: Onlineclass });
  } catch (error) {
    console.error("Error getting Online class:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
const addClass = async (req, res) => {
  try {
    const { Title } = req.body;
    const ClassThumbnail = req.file;
    if (!ClassThumbnail) {
      return res.send({ status: false, message: "No Image uploaded" });
    }
    // Check valid file types (you can add more mimetypes if needed)
    const validMimeTypes = ["image/jpeg", "image/png"];
    if (!validMimeTypes.includes(ClassThumbnail.mimetype)) {
      // Remove temp file if invalid format
      fs.unlink(ClassThumbnail.path, (err) => {
        if (err) console.error("Error removing temp file:", err);
      });
      return res.send({ status: false, message: "Invalid file type" });
    }
    // Convert the file to Base64
    const fileData = fs.readFileSync(ClassThumbnail.path);
    const base64Image = fileData.toString("base64");
    const base64String = `data:${ClassThumbnail.mimetype};base64,${base64Image}`;

    // Remove temp file if there was an error moving it
    fs.unlink(ClassThumbnail.path, (unlinkErr) => {
      if (unlinkErr) console.error("Error removing temp file:", unlinkErr);
    });

    // Save the question
    const AddOnlineclass = new OnlineclassMdl({
      Title: Title,
      Thumbnail: base64String,
    });
    await AddOnlineclass.save();

    const Onlineclass = await OnlineclassMdl.find({ isDeleted: false });
    return res.send({ status: true, Onlineclasses: Onlineclass });
  } catch (error) {
    console.error("Error creating user:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
const getClassByID = async (req, res) => {
  try {
    const { classID } = req.params;
    const Onlineclass = await OnlineclassMdl.findOne({ _id: classID });
    return res.send({ status: true, Onlineclass: Onlineclass });
  } catch (error) {
    console.error("Error getting Class:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
const deleteClass = async (req, res) => {
  try {
    const { classID } = req.params;
    const Onlineclass = await OnlineclassMdl.findByIdAndUpdate(classID, {
      isDeleted: true,
      updated: Date.now(),
    });
    const Onlineclasses = await OnlineclassMdl.find({ isDeleted: false });
    return res.send({ status: true, Onlineclasses: Onlineclasses });
  } catch (error) {
    console.error("Error creating user:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
const updateClass = async (req, res) => {
  try {
    const { classID, Title } = req.body;
    const ClassThumbnail = req.file;
    if (ClassThumbnail) {
      // Check valid file types (you can add more mimetypes if needed)
      const validMimeTypes = ["image/jpeg", "image/png"];
      if (!validMimeTypes.includes(ClassThumbnail.mimetype)) {
        // Remove temp file if invalid format
        fs.unlink(ClassThumbnail.path, (err) => {
          if (err) console.error("Error removing temp file:", err);
        });
        return res.send({ status: false, message: "Invalid file type" });
      }
      // Convert the file to Base64
      const fileData = fs.readFileSync(ClassThumbnail.path);
      const base64Image = fileData.toString("base64");
      const base64String = `data:${ClassThumbnail.mimetype};base64,${base64Image}`;

      // Remove temp file if there was an error moving it
      fs.unlink(ClassThumbnail.path, (unlinkErr) => {
        if (unlinkErr) console.error("Error removing temp file:", unlinkErr);
      });

      // Save the question
      const AddOnlineclass = await OnlineclassMdl.findByIdAndUpdate(
        classID,
        { Title: Title, Thumbnail: base64String, updated: Date.now() },
        { new: true }
      );
      return res.send({ status: true, Onlineclass: AddOnlineclass });
    } else {
      // Save the question
      const AddOnlineclass = await OnlineclassMdl.findByIdAndUpdate(
        classID,
        { Title: Title, updated: Date.now() },
        { new: true }
      );
      return res.send({ status: true, Onlineclass: AddOnlineclass });
    }
  } catch (error) {
    console.error("Error creating user:", error.message);
    return res.send({ status: false, message: "Something went wrong!" });
  }
};
module.exports = {
  listAllClasses,
  addClass,
  getClassByID,
  deleteClass,
  updateClass,
};
