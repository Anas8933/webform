const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ['webform', 'social media', 'facebook', 'linkedin', 'website', 'email'], // Define allowed values
    default: 'webform' // Default value if not specified
  },
  sourceId: { type: String, required: true },
  formData: { type: mongoose.Schema.Types.Mixed } 
});

module.exports = mongoose.model('Lead', leadSchema);
