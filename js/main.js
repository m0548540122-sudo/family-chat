// Entry point: decides which screen to show, behind the opening door.
import { h, replace } from './core/dom.js';
import { loadBackend } from './adapters/backend.js';
import { deniedScreen, loginScreen, notReadyScreen } from './features/auth/screens.js';
import { createShell } from './features/chat/shell.js';
import { createDoor } from './features/door/door.js';
import { theme } from './features/ui/theme.js';

const root = document.getElementById('root');

async function firstScreen() {
  const backend = await loadBackend();
  if (!backend) return notReadyScreen();
  const user = await backend.getUser();
  if (!user) return loginScreen(backend);
  const me = await backend.bootstrap();
  if (!me) return deniedScreen(backend, user.email);
  return createShell({ backend, me });
}

async function start() {
  theme.init();
  const door = createDoor();
  try {
    replace(root, await firstScreen());
    await door.open();
  } catch (error) {
    console.error(error);
    door.remove();
    replace(root, h('div', { class: 'loading' }, h('button', { class: 'btn btn-primary', onclick: () => location.reload() }, 'לא הצלחנו להיכנס. לנסות שוב')));
  }
}

start();
