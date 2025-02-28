import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  watchHistory: {
    type: [String], // Assuming watchHistory is an array of strings (e.g., video IDs)
    default: []
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  avatar: {
    type: String, // URL to the avatar image
    default: ''
  },
  coverImage: {
    type: String, // URL to the cover image
    default: ''
  },
  password: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});



// Method to generate JWT token
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


// Method to generate JWT token
userSchema.methods.isPasswordMatch = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


// Method to generate access token
userSchema.methods.generateAccessToken = function() {
  const accessToken = jwt.sign({ _id: this._id, username: this.username }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_SECRET_EXPIRE // Token expiration time
  });
  return accessToken;
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function() {
  const refreshToken = jwt.sign({ _id: this._id, username: this.username }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_SECRET_EXPIRE // Token expiration time
  });
  return refreshToken;
};

const User = mongoose.model('User', userSchema);
export default User;