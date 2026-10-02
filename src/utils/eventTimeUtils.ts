import type { EventItem, EventMode, JobListing } from '../types';
import { getVenueById } from '../data/venuesData';

/**
 * Format date/time to IST (Asia/Kolkata)
 */
export const toIST = (dateInput: string | Date | number): Date => {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  return date;
};

/**
 * Parses any date/time combination into standardized ISO UTC strings
 */
export const createEventIsoTimestamps = (
  dateStr: string, // YYYY-MM-DD
  startTimeStr: string, // HH:MM (24h) or '07:00 PM IST'
  endTimeStr: string // HH:MM (24h) or '08:30 PM IST'
): { startsAt: string; endsAt: string } => {
  const parseHourMinute = (tStr: string): { hours: number; minutes: number } => {
    // If standard 24h format HH:MM
    if (/^\d{1,2}:\d{2}$/.test(tStr.trim())) {
      const [h, m] = tStr.trim().split(':').map(Number);
      return { hours: h, minutes: m };
    }
    // If formatted like '07:00 PM IST' or '7:00 pm'
    const match = tStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const meridian = match[3].toUpperCase();
      if (meridian === 'PM' && hours < 12) hours += 12;
      if (meridian === 'AM' && hours === 12) hours = 0;
      return { hours, minutes };
    }
    return { hours: 10, minutes: 0 };
  };

  const startHM = parseHourMinute(startTimeStr);
  const endHM = parseHourMinute(endTimeStr);

  // Construct in IST (UTC+05:30)
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Date in UTC that corresponds to the given IST time
  // IST is UTC + 5h30m -> UTC is IST - 5h30m
  const startUtc = new Date(Date.UTC(year, (month || 1) - 1, day || 1, startHM.hours - 5, startHM.minutes - 30));
  const endUtc = new Date(Date.UTC(year, (month || 1) - 1, day || 1, endHM.hours - 5, endHM.minutes - 30));

  return {
    startsAt: startUtc.toISOString(),
    endsAt: endUtc.toISOString()
  };
};

/**
 * Formats a date into sentence case date block parts
 * e.g. "20 Nov", "Fri, 20 Nov 2026"
 */
export const formatEventDate = (dateOrIso: string | Date): {
  day: string;
  month: string;
  year: string;
  weekday: string;
  fullDate: string;
} => {
  const date = new Date(dateOrIso);
  if (isNaN(date.getTime())) {
    return {
      day: '20',
      month: 'Nov',
      year: '2026',
      weekday: 'Fri',
      fullDate: 'Fri, 20 Nov 2026'
    };
  }

  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    weekday: 'short'
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

  const day = getPart('day');
  const month = getPart('month'); // e.g. "Nov" (sentence case, not uppercase "NOV")
  const year = getPart('year');
  const weekday = getPart('weekday');

  return {
    day,
    month,
    year,
    weekday,
    fullDate: `${weekday}, ${day} ${month} ${year}`
  };
};

/**
 * Standardize single time in IST e.g. "7:00 pm"
 */
export const formatTimeIST = (isoOrTimeStr?: string): string => {
  if (!isoOrTimeStr) return '7:00 pm';
  
  // If already an ISO string
  const date = new Date(isoOrTimeStr);
  if (!isNaN(date.getTime()) && (isoOrTimeStr.includes('T') || isoOrTimeStr.includes('Z'))) {
    const formatted = date.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    // Standardize to lowercase "7:00 pm"
    return formatted.toLowerCase().replace(/\s+/g, ' ');
  }

  // If time string like "07:00 PM IST" or "07:00 PM"
  const match = isoOrTimeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const meridian = (match[3] || 'pm').toLowerCase();
    return `${hours}:${minutes} ${meridian}`;
  }

  return isoOrTimeStr.toLowerCase();
};

/**
 * Formats start and end times into: "7:00 pm – 8:30 pm IST"
 */
export const formatEventDateTimeRange = (startsAt?: string, endsAt?: string, fallbackTime?: string): string => {
  if (startsAt && endsAt) {
    const startStr = formatTimeIST(startsAt);
    const endStr = formatTimeIST(endsAt);
    return `${startStr} – ${endStr} IST`;
  }
  if (fallbackTime) {
    return fallbackTime.replace(/\bAM\b/g, 'am').replace(/\bPM\b/g, 'pm');
  }
  return '7:00 pm – 8:30 pm IST';
};

/**
 * Formats event meta line: e.g. "7:00 pm – 8:30 pm IST · Seminar Hall 3, VIT Wadala"
 */
export const formatEventMetaLine = (event: Partial<EventItem>): string => {
  const timeRange = formatEventDateTimeRange(event.startsAt, event.endsAt, event.time);
  
  let locationDisplay = 'VIT Wadala';
  if (event.mode === 'online' || event.isOnline) {
    locationDisplay = 'Online';
  } else if (event.venueId) {
    const venue = getVenueById(event.venueId);
    locationDisplay = venue ? `${venue.name}, VIT Wadala` : (event.locationOrUrl || 'VIT Wadala');
  } else if (event.locationOrUrl) {
    locationDisplay = event.locationOrUrl;
  }

  return `${timeRange} · ${locationDisplay}`;
};

/**
 * Strips category prefix from title if present (e.g. "Research Seminar: Cyber Security" -> "Cyber Security")
 */
export const cleanEventTitle = (title: string, category?: string): string => {
  if (!title) return '';
  if (!category) return title;
  
  const prefixes = [
    category,
    `${category}:`,
    `${category} -`,
    'Alumni Meet:',
    'Guest Lecture:',
    'Technical Workshop:',
    'Workshop:',
    'Research Seminar:',
    'Placement Drive:'
  ];

  for (const prefix of prefixes) {
    if (title.toLowerCase().startsWith(prefix.toLowerCase())) {
      const cleaned = title.substring(prefix.length).trim().replace(/^[:\-–—]\s*/, '');
      if (cleaned.length > 5) return cleaned;
    }
  }

  return title;
};

/**
 * Structured Compensation Formatter for Job Opportunities
 * e.g. "₹18.0 – 24.0 LPA" or "₹50,000 – 75,000 / month" or "Unpaid"
 */
export const formatCompensation = (job: Partial<JobListing>): string => {
  if (job.compensationDisclosed === false) {
    return 'Competitive / Not disclosed';
  }

  if (job.compensationMin === 0 && (!job.compensationMax || job.compensationMax === 0)) {
    return 'Unpaid';
  }

  if (job.compensationMin !== undefined) {
    const period = job.compensationPeriod || 'per_year';
    const min = job.compensationMin;
    const max = job.compensationMax;

    if (period === 'per_year') {
      // LPA format: e.g. ₹18.0 - 24.0 LPA
      const minLpa = (min >= 100000 ? min / 100000 : min).toFixed(min % 1 === 0 ? 0 : 1);
      if (max && max > min) {
        const maxLpa = (max >= 100000 ? max / 100000 : max).toFixed(max % 1 === 0 ? 0 : 1);
        return `₹${minLpa} – ${maxLpa} LPA`;
      }
      return `₹${minLpa} LPA`;
    } else {
      // Per month format: e.g. ₹40,000 - 60,000 / month
      const minFormatted = min.toLocaleString('en-IN');
      if (max && max > min) {
        const maxFormatted = max.toLocaleString('en-IN');
        return `₹${minFormatted} – ${maxFormatted} / month`;
      }
      return `₹${minFormatted} / month`;
    }
  }

  return job.stipendOrSalary || 'Competitive / Stipend provided';
};

/**
 * Venue Conflict Detection Engine
 * Checks if another active or pending event overlaps with the given venue and time range.
 */
export const checkVenueConflict = (
  venueId: string,
  startsAt: string,
  endsAt: string,
  currentEventId?: string,
  events: EventItem[] = []
): { hasConflict: boolean; conflictingEvent?: EventItem; message?: string } => {
  if (!venueId || !startsAt || !endsAt) {
    return { hasConflict: false };
  }

  const newStart = new Date(startsAt).getTime();
  const newEnd = new Date(endsAt).getTime();

  if (isNaN(newStart) || isNaN(newEnd) || newEnd <= newStart) {
    return { hasConflict: false };
  }

  const venue = getVenueById(venueId);
  const venueName = venue ? venue.name : 'Selected venue';

  for (const evt of events) {
    // Skip self
    if (currentEventId && evt.id === currentEventId) continue;

    // Only compare events using the same venue
    if (evt.venueId !== venueId) continue;

    // Ignore cancelled or rejected events
    if (evt.lifecycleStatus === 'cancelled' || evt.lifecycleStatus === 'rejected' || evt.status === 'Cancelled') {
      continue;
    }

    const evtStart = evt.startsAt ? new Date(evt.startsAt).getTime() : new Date(`${evt.date}T10:00:00Z`).getTime();
    const evtEnd = evt.endsAt ? new Date(evt.endsAt).getTime() : evtStart + 2 * 60 * 60 * 1000;

    // Overlap condition: startA < endB && endA > startB
    if (newStart < evtEnd && newEnd > evtStart) {
      const timeRange = formatEventDateTimeRange(evt.startsAt, evt.endsAt, evt.time);
      return {
        hasConflict: true,
        conflictingEvent: evt,
        message: `${venueName} is booked ${timeRange} by "${evt.title}".`
      };
    }
  }

  return { hasConflict: false };
};

/**
 * Validates advance notice lead time:
 * - On campus: >= 3 days ahead in IST
 * - Online: >= 24 hours ahead in IST
 */
export const validateEventLeadTime = (
  startsAt: string,
  mode: EventMode
): { valid: boolean; message?: string } => {
  if (!startsAt) return { valid: true };

  const startMs = new Date(startsAt).getTime();
  const nowMs = Date.now();

  if (startMs <= nowMs) {
    return { valid: false, message: 'Event date and time cannot be in the past.' };
  }

  const hoursAhead = (startMs - nowMs) / (1000 * 60 * 60);

  if (mode === 'on_campus' || mode === 'hybrid') {
    if (hoursAhead < 72) {
      return {
        valid: false,
        message: 'On-campus and hybrid events require at least 3 days (72 hours) advance notice for venue approval.'
      };
    }
  } else if (mode === 'online') {
    if (hoursAhead < 24) {
      return {
        valid: false,
        message: 'Online events require at least 24 hours advance notice.'
      };
    }
  }

  return { valid: true };
};

/**
 * Checks if check-in window is active (starts 30m before event starts, closes 30m after event ends)
 */
export const isCheckinWindowActive = (startsAt?: string, endsAt?: string): boolean => {
  if (!startsAt) return false;
  const now = Date.now();
  const start = new Date(startsAt).getTime();
  const end = endsAt ? new Date(endsAt).getTime() : start + 90 * 60 * 1000;

  const windowStart = start - 30 * 60 * 1000; // 30 mins before
  const windowEnd = end + 30 * 60 * 1000; // 30 mins after

  return now >= windowStart && now <= windowEnd;
};

/**
 * Generates RFC 5545 iCalendar format string (.ics)
 */
export const generateIcsCalendar = (params: {
  event: EventItem;
  sequence?: number;
  method?: 'REQUEST' | 'CANCEL';
}): string => {
  const { event, sequence = 0, method = 'REQUEST' } = params;

  const formatDateToIcsUtc = (d: Date): string => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const start = event.startsAt ? new Date(event.startsAt) : new Date(event.date || Date.now());
  const end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + 90 * 60 * 1000);

  const dtStart = formatDateToIcsUtc(start);
  const dtEnd = formatDateToIcsUtc(end);
  const dtStamp = formatDateToIcsUtc(new Date());

  const venue = event.venueId ? getVenueById(event.venueId) : undefined;
  const location = event.isOnline || event.mode === 'online'
    ? 'Online via NexaLink'
    : (venue ? `${venue.name}, ${venue.building}, VIT Wadala` : event.locationOrUrl || 'VIT Wadala Campus');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vidyalankar Institute of Technology//NexaLink Platform//EN',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:nexalink-${event.id}@vit.edu.in`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SEQUENCE:${sequence}`,
    `STATUS:${method === 'CANCEL' ? 'CANCELLED' : 'CONFIRMED'}`,
    `SUMMARY:${event.title.replace(/\n/g, ' ')}`,
    `DESCRIPTION:${(event.summary || event.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${location.replace(/\n/g, ' ')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  return lines.join('\r\n');
};

import jsPDF from 'jspdf';

/**
 * Generates a 6-digit numeric check-in code
 */
export const generateCheckinCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generates a high-resolution institutional certificate of participation PDF
 */
export const generateEventCertificatePdf = (params: {
  eventTitle: string;
  recipientName: string;
  recipientRole?: string;
  dateStr: string;
  certificateId: string;
  department?: string;
}): jsPDF => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Border styling (Double frame in obsidian & subtle neutral)
  doc.setDrawColor(10, 10, 10);
  doc.setLineWidth(1.5);
  doc.rect(10, 10, width - 20, height - 20);

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.rect(13, 13, width - 26, height - 26);

  // Institution Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(10, 10, 10);
  doc.text('VIDYALANKAR INSTITUTE OF TECHNOLOGY', width / 2, 32, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text('An Autonomous Institute affiliated to the University of Mumbai | Wadala (E), Mumbai 400037', width / 2, 38, { align: 'center' });
  doc.text('NexaLink Institutional Engagement Network', width / 2, 43, { align: 'center' });

  // Certificate Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(10, 10, 10);
  doc.text('CERTIFICATE OF PARTICIPATION', width / 2, 60, { align: 'center' });

  // Subtitle
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128);
  doc.text('This is proudly awarded to', width / 2, 74, { align: 'center' });

  // Recipient Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(10, 10, 10);
  doc.text(params.recipientName, width / 2, 90, { align: 'center' });

  // Recipient Details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(55, 65, 81);
  const deptText = params.department ? `Department of ${params.department}` : 'Vidyalankar Institute of Technology';
  doc.text(deptText, width / 2, 98, { align: 'center' });

  // Body text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  doc.text('for actively attending and participating in the institutional engagement session:', width / 2, 114, { align: 'center' });

  // Event title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(10, 10, 10);
  const splitTitle = doc.splitTextToSize(params.eventTitle, 220);
  doc.text(splitTitle, width / 2, 126, { align: 'center' });

  // Date and Signatures
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Held on ${params.dateStr}`, width / 2, 142, { align: 'center' });

  // Signatures lines
  const sigY = 168;
  doc.setDrawColor(209, 213, 219);
  doc.line(40, sigY, 95, sigY);
  doc.line(width - 95, sigY, width - 40, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(10, 10, 10);
  doc.text('Dr. Ravindra Sangale', 67.5, sigY + 5, { align: 'center' });
  doc.text('Dr. Vidya Chitre', width - 67.5, sigY + 5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('Head of Department, CMPN', 67.5, sigY + 10, { align: 'center' });
  doc.text('Convener, NexaLink Engagements', width - 67.5, sigY + 10, { align: 'center' });

  // Bottom Security & Verification Bar
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://nexalink.vit.edu.in'}/verify/${params.certificateId}`;
  doc.text(`Certificate ID: ${params.certificateId}  •  Publicly verifiable at: ${verifyUrl}`, width / 2, height - 16, { align: 'center' });
  doc.text('Issued by NexaLink Institutional Engagement System  •  Autonomous Accredited NAAC A+', width / 2, height - 12, { align: 'center' });

  return doc;
};
