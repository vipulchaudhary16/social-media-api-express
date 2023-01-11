const routers = require("express").Router();
const User = require("../models/Users");
const bcrypt = require("bcrypt");

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

    const user = await newUser.save();
    res.status(200).json(user);
  } catch (error) {
    //Internal server error
    res.status(500).json(error);
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
