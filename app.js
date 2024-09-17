// server.js
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require('path');
const cors = require("cors");


dotenv.config();
// Initialize Express
const app = express();
app.use(bodyParser.json());

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Example route
app.get('/some-route', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Connect to MongoDB using environment variable

const mongoURI = process.env.URI;

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

// Use the lead routes
const webformRoutes = require("./src/routes/webformRoutes");

app.use("/api", webformRoutes);
// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
