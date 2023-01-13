const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userOTP = new Schema({
  email: {
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
