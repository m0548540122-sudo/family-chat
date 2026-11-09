// Draws one message. Text is inserted only as text, and only safe image types are shown inline.
import { quickReactions } from '../../../config/emojis.js';
import { h, icon } from '../../core/dom.js';
import { fileSize, isPhoto, splitLinks, time } from '../../core/format.js';
import { avatar } from '../ui/avatar.js';

function attachment(message, backend) {
  if (!message.attachment_path) return null;
  if (isPhoto(message.attachment_type)) {
    const img = h('img', { class: 'photo', alt: message.attachment_name || 'תמונה' });
    if (message.localUrl) img.src = message.localUrl;
    else {
      message.signedUrl ??= backend.attachmentUrl(message.attachment_path);
      message.signedUrl.then((url) => { img.src = url; }).catch(() => { img.alt = 'לא ניתן לטעון את התמונה'; });
    }
    return img;
  }
  return h('a', {
    class: 'file-chip', href: '#',
    onclick: async (event) => {
      event.preventDefault();
      window.open(await backend.attachmentUrl(message.attachment_path, message.attachment_name), '_blank', 'noopener');
    },
  }, icon('file'), h('span', {}, message.attachment_name, h('small', {}, fileSize(message.attachment_size))));
}

function bodyNode(text) {
  if (!text) return null;
  return h('div', { class: 'body' }, splitLinks(text).map(({ value, link }) =>
    link ? h('a', { href: value, target: '_blank', rel: 'noopener noreferrer' }, value) : value));
}

function reactionsRow(reactions, myId, onToggle) {
  if (!reactions.length) return null;
  const grouped = new Map();
  for (const r of reactions) grouped.set(r.emoji, [...(grouped.get(r.emoji) || []), r.user_id]);
  return h('div', { class: 'reactions' }, [...grouped].map(([emoji, users]) => h('button', {
    class: `reaction ${users.includes(myId) ? 'on' : ''}`,
    'aria-label': `${emoji} ${users.length}`,
    onclick: () => onToggle(emoji),
  }, emoji, users.length > 1 && h('span', {}, users.length))));
}

function reactionMenu(onToggle) {
  const menu = h('div', { class: 'react-menu', hidden: true }, quickReactions.map((emoji) =>
    h('button', { 'aria-label': emoji, onclick: () => { menu.hidden = true; onToggle(emoji); } }, emoji)));
  const open = h('button', { class: 'react-open', 'aria-label': 'הוספת תגובה', onclick: () => { menu.hidden = !menu.hidden; } }, icon('smile'));
  return h('div', { class: 'react-wrap' }, open, menu);
}

export function messageView({ message, sender, mine, first, status, backend, onRetry, reactions = [], myId, onToggleReaction, isNew }) {
  const classes = ['msg', mine && 'mine', first && 'first', status === 'failed' && 'failed', isNew && 'new'].filter(Boolean).join(' ');
  const meta = status === 'sending' ? 'שולח…'
    : status === 'failed' ? h('button', { class: 'retry', onclick: onRetry }, 'לא נשלח. לנסות שוב')
      : time(message.created_at);
  return h('div', { class: classes, 'data-id': message.id },
    !mine && h('div', { class: 'avatar-slot' }, first && avatar(sender, 34)),
    h('div', { class: 'bubble' },
      !mine && first && h('div', { class: 'sender' }, sender?.name || 'בן משפחה'),
      attachment(message, backend), bodyNode(message.body),
      h('div', { class: 'meta' }, meta),
      reactionsRow(reactions, myId, onToggleReaction)),
    !status && reactionMenu(onToggleReaction));
}
