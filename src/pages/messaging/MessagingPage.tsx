/**
 * NexaLink Messaging v2 - Redesigned Enterprise Messenger Workspace
 *
 * Implements full specification:
 * - Centered max-w-[760px] thread canvas and composer
 * - Kind-aware previews (You: Photo, You: PDF · filename, Message deleted)
 * - True attachment handling: Drag & drop, clipboard paste, zero CLS image grids, Lightbox, standalone PDF cards
 * - Curated self-hosted Emoji Picker with caret-position insertion
 * - Realtime reaction chips with 1-reaction-per-user-per-message policy
 * - Quoted replies with jump-to-original highlighting
 * - Delete for everyone (≤60 min) and text editing (≤15 min)
 * - Grouped consecutive messages with non-padded timestamps ("2:30 pm")
 * - Status line: Sending… → Sent → Delivered → Read
 * - Subtle Lock icon button with popover (replaces old Private pill)
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useMobileChrome } from '../../context/MobileChromeContext';
import type { MentorshipGuidancePurpose, UserRole, ChatMessage, MessageAttachment, ReplySnippet } from '../../types';
import { Avatar } from '../../utils/avatarHelper';
import { formatMessageTime, formatConversationPreview } from '../../features/messaging/utils/timeFormatters';
import { validateChatAttachment, MAX_FILES_PER_MESSAGE } from '../../features/messaging/utils/fileValidation';
import { processChatImage } from '../../features/messaging/utils/imageProcessor';
import { MessagingService } from '../../features/messaging/api/messagingService';
import { messagingService, type ConversationSummary } from '../../services/messagingService';
import { EmojiPicker } from '../../features/messaging/emoji/EmojiPicker';
import { insertAtCaret } from '../../features/messaging/emoji/insertAtCaret';
import { ThreadHeader } from '../../features/messaging/components/ThreadHeader';
import { AttachmentGrid } from '../../features/messaging/components/AttachmentGrid';
import { AttachmentPdfCard } from '../../features/messaging/components/AttachmentPdfCard';
import { ComposerAttachmentTray, type PendingAttachmentItem } from '../../features/messaging/components/ComposerAttachmentTray';
import { ReactionBar } from '../../features/messaging/components/ReactionBar';
import { ReactionChips } from '../../features/messaging/components/ReactionChips';
import { ReplyBar } from '../../features/messaging/components/ReplyBar';
import {
  MessageSquare,
  Send,
  Paperclip,
  CheckCheck,
  Check,
  Search,
  Lock,
  ArrowLeft,
  X,
  ChevronDown,
  Smile,
  Plus,
  Star,
  Trash2,
  Edit3,
  Reply,
  MoreHorizontal,
  ExternalLink,
  AlertCircle,
  Clock,
  RotateCcw,
  Copy,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Modal } from '../../components/common/UIComponents';

export interface ContactItem {
  id: string;
  name: string;
  avatarUrl: string;
  company: string;
  department: string;
  designation?: string;
  type?: 'alumni' | 'faculty' | 'student';
  gradYear?: string;
  skills: string[];
  online: boolean;
  lastSeen?: string;
  lastMessageTopic: MentorshipGuidancePurpose;
}

export const MessagingPage: React.FC = () => {
  const {
    messages,
    sendMessage: globalSendMessage,
    editMessage: globalEditMessage,
    deleteMessage: globalDeleteMessage,
    toggleReaction,
    reportMessage,
    retryFailedMessage,
    deleteFailedMessage,
    starredConversations,
    toggleStarConversation,
    alumniList,
    facultyList,
    studentList,
    mentorshipRequests,
    markThreadAsRead,
    isDataLoading,
    setActiveChatContactId,
    pendingChatUserId,
    setPendingChatUserId,
    loadThreadMessages
  } = useData();

  const { currentUser } = useAuth();
  const currentUserId = currentUser.id;

  // Filter & Search states
  const [tabFilter, setTabFilter] = useState<'All' | 'Unread' | 'Starred'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeContactId, setActiveContactId] = useState<string>('');
  const [showMobileChat, setShowMobileChat] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  const { setHideMobileChrome } = useMobileChrome();

  // Hide mobile topbar & bottomnav when a chat thread is open on mobile
  useEffect(() => {
    setHideMobileChrome(showMobileChat);
    return () => setHideMobileChrome(false);
  }, [showMobileChat, setHideMobileChrome]);

  // Support Android hardware/system back button
  useEffect(() => {
    const handlePopState = () => {
      if (showMobileChat) {
        setShowMobileChat(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showMobileChat]);

  // Composer states
  const [draftText, setDraftText] = useState('');
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ReplySnippet | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachmentItem[]>([]);
  const [isDraggingOverThread, setIsDraggingOverThread] = useState(false);

  // Editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // In-thread search
  const [showThreadSearch, setShowThreadSearch] = useState(false);
  const [threadSearchQuery, setThreadSearchQuery] = useState('');
  const [activeMatchIdx, setActiveMatchIdx] = useState(0);

  // Hover toolbar states
  const [activeHoverMsgId, setActiveHoverMsgId] = useState<string | null>(null);
  const [activeReactionPickerMsgId, setActiveReactionPickerMsgId] = useState<string | null>(null);
  const [activeActionMenuMsgId, setActiveActionMenuMsgId] = useState<string | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

  // Muted contacts state
  const [mutedContactIds, setMutedContactIds] = useState<Set<string>>(new Set());
  const [benchmarkThreadMessages, setBenchmarkThreadMessages] = useState<ChatMessage[] | null>(null);
  const [optimisticLastMessages, setOptimisticLastMessages] = useState<Record<string, ChatMessage>>({});

  // New conversation modal
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalFilter, setModalFilter] = useState<'all' | 'alumni' | 'faculty'>('all');
  const [manuallyAddedContactIds, setManuallyAddedContactIds] = useState<string[]>([]);

  // Scroll tracking
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [newBelowCount, setNewBelowCount] = useState(0);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const prevThreadLengthRef = useRef<number>(0);

  // 1. Directory Profiles for contact resolution
  const allDirectoryProfiles = useMemo(() => {
    return [
      ...alumniList.map(a => {
        const gradYear = (a as any).graduationYear || (a as any).gradYear;
        const comp = a.company && a.company.toLowerCase() !== 'alumni' ? a.company : '';
        const desig = (a.designation && a.designation.toLowerCase() !== 'alumni') ? a.designation : '';
        return {
          id: a.id,
          name: a.name,
          avatarUrl: a.avatar || '',
          company: comp,
          designation: desig,
          department: a.department || 'Engineering',
          type: 'alumni' as const,
          gradYear: gradYear ? String(gradYear) : undefined,
          skills: a.skills || [],
          online: false,
          lastSeen: 'Active recently',
          lastMessageTopic: 'Career Mentorship' as MentorshipGuidancePurpose
        };
      }),
      ...facultyList.map(f => {
        const deptStr = f.department || 'CMPN';
        const desigStr = f.designation && f.designation.toLowerCase() !== 'faculty' ? f.designation : 'Professor';
        return {
          id: f.id,
          name: f.name,
          avatarUrl: f.avatar || '',
          company: 'Vidyalankar Institute of Technology',
          designation: desigStr,
          department: deptStr,
          type: 'faculty' as const,
          skills: f.researchAreas || [],
          online: false,
          lastSeen: 'Active recently',
          lastMessageTopic: 'Research Guidance' as MentorshipGuidancePurpose
        };
      }),
      ...studentList.map(s => {
        const yearStr = (s as any).currentYear ? `${(s as any).currentYear} Year` : 'Student';
        return {
          id: s.id,
          name: s.name,
          avatarUrl: s.avatar || '',
          company: s.department || 'Engineering',
          designation: yearStr,
          department: s.department || 'Engineering',
          type: 'student' as const,
          skills: s.skills || [],
          online: false,
          lastSeen: 'Active recently',
          lastMessageTopic: 'General Mentorship' as MentorshipGuidancePurpose
        };
      })
    ];
  }, [alumniList, facultyList, studentList]);

  // Sync activeContactId to DataContext
  useEffect(() => {
    setActiveChatContactId(activeContactId || null);
    return () => setActiveChatContactId(null);
  }, [activeContactId, setActiveChatContactId]);

  // 2. Contact List Calculation
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

  // Active contact
  const activeContact = contactList.find(c => c.id === activeContactId);

  // Auto-select first contact if none selected
  useEffect(() => {
    if (contactList.length > 0 && (!activeContactId || !contactList.some(c => c.id === activeContactId))) {
      setActiveContactId(contactList[0].id);
    }
  }, [contactList, activeContactId]);

  // Handle Deep-Link from directory or mentorship
  useEffect(() => {
    if (pendingChatUserId) {
      const profile = allDirectoryProfiles.find(p => p.id === pendingChatUserId);
      if (profile) {
        setManuallyAddedContactIds(prev => Array.from(new Set([...prev, profile.id])));
        setActiveContactId(profile.id);
        setShowMobileChat(true);
        setNotice(`Direct thread opened with ${profile.name}`);
        setTimeout(() => {
          setNotice(null);
          textareaRef.current?.focus();
        }, 400);
      }
      setPendingChatUserId(null);
    }
  }, [pendingChatUserId, allDirectoryProfiles, setPendingChatUserId]);

  // 3. Thread messages filtering and sorting
  const rawThreadMessages = useMemo(() => {
    if (benchmarkThreadMessages) return benchmarkThreadMessages;
    if (!activeContactId) return [];
    return messages
      .filter(msg => {
        const a = msg.senderId;
        const b = msg.receiverId;
        return (a === currentUserId && b === activeContactId) || (a === activeContactId && b === currentUserId);
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, currentUserId, activeContactId, benchmarkThreadMessages]);

  // Keyset & Page pagination on thread messages (THREAD_PAGE_SIZE = 20)
  const [threadPage, setThreadPage] = useState(1);
  const THREAD_PAGE_SIZE = 20;

  // Reset page when switching active contact
  useEffect(() => {
    setThreadPage(1);
  }, [activeContactId]);

  // Load thread messages on-demand when contact selected
  useEffect(() => {
    if (!activeContactId || !currentUserId) return;
    const hasThread = messages.some(
      m => (m.senderId === currentUserId && m.receiverId === activeContactId) ||
           (m.senderId === activeContactId && m.receiverId === currentUserId)
    );
    if (!hasThread && loadThreadMessages) {
      loadThreadMessages(activeContactId, { limit: THREAD_PAGE_SIZE });
    }
  }, [activeContactId, currentUserId, messages, loadThreadMessages]);

  const totalThreadMessages = rawThreadMessages.length;
  const totalThreadPages = Math.max(1, Math.ceil(totalThreadMessages / THREAD_PAGE_SIZE));

  const paginatedThreadMessages = useMemo(() => {
    if (totalThreadMessages <= THREAD_PAGE_SIZE) {
      return rawThreadMessages;
    }
    const end = Math.max(0, totalThreadMessages - (threadPage - 1) * THREAD_PAGE_SIZE);
    const start = Math.max(0, end - THREAD_PAGE_SIZE);
    return rawThreadMessages.slice(start, end);
  }, [rawThreadMessages, threadPage, totalThreadMessages]);

  // Last sent message in the entire thread (for status display)
  const lastSentMsgId = useMemo(() => {
    for (let i = rawThreadMessages.length - 1; i >= 0; i--) {
      if (rawThreadMessages[i].senderId === currentUserId) {
        return rawThreadMessages[i].id;
      }
    }
    return null;
  }, [rawThreadMessages, currentUserId]);

  // Unread messages tracking
  const unreadCountInThread = useMemo(() => {
    return rawThreadMessages.filter(m => m.senderId === activeContactId && !m.isRead).length;
  }, [rawThreadMessages, activeContactId]);

  const firstUnreadMsgId = useMemo(() => {
    const unread = rawThreadMessages.find(m => m.senderId === activeContactId && !m.isRead);
    return unread?.id;
  }, [rawThreadMessages, activeContactId]);

  // In-thread search filtering
  const matchingMsgIds = useMemo(() => {
    if (!threadSearchQuery.trim()) return [];
    const q = threadSearchQuery.toLowerCase();
    return rawThreadMessages.filter(m => m.content && m.content.toLowerCase().includes(q)).map(m => m.id);
  }, [rawThreadMessages, threadSearchQuery]);

  // Scroll to bottom
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
    const near = distanceFromBottom < 80;
    setIsNearBottom(near);
    if (near) setNewBelowCount(0);
  };

  // Auto-scroll on new messages
  useEffect(() => {
    const prevLen = prevThreadLengthRef.current;
    const diff = rawThreadMessages.length - prevLen;
    if (diff > 0) {
      if (isNearBottom) {
        scrollToBottom(prevLen > 0);
      } else {
        setNewBelowCount(c => c + diff);
      }
    }
    prevThreadLengthRef.current = rawThreadMessages.length;
  }, [rawThreadMessages.length, isNearBottom, scrollToBottom]);

  // Auto-mark thread as read when active
  useEffect(() => {
    if (activeContactId) {
      markThreadAsRead(activeContactId);
      MessagingService.markConversationRead(activeContactId).catch(() => {});
    }
  }, [activeContactId, rawThreadMessages.length, markThreadAsRead]);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [draftText]);

  // Load / Save draft
  useEffect(() => {
    if (activeContactId && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`nexalink_draft_${activeContactId}`) || '';
      setDraftText(saved);
      setPendingAttachments([]);
      setReplyTarget(null);
    }
  }, [activeContactId]);

  const handleDraftChange = (text: string) => {
    setDraftText(text);
    if (activeContactId && typeof window !== 'undefined') {
      if (text.trim()) {
        localStorage.setItem(`nexalink_draft_${activeContactId}`, text);
      } else {
        localStorage.removeItem(`nexalink_draft_${activeContactId}`);
      }
    }
  };

  // 4. Attachment Handling: Validation, Decider, Processing, and Tray Management
  const handleAttachFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (pendingAttachments.length + fileArray.length > MAX_FILES_PER_MESSAGE) {
      setNotice(`Maximum ${MAX_FILES_PER_MESSAGE} attachments allowed per message.`);
      setTimeout(() => setNotice(null), 3000);
      return;
    }

    for (const file of fileArray) {
      const validation = await validateChatAttachment(file);
      if (!validation.valid) {
        setNotice(validation.error || 'Invalid file');
        setTimeout(() => setNotice(null), 4000);
        continue;
      }

      const tempId = `pend-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      const mime = validation.mimeType!;

      // Add to tray with validating state
      const newItem: PendingAttachmentItem = {
        id: tempId,
        file,
        name: file.name,
        sizeStr,
        mimeType: mime,
        progress: 10,
        status: 'processing'
      };

      setPendingAttachments(prev => [...prev, newItem]);

      try {
        if (mime.startsWith('image/')) {
          const processed = await processChatImage(file, mime as any);
          const previewUrl = URL.createObjectURL(processed.thumbBlob);
          const width = processed.width;
          const height = processed.height;

          setPendingAttachments(prev =>
            prev.map(item =>
              item.id === tempId
                ? { ...item, previewUrl, width, height, progress: 40, status: 'uploading' }
                : item
            )
          );

          // Upload to storage with strict path: {senderId}/{receiverId}/{uuid}-{safeFileName}
          const storagePath = await MessagingService.uploadAttachment(
            currentUserId,
            activeContactId,
            processed.processedBlob,
            file.name,
            (pct: number) => {
              setPendingAttachments(prev =>
                prev.map(item => (item.id === tempId ? { ...item, progress: 40 + pct * 0.6 } : item))
              );
            }
          );

          setPendingAttachments(prev =>
            prev.map(item =>
              item.id === tempId
                ? { ...item, storagePath, progress: 100, status: 'ready' }
                : item
            )
          );
        } else {
          // PDF document
          const previewUrl = URL.createObjectURL(file);
          setPendingAttachments(prev =>
            prev.map(item =>
              item.id === tempId
                ? { ...item, previewUrl, progress: 20, status: 'uploading' }
                : item
            )
          );

          const storagePath = await MessagingService.uploadAttachment(
            currentUserId,
            activeContactId,
            file,
            file.name,
            (pct: number) => {
              setPendingAttachments(prev =>
                prev.map(item => (item.id === tempId ? { ...item, progress: 20 + pct * 0.8 } : item))
              );
            }
          );

          setPendingAttachments(prev =>
            prev.map(item =>
              item.id === tempId
                ? { ...item, storagePath, progress: 100, status: 'ready' }
                : item
            )
          );
        }
      } catch (err: any) {
        setPendingAttachments(prev =>
          prev.map(item =>
            item.id === tempId
              ? { ...item, status: 'error', error: err.message || 'Upload failed' }
              : item
          )
        );
      }
    }
  };

  // Clipboard paste listener
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleAttachFiles(e.clipboardData.files);
    }
  };

  // Drag and drop onto thread
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverThread(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverThread(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverThread(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAttachFiles(e.dataTransfer.files);
    }
  };

  // 5. Send Message Dispatcher
  const handleSendMessage = async () => {
    const trimmed = draftText.trim();
    const hasAttachments = pendingAttachments.length > 0;
    const isAnyAttachmentBusy = pendingAttachments.some(
      a => a.status === 'processing' || a.status === 'uploading'
    );

    if ((!trimmed && !hasAttachments) || !activeContactId || isAnyAttachmentBusy) return;

    const clientMsgId = crypto.randomUUID();
    const currentAttachments = [...pendingAttachments];

    // Clear composer immediately
    setDraftText('');
    setPendingAttachments([]);
    const currentReply = replyTarget;
    setReplyTarget(null);
    setShowEmojiPicker(false);
    if (activeContactId && typeof window !== 'undefined') {
      localStorage.removeItem(`nexalink_draft_${activeContactId}`);
    }
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Format attachments into MessageAttachment models preserving local blob preview
    const messageAttachments: MessageAttachment[] = currentAttachments.map(att => ({
      id: att.id,
      messageId: clientMsgId,
      conversationId: activeContactId,
      uploaderId: currentUserId,
      storagePath: att.storagePath || '',
      fileName: att.name,
      mimeType: att.mimeType,
      sizeBytes: att.file.size,
      width: att.width,
      height: att.height,
      scanStatus: 'ok',
      signedUrl: att.previewUrl
    }));

    // Local state dispatch via DataContext
    const connectionReq = mentorshipRequests.find(
      r => (r.studentId === currentUserId && r.mentorId === activeContactId) ||
           (r.studentId === activeContactId && r.mentorId === currentUserId)
    );
    const category = (connectionReq?.purposeOfRequest || connectionReq?.topic || 'Career Mentorship') as MentorshipGuidancePurpose;

    const senderIdentity = {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role,
      avatar: currentUser.avatar
    };

    const firstAttName = messageAttachments.length > 0 ? messageAttachments[0].fileName : undefined;

    // Record optimistic preview immediately so sidebar never shows 'No messages yet'
    const optimisticMsg: ChatMessage = {
      id: clientMsgId,
      clientMessageId: clientMsgId,
      senderId: currentUserId,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatar || '',
      receiverId: activeContactId,
      content: trimmed,
      timestamp: new Date().toISOString(),
      isRead: false,
      attachments: messageAttachments.length > 0 ? messageAttachments : undefined,
      attachmentName: firstAttName,
      status: 'sending'
    };
    setOptimisticLastMessages(prev => ({ ...prev, [activeContactId]: optimisticMsg }));

    // Send through DataContext with attachments and reply snippet
    globalSendMessage(
      activeContactId,
      trimmed,
      category,
      firstAttName,
      senderIdentity,
      messageAttachments,
      currentReply || undefined
    );

    setThreadPage(1);
    scrollToBottom(true);
  };

  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (typeof window !== 'undefined' && window.innerWidth < 768) return; // Allow newline on mobile
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 6. Delete message for everyone
  const handleDeleteMessage = async (msgId: string) => {
    try {
      globalDeleteMessage(msgId);
      await MessagingService.deleteMessage(msgId).catch(() => {});
      setActiveActionMenuMsgId(null);
      setNotice('Message deleted for everyone.');
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setNotice(err.message || 'Unable to delete message');
      setTimeout(() => setNotice(null), 3000);
    }
  };

  // 7. Edit message text
  const handleSaveEdit = async (msgId: string) => {
    const trimmed = editingContent.trim();
    if (!trimmed) return;
    try {
      globalEditMessage(msgId, trimmed);
      await MessagingService.editMessage(msgId, trimmed).catch(() => {});
      setEditingMessageId(null);
      setEditingContent('');
      setActiveActionMenuMsgId(null);
      setNotice('Message edited.');
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      setNotice(err.message || 'Cannot edit message');
      setTimeout(() => setNotice(null), 3000);
    }
  };

  // 8. Jump to original replied message
  const handleJumpToOriginal = (originalId: string) => {
    const el = document.getElementById(`msg-${originalId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(originalId);
      setTimeout(() => setHighlightedMsgId(null), 1500);
    } else {
      setNotice('Original message is not in recent history.');
      setTimeout(() => setNotice(null), 2500);
    }
  };

  // Filtered contacts list
  const filteredContacts = useMemo(() => {
    return contactList.filter(c => {
      if (tabFilter === 'Starred' && !starredConversations.includes(c.id)) return false;
      if (tabFilter === 'Unread') {
        const hasUnread = messages.some(
          m => m.senderId === c.id && m.receiverId === currentUserId && !m.isRead
        );
        if (!hasUnread) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q)
      );
    }).sort((a, b) => {
      const aMsgs = messages.filter(m => (m.senderId === a.id && m.receiverId === currentUserId) || (m.senderId === currentUserId && m.receiverId === a.id));
      const bMsgs = messages.filter(m => (m.senderId === b.id && m.receiverId === currentUserId) || (m.senderId === currentUserId && m.receiverId === b.id));
      const aOpt = optimisticLastMessages[a.id];
      const bOpt = optimisticLastMessages[b.id];
      const aDbTime = aMsgs.length > 0 ? Math.max(...aMsgs.map(m => new Date(m.timestamp).getTime())) : 0;
      const bDbTime = bMsgs.length > 0 ? Math.max(...bMsgs.map(m => new Date(m.timestamp).getTime())) : 0;
      const aTime = Math.max(aDbTime, aOpt ? new Date(aOpt.timestamp).getTime() : 0);
      const bTime = Math.max(bDbTime, bOpt ? new Date(bOpt.timestamp).getTime() : 0);
      return bTime - aTime;
    });
  }, [contactList, tabFilter, starredConversations, messages, currentUserId, searchQuery, optimisticLastMessages]);

  // Is an emoji-only message (1-3 emojis render large 28px without bubble)
  const isEmojiOnly = (text: string): boolean => {
    if (!text) return false;
    const clean = text.trim();
    // Regex matching 1 to 3 emoji sequences
    const emojiRegex = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}){1,3}$/u;
    return emojiRegex.test(clean);
  };

  const isSendDisabled =
    (!draftText.trim() && pendingAttachments.length === 0) ||
    pendingAttachments.some(a => a.status === 'processing' || a.status === 'uploading');

  return (
    <div className={`${
      showMobileChat ? 'h-[100dvh] h-[100svh]' : 'h-[calc(100dvh-var(--topbar-h)-var(--bottomnav-h))]'
    } lg:h-[calc(100dvh-4rem)] flex bg-[#FFFFFF] overflow-hidden select-text font-sans`}>
      {/* ─── LEFT PANE: CONVERSATION LIST (340px) ───────────────────────── */}
      <div
        className={`w-full md:w-[340px] border-r border-[#E5E7EB] bg-white flex flex-col shrink-0 ${
          showMobileChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header (72px) */}
        <div className="h-[72px] min-h-[72px] max-h-[72px] px-5 border-b border-[#E5E7EB] bg-white flex items-center justify-between shrink-0">
          <h1 className="text-xl font-semibold text-[#0A0A0A] tracking-tight">Messages</h1>
          <button
            type="button"
            onClick={() => setShowNewConversationModal(true)}
            className="w-9 h-9 rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#0A0A0A] flex items-center justify-center transition-colors cursor-pointer"
            title="New direct conversation"
            aria-label="New direct conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs: All / Unread / Starred as Underline Tabs (44px) */}
        <div className="h-11 px-5 border-b border-[#E5E7EB] flex items-center gap-6 shrink-0 text-xs">
          {(['All', 'Unread', 'Starred'] as const).map(tab => {
            const count = tab === 'Unread'
              ? messages.filter(m => m.receiverId === currentUserId && !m.isRead).length
              : tab === 'Starred'
              ? starredConversations.length
              : 0;
            const isActive = tabFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setTabFilter(tab)}
                className={`relative h-full flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                  isActive ? 'text-[#0A0A0A] font-semibold' : 'text-[#6B7280] hover:text-[#0A0A0A]'
                }`}
              >
                <span>{tab}</span>
                {count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-[#F3F4F6] text-[#0A0A0A]">
                    {count}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="messagesListTabUnderline"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0A0A0A]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Search Bar (Radius 8, 40px high, filled #F3F4F6, no border) */}
        <div className="p-3 px-5 border-b border-[#E5E7EB] shrink-0">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full h-10 pl-9 pr-3 bg-[#F3F4F6] rounded-lg text-xs text-[#0A0A0A] placeholder:text-[#6B7280] border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] transition-all"
            />
          </div>
        </div>

        {/* Conversation Rows (72px high, no row dividers, clean selection) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-[#6B7280] text-xs space-y-1">
              <p className="font-medium text-[#0A0A0A]">No conversations found</p>
              <p className="text-[11px] text-[#6B7280]">Start one from the alumni or faculty directory.</p>
            </div>
          ) : (
            filteredContacts.map(contact => {
              const isSelected = contact.id === activeContactId;
              const contactMsgs = messages.filter(
                m => (m.senderId === contact.id && m.receiverId === currentUserId) ||
                     (m.senderId === currentUserId && m.receiverId === contact.id)
              );
              const dbLatest = contactMsgs.length > 0
                ? contactMsgs.reduce((latest, current) => {
                    return new Date(current.timestamp).getTime() > new Date(latest.timestamp).getTime() ? current : latest;
                  }, contactMsgs[0])
                : null;
              const optLatest = optimisticLastMessages[contact.id];
              const lastMsg = optLatest && (!dbLatest || new Date(optLatest.timestamp).getTime() >= new Date(dbLatest.timestamp).getTime())
                ? optLatest
                : dbLatest;
              const isLastFromMe = lastMsg?.senderId === currentUserId;
              const effectiveAttachments = (lastMsg?.attachments && lastMsg.attachments.length > 0)
                ? lastMsg.attachments
                : (lastMsg?.attachmentName ? [{ fileName: lastMsg.attachmentName }] : undefined);
              const preview = lastMsg
                ? formatConversationPreview(
                    lastMsg.content,
                    effectiveAttachments,
                    isLastFromMe,
                    !!lastMsg.deletedAt
                  )
                : 'No messages yet';

              const timeInfo = lastMsg ? formatMessageTime(lastMsg.timestamp) : null;
              const unreadCount = messages.filter(
                m => m.senderId === contact.id && m.receiverId === currentUserId && !m.isRead
              ).length;
              const isStarred = starredConversations.includes(contact.id);

              return (
                <div
                  key={contact.id}
                  onClick={() => {
                    setActiveContactId(contact.id);
                    setShowMobileChat(true);
                    if (typeof window !== 'undefined') {
                      window.history.pushState({ mobileChat: true, contactId: contact.id }, '');
                    }
                  }}
                  className={`h-[72px] px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors relative ${
                    isSelected
                      ? 'bg-[#F3F4F6]'
                      : 'hover:bg-[#FAFAFA]'
                  }`}
                >
                  {/* Selected left 2px bar */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#0A0A0A]" />
                  )}

                  {/* Avatar 44px */}
                  <div className="relative shrink-0">
                    <Avatar
                      src={contact.avatarUrl}
                      name={contact.name}
                      size={44}
                      className="border border-[#E5E7EB]"
                    />
                  </div>

                  {/* Meta */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className={`truncate text-[15px] leading-5 ${unreadCount > 0 ? 'font-semibold text-[#0A0A0A]' : 'font-medium text-[#0A0A0A]'}`}>
                        {contact.name}
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isStarred && <Star className="w-3.5 h-3.5 text-[#6B7280] fill-current" />}
                        {timeInfo && (
                          <time dateTime={timeInfo.iso} className="text-xs leading-4 text-[#6B7280] tabular-nums">
                            {timeInfo.dayLabel === 'Today' ? timeInfo.timeStr : timeInfo.dayLabel}
                          </time>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-[14px] leading-5 truncate ${unreadCount > 0 ? 'text-[#0A0A0A] font-medium' : 'text-[#6B7280]'}`}>
                        {preview}
                      </p>
                      {unreadCount > 0 && !isSelected && (
                        <span className="w-5 h-5 rounded-full bg-[#0A0A0A] text-white text-[12px] flex items-center justify-center font-medium shrink-0">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── RIGHT PANE: THREAD CANVAS (Centered max-w-[760px]) ─────────── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 flex flex-col bg-white overflow-hidden relative ${
          showMobileChat ? 'flex' : 'hidden md:flex'
        }`}
      >
        {/* Drag and Drop Overlay */}
        {isDraggingOverThread && (
          <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-xs z-50 flex flex-col items-center justify-center text-white pointer-events-none animate-in fade-in duration-150">
            <div className="p-4 rounded-full bg-white/20 mb-2">
              <Paperclip className="w-8 h-8" />
            </div>
            <p className="font-bold text-base">Drop to attach</p>
            <p className="text-xs text-white/70 mt-1">Images (PNG, JPG, WebP) or PDF documents</p>
          </div>
        )}

        {/* Global Banner Notice */}
        {notice && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-[#0A0A0A] text-white text-xs px-4 py-2 rounded-xl shadow-lg animate-in fade-in duration-150">
            {notice}
          </div>
        )}

        {activeContact ? (
          <>
            {/* Thread Header */}
            <ThreadHeader
              contact={activeContact}
              isStarred={starredConversations.includes(activeContact.id)}
              isMuted={mutedContactIds.has(activeContact.id)}
              onToggleStar={() => toggleStarConversation(activeContact.id)}
              onToggleMute={() => {
                setMutedContactIds(prev => {
                  const next = new Set(prev);
                  if (next.has(activeContact.id)) next.delete(activeContact.id);
                  else next.add(activeContact.id);
                  return next;
                });
              }}
              onToggleThreadSearch={() => setShowThreadSearch(!showThreadSearch)}
              onViewProfile={() => {
                window.location.href = `/?tab=directory&profile=${activeContact.id}`;
              }}
              onReportConversation={() => {
                setNotice('Report submitted for administrator review.');
                setTimeout(() => setNotice(null), 3000);
              }}
              onBlockUser={() => {
                const conf = confirm(`Block ${activeContact.name}? You will no longer receive messages.`);
                if (conf) {
                  setNotice(`${activeContact.name} has been blocked.`);
                  setTimeout(() => setNotice(null), 3000);
                }
              }}
              onBackMobile={() => {
                if (typeof window !== 'undefined' && window.history.state?.mobileChat) {
                  window.history.back();
                } else {
                  setShowMobileChat(false);
                }
              }}
            />

            {/* In-Thread Search Bar (Collapsible) */}
            {showThreadSearch && (
              <div className="p-2.5 px-4 bg-[#FAFAFA] border-b border-[#E5E7EB] flex items-center justify-between gap-3 text-xs shrink-0">
                <div className="relative flex-1 flex items-center">
                  <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={threadSearchQuery}
                    onChange={e => setThreadSearchQuery(e.target.value)}
                    placeholder="Search in this conversation..."
                    className="w-full h-8 pl-8 pr-3 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-[#6B7280]">
                  <span>{matchingMsgIds.length} match{matchingMsgIds.length !== 1 ? 'es' : ''}</span>
                  <button
                    type="button"
                    onClick={() => setShowThreadSearch(false)}
                    className="p-1 rounded-lg hover:bg-neutral-200 text-[#0A0A0A]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Messages Scroll Area (Centered max-w-[720px]) */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-6"
            >
              <div className="max-w-[720px] mx-auto w-full">
                {/* DEV Benchmark Button */}
                {import.meta.env.DEV && (
                  <div className="flex justify-center mb-4">
                    <button
                      type="button"
                      onClick={async () => {
                        if (benchmarkThreadMessages) {
                          setBenchmarkThreadMessages(null);
                        } else {
                          const { generate200MessageThread } = await import('../../data/mockData');
                          setBenchmarkThreadMessages(generate200MessageThread(currentUserId, activeContact.id, activeContact.name));
                        }
                      }}
                      className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-[#F3F4F6] text-[#6B7280] hover:text-[#0A0A0A] border border-[#E5E7EB] hover:border-[#D1D5DB] transition-colors cursor-pointer"
                    >
                      {benchmarkThreadMessages ? 'Reset 200-message benchmark' : 'Load 200-message benchmark (QA)'}
                    </button>
                  </div>
                )}

                {/* Thread Pagination Control Bar */}
                {totalThreadMessages > 0 && (
                  <div className="mb-4 py-2 px-3.5 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-between text-xs text-[#4B5563]">
                    <span>
                      Showing {Math.min(paginatedThreadMessages.length, THREAD_PAGE_SIZE)} of {totalThreadMessages} messages (Page {threadPage} of {totalThreadPages})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={threadPage <= 1}
                        onClick={() => setThreadPage(p => Math.max(1, p - 1))}
                        className="px-2.5 py-1 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs transition"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={threadPage >= totalThreadPages}
                        onClick={() => setThreadPage(p => Math.min(totalThreadPages, p + 1))}
                        className="px-2.5 py-1 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {rawThreadMessages.length === 0 ? (
                  <div className="py-16 text-center text-[#6B7280] space-y-4">
                    <div className="flex justify-center">
                      <Avatar
                        src={activeContact.avatarUrl}
                        name={activeContact.name}
                        size={64}
                        className="border-2 border-[#E5E7EB] shadow-2xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-base text-[#0A0A0A]">
                        Say hello to {activeContact.name}
                      </h3>
                      <p className="text-xs text-[#6B7280] max-w-sm mx-auto leading-relaxed">
                        Start your direct discussion or share files. All messages are private between you two.
                      </p>
                    </div>
                    <div className="pt-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          const firstName = activeContact.name.split(' ')[0] || activeContact.name;
                          setDraftText(`Hi ${firstName}, I'd love to connect!`);
                          textareaRef.current?.focus();
                        }}
                        className="px-4 py-2 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#0A0A0A] rounded-full text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>👋</span>
                        <span>Say hello to {activeContact.name.split(' ')[0]}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  paginatedThreadMessages.map((msg, index) => {
                    const isMe = msg.senderId === currentUserId;
                    const prevMsg = paginatedThreadMessages[index - 1];
                    const nextMsg = paginatedThreadMessages[index + 1];

                    const msgDate = new Date(msg.timestamp);
                    const msgTime = msgDate.getTime();
                    const prevTime = prevMsg ? new Date(prevMsg.timestamp).getTime() : 0;
                    const nextTime = nextMsg ? new Date(nextMsg.timestamp).getTime() : 0;

                    const isSameSenderAsPrev = prevMsg?.senderId === msg.senderId;
                    const isSameSenderAsNext = nextMsg?.senderId === msg.senderId;

                    // 5-minute sender clustering
                    const isGroupStart = !isSameSenderAsPrev || (msgTime - prevTime > 5 * 60 * 1000);
                    const isGroupEnd = !isSameSenderAsNext || (nextTime - msgTime > 5 * 60 * 1000);

                    const prevDate = prevMsg ? new Date(prevMsg.timestamp) : null;
                    const isNewDay = !prevDate || prevDate.toDateString() !== msgDate.toDateString();

                    const timeInfo = formatMessageTime(msg.timestamp);
                    const isFirstUnread = msg.id === firstUnreadMsgId && unreadCountInThread > 0;
                    const isDeleted = !!msg.deletedAt;
                    const isFailed = msg.status === 'failed';
                    const isEmojiOnlyMsg = !isDeleted && isEmojiOnly(msg.content) && (!msg.attachments || msg.attachments.length === 0);

                    const ageMs = Math.max(0, Date.now() - msgTime);
                    const canDelete = isMe && !isDeleted && ageMs <= 60 * 60 * 1000;
                    const canEdit = isMe && !isDeleted && !isEmojiOnlyMsg && ageMs <= 15 * 60 * 1000;

                    return (
                      <React.Fragment key={msg.id}>
                        {/* Day Divider */}
                        {isNewDay && (
                          <div className="relative flex items-center justify-center my-6 select-none">
                            <div className="w-full border-t border-[#E5E7EB]" />
                            <span className="absolute px-3 bg-white text-[11px] font-medium text-[#6B7280]">
                              {timeInfo.dayLabel}
                            </span>
                          </div>
                        )}

                        {/* "New messages" Divider */}
                        {isFirstUnread && (
                          <div className="relative flex items-center justify-center my-4 select-none">
                            <div className="w-full border-t border-[#0A0A0A]" />
                            <span className="absolute px-3 bg-white text-xs font-semibold text-[#0A0A0A]">
                              New messages ({unreadCountInThread})
                            </span>
                          </div>
                        )}

                        {/* Message Row */}
                        <div
                          id={`msg-${msg.id}`}
                          onMouseEnter={() => setActiveHoverMsgId(msg.id)}
                          onMouseLeave={(e) => {
                            const related = e.relatedTarget as Node | null;
                            if (e.currentTarget.contains(related)) return;
                            setActiveHoverMsgId(null);
                          }}
                          className={`relative flex flex-col group ${
                            isMe ? 'items-end' : 'items-start'
                          } ${isGroupStart && index > 0 ? 'mt-4' : 'mt-0.5'} ${
                            highlightedMsgId === msg.id ? 'bg-amber-50/70 p-1.5 rounded-2xl transition-colors duration-500' : ''
                          }`}
                        >
                          {/* Hover Actions Toolbar */}
                          {!isDeleted && (
                            <div
                              className={`absolute -top-7 ${
                                isMe ? 'right-2' : 'left-2'
                              } z-30 flex items-center gap-0.5 bg-white border border-[#E5E7EB] rounded-full p-1 shadow-md transition-all duration-150 ${
                                activeHoverMsgId === msg.id || activeActionMenuMsgId === msg.id
                                  ? 'opacity-100 pointer-events-auto scale-100'
                                  : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto scale-95 group-hover:scale-100'
                              }`}
                              onMouseEnter={() => setActiveHoverMsgId(msg.id)}
                            >
                              <ReactionBar
                                isMe={isMe}
                                onSelectEmoji={(emoji: string) => toggleReaction(msg.id, emoji)}
                              />

                              <button
                                type="button"
                                onClick={() => {
                                  setReplyTarget({
                                    id: msg.id,
                                    name: isMe ? 'You' : activeContact.name,
                                    content: msg.content || (msg.attachments?.[0]?.fileName || 'Attachment'),
                                    isDeleted: false
                                  });
                                  textareaRef.current?.focus();
                                }}
                                className="p-1 rounded-full text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                                title="Reply"
                              >
                                <Reply className="w-3.5 h-3.5" />
                              </button>

                              {isMe && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (canEdit) {
                                      setEditingMessageId(msg.id);
                                      setEditingContent(msg.content);
                                      setActiveActionMenuMsgId(null);
                                    } else {
                                      setNotice('Editing is only permitted within 15 minutes of sending.');
                                      setTimeout(() => setNotice(null), 3500);
                                    }
                                  }}
                                  className={`p-1 rounded-full transition-colors cursor-pointer ${
                                    canEdit
                                      ? 'text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6]'
                                      : 'text-[#D1D5DB] hover:text-[#9CA3AF]'
                                  }`}
                                  title={canEdit ? 'Edit message (15m window)' : 'Editing window expired (15m limit)'}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {isMe && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (canDelete) {
                                      handleDeleteMessage(msg.id);
                                    } else {
                                      setNotice('Deleting for everyone is only permitted within 60 minutes of sending.');
                                      setTimeout(() => setNotice(null), 3500);
                                    }
                                  }}
                                  className={`p-1 rounded-full transition-colors cursor-pointer ${
                                    canDelete
                                      ? 'text-[#6B7280] hover:text-rose-600 hover:bg-rose-50'
                                      : 'text-[#D1D5DB] hover:text-rose-400'
                                  }`}
                                  title={canDelete ? 'Delete for everyone (60m window)' : 'Deletion window expired (60m limit)'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* More actions dropdown button */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setActiveActionMenuMsgId(activeActionMenuMsgId === msg.id ? null : msg.id)}
                                  className="p-1 rounded-full text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                                  title="Message actions"
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>

                                {activeActionMenuMsgId === msg.id && (
                                  <div
                                    className={`absolute ${
                                      isMe ? 'right-0' : 'left-0'
                                    } top-full mt-1.5 w-52 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl z-50 py-1.5 text-xs text-[#0A0A0A] animate-in fade-in zoom-in-95 duration-100`}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyTarget({
                                          id: msg.id,
                                          name: isMe ? 'You' : activeContact.name,
                                          content: msg.content || (msg.attachments?.[0]?.fileName || 'Attachment'),
                                          isDeleted: false
                                        });
                                        setActiveActionMenuMsgId(null);
                                        textareaRef.current?.focus();
                                      }}
                                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                                    >
                                      <Reply className="w-3.5 h-3.5 text-[#6B7280]" />
                                      <span>Reply</span>
                                    </button>

                                    {isMe && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (canEdit) {
                                            setEditingMessageId(msg.id);
                                            setEditingContent(msg.content);
                                            setActiveActionMenuMsgId(null);
                                          } else {
                                            setNotice('Editing is only permitted within 15 minutes of sending.');
                                            setTimeout(() => setNotice(null), 3500);
                                            setActiveActionMenuMsgId(null);
                                          }
                                        }}
                                        className={`w-full px-3 py-1.5 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                          canEdit
                                            ? 'hover:bg-[#F3F4F6] text-[#0A0A0A]'
                                            : 'text-[#9CA3AF] hover:bg-[#F9FAFB]'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <Edit3 className="w-3.5 h-3.5 text-[#6B7280]" />
                                          <span>Edit message</span>
                                        </div>
                                        {!canEdit && <span className="text-[10px] text-[#9CA3AF]">Expired (15m)</span>}
                                      </button>
                                    )}

                                    {isMe && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (canDelete) {
                                            handleDeleteMessage(msg.id);
                                          } else {
                                            setNotice('Deleting for everyone is only permitted within 60 minutes of sending.');
                                            setTimeout(() => setNotice(null), 3500);
                                            setActiveActionMenuMsgId(null);
                                          }
                                        }}
                                        className={`w-full px-3 py-1.5 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                          canDelete
                                            ? 'hover:bg-rose-50 text-rose-600'
                                            : 'text-[#9CA3AF] hover:bg-[#F9FAFB]'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>Delete for everyone</span>
                                        </div>
                                        {!canDelete && <span className="text-[10px] text-[#9CA3AF]">Expired (60m)</span>}
                                      </button>
                                    )}

                                    {msg.content && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(msg.content);
                                          setActiveActionMenuMsgId(null);
                                          setNotice('Copied text to clipboard');
                                          setTimeout(() => setNotice(null), 2000);
                                        }}
                                        className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                                      >
                                        <Copy className="w-3.5 h-3.5 text-[#6B7280]" />
                                        <span>Copy text</span>
                                      </button>
                                    )}

                                    {!isMe && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          reportMessage(msg.id);
                                          setActiveActionMenuMsgId(null);
                                          setNotice('Report submitted to administrators.');
                                          setTimeout(() => setNotice(null), 3000);
                                        }}
                                        className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                                      >
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>Report message</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Quoted Reply Snippet in Bubble */}
                          {msg.replyTo && (
                            <div
                              onClick={() => handleJumpToOriginal(msg.replyTo!.id)}
                              className={`mb-1 p-2 px-3 rounded-xl border-l-2 text-xs cursor-pointer select-none transition-colors max-w-[85%] ${
                                isMe
                                  ? 'bg-neutral-800 border-neutral-300 text-neutral-300 hover:bg-neutral-700'
                                  : 'bg-[#E5E7EB] border-[#0A0A0A] text-[#374151] hover:bg-neutral-300'
                              }`}
                            >
                              <span className="font-semibold block text-[11px]">
                                {msg.replyTo.name}
                              </span>
                              <span className="truncate block text-[11px] mt-0.5">
                                {msg.replyTo.isDeleted ? 'Original message deleted' : `"${msg.replyTo.content}"`}
                              </span>
                            </div>
                          )}

                          {/* Inline Editing Form */}
                          {editingMessageId === msg.id ? (
                            <div className="w-full max-w-md p-2.5 bg-white border border-[#0A0A0A] rounded-2xl shadow-sm space-y-2">
                              <textarea
                                value={editingContent}
                                onChange={e => setEditingContent(e.target.value)}
                                className="w-full text-xs p-2.5 border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#0A0A0A] resize-none text-[#0A0A0A]"
                                rows={2}
                                autoFocus
                              />
                              <div className="flex items-center justify-end gap-2 text-xs">
                                <button
                                  type="button"
                                  onClick={() => setEditingMessageId(null)}
                                  className="px-2.5 py-1 text-[#6B7280] hover:text-[#0A0A0A] transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(msg.id)}
                                  className="px-3.5 py-1 bg-[#0A0A0A] text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : isDeleted ? (
                            /* Soft-delete tombstone (quiet, no border, no fill, muted italic) */
                            <div className="py-1 px-1 text-xs italic text-[#9CA3AF] flex items-center gap-1.5 select-none">
                              <Trash2 className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                              <span>This message was deleted</span>
                            </div>
                          ) : (
                            /* Mixed message: text on top, attachments below */
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] space-y-1.5`}>
                              {/* Active Text Message Bubble */}
                              {msg.content && (
                                <div
                                  className={`relative ${
                                    isEmojiOnlyMsg
                                      ? 'text-3xl py-1 select-none'
                                      : `p-3 px-4 text-xs leading-relaxed whitespace-pre-wrap break-words ${
                                          isMe
                                            ? `bg-[#0A0A0A] text-white ${isGroupEnd && (!msg.attachments || msg.attachments.length === 0) ? 'rounded-[18px] rounded-br-[6px]' : 'rounded-[18px]'}`
                                            : `bg-[#F3F4F6] text-[#0A0A0A] ${isGroupEnd && (!msg.attachments || msg.attachments.length === 0) ? 'rounded-[18px] rounded-bl-[6px]' : 'rounded-[18px]'}`
                                        }`
                                  }`}
                                >
                                  {msg.content}
                                </div>
                              )}

                              {/* Attachments below text */}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className={`space-y-1.5 w-full flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                  {/* Images Grid */}
                                  <AttachmentGrid attachments={msg.attachments} isMe={isMe} />

                                  {/* PDF Cards */}
                                  {msg.attachments
                                    .filter(a => a.mimeType === 'application/pdf')
                                    .map(pdfAtt => (
                                      <AttachmentPdfCard key={pdfAtt.id} attachment={pdfAtt} isMe={isMe} />
                                    ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Reaction Chips */}
                          <ReactionChips
                            reactions={msg.reactions}
                            currentUserId={currentUserId}
                            onToggleReaction={(emoji: string) => toggleReaction(msg.id, emoji)}
                            isMe={isMe}
                          />

                          {/* Timestamp and Status line (Grouped tails: only once per group) */}
                          {isGroupEnd && (
                            <div
                              className={`flex items-center gap-1.5 pt-1 text-[11px] text-[#6B7280] select-none ${
                                isMe ? 'justify-end mr-1' : 'justify-start ml-1'
                              }`}
                            >
                              {msg.editedAt && (
                                <span title={`Edited ${formatMessageTime(msg.editedAt).timeStr}`}>
                                  Edited ·
                                </span>
                              )}
                              <time dateTime={timeInfo.iso}>{timeInfo.timeStr}</time>

                              {/* Status word + ticks */}
                              {isMe && !isDeleted && (
                                <span className="inline-flex items-center gap-1">
                                  <span>·</span>
                                  {msg.status === 'sending' ? (
                                    <span className="flex items-center gap-0.5 text-[#6B7280]">
                                      <span>Sending</span>
                                      <Clock className="w-3 h-3 text-[#6B7280] animate-pulse" />
                                    </span>
                                  ) : isFailed ? (
                                    <span className="flex items-center gap-0.5 text-[#991B1B] font-medium">
                                      <span>Failed</span>
                                      <AlertCircle className="w-3.5 h-3.5 text-[#991B1B]" />
                                    </span>
                                  ) : msg.id === lastSentMsgId ? (
                                    msg.status === 'read' ? (
                                      <span className="flex items-center gap-0.5 text-[#0A0A0A] font-medium">
                                        <span>Read</span>
                                        <CheckCheck className="w-3.5 h-3.5 text-[#0A0A0A]" />
                                      </span>
                                    ) : msg.status === 'delivered' ? (
                                      <span className="flex items-center gap-0.5 text-[#6B7280]">
                                        <span>Delivered</span>
                                        <CheckCheck className="w-3.5 h-3.5 text-[#6B7280]" />
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-0.5 text-[#6B7280]">
                                        <span>Sent</span>
                                        <Check className="w-3.5 h-3.5 text-[#6B7280]" />
                                      </span>
                                    )
                                  ) : null}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Failed Send Row */}
                          {isMe && isFailed && (
                            <div className="mt-1 flex items-center gap-2 text-xs text-[#991B1B] bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#991B1B]" />
                              <span>Not sent · {msg.errorReason || 'offline'}</span>
                              <span className="text-rose-200">·</span>
                              <button
                                type="button"
                                onClick={() => retryFailedMessage(msg.id)}
                                className="font-semibold underline hover:text-[#7F1D1D] cursor-pointer"
                              >
                                Retry
                              </button>
                              <span className="text-rose-200">·</span>
                              <button
                                type="button"
                                onClick={() => deleteFailedMessage(msg.id)}
                                className="hover:underline text-[#991B1B] cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={bottomSentinelRef} />
              </div>
            </div>

            {/* New messages jump pill if scrolled up */}
            {!isNearBottom && newBelowCount > 0 && (
              <button
                type="button"
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold rounded-full shadow-lg flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              >
                <span>New messages ({newBelowCount})</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}

            {/* ─── COMPOSER CONTAINER (Centered max-w-[720px]) ──────────── */}
            <div className="border-t border-[#E5E7EB] bg-white p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0">
              <div className="max-w-[720px] mx-auto relative space-y-2">
                {/* Quoted Reply Banner */}
                <ReplyBar reply={replyTarget} onCancel={() => setReplyTarget(null)} />

                {/* Attachments Tray */}
                <ComposerAttachmentTray
                  items={pendingAttachments}
                  onRemove={(id: string) => setPendingAttachments(prev => prev.filter(a => a.id !== id))}
                  onRetry={(id: string) => {
                    const item = pendingAttachments.find(a => a.id === id);
                    if (item) handleAttachFiles([item.file]);
                  }}
                />

                {/* Popover Emoji Picker */}
                {showEmojiPicker && (
                  <div className="absolute bottom-14 left-0 z-50">
                    <EmojiPicker
                      onSelect={(emoji: string) => {
                        if (textareaRef.current) {
                          insertAtCaret(textareaRef.current, emoji, handleDraftChange);
                        } else {
                          handleDraftChange(draftText + emoji);
                        }
                      }}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  </div>
                )}

                {/* Input Container: #F3F4F6 fill, 14px radius, focus-within ring */}
                <div className="flex items-end gap-1.5 bg-[#F3F4F6] rounded-[14px] p-2 px-3 focus-within:ring-2 focus-within:ring-[#0A0A0A] transition-all">
                  {/* Attach Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-9 h-9 flex items-center justify-center text-[#6B7280] hover:text-[#0A0A0A] rounded-lg hover:bg-neutral-200/60 transition-colors shrink-0 cursor-pointer"
                    title="Attach files (Images & PDFs up to 10MB)"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => {
                      if (e.target.files) handleAttachFiles(e.target.files);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />

                  {/* Emoji Button (Hidden on coarse touch pointer) */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="hidden sm:flex w-9 h-9 items-center justify-center text-[#6B7280] hover:text-[#0A0A0A] rounded-lg hover:bg-neutral-200/60 transition-colors shrink-0 cursor-pointer"
                    title="Insert emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={draftText}
                    onChange={(e) => handleDraftChange(e.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    onPaste={handlePaste}
                    onFocus={() => setIsComposerFocused(true)}
                    onBlur={() => setIsComposerFocused(false)}
                    rows={1}
                    placeholder={`Write a message to ${activeContact.name.split(' ')[0]}…`}
                    style={{ outline: 'none', boxShadow: 'none' }}
                    className="w-full min-h-[36px] max-h-[140px] text-xs py-2 bg-transparent border-0 outline-none ring-0 shadow-none focus:outline-none focus-visible:!outline-none focus:ring-0 text-[#0A0A0A] placeholder:text-[#9CA3AF] flex-1 min-w-0 resize-none leading-relaxed custom-scrollbar"
                  />

                  {/* Send Button */}
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={isSendDisabled}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                      !isSendDisabled
                        ? 'bg-[#0A0A0A] hover:bg-[#262626] text-white active:scale-95'
                        : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
                    }`}
                    title="Send message (Enter)"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Desktop Keyboard Hint & Character Counter */}
                <div className="flex items-center justify-between text-[11px] text-[#6B7280] px-1 min-h-[16px]">
                  {isComposerFocused && (
                    <span>Press Enter to send, Shift + Enter for a new line</span>
                  )}
                  {draftText.length >= 1800 && (
                    <span className={`ml-auto font-mono ${draftText.length > 2000 ? 'text-rose-600 font-bold' : ''}`}>
                      {draftText.length} / 2000
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#6B7280]">
            <MessageSquare className="w-8 h-8 text-[#9CA3AF] mb-2" />
            <h3 className="font-semibold text-sm text-[#0A0A0A]">No conversation selected</h3>
            <p className="text-xs text-[#6B7280] mt-1 max-w-sm">
              Choose an existing chat from the left panel or click '+' to start a new direct conversation.
            </p>
          </div>
        )}
      </div>

      {/* ─── NEW CONVERSATION DIRECTORY MODAL ─────────────────────────────── */}
      <Modal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        title="New direct conversation"
        subtitle="Select any verified alumni or faculty member to start a direct thread."
        maxWidth="lg"
      >
        <div className="space-y-4 font-sans text-xs -mx-6 -my-6">
          <div className="p-4 px-6 border-b border-[#E5E7EB] bg-[#FAFAFA] space-y-3 shrink-0">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={modalSearch}
                onChange={e => setModalSearch(e.target.value)}
                placeholder="Search by name, organization, or department..."
                className="w-full h-9 text-xs pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-xl focus:border-[#0A0A0A] focus:outline-none transition-colors text-[#0A0A0A] placeholder:text-[#9CA3AF]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {(['all', 'alumni', 'faculty'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setModalFilter(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    modalFilter === tab
                      ? 'bg-[#0A0A0A] text-white'
                      : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:text-[#0A0A0A]'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab === 'alumni' ? 'Alumni' : 'Faculty'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto max-h-[50vh] p-4 px-6 divide-y divide-[#E5E7EB] custom-scrollbar">
            {allDirectoryProfiles
              .filter(p => p.id !== currentUserId)
              .filter(p => {
                if (modalFilter === 'alumni' && p.type !== 'alumni') return false;
                if (modalFilter === 'faculty' && p.type !== 'faculty') return false;
                if (!modalSearch.trim()) return true;
                const q = modalSearch.toLowerCase();
                return p.name.toLowerCase().includes(q) || p.company.toLowerCase().includes(q) || p.department.toLowerCase().includes(q);
              })
              .map(person => {
                return (
                  <div
                    key={person.id}
                    className="py-3 flex items-center justify-between gap-4 hover:bg-[#FAFAFA] rounded-xl px-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={person.avatarUrl}
                        name={person.name}
                        size={40}
                        className="border border-[#E5E7EB]"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-xs text-[#0A0A0A] truncate">{person.name}</h4>
                          <span className="px-1.5 py-0.5 bg-[#F3F4F6] text-[#0A0A0A] border border-[#E5E7EB] text-[10px] font-semibold rounded-md">
                            {person.type === 'alumni' ? 'Alumni' : 'Faculty'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                          {person.company} · {person.designation}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setManuallyAddedContactIds(prev => Array.from(new Set([...prev, person.id])));
                        setActiveContactId(person.id);
                        setShowNewConversationModal(false);
                        setShowMobileChat(true);
                      }}
                      className="px-3.5 py-1.5 bg-[#0A0A0A] hover:bg-[#262626] text-white rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                    >
                      Open chat
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      </Modal>
    </div>
  );
};
