/**
 * Job & Opportunities Controller for AlumniConnect
 */

const getJobs = (req, res) => {
  res.json({
    success: true,
    jobs: []
  });
};

const createJob = (req, res) => {
  const { title, company, type, stipendOrSalary, description } = req.body;
  if (!title || !company || !type) {
    return res.status(400).json({ error: 'Missing required opportunity fields' });
  }

  res.status(201).json({
    success: true,
    message: 'Opportunity posted. Moderation status: Pending Approval',
    jobId: `job-${Date.now()}`
  });
};

const applyJob = (req, res) => {
  const { id } = req.params;
  const { studentId, studentName } = req.body;

  res.status(200).json({
    success: true,
    message: `Application submitted for opportunity ID ${id}`,
    applicationId: `app-${Date.now()}`
  });
};

module.exports = {
  getJobs,
  createJob,
  applyJob
};
