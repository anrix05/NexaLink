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
  Plus,
  CheckCircle2,
  Check,
  Download,
  Star,
  RefreshCw
} from 'lucide-react';
import { RoleGate } from '../../components/common/RoleGate';
import {
  Badge,
  Button,
  SegmentedTabs,
  Modal,
  TextField,
  SelectField,
  TextArea,
  EmptyState
} from '../../components/common/UIComponents';

export const EventsPage: React.FC = () => {
  const { eventsList, rsvpEvent, addEvent, submitEventFeedback, isDataLoading } = useData();
  const { currentRole, currentUser } = useAuth();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [rsvpSuccessMsg, setRsvpSuccessMsg] = useState<string | null>(null);

  // Event Feedback Modal State
  const [feedbackEventId, setFeedbackEventId] = useState<string | null>(null);
  const [eventRating, setEventRating] = useState(5);
  const [eventComment, setEventComment] = useState('Great event organized by VIT Wadala.');

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
      setRsvpSuccessMsg('Event seat capacity reached. You have been added to the waitlist queue.');
    } else {
      setRsvpSuccessMsg('Participation registered. RSVP notification sent.');
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
      setRsvpSuccessMsg('Official event certificate downloaded.');
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
    setLocation('');
    setSpeaker('');
    setDescription('');
    setRsvpSuccessMsg('Institutional event organized successfully.');
    setTimeout(() => setRsvpSuccessMsg(null), 3500);
  };

  const handleEventFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackEventId) return;

    submitEventFeedback(
      feedbackEventId,
      currentUser.id,
      currentUser.name,
      eventRating,
      eventComment
    );

    setFeedbackEventId(null);
    setRsvpSuccessMsg('Thank you for submitting event feedback.');
    setTimeout(() => setRsvpSuccessMsg(null), 3500);
  };

  const categoryOptions = [
    { id: 'All', label: 'All events', count: eventsList.length },
    ...eventCategories.map(c => ({ id: c, label: c, count: eventsList.filter(e => e.type === c).length }))
  ];

  return (
    <div className="space-y-5 font-sans text-xs">
      
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#0A0A0A]">
            Campus events & talks
          </h2>
          <p className="text-xs text-[#6B7280]">
            Browse institutional workshops, alumni reunions, masterclasses, and placement seminars.
          </p>
        </div>

        <RoleGate allow={['faculty', 'admin']}>
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowAddEventModal(true)}
            icon={<Plus className="w-4 h-4" />}
            className="self-start sm:self-auto"
          >
            Organize event
          </Button>
        </RoleGate>
      </div>

      {rsvpSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-medium rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{rsvpSuccessMsg}</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <SegmentedTabs
          options={categoryOptions}
          activeTab={activeCategory}
          onChange={(cat) => setActiveCategory(cat)}
        />
      </div>

      {/* Events Grid */}
      {isDataLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0A0A0A] border-t-transparent"></div>
          <p className="text-[#6B7280] text-xs">Loading events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-6 h-6" />}
          title="No events found"
          description="There are currently no events matching this category."
          action={
            <Button
              variant="secondary"
              size="md"
              onClick={() => setActiveCategory('All')}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: Math.min(index * 0.02, 0.2) }}
                className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden flex flex-col justify-between hover:border-[#0A0A0A] transition-colors"
              >
                {/* Banner Image with Badge */}
                <div className="relative h-40 overflow-hidden bg-[#FAFAFA]">
                  <img
                    src={evt.bannerImage}
                    alt={evt.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 bg-[#0A0A0A] text-white text-[11px] font-medium rounded-md">
                      {evt.type}
                    </span>
                    {isFull && !isCompleted && (
                      <span className="px-2 py-0.5 bg-white text-[#0A0A0A] text-[11px] font-medium rounded-md border border-[#E5E7EB]">
                        Full ({evt.waitlistUserIds?.length || 0} waitlisted)
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between text-xs">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-[#0A0A0A] leading-snug">
                      {evt.title}
                    </h3>
                    <p className="text-[#6B7280] leading-relaxed line-clamp-2">
                      {evt.description}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-[#E5E7EB]">
                    <p className="font-medium text-[#0A0A0A] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#6B7280]" />
                      <span>{evt.date} at {evt.time}</span>
                    </p>
                    <p className="text-[#6B7280] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#6B7280]" />
                      <span className="truncate">{evt.locationOrUrl}</span>
                    </p>
                    <p className="text-[#6B7280] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#6B7280]" />
                      <span className="truncate">Speaker: <strong className="text-[#0A0A0A] font-medium">{evt.speakerName}</strong> ({evt.speakerCompany})</span>
                    </p>
                  </div>
                </div>

                {/* Capacity & Actions */}
                <div className="p-4 bg-[#FAFAFA] border-t border-[#E5E7EB] space-y-2.5 font-sans text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                      <span>Reserved capacity</span>
                      <span className="text-[#0A0A0A] tabular-nums font-medium">{evt.rsvpsCount} / {limit} ({capacityPercent}%)</span>
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
                          icon={<Star className="w-3.5 h-3.5" />}
                        >
                          Feedback
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDownloadCertificate(evt.title)}
                          icon={<Download className="w-3.5 h-3.5" />}
                        >
                          Certificate
                        </Button>
                      </div>
                    ) : isRegistered ? (
                      <Badge variant="emerald" icon={<Check className="w-3.5 h-3.5 text-[#065F46]" />}>
                        Registered
                      </Badge>
                    ) : isWaitlisted ? (
                      <Badge variant="indigo">
                        Waitlisted
                      </Badge>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleRsvp(evt)}
                        className="w-full"
                      >
                        {isFull ? 'Join waitlist' : 'RSVP / Register'}
                      </Button>
                    )}
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      )}

      {/* Organize Event Modal */}
      <Modal
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        title="Organize campus event"
        icon={<Calendar className="w-5 h-5 text-[#0A0A0A]" />}
      >
        <form onSubmit={handleAddEventSubmit} className="space-y-3 font-sans text-xs">
          <TextField
            label="Event title"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Generative AI in Production Workshop"
          />

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Event type"
              value={type}
              onChange={e => setType(e.target.value as EventType)}
              options={eventCategories.map(c => ({ value: c, label: c }))}
            />

            <TextField
              label="Event date"
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Event time"
              value={time}
              onChange={e => setTime(e.target.value)}
              placeholder="e.g. 05:30 PM IST"
            />

            <TextField
              label="Seat capacity"
              type="number"
              value={capacityLimit}
              onChange={e => setCapacityLimit(parseInt(e.target.value) || 50)}
            />
          </div>

          <TextField
            label="Location or meeting URL"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="e.g. Auditorium Hall, VIT Wadala / Zoom URL"
          />

          <TextField
            label="Keynote speaker"
            value={speaker}
            onChange={e => setSpeaker(e.target.value)}
            placeholder="e.g. Dr. Ravindra Sangale (Google)"
          />

          <TextArea
            label="Event description"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Detail event agenda and learning takeaways..."
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button type="button" variant="secondary" size="md" onClick={() => setShowAddEventModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Publish event
            </Button>
          </div>
        </form>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        isOpen={!!feedbackEventId}
        onClose={() => setFeedbackEventId(null)}
        title="Event feedback"
        icon={<Star className="w-5 h-5 text-[#0A0A0A]" />}
      >
        <form onSubmit={handleEventFeedbackSubmit} className="space-y-4 font-sans text-xs">
          <div>
            <label className="app-label">Rate your experience (1 to 5 stars)</label>
            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setEventRating(star)}
                  className="p-1 cursor-pointer touch-target-44"
                >
                  <Star className={`w-5 h-5 ${star <= eventRating ? 'fill-[#0A0A0A] text-[#0A0A0A]' : 'text-[#D1D5DB]'}`} />
                </button>
              ))}
            </div>
          </div>

          <TextArea
            label="Comments & takeaways"
            rows={3}
            value={eventComment}
            onChange={e => setEventComment(e.target.value)}
            placeholder="Share feedback on speaker, content, and organization..."
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button type="button" variant="secondary" size="md" onClick={() => setFeedbackEventId(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Submit feedback
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
