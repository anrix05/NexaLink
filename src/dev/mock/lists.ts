import type { DepartmentCode } from '../../types';

export const DEPARTMENTS: DepartmentCode[] = ['CMPN', 'INFT', 'EXTC', 'EXCS', 'BIOM'];

export const DEPARTMENT_NAMES: Record<DepartmentCode, string> = {
  CMPN: 'Computer Engineering',
  INFT: 'Information Technology',
  EXTC: 'Electronics & Telecommunication',
  EXCS: 'Electronics & Computer Science',
  BIOM: 'Biomedical Engineering'
};

export const COUNTRIES = [
  'India',
  'USA',
  'Germany',
  'United Kingdom',
  'Singapore',
  'Canada',
  'Netherlands',
  'Australia',
  'UAE',
  'Japan',
  'Ireland',
  'Switzerland',
  'Sweden'
];

export const EMPLOYERS = [
  'Google',
  'Microsoft',
  'Amazon',
  'JP Morgan',
  'Goldman Sachs',
  'Razorpay',
  'Zomato',
  'TCS',
  'Infosys',
  'Deloitte',
  'Larsen & Toubro',
  'Meta',
  'Apple',
  'NVIDIA',
  'Uber',
  'Adobe',
  'Barclays',
  'Cisco'
];

export const UNIVERSITIES = [
  'Carnegie Mellon University',
  'Stanford University',
  'Technical University of Munich',
  'National University of Singapore',
  'University of Illinois Urbana-Champaign',
  'University of California San Diego',
  'IIT Bombay',
  'Georgia Tech',
  'Columbia University',
  'University of Washington'
];

export const FIRST_NAMES_MALE = [
  'Aarav', 'Aditya', 'Rohan', 'Kunal', 'Dev', 'Pranav', 'Nikhil', 'Tanmay',
  'Arjun', 'Siddharth', 'Varun', 'Yash', 'Harsh', 'Mayank', 'Gaurav', 'Manish',
  'Aniket', 'Saurabh', 'Sameer', 'Chirag', 'Tushar', 'Akash', 'Vivek', 'Omkar',
  'Shubham', 'Abhishek', 'Kartik', 'Rishi', 'Neil', 'Parth', 'Sanket', 'Prateek'
];

export const FIRST_NAMES_FEMALE = [
  'Ananya', 'Sneha', 'Tanvi', 'Pooja', 'Isha', 'Rhea', 'Divya', 'Shruti',
  'Aditi', 'Meera', 'Riddhi', 'Kavya', 'Simran', 'Neha', 'Gauri', 'Sakshi',
  'Anushka', 'Ishani', 'Sanjana', 'Payal', 'Mansi', 'Deepika', 'Trisha', 'Vidhi',
  'Priyanka', 'Shreya', 'Namrata', 'Radhika', 'Komal', 'Swati', 'Kritika', 'Jyoti'
];

export const LAST_NAMES = [
  'Sharma', 'Verma', 'Kulkarni', 'Patil', 'Deshmukh', 'Joshi', 'Mehta', 'Shah',
  'Iyer', 'Menon', 'Nair', 'Rao', 'Choudhury', 'Banerjee', 'Chatterjee', 'Gupta',
  'Aggarwal', 'Bhatia', 'Malhotra', 'Kapoor', 'Reddy', 'Pillai', 'Shetty', 'Pawar',
  'Bhide', 'Gokhale', 'Tendulkar', 'Sawant', 'Jadhav', 'Shinde', 'Sane', 'Kamat'
];

export const SKILLS_BY_DEPARTMENT: Record<DepartmentCode, string[]> = {
  CMPN: [
    'React', 'Node.js', 'Python', 'Go', 'Distributed Systems', 'Kubernetes',
    'System Design', 'TypeScript', 'Docker', 'PostgreSQL', 'Machine Learning', 'GraphQL'
  ],
  INFT: [
    'Cloud Architecture', 'AWS', 'Python', 'Cybersecurity', 'DevOps', 'CI/CD',
    'Terraform', 'Java', 'Spring Boot', 'Microservices', 'Linux', 'Data Engineering'
  ],
  EXTC: [
    'Embedded Systems', 'IoT', 'C++', 'Signal Processing', 'FPGA', 'MATLAB',
    'Computer Vision', 'VLSI', 'Edge Computing', 'Robotics', 'RTOS', 'Python'
  ],
  EXCS: [
    'Hardware-Software Co-Design', 'C', 'C++', 'Computer Architecture', 'RISC-V',
    'Linux Kernel', 'Microcontrollers', 'Device Drivers', 'Python', 'Verilog'
  ],
  BIOM: [
    'Biomedical Signal Processing', 'Medical Imaging', 'Python', 'Bioinformatics',
    'Bioinstrumentation', 'Healthcare AI', 'Biosensors', 'MATLAB', 'Regulatory Compliance'
  ]
};

export const CAREER_GOALS = [
  'Software Engineer at Tier-1 tech company',
  'Graduate studies (M.S. / Ph.D.) in Distributed Systems',
  'Cloud Platform Engineer in high-scale infrastructure',
  'Machine Learning Research Scientist',
  'Full-stack Engineer in fast-growing FinTech',
  'Embedded Systems Architect for Autonomous Mobility',
  'DevOps & Site Reliability Engineer',
  'Robotics & Computer Vision Engineer',
  'Healthcare AI & Biomedical Device Specialist',
  'Product Engineer building design-forward web applications'
];

export const MESSAGE_SNIPPETS = [
  'Hello! I reviewed your background and would appreciate some advice on system design interviews.',
  'Thanks for reaching out! Happy to connect. Have you started preparing distributed consensus topics?',
  'Yes, I have implemented a Raft cluster in Go for my capstone project.',
  'That is impressive! Focus on failure modes: split-brain, network partitions, and log compaction.',
  'Could we schedule a 20-minute discussion this weekend on Google Meet?',
  'Sure, Saturday 4:00 PM IST works well for me. Please share your current resume link beforehand.',
  'Shared the PDF resume link above. Looking forward to our discussion!',
  'Received. The project portfolio looks strong. We will dive into your architecture trade-offs.'
];
