const mongoose = require("mongoose");

const DB = process.env.MONGO_URI;

module.exports = async function connection (){
    try{
      const connectionParams = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      };
      await mongoose.connect(DB,connectionParams).then(() => {
        console.log("Connection Successful.");
      })
    }catch(e){
      console.log("Connection UnSuccessful.");
      console.log(e);
    }
  }