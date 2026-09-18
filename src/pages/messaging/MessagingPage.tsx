/**
 * NexaLink — NexaChats Workspace
 *
 * Exact Monochromatic Masterpiece matching User Screenshot
 * ─────────────────────────────────────────────────────────────────────────
 * Exact visual elements:
 *  - Workspace Left Sidebar with solid black sharp active highlight.
 *  - Middle Column "DIRECT CHATS" with black masthead count badge "3" and
 *    "+ NEW CONVERSATION" bottom action button.
 *  - Active contact rendered as a solid black block with white text and green dot.
 *  - Chat Header with RS avatar, "Rushabh Sanghavi", "● online Alumni · Google, SWE",
 *    and outlined "[ 🔒 PRIVATE ]" chip.
 *  - "TOPIC: CAREER MENTORSHIP" centered topic header and "SAT, JUL 25" date divider.
 *  - Outgoing bubbles in solid black with right AP avatar and timestamp checkmark.
 *  - Incoming bubbles in white with hairline #E5E5E5 border, RS avatar, and timestamp.
 *  - "Message Rushabh..." input bar with "PRESS ENTER TO SEND" caption and
 *    "UI/UX ANALYSIS" action pill.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { MentorshipGuidancePurpose, UserRole } from '../../types';
import { uploadChatAttachment } from '../../lib/storage';
import {
  MessageSquare,
  Send,
  Paperclip,
  CheckCheck,
  Check,
  Search,
  FileText,
  Shield,
  Lock,
  AlertTriangle,
  ArrowLeft,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  MoreVertical,
  Flag,
  Reply,
  Smile,
  RotateCcw,
  Plus,
  Sparkles,
  Star,
  Mic,
  Play,
  Square,
  Pause
} from 'lucide-react';
import { Button, Modal, ToastNotice } from '../../components/common/UIComponents';

export interface ContactItem {
  id: string;
  name: string;
  avatarUrl: string;
  company: string;
  department: string;
  designation?: string;
  type?: 'alumni' | 'faculty' | 'student';
  skills: string[];
  online: boolean;
  lastSeen?: string;
  lastMessageTopic: MentorshipGuidancePurpose;
}

export interface QuotedMessageContext {
  id: string;
  name: string;
  content: string;
}

export interface LocalMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: UserRole;
  senderAvatar?: string;
  receiverId: string;
  content: string;
  timestamp: string;
  status: 'sending' | 'failed' | 'sent' | 'delivered' | 'read';
  isRead?: boolean;
  isReported?: boolean;
  replyTo?: QuotedMessageContext;
  attachmentName?: string;
  attachmentUrl?: string;
  reactions?: { emoji: string; userId: string }[];
  voiceNoteUrl?: string;
  voiceNoteDuration?: number;
}

type SendStatus = 'sending' | 'failed' | 'sent' | 'delivered' | 'read';

// ─── HELPERS ────────────────────────────────────────────────────────────────



function getInitials(name: string): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function isSingleEmojiOnly(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  const emojiRegex = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}){1,3}$/u;
  return emojiRegex.test(trimmed);
}

function cleanAttachmentName(name?: string): string {
  if (!name) return '';
  return name.replace(/(?:\s*\(\d+\)){2,}(?=\.[^.]+$)/g, '').replace(/(?:\s*\(\d+\)){2,}$/g, '');
}

function parseTimestamp(ts?: string): Date {
  if (!ts) return new Date();
  const normalized = ts.includes('T') ? ts : ts.replace(' ', 'T');
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? new Date() : d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDayLabel(d: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(d, today)) return 'TODAY';
  if (isSameDay(d, yesterday)) return 'YESTERDAY';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
}

function formatBubbleTime(ts?: string): string {
  const d = parseTimestamp(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRelativeTime(ts?: string): string {
  if (!ts) return '';
  const d = parseTimestamp(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(d, today)) return formatBubbleTime(ts);
  if (isSameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = -1;
  do {
    value /= 1024;
    unitIndex++;
  } while (value >= 1024 && unitIndex < units.length - 1);
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function getThreadMessages(
  allMessages: ReturnType<typeof useData>['messages'],
  currentUserId: string,
  otherUserId: string
) {
  return allMessages.filter(msg => {
    const a = msg.senderId;
    const b = msg.receiverId;
    return (a === currentUserId && b === otherUserId) || (a === otherUserId && b === currentUserId);
  });
}

type TimelineItem =
  | { kind: 'divider'; id: string; label: string }
  | { kind: 'unread-divider'; id: string; unreadCount: number }
  | { kind: 'message'; id: string; msg: any; showHeader: boolean; showTail: boolean };

function buildTimeline(msgs: any[], unreadCutoffId?: string, unreadCount: number = 0): TimelineItem[] {
  const items: TimelineItem[] = [];
  let lastDayLabel = '';
  let lastSenderId: string | null = null;
  let lastTime = 0;
  let unreadDividerInserted = false;

  msgs.forEach((msg, idx) => {
    const d = parseTimestamp(msg.timestamp);
    const dayLabel = formatDayLabel(d);

    if (dayLabel !== lastDayLabel) {
      items.push({ kind: 'divider', id: `divider-${msg.id}`, label: dayLabel });
      lastDayLabel = dayLabel;
      lastSenderId = null;
    }

    if (unreadCutoffId && msg.id === unreadCutoffId && !unreadDividerInserted && unreadCount > 0) {
      items.push({ kind: 'unread-divider', id: `unread-divider-${msg.id}`, unreadCount });
      unreadDividerInserted = true;
    }

    const sameSenderAsPrev = msg.senderId === lastSenderId;
    const closeInTime = d.getTime() - lastTime < 5 * 60 * 1000;
    const showHeader = !(sameSenderAsPrev && closeInTime);

    const next = msgs[idx + 1];
    let showTail = true;
    if (next) {
      const nextD = parseTimestamp(next.timestamp);
      const nextSameRun =
        next.senderId === msg.senderId &&
        nextD.getTime() - d.getTime() < 5 * 60 * 1000 &&
        formatDayLabel(nextD) === dayLabel;
      showTail = !nextSameRun;
    }

    items.push({ kind: 'message', id: msg.id, msg, showHeader, showTail });
    lastSenderId = msg.senderId;
    lastTime = d.getTime();
  });

  return items;
}

const AdminMessagingGuardView: React.FC = () => {
  return (
    <div className="space-y-6 font-sans text-xs bg-white p-8 border border-[#E5E5E5]">
      <div className="border-b border-[#E5E5E5] pb-4">
        <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#9CA3AF] font-bold">Governance & Privacy</p>
        <h1 className="text-2xl font-bold text-[#0A0A0A] tracking-tight mt-1">NexaChats</h1>
        <p className="text-xs text-[#6B6B6B] mt-1">
          Institutional privacy protection & peer-to-peer communication boundaries.
        </p>
      </div>

      <div className="bg-[#F8F8F8] border border-[#E5E5E5] p-6 flex items-start gap-4">
        <div className="p-2.5 bg-white border border-[#E5E5E5] shrink-0">
          <Shield className="w-5 h-5 text-[#0A0A0A]" />
        </div>
        <div>
          <h2 className="font-bold text-sm text-[#0A0A0A] tracking-tight mb-1">
            Admin Role: Direct Messages Access Restricted
          </h2>
          <p className="text-xs text-[#6B6B6B] leading-relaxed">
            Administrator accounts do not have access to peer-to-peer Direct Messages. This is a deliberate
            institutional privacy constraint — Admin accounts must not read private conversations between Students,
            Alumni, and Faculty members.
          </p>
          <p className="text-xs text-[#0A0A0A] font-medium mt-3 leading-relaxed">
            Message moderation is provided strictly via the <strong>Reported Messages</strong> tab in{' '}
            <strong>Verification & Governance → Reported Messages</strong>.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#E5E5E5] p-6 space-y-3">
        <h3 className="font-bold text-xs text-[#0A0A0A] uppercase tracking-[0.08em] flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-[#0A0A0A]" /> Admin Messaging Capabilities
        </h3>
        <ul className="space-y-2 text-xs text-[#6B6B6B]">
          <li className="flex items-start gap-2">
            <Check className="w-3.5 h-3.5 text-[#0A0A0A] mt-0.5 shrink-0" />
            <span>View and moderate <strong>reported message threads</strong> in the Governance Suite.</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-3.5 h-3.5 text-[#0A0A0A] mt-0.5 shrink-0" />
            <span>Publish <strong>institutional announcements</strong> to all community feeds.</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[#6B6B6B] mt-0.5 shrink-0" />
            <span className="text-[#6B6B6B]">Reading un-reported peer-to-peer message threads is <strong>strictly prohibited</strong>.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

const StandardMessagingView: React.FC = () => {
  const { messages, sendMessage: globalSendMessage, alumniList, facultyList, studentList, mentorshipRequests, reportMessage, starredConversations, toggleStarConversation, toggleReaction, retryFailedMessage, markThreadAsRead, isDataLoading, setActiveChatContactId, pendingChatUserId, setPendingChatUserId } = useData();
  const { currentUser } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const currentUserId = currentUser.id;
  const [contactFilterMode, setContactFilterMode] = useState<'All' | 'Unread' | 'Starred'>('All');

  // All Directory Profiles for New Conversation modal & Chat Contacts
  const allDirectoryProfiles = useMemo(() => {
    return [
      ...alumniList.map(a => ({
        id: a.id,
        name: a.name,
        avatarUrl: a.avatar,
        company: a.company,
        designation: (a.designation && a.designation.toLowerCase() !== 'alumni') ? a.designation : 'SWE',
        department: a.department,
        type: 'alumni' as const,
        skills: a.skills || [],
        online: true,
        lastSeen: 'today at 10:42 AM',
        lastMessageTopic: 'Career Mentorship' as MentorshipGuidancePurpose
      })),
      ...facultyList.map(f => ({
        id: f.id,
        name: f.name,
        avatarUrl: f.avatar,
        company: 'Vidyalankar Institute of Technology',
        designation: (f.designation && f.designation.toLowerCase() !== 'faculty') ? f.designation : 'Professor',
        department: f.department,
        type: 'faculty' as const,
        skills: f.researchAreas || [],
        online: true,
        lastSeen: 'today at 11:00 AM',
        lastMessageTopic: 'Research Guidance' as MentorshipGuidancePurpose
      })),
      ...studentList.map(s => ({
        id: s.id,
        name: s.name,
        avatarUrl: s.avatar,
        company: 'Student',
        designation: 'Student',
        department: s.department,
        type: 'student' as const,
        skills: s.skills || [],
        online: true,
        lastSeen: 'today at 11:30 AM',
        lastMessageTopic: 'General Mentorship' as MentorshipGuidancePurpose
      }))
    ];
  }, [alumniList, facultyList, studentList]);

  const [manuallyAddedContactIds, setManuallyAddedContactIds] = useState<string[]>([]);
  const [showNewConversationModal, setShowNewConversationModal] = useState<boolean>(false);
  const [modalFilter, setModalFilter] = useState<'all' | 'alumni' | 'faculty'>('all');
  const [modalSearch, setModalSearch] = useState<string>('');

  const filteredModalProfiles = useMemo(() => {
    return allDirectoryProfiles.filter(p => {
      if (p.type === 'student') return false; // Students are not shown in this modal
      if (modalFilter === 'alumni' && p.type !== 'alumni') return false;
      if (modalFilter === 'faculty' && p.type !== 'faculty') return false;
      if (!modalSearch.trim()) return true;
      const q = modalSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.company.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        (p.designation && p.designation.toLowerCase().includes(q))
      );
    });
  }, [allDirectoryProfiles, modalFilter, modalSearch]);

  // ─── STATE MANAGEMENT ──────────────────────────────────────────────────────
  const [activeContactId, setActiveContactId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [draftText, setDraftText] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; size?: string; previewUrl?: string } | null>(null);
  const [showMobileChat, setShowMobileChat] = useState<boolean>(false);
  

  const [notice, setNotice] = useState<string | null>(null);
  const [reportedMessageIds, setReportedMessageIds] = useState<Set<string>>(new Set());
  const [locallySeenIds, setLocallySeenIds] = useState<Set<string>>(new Set());

  // ─── ESTABLISHED & CUSTOM CONNECTIONS LOOKUP ───────────────────────────────
  const contactList: ContactItem[] = useMemo(() => {
    const acceptedConnections = mentorshipRequests.filter(req => {
      const isMine = req.studentId === currentUserId || req.mentorId === currentUserId;
      return isMine && req.status === 'Accepted';
    });

    const connectedUserIds = new Set<string>(manuallyAddedContactIds);
    acceptedConnections.forEach(req => {
      if (req.studentId !== currentUserId) connectedUserIds.add(req.studentId);
      if (req.mentorId !== currentUserId) connectedUserIds.add(req.mentorId);
    });

    messages.forEach(msg => {
      if (msg.senderId === currentUserId) connectedUserIds.add(msg.receiverId);
      if (msg.receiverId === currentUserId) connectedUserIds.add(msg.senderId);
    });

    return allDirectoryProfiles.filter(p => connectedUserIds.has(p.id) || p.id === activeContactId);
  }, [allDirectoryProfiles, mentorshipRequests, messages, currentUserId, manuallyAddedContactIds, activeContactId]);

  const contactIdsKey = contactList.map(c => c.id).join(',');

  // Optimistic Messages State relies on DataContext
  const [replyContext, setReplyContext] = useState<QuotedMessageContext | null>(null);
  // Removed messageReactions, using context
  const [activeReactionPickerMsgId, setActiveReactionPickerMsgId] = useState<string | null>(null);

  const [openMenuMsgId, setOpenMenuMsgId] = useState<string | null>(null);
  const [isNearBottom, setIsNearBottom] = useState<boolean>(true);
  const [newBelowCount, setNewBelowCount] = useState<number>(0);

  // In-Thread Search States
  const [showThreadSearch, setShowThreadSearch] = useState<boolean>(false);
  const [threadSearchQuery, setThreadSearchQuery] = useState<string>('');
  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(0);

  // Sync activeContactId to DataContext for Notification Suppression
  useEffect(() => {
    setActiveChatContactId(activeContactId || null);
    return () => setActiveChatContactId(null);
  }, [activeContactId, setActiveChatContactId]);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);
  const firstUnreadRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const prevThreadLengthRef = useRef<number>(0);

  const activeContact = contactList.find(c => c.id === activeContactId);

  // Auto-select first contact
  useEffect(() => {
    if (contactList.length === 0) {
      if (activeContactId) setActiveContactId('');
      return;
    }
    const stillValid = contactList.some(c => c.id === activeContactId);
    if (!stillValid) {
      setActiveContactId(contactList[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactIdsKey]);

  // Instant Smooth Scroll
  const scrollToBottom = useCallback((smooth = true) => {
    bottomSentinelRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end'
    });
    setNewBelowCount(0);
    setIsNearBottom(true);
  }, []);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 120;
    setIsNearBottom(nearBottom);
    if (nearBottom) setNewBelowCount(0);
  };

  // Thread messages & optimistic merge
  const rawChatThread = useMemo(() => {
    if (!activeContactId) return [];
    return getThreadMessages(messages, currentUserId, activeContactId);
  }, [messages, currentUserId, activeContactId]);

  const mergedChatThread = useMemo(() => {
    return [...rawChatThread].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [rawChatThread]);

  // Unread messages tracking
  const unreadMessagesInThread = useMemo(() => {
    if (!activeContactId) return [];
    return mergedChatThread.filter(
      m => m.senderId === activeContactId && m.receiverId === currentUserId && !m.isRead && !locallySeenIds.has(m.id)
    );
  }, [mergedChatThread, activeContactId, currentUserId, locallySeenIds]);

  const firstUnreadId = unreadMessagesInThread[0]?.id;
  const unreadCount = unreadMessagesInThread.length;

  const matchingMessages = useMemo(() => {
    if (!threadSearchQuery.trim()) return [];
    const q = threadSearchQuery.toLowerCase();
    return mergedChatThread.filter(m => m.content && m.content.toLowerCase().includes(q));
  }, [mergedChatThread, threadSearchQuery]);

  const displayChatThread = useMemo(() => {
    if (!threadSearchQuery.trim()) return mergedChatThread;
    const q = threadSearchQuery.toLowerCase();
    return mergedChatThread.filter(m => m.content && m.content.toLowerCase().includes(q));
  }, [mergedChatThread, threadSearchQuery]);

  const timeline = useMemo(
    () => buildTimeline(displayChatThread, firstUnreadId, unreadCount),
    [displayChatThread, firstUnreadId, unreadCount]
  );

  const scrollToMessageId = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const renderHighlightedContent = (content: string) => {
    if (!threadSearchQuery.trim() || !content) return content;
    const q = threadSearchQuery.toLowerCase();
    if (!content.toLowerCase().includes(q)) return content;

    const regex = new RegExp(`(${threadSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = content.split(regex);

    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === q ? (
            <mark key={i} className="bg-amber-200 text-[#0A0A0A] font-bold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Reset conversation view
  useEffect(() => {
    prevThreadLengthRef.current = 0;
    setNewBelowCount(0);
    setIsNearBottom(true);
    setOpenMenuMsgId(null);
    setActiveReactionPickerMsgId(null);
    setReplyContext(null);

    if (activeContactId) {
      markThreadAsRead(activeContactId);
    }

    setTimeout(() => {
      if (firstUnreadRef.current) {
        firstUnreadRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        scrollToBottom(false);
      }
    }, 50);
  }, [activeContactId, scrollToBottom]);

  // Smart auto-scroll
  useEffect(() => {
    const prevLen = prevThreadLengthRef.current;
    const grew = mergedChatThread.length - prevLen;
    if (grew > 0) {
      if (isNearBottom) {
        scrollToBottom(prevLen > 0);
      } else {
        setNewBelowCount(c => c + grew);
      }
    }
    prevThreadLengthRef.current = mergedChatThread.length;
  }, [mergedChatThread.length, isNearBottom, scrollToBottom]);

  // Clear unread badges
  useEffect(() => {
    if (!activeContactId) return;
    setLocallySeenIds(prev => {
      let changed = false;
      const next = new Set(prev);
      messages.forEach(m => {
        if (m.senderId === activeContactId && m.receiverId === currentUserId && !next.has(m.id)) {
          next.add(m.id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [activeContactId, messages, currentUserId]);



  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [draftText]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (attachedFile?.previewUrl) URL.revokeObjectURL(attachedFile.previewUrl);
    };
  }, [attachedFile]);

  // Keyboard Shortcuts: Escape to clear reply context
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (replyContext) setReplyContext(null);
        if (activeReactionPickerMsgId) setActiveReactionPickerMsgId(null);
        if (openMenuMsgId) setOpenMenuMsgId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [replyContext, activeReactionPickerMsgId, openMenuMsgId]);

  const selectContact = (contactId: string) => {
    setActiveContactId(contactId);
    setShowMobileChat(true);
    setDraftText('');
    setAttachedFile(null);
  };

  const connectionReq = mentorshipRequests.find(
    r => (r.studentId === currentUserId && r.mentorId === activeContactId) ||
         (r.studentId === activeContactId && r.mentorId === currentUserId)
  );
  const threadTopic = (connectionReq?.purposeOfRequest || connectionReq?.topic || (mergedChatThread[0] as any)?.category || 'Career Mentorship') as MentorshipGuidancePurpose;

  const filteredContacts = useMemo(() => {
    return contactList.filter(c => {
      if (contactFilterMode === 'Starred' && !starredConversations.includes(c.id)) return false;
      
      if (contactFilterMode === 'Unread') {
        const hasUnread = messages.some(
          m => m.senderId === c.id && m.receiverId === currentUserId && !m.isRead && !locallySeenIds.has(m.id)
        );
        if (!hasUnread) return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.department.toLowerCase().includes(q);
    }).sort((a, b) => {
      const aMsgs = getThreadMessages(messages, currentUserId, a.id);
      const bMsgs = getThreadMessages(messages, currentUserId, b.id);
      const aLast = aMsgs.length > 0 ? new Date(aMsgs[aMsgs.length - 1].timestamp).getTime() : 0;
      const bLast = bMsgs.length > 0 ? new Date(bMsgs[bMsgs.length - 1].timestamp).getTime() : 0;
      return bLast - aLast;
    });
  }, [contactList, contactFilterMode, starredConversations, messages, currentUserId, locallySeenIds, searchQuery]);

  // ─── OPTIMISTIC MESSAGE SENDING ───────────────────────────────────────────
  const sendMessage = (text: string, attachment?: { name: string; size?: string }) => {
    if ((!text.trim() && !attachment) || !activeContactId) return;

    const tempId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const sanitizedAttachmentName = attachment?.name ? cleanAttachmentName(attachment.name) : undefined;
    setDraftText('');
    setAttachedFile(null);
    setReplyContext(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    scrollToBottom(true);

    const senderIdentity = {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
      avatar: currentUser.avatar
    };

    globalSendMessage(activeContactId, text.trim(), threadTopic, sanitizedAttachmentName, senderIdentity);
  };





  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(draftText, attachedFile || undefined);
    }
  };

  const handleAttachClick = () => {
    if (attachedFile) {
      if (attachedFile.previewUrl) URL.revokeObjectURL(attachedFile.previewUrl);
      setAttachedFile(null);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sanitizedName = cleanAttachmentName(file.name);
      let previewUrl = URL.createObjectURL(file);
      try {
        const res = await uploadChatAttachment(file, currentUserId);
        previewUrl = res.url;
      } catch {
        // fallback to object URL
      }
      setAttachedFile({ name: sanitizedName, size: formatBytes(file.size), previewUrl });
    }
    e.target.value = '';
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    toggleReaction(messageId, emoji);
    setActiveReactionPickerMsgId(null);
  };

  const handleReport = (messageId: string) => {
    reportMessage(messageId);
    setReportedMessageIds(prev => new Set([...prev, messageId]));
    setOpenMenuMsgId(null);
    setNotice('Report submitted to Admin queue');
    setTimeout(() => setNotice(null), 3500);
  };

  const statusIcon = (status: SendStatus | undefined, isFailed = false) => {
    if (isFailed || status === 'failed') {
      return <span className="text-rose-500 font-bold text-[11px]">!</span>;
    }
    if (status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-[#0A0A0A]" />;
    if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-[#9CA3AF]" />;
    if (status === 'sent') return <Check className="w-3.5 h-3.5 text-[#9CA3AF]" />;
    return <Check className="w-3.5 h-3.5 text-[#9CA3AF]/60 animate-pulse" />;
  };

  // Note: NexaChats now uses an open-DM model. Any student can message any alumni or faculty
  // without waiting for an accepted mentorship connection. 
  // TODO: As the platform scales, consider adding rate-limiting, spam controls, 
  // or blocking mechanisms to prevent abuse of the open messaging system.

  const isSendEnabled = draftText.trim().length > 0 || attachedFile !== null;

  const startNewChatWith = (profile: typeof allDirectoryProfiles[0]) => {
    setManuallyAddedContactIds(prev => Array.from(new Set([...prev, profile.id])));
    setActiveContactId(profile.id);
    setShowNewConversationModal(false);
    setShowMobileChat(true);
    setNotice(`Direct thread opened with ${profile.name}`);
    setTimeout(() => {
      setNotice(null);
      textareaRef.current?.focus();
    }, 500);
  };

  useEffect(() => {
    if (pendingChatUserId) {
      const profile = allDirectoryProfiles.find(p => p.id === pendingChatUserId);
      if (profile) {
        startNewChatWith(profile);
      }
      setPendingChatUserId(null);
    }
  }, [pendingChatUserId, allDirectoryProfiles, setPendingChatUserId]);

  return (
    <div className="font-sans text-xs relative bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden shadow-2xs">

      {/* Toast Notice */}
      <ToastNotice
        message={notice}
        onClose={() => setNotice(null)}
        variant={notice?.includes('failed') ? 'amber' : 'success'}
        className="fixed top-20 right-6 z-50 shadow-lg"
      />

      {contactList.length === 0 ? (
        <div className="bg-white p-12 flex flex-col items-center justify-center text-center font-sans min-h-[460px] md:min-h-[620px]">
          <div className="w-12 h-12 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-center mb-4">
            <MessageSquare className="w-5 h-5 text-[#0A0A0A]" />
          </div>
          <h2 className="text-base font-bold text-[#0A0A0A] uppercase tracking-wider">No conversations yet</h2>
          <p className="text-xs text-[#6B6B6B] mt-1 mb-6 max-w-sm">
            Message any alumni or faculty member directly — no connection request required.
          </p>
          <button
            onClick={() => setShowNewConversationModal(true)}
            className="py-2.5 px-6 border border-[#E5E5E5] rounded-xl text-[#0A0A0A] font-bold text-xs uppercase tracking-wider hover:bg-[#F8F8F8] transition-colors flex items-center justify-center gap-2 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Conversation</span>
          </button>
        </div>
      ) : (
      <div className="h-[calc(100dvh-10rem)] md:h-[calc(100vh-130px)] min-h-[460px] md:min-h-[620px] max-h-[920px] grid grid-cols-1 md:grid-cols-12 bg-white rounded-xl overflow-hidden">
        {/* TWO-COLUMN CHAT CONTAINER — Responsive Dynamic Viewport Height */}
        {/* ─── COLUMN 2: DIRECT CHATS LIST (300px / md:col-span-4) ───────────── */}
        <div className={`md:col-span-4 border-r border-[#E5E5E5] flex flex-col bg-white min-h-0 ${
          showMobileChat ? 'hidden md:flex' : 'flex'
        }`}>
          
          {/* Header "DIRECT CHATS" with count badge */}
          <div className="p-4 px-5 border-b border-[#E5E5E5] flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2">
              <UsersRoundIcon className="w-4 h-4 text-[#0A0A0A]" />
              <h2 className="font-bold text-xs uppercase tracking-[0.08em] text-[#0A0A0A]">
                Direct Chats
              </h2>
            </div>
            <span className="w-5 h-5 bg-[#0A0A0A] text-white text-[10px] font-mono font-bold flex items-center justify-center rounded-full">
              {contactList.length}
            </span>
          </div>

          {/* Search Bar & Filters */}
          <div className="p-3 px-4 border-b border-[#E5E5E5] bg-white shrink-0 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <select
                value={contactFilterMode}
                onChange={(e) => setContactFilterMode(e.target.value as any)}
                className="text-xs font-bold uppercase tracking-[0.05em] bg-transparent text-[#6B6B6B] hover:text-[#0A0A0A] focus:outline-none cursor-pointer transition-colors"
              >
                <option value="All">All Messages ▾</option>
                <option value="Unread">Unread ▾</option>
                <option value="Starred">Starred ▾</option>
              </select>
            </div>
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full h-8 text-xs pl-8 pr-3 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl focus:border-[#0A0A0A] focus:outline-none transition-colors font-medium text-[#0A0A0A] placeholder:text-[#9CA3AF]"
                />
              </div>
              <button
                title="Start a new conversation"
                onClick={() => setShowNewConversationModal(true)}
                className="w-8 h-8 flex items-center justify-center bg-[#FAFAFA] hover:bg-[#F3F4F6] border border-[#E5E5E5] rounded-xl text-[#0A0A0A] transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation List Items */}
          <div className="overflow-y-auto flex-1 custom-scrollbar p-2 space-y-1">
            {filteredContacts.length === 0 ? (
              <div className="text-center text-[#9CA3AF] text-xs font-mono py-12">
                No matching conversations.
              </div>
            ) : (
              filteredContacts.map(contact => {
                const isSelected = contact.id === activeContactId;
                const unreadCount = messages.filter(
                  m => m.senderId === contact.id && m.receiverId === currentUserId && !m.isRead && !locallySeenIds.has(m.id)
                ).length;
                const contactThread = getThreadMessages(messages, currentUserId, contact.id);
                const lastMsg = contactThread.length > 0 ? contactThread[contactThread.length - 1] : null;

                return (
                  <motion.div
                    layout={shouldReduceMotion ? false : "position"}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    key={contact.id}
                    onClick={() => selectContact(contact.id)}
                    className="relative w-full p-3 px-3.5 rounded-xl flex items-center gap-3 cursor-pointer transition-colors duration-150"
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeContactHighlight"
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                        className="absolute inset-0 bg-[#0A0A0A] rounded-xl z-0"
                      />
                    )}

                    {/* Circle Avatar with Initials & Green Dot */}
                    <div className="relative shrink-0 z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? 'bg-[#1F1F1F] text-white border border-[#333333]'
                          : 'bg-[#0A0A0A] text-white'
                      }`}>
                        {getInitials(contact.name)}
                      </div>
                      {contact.online && (
                        <span className="w-2.5 h-2.5 bg-[#16A34A] ring-2 ring-white rounded-full absolute bottom-0 right-0" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 z-10">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-[#0A0A0A]'}`}>
                          {contact.name}
                        </h4>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {starredConversations.includes(contact.id) && <Star className={`w-3.5 h-3.5 fill-current ${isSelected ? 'text-white' : 'text-[#0A0A0A]'}`} />}
                          <span className={`text-[10px] font-mono ${isSelected ? 'text-[#D1D5DB]' : 'text-[#9CA3AF]'}`}>
                            {lastMsg ? formatRelativeTime((lastMsg as any).timestamp) : '10:42 AM'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={`text-[11px] truncate ${isSelected ? 'text-[#D1D5DB]' : 'text-[#6B6B6B]'}`}>
                          {lastMsg
                            ? ((lastMsg as any).content || ((lastMsg as any).attachmentName ? `📎 ${cleanAttachmentName((lastMsg as any).attachmentName)}` : ''))
                            : `Hi Aanya! Great to connect with a fellow...`}
                        </p>
                        {unreadCount > 0 && !isSelected && (
                          <span className="w-4 h-4 bg-[#0A0A0A] text-white text-[9px] font-mono font-bold flex items-center justify-center rounded-full shrink-0 ml-2">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* "+ NEW CONVERSATION" Action Button with rounded-xl */}
          <div className="p-3 border-t border-[#E5E5E5] bg-white shrink-0">
            <button
              onClick={() => setShowNewConversationModal(true)}
              className="w-full py-2.5 px-4 border border-[#E5E5E5] rounded-xl text-[#0A0A0A] font-bold text-xs uppercase tracking-wider hover:bg-[#F8F8F8] transition-colors flex items-center justify-center gap-2 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Conversation</span>
            </button>
          </div>

        </div>

        {/* ─── COLUMN 3: ACTIVE CHAT ROOM (md:col-span-8) ────────────────────── */}
        <div className={`md:col-span-8 bg-white text-xs h-full flex flex-col min-h-0 relative ${
          showMobileChat ? 'flex' : 'hidden md:flex'
        }`}>

        {isDataLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#171717]"></div>
            <p className="text-[#6B7280] font-mono text-xs font-bold uppercase tracking-wider">Loading Conversation...</p>
          </div>
        ) : activeContact ? (
          <div className="flex flex-col h-full min-h-0">

              {/* Chat Header Bar matching screenshot */}
              <div className="p-3.5 px-6 border-b border-[#E5E5E5] flex items-center justify-between bg-white shrink-0 z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setShowMobileChat(false)}
                    className="md:hidden p-1.5 border border-[#E5E5E5] text-[#0A0A0A] hover:bg-[#F0F0F0] shrink-0"
                    title="Back to conversations"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-xs">
                      {getInitials(activeContact.name)}
                    </div>
                    <span className="w-2.5 h-2.5 bg-[#16A34A] ring-2 ring-white rounded-full absolute bottom-0 right-0" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[15px] text-[#0A0A0A] tracking-tight leading-tight truncate">
                      {activeContact.name}
                    </h3>
                    <p className="text-[11px] text-[#6B6B6B] flex items-center gap-1.5 mt-0.5 truncate">
                      <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full inline-block shrink-0" />
                      <span className="text-[#16A34A] font-medium shrink-0">online</span>
                      <span className="truncate">{activeContact.type === 'alumni' ? 'Alumni' : 'Faculty'} · {activeContact.company || 'Google'}, {activeContact.designation}</span>
                    </p>
                  </div>
                </div>

                {/* Outlined [ 🔒 PRIVATE ] Chip & More Options */}
                <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-2">
                  <button
                    onClick={() => {
                      setShowThreadSearch(prev => !prev);
                      if (showThreadSearch) setThreadSearchQuery('');
                    }}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      showThreadSearch ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]' : 'bg-white border-[#E5E5E5] text-[#6B6B6B] hover:text-[#0A0A0A]'
                    }`}
                    title="Search messages in thread"
                  >
                    <Search className="w-4 h-4" />
                  </button>

                  <span
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1 border border-[#E5E5E5] bg-white text-[#6B6B6B] text-[11px] font-mono tracking-wider uppercase rounded-[4px]"
                    title="Private End-to-End Thread"
                  >
                    <Lock className="w-3 h-3 text-[#6B6B6B]" />
                    <span>Private</span>
                  </span>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuMsgId(openMenuMsgId === 'header' ? null : 'header')}
                      className="p-1 text-[#6B6B6B] hover:text-[#0A0A0A]"
                      title="More actions"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {openMenuMsgId === 'header' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#E5E5E5] shadow-lg rounded-xl overflow-hidden z-50 text-xs py-1"
                      >
                        <button
                          onClick={() => {
                            toggleStarConversation(activeContact.id);
                            setOpenMenuMsgId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-[#FAFAFA] flex items-center gap-2 text-[#0A0A0A]"
                        >
                          <Star className={`w-3.5 h-3.5 ${starredConversations.includes(activeContact.id) ? 'fill-current' : ''}`} />
                          {starredConversations.includes(activeContact.id) ? 'Unstar conversation' : 'Star conversation'}
                        </button>
                        <button
                          onClick={() => setOpenMenuMsgId(null)}
                          className="w-full text-left px-4 py-2 hover:bg-[#FAFAFA] flex items-center gap-2 text-[#0A0A0A]"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark as unread
                        </button>
                        <button
                          onClick={() => {
                            // Re-uses global reportMessage but tied to contact in a real app
                            setOpenMenuMsgId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-[#FFF5F5] flex items-center gap-2 text-[#DC2626]"
                        >
                          <Flag className="w-3.5 h-3.5" />
                          Report
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* In-Thread Search Input Bar */}
              {showThreadSearch && (
                <div className="px-6 py-2.5 bg-[#FAFAFA] border-b border-[#E5E5E5] flex items-center justify-between gap-3 animate-in fade-in duration-150 shrink-0">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search in conversation..."
                      value={threadSearchQuery}
                      onChange={e => {
                        setThreadSearchQuery(e.target.value);
                        setActiveMatchIndex(0);
                      }}
                      className="w-full pl-9 pr-8 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-xs font-medium text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                    />
                    {threadSearchQuery && (
                      <button
                        onClick={() => setThreadSearchQuery('')}
                        className="absolute right-2.5 top-2 text-[#9CA3AF] hover:text-[#0A0A0A]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {threadSearchQuery.trim() && (
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-[#6B6B6B] font-medium">
                        {matchingMessages.length > 0
                          ? `${activeMatchIndex + 1} of ${matchingMessages.length} matches`
                          : 'No matches'}
                      </span>

                      {matchingMessages.length > 0 && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const next = (activeMatchIndex - 1 + matchingMessages.length) % matchingMessages.length;
                              setActiveMatchIndex(next);
                              scrollToMessageId(matchingMessages[next].id);
                            }}
                            className="p-1 border border-[#E5E5E5] rounded bg-white hover:bg-[#F0F0F0]"
                            title="Previous match"
                          >
                            <ChevronUp className="w-3.5 h-3.5 text-[#0A0A0A]" />
                          </button>
                          <button
                            onClick={() => {
                              const next = (activeMatchIndex + 1) % matchingMessages.length;
                              setActiveMatchIndex(next);
                              scrollToMessageId(matchingMessages[next].id);
                            }}
                            className="p-1 border border-[#E5E5E5] rounded bg-white hover:bg-[#F0F0F0]"
                            title="Next match"
                          >
                            <ChevronDown className="w-3.5 h-3.5 text-[#0A0A0A]" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Chat Thread Area */}
              <div className="relative flex-1 min-h-0 bg-[#FAFAFA]">
                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="absolute inset-0 pt-4 pb-6 px-8 overflow-y-auto custom-scrollbar scroll-smooth [overscroll-behavior:contain] space-y-4"
                >
                  {/* Topic Banner Header */}
                  <div className="flex items-center justify-center my-2">
                    <span className="px-3 py-1 bg-white border border-[#E5E5E5] text-[#6B6B6B] font-mono uppercase tracking-[0.1em] text-[11px] font-semibold rounded-[4px]">
                      TOPIC: {threadTopic.toUpperCase()}
                    </span>
                  </div>

                  {timeline.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-3/4 gap-2 text-[#9CA3AF] py-16 font-mono text-center">
                      <div className="text-sm uppercase tracking-wider text-[#9CA3AF]">
                        No messages yet.
                      </div>
                      <p className="text-[11px] text-[#9CA3AF] font-sans">
                        Start your academic & mentorship discussion with {activeContact.name}.
                      </p>
                    </div>
                  ) : (
                    timeline.map(item => {
                      if (item.kind === 'divider') {
                        return (
                          <div key={item.id} className="relative flex items-center justify-center my-6">
                            <span className="px-3 bg-transparent text-[#9CA3AF] font-mono text-[11px] uppercase tracking-wider">
                              {item.label}
                            </span>
                          </div>
                        );
                      }

                      if (item.kind === 'unread-divider') {
                        return (
                          <div key={item.id} ref={firstUnreadRef} className="relative flex items-center justify-center my-4">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-[#0A0A0A]" />
                            </div>
                            <span className="relative px-3 bg-[#FAFAFA] text-[10px] font-mono uppercase tracking-wider text-[#0A0A0A] font-bold">
                              {item.unreadCount} UNREAD {item.unreadCount === 1 ? 'MESSAGE' : 'MESSAGES'}
                            </span>
                          </div>
                        );
                      }

                      const msg = item.msg;
                      const isMe = msg.senderId === currentUserId;
                      const isReported = reportedMessageIds.has(msg.id) || msg.isReported;
                      const status: SendStatus = msg.status || 'read';
                      const isFailed = status === 'failed';
                      const isSendingMsg = status === 'sending';
                      const hasDownloadableAttachment = !!msg.attachmentName && !!msg.attachmentUrl;
                      const sanitizedDisplayName = cleanAttachmentName(msg.attachmentName);
                      const isEmojiOnly = isSingleEmojiOnly(msg.content);
                      const reactions = msg.reactions?.reduce((acc: any, r: any) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {}) || {};

                      const AttachmentChip = () => {
                        if (!msg.attachmentName) return null;
                        if (hasDownloadableAttachment) {
                          return (
                            <a
                              href={msg.attachmentUrl}
                              download={sanitizedDisplayName}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-2.5 rounded-[4px] font-mono text-xs flex items-center justify-between gap-3 cursor-pointer transition-colors border ${
                                isMe
                                  ? 'bg-[#1F1F1F] border-[#333333] text-white hover:bg-[#2B2B2B]'
                                  : 'bg-white border-[#E5E5E5] text-[#0A0A0A] hover:bg-[#FAFAFA]'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FileText className={`w-3.5 h-3.5 shrink-0 ${isMe ? 'text-[#E5E5E5]' : 'text-[#0A0A0A]'}`} />
                                <span className="truncate font-medium">{sanitizedDisplayName}</span>
                              </div>
                              <Download className="w-3.5 h-3.5 shrink-0 text-[#9CA3AF]" />
                            </a>
                          );
                        }
                        return (
                          <div
                            className={`p-2.5 rounded-[4px] font-mono text-xs flex items-center justify-between gap-3 opacity-80 border ${
                              isMe ? 'bg-[#1F1F1F] border-[#333333] text-[#E5E5E5]' : 'bg-white border-[#E5E5E5] text-[#6B6B6B]'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate font-medium">{sanitizedDisplayName}</span>
                            </div>
                            <span className="text-[10px] uppercase font-mono tracking-wider shrink-0 text-[#9CA3AF]">Attachment</span>
                          </div>
                        );
                      };

                      const QuotedReplyInsideBubble = () => {
                        if (!msg.replyTo) return null;
                        return (
                          <div className={`p-2 px-2.5 mb-1.5 rounded-[2px] border-l-[3px] text-xs font-sans ${
                            isMe
                              ? 'bg-[#1F1F1F] border-l-white text-[#D1D5DB]'
                              : 'bg-[#F8F8F8] border-l-[#0A0A0A] text-[#6B6B6B]'
                          }`}>
                            <p className="font-bold text-[10px] uppercase tracking-wider">{msg.replyTo.name}</p>
                            <p className="truncate text-[11px] font-normal mt-0.5">"{msg.replyTo.content}"</p>
                          </div>
                        );
                      };

                      const ReactionBar = () => (
                        <div className="absolute -top-9 right-0 z-30 flex items-center gap-1 bg-white border border-[#E5E5E5] shadow-md rounded-full px-2 py-1 animate-in fade-in zoom-in-95 duration-100">
                          {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              className="w-6 h-6 flex items-center justify-center hover:scale-125 transition-transform text-sm"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      );

                      if (isMe) {
                        return (
                          <div key={item.id} id={`msg-${msg.id}`} className={`flex flex-col items-end group relative ${item.showHeader ? 'mt-4' : 'mt-1'}`}>
                            
                            {/* Message Actions (always accessible on mobile/touch, hover-revealed on desktop) */}
                            <div className="opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-1 mb-1 mr-1">
                              <button
                                onClick={() => setActiveReactionPickerMsgId(activeReactionPickerMsgId === msg.id ? null : msg.id)}
                                className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center sm:min-w-0 sm:min-h-0 sm:p-1 rounded bg-white border border-[#E5E5E5] text-[#9CA3AF] hover:text-[#0A0A0A] shadow-2xs"
                                title="Add reaction"
                              >
                                <Smile className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setReplyContext({ id: msg.id, name: 'You', content: msg.content || msg.attachmentName || '' })}
                                className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center sm:min-w-0 sm:min-h-0 sm:p-1 rounded bg-white border border-[#E5E5E5] text-[#9CA3AF] hover:text-[#0A0A0A] shadow-2xs"
                                title="Reply"
                              >
                                <Reply className="w-3 h-3" />
                              </button>
                            </div>

                            {activeReactionPickerMsgId === msg.id && <ReactionBar />}

                            {/* Sent Bubble: Solid Black matching screenshot */}
                            {isEmojiOnly ? (
                              <div className="text-3xl sm:text-4xl py-1 select-none animate-in fade-in duration-150">
                                {renderHighlightedContent(msg.content)}
                              </div>
                            ) : (
                              <div
                                className={`relative w-fit max-w-[70%] p-3.5 px-4 space-y-1.5 bg-[#0A0A0A] text-white rounded-[12px] rounded-br-[2px] shadow-none ${
                                  isReported ? 'opacity-60 ring-1 ring-rose-500' : ''
                                } ${isSendingMsg ? 'opacity-80' : ''}`}
                              >
                                <QuotedReplyInsideBubble />

                                {msg.content && (
                                  <p className="text-[13px] leading-[1.6] font-normal text-white whitespace-pre-wrap break-words">
                                    {renderHighlightedContent(msg.content)}
                                  </p>
                                )}



                                <AttachmentChip />
                              </div>
                            )}

                            {/* Reactions */}
                            {Object.keys(reactions).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.entries(reactions).map(([emoji, count]) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleToggleReaction(msg.id, emoji)}
                                    className="px-2 py-0.5 bg-[#0A0A0A] border border-[#333333] rounded-full text-[11px] font-mono flex items-center gap-1 shadow-2xs hover:bg-[#1F1F1F]"
                                  >
                                    <span>{emoji}</span>
                                    <span className="text-[#0A0A0A] font-bold">{String(count)}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Timestamp with AP Avatar on Right matching screenshot */}
                            <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-[#9CA3AF]">
                              <span>{formatBubbleTime(msg.timestamp)}</span>
                              {isFailed ? (
                                <button
                                  onClick={() => retryFailedMessage(msg.id)}
                                  className="flex items-center gap-1 text-rose-500 font-bold hover:underline"
                                  title="Click to retry"
                                >
                                  <span>Failed</span>
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              ) : (
                                statusIcon(status)
                              )}
                              <div className="w-5 h-5 rounded-full bg-[#E5E5E5] text-[#0A0A0A] font-bold text-[9px] flex items-center justify-center shrink-0">
                                {getInitials(currentUser.name)}
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div key={item.id} id={`msg-${msg.id}`} className={`flex items-start gap-3 group relative ${item.showHeader ? 'mt-4' : 'mt-1'}`}>
                            {/* RS Avatar on Left matching screenshot */}
                            <div className="w-8 shrink-0 mt-0.5">
                              {item.showHeader && (
                                <div className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-xs">
                                  {getInitials(activeContact.name)}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-start w-fit max-w-[70%]">
                              {/* Message Actions (always accessible on mobile/touch, hover-revealed on desktop) */}
                              <div className="opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-1 mb-1 ml-1">
                                <button
                                  onClick={() => setActiveReactionPickerMsgId(activeReactionPickerMsgId === msg.id ? null : msg.id)}
                                  className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center sm:min-w-0 sm:min-h-0 sm:p-1 rounded bg-white border border-[#E5E5E5] text-[#9CA3AF] hover:text-[#0A0A0A] shadow-2xs"
                                  title="Add reaction"
                                >
                                  <Smile className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setReplyContext({ id: msg.id, name: msg.senderName || activeContact.name, content: msg.content || msg.attachmentName || '' })}
                                  className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center sm:min-w-0 sm:min-h-0 sm:p-1 rounded bg-white border border-[#E5E5E5] text-[#9CA3AF] hover:text-[#0A0A0A] shadow-2xs"
                                  title="Reply"
                                >
                                  <Reply className="w-3 h-3" />
                                </button>
                              </div>

                              {activeReactionPickerMsgId === msg.id && <ReactionBar />}

                              {/* Received Bubble: White with hairline border */}
                              {isEmojiOnly ? (
                                <div className="text-3xl sm:text-4xl py-1 select-none animate-in fade-in duration-150">
                                  {renderHighlightedContent(msg.content)}
                                </div>
                              ) : (
                                <div
                                  className={`relative w-fit p-3.5 px-4 space-y-1.5 bg-white border border-[#E5E5E5] text-[#0A0A0A] rounded-[12px] rounded-bl-[2px] shadow-2xs ${
                                    isReported ? 'opacity-60 ring-1 ring-rose-500' : ''
                                  }`}
                                >
                                  <QuotedReplyInsideBubble />

                                  {msg.content && (
                                    <p className="text-[13px] leading-[1.6] font-normal text-[#0A0A0A] whitespace-pre-wrap break-words">
                                      {renderHighlightedContent(msg.content)}
                                    </p>
                                  )}



                                  <AttachmentChip />

                                  {openMenuMsgId === msg.id && (
                                    <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-[#E5E5E5] shadow-md py-1 animate-in fade-in">
                                      <button
                                        onClick={() => handleReport(msg.id)}
                                        className="w-full px-3 py-1.5 flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-rose-600 hover:bg-[#F0F0F0] whitespace-nowrap"
                                      >
                                        <Flag className="w-3.5 h-3.5" /> Report to Admin
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Reactions */}
                              {Object.keys(reactions).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Object.entries(reactions).map(([emoji, count]) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleToggleReaction(msg.id, emoji)}
                                      className="px-2 py-0.5 bg-white border border-[#E5E5E5] rounded-full text-[11px] font-mono flex items-center gap-1 shadow-2xs hover:bg-[#FAFAFA]"
                                    >
                                      <span>{emoji}</span>
                                      <span className="text-[#0A0A0A] font-bold">{String(count)}</span>
                                    </button>
                                  ))}
                                </div>
                              )}

                              {/* Timestamp */}
                              <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-[#9CA3AF]">
                                <span>{formatBubbleTime(msg.timestamp)}</span>
                                {!isReported && (
                                  <button
                                    onClick={() => setOpenMenuMsgId(openMenuMsgId === msg.id ? null : msg.id)}
                                    className="opacity-0 group-hover:opacity-100 transition text-[#9CA3AF] hover:text-[#0A0A0A]"
                                    title="Options"
                                  >
                                    <MoreVertical className="w-3 h-3" />
                                  </button>
                                )}
                                {isReported && <span className="text-rose-600 font-bold uppercase tracking-wider">Reported</span>}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })
                  )}



                  <div ref={bottomSentinelRef} />
                </div>

                {/* Floating "jump to latest" */}
                {!isNearBottom && (
                  <button
                    onClick={() => scrollToBottom(true)}
                    className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-[#0A0A0A] text-white text-[11px] font-mono uppercase tracking-wider shadow-md hover:bg-[#222222] transition-colors"
                  >
                    {newBelowCount > 0 ? `${newBelowCount} NEW` : 'LATEST'}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* ─── MESSAGE INPUT BAR MATCHING SCREENSHOT ────────────────────────── */}
              <div className="p-4 px-6 bg-white shrink-0 border-t border-[#E5E5E5] relative">

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChosen}
                />

                {/* Replying Context Preview */}
                {replyContext && (
                  <div className="mb-2 p-2.5 px-3 bg-[#F8F8F8] border-l-[3px] border-l-[#0A0A0A] border border-[#E5E5E5] rounded-[2px] flex items-center justify-between text-xs animate-in fade-in">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[11px] text-[#0A0A0A] flex items-center gap-1">
                        <Reply className="w-3 h-3 text-[#0A0A0A]" />
                        <span>Replying to {replyContext.name}</span>
                      </p>
                      <p className="text-[11px] text-[#6B6B6B] truncate mt-0.5">"{replyContext.content}"</p>
                    </div>
                    <button
                      onClick={() => setReplyContext(null)}
                      className="p-1 text-[#9CA3AF] hover:text-[#0A0A0A] hover:bg-[#E5E5E5] rounded transition-colors shrink-0"
                      title="Cancel reply"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* File Preview */}
                {attachedFile && (
                  <div className="mb-2 p-2 px-3 bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl flex items-center justify-between">
                    <a
                      href={attachedFile.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs font-mono text-[#0A0A0A] min-w-0 hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#0A0A0A] shrink-0" />
                      <span className="truncate">{attachedFile.name}</span>
                      <span className="text-[10px] text-[#9CA3AF] shrink-0">({attachedFile.size || '—'})</span>
                    </a>
                    <button
                      onClick={handleAttachClick}
                      className="p-1 text-[#9CA3AF] hover:text-[#0A0A0A] hover:bg-[#E5E5E5] rounded-lg transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <form
                  onSubmit={e => {
                    e.preventDefault();
                    sendMessage(draftText, attachedFile || undefined);
                  }}
                  className="flex items-center gap-3 bg-white border border-[#E5E5E5] rounded-2xl px-4 py-2.5 focus-within:border-[#0A0A0A] transition-colors shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={handleAttachClick}
                    className="text-[#9CA3AF] hover:text-[#0A0A0A] transition-colors shrink-0 p-0.5"
                    title={attachedFile ? 'Change attachment' : 'Attach file'}
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <textarea
                    ref={textareaRef}
                    value={draftText}
                    onChange={e => setDraftText(e.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    rows={1}
                    placeholder={`Message ${activeContact?.name?.split(' ')[0] || 'Contact'}...`}
                    className="w-full max-h-[120px] text-xs py-0.5 bg-transparent border-0 focus:outline-none font-normal text-[#0A0A0A] placeholder:text-[#9CA3AF] flex-1 min-w-0 resize-none leading-relaxed custom-scrollbar"
                  />

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDraftText(prev => prev + ' 👍 ')}
                      className="text-[#9CA3AF] hover:text-[#0A0A0A] transition-colors p-0.5"
                      title="Insert emoji"
                    >
                      <Smile className="w-4 h-4" />
                    </button>

                    <button
                      type="submit"
                      disabled={!isSendEnabled}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isSendEnabled ? 'bg-[#0A0A0A] text-white hover:scale-105 shadow-xs' : 'text-[#9CA3AF] cursor-not-allowed'
                      }`}
                      title="Send"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>

                {/* Subtitle Caption */}
                <div className="mt-2 pt-1">
                  <p className="text-[10px] font-mono text-[#9CA3AF] uppercase tracking-wider">
                    PRESS ENTER TO SEND
                  </p>
                </div>

              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-[#9CA3AF] font-mono text-xs">
              <MessageSquare className="w-6 h-6 text-[#9CA3AF]" />
              <p>SELECT A CONVERSATION TO START MESSAGING</p>
            </div>
          )}

        </div>
      </div>
      )}

      {/* ─── NEW CONVERSATION DIRECTORY MODAL (Smooth Rounded Corners) ─────────── */}
      <Modal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        title="New Direct Conversation"
        subtitle="Select any verified Alumni or Faculty member to start a direct thread."
        maxWidth="lg"
      >
        <div className="space-y-4 font-sans text-xs -mx-6 -my-6">
          {/* Modal Search & Filters */}
          <div className="p-4 px-6 border-b border-[#E5E5E5] bg-[#FAFAFA] space-y-3 shrink-0">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={modalSearch}
                onChange={e => setModalSearch(e.target.value)}
                placeholder="Search by name, company (e.g. Google, Microsoft), or department..."
                className="w-full h-9 text-xs pl-9 pr-3 bg-white border border-[#E5E5E5] rounded-xl focus:border-[#0A0A0A] focus:outline-none transition-colors font-medium text-[#0A0A0A] placeholder:text-[#9CA3AF]"
              />
            </div>

            {/* Segmented Filter Pills */}
            <div className="flex items-center gap-1.5">
              {(['all', 'alumni', 'faculty'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setModalFilter(tab)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    modalFilter === tab
                      ? 'bg-[#0A0A0A] text-white shadow-xs'
                      : 'bg-white text-[#6B6B6B] border border-[#E5E5E5] hover:text-[#0A0A0A]'
                  }`}
                >
                  {tab === 'all' ? `All (${allDirectoryProfiles.length})` : tab === 'alumni' ? `Alumni (${allDirectoryProfiles.filter(p => p.type === 'alumni').length})` : `Faculty (${allDirectoryProfiles.filter(p => p.type === 'faculty').length})`}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Profiles List */}
          <div className="overflow-y-auto max-h-[50vh] p-4 px-6 divide-y divide-[#E5E5E5] custom-scrollbar">
            {filteredModalProfiles.length === 0 ? (
              <div className="py-12 text-center text-[#9CA3AF] font-mono text-xs">
                No matching alumni or faculty profiles found.
              </div>
            ) : (
              filteredModalProfiles.map(person => {
                const isAlreadyConnected = contactList.some(c => c.id === person.id);
                return (
                  <div
                    key={person.id}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#FAFAFA] rounded-xl px-3 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Circle Avatar with Initials */}
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-xs">
                          {getInitials(person.name)}
                        </div>
                        <span className="w-2.5 h-2.5 bg-[#16A34A] ring-2 ring-white rounded-full absolute bottom-0 right-0" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-[#0A0A0A] truncate">{person.name}</h4>
                          <span className="px-1.5 py-0.2 bg-[#F0F0F0] text-[#0A0A0A] text-[9px] font-mono uppercase font-bold tracking-wider rounded-md">
                            {person.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B6B6B] truncate mt-0.5">
                          {person.company} · {person.designation} · {person.department}
                        </p>
                        {person.skills && person.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {person.skills.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="px-1.5 py-0.2 border border-[#E5E5E5] rounded text-[#6B6B6B] text-[9px] font-mono">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => startNewChatWith(person)}
                    >
                      {isAlreadyConnected ? 'Open Chat' : 'Start Chat'}
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-3 px-6 border-t border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between text-[11px] font-mono text-[#9CA3AF] shrink-0">
            <span>INSTITUTIONAL DIRECTORY · VIDYALANKAR INSTITUTE OF TECHNOLOGY</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowNewConversationModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export const MessagingPage: React.FC = () => {
  const { currentUser } = useAuth();
  if (currentUser.role === 'admin') {
    return <AdminMessagingGuardView />;
  }
  return <StandardMessagingView />;
};

// Internal icon helper
const UsersRoundIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 21a8 8 0 0 0-16 0" />
    <circle cx="10" cy="8" r="5" />
    <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
  </svg>
);

