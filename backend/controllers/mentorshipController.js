/**
 * Mentorship Controller for AlumniConnect
 */

const getRequests = (req, res) => {
  res.json({
    success: true,
    requests: []
  });
};

const createRequest = (req, res) => {
  const { studentId, mentorId, purposeOfRequest, areaOfGuidance, message } = req.body;
  if (!studentId || !mentorId || !purposeOfRequest) {
    return res.status(400).json({ error: 'Missing mandatory mentorship fields' });
  }

  res.status(201).json({
    success: true,
    message: 'Mentorship request submitted successfully.',
    requestId: `req-${Date.now()}`
  });
};

const updateStatus = (req, res) => {
  const { id } = req.params;
  const { status, declineReason } = req.body;

  res.json({
    success: true,
    message: `Mentorship request ${id} updated to ${status}.`,
    id,
    status,
    declineReason
  });
};

module.exports = {
  getRequests,
  createRequest,
  updateStatus
};
