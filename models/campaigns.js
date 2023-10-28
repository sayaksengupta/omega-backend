const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema({
    title : String,
    time: Number,
    unit: String,
    price : {
        type : Number,
        default : 0
    },
    description : String,
    image : String
}, {timestamps: true})


const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;