const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
   coupon: String,
   discount: Number,
   active: {
    type: Boolean,
    default: false
   }
}, {timestamps: true})


const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;