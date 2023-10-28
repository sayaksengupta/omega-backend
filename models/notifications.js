const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const notificationSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    unique: true
  },
  date : Date,
  type : String,
  description : String,
  image: String,
  attachment: String,
  active : {
    type : Number,
    default: 0
  }
});

const Notification = mongoose.model("NOTIFICATIONS", notificationSchema);
module.exports = Notification;