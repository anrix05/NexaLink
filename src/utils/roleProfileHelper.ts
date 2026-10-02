import type { AlumniProfile, FacultyProfile, StudentProfile, User } from '../types';

export interface ProfileFieldItem {
  label: string;
  value: string | React.ReactNode;
}

/**
 * Returns role-appropriate fields for member profile display without cross-role field leakage.
 */
export function getRoleSpecificFields(user: User | AlumniProfile | FacultyProfile | StudentProfile): ProfileFieldItem[] {
  const fields: ProfileFieldItem[] = [];
  const role = (user as any).userType || user.role;

  if (role === 'faculty') {
    const f = user as FacultyProfile;
    if (f.designation) {
      fields.push({ label: 'Designation', value: f.designation });
    }
    if (f.department) {
      fields.push({ label: 'Department', value: f.department });
    }
    if (f.specialization) {
      fields.push({ label: 'Specialization', value: f.specialization });
    }
    if (f.researchAreas && f.researchAreas.length > 0) {
      fields.push({ label: 'Research areas', value: f.researchAreas.join(', ') });
    }
    if (f.subjectsTaught && f.subjectsTaught.length > 0) {
      fields.push({ label: 'Subjects taught', value: f.subjectsTaught.join(', ') });
    }
    if (f.ongoingResearch) {
      fields.push({ label: 'Ongoing research', value: f.ongoingResearch });
    }
    if (f.publications && f.publications.length > 0) {
      fields.push({
        label: 'Publications',
        value: `${f.publications.length} published paper${f.publications.length > 1 ? 's' : ''}`
      });
    }
  } else if (role === 'alumni') {
    const a = user as AlumniProfile;
    if (a.company || a.designation) {
      fields.push({
        label: 'Current organization',
        value: [a.designation, a.company].filter(Boolean).join(' at ')
      });
    }
    if (a.graduationYear) {
      fields.push({ label: 'Graduation', value: `Class of ${a.graduationYear}` });
    }
    if (a.location) {
      fields.push({ label: 'Location', value: a.location });
    }
    if (a.higherEducationInstitute || a.higherStudies?.university) {
      fields.push({
        label: 'Higher education',
        value: a.higherEducationInstitute || a.higherStudies?.university || '—'
      });
    }
    if (a.professionalAchievements && a.professionalAchievements.length > 0) {
      fields.push({
        label: 'Key achievements',
        value: a.professionalAchievements.slice(0, 2).join(' · ')
      });
    }
  } else if (role === 'student') {
    const s = user as StudentProfile;
    if (s.department) {
      fields.push({ label: 'Department', value: s.department });
    }
    if (s.currentYear || s.semester) {
      fields.push({ label: 'Academic standing', value: [s.currentYear, s.semester].filter(Boolean).join(' · ') });
    }
    if (s.areasOfInterest && s.areasOfInterest.length > 0) {
      fields.push({ label: 'Areas of interest', value: s.areasOfInterest.join(', ') });
    }
  }

  return fields;
}
