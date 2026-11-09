// In-memory stand-in for checking the interface on this computer only. Never loads online.
import { config } from '../../config/app.js';

export function createPracticeBackend() {
  const ago = (min) => new Date(Date.now() - min * 60000).toISOString();
  const me = { id: 'p1', email: 'parent@example.test', name: 'אבא', avatar_url: null, is_owner: true };
  const people = [me,
    { id: 'p2', email: 'ima@example.test', name: 'אמא', avatar_url: null },
    { id: 'p3', email: 'noa@example.test', name: 'נועה', avatar_url: null },
    { id: 'p4', email: 'yoni@example.test', name: 'יוני', avatar_url: null }];
  const family = config.familyConversationId;
  const messages = [
    ['p2', 'בוקר טוב לכולם! מי חוזר הביתה לארוחת ערב?', 1500],
    ['p3', 'אני! אפשר פשטידה?', 1490],
    ['p1', 'אני מביא לחם טרי בדרך', 62],
    ['p4', 'מעולה, אני מגיע בשבע', 40],
    ['p2', 'תודה יקירים, מחכה לכם', 12],
  ].map(([sender_id, body, min], i) => ({ id: `m${i}`, conversation_id: family, sender_id, body, created_at: ago(min) }));
  const allowed = people.map((p) => ({ email: p.email, display_name: p.name, is_owner: p.is_owner === true, blocked: false }));
  const reactions = [{ message_id: 'm1', user_id: 'p2', emoji: '❤️' }];
  let listener = () => {};
  const delay = (value) => new Promise((done) => setTimeout(() => done(value), 60));
  const directs = new Map();

  return {
    getUser: () => delay({ id: me.id }),
    signIn() {}, signOut: () => delay(location.reload()),
    bootstrap: () => delay(me),
    listPeople: () => delay(people),
    listConversations() {
      const row = (id, kind, other_id) => {
        const last = messages.filter((m) => m.conversation_id === id).at(-1);
        return { id, kind, other_id, last_body: last?.body, last_at: last?.created_at, last_sender: last?.sender_id, unread: 0 };
      };
      return delay([row(family, 'family', null), ...[...directs].map(([o, id]) => row(id, 'direct', o))]);
    },
    openDirect(other) { if (!directs.has(other)) directs.set(other, `d-${other}`); return delay(directs.get(other)); },
    markRead: () => delay(),
    listMessages: (id, before) => delay(before ? [] : messages.filter((m) => m.conversation_id === id)),
    sendMessage(message) {
      const saved = { ...message, sender_id: me.id, created_at: new Date().toISOString() };
      messages.push(saved);
      setTimeout(() => listener(saved), 30);
      return delay(saved);
    },
    uploadAttachment: (conv, file) => { practiceFiles.set(`${conv}/${file.name}`, URL.createObjectURL(file)); return delay(`${conv}/${file.name}`); },
    attachmentUrl: (path) => delay(practiceFiles.get(path)),
    subscribeMessages(cb) { listener = cb; return () => {}; },
    joinPresence(id, cb) { cb(new Set(['p1', 'p2', 'p4'])); },
    joinLive() {}, sendTyping() {}, sendReactionPing() {},
    listReactions: (ids) => delay(reactions.filter((r) => ids.includes(r.message_id))),
    addReaction(message_id, emoji) { reactions.push({ message_id, user_id: me.id, emoji }); return delay(); },
    removeReaction(message_id, user_id, emoji) { reactions.splice(reactions.findIndex((r) => r.message_id === message_id && r.user_id === user_id && r.emoji === emoji), 1); return delay(); },
    searchMessages: (id, text) => delay(messages.filter((m) => m.conversation_id === id && m.body.includes(text))),
    updateName(id, name) { me.name = name; return delay(); },
    listAllowed: () => delay(allowed),
    addAllowed(email, display_name) { allowed.push({ email, display_name, is_owner: false, blocked: false }); return delay(); },
    setBlocked(email, blocked) { allowed.find((a) => a.email === email).blocked = blocked; return delay(); },
    removeAllowed(email) { allowed.splice(allowed.findIndex((a) => a.email === email), 1); return delay(); },
  };
}

const practiceFiles = new Map();
