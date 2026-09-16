/**
 * Auth Controller for AlumniConnect
 */

const login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Derive role and authentication response
  let role = 'student';
  if (email.includes('admin@')) role = 'admin';
  else if (email.includes('alumni.')) role = 'alumni';
  else if (email.includes('sangale@') || email.includes('faculty.')) role = 'faculty';

  res.json({
    success: true,
    token: `token_${Date.now()}`,
    user: {
      email,
      role,
      name: email.split('@')[0].replace('.', ' ')
    }
  });
};

const register = (req, res) => {
  const { name, email, role, department, enrollmentNo, employeeId } = req.body;
  if (!name || !email || !role || !department) {
    return res.status(400).json({ error: 'Missing mandatory registration fields' });
  }

  res.status(201).json({
    success: true,
    message: 'Account registered successfully! Verification status: Pending Verification',
    user: { name, email, role, department, enrollmentNo, employeeId, verificationStatus: 'Pending Verification' }
  });
};

module.exports = {
  login,
  register
};
