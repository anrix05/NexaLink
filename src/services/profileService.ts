/**
 * NexaLink — Profile Service & Canonical Mappers
 * 
 * Centralized service for mapping database rows (snake_case) to application profiles (camelCase),
 * validating editable fields per role, and performing verified mutations with .select() and onConflict.
 */

import { supabase } from '../lib/supabase.ts';
import { runQuery, runMutation } from './supabaseRunner.ts';
import type { User, StudentProfile, AlumniProfile, FacultyProfile, UserRole, UserPrivacySettings } from '../types/index.ts';

export interface ProfileDbRow {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string | null;
  phone?: string | null;
  department?: string | null;
  bio?: string | null;
  personal_email?: string | null;
  enrollment_no?: string | null;
  employee_id?: string | null;
  privacy_settings?: UserPrivacySettings | null;
  is_verified?: boolean;
  verification_status?: string;
  rejection_reason?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StudentDbRow {
  user_id: string;
  prn?: string | null;
  enrollment_no: string;
  current_year: string;
  semester: string;
  cgpa?: number;
  skills?: string[];
  areas_of_interest?: string[];
  career_goal?: string;
  preferred_industry?: string;
  preferred_higher_studies?: string;
  certifications?: string[];
  projects?: any[];
  target_companies?: string[];
  resume_url?: string | null;
  linkedin?: string | null;
  github?: string | null;
  mentor_id?: string | null;
  expected_graduation_year?: number;
}

export interface AlumniDbRow {
  user_id: string;
  prn?: string | null;
  enrollment_no: string;
  graduation_year: number;
  company: string;
  designation: string;
  higher_education_institute?: string | null;
  higher_studies?: any;
  location: string;
  country: string;
  skills?: string[];
  experience?: any[];
  certifications?: string[];
  professional_achievements?: string[];
  bio?: string;
  linkedin?: string | null;
  github?: string | null;
  resume_url?: string | null;
  is_mentoring_available: boolean;
  max_mentees: number;
  active_mentees_count?: number;
  personal_email?: string | null;
}

export interface FacultyDbRow {
  user_id: string;
  employee_id: string;
  designation: string;
  research_areas?: string[];
  ongoing_research?: string | null;
  skills?: string[];
}

/**
 * Normalizes database snake_case columns into typed camelCase User/RoleProfile.
 */
export function mapUserDbToProfile(
  userData: Partial<ProfileDbRow>,
  roleData?: Partial<StudentDbRow & AlumniDbRow & FacultyDbRow> | null
): User | StudentProfile | AlumniProfile | FacultyProfile {
  const role = (userData.role || 'student') as UserRole;

  const baseUser: User = {
    id: userData.id || '',
    name: userData.name || '',
    email: userData.email || '',
    personalEmail: userData.personal_email || undefined,
    role,
    department: (userData.department as any) || 'CMPN',
    avatar: (userData.avatar_url && !userData.avatar_url.includes('photo-1535713875002') ? userData.avatar_url : '') || '',
    phone: userData.phone || undefined,
    bio: userData.bio || undefined,
    isVerified: userData.is_verified ?? false,
    verificationStatus: (userData.verification_status as any) || 'Pending Verification',
    isActive: userData.is_active ?? true,
    privacySettings: userData.privacy_settings || {
      email: 'public',
      phone: 'private',
      company: 'public',
      higherEd: 'public'
    },
    createdAt: userData.created_at || new Date().toISOString()
  };

  if (role === 'student') {
    const s = roleData as Partial<StudentDbRow> | undefined;
    const studentProfile: StudentProfile = {
      ...baseUser,
      role: 'student',
      enrollmentNo: s?.enrollment_no || userData.enrollment_no || '',
      prn: s?.prn || s?.enrollment_no || userData.enrollment_no || '',
      currentYear: ((s?.current_year || 'FE') as any),
      semester: ((s?.semester || 'Semester 1') as any),
      cgpa: 0,
      skills: s?.skills || [],
      areasOfInterest: s?.areas_of_interest || [],
      careerGoal: s?.career_goal || '',
      preferredIndustry: s?.preferred_industry || '',
      preferredHigherStudies: s?.preferred_higher_studies || '',
      certifications: s?.certifications || [],
      projects: [],
      targetCompanies: [],
      resumeUrl: s?.resume_url || undefined,
      expectedGraduationYear: s?.expected_graduation_year || undefined
    };
    return studentProfile;
  }

  if (role === 'alumni') {
    const a = roleData as Partial<AlumniDbRow> | undefined;
    const alumniProfile: AlumniProfile = {
      ...baseUser,
      role: 'alumni',
      enrollmentNo: a?.enrollment_no || userData.enrollment_no || '',
      graduationYear: a?.graduation_year || new Date().getFullYear(),
      company: a?.company || '',
      designation: a?.designation || '',
      location: a?.location || 'Mumbai, India',
      country: a?.country || 'India',
      skills: a?.skills || [],
      experience: [],
      certifications: [],
      activeMenteesCount: 0,
      bio: userData.bio || '',
      higherEducationInstitute: a?.higher_education_institute || undefined,
      professionalAchievements: a?.professional_achievements || [],
      isMentoringAvailable: a?.is_mentoring_available ?? true,
      maxMentees: a?.max_mentees ?? 3,
      resumeUrl: a?.resume_url || undefined,
      personalEmail: a?.personal_email || userData.personal_email || undefined
    };
    return alumniProfile;
  }

  if (role === 'faculty' || role === 'teacher') {
    const f = roleData as Partial<FacultyDbRow> | undefined;
    const facultyProfile: FacultyProfile = {
      ...baseUser,
      role: 'faculty',
      employeeId: f?.employee_id || userData.employee_id || '',
      designation: f?.designation || 'Professor',
      specialization: 'Computer Engineering',
      researchAreas: f?.research_areas || [],
      subjectsTaught: [],
      publications: [],
      industryInterests: [],
      ongoingResearch: f?.ongoing_research || '',
      skills: f?.skills || []
    };
    return facultyProfile;
  }

  return baseUser;
}

/**
 * Whitelist of editable fields per role to prevent privilege escalation
 */
const BASE_EDITABLE_FIELDS = new Set([
  'name',
  'bio',
  'avatar',
  'avatar_url',
  'phone',
  'department',
  'personalEmail',
  'personal_email',
  'privacySettings',
  'privacy_settings'
]);

const STUDENT_EDITABLE_FIELDS = new Set([
  'semester',
  'currentYear',
  'current_year',
  'skills',
  'areasOfInterest',
  'areas_of_interest',
  'careerGoal',
  'career_goal',
  'preferredIndustry',
  'preferred_industry',
  'preferredHigherStudies',
  'preferred_higher_studies',
  'certifications',
  'resumeUrl',
  'resume_url',
  'expectedGraduationYear',
  'expected_graduation_year'
]);

const ALUMNI_EDITABLE_FIELDS = new Set([
  'graduationYear',
  'graduation_year',
  'company',
  'designation',
  'higherEducationInstitute',
  'higher_education_institute',
  'location',
  'country',
  'skills',
  'professionalAchievements',
  'professional_achievements',
  'resumeUrl',
  'resume_url',
  'isMentoringAvailable',
  'is_mentoring_available',
  'maxMentees',
  'max_mentees'
]);

const FACULTY_EDITABLE_FIELDS = new Set([
  'employeeId',
  'employee_id',
  'designation',
  'researchAreas',
  'research_areas',
  'ongoingResearch',
  'ongoing_research',
  'skills'
]);

export interface SaveProfilePatch {
  name?: string;
  bio?: string;
  avatar?: string | null;
  phone?: string;
  department?: string;
  personalEmail?: string;
  privacySettings?: UserPrivacySettings;
  // Student
  semester?: string;
  currentYear?: string;
  skills?: string[];
  areasOfInterest?: string[];
  careerGoal?: string;
  preferredIndustry?: string;
  preferredHigherStudies?: string;
  certifications?: string[];
  resumeUrl?: string | null;
  expectedGraduationYear?: number;
  // Alumni
  graduationYear?: number;
  company?: string;
  designation?: string;
  higherEducationInstitute?: string;
  location?: string;
  country?: string;
  professionalAchievements?: string[];
  isMentoringAvailable?: boolean;
  maxMentees?: number;
  // Faculty
  employeeId?: string;
  researchAreas?: string[];
  ongoingResearch?: string;
}

export const profileService = {
  /**
   * Authoritative profile loader from Supabase.
   */
  async getProfile(userId: string): Promise<User | StudentProfile | AlumniProfile | FacultyProfile | null> {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('[profileService.getProfile] Failed to fetch users row:', userError);
      return null;
    }

    let roleData: any = null;
    if (userData.role === 'student') {
      const { data } = await supabase.from('student_profiles').select('*').eq('user_id', userId).maybeSingle();
      roleData = data;
    } else if (userData.role === 'alumni') {
      const { data } = await supabase.from('alumni_profiles').select('*').eq('user_id', userId).maybeSingle();
      roleData = data;
    } else if (userData.role === 'faculty' || userData.role === 'teacher') {
      const { data } = await supabase.from('faculty_profiles').select('*').eq('user_id', userId).maybeSingle();
      roleData = data;
    }

    return mapUserDbToProfile(userData, roleData);
  },

  /**
   * Saves profile changes with strict whitelisting, .select() verification, and upsert for role tables.
   */
  async saveProfile(
    userId: string,
    role: UserRole,
    patch: SaveProfilePatch
  ): Promise<{ success: boolean; profile?: User | StudentProfile | AlumniProfile | FacultyProfile; error?: string }> {
    try {
      // 1. Prepare public.users updates (whitelisted)
      const userUpdates: Record<string, any> = {};
      if (patch.name !== undefined) userUpdates.name = patch.name.trim();
      if (patch.bio !== undefined) userUpdates.bio = patch.bio.trim();
      if (patch.avatar !== undefined) userUpdates.avatar_url = patch.avatar;
      if (patch.phone !== undefined) userUpdates.phone = patch.phone.trim();
      if (patch.department !== undefined) userUpdates.department = patch.department;
      if (patch.personalEmail !== undefined) {
        userUpdates.personal_email = patch.personalEmail.trim().toLowerCase() || null;
      }
      if (patch.privacySettings !== undefined) {
        userUpdates.privacy_settings = patch.privacySettings;
      }

      // Execute users update if fields exist
      if (Object.keys(userUpdates).length > 0) {
        const { data: updatedUsers, error: userUpdateErr } = await supabase
          .from('users')
          .update(userUpdates as any)
          .eq('id', userId)
          .select('id, name, email, role, phone, personal_email, bio, department, avatar_url, privacy_settings');

        if (userUpdateErr) {
          console.error('[profileService.saveProfile] users update error:', userUpdateErr);
          return { success: false, error: userUpdateErr.message || 'Failed to update user profile.' };
        }
        if (!updatedUsers || updatedUsers.length === 0) {
          return { success: false, error: 'User record not found or permission denied.' };
        }
      }

      // 2. Prepare and execute role-specific upsert (ensures no silent update drop if row didn't exist)
      if (role === 'student') {
        const studentPayload: Record<string, any> = { user_id: userId };
        if (patch.semester !== undefined) {
          studentPayload.semester = patch.semester;
          studentPayload.current_year = patch.semester.includes('1') || patch.semester.includes('2') ? 'FE'
            : patch.semester.includes('3') || patch.semester.includes('4') ? 'SE'
            : patch.semester.includes('5') || patch.semester.includes('6') ? 'TE'
            : 'BE';
        }
        if (patch.skills !== undefined) studentPayload.skills = patch.skills;
        if (patch.areasOfInterest !== undefined) studentPayload.areas_of_interest = patch.areasOfInterest;
        if (patch.careerGoal !== undefined) studentPayload.career_goal = patch.careerGoal;
        if (patch.preferredIndustry !== undefined) studentPayload.preferred_industry = patch.preferredIndustry;
        if (patch.preferredHigherStudies !== undefined) studentPayload.preferred_higher_studies = patch.preferredHigherStudies;
        if (patch.certifications !== undefined) studentPayload.certifications = patch.certifications;
        if (patch.resumeUrl !== undefined) studentPayload.resume_url = patch.resumeUrl;
        if (patch.expectedGraduationYear !== undefined) studentPayload.expected_graduation_year = patch.expectedGraduationYear;

        // Ensure enrollment_no is preserved on upsert
        if (!studentPayload.enrollment_no) {
          const { data: existing } = await supabase.from('student_profiles').select('enrollment_no').eq('user_id', userId).maybeSingle();
          studentPayload.enrollment_no = existing?.enrollment_no || '22101A0099';
        }

        const { data: upsertedStudent, error: sErr } = await supabase
          .from('student_profiles')
          .upsert(studentPayload as any, { onConflict: 'user_id' })
          .select('user_id, semester, current_year, skills, areas_of_interest, career_goal, preferred_industry, preferred_higher_studies, resume_url');

        if (sErr) {
          console.error('[profileService.saveProfile] student_profiles upsert error:', sErr);
          return { success: false, error: sErr.message || 'Failed to update student profile.' };
        }
        if (!upsertedStudent || upsertedStudent.length === 0) {
          return { success: false, error: 'Failed to verify saved student details.' };
        }
      } else if (role === 'alumni') {
        const alumniPayload: Record<string, any> = { user_id: userId };
        if (patch.company !== undefined) alumniPayload.company = patch.company;
        if (patch.designation !== undefined) alumniPayload.designation = patch.designation;
        if (patch.graduationYear !== undefined) alumniPayload.graduation_year = patch.graduationYear;
        if (patch.higherEducationInstitute !== undefined) alumniPayload.higher_education_institute = patch.higherEducationInstitute;
        if (patch.location !== undefined) alumniPayload.location = patch.location;
        if (patch.country !== undefined) alumniPayload.country = patch.country;
        if (patch.skills !== undefined) alumniPayload.skills = patch.skills;
        if (patch.professionalAchievements !== undefined) alumniPayload.professional_achievements = patch.professionalAchievements;
        if (patch.isMentoringAvailable !== undefined) alumniPayload.is_mentoring_available = patch.isMentoringAvailable;
        if (patch.maxMentees !== undefined) alumniPayload.max_mentees = patch.maxMentees;
        if (patch.resumeUrl !== undefined) alumniPayload.resume_url = patch.resumeUrl;

        // Ensure required fields on alumni_profiles are populated if inserting first time
        if (!alumniPayload.enrollment_no) {
          const { data: existing } = await supabase.from('alumni_profiles').select('enrollment_no, company, designation, graduation_year').eq('user_id', userId).maybeSingle();
          alumniPayload.enrollment_no = existing?.enrollment_no || 'ALUMNI';
          if (!alumniPayload.company && existing?.company) alumniPayload.company = existing.company;
          if (!alumniPayload.designation && existing?.designation) alumniPayload.designation = existing.designation;
          if (!alumniPayload.graduation_year && existing?.graduation_year) alumniPayload.graduation_year = existing.graduation_year;
        }

        const { data: upsertedAlumni, error: aErr } = await supabase
          .from('alumni_profiles')
          .upsert(alumniPayload as any, { onConflict: 'user_id' })
          .select('user_id, company, designation, graduation_year, is_mentoring_available, max_mentees');

        if (aErr) {
          console.error('[profileService.saveProfile] alumni_profiles upsert error:', aErr);
          return { success: false, error: aErr.message || 'Failed to update alumni profile.' };
        }
        if (!upsertedAlumni || upsertedAlumni.length === 0) {
          return { success: false, error: 'Failed to verify saved alumni details.' };
        }
      } else if (role === 'faculty' || role === 'teacher') {
        const facultyPayload: Record<string, any> = { user_id: userId };
        if (patch.employeeId !== undefined) facultyPayload.employee_id = patch.employeeId;
        if (patch.designation !== undefined) facultyPayload.designation = patch.designation;
        if (patch.researchAreas !== undefined) facultyPayload.research_areas = patch.researchAreas;
        if (patch.ongoingResearch !== undefined) facultyPayload.ongoing_research = patch.ongoingResearch;
        if (patch.skills !== undefined) facultyPayload.skills = patch.skills;

        if (!facultyPayload.employee_id) {
          const { data: existing } = await supabase.from('faculty_profiles').select('employee_id').eq('user_id', userId).maybeSingle();
          facultyPayload.employee_id = existing?.employee_id || 'FACULTY';
        }

        const { data: upsertedFaculty, error: fErr } = await supabase
          .from('faculty_profiles')
          .upsert(facultyPayload as any, { onConflict: 'user_id' })
          .select('user_id, employee_id, designation, research_areas');

        if (fErr) {
          console.error('[profileService.saveProfile] faculty_profiles upsert error:', fErr);
          return { success: false, error: fErr.message || 'Failed to update faculty profile.' };
        }
        if (!upsertedFaculty || upsertedFaculty.length === 0) {
          return { success: false, error: 'Failed to verify saved faculty details.' };
        }
      }

      // 3. Re-fetch full profile to ensure authoritative round-trip hydration
      const freshProfile = await profileService.getProfile(userId);
      return { success: true, profile: freshProfile || undefined };
    } catch (err: any) {
      console.error('[profileService.saveProfile] Exception:', err);
      return { success: false, error: err.message || 'Unexpected network error saving profile.' };
    }
  }
};
