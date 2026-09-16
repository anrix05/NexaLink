-- SQLite Database Schema for AlumniConnect (SIH25017)
-- Vidyalankar Institute of Technology, Mumbai

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('student', 'alumni', 'faculty', 'teacher', 'admin')) NOT NULL,
    department TEXT NOT NULL,
    avatar TEXT,
    phone TEXT,
    bio TEXT,
    enrollment_no TEXT,
    employee_id TEXT,
    graduation_year INTEGER,
    current_year TEXT,
    is_verified INTEGER DEFAULT 0,
    verification_status TEXT DEFAULT 'Pending Verification',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Mentorship Requests Table
CREATE TABLE IF NOT EXISTS mentorship_requests (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_department TEXT NOT NULL,
    student_year TEXT,
    mentor_id TEXT NOT NULL,
    mentor_name TEXT NOT NULL,
    mentor_role TEXT NOT NULL,
    purpose_of_request TEXT NOT NULL,
    area_of_guidance TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT CHECK(status IN ('Pending', 'Accepted', 'Declined', 'Completed')) DEFAULT 'Pending',
    scheduled_date TEXT,
    decline_reason TEXT,
    feedback_rating INTEGER,
    feedback_review TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (mentor_id) REFERENCES users(id)
);

-- 3. Jobs & Opportunities Table
CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    company_logo TEXT,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    stipend_or_salary TEXT NOT NULL,
    department TEXT NOT NULL,
    skills_required TEXT,
    posted_by_id TEXT NOT NULL,
    posted_by_name TEXT NOT NULL,
    posted_by_role TEXT NOT NULL,
    application_deadline TEXT,
    description TEXT NOT NULL,
    moderation_status TEXT CHECK(moderation_status IN ('Pending Approval', 'Approved', 'Rejected')) DEFAULT 'Pending Approval',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (posted_by_id) REFERENCES users(id)
);

-- 4. Job Applications Table
CREATE TABLE IF NOT EXISTS job_applications (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    resume_url TEXT,
    status TEXT DEFAULT 'Submitted',
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
);

-- 5. Events Table
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location_or_url TEXT NOT NULL,
    is_online INTEGER DEFAULT 0,
    speaker_name TEXT,
    speaker_designation TEXT,
    speaker_company TEXT,
    description TEXT,
    capacity_limit INTEGER DEFAULT 50,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Event Registrations Table
CREATE TABLE IF NOT EXISTS event_registrations (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    status TEXT CHECK(status IN ('Registered', 'Waitlisted', 'Attended')) DEFAULT 'Registered',
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 7. Direct Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    receiver_name TEXT NOT NULL,
    content TEXT NOT NULL,
    attachment_name TEXT,
    attachment_size TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);

-- 8. Audit Logs Table (Admin Governance)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    details TEXT NOT NULL,
    target_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
