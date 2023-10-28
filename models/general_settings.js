const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const generalSettingSchema = new mongoose.Schema({
    icon: {
      type: String,
      trim: true,
    },
    commission: {
      type: Number,
    }
  }, {timestamps : true});

const GeneralSettings = mongoose.model("GENERAL SETTINGS", generalSettingSchema);
module.exports = GeneralSettings;