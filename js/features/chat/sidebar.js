// The list of the family room and one private chat per family member.
import { config } from '../../../config/app.js';
import { h, icon, replace } from '../../core/dom.js';
import { shortWhen } from '../../core/format.js';
import { avatar } from '../ui/avatar.js';
import { createHouse } from '../house/house.js';

export function createSidebar({ me, people, onOpen, onSettings, onAdmin }) {
  const house = createHouse({ slice: 'xMidYMid', members: people.length });
  const list = h('nav', { class: 'convs', 'aria-label': 'שיחות' });
  const element = h('aside', { class: 'side' },
    h('div', { class: 'side-banner' }, house.element, h('h1', {}, config.appName),
      h('div', { class: 'side-top' },
        me.is_owner && h('button', { class: 'icon-btn', 'aria-label': 'ניהול המשפחה', onclick: onAdmin }, icon('people')),
        h('button', { class: 'icon-btn', 'aria-label': 'הגדרות', onclick: onSettings }, icon('gear')))),
    list);

  let conversations = [];
  let online = new Set();
  let currentKey = 'family';

  const preview = (row) => {
    if (!row?.last_at) return 'עדיין אין הודעות';
    const text = row.last_body || `📎 ${row.last_attachment || 'קובץ'}`;
    return row.last_sender === me.id ? `אני: ${text}` : text;
  };

  function item({ key, name, who, row, target }) {
    const face = h('div', { class: 'avatar-wrap' }, avatar(who), who.id !== 'family' && online.has(who.id) && h('span', { class: 'online-dot', title: 'מחובר/ת עכשיו' }));
    return h('button', { class: 'conv', 'aria-current': String(key === currentKey), onclick: () => { currentKey = key; render(); onOpen(target); } },
      face,
      h('div', { class: 'conv-text' },
        h('div', { class: 'conv-line' }, h('span', { class: 'conv-name' }, name), h('span', { class: 'conv-time' }, shortWhen(row?.last_at))),
        h('div', { class: 'conv-line' }, h('span', { class: 'conv-last' }, preview(row)), row?.unread > 0 && h('span', { class: 'badge' }, row.unread))));
  }

  function render() {
    const family = conversations.find((c) => c.kind === 'family');
    const rows = people.filter((p) => p.id !== me.id).map((person) => ({ person, row: conversations.find((c) => c.other_id === person.id) }));
    rows.sort((a, b) => (b.row?.last_at || '').localeCompare(a.row?.last_at || ''));
    replace(list,
      item({ key: 'family', name: config.familyRoomName, who: { id: 'family', name: '♥' }, row: family, target: { id: config.familyConversationId, kind: 'family', title: config.familyRoomName } }),
      rows.map(({ person, row }) => item({ key: person.id, name: person.name, who: person, row, target: { id: row?.id, kind: 'direct', person, title: person.name } })));
  }

  return {
    element,
    setConversations(next) { conversations = next; render(); },
    setOnline(next) { online = next; house.setLit(next.size); render(); },
  };
}
