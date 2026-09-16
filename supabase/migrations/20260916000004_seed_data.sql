-- ============================================================================
-- Migration 004: NexaLink Demo Persona & Platform Seed Data
-- ============================================================================

-- ─── 1. AUTH USERS (GoTrue) ─────────────────────────────────────────────────
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@vit.edu.in', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rajesh.kumar@vit.edu.in', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'aanya.patel@student.vit.edu.in', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rushabh.sanghavi@alumni.vit.edu.in', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ravindra.sangale@vit.edu.in', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'meera.nair@student.vit.edu.in', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'siddharth.j@alumni.vit.edu.in', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
    provider_id, id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000001', 'admin@vit.edu.in')::jsonb, 'email', now(), now(), now()),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000002', 'rajesh.kumar@vit.edu.in')::jsonb, 'email', now(), now(), now()),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000003', 'aanya.patel@student.vit.edu.in')::jsonb, 'email', now(), now(), now()),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000004', 'rushabh.sanghavi@alumni.vit.edu.in')::jsonb, 'email', now(), now(), now()),
('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000005', 'ravindra.sangale@vit.edu.in')::jsonb, 'email', now(), now(), now()),
('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000006', 'meera.nair@student.vit.edu.in')::jsonb, 'email', now(), now(), now()),
('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000007', format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000007', 'siddharth.j@alumni.vit.edu.in')::jsonb, 'email', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- ─── 2. BASE USERS (public.users) ───────────────────────────────────────────

-- Helper insert for users
INSERT INTO public.users (
    id, name, email, role, department, avatar_url, phone, is_verified, verification_status,
    is_active, enrollment_no, employee_id, bio, personal_email
) VALUES
-- Admin 1
('00000000-0000-0000-0000-000000000001', 'Dr. Sunita Rawat', 'admin@vit.edu.in', 'admin', 'CMPN',
 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
 '+91 98200 12345', TRUE, 'Verified', TRUE, NULL, 'EMP-ADMIN-001',
 'Dean of Alumni Relations & Institutional Placement Head, VIT Wadala.', NULL),

-- Admin 2
('00000000-0000-0000-0000-000000000002', 'Prof. Rajesh Kumar', 'rajesh.kumar@vit.edu.in', 'admin', 'INFT',
 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
 '+91 98200 99887', TRUE, 'Verified', TRUE, NULL, 'EMP-ADMIN-002',
 'Co-Director of Institutional Governance & Research Cell, VIT Wadala.', NULL),

-- Student: Aanya Patel
('00000000-0000-0000-0000-000000000003', 'Aanya Patel', 'aanya.patel@student.vit.edu.in', 'student', 'CMPN',
 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
 '+91 98765 43210', TRUE, 'Verified', TRUE, '21101A0042', NULL,
 'Pre-final year Computer Engineering student passionate about distributed systems and cloud architecture.', NULL),

-- Alumni: Rushabh Sanghavi
('00000000-0000-0000-0000-000000000004', 'Rushabh Sanghavi', 'rushabh.sanghavi@alumni.vit.edu.in', 'alumni', 'CMPN',
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
 '+1 (408) 555-0199', TRUE, 'Verified', TRUE, '17101A0055', NULL,
 'Staff Engineer at Google Cloud, Mountain View. VIT CMPN Batch of 2021. Actively mentoring students in systems engineering.', 'rushabh.sanghavi@gmail.com'),

-- Faculty: Dr. Ravindra Sangale
('00000000-0000-0000-0000-000000000005', 'Dr. Ravindra Sangale', 'ravindra.sangale@vit.edu.in', 'faculty', 'CMPN',
 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
 '+91 98201 54321', TRUE, 'Verified', TRUE, NULL, 'EMP-CMPN-012',
 'Professor & Head of Computer Engineering. 18+ years research in AI, High Performance Computing, and Distributed Systems.', NULL),

-- Pending Student: Meera Nair
('00000000-0000-0000-0000-000000000006', 'Meera Nair', 'meera.nair@student.vit.edu.in', 'student', 'EXTC',
 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
 '+91 98190 22334', FALSE, 'Pending Verification', TRUE, '23103C0051', NULL,
 'Second year EXTC student. Awaiting admit card credential verification.', NULL),

-- Pending Alumni: Siddharth J
('00000000-0000-0000-0000-000000000007', 'Siddharth J', 'siddharth.j@alumni.vit.edu.in', 'alumni', 'CMPN',
 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
 '+91 98220 33445', FALSE, 'Pending Verification', TRUE, '19101A0099', NULL,
 'Software Development Engineer at Amazon AWS. Awaiting degree certificate verification.', 'siddharth.j@gmail.com')
ON CONFLICT (id) DO NOTHING;

-- ─── 2. ROLE PROFILES ───────────────────────────────────────────────────────

-- Student Profile: Aanya Patel
INSERT INTO public.student_profiles (
    user_id, prn, enrollment_no, current_year, semester, cgpa, skills,
    areas_of_interest, career_goal, preferred_industry, target_companies, expected_graduation_year
) VALUES (
    '00000000-0000-0000-0000-000000000003', '21101A0042', '21101A0042', 'TE', 'Semester 6', 9.42,
    ARRAY['React', 'TypeScript', 'Node.js', 'Go', 'Docker', 'PostgreSQL'],
    ARRAY['Cloud Architecture', 'Distributed Systems', 'Observability'],
    'Software Engineer at Tier-1 Systems/Cloud Provider', 'Technology & Cloud',
    ARRAY['Google', 'Microsoft', 'Amazon AWS', 'Stripe'], 2025
) ON CONFLICT (user_id) DO NOTHING;

-- Alumni Profile: Rushabh Sanghavi
INSERT INTO public.alumni_profiles (
    user_id, enrollment_no, graduation_year, company, designation,
    location, country, skills, is_mentoring_available, max_mentees, active_mentees_count,
    personal_email, verified_at
) VALUES (
    '00000000-0000-0000-0000-000000000004', '17101A0055', 2021, 'Google', 'Staff Software Engineer',
    'Mountain View, CA', 'United States',
    ARRAY['Distributed Systems', 'Go', 'Kubernetes', 'Cloud Infrastructure', 'System Design'],
    TRUE, 4, 1, 'rushabh.sanghavi@gmail.com', NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Faculty Profile: Dr. Ravindra Sangale
INSERT INTO public.faculty_profiles (
    user_id, employee_id, designation, is_hod, specialization,
    research_areas, subjects_taught, skills
) VALUES (
    '00000000-0000-0000-0000-000000000005', 'EMP-CMPN-012', 'Professor & Head of Department', TRUE,
    'High Performance Computing & Distributed Systems',
    ARRAY['Distributed Algorithms', 'Cloud Systems Optimization', 'Machine Learning'],
    ARRAY['Distributed Systems', 'Advanced Database Management', 'Operating Systems Design'],
    ARRAY['C++', 'Python', 'MPI', 'Distributed Architecture', 'Curriculum Design']
) ON CONFLICT (user_id) DO NOTHING;

-- ─── 3. JOBS & OPPORTUNITIES ────────────────────────────────────────────────
INSERT INTO public.jobs (
    id, title, company, company_logo, location, type, stipend_or_salary,
    department, skills_required, posted_by_alumni_id, posted_by_alumni_name, posted_by_role,
    application_deadline, description, requirements, referral_provided, moderation_status, status
) VALUES
('00000000-0000-0000-0001-000000000001', 'Cloud Infrastructure Intern', 'Google',
 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=100&auto=format&fit=crop&q=80',
 'Bengaluru (Hybrid)', 'Internship Opportunity', '₹85,000 / month',
 ARRAY['CMPN', 'INFT']::department_code[],
 ARRAY['Go', 'Linux', 'Kubernetes', 'Computer Networks'],
 '00000000-0000-0000-0000-000000000004', 'Rushabh Sanghavi', 'alumni',
 NOW() + INTERVAL '30 days',
 'Join Google Cloud Platform engineering team to build scalable microservice mesh infrastructure.',
 ARRAY['Strong fundamentals in Operating Systems & Networks', 'Proficiency in Go, C++ or Java', 'Pre-final year engineering student'],
 TRUE, 'Approved', 'Active'),

('00000000-0000-0000-0001-000000000002', 'Full Stack SDE I', 'Microsoft',
 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=100&auto=format&fit=crop&q=80',
 'Hyderabad', 'Job Vacancy', '₹24,00,000 / annum',
 ARRAY['CMPN', 'INFT', 'EXTC']::department_code[],
 ARRAY['React', 'TypeScript', 'C#', '.NET', 'Azure'],
 '00000000-0000-0000-0000-000000000004', 'Rushabh Sanghavi', 'alumni',
 NOW() + INTERVAL '45 days',
 'Engineering role on Azure Developer Experience team crafting next-gen dev environments.',
 ARRAY['Graduating BE/BTech student (2024 or 2025 batch)', 'Hands-on project experience with modern web frameworks'],
 TRUE, 'Approved', 'Active')
ON CONFLICT (id) DO NOTHING;

-- ─── 4. INSTITUTIONAL EVENTS ────────────────────────────────────────────────
INSERT INTO public.events (
    id, title, type, date, time, location_or_url, is_online,
    speaker_name, speaker_designation, speaker_company, department,
    description, banner_image, rsvps_count, capacity_limit, status
) VALUES
('00000000-0000-0000-0002-000000000001', 'Architecting Systems for 100M+ Requests', 'Guest Lecture',
 CURRENT_DATE + INTERVAL '14 days', '10:30 AM - 12:30 PM IST', 'Auditorium 1, VIT Wadala', FALSE,
 'Rushabh Sanghavi', 'Staff Software Engineer', 'Google', 'CMPN',
 'Deep dive into load balancing, consensus protocols, and tail-latency minimization in production Google systems.',
 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
 142, 200, 'Upcoming'),

('00000000-0000-0000-0002-000000000002', 'US Masters & Direct PhD Application Roadmap', 'Webinar',
 CURRENT_DATE + INTERVAL '21 days', '6:00 PM - 7:30 PM IST', 'https://meet.google.com/vit-alumni-guidance', TRUE,
 'Priya Sharma', 'PhD Researcher', 'Carnegie Mellon University', 'INFT',
 'Structured strategy session on SOP drafting, professor outreach, and GRE/TOEFL preparation.',
 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
 98, 150, 'Upcoming')
ON CONFLICT (id) DO NOTHING;

-- ─── 5. MENTORSHIP REQUESTS ─────────────────────────────────────────────────
INSERT INTO public.mentorship_requests (
    id, student_id, student_name, student_email, student_department, student_year,
    mentor_id, mentor_name, mentor_role, mentor_company_or_dept,
    purpose_of_request, area_of_guidance, topic, message,
    status, scheduled_time
) VALUES (
    '00000000-0000-0000-0003-000000000001',
    '00000000-0000-0000-0000-000000000003', 'Aanya Patel', 'aanya.patel@student.vit.edu.in', 'CMPN', 'TE',
    '00000000-0000-0000-0000-000000000004', 'Rushabh Sanghavi', 'alumni', 'Google',
    'Career Guidance', 'Distributed Systems & Cloud Roles',
    'Mock Technical Interview & Resume Feedback',
    'Hello Rushabh sir, I am preparing for tier-1 cloud engineering placements and would love your guidance on system design interviews.',
    'Accepted', 'Upcoming Saturday at 7:00 PM IST'
) ON CONFLICT (id) DO NOTHING;

-- ─── 6. ANNOUNCEMENTS ───────────────────────────────────────────────────────
INSERT INTO public.announcements (
    id, title, category, author, content, is_important, target_audience
) VALUES
('00000000-0000-0000-0004-000000000001', 'NAAC Criteria 5.4.1 Audit Window Open', 'Institutional Update',
 'Dr. Sunita Rawat (Admin Cell)',
 'All departments are requested to finalize and export student-alumni interaction registries via the Accreditation Reports tool before month-end.',
 TRUE, 'Faculty'),

('00000000-0000-0000-0004-000000000002', 'Google & Microsoft Referral Window Open for Batch of 2025', 'Placement Alert',
 'VIT Placement & Alumni Cell',
 'Verified alumni have posted new corporate referral openings in the Opportunities portal. Check eligibility and submit your profiles.',
 TRUE, 'Students')
ON CONFLICT (id) DO NOTHING;

-- ─── 7. INITIAL AUDIT LOGS ──────────────────────────────────────────────────
INSERT INTO public.audit_logs (
    id, action, performed_by, target_user_or_item, details
) VALUES
('00000000-0000-0000-0005-000000000001', 'SYSTEM_INITIALIZATION', 'System Engine', 'Database Central',
 'NexaLink PostgreSQL schema active with Row Level Security and institutional domain verification rules.'),
('00000000-0000-0000-0005-000000000002', 'USER_VERIFIED', 'Dr. Sunita Rawat (Admin Cell)', 'Rushabh Sanghavi',
 'Verified alumni credentials and Google employment domain via official college registry.')
ON CONFLICT (id) DO NOTHING;
