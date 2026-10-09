import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { runQuery, runMutation } from './supabaseRunner';
import type { EventItem, EventFeedback, DepartmentCode } from '../types';
import { normalizeDepartmentCode, toPgDate, normalizeEventStatus } from '../utils/enumMappers';

function isValidUuid(id?: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}


function mapRowToEvent(e: any): EventItem {
  return {
    id: e.id,
    title: e.title,
    type: e.type,
    date: e.date,
    time: e.time,
    locationOrUrl: e.location_or_url,
    isOnline: e.is_online,
    speakerName: e.speaker_name,
    speakerDesignation: e.speaker_designation,
    speakerCompany: e.speaker_company,
    department: e.department || undefined,
    description: e.description,
    bannerImage: e.banner_image,
    rsvpsCount: e.rsvps_count || 0,
    registeredUserIds: e.registered_user_ids || [],
    status: e.status || 'Upcoming',
    capacityLimit: e.capacity_limit || 50,
    waitlistUserIds: e.waitlist_user_ids || [],
    feedbackEntries: e.feedback_entries || [],
    hostId: e.host_id || undefined,
    hostRole: e.host_role || undefined,
    hostName: e.host_name || undefined,
    lifecycleStatus: e.lifecycle_status || undefined,
    startsAt: e.starts_at || undefined,
    endsAt: e.ends_at || undefined
  };
}

export const eventsService = {
  /**
   * Fetch all active events ordered by date ascending
   */
  async getEvents(): Promise<EventItem[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const rows = await runQuery<any[]>('events', async () => {
      return supabase.from('events').select('*').order('date', { ascending: true });
    });

    return (rows || []).map(mapRowToEvent);
  },

  /**
   * Create an event with verified server-row return
   */
  async createEvent(
    eventData: Omit<EventItem, 'id' | 'rsvpsCount' | 'registeredUserIds' | 'status'> & { id?: string; status?: any }
  ): Promise<EventItem> {
    const eventId = isValidUuid(eventData.id)
      ? eventData.id!
      : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);

    const payload: any = {
      title: eventData.title || 'Untitled Event',
      type: eventData.type || 'Workshop',
      date: toPgDate(eventData.date),
      time: eventData.time || '10:00 AM',
      location_or_url: eventData.locationOrUrl || 'Campus Auditorium',
      is_online: Boolean(eventData.isOnline),
      speaker_name: eventData.speakerName || 'Guest Speaker',
      speaker_designation: eventData.speakerDesignation || 'Guest Lecturer',
      speaker_company: eventData.speakerCompany || 'VIT Institution',
      department: eventData.department ? normalizeDepartmentCode(eventData.department) : null,
      description: eventData.description || '',
      banner_image: eventData.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
      rsvps_count: 0,
      registered_user_ids: [],
      status: normalizeEventStatus(eventData.status),
      capacity_limit: eventData.capacityLimit || 50,
      waitlist_user_ids: [],
      feedback_entries: []
    };

    const sessionUser = (await supabase.auth.getUser()).data.user;
    const hostId = isValidUuid(eventData.hostId) ? eventData.hostId : sessionUser?.id;
    if (hostId) {
      payload.host_id = hostId;
    }
    if (eventData.hostName || sessionUser?.user_metadata?.full_name || sessionUser?.user_metadata?.name) {
      payload.host_name = eventData.hostName || sessionUser?.user_metadata?.full_name || sessionUser?.user_metadata?.name;
    }
    if (eventData.hostRole) {
      payload.host_role = eventData.hostRole;
    }
    if (eventData.lifecycleStatus) {
      payload.lifecycle_status = eventData.lifecycleStatus;
    }
    if (eventData.startsAt) {
      payload.starts_at = eventData.startsAt;
    }
    if (eventData.endsAt) {
      payload.ends_at = eventData.endsAt;
    }

    if (eventId) {
      payload.id = eventId;
    }

    const row = await runMutation<any>(
      'INSERT',
      'events',
      async () => {
        return supabase.from('events').insert(payload).select().single();
      },
      { payload }
    );

    return mapRowToEvent(row);
  },

  /**
   * Update RSVP attendance list on an event
   */
  async updateEventRsvp(
    eventId: string,
    registeredUserIds: string[],
    waitlistUserIds: string[]
  ): Promise<EventItem> {
    if (!isSupabaseConfigured() || !isValidUuid(eventId)) {
      return {
        id: eventId,
        registeredUserIds,
        waitlistUserIds,
        rsvpsCount: registeredUserIds.length
      } as any;
    }

    const payload = {
      registered_user_ids: registeredUserIds,
      waitlist_user_ids: waitlistUserIds,
      rsvps_count: registeredUserIds.length
    };

    const row = await runMutation<any>(
      'UPDATE',
      'events',
      async () => {
        return supabase.from('events').update(payload).eq('id', eventId).select().single();
      },
      { payload }
    );

    return mapRowToEvent(row);
  },

  /**
   * Update general event fields
   */
  async updateEvent(eventId: string, patch: Partial<EventItem>): Promise<EventItem> {
    if (!isSupabaseConfigured() || !isValidUuid(eventId)) {
      return { id: eventId, ...patch } as any;
    }

    const payload: any = {};
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.type !== undefined) payload.type = patch.type;
    if (patch.date !== undefined) payload.date = toPgDate(patch.date);
    if (patch.time !== undefined) payload.time = patch.time;
    if (patch.locationOrUrl !== undefined) payload.location_or_url = patch.locationOrUrl;
    if (patch.isOnline !== undefined) payload.is_online = Boolean(patch.isOnline);
    if (patch.speakerName !== undefined) payload.speaker_name = patch.speakerName;
    if (patch.speakerDesignation !== undefined) payload.speaker_designation = patch.speakerDesignation;
    if (patch.speakerCompany !== undefined) payload.speaker_company = patch.speakerCompany;
    if (patch.department !== undefined) payload.department = patch.department ? normalizeDepartmentCode(patch.department) : null;
    if (patch.description !== undefined) payload.description = patch.description;
    if (patch.bannerImage !== undefined) payload.banner_image = patch.bannerImage;
    if (patch.rsvpsCount !== undefined) payload.rsvps_count = patch.rsvpsCount;
    if (patch.registeredUserIds !== undefined) payload.registered_user_ids = patch.registeredUserIds;
    if (patch.status !== undefined) payload.status = normalizeEventStatus(patch.status);
    if (patch.capacityLimit !== undefined) payload.capacity_limit = patch.capacityLimit;
    if (patch.waitlistUserIds !== undefined) payload.waitlist_user_ids = patch.waitlistUserIds;
    if (patch.feedbackEntries !== undefined) payload.feedback_entries = patch.feedbackEntries;

    const row = await runMutation<any>(
      'UPDATE',
      'events',
      async () => {
        return supabase.from('events').update(payload).eq('id', eventId).select().single();
      },
      { payload }
    );

    return mapRowToEvent(row);
  },

  /**
   * Submit feedback to an event
   */
  async submitFeedback(eventId: string, updatedFeedbackEntries: EventFeedback[]): Promise<EventItem> {
    if (!isSupabaseConfigured() || !isValidUuid(eventId)) {
      return {
        id: eventId,
        feedbackEntries: updatedFeedbackEntries
      } as any;
    }

    const payload = {
      feedback_entries: updatedFeedbackEntries
    };

    const row = await runMutation<any>(
      'UPDATE',
      'events',
      async () => {
        return supabase.from('events').update(payload).eq('id', eventId).select().single();
      },
      { payload }
    );

    return mapRowToEvent(row);
  }
};
