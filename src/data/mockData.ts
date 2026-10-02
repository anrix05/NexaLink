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
  bio: 'HOD Computer Engineering at VIT Wadala with 20+ years of teaching and industrial consultancy experience.'
};



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
    stipendOrSalary: '₹22.0 – 28.0 LPA',
    department: ['CMPN', 'INFT'],
    skillsRequired: ['Data Structures', 'System Design', 'Go', 'C++'],
    postedByAlumniId: 'user-alumni-1',
    postedByAlumniName: 'Rushabh Sanghavi',
    postedByRole: 'alumni',
    postedDate: '2026-10-01',
    applicationDeadline: '2026-11-25',
    description: 'Building large-scale backend infrastructure for Google Cloud Platform. Strong DSA and OS fundamentals required.',
    requirements: ['BE/BTech in CMPN or INFT', 'Strong algorithmic problem solving', 'Good knowledge of OS and Networks'],
    referralProvided: true,
    applicantsCount: 34,
    status: 'Active',
    moderationStatus: 'Approved',
    lifecycleStatus: 'published',
    workMode: 'Hybrid',
    compensationDisclosed: true,
    compensationMin: 2200000,
    compensationMax: 2800000,
    compensationPeriod: 'per_year',
    compensationCurrency: 'INR',
    openings: 3,
    referralOpenings: 5,
    eligibility: {
      departments: ['CMPN', 'INFT'],
      minCgpa: 8.0,
      strict: false
    },
    applyMethod: 'nexalink',
    closesAt: '2026-11-25T18:29:59.000Z',
    viewsCount: 245
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
    postedDate: '2026-10-01',
    applicationDeadline: '2026-11-15',
    description: '6-month internship on Azure Kubernetes Service (AKS) team. Open to 2026 graduating students.',
    requirements: ['Pre-final or Final year BE students', 'Basic containerization knowledge'],
    referralProvided: true,
    applicantsCount: 28,
    status: 'Active',
    moderationStatus: 'Approved',
    lifecycleStatus: 'published',
    workMode: 'Hybrid',
    compensationDisclosed: true,
    compensationMin: 80000,
    compensationMax: 80000,
    compensationPeriod: 'per_month',
    compensationCurrency: 'INR',
    durationMonths: 6,
    openings: 2,
    eligibility: {
      departments: ['CMPN', 'INFT', 'EXTC'],
      minCgpa: 7.5,
      strict: true
    },
    applyMethod: 'nexalink',
    closesAt: '2026-11-15T18:29:59.000Z',
    viewsCount: 180
  },
  {
    id: 'job-3',
    title: 'Autonomous Edge Micro-datacenter Research Fellowship',
    company: 'VIT Research Lab (CMPN Dept)',
    companyLogo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=80',
    location: 'VIT Wadala Campus',
    type: 'Research Project',
    stipendOrSalary: '₹25,000 / month',
    department: ['CMPN', 'INFT', 'EXCS'],
    skillsRequired: ['Python', 'Machine Learning', 'Linux', 'Go'],
    postedByAlumniId: 'user-faculty-1',
    postedByAlumniName: 'Dr. Ravindra Sangale',
    postedByRole: 'faculty',
    postedDate: '2026-10-01',
    applicationDeadline: '2026-12-10',
    description: 'Research grant project sponsored by DST/IEEE on intelligent edge workload distribution. Co-publish papers with faculty.',
    requirements: ['Final year BE students with CGPA > 8.5', 'Proficiency in Python & Reinforcement Learning'],
    referralProvided: false,
    applicantsCount: 14,
    status: 'Active',
    moderationStatus: 'Approved',
    lifecycleStatus: 'published',
    workMode: 'On-site',
    compensationDisclosed: true,
    compensationMin: 25000,
    compensationMax: 25000,
    compensationPeriod: 'per_month',
    compensationCurrency: 'INR',
    durationMonths: 12,
    openings: 4,
    eligibility: {
      departments: ['CMPN', 'INFT', 'EXCS'],
      minCgpa: 8.5,
      strict: false
    },
    applyMethod: 'nexalink',
    closesAt: '2026-12-10T18:29:59.000Z',
    viewsCount: 120
  },
  {
    id: 'job-4',
    title: 'Quantitative Tech & Algorithmic Trading Analyst',
    company: 'Morgan Stanley',
    companyLogo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80',
    location: 'Mumbai (Nirlon Knowledge Park)',
    type: 'Job Vacancy',
    stipendOrSalary: '₹18.0 – 24.0 LPA',
    department: ['CMPN', 'INFT', 'EXTC'],
    skillsRequired: ['C++', 'Python', 'Financial Engineering', 'Algorithms'],
    postedByAlumniId: 'user-alumni-1',
    postedByAlumniName: 'Rushabh Sanghavi',
    postedByRole: 'alumni',
    postedDate: '2026-10-02',
    applicationDeadline: '2026-11-20',
    description: 'High-frequency market making technology team opening. In-person technical assessments and algorithmic problem solving.',
    requirements: ['Solid C++ or Java knowledge', 'Strong mathematical foundations'],
    referralProvided: true,
    applicantsCount: 0,
    status: 'Pending Approval',
    moderationStatus: 'Pending Approval',
    lifecycleStatus: 'pending_review',
    workMode: 'On-site',
    compensationDisclosed: true,
    compensationMin: 1800000,
    compensationMax: 2400000,
    compensationPeriod: 'per_year',
    compensationCurrency: 'INR',
    openings: 2,
    referralOpenings: 3,
    eligibility: {
      departments: ['CMPN', 'INFT', 'EXTC'],
      minCgpa: 8.0,
      strict: false
    },
    applyMethod: 'nexalink',
    closesAt: '2026-11-20T18:29:59.000Z',
    viewsCount: 15
  }
];

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'event-1',
    title: 'VIT Annual Grand Alumni Reunion 2026',
    type: 'Alumni Meet',
    date: '2026-12-19',
    time: '5:00 pm – 8:00 pm IST',
    locationOrUrl: 'Vidyalankar Auditorium, Central Campus Plaza, VIT Wadala',
    isOnline: false,
    mode: 'on_campus',
    venueId: 'venue-auditorium',
    startsAt: '2026-12-19T11:30:00.000Z',
    endsAt: '2026-12-19T14:30:00.000Z',
    speakerName: 'Dr. Sunita Rawat',
    speakerDesignation: 'Alumni Cell Head & Professor',
    speakerCompany: 'Vidyalankar Institute of Technology',
    speakers: [
      {
        id: 'spk-1',
        name: 'Dr. Sunita Rawat',
        title: 'Alumni Cell Head & Professor',
        organization: 'Vidyalankar Institute of Technology',
        isExternal: false
      }
    ],
    hostId: 'user-faculty-1',
    hostRole: 'faculty',
    hostName: 'Dr. Ravindra Sangale',
    department: 'CMPN',
    description: 'Annual homecoming meet for all batches (1999–2026) featuring keynote by distinguished alumni, departmental networking, and cultural dinner.',
    bannerImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
    rsvpsCount: 412,
    registeredUserIds: ['user-student-1', 'user-alumni-1'],
    status: 'Upcoming',
    lifecycleStatus: 'published',
    capacityLimit: 500,
    waitlistEnabled: true,
    certificatesEnabled: true
  },
  {
    id: 'event-2',
    title: 'Alumni Panel: Cracking FAANG & US MS Admissions',
    type: 'Guest Lecture',
    date: '2026-11-20',
    time: '7:00 pm – 8:30 pm IST',
    locationOrUrl: 'Online via NexaLink v-Live',
    isOnline: true,
    mode: 'online',
    meetingUrl: 'https://meet.google.com/xyz-vit-faang',
    startsAt: '2026-11-20T13:30:00.000Z',
    endsAt: '2026-11-20T15:00:00.000Z',
    speakerName: 'Rushabh Sanghavi & Priya Kulkarni',
    speakerDesignation: 'Senior Engineers & PMs',
    speakerCompany: 'Google & Microsoft',
    speakers: [
      {
        id: 'spk-faang-1',
        memberId: 'user-alumni-1',
        name: 'Rushabh Sanghavi',
        title: 'Senior Software Engineer',
        organization: 'Google',
        isExternal: false
      },
      {
        id: 'spk-faang-2',
        name: 'Priya Kulkarni',
        title: 'Product Manager',
        organization: 'Microsoft',
        isExternal: false
      }
    ],
    hostId: 'user-faculty-1',
    hostRole: 'faculty',
    hostName: 'Dr. Ravindra Sangale',
    department: 'CMPN',
    description: 'Interactive session on GRE/TOEFL strategies, SOP drafting, and system design interview prep for CMPN/INFT students.',
    bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    rsvpsCount: 285,
    registeredUserIds: ['user-student-1'],
    status: 'Upcoming',
    lifecycleStatus: 'published',
    capacityLimit: 300,
    waitlistEnabled: true,
    certificatesEnabled: true
  },
  {
    id: 'event-3',
    title: 'Research Seminar: Next-Gen Cloud & Cyber Security',
    type: 'Research Seminar',
    date: '2026-11-28',
    time: '11:00 am – 12:30 pm IST',
    locationOrUrl: 'Seminar Hall 3, VIT Wadala',
    isOnline: false,
    mode: 'on_campus',
    venueId: 'venue-sh3',
    startsAt: '2026-11-28T05:30:00.000Z',
    endsAt: '2026-11-28T07:00:00.000Z',
    speakerName: 'Dr. Ravindra Sangale & Dr. Vidya Chitre',
    speakerDesignation: 'HOD CMPN & HOD INFT',
    speakerCompany: 'VIT Wadala',
    speakers: [
      {
        id: 'spk-3',
        name: 'Dr. Ravindra Sangale',
        title: 'HOD CMPN',
        organization: 'VIT Wadala',
        isExternal: false
      },
      {
        id: 'spk-3b',
        name: 'Dr. Vidya Chitre',
        title: 'HOD INFT',
        organization: 'VIT Wadala',
        isExternal: false
      }
    ],
    hostId: 'user-faculty-1',
    hostRole: 'faculty',
    hostName: 'Dr. Ravindra Sangale',
    department: 'CMPN',
    description: 'Faculty-student research symposium presenting active grant projects and UG/PG publication opportunities.',
    bannerImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
    rsvpsCount: 76,
    registeredUserIds: [],
    status: 'Upcoming',
    lifecycleStatus: 'published',
    capacityLimit: 80,
    waitlistEnabled: true,
    certificatesEnabled: true
  },
  {
    id: 'event-4',
    title: 'Technical Workshop: Modern Kubernetes & Cloud Deployments',
    type: 'Workshop',
    date: '2026-12-05',
    time: '2:00 pm – 5:00 pm IST',
    locationOrUrl: 'Lab 402, Phase II, VIT Wadala',
    isOnline: false,
    mode: 'on_campus',
    venueId: 'venue-lab-402',
    startsAt: '2026-12-05T08:30:00.000Z',
    endsAt: '2026-12-05T11:30:00.000Z',
    speakerName: 'Rushil Dahisaria',
    speakerDesignation: 'Software Engineer II (Azure)',
    speakerCompany: 'Microsoft',
    speakers: [
      {
        id: 'spk-4',
        name: 'Rushil Dahisaria',
        title: 'Software Engineer II (Azure)',
        organization: 'Microsoft',
        isExternal: false
      }
    ],
    hostId: 'alum-2',
    hostRole: 'alumni',
    hostName: 'Rushil Dahisaria',
    department: 'CMPN',
    description: 'Hands-on practical lab deploying containerized microservices to cloud clusters for engineering students.',
    bannerImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    rsvpsCount: 43,
    registeredUserIds: [],
    status: 'Upcoming',
    lifecycleStatus: 'published',
    capacityLimit: 45,
    waitlistEnabled: true,
    certificatesEnabled: true
  },
  {
    id: 'event-5',
    title: 'Alumni Mentorship Roundtable: Distributed Architecture',
    type: 'Workshop',
    date: '2026-11-22',
    time: '10:00 am – 1:00 pm IST',
    locationOrUrl: 'Seminar Hall 2, Phase I, VIT Wadala',
    isOnline: false,
    mode: 'on_campus',
    venueId: 'venue-sh2',
    startsAt: '2026-11-22T04:30:00.000Z',
    endsAt: '2026-11-22T07:30:00.000Z',
    speakerName: 'Rushabh Sanghavi',
    speakerDesignation: 'Senior Software Engineer',
    speakerCompany: 'Google',
    speakers: [
      {
        id: 'spk-5',
        memberId: 'user-alumni-1',
        name: 'Rushabh Sanghavi',
        title: 'Senior Software Engineer',
        organization: 'Google',
        isExternal: false
      }
    ],
    hostId: 'user-alumni-1',
    hostRole: 'alumni',
    hostName: 'Rushabh Sanghavi',
    sponsorDepartment: 'CMPN',
    department: 'CMPN',
    description: 'Deep dive into microservices patterns, consensus algorithms, and real-world failure modes from Google Cloud scale.',
    bannerImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
    rsvpsCount: 0,
    registeredUserIds: [],
    status: 'Upcoming',
    lifecycleStatus: 'pending_review',
    capacityLimit: 120,
    waitlistEnabled: true,
    certificatesEnabled: true,
    reviewedAt: '2026-10-02T06:00:00.000Z'
  },
  {
    id: 'event-6',
    title: 'Industry Hackathon: Campus to Corporate Prep',
    type: 'Alumni Meet',
    date: '2026-12-12',
    time: '9:00 am – 4:00 pm IST',
    locationOrUrl: 'Lab 305, Phase I, VIT Wadala',
    isOnline: false,
    mode: 'on_campus',
    venueId: 'venue-lab-305',
    startsAt: '2026-12-12T03:30:00.000Z',
    endsAt: '2026-12-12T10:30:00.000Z',
    speakerName: 'Rushabh Sanghavi',
    speakerDesignation: 'Senior Software Engineer',
    speakerCompany: 'Google',
    hostId: 'user-alumni-1',
    hostRole: 'alumni',
    hostName: 'Rushabh Sanghavi',
    sponsorDepartment: 'CMPN',
    department: 'CMPN',
    description: 'One-day coding sprint with alumni mentors reviewing PRs, system architecture, and tech debt management.',
    bannerImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
    rsvpsCount: 0,
    registeredUserIds: [],
    status: 'Upcoming',
    lifecycleStatus: 'changes_requested',
    capacityLimit: 40,
    waitlistEnabled: true,
    certificatesEnabled: true,
    reviewNote: 'Please coordinate with Prof. Chitre for Saturday lab assistant access and adjust prerequisites.'
  },
  {
    id: 'event-7',
    title: 'Draft: Resume Clinic & Tech Interview Sprint',
    type: 'Workshop',
    date: '2026-12-18',
    time: '4:00 pm – 6:00 pm IST',
    locationOrUrl: 'Online via NexaLink',
    isOnline: true,
    mode: 'online',
    startsAt: '2026-12-18T10:30:00.000Z',
    endsAt: '2026-12-18T12:30:00.000Z',
    speakerName: 'Rushabh Sanghavi',
    speakerDesignation: 'Senior Software Engineer',
    speakerCompany: 'Google',
    hostId: 'user-alumni-1',
    hostRole: 'alumni',
    hostName: 'Rushabh Sanghavi',
    department: 'CMPN',
    description: 'Draft notes: Resume clinic covering FAANG keyword filtering and behavioral STAR method interview responses.',
    bannerImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
    rsvpsCount: 0,
    registeredUserIds: [],
    status: 'Upcoming',
    lifecycleStatus: 'draft',
    capacityLimit: 50,
    waitlistEnabled: true,
    certificatesEnabled: true
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
    seenAt: '2026-07-24T18:30:00.000Z',
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

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    user_id: 'mock-user-1',
    title: 'Mentorship Request Accepted',
    body: 'Rushabh Sanghavi (Google) accepted your mentorship request for System Design.',
    created_at: '2026-07-24 18:30',
    type: 'Mentorship Approval',
    is_read: false,
    link: 'mentorship'
  },
  {
    id: 'notif-2',
    user_id: 'mock-user-1',
    title: 'New Opportunity Match',
    body: 'Microsoft India posted: Cloud Systems & DevOps Intern (Matches your Azure/Docker skills).',
    created_at: '2026-07-22 10:00',
    type: 'Internship Posting',
    is_read: false,
    link: 'jobs'
  },
  {
    id: 'notif-3',
    user_id: 'mock-user-1',
    title: 'Upcoming Grand Reunion',
    body: 'VIT Annual Grand Alumni Reunion 2026 registration is live. Secure your RSVP spot.',
    created_at: '2026-07-20 12:00',
    type: 'Event Announcement',
    is_read: true,
    link: 'events'
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
    id: 'msg-r-edit',
    senderId: 'user-student-1',
    senderName: 'Aanya Patel',
    senderRole: 'student',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    receiverId: 'user-alumni-1',
    category: 'Placement Preparation',
    content: 'Here is the updated distributed database diagram and latency benchmarks.',
    timestamp: '2026-07-24 19:20',
    editedAt: '2026-07-24 19:25',
    isRead: true
  },
  {
    id: 'msg-r-del',
    senderId: 'user-student-1',
    senderName: 'Aanya Patel',
    senderRole: 'student',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    receiverId: 'user-alumni-1',
    category: 'Placement Preparation',
    content: 'This message was deleted',
    timestamp: '2026-07-24 19:28',
    deletedAt: '2026-07-24 19:30',
    isRead: true
  },
  {
    id: 'msg-r-fresh',
    senderId: 'user-student-1',
    senderName: 'Aanya Patel',
    senderRole: 'student',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    receiverId: 'user-alumni-1',
    category: 'Placement Preparation',
    content: 'Looking forward to our sync session tomorrow at 5 PM!',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
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

export const INITIAL_APPLICATIONS: import('../types').OpportunityApplication[] = [
  {
    id: 'app-1',
    opportunityId: 'job-1',
    applicantId: 'user-student-1',
    applicantName: 'Aanya Patel',
    applicantEmail: 'aanya.patel@student.vit.edu.in',
    applicantDepartment: 'CMPN',
    applicantYear: 'BE',
    appliedAt: '2026-10-01T14:20:00.000Z',
    status: 'submitted',
    studentNote: 'Passionate about distributed storage and systems engineering. Prepared for technical interviews.',
    resumePath: '/resumes/aanya-patel-resume.pdf',
    matchScore: 92
  },
  {
    id: 'app-2',
    opportunityId: 'job-1',
    applicantId: 'stud-2',
    applicantName: 'Karan Verma',
    applicantEmail: 'karan.verma@student.vit.edu.in',
    applicantDepartment: 'INFT',
    applicantYear: 'BE',
    appliedAt: '2026-10-01T16:45:00.000Z',
    status: 'viewed',
    studentNote: 'Worked on Go microservices and Kubernetes cluster monitoring in my final year capstone.',
    resumePath: '/resumes/karan-verma-resume.pdf',
    matchScore: 85
  },
  {
    id: 'app-3',
    opportunityId: 'job-1',
    applicantId: 'stud-3',
    applicantName: 'Sneha Rao',
    applicantEmail: 'sneha.rao@student.vit.edu.in',
    applicantDepartment: 'CMPN',
    applicantYear: 'TE',
    appliedAt: '2026-10-02T09:10:00.000Z',
    status: 'shortlisted',
    studentNote: 'Represented VIT Wadala at Smart India Hackathon. Strong algorithmic skills.',
    resumePath: '/resumes/sneha-rao-resume.pdf',
    matchScore: 96
  }
];

export const INITIAL_RSVPS: import('../types').EventRsvp[] = [
  {
    id: 'rsvp-1',
    eventId: 'event-1',
    userId: 'user-student-1',
    status: 'registered',
    createdAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'rsvp-2',
    eventId: 'event-1',
    userId: 'user-alumni-1',
    status: 'registered',
    createdAt: '2026-10-01T11:00:00.000Z'
  },
  {
    id: 'rsvp-3',
    eventId: 'event-2',
    userId: 'user-student-1',
    status: 'registered',
    createdAt: '2026-10-01T12:00:00.000Z'
  },
  {
    id: 'rsvp-4',
    eventId: 'event-3',
    userId: 'stud-2',
    status: 'attended',
    attendedAt: '2026-11-28T05:40:00.000Z',
    certificateId: 'cert-vit-2026-0042',
    createdAt: '2026-10-01T12:30:00.000Z'
  }
];

/**
 * DEV Benchmark Fixture: Generates a realistic 200-message conversation thread
 * between User A (Student Aanya Patel) and User B (Alumni Rushabh Sanghavi).
 * Used for scroll testing, virtualized rendering audits, and visual polish verification.
 */
export function generate200MessageThread(
  customCurrentUserId?: string,
  customTargetId?: string,
  customTargetName?: string
): ChatMessage[] {
  const result: ChatMessage[] = [];
  const baseTime = Date.now() - 200 * 2.5 * 60 * 1000; // ~8 hours spanning

  const studentId = customCurrentUserId || 'user-student-1';
  const studentName = customCurrentUserId === 'user-alumni-1' ? 'Rushabh Sanghavi' : 'Aanya Patel';
  const alumniId = customTargetId || (studentId === 'user-student-1' ? 'user-alumni-1' : 'user-student-1');
  const alumniName = customTargetName || (alumniId === 'user-alumni-1' ? 'Rushabh Sanghavi' : 'Aanya Patel');

  const topics = [
    'System Design architecture for distributed key-value stores',
    'Raft consensus leader election vs multi-Paxos failover latency',
    'Reviewing the indexing strategy on PostgreSQL composite keys',
    'Campus recruitment preparation tips for Google Tier-1 hiring',
    'Setting up CI/CD GitHub Actions with self-hosted runners',
    'Micro-frontend hydration strategies and memory overhead',
    'Comparing Kafka partition rebalancing with Pulsar brokers',
    'Preparing for behavioral STAR interview questions with engineering leads'
  ];

  for (let i = 1; i <= 200; i++) {
    // Alternate in bursts of 1-3 messages to test grouping
    const isMe = Math.floor((i - 1) / 3) % 2 === 0;
    const senderId = isMe ? studentId : alumniId;
    const senderName = isMe ? studentName : alumniName;
    const senderRole = isMe ? 'student' : 'alumni';
    const receiverId = isMe ? alumniId : studentId;

    // Time increment: some within 2 min (grouped), some after 15 min (new group)
    const isGroupContinuation = (i % 3 !== 1);
    const minuteDelta = isGroupContinuation ? 1 : 12;
    const msgTime = new Date(baseTime + i * minuteDelta * 60 * 1000).toISOString();

    let content = `Message #${i}: ${topics[i % topics.length]} — discussion point ${Math.floor(i / 8) + 1}.`;
    let attachments: any[] | undefined = undefined;
    let replyTo: any = undefined;
    let reactions: any[] | undefined = undefined;
    let editedAt: string | null = null;
    let deletedAt: string | null = null;
    let status: 'sending' | 'sent' | 'delivered' | 'failed' | 'read' = 'read';
    let errorReason: any = undefined;

    // Special cases across the 200 messages
    if (i === 15) {
      content = '👍'; // Emoji-only (1)
    } else if (i === 35) {
      content = '🔥 🚀 ✨'; // Emoji-only (3)
    } else if (i === 50) {
      content = 'Here is the canonical documentation reference: https://cloud.google.com/architecture/distributed-system-patterns-and-consensus-protocols-v3-whitepaper-vit-wadala';
    } else if (i === 70) {
      content = '```typescript\ninterface DistributedClusterNode {\n  nodeId: string;\n  status: "LEADER" | "FOLLOWER" | "CANDIDATE";\n  term: number;\n  votedFor: string | null;\n  heartbeatMs: number;\n}\n```\nDoes this node configuration match your cluster specs?';
    } else if (i === 90) {
      attachments = [
        {
          id: `att-${i}-1`,
          url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
          fileName: 'cluster_architecture_diagram.jpg',
          fileSize: 450000,
          mimeType: 'image/jpeg'
        }
      ];
      content = 'Attaching the full cluster diagram:';
    } else if (i === 110) {
      attachments = [
        {
          id: `att-${i}-1`,
          url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
          fileName: 'node_topology_phase1.jpg',
          fileSize: 320000,
          mimeType: 'image/jpeg'
        },
        {
          id: `att-${i}-2`,
          url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
          fileName: 'node_topology_phase2.jpg',
          fileSize: 410000,
          mimeType: 'image/jpeg'
        }
      ];
      content = 'Two node topology passes for comparison.';
    } else if (i === 130) {
      attachments = [
        {
          id: `att-${i}-pdf`,
          url: 'https://example.com/vit_capstone_distributed_database_latency_analysis_benchmark_report_final_v2_october_2026.pdf',
          fileName: 'vit_capstone_distributed_database_latency_analysis_benchmark_report_final_v2_october_2026.pdf',
          fileSize: 1845000,
          mimeType: 'application/pdf'
        }
      ];
      content = 'Here is the comprehensive PDF benchmarking report.';
    } else if (i === 145) {
      replyTo = {
        id: `bench-msg-144`,
        name: isMe ? alumniName : studentName,
        content: 'Does this node configuration match your cluster specs?'
      };
      content = 'Yes exactly, let us make sure the heartbeatMs timeout is set to 150ms.';
    } else if (i === 160) {
      editedAt = msgTime;
      content = 'Edited: Updated benchmark latency is now 12ms at 99th percentile across 5 regions.';
    } else if (i === 175) {
      deletedAt = msgTime;
      content = 'This message was deleted';
    } else if (i === 190 && isMe) {
      status = 'failed';
      errorReason = 'rate_limited';
      content = 'Failed send attempt due to rate limits.';
    }

    if (i % 8 === 0) {
      reactions = [
        { emoji: '👍', userId: isMe ? alumniId : studentId },
        { emoji: '🔥', userId: isMe ? studentId : alumniId }
      ];
    }

    result.push({
      id: `bench-msg-${i}`,
      senderId,
      senderName,
      senderRole: senderRole as any,
      senderAvatar: isMe
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      receiverId,
      content,
      timestamp: msgTime,
      isRead: i < 195,
      status: i === 200 ? 'sent' : status,
      attachments,
      replyTo,
      reactions,
      editedAt,
      deletedAt,
      errorReason
    });
  }

  return result;
}

