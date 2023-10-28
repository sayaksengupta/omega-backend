const jwt = require("jsonwebtoken");
const Advisor = require("../models/advisors.js");
const Admin = require("../models/admins.js");
const Organisation = require("../models/organisations.js");

const auth = async (req, res, next) => {
  try {
    const token = req.headers.token;
    const verifyToken = jwt.verify(token, process.env.SECRET_KEY);

    const rootUser = await Advisor.findOne({ _id: verifyToken._id });

    const rootMember = await Organisation.findOne({
      "members._id": verifyToken._id,
    });

    const admin = await Admin.findOne({ _id: verifyToken._id });

    if (!rootUser && !admin && !rootMember) {
      throw new Error("Advisor Not Found.");
    }

    req.token = token;
    req.rootUser = rootUser ? rootUser : rootMember;

    next();
  } catch (error) {
    res.status(401).send("Unauthorized : No token provided");
    console.log(error);
  }
};

module.exports = auth;
