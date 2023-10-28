const jwt = require("jsonwebtoken");
const Investor = require("../models/investors.js");
const Admin = require("../models/admins.js");

const auth = async (req, res, next) => {
    try {
        const token = req.headers.token;
        const verifyToken = jwt.verify(token,process.env.SECRET_KEY);

        const rootUser = await Investor.findOne({_id:verifyToken._id})

        const admin = await Admin.findOne({_id:verifyToken._id})

    if(!rootUser && !admin){
            throw new Error("Investor Not Found.");
        }

        req.token = token;
        req.rootUser = rootUser;

        next();

    } catch (error) {
        res.status(401).send("Unauthorized : No token provided");
        console.log(error);
    }
};

module.exports = auth;