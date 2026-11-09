// Joins the sidebar, the open thread, live updates and the sheets.
import { config } from '../../../config/app.js';
import { h } from '../../core/dom.js';
import { openAdmin } from '../admin/admin.js';
import { openSettings } from '../profile/settings.js';
import { createSidebar } from './sidebar.js';
import { createThread } from './thread.js';

export async function createShell({ backend, me }) {
  const people = await backend.listPeople();
  const root = h('div', { class: 'app', 'data-view': 'chat' });
  let refreshTimer;

  const refresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(showConversations, 150);
  };

  async function showConversations() {
    const rows = await backend.listConversations();
    sidebar.setConversations(rows);
    const unread = rows.reduce((sum, row) => sum + Number(row.unread || 0), 0);
    document.title = unread ? `(${unread}) ${config.appName}` : config.appName;
  }

  const sidebar = createSidebar({
    me, people,
    onOpen: (target) => { root.dataset.view = 'chat'; thread.open({ ...target }); },
    onSettings: () => openSettings({ backend, me, onNameChange: (name) => { me.name = name; } }),
    onAdmin: () => openAdmin(backend),
  });
  const thread = createThread({ backend, me, people, onBack: () => { root.dataset.view = 'list'; }, onActivity: refresh });

  root.append(sidebar.element, h('main', { class: 'main' }, thread.element));
  await showConversations();
  if (matchMedia('(max-width: 760px)').matches) root.dataset.view = 'list';
  await thread.open({ id: config.familyConversationId, kind: 'family', title: config.familyRoomName });

  backend.subscribeMessages((message) => { thread.receive(message); refresh(); });
  backend.joinPresence(me.id, (online) => sidebar.setOnline(online));
  backend.joinLive({ onTyping: thread.showTyping, onReaction: thread.reactionChanged });
  return root;
}
