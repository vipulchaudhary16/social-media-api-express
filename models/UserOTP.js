const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userOTP = new Schema({
  userId: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
  },
});

module.exports = mongoose.model("UserOTP", userOTP);
