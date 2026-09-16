import type {
  User,
  AlumniProfile,
  StudentProfile,
  FacultyProfile,
  JobListing,
  EventItem,
  MentorshipRequest,
  Announcement,
  ChatMessage,
  DepartmentInfo,
  FeedbackItem,
  SupportTicket,
  FAQItem,
  NotificationItem,
  AdminInvite
} from '../types';

export const DEMO_ADMIN: User = {
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

export const DEMO_ADMIN_2: User = {
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

export const INITIAL_ADMIN_INVITES: AdminInvite[] = [
  {
    id: 'invite-1',
    invitedEmail: 'meera.sharma@vit.edu.in',
    invitedByAdminId: 'user-admin-1',
    invitedAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'pending'
  }
];

export const DEMO_ALUMNI: AlumniProfile = {
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
  activeMenteesCount: 2,
  isVerified: true,
  verificationStatus: 'Verified',
  isActive: true,
  personalEmail: 'rushabh.sanghavi@gmail.com',
  phone: '+91 98201 67890',
  linkedIn: 'https://linkedin.com',
  github: 'https://github.com'
};

export const DEMO_STUDENT: StudentProfile = {
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
  linkedIn: 'https://linkedin.com',
  github: 'https://github.com',
  isVerified: true,
  verificationStatus: 'Verified',
  isActive: true,
  bio: 'Final year CMPN student passionate about large-scale backend systems and cloud infrastructure.'
};

export const DEMO_FACULTY: FacultyProfile = {
  id: 'user-faculty-1',
  name: 'Dr. Ravindra Sangale',
  email: 'ravindra.sangale@gmail.com',
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
  bio: 'HOD Computer Engineering at VIT Wadala with 20+ years of teaching and industrial consultancy experience.'
};

export const DEPARTMENTS: DepartmentInfo[] = [
  { code: 'CMPN', name: 'Computer Engineering', establishedYear: 1999, hodName: 'Dr. Ravindra Sangale' },
  { code: 'INFT', name: 'Information Technology', establishedYear: 1999, hodName: 'Dr. Vidya Chitre' },
  { code: 'EXTC', name: 'Electronics & Telecommunication', establishedYear: 1999, hodName: 'Dr. Girish Gidaye' },
  { code: 'EXCS', name: 'Electronics & Computer Science', establishedYear: 2004, hodName: 'Dr. Arun Chavan' },
  { code: 'BIOM', name: 'Biomedical Engineering', establishedYear: 1999, hodName: 'Dr. Gajanan Nagare' },
  { code: 'MCA', name: 'Master of Computer Applications', establishedYear: 2008, hodName: 'Dr. Vidya Chitre' },
  { code: 'MBA', name: 'Master of Management Studies (MMS)', establishedYear: 2006, hodName: 'Dr. Amit Oak' }
];

export const INITIAL_TEACHERS: FacultyProfile[] = [
  DEMO_FACULTY,
  {
    id: 'fac-2',
    name: 'Dr. Vidya Chitre',
    email: 'vidya.chitre@vit.edu.in',
    role: 'faculty',
    department: 'INFT',
    employeeId: 'EMP-FAC-022',
    designation: 'Head of Department (HOD) & Professor',
    isHod: true,
    specialization: 'Cyber Security, Data Analytics & Cryptography',
    researchAreas: ['Blockchain Security', 'Privacy Preserving Data Mining', 'Threat Intelligence'],
    subjectsTaught: ['Cyber Security', 'Cryptography', 'Information Retrieval'],
    publications: [
      { title: 'Privacy Preserving Frameworks for IoT Data Streams', journalOrConference: 'Elsevier Computers & Security', year: 2023 }
    ],
    skills: ['Python', 'Network Security', 'Ethical Hacking', 'R'],
    industryInterests: ['FinTech Cyber Defense', 'Data Privacy Audits'],
    ongoingResearch: 'Zero-Knowledge Proof Implementations for Smart Contracts',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    phone: '+91 98202 33445',
    isVerified: true,
    verificationStatus: 'Verified',
    isActive: true
  },
  {
    id: 'fac-3',
    name: 'Prof. Arun Chavan',
    email: 'arun.chavan@vit.edu.in',
    role: 'faculty',
    department: 'EXCS',
    employeeId: 'EMP-FAC-031',
    designation: 'Associate Professor & HOD',
    isHod: true,
    specialization: 'Embedded Systems, VLSI Design & Microcontrollers',
    researchAreas: ['FPGA Acceleration', 'IoT Sensor Nodes', 'System on Chip (SoC)'],
    subjectsTaught: ['Embedded Systems', 'VLSI Design', 'Digital Signal Processing'],
    publications: [
      { title: 'Low Power FPGA Design for Wearable Diagnostics', journalOrConference: 'IEEE Micro', year: 2023 }
    ],
    skills: ['Verilog', 'Embedded C', 'RTOS', 'ARM Cortex'],
    industryInterests: ['Semiconductor Design', 'Medical Wearables'],
    ongoingResearch: 'Energy-Harvesting Micro-controllers for Biomedical Sensors',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    phone: '+91 98203 55667',
    isVerified: true,
    verificationStatus: 'Verified',
    isActive: true
  }
];

export const INITIAL_ALUMNI: AlumniProfile[] = [
  DEMO_ALUMNI,
  {
    id: 'alum-2',
    name: 'Rushil Dahisaria',
    email: 'rushil.dahisaria@alumni.vit.edu.in',
    role: 'alumni',
    department: 'INFT',
    graduationYear: 2020,
    enrollmentNo: '16101B0021',
    prn: '16101B0021',
    company: 'Microsoft',
    designation: 'Software Engineer II (Azure)',
    higherEducationInstitute: 'UT Austin',
    location: 'Hyderabad',
    country: 'India',
    skills: ['Azure Cloud', 'C#', '.NET Core', 'Microservices', 'Kubernetes'],
    experience: [
      { title: 'SDE II', company: 'Microsoft', duration: '2022 - Present' },
      { title: 'SDE I', company: 'Microsoft', duration: '2020 - 2022' }
    ],
    certifications: ['Microsoft Certified: Azure Solutions Architect Expert'],
    professionalAchievements: ['Lead Engineer on Azure Kubernetes Service (AKS) auto-scaler module'],
    bio: 'My engineering journey at VIT has been immensely encouraging because of generous, passionate, and enthusiastic faculty.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    linkedIn: 'https://linkedin.com',
    github: 'https://github.com',
    isVerified: true,
    verificationStatus: 'Verified',
    isActive: true,
    personalEmail: 'rushil.dahisaria@gmail.com',
    isMentoringAvailable: true,
    maxMentees: 4,
    activeMenteesCount: 1
  },
  {
    id: 'alum-3',
    name: 'Priya Kulkarni',
    email: 'priya.kulkarni@alumni.vit.edu.in',
    role: 'alumni',
    department: 'INFT',
    graduationYear: 2019,
    enrollmentNo: '15101B0089',
    prn: '15101B0089',
    company: 'Microsoft',
    designation: 'Senior Product Manager',
    higherEducationInstitute: 'Texas A&M University',
    location: 'Seattle, WA',
    country: 'USA',
    skills: ['Product Strategy', 'Agile', 'Cloud Architecture', 'User Research'],
    experience: [
      { title: 'Senior PM', company: 'Microsoft', duration: '2023 - Present' },
      { title: 'Product Manager', company: 'Amazon', duration: '2021 - 2023' }
    ],
    certifications: ['Certified Scrum Product Owner (CSPO)'],
    professionalAchievements: ['Launched Microsoft Teams AI Meeting Notes feature used by 10M+ users'],
    bio: 'VIT Wadala gave me exposure to technical paper presentations and campus hackathons.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    linkedIn: 'https://linkedin.com',
    github: 'https://github.com',
    isVerified: true,
    verificationStatus: 'Verified',
    isActive: true,
    personalEmail: 'priya.kulkarni@outlook.com',
    isMentoringAvailable: true,
    maxMentees: 3,
    activeMenteesCount: 1,
    higherStudies: {
      degree: 'M.S. in MIS',
      university: 'Texas A&M University',
      country: 'USA',
      year: 2021,
      fieldOfStudy: 'Management Information Systems'
    }
  },
  {
    id: 'alum-4',
    name: 'Rohan Mehta',
    email: 'rohan.mehta@alumni.vit.edu.in',
    role: 'alumni',
    department: 'CMPN',
    graduationYear: 2017,
    enrollmentNo: '13101A0054',
    prn: '13101A0054',
    company: 'Morgan Stanley',
    designation: 'Vice President - Quantitative Tech',
    higherEducationInstitute: 'IIT Bombay (M.Tech)',
    location: 'Mumbai',
    country: 'India',
    skills: ['Algorithmic Trading', 'C++', 'Java', 'Low Latency Systems'],
    experience: [
      { title: 'Vice President', company: 'Morgan Stanley', duration: '2023 - Present' }
    ],
    certifications: ['CFA Level II'],
    professionalAchievements: ['Built high-frequency order execution engine processing 100k transactions/sec'],
    bio: 'Campus placements at VIT Wadala launched my quant engineering career.',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    linkedIn: 'https://linkedin.com',
    isVerified: true,
    verificationStatus: 'Verified',
    isActive: true,
    isMentoringAvailable: true,
    maxMentees: 5,
    activeMenteesCount: 3,
    loginRecoveryNeeded: true
  },
  {
    id: 'alum-pending-1',
    name: 'Siddharth Joshi',
    email: 'siddharth.j@alumni.vit.edu.in',
    role: 'alumni',
    department: 'CMPN',
    graduationYear: 2023,
    enrollmentNo: '19101A0099',
    company: 'Amazon AWS',
    designation: 'Software Development Engineer I',
    location: 'Bengaluru',
    country: 'India',
    skills: ['Java', 'DynamoDB', 'AWS Lambda'],
    experience: [],
    certifications: [],
    professionalAchievements: [],
    bio: 'Newly registered alumni waiting for credential verification by VIT Alumni Cell.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    isVerified: false,
    verificationStatus: 'Pending Verification',
    isActive: true,
    isMentoringAvailable: true,
    maxMentees: 3,
    activeMenteesCount: 0
  }
];

export const INITIAL_STUDENTS: StudentProfile[] = [
  DEMO_STUDENT,
  {
    id: 'stud-2',
    name: 'Karan Verma',
    email: 'karan.verma@student.vit.edu.in',
    role: 'student',
    department: 'INFT',
    graduationYear: 2023,
    expectedGraduationYear: 2023,
    prn: '21101B0018',
    enrollmentNo: '21101B0018',
    currentYear: 'TE',
    semester: 'Semester 6',
    cgpa: 8.95,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    skills: ['Java', 'Spring Boot', 'AWS', 'Docker', 'React'],
    areasOfInterest: ['Cloud Computing', 'Microservices', 'Enterprise Web Apps'],
    careerGoal: 'Cloud Solutions Engineer at Microsoft or AWS',
    preferredIndustry: 'Cloud Infrastructure',
    preferredHigherStudies: 'MS in Computer Science',
    certifications: ['AWS Certified Developer Associate'],
    projects: [
      { title: 'Serverless E-Commerce Backend', description: 'Built using AWS Lambda and DynamoDB.', techStack: ['Java', 'AWS Lambda'] }
    ],
    targetCompanies: ['Microsoft', 'Amazon', 'TCS Digital'],
    linkedIn: 'https://linkedin.com',
    isVerified: true,
    verificationStatus: 'Verified',
    isActive: true
  },
  {
    id: 'stud-pending-1',
    name: 'Meera Nair',
    email: 'meera.nair@student.vit.edu.in',
    role: 'student',
    department: 'EXTC',
    graduationYear: 2027,
    prn: '23103C0051',
    enrollmentNo: '23103C0051',
    currentYear: 'SE',
    semester: 'Semester 3',
    cgpa: 8.70,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    skills: ['Python', 'Signal Processing', 'MATLAB'],
    areasOfInterest: ['Wireless Communication', 'IoT'],
    careerGoal: 'Embedded Systems Engineer',
    preferredIndustry: 'Telecommunications',
    preferredHigherStudies: 'M.Tech in EXTC',
    certifications: [],
    projects: [],
    targetCompanies: ['Qualcomm', 'Reliance Jio'],
    isVerified: false,
    verificationStatus: 'Pending Verification',
    isActive: true
  }
];

export const INITIAL_JOBS: JobListing[] = [
  {
    id: 'job-1',
    title: 'Software Development Engineer - I (SDE-1)',
    company: 'Google India',
    companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=100&auto=format&fit=crop&q=80',
    location: 'Bengaluru / Hyderabad',
    type: 'Job Vacancy',
    stipendOrSalary: '₹22 - 28 LPA',
    department: ['CMPN', 'INFT'],
    skillsRequired: ['Data Structures', 'System Design', 'Go', 'C++'],
    postedByAlumniId: 'user-alumni-1',
    postedByAlumniName: 'Rushabh Sanghavi',
    postedByRole: 'alumni',
    postedDate: '2026-07-20',
    applicationDeadline: '2026-08-30',
    description: 'Building large-scale backend infrastructure for Google Cloud Platform. Strong DSA and OS fundamentals required.',
    requirements: ['BE/BTech in CMPN or INFT', 'Strong algorithmic problem solving', 'Good knowledge of OS and Networks'],
    referralProvided: true,
    applicantsCount: 34,
    status: 'Active'
  },
  {
    id: 'job-2',
    title: 'Cloud Systems & DevOps Intern',
    company: 'Microsoft India',
    companyLogo: 'https://images.unsplash.com/photo-1642132652075-2b60abe56770?w=100&auto=format&fit=crop&q=80',
    location: 'Hyderabad (Hybrid)',
    type: 'Internship Opportunity',
    stipendOrSalary: '₹80,000 / month',
    department: ['CMPN', 'INFT', 'EXTC'],
    skillsRequired: ['Azure', 'Docker', 'Python', 'C#'],
    postedByAlumniId: 'alum-2',
    postedByAlumniName: 'Rushil Dahisaria',
    postedByRole: 'alumni',
    postedDate: '2026-07-22',
    applicationDeadline: '2026-08-25',
    description: '6-month internship on Azure Kubernetes Service (AKS) team. Open to 2026 graduating students.',
    requirements: ['Pre-final or Final year BE students', 'Basic containerization knowledge'],
    referralProvided: true,
    applicantsCount: 28,
    status: 'Active'
  },
  {
    id: 'job-3',
    title: 'Autonomous Edge Micro-datacenter Research Fellowship',
    company: 'VIT Research Lab (CMPN Dept)',
    companyLogo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=80',
    location: 'VIT Wadala Campus',
    type: 'Research Project',
    stipendOrSalary: '₹25,000 / month fellowship',
    department: ['CMPN', 'INFT', 'EXCS'],
    skillsRequired: ['Python', 'Machine Learning', 'Linux', 'Go'],
    postedByAlumniId: 'user-faculty-1',
    postedByAlumniName: 'Dr. Ravindra Sangale',
    postedByRole: 'faculty',
    postedDate: '2026-07-24',
    applicationDeadline: '2026-09-10',
    description: 'Research grant project sponsored by DST/IEEE on intelligent edge workload distribution. Co-publish papers with faculty.',
    requirements: ['Final year BE students with CGPA > 8.5', 'Proficiency in Python & Reinforcement Learning'],
    referralProvided: false,
    applicantsCount: 14,
    status: 'Active'
  }
];

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'event-1',
    title: 'VIT Annual Grand Alumni Reunion 2026',
    type: 'Alumni Meet',
    date: '2026-12-19',
    time: '05:00 PM IST',
    locationOrUrl: 'Vidyalankar Auditorium, VIT Wadala Campus, Mumbai',
    isOnline: false,
    speakerName: 'Dr. Sunita Rawat',
    speakerDesignation: 'Alumni Cell Head & Professor',
    speakerCompany: 'Vidyalankar Institute of Technology',
    description: 'Annual homecoming meet for all batches (1999–2026) featuring keynote by distinguished alumni, departmental networking, and cultural dinner.',
    bannerImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
    rsvpsCount: 412,
    registeredUserIds: ['user-student-1', 'user-alumni-1'],
    status: 'Upcoming'
  },
  {
    id: 'event-2',
    title: 'Webinar: Cracking FAANG & US MS Admissions',
    type: 'Webinar',
    date: '2026-08-15',
    time: '07:00 PM IST',
    locationOrUrl: 'Online via VIT v-Live Platform',
    isOnline: true,
    speakerName: 'Rushabh Sanghavi & Priya Kulkarni',
    speakerDesignation: 'Senior Engineers & PMs',
    speakerCompany: 'Google & Microsoft',
    description: 'Interactive session on GRE/TOEFL strategies, SOP drafting, and system design interview prep for CMPN/INFT students.',
    bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    rsvpsCount: 285,
    registeredUserIds: ['user-student-1'],
    status: 'Upcoming'
  },
  {
    id: 'event-3',
    title: 'Research Seminar: Next-Gen Cloud & Cyber Security',
    type: 'Research Seminar',
    date: '2026-09-05',
    time: '11:00 AM IST',
    locationOrUrl: 'Seminar Hall 3, VIT Wadala',
    isOnline: false,
    speakerName: 'Dr. Ravindra Sangale & Dr. Vidya Chitre',
    speakerDesignation: 'HOD CMPN & HOD INFT',
    speakerCompany: 'VIT Wadala',
    description: 'Faculty-student research symposium presenting active grant projects and UG/PG publication opportunities.',
    bannerImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
    rsvpsCount: 140,
    registeredUserIds: [],
    status: 'Upcoming'
  }
];

export const INITIAL_MENTORSHIP_REQUESTS: MentorshipRequest[] = [
  {
    id: 'ms-1',
    studentId: 'user-student-1',
    studentName: 'Aanya Patel',
    studentEmail: 'aanya.patel@student.vit.edu.in',
    studentDepartment: 'CMPN',
    studentYear: 'BE',
    studentEnrollmentNo: '22102A0042',
    mentorId: 'user-alumni-1',
    mentorName: 'Rushabh Sanghavi',
    mentorRole: 'alumni',
    mentorCompanyOrDept: 'Google',
    purposeOfRequest: 'Placement Preparation',
    areaOfGuidance: 'System Design and Resume Guidance for Google Campus Hiring',
    topic: 'Resume Review & System Design',
    message: 'Hello Rushabh Sir! I am preparing for Google campus hiring. Would appreciate a review of my resume and system design guidance.',
    requestedDate: '2026-07-24',
    status: 'Accepted',
    scheduledTime: '08:00 PM IST',
    meetingNotes: 'Keep your Google Docs resume ready with GitHub links.'
  },
  {
    id: 'ms-2',
    studentId: 'user-student-1',
    studentName: 'Aanya Patel',
    studentEmail: 'aanya.patel@student.vit.edu.in',
    studentDepartment: 'CMPN',
    studentYear: 'BE',
    studentEnrollmentNo: '22102A0042',
    mentorId: 'user-faculty-1',
    mentorName: 'Dr. Ravindra Sangale',
    mentorRole: 'faculty',
    mentorCompanyOrDept: 'CMPN HOD',
    purposeOfRequest: 'Research Collaboration',
    areaOfGuidance: 'Undergraduate Thesis Guidance on Distributed Raft Consensus',
    topic: 'Research Guidance',
    message: 'Respected HOD Sir, I would like your guidance on publishing my Distributed Cache project in an IEEE venue.',
    requestedDate: '2026-07-25',
    status: 'Pending'
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'VIT Wadala Reaccredited with NAAC Grade A+',
    category: 'Institutional Update',
    author: 'Dr. Sunita Rawat (Alumni Cell Head)',
    date: '2026-07-15',
    content: 'We are proud to announce that Vidyalankar Institute of Technology (VIT Wadala) has been reaccredited with NAAC Grade A+.',
    isImportant: true,
    targetAudience: 'All'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Mentorship Request Accepted',
    message: 'Rushabh Sanghavi (Google) accepted your mentorship request for System Design.',
    date: '2026-07-24 18:30',
    type: 'Mentorship Approval',
    isRead: false,
    linkTab: 'mentorship'
  },
  {
    id: 'notif-2',
    title: 'New Opportunity Match',
    message: 'Microsoft India posted: Cloud Systems & DevOps Intern (Matches your Azure/Docker skills).',
    date: '2026-07-22 10:00',
    type: 'Internship Posting',
    isRead: false,
    linkTab: 'jobs'
  },
  {
    id: 'notif-3',
    title: 'Upcoming Grand Reunion',
    message: 'VIT Annual Grand Alumni Reunion 2026 registration is live. Secure your RSVP spot.',
    date: '2026-07-20 12:00',
    type: 'Event Announcement',
    isRead: true,
    linkTab: 'events'
  }
];

export const INITIAL_FEEDBACK: FeedbackItem[] = [
  {
    id: 'fb-1',
    userName: 'Karan Verma',
    userRole: 'student',
    email: 'karan.verma@student.vit.edu.in',
    subject: 'Request for Microsoft Internship Webinar',
    message: 'Can we have an exclusive alumni webinar focused on Azure Cloud internships?',
    date: '2026-07-23',
    status: 'Open'
  }
];

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'ticket-1',
    ticketNumber: 'TKT-2026-089',
    userName: 'Neha Deshmukh',
    userRole: 'alumni',
    category: 'Verification',
    subject: 'Degree Certificate Re-verification Request',
    date: '2026-07-24',
    status: 'Open'
  }
];

export const INITIAL_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How do alumni verify their degree records on NexaLink?',
    answer: 'Alumni can upload their VIT graduation passing certificate or PRN number during registration for fast-track verification by the Alumni Cell.',
    category: 'Verification'
  },
  {
    id: 'faq-2',
    question: 'How can students request 1-on-1 mentorship with alumni or faculty?',
    answer: 'Students can search the Directory, view recommendations, select a purpose (Career Guidance, Research, Placement Prep), and send a request.',
    category: 'Mentorship'
  }
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-r1',
    senderId: 'user-student-1',
    senderName: 'Aanya Patel',
    senderRole: 'student',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    receiverId: 'user-alumni-1',
    category: 'Placement Preparation',
    content: 'Hello Rushabh Sir! I am a final year CMPN student at VIT Wadala. Would love your feedback on my distributed database project.',
    timestamp: '2026-07-24 18:30',
    isRead: true,
    attachmentName: 'Aanya_Patel_Resume_VIT.pdf',
    attachmentUrl: 'https://vit.edu.in/resumes/aanya_patel_vit.pdf'
  },
  {
    id: 'msg-r2',
    senderId: 'user-alumni-1',
    senderName: 'Rushabh Sanghavi',
    senderRole: 'alumni',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    receiverId: 'user-student-1',
    category: 'Placement Preparation',
    content: 'Hi Aanya! Great to connect with a fellow CMPN VITian. Send over your project link here.',
    timestamp: '2026-07-24 19:15',
    isRead: true
  },
  {
    id: 'msg-rd1',
    senderId: 'user-student-1',
    senderName: 'Aanya Patel',
    senderRole: 'student',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    receiverId: 'alum-2',
    category: 'Career Guidance',
    content: 'Hello Rushil Sir, I saw the Azure Cloud & DevOps Internship posting at Microsoft India. Is there a referral opportunity for 2026 BE batch?',
    timestamp: '2026-07-25 10:10',
    isRead: true
  },
  {
    id: 'msg-fac1',
    senderId: 'user-student-1',
    senderName: 'Aanya Patel',
    senderRole: 'student',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    receiverId: 'user-faculty-1',
    category: 'Research Collaboration',
    content: 'Respected HOD Sir, I would like to consult you regarding publishing our Distributed Consensus project paper.',
    timestamp: '2026-07-25 11:00',
    isRead: true
  },
  {
    id: 'msg-reported-seed-1',
    senderId: 'user-alumni-2',
    senderName: 'Vikramaditya Shinde',
    senderRole: 'alumni',
    senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    receiverId: 'user-student-1',
    category: 'Industry Interaction',
    content: 'Please send your personal bank account details and deposit fee for direct off-campus placement processing.',
    timestamp: '2026-08-08 16:20',
    isRead: true,
    isReported: true,
    reportedAt: '2026-08-08T16:25:00.000Z',
    reportedBy: 'user-student-1',
    reportReason: 'Soliciting money and sensitive banking details for unauthorized job referral.',
    moderationStatus: 'pending'
  },
  {
    id: 'msg-fr1',
    senderId: 'user-faculty-1',
    senderName: 'Dr. Ravindra Sangale',
    senderRole: 'faculty',
    senderAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    receiverId: 'user-alumni-1',
    category: 'Research Collaboration',
    content: 'Hi Rushabh! Would love to discuss a Research Collaboration for our CMPN final year students on Distributed Systems.',
    timestamp: '2026-07-25 14:00',
    isRead: true
  },
  {
    id: 'msg-fr2',
    senderId: 'user-alumni-1',
    senderName: 'Rushabh Sanghavi',
    senderRole: 'alumni',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    receiverId: 'user-faculty-1',
    category: 'Research Collaboration',
    content: 'Hi Dr. Ravindra Sangale! Great to hear from you. Research Collaboration sounds excellent. Happy to collaborate with the CMPN department.',
    timestamp: '2026-07-25 14:30',
    isRead: true
  }
];
