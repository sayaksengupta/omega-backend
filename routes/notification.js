const express = require("express");
const Notification = require("../models/notifications");
const router = express.Router();


router.get("/", (req, res) => {
  res.json({ message: "This is the notification api" });
});


router.post('/add-notification', async (req, res) => {
    try {
      const { name, date, description, type, attachment, image } = req.body;

    if(!name || !date || !description){
        return res.status(422).json({
            message : "Please fill in all the fields !",
            success : false
        })
      }

      const notification = new Notification({
        name,
        date,
        type,
        attachment,
        image,
        description
      });
      await notification.save();
      res.status(201).json({ message: 'Notification added successfully' });
    } catch (error) {
        console.log(error);
      res.status(500).json({ message: 'Failed to add the notification' });
    }
  });

  router.get('/get-all-notifications', async (req, res) => {
    try {
      const notifications = await Notification.find();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });


  router.get('/get-notifications/:type', async (req, res) => {
    try {
      const {type} = req.params;
      const notifications = await Notification.find({type});
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  router.put('/toggle-status/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await Notification.findById(id);
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      notification.active = !notification.active;
      await notification.save();
      res.json({ message: 'Notification status updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update notification status' });
    }
  });

  router.delete('/delete-notification/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await Notification.findById(id);
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      await notification.remove();
      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete notification' });
    }
  });

module.exports = router;