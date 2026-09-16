import type {
  UserRole,
  DepartmentCode,
  AccountVerificationStatus,
  UserPrivacySettings,
  StudentProject,
  AlumniExperience,
  HigherEducationDetail,
  PublicationItem,
  MentorshipGuidancePurpose,
  MentorshipFeedback,
  EventType,
  EventFeedback,
  NotificationType
} from './index';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: UserRole;
          department: DepartmentCode;
          avatar_url: string | null;
          phone: string | null;
          is_verified: boolean;
          verification_status: AccountVerificationStatus;
          rejection_reason: string | null;
          clarification_requested: { text: string; requestedAt: string } | null;
          proof_document_name: string | null;
          verification_document_url: string | null;
          is_active: boolean;
          enrollment_no: string | null;
          employee_id: string | null;
          bio: string | null;
          privacy_settings: UserPrivacySettings | null;
          personal_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          role?: UserRole;
          department?: DepartmentCode;
          avatar_url?: string | null;
          phone?: string | null;
          is_verified?: boolean;
          verification_status?: AccountVerificationStatus;
          rejection_reason?: string | null;
          clarification_requested?: { text: string; requestedAt: string } | null;
          proof_document_name?: string | null;
          verification_document_url?: string | null;
          is_active?: boolean;
          enrollment_no?: string | null;
          employee_id?: string | null;
          bio?: string | null;
          privacy_settings?: UserPrivacySettings | null;
          personal_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
        Relationships: [];
      };
      student_profiles: {
        Row: {
          user_id: string;
          prn: string;
          enrollment_no: string;
          current_year: 'FE' | 'SE' | 'TE' | 'BE' | 'FY' | 'SY';
          semester: string;
          cgpa: number;
          skills: string[];
          areas_of_interest: string[];
          career_goal: string;
          preferred_industry: string;
          preferred_higher_studies: string;
          certifications: string[];
          projects: StudentProject[];
          target_companies: string[];
          resume_url: string | null;
          linkedin: string | null;
          github: string | null;
          mentor_id: string | null;
          expected_graduation_year: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          prn?: string;
          enrollment_no: string;
          current_year?: 'FE' | 'SE' | 'TE' | 'BE' | 'FY' | 'SY';
          semester?: string;
          cgpa?: number;
          skills?: string[];
          areas_of_interest?: string[];
          career_goal?: string;
          preferred_industry?: string;
          preferred_higher_studies?: string;
          certifications?: string[];
          projects?: StudentProject[];
          target_companies?: string[];
          resume_url?: string | null;
          linkedin?: string | null;
          github?: string | null;
          mentor_id?: string | null;
          expected_graduation_year?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['student_profiles']['Insert']>;
        Relationships: [];
      };
      alumni_profiles: {
        Row: {
          user_id: string;
          prn: string | null;
          enrollment_no: string;
          graduation_year: number;
          company: string;
          designation: string;
          higher_education_institute: string | null;
          higher_studies: HigherEducationDetail | null;
          location: string;
          country: string;
          skills: string[];
          experience: AlumniExperience[];
          certifications: string[];
          professional_achievements: string[];
          bio: string;
          linkedin: string | null;
          github: string | null;
          resume_url: string | null;
          is_mentoring_available: boolean;
          max_mentees: number;
          active_mentees_count: number;
          verified_at: string | null;
          employment_data_pending: boolean;
          personal_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          prn?: string | null;
          enrollment_no: string;
          graduation_year: number;
          company?: string;
          designation?: string;
          higher_education_institute?: string | null;
          higher_studies?: HigherEducationDetail | null;
          location?: string;
          country?: string;
          skills?: string[];
          experience?: AlumniExperience[];
          certifications?: string[];
          professional_achievements?: string[];
          bio?: string;
          linkedin?: string | null;
          github?: string | null;
          resume_url?: string | null;
          is_mentoring_available?: boolean;
          max_mentees?: number;
          active_mentees_count?: number;
          verified_at?: string | null;
          employment_data_pending?: boolean;
          personal_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['alumni_profiles']['Insert']>;
        Relationships: [];
      };
      faculty_profiles: {
        Row: {
          user_id: string;
          employee_id: string;
          designation: string;
          is_hod: boolean;
          specialization: string;
          research_areas: string[];
          subjects_taught: string[];
          publications: PublicationItem[];
          skills: string[];
          industry_interests: string[];
          ongoing_research: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          employee_id: string;
          designation: string;
          is_hod?: boolean;
          specialization?: string;
          research_areas?: string[];
          subjects_taught?: string[];
          publications?: PublicationItem[];
          skills?: string[];
          industry_interests?: string[];
          ongoing_research?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['faculty_profiles']['Insert']>;
        Relationships: [];
      };
      admin_invites: {
        Row: {
          id: string;
          invited_email: string;
          invited_by_admin_id: string;
          status: 'pending' | 'accepted' | 'revoked';
          invited_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          invited_email: string;
          invited_by_admin_id: string;
          status?: 'pending' | 'accepted' | 'revoked';
          invited_at?: string;
          accepted_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['admin_invites']['Insert']>;
        Relationships: [];
      };
      role_transition_requests: {
        Row: {
          id: string;
          user_id: string;
          requested_at: string;
          status: 'pending' | 'approved' | 'rejected';
          proposed_alumni_data: Record<string, any>;
          reviewed_by: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
          initiated_by_admin: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          requested_at?: string;
          status?: 'pending' | 'approved' | 'rejected';
          proposed_alumni_data: Record<string, any>;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
          initiated_by_admin?: boolean;
        };
        Update: Partial<Database['public']['Tables']['role_transition_requests']['Insert']>;
        Relationships: [];
      };
      starred_conversations: {
        Row: {
          user_id: string;
          contact_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          contact_id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['starred_conversations']['Insert']>;
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          sender_id: string;
          sender_name: string;
          sender_role: UserRole;
          sender_avatar: string;
          receiver_id: string;
          content: string;
          timestamp: string;
          is_read: boolean;
          category: MentorshipGuidancePurpose | null;
          attachment_name: string | null;
          attachment_url: string | null;
          is_reported: boolean;
          reported_at: string | null;
          reported_by: string | null;
          report_reason: string | null;
          moderation_status: 'pending' | 'dismissed' | 'actioned' | null;
          moderated_by: string | null;
          moderated_at: string | null;
          reactions: any[];
          voice_note_url: string | null;
          voice_note_duration: number | null;
          reply_to: any | null;
        };
        Insert: {
          id?: string;
          sender_id: string;
          sender_name?: string;
          sender_role?: UserRole;
          sender_avatar?: string;
          receiver_id: string;
          content: string;
          timestamp?: string;
          is_read?: boolean;
          category?: MentorshipGuidancePurpose | null;
          attachment_name?: string | null;
          attachment_url?: string | null;
          is_reported?: boolean;
          reported_at?: string | null;
          reported_by?: string | null;
          report_reason?: string | null;
          moderation_status?: 'pending' | 'dismissed' | 'actioned' | null;
          moderated_by?: string | null;
          moderated_at?: string | null;
          reactions?: any[];
          voice_note_url?: string | null;
          voice_note_duration?: number | null;
          reply_to?: any | null;
        };
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          action: string;
          performed_by: string;
          target_user_or_item: string | null;
          timestamp: string;
          details: string;
          is_bulk_action: boolean;
          bulk_metadata: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          action: string;
          performed_by: string;
          target_user_or_item?: string | null;
          timestamp?: string;
          details: string;
          is_bulk_action?: boolean;
          bulk_metadata?: Record<string, any> | null;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
        Relationships: [];
      };
      mentorship_requests: {
        Row: {
          id: string;
          student_id: string;
          student_name: string;
          student_email: string;
          student_department: DepartmentCode;
          student_year: string;
          student_role: string | null;
          student_enrollment_no: string | null;
          mentor_id: string;
          mentor_name: string;
          mentor_role: string;
          mentor_company_or_dept: string;
          purpose_of_request: MentorshipGuidancePurpose;
          area_of_guidance: string;
          topic: string;
          message: string;
          requested_date: string;
          expiry_date: string | null;
          status: 'Pending' | 'Accepted' | 'Declined' | 'Completed' | 'Expired';
          request_type: string | null;
          meeting_notes: string | null;
          scheduled_time: string | null;
          proposed_date: string | null;
          proposed_time_slot: string | null;
          decline_reason: string | null;
          feedback: MentorshipFeedback | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          student_name?: string;
          student_email?: string;
          student_department?: DepartmentCode;
          student_year?: string;
          student_role?: string | null;
          student_enrollment_no?: string | null;
          mentor_id: string;
          mentor_name?: string;
          mentor_role?: string;
          mentor_company_or_dept?: string;
          purpose_of_request: MentorshipGuidancePurpose;
          area_of_guidance?: string;
          topic?: string;
          message: string;
          requested_date?: string;
          expiry_date?: string | null;
          status?: 'Pending' | 'Accepted' | 'Declined' | 'Completed' | 'Expired';
          request_type?: string | null;
          meeting_notes?: string | null;
          scheduled_time?: string | null;
          proposed_date?: string | null;
          proposed_time_slot?: string | null;
          decline_reason?: string | null;
          feedback?: MentorshipFeedback | null;
        };
        Update: Partial<Database['public']['Tables']['mentorship_requests']['Insert']>;
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          title: string;
          company: string;
          company_logo: string | null;
          location: string;
          type: string;
          stipend_or_salary: string;
          department: DepartmentCode[];
          skills_required: string[];
          posted_by_alumni_id: string;
          posted_by_alumni_name: string;
          posted_by_role: string | null;
          posted_date: string;
          application_deadline: string;
          description: string;
          requirements: string[];
          referral_provided: boolean;
          applicants_count: number;
          status: 'Active' | 'Closed' | 'Pending Approval';
          moderation_status: 'Approved' | 'Pending Approval' | 'Rejected';
          rejection_reason: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          company: string;
          company_logo?: string | null;
          location: string;
          type: string;
          stipend_or_salary: string;
          department?: DepartmentCode[];
          skills_required?: string[];
          posted_by_alumni_id: string;
          posted_by_alumni_name: string;
          posted_by_role?: string | null;
          posted_date?: string;
          application_deadline: string;
          description: string;
          requirements?: string[];
          referral_provided?: boolean;
          applicants_count?: number;
          status?: 'Active' | 'Closed' | 'Pending Approval';
          moderation_status?: 'Approved' | 'Pending Approval' | 'Rejected';
          rejection_reason?: string | null;
        };
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          title: string;
          type: EventType;
          date: string;
          time: string;
          location_or_url: string;
          is_online: boolean;
          speaker_name: string;
          speaker_designation: string;
          speaker_company: string;
          department: DepartmentCode | null;
          description: string;
          banner_image: string;
          rsvps_count: number;
          registered_user_ids: string[];
          status: 'Upcoming' | 'Completed' | 'Cancelled';
          capacity_limit: number | null;
          waitlist_user_ids: string[];
          feedback_entries: EventFeedback[];
        };
        Insert: {
          id?: string;
          title: string;
          type: EventType;
          date: string;
          time: string;
          location_or_url: string;
          is_online?: boolean;
          speaker_name?: string;
          speaker_designation?: string;
          speaker_company?: string;
          department?: DepartmentCode | null;
          description?: string;
          banner_image?: string;
          rsvps_count?: number;
          registered_user_ids?: string[];
          status?: 'Upcoming' | 'Completed' | 'Cancelled';
          capacity_limit?: number | null;
          waitlist_user_ids?: string[];
          feedback_entries?: EventFeedback[];
        };
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          category: 'Placement Alert' | 'Alumni News' | 'Institutional Update' | 'Event Highlight';
          author: string;
          date: string;
          content: string;
          is_important: boolean;
          target_audience: 'All' | 'Students' | 'Alumni' | 'Faculty';
          is_retracted: boolean;
          retracted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          category: 'Placement Alert' | 'Alumni News' | 'Institutional Update' | 'Event Highlight';
          author: string;
          date?: string;
          content: string;
          is_important?: boolean;
          target_audience?: 'All' | 'Students' | 'Alumni' | 'Faculty';
          is_retracted?: boolean;
          retracted_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['announcements']['Insert']>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          date: string;
          type: NotificationType;
          is_read: boolean;
          link_tab: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          date?: string;
          type: NotificationType;
          is_read?: boolean;
          link_tab?: string | null;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
        Relationships: [];
      };
      login_attempts: {
        Row: {
          email: string;
          failed_count: number;
          locked_until: string | null;
          last_attempt_at: string;
        };
        Insert: {
          email: string;
          failed_count?: number;
          locked_until?: string | null;
          last_attempt_at?: string;
        };
        Update: Partial<Database['public']['Tables']['login_attempts']['Insert']>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      department_code: DepartmentCode;
      verification_status: AccountVerificationStatus;
      opportunity_status: 'Active' | 'Closed' | 'Pending Approval';
      moderation_status: 'Approved' | 'Pending Approval' | 'Rejected';
      mentorship_status: 'Pending' | 'Accepted' | 'Declined' | 'Completed' | 'Expired';
      event_status: 'Upcoming' | 'Completed' | 'Cancelled';
      admin_invite_status: 'pending' | 'accepted' | 'revoked';
      role_transition_status: 'pending' | 'approved' | 'rejected';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
