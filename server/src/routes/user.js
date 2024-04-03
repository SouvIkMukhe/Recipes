// Import necessary modules
import express from "express"; // Importing Express framework
import jwt from "jsonwebtoken"; // Importing JSON Web Token for authentication
import bcrypt from "bcrypt"; // Importing bcrypt for password hashing

// Importing the UserModel from the "Users.js" file in the "../models" directory
import { UserModel } from "../models/Users.js";

// Creating an instance of Express Router
const router = express.Router();

// Route for user registration
router.post("/register", async (req, res) => {
  const { username, password } = req.body; // Extracting username and password from request body
  
  // Check if the username already exists in the database
  const user = await UserModel.findOne({ username });
  if (user) {
    return res.status(400).json({ message: "Username already exists" });
  }
  
  // Hashing the password before saving it to the database
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Creating a new user instance with hashed password
  const newUser = new UserModel({ username, password: hashedPassword });
  
  // Saving the new user to the database
  await newUser.save();
  
  // Sending success response
  res.json({ message: "User registered successfully" });
});

// Route for user login
router.post("/login", async (req, res) => {
  const { username, password } = req.body; // Extracting username and password from request body
  
  // Finding the user with the given username in the database
  const user = await UserModel.findOne({ username });
  
  // If user does not exist, return error message
  if (!user) {
    return res.status(400).json({ message: "Username or password is incorrect" });
  }
  
  // Comparing the provided password with the hashed password stored in the database
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  // If passwords do not match, return error message
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Username or password is incorrect" });
  }
  
  // Generating JWT token for user authentication
  const token = jwt.sign({ id: user._id }, "secret");
  
  // Sending the token and user ID in the response
  res.json({ token, userID: user._id });
});

// Exporting the router to use in other files
export { router as userRouter };

// Middleware function to verify JWT token
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization; // Extracting authorization header from request
  
  // If authorization header is present
  if (authHeader) {
    // Verify the JWT token
    jwt.verify(authHeader, "secret", (err) => {
      if (err) {
        // If verification fails, send forbidden status
        return res.sendStatus(403);
      }
      // If verification succeeds, proceed to the next middleware
      next();
    });
  } else {
    // If authorization header is not present, send unauthorized status
    res.sendStatus(401);
  }
};
