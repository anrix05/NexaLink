import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Check,
  LifeBuoy,
  Tag,
  Clock,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Badge, Button } from '../../components/common/UIComponents';

interface FeedbackTicket {
  id: string;
  ticketNumber: string;
  category: 'General Feedback' | 'Bug / Issue Report' | 'Feature Suggestion';
  subject: string;
  message: string;
  date: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  response?: string;
}

export const FeedbackPage: React.FC = () => {
  const [tickets, setTickets] = useState<FeedbackTicket[]>([
    {
      id: 'fb-1',
      ticketNumber: 'TKT-2026-101',
      category: 'Feature Suggestion',
      subject: 'Request for Microsoft Azure Cloud Internship Webinar',
      message: 'Can we schedule a 1-on-1 Q&A session with Microsoft Azure alumni regarding summer 2026 internships?',
      date: '2026-07-24',
      status: 'In Progress',
      response: 'Alumni Cell is coordinating with Rushil Dahisaria (Microsoft) for an upcoming session on Aug 15.'
    },
    {
      id: 'fb-2',
      ticketNumber: 'TKT-2026-088',
      category: 'General Feedback',
      subject: 'Direct Messaging System UI Feedback',
      message: 'The new instant messaging interface and document attachment handlers are extremely fast. Thank you!',
      date: '2026-07-22',
      status: 'Resolved',
      response: 'Thank you for your feedback! We are glad the real-time chat interface is helping you connect with alumni.'
    }
  ]);

  // New Ticket Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'General Feedback' | 'Bug / Issue Report' | 'Feature Suggestion'>('General Feedback');
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    const newTicket: FeedbackTicket = {
      id: `fb-${Date.now()}`,
      ticketNumber: `TKT-2026-${Math.floor(100 + Math.random() * 900)}`,
      category,
      subject,
      message,
      date: new Date().toISOString().split('T')[0],
      status: 'Open'
    };

    setTickets([newTicket, ...tickets]);
    setSubject('');
    setMessage('');
    showToast('Feedback ticket submitted successfully!');
  };

  const getStatusBadge = (status: FeedbackTicket['status']) => {
    switch (status) {
      case 'Resolved':
        return <Badge variant="emerald" size="sm">Resolved</Badge>;
      case 'In Progress':
        return <Badge variant="amber" size="sm">In Progress</Badge>;
      case 'Open':
      default:
        return <Badge variant="indigo" size="sm">Open</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans text-xs">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <Badge variant="indigo" size="sm">Institutional Support</Badge>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-950 tracking-tight mt-1">
            Feedback & Support Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Submit feedback, report platform issues, suggest new features, and track support ticket resolutions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="blue" size="md" icon={<LifeBuoy className="w-3.5 h-3.5" />}>
            Institutional Cell Support
          </Badge>
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-sm animate-in fade-in">
          <Check className="w-4 h-4" /> {notice}
        </div>
      )}

      {/* Form & Ticket Tracker Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Submit New Feedback Form */}
        <form onSubmit={handleSubmitTicket} className="lg:col-span-6 bg-white border border-slate-200/85 p-6 rounded-2xl shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-display font-bold text-slate-950 text-sm uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              Submit Feedback or Report Issue
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="app-label">Feedback Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="app-input w-full font-bold"
              >
                <option value="General Feedback">General Platform Feedback</option>
                <option value="Bug / Issue Report">Report Technical Bug / Issue</option>
                <option value="Feature Suggestion">Suggest New Feature</option>
              </select>
            </div>

            <div>
              <label className="app-label">Subject Headline</label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Request for Alumni Mock Interview Slot"
                className="app-input w-full font-bold"
              />
            </div>

            <div>
              <label className="app-label">Detailed Description</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe your feedback, suggestion, or issue in detail..."
                className="app-input w-full leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Submit Ticket
            </Button>
          </div>
        </form>

        {/* Right: Track Submitted Tickets & Status */}
        <div className="lg:col-span-6 bg-white border border-slate-200/85 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="font-display font-bold text-slate-950 text-sm uppercase tracking-wider flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-600" />
              Submitted Tickets ({tickets.length})
            </h2>
          </div>

          <div className="space-y-4">
            {tickets.map(tkt => (
              <div key={tkt.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-950 text-xs">{tkt.ticketNumber}</span>
                    <Badge variant="indigo" size="sm">
                      {tkt.category}
                    </Badge>
                  </div>
                  {getStatusBadge(tkt.status)}
                </div>

                <h3 className="font-display font-bold text-slate-950 text-xs mt-1">{tkt.subject}</h3>
                <p className="text-slate-600 text-xs font-normal leading-relaxed">{tkt.message}</p>

                {tkt.response && (
                  <div className="p-3 bg-indigo-50/70 border border-indigo-100/80 rounded-xl text-indigo-950 font-medium text-xs space-y-1 mt-2">
                    <p className="font-display font-bold text-indigo-700 text-[10px] uppercase tracking-wider">Alumni Cell Response:</p>
                    <p className="leading-snug">{tkt.response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
