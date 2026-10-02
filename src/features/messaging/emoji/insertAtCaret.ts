/**
 * NexaLink Messaging v2 - Caret Text & Emoji Insertion Utility
 * Inserts unicode emoji at cursor position and restores focus cleanly.
 */

export function insertAtCaret(
  textarea: HTMLTextAreaElement,
  textToInsert: string,
  onTextChange: (newText: string) => void
): void {
  const startPos = textarea.selectionStart ?? textarea.value.length;
  const endPos = textarea.selectionEnd ?? textarea.value.length;
  const original = textarea.value;

  const nextText =
    original.substring(0, startPos) + textToInsert + original.substring(endPos);

  onTextChange(nextText);

  // Restore cursor immediately after inserted text on next tick
  requestAnimationFrame(() => {
    textarea.focus();
    const newPos = startPos + textToInsert.length;
    textarea.setSelectionRange(newPos, newPos);
  });
}
