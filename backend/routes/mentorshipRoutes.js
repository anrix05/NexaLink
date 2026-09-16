const express = require('express');
const router = express.Router();
const mentorshipController = require('../controllers/mentorshipController');

router.get('/', mentorshipController.getRequests);
router.post('/', mentorshipController.createRequest);
router.patch('/:id/status', mentorshipController.updateStatus);

module.exports = router;
