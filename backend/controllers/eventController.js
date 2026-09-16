/**
 * Event Controller for AlumniConnect
 */

const getEvents = (req, res) => {
  res.json({
    success: true,
    events: []
  });
};

const createEvent = (req, res) => {
  const { title, type, date, time, locationOrUrl } = req.body;
  if (!title || !date) {
    return res.status(400).json({ error: 'Missing mandatory event parameters' });
  }

  res.status(201).json({
    success: true,
    message: 'Institutional event created successfully.',
    eventId: `evt-${Date.now()}`
  });
};

const rsvpEvent = (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  res.json({
    success: true,
    message: `RSVP registered for event ID ${id}`,
    eventId: id,
    userId
  });
};

module.exports = {
  getEvents,
  createEvent,
  rsvpEvent
};
