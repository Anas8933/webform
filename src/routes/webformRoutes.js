const express = require('express');
const webformController = require('../controllers/webformController');

const router = express.Router();



// Route to create a new webform
router.post('/webforms', webformController.createWebForm);
// Route to get formData from database
router.get('/webforms/:token' ,webformController.getWebForm)
// Route to log interaction
router.get('/webforms/interaction/:token', webformController.Interaction);

// Route to handle to get formData through token
router.get('/webforms/html/:token', webformController.getWebFormByHtml);

// Route to get form summary by template ID
router.get('/webforms/template/:templateId', webformController.getFormsByTemplateId);

// Route to get all form data by template ID
router.get('/webforms', webformController.getAllForms);

//Route submit to lead
router.post('/webforms/:token', webformController.submitWebFormByToken);

// Route to update the web form by templateId (PUT request)
router.put('/webforms/template/:templateId', webformController.updateWebForm);

// Route to delete the web form by templateId 
router.delete('/webforms/template/:templateId', webformController.deleteFormById);



module.exports = router;

