// config/db.js
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error('MongoDB URI is not set. Check your .env file.');
  process.exit(1); // Exit process with failure
}

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));
