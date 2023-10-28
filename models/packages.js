const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        ref: "Advisor"
    },
    investors: [{
        type: mongoose.Types.ObjectId,
        ref: "Investor"
    }],
    title : String,
    timeframe : String,
    price : {
        type : Number,
        default : 0
    },
    description : String,
    coverImg : String
}, {timestamps: true})


const Package = mongoose.model('Package', packageSchema);

module.exports = Package;