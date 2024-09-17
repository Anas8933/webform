// repositories/leadRepository.js
const Lead = require('../models/leadModel');

// Create a new lead
exports.createLead = async (leadData) => {
  const lead = new Lead(leadData);
  return await lead.save();
};

// Find leads by a filter
exports.findLeads = async (filter) => {
  return await Lead.find(filter);
};

// Update a lead
exports.updateLead = async (id, updateData) => {
  return await Lead.findByIdAndUpdate(id, updateData, { new: true });
};
