const mongoose = require('mongoose');

const webFormSchema = new mongoose.Schema({
  templateId: { type: String, required: true, unique: true }, // Unique token identifier
  token: { type: String, required: true, unique: true },
  title: { type: String, required: true }, // Title of the web form
  formDes:{ type:String , required:true },
  fields: [{
    name:{type: String , required:true},
    label: { type: String, required: true }, // Field label (e.g., "Name", "Email")
    fieldType: { type: String, required: true }, // Field type (e.g., 'text', 'select', 'checkbox')
    options: { type: [String], required: true, default: [] }, // Options for fields like 'select' (required and defaults to empty array)
    required: { type: Boolean, required: true, default: true } // New field, required, defaults to true
  }],
  button: {
    label: { type: String, required: true } // Button label (e.g., "Submit")
  },
  viewed: { type: Number, default: 0 },
  interacted: { type: Number, default: 0 },
  submitted: { type: Number, default: 0 },
  conversionRate: { type: String, default: '0%' },
  status: {
    type: String,
    enum: ['active','inactive'], // Define allowed values
    default: 'active' // Default value if not specified
  },
  createdBy: { type: String, default: 'Admin' },
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
  actionType: {
    type: String,
    enum: ['showThankYou', 'redirectUrl'],
    // required: true 
    },
  showThankYou: {
    title: {
      type: String,
      required: function () {
        return this.actionType === 'showThankYou'; // Required if actionType is 'showThankYou'
      },
      default: "",
    },
    desc: {
      type: String,
      required: function () {
        return this.actionType === 'showThankYou'; // Required if actionType is 'showThankYou'
      },
      
    }
  },
  redirectUrl: {
    type: String,
    validate: {
      validator: function (v) {
        return this.actionType !== 'redirectUrl' || v.match(/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i);
      },
      message: props => `${props.value} is not a valid URL!`
    },
    default: "",
  }
});



module.exports = mongoose.model('WebForm', webFormSchema);