import type {
  User,
  StudentProfile,
  AlumniProfile,
  FacultyProfile,
  JobListing,
  EventItem,
  MentorshipRequest,
  Announcement,
  ChatMessage,
  NotificationItem,
  OpportunityApplication,
  EventRsvp,
  AdminInvite,
  AuditLogEntry,
  DepartmentCode,
  EventType,
  NotificationType
} from '../../types';
import { SeededRandom } from './random';
import { generateSvgAvatar, generateSampleDocumentSvg } from './avatars';
import {
  daysAgo,
  daysFromNow,
  hoursAgo,
  dateOnlyString
} from './time';
import {
  DEPARTMENTS,
  DEPARTMENT_NAMES,
  EMPLOYERS,
  FIRST_NAMES_MALE,
  FIRST_NAMES_FEMALE,
  LAST_NAMES,
  SKILLS_BY_DEPARTMENT,
  CAREER_GOALS
} from './lists';

export interface GeneratedSeedData {
  demoAdmin: User;
  demoAdmin2: User;
  demoAlumni: AlumniProfile;
  demoStudent: StudentProfile;
  demoFaculty: FacultyProfile;
  adminInvites: AdminInvite[];
  students: StudentProfile[];
  alumni: AlumniProfile[];
  faculty: FacultyProfile[];
  jobs: JobListing[];
  events: EventItem[];
  mentorshipRequests: MentorshipRequest[];
  announcements: Announcement[];
  notifications: NotificationItem[];
  messages: ChatMessage[];
  applications: OpportunityApplication[];
  rsvps: EventRsvp[];
  auditLogs: AuditLogEntry[];
}

export function buildDeterministicSeed(): GeneratedSeedData {
  const rng = new SeededRandom(20261009); // Fixed seed for reproducible generation

  // ==========================================================================
  // 1. HEADLINE PERSONAS (Existing IDs preserved)
  // ==========================================================================

  const demoAdmin: User = {
    id: 'user-admin-1',
    name: 'Dr. Sunita Rawat',
    email: 'admin@vit.edu.in',
    role: 'admin',
    department: 'CMPN',
    employeeId: 'EMP-ADMIN-001',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    phone: '+91 98200 12345',
    isVerified: true,
    verificationStatus: 'Verified',
    isActive: true,
    bio: 'Dean of Alumni Relations & Institutional Placement Head, VIT Wadala.'
  };

  const demoAdmin2: User = {
    id: 'user-admin-2',
    name: 'Prof. Rajesh Kumar',
    email: 'rajesh.kumar@vit.edu.in',
    role: 'admin',
    department: 'INFT',
    employeeId: 'EMP-ADMIN-002',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    phone: '+91 98200 99887',
    isVerified: true,
    verificationStatus: 'Verified',
    isActive: true,
    bio: 'Co-Director of Institutional Governance & Research Cell, VIT Wadala.'
  };

  const demoAlumni: AlumniProfile = {
    id: 'user-alumni-1',
    name: 'Rushabh Sanghavi',
    email: 'rushabh.sanghavi@gmail.com',
    institutionalEmail: 'rushabh.sanghavi@alumni.vit.edu.in',
    role: 'alumni',
    department: 'CMPN',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    graduationYear: 2018,
    enrollmentNo: '14101A0045',
    prn: '14101A0045',
    company: 'Google',
    designation: 'Senior Software Engineer',
    higherEducationInstitute: 'Carnegie Mellon University',
    location: 'Sunnyvale, CA',
    country: 'USA',
    skills: ['Distributed Systems', 'Go', 'Kubernetes', 'Cloud AI', 'System Design'],
    experience: [
      { title: 'Senior Software Engineer', company: 'Google', duration: '2021 - Present', description: 'GCP Core Compute' },
      { title: 'Software Engineer II', company: 'Microsoft', duration: '2018 - 2021', description: 'Azure Infrastructure' }
    ],
    certifications: ['AWS Certified Solutions Architect', 'Google Cloud Professional Cloud Architect'],
    professionalAchievements: [
      'Published IEEE paper on Distributed Consensus algorithms',
      'Tech Lead for Google Cloud Global Reliability team'
    ],
    higherStudies: {
      degree: 'M.S. in Computer Science',
      university: 'Carnegie Mellon University',
      country: 'USA',
      year: 2020,
      fieldOfStudy: 'Distributed Systems'
    },
    bio: "VIT provided the best platform and infrastructure through its digitally equipped campus. I always feel connected with my alma mater because of VIT's Alumni Association.",
    isMentoringAvailable: true,
    maxMentees: 5,
    activeMenteesCount: 3,
    isVerified: true,
    verificationStatus: 'Verified',
    isActive: true,
    personalEmail: 'rushabh.sanghavi@gmail.com',
    phone: '+91 98201 67890'
  };

  const demoStudent: StudentProfile = {
    id: 'user-student-1',
    name: 'Aanya Patel',
    email: 'aanya.patel@gmail.com',
    institutionalEmail: 'aanya.patel@student.vit.edu.in',
    role: 'student',
    department: 'CMPN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    graduationYear: 2024,
    expectedGraduationYear: 2024,
    prn: '22102A0042',
    enrollmentNo: '22102A0042',
    currentYear: 'BE',
    semester: 'Semester 7',
    cgpa: 9.42,
    skills: ['React', 'Node.js', 'Python', 'Machine Learning', 'System Design'],
    areasOfInterest: ['Distributed Systems', 'Cloud AI', 'Full-Stack Web Development'],
    careerGoal: 'Software Engineer (SDE-1) at Tier-1 Global Tech Firm or US Higher Studies',
    preferredIndustry: 'Cloud Computing & FinTech',
    preferredHigherStudies: 'M.S. in Computer Science (USA / Europe)',
    certifications: ['AWS Certified Cloud Practitioner', 'Google Data Engineering Specialization'],
    projects: [
      { title: 'Distributed Fault-Tolerant Cache', description: 'Built in Go with Raft consensus protocol.', techStack: ['Go', 'Raft', 'Docker'] },
      { title: 'NexaLink Portal', description: 'Full-stack platform connecting students and alumni.', techStack: ['React', 'TypeScript', 'Tailwind'] }
    ],
    targetCompanies: ['Google', 'Microsoft', 'Morgan Stanley'],
    resumeUrl: 'https://vit.edu.in/resumes/aanya_patel_vit.pdf',
    isVerified: true,
    verificationStatus: 'Verified',
    isActive: true,
    bio: 'Final year CMPN student passionate about large-scale backend systems and cloud infrastructure.'
  };

  const demoFaculty: FacultyProfile = {
    id: 'user-faculty-1',
    name: 'Dr. Ravindra Sangale',
    email: 'ravindra.sangale@vit.edu.in',
    institutionalEmail: 'ravindra.sangale@vit.edu.in',
    role: 'faculty',
    department: 'CMPN',
    employeeId: 'EMP-FAC-014',
    designation: 'Head of Department (HOD) & Professor',
    isHod: true,
    specialization: 'Distributed Operating Systems, Cloud Computing & Network Security',
    researchAreas: ['Cloud Infrastructure', 'Distributed Operating Systems', 'Cybersecurity in IoT'],
    subjectsTaught: ['Distributed Systems', 'Operating Systems', 'Advanced Cloud Architectures'],
    publications: [
      { title: 'Scalable Consensus in Heterogeneous Edge Networks', journalOrConference: 'IEEE Transactions on Cloud Computing', year: 2024 },
      { title: 'Resource Management in Cloud Datacenters', journalOrConference: 'Springer Journal of Supercomputing', year: 2022 }
    ],
    skills: ['Go', 'C++', 'Kubernetes', 'Linux Kernel Internals', 'Python'],
    industryInterests: ['Enterprise Cloud Systems', 'Edge Computing Partnerships'],
    ongoingResearch: 'Autonomous Micro-datacenter Scheduling using Reinforcement Learning',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
    phone: '+91 98201 11223',
    isVerified: true,
    verificationStatus: 'Verified',
    isActive: true,
    isMentoringAvailable: true,
    maxMentees: 5,
    bio: 'HOD Computer Engineering at VIT Wadala with 20+ years of teaching and industrial consultancy experience.'
  };

  // ==========================================================================
  // 2. EXTRA DEV PERSONAS
  // ==========================================================================

  const devStudentNew: StudentProfile = {
    id: 'user-student-karan',
    name: 'Karan Mehta',
    email: 'karan.mehta@example.com',
    institutionalEmail: 'karan.mehta@student.vit.edu.in',
    personalEmail: 'karan.mehta@example.com',
    role: 'student',
    department: 'INFT',
    avatar: generateSvgAvatar('Karan Mehta', 101),
    graduationYear: 2026,
    expectedGraduationYear: 2026,
    prn: '24103A0012',
    enrollmentNo: '24103A0012',
    currentYear: 'SE',
    semester: 'Semester 3',
    cgpa: 7.85,
    skills: ['Java', 'SQL'],
    areasOfInterest: ['Cloud Computing'],
    careerGoal: 'Explore software engineering internships and open-source contributions.',
    preferredIndustry: 'Information Technology',
    preferredHigherStudies: 'Undecided',
    certifications: [],
    projects: [],
    targetCompanies: ['TCS', 'Infosys'],
    isVerified: true,
    verificationStatus: 'Verified',
    isActive: true,
    bio: 'Second year IT student excited to start connecting with alumni mentors.'
  };

  const devStudentPending: StudentProfile = {
    id: 'user-student-pending',
    name: 'Aarav Deshpande',
    email: 'aarav.deshpande@example.com',
    institutionalEmail: 'aarav.deshpande@student.vit.edu.in',
    personalEmail: 'aarav.deshpande@example.com',
    role: 'student',
    department: 'EXTC',
    avatar: generateSvgAvatar('Aarav Deshpande', 102),
    graduationYear: 2027,
    expectedGraduationYear: 2027,
    prn: '25104A0033',
    enrollmentNo: '25104A0033',
    currentYear: 'FE',
    semester: 'Semester 1',
    cgpa: 8.1,
    skills: ['C++', 'Python'],
    areasOfInterest: ['Embedded Systems'],
    careerGoal: 'Hardware-software co-design engineering.',
    preferredIndustry: 'Semiconductors',
    preferredHigherStudies: 'M.S. in Embedded Systems',
    certifications: [],
    projects: [],
    targetCompanies: ['Qualcomm', 'Intel'],
    isVerified: false,
    verificationStatus: 'Pending Verification',
    isActive: true,
    bio: 'First year EXTC student awaiting institutional registrar credentials validation.'
  };

  const devStudentRejected: StudentProfile = {
    id: 'user-student-rejected',
    name: 'Rohan Gupta',
    email: 'rohan.gupta@example.com',
    institutionalEmail: 'rohan.gupta@student.vit.edu.in',
    personalEmail: 'rohan.gupta@example.com',
    role: 'student',
    department: 'EXCS',
    avatar: generateSvgAvatar('Rohan Gupta', 103),
    graduationYear: 2025,
    expectedGraduationYear: 2025,
    prn: '23105A0077',
    enrollmentNo: '23105A0077',
    currentYear: 'TE',
    semester: 'Semester 5',
    cgpa: 6.9,
    skills: ['Python', 'Linux'],
    areasOfInterest: ['Robotics'],
    careerGoal: 'Robotics automation and industrial telemetry.',
    preferredIndustry: 'Automotive & Robotics',
    preferredHigherStudies: 'Undecided',
    certifications: [],
    projects: [],
    targetCompanies: ['Tata Motors'],
    isVerified: false,
    verificationStatus: 'Rejected',
    rejectionReason: 'Submitted college ID image was unreadable and enrollment record PRN could not be matched with university database.',
    isActive: false,
    bio: 'Third year EXCS student.'
  };

  const devAlumni2: AlumniProfile = {
    id: 'user-alumni-vikram',
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@example.com',
    institutionalEmail: 'vikram.malhotra@alumni.vit.edu.in',
    personalEmail: 'vikram.malhotra@example.com',
    role: 'alumni',
    department: 'INFT',
    avatar: generateSvgAvatar('Vikram Malhotra', 104),
    graduationYear: 2017,
    enrollmentNo: '13102A0022',
    prn: '13102A0022',
    company: 'Microsoft',
    designation: 'Principal Engineering Manager',
    higherEducationInstitute: 'Technical University of Munich',
    location: 'Munich, Germany',
    country: 'Germany',
    skills: ['Cloud Architecture', 'Azure', 'Kubernetes', 'Go', 'Distributed Systems'],
    experience: [
      { title: 'Principal Engineering Manager', company: 'Microsoft', duration: '2022 - Present' },
      { title: 'Senior Software Engineer', company: 'Amazon', duration: '2017 - 2022' }
    ],
    certifications: ['Azure Solutions Architect Expert'],
    professionalAchievements: ['Led Azure EMEA edge networking modernization'],
    higherStudies: {
      degree: 'M.S. Informatics',
      university: 'Technical University of Munich',
      country: 'Germany',
      year: 2019,
      fieldOfStudy: 'Distributed Systems'
    },
    bio: 'Proud VIT IT alumnus leading cloud infrastructure teams across Europe.',
    isMentoringAvailable: false, // At capacity
    maxMentees: 4,
    activeMenteesCount: 4,
    isVerified: true,
    verificationStatus: 'Verified',
    isActive: true,
    phone: '+91 90000 01122'
  };

  const devFaculty2: FacultyProfile = {
    id: 'user-faculty-sneha',
    name: 'Prof. Sneha Deshpande',
    email: 'sneha.deshpande@example.com',
    institutionalEmail: 'sneha.deshpande@vit.edu.in',
    personalEmail: 'sneha.deshpande@example.com',
    role: 'faculty',
    department: 'EXTC',
    employeeId: 'EMP-FAC-048',
    designation: 'Assistant Professor',
    isHod: false,
    specialization: 'Embedded Systems & Wireless Sensor Networks',
    researchAreas: ['IoT Edge Computing', 'Low-power WAN protocols'],
    subjectsTaught: ['Microcontrollers and Interfacing', 'Digital Signal Processing'],
    publications: [
      { title: 'Energy-Efficient LoRa Mesh Routing for Smart Agro', journalOrConference: 'Springer Wireless Networks', year: 2023 }
    ],
    skills: ['C++', 'Embedded C', 'IoT', 'FPGA', 'Python'],
    industryInterests: ['Smart Cities', 'Precision Agriculture'],
    ongoingResearch: 'Autonomous sensor telemetry under intermittent connectivity',
    avatar: generateSvgAvatar('Prof. Sneha Deshpande', 105),
    phone: '+91 90000 03344',
    isVerified: true,
    verificationStatus: 'Verified',
    isActive: true,
    isMentoringAvailable: true,
    maxMentees: 4,
    bio: 'Assistant Professor at EXTC focusing on student hardware prototypes and embedded firmware mentorship.'
  };

  // ==========================================================================
  // 3. BULK STUDENTS (Total >= 60, all 5 departments, Sem 1 to 8, 24 openToOutreach)
  // ==========================================================================

  const students: StudentProfile[] = [
    demoStudent,
    devStudentNew,
    devStudentPending,
    devStudentRejected
  ];

  const years: ('FE' | 'SE' | 'TE' | 'BE')[] = ['FE', 'SE', 'TE', 'BE'];
  const semesterMap: Record<'FE' | 'SE' | 'TE' | 'BE', ('Semester 1' | 'Semester 2' | 'Semester 3' | 'Semester 4' | 'Semester 5' | 'Semester 6' | 'Semester 7' | 'Semester 8')[]> = {
    FE: ['Semester 1', 'Semester 2'],
    SE: ['Semester 3', 'Semester 4'],
    TE: ['Semester 5', 'Semester 6'],
    BE: ['Semester 7', 'Semester 8']
  };

  // Generate 58 more students to reach 62 total
  for (let i = 1; i <= 58; i++) {
    const isMale = rng.boolean();
    const firstName = isMale ? rng.pick(FIRST_NAMES_MALE) : rng.pick(FIRST_NAMES_FEMALE);
    const lastName = rng.pick(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const dept = DEPARTMENTS[(i - 1) % DEPARTMENTS.length];
    const year = years[(i - 1) % years.length];
    const semester = rng.pick(semesterMap[year]);
    const prnNumber = 20 + rng.intBetween(21, 25);
    const prn = `${prnNumber}10${(i % 5) + 1}A${String(100 + i).padStart(4, '0')}`;
    const emailPrefix = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}`;
    const cgpa = rng.floatBetween(6.8, 9.8, 2);
    const deptSkills = SKILLS_BY_DEPARTMENT[dept];
    const pickedSkills = rng.pickMultiple(deptSkills, rng.intBetween(3, 5));
    const careerGoal = rng.pick(CAREER_GOALS);
    
    // Exact graduation candidate distribution: 14 candidates past graduation (2024), 4 missing personal email
    const isGradCandidate = i <= 14;
    const gradYear = isGradCandidate ? 2024 : year === 'BE' ? 2025 : year === 'TE' ? 2026 : year === 'SE' ? 2027 : 2028;
    const isMissingPersonalEmail = isGradCandidate && i <= 4;
    const personalEmail = isMissingPersonalEmail ? null : `${emailPrefix}@example.com`;

    // Verification Queue Distribution:
    // 8 pending (plus devStudentPending and 1 in alumni = 10 total), 2 with clarification requested
    let verificationStatus: StudentProfile['verificationStatus'] = 'Verified';
    let isVerified = true;
    let clarificationRequested = undefined;
    let rejectionReason = undefined;
    let proofDocumentName: string | undefined = undefined;
    let verificationDocumentUrl: string | undefined = undefined;

    if (i <= 6) {
      verificationStatus = 'Pending Verification';
      isVerified = false;
      proofDocumentName = `enrollment_card_${emailPrefix}.pdf`;
      verificationDocumentUrl = generateSampleDocumentSvg('ENROLLMENT CREDENTIAL SAMPLE');
    } else if (i === 7 || i === 8) {
      verificationStatus = 'Needs Clarification';
      isVerified = false;
      clarificationRequested = {
        text: 'Please upload an attested copy of your current semester mark sheet showing official institutional seal.',
        reason: 'Mark sheet signature unclear',
        documentType: 'Semester Mark Sheet',
        requestedAt: daysAgo(i - 6, 2)
      };
      proofDocumentName = `clarification_specimen_${emailPrefix}.pdf`;
      verificationDocumentUrl = generateSampleDocumentSvg('SEMESTER MARKSHEET CLARIFICATION SAMPLE');
    } else if (i === 9 || i === 10 || i === 11) {
      // 3 more rejected (plus devStudentRejected = 4 rejected)
      verificationStatus = 'Rejected';
      isVerified = false;
      rejectionReason = 'Submitted document did not match institutional registrar records or PRN database.';
      proofDocumentName = `rejected_doc_${emailPrefix}.pdf`;
      verificationDocumentUrl = generateSampleDocumentSvg('REJECTED CREDENTIAL SPECIMEN');
    }

    students.push({
      id: `stud-${i + 1}`,
      name: fullName,
      email: `${emailPrefix}@student.vit.edu.in`,
      institutionalEmail: `${emailPrefix}@student.vit.edu.in`,
      personalEmail: personalEmail || undefined,
      role: 'student',
      department: dept,
      avatar: generateSvgAvatar(fullName, i + 100),
      graduationYear: gradYear,
      expectedGraduationYear: gradYear,
      prn,
      enrollmentNo: prn,
      currentYear: isGradCandidate ? 'BE' : year,
      semester: isGradCandidate ? 'Semester 8' : semester,
      cgpa,
      skills: pickedSkills,
      areasOfInterest: [deptSkills[0] || 'Software Engineering', deptSkills[1] || 'Cloud Infrastructure'],
      careerGoal,
      preferredIndustry: 'Technology & Engineering',
      preferredHigherStudies: i % 3 === 0 ? 'M.S. in Computer Science' : 'Immediate Industry Placement',
      certifications: i % 2 === 0 ? ['AWS Certified Cloud Practitioner'] : [],
      projects: [
        {
          title: `${dept} Capstone Prototype`,
          description: `Practical implementation in ${pickedSkills.slice(0, 2).join(' & ')}.`,
          techStack: pickedSkills.slice(0, 3)
        }
      ],
      targetCompanies: ['Google', 'Microsoft', 'TCS', 'Morgan Stanley'],
      resumeUrl: `https://vit.edu.in/resumes/${emailPrefix}_vit.pdf`,
      isVerified,
      verificationStatus,
      clarificationRequested,
      rejectionReason,
      proofDocumentName,
      verificationDocumentUrl,
      isActive: verificationStatus !== 'Rejected',
      bio: `${isGradCandidate ? 'Final-year BE' : year} ${DEPARTMENT_NAMES[dept]} student at VIT Wadala.`
    });
  }

  // ==========================================================================
  // 4. BULK ALUMNI (Total >= 30, batches 2015-2025, 12+ countries, 15+ employers, 6+ higher studies)
  // ==========================================================================

  const alumni: AlumniProfile[] = [
    demoAlumni,
    devAlumni2
  ];

  const countries = [
    'USA', 'India', 'Germany', 'United Kingdom', 'Canada', 'Singapore',
    'Australia', 'Netherlands', 'Ireland', 'UAE', 'Sweden', 'Switzerland'
  ];

  const higherUniversities = [
    'Carnegie Mellon University', 'Technical University of Munich',
    'Stanford University', 'Georgia Institute of Technology',
    'University of Toronto', 'National University of Singapore',
    'ETH Zurich', 'Imperial College London'
  ];

  const designationsAlumni = [
    'Senior Software Engineer', 'Software Engineer II', 'Cloud Solutions Architect',
    'Machine Learning Engineer', 'DevOps & SRE Lead', 'Product Manager',
    'Staff Firmware Engineer', 'Security Operations Engineer'
  ];

  for (let i = 1; i <= 30; i++) {
    const isMale = rng.boolean();
    const firstName = isMale ? rng.pick(FIRST_NAMES_MALE) : rng.pick(FIRST_NAMES_FEMALE);
    const lastName = rng.pick(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const dept = DEPARTMENTS[(i - 1) % DEPARTMENTS.length];
    const gradYear = 2015 + (i % 10);
    const company = EMPLOYERS[(i - 1) % EMPLOYERS.length];
    const country = countries[(i - 1) % countries.length];
    const hasHigher = i <= 8;
    const higherUni = hasHigher ? higherUniversities[(i - 1) % higherUniversities.length] : undefined;
    const isAccepting = i <= 14;
    const deptSkills = SKILLS_BY_DEPARTMENT[dept];
    const pickedSkills = rng.pickMultiple(deptSkills, rng.intBetween(3, 5));
    const emailPrefix = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}`;

    // 1 pending alumni for verification queue (making 10 total with 9 students)
    const isPendingAlumni = i === 30;
    const verificationStatus = isPendingAlumni ? 'Pending Verification' : 'Verified';
    const isVerified = !isPendingAlumni;

    alumni.push({
      id: `alum-${i + 1}`,
      name: fullName,
      email: `${emailPrefix}@example.com`,
      institutionalEmail: `${emailPrefix}@alumni.vit.edu.in`,
      personalEmail: `${emailPrefix}@example.com`,
      role: 'alumni',
      department: dept,
      avatar: generateSvgAvatar(fullName, i + 200),
      graduationYear: gradYear,
      enrollmentNo: `${gradYear - 4}10${(i % 5) + 1}A${String(200 + i).padStart(4, '0')}`,
      prn: `${gradYear - 4}10${(i % 5) + 1}A${String(200 + i).padStart(4, '0')}`,
      company,
      designation: designationsAlumni[i % designationsAlumni.length],
      higherEducationInstitute: higherUni,
      location: country === 'India' ? (i % 2 === 0 ? 'Mumbai, Maharashtra' : 'Bengaluru, Karnataka') : `${country === 'USA' ? 'San Francisco, CA' : country}`,
      country,
      skills: pickedSkills,
      experience: [
        {
          title: designationsAlumni[i % designationsAlumni.length],
          company,
          duration: `${gradYear + 2} - Present`,
          description: `Engineering and technical leadership at ${company}.`
        }
      ],
      certifications: ['AWS Certified Solutions Architect', 'Google Cloud Certified'],
      professionalAchievements: [
        `Spearheaded major technical product launches at ${company}`,
        `Mentored 10+ VIT engineering undergraduates into top-tier tech roles`
      ],
      higherStudies: hasHigher ? {
        degree: 'M.S. in Engineering & Computing',
        university: higherUni!,
        country,
        year: gradYear + 2,
        fieldOfStudy: `${dept} Advanced Computing`
      } : undefined,
      bio: `VIT Wadala ${gradYear} graduate now working as ${designationsAlumni[i % designationsAlumni.length]} at ${company}.`,
      isMentoringAvailable: isAccepting,
      maxMentees: rng.intBetween(3, 5),
      activeMenteesCount: isAccepting ? rng.intBetween(1, 3) : 0,
      isVerified,
      verificationStatus,
      proofDocumentName: isPendingAlumni ? `alumni_passing_cert_${emailPrefix}.pdf` : undefined,
      verificationDocumentUrl: isPendingAlumni ? generateSampleDocumentSvg('ALUMNI GRADUATION CREDENTIAL') : undefined,
      isActive: true,
      phone: `+91 98200 ${String(1000 + i).padStart(4, '0')}`
    });
  }

  // ==========================================================================
  // 5. BULK FACULTY (Total >= 24, all 5 departments, HODs, 14+ open to mentoring)
  // ==========================================================================

  const faculty: FacultyProfile[] = [
    demoFaculty,
    devFaculty2
  ];

  const hodSpecs: { dept: DepartmentCode; name: string; spec: string }[] = [
    { dept: 'CMPN', name: 'Dr. Ravindra Sangale', spec: 'Distributed Systems & Cloud Computing' },
    { dept: 'INFT', name: 'Dr. Vidya Chitre', spec: 'Information Security & Cloud Infrastructure' },
    { dept: 'EXTC', name: 'Dr. Amit Deshmukh', spec: 'Wireless Communications & Antenna Design' },
    { dept: 'EXCS', name: 'Dr. Sandeep Joshi', spec: 'Embedded VLSI & Computer Systems' },
    { dept: 'BIOM', name: 'Dr. Kavita Nair', spec: 'Biomedical Signal Processing & Healthcare Devices' }
  ];

  hodSpecs.forEach((hod, idx) => {
    if (hod.dept === 'CMPN') return; // Already demoFaculty
    faculty.push({
      id: `fac-hod-${idx + 1}`,
      name: hod.name,
      email: `${hod.name.toLowerCase().replace(/[^a-z]/g, '.')}@vit.edu.in`,
      institutionalEmail: `${hod.name.toLowerCase().replace(/[^a-z]/g, '.')}@vit.edu.in`,
      role: 'faculty',
      department: hod.dept,
      employeeId: `EMP-FAC-00${idx + 2}`,
      designation: 'Head of Department (HOD) & Professor',
      isHod: true,
      specialization: hod.spec,
      researchAreas: [hod.spec, 'Institutional Academic Council'],
      subjectsTaught: ['Advanced Departmental Core', 'Research Methodology'],
      publications: [
        { title: `Advances in ${hod.dept} Architecture`, journalOrConference: 'IEEE Transactions', year: 2023 }
      ],
      skills: SKILLS_BY_DEPARTMENT[hod.dept].slice(0, 4),
      industryInterests: ['Industry 4.0 Collaborations'],
      ongoingResearch: `Government-sponsored research in ${hod.dept} modernization`,
      avatar: generateSvgAvatar(hod.name, idx + 400),
      phone: '+91 98201 55667',
      isVerified: true,
      verificationStatus: 'Verified',
      isActive: true,
      isMentoringAvailable: true,
      maxMentees: 5,
      bio: `HOD of ${DEPARTMENT_NAMES[hod.dept]} at VIT Wadala.`
    });
  });

  // Remaining faculty members to reach 24 total
  const designations = ['Associate Professor', 'Assistant Professor', 'Professor'];
  for (let i = 1; i <= 18; i++) {
    const isMale = rng.boolean();
    const firstName = isMale ? rng.pick(FIRST_NAMES_MALE) : rng.pick(FIRST_NAMES_FEMALE);
    const lastName = rng.pick(LAST_NAMES);
    const fullName = `Dr. ${firstName} ${lastName}`;
    const dept = DEPARTMENTS[(i - 1) % DEPARTMENTS.length];
    const deptSkills = SKILLS_BY_DEPARTMENT[dept];
    const isAccepting = i <= 12; // 14+ accepting overall
    const emailPrefix = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;

    faculty.push({
      id: `fac-${i + 10}`,
      name: fullName,
      email: `${emailPrefix}@vit.edu.in`,
      institutionalEmail: `${emailPrefix}@vit.edu.in`,
      role: 'faculty',
      department: dept,
      employeeId: `EMP-FAC-0${i + 20}`,
      designation: designations[i % designations.length],
      isHod: false,
      specialization: `${deptSkills[0]} and ${deptSkills[1]} Research`,
      researchAreas: [deptSkills[0], deptSkills[1]],
      subjectsTaught: [deptSkills[0], `${dept} Core Engineering`],
      publications: [
        { title: `Optimizations in ${deptSkills[0]} Systems`, journalOrConference: 'Springer Engineering Review', year: 2024 }
      ],
      skills: deptSkills.slice(0, 4),
      industryInterests: ['Academic-Industry Linkage'],
      ongoingResearch: `Funded investigation into modern ${deptSkills[0]} topologies`,
      avatar: generateSvgAvatar(fullName, i + 500),
      phone: `+91 98200 ${String(2000 + i).padStart(4, '0')}`,
      isVerified: true,
      verificationStatus: 'Verified',
      isActive: true,
      isMentoringAvailable: isAccepting,
      maxMentees: rng.intBetween(3, 6),
      bio: `${designations[i % designations.length]} in Department of ${DEPARTMENT_NAMES[dept]}.`
    });
  }

  // ==========================================================================
  // 6. MENTORSHIP REQUESTS (Total >= 45, pending/accepted/declined/completed, 30+ reviews)
  // ==========================================================================

  const mentorshipRequests: MentorshipRequest[] = [];

  // Aanya Patel's 4 requests (2 pending, 1 accepted, 1 completed with review)
  // Resulting in Active requests tile = 3 (2 Pending + 1 Accepted)
  mentorshipRequests.push({
    id: 'req-aanya-1',
    studentId: 'user-student-1',
    studentName: 'Aanya Patel',
    studentEmail: 'aanya.patel@student.vit.edu.in',
    studentDepartment: 'CMPN',
    studentYear: 'BE',
    studentRole: 'student',
    studentEnrollmentNo: '22102A0042',
    mentorId: 'user-alumni-1',
    mentorName: 'Rushabh Sanghavi',
    mentorRole: 'alumni',
    mentorCompanyOrDept: 'Google',
    purposeOfRequest: 'Placement Preparation',
    areaOfGuidance: 'Distributed Systems & Google Interview Loop',
    topic: 'Architecture Review for GCP Compute Team',
    message: 'Hi Rushabh sir, I have been preparing distributed systems and Raft consensus. Would love guidance on Google L3/L4 technical expectations.',
    requestedDate: daysAgo(2),
    status: 'Accepted',
    shareProfile: true,
    scheduledTime: daysFromNow(2, 4)
  });

  mentorshipRequests.push({
    id: 'req-aanya-2',
    studentId: 'user-student-1',
    studentName: 'Aanya Patel',
    studentEmail: 'aanya.patel@student.vit.edu.in',
    studentDepartment: 'CMPN',
    studentYear: 'BE',
    studentRole: 'student',
    studentEnrollmentNo: '22102A0042',
    mentorId: 'user-faculty-1',
    mentorName: 'Dr. Ravindra Sangale',
    mentorRole: 'faculty',
    mentorCompanyOrDept: 'CMPN Department',
    purposeOfRequest: 'Research Collaboration',
    areaOfGuidance: 'Consensus Latency Benchmarking',
    topic: 'Capstone Paper Submission to IEEE',
    message: 'Respected Sir, seeking your guidance on structuring the performance evaluation section of our distributed cache benchmark paper.',
    requestedDate: daysAgo(1),
    status: 'Pending',
    shareProfile: true
  });

  mentorshipRequests.push({
    id: 'req-aanya-3',
    studentId: 'user-student-1',
    studentName: 'Aanya Patel',
    studentEmail: 'aanya.patel@student.vit.edu.in',
    studentDepartment: 'CMPN',
    studentYear: 'BE',
    studentRole: 'student',
    studentEnrollmentNo: '22102A0042',
    mentorId: 'user-faculty-sneha',
    mentorName: 'Prof. Sneha Deshpande',
    mentorRole: 'faculty',
    mentorCompanyOrDept: 'EXTC Department',
    purposeOfRequest: 'Project Guidance',
    areaOfGuidance: 'Hardware Telemetry Integration',
    topic: 'Sensor Telemetry Integration in Distributed Systems',
    message: 'Prof. Sneha, requesting guidance on IoT edge data ingestion pipelines.',
    requestedDate: daysAgo(3),
    status: 'Pending',
    shareProfile: true
  });

  mentorshipRequests.push({
    id: 'req-aanya-4',
    studentId: 'user-student-1',
    studentName: 'Aanya Patel',
    studentEmail: 'aanya.patel@student.vit.edu.in',
    studentDepartment: 'CMPN',
    studentYear: 'BE',
    studentRole: 'student',
    studentEnrollmentNo: '22102A0042',
    mentorId: 'alum-2',
    mentorName: alumni[2]?.name || 'Aditya Sharma',
    mentorRole: 'alumni',
    mentorCompanyOrDept: 'Microsoft',
    purposeOfRequest: 'Career Guidance',
    areaOfGuidance: 'US Masters Application Strategy',
    topic: 'Statement of Purpose Review',
    message: 'Hello, looking for feedback on CMU and Stanford graduate program essays.',
    requestedDate: daysAgo(14),
    status: 'Completed',
    feedback: {
      rating: 5,
      review: 'Incredibly structured guidance. Reviewed my statement of purpose line-by-line and helped highlight my undergraduate research achievements.',
      date: daysAgo(10)
    }
  });

  // Rushabh Sanghavi's 4 pending requests (Headline: 4 pending guidance requests)
  for (let i = 1; i <= 4; i++) {
    const student = students[i + 2];
    mentorshipRequests.push({
      id: `req-rushabh-pending-${i}`,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.institutionalEmail || student.email,
      studentDepartment: student.department,
      studentYear: student.currentYear,
      studentRole: 'student',
      studentEnrollmentNo: student.enrollmentNo,
      mentorId: 'user-alumni-1',
      mentorName: 'Rushabh Sanghavi',
      mentorRole: 'alumni',
      mentorCompanyOrDept: 'Google',
      purposeOfRequest: 'Placement Preparation',
      areaOfGuidance: 'System Design Mock Discussion',
      topic: `Distributed Cache Partitioning Strategy (Case Study ${i})`,
      message: `Dear Rushabh sir, I would like to schedule a 30-minute mock interview on distributed caching and data consistency models.`,
      requestedDate: daysAgo(i, 2),
      status: 'Pending',
      shareProfile: true
    });
  }

  // Rushabh Sanghavi's 2 other active mentees (making 3 active mentees total with Aanya)
  for (let i = 1; i <= 2; i++) {
    const student = students[i + 6];
    mentorshipRequests.push({
      id: `req-rushabh-active-${i}`,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.institutionalEmail || student.email,
      studentDepartment: student.department,
      studentYear: student.currentYear,
      studentRole: 'student',
      studentEnrollmentNo: student.enrollmentNo,
      mentorId: 'user-alumni-1',
      mentorName: 'Rushabh Sanghavi',
      mentorRole: 'alumni',
      mentorCompanyOrDept: 'Google',
      purposeOfRequest: 'Technical Discussions',
      areaOfGuidance: 'Production Cloud Operations',
      topic: `Mentorship Track Cohort ${i}`,
      message: 'Active bi-weekly technical discussion session.',
      requestedDate: daysAgo(10 + i),
      status: 'Accepted',
      shareProfile: true
    });
  }

  // Rushabh Sanghavi's completed reviews (5 reviews averaging exactly 4.6: 5, 5, 4, 5, 4)
  const rushabhReviews = [
    { rating: 5, review: 'Rushabh sir gave sharp, actionable feedback on my system design interview answers.' },
    { rating: 5, review: 'Exceptional mentor! Explained distributed consensus and failure detection in clear terms.' },
    { rating: 4, review: 'Very helpful resume critique for Tier-1 tech engineering roles.' },
    { rating: 5, review: 'Gave deep insights into large-scale production reliability at Google.' },
    { rating: 4, review: 'Great advice on transitioning from college projects to industrial scale.' }
  ];

  rushabhReviews.forEach((rev, idx) => {
    const student = students[idx + 9];
    mentorshipRequests.push({
      id: `req-rushabh-completed-${idx + 1}`,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.institutionalEmail || student.email,
      studentDepartment: student.department,
      studentYear: student.currentYear,
      studentRole: 'student',
      studentEnrollmentNo: student.enrollmentNo,
      mentorId: 'user-alumni-1',
      mentorName: 'Rushabh Sanghavi',
      mentorRole: 'alumni',
      mentorCompanyOrDept: 'Google',
      purposeOfRequest: 'Placement Preparation',
      areaOfGuidance: 'Cloud Systems Architecture',
      topic: `Advisory Session ${idx + 1}`,
      message: 'Guidance regarding production engineering methodologies.',
      requestedDate: daysAgo(20 + idx),
      status: 'Completed',
      feedback: {
        rating: rev.rating,
        review: rev.review,
        date: daysAgo(15 + idx)
      }
    });
  });

  // Dr. Ravindra Sangale's 4 pending academic asks
  for (let i = 1; i <= 4; i++) {
    const student = students[i + 14];
    mentorshipRequests.push({
      id: `req-sangale-pending-${i}`,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.institutionalEmail || student.email,
      studentDepartment: 'CMPN',
      studentYear: student.currentYear,
      studentRole: 'student',
      studentEnrollmentNo: student.enrollmentNo,
      mentorId: 'user-faculty-1',
      mentorName: 'Dr. Ravindra Sangale',
      mentorRole: 'faculty',
      mentorCompanyOrDept: 'CMPN Department',
      purposeOfRequest: 'Research Collaboration',
      areaOfGuidance: 'Operating Systems & Distributed Consensus',
      topic: `Departmental Research Proposal ${i}`,
      message: `Respected HOD Sir, requesting your review on our undergraduate research paper on cloud edge resource allocation.`,
      requestedDate: daysAgo(i, 3),
      status: 'Pending',
      shareProfile: true
    });
  }

  // Dr. Ravindra Sangale's 3 active mentees
  for (let i = 1; i <= 3; i++) {
    const student = students[i + 18];
    mentorshipRequests.push({
      id: `req-sangale-active-${i}`,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.institutionalEmail || student.email,
      studentDepartment: 'CMPN',
      studentYear: student.currentYear,
      studentRole: 'student',
      studentEnrollmentNo: student.enrollmentNo,
      mentorId: 'user-faculty-1',
      mentorName: 'Dr. Ravindra Sangale',
      mentorRole: 'faculty',
      mentorCompanyOrDept: 'CMPN Department',
      purposeOfRequest: 'Project Guidance',
      areaOfGuidance: 'Kernel Internals',
      topic: `Academic Consultation Track ${i}`,
      message: 'Capstone paper formulation.',
      requestedDate: daysAgo(15 + i),
      status: 'Accepted'
    });
  }

  // Dr. Ravindra Sangale's completed reviews
  const sangaleReviews = [
    { rating: 5, review: 'Dr. Sangale provided outstanding academic mentorship. Helped our team publish at IEEE.' },
    { rating: 5, review: 'Very deep knowledge in operating systems kernel scheduling. Highly encouraging guide.' },
    { rating: 4, review: 'Rigorous critique of our research methodology that elevated our final capstone quality.' },
    { rating: 5, review: 'Inspiring mentor who connects academic theory directly with industry standards.' }
  ];

  sangaleReviews.forEach((rev, idx) => {
    const student = students[idx + 22];
    mentorshipRequests.push({
      id: `req-sangale-completed-${idx + 1}`,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.institutionalEmail || student.email,
      studentDepartment: 'CMPN',
      studentYear: student.currentYear,
      studentRole: 'student',
      studentEnrollmentNo: student.enrollmentNo,
      mentorId: 'user-faculty-1',
      mentorName: 'Dr. Ravindra Sangale',
      mentorRole: 'faculty',
      mentorCompanyOrDept: 'CMPN Department',
      purposeOfRequest: 'Project Guidance',
      areaOfGuidance: 'Kernel Internals',
      topic: `Academic Consultation ${idx + 1}`,
      message: 'Capstone paper formulation.',
      requestedDate: daysAgo(25 + idx),
      status: 'Completed',
      feedback: {
        rating: rev.rating,
        review: rev.review,
        date: daysAgo(18 + idx)
      }
    });
  });

  // Bulk mentorship requests to exceed 45 total (with declined, completed, and pending)
  const generalPurposes: MentorshipRequest['purposeOfRequest'][] = [
    'Career Guidance',
    'Higher Education',
    'Placement Preparation',
    'Research Collaboration',
    'Industry Interaction',
    'Technical Discussions',
    'Project Guidance'
  ];

  for (let i = 1; i <= 24; i++) {
    const student = students[(i + 25) % students.length];
    const isAlumniMentor = i % 2 === 0;
    const mentor = isAlumniMentor
      ? alumni[(i + 3) % alumni.length]
      : faculty[(i + 3) % faculty.length];

    const statusType: MentorshipRequest['status'] =
      i % 3 === 0 ? 'Completed' : i % 4 === 0 ? 'Declined' : i % 2 === 0 ? 'Accepted' : 'Pending';

    let feedback = undefined;
    if (statusType === 'Completed') {
      feedback = {
        rating: rng.intBetween(4, 5),
        review: `Great consultation! The advice on ${student.department} industry expectations was very practical.`,
        date: daysAgo(i + 2)
      };
    }

    mentorshipRequests.push({
      id: `req-bulk-${i}`,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.institutionalEmail || student.email,
      studentDepartment: student.department,
      studentYear: student.currentYear,
      studentRole: 'student',
      studentEnrollmentNo: student.enrollmentNo,
      mentorId: mentor.id,
      mentorName: mentor.name,
      mentorRole: isAlumniMentor ? 'alumni' : 'faculty',
      mentorCompanyOrDept: isAlumniMentor ? (mentor as AlumniProfile).company : (mentor as FacultyProfile).department,
      purposeOfRequest: rng.pick(generalPurposes),
      areaOfGuidance: `${student.department} Professional Roadmap`,
      topic: `Mentorship Session ${i}`,
      message: `Hello ${mentor.name}, I would love your perspective on career milestones and skill development.`,
      requestedDate: daysAgo(rng.intBetween(1, 28)),
      status: statusType,
      declineReason: statusType === 'Declined' ? 'Currently reached mentee capacity for this term. Please connect again next month!' : undefined,
      feedback,
      shareProfile: true
    });
  }

  // ==========================================================================
  // 7. OPPORTUNITIES (Total >= 32 across all category chips, 8+ locations, skill matches)
  // ==========================================================================

  const jobs: JobListing[] = [];

  // Rushabh Sanghavi's 3 posted opportunities (Headline: 3 job listings, one with 6 applicants)
  // Also aliases with 'job-1' to guarantee any legacy local storage pointer resolves
  jobs.push({
    id: 'job-rushabh-1',
    title: 'Cloud Infrastructure Software Engineer (SDE-1)',
    company: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=200&auto=format&fit=crop&q=80',
    location: 'Bengaluru / Hyderabad',
    type: 'Job Vacancy',
    workMode: 'Hybrid',
    stipendOrSalary: '₹28 - 34 LPA + Equity',
    department: ['CMPN', 'INFT'],
    skillsRequired: ['React', 'Python', 'Machine Learning', 'System Design'], // Guarantees >=60% match for Aanya
    postedByAlumniId: 'user-alumni-1',
    postedByAlumniName: 'Rushabh Sanghavi',
    postedByRole: 'alumni',
    postedDate: daysAgo(5),
    applicationDeadline: daysFromNow(20),
    description: 'Join Google Cloud Compute team engineering global distributed virtualization and runtime control planes.',
    requirements: [
      'Strong grasp of operating systems, networking fundamentals, and concurrency.',
      'Proficiency in React, Python, or Go with distributed systems coursework.',
      'Demonstrated capstone or open-source contribution in backend engineering.'
    ],
    referralProvided: true,
    applicantsCount: 6,
    status: 'Active',
    moderationStatus: 'Approved',
    lifecycleStatus: 'published',
    compensationDisclosed: true
  });

  // Alias open job for legacy 'job-1' so Saved (1) resolves cleanly to a real listing
  jobs.push({
    id: 'job-1',
    title: 'Full-Stack Distributed Systems Engineer',
    company: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=200&auto=format&fit=crop&q=80',
    location: 'Bengaluru, Karnataka',
    type: 'Full-Time',
    workMode: 'Hybrid',
    stipendOrSalary: '₹30 - 36 LPA',
    department: ['CMPN', 'INFT'],
    skillsRequired: ['React', 'Node.js', 'Python', 'System Design'],
    postedByAlumniId: 'user-alumni-1',
    postedByAlumniName: 'Rushabh Sanghavi',
    postedByRole: 'alumni',
    postedDate: daysAgo(4),
    applicationDeadline: daysFromNow(25),
    description: 'Production cloud infrastructure engineering for global scale systems.',
    requirements: ['Solid foundations in data structures and full-stack software.'],
    referralProvided: true,
    applicantsCount: 4,
    status: 'Active',
    moderationStatus: 'Approved',
    lifecycleStatus: 'published'
  });

  jobs.push({
    id: 'job-rushabh-2',
    title: 'Site Reliability Engineering Intern (Summer 2027)',
    company: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=200&auto=format&fit=crop&q=80',
    location: 'Bengaluru, Karnataka',
    type: 'Internship Opportunity',
    workMode: 'On-site',
    stipendOrSalary: '₹1,25,000 / month',
    department: ['CMPN', 'INFT', 'EXCS'],
    skillsRequired: ['Python', 'Linux', 'Docker', 'System Design', 'React'], // High match for Aanya
    postedByAlumniId: 'user-alumni-1',
    postedByAlumniName: 'Rushabh Sanghavi',
    postedByRole: 'alumni',
    postedDate: daysAgo(8),
    applicationDeadline: daysFromNow(12),
    description: 'Internship role focusing on observability pipelines, automated remediation, and SLO monitoring.',
    requirements: [
      'Pre-final year students (TE/BE) with strong Linux shell proficiency.',
      'Understanding of TCP/IP, DNS, and distributed tracing.'
    ],
    referralProvided: true,
    applicantsCount: 3,
    status: 'Active',
    moderationStatus: 'Approved',
    lifecycleStatus: 'published'
  });

  jobs.push({
    id: 'job-rushabh-3',
    title: 'Distributed Storage Systems Research Associate',
    company: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=200&auto=format&fit=crop&q=80',
    location: 'Remote',
    type: 'Research Project',
    workMode: 'Remote',
    stipendOrSalary: '₹45,000 / month grant',
    department: ['CMPN'],
    skillsRequired: ['Distributed Systems', 'C++', 'Python', 'Machine Learning'],
    postedByAlumniId: 'user-alumni-1',
    postedByAlumniName: 'Rushabh Sanghavi',
    postedByRole: 'alumni',
    postedDate: daysAgo(12),
    applicationDeadline: daysFromNow(5),
    description: 'Collaborative academic research project evaluating multi-region storage replication latencies.',
    requirements: ['Experience with distributed protocol verification and benchmarking frameworks.'],
    referralProvided: false,
    applicantsCount: 2,
    status: 'Active',
    moderationStatus: 'Approved',
    lifecycleStatus: 'published'
  });

  // Dr. Ravindra Sangale's 2 posted opportunities
  jobs.push({
    id: 'job-sangale-1',
    title: 'Autonomous Edge Cloud Laboratory Fellowship',
    company: 'CMPN Research Cell, VIT',
    companyLogo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&auto=format&fit=crop&q=80',
    location: 'Mumbai, Maharashtra',
    type: 'Research Project',
    workMode: 'On-site',
    stipendOrSalary: '₹18,000 / month Institutional Stipend',
    department: ['CMPN', 'INFT'],
    skillsRequired: ['Python', 'Machine Learning', 'Linux', 'React'], // High match for Aanya
    postedByAlumniId: 'user-faculty-1',
    postedByAlumniName: 'Dr. Ravindra Sangale',
    postedByRole: 'faculty',
    postedDate: daysAgo(3),
    applicationDeadline: daysFromNow(18),
    description: 'Funded departmental research project on dynamic micro-datacenter cluster scheduling.',
    requirements: ['Minimum CGPA 8.0, strong systems programming interest.'],
    referralProvided: false,
    applicantsCount: 3,
    status: 'Active',
    moderationStatus: 'Approved',
    lifecycleStatus: 'published'
  });

  jobs.push({
    id: 'job-sangale-2',
    title: 'Enterprise Kubernetes & Cloud Native Workshop',
    company: 'Department of Computer Engineering',
    companyLogo: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=200&auto=format&fit=crop&q=80',
    location: 'Mumbai, Maharashtra',
    type: 'Full-Time',
    workMode: 'Hybrid',
    stipendOrSalary: 'Free with Hands-on Cloud Credits',
    department: ['CMPN', 'INFT', 'EXTC', 'EXCS'],
    skillsRequired: ['Docker', 'Kubernetes', 'Microservices'],
    postedByAlumniId: 'user-faculty-1',
    postedByAlumniName: 'Dr. Ravindra Sangale',
    postedByRole: 'faculty',
    postedDate: daysAgo(6),
    applicationDeadline: daysFromNow(10),
    description: 'Hands-on immersion into container orchestration and cloud deployments.',
    requirements: ['Open to all TE and BE engineering students.'],
    referralProvided: false,
    applicantsCount: 15,
    status: 'Active',
    moderationStatus: 'Approved',
    lifecycleStatus: 'published'
  });

  // Explicit Referral Opportunities (so the Referral chip has plenty of results)
  const referralDefs = [
    { id: 'job-referral-1', title: 'Microsoft Azure Core Systems Alumni Referral', company: 'Microsoft', loc: 'Hyderabad, Telangana', skills: ['C#', 'Cloud Architecture', 'System Design'] },
    { id: 'job-referral-2', title: 'Amazon AWS SDE-1 Internal Alumni Referral', company: 'Amazon', loc: 'Bengaluru, Karnataka', skills: ['Java', 'Distributed Systems', 'AWS'] },
    { id: 'job-referral-3', title: 'Morgan Stanley FinTech Quantitative Developer Referral', company: 'Morgan Stanley', loc: 'Mumbai, Maharashtra', skills: ['C++', 'Python', 'Algorithms'] },
    { id: 'job-referral-4', title: 'Barclays Global Technology Graduate Referral', company: 'Barclays', loc: 'Pune, Maharashtra', skills: ['React', 'Spring Boot', 'SQL'] },
    { id: 'job-referral-5', title: 'JPMorgan Chase Software Engineer Referral', company: 'JPMorgan Chase', loc: 'Mumbai, Maharashtra', skills: ['Python', 'React', 'Cloud'] },
    { id: 'job-referral-6', title: 'NVIDIA AI Infrastructure Engineer Referral', company: 'NVIDIA', loc: 'Pune, Maharashtra', skills: ['CUDA', 'Python', 'C++'] }
  ];

  referralDefs.forEach((ref, idx) => {
    jobs.push({
      id: ref.id,
      title: ref.title,
      company: ref.company,
      companyLogo: 'https://images.unsplash.com/photo-1542744094-3a31727560fa?w=200&auto=format&fit=crop&q=80',
      location: ref.loc,
      type: 'Referral' as unknown as JobListing['type'],
      workMode: idx % 2 === 0 ? 'Hybrid' : 'On-site',
      stipendOrSalary: '₹18 - 26 LPA',
      department: ['CMPN', 'INFT'],
      skillsRequired: ref.skills,
      postedByAlumniId: alumni[idx + 2]?.id || 'user-alumni-1',
      postedByAlumniName: alumni[idx + 2]?.name || 'Alumni Referrer',
      postedByRole: 'alumni',
      postedDate: daysAgo(idx + 2),
      applicationDeadline: daysFromNow(15 + idx * 2),
      description: `Direct corporate referral submitted by VIT alumni working at ${ref.company}. Resumes reviewed weekly.`,
      requirements: ['Final year BE or recent graduates with strong problem-solving fundamentals.'],
      referralProvided: true,
      applicantsCount: 4 + idx,
      status: 'Active',
      moderationStatus: 'Approved',
      lifecycleStatus: 'published'
    });
  });

  // Admin moderation queue: 2 pending approval (Section 3.2: 2 pending moderation)
  jobs.push({
    id: 'job-pending-mod-1',
    title: 'FinTech Algorithmic Trading Analyst',
    company: 'AlphaMetrics Quant Lab',
    companyLogo: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&auto=format&fit=crop&q=80',
    location: 'Bandra-Kurla Complex, Mumbai',
    type: 'Full-Time',
    workMode: 'On-site',
    stipendOrSalary: '₹22 - 28 LPA',
    department: ['CMPN', 'INFT', 'EXCS'],
    skillsRequired: ['Python', 'C++', 'Financial Engineering'],
    postedByAlumniId: alumni[3]?.id || 'alum-3',
    postedByAlumniName: alumni[3]?.name || 'Tanmay Deshmukh',
    postedByRole: 'alumni',
    postedDate: hoursAgo(10),
    applicationDeadline: daysFromNow(15),
    description: 'Quantitative analytics role building automated algorithmic order execution pipelines.',
    requirements: ['Exceptional mathematical aptitude and high-frequency systems architecture.'],
    referralProvided: true,
    applicantsCount: 0,
    status: 'Pending Approval',
    moderationStatus: 'Pending Approval',
    lifecycleStatus: 'pending_review'
  });

  jobs.push({
    id: 'job-pending-mod-2',
    title: 'Embedded Firmware Developer for Medical Telemetry',
    company: 'BioPulse MedTech',
    companyLogo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&auto=format&fit=crop&q=80',
    location: 'Pune, Maharashtra',
    type: 'Internship Opportunity',
    workMode: 'Hybrid',
    stipendOrSalary: '₹25,000 / month',
    department: ['BIOM', 'EXTC'],
    skillsRequired: ['Embedded C', 'Biomedical Signal Processing'],
    postedByAlumniId: alumni[4]?.id || 'alum-4',
    postedByAlumniName: alumni[4]?.name || 'Rhea Menon',
    postedByRole: 'alumni',
    postedDate: hoursAgo(18),
    applicationDeadline: daysFromNow(14),
    description: 'Industrial apprenticeship developing patient monitoring wearable firmware.',
    requirements: ['Pre-final or final year Biomedical / EXTC students.'],
    referralProvided: false,
    applicantsCount: 0,
    status: 'Pending Approval',
    moderationStatus: 'Pending Approval',
    lifecycleStatus: 'pending_review'
  });

  // 3 jobs closing within 3 days (Section 3.2: 3 closing within 3 days)
  for (let i = 1; i <= 3; i++) {
    jobs.push({
      id: `job-closing-soon-${i}`,
      title: `${EMPLOYERS[i + 4]} Early Career Engineering Rotation (Closing in ${i} Days)`,
      company: EMPLOYERS[i + 4],
      companyLogo: 'https://images.unsplash.com/photo-1542744094-3a31727560fa?w=200&auto=format&fit=crop&q=80',
      location: i === 1 ? 'Delhi NCR, India' : i === 2 ? 'Pune, Maharashtra' : 'Mumbai, Maharashtra',
      type: i === 1 ? 'Job Vacancy' : 'Internship Opportunity',
      workMode: 'Hybrid',
      stipendOrSalary: '₹16 - 20 LPA',
      department: ['CMPN', 'INFT', 'EXTC'],
      skillsRequired: ['React', 'Python', 'System Design'],
      postedByAlumniId: alumni[i + 5]?.id || 'alum-5',
      postedByAlumniName: alumni[i + 5]?.name || 'Alumni Referrer',
      postedByRole: 'alumni',
      postedDate: daysAgo(10),
      applicationDeadline: daysFromNow(i),
      description: `Rapid hiring sprint for graduating seniors and interns. Applications close strictly in ${i} days.`,
      requirements: ['Final year BE students with strong technical project portfolio.'],
      referralProvided: true,
      applicantsCount: 8 + i,
      status: 'Active',
      moderationStatus: 'Approved',
      lifecycleStatus: 'published'
    });
  }

  // 4 already expired jobs (Section 3.2: 4 already expired)
  for (let i = 1; i <= 4; i++) {
    jobs.push({
      id: `job-expired-${i}`,
      title: `Archived: ${EMPLOYERS[i + 8]} Graduate Trainee Batch ${i}`,
      company: EMPLOYERS[i + 8],
      companyLogo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=200&auto=format&fit=crop&q=80',
      location: 'Bengaluru, Karnataka',
      type: 'Job Vacancy',
      workMode: 'On-site',
      stipendOrSalary: '₹14 LPA',
      department: ['CMPN', 'INFT'],
      skillsRequired: ['Java', 'SQL', 'Spring Boot'],
      postedByAlumniId: alumni[i + 8]?.id || 'alum-8',
      postedByAlumniName: alumni[i + 8]?.name || 'Alumni Lead',
      postedByRole: 'alumni',
      postedDate: daysAgo(35 + i * 5),
      applicationDeadline: daysAgo(5 + i * 3),
      description: 'Hiring drive concluded. Retained for historical verification and NAAC audit trail.',
      requirements: ['Graduated batches.'],
      referralProvided: false,
      applicantsCount: 12,
      status: 'Closed',
      moderationStatus: 'Approved',
      lifecycleStatus: 'expired'
    });
  }

  // Bulk opportunities across distinct global & Indian cities
  const cities = ['Mumbai, Maharashtra', 'Bengaluru, Karnataka', 'Pune, Maharashtra', 'Hyderabad, Telangana', 'Delhi NCR, India', 'Remote', 'Sunnyvale, CA', 'Munich, Germany'];
  const bulkTypes = ['Full-Time', 'Internship Opportunity', 'Research Project', 'Referral'] as const;

  for (let i = 1; i <= 14; i++) {
    const oppType = bulkTypes[i % bulkTypes.length];
    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    const comp = EMPLOYERS[(i + 3) % EMPLOYERS.length];
    const deptSkills = SKILLS_BY_DEPARTMENT[dept];
    const isAlumniPoster = i % 2 === 0;
    const poster = isAlumniPoster
      ? alumni[(i + 7) % alumni.length]
      : faculty[(i + 4) % faculty.length];

    jobs.push({
      id: `job-bulk-${i}`,
      title: `${comp} ${dept} ${oppType}`,
      company: comp,
      companyLogo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&auto=format&fit=crop&q=80',
      location: cities[i % cities.length],
      type: oppType as unknown as JobListing['type'],
      workMode: i % 3 === 0 ? 'Remote' : i % 2 === 0 ? 'Hybrid' : 'On-site',
      stipendOrSalary: oppType === 'Internship Opportunity' ? '₹40,000 / month' : '₹14 - 22 LPA',
      department: [dept, 'CMPN'],
      skillsRequired: deptSkills.slice(0, 3),
      postedByAlumniId: poster.id,
      postedByAlumniName: poster.name,
      postedByRole: isAlumniPoster ? 'alumni' : 'faculty',
      postedDate: daysAgo(rng.intBetween(2, 20)),
      applicationDeadline: daysFromNow(rng.intBetween(7, 30)),
      description: `Opportunity created for ${DEPARTMENT_NAMES[dept]} students focusing on ${deptSkills.slice(0, 2).join(' and ')}.`,
      requirements: [`Good standing in ${dept} with hands-on project experience.`],
      referralProvided: isAlumniPoster && rng.boolean(0.7),
      applicantsCount: rng.intBetween(1, 5),
      status: 'Active',
      moderationStatus: 'Approved',
      lifecycleStatus: 'published'
    });
  }

  // ==========================================================================
  // 8. APPLICATIONS (Total >= 30, linked to opportunities, Aanya has 4)
  // ==========================================================================

  const applications: OpportunityApplication[] = [];

  // Aanya Patel's 4 applications across 4 different statuses
  applications.push({
    id: 'app-aanya-1',
    opportunityId: 'job-rushabh-1', // Google Cloud SDE-1
    applicantId: 'user-student-1',
    applicantName: 'Aanya Patel',
    applicantEmail: 'aanya.patel@student.vit.edu.in',
    applicantDepartment: 'CMPN',
    applicantYear: 'BE',
    appliedAt: daysAgo(3),
    status: 'shortlisted',
    studentNote: 'Strong background in Go and Raft consensus algorithms from my capstone project.',
    resumePath: '/resumes/aanya-patel-resume.pdf',
    matchScore: 98
  });

  applications.push({
    id: 'app-aanya-2',
    opportunityId: 'job-rushabh-2', // SRE Intern
    applicantId: 'user-student-1',
    applicantName: 'Aanya Patel',
    applicantEmail: 'aanya.patel@student.vit.edu.in',
    applicantDepartment: 'CMPN',
    applicantYear: 'BE',
    appliedAt: daysAgo(1),
    status: 'submitted',
    studentNote: 'Applied for SRE observability pipelines track.',
    resumePath: '/resumes/aanya-patel-resume.pdf',
    matchScore: 92
  });

  applications.push({
    id: 'app-aanya-3',
    opportunityId: 'job-sangale-1', // Edge Cloud Lab Fellowship
    applicantId: 'user-student-1',
    applicantName: 'Aanya Patel',
    applicantEmail: 'aanya.patel@student.vit.edu.in',
    applicantDepartment: 'CMPN',
    applicantYear: 'BE',
    appliedAt: daysAgo(2),
    status: 'viewed',
    studentNote: 'Undergraduate research submission on micro-datacenter cluster scheduling.',
    resumePath: '/resumes/aanya-patel-resume.pdf',
    matchScore: 95
  });

  applications.push({
    id: 'app-aanya-4',
    opportunityId: 'job-closing-soon-1',
    applicantId: 'user-student-1',
    applicantName: 'Aanya Patel',
    applicantEmail: 'aanya.patel@student.vit.edu.in',
    applicantDepartment: 'CMPN',
    applicantYear: 'BE',
    appliedAt: daysAgo(5),
    status: 'not_selected',
    studentNote: 'Early rotation application.',
    resumePath: '/resumes/aanya-patel-resume.pdf',
    matchScore: 84
  });

  // Rushabh Sanghavi's 3 postings applicant pools:
  // job-rushabh-1 has 6 applicants total (including Aanya + 5 other students)
  for (let k = 1; k <= 5; k++) {
    const student = students[k + 1];
    applications.push({
      id: `app-rushabh-1-stud-${k}`,
      opportunityId: 'job-rushabh-1',
      applicantId: student.id,
      applicantName: student.name,
      applicantEmail: student.institutionalEmail || student.email,
      applicantDepartment: student.department,
      applicantYear: student.currentYear,
      appliedAt: daysAgo(4 - Math.floor(k / 2)),
      status: k === 1 ? 'shortlisted' : k === 2 ? 'viewed' : 'submitted',
      studentNote: `Excited about distributed cloud infrastructure opportunities at Google.`,
      matchScore: 80 + k * 3
    });
  }

  // job-rushabh-2 has 3 applicants (Aanya + 2 others)
  for (let k = 1; k <= 2; k++) {
    const student = students[k + 7];
    applications.push({
      id: `app-rushabh-2-stud-${k}`,
      opportunityId: 'job-rushabh-2',
      applicantId: student.id,
      applicantName: student.name,
      applicantEmail: student.institutionalEmail || student.email,
      applicantDepartment: student.department,
      applicantYear: student.currentYear,
      appliedAt: daysAgo(2),
      status: 'submitted',
      matchScore: 78 + k * 5
    });
  }

  // job-rushabh-3 has 2 applicants
  for (let k = 1; k <= 2; k++) {
    const student = students[k + 10];
    applications.push({
      id: `app-rushabh-3-stud-${k}`,
      opportunityId: 'job-rushabh-3',
      applicantId: student.id,
      applicantName: student.name,
      applicantEmail: student.institutionalEmail || student.email,
      applicantDepartment: student.department,
      applicantYear: student.currentYear,
      appliedAt: daysAgo(6),
      status: 'viewed',
      matchScore: 88
    });
  }

  // job-1 (alias for Rushabh's legacy listing) has 3 applicants
  for (let k = 1; k <= 3; k++) {
    const student = students[(k + 14) % students.length];
    applications.push({
      id: `app-job-1-stud-${k}`,
      opportunityId: 'job-1',
      applicantId: student.id,
      applicantName: student.name,
      applicantEmail: student.institutionalEmail || student.email,
      applicantDepartment: student.department,
      applicantYear: student.currentYear,
      appliedAt: daysAgo(3),
      status: k === 1 ? 'shortlisted' : 'submitted',
      matchScore: 84
    });
  }

  // Other bulk applications to exceed 30 total
  for (let i = 1; i <= 18; i++) {
    const student = students[(i + 12) % students.length];
    const targetJob = jobs[(i + 3) % jobs.length];
    applications.push({
      id: `app-bulk-${i}`,
      opportunityId: targetJob.id,
      applicantId: student.id,
      applicantName: student.name,
      applicantEmail: student.institutionalEmail || student.email,
      applicantDepartment: student.department,
      applicantYear: student.currentYear,
      appliedAt: daysAgo(rng.intBetween(1, 14)),
      status: i % 4 === 0 ? 'shortlisted' : i % 3 === 0 ? 'viewed' : i % 5 === 0 ? 'not_selected' : 'submitted',
      matchScore: rng.intBetween(75, 96)
    });
  }

  // ==========================================================================
  // 9. EVENTS AND TALKS (Total 16: 9 upcoming, 5 past, 1 pending review, 1 cancelled)
  // Categories must match canonical EVENT_CATEGORIES:
  // ['Alumni meet', 'Guest lecture', 'Technical workshop', 'Placement drive', 'Research seminar']
  // Modes: ['on_campus', 'online', 'hybrid']
  // ==========================================================================

  const events: EventItem[] = [];
  const rsvps: EventRsvp[] = [];

  // Event 1 (Upcoming): Waitlisted Masterclass (1 full at capacity with a waitlist)
  const waitlistCapacity = 30;
  const waitlistRegisteredIds = students.slice(1, waitlistCapacity + 1).map(s => s.id);
  const waitlistedUserIds = [students[32].id, students[33].id, students[34].id];

  events.push({
    id: 'event-full-waitlist',
    title: 'Google Cloud Distributed Systems Masterclass & Career Keynote',
    type: 'Alumni meet' as unknown as EventType,
    date: dateOnlyString(daysFromNow(2)), // This week!
    time: '18:00 - 20:00 IST',
    startsAt: daysFromNow(2, 18),
    endsAt: daysFromNow(2, 20),
    locationOrUrl: 'Auditorium A, VIT Wadala',
    isOnline: false,
    mode: 'on_campus',
    speakerName: 'Rushabh Sanghavi',
    speakerDesignation: 'Senior Software Engineer',
    speakerCompany: 'Google',
    department: 'CMPN',
    description: 'Deep dive into large-scale cloud compute architectures, high availability designs, and direct alumni recruitment tips. SEATS AT MAXIMUM CAPACITY.',
    bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    capacityLimit: waitlistCapacity,
    waitlistEnabled: true,
    rsvpsCount: waitlistCapacity,
    registeredUserIds: waitlistRegisteredIds,
    waitlistUserIds: waitlistedUserIds,
    status: 'Upcoming',
    lifecycleStatus: 'published'
  });

  // RSVPs for waitlisted event
  waitlistRegisteredIds.forEach((uid, idx) => {
    rsvps.push({
      id: `rsvp-wait-reg-${idx}`,
      eventId: 'event-full-waitlist',
      userId: uid,
      status: 'registered',
      createdAt: daysAgo(5)
    });
  });

  waitlistedUserIds.forEach((uid, idx) => {
    rsvps.push({
      id: `rsvp-wait-list-${idx}`,
      eventId: 'event-full-waitlist',
      userId: uid,
      status: 'waitlisted',
      waitlistPosition: idx + 1,
      createdAt: daysAgo(1)
    });
  });

  // 8 more Upcoming Events (Total 9 upcoming: spread across this week and this month, Aanya registered for exactly 3)
  const upcomingDefs = [
    {
      id: 'event-upcoming-1',
      title: 'Breaking Into Tier-1 Tech: Alumni SDE Panel & Mock Interviews',
      type: 'Alumni meet' as const,
      speaker: 'Rushabh Sanghavi & Panel',
      comp: 'Google / Microsoft',
      days: 1, // This week!
      dept: 'CMPN' as DepartmentCode,
      mode: 'hybrid' as const,
      aanyaRegistered: true // #1 for Aanya
    },
    {
      id: 'event-upcoming-2',
      title: 'Autonomous Systems & Edge AI Practical Workshop',
      type: 'Technical workshop' as const,
      speaker: 'Prof. Sneha Deshpande',
      comp: 'VIT EXTC Lab',
      days: 3, // This week!
      dept: 'EXTC' as DepartmentCode,
      mode: 'on_campus' as const,
      aanyaRegistered: true // #2 for Aanya
    },
    {
      id: 'event-upcoming-3',
      title: 'Quantitative Finance & FinTech Architecture Webinar',
      type: 'Guest lecture' as const,
      speaker: 'Aditya Sharma',
      comp: 'Goldman Sachs',
      days: 7, // This month
      dept: 'INFT' as DepartmentCode,
      mode: 'online' as const,
      aanyaRegistered: true // #3 for Aanya
    },
    {
      id: 'event-upcoming-4',
      title: 'Campus Placement Readiness & System Design Bootcamp',
      type: 'Placement drive' as const,
      speaker: 'Vikram Malhotra',
      comp: 'Microsoft',
      days: 10, // This month
      dept: 'CMPN' as DepartmentCode,
      mode: 'on_campus' as const,
      aanyaRegistered: false
    },
    {
      id: 'event-upcoming-5',
      title: 'State of Distributed Systems: HOD Research Seminar',
      type: 'Research seminar' as const,
      speaker: 'Dr. Ravindra Sangale',
      comp: 'CMPN Department, VIT',
      days: 12, // This month
      dept: 'CMPN' as DepartmentCode,
      mode: 'hybrid' as const,
      aanyaRegistered: false
    },
    {
      id: 'event-upcoming-6',
      title: 'Cybersecurity Threat Modeling & Zero Trust Architecture',
      type: 'Guest lecture' as const,
      speaker: 'Dr. Vidya Chitre',
      comp: 'VIT INFT Cell',
      days: 15, // This month
      dept: 'INFT' as DepartmentCode,
      mode: 'online' as const,
      aanyaRegistered: false
    },
    {
      id: 'event-upcoming-7',
      title: 'Medical Image Processing & AI in Clinical Diagnostics',
      type: 'Research seminar' as const,
      speaker: 'Dr. Kavita Nair',
      comp: 'Biomedical Innovation Center',
      days: 18, // This month
      dept: 'BIOM' as DepartmentCode,
      mode: 'on_campus' as const,
      aanyaRegistered: false
    },
    {
      id: 'event-upcoming-8',
      title: 'Alumni Higher Studies Panel: M.S. in US & Europe Roadmap',
      type: 'Alumni meet' as const,
      speaker: 'Carnegie Mellon & TUM Alumni Cohort',
      comp: 'Global Alumni Council',
      days: 22,
      dept: 'CMPN' as DepartmentCode,
      mode: 'online' as const,
      aanyaRegistered: false
    }
  ];

  upcomingDefs.forEach((ev, idx) => {
    const eid = ev.id;
    const registeredIds: string[] = [];
    if (ev.aanyaRegistered) registeredIds.push('user-student-1');
    if (idx === 0 || idx === 3) registeredIds.push('user-alumni-1'); // Rushabh registered for 2

    // Add attendees from students roster
    for (let k = 1; k <= 7; k++) {
      registeredIds.push(students[(k * 4 + idx) % students.length].id);
    }

    events.push({
      id: eid,
      title: ev.title,
      type: ev.type as unknown as EventType,
      date: dateOnlyString(daysFromNow(ev.days)),
      time: '17:00 - 18:30 IST',
      startsAt: daysFromNow(ev.days, 17),
      endsAt: daysFromNow(ev.days, 18, 30),
      locationOrUrl: ev.mode === 'online' ? 'https://meet.google.com/nex-link-live' : 'Auditorium, VIT Wadala Campus',
      isOnline: ev.mode === 'online',
      mode: ev.mode,
      speakerName: ev.speaker,
      speakerDesignation: 'Keynote Speaker',
      speakerCompany: ev.comp,
      department: ev.dept,
      description: `Comprehensive ${ev.type.toLowerCase()} providing practical industry insights and student networking for ${DEPARTMENT_NAMES[ev.dept]}.`,
      bannerImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
      rsvpsCount: registeredIds.length,
      registeredUserIds: registeredIds,
      status: 'Upcoming',
      lifecycleStatus: 'published'
    });

    registeredIds.forEach((uid, rIdx) => {
      rsvps.push({
        id: `rsvp-${eid}-${rIdx}`,
        eventId: eid,
        userId: uid,
        status: 'registered',
        createdAt: daysAgo(2)
      });
    });
  });

  // 5 Past Events with attendees
  const pastDefs = [
    { title: 'Spring 2026 Annual Alumni Homecoming Meet', type: 'Alumni meet' as const, days: 30, dept: 'CMPN' as DepartmentCode, speaker: 'Rushabh Sanghavi & Dr. Sunita Rawat', comp: 'VIT Alumni Association' },
    { title: 'Generative AI Applications in Cloud Microservices', type: 'Technical workshop' as const, days: 22, dept: 'INFT' as DepartmentCode, speaker: 'Vikram Malhotra', comp: 'Microsoft' },
    { title: 'Campus Recruitment Strategy & Core Technical Interview Prep', type: 'Placement drive' as const, days: 16, dept: 'CMPN' as DepartmentCode, speaker: 'Aditya Sharma', comp: 'Goldman Sachs' },
    { title: 'Embedded Sensor Telemetry & LoRaWAN Masterclass', type: 'Technical workshop' as const, days: 12, dept: 'EXTC' as DepartmentCode, speaker: 'Prof. Sneha Deshpande', comp: 'VIT EXTC Department' },
    { title: 'Distributed File Systems & Linux Kernel Seminar', type: 'Research seminar' as const, days: 7, dept: 'CMPN' as DepartmentCode, speaker: 'Dr. Ravindra Sangale', comp: 'CMPN Research Cell' }
  ];

  pastDefs.forEach((pev, idx) => {
    const eid = `event-past-${idx + 1}`;
    const pastAttendees = students.slice(idx * 8 + 1, idx * 8 + 9).map(s => s.id);
    events.push({
      id: eid,
      title: pev.title,
      type: pev.type as unknown as EventType,
      date: dateOnlyString(daysAgo(pev.days)),
      time: '15:00 - 17:00 IST',
      startsAt: daysAgo(pev.days, 15),
      endsAt: daysAgo(pev.days, 17),
      locationOrUrl: 'Auditorium, VIT Campus',
      isOnline: false,
      mode: 'on_campus',
      speakerName: pev.speaker,
      speakerDesignation: 'Distinguished Speaker',
      speakerCompany: pev.comp,
      department: pev.dept,
      description: `Concluding session of ${pev.title}. Records archived for accreditation records.`,
      bannerImage: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop&q=80',
      rsvpsCount: pastAttendees.length,
      registeredUserIds: pastAttendees,
      status: 'Completed',
      lifecycleStatus: 'completed'
    });
  });

  // 1 Pending Review Event (for Admin moderation queue)
  events.push({
    id: 'event-pending-mod-1',
    title: 'Industry 4.0 Smart Robotics & Industrial IoT Seminar',
    type: 'Guest lecture' as unknown as EventType,
    date: dateOnlyString(daysFromNow(16)),
    time: '16:00 - 17:30 IST',
    startsAt: daysFromNow(16, 16),
    endsAt: daysFromNow(16, 17, 30),
    locationOrUrl: 'Auditorium B, VIT Wadala',
    isOnline: false,
    mode: 'on_campus',
    speakerName: 'Rohan Deshmukh',
    speakerDesignation: 'Robotics Engineering Lead',
    speakerCompany: 'Tata Advanced Systems',
    department: 'EXCS',
    description: 'Special guest session awaiting departmental approval.',
    bannerImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
    rsvpsCount: 0,
    registeredUserIds: [],
    status: 'Upcoming',
    lifecycleStatus: 'pending_review'
  });

  // 1 Cancelled Event (completes 16 total events)
  events.push({
    id: 'event-cancelled-1',
    title: 'Postponed: Legacy Monolith Migration Case Study',
    type: 'Technical workshop' as unknown as EventType,
    date: dateOnlyString(daysAgo(3)),
    time: '14:00 - 15:30 IST',
    startsAt: daysAgo(3, 14),
    endsAt: daysAgo(3, 15, 30),
    locationOrUrl: 'Online',
    isOnline: true,
    mode: 'online',
    speakerName: 'Alumni Chapter Speaker',
    speakerDesignation: 'Senior Architect',
    speakerCompany: 'Tech Corp',
    department: 'INFT',
    description: 'Postponed due to speaker travel schedule.',
    bannerImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    rsvpsCount: 0,
    registeredUserIds: [],
    status: 'Cancelled',
    lifecycleStatus: 'cancelled'
  });

  // ==========================================================================
  // 10. ANNOUNCEMENTS & NOTICES (12 total: 2 pinned, 1 expiring soon, all audiences)
  // Avoid using id 'ann-1' to bypass legacy retracted blacklist
  // ==========================================================================

  const announcements: Announcement[] = [
    {
      id: 'notice-1',
      title: 'NAAC A+ Accreditation: Institutional Governance & Career Portal Launch',
      category: 'Institutional Update',
      author: 'Dr. Sunita Rawat',
      authorId: 'user-admin-1',
      date: daysAgo(1),
      content: 'Vidyalankar Institute of Technology announces the launch of the enhanced NexaLink platform connecting verified alumni mentors with current students across all academic departments.',
      isImportant: true,
      isPinned: true, // Pinned 1
      targetAudience: 'All',
      severity: 'governance'
    },
    {
      id: 'notice-2',
      title: 'Campus Placement Drive 2026-27: Tier-1 Tech Registration Deadline',
      category: 'Placement Alert',
      author: 'Training & Placement Office',
      authorId: 'user-admin-1',
      date: daysAgo(2),
      content: 'All eligible final year BE students must verify their semester academic records and resume links before Friday 5:00 PM IST for corporate eligibility verification.',
      isImportant: true,
      isPinned: true, // Pinned 2
      targetAudience: 'Students',
      severity: 'actionable'
    },
    {
      id: 'notice-3',
      title: 'Action Required: Submit Graduation Passing Certificates for Portal Verification',
      category: 'Alumni News',
      author: 'Dean of Alumni Relations',
      authorId: 'user-admin-1',
      date: daysAgo(3),
      expiresAt: daysFromNow(2), // Expiring in 2 days!
      content: 'Alumni registering for 1-on-1 student mentorship are requested to complete the fast-track credential verification by uploading their degree or provisional certificate.',
      isImportant: false,
      isPinned: false,
      targetAudience: 'Alumni',
      severity: 'standard'
    },
    {
      id: 'notice-4',
      title: 'Alumni Global Chapters Meet: North America & Europe Virtual Sync',
      category: 'Alumni News',
      author: 'Dr. Sunita Rawat',
      authorId: 'user-admin-1',
      date: daysAgo(4),
      content: 'Quarterly virtual sync with overseas alumni chapter leads discussing student internship sponsorships and higher education webinars.',
      isImportant: false,
      isPinned: false,
      targetAudience: 'Alumni',
      severity: 'standard'
    },
    {
      id: 'notice-5',
      title: 'Department of Computer Engineering: Annual Faculty Research Index Submissions',
      category: 'Academic',
      author: 'Dr. Ravindra Sangale',
      authorId: 'user-faculty-1',
      date: daysAgo(5),
      content: 'Faculty colleagues are requested to submit their IEEE and Scopus publication indices to the departmental research cell.',
      isImportant: false,
      isPinned: false,
      targetAudience: 'Faculty',
      severity: 'academic'
    },
    {
      id: 'notice-6',
      title: 'Smart India Hackathon 2026: Institutional Team Nominations Announced',
      category: 'Event Highlight',
      author: 'Dean of Student Affairs',
      authorId: 'user-admin-1',
      date: daysAgo(6),
      content: 'Congratulations to all 12 teams selected to represent VIT Wadala in the national grand finale. Mentor allocation starts this Friday.',
      isImportant: false,
      isPinned: false,
      targetAudience: 'Students',
      severity: 'standard'
    },
    {
      id: 'notice-7',
      title: 'Faculty Development Program on Micro-Frontend & Cloud-Native Architectures',
      category: 'Academic',
      author: 'Dr. Vidya Chitre',
      authorId: 'fac-hod-1',
      date: daysAgo(7),
      content: 'A one-week AICTE-approved training program for computer and IT faculty members on enterprise web frameworks and container topologies.',
      isImportant: false,
      isPinned: false,
      targetAudience: 'Faculty',
      severity: 'academic'
    },
    {
      id: 'notice-8',
      title: 'Alumni Guest Lecture Series: Distributed Systems in Production',
      category: 'Event Highlight',
      author: 'Rushabh Sanghavi',
      authorId: 'user-alumni-1',
      date: daysAgo(8),
      content: 'Thank you to the 120+ students who attended the Google Cloud systems lecture. Slide decks and code samples have been published.',
      isImportant: false,
      isPinned: false,
      targetAudience: 'All',
      severity: 'standard'
    },
    {
      id: 'notice-9',
      title: 'Academic Calendar Notice: Term End Submissions and Viva Oral Examination',
      category: 'Academic',
      author: 'Controller of Examinations',
      authorId: 'user-admin-1',
      date: daysAgo(9),
      content: 'Odd-semester submission schedules and internal oral examination rosters have been uploaded on the college portal.',
      isImportant: false,
      isPinned: false,
      targetAudience: 'Students',
      severity: 'standard'
    },
    {
      id: 'notice-10',
      title: 'Call for Alumni Mentors: Spring 2027 Capstone Sponsorships',
      category: 'Alumni News',
      author: 'Dr. Sunita Rawat',
      authorId: 'user-admin-1',
      date: daysAgo(10),
      content: 'Inviting alumni in software, hardware, and biotechnology sectors to propose capstone problem statements for final year student batches.',
      isImportant: false,
      isPinned: false,
      targetAudience: 'Alumni',
      severity: 'standard'
    },
    {
      id: 'notice-11',
      title: 'Institute Library & IEEE Xplore Digital Access Renewal Notice',
      category: 'General',
      author: 'Head Librarian',
      authorId: 'user-admin-1',
      date: daysAgo(12),
      content: 'Campus-wide IEEE Xplore, ScienceDirect, and ACM Digital Library remote proxy credentials have been renewed for all students and faculty.',
      isImportant: false,
      isPinned: false,
      targetAudience: 'All',
      severity: 'standard'
    },
    {
      id: 'notice-12',
      title: 'Campus Sustainability & Green Energy Laboratory Inauguration',
      category: 'Institutional Update',
      author: 'Principal Office',
      authorId: 'user-admin-1',
      date: daysAgo(15),
      content: 'Inauguration of the solar energy research lab and IoT energy monitoring dashboard built by EXTC and Computer Engineering students.',
      isImportant: false,
      isPinned: false,
      targetAudience: 'All',
      severity: 'standard'
    }
  ];

  // ==========================================================================
  // 11. MESSAGING CONVERSATIONS (Aanya has 16 conversations, 5+ unread, 3+ starred, 30+ thread, attachments)
  // Overall >= 220 messages across 5+ days
  // ==========================================================================

  const messages: ChatMessage[] = [];

  interface ConvoMeta {
    convoId: string;
    partner: { id: string; name: string; role: 'student' | 'alumni' | 'faculty' | 'admin'; avatar: string };
    messageCount: number;
    unreadForAanya: number;
    isStarredForAanya: boolean;
    topic: string;
  }

  // 16 conversations for Aanya Patel (Student persona user-student-1)
  const aanyaConvos: ConvoMeta[] = [
    // 1. Multi-day deep thread (32 messages, attachments, unread)
    {
      convoId: 'convo-aanya-rushabh',
      partner: { id: 'user-alumni-1', name: 'Rushabh Sanghavi', role: 'alumni', avatar: demoAlumni.avatar },
      messageCount: 32,
      unreadForAanya: 1,
      isStarredForAanya: true,
      topic: 'Distributed Systems & Google Interview Preparation'
    },
    // 2. Faculty HOD (Dr. Ravindra Sangale, 14 messages, unread, attachment)
    {
      convoId: 'convo-aanya-sangale',
      partner: { id: 'user-faculty-1', name: 'Dr. Ravindra Sangale', role: 'faculty', avatar: demoFaculty.avatar },
      messageCount: 14,
      unreadForAanya: 1,
      isStarredForAanya: true,
      topic: 'Capstone IEEE Paper Review'
    },
    // 3. Alumni Manager (Vikram Malhotra, 14 messages, unread)
    {
      convoId: 'convo-aanya-vikram',
      partner: { id: 'user-alumni-vikram', name: 'Vikram Malhotra', role: 'alumni', avatar: devAlumni2.avatar },
      messageCount: 14,
      unreadForAanya: 1,
      isStarredForAanya: true,
      topic: 'Azure Cloud Architecture Mentorship'
    },
    // 4. Faculty HOD INFT (Dr. Vidya Chitre, 10 messages, unread)
    {
      convoId: 'convo-aanya-chitre',
      partner: { id: 'fac-hod-1', name: 'Dr. Vidya Chitre', role: 'faculty', avatar: faculty[2].avatar },
      messageCount: 10,
      unreadForAanya: 1,
      isStarredForAanya: false,
      topic: 'Cloud Security Audit Coursework'
    },
    // 5. Alumni (Aditya Sharma, 12 messages, unread)
    {
      convoId: 'convo-aanya-aditya',
      partner: { id: alumni[2].id, name: alumni[2].name, role: 'alumni', avatar: alumni[2].avatar },
      messageCount: 12,
      unreadForAanya: 1,
      isStarredForAanya: false,
      topic: 'Statement of Purpose Feedback'
    },
    // 6. Alumni (Tanmay Deshmukh, 8 messages, read)
    {
      convoId: 'convo-aanya-tanmay',
      partner: { id: alumni[3].id, name: alumni[3].name, role: 'alumni', avatar: alumni[3].avatar },
      messageCount: 8,
      unreadForAanya: 0,
      isStarredForAanya: false,
      topic: 'Algorithmic Trading & Quant Tech'
    },
    // 7. Alumni (Rhea Menon, 8 messages, read)
    {
      convoId: 'convo-aanya-rhea',
      partner: { id: alumni[4].id, name: alumni[4].name, role: 'alumni', avatar: alumni[4].avatar },
      messageCount: 8,
      unreadForAanya: 0,
      isStarredForAanya: false,
      topic: 'Embedded Telemetry Mentorship'
    },
    // 8. Alumni (Kunal Joshi, 8 messages, read)
    {
      convoId: 'convo-aanya-kunal',
      partner: { id: alumni[5].id, name: alumni[5].name, role: 'alumni', avatar: alumni[5].avatar },
      messageCount: 8,
      unreadForAanya: 0,
      isStarredForAanya: false,
      topic: 'DevOps & Kubernetes SRE'
    },
    // 9. Alumni (Pooja Shah, 8 messages, read)
    {
      convoId: 'convo-aanya-pooja',
      partner: { id: alumni[6].id, name: alumni[6].name, role: 'alumni', avatar: alumni[6].avatar },
      messageCount: 8,
      unreadForAanya: 0,
      isStarredForAanya: false,
      topic: 'Full-Stack React & Node Best Practices'
    },
    // 10. Alumni (Nikhil Rao, 8 messages, read)
    {
      convoId: 'convo-aanya-nikhil',
      partner: { id: alumni[7].id, name: alumni[7].name, role: 'alumni', avatar: alumni[7].avatar },
      messageCount: 8,
      unreadForAanya: 0,
      isStarredForAanya: false,
      topic: 'System Design Interview Questions'
    },
    // 11. Alumni (Sneha Kulkarni, 8 messages, read)
    {
      convoId: 'convo-aanya-sneha-alum',
      partner: { id: alumni[8].id, name: alumni[8].name, role: 'alumni', avatar: alumni[8].avatar },
      messageCount: 8,
      unreadForAanya: 0,
      isStarredForAanya: false,
      topic: 'FinTech Cloud Infrastructure'
    },
    // 12. Faculty (Prof. Sneha Deshpande, 10 messages, unread)
    {
      convoId: 'convo-aanya-sneha-fac',
      partner: { id: 'user-faculty-sneha', name: 'Prof. Sneha Deshpande', role: 'faculty', avatar: devFaculty2.avatar },
      messageCount: 10,
      unreadForAanya: 1, // 6th unread thread for Aanya!
      isStarredForAanya: false,
      topic: 'IoT Edge Sensor Interfacing'
    },
    // 13. Faculty (Dr. Amit Deshmukh, 6 messages, read)
    {
      convoId: 'convo-aanya-amit',
      partner: { id: faculty[3].id, name: faculty[3].name, role: 'faculty', avatar: faculty[3].avatar },
      messageCount: 6,
      unreadForAanya: 0,
      isStarredForAanya: false,
      topic: 'Wireless Telemetry Systems'
    },
    // 14. Faculty (Dr. Sandeep Joshi, 6 messages, read)
    {
      convoId: 'convo-aanya-sandeep',
      partner: { id: faculty[4].id, name: faculty[4].name, role: 'faculty', avatar: faculty[4].avatar },
      messageCount: 6,
      unreadForAanya: 0,
      isStarredForAanya: false,
      topic: 'Hardware-Software Co-Design'
    },
    // 15. Faculty (Dr. Kavita Nair, 6 messages, read)
    {
      convoId: 'convo-aanya-kavita',
      partner: { id: faculty[5].id, name: faculty[5].name, role: 'faculty', avatar: faculty[5].avatar },
      messageCount: 6,
      unreadForAanya: 0,
      isStarredForAanya: false,
      topic: 'Medical Signal Processing Algorithms'
    },
    // 16. Institutional Administrator (Dr. Sunita Rawat, 8 messages, read)
    {
      convoId: 'convo-aanya-sunita',
      partner: { id: 'user-admin-1', name: 'Dr. Sunita Rawat', role: 'admin', avatar: demoAdmin.avatar },
      messageCount: 8,
      unreadForAanya: 0,
      isStarredForAanya: false,
      topic: 'Institutional Fellowship & Accreditation'
    }
  ];

  // Generate messages for Aanya's 16 conversations
  aanyaConvos.forEach((c) => {
    const total = c.messageCount;
    const baseDays = Math.min(5, Math.floor(total / 3));

    for (let m = 1; m <= total; m++) {
      const isFromAanya = m % 2 === 1;
      const sender = isFromAanya
        ? { id: 'user-student-1', name: 'Aanya Patel', role: 'student' as const, avatar: demoStudent.avatar }
        : c.partner;
      const receiver = isFromAanya
        ? c.partner
        : { id: 'user-student-1', name: 'Aanya Patel', role: 'student' as const, avatar: demoStudent.avatar };

      const daysBack = baseDays - Math.floor((m / total) * baseDays);
      const hourOffset = (m % 8) + 9;
      const msgTimestamp = daysAgo(daysBack, -hourOffset, m * 2);

      // Unread messages for Aanya
      const isUnread = (!isFromAanya) && (m > total - c.unreadForAanya);

      let content = `[${c.topic}] Message #${m}: Discussing key points regarding technical milestones and architecture.`;
      let attachmentName: string | undefined = undefined;

      // Attachment messages
      if (c.convoId === 'convo-aanya-rushabh' && m === 10) {
        attachmentName = 'vit_capstone_distributed_cache_spec.pdf';
        content = 'Sharing the architectural specification document for the Go distributed cache:';
      } else if (c.convoId === 'convo-aanya-sangale' && m === 5) {
        attachmentName = 'ieee_draft_consensus_benchmark_v2.pdf';
        content = 'Respected Sir, attaching our latest IEEE manuscript draft for your review:';
      } else if (c.convoId === 'convo-aanya-vikram' && m === 4) {
        attachmentName = 'azure_microservices_architecture_diagram.png';
        content = 'Attaching the high-level cloud topology diagram for your critique:';
      }

      messages.push({
        id: `msg-${c.convoId}-${m}`,
        conversationId: c.convoId,
        senderId: sender.id,
        senderName: sender.name,
        senderRole: sender.role,
        senderAvatar: sender.avatar,
        receiverId: receiver.id,
        content,
        timestamp: msgTimestamp,
        isRead: !isUnread,
        attachmentName,
        status: m === total ? (rng.boolean(0.5) ? 'delivered' : 'read') : 'read'
      });
    }
  });

  // Additional conversations for Rushabh Sanghavi (Alumni persona user-alumni-1)
  // Ensure Rushabh has 4 unread chats: with Aanya (from above), plus 3 other students
  const rushabhStudentThreads = [
    { stud: students[4], unread: true, topic: 'SRE Internship Referral Discussion' },
    { stud: students[5], unread: true, topic: 'Kubernetes Operator Deep-dive' },
    { stud: students[6], unread: true, topic: 'Google Summer of Code Advice' }
  ];

  rushabhStudentThreads.forEach((th, idx) => {
    const convoId = `convo-rushabh-stud-${idx + 2}`;
    for (let m = 1; m <= 8; m++) {
      const isFromStudent = m % 2 === 1;
      const sender = isFromStudent ? th.stud : demoAlumni;
      const receiver = isFromStudent ? demoAlumni : th.stud;
      const isUnread = isFromStudent && m === 8 && th.unread;

      messages.push({
        id: `msg-${convoId}-${m}`,
        conversationId: convoId,
        senderId: sender.id,
        senderName: sender.name,
        senderRole: sender.role,
        senderAvatar: sender.avatar,
        receiverId: receiver.id,
        content: `[${th.topic}] Discussion step ${m}.`,
        timestamp: daysAgo(1, -idx, m),
        isRead: !isUnread,
        status: 'delivered'
      });
    }
  });

  // Alumni-Faculty conversations (Rushabh <-> Dr. Sangale, Vikram <-> Dr. Chitre)
  const alumniFacultyThreads = [
    { alumni: demoAlumni, faculty: demoFaculty, convoId: 'convo-rushabh-sangale', topic: 'Alumni Lecture Series Syllabus Coordination' },
    { alumni: devAlumni2, faculty: faculty[2], convoId: 'convo-vikram-chitre', topic: 'Cloud Infrastructure Curriculum Revision' }
  ];

  alumniFacultyThreads.forEach((af) => {
    for (let m = 1; m <= 6; m++) {
      const isFromAlumni = m % 2 === 1;
      const sender = isFromAlumni ? af.alumni : af.faculty;
      const receiver = isFromAlumni ? af.faculty : af.alumni;

      messages.push({
        id: `msg-${af.convoId}-${m}`,
        conversationId: af.convoId,
        senderId: sender.id,
        senderName: sender.name,
        senderRole: sender.role,
        senderAvatar: sender.avatar,
        receiverId: receiver.id,
        content: `[${af.topic}] Collaboration update point #${m}.`,
        timestamp: daysAgo(2, -m, m * 5),
        isRead: true,
        status: 'read'
      });
    }
  });

  // Alumni-Alumni conversation (Rushabh <-> Vikram)
  for (let m = 1; m <= 6; m++) {
    const isFromRushabh = m % 2 === 1;
    const sender = isFromRushabh ? demoAlumni : devAlumni2;
    const receiver = isFromRushabh ? devAlumni2 : demoAlumni;

    messages.push({
      id: `msg-convo-rushabh-vikram-${m}`,
      conversationId: 'convo-rushabh-vikram',
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role,
      senderAvatar: sender.avatar,
      receiverId: receiver.id,
      content: `[Global VIT Alumni Chapter] Coordination note #${m}.`,
      timestamp: daysAgo(3, -m, m * 4),
      isRead: true,
      status: 'read'
    });
  }

  // 4 Reported Messages (for Admin moderation queue)
  const reportConfigs: { reason: string; status: 'pending' | 'dismissed' | 'actioned' }[] = [
    { reason: 'spam', status: 'pending' },
    { reason: 'off-topic', status: 'pending' },
    { reason: 'asking for personal contact details', status: 'actioned' },
    { reason: 'inappropriate tone', status: 'dismissed' }
  ];

  reportConfigs.forEach((rep, idx) => {
    const student = students[idx + 15];
    const targetMsg: ChatMessage = {
      id: `msg-reported-${idx + 1}`,
      conversationId: `convo-reported-${idx + 1}`,
      senderId: student.id,
      senderName: student.name,
      senderRole: 'student',
      senderAvatar: student.avatar,
      receiverId: 'user-alumni-1',
      content: `Reported message specimen #${idx + 1} flagged for administrative review due to ${rep.reason}.`,
      timestamp: daysAgo(idx + 1, 4),
      isRead: true,
      isReported: true,
      reportedAt: daysAgo(idx + 1, 2),
      reportedBy: 'user-alumni-1',
      reportReason: rep.reason,
      moderationStatus: rep.status,
      moderatedBy: rep.status !== 'pending' ? 'user-admin-1' : undefined,
      moderatedAt: rep.status !== 'pending' ? daysAgo(idx, 1) : undefined
    };
    messages.push(targetMsg);
  });

  // ==========================================================================
  // 12. NOTIFICATIONS (10 per demo persona, mixed read/unread, all bell types)
  // ==========================================================================

  const notifications: NotificationItem[] = [];

  const bellNotificationTypes: { type: NotificationType; category: NotificationItem['category']; title: string; body: string }[] = [
    { type: 'Job Opportunity', category: 'opportunity', title: 'New Career Referral Posted', body: 'Google Cloud Compute team has published a new SDE-1 opening.' },
    { type: 'Internship Posting', category: 'opportunity', title: 'Summer SRE Internship Open', body: 'Applications are now open for pre-final year engineering students.' },
    { type: 'Event Announcement', category: 'event', title: 'Upcoming Campus Masterclass', body: 'Distributed Systems Masterclass starts in 2 days. Check your seat details.' },
    { type: 'Event Announcement', category: 'event', title: 'Guest Lecture by Goldman Sachs', body: 'Quantitative Finance architecture webinar confirmed.' },
    { type: 'Mentorship Request', category: 'mentorship', title: '1-on-1 Mentorship Request Update', body: 'Your mentorship consultation request has been approved.' },
    { type: 'Mentorship Approval', category: 'mentorship', title: 'Session Completed', body: 'Please leave a review for your recent career advisory session.' },
    { type: 'Account Verification', category: 'verification', title: 'Institutional Credential Verified', body: 'Your VIT departmental affiliation has been verified by the registrar.' },
    { type: 'Admin Action', category: 'admin', title: 'Placement Drive Schedule', body: 'Tier-1 tech companies have uploaded their screening test guidelines.' },
    { type: 'Administrator Announcement', category: 'announcement', title: 'NAAC A+ Accreditation Celebration', body: 'Read the latest message from the Dean of Student Affairs.' },
    { type: 'System Alert', category: 'general', title: 'Security & Profile Backup Active', body: 'Institutional audit logging and privacy protections active.' }
  ];

  const headlineUserIds = [
    { id: 'user-student-1', name: 'Aanya Patel', role: 'student' },
    { id: 'user-alumni-1', name: 'Rushabh Sanghavi', role: 'alumni' },
    { id: 'user-faculty-1', name: 'Dr. Ravindra Sangale', role: 'faculty' },
    { id: 'user-admin-1', name: 'Dr. Sunita Rawat', role: 'admin' }
  ];

  headlineUserIds.forEach((u) => {
    bellNotificationTypes.forEach((n, idx) => {
      // 4 unread (idx < 4) and 6 read (idx >= 4)
      const isRead = idx >= 4;
      notifications.push({
        id: `notif-${u.id}-${idx + 1}`,
        user_id: u.id,
        title: n.title,
        body: `${n.body} (User: ${u.name})`,
        created_at: daysAgo(idx, idx + 1),
        type: n.type,
        category: n.category,
        is_read: isRead,
        link: n.category === 'opportunity' ? 'opportunities' : n.category === 'event' ? 'events' : n.category === 'mentorship' ? 'mentorship' : undefined
      });
    });
  });

  // ==========================================================================
  // 13. AUDIT LOGS (Total >= 70, spread over 30 days)
  // ==========================================================================

  const auditLogs: AuditLogEntry[] = [];
  const auditActions = [
    { action: 'VERIFY_USER_APPROVE', detail: 'Approved academic enrollment verification credentials' },
    { action: 'VERIFY_USER_REJECT', detail: 'Rejected submitted proof due to low legibility' },
    { action: 'CLARIFICATION_REQUESTED', detail: 'Requested updated semester mark sheet clarification' },
    { action: 'EXPORT_NAAC_5_4_1', detail: 'Generated NAAC Metric 5.4.1 Alumni contribution dataset' },
    { action: 'EXPORT_NIRF_SUMMARY', detail: 'Exported NIRF annual student placement & progression ledger' },
    { action: 'BULK_GRADUATION_BATCH', detail: 'Graduated final-year BE student cohorts to Alumni' },
    { action: 'ANNOUNCEMENT_PUBLISH', detail: 'Published administrative advisory announcement' },
    { action: 'MESSAGE_REPORT_ACTIONED', detail: 'Actioned reported chat message flag' },
    { action: 'ADMIN_LOGIN', detail: 'Administrative console authenticated session' },
    { action: 'ROLE_TRANSITION_APPROVE', detail: 'Approved student-to-alumni status transition' }
  ];

  for (let i = 1; i <= 72; i++) {
    const act = auditActions[(i - 1) % auditActions.length];
    const days = Math.floor((i / 72) * 30);
    auditLogs.push({
      id: `audit-${i}`,
      action: act.action,
      performedBy: i % 5 === 0 ? 'Prof. Rajesh Kumar (admin)' : 'Dr. Sunita Rawat (admin)',
      targetUserOrItem: i % 2 === 0 ? `Student ${students[i % students.length].name}` : `Job Posting #JOB-${100 + i}`,
      timestamp: daysAgo(days, (i % 8) + 1, (i * 7) % 60),
      details: `${act.detail} [Reference ID: AUD-${202600 + i}].`,
      isBulkAction: act.action === 'BULK_GRADUATION_BATCH',
      bulkMetadata: act.action === 'BULK_GRADUATION_BATCH' ? {
        affectedCount: 14,
        missingEmailCount: 4,
        studentNames: students.slice(1, 15).map(s => s.name)
      } : undefined
    });
  }

  // Admin invites
  const adminInvites: AdminInvite[] = [
    {
      id: 'invite-1',
      invitedEmail: 'meera.sharma@vit.edu.in',
      invitedByAdminId: 'user-admin-1',
      invitedAt: daysAgo(2),
      status: 'pending'
    },
    {
      id: 'invite-2',
      invitedEmail: 'deven.joshi@vit.edu.in',
      invitedByAdminId: 'user-admin-1',
      invitedAt: daysAgo(5),
      status: 'accepted',
      acceptedAt: daysAgo(4)
    }
  ];

  return {
    demoAdmin,
    demoAdmin2,
    demoAlumni,
    demoStudent,
    demoFaculty,
    adminInvites,
    students,
    alumni,
    faculty,
    jobs,
    events,
    mentorshipRequests,
    announcements,
    notifications,
    messages,
    applications,
    rsvps,
    auditLogs
  };
}
