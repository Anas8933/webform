const Lead = require("../models/leadModel");
const WebForm = require("../models/webFormsModel");
const crypto = require("crypto");
const axios = require("axios");

// Function to generate a 32-bit token
const generateToken = () => {
  const buffer = crypto.randomBytes(16); // Generates 32 hex characters
  return buffer.toString("hex");
};

// Function to generate a 32-bit templateId with hyphens and lowercase
const generateTemplateId = () => {
  const buffer = crypto.randomBytes(8); // Generates 16 hex characters
  const token = buffer.toString("hex");
  return token
    .match(/.{1,4}/g)
    .join("-")
    .toLowerCase();
};

// Helper function to calculate conversion rate based on viewed, interacted, and submitted
const calculateConversionRate = (viewed, interacted, submitted) => {
  const total = viewed + interacted;
  if (total === 0) return "0%";
  const rate = (submitted / total) * 100;
  return `${rate.toFixed(2)}%`;
};

// Service to create a new web form
const createWebForm = async ({
  actionType,
  status,
  formDes,
  title,
  fields,
  button,
  showThankYou,
  redirectUrl,
}) => {
  const token = generateToken();
  const templateId = generateTemplateId();

  const newWebForm = new WebForm({
    templateId,
    token,
    actionType,
    status,
    formDes,
    title,
    showThankYou,
    redirectUrl,
    fields,
    button,
  });

  // Add showThankYou data if actionType is 'showThankYou'

  if (actionType === "showThankYou") {
    if (showThankYou && showThankYou.title && showThankYou.desc) {
      newWebForm.showThankYou = {
        title: showThankYou.title,
        desc: showThankYou.desc,
      };
    } else {
      newWebForm.showThankYou = {
        title: "",
        desc: "",
      };
    }
  }

  // Add redirectUrl data if actionType is 'redirectUrl'
  if (actionType === "redirectUrl") {
    if (
      redirectUrl &&
      /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(redirectUrl)
    ) {
      newWebForm.redirectUrl = redirectUrl;
    } else {
      newWebForm.redirectUrl = "";
    }
  }

  // If actionType is neither 'showThankYou' nor 'redirectUrl', handle accordingly
  if (actionType !== "showThankYou" && actionType !== "redirectUrl") {
    newWebForm.showThankYou = {
      title: "",
      desc: "",
    };
    newWebForm.redirectUrl = "";
  }

  await newWebForm.save();
  return newWebForm;
};


const getWebForm = async (token) => {
  try {
    // Query the database to find a form by its token
    const form = await WebForm.findOne({ token });  // Adjust query if needed (e.g., change token to _id or another field)

    if (!form) {
      throw new Error('Web form not found');
    }

    return form;
  } catch (error) {
    throw new Error(`Error retrieving web form: ${error.message}`);
  }
};

// Service to get a web form by token
const getWebFormByToken = async (token) => {
  const webForm = await WebForm.findOne({ token });
  if (!webForm) {
    throw new Error("WebForm not found");
  }
  // Check if the form is inactive
  if (webForm.status === "inactive") {
    return res.status(403).send({
      message: "This form is inactive and cannot be accessed.",
    });
  }
  webForm.viewed += 1;
  webForm.conversionRate = calculateConversionRate(
    webForm.viewed,
    webForm.interacted,
    webForm.submitted
  );
  await webForm.save();
  return webForm;
};

// Service to update a web form by templateId
const updateWebForm = async (
  templateId,
  {
    actionType,
    showThankYou,
    redirectUrl,
    status,
    formDes,
    title,
    fields,
    button,
  }
) => {
  const updatedWebForm = await WebForm.findOneAndUpdate(
    { templateId },
    {
      $set: {
        actionType,
        showThankYou,
        redirectUrl,
        formDes,
        title,
        fields,
        button,
        status,
      },
    },
    { new: true, runValidators: true }
  );
  console.log(updateWebForm);

  if (!updatedWebForm) {
    throw new Error("WebForm not found");
  }

  return updatedWebForm;
};

// Service to get all web forms
const getAllForms = async () => {
  return await WebForm.find({ deletedAt: null });
};

// Service to get web forms by templateId
const getFormsByTemplateId = async (templateId) => {
  const forms = await WebForm.find({ templateId });
  if (!forms.length) {
    throw new Error("No forms found for this template ID");
  }
  return forms;
};

// Service to delete a form by templateId and return null fields
const deleteFormById = async (templateId) => {
  // Find the form by templateId where deletedAt is null
  const form = await WebForm.findOne({ templateId, deletedAt: null });

  // If form is not found, throw an error
  if (!form) {
    throw new Error("Form not found or already deleted");
  }

  // Set the deletedAt field to the current date and time
  form.deletedAt = new Date();

  // Save the updated form back to the database
  try {
    await form.save();
  } catch (error) {
    console.error("Error saving form:", error);
    throw new Error("Error saving form");
  }

  // Return the templateId in the response to indicate successful soft deletion
  return { message: "Form deleted successfully", templateId: form.templateId };
};

// Service to log interactions with the form
const logInteraction = async (token) => {
  const webForm = await WebForm.findOne({ token });
  if (!webForm) {
    throw new Error("WebForm not found");
  }

  console.log("Before interaction count: ", webForm.interacted);
  webForm.interacted = (webForm.interacted || 0) + 1; // Ensure the field starts at 0 if undefined
  webForm.conversionRate = calculateConversionRate(
    webForm.viewed,
    webForm.interacted,
    webForm.submitted
  );

  await webForm.save();
  console.log("After interaction count: ", webForm.interacted);

  return webForm.interacted;
};

// Fetch web form data by token from an external API
const fetchWebFormData = async (token) => {
  try {
    const response = await axios.get(
      `http://localhost:3000/api/webforms/${token}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching web form data:", error);
    throw error;
  }
};

// Generate the complete HTML content for the form
const generateFormHTML = (webForm, token) => {
  // Function to generate HTML for form fields
  const formFieldsHTML = webForm.fields
    .map((field) => {
      if (field.fieldType === "select") {
        return `
          <div class="form-group">
            <label for="${field.name}">${field.label}</label>
            <select name="${field.name}" required="${
          field.required
        }" onfocus="handleFocus('${field.name}')">
              ${field.options
                .map((option) => `<option value="${option}">${option}</option>`)
                .join("")}
            </select>
          </div>
        `;
      } else {
        return `
          <div class="form-group">
            <label for="${field.name}">${field.label}</label>
            <input type="${field.fieldType}" name="${field.name}" required="${field.required}" onfocus="handleFocus('${field.name}')">
          </div>
        `;
      }
    })
    .join("");

  // Combine everything into a single HTML structure
  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${webForm.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .form-container { max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 10px; }
          .form-group { margin-bottom: 15px; }
          label { display: block; margin-bottom: 5px; }
          input, select, button { width: 100%; padding: 10px; }
          button { background-color: #4CAF50; color: white; border: none; }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
      </head>
      <body>
        <div class="form-container">
          <div id="title-description">
            <h2>${webForm.title}</h2>
            <p>${webForm.formDes}</p>
          </div>
          <form id="dynamic-form" action="/api/webforms/${token}" method="POST">
            ${formFieldsHTML}
            <input type="hidden" name="actionType" value="${
              webForm.actionType
            }">
               <input type="hidden" name="showThankYou" value="${
                 webForm.showThankYou || ""
               }">
            <input type="hidden" name="title" value="${
              webForm.showThankYou?.title || ""
            }">
             <input type="hidden" name="desc" value="${
               webForm.showThankYou?.desc || ""
             }">
             <input type="hidden" name="redirectUrl" value="${
               webForm.redirectUrl || ""
             }">
           <button type="submit">${webForm.button.label}</button>
            <p style="text-align: center; margin-top: 20px;">Powered by Qurilo Solutions</p>
          </form>   
          <script>
           let interactionLogged = false;

async function handleFocus(fieldName) {
  console.log(fieldName); 
  if (interactionLogged) return; // Prevent multiple logging

  try {
    const response = await axios.get('http://localhost:3000/api/webforms/interaction/${token}');
    console.log('Interaction logged:', response.data);
    interactionLogged = true; // Set this only after the API call is successful
  } catch (error) {
    console.error('Error logging interaction:', error);
  }
}

document.getElementById('dynamic-form').onsubmit = async function(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  const jsonData = {};
  formData.forEach((value, key) => { jsonData[key] = value; });
  
  console.log("Form Data to send:", jsonData);

  try {
    const response = await axios.post('http://localhost:3000/api/webforms/${token}', jsonData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Form submission successful:', response.data);
    
    const htmlResponse = response.data;
    document.documentElement.innerHTML = htmlResponse; // Replace page content with response HTML
    
  } catch (error) {
    console.error('Error submitting form:', error);
  }
};

           </script>
        </div>
      </body>
      </html>
    `;
};

// Generate HTML for the form not found scenario
const generateFormNotFoundHTML = () => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Form Not Found</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; margin: 20px; }
        img { max-width: 70%; height: auto; }
      </style>
    </head>
    <body>
      <h1>Form not found</h1>
      <img src="/assets/server-error.jpg" alt="Form Not Found">
    </body>
    </html>
  `;

const submitWebFormByToken = async (token, formData) => {
  // Find the web form using the token
  const webForm = await WebForm.findOne({ token });

  if (!webForm) {
    throw new Error("WebForm not found"); // Will be caught in the controller
  }

  // Extract actionType and other necessary fields from formData
  const { actionType, title, desc, redirectUrl, showThankYou } = formData;

  // Validate actionType
  if (!actionType) {
    throw new Error("actionType is missing");
  }

  // Check if actionType is showThankYou and validate the required fields
  if (actionType === "showThankYou") {
    if (showThankYou && showThankYou.title && showThankYou.desc) {
      title = showThankYou.title;
      desc = showThankYou.desc;
    } else {
      console.warn("Title or description is missing for the Thank You action");
    }
  } else if (actionType === "redirectUrl") {
    if (!redirectUrl) {
      throw new Error("redirectUrl is missing for the Redirect action");
    }
  } else {
    throw new Error("Invalid actionType");
  }

  // Create new lead entry
  const newLead = new Lead({
    source: "webform",
    sourceId: webForm.templateId,
    formData,
  });

  // Save the lead to the database
  await newLead.save();

  let actionResponse = null;

  // Generate HTML response based on actionType
  if (actionType === "showThankYou") {
    actionResponse = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Thank You</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                h1 { color: green; }
                p { font-size: 1.2em; }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            <p>${desc}</p>
        </body>
        </html>
      `;
  } else if (actionType === "redirectUrl" && redirectUrl) {
    actionResponse = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Thanku</title>
            <meta http-equiv="refresh" content="0;url=${redirectUrl}">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            </style>
        </head>
        <body>
            <p>Redirecting you to <a href="${redirectUrl}">${redirectUrl}</a>...</p>
        </body>
        </html>
      `;
  } else {
    throw new Error("Invalid actionType"); // This will also be caught in the controller
  }

  // Update submission count and conversion rate
  webForm.submitted += 1;
  webForm.conversionRate = calculateConversionRate(
    webForm.viewed,
    webForm.interacted,
    webForm.submitted
  );
  await webForm.save();
  return { newLead, actionResponse }; // Return both the new lead and the action response
};
module.exports = {
  createWebForm,
  getWebForm,
  getWebFormByToken,
  updateWebForm,
  getAllForms,
  getFormsByTemplateId,
  deleteFormById,
  logInteraction,
  submitWebFormByToken,
  fetchWebFormData,
  generateFormHTML,
  generateFormNotFoundHTML,
};
