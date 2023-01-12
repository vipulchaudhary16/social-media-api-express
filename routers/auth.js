const routers = require("express").Router();
const User = require("../models/Users");
const bcrypt = require("bcrypt");
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
const sendVerificationMail = async ({ _id, email }, res) => {
  const otp = Math.floor(100000 + Math.random() * 900000);

  let templateParams = {
    to_email: email,
    otp: otp,
  };

  try {
    const hashedOTP = await bcrypt.hash(otp.toString(), 10);

    const OTPVerfication = await new UserOTP({
      userId: _id,
      otp: hashedOTP,
      createdAt: new Date(),
      expiresAt: new Date(new Date().getTime() + 5 * 60 * 1000), // 5 minutes
    }).save();

    await OTPVerfication.save();

    emailjs
      .send(
        process.env.MAILJS_SERVER,
        process.env.MAILJS_TEMPLATE,
        'QWCZ3Yywnf82gvJ8P',
        templateParams,
      )
      .then((err, res) => {
        if (err) {
          console.log(err);
        }
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (error) {
    res.status(500).json(error);
  }
};

/* Verify */
routers.post("/verify", async (req, res) => {});
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
        res.status(400).json("Wrong Password");
      } else {
        res.status(200).json(user);
      }
    }
  } catch (error) {
    //Internal server error
    res.status(500).json(error);
  }
});

module.exports = routers;
