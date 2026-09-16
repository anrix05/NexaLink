import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import type { EventItem, EventType } from '../../types';
import {
  Calendar,
  MapPin,
  Users,
  Video,
  Plus,
  CheckCircle2,
  X,
  Check,
  Award,
  Download,
  Star,
  MessageSquare
} from 'lucide-react';
import { RoleGate } from '../../components/common/RoleGate';
import { Badge, Button, SegmentedTabs, Modal, ToastNotice } from '../../components/common/UIComponents';

export const EventsPage: React.FC = () => {
  const { eventsList, rsvpEvent, addEvent, submitEventFeedback } = useData();
  const { currentRole, currentUser } = useAuth();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [rsvpSuccessMsg, setRsvpSuccessMsg] = useState<string | null>(null);

  // Event Feedback Modal State
  const [feedbackEventId, setFeedbackEventId] = useState<string | null>(null);
  const [eventRating, setEventRating] = useState(5);
  const [eventComment, setEventComment] = useState('Great event organized by VIT Wadala!');

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('Alumni Meet');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('06:00 PM IST');
  const [location, setLocation] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [description, setDescription] = useState('');
  const [capacityLimit, setCapacityLimit] = useState(50);

  const eventCategories: EventType[] = [
    'Alumni Meet',
    'Guest Lecture',
    'Workshop',
    'Webinar',
    'Placement Drive',
    'Research Seminar'
  ];

  const filteredEvents = eventsList.filter(evt => {
    if (activeCategory !== 'All' && evt.type !== activeCategory) return false;
    return true;
  });

  const handleRsvp = (evt: EventItem) => {
    const isRegistered = evt.registeredUserIds.includes(currentUser.id);
    const isWaitlisted = (evt.waitlistUserIds || []).includes(currentUser.id);
    const limit = evt.capacityLimit || 50;

    rsvpEvent(evt.id, currentUser.id);

    if (isRegistered || isWaitlisted) {
      setRsvpSuccessMsg('RSVP status updated.');
    } else if (evt.registeredUserIds.length >= limit) {
      setRsvpSuccessMsg('Event seat capacity reached! You have been added to the Waitlist queue.');
    } else {
      setRsvpSuccessMsg('Participation registered! RSVP notification sent.');
    }
    setTimeout(() => setRsvpSuccessMsg(null), 3500);
  };

  const handleDownloadCertificate = (evtTitle: string) => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      doc.setDrawColor(10, 10, 10);
      doc.setLineWidth(2);
      doc.rect(10, 10, 277, 190);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(10, 10, 10);
      doc.text('VIDYALANKAR INSTITUTE OF TECHNOLOGY, MUMBAI', 148.5, 38, { align: 'center' });

      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(10, 10, 10);
      doc.text('CERTIFICATE OF PARTICIPATION', 148.5, 72, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('This is to certify that', 148.5, 90, { align: 'center' });

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(currentUser.name, 148.5, 105, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`has registered and participated in institutional event: "${evtTitle}"`, 148.5, 125, { align: 'center' });

      doc.save(`VIT_Event_Certificate_${currentUser.name.replace(/\s+/g, '_')}.pdf`);
      setRsvpSuccessMsg('Official Event Certificate downloaded!');
      setTimeout(() => setRsvpSuccessMsg(null), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    addEvent({
      title,
      type,
      date,
      time: time || '06:00 PM IST',
      locationOrUrl: location || 'Vidyalankar Main Auditorium, VIT Wadala',
      isOnline: location.toLowerCase().includes('online') || location.toLowerCase().includes('zoom'),
      speakerName: speaker || 'Keynote Speaker',
      speakerDesignation: 'Distinguished Guest',
      speakerCompany: 'Institutional Partner',
      description: description || 'Institutional event organized at VIT Wadala.',
      bannerImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
      capacityLimit
    });

    setShowAddEventModal(false);
    setTitle('');
  };

  const handleEventFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackEventId) {
      submitEventFeedback(feedbackEventId, currentUser.id, currentUser.name, eventRating, eventComment);
      setFeedbackEventId(null);
      setRsvpSuccessMsg('Event feedback submitted successfully! Analytics updated.');
      setTimeout(() => setRsvpSuccessMsg(null), 3500);
    }
  };

  const categoryTabOptions = [
    { id: 'All', label: 'All Events', count: eventsList.length },
    ...eventCategories.map(cat => ({ id: cat, label: cat, count: eventsList.filter(e => e.type === cat).length }))
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 sm:pb-0 font-sans text-xs">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] tracking-tight flex items-center gap-2">
            <Calendar className="w-7 h-7 text-[#0A0A0A]" />
            Event Management & RSVPs
          </h1>
          <p className="text-sm text-[#6B7280] font-medium mt-1">
            Alumni Meets, Guest Lectures, Workshops, Webinars, Placement Drives, & Research Seminars.
          </p>
        </div>

        <RoleGate allow={['admin', 'faculty', 'alumni']}>
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowAddEventModal(true)}
            icon={<Plus className="w-4 h-4" />}
            className="self-start sm:self-auto"
          >
            Organize Event
          </Button>
        </RoleGate>
      </div>

      {/* Toast Notice */}
      <ToastNotice
        message={rsvpSuccessMsg}
        onClose={() => setRsvpSuccessMsg(null)}
        className="mb-4"
      />

      {/* Category Segmented Tabs */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <SegmentedTabs
          options={categoryTabOptions}
          activeTab={activeCategory}
          onChange={(cat) => setActiveCategory(cat)}
        />
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((evt, index) => {
          const isRegistered = evt.registeredUserIds.includes(currentUser.id);
          const isWaitlisted = (evt.waitlistUserIds || []).includes(currentUser.id);
          const isCompleted = evt.status === 'Completed';
          const limit = evt.capacityLimit || 50;
          const isFull = evt.registeredUserIds.length >= limit;
          const capacityPercent = Math.min(100, Math.round((evt.rsvpsCount / limit) * 100));

          return (
            <motion.div
              key={evt.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.35) }}
              whileHover={{ y: -2, borderColor: '#9CA3AF' }}
              className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-none transition-colors duration-150 flex flex-col justify-between"
            >
              {/* Banner Image with Badge */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={evt.bannerImage}
                  alt={evt.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-3 py-1 bg-[#0A0A0A] text-white font-bold text-[10px] uppercase tracking-wider rounded-md">
                    {evt.type}
                  </span>
                  {isFull && !isCompleted && (
                    <span className="px-2.5 py-1 bg-[#F3F4F6] text-[#374151] font-bold text-[10px] uppercase rounded-md border border-[#E5E7EB]">
                      Full ({evt.waitlistUserIds?.length || 0} Waitlist)
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between text-xs">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-[#0A0A0A] leading-snug">
                    {evt.title}
                  </h3>

                  <p className="text-[#6B7280] font-medium leading-relaxed line-clamp-2">
                    {evt.description}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-[#E5E7EB]">
                  <p className="font-bold text-[#0A0A0A] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0A0A0A]" />
                    <span>{evt.date} at {evt.time}</span>
                  </p>
                  <p className="text-[#6B7280] font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <span>{evt.locationOrUrl}</span>
                  </p>
                  <p className="text-[#6B7280] font-medium flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <span>Speaker: <strong className="text-[#0A0A0A]">{evt.speakerName}</strong> ({evt.speakerCompany})</span>
                  </p>
                </div>
              </div>

              {/* Seat Capacity Progress Bar & Footer */}
              <div className="p-5 bg-[#FAFAFA] border-t border-[#E5E7EB] space-y-3 font-sans text-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-[#6B7280]">Reserved Capacity</span>
                    <span className="text-[#0A0A0A] font-mono">{evt.rsvpsCount} / {limit} Seats ({capacityPercent}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0A0A0A] transition-all duration-300 rounded-full"
                      style={{ width: `${capacityPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {isCompleted ? (
                    <div className="flex items-center gap-2 w-full">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => setFeedbackEventId(evt.id)}
                        icon={<Star className="w-3.5 h-3.5 fill-[#0A0A0A] text-[#0A0A0A]" />}
                      >
                        Feedback
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDownloadCertificate(evt.title)}
                        icon={<Download className="w-3.5 h-3.5 text-[#0A0A0A]" />}
                      >
                        Certificate
                      </Button>
                    </div>
                  ) : isRegistered ? (
                    <Badge variant="emerald" icon={<Check className="w-3.5 h-3.5 text-[#065F46]" />}>
                      ✓ REGISTERED
                    </Badge>
                  ) : isWaitlisted ? (
                    <Badge variant="indigo">
                      WAITLISTED
                    </Badge>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleRsvp(evt)}
                      className="w-full"
                    >
                      {isFull ? 'Join Waitlist' : 'RSVP / Register'}
                    </Button>
                  )}
                </div>
              </div>

            </motion.div>
          );
        })}
      </div>

      {/* Organize Event Modal */}
      <Modal
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        title="Organize Institutional Event"
        icon={<Calendar className="w-5 h-5" />}
      >
        <form onSubmit={handleAddEventSubmit} className="space-y-3 font-sans text-xs">
          <div>
            <label className="app-label text-[#0A0A0A] font-bold">Event Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Distributed Cloud Architecture & Scalability Masterclass"
              className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="app-label text-[#0A0A0A] font-bold">Event Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as EventType)}
                className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
              >
                {eventCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="app-label text-[#0A0A0A] font-bold">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
              />
            </div>
          </div>

          <div>
            <label className="app-label text-[#0A0A0A] font-bold">Location or Virtual Platform</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Main Auditorium, VIT Wadala or Zoom Live Stream"
              className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
            />
          </div>

          <div>
            <label className="app-label text-[#0A0A0A] font-bold">Keynote Speaker</label>
            <input
              type="text"
              value={speaker}
              onChange={e => setSpeaker(e.target.value)}
              placeholder="e.g. Rushabh Sanghavi (Senior SWE, Google)"
              className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
            />
          </div>

          <div>
            <label className="app-label text-[#0A0A0A] font-bold">Event Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief agenda and target student & alumni audience..."
              className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button type="button" variant="secondary" size="md" onClick={() => setShowAddEventModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Publish Event
            </Button>
          </div>
        </form>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        isOpen={!!feedbackEventId}
        onClose={() => setFeedbackEventId(null)}
        title="Event Participant Feedback"
      >
        <form onSubmit={handleEventFeedbackSubmit} className="space-y-4 font-sans text-xs">
          <div>
            <label className="app-label text-[#0A0A0A] font-bold">Rating</label>
            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setEventRating(star)}
                  className="p-1 text-lg transition-transform hover:scale-110 cursor-pointer"
                >
                  <Star className={`w-6 h-6 ${star <= eventRating ? 'fill-[#0A0A0A] text-[#0A0A0A]' : 'text-[#E5E7EB]'}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="app-label text-[#0A0A0A] font-bold">Comments & Suggestions</label>
            <textarea
              rows={3}
              value={eventComment}
              onChange={e => setEventComment(e.target.value)}
              className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button type="button" variant="secondary" size="md" onClick={() => setFeedbackEventId(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Submit Feedback
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
