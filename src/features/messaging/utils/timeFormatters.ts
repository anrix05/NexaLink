/**
 * NexaLink Messaging v2 - Timestamp and Kind-Aware Formatters
 * Strict sentence case, non-padded hours ("2:30 pm" instead of "02:30 pm").
 */

export function formatMessageTime(dateInput: string | Date | number): {
  timeStr: string;
  dayLabel: string;
  iso: string;
} {
  let date: Date;
  if (typeof dateInput === 'string') {
    if (!dateInput.endsWith('Z') && !dateInput.includes('+')) {
      const formatted = dateInput.replace(' ', 'T');
      const withZ = formatted.split(':').length === 2 ? `${formatted}:00Z` : `${formatted}Z`;
      const parsedUtc = new Date(withZ);
      date = isNaN(parsedUtc.getTime()) ? new Date(dateInput) : parsedUtc;
    } else {
      date = new Date(dateInput);
    }
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) {
    return { timeStr: '', dayLabel: '', iso: '' };
  }

  const iso = date.toISOString();

  // Format hour:minute without leading zero on hour
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour should be 12
  const timeStr = `${hours}:${minutes} ${ampm}`;

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  let dayLabel = '';
  if (isToday) {
    dayLabel = 'Today';
  } else if (isYesterday) {
    dayLabel = 'Yesterday';
  } else {
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7 && diffDays > 0) {
      dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      dayLabel = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
  }

  return { timeStr, dayLabel, iso };
}

/**
 * Kind-aware message preview generator for conversation list
 */
export function formatConversationPreview(
  content: string,
  attachments?: { mimeType?: string; fileName?: string }[],
  isMe?: boolean,
  isDeleted?: boolean
): string {
  if (isDeleted) {
    return 'Message deleted';
  }

  if (attachments && attachments.length > 0) {
    const first = attachments[0];
    if (first.mimeType?.startsWith('image/')) {
      const more = attachments.length > 1 ? ` (+${attachments.length - 1})` : '';
      return isMe ? `You: Photo${more}` : `Photo${more}`;
    }
    if (first.mimeType === 'application/pdf') {
      const name = first.fileName || 'document.pdf';
      return isMe ? `You: PDF · ${name}` : `PDF · ${name}`;
    }
    const name = first.fileName || 'Attachment';
    return isMe ? `You: ${name}` : name;
  }

  if (content && content.trim().length > 0) {
    return isMe ? `You: ${content}` : content;
  }

  return 'No messages yet';
}
