import React, { useState } from 'react';
import {
  Button,
  Badge,
  StatCard,
  TextField,
  PasswordField,
  SelectField,
  Toggle,
  FileDropzone,
  Stepper,
  SegmentedTabs,
  EmptyState,
  Skeleton
} from '../../components/common/UIComponents';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Search,
  BookOpen,
  Briefcase,
  Users,
  Building2,
  Filter
} from 'lucide-react';
import { Eyebrow } from '../../components/common/Eyebrow';

interface StyleguidePageProps {
  setActiveTab: (tab: string) => void;
}

export const StyleguidePage: React.FC<StyleguidePageProps> = ({ setActiveTab }) => {
  const [toggleState, setToggleState] = useState(true);
  const [stepperStep, setStepperStep] = useState(1);
  const [activeSegment, setActiveSegment] = useState<'all' | 'jobs' | 'events'>('all');
  const [sampleText, setSampleText] = useState('Rahul Sharma');
  const [sampleEmail, setSampleEmail] = useState('student@student.vit.edu.in');
  const [samplePassword, setSamplePassword] = useState('Secr3tP@ssword!');
  const [sampleSelect, setSampleSelect] = useState('CMPN');
  const [dummyFile, setDummyFile] = useState<File | null>(null);

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] font-sans antialiased py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="indigo" size="sm">DEV ONLY</Badge>
            <span className="text-xs font-mono text-[#6B7280]">/dev/styleguide</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-[#0A0A0A] mt-2">
            NexaLink Design System & Component Styleguide
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Complete catalogue of typography, tokens, form controls, badges, empty states, and responsive patterns.
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={() => setActiveTab('dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      {/* 1. Tokens & Color Palette */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#0A0A0A]">1. Pure Monochrome Palette & Institutional Accents</h2>
          <p className="text-xs text-[#6B7280]">Strict WCAG AA compliant color tokens with zero soft drop shadows.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-3 border border-[#E5E7EB] rounded-xl space-y-2">
            <div className="h-10 rounded bg-[#0A0A0A] border border-[#222222]" />
            <div>
              <span className="font-bold text-xs block text-[#0A0A0A]">--ink</span>
              <span className="font-mono text-[10px] text-[#6B7280]">#0A0A0A</span>
            </div>
          </div>

          <div className="p-3 border border-[#E5E7EB] rounded-xl space-y-2">
            <div className="h-10 rounded bg-white border border-[#E5E7EB]" />
            <div>
              <span className="font-bold text-xs block text-[#0A0A0A]">--bg / white</span>
              <span className="font-mono text-[10px] text-[#6B7280]">#FFFFFF</span>
            </div>
          </div>

          <div className="p-3 border border-[#E5E7EB] rounded-xl space-y-2">
            <div className="h-10 rounded bg-[#FAFAFA] border border-[#E5E7EB]" />
            <div>
              <span className="font-bold text-xs block text-[#0A0A0A]">--surface</span>
              <span className="font-mono text-[10px] text-[#6B7280]">#FAFAFA</span>
            </div>
          </div>

          <div className="p-3 border border-[#E5E7EB] rounded-xl space-y-2">
            <div className="h-10 rounded bg-[#F3F4F6] border border-[#E5E7EB]" />
            <div>
              <span className="font-bold text-xs block text-[#0A0A0A]">--surface-hover</span>
              <span className="font-mono text-[10px] text-[#6B7280]">#F3F4F6</span>
            </div>
          </div>

          <div className="p-3 border border-[#E5E7EB] rounded-xl space-y-2">
            <div className="h-10 rounded bg-[#E5E7EB]" />
            <div>
              <span className="font-bold text-xs block text-[#0A0A0A]">--border</span>
              <span className="font-mono text-[10px] text-[#6B7280]">#E5E7EB</span>
            </div>
          </div>

          <div className="p-3 border border-[#E5E7EB] rounded-xl space-y-2">
            <div className="h-10 rounded bg-[#6B7280]" />
            <div>
              <span className="font-bold text-xs block text-[#0A0A0A]">--text-muted</span>
              <span className="font-mono text-[10px] text-[#6B7280]">#6B7280</span>
            </div>
          </div>

          <div className="p-3 border border-[#E5E7EB] rounded-xl space-y-2">
            <div className="h-10 rounded bg-emerald-600" />
            <div>
              <span className="font-bold text-xs block text-[#0A0A0A]">Emerald (Verified)</span>
              <span className="font-mono text-[10px] text-[#6B7280]">#16A34A / #059669</span>
            </div>
          </div>

          <div className="p-3 border border-[#E5E7EB] rounded-xl space-y-2">
            <div className="h-10 rounded bg-amber-500" />
            <div>
              <span className="font-bold text-xs block text-[#0A0A0A]">Amber (Action Req)</span>
              <span className="font-mono text-[10px] text-[#6B7280]">#D97706 / #B45309</span>
            </div>
          </div>

          <div className="p-3 border border-[#E5E7EB] rounded-xl space-y-2">
            <div className="h-10 rounded bg-indigo-600" />
            <div>
              <span className="font-bold text-xs block text-[#0A0A0A]">Indigo (Dept / Role)</span>
              <span className="font-mono text-[10px] text-[#6B7280]">#4F46E5</span>
            </div>
          </div>

          <div className="p-3 border border-[#E5E7EB] rounded-xl space-y-2">
            <div className="h-10 rounded bg-rose-600" />
            <div>
              <span className="font-bold text-xs block text-[#0A0A0A]">Rose (Danger / Error)</span>
              <span className="font-mono text-[10px] text-[#6B7280]">#E11D48 / #BE123C</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Typography Hierarchy */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#0A0A0A]">2. Typography Hierarchy</h2>
          <p className="text-xs text-[#6B7280]">Inter + Outfit (Display) with tabular numbers for stats and monospace strictly for PRN/ID/OTP.</p>
        </div>

        <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-6 space-y-4">
          <div>
            <Eyebrow className="block mb-1">
              Section Eyebrow
            </Eyebrow>
            <p className="text-3xl sm:text-4xl font-display font-bold text-[#0A0A0A] tracking-tight">
              Display Heading: NexaLink Institutional Platform
            </p>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#0A0A0A]">H2 Section Heading: Academic & Career Outcomes</h2>
            <p className="text-xs text-[#6B7280]">Regular body text rendered in Inter 12px with relaxed line height for clean technical readability.</p>
          </div>

          <div className="flex flex-wrap gap-4 items-center pt-2">
            <div className="bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-lg">
              <span className="text-xs text-[#6B7280] block">Headline Metric (Tabular numbers)</span>
              <span className="tabular-nums text-2xl font-bold text-[#0A0A0A]">1,429 Active</span>
            </div>

            <div className="bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-lg">
              <span className="text-xs text-[#6B7280] block">PRN / OTP / Hash (Monospace)</span>
              <span className="font-mono text-sm font-bold text-[#0A0A0A]">PRN: 22102A0042</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Buttons & Interactive States */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#0A0A0A]">3. Buttons & Interactive Actions</h2>
          <p className="text-xs text-[#6B7280]">Primary (#0A0A0A), Secondary, Ghost, Danger, and Outline across sm/md/lg sizes.</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
              Primary Button
            </Button>
            <Button variant="secondary" size="md">
              Secondary Button
            </Button>
            <Button variant="ghost" size="md">
              Ghost Action
            </Button>
            <Button variant="danger" size="md">
              Danger Action
            </Button>
            <Button variant="ghost" size="md">
              Ghost Action
            </Button>
          </div>

          <div className="flex flex-wrap gap-3 items-center pt-2 border-t border-[#E5E7EB]">
            <Button variant="primary" size="sm">Small (sm)</Button>
            <Button variant="primary" size="md">Medium (md)</Button>
            <Button variant="primary" size="lg">Large (lg)</Button>
            <Button variant="primary" size="md" disabled>Disabled State</Button>
            <Button variant="secondary" size="md" disabled>Secondary Disabled</Button>
          </div>
        </div>
      </section>

      {/* 4. Badges & Status Indicators */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#0A0A0A]">4. Badges & System Statuses</h2>
          <p className="text-xs text-[#6B7280]">Standardized institutional status pills with icons and text.</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 flex flex-wrap gap-3 items-center">
          <Badge variant="default">Neutral Badge</Badge>
          <Badge variant="emerald" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
            Verified Alumni
          </Badge>
          <Badge variant="indigo" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
            Faculty Advisor
          </Badge>
          <Badge variant="amber" icon={<AlertCircle className="w-3.5 h-3.5" />}>
            Pending Verification
          </Badge>
          <Badge variant="rose" icon={<AlertCircle className="w-3.5 h-3.5" />}>
            Needs Clarification
          </Badge>
        </div>
      </section>

      {/* 5. Form Components & Shared Validators */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#0A0A0A]">5. Form Inputs & Validators</h2>
          <p className="text-xs text-[#6B7280]">TextField with 42px leading icon clearance (B3), PasswordField with show/hide, SelectField, and Toggle.</p>
        </div>

        <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <TextField
              label="Standard Text Input (Name)"
              required
              value={sampleText}
              onChange={e => setSampleText(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              helperText="Helper text displayed below input in sentence case."
            />

            <TextField
              label="Search Input with Leading Icon (B3 Fix)"
              value=""
              onChange={() => {}}
              placeholder="Search alumni by name, company, or skills..."
              leadingIcon={<Search className="w-4 h-4 text-[#6B7280]" />}
            />

            <TextField
              label="Error State Input"
              value="invalid-email"
              onChange={() => {}}
              error="Student email must end in @student.vit.edu.in or @vit.edu.in (B2)"
            />
          </div>

          <div className="space-y-4">
            <PasswordField
              label="Password Field with Show/Hide"
              required
              value={samplePassword}
              onChange={e => setSamplePassword(e.target.value)}
            />

            <SelectField
              label="Department Select (B11: Clean Placeholder)"
              value={sampleSelect}
              onChange={e => setSampleSelect(e.target.value)}
              options={[
                { value: '', label: 'Select department' },
                { value: 'CMPN', label: 'Computer Engineering (CMPN)' },
                { value: 'INFT', label: 'Information Technology (INFT)' },
                { value: 'EXCS', label: 'Electronics & Computer Science (EXCS)' },
                { value: 'EXTC', label: 'Electronics & Telecommunication (EXTC)' }
              ]}
            />

            <div className="p-4 bg-white border border-[#E5E7EB] rounded-xl space-y-2">
              <span className="text-xs font-bold text-[#0A0A0A] block">Toggle / Mentorship Switch (B16)</span>
              <Toggle
                checked={toggleState}
                onChange={setToggleState}
                label={toggleState ? 'Accepting mentees' : 'Mentoring paused'}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. FileDropzone & Stepper */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#0A0A0A]">6. Stepper & FileDropzone</h2>
          <p className="text-xs text-[#6B7280]">Interactive wizard navigation and drag-and-drop document upload with size limits.</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0A0A0A]">
                Stepper Step {stepperStep + 1} of 4: {['Role', 'Details', 'Proof', 'Login'][stepperStep]}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={stepperStep === 0}
                  onClick={() => setStepperStep(s => Math.max(0, s - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={stepperStep === 3}
                  onClick={() => setStepperStep(s => Math.min(3, s + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
            <Stepper
              steps={[
                { id: 1, title: 'Role' },
                { id: 2, title: 'Details' },
                { id: 3, title: 'Proof' },
                { id: 4, title: 'Login' }
              ]}
              currentStep={stepperStep}
            />
          </div>

          <div className="pt-4 border-t border-[#E5E7EB]">
            <FileDropzone
              label="Student ID or Degree Certificate"
              accept="image/*,.pdf"
              maxSizeMB={5}
              selectedFile={dummyFile}
              helperText="Accepted formats: JPG, PNG, PDF (max 5 MB)."
              onFileSelect={file => setDummyFile(file)}
              onFileRemove={() => setDummyFile(null)}
            />
          </div>
        </div>
      </section>

      {/* 7. StatCards & Honest Empty States (P1, P2) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#0A0A0A]">7. StatCards & Empty States (P1, P2)</h2>
          <p className="text-xs text-[#6B7280]">StatCards use tabular numbers; empty states never pretend to be data.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Verified Alumni"
            value="1,420"
            subtext="+14% this quarter"
            icon={<Users className="w-4 h-4 text-[#0A0A0A]" />}
          />

          <StatCard
            title="Active Mentorships"
            value="48"
            subtext="Sessions in progress"
            icon={<BookOpen className="w-4 h-4 text-[#0A0A0A]" />}
          />

          <StatCard
            title="Pending Asks (Empty Variant P1)"
            value="0"
            subtext="No requests waiting"
            icon={<Clock className="w-4 h-4 text-[#6B7280]" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Empty State Type 1: Nothing exists yet */}
          <EmptyState
            icon={<Briefcase className="w-8 h-8 text-[#0A0A0A]" />}
            title="No opportunities posted yet"
            description="Verified alumni and faculty can post job openings and research opportunities for students."
            actionLabel="Post opportunity"
            onAction={() => {}}
          />

          {/* Empty State Type 2: No results match filters */}
          <EmptyState
            icon={<Filter className="w-8 h-8 text-[#6B7280]" />}
            title="No matching records found"
            description="No directory members match the currently selected department, skill, or role filters."
            actionLabel="Clear all filters"
            onAction={() => {}}
          />
        </div>
      </section>

      {/* 8. Skeletons & Async Loaders */}
      <section className="space-y-4 pb-12">
        <div>
          <h2 className="text-lg font-bold text-[#0A0A0A]">8. Skeletons for Zero CLS</h2>
          <p className="text-xs text-[#6B7280]">Predictive skeleton placeholders matching card geometries.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border border-[#E5E7EB] rounded-xl space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>

          <div className="p-4 border border-[#E5E7EB] rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-2.5 w-1/3" />
              </div>
            </div>
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>

          <div className="p-4 border border-[#E5E7EB] rounded-xl space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      </section>
    </div>
  );
};
