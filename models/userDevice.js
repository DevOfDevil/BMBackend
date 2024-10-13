const mongoose = require('mongoose');

const userDeviceSchema = new mongoose.Schema({
  device_name: { type: String, required: true, maxlength: 200 },
  device_mac: { type: String, required: true, maxlength: 200 },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  is_activated: { type: Boolean, required: true }
});

const UserDevice = mongoose.model('UserDevice', userDeviceSchema);

module.exports = UserDevice;
