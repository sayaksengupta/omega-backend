const express = require("express");
const router = express.Router();
const Admin = require('../models/admins');
const bcrypt = require("bcrypt");
const adminAuth = require("../middleware/adminAuth");
const Advisor = require('../models/advisors');
const Organisation = require("../models/organisations");
const Investor = require("../models/investors");
const Package = require("../models/packages");
const Coupon = require("../models/coupons");
const Membership = require("../models/memberships");
const Campaign = require("../models/campaigns");



router.get("/", (req, res) => {
  res.json({ message: "This is the admin api" });
});

router.get("/auth-check", adminAuth, async(req,res) => {
  try{
    const admin = req.rootUser;

    return res.status(200).json({admin : admin})

  }catch(e){
    res.status(500).json({ message: `Your Session has expired !` });
  }
})

router.post("/register", async (req, res) => {
  const {
    email,
    password,
    cpassword,
    mobile,
    name
  } = req.body;

  if (
    !email ||
    !password ||
    !cpassword ||
    !mobile || 
    !name
  ) {
    return res.status(422).json({ error: "Please fill all the fields." });
  }

  try {
    const userSearchByEmail = await Admin.findOne({ email: email });
    const userSearchByMobile = await Admin.findOne({ mobile: mobile });

    if (userSearchByEmail || userSearchByMobile) {
      return res.status(422).json({ error: "Admin already exists." });
    }

    if (password !== cpassword) {
      return res.status(422).json({ error: "passwords dont match." });
    } else {
      const admin = new Admin({
        name,
        email,
        password,
        cpassword,
        mobile
      });

      const registered = await admin.save();

      const token = await registered.generateAuthToken();
  
      res.cookie("jwt", token, {
        expires: new Date(Date.now() + 60000000),
        httpOnly: true,
      });

      res.status(201).json({ message: "Registered Successfully!", token : token, admin : admin});
    }
  } catch (e) {
    res.status(500).json({ message: `Could not create account! --> ${e}` });
  }
});

router.post("/login", async (req, res) => {
  try {
    const logEmail = req.body.email;
    const logMobile = req.body.mobile;
    const logPass = req.body.password;

    if ((!logEmail && !logMobile) || !logPass) {
      return res.status(422).json({ error: "Please fill all the fields." });
    }

    const userByMobile = await Admin.findOne({mobile : logMobile});
    const userEmail = await Admin.findOne({ email: logEmail });


    if(userEmail){
    const passCheck = await bcrypt.compare(logPass, userEmail.password);
    const token = await userEmail.generateAuthToken();



    if (passCheck) {
      res.status(200).json({
        message: "Logged In Successfully!",
        token: token,
        success: true,
        admin: userEmail,
      });
    } else {
      res.status(400).json({ message: "Invalid login credentials" });
    }
  } 

 else if(userByMobile){
  const passCheck = await bcrypt.compare(logPass, userByMobile.password);
  const token = await userByMobile.generateAuthToken();

  res.cookie("jwt", token, {
    expires: new Date(Date.now() + 60000000),
    httpOnly: true,
  });


  if (passCheck) {
    res.status(200).json({
      message: "Logged In Successfully!",
      token: token,
      success: true,
      admin: userByMobile,
    });
  } else {
    res.status(400).json({ message: "Invalid login credentials" });
  }
} else {
  res.status(400).json({ message: "Invalid login credentials" });
}
  
 } catch (error) {
    res.status(500).json({ message: "Invalid login credentials" });
  }
});


router.get("/logout", adminAuth, async (req, res) => {
    try {
      res.status(200).send({ message: "logged out successfully!" });
    } catch (e) {
      res.status(500).send(e);
    }
  });

  router.delete("/remove-admin/:id", async (req,res) => {
    const _id = req.params.id;
    try{
      if(!_id){
        res.status(422).json({message : "Please Provide Admin ID."})
      }
      const deleteAdmin = await Admin.findByIdAndDelete(_id);

      if(deleteAdmin){
        res.status(200).json({message: "Admin Deleted !"});
      }else{
        res.status(404).json({error : "Could Not Find Admin !"});
      }
    }catch (e) {
     res.status(500).json({ message: `Could not find admin --> ${e}` });
    }
  })


//   router.post('/forgot-password', async (req,res) => {
//     try{
//       const {email} = req.body;
  
//       if(!email){
//         return res.status(422).json({
//           message : "Please provide the email",
//           success : false
//         })
//       }
  
//       const ResetPasswordAdmin = await Admin.findOne({email : email})
  
//        if(ResetPasswordAdmin){
  
//       const mailOptions = {
//         from: 'growsharp.india@gmail.com',
//         to: email,
//         subject: 'Reset Password',
//         html: forgotEmailBody
//       };
  
//       transporter.sendMail(mailOptions, function(error, info){
//         if(error){
//           console.log(error);
//         }else{
//           console.log('Email sent: ' + info.response);
//           return res.status(200).json({
//             message : `Password reset link was sent to ${email} successfully !`,
//             success : true
//           })
//         }
//       });
//     }else{
//       return res.status(404).json({
//         message : "Admin not found !",
//         success : false
//       })
//     }
    
      
//     }catch(e){
//       res.status(500).json({ message: `Server Error --> ${e}` });
//     }
//   })


  router.post('/change-password' , async(req,res) => {
    try{
  
      const {password, cpassword} = req.body;
  
      if(!password || !cpassword){
        return res.status(422).json({
          message : "Please fill all the fields !",
          success : false
        })
      }

      if(password !== cpassword){
        return res.status(422).json({
          message : "Passwords are not matching !",
          success : false
        })
      }
  
      const AdminFound = await Admin.findOne();
  
      if(AdminFound){
        let hashedPass = await bcrypt.hash(password, 10);
        let hashedcPass = await bcrypt.hash(cpassword, 10);
        const ResetPassword = await Admin.findByIdAndUpdate(AdminFound._id, {password : hashedPass, cpassword : hashedcPass}, {new : true})
        if(ResetPassword){
          return res.status(200).json({
            message : "Password Reset Successfully !",
            success : true
          })
        }else{
          return res.status(200).json({
            message : "Password could not be reset !",
            success : false
          })
        }
      }else{
        return res.status(404).json({
          message : "Admin not found !",
          success : false
        })
      }
    }catch(e){
      return res.status(500).json({
        message : `Server Error --> ${e}`,
        success : false
      })
    }
  });

 router.get('/get-all-advisors', adminAuth, async (req, res) => {
   try {
     const users = await Advisor.find();
     res.status(200).json(users);
   } catch (error) {
     res.status(500).json({ message: `Server Error --> ${error}`, success: false });
   }
 });

 router.get('/get-all-investors', adminAuth, async (req, res) => {
  try {
    const users = await Investor.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: `Server Error --> ${error}`, success: false });
  }
});

router.get('/get-advisors/:type', adminAuth, async (req, res) => {
  try {
    const {type} = req.params;

    let users;

    if(type == "active"){
      users = await Advisor.find({active: true});
    }else if (type == "inactive"){
      users = await Advisor.find({active: false});
    }else if(type == "crypto"){
      users = await Advisor.find({type: "crypto"});
    }
    else if(type == "stocks"){
      users = await Advisor.find({type: "stocks"});
    }
    else if(type == "nft"){
      users = await Advisor.find({type: "nft"});
    }

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: `Server Error --> ${error}`, success: false });
  }
});

router.get('/get-investors/:type', adminAuth, async (req, res) => {
  try {
    const {type} = req.params;

    let users;

    if(type == "active"){
      users = await Investor.find({active: true});
    }else if (type == "inactive"){
      users = await Investor.find({active: false});
    }

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: `Server Error --> ${error}`, success: false });
  }
});

router.get('/get-organisations/:type', adminAuth, async (req, res) => {
  try {
    const {type} = req.params;

    let users;

    if(type == "active"){
      users = await Organisation.find({active: true});
    }else if (type == "inactive"){
      users = await Organisation.find({active: false});
    }else if(type == "crypto"){
      users = await Organisation.find({type: "crypto"});
    }
    else if(type == "stocks"){
      users = await Organisation.find({type: "stocks"});
    }
    else if(type == "nft"){
      users = await Organisation.find({type: "nft"});
    }



    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: `Server Error --> ${error}`, success: false });
  }
});

router.get('/get-advisor/:userId', adminAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await Advisor.findById(userId)
    .select('-password -cpassword -active -verified -premium')
    .populate('packages', '-createdAt -updatedAt -__v'); // Exclude any unnecessary fields from packages

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: `Server Error --> ${error}`, success: false });
  }
});


router.get('/get-investor/:userId', adminAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await Investor.findById(userId)
    .select('-password -cpassword -active -verified -premium')
    .populate('packages', '-createdAt -updatedAt -__v'); // Exclude any unnecessary fields from packages

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: `Server Error --> ${error}`, success: false });
  }
});

router.get('/get-all-organisations', adminAuth, async (req, res) => {
  try {
    const users = await Organisation.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: `Server Error --> ${error}`, success: false });
  }
});

router.get('/get-organisation/:userId', adminAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await Organisation.findById(userId);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: `Server Error --> ${error}`, success: false });
  }
});

router.delete('/:userId/delete-package/:packageId', adminAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    // Find the advisor by ID
    const advisor = await Advisor.findById(userId);

    if (!advisor) {
      return res.status(404).json({ error: 'Advisor not found.' });
    }

    // Find the index of the package to be deleted
    const packageIndex = advisor.packages.findIndex(pkg => pkg._id.toString() === req.params.packageId);

    if (packageIndex === -1) {
      return res.status(404).json({ error: 'Package not found.' });
    }

    // Remove the package from the advisor's packages array
    advisor.packages.splice(packageIndex, 1);

    // Save the updated advisor
    await advisor.save();

    res.json({ message: 'Package deleted successfully.', advisor });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while deleting the package.' });
  }
});

// router.get("/get-all-services", adminAuth, async (req, res) => {
//   try {
//     const services = await Service.find();
//     const allServices = services.reduce((servicesByType, service) => {
//       const { type } = service;
//       if (!servicesByType[type]) {
//         servicesByType[type] = [];
//       }
//       servicesByType[type].push(service);
//       return servicesByType;
//     }, []);

//     const formattedServices = Object.keys(allServices).map((type) => ({
//       name: type,
//       value: allServices[type],
//     }));

//     res.status(200).json({
//       message: "Services fetched successfully!",
//       success: true,
//       services: formattedServices,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: `Server Error --> ${err}`,
//       success: false,
//     });
//   }
// });

router.patch('/change-advisor-status/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const user = await Advisor.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found', success: false });
      }
  
      user.active = !user.active; // Toggle the status
      await user.save();
  
      res.status(200).json({ message: 'User status toggled successfully', active: user.active, success:true });
    } catch (error) {
      res.status(500).json({ message: `Internal server error --> ${error}`, success:false });
    }
});

router.patch('/change-investor-status/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await Investor.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found', success: false });
    }

    user.active = !user.active; // Toggle the status
    await user.save();

    res.status(200).json({ message: 'User status toggled successfully', active: user.active, success:true });
  } catch (error) {
    res.status(500).json({ message: `Internal server error --> ${error}`, success:false });
  }
});


router.patch('/change-advisor-verification/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await Advisor.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Investor not found', success: false });
    }

    user.verified = !user.verified; // Toggle the status
    await user.save();

    res.status(200).json({ message: 'Investor Verification status toggled successfully', active: user.active, success:true });
  } catch (error) {
    res.status(500).json({ message: `Internal server error --> ${error}`, success:false });
  }
});

router.patch('/change-investor-verification/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await Investor.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Investor not found', success: false });
    }

    user.verified = !user.verified; // Toggle the status
    await user.save();

    res.status(200).json({ message: 'Investor Verification status toggled successfully', active: user.active, success:true });
  } catch (error) {
    res.status(500).json({ message: `Internal server error --> ${error}`, success:false });
  }
});

  router.delete('/delete-advisor/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const user = await Advisor.findByIdAndDelete(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found', success: false });
      }
  
      res.status(200).json({ message: 'User deleted successfully', success : true });
    } catch (error) {
       res.status(500).json({ message: `Internal server error --> ${error}`, success: false });
    }
  });

  router.delete('/delete-investor/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const user = await Investor.findByIdAndDelete(id);
      if (!user) {
        return res.status(404).json({ message: 'Investor not found', success: false });
      }
  
      res.status(200).json({ message: 'Investor deleted successfully', success : true });
    } catch (error) {
       res.status(500).json({ message: `Internal server error --> ${error}`, success: false });
    }
  });

  router.get('/get-all-packages', async (req, res) => {
    try {
      // Find all packages in the Package model and populate the 'user_id' field with user details
      const packages = await Package.find().populate('user_id', 'type name')
      .populate('investors', 'name email phone address city country packages');
  
      // If no packages are found, return an empty array
      if (packages.length === 0) {
        return res.json({ message: 'No packages found.', packages: [] });
      }
  
      res.json({ message: 'Packages retrieved successfully.', packages });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while fetching the packages.' });
    }
  });


  router.post('/add-package', adminAuth, async (req, res) => {
    const { title, timeframe, price, description, coverImg } = req.body;
  
    try {
  
      // Create a new package using the Package model
      const newPackage = new Package({
        title,
        timeframe,
        price,
        description,
        coverImg
      });
  
      // Save the new package in the Package collection
      await newPackage.save();
  
      res.status(201).json({ message: 'Package added successfully.', success: true });
    } catch (error) {
      res.status(500).json({ error: `An error occurred while adding the package. --> ${error}` });
    }
  });

  // Add a coupon
router.post('/add-coupon', adminAuth, async (req, res) => {
  try {
    const { coupon, discount } = req.body;
    const newCoupon = new Coupon({ coupon, discount });
    await newCoupon.save();
    res.status(201).json(newCoupon);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add the coupon' });
  }
});

// Get all coupons
router.get('/get-all-coupons', adminAuth, async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get coupons' });
  }
});

// Edit a coupon
router.put('/edit-coupon/:id', adminAuth, async (req, res) => {
  try {
    const { coupon, discount } = req.body;
    const couponId = req.params.id;

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      { coupon, discount },
      { new: true }
    );

    res.json(updatedCoupon);
  } catch (error) {
    res.status(500).json({ error: 'Failed to edit the coupon' });
  }
});

router.delete('/delete-coupon/:id', adminAuth, async (req, res) => {
  try {
    const couponId = req.params.id;
    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);
    if (!deletedCoupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete the coupon' });
  }
});

router.patch('/toggle-coupon-status/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found', success: false });
    }

    coupon.active = !coupon.active; // Toggle the status
    await coupon.save();

    res.status(200).json({ message: 'Coupon status toggled successfully', active: coupon.active, success:true });
  } catch (error) {
    res.status(500).json({ message: `Internal server error --> ${error}`, success:false });
  }
});


// Add a membership
router.post('/add-membership', async (req, res) => {
  try {
    const { membership, type, time, amount } = req.body;
    if(!membership || !type || !time || !amount){
      return res.status(422).json({
        message: "Please fill in all the fields",
        success: false
      })
    }
    const newMembership = new Membership({ membership, type, time, amount });
    await newMembership.save();
    res.status(201).json(newMembership);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add the membership' });
  }
});

// Get all memberships
router.get('/get-all-memberships', async (req, res) => {
  try {
    const memberships = await Membership.find();
    res.json(memberships);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get memberships' });
  }
});

// Delete a membership
router.delete('/delete-membership/:id', async (req, res) => {
  try {
    const membershipId = req.params.id;
    const deletedMembership = await Membership.findByIdAndDelete(membershipId);
    if (!deletedMembership) {
      return res.status(404).json({ error: 'Membership not found' });
    }
    res.json({ message: 'Membership deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete the membership' });
  }
});

// Toggle membership status
router.put('/toggle-membership-status/:id', async (req, res) => {
  try {
    const membershipId = req.params.id;
    const membership = await Membership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    membership.active = !membership.active;
    await membership.save();

    res.json(membership);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle membership status' });
  }
});

// Edit a membership
router.put('/edit-membership/:id', async (req, res) => {
  try {
    const { membership, type, time, amount } = req.body;
    const membershipId = req.params.id;

    const updatedMembership = await Membership.findByIdAndUpdate(
      membershipId,
      { membership, type, time, amount },
      { new: true }
    );

    res.json(updatedMembership);
  } catch (error) {
    res.status(500).json({ error: 'Failed to edit the membership' });
  }
});

router.get('/get-premium-advisors', async (req, res) => {
  try {
    // Find all advisors with premium set to true
    const premiumUsers = await Advisor.find({ premium: true });

    res.json(premiumUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get premium users' });
  }
});


// Add a new campaign
router.post("/add-campaign", async (req, res) => {
  try {
    const { title, time, unit, price, description, image } = req.body;
    if (!title || !time || !unit || !price) {
      return res.status(422).json({
        message: "Please fill all the required fields!",
        success: false
      });
    }
    const campaign = new Campaign({ title, time, unit, price, description, image });
    await campaign.save();
    res.status(201).json({ message: "Campaign added successfully", campaign });
  } catch (err) {
    res.status(500).json({ error: "Failed to add campaign" });
  }
});

// Edit an existing campaign
router.put("/edit-campaign/:id", async (req, res) => {
  try {
    const { title, time, unit, price, description, image } = req.body;
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { title, time, unit, price, description, image },
      { new: true }
    );
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    res.json({ message: "Campaign updated successfully", campaign });
  } catch (err) {
    res.status(500).json({ error: "Failed to update campaign" });
  }
});

// Delete a campaign
router.delete("/delete-campaign/:id", async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndRemove(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    res.json({ message: "Campaign deleted successfully", campaign });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete campaign" });
  }
});

router.get("/get-all-campaigns", async (req, res) => {
  try {
    const campaigns = await Campaign.find({});
    res.status(200).json({ campaigns });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

router.get("/get-top-advisors", async (req, res) => {
  try {
    // Find advisors who have a campaign (campaign._id exists)
    const advisorsWithCampaigns = await Advisor.find({ "campaign._id": { $exists: true } })
      .select("name email type phone organisation campaign");

    // Fetch campaign details from the Campaign collection for each advisor
    const advisorsWithCampaignDetails = await Promise.all(
      advisorsWithCampaigns.map(async (advisor) => {
        const campaign = await Campaign.findById(advisor.campaign._id);
        return {
          name: advisor.name,
          email: advisor.email,
          phone: advisor.phone,
          type: advisor.type,
          organisation: advisor.organisation,
          expiresAt: advisor.campaign.expiresAt,
          campaign: campaign,
        };
      })
    );

    res.status(200).json({ advisors: advisorsWithCampaignDetails });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch top advisors with campaigns" });
  }
});




  module.exports = router;