const express = require("express");
const router = express.Router();
const Advisor = require("../models/advisors");
const bcrypt = require("bcrypt");
const advisorAuth = require("../middleware/advisorAuth");
const Package = require("../models/packages");
const { default: mongoose } = require("mongoose");
const Membership = require("../models/memberships");
const Campaign = require("../models/campaigns");

// Registration Advisor
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, cpassword, phone } = req.body;

    if (!name || !email || !password || !cpassword) {
      return res.status(422).json({
        message: "Please fill all the fields !",
        success: false,
      });
    }

    // Check if the email is already registered
    const existingEmail = await Advisor.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Check if the phone number is already registered
    const existingPhone = await Advisor.findOne({ phone });
    if (existingPhone) {
      return res
        .status(400)
        .json({ message: "Phone number is already registered." });
    }

    if (password !== cpassword) {
      return res.status(400).json({ message: "Passwords are not matching !" });
    }

    // Create a new advisor instance
    const advisor = new Advisor({
      name,
      email,
      password,
      cpassword,
      phone,
    });

    // Save the advisor to the database
    await advisor.save();

    const token = await advisor.generateAuthToken();

    res.status(201).json({
      message: "Registration successful.",
      token: token,
      advisor: advisor,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      error: "An error occurred during registration.",
      success: false,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const logEmail = req.body.email;
    const logPass = req.body.password;

    if (!logEmail || !logPass) {
      return res
        .status(422)
        .json({ message: "Please fill all the fields.", success: false });
    }

    const advisorByEmail = await Advisor.findOne({ email: logEmail });

    if (advisorByEmail) {
      const passCheck = await bcrypt.compare(logPass, advisorByEmail.password);
      const token = await advisorByEmail.generateAuthToken();

      if (passCheck) {
        res.status(200).json({
          message: "Advisor Logged In Successfully !",
          token: token,
          success: true,
          advisor: {
            _id: advisorByEmail._id,
            name: advisorByEmail.name,
            email: advisorByEmail.email,
            phone: advisorByEmail.phone,
            address: advisorByEmail.address,
            country: advisorByEmail.country,
            city: advisorByEmail.city,
            portfolio: advisorByEmail.portfolio,
            profileImg: advisorByEmail.profileImg,
            coverImg: advisorByEmail.coverImg,
            bio: advisorByEmail.bio,
            address: advisorByEmail.address,
            verified: advisorByEmail.verified,
            premium: advisorByEmail.premium,
            type: advisorByEmail.type,
            licenseNumber: advisorByEmail.licenseNumber,
            packages: advisorByEmail.packages,
          },
        });
      } else {
        res
          .status(400)
          .json({ message: "Invalid login credentials", success: false });
      }
    } else {
      res
        .status(400)
        .json({ message: "Invalid login credentials", success: false });
    }
  } catch (message) {
    res.status(500).json({
      message: `Invalid login credentials --> ${message}`,
      success: false,
    });
  }
});

router.put("/update-advisor", advisorAuth, async (req, res) => {
  const userId = req.rootUser._id;
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    "name",
    "email",
    "phone",
    "portfolio",
    "profileImg",
    "coverImg",
    "bio",
    "address",
    "licenseNumber",
    "city",
    "state",
    "country",
    "type",
    "zipcode",
  ];

  // Find the fields that are not valid updates
  const invalidUpdates = updates.filter(
    (update) => !allowedUpdates.includes(update)
  );

  if (invalidUpdates.length > 0) {
    console.log("Invalid updates: ", invalidUpdates);
    return res.status(400).json({ message: "Invalid updates!" });
  }

  try {
    const advisor = await Advisor.findByIdAndUpdate(userId, req.body, {
      new: true,
    });

    if (!advisor) {
      return res.status(404).json({ message: "Advisor not found." });
    }

    res.json({ message: "Advisor updated successfully.", advisor });
  } catch (error) {
    res.status(500).json({ error: "An error occurred during the update." });
  }
});

router.get("/get-advisor", advisorAuth, async (req, res) => {
  const userId = req.rootUser._id;
  try {
    // Find the advisor by ID and populate the 'packages' field with complete package data
    const user = await Advisor.findById(userId)
      .select("-password -cpassword -active -verified -premium")
      .populate("packages", "-createdAt -updatedAt -__v"); // Exclude any unnecessary fields from packages

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: `Internal server error --> ${error}` });
  }
});

router.post("/add-package", advisorAuth, async (req, res) => {
  const { title, timeframe, price, description, coverImg } = req.body;

  try {
    const UserID = new mongoose.Types.ObjectId(req.rootUser._id);
    // Create a new package using the Package model
    const newPackage = new Package({
      user_id: UserID,
      title,
      timeframe,
      price,
      description,
      coverImg,
    });

    // Save the new package in the Package collection
    await newPackage.save();

    // Find the advisor by ID
    const advisor = await Advisor.findById(req.rootUser._id);

    if (!advisor) {
      return res.status(404).json({ error: "Advisor not found." });
    }

    // Add the reference of the new package to the advisor's packages array
    advisor.packages.push(newPackage._id);

    // Save the updated advisor with the reference to the new package
    await advisor.save();

    res.status(201).json({ message: "Package added successfully.", advisor });
  } catch (error) {
    res.status(500).json({
      error: `An error occurred while adding the package. --> ${error}`,
    });
  }
});

router.put("/edit-package/:packageId", advisorAuth, async (req, res) => {
  const { title, timeframe, price, description, coverImg } = req.body;
  const packageId = req.params.packageId;

  try {
    const AdvisorFound = await Advisor.findById(req.rootUser._id);

    if (!AdvisorFound.packages.includes(packageId)) {
      return res.status(404).json({ error: "Package not found." });
    }
    // Find the package to be edited in the Package model
    const updatedPackage = await Package.findByIdAndUpdate(
      packageId,
      {
        $set: {
          title,
          timeframe,
          price,
          description,
          coverImg,
        },
      },
      { new: true } // Return the updated package after the update
    );

    if (!updatedPackage) {
      return res.status(404).json({ error: "Package not found." });
    }

    // Populate the packages data for the advisor
    const advisor = await Advisor.findById(req.rootUser._id).populate(
      "packages"
    );

    if (!advisor) {
      return res.status(404).json({ error: "Advisor not found." });
    }

    res.json({ message: "Package updated successfully.", advisor });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while updating the package." });
  }
});

router.delete("/delete-package/:packageId", advisorAuth, async (req, res) => {
  try {
    // Find the advisor by ID
    const advisor = await Advisor.findById(req.rootUser._id);

    if (!advisor) {
      return res.status(404).json({ error: "Advisor not found." });
    }

    // Find the index of the package to be deleted
    const packageIndex = advisor.packages.findIndex(
      (pkg) => pkg._id.toString() === req.params.packageId
    );

    if (packageIndex === -1) {
      return res.status(404).json({ error: "Package not found." });
    }

    // Remove the package from the advisor's packages array
    advisor.packages.splice(packageIndex, 1);

    // Save the updated advisor
    await advisor.save();

    res.json({ message: "Package deleted successfully.", advisor });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while deleting the package." });
  }
});

router.post("/verify-premium", advisorAuth, async (req, res) => {
  try {
    const { membershipId } = req.body;

    // Find the advisor by their ID (assuming the ID is sent as a header or part of the request)
    const advisorId = req.rootUser._id; // Replace with the advisor ID (from req.header or req.params)
    const advisor = await Advisor.findById(advisorId);

    if (!advisor) {
      return res.status(404).json({ error: "Advisor not found" });
    }

    if (advisor.membership.expiresAt) {
      return res
        .status(400)
        .json({ message: "You already have premium", success: false });
    }

    // Find the Membership document by the provided membershipId
    const membership = await Membership.findById(membershipId);

    if (!membership) {
      return res.status(404).json({ error: "Membership not found" });
    }

    // Set the expiresAt date based on the membership type and time
    const currentDate = new Date();
    let expiresAt = currentDate;

    if (membership.type === "yearly") {
      expiresAt.setFullYear(currentDate.getFullYear() + membership.time);
    } else if (membership.type === "monthly") {
      expiresAt.setMonth(currentDate.getMonth() + membership.time);
    } else if (membership.type === "weekly") {
      expiresAt.setDate(currentDate.getDate() + membership.time * 7);
    } else {
      // Default to one year if membership type is not recognized
      expiresAt.setFullYear(currentDate.getFullYear() + 1);
    }

    // Update the advisor's membership and premium fields
    advisor.membership = {
      _id: new mongoose.Types.ObjectId(membershipId),
      expiresAt,
    };
    advisor.premium = true;

    // Save the updated advisor
    await advisor.save();

    res.json(advisor);
  } catch (error) {
    res.status(500).json({ error: `Failed to verify premium --> ${error}` });
  }
});

// Add a campaign to the advisor model
router.post("/add-campaign/:id", advisorAuth, async (req, res) => {
  try {
    const advisorId = req.rootUser._id; // Access the authenticated advisor's ID from the middleware
    const campaignId = req.params.id;

    const CampaignFound = await Campaign.findById(campaignId);

    if (!CampaignFound) {
      return res.status(400).json({
        message: "Campaign not found !",
        success: false,
      });
    }

    const time = CampaignFound.time;
    const unit = CampaignFound.unit;

    // Find the advisor by their ID
    const advisor = await Advisor.findById(advisorId);
    if (!advisor) {
      return res.status(404).json({ error: "Advisor not found" });
    }

    // Update the advisor's campaign field with the new campaign ID
    advisor.campaign._id = campaignId;

    // Calculate the expiresAt based on the provided time and unit
    const currentUTC = new Date();
    let expiresAt = new Date();
    if (unit === "hour") {
      expiresAt.setHours(currentUTC.getHours() + time);
    } else if (unit === "day") {
      expiresAt.setDate(currentUTC.getDate() + time);
    } else if (unit === "month") {
      expiresAt.setMonth(currentUTC.getMonth() + time);
    } else {
      // Handle other units if needed
      throw new Error("Invalid unit provided");
    }

    advisor.campaign.expiresAt = expiresAt;
    await advisor.save();

    res
      .status(200)
      .json({ message: "Campaign added to the advisor successfully", advisor });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to add campaign to the advisor", err });
  }
});

router.get("/logout", advisorAuth, async (req, res) => {
  try {
    res.status(200).send({ message: "logged out successfully!" });
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
