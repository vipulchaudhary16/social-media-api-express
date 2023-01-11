const express = require("express");
const app = express();

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");

const userRoute = require("./routers/users");
const authRoute = require("./routers/auth");
const postRoute = require("./routers/posts");

dotenv.config();
const PORT = process.env.PORT || 8000;

/* ==== Database Connection ==== */

mongoose.connect(process.env.MONGODB_URI, () => {
  console.log("Connected to MongoDB");
});

/* ==== Middlewares ==== */

/* express.json() is any body parser, which is used to parse the body of the request */
app.use(express.json());
/* Morgan is a middleware which is used to log the request */
app.use(morgan());
/* Helmet is a middleware which is used to secure the app by setting various HTTP headers */
app.use(helmet());
/*CORS is a node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options.*/
// app.use(require('cors'))
const cors=require("cors");
const corsOptions ={
   origin:'*', 
   credentials:true,            //access-control-allow-credentials:true
   optionSuccessStatus:200,
}

app.use(cors(corsOptions)) // Use this after the variable declaration
/* ==== Routes ==== */

app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
