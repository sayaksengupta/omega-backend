require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const corsOptions = {
  origin: true, //included origin as true
  credentials: true, //included credentials as true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
require("./routes/startup/routes")(app);
const port = process.env.PORT || 8080;
require("./db/conn");
const connection = require("./db/conn");
const cron = require("node-cron");
const moment = require("moment");
const Advisor = require("./models/advisors");


connection();

// CRON job to run every day at midnight UTC
cron.schedule("0 0 * * *", async () => {
  try {
    // Get the current UTC time
    const currentUTC = moment.utc();

    // Find advisors with expired campaigns
    const advisorsWithExpiredCampaigns = await Advisor.find({
      "campaign.expiresAt": { $lte: currentUTC },
    });

    // Delete the expired campaigns from each advisor
    for (const advisor of advisorsWithExpiredCampaigns) {
      advisor.campaign = undefined;
      await advisor.save();
    }

    console.log("CRON job executed successfully!");
  } catch (err) {
    console.error("Error in CRON job:", err);
  }
});

app.listen(port, () => {
    console.log(`Listening to port ${port}`);
});