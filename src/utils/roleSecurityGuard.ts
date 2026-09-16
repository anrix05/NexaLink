export function updateMentorshipStatusTest(
  requestId: string,
  status: 'Accepted' | 'Declined' | 'Completed',
  callerRole: string
) {
  if (callerRole === 'student' && (status === 'Accepted' || status === 'Declined')) {
    return {
      success: false,
      statusCode: 403,
      error: "403 Forbidden: Permission denied for student session token. Advisor portal route is restricted."
    };
  }

  return {
    success: true,
    statusCode: 200,
    message: `Request ${requestId} status updated to ${status}`
  };
}

export function addJobTest(jobTitle: string, callerRole: string) {
  if (callerRole === 'student') {
    return {
      success: false,
      statusCode: 403,
      error: "403 Forbidden: Permission denied. Only Alumni and Faculty roles can publish opportunities."
    };
  }

  return {
    success: true,
    statusCode: 200,
    message: `Opportunity "${jobTitle}" submitted by ${callerRole}`
  };
}

export function isRoleAllowedTest(allowedRoles: string[], currentRole: string) {
  return allowedRoles.includes(currentRole);
}

export function filterDirectoryResultsTest(directory: Array<{ id: string; name: string }>, currentUserId: string, currentUserName: string) {
  return directory.filter(u => u.id !== currentUserId && u.name.toLowerCase() !== currentUserName.toLowerCase());
}
