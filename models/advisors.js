const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const packageSchema = new mongoose.Schema({
    title : String,
    timeframe : String,
    price : {
        type : Number,
        default : 0
    },
    description : String,
    coverImg : String
})

const advisorSchema = new mongoose.Schema({
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
  organisation: String,
  portfolio: String,
  profileImg: String,
  coverImg: String,
  bio: String,
  address: String,
  licenseNumber: String,
  city: String,
  state: String,
  country: String,
  zipcode: String,
  wallet: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  premium: {
    type: Boolean,
    default: false
  },
  membership:{
    _id : {type: mongoose.Types.ObjectId, ref: 'Membership'},
    expiresAt: Date
  },
  video: {
    type: String
  },
  type: String,
  active : {
    type: Boolean,
    default: false
  },
  packages: [{
    type: mongoose.Types.ObjectId,
    ref: 'Package'
  }],
  campaign: {
   _id: mongoose.Types.ObjectId,
   expiresAt: Date
  }
});

// Hashing Passwords
advisorSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10);
      this.cpassword = await bcrypt.hash(this.cpassword, 10);
      console.log(this.password);
    }
    next();
  });


// Generating Auth Token
advisorSchema.methods.generateAuthToken = async function () {
  try {
    const expirationTime = Math.floor(Date.now() / 1000) + (60 * 60 * 5);
    let token = jwt.sign({ _id: this._id, exp: expirationTime }, process.env.SECRET_KEY);
    return token;
  } catch (e) {
    console.log(`Failed to generate token --> ${e}`);
  }
};



const Advisor = mongoose.model("Advisor", advisorSchema);
module.exports = Advisor;