// One open conversation: history, live messages, sending and retry.
import { config } from '../../../config/app.js';
import { h, icon, replace, toast } from '../../core/dom.js';
import { openSearch } from './search.js';
import { dayLabel, sameDay } from '../../core/format.js';
import { preparePhoto } from '../../core/image.js';
import { avatar } from '../ui/avatar.js';
import { createComposer } from './composer.js';
import { messageView } from './message.js';

export function createThread({ backend, me, people, onBack, onActivity }) {
  const byId = new Map(people.map((p) => [p.id, p]));
  const list = h('div', { class: 'msgs', role: 'log', 'aria-live': 'polite' });
  const head = h('header', { class: 'thread-head' });
  const typingLine = h('div', { class: 'typing', 'aria-live': 'polite' });
  let lastTypingSent = 0;
  const composer = createComposer({
    onSend: send,
    onTyping: () => {
      if (!conv?.id || Date.now() - lastTypingSent < 2000) return;
      lastTypingSent = Date.now();
      backend.sendTyping(conv.id, me.id);
    },
  });
  const element = h('section', { class: 'thread' }, head, list, typingLine, composer.element);
  const reactions = new Map();
  let typingTimer;
  let conv = null;
  let items = [];
  let hasMore = false;
  let loadingOlder = false;

  list.addEventListener('scroll', () => { if (list.scrollTop < 80) loadOlder(); });

  function render() {
    const nodes = [];
    items.forEach((item, i) => {
      const prev = items[i - 1];
      const newDay = !prev || !sameDay(prev.message.created_at, item.message.created_at);
      if (newDay) nodes.push(h('div', { class: 'day' }, dayLabel(item.message.created_at)));
      const first = newDay || prev.message.sender_id !== item.message.sender_id;
      nodes.push(messageView({
        message: item.message, sender: byId.get(item.message.sender_id),
        mine: item.message.sender_id === me.id, first, status: item.status, backend,
        onRetry: () => deliver(item),
        reactions: reactions.get(item.message.id) || [], myId: me.id, isNew: item.fresh,
        onToggleReaction: (emoji) => toggleReaction(item.message.id, emoji),
      }));
      item.fresh = false;
    });
    const top = list.scrollTop;
    replace(list, nodes);
    list.scrollTop = top;
  }

  async function loadReactions(ids) {
    if (!ids.length) return;
    const rows = await backend.listReactions(ids);
    ids.forEach((id) => reactions.delete(id));
    rows.forEach((r) => reactions.set(r.message_id, [...(reactions.get(r.message_id) || []), r]));
    render();
  }

  async function toggleReaction(messageId, emoji) {
    const current = reactions.get(messageId) || [];
    const mine = current.some((r) => r.user_id === me.id && r.emoji === emoji);
    reactions.set(messageId, mine
      ? current.filter((r) => !(r.user_id === me.id && r.emoji === emoji))
      : [...current, { message_id: messageId, user_id: me.id, emoji }]);
    render();
    try {
      await (mine ? backend.removeReaction(messageId, me.id, emoji) : backend.addReaction(messageId, emoji));
      backend.sendReactionPing(messageId);
    } catch (error) {
      console.error(error);
      toast('התגובה לא נשמרה. נסו שוב.');
      loadReactions([messageId]);
    }
  }

  function showTyping(conversationId, userId) {
    if (conversationId !== conv?.id || userId === me.id) return;
    typingLine.textContent = `${byId.get(userId)?.name || 'בן משפחה'} באמצע לכתוב…`;
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => { typingLine.textContent = ''; }, 3500);
  }

  function reactionChanged(messageId) {
    if (items.some((i) => i.message.id === messageId)) loadReactions([messageId]);
  }

  const toBottom = () => { list.scrollTop = list.scrollHeight; };

  async function open(target) {
    conv = target;
    const person = target.person;
    replace(head,
      h('button', { class: 'icon-btn back-btn', 'aria-label': 'חזרה לשיחות', onclick: onBack }, icon('back')),
      avatar(person || { id: 'family', name: '♥' }, 40),
      h('div', { class: 'thread-title' }, h('h2', {}, target.title), h('div', { class: 'thread-sub' }, person ? 'שיחה פרטית' : `${people.length} בני משפחה`)),
      h('button', { class: 'icon-btn', 'aria-label': 'חיפוש בשיחה', onclick: () => conv?.id && openSearch({ backend, conversationId: conv.id, nameOf: (id) => byId.get(id)?.name || 'בן משפחה' }) }, icon('search')));
    items = []; typingLine.textContent = ''; render();
    if (!conv.id) conv.id = await backend.openDirect(person.id);
    const openedId = conv.id;
    const rows = await backend.listMessages(openedId);
    if (conv.id !== openedId) return;
    items = rows.map((message) => ({ message }));
    hasMore = rows.length === config.pageSize;
    render(); toBottom();
    loadReactions(rows.map((m) => m.id)).then(toBottom).catch(console.error);
    backend.markRead(openedId).then(onActivity);
  }

  async function loadOlder() {
    if (!hasMore || loadingOlder || !items.length) return;
    loadingOlder = true;
    const openedId = conv.id;
    const rows = await backend.listMessages(openedId, items[0].message.created_at);
    if (conv.id === openedId) {
      const fromBottom = list.scrollHeight - list.scrollTop;
      items = [...rows.map((message) => ({ message })), ...items];
      hasMore = rows.length === config.pageSize;
      render();
      list.scrollTop = list.scrollHeight - fromBottom;
      loadReactions(rows.map((m) => m.id)).catch(console.error);
    }
    loadingOlder = false;
  }

  async function deliver(item) {
    item.status = 'sending'; render(); toBottom();
    try {
      if (item.file && !item.message.attachment_path) {
        const prepared = await preparePhoto(item.file).catch(() => item.file);
        item.message.attachment_path = await backend.uploadAttachment(conv.id, prepared);
        Object.assign(item.message, { attachment_name: prepared.name, attachment_type: prepared.type, attachment_size: prepared.size });
      }
      const { localUrl, created_at, ...row } = item.message;
      const saved = await backend.sendMessage(row);
      item.message = { ...saved, localUrl };
      item.status = undefined; item.file = undefined;
      onActivity();
    } catch (error) {
      console.error(error);
      item.status = 'failed';
    }
    render(); toBottom();
  }

  function send({ body, file }) {
    if (!conv?.id) return;
    const message = {
      id: crypto.randomUUID(), conversation_id: conv.id, sender_id: me.id, body,
      created_at: new Date().toISOString(),
    };
    if (file?.type.startsWith('image/')) message.localUrl = URL.createObjectURL(file);
    if (file) Object.assign(message, { attachment_name: file.name, attachment_type: file.type, attachment_size: file.size });
    const item = { message, file, fresh: true };
    items.push(item);
    deliver(item);
  }

  function receive(message) {
    if (message.conversation_id !== conv?.id || items.some((i) => i.message.id === message.id)) return;
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 200;
    items.push({ message, fresh: true }); typingLine.textContent = ''; render();
    if (nearBottom) toBottom();
    backend.markRead(conv.id).then(onActivity);
  }

  return { element, open, receive, showTyping, reactionChanged, currentId: () => conv?.id };
}
