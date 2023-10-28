const express = require("express");
const Advisor = require("../models/advisors");
const Investor = require("../models/investors");
const Organisation = require("../models/organisations");
const Subscriber = require("../models/subscribers");
const router = express.Router();


router.get("/", (req, res) => {
  res.json({ message: "This is the subscriber api" });
});

router.post('/add-subscriber', async (req, res) => {
    const { userId } = req.body;
  
    try {
      let user;
  
      // Find the user based on the provided userId
      const advisor = await Advisor.findById(userId);
      const investor = await Investor.findById(userId);
      const organisation = await Organisation.findById(userId);
        
      let type;

      if (advisor) {
        user = advisor;
        type = "advisor"
      } else if (investor) {
        user = investor;
        type = "investor"
      } else if (organisation) {
        user = organisation;
        type = "organisation"
      } else {
        return res.status(404).json({ message: 'User not found', success: false });
      }
  
      // Create a new subscriber document
      const subscriber = new Subscriber({
        user: user._id,
        email: user.email,
        type: type
      });
  
      // Save the subscriber to the database
      await subscriber.save();
  
      return res.status(200).json({ message: 'Subscriber added successfully', success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error', success: false });
    }
});

router.get('/get-all-subscribers', async (req, res) => {
    try {
      const subscribers = await Subscriber.find();
      const subscriberDetails = [];
  
      for (const subscriber of subscribers) {
        let user, type;
  
        if (subscriber.type === 'advisor') {
          user = await Advisor.findById(subscriber.user);
          type = "advisor"
        } else if (subscriber.type === 'organisation') {
          user = await Organisation.findById(subscriber.user);
          type = "organisation"
        } else if (subscriber.type === 'investor') {
          user = await Investor.findById(subscriber.user);
          type = "investor"
        }
  
        if (user) {
          const userDetails = {
            name: user.name,
            email: subscriber.email,
            phone: user.phone,
            type: type
          };
          subscriberDetails.push(userDetails);
        }
      }
  
      return res.status(200).json(subscriberDetails);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  router.delete('/delete-subscriber/:id', async (req, res) => {
    const subscriberId = req.params.id;
  
    try {
      // Find the subscriber based on the provided ID
      const subscriber = await Subscriber.findById(subscriberId);
  
      if (!subscriber) {
        return res.status(404).json({ message: 'Subscriber not found', success: false });
      }
  
      // Delete the subscriber
      await subscriber.remove();
  
      return res.status(200).json({ message: 'Subscriber deleted successfully', success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error', success: false });
    }
  });
  
  
  

module.exports = router;