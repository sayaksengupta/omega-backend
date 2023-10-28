const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const transactionSchema = new mongoose.Schema({
    payerId: {
        type: mongoose.Types.ObjectId
    },
    payerName: {
      type: String,
      trim: true,
    },
    payerType: {
      type: String,
      trim: true,
    },
    status: {
      type: Number
    },
    amount: {
        type: Number
    },
    commistion: {
        type: Number
    },
    txnId : {
        type: String
    },
    mode: {
        type: String
    }
  }, {timestamps : true});

const Transaction = mongoose.model("TRANSACTIONS", transactionSchema);
module.exports = Transaction;