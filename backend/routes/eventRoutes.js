const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

router.get('/', eventController.getEvents);
router.post('/', eventController.createEvent);
router.post('/:id/rsvp', eventController.rsvpEvent);

module.exports = router;
