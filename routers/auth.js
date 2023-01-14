const routers = require("express").Router();
const User = require("../models/Users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserOTP = require("../models/UserOTP");
const emailjs = require("emailjs-com");

/* Register */
routers.post("/register", async (req, res) => {
  try {
    let newuser = await User.findOne({ email: req.body.email });
    if (newuser != null) {
      res.status(400).json({ message: "Email Already Exists" });
      return;
    }

    newuser = await User.findOne({ username: req.body.username });
    if (newuser != null) {
      res.status(400).json({ message: "Username Already Exists" });
      return;
    }

    /* Hasing passoword */
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    });

    const user = await newUser.save().then((result) => {
      sendVerificationMail(result, res);
    });
    // res.status(200).json(user);
  } catch (error) {
    //Internal server error
    res.status(500).json(error);
  }
});

/* Send Verification Mail */
const sendVerificationMail = async ({ username, _id, email }, res) => {
  const otp = Math.floor(100000 + Math.random() * 900000);

  let templateParams = {
    to_email: email,
    otp: otp,
    name: username,
  };

  try {
    const hashedOTP = await bcrypt.hash(otp.toString(), 10);

    const OTPVerfication = await new UserOTP({
      email: email,
      otp: hashedOTP,
      createdAt: new Date(),
      expiresAt: new Date(new Date().getTime() + 5 * 60 * 1000), // 5 minutes
    }).save();

    await OTPVerfication.save();
    emailjs
      .send(
        process.env.MAILJS_SERVER,
        process.env.MAILJS_TEMPLATE,
        templateParams,
        process.env.MAILJS_USER
      )
      .then(() => {
        res.status(200).json({ message: "Mail sent successfully" });
      })
      .catch(() => {
        res.status(500).json({ message: "Error sending mail" });
      });
  } catch (error) {
    res.status(500).json({ message: "Error sending mail" });
  }
};

/* Verify */
routers.post("/verify", async (req, res) => {
  /* body will have userId and otp*/
  try {
    let { email, otp } = req.body;
    const user = await UserOTP.findOne({ email: email }); // find user by id
    if (user == null) {
      // user not found
      res.status(404).json({ message: "User not found" });
    } else {
      const validateOTP = await bcrypt.compare(otp, user.otp);
      if (!validateOTP) {
        // invalid otp
        res.status(400).json({ message: "Invalid OTP" });
      } else {
        const currentTime = new Date();
        if (Date.now() > user.expiresAt) {
          // otp expired
          await UserOTP.deleteOne({ email: email });
          res.status(400).json({ message: "OTP Expired" });
        } else {
          await User.updateOne(
            { email: email },
            { $set: { mailVerified: true } }
          );
          await UserOTP.deleteOne({ email: email });
          res.status(200).json({ message: "OTP Verified" });
        }
      }
    }
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
    console.log(err);
  }
});

/* Login */
routers.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      /* not found */
      res.status(404).json("User not found");
    } else {
      const validatePassoword = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (!validatePassoword) {
        /* bad request */
        res.status(400).json({message: "Invalid Credentials"});
      } else if (!user.mailVerified) {
        res.status(403).json({ message: "Please verify your mail" });
      } else {
        /* success */
        const user_json = user.toJSON();
        const jwt_data = {
            id: user_json._id,
            username: user_json.username,
        };
        const token = jwt.sign(jwt_data, process.env.JWT_SECRET, {
          expiresIn: "1w",
        });
        const { password, _id, ...userWithoutPassword } = user_json;
        res.status(200).json({ 'auth-token': token , user: userWithoutPassword});
      }
    }
  } catch (error) {
    //Internal server error
    res.status(500).json(error);
  }
});

module.exports = routers;
