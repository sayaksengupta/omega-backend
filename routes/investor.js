const express = require('express');
const router = express.Router();
const Investor = require('../models/investors'); 
const bcrypt = require("bcrypt");
const investorAuth = require('../middleware/investorAuth');
const Package = require('../models/packages');

// Registration investor
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      cpassword,
      phone
    } = req.body;

    if(!name || !email || !password || !cpassword){
      return res.status(422).json({
        message: "Please fill all the fields !",
        success: false
      })
    }

    // Check if the email is already registered
    const existingEmail = await Investor.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // Check if the phone number is already registered
    const existingPhone = await Investor.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number is already registered.' });
    }

    if(password !== cpassword){
      return res.status(400).json({ message: 'Passwords are not matching !' });
    }

    // Create a new investor instance
    const investor = new Investor({
      name,
      email,
      password,
      cpassword,
      phone
    });

    // Save the investor to the database
    await investor.save();

    const token = await investor.generateAuthToken();

 

    res.status(201).json({ message: 'Registration successful.', token : token, investor: investor, success: true });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred during registration.', success: false });
  }
});

router.post("/login", async (req, res) => {
    try {
   
      const logEmail = req.body.email;
      const logPass = req.body.password;
   
      if ((!logEmail) || !logPass) {
        return res.status(422).json({ message: "Please fill all the fields.", success : false });
      }
   
      const investorByEmail = await Investor.findOne({email : logEmail});
   
   
   
   if(investorByEmail){
    const passCheck = await bcrypt.compare(logPass, investorByEmail.password);
    const token = await investorByEmail.generateAuthToken();
   
   
    if (passCheck) {
      res.status(200).json({   
        message: "investor Logged In Successfully !",
        token : token,
        success: true,
        investor : {
          _id : investorByEmail._id,
          name : investorByEmail.name,
          email : investorByEmail.email,
          phone : investorByEmail.phone,
          address : investorByEmail.address,
          country : investorByEmail.country,
          city : investorByEmail.city,
          profileImg : investorByEmail.profileImg,
          coverImg : investorByEmail.coverImg,
          address : investorByEmail.address,
          packages : investorByEmail.packages
        }
      });
    } else {
      res.status(400).json({ message: "Invalid login credentials", success : false });
    }
  } else {
    res.status(400).json({ message: "Invalid login credentials", success : false });
  }
    
   } catch (message) {
      res.status(500).json({ message: `Invalid login credentials --> ${message}`, success : false });
    }
});

router.put('/update-investor', investorAuth, async (req, res) => {
  const userId = req.rootUser._id;
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'phone', 'portfolio', 'profileImg', 'coverImg', 'bio', 'address', 'licenseNumber', 'city', 'state', 'country'];
  const isValidUpdate = updates.every(update => allowedUpdates.includes(update));

  if (!isValidUpdate) {
    return res.status(400).json({ message: 'Invalid updates!' });
  }

  try {
    const investor = await Investor.findByIdAndUpdate(userId, req.body, { new: true });

    if (!investor) {
      return res.status(404).json({ message: 'Investor not found.' });
    }

    res.json({ message: 'Investor updated successfully.', investor });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred during the update.' });
  }
});

router.get('/get-investor', investorAuth, async (req, res) => {
  const userId  = req.rootUser._id;
  try {
    const user = await Investor.findById(userId).select('-password -cpassword -active -verified -premium');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add Package
router.post('/add-package', investorAuth, async (req, res) => {
  const { packageId } = req.body;

  try {
    // Find the investor by ID
    const investor = await Investor.findById(req.rootUser._id);

    if (!investor) {
      return res.status(404).json({ error: 'Investor not found.' });
    }

    // Check if the package ID already exists in the investor's packages array
    if (investor.packages.includes(packageId)) {
      return res.status(400).json({ error: 'Package already exists in the investor\'s packages array.' });
    }

    // Add the package ID to the investor's packages array
    investor.packages.push(packageId);

    // Save the updated investor
    await investor.save();

    // Find the package by ID
    const package = await Package.findById(packageId);

    if (!package) {
      return res.status(404).json({ error: 'Package not found.' });
    }

    // Check if the investor ID already exists in the package's investors array
    if (package.investors.includes(investor._id)) {
      return res.status(400).json({ error: 'Investor already exists in the package\'s investors array.' });
    }

    // Add the investor ID to the package's investors array
    package.investors.push(investor._id);

    // Save the updated package
    await package.save();

    res.status(201).json({ message: 'Package added successfully.', investor });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while adding the package.' });
  }
});


router.put('/edit-package/:packageId', investorAuth, async (req, res) => {
  const { title, timeframe, price, description, coverImg } = req.body;

  try {
    // Find the investor by ID
    const investor = await Investor.findById(req.rootUser._id);

    if (!investor) {
      return res.status(404).json({ error: 'investor not found.' });
    }

    // Find the index of the package to be edited
    const packageIndex = investor.packages.findIndex(pkg => pkg._id.toString() === req.params.packageId);

    if (packageIndex === -1) {
      return res.status(404).json({ error: 'Package not found.' });
    }

    // Update the package properties if provided in the request body
    if (title) {
      investor.packages[packageIndex].title = title;
    }
    if (timeframe) {
      investor.packages[packageIndex].timeframe = timeframe;
    }
    if (price) {
      investor.packages[packageIndex].price = price;
    }
    if (description) {
      investor.packages[packageIndex].description = description;
    }
    if (coverImg) {
      investor.packages[packageIndex].coverImg = coverImg;
    }

    // Save the updated investor
    await investor.save();

    res.json({ message: 'Package updated successfully.', investor });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while updating the package.' });
  }
});



router.delete('/delete-package/:packageId', investorAuth, async (req, res) => {
  try {
    // Find the investor by ID
    const investor = await Investor.findById(req.rootUser._id);

    if (!investor) {
      return res.status(404).json({ error: 'investor not found.' });
    }

    // Find the index of the package to be deleted
    const packageIndex = investor.packages.findIndex(pkg => pkg._id.toString() === req.params.packageId);

    if (packageIndex === -1) {
      return res.status(404).json({ error: 'Package not found.' });
    }

    // Remove the package from the investor's packages array
    investor.packages.splice(packageIndex, 1);

    // Save the updated investor
    await investor.save();

    res.json({ message: 'Package deleted successfully.', investor });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while deleting the package.' });
  }
});

  
router.get("/logout", investorAuth, async (req, res) => {
    try {
      res.status(200).send({ message: "logged out successfully!" });
    } catch (e) {
      res.status(500).send(e);
    }
});

module.exports = router;
