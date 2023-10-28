const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const investorSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid Email.");
      }
    },
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  cpassword: {
    type: String,
    required: true,
    trim: true,
  },
  phone : {
    type: String,
    required: true,
    trim: true,
    unique:true,
    minLength : 10
  },
  portfolio: String,
  profileImg: String,
  coverImg: String,
  bio: String,
  address: String,
  city: String,
  state: String,
  country: String,
  zipcode: String,
  wallet: {
    type: Number,
    default: 0
  },
  active : {
    type: Boolean,
    default: false
  },
  packages: [
    {
    type: mongoose.Types.ObjectId,
    ref: 'Package'
    }
]
});

// Hashing Passwords
investorSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10);
      this.cpassword = await bcrypt.hash(this.cpassword, 10);
      console.log(this.password);
    }
    next();
  });


// Generating Auth Token
investorSchema.methods.generateAuthToken = async function () {
  try {
    const expirationTime = Math.floor(Date.now() / 1000) + (60 * 60 * 5);
    let token = jwt.sign({ _id: this._id, exp: expirationTime }, process.env.SECRET_KEY);
    return token;
  } catch (e) {
    console.log(`Failed to generate token --> ${e}`);
  }
};



const Investor = mongoose.model("Investor", investorSchema);
module.exports = Investor;