const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema({
   membership: String,
   type: String,
   time: Number,
   amount: Number,
   active: {
    type: Boolean,
    default: false
   }
}, {timestamps: true})


const Membership = mongoose.model('Membership', membershipSchema);

module.exports = Membership;