const router = require("express").Router();
const bcrypt = require("bcrypt");
const User = require("../models/Users");

router.get("/", (req, res) => {
  res.send("You are on the way to the users route");
});

// Update user
router.put("/:id", async (req, res) => {
  if (req.body.userId === req.params.id || req.body.isAdmin) {//admin can update any user, user can update only himself
    if(req.body.password){ // If the user wants to update the password we need to hash it
        try {
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        } catch (error) {
            return res.status(500).json(error) // Internal server error
        }
    }
    try {
        const user = await User.findByIdAndUpdate(req.params.id, {
            $set: req.body,
        });
        res.status(200).json("Account has been updated");
    } catch (error) {
        return res.status(500).json(error) // Internal server error
    }
  } else {
    res.status(403).json("You can update only your account"); // Forbidden
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  if (req.body.userId === req.params.id || req.body.isAdmin) {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      res.status(200).json("Account has been deleted");
    } catch (error) {
      return res.status(500).json(error); // Internal server error
    }
  } else {
    res.status(403).json("You can delete only your account"); // Forbidden
  }
});

// Get a user by id
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const {_id, password, updatedAt, isAdmin, __v, ...other } = user._doc; // We don't want to send the _id, isAdmin, __v, password and updatedAt to the client
    res.status(200).json(other);
  } catch (error) {
    return res.status(404).json("User not found"); // Not found
  }
});

// Follow a user
router.put("/:id/follow", async (req, res) => {
  if (req.body.userId !== req.params.id) { // We can't follow ourselves
    try {
      const user = await User.findById(req.params.id); // The user we want to follow
      const currentUser = await User.findById(req .body.userId); // The user who wants to follow
      if (!user.followers.includes(req.body.userId)) { // If the user we want to follow doesn't have the user who wants to follow in his followers list
        await user.updateOne({ $push: { followers: req.body.userId } }); // We add the user who wants to follow in the followers list of the user we want to follow
        await currentUser.updateOne({ $push: { followings: req.params.id } }); // We add the user we want to follow in the followings list of the user who wants to follow
        res.status(200).json("User has been followed");
      } else {
        res.status(403).json("You already follow this user"); // Forbidden
      }
    } catch (error) {
      return res.status(500).json(error); // Internal server error
    }
  } else {
    res.status(403).json("You can't follow yourself");
  }
});

//Unfollow a user
router.put("/:id/unfollow", async (req, res) => {
  if (req.body.userId !== req.params.id) { // We can't unfollow ourselves
    try {
      const user = await User.findById(req.params.id); // The user we want to unfollow
      const currentUser = await User.findById(req .body.userId); // The user who wants to unfollow
      if (user.followers.includes(req.body.userId)) { // If the user we want to unfollow has the user who wants to unfollow in his followers list
        await user.updateOne({ $pull: { followers: req.body.userId } }); // We remove the user who wants to unfollow from the followers list of the user we want to unfollow
        await currentUser.updateOne({ $pull: { followings: req.params.id } }); // We remove the user we want to unfollow from the followings list of the user who wants to unfollow
        res.status(200).json("User has been unfollowed");
      } else {
        res.status(403).json("You don't follow this user"); // Forbidden
      }
    } catch (error) {
      return res.status(500).json(error); // Internal server error
    }
  } else {
    res.status(403).json("You can't unfollow yourself");
  }
});

//search users by username including the username
router.get("/search/:username", async (req, res) => {
  let success = false
  try {
    const username = req.params.username;
    if(username.length < 3) return res.status(400).json({success : success, message : "Atleast 3 character required"}); // Bad request
    const user = await User.find({ username: { $regex: username } });
    data = []
    // We don't want to send the _id, isAdmin, __v, password and updatedAt to the client
    user.forEach(item => {
      const {_id, password, updatedAt, isAdmin, __v, ...other } = item._doc;
      data.push(other)
    });
    if(user.length > 0) success = true
    res.status(200).json({success : success, data : data});
  } catch (error) {
    return res.status(500).json({success : success , message : "Internal Server Error"}); // Internal server error
  }
});
  

module.exports = router;
