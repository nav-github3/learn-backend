const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const cloudinary = require('./config/cloudinary');

const app = express();

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Example function to upload an image to Cloudinary
async function uploadImage(filePath) {
  try {
    const result = await cloudinary.uploader.upload(filePath);
    console.log('Image uploaded successfully:', result);
    return result;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});