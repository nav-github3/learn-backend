import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  videoFile: {
    type: String, // URL to the video file
    required: true
  },
  thumbnail: {
    type: String, // URL to the thumbnail image
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the user who owns the video
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // Duration of the video in seconds
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
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
videoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Video = mongoose.model('Video', videoSchema);

export default Video;