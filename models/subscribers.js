const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const subscriberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  type: String
  }, {timestamps : true});

const Subscriber = mongoose.model("SUBSCRIBERS", subscriberSchema);
module.exports = Subscriber;