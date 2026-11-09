// Entry point: decides which screen to show.
import { h, replace } from './core/dom.js';
import { loadBackend } from './adapters/backend.js';
import { deniedScreen, loginScreen, notReadyScreen } from './features/auth/screens.js';
import { createShell } from './features/chat/shell.js';
import { theme } from './features/ui/theme.js';

const root = document.getElementById('root');

async function start() {
  theme.init();
  replace(root, h('div', { class: 'loading' }, 'פותחים את הדלת…'));
  const backend = await loadBackend();
  if (!backend) return replace(root, notReadyScreen());
  const user = await backend.getUser();
  if (!user) return replace(root, loginScreen(backend));
  const me = await backend.bootstrap();
  if (!me) return replace(root, deniedScreen(backend, user.email));
  replace(root, await createShell({ backend, me }));
}

start().catch((error) => {
  console.error(error);
  replace(root, h('div', { class: 'loading' }, h('button', { class: 'btn btn-primary', onclick: () => location.reload() }, 'משהו השתבש. לנסות שוב')));
});
