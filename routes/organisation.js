const express = require("express");
const router = express.Router();
const Organisation = require("../models/organisations");
const bcrypt = require("bcrypt");
const organisationAuth = require("../middleware/organisationAuth");
const Advisor = require("../models/advisors");

router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, cpassword } = req.body;

    if (!name || !email || !password || !cpassword) {
      return res.status(422).json({
        message: "Please fill all the fields !",
        success: false,
      });
    }

    // Check if the email is already registered
    const existingEmail = await Organisation.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    // Check if the phone number is already registered
    const existingPhone = await Organisation.findOne({ phone });
    if (existingPhone) {
      return res
        .status(400)
        .json({ error: "Phone number is already registered." });
    }

    if (password !== cpassword) {
      return res.status(400).json({ message: "Passwords are not matching !" });
    }

    // Create a new organisation instance
    const organisation = new Organisation({
      name,
      email,
      phone,
      password,
      cpassword,
    });

    const token = await organisation.generateAuthToken();

    // Save the organisation to the database
    await organisation.save();

    res.status(201).json({
      message: "Registration successful.",
      token,
      organisation: organisation,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred during registration.",
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

    const organisationByEmail = await Organisation.findOne({ email: logEmail });

    if (organisationByEmail) {
      const passCheck = await bcrypt.compare(
        logPass,
        organisationByEmail.password
      );
      const token = await organisationByEmail.generateAuthToken();

      if (passCheck) {
        res.status(200).json({
          message: "Advisor Logged In Successfully !",
          token: token,
          success: true,
          organisation: {
            _id: organisationByEmail._id,
            name: organisationByEmail.name,
            email: organisationByEmail.email,
            phone: organisationByEmail.phone,
            address: organisationByEmail.address,
            country: organisationByEmail.country,
            city: organisationByEmail.city,
            portfolio: organisationByEmail.portfolio,
            profileImg: organisationByEmail.profileImg,
            coverImg: organisationByEmail.coverImg,
            bio: organisationByEmail.bio,
            address: organisationByEmail.address,
            premium: organisationByEmail.premium,
            type: organisationByEmail.type,
            licenseNumber: organisationByEmail.licenseNumber,
            packages: organisationByEmail.packages,
            members: organisationByEmail.members,
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

router.put("/update-organisation", organisationAuth, async (req, res) => {
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
  ];
  const isValidUpdate = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidUpdate) {
    return res.status(400).json({ error: "Invalid updates!" });
  }

  try {
    const organisation = await Organisation.findByIdAndUpdate(
      userId,
      req.body,
      { new: true }
    );

    if (!organisation) {
      return res.status(404).json({ error: "Organization not found." });
    }

    res.json({ message: "Organization updated successfully.", organisation });
  } catch (error) {
    res.status(500).json({ error: "An error occurred during the update." });
  }
});

router.get("/get-organisation", organisationAuth, async (req, res) => {
  const userId = req.rootUser._id;
  try {
    const user = await Organisation.findById(userId).select(
      "-password -cpassword -active -verified -premium"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/toggle-member-verified/:memberId", async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const organisation = await Organisation.findOne({
      "members._id": memberId,
    });

    if (!organisation) {
      return res
        .status(404)
        .json({ error: "Organization or member not found" });
    }

    const member = organisation.members.find(
      (m) => m._id.toString() === memberId
    );

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    if (member.verified === 0) {
      return res
        .status(400)
        .json({ error: "Cannot toggle the status of an unverified member" });
    }

    member.verified = member.verified === 1 ? 2 : 1;

    await organisation.save();

    res.json({ message: "Member verification status toggled successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to toggle member verification status" });
  }
});

// Add Package
router.post("/add-member-package", organisationAuth, async (req, res) => {
  const { memberId, title, timeframe, price, description, coverImg } = req.body;

  try {
    // Find the organization by ID
    const organisation = await Organisation.findById(req.rootUser._id);

    if (!organisation) {
      return res.status(404).json({ error: "Organization not found." });
    }

    // Find the member by ID within the organization
    const member = organisation.members.find(
      (mem) => mem._id.toString() === memberId
    );

    if (!member) {
      return res.status(404).json({ error: "Member not found." });
    }

    // Check if the package with the same title already exists for the member
    const existingPackage = member.packages.find((pkg) => pkg.title === title);

    if (existingPackage) {
      return res
        .status(400)
        .json({
          error: "Package with the same title already exists for this member.",
        });
    }

    // Create a new package
    const newPackage = {
      title,
      timeframe,
      price,
      description,
      coverImg,
    };

    // Add the package to the member's packages array
    member.packages.push(newPackage);

    // Save the updated organization
    await organisation.save();

    res
      .status(201)
      .json({ message: "Package added successfully.", organisation });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while adding the package." });
  }
});

router.put("/edit-package/:packageId", organisationAuth, async (req, res) => {
  const { title, timeframe, price, description, coverImg } = req.body;

  try {
    // Find the organisation by ID
    const organisation = await Organisation.findById(req.rootUser._id);

    if (!organisation) {
      return res.status(404).json({ error: "Organisation not found." });
    }

    // Find the index of the package to be edited
    const packageIndex = organisation.packages.findIndex(
      (pkg) => pkg._id.toString() === req.params.packageId
    );

    if (packageIndex === -1) {
      return res.status(404).json({ error: "Package not found." });
    }

    // Update the package properties if provided in the request body
    if (title) {
      organisation.packages[packageIndex].title = title;
    }
    if (timeframe) {
      organisation.packages[packageIndex].timeframe = timeframe;
    }
    if (price) {
      organisation.packages[packageIndex].price = price;
    }
    if (description) {
      organisation.packages[packageIndex].description = description;
    }
    if (coverImg) {
      organisation.packages[packageIndex].coverImg = coverImg;
    }

    // Save the updated organisation
    await organisation.save();

    res.json({ message: "Package updated successfully.", organisation });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while updating the package." });
  }
});

router.post("/add-member/:id", async (req, res) => {
  const { name, email, phone, role } = req.body;

  if (!name || !email || !phone) {
    return res.status(422).json({
      message: "Please fill in all the fields !",
      success: false,
    });
  }

  try {
    // Find the organization by ID
    const organization = await Organisation.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({ error: "Organization not found." });
    }

    // Check for duplicate phone or email
    const duplicateMember = organization.members.find(
      (member) => member.phone === phone || member.email === email
    );

    if (duplicateMember) {
      return res.status(400).json({ error: "Duplicate phone or email found." });
    }

    // Create a new member object
    const member = {
      name,
      email,
      phone,
      role,
    };

    const password = await bcrypt.hash(phone, 10);
    const cpassword = await bcrypt.hash(phone, 10);

    const advisor = new Advisor({
      name: name,
      email: email,
      password,
      cpassword,
      phone: phone,
      organisation: organization.name,
    });

    // Save the advisor to the database
    const AdvisorAdded = await advisor.save();

    if (AdvisorAdded) {
      // Add the member to the organization's members array
      organization.members.push(member);

      // Save the updated organization
      const newMember = await organization.save();

      console.log(`Advisor --> ${AdvisorAdded}`);

      if (newMember) {
        res
          .status(200)
          .json({ message: "Member added successfully.", organization });
      }
    }
  } catch (error) {
    res.status(500).json({
      error: `An error occurred while adding the member. --> ${error}`,
    });
  }
});

router.get("/get-member/:memberId", organisationAuth, async (req, res) => {
  try {
    // Find the organization by ID
    const organization = req.rootUser;

    if (!organization) {
      return res.status(404).json({ error: "Organization not found." });
    }

    // Find the index of the member to be deleted
    const memberIndex = organization.members.findIndex(
      (member) => member._id.toString() === req.params.memberId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ error: "Member not found." });
    }

    const memberFound = organization.members[memberIndex];

    res.json({ message: "Member fetched successfully.", member: memberFound });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while fetching the member." });
  }
});

router.put("/:id/edit-member/:memberId", async (req, res) => {
  const { name, email, phone, doj, role } = req.body;

  try {
    // Find the organization by ID
    const organization = await Organisation.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({ message: "Organization not found." });
    }

    // Find the index of the member to be edited
    const memberIndex = organization.members.findIndex(
      (member) => member._id.toString() === req.params.memberId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ message: "Member not found." });
    }

    // Update the member properties if provided in the request body
    if (name) {
      organization.members[memberIndex].name = name;
    }
    if (email) {
      organization.members[memberIndex].email = email;
    }
    if (phone) {
      organization.members[memberIndex].phone = phone;
    }
    if (doj) {
      organization.members[memberIndex].doj = new Date(doj);
    }
    if (role) {
      organization.members[memberIndex].role = role;
    }

    // Save the updated organization
    await organization.save();

    res.json({ message: "Member updated successfully.", organization });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while updating the member." });
  }
});

router.delete("/:id/delete-member/:memberId", async (req, res) => {
  try {
    // Find the organization by ID
    const organization = await Organisation.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({ error: "Organization not found." });
    }

    // Find the index of the member to be deleted
    const memberIndex = organization.members.findIndex(
      (member) => member._id.toString() === req.params.memberId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ error: "Member not found." });
    }

    // Remove the member from the organization's members array
    organization.members.splice(memberIndex, 1);

    // Save the updated organization
    await organization.save();

    res.json({ message: "Member deleted successfully.", organization });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while deleting the member." });
  }
});

router.post("/bulk-add-members/:id", async (req, res) => {
  const { members } = req.body;

  try {
    // Find the organization by ID
    const organization = await Organisation.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({ error: "Organization not found." });
    }

    // Validate and process each member in the array
    const processedMembers = [];

    for (const member of members) {
      const { name, email, phone } = member;

      // Check for duplicate phone or email
      const duplicateMember = organization.members.find(
        (m) => m.phone === phone || m.email === email
      );

      if (duplicateMember) {
        continue; // Skip adding the member if duplicate phone or email found
      }

      // Create a new member object
      const newMember = {
        name,
        email,
        phone,
        doj: new Date(),
      };

      // Add the member to the organization's members array
      organization.members.push(newMember);

      processedMembers.push(newMember);
    }

    // Save the updated organization
    await organization.save();

    res.json({
      message: "Members added successfully.",
      organization,
      members: processedMembers,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while adding the members." });
  }
});

router.get("/logout", organisationAuth, async (req, res) => {
  try {
    res.status(200).send({ message: "logged out successfully!" });
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
